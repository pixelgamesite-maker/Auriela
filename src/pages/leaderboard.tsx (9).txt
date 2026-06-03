import { useEffect, useState } from "react";
import { MainLayout } from "@/layouts/main-layout";
import { useAuth } from "@/hooks/useAuth";
import { getLeaderboard, type User } from "@/lib/supabase";

function StarIcon({ size = 14 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="#C9A84C"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" /></svg>;
}

function Avatar({ src, handle, size = 40 }: { src?: string | null; handle: string; size?: number }) {
  const colors = ["#2a1f3d","#1a2d2a","#2d1a1f","#1a1f2d","#2d2a1a"];
  const color = colors[(handle.charCodeAt(1) || 0) % colors.length];
  if (src) return <img src={src} alt={handle} style={{ width: size, height: size, borderRadius:"50%", objectFit:"cover", border:"1.5px solid rgba(201,168,76,0.35)", flexShrink:0 }} />;
  return (
    <div style={{ width:size, height:size, borderRadius:"50%", background:color, border:"1.5px solid rgba(201,168,76,0.35)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:size*0.36, fontWeight:700, color:"#C9A84C", flexShrink:0 }}>
      {handle?.[1]?.toUpperCase() || "?"}
    </div>
  );
}

const MEDAL = ["🥇","🥈","🥉"];
const MEDAL_COLORS = ["#C9A84C","#9CA3AF","#CD7F32"];
const PODIUM_HEIGHTS = [180, 140, 110]; // 1st, 2nd, 3rd

export default function Leaderboard() {
  const { user } = useAuth();
  const [board, setBoard] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLeaderboard().then((data) => {
      setBoard(data);
      setLoading(false);
    });
  }, []);

  const myRank = board.findIndex((u) => u.id === user?.id) + 1;
  const top3 = [board[1], board[0], board[2]]; // silver, gold, bronze order for podium

  return (
    <MainLayout>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&display=swap');
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        .lb-row:hover { background: rgba(201,168,76,0.05) !important; }
      `}</style>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "60px 24px 80px" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div style={{ fontSize: 42, marginBottom: 10 }}>✦</div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 46, color: "#111", margin: "0 0 12px" }}>
            Star Leaderboard
          </h1>
          <p style={{ fontSize: 15, color: "#888", fontFamily:"system-ui", maxWidth:400, margin:"0 auto" }}>
            The more stars you collect, the higher your priority for early access.
          </p>

          {/* My rank badge */}
          {user && myRank > 0 && (
            <div style={{ display:"inline-flex", alignItems:"center", gap:10, marginTop:20, padding:"10px 20px", background:"rgba(201,168,76,0.1)", border:"1px solid rgba(201,168,76,0.3)", borderRadius:99, fontFamily:"system-ui" }}>
              <span style={{ fontSize:13, color:"#888" }}>Your rank:</span>
              <span style={{ fontWeight:700, fontSize:16, color:"#C9A84C" }}>#{myRank}</span>
              <span style={{ fontSize:13, color:"#888" }}>with</span>
              <span style={{ fontWeight:700, fontSize:16, color:"#111" }}>{user.stars.toLocaleString()}</span>
              <StarIcon size={13} />
            </div>
          )}
        </div>

        {/* Podium */}
        {!loading && board.length >= 3 && (
          <div style={{ display:"flex", justifyContent:"center", alignItems:"flex-end", gap:12, marginBottom:52 }}>
            {top3.map((entry, idx) => {
              if (!entry) return <div key={idx} style={{ width:120 }} />;
              const rank = idx === 1 ? 1 : idx === 0 ? 2 : 3;
              return (
                <div key={entry.id} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
                  <Avatar src={entry.x_avatar} handle={entry.x_handle} size={48} />
                  <div style={{ fontSize:12, fontWeight:600, color:"#333", fontFamily:"system-ui", textAlign:"center", maxWidth:100, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {entry.x_handle}
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:4, fontSize:13, color:"#C9A84C", fontWeight:700, fontFamily:"system-ui" }}>
                    {entry.stars.toLocaleString()} <StarIcon size={12} />
                  </div>
                  <div style={{
                    width:110, height:PODIUM_HEIGHTS[idx],
                    background: MEDAL_COLORS[rank-1],
                    borderRadius:"8px 8px 0 0",
                    display:"flex", alignItems:"flex-start", justifyContent:"center",
                    paddingTop:12, fontSize:28,
                  }}>
                    {MEDAL[rank-1]}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Full list */}
        <div style={{ background:"#fff", borderRadius:18, border:"1px solid rgba(0,0,0,0.07)", overflow:"hidden", boxShadow:"0 2px 24px rgba(0,0,0,0.04)" }}>
          {/* Header row */}
          <div style={{ display:"grid", gridTemplateColumns:"52px 1fr auto", gap:16, padding:"12px 24px", background:"#F8F7F4", borderBottom:"1px solid rgba(0,0,0,0.06)", fontSize:10, letterSpacing:2, color:"#aaa", fontFamily:"system-ui" }}>
            <span>RANK</span><span>USER</span><span>STARS</span>
          </div>

          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div key={i} style={{ height:60, borderBottom:"1px solid rgba(0,0,0,0.05)", background: i%2===0?"#fff":"#FAFAF9", animation:"pulse 1.5s infinite" }} />
              ))
            : board.map((entry, i) => {
                const isMe = entry.id === user?.id;
                return (
                  <div
                    key={entry.id}
                    className="lb-row"
                    style={{
                      display:"grid", gridTemplateColumns:"52px 1fr auto",
                      alignItems:"center", gap:16,
                      padding:"13px 24px",
                      background: isMe ? "rgba(201,168,76,0.06)" : i%2===0?"#fff":"#FAFAF9",
                      borderBottom: i < board.length-1 ? "1px solid rgba(0,0,0,0.05)" : "none",
                      borderLeft: isMe ? "3px solid #C9A84C" : "3px solid transparent",
                      transition:"background 0.15s",
                    }}
                  >
                    {/* Rank */}
                    <div style={{ fontWeight:700, textAlign:"center", fontFamily:"system-ui", fontSize: i < 3 ? 20 : 14, color: i < 3 ? MEDAL_COLORS[i] : "#bbb" }}>
                      {i < 3 ? MEDAL[i] : i+1}
                    </div>

                    {/* User */}
                    <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                      <Avatar src={entry.x_avatar} handle={entry.x_handle} size={36} />
                      <div>
                        <div style={{ fontWeight:600, fontSize:14, color:"#111", fontFamily:"system-ui" }}>
                          {entry.x_handle}
                          {isMe && <span style={{ marginLeft:8, fontSize:10, color:"#C9A84C", background:"rgba(201,168,76,0.12)", padding:"2px 8px", borderRadius:99 }}>You</span>}
                        </div>
                        <div style={{ fontSize:11, color:"#bbb", fontFamily:"system-ui" }}>
                          Joined {new Date(entry.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    {/* Stars */}
                    <div style={{ display:"flex", alignItems:"center", gap:6, fontWeight:700, color:"#C9A84C", fontFamily:"system-ui" }}>
                      {entry.stars.toLocaleString()} <StarIcon size={14} />
                    </div>
                  </div>
                );
              })}
        </div>
      </div>
    </MainLayout>
  );
}
