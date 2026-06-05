import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { signInWithX, signOut } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Star, LogOut, Menu, X as XIcon } from "lucide-react";
import { ASSETS } from "@/assets";

const NAV_LINKS = [
  { label: "About",       href: "/about" },
  { label: "Lore",        href: "/lore" },
  { label: "Tasks",       href: "/" },
  { label: "Leaderboard", href: "/leaderboard" },
];

export function MainLayout({ children }: { children: ReactNode }) {
  const [location]        = useLocation();
  const { user, loading } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Close mobile menu on route change
  useEffect(() => { setMenuOpen(false); }, [location]);

  // Elevate navbar on scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const isActive = (href: string) => location === href;

  return (
    <div style={{
      minHeight: "100vh",
      background: ASSETS.colors.bg,
      fontFamily: "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Cormorant+Garamond:wght@300;400;600&display=swap');

        /* ── Nav link hover ─────────────────────────── */
        .nav-link { transition: color 0.2s; }
        .nav-link:hover { color: #111 !important; }

        /* ── Mobile drawer ──────────────────────────── */
        .mobile-drawer {
          position: fixed; inset: 0; z-index: 200;
          display: flex; flex-direction: column;
          background: ${ASSETS.colors.bg};
          transform: translateX(100%);
          transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .mobile-drawer.open { transform: translateX(0); }

        /* ── Mobile nav link ────────────────────────── */
        .mobile-nav-link {
          display: block; padding: 22px 40px;
          font-family: 'Playfair Display', serif;
          font-size: 28px; font-weight: 400;
          text-decoration: none; color: #555;
          border-bottom: 1px solid rgba(0,0,0,0.05);
          transition: color 0.2s, background 0.2s;
          letter-spacing: 1px;
        }
        .mobile-nav-link.active { color: #111; font-weight: 700; }
        .mobile-nav-link:hover  { color: #111; background: rgba(201,168,76,0.04); }

        /* ── Hamburger button ───────────────────────── */
        .hamburger-btn {
          display: none;
          background: transparent;
          border: 1px solid rgba(0,0,0,0.12);
          border-radius: 8px;
          padding: 7px 9px;
          cursor: pointer;
          color: #111;
          transition: border-color 0.2s, background 0.2s;
        }
        .hamburger-btn:hover { background: rgba(0,0,0,0.04); }

        /* ── Responsive breakpoint ──────────────────── */
        @media (max-width: 768px) {
          .desktop-links { display: none !important; }
          .hamburger-btn { display: flex !important; align-items: center; justify-content: center; }
        }
        @media (min-width: 769px) {
          .mobile-drawer { display: none !important; }
        }
      `}</style>

      {/* ══ NAVBAR ══════════════════════════════════════════════════════════ */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 clamp(20px, 5vw, 56px)", height: 68,
        background: scrolled
          ? "rgba(248,247,244,0.97)"
          : "rgba(248,247,244,0.92)",
        backdropFilter: "blur(20px)",
        borderBottom: scrolled
          ? "1px solid rgba(0,0,0,0.09)"
          : "1px solid rgba(0,0,0,0.05)",
        transition: "box-shadow 0.3s, border-color 0.3s, background 0.3s",
        boxShadow: scrolled ? "0 2px 24px rgba(0,0,0,0.06)" : "none",
      }}>

        {/* Logo */}
        <Link href="/">
          <a style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <img
              src={ASSETS.images.logo}
              alt="Aurelia"
              style={{ height: 28 }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
            <span style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 18, letterSpacing: 5, fontWeight: 700, color: "#111",
            }}>
              {ASSETS.brand.name}
            </span>
          </a>
        </Link>

        {/* ── Desktop center links ─────────────────────────────────────────── */}
        <div
          className="desktop-links"
          style={{ display: "flex", gap: 36, fontSize: 13, letterSpacing: 1.5 }}
        >
          {NAV_LINKS.map(({ label, href }) => (
            <Link key={label} href={href}>
              <a
                className="nav-link"
                style={{
                  textDecoration: "none",
                  color: isActive(href) ? "#111" : "#888",
                  fontWeight: isActive(href) ? 700 : 400,
                  fontFamily: "system-ui, sans-serif",
                  fontSize: 13,
                  letterSpacing: 1.5,
                }}
              >
                {label}
              </a>
            </Link>
          ))}
        </div>

        {/* ── Desktop right: auth ──────────────────────────────────────────── */}
        <div className="desktop-links" style={{ display: "flex" }}>
          <AuthArea user={user} loading={loading} />
        </div>

        {/* ── Mobile right: stars pill + hamburger ─────────────────────────── */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Star count pill (mobile only, shown when logged in) */}
          {user && (
            <div style={{
              display: "flex", alignItems: "center", gap: 5,
              background: ASSETS.colors.goldLight,
              border: `1px solid ${ASSETS.colors.goldBorder}`,
              borderRadius: 99, padding: "5px 12px",
            }}>
              <Star size={12} style={{ color: ASSETS.colors.gold, fill: ASSETS.colors.gold }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: "#111", fontFamily: "system-ui" }}>
                {user.stars.toLocaleString()}
              </span>
            </div>
          )}

          <button
            className="hamburger-btn"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {menuOpen
              ? <XIcon size={20} />
              : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* ══ MOBILE DRAWER ═══════════════════════════════════════════════════ */}
      <div className={`mobile-drawer${menuOpen ? " open" : ""}`}>
        {/* Drawer header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 24px", height: 68,
          borderBottom: "1px solid rgba(0,0,0,0.06)",
        }}>
          <span style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 18, letterSpacing: 5, fontWeight: 700, color: "#111",
          }}>
            {ASSETS.brand.name}
          </span>
          <button
            onClick={() => setMenuOpen(false)}
            style={{
              background: "transparent", border: "none",
              cursor: "pointer", color: "#555", padding: 6,
            }}
            aria-label="Close menu"
          >
            <XIcon size={22} />
          </button>
        </div>

        {/* Nav links */}
        <nav style={{ flex: 1, overflowY: "auto" }}>
          {NAV_LINKS.map(({ label, href }) => (
            <Link key={label} href={href}>
              <a
                className={`mobile-nav-link${isActive(href) ? " active" : ""}`}
                onClick={() => setMenuOpen(false)}
              >
                {label}
              </a>
            </Link>
          ))}
        </nav>

        {/* Drawer footer — auth */}
        <div style={{
          padding: "28px 40px",
          borderTop: "1px solid rgba(0,0,0,0.06)",
        }}>
          <AuthArea user={user} loading={loading} mobile />
        </div>

        {/* Gold sparkle decoration */}
        <div style={{
          position: "absolute", bottom: 120, right: 32,
          fontSize: 48, color: ASSETS.colors.gold, opacity: 0.08,
          pointerEvents: "none", fontFamily: "serif",
        }}>✦</div>
      </div>

      {/* ══ PAGE CONTENT ════════════════════════════════════════════════════ */}
      <main style={{ paddingTop: 68 }}>
        {children}
      </main>

      {/* ══ FOOTER ══════════════════════════════════════════════════════════ */}
      <footer style={{
        textAlign: "center", padding: "32px 24px",
        borderTop: "1px solid rgba(0,0,0,0.07)",
        fontSize: 12, color: "#aaa",
        fontFamily: "system-ui",
        letterSpacing: 1.5,
      }}>
        ✦ {ASSETS.brand.name} © {new Date().getFullYear()} ✦
      </footer>
    </div>
  );
}

// ── Auth area (shared by desktop + mobile drawer) ─────────────────────────────
function AuthArea({
  user,
  loading,
  mobile = false,
}: {
  user: any;
  loading: boolean;
  mobile?: boolean;
}) {
  if (loading) return null;

  if (user) {
    return (
      <div style={{
        display: "flex",
        flexDirection: mobile ? "column" : "row",
        alignItems: mobile ? "flex-start" : "center",
        gap: mobile ? 16 : 14,
      }}>
        {/* User info */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {user.x_avatar && (
            <img
              src={user.x_avatar}
              alt={user.x_handle}
              style={{
                width: mobile ? 40 : 32, height: mobile ? 40 : 32,
                borderRadius: "50%",
                border: `1px solid ${ASSETS.colors.goldBorder}`,
              }}
            />
          )}
          {mobile && (
            <div>
              <div style={{ fontFamily: "system-ui", fontWeight: 700, fontSize: 14, color: "#111" }}>
                {user.x_handle}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                <Star size={11} style={{ color: ASSETS.colors.gold, fill: ASSETS.colors.gold }} />
                <span style={{ fontFamily: "system-ui", fontSize: 12, color: "#666" }}>
                  {user.stars.toLocaleString()} stars
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Sign out */}
        <button
          onClick={() => signOut()}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "transparent",
            border: "1px solid rgba(0,0,0,0.14)",
            borderRadius: 99,
            padding: mobile ? "10px 20px" : "6px 14px",
            cursor: "pointer",
            fontSize: mobile ? 13 : 12,
            fontFamily: "system-ui",
            color: "#666",
            transition: "border-color 0.2s, color 0.2s",
          }}
        >
          <LogOut size={mobile ? 14 : 12} />
          Sign Out
        </button>
      </div>
    );
  }

  // Logged out
  return (
    <button
      onClick={() => signInWithX()}
      style={{
        background: "#111", color: "#fff",
        border: "none", borderRadius: mobile ? 10 : 99,
        padding: mobile ? "14px 28px" : "9px 22px",
        cursor: "pointer",
        fontSize: mobile ? 14 : 13,
        fontFamily: "system-ui",
        letterSpacing: 0.4,
        display: "flex", alignItems: "center", gap: 8,
        width: mobile ? "100%" : "auto",
        justifyContent: "center",
        transition: "background 0.2s",
      }}
    >
      ✦ Connect with X
    </button>
  );
}
