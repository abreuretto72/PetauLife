import { useState } from "react";

const C = {
  bg: "#0F1923", bgCard: "#162231", card: "#1A2B3D",
  accent: "#E8813A", accentDark: "#CC6E2E", accentGlow: "#E8813A15",
  petrol: "#1B8EAD", success: "#2ECC71", danger: "#E74C3C",
  purple: "#9B59B6", gold: "#F39C12", goldSoft: "#F39C1212",
  text: "#E8EDF2", textDim: "#5E7A94", textGhost: "#2E4254", placeholder: "#5E7A94",
  border: "#1E3248", shadowAccent: "0 8px 30px rgba(232,129,58,0.25)",
};
const font = "'Sora', -apple-system, sans-serif";

const I = {
  x: (s=18,c=C.textDim) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  calendar: (s=14,c=C.accent) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  clock: (s=14,c=C.accent) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>,
  mapPin: (s=14,c=C.petrol) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  mic: (s=18,c=C.accent) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 00-3 3v6a3 3 0 006 0V5a3 3 0 00-3-3z"/><path d="M19 10v1a7 7 0 01-14 0v-1"/><line x1="12" y1="18" x2="12" y2="22"/></svg>,
  tag: (s=12,c=C.gold) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
  handshake: (s=14,c="#fff") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 17a1 1 0 01-1 1H6l-4 4V8a2 2 0 012-2h6a2 2 0 012 2v9z"/><path d="M14 9h4a2 2 0 012 2v11l-4-4h-4a1 1 0 01-1-1v-1"/></svg>,
  dog: (s=16,c=C.accent) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10 5.172C10 3.782 8.423 2.679 6.5 3c-2.823.47-4.113 6.006-4 7 .137 1.217.652 2 1.5 2.5V19a2 2 0 002 2h10a2 2 0 002-2v-6.328c.848-.5 1.363-1.283 1.5-2.5.113-.994-1.177-6.53-4-7C13.577 2.679 12 3.782 12 5.172V5.5"/><circle cx="8.5" cy="10" r="1" fill={c} stroke="none"/><circle cx="13.5" cy="10" r="1" fill={c} stroke="none"/></svg>,
};

