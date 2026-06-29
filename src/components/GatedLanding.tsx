import { useState } from "react";
import { ASSETS } from "@/lib/assets";
import { WhitelistModal, WL_LS_KEY } from "@/components/WhitelistModal";

interface GatedLandingProps {
  onSignIn: () => void;
}

// ── Gated landing (logged out) ─────────────────────────────────────────────────
export function GatedLanding({ onSignIn }: GatedLandingProps) {
  const [showWlModal, setShowWlModal] = useState(false);
  const alreadyApplied = !!localStorage.getItem(WL_LS_KEY);

  return (
    <div style={{ fontFamily: "'Cormorant Garamond', 'Playfair Display', Georgia, serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Cormorant+Garamond:wght@300;400;600&display=swap');`}</style>

      <div style={{
        minHeight: "100dvh",
        background: "var(--bg)",
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
            color: "var(--gold)", opacity: 0.12,
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
            style={{ height: 80, marginBottom: 40, display: "block" }}
            onError={(e) => {
              e.currentTarget.style.display = "none";
              const fb = document.getElementById("gate-brand-fallback");
              if (fb) fb.style.display = "block";
            }}
          />
          <div id="gate-brand-fallback" style={{
            display: "none",
            fontFamily: "'Playfair Display', serif",
            fontSize: 36, letterSpacing: 8, fontWeight: 700, color: "var(--text-main)", marginBottom: 40,
          }}>
            {ASSETS.brand.name}
          </div>

          {/* ── WL Button (top) — 3D shadow so it looks like a real button ── */}
          <button
            onClick={() => setShowWlModal(true)}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              background: alreadyApplied ? "var(--gold-light)" : "var(--gold)",
              color: alreadyApplied ? "var(--gold)" : "var(--bg)",
              border: `1.5px solid var(--gold)`,
              borderRadius: 100,
              padding: "14px 32px", fontSize: 13,
              cursor: "pointer", fontFamily: "system-ui",
              letterSpacing: 0.6, fontWeight: 700,
              textTransform: "uppercase",
              marginBottom: 12,
              transition: "transform 0.15s, box-shadow 0.15s",
              width: "100%",
              maxWidth: 280,
              boxShadow: alreadyApplied
                ? "none"
                : "0 3px 0 rgba(0,0,0,0.2), 0 6px 16px rgba(0,0,0,0.25)",
            }}
            onMouseEnter={(e) => {
              if (!alreadyApplied) {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 5px 0 rgba(0,0,0,0.2), 0 10px 28px rgba(0,0,0,0.3)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "none";
              e.currentTarget.style.boxShadow = alreadyApplied
                ? "none"
                : "0 3px 0 rgba(0,0,0,0.2), 0 6px 16px rgba(0,0,0,0.25)";
            }}
            onMouseDown={(e) => {
              if (!alreadyApplied) {
                e.currentTarget.style.transform = "translateY(1px)";
                e.currentTarget.style.boxShadow = "0 1px 0 rgba(0,0,0,0.2), 0 2px 8px rgba(0,0,0,0.2)";
              }
            }}
            onMouseUp={(e) => {
              if (!alreadyApplied) {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 5px 0 rgba(0,0,0,0.2), 0 10px 28px rgba(0,0,0,0.3)";
              }
            }}
          >
            {alreadyApplied ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                Applied for WL
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>
                Apply for Whitelist
              </>
            )}
          </button>

          {/* ── Sign in with X ── */}
          <button
            onClick={onSignIn}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              background: "var(--text-main)", color: "var(--bg)",
              border: "none", borderRadius: 100,
              padding: "14px 32px", fontSize: 14,
              cursor: "pointer", fontFamily: "system-ui",
              letterSpacing: 0.4, fontWeight: 500,
              boxShadow: "0 3px 0 rgba(0,0,0,0.2), 0 6px 16px rgba(0,0,0,0.25)",
              transition: "transform 0.15s, box-shadow 0.15s",
              width: "100%",
              maxWidth: 280,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 5px 0 rgba(0,0,0,0.2), 0 10px 28px rgba(0,0,0,0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "none";
              e.currentTarget.style.boxShadow = "0 3px 0 rgba(0,0,0,0.2), 0 6px 16px rgba(0,0,0,0.25)";
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = "translateY(1px)";
              e.currentTarget.style.boxShadow = "0 1px 0 rgba(0,0,0,0.2), 0 2px 8px rgba(0,0,0,0.2)";
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 5px 0 rgba(0,0,0,0.2), 0 10px 28px rgba(0,0,0,0.3)";
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.259 5.63L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
            </svg>
            Sign in with X
          </button>

          {/* ── Explanatory text (bottom) ── */}
          <p style={{
            marginTop: 20, fontSize: 12, color: "var(--text-muted)",
            fontFamily: "system-ui", letterSpacing: 0.3, lineHeight: 1.6,
            maxWidth: 320,
          }}>
            Sign in to collect Stars, rank on the leaderboard, and upgrade your WL to <strong style={{ color: "var(--gold)" }}>GTD</strong>.
          </p>

          <p style={{
            marginTop: 8, fontSize: 11, color: "var(--text-muted)",
            fontFamily: "system-ui", letterSpacing: 0.4,
          }}>
            ✦ {ASSETS.brand.priorityNote} ✦
          </p>
        </div>

        <style>{`
          @keyframes twinkle { 0%,100%{opacity:.12} 50%{opacity:.3} }
        `}</style>
      </div>

      {showWlModal && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 100,
            background: "rgba(0,0,0,0.95)", backdropFilter: "blur(12px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "20px", overflowY: "auto",
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowWlModal(false); }}
        >
          <WhitelistModal onClose={() => setShowWlModal(false)} />
        </div>
      )}
    </div>
  );
}
