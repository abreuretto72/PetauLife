import { useState } from "react";

const C = {
  bg: "#0F1923", bgCard: "#162231", card: "#1A2B3D",
  accent: "#E8813A", accentDark: "#CC6E2E",
  petrol: "#1B8EAD", success: "#2ECC71", successSoft: "#2ECC7112",
  purple: "#9B59B6", gold: "#F39C12", goldSoft: "#F39C1212",
  text: "#E8EDF2", textSec: "#8FA3B8", textDim: "#5E7A94", textGhost: "#2E4254", placeholder: "#5E7A94",
  border: "#1E3248", shadowAccent: "0 8px 30px rgba(232,129,58,0.25)",
};
const font = "'Sora', -apple-system, sans-serif";
const fontMono = "'JetBrains Mono', monospace";

const I = {
  x: (s=18,c=C.textDim) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  star: (s=28,c=C.gold) => <svg width={s} height={s} viewBox="0 0 24 24" fill={c} stroke={c} strokeWidth="1"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>,
  starEmpty: (s=28,c=C.textGhost) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>,
  check: (s=14,c=C.success) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20,6 9,17 4,12"/></svg>,
  dog: (s=22,c=C.accent) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10 5.172C10 3.782 8.423 2.679 6.5 3c-2.823.47-4.113 6.006-4 7 .137 1.217.652 2 1.5 2.5V19a2 2 0 002 2h10a2 2 0 002-2v-6.328c.848-.5 1.363-1.283 1.5-2.5.113-.994-1.177-6.53-4-7C13.577 2.679 12 3.782 12 5.172V5.5"/><circle cx="8.5" cy="10" r="1" fill={c} stroke="none"/><circle cx="13.5" cy="10" r="1" fill={c} stroke="none"/></svg>,
  user: (s=20,c="#fff") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  mapPin: (s=11,c=C.petrol) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  clock: (s=11,c=C.textGhost) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>,
  trophy: (s=12,c=C.gold) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 010-5H6M18 9h1.5a2.5 2.5 0 000-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22M18 2H6v7a6 6 0 0012 0V2z"/></svg>,
  send: (s=14,c="#fff") => <svg width={s} height={s} viewBox="0 0 24 24" fill={c} stroke={c} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22,2 15,22 11,13 2,9"/></svg>,
};

