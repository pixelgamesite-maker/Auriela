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
  CLAIM_STARS,
  type StarClaim,
} from "@/lib/supabase";
import { Link } from "wouter";

// ── Task definitions ──────────────────────────────────────────────────────────
const SOCIAL_TASKS = [
  { id: "follow_x", icon: "𝕏", label: "Follow on X", stars: 10, href: "https://x.com/AureliaApp" },
  { id: "join_discord", icon: "◆", label: "Join Discord", stars: 15, href: "https://discord.gg/aurelia" },
  { id: "join_telegram", icon: "✈", label: "Join Telegram Channel", stars: 10, href: "https://t.me/aurelia" },
];

const INTERACTIVE_TASKS = [
  { id: "visit_website", icon: "⊕", label: "Visit Website", stars: 10, href: "https://aurelia.app" },
  { id: "read_lore", icon: "⊞", label: "Read the Lore", stars: 15, href: "/lore", internal: true },
  { id: "connect_wallet", icon: "⊟", label: "Connect Wallet", stars: 20, href: null },
];

// ── Countdown formatter ───────────────────────────────────────────────────────
function fmt(ms: number) {
  if (ms <= 0) return "00:00:00";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  return `${Math.floor(diff / 3600000)}h ago`;
}

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ src, handle, size = 36 }: { src?: string | null; handle: string; size?: number }) {
  const colors = ["#2a1f3d", "#1a2d2a", "#2d1a1f", "#1a1f2d", "#2d2a1a"];
  const color = colors[(handle.charCodeAt(1) || 0) % colors.length];
  if (src) return <img src={src} alt={handle} style={{ width: size, height: size, borderRadius: "50%", border: "1px solid rgba(201,168,76,0.3)", objectFit: "cover", flexShrink: 0 }} />;
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: color, border: "1px solid rgba(201,168,76,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.38, fontWeight: 700, color: "#C9A84C", flexShrink: 0 }}>
      {handle?.[1]?.toUpperCase() || "?"}
    </div>
  );
}

