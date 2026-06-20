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
export const CLAIM_INTERVAL_MS = 2 * 60 * 60 * 1000; // 2 hours

export async function claimStars(userId: string): Promise<{ ok: boolean; message: string }> {
  const user = await getUser(userId);
  if (!user) return { ok: false, message: "User not found" };

  const lastClaim = user.last_claim ? new Date(user.last_claim).getTime() : 0;
  const now = Date.now();
  if (now - lastClaim < CLAIM_INTERVAL_MS) {
    const remaining = CLAIM_INTERVAL_MS - (now - lastClaim);
    const h = Math.floor(remaining / 3600000);
    const m = Math.floor((remaining % 3600000) / 60000);
    return { ok: false, message: `Next claim available in ${h}h ${m}m` };
  }

  const { error: claimErr } = await supabase.from("star_claims").insert({
    user_id: userId,
    stars: CLAIM_STARS,
    x_handle: user.x_handle,
    x_avatar: user.x_avatar,
    claimed_at: new Date().toISOString(),
  });
  if (claimErr) return { ok: false, message: "Failed to record claim" };

  const { error: updateErr } = await supabase
    .from("users")
    .update({ stars: user.stars + CLAIM_STARS, last_claim: new Date().toISOString() })
    .eq("id", userId);
  if (updateErr) return { ok: false, message: "Failed to update stars" };

  return { ok: true, message: `+${CLAIM_STARS} stars claimed!` };
}

export async function completeTask(
  userId: string,
  taskId: string,
  taskStars: number
): Promise<{ ok: boolean }> {
  const { error: insertErr } = await supabase
    .from("tasks_completed")
    .insert({ user_id: userId, task_id: taskId });
  if (insertErr) return { ok: false };

  const user = await getUser(userId);
  if (!user) return { ok: false };

  await supabase
    .from("users")
    .update({ stars: user.stars + taskStars })
    .eq("id", userId);

  return { ok: true };
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