const StarRating = ({label, defaultVal=0}) => {
  const [val, setVal] = useState(defaultVal);
  const labels = ["","Péssimo","Ruim","Regular","Bom","Excelente"];
  return (
    <div style={{ marginBottom:18 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
        <label style={{ color:C.textDim, fontSize:11, fontWeight:700, fontFamily:font }}>{label}</label>
        {val > 0 && <span style={{ color:C.gold, fontSize:10, fontWeight:600, fontFamily:font }}>{labels[val]}</span>}
      </div>
      <div style={{ display:"flex", gap:6 }}>
        {[1,2,3,4,5].map(n => (
          <button key={n} onClick={() => setVal(n)} style={{ background:"none", border:"none", cursor:"pointer", padding:2, transition:"transform 0.15s", transform:n<=val?"scale(1.1)":"scale(1)" }}>
            {n <= val ? I.star(28, C.gold) : I.starEmpty(28, C.textGhost)}
          </button>
        ))}
      </div>
    </div>
  );
};

export default function ModalReview() {
  return (
    <div style={{ display:"flex", justifyContent:"center", alignItems:"center", minHeight:"100vh", padding:20, background:`radial-gradient(ellipse at 50% 0%, #162231, #0B1219 70%)`, fontFamily:font }}>
      <link href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <div style={{ width:400, background:C.bg, borderRadius:44, overflow:"auto", boxShadow:`0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px ${C.border}` }}>
        <div style={{ display:"flex", justifyContent:"center", padding:"8px 0 0" }}><div style={{ width:120, height:28, borderRadius:20, background:"#000" }} /></div>

        {/* Header */}
        <div style={{ padding:"16px 20px", display:"flex", alignItems:"center", justifyContent:"space-between", borderBottom:`1px solid ${C.border}` }}>
          <span style={{ color:C.text, fontSize:16, fontWeight:700, fontFamily:font }}>Avaliar Favor</span>
          <button style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, width:34, height:34, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>{I.x()}</button>
        </div>

        <div style={{ padding:"16px 20px 30px" }}>
          {/* Favor context */}
          <div style={{ background:C.card, borderRadius:18, padding:"16px 18px", border:`1px solid ${C.accent}10`, marginBottom:20 }}>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ width:48, height:48, borderRadius:16, background:`linear-gradient(135deg, ${C.accent}, ${C.accentDark})`, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 4px 12px ${C.accent}20` }}>
                {I.user(22,"#fff")}
              </div>
              <div style={{ flex:1 }}>
                <span style={{ color:C.text, fontSize:14, fontWeight:700, fontFamily:font }}>João passeou com o Rex</span>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:4 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:3 }}>
                    {I.clock(11,C.textGhost)}
                    <span style={{ color:C.textDim, fontSize:10, fontFamily:font }}>Ontem · 14:00—15:00</span>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:3 }}>
                    {I.mapPin(11,C.petrol)}
                    <span style={{ color:C.textDim, fontSize:10, fontFamily:font }}>Parque Central</span>
                  </div>
                </div>
              </div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:12, padding:"8px 12px", background:C.success+"06", borderRadius:10, border:`1px solid ${C.success}10` }}>
              {I.dog(16,C.accent)}
              <span style={{ color:C.textSec, fontSize:11, fontFamily:font }}>Rex voltou feliz e cansado do passeio</span>
            </div>
          </div>

          {/* Ratings */}
          <StarRating label="Pontualidade" defaultVal={5} />
          <StarRating label="Cuidado com o pet" defaultVal={5} />
          <StarRating label="Comunicação" defaultVal={4} />
          <StarRating label="Seguiu orientações" defaultVal={5} />

          {/* Comment */}
          <div style={{ marginBottom:18 }}>
            <label style={{ color:C.textDim, fontSize:11, fontWeight:700, fontFamily:font, display:"block", marginBottom:6 }}>Comentário (opcional)</label>
            <div style={{ background:C.card, border:`1.5px solid ${C.border}`, borderRadius:14, padding:"12px 14px", minHeight:80 }}>
              <span style={{ color:C.placeholder, fontSize:13, fontFamily:font }}>Como foi a experiência?</span>
            </div>
          </div>

          {/* Credits confirmation */}
          <div style={{ display:"flex", alignItems:"center", gap:8, padding:"12px 16px", background:C.successSoft, borderRadius:14, border:`1px solid ${C.success}12`, marginBottom:10 }}>
            {I.check(14,C.success)}
            <span style={{ color:C.success, fontSize:12, fontWeight:600, fontFamily:font }}>João recebeu <b>+15 Pet-Credits</b> por este favor</span>
          </div>

          <div style={{ display:"flex", alignItems:"center", gap:8, padding:"12px 16px", background:C.goldSoft, borderRadius:14, border:`1px solid ${C.gold}12`, marginBottom:18 }}>
            {I.trophy(12,C.gold)}
            <span style={{ color:C.gold, fontSize:12, fontWeight:600, fontFamily:font }}>Sua avaliação melhora o karma de João na Aldeia</span>
          </div>

          {/* Submit */}
          <button style={{
            width:"100%", padding:16, borderRadius:14, cursor:"pointer",
            background:`linear-gradient(135deg, ${C.accent}, ${C.accentDark})`,
            border:"none", color:"#fff", fontSize:15, fontWeight:700, fontFamily:font,
            display:"flex", alignItems:"center", justifyContent:"center", gap:8,
            boxShadow:C.shadowAccent,
          }}>{I.send(14,"#fff")} Enviar Avaliação</button>
        </div>
        <style>{`::-webkit-scrollbar{width:0;height:0}`}</style>
      </div>
    </div>
  );
}
