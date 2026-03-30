import { useState } from "react";

const C = {
  bg: "#0F1923", bgCard: "#162231", bgDeep: "#0B1219",
  card: "#1A2B3D", cardHover: "#1E3145",
  accent: "#E8813A", accentLight: "#F09A56", accentDark: "#CC6E2E",
  accentGlow: "#E8813A15",
  petrol: "#1B8EAD",
  success: "#2ECC71", successSoft: "#2ECC7112",
  danger: "#E74C3C", dangerSoft: "#E74C3C12",
  warning: "#F1C40F",
  purple: "#9B59B6",
  gold: "#F39C12", goldSoft: "#F39C1212",
  text: "#E8EDF2", textSec: "#8FA3B8", textDim: "#5E7A94", textGhost: "#2E4254",
  border: "#1E3248",
  shadowAccent: "0 8px 30px rgba(232,129,58,0.25)",
};
const font = "'Sora', -apple-system, sans-serif";
const fontMono = "'JetBrains Mono', monospace";
const fontHand = "'Caveat', cursive";

const I = {
  back: (s=18,c=C.accent) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15,18 9,12 15,6"/></svg>,
  x: (s=18,c=C.textDim) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  arrowRight: (s=12,c=C.accent) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9,6 15,12 9,18"/></svg>,
  dog: (s=20,c=C.accent) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10 5.172C10 3.782 8.423 2.679 6.5 3c-2.823.47-4.113 6.006-4 7 .137 1.217.652 2 1.5 2.5V19a2 2 0 002 2h10a2 2 0 002-2v-6.328c.848-.5 1.363-1.283 1.5-2.5.113-.994-1.177-6.53-4-7C13.577 2.679 12 3.782 12 5.172V5.5"/><circle cx="8.5" cy="10" r="1" fill={c} stroke="none"/><circle cx="13.5" cy="10" r="1" fill={c} stroke="none"/></svg>,
  star: (s=14,c=C.gold) => <svg width={s} height={s} viewBox="0 0 24 24" fill={c} stroke={c} strokeWidth="1"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>,
  starEmpty: (s=14,c=C.textGhost) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>,
  mapPin: (s=14,c=C.petrol) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  clock: (s=14,c=C.textDim) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>,
  phone: (s=14,c=C.accent) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>,
  shield: (s=14,c=C.success) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9,12 11,14 15,10"/></svg>,
  store: (s=20,c=C.accent) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l1-4h16l1 4"/><path d="M3 9v11a1 1 0 001 1h16a1 1 0 001-1V9"/><path d="M9 21V12h6v9"/></svg>,
  camera: (s=18,c=C.accent) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  mic: (s=18,c=C.accent) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 00-3 3v6a3 3 0 006 0V5a3 3 0 00-3-3z"/><path d="M19 10v1a7 7 0 01-14 0v-1"/><line x1="12" y1="18" x2="12" y2="22"/></svg>,
  megaphone: (s=20,c=C.danger) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11l18-5v12L3 13v-2z"/><path d="M11.6 16.8a3 3 0 11-5.8-1.6"/></svg>,
  heartPulse: (s=18,c=C.danger) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M19.5 12.572l-7.5 7.428-7.5-7.428A5 5 0 1112 6.006a5 5 0 017.5 6.572"/><path d="M5 12h2l2 3 4-6 2 3h4"/></svg>,
  search: (s=18,c=C.textDim) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  calendar: (s=16,c=C.accent) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  gift: (s=18,c=C.accent) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="20,12 20,22 4,22 4,12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/></svg>,
  handshake: (s=18,c=C.petrol) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 17a1 1 0 01-1 1H6l-4 4V8a2 2 0 012-2h6a2 2 0 012 2v9z"/><path d="M14 9h4a2 2 0 012 2v11l-4-4h-4a1 1 0 01-1-1v-1"/></svg>,
  tag: (s=14,c=C.petrol) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
  navigation: (s=14,c="#fff") => <svg width={s} height={s} viewBox="0 0 24 24" fill={c} stroke={c} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><polygon points="3,11 22,2 13,21 11,13"/></svg>,
  check: (s=14,c=C.success) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20,6 9,17 4,12"/></svg>,
};

