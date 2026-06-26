import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL!;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY!;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export type User = {
  id: string;
  x_handle: string;
  x_avatar: string | null;
  stars: number;
  last_claim: string | null;
  created_at: string;
};

export type StarClaim = {
  id: string;
  user_id: string;
  claimed_at: string;
  stars: number;
  x_handle: string;
  x_avatar: string | null;
};

export type CompletedTask = {
  user_id: string;
  task_id: string;
  completed_at: string;
};

export type Referral = {
  id: string;
  referrer_id: string;
  referred_id: string;
  created_at: string;
};

export type WhitelistEntry = {
  id: string;
  user_id: string | null;
  x_username: string;
  x_handle: string | null;
  wallet: string;
  quote_link: string | null;
  comment_link: string | null;
  follow_done: boolean;
  like_quote_done: boolean;
  comment_done: boolean;
  status: "PENDING" | "APPROVED" | "GTD";
  stars_at_apply: number;
  created_at: string;
  updated_at: string;
};

// ── Auth helpers ──────────────────────────────────────────────────────────────

export async function signInWithX() {
  return supabase.auth.signInWithOAuth({
    provider: "x",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export async function getSession() {
  return supabase.auth.getSession();
}

// ── User helpers ──────────────────────────────────────────────────────────────

export async function upsertUser(authUser: {
  id: string;
  user_metadata: { user_name: string; avatar_url: string };
}): Promise<User | null> {
  const { data, error } = await supabase
    .from("users")
    .upsert(
      {
        id: authUser.id,
        x_handle: `@${authUser.user_metadata.user_name}`,
        x_avatar: authUser.user_metadata.avatar_url,
      },
      { onConflict: "id", ignoreDuplicates: false }
    )
    .select()
    .single();

  if (error) { console.error(error); return null; }
  return data;
}

export async function getUser(id: string): Promise<User | null> {
  const { data } = await supabase.from("users").select("*").eq("id", id).single();
  return data;
}

// ── Stars helpers ─────────────────────────────────────────────────────────────

export const CLAIM_STARS = 10;
export const CLAIM_INTERVAL_MS = 2 * 60 * 60 * 1000; // 2 hours — for UI countdown display only; the real cooldown is enforced inside claim_stars()

export async function claimStars(userId: string): Promise<{ ok: boolean; message: string }> {
  const { data, error } = await supabase.rpc("claim_stars", { p_user_id: userId });
  if (error) {
    console.error("claimStars failed:", error.message);
    return { ok: false, message: "Failed to claim stars" };
  }
  const row = Array.isArray(data) ? data[0] : data;
  return { ok: row?.ok ?? false, message: row?.message ?? "" };
}

export async function completeTask(
  userId: string,
  taskId: string,
  // Kept for compatibility with existing call sites — the star amount is
  // no longer trusted from the client. It's validated against a hardcoded
  // whitelist inside complete_task() instead, so this argument is ignored.
  _taskStars: number
): Promise<{ ok: boolean }> {
  const { data, error } = await supabase.rpc("complete_task", {
    p_user_id: userId,
    p_task_id: taskId,
  });
  if (error) {
    console.error("completeTask failed:", error.message);
    return { ok: false };
  }
  const row = Array.isArray(data) ? data[0] : data;
  return { ok: row?.ok ?? false };
}

export async function getCompletedTasks(userId: string): Promise<string[]> {
  const { data } = await supabase
    .from("tasks_completed")
    .select("task_id")
    .eq("user_id", userId);
  return (data ?? []).map((r) => r.task_id);
}

// ── Leaderboard ───────────────────────────────────────────────────────────────

export async function getLeaderboard(): Promise<User[]> {
  const { data } = await supabase
    .from("users")
    .select("*")
    .order("stars", { ascending: false })
    .limit(50);
  return data ?? [];
}

// ── Referrals ─────────────────────────────────────────────────────────────────

export const REFERRAL_STARS = 20;

export async function getUserByHandle(handle: string): Promise<User | null> {
  const normalized = handle.startsWith("@") ? handle : `@${handle}`;
  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("x_handle", normalized)
    .maybeSingle();
  return data;
}

export async function getReferralCount(userId: string): Promise<number> {
  const { count } = await supabase
    .from("referrals")
    .select("*", { count: "exact", head: true })
    .eq("referrer_id", userId);
  return count ?? 0;
}

/**
 * Credits a referrer with REFERRAL_STARS the first time the person they
 * referred signs up. The actual insert + star update happens inside the
 * apply_referral() Postgres function (SECURITY DEFINER), because crediting
 * another user's row can't be done safely from the client under RLS.
 * Safe to call more than once for the same new user — the unique
 * constraint on referred_id means only the first call can ever take effect.
 */
export async function applyReferral(newUserId: string, refCode: string): Promise<void> {
  if (!refCode) return;
  const { error } = await supabase.rpc("apply_referral", {
    p_new_user_id: newUserId,
    p_ref_code: refCode,
  });
  if (error) console.error("applyReferral failed:", error.message);
}

// ── Live feed ─────────────────────────────────────────────────────────────────

export async function getRecentClaims(): Promise<StarClaim[]> {
  const { data } = await supabase
    .from("star_claims")
    .select("*")
    .order("claimed_at", { ascending: false })
    .limit(10);
  return data ?? [];
}

export function subscribeToLiveFeed(callback: (claim: StarClaim) => void) {
  return supabase
    .channel("live-claims")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "star_claims" },
      (payload) => callback(payload.new as StarClaim)
    )
    .subscribe();
}

// ── Whitelist helpers ─────────────────────────────────────────────────────────

export async function applyWhitelist(data: {
  x_username: string;
  wallet: string;
  quote_link?: string;
  comment_link?: string;
  follow_done?: boolean;
  like_quote_done?: boolean;
  comment_done?: boolean;
  stars_at_apply?: number;
}): Promise<{ ok: boolean; data?: WhitelistEntry }> {
  const { data: result, error } = await supabase
    .from("aurelia_whitelist")
    .insert({
      x_username: data.x_username.replace(/^@/, ""),
      wallet: data.wallet.trim().toLowerCase(),
      quote_link: data.quote_link?.trim() || null,
      comment_link: data.comment_link?.trim() || null,
      follow_done: data.follow_done ?? false,
      like_quote_done: data.like_quote_done ?? false,
      comment_done: data.comment_done ?? false,
      stars_at_apply: data.stars_at_apply ?? 0,
    })
    .select()
    .single();

  if (error) {
    console.error("applyWhitelist failed:", error.message);
    throw error;
  }
  return { ok: true, data: result };
}

export async function getWhitelistStatus(xHandle: string): Promise<Pick<WhitelistEntry, "status" | "created_at" | "stars_at_apply"> | null> {
  const { data, error } = await supabase
    .from("aurelia_whitelist")
    .select("status,created_at,stars_at_apply")
    .eq("x_username", xHandle.replace(/^@/, ""))
    .maybeSingle();

  if (error) {
    console.error("getWhitelistStatus failed:", error.message);
    throw error;
  }
  return data;
}

export async function linkWhitelistToUser(xHandle: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from("aurelia_whitelist")
    .update({ user_id: userId })
    .eq("x_username", xHandle.replace(/^@/, ""));

  if (error) console.error("linkWhitelistToUser failed:", error.message);
}
