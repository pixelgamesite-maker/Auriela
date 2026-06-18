import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { MainLayout } from "@/layouts/main-layout";
import { useAuth } from "@/hooks/useAuth";
import {
  claimStars,
  completeTask,
  getRecentClaims,
  subscribeToLiveFeed,
  CLAIM_INTERVAL_MS,
  type StarClaim,
} from "@/lib/supabase";
import { ASSETS } from "@/lib/assets";

// ── Task definitions ───────────────────────────────────────────────────────────
const SOCIAL_TASKS = [
  { id: "follow_x",     label: "Follow on X",           stars: 10, href: "https://x.com/Aureliastudios_",       icon: "x"       },
  { id: "join_discord", label: "Join Discord",          stars: 15, href: "https://discord.gg/vnDWxZCzy",        icon: "discord" },
  { id: "join_telegram", label: "Join Telegram Channel", stars: 10, href: "https://t.me/aureliastudios",          icon: "telegram" },
];

const INTERACTIVE_TASKS = [
  { id: "visit_website", label: "Visit Website",    stars: 10, href: "https://aurelia.studio", icon: "globe" },
  { id: "read_lore",     label: "Read the Lore",    stars: 15, href: "/lore",    internal: true, icon: "book"  },
  { id: "connect_wallet", label: "Connect Wallet",   stars: 20, href: "/connect", internal: true, icon: "wallet" },
];

// ── Helpers ────────────────────────────────────────────────────────────────────
function fmt(ms: number) {
  if (ms <= 0) return "00:00:00";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60000)   return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  return `${Math.floor(diff / 3600000)}h ago`;
}

// ── Icons ──────────────────────────────────────────────────────────────────────
function Sparkle({ size = 14, color = ASSETS.colors.gold }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={{ flexShrink: 0, display: "inline-block" }}>
      <path d="M12 2 L13.2 10.8 L22 12 L13.2 13.2 L12 22 L10.8 13.2 L2 12 L10.8 10.8 Z" />
    </svg>
  );
}

function TaskIcon({ name }: { name: string }) {
  if (name === "x") return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.259 5.63L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
    </svg>
  );
  if (name === "discord") return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.003.028.015.056.036.074a19.9 19.9 0 0 0 5.993 3.03.077.077 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
    </svg>
  );
  if (name === "telegram") return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
    </svg>
  );
  if (name === "globe") return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="10"/>
      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  );
  if (name === "book") return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    </svg>
  );
  if (name === "wallet") return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/>
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/>
      <path d="M18 12a2 2 0 0 0 0 4h4v-4h-4z"/>
    </svg>
  );
  return null;
}

// ── Avatar ─────────────────────────────────────────────────────────────────────
function Avatar({ src, handle, size = 34 }: { src?: string | null; handle: string; size?: number }) {
  const palette = ["#2a1f3d", "#1a2d2a", "#2d1a1f", "#1a1f2d", "#2d2a1a"];
  const color = palette[(handle.charCodeAt(1) || 0) % palette.length];
  if (src) {
    return (
      <img src={src} alt={handle} style={{
        width: size, height: size, borderRadius: "50%",
        border: `1px solid ${ASSETS.colors.goldBorder}`,
        objectFit: "cover", flexShrink: 0,
      }} />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: color, border: `1px solid ${ASSETS.colors.goldBorder}`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.38, fontWeight: 700, color: ASSETS.colors.gold,
      fontFamily: "system-ui", flexShrink: 0,
    }}>
      {handle?.[1]?.toUpperCase() || "?"}
    </div>
  );
}

