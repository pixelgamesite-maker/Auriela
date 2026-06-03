import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { signInWithX, signOut } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Star, LogOut } from "lucide-react";

export function MainLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { user, loading } = useAuth();

  const navLinks = [
    { label: "About", href: "/about" },
    { label: "Lore", href: "/lore" },
    { label: "Tasks", href: "/" },
    { label: "Leaderboard", href: "/leaderboard" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#F8F7F4", fontFamily: "'Cormorant Garamond', 'Playfair Display', Georgia, serif" }}>
      {/* Navbar */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 clamp(20px, 5vw, 56px)", height: 68,
        background: "rgba(248,247,244,0.94)",
        backdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(0,0,0,0.07)",
      }}>
        {/* Logo */}
        <Link href="/">
          <a style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <img
              src="/Aureila-logo.png"
              alt="Aurelia"
              style={{ height: 30 }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, letterSpacing: 5, fontWeight: 700, color: "#111" }}>
              AURELIA
            </span>
          </a>
        </Link>

        {/* Links */}
        <div style={{ display: "flex", gap: 36, fontSize: 13, letterSpacing: 1.5 }}>
          {navLinks.map(({ label, href }) => (
            <Link key={label} href={href}>
              <a style={{
                textDecoration: "none",
                color: location === href ? "#111" : "#777",
                fontWeight: location === href ? 600 : 400,
                fontFamily: "system-ui, sans-serif",
                transition: "color 0.2s",
              }}>
                {label}
              </a>
            </Link>
          ))}
        </div>

        {/* Auth */}
        <div>
          {loading ? null : user ? (
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              {user.x_avatar && (
                <img src={user.x_avatar} alt={user.x_handle} style={{ width: 32, height: 32, borderRadius: "50%", border: "1px solid rgba(201,168,76,0.4)" }} />
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, fontFamily: "system-ui" }}>
                <Star size={13} style={{ color: "#C9A84C", fill: "#C9A84C" }} />
                <span style={{ fontWeight: 700, color: "#111" }}>{user.stars.toLocaleString()}</span>
              </div>
              <button
                onClick={() => signOut()}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  background: "transparent", border: "1px solid #ddd",
                  borderRadius: 99, padding: "6px 14px", cursor: "pointer",
                  fontSize: 12, fontFamily: "system-ui", color: "#666",
                }}
              >
                <LogOut size={12} /> Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={() => signInWithX()}
              style={{
                background: "#111", color: "#fff",
                border: "none", borderRadius: 99,
                padding: "9px 22px", cursor: "pointer",
                fontSize: 13, fontFamily: "system-ui", letterSpacing: 0.4,
                display: "flex", alignItems: "center", gap: 8,
              }}
            >
              ✦ Connect with X
            </button>
          )}
        </div>
      </nav>

      {/* Page content */}
      <main style={{ paddingTop: 68 }}>
        {children}
      </main>

      {/* Footer */}
      <footer style={{
        textAlign: "center", padding: "32px 24px",
        borderTop: "1px solid rgba(0,0,0,0.07)",
        fontSize: 12, color: "#aaa", fontFamily: "system-ui",
        letterSpacing: 1,
      }}>
        ✦ AURELIA © {new Date().getFullYear()} ✦
      </footer>
    </div>
  );
}
