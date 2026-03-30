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
  camera: (s=20,c=C.accent) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  gift: (s=14,c="#fff") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="20,12 20,22 4,22 4,12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/></svg>,
  sparkle: (s=12,c=C.purple) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z"/></svg>,
};

export default function ModalNewClassified() {
  const [cat, setCat] = useState(0);
  const [cond, setCond] = useState(0);
  const [offer, setOffer] = useState(0);

  const categories = ["Ração","Medicamento","Acessório","Brinquedo","Transportadora","Roupa","Outro"];
  const conditions = ["Novo","Usado","Vence em breve"];
  const condColors = [C.success, C.petrol, C.gold];
  const offers = ["Doação","Troca","Empréstimo"];
  const offerColors = [C.success, C.accent, C.petrol];

  return (
    <div style={{ display:"flex", justifyContent:"center", alignItems:"center", minHeight:"100vh", padding:20, background:`radial-gradient(ellipse at 50% 0%, #162231, #0B1219 70%)`, fontFamily:font }}>
      <link href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      <div style={{ width:400, background:C.bg, borderRadius:44, overflow:"auto", boxShadow:`0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px ${C.border}` }}>
        <div style={{ display:"flex", justifyContent:"center", padding:"8px 0 0" }}><div style={{ width:120, height:28, borderRadius:20, background:"#000" }} /></div>

        <div style={{ padding:"16px 20px", display:"flex", alignItems:"center", justifyContent:"space-between", borderBottom:`1px solid ${C.border}` }}>
          <span style={{ color:C.text, fontSize:16, fontWeight:700, fontFamily:font }}>Oferecer Item</span>
          <button style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, width:34, height:34, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>{I.x()}</button>
        </div>

        <div style={{ padding:"16px 20px 30px" }}>
          {/* Name */}
          <div style={{ marginBottom:14 }}>
            <label style={{ color:C.textDim, fontSize:11, fontWeight:700, fontFamily:font, display:"block", marginBottom:6 }}>Nome do item</label>
            <div style={{ background:C.card, border:`1.5px solid ${C.border}`, borderRadius:14, padding:"0 14px", height:48, display:"flex", alignItems:"center" }}>
              <span style={{ color:C.placeholder, fontSize:13, fontFamily:font }}>Ex: Ração Royal Canin 3kg</span>
            </div>
          </div>

          {/* Category */}
          <div style={{ marginBottom:14 }}>
            <label style={{ color:C.textDim, fontSize:11, fontWeight:700, fontFamily:font, display:"block", marginBottom:8 }}>Categoria</label>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {categories.map((c,i) => (
                <button key={i} onClick={() => setCat(i)} style={{
                  padding:"8px 14px", borderRadius:10, cursor:"pointer",
                  background:cat===i?C.accent+"12":C.card,
                  border:`1.5px solid ${cat===i?C.accent+"30":C.border}`,
                  color:cat===i?C.accent:C.textDim, fontSize:12, fontWeight:600, fontFamily:font,
                }}>{c}</button>
              ))}
            </div>
          </div>

          {/* Condition */}
          <div style={{ marginBottom:14 }}>
            <label style={{ color:C.textDim, fontSize:11, fontWeight:700, fontFamily:font, display:"block", marginBottom:8 }}>Condição</label>
            <div style={{ display:"flex", gap:6 }}>
              {conditions.map((c,i) => (
                <button key={i} onClick={() => setCond(i)} style={{
                  flex:1, padding:"10px 8px", borderRadius:10, cursor:"pointer",
                  background:cond===i?condColors[i]+"12":C.card,
                  border:`1.5px solid ${cond===i?condColors[i]+"30":C.border}`,
                  color:cond===i?condColors[i]:C.textDim, fontSize:12, fontWeight:600, fontFamily:font,
                }}>{c}</button>
              ))}
            </div>
          </div>

          {/* Offer type */}
          <div style={{ marginBottom:14 }}>
            <label style={{ color:C.textDim, fontSize:11, fontWeight:700, fontFamily:font, display:"block", marginBottom:8 }}>Tipo de oferta</label>
            <div style={{ display:"flex", gap:6 }}>
              {offers.map((o,i) => (
                <button key={i} onClick={() => setOffer(i)} style={{
                  flex:1, padding:"10px 8px", borderRadius:10, cursor:"pointer",
                  background:offer===i?offerColors[i]+"12":C.card,
                  border:`1.5px solid ${offer===i?offerColors[i]+"30":C.border}`,
                  color:offer===i?offerColors[i]:C.textDim, fontSize:12, fontWeight:600, fontFamily:font,
                }}>{o}</button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div style={{ marginBottom:14 }}>
            <label style={{ color:C.textDim, fontSize:11, fontWeight:700, fontFamily:font, display:"block", marginBottom:6 }}>Descrição (opcional)</label>
            <div style={{ background:C.card, border:`1.5px solid ${C.border}`, borderRadius:14, padding:"12px 14px", minHeight:70 }}>
              <span style={{ color:C.placeholder, fontSize:13, fontFamily:font }}>Marca, validade, observações...</span>
            </div>
          </div>

          {/* Photo */}
          <button style={{
            width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:10,
            padding:16, borderRadius:16, background:C.card, border:`1.5px dashed ${C.border}`, cursor:"pointer", marginBottom:14,
          }}>
            {I.camera(22,C.accent)}
            <span style={{ color:C.accent, fontSize:13, fontWeight:600, fontFamily:font }}>Adicionar foto do item</span>
          </button>

          {/* AI hint */}
          <div style={{ display:"flex", alignItems:"center", gap:6, padding:"10px 14px", background:C.purple+"06", borderRadius:10, border:`1px solid ${C.purple}10`, marginBottom:18 }}>
            {I.sparkle(12,C.purple)}
            <span style={{ color:C.purple, fontSize:10, fontWeight:600, fontFamily:font }}>A IA vai identificar o item pela foto automaticamente</span>
          </div>

          {/* Submit */}
          <button style={{
            width:"100%", padding:16, borderRadius:14, cursor:"pointer",
            background:`linear-gradient(135deg, ${C.accent}, ${C.accentDark})`,
            border:"none", color:"#fff", fontSize:15, fontWeight:700, fontFamily:font,
            display:"flex", alignItems:"center", justifyContent:"center", gap:8,
            boxShadow:C.shadowAccent,
          }}>{I.gift(14,"#fff")} Publicar na Aldeia</button>
        </div>
        <style>{`::-webkit-scrollbar{width:0;height:0}`}</style>
      </div>
    </div>
  );
}
