import { useState } from "react";

const C = {
  bg: "#0F1923", bgCard: "#162231", bgDeep: "#0B1219",
  card: "#1A2B3D", accent: "#E8813A", accentDark: "#CC6E2E", accentGlow: "#E8813A15",
  petrol: "#1B8EAD", success: "#2ECC71", successSoft: "#2ECC7112",
  danger: "#E74C3C", purple: "#9B59B6", gold: "#F39C12",
  text: "#E8EDF2", textSec: "#8FA3B8", textDim: "#5E7A94", textGhost: "#2E4254",
  border: "#1E3248",
};
const font = "'Sora', -apple-system, sans-serif";
const fontMono = "'JetBrains Mono', monospace";

const I = {
  back: (s=18,c=C.accent) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15,18 9,12 15,6"/></svg>,
  store: (s=20,c=C.accent) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l1-4h16l1 4"/><path d="M3 9v11a1 1 0 001 1h16a1 1 0 001-1V9"/><path d="M9 21V12h6v9"/></svg>,
  shield: (s=11,c=C.success) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9,12 11,14 15,10"/></svg>,
  star: (s=10,c=C.gold) => <svg width={s} height={s} viewBox="0 0 24 24" fill={c} stroke={c} strokeWidth="1"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>,
  search: (s=16,c=C.textDim) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  arrowRight: (s=12,c=C.accent) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9,6 15,12 9,18"/></svg>,
};

const partners = [
  { id:1, name:"VetAmigo", type:"vet", rating:4.9, reviews:23, distance:"1.2km", discount:15, verified:true, hours:"Seg-Sáb 8h-18h" },
  { id:2, name:"Pet Shop Amigo", type:"pet_shop", rating:4.7, reviews:18, distance:"800m", discount:10, verified:true, hours:"Seg-Sáb 9h-19h" },
  { id:3, name:"Dog Walker — João", type:"walker", rating:4.8, reviews:12, distance:"500m", discount:5, verified:true, hours:"Seg-Dom 7h-18h" },
  { id:4, name:"Hotel Pet Salto", type:"hotel", rating:4.5, reviews:8, distance:"2.5km", discount:10, verified:true, hours:"24h" },
  { id:5, name:"Adestra Pet", type:"trainer", rating:4.6, reviews:6, distance:"1.8km", discount:5, verified:false, hours:"Seg-Sex 14h-20h" },
  { id:6, name:"Banho & Tosa Peludo", type:"groomer", rating:4.4, reviews:15, distance:"1.0km", discount:10, verified:true, hours:"Seg-Sáb 8h-17h" },
];

const typeLabels = { vet:"Veterinária", pet_shop:"Pet Shop", walker:"Passeador", hotel:"Hotel Pet", trainer:"Adestrador", groomer:"Banho/Tosa", ong:"ONG" };
const typeColors = { vet:C.success, pet_shop:C.accent, walker:C.petrol, hotel:C.purple, trainer:C.gold, groomer:C.petrol, ong:C.danger };

export default function PartnerListScreen() {
  const [filter, setFilter] = useState("all");
  const filters = ["all","vet","pet_shop","walker","hotel","trainer","groomer"];
  const filterLabels = { all:"Todos", vet:"Vet", pet_shop:"Pet Shop", walker:"Passeador", hotel:"Hotel", trainer:"Adestrador", groomer:"Banho/Tosa" };
  const filtered = filter === "all" ? partners : partners.filter(p => p.type === filter);

  return (
    <div style={{ display:"flex", justifyContent:"center", alignItems:"center", minHeight:"100vh", padding:20, background:`radial-gradient(ellipse at 50% 0%, #162231, #0B1219 70%)`, fontFamily:font }}>
      <link href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <div style={{ width:400, maxHeight:820, background:C.bg, borderRadius:44, overflow:"auto", boxShadow:`0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px ${C.border}` }}>
        <div style={{ display:"flex", justifyContent:"center", padding:"8px 0 0" }}><div style={{ width:120, height:28, borderRadius:20, background:"#000" }} /></div>

        {/* Header */}
        <div style={{ padding:"12px 20px 0", display:"flex", alignItems:"center", gap:12 }}>
          <button style={{ background:C.card, border:`1.5px solid ${C.border}`, borderRadius:12, width:42, height:42, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>{I.back()}</button>
          <h2 style={{ flex:1, color:C.text, fontSize:18, fontWeight:800, margin:0, fontFamily:font }}>Parceiros da Aldeia</h2>
          <span style={{ color:C.textDim, fontSize:11, fontFamily:fontMono }}>{partners.length}</span>
        </div>

        <div style={{ padding:"14px 20px 30px" }}>
          {/* Search */}
          <div style={{ display:"flex", alignItems:"center", gap:10, background:C.card, border:`1.5px solid ${C.border}`, borderRadius:14, padding:"0 14px", height:46, marginBottom:14 }}>
            {I.search()}
            <span style={{ color:C.textDim, fontSize:13, fontFamily:font }}>Buscar parceiro...</span>
          </div>

          {/* Filters */}
          <div style={{ display:"flex", gap:6, marginBottom:16, overflowX:"auto", paddingBottom:2 }}>
            {filters.map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{
                padding:"6px 12px", borderRadius:8, cursor:"pointer", flexShrink:0,
                background:filter===f ? C.accent+"12" : C.card,
                border:`1px solid ${filter===f ? C.accent+"25" : C.border}`,
                color:filter===f ? C.accent : C.textDim, fontSize:11, fontWeight:600, fontFamily:font,
              }}>{filterLabels[f]}</button>
            ))}
          </div>

          {/* List */}
          {filtered.map(p => {
            const tc = typeColors[p.type] || C.accent;
            return (
              <div key={p.id} style={{
                display:"flex", alignItems:"center", gap:12, padding:"14px 16px",
                background:C.card, borderRadius:16, border:`1px solid ${C.border}`, marginBottom:8, cursor:"pointer",
              }}>
                <div style={{ width:48, height:48, borderRadius:16, background:tc+"10", display:"flex", alignItems:"center", justifyContent:"center", border:`1.5px solid ${tc}20` }}>
                  {I.store(22, tc)}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <span style={{ color:C.text, fontSize:14, fontWeight:700, fontFamily:font }}>{p.name}</span>
                    {p.verified && I.shield()}
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:3 }}>
                    <span style={{ color:tc, fontSize:9, fontWeight:700, background:tc+"10", padding:"1px 6px", borderRadius:4 }}>{typeLabels[p.type]}</span>
                    <span style={{ color:C.textGhost }}>·</span>
                    <span style={{ color:C.textDim, fontSize:10, fontFamily:font }}>{p.distance}</span>
                    <span style={{ color:C.textGhost }}>·</span>
                    <span style={{ color:C.textDim, fontSize:10, fontFamily:font }}>{p.reviews} aval.</span>
                  </div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:3 }}>
                    {I.star()}
                    <span style={{ color:C.gold, fontSize:13, fontWeight:700, fontFamily:fontMono }}>{p.rating}</span>
                  </div>
                  {p.discount > 0 && <span style={{ color:C.success, fontSize:10, fontWeight:700, fontFamily:font }}>até -{p.discount}%</span>}
                </div>
                {I.arrowRight()}
              </div>
            );
          })}
        </div>
        <style>{`::-webkit-scrollbar{width:0;height:0}`}</style>
      </div>
    </div>
  );
}
