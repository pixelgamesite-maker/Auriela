import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { supabase, applyReferral } from "@/lib/supabase";

const REFERRAL_STORAGE_KEY = "aurelia_ref";

async function upsertUser(session: { user: any }): Promise<{ ok: boolean; isNewUser: boolean }> {
  const u    = session.user;
  const meta = u.user_metadata || {};

  // Twitter/X provides these fields in user_metadata
  const x_handle   = meta.preferred_username || meta.user_name || meta.screen_name || null;
  const x_avatar   = meta.avatar_url || meta.profile_image_url || null;

  if (!x_handle) {
    console.error("No Twitter handle found in metadata", meta);
    return { ok: false, isNewUser: false };
  }

  // Check whether this user already exists *before* upserting, so we know
  // whether to apply a pending referral once the upsert below succeeds.
  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("id", u.id)
    .maybeSingle();
  const isNewUser = !existing;

  const { error } = await supabase.from("users").upsert(
    {
      id:       u.id,
      x_handle: `@${x_handle}`,
      x_avatar,
      // stars and last_claim use DB defaults on first insert;
      // ignoreDuplicates:false means we refresh avatar on re-login
    },
    { onConflict: "id", ignoreDuplicates: false }
  );

  if (error) {
    console.error("User upsert failed:", error.message);
    return { ok: false, isNewUser: false };
  }

  return { ok: true, isNewUser };
}

export default function AuthCallback() {
  const [, navigate]       = useLocation();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let handled = false;

    const processAuth = async (session: any) => {
      if (handled || !session) return;
      handled = true;

      const { ok, isNewUser } = await upsertUser(session);
      if (!ok) {
        setFailed(true);
        return;
      }

      if (isNewUser) {
        const refCode = localStorage.getItem(REFERRAL_STORAGE_KEY);
        if (refCode) {
          await applyReferral(session.user.id, refCode);
          localStorage.removeItem(REFERRAL_STORAGE_KEY);
        }
      }

      navigate("/");
    };

    // Primary: listen for the SIGNED_IN event fired after OAuth redirect
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session) {
          await processAuth(session);
        }
      }
    );

    // Fallback: session may already exist if the page re-mounted
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) processAuth(data.session);
    });

    // Safety net — if nothing fires in 15s, show error
    const timeout = setTimeout(() => {
      if (!handled) setFailed(true);
    }, 15000);

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [navigate]);

  if (failed) {
    return (
      <div style={{
        minHeight: "100dvh",
        background: "#0a0a0f",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 20,
        fontFamily: "system-ui",
      }}>
        <p style={{ color: "#ef4444", fontSize: 13, letterSpacing: "0.1em" }}>
          Sign-in failed
        </p>
        <button
          onClick={() => navigate("/")}
          style={{
            background: "transparent",
            border: "1px solid #333",
            color: "#aaa",
            padding: "8px 24px",
            fontSize: 12,
            cursor: "pointer",
            borderRadius: 4,
          }}
        >
          Go back
        </button>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100dvh",
      background: "#0a0a0f",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "system-ui",
      gap: 16,
    }}>
      <div style={{ fontSize: 32, animation: "spin 2s linear infinite" }}>✦</div>
      <p style={{ color: "#555", fontSize: 13, letterSpacing: "0.15em" }}>
        Signing you in…
      </p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
