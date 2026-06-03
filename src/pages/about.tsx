import { MainLayout } from "@/layouts/main-layout";
import { signInWithX } from "@/lib/supabase";

const FEATURES = [
  {
    label: "EARN STARS",
    title: "Collect & Climb",
    body: "Complete social and interactive tasks, then claim +10 stars every 2 hours. Every star moves you up the priority list.",
  },
  {
    label: "X AUTH",
    title: "Sign In With X",
    body: "Your X (Twitter) handle is your identity. One click — no wallet, no email required.",
  },
  {
    label: "LEADERBOARD",
    title: "Global Rankings",
    body: "Compete globally. Top star holders receive the highest priority for early access and exclusive benefits.",
  },
  {
    label: "LIVE FEED",
    title: "Real-Time Activity",
    body: "Watch the community earn stars in real time. A living pulse of everyone who showed up.",
  },
];

const DB_SETUP = `-- 1. Users table
create table users (
  id uuid primary key references auth.users,
  x_handle text,
  x_avatar text,
  stars integer default 0,
  last_claim timestamptz,
  created_at timestamptz default now()
);

-- 2. Star claims (live feed + history)
create table star_claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users,
  x_handle text,
  x_avatar text,
  stars integer default 10,
  claimed_at timestamptz default now()
);

-- 3. Completed tasks
create table tasks_completed (
  user_id uuid references users,
  task_id text,
  completed_at timestamptz default now(),
  primary key (user_id, task_id)
);

-- 4. Enable Realtime on star_claims
-- Dashboard → Database → Replication → star_claims ✓`;

export default function About() {
  return (
    <MainLayout>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&display=swap');
      `}</style>

      {/* Hero */}
      <div style={{ padding:"80px clamp(24px,8vw,100px) 72px", maxWidth:760 }}>
        <div style={{ fontSize:10, letterSpacing:4, color:"#C9A84C", marginBottom:16, fontFamily:"system-ui" }}>ABOUT AURELIA</div>
        <h1 style={{ fontFamily:"'Playfair Display', serif", fontSize:"clamp(40px,5vw,64px)", color:"#111", margin:"0 0 20px", lineHeight:1.05 }}>
          Priority through presence.
        </h1>
        <p style={{ fontSize:17, color:"#666", lineHeight:1.8, fontFamily:"system-ui", maxWidth:540 }}>
          Aurelia is a star-based waitlist system. Show up, complete tasks, collect stars, and earn your place at the front of the line — before anyone else.
        </p>
        <button
          onClick={() => signInWithX()}
          style={{ marginTop:32, background:"#111", color:"#fff", border:"none", borderRadius:8, padding:"13px 30px", fontSize:14, cursor:"pointer", fontFamily:"system-ui", letterSpacing:0.4 }}
        >
          ✦ Join with X
        </button>
      </div>

      {/* Feature grid */}
      <div style={{ padding:"0 clamp(24px,8vw,100px) 80px" }}>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(280px, 1fr))", gap:20, maxWidth:900 }}>
          {FEATURES.map((f) => (
            <div key={f.label} style={{ background:"#fff", borderRadius:16, padding:28, border:"1px solid rgba(0,0,0,0.07)" }}>
              <div style={{ fontSize:9, letterSpacing:3, color:"#C9A84C", marginBottom:12, fontFamily:"system-ui" }}>✦ {f.label}</div>
              <h3 style={{ fontFamily:"'Playfair Display', serif", fontSize:22, color:"#111", marginBottom:10 }}>{f.title}</h3>
              <p style={{ fontSize:14, color:"#777", lineHeight:1.7, fontFamily:"system-ui" }}>{f.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Supabase setup */}
      <div style={{ padding:"0 clamp(24px,8vw,100px) 80px" }}>
        <div style={{ maxWidth:760, background:"#0f0f0f", borderRadius:18, padding:36, overflow:"hidden" }}>
          <div style={{ fontSize:10, letterSpacing:3, color:"#C9A84C", marginBottom:14, fontFamily:"system-ui" }}>DEVELOPER SETUP</div>
          <h3 style={{ fontFamily:"'Playfair Display', serif", fontSize:24, color:"#fff", marginBottom:8 }}>Supabase + X Auth</h3>
          <p style={{ fontSize:13, color:"rgba(255,255,255,0.45)", marginBottom:24, fontFamily:"system-ui", lineHeight:1.6 }}>
            1. Create a project at <a href="https://supabase.com" target="_blank" style={{ color:"#C9A84C" }}>supabase.com</a><br/>
            2. Go to Authentication → Providers → Twitter/X and add your X App credentials<br/>
            3. Set redirect URL: <code style={{ color:"#C9A84C" }}>https://yourdomain.com/auth/callback</code><br/>
            4. Add <code style={{ color:"#C9A84C" }}>VITE_SUPABASE_URL</code> and <code style={{ color:"#C9A84C" }}>VITE_SUPABASE_ANON_KEY</code> to your <code style={{ color:"#C9A84C" }}>.env</code><br/>
            5. Run the SQL below in the Supabase SQL editor
          </p>
          <pre style={{
            fontFamily:"'JetBrains Mono', 'Fira Code', monospace",
            fontSize:12, lineHeight:1.75,
            color:"rgba(255,255,255,0.65)",
            overflowX:"auto", margin:0,
            padding:0, background:"transparent",
          }}>
            {DB_SETUP}
          </pre>
        </div>
      </div>
    </MainLayout>
  );
}