// ── Gated landing (logged out) ─────────────────────────────────────────────────
function GatedLanding({ onSignIn }: { onSignIn: () => void }) {
  return (
    <div style={{
      minHeight: "100dvh",
      background: "#fff",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 24px",
      position: "relative",
      overflow: "hidden",
    }}>
      {([[12,8],[88,12],[6,80],[92,75],[50,5],[20,50],[78,45]] as [number,number][]).map(([t,l], i) => (
        <span key={i} style={{
          position: "absolute", top: `${t}%`, left: `${l}%`,
          color: ASSETS.colors.gold, opacity: 0.12,
          fontSize: i % 2 === 0 ? 10 : 16, pointerEvents: "none",
          animation: `twinkle ${2.8 + i * 0.4}s ease-in-out infinite`,
        }}>✦</span>
      ))}

      <div style={{
        position: "relative", zIndex: 2,
        display: "flex", flexDirection: "column",
        alignItems: "center", textAlign: "center",
        maxWidth: 440,
      }}>
        <img
          src={ASSETS.images.logo}
          alt={ASSETS.brand.name}
          style={{ height: 80, marginBottom: 52, display: "block" }}
          onError={(e) => {
            e.currentTarget.style.display = "none";
            const fb = document.getElementById("gate-brand-fallback");
            if (fb) fb.style.display = "block";
          }}
        />
        <div id="gate-brand-fallback" style={{
          display: "none",
          fontFamily: "'Playfair Display', serif",
          fontSize: 36, letterSpacing: 8, fontWeight: 700, color: "#111", marginBottom: 52,
        }}>
          {ASSETS.brand.name}
        </div>

        <button
          onClick={onSignIn}
          style={{
            display: "flex", alignItems: "center", gap: 10,
            background: "#111", color: "#fff",
            border: "none", borderRadius: 100,
            padding: "14px 32px", fontSize: 14,
            cursor: "pointer", fontFamily: "system-ui",
            letterSpacing: 0.4, fontWeight: 500,
            boxShadow: "0 2px 20px rgba(0,0,0,0.12)",
            transition: "transform 0.15s, box-shadow 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-1px)";
            e.currentTarget.style.boxShadow = "0 4px 24px rgba(0,0,0,0.18)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "none";
            e.currentTarget.style.boxShadow = "0 2px 20px rgba(0,0,0,0.12)";
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.259 5.63L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
          </svg>
          Sign in with X
        </button>

        <p style={{
          marginTop: 20, fontSize: 11, color: "#bbb",
          fontFamily: "system-ui", letterSpacing: 0.4,
        }}>
          ✦ {ASSETS.brand.priorityNote} ✦
        </p>
      </div>

      <style>{`
        @keyframes twinkle { 0%,100%{opacity:.12} 50%{opacity:.3} }
      `}</style>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function Home() {
  const { user, loading, completedTasks, setCompletedTasks, refreshUser, signInWithTwitter } = useAuth();
  const [, navigate] = useLocation();

  const [countdown,   setCountdown]   = useState(0);
  const [canClaim,    setCanClaim]    = useState(false);
  const [claiming,    setClaiming]    = useState(false);
  const [claimMsg,    setClaimMsg]    = useState("");
  const [feed,        setFeed]        = useState<StarClaim[]>([]);
  const [taskLoading, setTaskLoading] = useState<string | null>(null);

  useEffect(() => {
    const tick = () => {
      if (!user?.last_claim) { setCanClaim(true); setCountdown(0); return; }
      const next      = new Date(user.last_claim).getTime() + CLAIM_INTERVAL_MS;
      const remaining = next - Date.now();
      setCountdown(Math.max(0, remaining));
      setCanClaim(remaining <= 0);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [user?.last_claim]);

  useEffect(() => {
    getRecentClaims().then(setFeed);
    const channel = subscribeToLiveFeed((claim) => {
      setFeed((prev) => [claim, ...prev.slice(0, 9)]);
    });
    return () => { channel.unsubscribe(); };
  }, []);

  if (loading) return null;

  if (!user) {
    return (
      <div style={{ fontFamily: "'Cormorant Garamond', 'Playfair Display', Georgia, serif" }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Cormorant+Garamond:wght@300;400;600&display=swap');`}</style>
        <GatedLanding onSignIn={signInWithTwitter} />
      </div>
    );
  }

  const handleClaim = async () => {
    if (!canClaim || claiming) return;
    setClaiming(true);
    const result = await claimStars(user.id);
    setClaimMsg(result.message);
    if (result.ok) await refreshUser();
    setTimeout(() => setClaimMsg(""), 3000);
    setClaiming(false);
  };

  const handleTask = async (taskId: string, stars: number, href: string | null, internal?: boolean) => {
    if (completedTasks.includes(taskId)) return;
    setTaskLoading(taskId);

    if (href) {
      if (internal) {
        const { ok } = await completeTask(user.id, taskId, stars);
        if (ok) {
          setCompletedTasks([...completedTasks, taskId]);
          await refreshUser();
        }
        setTaskLoading(null);
        navigate(href);
        return;
      } else {
        window.open(href, "_blank");
      }
    }

    const { ok } = await completeTask(user.id, taskId, stars);
    if (ok) {
      setCompletedTasks([...completedTasks, taskId]);
      await refreshUser();
    }
    setTaskLoading(null);
  };

  return (
    <MainLayout>
      <style>{`
        @keyframes fadeUp  { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:.35} }
        @keyframes twinkle { 0%,100%{opacity:.2} 50%{opacity:.6} }

        .task-row { transition: background 0.15s; border-radius: 6px; cursor: pointer; }
        .task-row:hover { background: rgba(201,168,76,0.05) !important; }
        .task-row-done { opacity: 0.4; cursor: default; }

        .claim-btn { transition: all 0.2s ease; }
        .claim-btn:hover:not(:disabled) { background: #222 !important; }
        .claim-btn:active:not(:disabled) { transform: scale(0.97); }

        @media (min-width: 769px) {
          .hero-wrap {
            min-height: calc(100vh - 68px);
            display: flex;
            align-items: flex-start;
          }
          .hero-content {
            width: 52%;
            padding: clamp(40px,4vw,64px) clamp(40px,5vw,80px) 56px;
          }
          .hero-character {
            position: absolute;
            right: 0; top: 0;
            height: 100%; width: 52%;
            object-fit: contain;
            object-position: right center;
          }
        }

        @media (max-width: 768px) {
          .hero-wrap { min-height: auto; display: block; }
          .hero-content { width: 100%; padding: 24px 20px 40px; }
          .hero-character {
            position: absolute;
            right: -8px; top: -10px;
            height: 46%; width: 58%;
            object-fit: contain;
            object-position: right top;
            opacity: 0.88;
          }
          .cta-row { flex-direction: column; }
        }
      `}</style>

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="hero-wrap" style={{
        position: "relative",
        overflow: "hidden",
        background: ASSETS.colors.bg,
      }}>
        <img
          className="hero-character"
          src={ASSETS.images.character}
          alt="Aurelia"
          style={{ pointerEvents: "none", userSelect: "none", zIndex: 1 }}
          onError={(e) => { e.currentTarget.style.display = "none"; }}
        />

        {([[8,5],[14,55],[22,82],[68,8],[76,68],[88,30],[50,90],[38,5]] as [number,number][]).map(([t,l], i) => (
          <span key={i} style={{
            position: "absolute", top: `${t}%`, left: `${l}%`,
            color: ASSETS.colors.gold, opacity: 0.25,
            fontSize: i % 2 === 0 ? 8 : 14, pointerEvents: "none",
            animation: `twinkle ${2.4 + i * 0.3}s ease-in-out infinite`,
            zIndex: 2,
          }}>✦</span>
        ))}

        <div className="hero-content" style={{ position: "relative", zIndex: 3 }}>
          {/* Big serif AURELIA wordmark */}
          <div style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "clamp(44px, 7vw, 72px)",
            letterSpacing: 4,
            fontWeight: 700,
            color: "#111",
            lineHeight: 1,
            marginBottom: 4,
          }}>
            {ASSETS.brand.name}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 18 }}>
            <div style={{ height: 1, width: 20, background: "#d8d7d2" }} />
            <Sparkle size={6} color="#c0bfb8" />
            <Sparkle size={8} color="#c0bfb8" />
            <Sparkle size={6} color="#c0bfb8" />
            <div style={{ height: 1, width: 20, background: "#d8d7d2" }} />
          </div>

          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "clamp(36px, 5vw, 58px)",
            fontWeight: 700, lineHeight: 1.08,
            color: ASSETS.colors.ink, margin: "0 0 10px",
            letterSpacing: "-0.02em",
          }}>
            Secure<br />Your Spot
          </h1>

          <p style={{
            fontFamily: "system-ui, -apple-system, sans-serif",
            fontSize: 13, color: ASSETS.colors.muted,
            marginBottom: 22, letterSpacing: 0.15, lineHeight: 1.55,
            maxWidth: 300,
          }}>
            Complete tasks and claim stars every 5 hours.
          </p>

          {/* Stacked full-width CTAs */}
          <div
            className="cta-row"
            style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 10, maxWidth: 380 }}
          >
            <button
              className="claim-btn"
              onClick={handleClaim}
              disabled={!canClaim}
              style={{
                width: "100%",
                background: ASSETS.colors.ink, color: "#fff",
                border: "none", borderRadius: 10,
                padding: "14px 20px", fontSize: 14,
                cursor: !canClaim ? "not-allowed" : "pointer",
                fontFamily: "system-ui", letterSpacing: 0.5, fontWeight: 500,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                opacity: !canClaim ? 0.45 : 1,
              }}
            >
              <Sparkle size={12} color="#fff" />
              {claiming ? "Claiming…" : "Claim Stars"}
            </button>

            <button
              onClick={() => navigate("/social")}
              style={{
                width: "100%",
                background: "transparent", color: ASSETS.colors.ink,
                border: `1.5px solid ${ASSETS.colors.ink}`, borderRadius: 10,
                padding: "13px 20px", fontSize: 14, cursor: "pointer",
                fontFamily: "system-ui", letterSpacing: 0.5, fontWeight: 500,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                transition: "background 0.2s",
              }}
            >
              <Sparkle size={12} color={ASSETS.colors.ink} />
              Claim More Stars
            </button>
          </div>

          {claimMsg && (
            <p style={{
              fontSize: 12, color: ASSETS.colors.gold, marginBottom: 6,
              animation: "fadeUp 0.3s ease", fontFamily: "system-ui",
            }}>
              {claimMsg}
            </p>
          )}

          <p style={{
            fontSize: 11, color: "#bbb", letterSpacing: 0.4,
            marginBottom: 28, fontFamily: "system-ui",
          }}>
            ✦ The more stars you collect, the higher your priority. ✦
          </p>

          {/* ── STARS CARD (always visible, above tasks) ───────────────────── */}
          <div style={{
            background: ASSETS.colors.surface,
            border: `1px solid ${ASSETS.colors.border}`,
            borderRadius: 18,
            padding: "20px 24px",
            textAlign: "center",
            marginBottom: 16,
            boxShadow: "0 1px 16px rgba(0,0,0,0.03)",
          }}>
            <div style={{ fontSize: 10, letterSpacing: 3, color: "#bbb", fontFamily: "system-ui", fontWeight: 600, marginBottom: 6 }}>
              YOUR STARS
            </div>
            <div style={{ height: 1, width: 28, background: ASSETS.colors.goldBorder, margin: "0 auto 10px" }} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <span style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 44, fontWeight: 700, color: ASSETS.colors.ink,
                lineHeight: 1, fontVariantNumeric: "tabular-nums",
              }}>
                {user.stars ?? 0}
              </span>
              <Sparkle size={16} color={ASSETS.colors.gold} />
            </div>
          </div>

          {/* ── TASK LIST ─────────────────────────────────────────────────── */}
          <div style={{
            background: ASSETS.colors.surface,
            border: `1px solid ${ASSETS.colors.border}`,
            borderRadius: 18,
            overflow: "hidden",
            boxShadow: "0 1px 16px rgba(0,0,0,0.03)",
          }}>
            <div style={{ padding: "16px 20px 12px" }}>
              <SectionHead label="SOCIAL TASKS" />
              {SOCIAL_TASKS.map((t) => (
                <TaskRow
                  key={t.id} task={t}
                  done={completedTasks.includes(t.id)}
                  loading={taskLoading === t.id}
                  onTask={handleTask}
                />
              ))}
            </div>

            <div style={{ height: 1, background: ASSETS.colors.border, margin: "0 20px" }} />

            <div style={{ padding: "16px 20px 12px" }}>
              <SectionHead label="INTERACTIVE TASKS" />
              {INTERACTIVE_TASKS.map((t) => (
                <TaskRow
                  key={t.id} task={t}
                  done={completedTasks.includes(t.id)}
                  loading={taskLoading === t.id}
                  onTask={handleTask}
                />
              ))}
            </div>

            {/* Footer countdown */}
            <div style={{
              borderTop: `1px solid ${ASSETS.colors.border}`,
              padding: "12px 18px",
              display: "flex", alignItems: "center", justifyContent: "center",
              gap: 8, fontSize: 12, color: "#999", fontFamily: "system-ui",
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="1.8">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              {canClaim
                ? <span style={{ color: ASSETS.colors.gold, fontWeight: 600 }}>Ready to claim!</span>
                : (
                  <span>
                    Next claim available in{" "}
                    <strong style={{ color: ASSETS.colors.ink, letterSpacing: 0.5, fontWeight: 600 }}>
                      {fmt(countdown)}
                    </strong>
                  </span>
                )}
            </div>
          </div>
        </div>
      </section>

      {/* ── LIVE FEED ─────────────────────────────────────────────────────── */}
      <section style={{
        padding: "56px clamp(20px, 8vw, 100px)",
        background: ASSETS.colors.surface,
        borderTop: `1px solid ${ASSETS.colors.border}`,
      }}>
        <div style={{ maxWidth: 520, margin: "0 auto" }}>
          <div style={{ fontSize: 10, letterSpacing: 3, color: ASSETS.colors.gold, marginBottom: 10, fontFamily: "system-ui", fontWeight: 600 }}>
            LIVE
          </div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, color: "#111", marginBottom: 6, fontWeight: 700 }}>
            Star Activity
          </h2>
          <p style={{ fontSize: 13, color: "#999", marginBottom: 22, fontFamily: "system-ui" }}>
            Real-time star claims from the community
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {feed.length === 0
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} style={{
                    height: 52, background: ASSETS.colors.bg,
                    borderRadius: 10, animation: "pulse 1.5s infinite",
                  }} />
                ))
              : feed.map((item, i) => (
                  <div key={item.id} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "10px 14px",
                    background: i === 0 ? ASSETS.colors.goldLight : ASSETS.colors.bg,
                    borderRadius: 10,
                    border: i === 0 ? `1px solid ${ASSETS.colors.goldBorder}` : "1px solid transparent",
                    animation: i === 0 ? "fadeUp 0.4s ease" : "none",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Avatar src={item.x_avatar} handle={item.x_handle} size={32} />
                      <div style={{ fontFamily: "system-ui" }}>
                        <span style={{ fontWeight: 600, fontSize: 13, color: "#111" }}>{item.x_handle}</span>
                        <span style={{ fontSize: 12, color: "#888", marginLeft: 6 }}>claimed</span>
                        <span style={{ color: ASSETS.colors.gold, fontWeight: 700, fontSize: 13, marginLeft: 5 }}>
                          +{item.stars} ✦
                        </span>
                      </div>
                    </div>
                    <span style={{ fontSize: 11, color: "#bbb", fontFamily: "system-ui" }}>
                      {timeAgo(item.claimed_at)}
                    </span>
                  </div>
                ))}
          </div>
        </div>
      </section>
    </MainLayout>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────
