import { useEffect, useState, useCallback } from "react";
import { applyWhitelist } from "@/lib/supabase";

// ── Constants ──────────────────────────────────────────────────────────────────
export const WL_LS_KEY = "aurelia_wl_applied";

const AURELIA_X    = "https://x.com/Aureliastudios_";
const AURELIA_POST = "https://x.com/i/status/2068350731124342966";

// ── CSS vars + keyframes injected so the modal works outside MainLayout ────────
const MODAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&display=swap');

  :root {
    --bg:           #0a0a0a;
    --panel:        #111111;
    --surface:      #161616;
    --border:       rgba(255,255,255,0.08);
    --gold:         #c9a96e;
    --gold-light:   rgba(201,169,110,0.10);
    --gold-border:  rgba(201,169,110,0.30);
    --gold-glow:    rgba(201,169,110,0.06);
    --text-main:    #f0ece4;
    --text-muted:   rgba(240,236,228,0.45);
  }

  @keyframes fadeUp  { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
  @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:.35} }
`;

// ── Sparkle icon ───────────────────────────────────────────────────────────────
function Sparkle({ size = 14, color = "var(--gold)" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={{ flexShrink: 0, display: "inline-block" }}>
      <path d="M12 2 L13.2 10.8 L22 12 L13.2 13.2 L12 22 L10.8 13.2 L2 12 L10.8 10.8 Z" />
    </svg>
  );
}

// ── Field ──────────────────────────────────────────────────────────────────────
function Field({
  label, value, onChange, placeholder, error, as = "input", rows = 3, onBlur, onKeyDown,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; error?: string; as?: "input" | "textarea";
  rows?: number; onBlur?: () => void; onKeyDown?: (e: React.KeyboardEvent) => void;
}) {
  const shared: React.CSSProperties = {
    width: "100%", background: "var(--bg)",
    border: `1px solid ${error ? "#c44" : "var(--border)"}`,
    borderRadius: 10, color: "var(--text-main)", fontSize: 13,
    padding: "12px 14px", fontFamily: "system-ui, sans-serif",
    resize: "none", display: "block", outline: "none",
    transition: "border-color 0.2s",
    boxSizing: "border-box",
  };
  return (
    <div style={{ marginBottom: 4 }}>
      {label && (
        <label style={{
          display: "block", fontSize: 10, fontWeight: 600,
          color: "var(--text-muted)", marginBottom: 8,
          letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "system-ui",
        }}>{label}</label>
      )}
      {as === "textarea"
        ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows} style={shared} onBlur={onBlur} onKeyDown={onKeyDown} />
        : <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={shared} onBlur={onBlur} onKeyDown={onKeyDown} />
      }
      {error && <p style={{ color: "#c44", fontSize: 12, marginTop: 6, fontFamily: "system-ui" }}>{error}</p>}
    </div>
  );
}

// ── TaskCard ───────────────────────────────────────────────────────────────────
function TaskCard({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <div style={{
      animation: `fadeUp 0.5s ease both`, animationDelay: `${delay}ms`,
      background: "var(--panel)", border: `1px solid var(--border)`,
      borderRadius: 14, padding: "20px 22px",
    }}>
      {children}
    </div>
  );
}

// ── TaskHeader ─────────────────────────────────────────────────────────────────
function TaskHeader({ num, title, subtitle, done }: { num: string; title: string; subtitle: string; done: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: done ? 0 : 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: done ? "var(--gold-light)" : "var(--bg)",
          border: `1px solid ${done ? "var(--gold-border)" : "var(--border)"}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 11, fontWeight: 700,
          color: done ? "var(--gold)" : "var(--text-muted)",
          fontFamily: "system-ui", flexShrink: 0,
        }}>
          {done ? <Sparkle size={12} /> : num}
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: done ? "var(--gold)" : "var(--text-main)", fontFamily: "system-ui" }}>{title}</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2, fontFamily: "system-ui" }}>{subtitle}</div>
        </div>
      </div>
      {done && (
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 4,
          background: "var(--gold-light)", border: `1px solid var(--gold-border)`,
          borderRadius: 6, padding: "3px 10px", fontSize: 9,
          fontWeight: 700, color: "var(--gold)", letterSpacing: "0.08em",
          textTransform: "uppercase", fontFamily: "system-ui",
        }}>
          <Sparkle size={8} /> Done
        </span>
      )}
    </div>
  );
}

// ── StepButton ─────────────────────────────────────────────────────────────────
function StepButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%", padding: "11px 0",
        background: "var(--gold-light)", border: `1px solid var(--gold-border)`,
        borderRadius: 10, color: "var(--gold)",
        fontFamily: "system-ui", fontWeight: 600, fontSize: 12, cursor: "pointer",
        letterSpacing: "0.04em", transition: "all 0.2s",
      }}
      onMouseEnter={e => { e.currentTarget.style.background = "var(--gold)"; e.currentTarget.style.color = "var(--bg)"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "var(--gold-light)"; e.currentTarget.style.color = "var(--gold)"; }}
    >
      {label}
    </button>
  );
}

