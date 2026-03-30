import { useState } from "react";

const C = {
  bg: "#0F1923", bgCard: "#162231", card: "#1A2B3D",
  accent: "#E8813A", accentDark: "#CC6E2E",
  petrol: "#1B8EAD", success: "#2ECC71", purple: "#9B59B6", gold: "#F39C12",
  text: "#E8EDF2", textDim: "#5E7A94", textGhost: "#2E4254", placeholder: "#5E7A94",
  border: "#1E3248", shadowAccent: "0 8px 30px rgba(232,129,58,0.25)",
};
const font = "'Sora', -apple-system, sans-serif";

const I = {
  x: (s=18,c=C.textDim) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  calendar: (s=16,c=C.accent) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  clock: (s=16,c=C.accent) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>,
  mapPin: (s=16,c=C.petrol) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  sparkle: (s=12,c=C.purple) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z"/></svg>,
  trophy: (s=12,c=C.gold) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 010-5H6M18 9h1.5a2.5 2.5 0 000-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22M18 2H6v7a6 6 0 0012 0V2z"/></svg>,
};

const Input = ({label, placeholder, icon}) => (
  <div style={{ marginBottom:14 }}>
    <label style={{ color:C.textDim, fontSize:11, fontWeight:700, fontFamily:font, display:"block", marginBottom:6 }}>{label}</label>
    <div style={{ display:"flex", alignItems:"center", gap:10, background:C.card, border:`1.5px solid ${C.border}`, borderRadius:14, padding:"0 14px", height:48 }}>
      {icon}
      <span style={{ color:C.placeholder, fontSize:13, fontFamily:font }}>{placeholder}</span>
    </div>
  </div>
);

export default function ModalNewEvent() {
  const [type, setType] = useState(0);
  const types = ["Passeio","Social","Feira","Vacinação","Workshop","Adoção"];
  const typeColors = [C.accent, C.purple, C.petrol, C.success, C.gold, C.accent];

  return (
    <div style={{ display:"flex", justifyContent:"center", alignItems:"center", minHeight:"100vh", padding:20, background:`radial-gradient(ellipse at 50% 0%, #162231, #0B1219 70%)`, fontFamily:font }}>
      <link href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      <div style={{ width:400, background:C.bg, borderRadius:44, overflow:"auto", boxShadow:`0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px ${C.border}` }}>
        <div style={{ display:"flex", justifyContent:"center", padding:"8px 0 0" }}><div style={{ width:120, height:28, borderRadius:20, background:"#000" }} /></div>

        <div style={{ padding:"16px 20px", display:"flex", alignItems:"center", justifyContent:"space-between", borderBottom:`1px solid ${C.border}` }}>
          <span style={{ color:C.text, fontSize:16, fontWeight:700, fontFamily:font }}>Criar Evento</span>
          <button style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, width:34, height:34, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>{I.x()}</button>
        </div>

        <div style={{ padding:"16px 20px 30px" }}>
          <Input label="Nome do evento" placeholder="Ex: Passeio coletivo no parque" />

          <div style={{ marginBottom:14 }}>
            <label style={{ color:C.textDim, fontSize:11, fontWeight:700, fontFamily:font, display:"block", marginBottom:8 }}>Tipo de evento</label>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {types.map((t,i) => (
                <button key={i} onClick={() => setType(i)} style={{
                  padding:"8px 14px", borderRadius:10, cursor:"pointer",
                  background:type===i ? typeColors[i]+"12" : C.card,
                  border:`1.5px solid ${type===i ? typeColors[i]+"30" : C.border}`,
                  color:type===i ? typeColors[i] : C.textDim, fontSize:12, fontWeight:600, fontFamily:font,
                }}>{t}</button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom:14 }}>
            <label style={{ color:C.textDim, fontSize:11, fontWeight:700, fontFamily:font, display:"block", marginBottom:6 }}>Descrição</label>
            <div style={{ background:C.card, border:`1.5px solid ${C.border}`, borderRadius:14, padding:"12px 14px", minHeight:80 }}>
              <span style={{ color:C.placeholder, fontSize:13, fontFamily:font }}>Detalhes do evento...</span>
            </div>
          </div>

          <div style={{ display:"flex", gap:8 }}>
            <div style={{ flex:1 }}><Input label="Data" placeholder="dd/mm/aaaa" icon={I.calendar(14,C.accent)} /></div>
            <div style={{ flex:1 }}><Input label="Horário" placeholder="08:00" icon={I.clock(14,C.accent)} /></div>
          </div>

          <Input label="Local" placeholder="Nome do parque, praça..." icon={I.mapPin(14,C.petrol)} />
          <Input label="Limite de pets (opcional)" placeholder="Ex: 20" />

          {/* AI hint + credits */}
          <div style={{ display:"flex", gap:8, marginBottom:16 }}>
            <div style={{ flex:1, display:"flex", alignItems:"center", gap:6, padding:"10px 12px", background:C.purple+"06", borderRadius:10, border:`1px solid ${C.purple}10` }}>
              {I.sparkle(12,C.purple)}
              <span style={{ color:C.purple, fontSize:9, fontWeight:600, fontFamily:font }}>IA vai sugerir melhor horário</span>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:4, padding:"10px 12px", background:C.gold+"06", borderRadius:10, border:`1px solid ${C.gold}10` }}>
              {I.trophy(12,C.gold)}
              <span style={{ color:C.gold, fontSize:10, fontWeight:700, fontFamily:font }}>+25 PC</span>
            </div>
          </div>

          <button style={{
            width:"100%", padding:16, borderRadius:14, cursor:"pointer",
            background:`linear-gradient(135deg, ${C.accent}, ${C.accentDark})`,
            border:"none", color:"#fff", fontSize:15, fontWeight:700, fontFamily:font,
            display:"flex", alignItems:"center", justifyContent:"center", gap:8,
            boxShadow:C.shadowAccent,
          }}>{I.calendar(14,"#fff")} Criar Evento</button>
        </div>
        <style>{`::-webkit-scrollbar{width:0;height:0}`}</style>
      </div>
    </div>
  );
}
