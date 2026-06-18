import { useState } from "react";
import { MainLayout } from "@/layouts/main-layout";
import { useAuth } from "@/hooks/useAuth";
import { completeTask } from "@/lib/supabase";
import { ASSETS } from "@/lib/assets";

// ── Task definitions ───────────────────────────────────────────────────────────
// The tweet URL to engage with
const TWEET_URL = "https://x.com/i/status/2066204218285822069";

const SOCIAL_BOOST_TASKS = [
  {
    id: "social_like",
    label: "Like the post",
    stars: 25,
    icon: "heart",
    action: "like",
    cta: "Like on X",
    href: TWEET_URL,
  },
  {
    id: "social_comment",
    label: "Comment on the post",
    stars: 25,
    icon: "comment",
    action: "comment",
    cta: "Comment on X",
    href: `https://x.com/intent/tweet?in_reply_to=2066204218285822069`,
  },
  {
    id: "social_quote",
    label: "Quote tweet",
    stars: 25,
    icon: "quote",
    action: "quote",
    cta: "Quote Tweet",
    href: `https://x.com/intent/retweet?tweet_id=2066204218285822069`,
  },
];

// ── Icons ──────────────────────────────────────────────────────────────────────
function Sparkle({ size = 14, color = ASSETS.colors.gold }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={{ flexShrink: 0 }}>
      <path d="M12 2 L13.2 10.8 L22 12 L13.2 13.2 L12 22 L10.8 13.2 L2 12 L10.8 10.8 Z" />
    </svg>
  );
}

function TaskIcon({ name }: { name: string }) {
  if (name === "heart") return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  );
  if (name === "comment") return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  );
  if (name === "quote") return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/>
      <polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
    </svg>
  );
  return null;
}

function CheckIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={ASSETS.colors.gold} strokeWidth="2.5">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function Social() {
  const { user, completedTasks, setCompletedTasks, refreshUser } = useAuth();
  const [taskLoading, setTaskLoading] = useState<string | null>(null);
  const [toastMsg,    setToastMsg]    = useState("");

  const handleTask = async (taskId: string, stars: number, href: string) => {
    if (!user) return;
    if (completedTasks.includes(taskId)) return;

    // Open X in new tab first so it feels immediate
    window.open(href, "_blank");

    setTaskLoading(taskId);
    const { ok } = await completeTask(user.id, taskId, stars);
    if (ok) {
      setCompletedTasks([...completedTasks, taskId]);
      await refreshUser();
      setToastMsg(`+${stars} stars earned ✦`);
      setTimeout(() => setToastMsg(""), 3000);
    }
    setTaskLoading(null);
  };

  const totalEarnable = SOCIAL_BOOST_TASKS.reduce((sum, t) => sum + t.stars, 0);
  const totalEarned   = SOCIAL_BOOST_TASKS
    .filter((t) => completedTasks.includes(t.id))
    .reduce((sum, t) => sum + t.stars, 0);
  const allDone = totalEarned === totalEarnable;

  return (
    <MainLayout>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&display=swap');

        @keyframes fadeUp  { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }

        .boost-card {
          background: #fff;
          border: 1px solid rgba(0,0,0,0.07);
          border-radius: 16px;
          padding: 22px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          transition: box-shadow 0.2s, border-color 0.2s;
          cursor: pointer;
        }
        .boost-card:hover:not(.done) {
          box-shadow: 0 4px 24px rgba(0,0,0,0.07);
          border-color: rgba(201,168,76,0.3);
        }
        .boost-card.done {
          opacity: 0.55;
          cursor: default;
        }
        .boost-btn {
          background: #111;
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 10px 18px;
          font-size: 12px;
          font-family: system-ui;
          letter-spacing: 0.4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 7px;
          white-space: nowrap;
          flex-shrink: 0;
          transition: background 0.15s;
        }
        .boost-btn:hover { background: #333; }
        .boost-btn:disabled { opacity: 0.5; cursor: default; }

        .toast {
          position: fixed;
          bottom: 28px;
          left: 50%;
          transform: translateX(-50%);
          background: #111;
          color: #fff;
          padding: 11px 22px;
          border-radius: 100px;
          font-size: 13px;
          font-family: system-ui;
          letter-spacing: 0.3px;
          animation: fadeUp 0.3s ease;
          z-index: 999;
          pointer-events: none;
        }

        .progress-bar-fill {
          background: linear-gradient(90deg, #C9A84C, #e8c96a, #C9A84C);
          background-size: 200% 100%;
          animation: shimmer 2s linear infinite;
          border-radius: 100px;
          height: 100%;
          transition: width 0.6s ease;
        }
      `}</style>

      <div style={{ padding: "64px clamp(24px,8vw,100px) 80px", maxWidth: 680 }}>

        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 10, letterSpacing: 4, color: ASSETS.colors.gold, marginBottom: 14, fontFamily: "system-ui" }}>
            EARN MORE STARS
          </div>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "clamp(34px,5vw,52px)",
            color: "#111", margin: "0 0 14px", lineHeight: 1.1,
          }}>
            Boost your place.
          </h1>
          <p style={{ fontSize: 15, color: "#777", lineHeight: 1.8, fontFamily: "system-ui", maxWidth: 480 }}>
            Engage with the latest Aurelia post on X. Each action earns you stars and moves you up the priority list — permanently.
          </p>
        </div>

        {/* Progress summary */}
        <div style={{
          background: "#fafaf8",
          border: "1px solid rgba(0,0,0,0.07)",
          borderRadius: 16,
          padding: "20px 24px",
          marginBottom: 32,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontFamily: "system-ui", fontSize: 12, color: "#999", letterSpacing: 0.5 }}>
              PROGRESS
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: "#111" }}>
                {totalEarned}
              </span>
              <span style={{ fontSize: 12, color: "#bbb", fontFamily: "system-ui" }}>/ {totalEarnable} stars</span>
              <Sparkle size={12} />
            </div>
          </div>
          <div style={{ height: 5, background: "#ebebeb", borderRadius: 100, overflow: "hidden" }}>
            <div
              className="progress-bar-fill"
              style={{ width: `${(totalEarned / totalEarnable) * 100}%` }}
            />
          </div>
          {allDone && (
            <p style={{ marginTop: 12, fontSize: 12, color: ASSETS.colors.gold, fontFamily: "system-ui", animation: "fadeUp 0.4s ease" }}>
              ✦ All tasks complete — you've earned {totalEarnable} bonus stars!
            </p>
          )}
        </div>

        {/* Task cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {SOCIAL_BOOST_TASKS.map((task) => {
            const done    = completedTasks.includes(task.id);
            const loading = taskLoading === task.id;

            return (
              <div
                key={task.id}
                className={`boost-card${done ? " done" : ""}`}
                onClick={() => !done && !loading && handleTask(task.id, task.stars, task.href)}
              >
                {/* Left: icon + text */}
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: 12,
                    background: done ? ASSETS.colors.goldLight : "#f5f5f3",
                    border: `1px solid ${done ? ASSETS.colors.goldBorder : "transparent"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: done ? ASSETS.colors.gold : "#555",
                    flexShrink: 0,
                  }}>
                    {done ? <CheckIcon /> : <TaskIcon name={task.icon} />}
                  </div>
                  <div>
                    <div style={{
                      fontSize: 14, fontWeight: 600, color: "#111",
                      fontFamily: "system-ui", marginBottom: 3,
                      textDecoration: done ? "line-through" : "none",
                    }}>
                      {task.label}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <Sparkle size={10} color={done ? ASSETS.colors.gold : "#ccc"} />
                      <span style={{ fontSize: 12, color: done ? ASSETS.colors.gold : "#aaa", fontFamily: "system-ui", fontWeight: 600 }}>
                        {done ? `+${task.stars} earned` : `+${task.stars} stars`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: CTA */}
                {!done && (
                  <button
                    className="boost-btn"
                    disabled={!!loading}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTask(task.id, task.stars, task.href);
                    }}
                  >
                    {loading
                      ? <span style={{ animation: "pulse 1s infinite" }}>…</span>
                      : (
                        <>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.259 5.63L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
                          </svg>
                          {task.cta}
                        </>
                      )}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Note */}
        <p style={{
          marginTop: 28, fontSize: 11, color: "#ccc",
          fontFamily: "system-ui", letterSpacing: 0.4, lineHeight: 1.7,
        }}>
          ✦ Each action can only be completed once. Stars are recorded permanently against your account.
        </p>
      </div>

      {/* Toast */}
      {toastMsg && <div className="toast">{toastMsg}</div>}
    </MainLayout>
  );
}
