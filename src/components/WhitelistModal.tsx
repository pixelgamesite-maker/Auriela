import { useEffect, useState, useCallback } from "react";
import { applyWhitelist } from "@/lib/supabase";

// ── Constants ──────────────────────────────────────────────────────────────────
export const WL_LS_KEY = "aurelia_wl_applied";

const AURELIA_X    = "https://x.com/Aureliastudios_";
const AURELIA_POST = "https://x.com/i/status/2068350731124342966";

const NUMERALS = ["I", "II", "III", "IV", "V"];

// ── CSS vars + keyframes injected so the modal works outside MainLayout ────────
const MODAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400;1,700&display=swap');

  :root {
    --bg:           #0a0a0a;
    --panel:        #111111;
    --surface:      #161616;
    --border:       rgba(255,255,255,0.08);
    --gold:         #c9a96e;
    --bronze:       #8b6f47;
    --gold-light:   rgba(201,169,110,0.10);
    --gold-border:  rgba(201,169,110,0.30);
    --gold-glow:    rgba(201,169,110,0.16);
    --text-main:    #f0ece4;
    --text-muted:   rgba(240,236,228,0.45);
  }

  @keyframes fadeUp  { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
  @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:.35} }
  @keyframes draw    { from { stroke-dashoffset: 20; } to { stroke-dashoffset: 0; } }

  @media (prefers-reduced-motion: reduce) {
    .aurelia-wl-modal * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
  }
