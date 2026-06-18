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

const SCROLL_WORDS = [
  "CONTROL", "✦", "ELEGANCE", "✦", "PRESENCE", "✦",
  "DESIGN", "✦", "STILLNESS", "✦", "PRECISION", "✦",
  "CONTROL", "✦", "ELEGANCE", "✦", "PRESENCE", "✦",
  "DESIGN", "✦", "STILLNESS", "✦", "PRECISION", "✦",
];

export default function About() {
  return (
    <MainLayout>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&display=swap');

        @keyframes marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        .marquee-track {
          display: flex;
          width: max-content;
          animation: marquee 22s linear infinite;
        }

        .marquee-track:hover {
          animation-play-state: paused;
        }
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

      {/* Marquee ticker */}
      <div style={{ overflow:"hidden", borderTop:"1px solid rgba(0,0,0,0.07)", borderBottom:"1px solid rgba(0,0,0,0.07)", padding:"16px 0", marginBottom:80, background:"#fafafa" }}>
        <div className="marquee-track">
          {SCROLL_WORDS.map((word, i) => (
            <span
              key={i}
              style={{
                fontFamily: word === "✦" ? "system-ui" : "'Playfair Display', serif",
                fontSize: word === "✦" ? 10 : 13,
                color: word === "✦" ? "#C9A84C" : "#111",
                letterSpacing: word === "✦" ? 0 : 3,
                marginRight: 28,
                whiteSpace: "nowrap",
              }}
            >
              {word}
            </span>
          ))}
        </div>
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

      {/* Brand narrative + image */}
      <div style={{ padding:"0 clamp(24px,8vw,100px) 100px" }}>
        <div style={{ maxWidth:900, display:"grid", gridTemplateColumns:"1fr 1fr", gap:60, alignItems:"center" }}>

          {/* Image */}
          <div style={{ borderRadius:20, overflow:"hidden", aspectRatio:"4/5", background:"#f0ede8" }}>
            <img
              src="/aurelia-image.jpg"
              alt="Aurelia"
              style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}
            />
          </div>

          {/* Copy */}
          <div>
            <div style={{ fontSize:10, letterSpacing:4, color:"#C9A84C", marginBottom:20, fontFamily:"system-ui" }}>THE STORY</div>
            <h2 style={{ fontFamily:"'Playfair Display', serif", fontSize:"clamp(28px,3vw,40px)", color:"#111", margin:"0 0 24px", lineHeight:1.15 }}>
              Born in a lab.<br/>Shaped by signal.<br/>Defined by presence.
            </h2>
            <p style={{ fontSize:15, color:"#666", lineHeight:1.9, fontFamily:"system-ui", marginBottom:16 }}>
              Aurelia began in a lab. What started as a controlled creation slowly became something more — not just synthetic bodies, but identities. Quiet, refined beings shaped through design, stillness, and precision.
            </p>
            <p style={{ fontSize:15, color:"#666", lineHeight:1.9, fontFamily:"system-ui", marginBottom:16 }}>
              Each Aurelia carries its own presence. Calm faces. Clean forms. Subtle details. Nothing loud. Nothing wasted.
            </p>
            <p style={{ fontSize:15, color:"#888", lineHeight:1.9, fontFamily:"system-ui", fontStyle:"italic" }}>
              This is a world built between human feeling and artificial design — where beauty is measured, identity is intentional, and silence says enough.
            </p>
            <div style={{ marginTop:32, display:"flex", gap:24 }}>
              {["Control", "Elegance", "Presence"].map((word) => (
                <div key={word} style={{ textAlign:"center" }}>
                  <div style={{ fontSize:9, letterSpacing:3, color:"#C9A84C", fontFamily:"system-ui" }}>✦</div>
                  <div style={{ fontSize:11, letterSpacing:2, color:"#999", fontFamily:"system-ui", marginTop:6 }}>{word.toUpperCase()}</div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </MainLayout>
  );
}
                
