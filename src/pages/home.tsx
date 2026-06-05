import { useEffect, useState } from "react";
import { MainLayout } from "@/layouts/main-layout";
import { useAuth } from "@/hooks/useAuth";
import {
  signInWithX,
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
  { id: "follow_x",      label: "Follow on X",          stars: 10, href: ASSETS.links.x        },
  { id: "join_discord",  label: "Join Discord",           stars: 15, href: ASSETS.links.discord  },
  { id: "join_telegram", label: "Join Telegram Channel",  stars: 10, href: ASSETS.links.telegram },
];

const INTERACTIVE_TASKS = [
  { id: "visit_website", label: "Visit Website", stars: 10, href: ASSETS.links.website      },
  { id: "read_lore",     label: "Read the Lore", stars: 15, href: "/lore", internal: true   },
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
function Sparkle4({ size = 14, color = ASSETS.colors.gold }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={{ flexShrink: 0, display: "inline-block" }}>
      <path d="M12 2 L13.2 10.8 L22 12 L13.2 13.2 L12 22 L10.8 13.2 L2 12 L10.8 10.8 Z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.259 5.63L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
    </svg>
  );
}
function DiscordIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.003.028.015.056.036.074a19.9 19.9 0 0 0 5.993 3.03.077.077 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
    </svg>
  );
}
function TelegramIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
    </svg>
  );
}
function GlobeIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  );
}
function BookIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    </svg>
  );
}

const TASK_ICONS: Record<string, JSX.Element> = {
  follow_x:      <XIcon />,
  join_discord:  <DiscordIcon />,
  join_telegram: <TelegramIcon />,
  visit_website: <GlobeIcon />,
  read_lore:     <BookIcon />,
};

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

