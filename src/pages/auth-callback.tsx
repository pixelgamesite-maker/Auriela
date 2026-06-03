import { useEffect } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";

export default function AuthCallback() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Supabase handles the token exchange from the URL hash automatically.
    // We just wait for the session to be established then redirect.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setLocation("/");
      } else {
        // Retry once after a short delay (token exchange may still be in flight)
        setTimeout(() => {
          supabase.auth.getSession().then(({ data: { session } }) => {
            setLocation(session ? "/" : "/");
          });
        }, 1200);
      }
    });
  }, [setLocation]);

  return (
    <div style={{
      minHeight:"100vh", display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center",
      background:"#F8F7F4", fontFamily:"system-ui",
    }}>
      <div style={{ fontSize:40, marginBottom:20, animation:"spin 2s linear infinite" }}>✦</div>
      <p style={{ fontSize:15, color:"#888" }}>Signing you in…</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
