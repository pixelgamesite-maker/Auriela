import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { MainLayout } from "@/layouts/main-layout";
import { useAuth } from "@/hooks/useAuth";
import {
  claimStars,
  completeTask,
  getRecentClaims,
  subscribeToLiveFeed,
  getWhitelistStatus,
  CLAIM_INTERVAL_MS,
  type StarClaim,
} from "@/lib/supabase";
import { ASSETS } from "@/lib/assets";
import { GatedLanding } from "@/components/GatedLanding";

// ── Task definitions ───────────────────────────────────────────────────────────
const SOCIAL_TASKS = [
  { id: "follow_x",      label: "Follow on X",           stars: 10, href: "https://x.com/Aureliastudios_",                                                   icon: "x"       },
  { id: "join_discord",  label: "Join Discord",           stars: 15, href: "https://discord.gg/vnDWxZCzy",                                                    icon: "discord" },
];

const INTERACTIVE_TASKS = [
  { id: "read_lore",     label: "Read the Lore",  stars: 15, href: "/lore",   internal: true,                                                                 icon: "book"    },
  { id: "claim_more",    label: "Claim More Stars", stars: 10, href: "/social", internal: true,                                                               icon: "stars"   },
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
function Sparkle({ size = 14, color = "var(--gold)" }: { size?: number; color?: string }) {
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
  if (name === "book") return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    </svg>
  );
  if (name === "stars") return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" opacity="0.7">
      <path d="M12 2 L13.2 10.8 L22 12 L13.2 13.2 L12 22 L10.8 13.2 L2 12 L10.8 10.8 Z" />
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
        border: `1px solid var(--gold-border)`,
        objectFit: "cover", flexShrink: 0,
      }} />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: color, border: `1px solid var(--gold-border)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.38, fontWeight: 700, color: "var(--gold)",
      fontFamily: "system-ui", flexShrink: 0,
    }}>
      {handle?.[1]?.toUpperCase() || "?"}
    </div>
  );
}


export default function Home() {
  const { user, loading, completedTasks, setCompletedTasks, refreshUser, signInWithTwitter } = useAuth();
  const [, navigate] = useLocation();

  const [countdown,   setCountdown]   = useState(0);
  const [canClaim,    setCanClaim]    = useState(false);
  const [claiming,    setClaiming]    = useState(false);
  const [claimMsg,    setClaimMsg]    = useState("");
  const [feed,        setFeed]        = useState<StarClaim[]>([]);
  const [taskLoading, setTaskLoading] = useState<string | null>(null);


  const [wlStatus, setWlStatus] = useState<string | null>(null);

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

  useEffect(() => {
    if (!user?.x_handle) return;
    getWhitelistStatus(user.x_handle).then((data) => {
      if (data) setWlStatus(data.status);
    });
  }, [user?.x_handle]);

  if (loading) return null;

  if (!user) {
    return <GatedLanding onSignIn={signInWithTwitter} />;
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
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,700;1,400&display=swap');

        @keyframes fadeUp  { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:.35} }
        @keyframes twinkle { 0%,100%{opacity:.2} 50%{opacity:.6} }

        .task-row { transition: background 0.15s; border-radius: 6px; cursor: pointer; }
        .task-row:hover { background: var(--gold-glow) !important; }
        .task-row-done { opacity: 0.4; cursor: default; }

        .claim-btn { transition: all 0.2s ease; }
        .claim-btn:hover:not(:disabled) { background: #222 !important; }
        .claim-btn:active:not(:disabled) { transform: scale(0.97); }
        .outline-btn:hover { background: rgba(128,128,128,0.06) !important; }

        /* ── Desktop ── */
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

        /* ── Mobile ── */
        @media (max-width: 768px) {
          .hero-wrap { min-height: auto; display: block; position: relative; overflow: hidden; }
          .hero-content { width: 100%; padding: 32px 22px 24px; }
          .hero-character {
            position: absolute;
            right: 0; top: 0;
            height: 100%; width: 55%;
            object-fit: cover;
            object-position: right top;
            opacity: 1;
            pointer-events: none;
            z-index: 1;
          }
        }
      `}</style>

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section style={{
        background: "var(--bg)",
        paddingBottom: 0,
      }}>
        {/* Top block: text left, character right */}
        <div className="hero-wrap" style={{
          position: "relative",
          overflow: "hidden",
          background: "var(--bg)",
          minHeight: 380,
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
            color: "var(--gold)", opacity: 0.2,
            fontSize: i % 2 === 0 ? 8 : 14, pointerEvents: "none",
            animation: `twinkle ${2.4 + i * 0.3}s ease-in-out infinite`,
            zIndex: 2,
          }}>✦</span>
        ))}

        <div className="hero-content" style={{ position: "relative", zIndex: 3 }}>

          {/* Logo removed from hero — only brand fallback stays hidden */}
          <div id="hero-brand-fallback" style={{ display: "none" }}>
            {ASSETS.brand.name}
          </div>

          {/* Decorative rule */}
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 20 }}>
            <div style={{ height: 1, width: 16, background: "var(--border)" }} />
            <Sparkle size={5} color="var(--text-muted)" />
            <Sparkle size={7} color="var(--text-muted)" />
            <Sparkle size={5} color="var(--text-muted)" />
            <div style={{ height: 1, width: 16, background: "var(--border)" }} />
          </div>

          {/* Heading */}
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "clamp(24px, 4vw, 38px)",
            fontWeight: 700,
            lineHeight: 1.15,
            color: "var(--text-main)",
            margin: "0 0 8px",
            letterSpacing: "-0.01em",
          }}>
            Secure Your Spot
          </h1>

          {/* Subtitle */}
          <p style={{
            fontFamily: "system-ui, -apple-system, sans-serif",
            fontSize: 12,
            color: "var(--text-muted)",
            marginBottom: 20,
            lineHeight: 1.6,
            maxWidth: 200,
            textAlign: "left",
          }}>
            Complete tasks and claim stars<br />every 5 hours.
          </p>

          {/* Buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14, width: "100%", maxWidth: 170 }}>
            <button
              className="claim-btn"
              onClick={handleClaim}
              disabled={!canClaim}
              style={{
                background: "var(--text-main)", color: "var(--bg)",
                border: "none", borderRadius: 100,
                padding: "10px 16px", fontSize: 12,
                cursor: !canClaim ? "not-allowed" : "pointer",
                fontFamily: "system-ui", letterSpacing: 0.4, fontWeight: 500,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                opacity: !canClaim ? 0.45 : 1,
                width: "100%",
              }}
            >
              <Sparkle size={9} color="var(--bg)" />
              {claiming ? "Claiming…" : "Claim Stars"}
            </button>

            <button
              className="outline-btn"
              onClick={() => navigate("/social")}
              style={{
                background: "var(--bg)", color: "var(--text-main)",
                border: "1.5px solid var(--text-main)", borderRadius: 100,
                padding: "9px 16px", fontSize: 12, cursor: "pointer",
                fontFamily: "system-ui", letterSpacing: 0.4, fontWeight: 500,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                width: "100%",
                transition: "background 0.2s",
              }}
            >
              <Sparkle size={9} color="var(--text-main)" />
              Claim More Stars
            </button>
          </div>

          {claimMsg && (
            <p style={{ fontSize: 12, color: "var(--gold)", marginBottom: 8, animation: "fadeUp 0.3s ease", fontFamily: "system-ui" }}>
              {claimMsg}
            </p>
          )}

          {/* Priority note */}
          <p style={{
            fontSize: 11, color: "var(--text-muted)", letterSpacing: 0.3,
            marginBottom: 0, fontFamily: "system-ui",
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <Sparkle size={8} color="var(--text-muted)" />
            The more stars you collect, the higher your priority.
            <Sparkle size={8} color="var(--text-muted)" />
          </p>

        </div>{/* end hero-content */}
        </div>{/* end hero-wrap */}

        {/* ── STARS CARD + TASKS ─────────────────────────────────────────── */}
        <div style={{ padding: "0 16px 32px", background: "transparent", marginTop: -32, position: "relative", zIndex: 2 }}>

          {/* ── STARS CARD ────────────────────────────────────────────────── */}
          <div style={{
            background: "var(--panel)",
            border: `1px solid var(--border)`,
            borderRadius: 16,
            padding: "18px 24px",
            textAlign: "center",
            marginBottom: 12,
            marginTop: 0,
            boxShadow: "0 1px 12px rgba(0,0,0,0.04)",
          }}>
            <div style={{ fontSize: 10, letterSpacing: 3, color: "var(--text-muted)", fontFamily: "system-ui", fontWeight: 600, marginBottom: 6 }}>
              YOUR STARS
            </div>
            <div style={{ height: 1, width: 24, background: "var(--gold-border)", margin: "0 auto 10px" }} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <span style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 48, fontWeight: 700, color: "var(--text-main)",
                lineHeight: 1, fontVariantNumeric: "tabular-nums",
              }}>
                {user.stars ?? 0}
              </span>
              <Sparkle size={18} color="var(--gold)" />
            </div>

            {/* WL Status Badge */}
            {wlStatus && (
              <div style={{
                marginTop: 12, padding: "8px 12px", borderRadius: 10,
                background: wlStatus === "GTD" ? "var(--gold-light)" : "var(--bg)",
                border: `1px solid ${wlStatus === "GTD" ? "var(--gold-border)" : "var(--border)"}`,
                display: "inline-flex", alignItems: "center", gap: 8,
              }}>
                <Sparkle size={10} />
                <span style={{
                  fontSize: 11, fontWeight: 700, color: wlStatus === "GTD" ? "var(--gold)" : "var(--text-muted)",
                  fontFamily: "system-ui", letterSpacing: 0.5, textTransform: "uppercase",
                }}>
                  WL {wlStatus === "GTD" ? "Guaranteed" : wlStatus === "APPROVED" ? "Approved" : "Pending"}
                </span>
              </div>
            )}
          </div>

          {/* ── TASK LIST ─────────────────────────────────────────────────── */}
          <div style={{
            background: "var(--panel)",
            border: `1px solid var(--border)`,
            borderRadius: 16,
            overflow: "hidden",
            boxShadow: "0 1px 12px rgba(0,0,0,0.04)",
          }}>
            {/* Social tasks */}
            <div style={{ padding: "16px 20px 4px" }}>
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

            <div style={{ height: 1, background: "var(--border)" }} />

            {/* Interactive tasks */}
            <div style={{ padding: "16px 20px 4px" }}>
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

            {/* Countdown footer */}
            <div style={{
              borderTop: `1px solid var(--border)`,
              padding: "12px 18px",
              display: "flex", alignItems: "center", justifyContent: "center",
              gap: 8, fontSize: 12, color: "var(--text-muted)", fontFamily: "system-ui",
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.8">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              {canClaim
                ? <span style={{ color: "var(--gold)", fontWeight: 600 }}>Ready to claim!</span>
                : (
                  <span>
                    Next claim available in{" "}
                    <strong style={{ color: "var(--text-main)", letterSpacing: 0.5, fontWeight: 700 }}>
                      {fmt(countdown)}
                    </strong>
                  </span>
                )}
            </div>
          </div>{/* end task list card */}

        </div>{/* end cards padding wrapper */}
      </section>

      {/* ── LIVE FEED ─────────────────────────────────────────────────────── */}
      <section style={{
        padding: "56px clamp(20px, 8vw, 100px)",
        background: "var(--surface)",
        borderTop: `1px solid var(--border)`,
      }}>
        <div style={{ maxWidth: 520, margin: "0 auto" }}>
          <div style={{ fontSize: 10, letterSpacing: 3, color: "var(--gold)", marginBottom: 10, fontFamily: "system-ui", fontWeight: 600 }}>
            LIVE
          </div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, color: "var(--text-main)", marginBottom: 6, fontWeight: 700 }}>
            Star Activity
          </h2>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 22, fontFamily: "system-ui" }}>
            Real-time star claims from the community
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {feed.length === 0
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} style={{
                    height: 52, background: "var(--bg)",
                    borderRadius: 10, animation: "pulse 1.5s infinite",
                  }} />
                ))
              : feed.map((item, i) => (
                  <div key={item.id} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "10px 14px",
                    background: i === 0 ? "var(--gold-light)" : "var(--bg)",
                    borderRadius: 10,
                    border: i === 0 ? `1px solid var(--gold-border)` : "1px solid transparent",
                    animation: i === 0 ? "fadeUp 0.4s ease" : "none",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Avatar src={item.x_avatar} handle={item.x_handle} size={32} />
                      <div style={{ fontFamily: "system-ui" }}>
                        <span style={{ fontWeight: 600, fontSize: 13, color: "var(--text-main)" }}>{item.x_handle}</span>
                        <span style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: 6 }}>claimed</span>
                        <span style={{ color: "var(--gold)", fontWeight: 700, fontSize: 13, marginLeft: 5 }}>
                          +{item.stars} ✦
                        </span>
                      </div>
                    </div>
                    <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "system-ui" }}>
                      {timeAgo(item.claimed_at)}
                    </span>
                  </div>
                ))}
          </div>
        </div>
      </section>

      {/* ── HOW TO GET WL ──────────────────────────────────────────────────── */}
      <section style={{
        padding: "56px clamp(20px, 8vw, 100px)",
        background: "var(--bg)",
        borderTop: `1px solid var(--border)`,
      }}>
        <div style={{ maxWidth: 520, margin: "0 auto" }}>
          <div style={{ fontSize: 10, letterSpacing: 3, color: "var(--gold)", marginBottom: 10, fontFamily: "system-ui", fontWeight: 600 }}>
            GUIDE
          </div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, color: "var(--text-main)", marginBottom: 6, fontWeight: 700 }}>
            How to Get WL
          </h2>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 28, fontFamily: "system-ui", lineHeight: 1.6 }}>
            Aurelia uses a Stars system to reward early supporters.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <p style={{ fontSize: 14, color: "var(--text-muted)", fontFamily: "system-ui", lineHeight: 1.7, margin: 0 }}>
              Earn Stars by completing tasks on the website and returning regularly to claim more. The more Stars you collect, the higher your whitelist priority.
            </p>

            <p style={{ fontSize: 14, color: "var(--text-muted)", fontFamily: "system-ui", lineHeight: 1.7, margin: 0 }}>
              You can earn Stars through:
            </p>

            <ul style={{
              margin: 0, padding: "0 0 0 20px",
              fontSize: 14, color: "var(--text-muted)",
              fontFamily: "system-ui", lineHeight: 1.9,
            }}>
              <li>Social tasks such as following on X, joining Discord, and joining Telegram</li>
              <li>Interactive tasks such as visiting the website, reading the lore, and connecting your account</li>
              <li>Referring friends — earn +{REFERRAL_STARS} Stars for every friend who joins with your link</li>
              <li>Timed Star claims available every 2 hours</li>
            </ul>

            <div style={{
              background: "var(--surface)",
              border: `1px solid var(--border)`,
              borderRadius: 12,
              padding: "20px 24px",
              marginTop: 4,
            }}>
              <p style={{
                fontSize: 14, color: "var(--text-main)",
                fontFamily: "'Playfair Display', serif",
                fontWeight: 700, margin: "0 0 8px",
                letterSpacing: "0.5px",
              }}>
                The rule is simple:
              </p>
              <p style={{
                fontSize: 16, color: "var(--gold)",
                fontFamily: "'Playfair Display', serif",
                fontWeight: 700, margin: 0,
                letterSpacing: "0.5px",
              }}>
                More Stars = Higher WL Priority
              </p>
            </div>

            <p style={{ fontSize: 13, color: "var(--text-muted)", fontFamily: "system-ui", lineHeight: 1.7, margin: "4px 0 0" }}>
              Stars are not tokens, have no monetary value, and cannot be transferred. They exist solely to rank early supporters and help determine whitelist access.
            </p>

            <p style={{
              fontSize: 13, color: "var(--text-main)",
              fontFamily: "'Playfair Display', serif",
              fontWeight: 600, margin: "12px 0 0",
              letterSpacing: "1px",
            }}>
              Be early. Stay active. Keep collecting.
            </p>
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
      fontSize: 10, letterSpacing: 2.5, color: "var(--text-muted)",
      fontFamily: "system-ui", fontWeight: 600,
      marginBottom: 10,
      display: "flex", alignItems: "center", gap: 6,
    }}>
      <svg width="9" height="9" viewBox="0 0 24 24" fill="var(--gold)">
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
        padding: "13px 6px",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        fontSize: 14, fontFamily: "system-ui", color: "var(--text-main)", minWidth: 0,
      }}>
        <span style={{ width: 22, height: 22, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
          <TaskIcon name={task.icon} />
        </span>
        <span style={{ textDecoration: done ? "line-through" : "none", overflow: "hidden", textOverflow: "ellipsis" }}>
          {task.label}
        </span>
      </div>

      <div style={{
        display: "flex", alignItems: "center", gap: 5, flexShrink: 0, marginLeft: 8,
        fontSize: 13, fontWeight: 600, whiteSpace: "nowrap",
        color: done ? "var(--gold)" : "var(--text-muted)",
        fontFamily: "system-ui",
      }}>
        {loading
          ? <span style={{ animation: "pulse 1s infinite" }}>…</span>
          : done ? "✓" : `+ ${task.stars}`}
        <svg width="10" height="10" viewBox="0 0 24 24" fill={done ? "var(--gold)" : "var(--text-muted)"}>
          <path d="M12 2 L13.2 10.8 L22 12 L13.2 13.2 L12 22 L10.8 13.2 L2 12 L10.8 10.8 Z" />
        </svg>
      </div>
    </div>
  );
}