function SectionHead({ label }: { label: string }) {
  return (
    <div style={{
      fontSize: 10, letterSpacing: 2.5, color: "#bbb",
      fontFamily: "system-ui", fontWeight: 600,
      marginBottom: 10,
      display: "flex", alignItems: "center", gap: 6,
    }}>
      <svg width="9" height="9" viewBox="0 0 24 24" fill={ASSETS.colors.gold}>
        <path d="M12 2 L13.2 10.8 L22 12 L13.2 13.2 L12 22 L10.8 13.2 L2 12 L10.8 10.8 Z" />
      </svg>
      {label}
    </div>
  );
}

function TaskRow({
  task, done, loading, onTask,
}: {
  task: { id: string; label: string; stars: number; href: string | null; icon: string; internal?: boolean };
  done: boolean;
  loading: boolean;
  onTask: (id: string, stars: number, href: string | null, internal?: boolean) => void;
}) {
  return (
    <div
      className={`task-row${done ? " task-row-done" : ""}`}
      onClick={() => !done && onTask(task.id, task.stars, task.href, task.internal)}
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 6px",
        borderBottom: "1px solid #f5f5f3",
      }}
    >
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        fontSize: 13, fontFamily: "system-ui", color: "#222", minWidth: 0,
      }}>
        <span style={{ width: 20, height: 20, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#555" }}>
          <TaskIcon name={task.icon} />
        </span>
        <span style={{ textDecoration: done ? "line-through" : "none", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {task.label}
        </span>
      </div>

      <div style={{
        display: "flex", alignItems: "center", gap: 5, flexShrink: 0, marginLeft: 8,
        fontSize: 13, fontWeight: 600, whiteSpace: "nowrap",
        color: done ? ASSETS.colors.gold : "#555",
        fontFamily: "system-ui",
      }}>
        {loading
          ? <span style={{ animation: "pulse 1s infinite" }}>…</span>
          : done ? "✓" : `+ ${task.stars}`}
        <svg width="10" height="10" viewBox="0 0 24 24" fill={done ? ASSETS.colors.gold : "#d0d0d0"}>
          <path d="M12 2 L13.2 10.8 L22 12 L13.2 13.2 L12 22 L10.8 13.2 L2 12 L10.8 10.8 Z" />
        </svg>
      </div>
    </div>
  );
}