// ── Main page ──────────────────────────────────────────────────────────────────
export default function Home() {
  const { user, loading, completedTasks, setCompletedTasks, refreshUser } = useAuth();

  const [countdown,   setCountdown]   = useState(0);
  const [canClaim,    setCanClaim]    = useState(false);
  const [claiming,    setClaiming]    = useState(false);
  const [claimMsg,    setClaimMsg]    = useState("");
  const [feed,        setFeed]        = useState<StarClaim[]>([]);
  const [taskLoading, setTaskLoading] = useState<string | null>(null);

  // Countdown timer
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

  // Live feed
  useEffect(() => {
    getRecentClaims().then(setFeed);
    const channel = subscribeToLiveFeed((claim) => {
      setFeed((prev) => [claim, ...prev.slice(0, 9)]);
    });
    return () => { channel.unsubscribe(); };
  }, []);

  const handleClaim = async () => {
    if (!user) { signInWithX(); return; }
    if (!canClaim || claiming) return;
    setClaiming(true);
    const result = await claimStars(user.id);
    setClaimMsg(result.message);
    if (result.ok) await refreshUser();
    setTimeout(() => setClaimMsg(""), 3000);
    setClaiming(false);
  };

  const handleTask = async (
    taskId: string,
    stars: number,
    href: string | null,
    internal?: boolean
  ) => {
    if (!user) { signInWithX(); return; }
    if (completedTasks.includes(taskId)) return;
    setTaskLoading(taskId);
    if (href && !internal) window.open(href, "_blank");
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
        @keyframes fadeUp   { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:.35} }
        @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
        @keyframes sparkle  { 0%,100%{opacity:.3} 50%{opacity:.7} }

        .task-row { transition: background 0.15s; border-radius: 6px; }
        .task-row:hover:not(.done) { background: rgba(201,168,76,0.05) !important; cursor: pointer; }
        .task-row.done { opacity: 0.45; cursor: default; }

        .claim-btn:hover:not(:disabled) { background: #2a2a2a !important; }
        .claim-btn:active:not(:disabled) { transform: scale(0.97); }
        .waitlist-btn:hover { background: rgba(0,0,0,0.04) !important; }

        /* Desktop 3-col task grid */
        .tasks-grid {
          display: grid;
          grid-template-columns: 1fr 1fr auto;
          grid-template-rows: auto;
        }
        /* Mobile: stack */
        @media (max-width: 768px) {
          .tasks-grid {
            grid-template-columns: 1fr;
          }
          .tasks-grid > div {
            border-right: none !important;
          }
          .character-img { display: none !important; }
          .hero-section { min-height: unset !important; padding-bottom: 48px !important; }
        }
      `}</style>

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section
        className="hero-section"
        style={{
          position: "relative",
          minHeight: "calc(100vh - 68px)",
          overflow: "hidden",
          background: ASSETS.colors.bg,
          display: "flex",
          alignItems: "flex-start",
        }}
      >
        {/* Character */}
        <img
          className="character-img"
          src={ASSETS.images.character}
          alt="Aurelia"
          style={{
            position: "absolute", right: 0, top: 0,
            height: "100%", width: "52%",
            objectFit: "contain", objectPosition: "right bottom",
            pointerEvents: "none", userSelect: "none",
          }}
          onError={(e) => { (e.currentTarget.style.display = "none"); }}
        />

        {/* Sparkle decorations */}
        {([[6,6],[12,60],[20,85],[70,6],[75,72],[90,30],[50,94],[40,3]] as [number,number][]).map(([t,l], i) => (
          <span key={i} style={{
            position: "absolute", top: `${t}%`, left: `${l}%`,
            color: ASSETS.colors.gold, opacity: 0.25 + (i % 3) * 0.1,
            fontSize: i % 2 === 0 ? 10 : 18, pointerEvents: "none",
            animation: `sparkle ${2 + i * 0.3}s ease-in-out infinite`,
          }}>✦</span>
        ))}

        {/* Content column */}
        <div style={{
          position: "relative", zIndex: 2,
          width: "50%",
          maxWidth: 580,
          padding: "clamp(40px, 6vw, 72px) clamp(24px, 6vw, 72px) 60px",
          animation: "fadeUp 0.6s ease both",
        }}>
          {/* Wordmark */}
          <img
            src={ASSETS.images.logo}
            alt={ASSETS.brand.name}
            style={{ height: 72, marginBottom: 8, display: "block", maxWidth: "70vw" }}
            onError={(e) => {
              (e.currentTarget.style.display = "none");
              const fb = document.getElementById("hero-wordmark-fallback");
              if (fb) fb.style.display = "block";
            }}
          />
          <div id="hero-wordmark-fallback" style={{
            display: "none",
            fontFamily: "'Playfair Display', serif",
            fontSize: 42, letterSpacing: 6, fontWeight: 700, color: "#111",
            marginBottom: 4,
          }}>
            {ASSETS.brand.name}
          </div>

          {/* Decorative rule */}
          <div style={{
            display: "flex", alignItems: "center", gap: 6, marginBottom: 20,
          }}>
            <div style={{ height: 1, width: 24, background: "#ccc" }} />
            <Sparkle4 size={8} color="#999" />
            <Sparkle4 size={10} color="#999" />
            <Sparkle4 size={8} color="#999" />
            <div style={{ height: 1, width: 24, background: "#ccc" }} />
          </div>

          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "clamp(52px, 6vw, 80px)",
            fontWeight: 700, lineHeight: 1.05,
            color: ASSETS.colors.ink,
            margin: "0 0 14px",
          }}>
            Secure<br />Your Spot
          </h1>

          <p style={{
            fontFamily: "system-ui, sans-serif",
            fontSize: 14, color: ASSETS.colors.muted,
            marginBottom: 28, letterSpacing: 0.2, lineHeight: 1.6,
          }}>
            {ASSETS.brand.description}
          </p>

          {/* CTA row */}
          <div style={{
            display: "flex", flexDirection: "row",
            gap: 10, marginBottom: 14, maxWidth: 420,
          }}>
            <button
              className="claim-btn"
              onClick={handleClaim}
              disabled={!!user && !canClaim}
              style={{
                flex: 1,
                background: ASSETS.colors.ink, color: "#fff",
                border: "none", borderRadius: 8,
                padding: "15px 24px", fontSize: 14,
                cursor: (!!user && !canClaim) ? "not-allowed" : "pointer",
                fontFamily: "system-ui", letterSpacing: 0.5, fontWeight: 500,
                transition: "background 0.2s, transform 0.1s",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                opacity: (!!user && !canClaim) ? 0.5 : 1,
              }}
            >
              <Sparkle4 size={12} color="#fff" />
              {claiming ? "Claiming…" : "Claim Stars"}
            </button>

            <button
              className="waitlist-btn"
              onClick={() => signInWithX()}
              style={{
                flex: 1,
                background: "transparent", color: ASSETS.colors.ink,
                border: `1.5px solid ${ASSETS.colors.ink}`, borderRadius: 8,
                padding: "14px 24px", fontSize: 14, cursor: "pointer",
                fontFamily: "system-ui", letterSpacing: 0.5, fontWeight: 500,
                transition: "background 0.2s",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              <Sparkle4 size={12} color={ASSETS.colors.ink} />
              Join Waitlist
            </button>
          </div>

          {claimMsg && (
            <p style={{
              fontSize: 13, color: ASSETS.colors.gold,
              marginBottom: 8, animation: "fadeUp 0.3s ease",
              fontFamily: "system-ui",
            }}>
              {claimMsg}
            </p>
          )}

          <p style={{
            fontSize: 12, color: "#bbb", letterSpacing: 0.3,
            marginBottom: 32, fontFamily: "system-ui",
          }}>
            ✦ {ASSETS.brand.priorityNote} ✦
          </p>

          {/* ── 3-COLUMN TASK CARDS ──────────────────────────────────────── */}
          <div style={{
            background: ASSETS.colors.surface,
            border: `1px solid ${ASSETS.colors.border}`,
            borderRadius: 16,
            overflow: "hidden",
            boxShadow: "0 2px 32px rgba(0,0,0,0.05)",
          }}>
            <div className="tasks-grid">

              {/* Social Tasks */}
              <div style={{
                padding: "20px 20px 16px",
                borderRight: `1px solid ${ASSETS.colors.border}`,
              }}>
                <TaskSectionHeading label="SOCIAL TASKS" />
                {SOCIAL_TASKS.map((t) => (
                  <TaskRow
                    key={t.id}
                    task={t}
                    icon={TASK_ICONS[t.id]}
                    done={completedTasks.includes(t.id)}
                    loading={taskLoading === t.id}
                    onTask={handleTask}
                  />
                ))}
              </div>

              {/* Interactive Tasks */}
              <div style={{
                padding: "20px 20px 16px",
                borderRight: `1px solid ${ASSETS.colors.border}`,
              }}>
                <TaskSectionHeading label="INTERACTIVE TASKS" />
                {INTERACTIVE_TASKS.map((t) => (
                  <TaskRow
                    key={t.id}
                    task={t}
                    icon={TASK_ICONS[t.id]}
                    done={completedTasks.includes(t.id)}
                    loading={taskLoading === t.id}
                    onTask={handleTask}
                  />
                ))}
              </div>

              {/* Your Stars */}
              <div style={{
                padding: "20px 28px",
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                minWidth: 160,
              }}>
                <div style={{
                  fontSize: 10, letterSpacing: 3, color: "#aaa",
                  fontFamily: "system-ui", fontWeight: 600, marginBottom: 8,
                  textAlign: "center",
                }}>
                  YOUR STARS
                </div>
                <div style={{
                  height: 1, width: 32,
                  background: ASSETS.colors.goldBorder,
                  marginBottom: 12,
                }} />
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: 56, fontWeight: 700, color: ASSETS.colors.ink,
                    lineHeight: 1, fontVariantNumeric: "tabular-nums",
                  }}>
                    {user?.stars ?? 0}
                  </span>
                  <Sparkle4 size={22} color={ASSETS.colors.gold} />
                </div>
              </div>
            </div>

            {/* Countdown footer — full width */}
            <div style={{
              borderTop: `1px solid ${ASSETS.colors.border}`,
              padding: "13px 20px",
              display: "flex", alignItems: "center", justifyContent: "center",
              gap: 8, fontSize: 13, color: "#888", fontFamily: "system-ui",
              background: ASSETS.colors.surface,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="1.8">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              {canClaim
                ? <span style={{ color: ASSETS.colors.gold, fontWeight: 600 }}>Ready to claim!</span>
                : (
                  <span>
                    Next claim available in{" "}
                    <strong style={{ color: ASSETS.colors.ink, letterSpacing: 0.5 }}>
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
        padding: "64px clamp(20px, 8vw, 100px)",
        background: ASSETS.colors.surface,
        borderTop: `1px solid ${ASSETS.colors.border}`,
      }}>
        <div style={{ maxWidth: 560 }}>
          <div style={{
            fontSize: 10, letterSpacing: 3, color: ASSETS.colors.gold,
            marginBottom: 10, fontFamily: "system-ui",
          }}>
            LIVE
          </div>
          <h2 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 30, color: "#111", marginBottom: 6,
          }}>
            Star Activity
          </h2>
          <p style={{ fontSize: 14, color: "#888", marginBottom: 28, fontFamily: "system-ui" }}>
            Real-time star claims from the community
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {feed.length === 0
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} style={{
                    height: 56, background: ASSETS.colors.bg,
                    borderRadius: 10, animation: "pulse 1.5s infinite",
                  }} />
                ))
              : feed.map((item, i) => (
                  <div key={item.id} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "12px 16px",
                    background: i === 0 ? ASSETS.colors.goldLight : ASSETS.colors.bg,
                    borderRadius: 10,
                    border: i === 0
                      ? `1px solid ${ASSETS.colors.goldBorder}`
                      : "1px solid transparent",
                    animation: i === 0 ? "fadeUp 0.4s ease" : "none",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Avatar src={item.x_avatar} handle={item.x_handle} size={34} />
                      <div style={{ fontFamily: "system-ui" }}>
                        <span style={{ fontWeight: 600, fontSize: 13, color: "#111" }}>
                          {item.x_handle}
                        </span>
                        <span style={{ fontSize: 12, color: "#888", marginLeft: 6 }}>claimed</span>
                        <span style={{
                          color: ASSETS.colors.gold, fontWeight: 700,
                          fontSize: 13, marginLeft: 5,
                        }}>
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
function TaskSectionHeading({ label }: { label: string }) {
  return (
    <div style={{
      fontSize: 10, letterSpacing: 2.5, color: "#aaa",
      fontFamily: "system-ui", fontWeight: 600,
      marginBottom: 10,
      display: "flex", alignItems: "center", gap: 6,
    }}>
      <svg width="10" height="10" viewBox="0 0 24 24" fill={ASSETS.colors.gold}>
        <path d="M12 2 L13.2 10.8 L22 12 L13.2 13.2 L12 22 L10.8 13.2 L2 12 L10.8 10.8 Z" />
      </svg>
      {label}
    </div>
  );
}

function TaskRow({
  task,
  icon,
  done,
  loading,
  onTask,
}: {
  task: { id: string; label: string; stars: number; href: string | null; internal?: boolean };
  icon: JSX.Element;
  done: boolean;
  loading: boolean;
  onTask: (id: string, stars: number, href: string | null, internal?: boolean) => void;
}) {
  return (
    <div
      className={`task-row${done ? " done" : ""}`}
      onClick={() => !done && onTask(task.id, task.stars, task.href, task.internal)}
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 6px",
        borderBottom: `1px solid #f4f4f2`,
      }}
    >
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        fontSize: 13, fontFamily: "system-ui", color: "#222",
      }}>
        <span style={{
          width: 20, display: "flex", alignItems: "center",
          justifyContent: "center", flexShrink: 0, color: "#444",
        }}>
          {icon}
        </span>
        <span style={{ textDecoration: done ? "line-through" : "none" }}>
          {task.label}
        </span>
      </div>

      <div style={{
        display: "flex", alignItems: "center", gap: 5,
        fontSize: 13, fontWeight: 600, whiteSpace: "nowrap",
        color: done ? ASSETS.colors.gold : "#555",
        fontFamily: "system-ui", flexShrink: 0,
      }}>
        {loading
          ? <span style={{ animation: "pulse 1s infinite" }}>…</span>
          : done
            ? "✓"
            : `+ ${task.stars}`}
        <svg width="11" height="11" viewBox="0 0 24 24" fill={done ? ASSETS.colors.gold : "#ccc"}>
          <path d="M12 2 L13.2 10.8 L22 12 L13.2 13.2 L12 22 L10.8 13.2 L2 12 L10.8 10.8 Z" />
        </svg>
      </div>
    </div>
  );
}