// ======================== SCREEN NAV ========================
const screens = [
  { id: "partner_list", label: "Lista Parceiros" },
  { id: "partner_profile", label: "Perfil Parceiro" },
  { id: "modal_post", label: "Modal: Novo Post" },
  { id: "modal_sos", label: "Modal: Tipo SOS" },
  { id: "modal_event", label: "Modal: Novo Evento" },
  { id: "modal_favor", label: "Modal: Novo Favor" },
  { id: "modal_classified", label: "Modal: Classificado" },
  { id: "modal_review", label: "Modal: Avaliação" },
];

const partners = [
  { id: 1, name: "VetAmigo", type: "vet", rating: 4.9, reviews: 23, distance: "1.2km", discount: 15, verified: true, hours: "Seg-Sáb 8h-18h" },
  { id: 2, name: "Pet Shop Amigo", type: "pet_shop", rating: 4.7, reviews: 18, distance: "800m", discount: 10, verified: true, hours: "Seg-Sáb 9h-19h" },
  { id: 3, name: "Dog Walker — João", type: "walker", rating: 4.8, reviews: 12, distance: "500m", discount: 5, verified: true, hours: "Seg-Dom 7h-18h" },
  { id: 4, name: "Hotel Pet Salto", type: "hotel", rating: 4.5, reviews: 8, distance: "2.5km", discount: 10, verified: true, hours: "24h" },
  { id: 5, name: "Adestra Pet", type: "trainer", rating: 4.6, reviews: 6, distance: "1.8km", discount: 5, verified: false, hours: "Seg-Sex 14h-20h" },
];

const typeLabels = { vet: "Veterinária", pet_shop: "Pet Shop", walker: "Passeador", hotel: "Hotel Pet", trainer: "Adestrador", groomer: "Banho/Tosa", ong: "ONG" };
const typeColors = { vet: C.success, pet_shop: C.accent, walker: C.petrol, hotel: C.purple, trainer: C.gold, groomer: C.petrol, ong: C.rose || C.danger };