`;

// ── Seal marker — the signature element of the stepper ─────────────────────────
// A wax-seal style marker: a hollow numeral disc while pending, a struck
// bronze/gold seal with an engraved check once the step is complete.
function SealMarker({ filled, numeral, size = 30 }: { filled: boolean; numeral: string; size?: number }) {
  return (
    <div
      style={{
        width: size, height: size, borderRadius: "50%", flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: filled ? "linear-gradient(135deg, var(--gold), var(--bronze))" : "var(--bg)",
        border: `1px solid ${filled ? "var(--gold)" : "var(--border)"}`,
        boxShadow: filled ? "0 0 0 3px var(--gold-glow)" : "none",
        transition: "background 0.4s ease, border-color 0.4s ease, box-shadow 0.4s ease",
      }}
    >
      {filled ? (
        <svg width={13} height={10} viewBox="0 0 16 12" fill="none">
          <path
            d="M1 6.5L6 11L15 1"
            stroke="var(--bg)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ strokeDasharray: 20, animation: "draw 0.4s ease" }}
          />
        </svg>
      ) : (
        <span style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic", fontSize: 12, color: "var(--text-muted)" }}>
          {numeral}
        </span>
      )}
    </div>
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
    borderRadius: 6, color: "var(--text-main)", fontSize: 13,
    padding: "11px 13px", fontFamily: "system-ui, sans-serif",
    resize: "none", display: "block", outline: "none",
    transition: "border-color 0.2s",
    boxSizing: "border-box",
  };
  return (
    <div style={{ marginBottom: 4 }}>
      {label && (
        <label style={{
          display: "block", fontSize: 11, fontStyle: "italic",
          color: "var(--text-muted)", marginBottom: 7,
          fontFamily: "'Playfair Display', serif",
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

// ── Step — seal marker + connecting thread + content, replaces the old   ──────
// numbered-square-card-with-DONE-pill pattern with a continuous ledger rail.
function Step({
  numeral, title, subtitle, done, last = false, children,
}: {
  numeral: string; title: string; subtitle?: string; done: boolean; last?: boolean; children?: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", gap: 14, animation: "fadeUp 0.45s ease both" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 30, flexShrink: 0 }}>
        <SealMarker filled={done} numeral={numeral} />
        {!last && (
          <div style={{
            width: 1, flex: 1, minHeight: 26, marginTop: 6,
            background: done ? "var(--gold-border)" : "var(--border)",
            transition: "background 0.4s ease",
          }} />
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0, paddingBottom: last ? 2 : 22 }}>
        <h4 style={{
          margin: 0, fontFamily: "'Playfair Display', serif", fontStyle: "italic",
          fontSize: 16, fontWeight: 700, color: done ? "var(--gold)" : "var(--text-main)",
          transition: "color 0.3s ease",
        }}>
          {title}
        </h4>
        {subtitle && (
          <p style={{ margin: "2px 0 12px", fontSize: 11.5, color: "var(--text-muted)", fontFamily: "system-ui" }}>
            {subtitle}
          </p>
        )}
        {children}
      </div>
    </div>
  );
}

// ── StepAction — an understated underline link, not another filled pill ───────
function StepAction({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex", alignItems: "center", gap: 8,
        background: "transparent", border: "none", borderBottom: "1px solid var(--gold-border)",
        color: "var(--gold)", fontFamily: "system-ui", fontWeight: 600, fontSize: 12,
        letterSpacing: "0.04em", cursor: "pointer", padding: "6px 0", marginBottom: 12,
        transition: "border-color 0.2s",
      }}
      onMouseEnter={e => (e.currentTarget.style.borderBottomColor = "var(--gold)")}
      onMouseLeave={e => (e.currentTarget.style.borderBottomColor = "var(--gold-border)")}
    >
      {label}
      <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
        <path d="M3 8h10M9 4l4 4-4 4" stroke="var(--gold)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
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
        <div className="aurelia-wl-modal" style={{
          background: "var(--panel)", borderRadius: 18, border: `1px solid var(--border)`,
          padding: "40px 32px", textAlign: "center", maxWidth: 420, width: "100%",
          animation: "fadeUp 0.4s ease",
        }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
            <SealMarker filled numeral="" size={56} />
          </div>
          <h3 style={{ fontSize: 22, fontWeight: 700, fontStyle: "italic", color: "var(--text-main)", marginBottom: 8, fontFamily: "'Playfair Display', serif" }}>
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
      <div className="aurelia-wl-modal" style={{
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
        <div style={{ textAlign: "center", marginBottom: 26 }}>
          <p style={{
            fontSize: 10, fontWeight: 700, color: "var(--gold)",
            letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 8, fontFamily: "system-ui",
          }}>
            Whitelist Application
          </p>
          <h2 style={{ fontSize: 22, fontWeight: 700, fontStyle: "italic", color: "var(--text-main)", marginBottom: 6, fontFamily: "'Playfair Display', serif" }}>
            Secure Your Spot
          </h2>
          <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6, fontFamily: "system-ui" }}>
            A short dossier — five entries, in order.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          {/* Step I — X username */}
          <Step numeral={NUMERALS[0]} title="Your X username" subtitle="So we know who you are" done={usernameLocked} last={!step2}>
            {!usernameLocked ? (
              <Field
                label=""
                value={xUsername}
                onChange={v => { setXUsername(v); setErrors(e => ({ ...e, xUsername: "" })); }}
                placeholder="@yourhandle"
                error={errors.xUsername}
                onBlur={() => { if (xUsername.trim()) setUsernameLocked(true); }}
                onKeyDown={e => { if (e.key === "Enter" && xUsername.trim()) setUsernameLocked(true); }}
              />
            ) : (
              <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted)", fontFamily: "system-ui" }}>
                Filed as <span style={{ color: "var(--gold)" }}>@{xUsername.trim().replace(/^@/, "")}</span>
              </p>
            )}
          </Step>

          {/* Step II — Follow */}
          {step2 && (
            <Step numeral={NUMERALS[1]} title="Follow @Aureliastudios_" subtitle="Join the community" done={followDone} last={!step3}>
              {!followDone && (
                <>
                  <div><StepAction label="Follow on X" onClick={() => openAndMark(AURELIA_X, () => setFollowDone(true))} /></div>
                  {errors.follow && <p style={{ color: "#c44", fontSize: 12, marginTop: -4, fontFamily: "system-ui" }}>{errors.follow}</p>}
                </>
              )}
            </Step>
          )}

          {/* Step III — Like & Quote */}
          {step3 && (
            <Step numeral={NUMERALS[2]} title="Like & quote tweet" subtitle="Engage with the pinned post" done={likeQuoteDone} last={!step4}>
              {!likeQuoteDone && (
                <div><StepAction label="View post" onClick={() => openAndMark(AURELIA_POST, () => setLikeQuoteDone(true))} /></div>
              )}
              <Field
                label="Paste your quote link"
                value={quoteLink}
                onChange={v => { setQuoteLink(v); setErrors(e => ({ ...e, quoteLink: "" })); }}
                placeholder="https://x.com/..."
                error={errors.quoteLink}
              />
            </Step>
          )}

          {/* Step IV — Comment */}
          {step4 && (
            <Step numeral={NUMERALS[3]} title="Comment & tag 2 frens" subtitle="Reply and mention 2 people" done={commentDone} last={!step5}>
              {!commentDone && (
                <div><StepAction label="Go to post on X" onClick={() => openAndMark(AURELIA_POST, () => setCommentDone(true))} /></div>
              )}
              <Field
                label="Paste your comment link"
                value={commentLink}
                onChange={v => { setCommentLink(v); setErrors(e => ({ ...e, commentLink: "" })); }}
                placeholder="https://x.com/..."
                error={errors.commentLink}
              />
            </Step>
          )}

          {/* Step V — Wallet */}
          {step5 && (
            <Step numeral={NUMERALS[4]} title="EVM wallet address" subtitle="Where your spot will be reserved" done={false} last>
              <Field
                label=""
                value={wallet}
                onChange={v => { setWallet(v); setErrors(e => ({ ...e, wallet: "" })); }}
                placeholder="0x..."
                error={errors.wallet}
              />
            </Step>
          )}
        </div>

        {/* Submit */}
        {step5 && (
          <div style={{ animation: "fadeUp 0.5s ease both", animationDelay: "80ms", marginTop: 8 }}>
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
    </>
  );
}