// ── Star icon ─────────────────────────────────────────────────────────────────
function StarIcon({ size = 14, gold = false }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill={gold ? "#C9A84C" : "currentColor"}><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" /></svg>;
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Home() {
  const { user, loading, completedTasks, setCompletedTasks, refreshUser } = useAuth();

  const [countdown, setCountdown] = useState(0);
  const [canClaim, setCanClaim] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [claimMsg, setClaimMsg] = useState("");
  const [feed, setFeed] = useState<StarClaim[]>([]);
  const [taskLoading, setTaskLoading] = useState<string | null>(null);

  // Countdown timer
  useEffect(() => {
    const tick = () => {
      if (!user?.last_claim) { setCanClaim(true); setCountdown(0); return; }
      const next = new Date(user.last_claim).getTime() + CLAIM_INTERVAL_MS;
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
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        .task-row:hover { background: rgba(201,168,76,0.04) !important; }
        .claim-btn:hover:not(:disabled) { background: #333 !important; }
        .claim-btn:active:not(:disabled) { transform: scale(0.97); }
      `}</style>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section style={{ position: "relative", minHeight: "calc(100vh - 68px)", display: "flex", alignItems: "center", overflow: "hidden", background: "#F8F7F4" }}>
        {/* Character image */}
        <div style={{
          position: "absolute", right: 0, top: 0, bottom: 0, width: "48%",
          backgroundImage: "url('/Aureila.png')",
          backgroundSize: "contain", backgroundRepeat: "no-repeat",
          backgroundPosition: "right bottom",
        }} />

        {/* Decorative sparkles */}
        {[[8,12],[22,58],[18,82],[72,8],[80,68],[88,32],[55,92],[42,4]].map(([t,l],i)=>(
          <span key={i} style={{ position:"absolute", top:`${t}%`, left:`${l}%`, color:"#C9A84C", opacity:0.45, fontSize: i%2===0?10:18, pointerEvents:"none" }}>✦</span>
        ))}

        <div style={{ position: "relative", zIndex: 2, maxWidth: 620, marginLeft: "clamp(24px,8vw,100px)", padding: "40px 24px" }}>
          {/* Brand name */}
          <img src="/Aureila.png" alt="" style={{ height: 72, marginBottom: 12, display: "block" }} onError={(e) => (e.currentTarget.style.display = "none")} />

          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(52px,7vw,90px)", fontWeight: 700, lineHeight: 1.02, color: "#111", margin: "0 0 14px" }}>
            Secure<br />Your Spot
          </h1>
          <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 15, color: "#777", marginBottom: 36, letterSpacing: 0.2 }}>
            Complete tasks and claim stars every 2 hours.
          </p>

          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 14 }}>
            <button
              className="claim-btn"
              onClick={handleClaim}
              disabled={claiming || (!canClaim && !!user)}
              style={{
                background: "#111", color: "#fff", border: "none",
                borderRadius: 7, padding: "14px 36px", fontSize: 15,
                cursor: canClaim || !user ? "pointer" : "default",
                fontFamily: "system-ui", letterSpacing: 0.3,
                opacity: !canClaim && !!user ? 0.6 : 1,
                transition: "all 0.2s",
              }}
            >
              {claiming ? "Claiming…" : "✦ Claim Stars"}
            </button>
            <button
              onClick={() => signInWithX()}
              style={{
                background: "transparent", color: "#111",
                border: "1.5px solid #222", borderRadius: 7,
                padding: "14px 30px", fontSize: 15, cursor: "pointer",
                fontFamily: "system-ui", letterSpacing: 0.3, transition: "all 0.2s",
              }}
            >
              ✦ Join Waitlist
            </button>
          </div>

          {claimMsg && (
            <p style={{ fontSize: 13, color: "#C9A84C", marginBottom: 8, animation: "fadeSlide 0.3s ease", fontFamily:"system-ui" }}>
              {claimMsg}
            </p>
          )}

          <p style={{ fontSize: 12, color: "#aaa", letterSpacing: 0.3, marginBottom: 40, fontFamily:"system-ui" }}>
            ✦ The more stars you collect, the higher your priority. ✦
          </p>

          {/* ── TASKS PANEL ─────────────────────────────────────────────── */}
          <div style={{ background: "#fff", borderRadius: 18, border: "1px solid rgba(0,0,0,0.08)", padding: "28px 28px 20px", boxShadow: "0 2px 32px rgba(0,0,0,0.05)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 32px" }}>
              {/* Social */}
              <div>
                <div style={{ fontSize: 10, letterSpacing: 2.5, color: "#aaa", fontWeight: 600, marginBottom: 14, fontFamily:"system-ui", display:"flex", alignItems:"center", gap:6 }}>
                  ✦ SOCIAL TASKS
                </div>
                {SOCIAL_TASKS.map((t) => {
                  const done = completedTasks.includes(t.id);
                  return (
                    <div
                      key={t.id}
                      className="task-row"
                      onClick={() => handleTask(t.id, t.stars, t.href)}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "9px 6px", borderBottom: "1px solid #f2f2f0",
                        cursor: done ? "default" : "pointer", opacity: done ? 0.5 : 1,
                        borderRadius: 4, transition: "background 0.15s",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, fontFamily:"system-ui" }}>
                        <span style={{ fontSize: 15, width:18 }}>{t.icon}</span>
                        <span style={{ textDecoration: done ? "line-through" : "none", color: "#333" }}>{t.label}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: done ? "#C9A84C" : "#666", fontWeight: 600, fontFamily:"system-ui", whiteSpace:"nowrap" }}>
                        {taskLoading === t.id ? <span style={{animation:"pulse 1s infinite"}}>…</span> : done ? "✓" : `+ ${t.stars}`}
                        <StarIcon size={11} gold={done} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Interactive */}
              <div>
                <div style={{ fontSize: 10, letterSpacing: 2.5, color: "#aaa", fontWeight: 600, marginBottom: 14, fontFamily:"system-ui", display:"flex", alignItems:"center", gap:6 }}>
                  ✦ INTERACTIVE TASKS
                </div>
                {INTERACTIVE_TASKS.map((t) => {
                  const done = completedTasks.includes(t.id);
                  return (
                    <div
                      key={t.id}
                      className="task-row"
                      onClick={() => handleTask(t.id, t.stars, t.href, t.internal)}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "9px 6px", borderBottom: "1px solid #f2f2f0",
                        cursor: done ? "default" : "pointer", opacity: done ? 0.5 : 1,
                        borderRadius: 4, transition: "background 0.15s",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, fontFamily:"system-ui" }}>
                        <span style={{ fontSize: 15, width:18 }}>{t.icon}</span>
                        <span style={{ textDecoration: done ? "line-through" : "none", color: "#333" }}>{t.label}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: done ? "#C9A84C" : "#666", fontWeight: 600, fontFamily:"system-ui", whiteSpace:"nowrap" }}>
                        {taskLoading === t.id ? <span style={{animation:"pulse 1s infinite"}}>…</span> : done ? "✓" : `+ ${t.stars}`}
                        <StarIcon size={11} gold={done} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom row */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 20, paddingTop: 16, borderTop: "1px solid #f2f2f0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: "#888", fontFamily:"system-ui" }}>
                <span>⏱</span>
                {canClaim
                  ? <span style={{ color: "#C9A84C", fontWeight: 600 }}>Ready to claim!</span>
                  : <span>Next claim in <strong style={{ color: "#333" }}>{fmt(countdown)}</strong></span>}
              </div>

              {/* Stars widget */}
              <div style={{ background: "#F8F7F4", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 12, padding: "10px 18px", textAlign: "center" }}>
                <div style={{ fontSize: 9, letterSpacing: 2.5, color: "#aaa", marginBottom: 4, fontFamily:"system-ui" }}>YOUR STARS</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }}>
                  <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 34, fontWeight: 700, color: "#111" }}>
                    {user?.stars ?? 0}
                  </span>
                  <StarIcon size={18} gold />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── LIVE FEED ────────────────────────────────────────────────────── */}
      <section style={{ padding: "72px clamp(24px,8vw,100px)", background: "#fff", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
        <div style={{ maxWidth: 560 }}>
          <div style={{ fontSize: 10, letterSpacing: 3, color: "#C9A84C", marginBottom: 10, fontFamily:"system-ui" }}>LIVE</div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, color: "#111", marginBottom: 6 }}>Star Activity</h2>
          <p style={{ fontSize: 14, color: "#888", marginBottom: 32, fontFamily:"system-ui" }}>Real-time star claims from the community</p>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {feed.length === 0
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} style={{ height: 56, background: "#F8F7F4", borderRadius: 10, animation: "pulse 1.5s infinite" }} />
                ))
              : feed.map((item, i) => (
                  <div
                    key={item.id}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "12px 16px",
                      background: i === 0 ? "rgba(201,168,76,0.07)" : "#F8F7F4",
                      borderRadius: 10,
                      border: i === 0 ? "1px solid rgba(201,168,76,0.2)" : "1px solid transparent",
                      animation: i === 0 ? "fadeSlide 0.4s ease" : "none",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Avatar src={item.x_avatar} handle={item.x_handle} size={34} />
                      <div style={{ fontFamily:"system-ui" }}>
                        <span style={{ fontWeight: 600, fontSize: 13, color: "#111" }}>{item.x_handle}</span>
                        <span style={{ fontSize: 12, color: "#888", marginLeft: 6 }}>claimed</span>
                        <span style={{ color: "#C9A84C", fontWeight: 700, fontSize: 13, marginLeft: 5 }}>+{item.stars} ✦</span>
                      </div>
                    </div>
                    <span style={{ fontSize: 11, color: "#bbb", fontFamily:"system-ui" }}>{timeAgo(item.claimed_at)}</span>
                  </div>
                ))}
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
