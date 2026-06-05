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
  { id: "follow_x",      icon: "𝕏", label: "Follow on X",         stars: 10, href: ASSETS.links.x        },
  { id: "join_discord",  icon: "◆", label: "Join Discord",          stars: 15, href: ASSETS.links.discord  },
  { id: "join_telegram", icon: "✈", label: "Join Telegram Channel", stars: 10, href: ASSETS.links.telegram },
];

const INTERACTIVE_TASKS = [
  { id: "visit_website",  icon: "⊕", label: "Visit Website",  stars: 10, href: ASSETS.links.website          },
  { id: "read_lore",      icon: "⊞", label: "Read the Lore",  stars: 15, href: "/lore", internal: true       },
  { id: "connect_wallet", icon: "⊟", label: "Connect Wallet", stars: 20, href: null                          },
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

// ── Avatar ─────────────────────────────────────────────────────────────────────
function Avatar({ src, handle, size = 36 }: { src?: string | null; handle: string; size?: number }) {
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
      fontSize: size * 0.38, fontWeight: 700, color: ASSETS.colors.gold, flexShrink: 0,
      fontFamily: "system-ui",
    }}>
      {handle?.[1]?.toUpperCase() || "?"}
    </div>
  );
}

// ── Sparkle icon ───────────────────────────────────────────────────────────────
function Sparkle({ size = 14, gold = false }: { size?: number; gold?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={gold ? ASSETS.colors.gold : "currentColor"}>
      <path d="M12 2 L13.5 10.5 L22 12 L13.5 13.5 L12 22 L10.5 13.5 L2 12 L10.5 10.5 Z" />
    </svg>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function Home() {
  const { user, loading, completedTasks, setCompletedTasks, refreshUser } = useAuth();

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

  const handleTask = async (taskId: string, stars: number, href: string | null, internal?: boolean) => {
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
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Cormorant+Garamond:wght@300;400;600&display=swap');
        @keyframes fadeSlide { from { opacity:0; transform:translateY(-10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.35} }
        .task-row:hover { background: rgba(201,168,76,0.05) !important; }
        .claim-btn:hover:not(:disabled) { background: #2a2a2a !important; }
        .claim-btn:active:not(:disabled) { transform: scale(0.97); }
        .waitlist-btn:hover { background: rgba(0,0,0,0.04) !important; }
      `}</style>

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section style={{
        position: "relative",
        minHeight: "calc(100vh - 68px)",
        display: "flex",
        alignItems: "flex-start",
        overflow: "hidden",
        background: ASSETS.colors.bg,
      }}>
        {/* Character — absolutely right, clips nicely on mobile */}
        <img
          src={ASSETS.images.character}
          alt="Aurelia"
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            height: "100%",
            width: "55%",
            objectFit: "contain",
            objectPosition: "right bottom",
            pointerEvents: "none",
            userSelect: "none",
          }}
          onError={(e) => { (e.currentTarget.style.display = "none"); }}
        />

        {/* Sparkle decorations */}
        {([[8,12],[22,58],[18,82],[72,8],[80,68],[88,32],[55,92],[42,4]] as [number,number][]).map(([t,l], i) => (
          <span key={i} style={{
            position: "absolute", top: `${t}%`, left: `${l}%`,
            color: ASSETS.colors.gold, opacity: 0.4,
            fontSize: i % 2 === 0 ? 10 : 16,
            pointerEvents: "none",
          }}>✦</span>
        ))}

        {/* Content column */}
        <div style={{
          position: "relative", zIndex: 2,
          width: "100%",
          maxWidth: 520,
          padding: "clamp(28px, 6vw, 56px) clamp(20px, 6vw, 56px) 48px",
        }}>
          {/* Logo image */}
          <img
            src={ASSETS.images.logo}
            alt={ASSETS.brand.name}
            style={{ height: 80, marginBottom: 16, display: "block", maxWidth: "70vw" }}
            onError={(e) => {
              (e.currentTarget.style.display = "none");
              const fallback = document.getElementById("hero-brand-text");
              if (fallback) fallback.style.display = "block";
            }}
          />
          <span id="hero-brand-text" style={{
            display: "none",
            fontFamily: "'Playfair Display', serif",
            fontSize: 36, letterSpacing: 6, fontWeight: 700, color: "#111",
            marginBottom: 16,
          }}>
            {ASSETS.brand.name}
          </span>

          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "clamp(44px, 8vw, 80px)",
            fontWeight: 700, lineHeight: 1.05,
            color: ASSETS.colors.ink,
            margin: "0 0 12px",
          }}>
            Secure<br />Your Spot
          </h1>

          <p style={{
            fontFamily: "system-ui, sans-serif",
            fontSize: 14, color: ASSETS.colors.muted,
            marginBottom: 28, letterSpacing: 0.2, lineHeight: 1.5,
          }}>
            {ASSETS.brand.description}
          </p>

          {/* CTA buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 300, marginBottom: 14 }}>
            <button
              className="claim-btn"
              onClick={handleClaim}
              disabled={!!user && !canClaim}
              style={{
                background: ASSETS.colors.ink, color: "#fff",
                border: "none", borderRadius: 8,
                padding: "15px 28px", fontSize: 15,
                cursor: (!!user && !canClaim) ? "not-allowed" : "pointer",
                fontFamily: "system-ui", letterSpacing: 0.4,
                transition: "background 0.2s, transform 0.1s",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                opacity: (!!user && !canClaim) ? 0.5 : 1,
              }}
            >
              <Sparkle size={13} />
              {claiming ? "Claiming…" : "Claim Stars"}
            </button>

            <button
              className="waitlist-btn"
              onClick={() => signInWithX()}
              style={{
                background: "transparent", color: ASSETS.colors.ink,
                border: `1.5px solid ${ASSETS.colors.ink}`, borderRadius: 8,
                padding: "14px 28px", fontSize: 15, cursor: "pointer",
                fontFamily: "system-ui", letterSpacing: 0.4,
                transition: "background 0.2s",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              <Sparkle size={13} />
              Join Waitlist
            </button>
          </div>

          {claimMsg && (
            <p style={{
              fontSize: 13, color: ASSETS.colors.gold,
              marginBottom: 8, animation: "fadeSlide 0.3s ease",
              fontFamily: "system-ui",
            }}>
              {claimMsg}
            </p>
          )}

          <p style={{
            fontSize: 12, color: "#bbb",
            letterSpacing: 0.3, marginBottom: 32,
            fontFamily: "system-ui",
          }}>
            ✦ {ASSETS.brand.priorityNote} ✦
          </p>

          {/* ── STARS CARD ────────────────────────────────────────────── */}
          <div style={{
            background: ASSETS.colors.surface,
            border: `1px solid ${ASSETS.colors.border}`,
            borderRadius: 14,
            padding: "18px 24px",
            marginBottom: 12,
            textAlign: "center",
          }}>
            <div style={{
              fontSize: 10, letterSpacing: 3, color: "#aaa",
              marginBottom: 6, fontFamily: "system-ui", fontWeight: 600,
            }}>
              YOUR STARS
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
              <span style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 48, fontWeight: 700, color: "#111",
                fontVariantNumeric: "tabular-nums",
                lineHeight: 1,
              }}>
                {user?.stars ?? 0}
              </span>
              <Sparkle size={22} gold />
            </div>
          </div>

          {/* ── TASKS PANEL ───────────────────────────────────────────── */}
          <div style={{
            background: ASSETS.colors.surface,
            borderRadius: 14,
            border: `1px solid ${ASSETS.colors.border}`,
            padding: "22px 20px 16px",
            boxShadow: "0 2px 24px rgba(0,0,0,0.04)",
          }}>
            {/* Social tasks */}
            <TaskSection
              heading="SOCIAL TASKS"
              tasks={SOCIAL_TASKS}
              completedTasks={completedTasks}
              taskLoading={taskLoading}
              onTask={handleTask}
            />

            {/* Divider */}
            <div style={{ height: 1, background: "#f0f0ee", margin: "8px 0 16px" }} />

            {/* Interactive tasks */}
            <TaskSection
              heading="INTERACTIVE TASKS"
              tasks={INTERACTIVE_TASKS}
              completedTasks={completedTasks}
              taskLoading={taskLoading}
              onTask={handleTask}
            />

            {/* Countdown footer */}
            <div style={{
              marginTop: 16, paddingTop: 14,
              borderTop: "1px solid #f0f0ee",
              display: "flex", alignItems: "center", justifyContent: "center",
              gap: 8, fontSize: 13, color: "#888", fontFamily: "system-ui",
            }}>
              <span style={{ fontSize: 15 }}>⏱</span>
              {canClaim
                ? <span style={{ color: ASSETS.colors.gold, fontWeight: 600 }}>Ready to claim!</span>
                : (
                  <span>
                    Next claim available in{" "}
                    <strong style={{ color: "#111", fontFamily: "system-ui", letterSpacing: 0.5 }}>
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
          <div style={{ fontSize: 10, letterSpacing: 3, color: ASSETS.colors.gold, marginBottom: 10, fontFamily: "system-ui" }}>
            LIVE
          </div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 30, color: "#111", marginBottom: 6 }}>
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
                    border: i === 0 ? `1px solid ${ASSETS.colors.goldBorder}` : "1px solid transparent",
                    animation: i === 0 ? "fadeSlide 0.4s ease" : "none",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Avatar src={item.x_avatar} handle={item.x_handle} size={34} />
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

// ── Task section (single-column) ───────────────────────────────────────────────
function TaskSection({
  heading,
  tasks,
  completedTasks,
  taskLoading,
  onTask,
}: {
  heading: string;
  tasks: { id: string; icon: string; label: string; stars: number; href: string | null; internal?: boolean }[];
  completedTasks: string[];
  taskLoading: string | null;
  onTask: (id: string, stars: number, href: string | null, internal?: boolean) => void;
}) {
  return (
    <div style={{ marginBottom: 4 }}>
      <div style={{
        fontSize: 10, letterSpacing: 2.5, color: "#aaa",
        fontWeight: 600, marginBottom: 6,
        fontFamily: "system-ui",
        display: "flex", alignItems: "center", gap: 6,
      }}>
        ✦ {heading}
      </div>

      {tasks.map((t) => {
        const done = completedTasks.includes(t.id);
        const loading = taskLoading === t.id;
        return (
          <div
            key={t.id}
            className="task-row"
            onClick={() => onTask(t.id, t.stars, t.href, t.internal)}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "11px 8px",
              borderBottom: "1px solid #f4f4f2",
              cursor: done ? "default" : "pointer",
              opacity: done ? 0.45 : 1,
              borderRadius: 6,
              transition: "background 0.15s",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 14, fontFamily: "system-ui" }}>
              <span style={{ fontSize: 16, width: 20, textAlign: "center", flexShrink: 0 }}>{t.icon}</span>
              <span style={{ textDecoration: done ? "line-through" : "none", color: "#222" }}>
                {t.label}
              </span>
            </div>
            <div style={{
              display: "flex", alignItems: "center", gap: 5,
              fontSize: 13, fontWeight: 600,
              color: done ? ASSETS.colors.gold : "#555",
              fontFamily: "system-ui", whiteSpace: "nowrap", flexShrink: 0,
            }}>
              {loading
                ? <span style={{ animation: "pulse 1s infinite" }}>…</span>
                : done
                  ? "✓"
                  : `+ ${t.stars}`}
              <svg width={12} height={12} viewBox="0 0 24 24" fill={done ? ASSETS.colors.gold : "#999"}>
                <path d="M12 2 L13.5 10.5 L22 12 L13.5 13.5 L12 22 L10.5 13.5 L2 12 L10.5 10.5 Z" />
              </svg>
            </div>
          </div>
        );
      })}
    </div>
  );
}
