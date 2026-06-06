// ── Aurelia Assets ─────────────────────────────────────────────────────────────
// Central asset registry — import from here, never hardcode URLs directly.

const SUPABASE_STORAGE = "https://aitxwwtybpgpqxsvlxzm.supabase.co/storage/v1/object/public/Images";

export const ASSETS = {
  // ── Images ──────────────────────────────────────────────────────────────────
  images: {
    /** Main character illustration (Aurelia figure with flower) */
    character: `${SUPABASE_STORAGE}/Auriela2.png`,
    /** Wordmark / logo lockup */
    logo: `${SUPABASE_STORAGE}/Aurelia-logo.png`,
  },

  // ── Brand ───────────────────────────────────────────────────────────────────
  brand: {
    name: "AURELIA",
    tagline: "Secure Your Spot",
    description: "Complete tasks and claim stars every 5 hours.",
    priorityNote: "The more stars you collect, the higher your priority.",
  },

  // ── Social links ────────────────────────────────────────────────────────────
  links: {
    x: "https://x.com/AureliaApp",
    discord: "https://discord.gg/aurelia",
    telegram: "https://t.me/aurelia",
    website: "https://aurelia.app",
  },

  // ── Colors (mirrors CSS vars for use in inline styles / JS) ─────────────────
  colors: {
    gold: "#C9A84C",
    goldLight: "rgba(201,168,76,0.08)",
    goldBorder: "rgba(201,168,76,0.22)",
    bg: "#F8F7F4",
    surface: "#FFFFFF",
    ink: "#111111",
    muted: "#777777",
    faint: "#AAAAAA",
    border: "rgba(0,0,0,0.06)",
  },
} as const;

export type Assets = typeof ASSETS;
