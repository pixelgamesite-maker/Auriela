import { useEffect, useRef, useState } from "react";
import { MainLayout } from "@/layouts/main-layout";
import { useAuth } from "@/hooks/useAuth";
import { completeTask } from "@/lib/supabase";
import { ASSETS } from "@/lib/assets";

// ── Task definitions ───────────────────────────────────────────────────────────
// The tweet URL to engage with
const TWEET_URL = "https://x.com/i/status/2068350731124342966";
const PROFILE_URL = "https://x.com/aureliastudios_";

const COUNTDOWN_SECONDS = 15;

const SOCIAL_BOOST_TASKS = [
  {
    id: "social_follow",
    label: "Follow on X",
    stars: 50,
    icon: "follow",
    cta: "Follow on X",
    href: PROFILE_URL,
  },
  {
    id: "social_like",
    label: "Like the post",
    stars: 25,
    icon: "heart",
    cta: "Like on X",
    href: TWEET_URL,
  },
  {
    id: "social_comment",
    label: "Comment on the post",
    stars: 25,
    icon: "comment",
    cta: "Comment on X",
    href: TWEET_URL,
  },
  {
    id: "social_quote",
    label: "Quote tweet",
    stars: 25,
    icon: "quote",
    cta: "Quote Tweet",
    href: TWEET_URL,
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
  if (name === "follow") return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><path d="M20 8v6"/><path d="M23 11h-6"/>
    </svg>
  );
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

function XIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.259 5.63L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
    </svg>
  );
}

// ── Per-task state machine ───────────────────────────────────────────────────
// idle      → button shows the normal CTA, clickable
// counting  → button shows a locked countdown, not clickable
// done      → server confirmed completion (from completedTasks, or just now)
type TaskPhase = "idle" | "counting" | "done";

// ── Main page ──────────────────────────────────────────────────────────────────
export default function Social() {
  const { user, completedTasks, setCompletedTasks, refreshUser } = useAuth();
  const [toastMsg, setToastMsg] = useState("");

  // Tracks countdown seconds remaining per task id, only while phase === "counting"
  const [secondsLeft, setSecondsLeft] = useState<Record<string, number>>({});
  const timers = useRef<Record<string, ReturnType<typeof setInterval>>>({});

  // Clean up any running intervals on unmount
  useEffect(() => {
    return () => {
      Object.values(timers.current).forEach(clearInterval);
    };
  }, []);

  const getPhase = (taskId: string): TaskPhase => {
    if (completedTasks.includes(taskId)) return "done";
    if (secondsLeft[taskId] !== undefined) return "counting";
    return "idle";
  };

  const handleTask = (task: (typeof SOCIAL_BOOST_TASKS)[number]) => {
    if (!user) return;
    const phase = getPhase(task.id);
    if (phase !== "idle") return; // locked while counting, no-op once done

    // Open X immediately so it feels responsive
    window.open(task.href, "_blank");

    // Start the visual countdown
    setSecondsLeft((prev) => ({ ...prev, [task.id]: COUNTDOWN_SECONDS }));
    timers.current[task.id] = setInterval(() => {
      setSecondsLeft((prev) => {
        const remaining = (prev[task.id] ?? 0) - 1;
        if (remaining <= 0) {
          clearInterval(timers.current[task.id]);
          delete timers.current[task.id];
          // Fire the actual completion once the countdown finishes.
          // Star math + the "only once" guarantee both live server-side
          // in complete_task(), so this call is what actually counts —
          // the countdown above is purely a UX delay, not a security gate.
          finalizeTask(task.id, task.stars);
          const { [task.id]: _omit, ...rest } = prev;
          return rest;
        }
        return { ...prev, [task.id]: remaining };
      });
    }, 1000);
  };

  const finalizeTask = async (taskId: string, stars: number) => {
    const result = await completeTask(user!.id, taskId, stars);
    if (result.ok) {
      setCompletedTasks([...completedTasks, taskId]);
      await refreshUser();
      setToastMsg(`+${stars} stars earned ✦`);
      setTimeout(() => setToastMsg(""), 3000);
    }
    // If result.ok is false (e.g. already completed in another tab,
    // or a stale session), we simply don't mark it done client-side —
    // completedTasks will catch up to the true server state on next
    // refreshUser()/page load.
  };

  return (
    <MainLayout>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&display=swap');

        @keyframes fadeUp  { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:.4} }

        .boost-row {
          background: #fff;
          border: 1px solid rgba(0,0,0,0.07);
          border-radius: 14px;
          padding: 16px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          transition: box-shadow 0.2s, border-color 0.2s;
        }
        .boost-row:hover:not(.done) {
          box-shadow: 0 4px 24px rgba(0,0,0,0.07);
          border-color: rgba(201,168,76,0.3);
        }
        .boost-row.done { opacity: 0.55; }

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
          min-width: 128px;
          justify-content: center;
        }
        .boost-btn:hover:not(:disabled) { background: #333; }
        .boost-btn:disabled {
          cursor: default;
        }
        .boost-btn.counting {
          background: #e8e8e6;
          color: #999;
        }
        .boost-btn.done-btn {
          background: #ececea;
          color: #aaa;
        }

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
            Engage with Aurelia on X. Each action earns you stars and moves you up the priority list — permanently.
          </p>
        </div>

        {/* Task rows */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {SOCIAL_BOOST_TASKS.map((task) => {
            const phase = getPhase(task.id);
            const done = phase === "done";
            const counting = phase === "counting";
            const remaining = secondsLeft[task.id];

            return (
              <div key={task.id} className={`boost-row${done ? " done" : ""}`}>
                {/* Left: icon + text */}
                <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
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
                  <div style={{ minWidth: 0 }}>
                    <div style={{
                      fontSize: 14, fontWeight: 600, color: "#111",
                      fontFamily: "system-ui", marginBottom: 3,
                      textDecoration: done ? "line-through" : "none",
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
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

                {/* Right: CTA / countdown / done */}
                <button
                  className={`boost-btn${counting ? " counting" : ""}${done ? " done-btn" : ""}`}
                  disabled={counting || done}
                  onClick={() => handleTask(task)}
                >
                  {done ? (
                    <>
                      <CheckIcon /> Done
                    </>
                  ) : counting ? (
                    <>{remaining}s…</>
                  ) : (
                    <>
                      <XIcon /> {task.cta}
                    </>
                  )}
                </button>
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
