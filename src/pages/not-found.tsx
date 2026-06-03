import { MainLayout } from "@/layouts/main-layout";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <MainLayout>
      <div style={{ minHeight:"70vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", fontFamily:"system-ui", textAlign:"center", padding:24 }}>
        <div style={{ fontSize:64, marginBottom:16 }}>✦</div>
        <h1 style={{ fontFamily:"'Playfair Display', serif", fontSize:48, color:"#111", marginBottom:12 }}>404</h1>
        <p style={{ fontSize:16, lcolor:"#888", marginBottom:32 }}>This page doesn't exist in Aurelia's realm.</p>
        <Link href="/">
          <a style={{ background:"#111", color:"#fff", padding:"12px 28px", borderRadius:8, textDecoration:"none", fontSize:14 }}>
            Return Home
          </a>
        </Link>
      </div>
    </MainLayout>
  );
}