// ── WhitelistModal ─────────────────────────────────────────────────────────────
export function WhitelistModal({ onClose, prefillHandle = "" }: { onClose: () => void; prefillHandle?: string }) {
  // ── LocalStorage guard: if already submitted, show success immediately ────
  const alreadySubmitted = !!localStorage.getItem(WL_LS_KEY);

  const [xUsername,     setXUsername]     = useState(prefillHandle);
  const [quoteLink,     setQuoteLink]     = useState("");
  const [commentLink,   setCommentLink]   = useState("");
  const [wallet,        setWallet]        = useState("");

  const [usernameLocked,  setUsernameLocked]  = useState(!!prefillHandle);
  const [followDone,      setFollowDone]      = useState(false);
  const [likeQuoteDone,   setLikeQuoteDone]   = useState(false);
  const [commentDone,     setCommentDone]     = useState(false);

  const [errors,     setErrors]     = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted,  setSubmitted]  = useState(alreadySubmitted);

  const step2 = usernameLocked;
  const step3 = step2 && followDone;
  const step4 = step3 && likeQuoteDone;
  const step5 = step4 && commentDone;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const openAndMark = useCallback((url: string, onDone: () => void) => {
    window.open(url, "_blank", "noopener,noreferrer");
    setTimeout(onDone, 1200);
  }, []);

  const validate = useCallback(() => {
    const e: Record<string, string> = {};
    if (!xUsername.trim())    e.xUsername   = "Enter your X username.";
    if (!followDone)          e.follow      = "Follow @Aureliastudios_ first.";
    if (!likeQuoteDone)       e.likeQuote   = "Like and quote the post first.";
    if (!quoteLink.trim())    e.quoteLink   = "Paste your quote link.";
    if (!commentDone)         e.comment     = "Submit a comment first.";
    if (!commentLink.trim())  e.commentLink = "Paste your comment link.";
    if (!wallet.trim())       e.wallet      = "Enter your EVM wallet address.";
    else if (!/^0x[a-fA-F0-9]{40}$/.test(wallet.trim())) e.wallet = "Invalid address — must be 0x + 40 hex chars.";
    return e;
  }, [xUsername, followDone, likeQuoteDone, quoteLink, commentDone, commentLink, wallet]);

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    setErrors({});
    setSubmitting(true);
    try {
      await applyWhitelist({
        x_username:      xUsername.trim().replace(/^@/, ""),
        wallet:          wallet.trim(),
        quote_link:      quoteLink.trim(),
        comment_link:    commentLink.trim(),
        follow_done:     followDone,
        like_quote_done: likeQuoteDone,
        comment_done:    commentDone,
      });
      localStorage.setItem(WL_LS_KEY, "1");
      setSubmitted(true);
    } catch (err: any) {
      const msg = err?.message || "";
      if (msg.includes("aurelia_whitelist_wallet_unique")) {
        setErrors({ submit: "This wallet is already on the whitelist." });
      } else if (msg.includes("aurelia_whitelist_x_username_unique")) {
        setErrors({ submit: "This X username is already on the whitelist." });
      } else {
        setErrors({ submit: msg || "Something went wrong. Try again." });
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ── Success state (also shown on re-open after submit) ──────────────────
  if (submitted) {
    return (
      <>
        <style>{MODAL_STYLES}</style>
        <div style={{
          background: "var(--panel)", borderRadius: 18, border: `1px solid var(--border)`,
          padding: "40px 32px", textAlign: "center", maxWidth: 420, width: "100%",
          animation: "fadeUp 0.4s ease",
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: "var(--gold-light)", border: `1px solid var(--gold-border)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 20px",
          }}>
            <Sparkle size={24} />
          </div>
          <h3 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-main)", marginBottom: 8, fontFamily: "'Playfair Display', serif" }}>
            Application Received
          </h3>
          <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.7, fontFamily: "system-ui" }}>
            Your whitelist spot is secured. Collect Stars and climb the leaderboard to upgrade to GTD.
          </p>
          <button
            onClick={onClose}
            style={{
              marginTop: 24, padding: "10px 28px",
              background: "var(--gold-light)", border: `1px solid var(--gold-border)`,
              borderRadius: 10, color: "var(--gold)",
              fontFamily: "system-ui", fontWeight: 600, fontSize: 12, cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>
      </>
    );
  }

  // ── Form ────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{MODAL_STYLES}</style>
      <div style={{
        background: "var(--panel)", borderRadius: 18, border: `1px solid var(--border)`,
        padding: "28px 24px", maxWidth: 480, width: "100%",
        maxHeight: "85vh", overflowY: "auto", position: "relative",
        boxSizing: "border-box",
      }}>
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: "absolute", top: 14, right: 14,
            background: "transparent", border: "none",
            color: "var(--text-muted)", fontSize: 20, cursor: "pointer",
            width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center",
            borderRadius: 8, transition: "all 0.2s", fontFamily: "system-ui",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "var(--gold-light)")}
          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
        >
          ✕
        </button>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <p style={{
            fontSize: 10, fontWeight: 700, color: "var(--gold)",
            letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 8, fontFamily: "system-ui",
          }}>
            Whitelist Application
          </p>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-main)", marginBottom: 6, fontFamily: "'Playfair Display', serif" }}>
            Secure Your Spot
          </h2>
          <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6, fontFamily: "system-ui" }}>
            Complete each step. The next unlocks when you finish the last.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {/* Step 1 — X username */}
          <TaskCard delay={0}>
            <TaskHeader num="01" title="Your X username" subtitle="So we know who you are" done={usernameLocked} />
            {!usernameLocked && (
              <Field
                label=""
                value={xUsername}
                onChange={v => { setXUsername(v); setErrors(e => ({ ...e, xUsername: "" })); }}
                placeholder="@yourhandle"
                error={errors.xUsername}
                onBlur={() => { if (xUsername.trim()) setUsernameLocked(true); }}
                onKeyDown={e => { if (e.key === "Enter" && xUsername.trim()) setUsernameLocked(true); }}
              />
            )}
          </TaskCard>

          {/* Step 2 — Follow */}
          {step2 && (
            <TaskCard delay={60}>
              <TaskHeader num="02" title="Follow @Aureliastudios_" subtitle="Join the community" done={followDone} />
              {!followDone && (
                <>
                  <StepButton label="Follow on X →" onClick={() => openAndMark(AURELIA_X, () => setFollowDone(true))} />
                  {errors.follow && <p style={{ color: "#c44", fontSize: 12, marginTop: 8, fontFamily: "system-ui" }}>{errors.follow}</p>}
                </>
              )}
            </TaskCard>
          )}

          {/* Step 3 — Like & Quote */}
          {step3 && (
            <TaskCard delay={60}>
              <TaskHeader num="03" title="Like & Quote Tweet" subtitle="Engage with the pinned post" done={likeQuoteDone} />
              {!likeQuoteDone && (
                <div style={{ marginBottom: 12 }}>
                  <StepButton label="View Post →" onClick={() => openAndMark(AURELIA_POST, () => setLikeQuoteDone(true))} />
                </div>
              )}
              <Field
                label="Paste your quote link"
                value={quoteLink}
                onChange={v => { setQuoteLink(v); setErrors(e => ({ ...e, quoteLink: "" })); }}
                placeholder="https://x.com/..."
                error={errors.quoteLink}
              />
            </TaskCard>
          )}

          {/* Step 4 — Comment */}
          {step4 && (
            <TaskCard delay={60}>
              <TaskHeader num="04" title="Comment & tag 2 frens" subtitle="Reply and mention 2 people" done={commentDone} />
              {!commentDone && (
                <div style={{ marginBottom: 12 }}>
                  <StepButton label="Go to Post on X →" onClick={() => openAndMark(AURELIA_POST, () => setCommentDone(true))} />
                </div>
              )}
              <Field
                label="Paste your comment link"
                value={commentLink}
                onChange={v => { setCommentLink(v); setErrors(e => ({ ...e, commentLink: "" })); }}
                placeholder="https://x.com/..."
                error={errors.commentLink}
              />
            </TaskCard>
          )}

          {/* Step 5 — Wallet */}
          {step5 && (
            <TaskCard delay={60}>
              <TaskHeader num="05" title="EVM Wallet Address" subtitle="Where your spot will be reserved" done={false} />
              <Field
                label=""
                value={wallet}
                onChange={v => { setWallet(v); setErrors(e => ({ ...e, wallet: "" })); }}
                placeholder="0x..."
                error={errors.wallet}
              />
            </TaskCard>
          )}

          {/* Submit */}
          {step5 && (
            <div style={{ animation: "fadeUp 0.5s ease both", animationDelay: "80ms", marginTop: 4 }}>
              {errors.submit && (
                <p style={{ color: "#c44", fontSize: 13, marginBottom: 12, textAlign: "center", fontFamily: "system-ui" }}>{errors.submit}</p>
              )}
              <button
                onClick={handleSubmit}
                disabled={submitting}
                style={{
                  width: "100%", padding: "14px",
                  background: "var(--gold)", borderRadius: 12,
                  border: "none", color: "var(--bg)",
                  fontFamily: "system-ui", fontWeight: 700, fontSize: 13,
                  letterSpacing: "0.06em", textTransform: "uppercase",
                  cursor: submitting ? "not-allowed" : "pointer",
                  opacity: submitting ? 0.6 : 1, transition: "all 0.2s",
                }}
              >
                {submitting ? "Securing your spot…" : "Secure My Spot"}
              </button>
              <p style={{ textAlign: "center", fontSize: 11, color: "var(--text-muted)", marginTop: 10, fontFamily: "system-ui" }}>
                Double-check your wallet before submitting.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