export default function ModalNewFavor() {
  const [pet, setPet] = useState(0);
  const [favType, setFavType] = useState(0);
  const [urgent, setUrgent] = useState(false);
  const favorTypes = ["Passeio","Cuidar","Transporte","Alimentar","Banho/Tosa","Outro"];

  return (
    <div style={{ display:"flex", justifyContent:"center", alignItems:"center", minHeight:"100vh", padding:20, background:`radial-gradient(ellipse at 50% 0%, #162231, #0B1219 70%)`, fontFamily:font }}>
      <link href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      <div style={{ width:400, background:C.bg, borderRadius:44, overflow:"auto", boxShadow:`0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px ${C.border}` }}>
        <div style={{ display:"flex", justifyContent:"center", padding:"8px 0 0" }}><div style={{ width:120, height:28, borderRadius:20, background:"#000" }} /></div>

        <div style={{ padding:"16px 20px", display:"flex", alignItems:"center", justifyContent:"space-between", borderBottom:`1px solid ${C.border}` }}>
          <span style={{ color:C.text, fontSize:16, fontWeight:700, fontFamily:font }}>Pedir Favor</span>
          <button style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, width:34, height:34, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>{I.x()}</button>
        </div>

        <div style={{ padding:"16px 20px 30px" }}>
          {/* Pet */}
          <div style={{ marginBottom:14 }}>
            <label style={{ color:C.textDim, fontSize:11, fontWeight:700, fontFamily:font, display:"block", marginBottom:8 }}>Para qual pet?</label>
            <div style={{ display:"flex", gap:6 }}>
              {["Rex (Labrador)","Luna (Siamês)"].map((p,i) => (
                <button key={i} onClick={() => setPet(i)} style={{
                  flex:1, padding:"10px 12px", borderRadius:12, cursor:"pointer",
                  background:pet===i?C.accent+"12":C.card,
                  border:`1.5px solid ${pet===i?C.accent+"30":C.border}`,
                  color:pet===i?C.accent:C.textDim, fontSize:12, fontWeight:600, fontFamily:font,
                  display:"flex", alignItems:"center", justifyContent:"center", gap:6,
                }}>{I.dog(14,pet===i?C.accent:C.textGhost)} {p}</button>
              ))}
            </div>
          </div>

          {/* Favor type */}
          <div style={{ marginBottom:14 }}>
            <label style={{ color:C.textDim, fontSize:11, fontWeight:700, fontFamily:font, display:"block", marginBottom:8 }}>Tipo de favor</label>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {favorTypes.map((t,i) => (
                <button key={i} onClick={() => setFavType(i)} style={{
                  padding:"8px 14px", borderRadius:10, cursor:"pointer",
                  background:favType===i?C.petrol+"12":C.card,
                  border:`1.5px solid ${favType===i?C.petrol+"30":C.border}`,
                  color:favType===i?C.petrol:C.textDim, fontSize:12, fontWeight:600, fontFamily:font,
                }}>{t}</button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div style={{ marginBottom:14 }}>
            <label style={{ color:C.textDim, fontSize:11, fontWeight:700, fontFamily:font, display:"block", marginBottom:6 }}>O que precisa?</label>
            <div style={{ background:C.card, border:`1.5px solid ${C.border}`, borderRadius:14, padding:"12px 14px", minHeight:80 }}>
              <span style={{ color:C.placeholder, fontSize:13, fontFamily:font }}>Descreva o favor que precisa...</span>
            </div>
          </div>

          {/* Voice button (AI-first) */}
          <button style={{
            width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:8,
            padding:12, borderRadius:12, background:C.accent+"08",
            border:`1.5px solid ${C.accent}20`, cursor:"pointer", marginBottom:14,
          }}>
            {I.mic(18,C.accent)}
            <span style={{ color:C.accent, fontSize:13, fontWeight:700, fontFamily:font }}>Falar o que precisa</span>
          </button>

          {/* Date + time */}
          <div style={{ display:"flex", gap:8, marginBottom:14 }}>
            <div style={{ flex:1 }}>
              <label style={{ color:C.textDim, fontSize:11, fontWeight:700, fontFamily:font, display:"block", marginBottom:6 }}>Data</label>
              <div style={{ display:"flex", alignItems:"center", gap:8, background:C.card, border:`1.5px solid ${C.border}`, borderRadius:14, padding:"0 14px", height:46 }}>
                {I.calendar(14,C.accent)}
                <span style={{ color:C.placeholder, fontSize:13, fontFamily:font }}>dd/mm/aaaa</span>
              </div>
            </div>
            <div style={{ flex:1 }}>
              <label style={{ color:C.textDim, fontSize:11, fontWeight:700, fontFamily:font, display:"block", marginBottom:6 }}>Horário</label>
              <div style={{ display:"flex", alignItems:"center", gap:8, background:C.card, border:`1.5px solid ${C.border}`, borderRadius:14, padding:"0 14px", height:46 }}>
                {I.clock(14,C.accent)}
                <span style={{ color:C.placeholder, fontSize:13, fontFamily:font }}>14:00—15:00</span>
              </div>
            </div>
          </div>

          {/* Location */}
          <div style={{ marginBottom:14 }}>
            <label style={{ color:C.textDim, fontSize:11, fontWeight:700, fontFamily:font, display:"block", marginBottom:6 }}>Local de encontro</label>
            <div style={{ display:"flex", alignItems:"center", gap:8, background:C.card, border:`1.5px solid ${C.border}`, borderRadius:14, padding:"0 14px", height:46 }}>
              {I.mapPin(14,C.petrol)}
              <span style={{ color:C.placeholder, fontSize:13, fontFamily:font }}>Endereço ou referência</span>
            </div>
          </div>

          {/* Urgent toggle */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 14px", background:C.card, borderRadius:12, border:`1px solid ${C.border}`, marginBottom:14 }}>
            <span style={{ color:urgent?C.danger:C.textDim, fontSize:12, fontWeight:600, fontFamily:font }}>Urgente?</span>
            <button onClick={() => setUrgent(!urgent)} style={{
              width:44, height:24, borderRadius:12, padding:2, cursor:"pointer",
              background:urgent?C.danger:C.border, border:"none", transition:"all 0.2s",
              display:"flex", alignItems:urgent?"center":"center",
              justifyContent:urgent?"flex-end":"flex-start",
            }}>
              <div style={{ width:20, height:20, borderRadius:10, background:urgent?"#fff":C.textDim, transition:"all 0.2s" }} />
            </button>
          </div>

          {/* Credits info */}
          <div style={{ display:"flex", alignItems:"center", gap:6, padding:"10px 14px", background:C.goldSoft, borderRadius:12, border:`1px solid ${C.gold}10`, marginBottom:18 }}>
            {I.tag(12,C.gold)}
            <span style={{ color:C.gold, fontSize:11, fontWeight:600, fontFamily:font }}>Recompensa: +15 Pet-Credits para quem ajudar</span>
          </div>

          {/* Submit */}
          <button style={{
            width:"100%", padding:16, borderRadius:14, cursor:"pointer",
            background:`linear-gradient(135deg, ${C.accent}, ${C.accentDark})`,
            border:"none", color:"#fff", fontSize:15, fontWeight:700, fontFamily:font,
            display:"flex", alignItems:"center", justifyContent:"center", gap:8,
            boxShadow:C.shadowAccent,
          }}>{I.handshake(14,"#fff")} Publicar Favor</button>
        </div>
        <style>{`::-webkit-scrollbar{width:0;height:0}`}</style>
      </div>
    </div>
  );
}
