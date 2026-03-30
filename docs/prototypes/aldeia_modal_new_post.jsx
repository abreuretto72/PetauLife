import { useState } from "react";

const C = {
  bg: "#0F1923", bgCard: "#162231", card: "#1A2B3D",
  accent: "#E8813A", accentDark: "#CC6E2E", accentGlow: "#E8813A15",
  petrol: "#1B8EAD", purple: "#9B59B6", success: "#2ECC71",
  text: "#E8EDF2", textSec: "#8FA3B8", textDim: "#5E7A94", textGhost: "#2E4254",
  border: "#1E3248", shadowAccent: "0 8px 30px rgba(232,129,58,0.25)",
};
const font = "'Sora', -apple-system, sans-serif";

const I = {
  x: (s=18,c=C.textDim) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  camera: (s=18,c=C.accent) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  mic: (s=18,c=C.accent) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 00-3 3v6a3 3 0 006 0V5a3 3 0 00-3-3z"/><path d="M19 10v1a7 7 0 01-14 0v-1"/><line x1="12" y1="18" x2="12" y2="22"/></svg>,
  dog: (s=18,c=C.accent) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10 5.172C10 3.782 8.423 2.679 6.5 3c-2.823.47-4.113 6.006-4 7 .137 1.217.652 2 1.5 2.5V19a2 2 0 002 2h10a2 2 0 002-2v-6.328c.848-.5 1.363-1.283 1.5-2.5.113-.994-1.177-6.53-4-7C13.577 2.679 12 3.782 12 5.172V5.5"/><circle cx="8.5" cy="10" r="1" fill={c} stroke="none"/><circle cx="13.5" cy="10" r="1" fill={c} stroke="none"/></svg>,
  cat: (s=18,c=C.purple) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c4.97 0 9-2.686 9-6v-.8c0-1.3-.3-2.3-1-3.2 0-2-1-3.5-3-4l1-6-4 3c-1.3-.4-2.7-.4-4 0L6 2l1 6c-2 .5-3 2-3 4-.7.9-1 1.9-1 3.2v.8c0 3.314 4.03 6 9 6z"/><circle cx="9" cy="13" r="1" fill={c} stroke="none"/><circle cx="15" cy="13" r="1" fill={c} stroke="none"/></svg>,
  sparkle: (s=12,c=C.purple) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z"/></svg>,
};

export default function ModalNewPost() {
  const [selPet, setSelPet] = useState(0);
  const pets = [{ name:"Rex", breed:"Labrador", sp:"dog" }, { name:"Luna", breed:"Siamês", sp:"cat" }];

  return (
    <div style={{ display:"flex", justifyContent:"center", alignItems:"center", minHeight:"100vh", padding:20, background:`radial-gradient(ellipse at 50% 0%, #162231, #0B1219 70%)`, fontFamily:font }}>
      <link href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      <div style={{ width:400, background:C.bg, borderRadius:44, overflow:"auto", boxShadow:`0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px ${C.border}` }}>
        <div style={{ display:"flex", justifyContent:"center", padding:"8px 0 0" }}><div style={{ width:120, height:28, borderRadius:20, background:"#000" }} /></div>

        {/* Header */}
        <div style={{ padding:"16px 20px", display:"flex", alignItems:"center", justifyContent:"space-between", borderBottom:`1px solid ${C.border}` }}>
          <span style={{ color:C.text, fontSize:16, fontWeight:700, fontFamily:font }}>Novo Post</span>
          <button style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, width:34, height:34, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>{I.x()}</button>
        </div>

        <div style={{ padding:"16px 20px 30px" }}>
          {/* Pet selector */}
          <label style={{ color:C.textDim, fontSize:11, fontWeight:700, fontFamily:font, display:"block", marginBottom:8 }}>Publicar como</label>
          <div style={{ display:"flex", gap:8, marginBottom:18 }}>
            {pets.map((p,i) => (
              <button key={i} onClick={() => setSelPet(i)} style={{
                flex:1, padding:"12px 10px", borderRadius:14, cursor:"pointer",
                background: selPet===i ? C.accent+"10" : C.card,
                border:`1.5px solid ${selPet===i ? C.accent+"30" : C.border}`,
                display:"flex", alignItems:"center", gap:8,
              }}>
                {p.sp==="cat" ? I.cat(18,selPet===i?C.purple:C.textGhost) : I.dog(18,selPet===i?C.accent:C.textGhost)}
                <div style={{ textAlign:"left" }}>
                  <span style={{ color:selPet===i?C.text:C.textDim, fontSize:13, fontWeight:700, fontFamily:font, display:"block" }}>{p.name}</span>
                  <span style={{ color:C.textGhost, fontSize:10, fontFamily:font }}>{p.breed}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Text area */}
          <div style={{
            background:C.card, border:`1.5px solid ${C.border}`, borderRadius:18, padding:"16px 18px",
            marginBottom:14, minHeight:120,
          }}>
            <span style={{ color:C.textDim, fontSize:14, fontFamily:font }}>O que está acontecendo com {pets[selPet].name}?</span>
          </div>

          {/* AI-first input buttons */}
          <div style={{ display:"flex", gap:8, marginBottom:14 }}>
            <button style={{
              flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:8,
              padding:14, borderRadius:14, background:C.accent+"08",
              border:`1.5px solid ${C.accent}20`, cursor:"pointer",
            }}>
              {I.mic(20,C.accent)}
              <span style={{ color:C.accent, fontSize:13, fontWeight:700, fontFamily:font }}>Falar</span>
            </button>
            <button style={{
              flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:8,
              padding:14, borderRadius:14, background:C.card,
              border:`1.5px solid ${C.border}`, cursor:"pointer",
            }}>
              {I.camera(20,C.accent)}
              <span style={{ color:C.accent, fontSize:13, fontWeight:600, fontFamily:font }}>Foto</span>
            </button>
          </div>

          {/* AI hint */}
          <div style={{ display:"flex", alignItems:"center", gap:6, padding:"10px 14px", background:C.purple+"06", borderRadius:10, border:`1px solid ${C.purple}10`, marginBottom:18 }}>
            {I.sparkle(12,C.purple)}
            <span style={{ color:C.purple, fontSize:10, fontWeight:600, fontFamily:font }}>A IA vai gerar narração automática para o diário do {pets[selPet].name}</span>
          </div>

          {/* Publish button */}
          <button style={{
            width:"100%", padding:16, borderRadius:14, cursor:"pointer",
            background:`linear-gradient(135deg, ${C.accent}, ${C.accentDark})`,
            border:"none", color:"#fff", fontSize:15, fontWeight:700, fontFamily:font,
            boxShadow:C.shadowAccent,
          }}>Publicar na Aldeia</button>
        </div>
        <style>{`::-webkit-scrollbar{width:0;height:0}`}</style>
      </div>
    </div>
  );
}
