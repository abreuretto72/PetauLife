import { useState } from "react";

const C = {
  bg: "#0F1923", bgCard: "#162231", card: "#1A2B3D",
  accent: "#E8813A", accentDark: "#CC6E2E",
  petrol: "#1B8EAD", danger: "#E74C3C", dangerSoft: "#E74C3C12",
  warning: "#F1C40F", success: "#2ECC71",
  text: "#E8EDF2", textSec: "#8FA3B8", textDim: "#5E7A94", textGhost: "#2E4254",
  border: "#1E3248",
};
const font = "'Sora', -apple-system, sans-serif";

const I = {
  x: (s=18,c=C.textDim) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  heartPulse: (s=24,c=C.danger) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M19.5 12.572l-7.5 7.428-7.5-7.428A5 5 0 1112 6.006a5 5 0 017.5 6.572"/><path d="M5 12h2l2 3 4-6 2 3h4"/></svg>,
  search: (s=24,c=C.warning) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  megaphone: (s=24,c=C.accent) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11l18-5v12L3 13v-2z"/><path d="M11.6 16.8a3 3 0 11-5.8-1.6"/></svg>,
  arrowRight: (s=14,c) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9,6 15,12 9,18"/></svg>,
  shield: (s=14,c=C.success) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9,12 11,14 15,10"/></svg>,
};

export default function ModalSOSType() {
  return (
    <div style={{ display:"flex", justifyContent:"center", alignItems:"center", minHeight:"100vh", padding:20, background:`radial-gradient(ellipse at 50% 0%, #162231, #0B1219 70%)`, fontFamily:font }}>
      <link href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      <div style={{ width:400, background:C.bg, borderRadius:44, overflow:"auto", boxShadow:`0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px ${C.border}` }}>
        <div style={{ display:"flex", justifyContent:"center", padding:"8px 0 0" }}><div style={{ width:120, height:28, borderRadius:20, background:"#000" }} /></div>

        <div style={{ padding:"16px 20px", display:"flex", alignItems:"center", justifyContent:"space-between", borderBottom:`1px solid ${C.border}` }}>
          <span style={{ color:C.text, fontSize:16, fontWeight:700, fontFamily:font }}>Pedir SOS</span>
          <button style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, width:34, height:34, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>{I.x()}</button>
        </div>

        <div style={{ padding:"16px 20px 30px" }}>
          <p style={{ color:C.textDim, fontSize:12, margin:"0 0 6px", fontFamily:font }}>Selecione o tipo de emergência</p>
          <p style={{ color:C.textGhost, fontSize:10, margin:"0 0 18px", fontFamily:font }}>A Aldeia será notificada imediatamente</p>

          {[
            { icon: I.heartPulse(28, C.danger), label:"Emergência Médica", desc:"Pet doente ou ferido. Preciso de ajuda agora.", sub:"Compartilha prontuário com quem ajudar", color:C.danger },
            { icon: I.search(28, C.warning), label:"Pet Perdido", desc:"Meu pet fugiu ou desapareceu.", sub:"Ativa busca coletiva com IA preditiva", color:C.warning },
            { icon: I.megaphone(28, C.accent), label:"Preciso de Ajuda Urgente", desc:"Transporte, medicamento ou cuidado imediato.", sub:"Solicita ajuda rápida da vizinhança", color:C.accent },
          ].map((s,i) => (
            <button key={i} style={{
              width:"100%", display:"flex", alignItems:"center", gap:14,
              padding:"20px 16px", borderRadius:20, marginBottom:10, cursor:"pointer",
              background:s.color+"06", border:`1.5px solid ${s.color}20`, textAlign:"left",
            }}>
              <div style={{ width:56, height:56, borderRadius:18, background:s.color+"10", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                {s.icon}
              </div>
              <div style={{ flex:1 }}>
                <span style={{ color:s.color, fontSize:15, fontWeight:700, fontFamily:font, display:"block" }}>{s.label}</span>
                <span style={{ color:C.textSec, fontSize:11, fontFamily:font, margin:"3px 0", display:"block", lineHeight:1.4 }}>{s.desc}</span>
                <div style={{ display:"flex", alignItems:"center", gap:4, marginTop:4 }}>
                  {I.shield(10, C.success)}
                  <span style={{ color:C.textGhost, fontSize:9, fontFamily:font }}>{s.sub}</span>
                </div>
              </div>
              {I.arrowRight(14, s.color)}
            </button>
          ))}

          <div style={{ background:C.card, borderRadius:12, padding:"10px 14px", marginTop:8, border:`1px solid ${C.border}` }}>
            <p style={{ color:C.textGhost, fontSize:10, lineHeight:1.5, margin:0, fontFamily:font }}>
              O SOS notifica todos os tutores num raio de 1-5km. Seus dados de emergência são compartilhados de forma segura apenas durante o SOS ativo.
            </p>
          </div>
        </div>
        <style>{`::-webkit-scrollbar{width:0;height:0}`}</style>
      </div>
    </div>
  );
}
