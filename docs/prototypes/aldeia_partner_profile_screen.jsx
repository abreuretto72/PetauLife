import { useState } from "react";

const C = {
  bg: "#0F1923", bgCard: "#162231", bgDeep: "#0B1219",
  card: "#1A2B3D", accent: "#E8813A", accentDark: "#CC6E2E",
  petrol: "#1B8EAD", success: "#2ECC71", successSoft: "#2ECC7112",
  purple: "#9B59B6", gold: "#F39C12", goldSoft: "#F39C1212",
  text: "#E8EDF2", textSec: "#8FA3B8", textDim: "#5E7A94", textGhost: "#2E4254",
  border: "#1E3248", shadowAccent: "0 8px 30px rgba(232,129,58,0.25)",
};
const font = "'Sora', -apple-system, sans-serif";
const fontMono = "'JetBrains Mono', monospace";

const I = {
  back: (s=18,c=C.accent) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15,18 9,12 15,6"/></svg>,
  store: (s=36,c=C.success) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l1-4h16l1 4"/><path d="M3 9v11a1 1 0 001 1h16a1 1 0 001-1V9"/><path d="M9 21V12h6v9"/></svg>,
  shield: (s=12,c=C.success) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9,12 11,14 15,10"/></svg>,
  star: (s=12,c=C.gold) => <svg width={s} height={s} viewBox="0 0 24 24" fill={c} stroke={c} strokeWidth="1"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>,
  starEmpty: (s=12,c=C.textGhost) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>,
  mapPin: (s=14,c=C.petrol) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  clock: (s=14,c=C.textDim) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>,
  phone: (s=14,c=C.accent) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>,
  globe: (s=14,c=C.petrol) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>,
  navigation: (s=14,c="#fff") => <svg width={s} height={s} viewBox="0 0 24 24" fill={c} stroke={c} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><polygon points="3,11 22,2 13,21 11,13"/></svg>,
  user: (s=14,c=C.textDim) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
};

const reviews = [
  { author:"Ana Martins", rating:5, text:"Dr. Carlos é incrível. Rex foi super bem tratado.", time:"2 sem" },
  { author:"Carlos Mendes", rating:5, text:"Atendimento rápido, preço justo. Thor adora ir lá.", time:"1 mês" },
  { author:"Paula Ribeiro", rating:4, text:"Bom atendimento, mas a espera foi longa.", time:"1 mês" },
];