// Shared components
const Header = ({title, onBack, right}) => (
  <div style={{ padding: "12px 20px 0", display: "flex", alignItems: "center", gap: 12 }}>
    <button onClick={onBack} style={{ background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 12, width: 42, height: 42, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
      {I.back(18, C.accent)}
    </button>
    <span style={{ flex: 1, color: C.text, fontSize: 16, fontWeight: 700, fontFamily: font }}>{title}</span>
    {right}
  </div>
);

const ModalHeader = ({title, onClose}) => (
  <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${C.border}` }}>
    <span style={{ color: C.text, fontSize: 16, fontWeight: 700, fontFamily: font }}>{title}</span>
    <button onClick={onClose} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, width: 34, height: 34, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
      {I.x(16, C.textDim)}
    </button>
  </div>
);

const InputField = ({label, placeholder, icon, multiline}) => (
  <div style={{ marginBottom: 14 }}>
    <label style={{ color: C.textDim, fontSize: 11, fontWeight: 700, fontFamily: font, display: "block", marginBottom: 6 }}>{label}</label>
    <div style={{
      display: "flex", alignItems: multiline ? "flex-start" : "center", gap: 10,
      background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 14, padding: multiline ? "12px 14px" : "0 14px",
      height: multiline ? "auto" : 48,
    }}>
      {icon}
      <span style={{ color: C.placeholder, fontSize: 13, fontFamily: font, flex: 1, ...(multiline ? { minHeight: 60, paddingTop: 2 } : {}) }}>{placeholder}</span>
    </div>
  </div>
);

const ChipSelect = ({label, options, activeColor}) => {
  const [sel, setSel] = useState(0);
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ color: C.textDim, fontSize: 11, fontWeight: 700, fontFamily: font, display: "block", marginBottom: 8 }}>{label}</label>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {options.map((o, i) => (
          <button key={i} onClick={() => setSel(i)} style={{
            padding: "8px 14px", borderRadius: 10, cursor: "pointer",
            background: sel === i ? (activeColor || C.accent) + "12" : C.card,
            border: `1.5px solid ${sel === i ? (activeColor || C.accent) + "30" : C.border}`,
            color: sel === i ? (activeColor || C.accent) : C.textDim,
            fontSize: 12, fontWeight: 600, fontFamily: font,
          }}>{o}</button>
        ))}
      </div>
    </div>
  );
};

const StarRating = ({label, defaultVal}) => {
  const [val, setVal] = useState(defaultVal || 0);
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ color: C.textDim, fontSize: 11, fontWeight: 700, fontFamily: font, display: "block", marginBottom: 8 }}>{label}</label>
      <div style={{ display: "flex", gap: 6 }}>
        {[1,2,3,4,5].map(n => (
          <button key={n} onClick={() => setVal(n)} style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}>
            {n <= val ? I.star(24, C.gold) : I.starEmpty(24, C.textGhost)}
          </button>
        ))}
      </div>
    </div>
  );
};

const PrimaryButton = ({label, icon, onClick}) => (
  <button onClick={onClick} style={{
    width: "100%", padding: 14, borderRadius: 14, cursor: "pointer",
    background: `linear-gradient(135deg, ${C.accent}, ${C.accentDark})`,
    border: "none", color: "#fff", fontSize: 14, fontWeight: 700, fontFamily: font,
    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
    boxShadow: C.shadowAccent,
  }}>{icon}{label}</button>
);

// ======================== MAIN ========================
export default function AldeiaScreens() {
  const [screen, setScreen] = useState("partner_list");

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", padding: 20, background: `radial-gradient(ellipse at 50% 0%, #162231, #0B1219 70%)`, fontFamily: font }}>
      <link href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=Caveat:wght@400;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <div style={{ width: 400, maxHeight: 820, background: C.bg, borderRadius: 44, overflow: "auto", position: "relative", boxShadow: `0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px ${C.border}`, display: "flex", flexDirection: "column" }}>
        {/* Notch */}
        <div style={{ display: "flex", justifyContent: "center", padding: "8px 0 0", background: C.bg, flexShrink: 0 }}>
          <div style={{ width: 120, height: 28, borderRadius: 20, background: "#000" }} />
        </div>

        {/* Screen nav */}
        <div style={{ display: "flex", gap: 4, padding: "8px 12px", overflowX: "auto", flexShrink: 0 }}>
          {screens.map(s => (
            <button key={s.id} onClick={() => setScreen(s.id)} style={{
              padding: "5px 10px", borderRadius: 8, cursor: "pointer", flexShrink: 0,
              background: screen === s.id ? C.accent + "15" : C.bgCard,
              border: `1px solid ${screen === s.id ? C.accent + "30" : C.border}`,
              color: screen === s.id ? C.accent : C.textGhost, fontSize: 9, fontWeight: 700, fontFamily: font,
            }}>{s.label}</button>
          ))}
        </div>

        <div style={{ flex: 1, overflow: "auto" }}>

          {/* ==================== LISTA DE PARCEIROS ==================== */}
          {screen === "partner_list" && (
            <div>
              <Header title="Parceiros da Aldeia" onBack={() => {}} />
              <div style={{ padding: "14px 20px 30px" }}>
                {/* Search */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 14, padding: "0 14px", height: 46, marginBottom: 14 }}>
                  {I.search(16, C.textDim)}
                  <span style={{ color: C.placeholder, fontSize: 13, fontFamily: font }}>Buscar parceiro...</span>
                </div>

                {/* Filter chips */}
                <div style={{ display: "flex", gap: 6, marginBottom: 16, overflowX: "auto" }}>
                  {["Todos", "Vet", "Pet Shop", "Passeador", "Hotel", "Adestrador"].map((f, i) => (
                    <button key={i} style={{
                      padding: "6px 12px", borderRadius: 8, cursor: "pointer", flexShrink: 0,
                      background: i === 0 ? C.accent + "12" : C.card,
                      border: `1px solid ${i === 0 ? C.accent + "25" : C.border}`,
                      color: i === 0 ? C.accent : C.textDim, fontSize: 11, fontWeight: 600, fontFamily: font,
                    }}>{f}</button>
                  ))}
                </div>

                {/* List */}
                {partners.map(p => {
                  const tc = typeColors[p.type] || C.accent;
                  return (
                    <div key={p.id} onClick={() => setScreen("partner_profile")} style={{
                      display: "flex", alignItems: "center", gap: 12, padding: "14px 16px",
                      background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, marginBottom: 8, cursor: "pointer",
                    }}>
                      <div style={{ width: 48, height: 48, borderRadius: 16, background: tc + "10", display: "flex", alignItems: "center", justifyContent: "center", border: `1.5px solid ${tc}20` }}>
                        {I.store(22, tc)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ color: C.text, fontSize: 14, fontWeight: 700, fontFamily: font }}>{p.name}</span>
                          {p.verified && I.shield(11, C.success)}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
                          <span style={{ color: tc, fontSize: 9, fontWeight: 700, background: tc + "10", padding: "1px 6px", borderRadius: 4 }}>{typeLabels[p.type]}</span>
                          <span style={{ color: C.textGhost }}>·</span>
                          <span style={{ color: C.textDim, fontSize: 10, fontFamily: font }}>{p.distance}</span>
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                          {I.star(10, C.gold)}
                          <span style={{ color: C.gold, fontSize: 13, fontWeight: 700, fontFamily: fontMono }}>{p.rating}</span>
                        </div>
                        {p.discount > 0 && <span style={{ color: C.success, fontSize: 10, fontWeight: 700, fontFamily: font }}>-{p.discount}%</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ==================== PERFIL DO PARCEIRO ==================== */}
          {screen === "partner_profile" && (
            <div>
              <Header title="" onBack={() => setScreen("partner_list")} />
              <div style={{ padding: "14px 20px 30px" }}>
                {/* Hero */}
                <div style={{ textAlign: "center", marginBottom: 18 }}>
                  <div style={{ width: 80, height: 80, borderRadius: 24, background: C.success + "10", border: `2.5px solid ${C.success}25`, margin: "0 auto 12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {I.store(36, C.success)}
                  </div>
                  <h2 style={{ color: C.text, fontSize: 22, fontWeight: 800, margin: "0 0 4px", fontFamily: font }}>VetAmigo</h2>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                    <span style={{ color: C.success, fontSize: 10, fontWeight: 700, background: C.successSoft, padding: "2px 8px", borderRadius: 4 }}>Veterinária</span>
                    {I.shield(12, C.success)}
                    <span style={{ color: C.success, fontSize: 10, fontWeight: 600, fontFamily: font }}>Verificado</span>
                  </div>
                </div>

                {/* Stats */}
                <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                  {[
                    { label: "Nota", value: "4.9", color: C.gold, icon: I.star(12, C.gold) },
                    { label: "Avaliações", value: "23", color: C.accent },
                    { label: "Distância", value: "1.2km", color: C.petrol },
                    { label: "Desconto PoL", value: "até 15%", color: C.success },
                  ].map((s, i) => (
                    <div key={i} style={{ flex: 1, background: C.card, borderRadius: 12, padding: "10px 4px", textAlign: "center", border: `1px solid ${C.border}` }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 3 }}>
                        {s.icon}
                        <span style={{ color: s.color, fontSize: 14, fontWeight: 800, fontFamily: fontMono }}>{s.value}</span>
                      </div>
                      <span style={{ color: C.textDim, fontSize: 8, fontFamily: font }}>{s.label}</span>
                    </div>
                  ))}
                </div>

                {/* Discount table */}
                <div style={{ background: C.card, borderRadius: 16, padding: "14px 16px", border: `1px solid ${C.border}`, marginBottom: 14 }}>
                  <span style={{ color: C.textGhost, fontSize: 10, fontWeight: 700, letterSpacing: 2, fontFamily: font }}>DESCONTOS POR PROOF OF LOVE</span>
                  {[
                    { level: "Bronze", pct: "5%", color: "#CD7F32" },
                    { level: "Prata", pct: "10%", color: "#C0C0C0" },
                    { level: "Ouro", pct: "15%", color: C.gold },
                    { level: "Diamante", pct: "20%", color: C.petrol },
                  ].map((d, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: i < 3 ? `1px solid ${C.border}` : "none" }}>
                      <span style={{ color: d.color, fontSize: 12, fontWeight: 600, fontFamily: font }}>{d.level}</span>
                      <span style={{ color: C.success, fontSize: 14, fontWeight: 800, fontFamily: fontMono }}>{d.pct}</span>
                    </div>
                  ))}
                </div>

                {/* Info */}
                {[
                  { icon: I.mapPin(14, C.petrol), label: "Rua das Flores, 123 — Salto, SP" },
                  { icon: I.clock(14, C.textDim), label: "Seg-Sáb 8h-18h" },
                  { icon: I.phone(14, C.accent), label: "(11) 4028-1234" },
                ].map((inf, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, marginBottom: 6 }}>
                    {inf.icon}
                    <span style={{ color: C.textSec, fontSize: 12, fontFamily: font }}>{inf.label}</span>
                  </div>
                ))}

                <PrimaryButton label="Ligar / Agendar" icon={I.phone(14, "#fff")} />
              </div>
            </div>
          )}

          {/* ==================== MODAL: NOVO POST ==================== */}
          {screen === "modal_post" && (
            <div>
              <ModalHeader title="Novo Post" onClose={() => {}} />
              <div style={{ padding: "16px 20px 30px" }}>
                <ChipSelect label="Pet" options={["Rex (Labrador)", "Luna (Siamês)"]} />
                <InputField label="O que está acontecendo?" placeholder="Conte à Aldeia..." multiline />
                <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                  <button style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: 12, borderRadius: 12, background: C.card, border: `1.5px solid ${C.border}`, cursor: "pointer" }}>
                    {I.camera(16, C.accent)}<span style={{ color: C.accent, fontSize: 12, fontWeight: 600, fontFamily: font }}>Foto</span>
                  </button>
                  <button style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: 12, borderRadius: 12, background: C.card, border: `1.5px solid ${C.border}`, cursor: "pointer" }}>
                    {I.mic(16, C.accent)}<span style={{ color: C.accent, fontSize: 12, fontWeight: 600, fontFamily: font }}>Voz</span>
                  </button>
                </div>
                <PrimaryButton label="Publicar" />
              </div>
            </div>
          )}

          {/* ==================== MODAL: TIPO SOS ==================== */}
          {screen === "modal_sos" && (
            <div>
              <ModalHeader title="Pedir SOS" onClose={() => {}} />
              <div style={{ padding: "16px 20px 30px" }}>
                <p style={{ color: C.textDim, fontSize: 12, margin: "0 0 16px", fontFamily: font }}>Selecione o tipo de emergência</p>
                {[
                  { icon: I.heartPulse(24, C.danger), label: "Emergência Médica", desc: "Pet doente ou ferido, preciso de ajuda agora", color: C.danger },
                  { icon: I.search(24, C.warning), label: "Pet Perdido", desc: "Meu pet fugiu ou desapareceu", color: C.warning },
                  { icon: I.megaphone(24, C.accent), label: "Preciso de Ajuda Urgente", desc: "Transporte, medicamento, cuidado imediato", color: C.accent },
                ].map((s, i) => (
                  <button key={i} style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 14,
                    padding: "18px 16px", borderRadius: 18, marginBottom: 10, cursor: "pointer",
                    background: s.color + "06", border: `1.5px solid ${s.color}20`, textAlign: "left",
                  }}>
                    <div style={{ width: 52, height: 52, borderRadius: 18, background: s.color + "10", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {s.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <span style={{ color: s.color, fontSize: 15, fontWeight: 700, fontFamily: font, display: "block" }}>{s.label}</span>
                      <span style={{ color: C.textDim, fontSize: 11, fontFamily: font, marginTop: 2, display: "block" }}>{s.desc}</span>
                    </div>
                    {I.arrowRight(14, s.color)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ==================== MODAL: NOVO EVENTO ==================== */}
          {screen === "modal_event" && (
            <div>
              <ModalHeader title="Criar Evento" onClose={() => {}} />
              <div style={{ padding: "16px 20px 30px" }}>
                <InputField label="Nome do evento" placeholder="Ex: Passeio coletivo no parque" />
                <ChipSelect label="Tipo" options={["Passeio", "Social", "Feira", "Vacinação", "Workshop", "Adoção"]} />
                <InputField label="Descrição" placeholder="Detalhes do evento..." multiline />
                <div style={{ display: "flex", gap: 8 }}>
                  <div style={{ flex: 1 }}><InputField label="Data" placeholder="dd/mm/aaaa" icon={I.calendar(14, C.accent)} /></div>
                  <div style={{ flex: 1 }}><InputField label="Horário" placeholder="08:00" icon={I.clock(14, C.accent)} /></div>
                </div>
                <InputField label="Local" placeholder="Nome do local" icon={I.mapPin(14, C.petrol)} />
                <InputField label="Limite de pets (opcional)" placeholder="Ex: 20" />
                <PrimaryButton label="Criar Evento" icon={I.calendar(14, "#fff")} />
              </div>
            </div>
          )}

          {/* ==================== MODAL: NOVO FAVOR ==================== */}
          {screen === "modal_favor" && (
            <div>
              <ModalHeader title="Pedir Favor" onClose={() => {}} />
              <div style={{ padding: "16px 20px 30px" }}>
                <ChipSelect label="Pet" options={["Rex (Labrador)", "Luna (Siamês)"]} />
                <ChipSelect label="Tipo de favor" options={["Passeio", "Cuidar", "Transporte", "Alimentar", "Banho/Tosa", "Outro"]} activeColor={C.petrol} />
                <InputField label="O que precisa?" placeholder="Descreva o favor..." multiline />

                {/* Voice / Camera buttons */}
                <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                  <button style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: 12, borderRadius: 12, background: C.card, border: `1.5px solid ${C.border}`, cursor: "pointer" }}>
                    {I.mic(16, C.accent)}<span style={{ color: C.accent, fontSize: 12, fontWeight: 600, fontFamily: font }}>Falar</span>
                  </button>
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <div style={{ flex: 1 }}><InputField label="Data" placeholder="dd/mm/aaaa" icon={I.calendar(14, C.accent)} /></div>
                  <div style={{ flex: 1 }}><InputField label="Horário" placeholder="14:00—15:00" icon={I.clock(14, C.accent)} /></div>
                </div>
                <InputField label="Local de encontro" placeholder="Endereço ou ponto de referência" icon={I.mapPin(14, C.petrol)} />

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, marginBottom: 16 }}>
                  <span style={{ color: C.textDim, fontSize: 12, fontFamily: font }}>Urgente?</span>
                  <div style={{ width: 44, height: 24, borderRadius: 12, background: C.border, padding: 2, cursor: "pointer" }}>
                    <div style={{ width: 20, height: 20, borderRadius: 10, background: C.textDim }} />
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 14px", background: C.goldSoft, borderRadius: 12, border: `1px solid ${C.gold}10`, marginBottom: 16 }}>
                  {I.tag(12, C.gold)}
                  <span style={{ color: C.gold, fontSize: 11, fontWeight: 600, fontFamily: font }}>Recompensa: +15 Pet-Credits para quem ajudar</span>
                </div>

                <PrimaryButton label="Publicar Favor" icon={I.handshake(14, "#fff")} />
              </div>
            </div>
          )}

          {/* ==================== MODAL: NOVO CLASSIFICADO ==================== */}
          {screen === "modal_classified" && (
            <div>
              <ModalHeader title="Oferecer Item" onClose={() => {}} />
              <div style={{ padding: "16px 20px 30px" }}>
                <InputField label="Nome do item" placeholder="Ex: Ração Royal Canin 3kg" />
                <ChipSelect label="Categoria" options={["Ração", "Medicamento", "Acessório", "Brinquedo", "Transportadora", "Roupa", "Outro"]} />
                <ChipSelect label="Condição" options={["Novo", "Usado", "Vence em breve"]} activeColor={C.petrol} />
                <ChipSelect label="Tipo de oferta" options={["Doação", "Troca", "Empréstimo"]} activeColor={C.success} />
                <InputField label="Descrição (opcional)" placeholder="Detalhes, marca, validade..." multiline />

                <button style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: 14, borderRadius: 14, background: C.card, border: `1.5px dashed ${C.border}`, cursor: "pointer", marginBottom: 16 }}>
                  {I.camera(18, C.accent)}
                  <span style={{ color: C.accent, fontSize: 13, fontWeight: 600, fontFamily: font }}>Adicionar foto</span>
                </button>

                <PrimaryButton label="Publicar" icon={I.gift(14, "#fff")} />
              </div>
            </div>
          )}

          {/* ==================== MODAL: AVALIAÇÃO PÓS-FAVOR ==================== */}
          {screen === "modal_review" && (
            <div>
              <ModalHeader title="Avaliar Favor" onClose={() => {}} />
              <div style={{ padding: "16px 20px 30px" }}>
                {/* Context */}
                <div style={{ background: C.card, borderRadius: 16, padding: "14px 16px", border: `1px solid ${C.border}`, marginBottom: 18, display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: C.accent + "10", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {I.dog(22, C.accent)}
                  </div>
                  <div>
                    <span style={{ color: C.text, fontSize: 13, fontWeight: 700, fontFamily: font }}>João passeou com o Rex</span>
                    <span style={{ color: C.textDim, fontSize: 11, fontFamily: font, display: "block", marginTop: 2 }}>Ontem · 14:00—15:00 · Parque Central</span>
                  </div>
                </div>

                <StarRating label="Pontualidade" defaultVal={5} />
                <StarRating label="Cuidado com o pet" defaultVal={5} />
                <StarRating label="Comunicação" defaultVal={4} />
                <StarRating label="Seguiu orientações" defaultVal={5} />

                <InputField label="Comentário (opcional)" placeholder="Como foi a experiência?" multiline />

                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 14px", background: C.successSoft, borderRadius: 12, border: `1px solid ${C.success}10`, marginBottom: 16 }}>
                  {I.check(14, C.success)}
                  <span style={{ color: C.success, fontSize: 12, fontWeight: 600, fontFamily: font }}>João recebeu +15 Pet-Credits por este favor</span>
                </div>

                <PrimaryButton label="Enviar Avaliação" icon={I.star(14, "#fff")} />
              </div>
            </div>
          )}

        </div>
        <style>{`::-webkit-scrollbar{width:0;height:0}`}</style>
      </div>
    </div>
  );
}
