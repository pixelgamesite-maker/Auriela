import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { signInWithX, signOut } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Star, LogOut } from "lucide-react";
import { ASSETS } from "@/lib/assets";

const NAV_LINKS = [
  { label: "About",       href: "/about" },
  { label: "Lore",        href: "/lore" },
  { label: "Tasks",       href: "/" },
  { label: "Roadmap",     href: "/roadmap" },
  { label: "FAQ",         href: "/faq" },
];

export function MainLayout({ children }: { children: ReactNode }) {
  const [location]        = useLocation();
  const { user, loading } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => { setMenuOpen(false); }, [location]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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

        * { box-sizing: border-box; }

        .nav-link { transition: color 0.2s; }
        .nav-link:hover { color: #111 !important; }

        .mobile-drawer {
          position: fixed; inset: 0; z-index: 200;
          display: flex; flex-direction: column;
          background: ${ASSETS.colors.bg};
          transform: translateX(100%);
          transition: transform 0.32s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .mobile-drawer.open { transform: translateX(0); }

        .mobile-nav-link {
          display: block; padding: 22px 40px;
          font-family: 'Playfair Display', serif;
          font-size: 28px; font-weight: 400; letter-spacing: 1px;
          text-decoration: none; color: #666;
          border-bottom: 1px solid rgba(0,0,0,0.05);
          transition: color 0.18s, background 0.18s;
        }
        .mobile-nav-link.active { color: #111; font-weight: 700; }
        .mobile-nav-link:hover  { color: #111; background: rgba(201,168,76,0.04); }

        .connect-x-btn {
          background: transparent;
          border: 1.5px solid #111;
          border-radius: 100px;
          padding: 8px 18px;
          font-size: 13px;
          font-family: system-ui, sans-serif;
          letter-spacing: 0.4px;
          cursor: pointer;
          color: #111;
          display: flex; align-items: center; gap: 7px;
          transition: background 0.2s;
          white-space: nowrap;
        }
        .connect-x-btn:hover { background: rgba(0,0,0,0.05); }

        @media (max-width: 768px) {
          .desktop-links { display: none !important; }
          .desktop-auth  { display: none !important; }
          .hamburger-btn { display: flex !important; }
        }
        @media (min-width: 769px) {
          .mobile-drawer { display: none !important; }
          .hamburger-btn { display: none !important; }
          .mobile-stars  { display: none !important; }
        }
      `}</style>

      {/* ══ NAVBAR ══════════════════════════════════════════════════════════ */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 clamp(20px, 5vw, 56px)", height: 68,
        background: scrolled ? "rgba(240,239,237,0.97)" : "rgba(240,239,237,0.92)",
        backdropFilter: "blur(20px)",
        borderBottom: `1px solid ${scrolled ? "rgba(0,0,0,0.09)" : "rgba(0,0,0,0.05)"}`,
        boxShadow: scrolled ? "0 2px 20px rgba(0,0,0,0.05)" : "none",
        transition: "box-shadow 0.3s, border-color 0.3s, background 0.3s",
      }}>
        {/* Logo */}
        <Link href="/">
          <a style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
            <img
              src={ASSETS.images.logo}
              alt={ASSETS.brand.name}
              style={{ height: 32, display: "block" }}
              onError={(e) => {
                (e.currentTarget.style.display = "none");
                const txt = e.currentTarget.nextElementSibling as HTMLElement;
                if (txt) txt.style.display = "block";
              }}
            />
            <span style={{
              display: "none",
              fontFamily: "'Playfair Display', serif",
              fontSize: 18, letterSpacing: 5, fontWeight: 700, color: "#111",
            }}>
              {ASSETS.brand.name}
            </span>
          </a>
        </Link>

        {/* Desktop center links */}
        <div className="desktop-links" style={{ display: "flex", gap: 36 }}>
          {NAV_LINKS.map(({ label, href }) => (
            <Link key={label} href={href}>
              <a className="nav-link" style={{
                textDecoration: "none",
                color: isActive(href) ? "#111" : "#888",
                fontWeight: isActive(href) ? 700 : 400,
                fontFamily: "system-ui, sans-serif",
                fontSize: 13, letterSpacing: "1px",
              }}>
                {label}
              </a>
            </Link>
          ))}
        </div>

        {/* Desktop auth */}
        <div className="desktop-auth" style={{ display: "flex" }}>
          <AuthArea user={user} loading={loading} />
        </div>

        {/* Mobile right: stars pill + hamburger */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {user && (
            <div className="mobile-stars" style={{
              display: "flex", alignItems: "center", gap: 5,
              background: ASSETS.colors.goldLight,
              border: `1px solid ${ASSETS.colors.goldBorder}`,
              borderRadius: 99, padding: "4px 11px",
            }}>
              <Star size={11} style={{ color: ASSETS.colors.gold, fill: ASSETS.colors.gold }} />
              <span style={{
                fontSize: 13, fontWeight: 700, color: "#111",
                fontFamily: "system-ui", fontVariantNumeric: "tabular-nums",
              }}>
                {user.stars.toLocaleString()}
              </span>
            </div>
          )}

          <button
            className="hamburger-btn"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle menu"
            style={{
              display: "none",
              alignItems: "center", justifyContent: "center",
              background: "transparent", border: "none",
              cursor: "pointer", color: "#111",
              padding: 4, lineHeight: 1,
            }}
          >
            {menuOpen
              ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
                </svg>
              )}
          </button>
        </div>
      </nav>

      {/* ══ MOBILE DRAWER ═══════════════════════════════════════════════════ */}
      <div className={`mobile-drawer${menuOpen ? " open" : ""}`}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 24px", height: 68,
          borderBottom: "1px solid rgba(0,0,0,0.06)",
        }}>
          <img
            src={ASSETS.images.logo}
            alt={ASSETS.brand.name}
            style={{ height: 28 }}
            onError={(e) => {
              (e.currentTarget.style.display = "none");
              const txt = e.currentTarget.nextElementSibling as HTMLElement;
              if (txt) txt.style.display = "block";
            }}
          />
          <span style={{
            display: "none",
            fontFamily: "'Playfair Display', serif",
            fontSize: 18, letterSpacing: 5, fontWeight: 700, color: "#111",
          }}>
            {ASSETS.brand.name}
          </span>

          <button
            onClick={() => setMenuOpen(false)}
            style={{
              background: "transparent", border: "none",
              cursor: "pointer", color: "#555", padding: 4,
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

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

        <div style={{ padding: "28px 40px", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
          <AuthArea user={user} loading={loading} mobile />
        </div>

        <span style={{
          position: "absolute", bottom: 130, right: 36,
          fontSize: 64, color: ASSETS.colors.gold, opacity: 0.07,
          pointerEvents: "none",
        }}>✦</span>
      </div>

      {/* ══ PAGE CONTENT ════════════════════════════════════════════════════ */}
      <main style={{ paddingTop: 68 }}>{children}</main>

      {/* ══ FOOTER ══════════════════════════════════════════════════════════ */}
      <footer style={{
        textAlign: "center", padding: "32px 24px",
        borderTop: `1px solid ${ASSETS.colors.border}`,
        fontSize: 12, color: "#bbb",
        fontFamily: "system-ui", letterSpacing: 1.5,
      }}>
        ✦ {ASSETS.brand.name} © {new Date().getFullYear()} ✦
      </footer>
    </div>
  );
}

// ── Shared auth area ───────────────────────────────────────────────────────────
function AuthArea({ user, loading, mobile = false }: { user: any; loading: boolean; mobile?: boolean }) {
  if (loading) return null;

  if (user) {
    return (
      <div style={{
        display: "flex",
        flexDirection: mobile ? "column" : "row",
        alignItems: mobile ? "flex-start" : "center",
        gap: mobile ? 16 : 14,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {user.x_avatar && (
            <img src={user.x_avatar} alt={user.x_handle} style={{
              width: mobile ? 40 : 32, height: mobile ? 40 : 32,
              borderRadius: "50%",
              border: `1px solid ${ASSETS.colors.goldBorder}`,
            }} />
          )}
          {mobile && (
            <div>
              <div style={{ fontFamily: "system-ui", fontWeight: 700, fontSize: 14, color: "#111" }}>
                {user.x_handle}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                <Star size={11} style={{ color: ASSETS.colors.gold, fill: ASSETS.colors.gold }} />
                <span style={{ fontFamily: "system-ui", fontSize: 12, color: "#777", fontVariantNumeric: "tabular-nums" }}>
                  {user.stars.toLocaleString()} stars
                </span>
              </div>
            </div>
          )}
          {!mobile && (
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <Star size={12} style={{ color: ASSETS.colors.gold, fill: ASSETS.colors.gold }} />
              <span style={{
                fontSize: 13, fontWeight: 700, color: "#111",
                fontFamily: "system-ui", fontVariantNumeric: "tabular-nums",
              }}>
                {user.stars.toLocaleString()}
              </span>
            </div>
          )}
        </div>

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
            fontFamily: "system-ui", color: "#666",
            transition: "border-color 0.2s",
          }}
        >
          <LogOut size={mobile ? 14 : 12} /> Sign Out
        </button>
      </div>
    );
  }

  return (
    <button
      className="connect-x-btn"
      onClick={() => signInWithX()}
    >
      ✦ Connect with X
    </button>
  );
}