export default function PartnerProfileScreen() {
  const [showMap, setShowMap] = useState(false);

  return (
    <div style={{ display:"flex", justifyContent:"center", alignItems:"center", minHeight:"100vh", padding:20, background:`radial-gradient(ellipse at 50% 0%, #162231, #0B1219 70%)`, fontFamily:font }}>
      <link href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <div style={{ width:400, maxHeight:820, background:C.bg, borderRadius:44, overflow:"auto", boxShadow:`0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px ${C.border}` }}>
        <div style={{ display:"flex", justifyContent:"center", padding:"8px 0 0" }}><div style={{ width:120, height:28, borderRadius:20, background:"#000" }} /></div>

        <div style={{ padding:"12px 20px 0", display:"flex", alignItems:"center", gap:12 }}>
          <button style={{ background:C.card, border:`1.5px solid ${C.border}`, borderRadius:12, width:42, height:42, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>{I.back()}</button>
          <span style={{ flex:1, color:C.textDim, fontSize:12, fontFamily:font }}>Parceiro Verificado</span>
        </div>

        <div style={{ padding:"14px 20px 30px" }}>
          {/* Hero */}
          <div style={{ textAlign:"center", marginBottom:18 }}>
            <div style={{ width:80, height:80, borderRadius:24, background:C.success+"10", border:`2.5px solid ${C.success}25`, margin:"0 auto 12px", display:"flex", alignItems:"center", justifyContent:"center" }}>
              {I.store()}
            </div>
            <h2 style={{ color:C.text, fontSize:22, fontWeight:800, margin:"0 0 4px", fontFamily:font }}>VetAmigo</h2>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
              <span style={{ color:C.success, fontSize:10, fontWeight:700, background:C.successSoft, padding:"2px 8px", borderRadius:4 }}>Veterinária</span>
              {I.shield()}
              <span style={{ color:C.success, fontSize:10, fontWeight:600, fontFamily:font }}>Verificado</span>
            </div>
            <p style={{ color:C.textSec, fontSize:12, margin:"10px 0 0", fontFamily:font, lineHeight:1.5 }}>Clínica veterinária completa com atendimento de emergência 24h. Especialista em cães de grande porte.</p>
          </div>

          {/* Stats */}
          <div style={{ display:"flex", gap:8, marginBottom:16 }}>
            {[
              { label:"Nota", value:"4.9", color:C.gold, icon:I.star(12,C.gold) },
              { label:"Avaliações", value:"23", color:C.accent },
              { label:"Distância", value:"1.2km", color:C.petrol },
              { label:"Desconto máx", value:"20%", color:C.success },
            ].map((s,i) => (
              <div key={i} style={{ flex:1, background:C.card, borderRadius:12, padding:"10px 4px", textAlign:"center", border:`1px solid ${C.border}` }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:3 }}>
                  {s.icon}
                  <span style={{ color:s.color, fontSize:14, fontWeight:800, fontFamily:fontMono }}>{s.value}</span>
                </div>
                <span style={{ color:C.textDim, fontSize:8, fontFamily:font }}>{s.label}</span>
              </div>
            ))}
          </div>

          {/* Discount table */}
          <div style={{ background:C.card, borderRadius:16, padding:"14px 16px", border:`1px solid ${C.border}`, marginBottom:14 }}>
            <span style={{ color:C.textGhost, fontSize:10, fontWeight:700, letterSpacing:2, fontFamily:font }}>DESCONTOS POR PROOF OF LOVE</span>
            {[
              { level:"Bronze", pct:"5%", color:"#CD7F32" },
              { level:"Prata", pct:"10%", color:"#C0C0C0" },
              { level:"Ouro", pct:"15%", color:C.gold },
              { level:"Diamante", pct:"20%", color:C.petrol },
            ].map((d,i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 0", borderBottom:i<3?`1px solid ${C.border}`:"none" }}>
                <span style={{ color:d.color, fontSize:12, fontWeight:600, fontFamily:font }}>{d.level}</span>
                <span style={{ color:C.success, fontSize:14, fontWeight:800, fontFamily:fontMono }}>{d.pct}</span>
              </div>
            ))}
          </div>

          {/* Info cards */}
          {[
            { icon:I.mapPin(14,C.petrol), label:"Rua das Flores, 123 — Salto, SP" },
            { icon:I.clock(14,C.textDim), label:"Seg-Sáb 8h-18h · Emergência 24h" },
            { icon:I.phone(14,C.accent), label:"(11) 4028-1234" },
            { icon:I.globe(14,C.petrol), label:"www.vetamigo.com.br" },
          ].map((inf,i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", background:C.card, borderRadius:12, border:`1px solid ${C.border}`, marginBottom:6, cursor:"pointer" }}>
              {inf.icon}
              <span style={{ color:C.textSec, fontSize:12, fontFamily:font }}>{inf.label}</span>
            </div>
          ))}

          {/* Map placeholder */}
          <div style={{ height:120, borderRadius:16, margin:"12px 0", background:`linear-gradient(180deg, ${C.card}, ${C.bgCard})`, border:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
              {I.mapPin(20,C.petrol)}
              <span style={{ color:C.textDim, fontSize:10, fontFamily:font }}>Ver no mapa</span>
            </div>
          </div>

          {/* Reviews */}
          <p style={{ color:C.textGhost, fontSize:10, fontWeight:700, letterSpacing:2, margin:"16px 0 10px", fontFamily:font }}>AVALIAÇÕES RECENTES</p>
          {reviews.map((r,i) => (
            <div key={i} style={{ background:C.card, borderRadius:14, padding:"12px 14px", border:`1px solid ${C.border}`, marginBottom:8 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                <div style={{ width:28, height:28, borderRadius:9, background:C.accent+"10", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  {I.user(14,C.accent)}
                </div>
                <span style={{ color:C.text, fontSize:12, fontWeight:700, fontFamily:font, flex:1 }}>{r.author}</span>
                <span style={{ color:C.textGhost, fontSize:9, fontFamily:font }}>{r.time}</span>
              </div>
              <div style={{ display:"flex", gap:2, marginBottom:6 }}>
                {[1,2,3,4,5].map(n => n <= r.rating ? I.star(10,C.gold) : I.starEmpty(10,C.textGhost))}
              </div>
              <p style={{ color:C.textSec, fontSize:11, lineHeight:1.5, margin:0, fontFamily:font }}>{r.text}</p>
            </div>
          ))}

          {/* CTA */}
          <div style={{ display:"flex", gap:8, marginTop:12 }}>
            <button style={{
              flex:2, padding:14, borderRadius:14, cursor:"pointer",
              background:`linear-gradient(135deg, ${C.accent}, ${C.accentDark})`,
              border:"none", color:"#fff", fontSize:14, fontWeight:700, fontFamily:font,
              display:"flex", alignItems:"center", justifyContent:"center", gap:8,
              boxShadow:C.shadowAccent,
            }}>{I.phone(14,"#fff")} Ligar</button>
            <button style={{
              flex:1, padding:14, borderRadius:14, cursor:"pointer",
              background:C.card, border:`1.5px solid ${C.border}`,
              color:C.accent, fontSize:13, fontWeight:700, fontFamily:font,
              display:"flex", alignItems:"center", justifyContent:"center", gap:6,
            }}>{I.navigation(12,C.accent)} Ir</button>
          </div>
        </div>
        <style>{`::-webkit-scrollbar{width:0;height:0}`}</style>
      </div>
    </div>
  );
}
