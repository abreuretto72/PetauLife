import { useState } from "react";

// ======================== DESIGN TOKENS v6 (idêntico ao CLAUDE.md) ========================
const C = {
  bg: "#0F1923", bgCard: "#162231", bgDeep: "#0B1219",
  card: "#1A2B3D", cardHover: "#1E3145", cardGlow: "#1F3448",
  accent: "#E8813A", accentLight: "#F09A56", accentDark: "#CC6E2E",
  accentGlow: "#E8813A15", accentMed: "#E8813A25",
  petrol: "#1B8EAD", petrolLight: "#22A8CC", petrolDark: "#15748F", petrolGlow: "#1B8EAD15",
  success: "#2ECC71", successSoft: "#2ECC7112",
  danger: "#E74C3C", dangerSoft: "#E74C3C12",
  warning: "#F1C40F", warningSoft: "#F1C40F12",
  purple: "#9B59B6", purpleGlow: "#9B59B620",
  gold: "#F39C12", goldSoft: "#F39C1212",
  rose: "#E84393",
  sky: "#3498DB",
  text: "#E8EDF2", textSec: "#8FA3B8", textDim: "#5E7A94", textGhost: "#2E4254",
  placeholder: "#5E7A94",
  border: "#1E3248", borderLight: "#243A50",
  shadowAccent: "0 8px 30px rgba(232,129,58,0.25)",
  shadowLg: "0 16px 50px rgba(0,0,0,0.4)",
};
const font = "'Sora', -apple-system, sans-serif";
const fontMono = "'JetBrains Mono', monospace";
const fontHand = "'Caveat', cursive";

// ======================== SVG ICONS (zero emojis) ========================
const I = {
  back: (s=18,c=C.accent) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15,18 9,12 15,6"/></svg>,
  bell: (s=20,c=C.accent) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>,
  arrowRight: (s=14,c=C.accent) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9,6 15,12 9,18"/></svg>,
  plus: (s=18,c=C.accent) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  // Tab icons
  home: (s=22,c=C.textDim) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>,
  mapPin: (s=22,c=C.textDim) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  zap: (s=22,c=C.textDim) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="13,2 3,14 12,14 11,22 21,10 12,10"/></svg>,
  menu: (s=22,c=C.textDim) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>,
  // Content icons
  heart: (s=16,c=C.accent) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>,
  heartFill: (s=16,c=C.accent) => <svg width={s} height={s} viewBox="0 0 24 24" fill={c} stroke={c} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>,
  msgCircle: (s=16,c=C.textDim) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg>,
  share: (s=16,c=C.accent) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>,
  dog: (s=20,c=C.accent) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10 5.172C10 3.782 8.423 2.679 6.5 3c-2.823.47-4.113 6.006-4 7 .137 1.217.652 2 1.5 2.5V19a2 2 0 002 2h10a2 2 0 002-2v-6.328c.848-.5 1.363-1.283 1.5-2.5.113-.994-1.177-6.53-4-7C13.577 2.679 12 3.782 12 5.172V5.5"/><circle cx="8.5" cy="10" r="1" fill={c} stroke="none"/><circle cx="13.5" cy="10" r="1" fill={c} stroke="none"/></svg>,
  cat: (s=20,c=C.purple) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c4.97 0 9-2.686 9-6v-.8c0-1.3-.3-2.3-1-3.2 0-2-1-3.5-3-4l1-6-4 3c-1.3-.4-2.7-.4-4 0L6 2l1 6c-2 .5-3 2-3 4-.7.9-1 1.9-1 3.2v.8c0 3.314 4.03 6 9 6z"/><circle cx="9" cy="13" r="1" fill={c} stroke="none"/><circle cx="15" cy="13" r="1" fill={c} stroke="none"/></svg>,
  sparkle: (s=14,c=C.purple) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z"/></svg>,
  alertTri: (s=18,c=C.danger) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  shield: (s=16,c=C.success) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9,12 11,14 15,10"/></svg>,
  trophy: (s=16,c=C.gold) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 010-5H6M18 9h1.5a2.5 2.5 0 000-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22M18 2H6v7a6 6 0 0012 0V2z"/></svg>,
  users: (s=18,c=C.petrol) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
  calendar: (s=16,c=C.accent) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  handshake: (s=16,c=C.petrol) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 17a1 1 0 01-1 1H6l-4 4V8a2 2 0 012-2h6a2 2 0 012 2v9z"/><path d="M14 9h4a2 2 0 012 2v11l-4-4h-4a1 1 0 01-1-1v-1"/></svg>,
  tag: (s=14,c=C.petrol) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
  gift: (s=16,c=C.accent) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="20,12 20,22 4,22 4,12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/></svg>,
  star: (s=16,c=C.gold) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>,
  globe: (s=14,c=C.petrol) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>,
  clock: (s=12,c=C.textGhost) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>,
  mic: (s=18,c=C.accent) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 00-3 3v6a3 3 0 006 0V5a3 3 0 00-3-3z"/><path d="M19 10v1a7 7 0 01-14 0v-1"/><line x1="12" y1="18" x2="12" y2="22"/></svg>,
  camera: (s=18,c=C.accent) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  megaphone: (s=20,c=C.danger) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11l18-5v12L3 13v-2z"/><path d="M11.6 16.8a3 3 0 11-5.8-1.6"/></svg>,
  user: (s=22,c="#fff") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  store: (s=16,c=C.accent) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l1-4h16l1 4"/><path d="M3 9v11a1 1 0 001 1h16a1 1 0 001-1V9"/><path d="M9 21V12h6v9"/></svg>,
  barChart: (s=16,c=C.gold) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>,
};

// ======================== MOCK DATA ========================
const aldeiaData = {
  name: "Aldeia Salto", city: "Salto, SP",
  members: 48, pets: 67, partners: 5,
  myLevel: "guardian", myCredits: 125, myKarma: 78,
};

const feedPosts = [
  { id: 1, author: "Carlos Mendes", pet: "Thor", species: "dog", text: "levei o thor pro parque hj e ele quase arrancou meu braço de tanta animação kkk voltou destruído e dormiu no carro", time: "12 min", admirations: 8, comments: 3, hasPhoto: true },
  { id: 2, author: "Paula Ribeiro", pet: "Mel", species: "dog", text: "Alguém pode passear com a Mel amanhã das 14h às 15h? Tenho reunião e não consigo sair. Moro na Rua XV.", time: "45 min", admirations: 2, comments: 5, hasPhoto: false, isFavor: true },
  { id: 3, author: "Maria Santos", pet: "Luna", species: "cat", text: "Dica: Dr. Carlos da VetAmigo é excelente com gatos. Luna fez check-up e ele foi super atencioso. Recomendo!", time: "2h", admirations: 14, comments: 7, hasPhoto: false },
  { id: 4, author: "auExpert IA", pet: null, species: null, text: "A Aldeia Salto está crescendo! Esta semana tivemos 12 favores completados e 3 novos membros. O humor médio dos pets está 85% feliz.", time: "3h", admirations: 21, comments: 1, isAI: true },
];

const sosActive = [
  { id: 1, type: "lost_pet", pet: "Pipoca", breed: "SRD", time: "1h 23min", phase: 2, sightings: 3, responders: 8 },
];

const eventsUpcoming = [
  { id: 1, title: "Passeio coletivo no Parque Central", type: "walk", date: "Sáb 05/04", time: "08:00", confirmed: 7, organizer: "Carlos" },
  { id: 2, title: "Vacinação coletiva — VetAmigo", type: "vaccination", date: "Seg 07/04", time: "14:00", confirmed: 4, organizer: "Dr. Carlos", discount: "15%" },
  { id: 3, title: "Feira de troca solidária", type: "fair", date: "Dom 13/04", time: "10:00", confirmed: 12, organizer: "Lúcia" },
];

const topPets = [
  { name: "Thor", breed: "Golden", admirations: 34, species: "dog" },
  { name: "Rex", breed: "Labrador", admirations: 28, species: "dog" },
  { name: "Luna", breed: "Siamês", admirations: 22, species: "cat" },
];

// ======================== MAIN ========================
export default function AldeiaHome() {
  const [tab, setTab] = useState("feed"); // feed | map | sos | more
  const [admired, setAdmired] = useState({});

  const tabs = [
    { id: "feed", label: "Feed", icon: I.home },
    { id: "map", label: "Mapa", icon: I.mapPin },
    { id: "sos", label: "SOS", icon: I.zap, badge: sosActive.length > 0 ? sosActive.length : null },
    { id: "more", label: "Mais", icon: I.menu },
  ];

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", padding: 20, background: `radial-gradient(ellipse at 50% 0%, #162231, #0B1219 70%)`, fontFamily: font }}>
      <link href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=Caveat:wght@400;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <div style={{ width: 400, maxHeight: 820, background: C.bg, borderRadius: 44, overflow: "hidden", position: "relative", boxShadow: `0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px ${C.border}`, display: "flex", flexDirection: "column" }}>
        {/* Notch */}
        <div style={{ display: "flex", justifyContent: "center", padding: "8px 0 0", background: C.bg }}>
          <div style={{ width: 120, height: 28, borderRadius: 20, background: "#000" }} />
        </div>

        {/* ===== HEADER ===== */}
        <div style={{ padding: "12px 20px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", background: C.bg }}>
          <button style={{ background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 12, width: 42, height: 42, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {I.back(18, C.accent)}
          </button>
          <div style={{ textAlign: "center" }}>
            <h2 style={{ color: C.text, fontSize: 17, fontWeight: 700, margin: 0, fontFamily: font }}>{aldeiaData.name}</h2>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 2 }}>
              {I.globe(11, C.petrol)}
              <span style={{ color: C.textDim, fontSize: 11, fontFamily: font }}>{aldeiaData.members} tutores · {aldeiaData.pets} pets</span>
            </div>
          </div>
          <button style={{ background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 12, width: 42, height: 42, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
            {I.bell(20, C.accent)}
            <div style={{ position: "absolute", top: 9, right: 9, width: 8, height: 8, borderRadius: 4, background: C.danger, border: `2px solid ${C.bg}` }} />
          </button>
        </div>

        {/* ===== CONTENT ===== */}
        <div style={{ flex: 1, overflow: "auto" }}>

          {/* ==================== TAB: FEED ==================== */}
          {tab === "feed" && (
            <div style={{ padding: "0 0 20px" }}>
              {/* My stats bar */}
              <div style={{ display: "flex", gap: 6, padding: "0 16px 14px", overflowX: "auto" }}>
                {[
                  { icon: I.trophy(14, C.gold), label: "Guardião", color: C.gold },
                  { icon: I.star(14, C.accent), label: `${aldeiaData.myCredits} PC`, color: C.accent },
                  { icon: I.shield(14, C.success), label: `Karma ${aldeiaData.myKarma}`, color: C.success },
                  { icon: I.users(14, C.petrol), label: `${aldeiaData.members}`, color: C.petrol },
                ].map((s, i) => (
                  <div key={i} style={{ background: s.color + "08", border: `1px solid ${s.color}15`, borderRadius: 10, padding: "6px 12px", display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                    {s.icon}
                    <span style={{ color: s.color, fontSize: 10, fontWeight: 700, fontFamily: font }}>{s.label}</span>
                  </div>
                ))}
              </div>

              {/* SOS Active banner */}
              {sosActive.length > 0 && (
                <button onClick={() => setTab("sos")} style={{
                  display: "flex", width: "calc(100% - 32px)", margin: "0 16px 14px",
                  padding: "12px 16px", borderRadius: 14,
                  background: C.dangerSoft, border: `1px solid ${C.danger}20`,
                  alignItems: "center", gap: 10, cursor: "pointer", textAlign: "left",
                }}>
                  {I.megaphone(18, C.danger)}
                  <div style={{ flex: 1 }}>
                    <span style={{ color: C.danger, fontSize: 12, fontWeight: 700, fontFamily: font }}>SOS Ativo: {sosActive[0].pet} ({sosActive[0].breed}) perdido</span>
                    <span style={{ color: C.textDim, fontSize: 10, fontFamily: font, display: "block", marginTop: 2 }}>{sosActive[0].sightings} avistamentos · {sosActive[0].responders} ajudando</span>
                  </div>
                  {I.arrowRight(12, C.danger)}
                </button>
              )}

              {/* New post button */}
              <button style={{
                display: "flex", width: "calc(100% - 32px)", margin: "0 16px 16px",
                padding: "14px 16px", borderRadius: 16,
                background: C.card, border: `1.5px solid ${C.border}`,
                alignItems: "center", gap: 12, cursor: "pointer",
              }}>
                <div style={{ width: 36, height: 36, borderRadius: 12, background: `linear-gradient(135deg, ${C.accent}, ${C.accentDark})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {I.user(18, "#fff")}
                </div>
                <span style={{ color: C.placeholder, fontSize: 14, fontFamily: font, flex: 1, textAlign: "left" }}>O que está acontecendo?</span>
                <div style={{ display: "flex", gap: 8 }}>
                  {I.camera(16, C.accent)}
                  {I.mic(16, C.accent)}
                </div>
              </button>

              {/* Feed posts */}
              {feedPosts.map(post => (
                <div key={post.id} style={{
                  padding: "16px", margin: "0 16px 10px", borderRadius: 18,
                  background: post.isAI ? C.purple + "06" : C.card,
                  border: `1px solid ${post.isAI ? C.purple + "15" : post.isFavor ? C.petrol + "20" : C.border}`,
                }}>
                  {/* Author */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 12,
                      background: post.isAI ? C.purple + "15" : C.bgCard,
                      border: `1.5px solid ${post.isAI ? C.purple + "25" : C.border}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {post.isAI ? I.sparkle(16, C.purple) : post.species === "cat" ? I.cat(18, C.purple) : I.dog(18, C.accent)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ color: C.text, fontSize: 13, fontWeight: 700, fontFamily: font }}>{post.author}</span>
                        {post.pet && <span style={{ color: C.textDim, fontSize: 11, fontFamily: font }}>· {post.pet}</span>}
                        {post.isFavor && <span style={{ color: C.petrol, fontSize: 9, fontWeight: 700, background: C.petrol + "12", padding: "2px 6px", borderRadius: 4 }}>FAVOR</span>}
                        {post.isAI && <span style={{ color: C.purple, fontSize: 9, fontWeight: 700, background: C.purple + "12", padding: "2px 6px", borderRadius: 4 }}>IA</span>}
                      </div>
                      <span style={{ color: C.textGhost, fontSize: 10, fontFamily: font }}>{post.time}</span>
                    </div>
                  </div>

                  {/* Content */}
                  <p style={{ color: post.isAI ? C.textSec : C.text, fontSize: 13, lineHeight: 1.7, margin: "0 0 10px", fontFamily: post.isAI ? font : font }}>{post.text}</p>

                  {/* Photo placeholder */}
                  {post.hasPhoto && (
                    <div style={{ height: 160, borderRadius: 14, background: C.bgCard, border: `1px solid ${C.border}`, marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {I.camera(28, C.textGhost)}
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <button onClick={() => setAdmired(prev => ({...prev, [post.id]: !prev[post.id]}))} style={{
                      display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer", padding: "6px 10px", borderRadius: 8,
                      ...(admired[post.id] ? { background: C.accent + "10" } : {}),
                    }}>
                      {admired[post.id] ? I.heartFill(16, C.accent) : I.heart(16, C.textDim)}
                      <span style={{ color: admired[post.id] ? C.accent : C.textDim, fontSize: 11, fontWeight: 600, fontFamily: font }}>{post.admirations + (admired[post.id] ? 1 : 0)}</span>
                    </button>
                    <button style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer", padding: "6px 10px", borderRadius: 8 }}>
                      {I.msgCircle(16, C.textDim)}
                      <span style={{ color: C.textDim, fontSize: 11, fontWeight: 600, fontFamily: font }}>{post.comments}</span>
                    </button>
                    <div style={{ flex: 1 }} />
                    <button style={{ background: "none", border: "none", cursor: "pointer", padding: 6 }}>
                      {I.share(16, C.accent)}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ==================== TAB: MAP ==================== */}
          {tab === "map" && (
            <div style={{ padding: "0 16px 20px" }}>
              {/* Map placeholder */}
              <div style={{
                height: 280, borderRadius: 20, marginBottom: 16,
                background: `linear-gradient(180deg, ${C.card}, ${C.bgCard})`,
                border: `1px solid ${C.border}`,
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12,
                position: "relative", overflow: "hidden",
              }}>
                {/* Grid lines */}
                {[...Array(8)].map((_, i) => (
                  <div key={i} style={{ position: "absolute", top: 0, left: `${(i+1)*12.5}%`, width: 1, height: "100%", background: C.border, opacity: 0.3 }} />
                ))}
                {[...Array(6)].map((_, i) => (
                  <div key={i} style={{ position: "absolute", left: 0, top: `${(i+1)*16.6}%`, height: 1, width: "100%", background: C.border, opacity: 0.3 }} />
                ))}
                {/* Pins */}
                {[
                  { x: 30, y: 35, color: C.accent, label: "Você" },
                  { x: 55, y: 25, color: C.accent, label: "Thor" },
                  { x: 70, y: 50, color: C.purple, label: "Luna" },
                  { x: 40, y: 65, color: C.accent, label: "Bob" },
                  { x: 20, y: 55, color: C.accent, label: "Mel" },
                  { x: 80, y: 30, color: C.success, label: "VetAmigo", isPartner: true },
                  { x: 60, y: 70, color: C.danger, label: "SOS", isSOS: true },
                ].map((pin, i) => (
                  <div key={i} style={{
                    position: "absolute", left: `${pin.x}%`, top: `${pin.y}%`, transform: "translate(-50%, -50%)",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 2, cursor: "pointer",
                  }}>
                    <div style={{
                      width: pin.isSOS ? 28 : pin.isPartner ? 24 : 20, height: pin.isSOS ? 28 : pin.isPartner ? 24 : 20,
                      borderRadius: pin.isSOS ? 8 : 10,
                      background: pin.color + "20", border: `2px solid ${pin.color}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      animation: pin.isSOS ? "pulse 1.5s ease infinite" : "none",
                    }}>
                      <div style={{ width: 6, height: 6, borderRadius: 3, background: pin.color }} />
                    </div>
                    <span style={{ color: pin.color, fontSize: 8, fontWeight: 700, fontFamily: font, background: C.bg + "CC", padding: "1px 4px", borderRadius: 3 }}>{pin.label}</span>
                  </div>
                ))}
                {I.mapPin(28, C.textGhost)}
                <span style={{ color: C.textDim, fontSize: 11, fontFamily: font }}>Mapa da Aldeia</span>
              </div>

              {/* Nearby tutors */}
              <p style={{ color: C.textGhost, fontSize: 11, fontWeight: 700, letterSpacing: 2, margin: "0 0 12px", fontFamily: font }}>PERTO DE VOCÊ</p>
              {[
                { name: "Thor", breed: "Golden Retriever", tutor: "Carlos", dist: "500m", species: "dog" },
                { name: "Mel", breed: "Poodle", tutor: "Paula", dist: "300m", species: "dog" },
                { name: "Luna", breed: "Siamês", tutor: "Maria", dist: "200m", species: "cat" },
              ].map((p, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
                  background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, marginBottom: 8, cursor: "pointer",
                }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: (p.species === "cat" ? C.purple : C.accent) + "10", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {p.species === "cat" ? I.cat(20, C.purple) : I.dog(20, C.accent)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={{ color: C.text, fontSize: 13, fontWeight: 700, fontFamily: font }}>{p.name}</span>
                    <span style={{ color: C.textDim, fontSize: 11, fontFamily: font, display: "block" }}>{p.breed} · {p.tutor}</span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ color: C.petrol, fontSize: 12, fontWeight: 700, fontFamily: fontMono }}>{p.dist}</span>
                  </div>
                  {I.arrowRight(12, C.accent)}
                </div>
              ))}
            </div>
          )}

          {/* ==================== TAB: SOS ==================== */}
          {tab === "sos" && (
            <div style={{ padding: "0 16px 20px" }}>
              {/* SOS Button */}
              <button style={{
                width: "100%", padding: "28px 20px", borderRadius: 22, cursor: "pointer",
                background: `linear-gradient(135deg, ${C.danger}15, ${C.danger}08)`,
                border: `2.5px solid ${C.danger}30`,
                display: "flex", flexDirection: "column", alignItems: "center", gap: 12, marginBottom: 20,
                position: "relative", overflow: "hidden",
              }}>
                <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 150, height: 150, borderRadius: "50%", background: `radial-gradient(circle, ${C.danger}08, transparent 70%)`, pointerEvents: "none" }} />
                <div style={{
                  width: 64, height: 64, borderRadius: 22,
                  background: `linear-gradient(135deg, ${C.danger}, #C0392B)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: `0 8px 25px ${C.danger}30`, position: "relative", zIndex: 1,
                }}>
                  {I.megaphone(28, "#fff")}
                </div>
                <span style={{ color: C.danger, fontSize: 18, fontWeight: 800, fontFamily: font, position: "relative", zIndex: 1 }}>Pedir SOS</span>
                <span style={{ color: C.textDim, fontSize: 12, fontFamily: font, position: "relative", zIndex: 1 }}>Emergência médica, pet perdido ou ajuda urgente</span>
              </button>

              {/* Active SOS */}
              {sosActive.length > 0 && (
                <>
                  <p style={{ color: C.danger, fontSize: 11, fontWeight: 700, letterSpacing: 2, margin: "0 0 12px", fontFamily: font }}>SOS ATIVOS</p>
                  {sosActive.map(sos => (
                    <div key={sos.id} style={{
                      background: C.danger + "06", borderRadius: 18, padding: 18,
                      border: `1px solid ${C.danger}15`, marginBottom: 14, cursor: "pointer",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                        {I.alertTri(18, C.danger)}
                        <div style={{ flex: 1 }}>
                          <span style={{ color: C.danger, fontSize: 14, fontWeight: 700, fontFamily: font }}>
                            {sos.type === "lost_pet" ? "Pet Perdido" : sos.type === "medical" ? "Emergência Médica" : "Ajuda Urgente"}
                          </span>
                          <span style={{ color: C.textDim, fontSize: 11, fontFamily: font, display: "block" }}>Há {sos.time}</span>
                        </div>
                        <span style={{ color: C.danger, fontSize: 10, fontWeight: 700, background: C.danger + "12", padding: "3px 8px", borderRadius: 6, fontFamily: font }}>Fase {sos.phase}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                        <div style={{ width: 48, height: 48, borderRadius: 16, background: C.accent + "10", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {I.dog(26, C.accent)}
                        </div>
                        <div>
                          <span style={{ color: C.text, fontSize: 16, fontWeight: 700, fontFamily: font }}>{sos.pet}</span>
                          <span style={{ color: C.textDim, fontSize: 12, fontFamily: font, display: "block" }}>{sos.breed}</span>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <div style={{ flex: 1, background: C.card, borderRadius: 10, padding: "8px 12px", textAlign: "center", border: `1px solid ${C.border}` }}>
                          <span style={{ color: C.petrol, fontSize: 16, fontWeight: 800, fontFamily: fontMono }}>{sos.sightings}</span>
                          <span style={{ color: C.textDim, fontSize: 9, fontFamily: font, display: "block", marginTop: 2 }}>Avistamentos</span>
                        </div>
                        <div style={{ flex: 1, background: C.card, borderRadius: 10, padding: "8px 12px", textAlign: "center", border: `1px solid ${C.border}` }}>
                          <span style={{ color: C.success, fontSize: 16, fontWeight: 800, fontFamily: fontMono }}>{sos.responders}</span>
                          <span style={{ color: C.textDim, fontSize: 9, fontFamily: font, display: "block", marginTop: 2 }}>Ajudando</span>
                        </div>
                      </div>
                      <button style={{
                        width: "100%", padding: 12, marginTop: 12, borderRadius: 12, cursor: "pointer",
                        background: `linear-gradient(135deg, ${C.accent}, ${C.accentDark})`,
                        border: "none", color: "#fff", fontSize: 14, fontWeight: 700, fontFamily: font,
                        boxShadow: C.shadowAccent,
                      }}>Quero Ajudar</button>
                    </div>
                  ))}
                </>
              )}

              {/* Recent resolved */}
              <p style={{ color: C.textGhost, fontSize: 11, fontWeight: 700, letterSpacing: 2, margin: "16px 0 12px", fontFamily: font }}>RESOLVIDOS RECENTEMENTE</p>
              {[
                { pet: "Bob", type: "medical", time: "Ontem", result: "Tratado na VetAmigo" },
                { pet: "Nina", type: "lost_pet", time: "3 dias", result: "Encontrada em 45min" },
              ].map((r, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
                  background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, marginBottom: 8,
                }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: C.success + "10", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {I.shield(16, C.success)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={{ color: C.text, fontSize: 13, fontWeight: 600, fontFamily: font }}>{r.pet} — {r.type === "medical" ? "Emergência" : "Perdido"}</span>
                    <span style={{ color: C.success, fontSize: 11, fontFamily: font, display: "block" }}>{r.result}</span>
                  </div>
                  <span style={{ color: C.textGhost, fontSize: 10, fontFamily: font }}>{r.time}</span>
                </div>
              ))}
            </div>
          )}

          {/* ==================== TAB: MORE ==================== */}
          {tab === "more" && (
            <div style={{ padding: "0 16px 20px" }}>
              {/* Top pets */}
              <p style={{ color: C.textGhost, fontSize: 11, fontWeight: 700, letterSpacing: 2, margin: "0 0 12px", fontFamily: font }}>TOP DA ALDEIA ESTA SEMANA</p>
              <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                {topPets.map((p, i) => (
                  <div key={i} style={{
                    flex: 1, background: i === 0 ? C.gold + "06" : C.card,
                    borderRadius: 16, padding: "16px 8px", textAlign: "center", cursor: "pointer",
                    border: `1px solid ${i === 0 ? C.gold + "20" : C.border}`,
                  }}>
                    <span style={{ color: i === 0 ? C.gold : C.textDim, fontSize: 10, fontWeight: 800, fontFamily: font }}>#{i + 1}</span>
                    <div style={{ width: 40, height: 40, borderRadius: 14, background: (p.species === "cat" ? C.purple : C.accent) + "10", display: "flex", alignItems: "center", justifyContent: "center", margin: "8px auto" }}>
                      {p.species === "cat" ? I.cat(22, C.purple) : I.dog(22, C.accent)}
                    </div>
                    <p style={{ color: C.text, fontSize: 12, fontWeight: 700, margin: "0 0 2px", fontFamily: font }}>{p.name}</p>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 3 }}>
                      {I.heartFill(10, C.accent)}
                      <span style={{ color: C.accent, fontSize: 10, fontWeight: 700, fontFamily: fontMono }}>{p.admirations}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Menu items */}
              {[
                { icon: I.calendar(18, C.accent), label: "Eventos", sub: `${eventsUpcoming.length} próximos`, badge: eventsUpcoming.length },
                { icon: I.handshake(18, C.petrol), label: "Favores", sub: "Pedir ou oferecer ajuda" },
                { icon: I.gift(18, C.accent), label: "Classificados", sub: "Itens para troca ou doação" },
                { icon: I.barChart(18, C.gold), label: "Rankings", sub: "Top pets e tutores" },
                { icon: I.store(18, C.accent), label: "Parceiros", sub: `${aldeiaData.partners} verificados`, badge: aldeiaData.partners },
                { icon: I.star(18, C.gold), label: "Meus Pet-Credits", sub: `Saldo: ${aldeiaData.myCredits} PC` },
                { icon: I.users(18, C.petrol), label: "Membros", sub: `${aldeiaData.members} na Aldeia` },
              ].map((item, i) => (
                <button key={i} style={{
                  display: "flex", alignItems: "center", gap: 14, width: "100%",
                  background: C.card, border: `1px solid ${C.border}`, borderRadius: 14,
                  padding: "14px 16px", cursor: "pointer", marginBottom: 8, textAlign: "left",
                }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: C.bgCard, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {item.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: C.text, fontSize: 14, fontWeight: 700, margin: 0, fontFamily: font }}>{item.label}</p>
                    <p style={{ color: C.textDim, fontSize: 11, margin: "2px 0 0", fontFamily: font }}>{item.sub}</p>
                  </div>
                  {item.badge && (
                    <span style={{ background: C.accent + "12", color: C.accent, fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 8, fontFamily: fontMono }}>{item.badge}</span>
                  )}
                  {I.arrowRight(12, C.accent)}
                </button>
              ))}

              {/* Upcoming events preview */}
              <p style={{ color: C.textGhost, fontSize: 11, fontWeight: 700, letterSpacing: 2, margin: "16px 0 12px", fontFamily: font }}>PRÓXIMOS EVENTOS</p>
              {eventsUpcoming.map(evt => (
                <div key={evt.id} style={{
                  background: C.card, borderRadius: 16, padding: "14px 16px", marginBottom: 8,
                  border: `1px solid ${C.border}`, cursor: "pointer",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 14, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                      background: evt.type === "vaccination" ? C.success + "10" : evt.type === "fair" ? C.petrol + "10" : C.accent + "10",
                      border: `1px solid ${evt.type === "vaccination" ? C.success + "15" : evt.type === "fair" ? C.petrol + "15" : C.accent + "15"}`,
                    }}>
                      <span style={{ color: evt.type === "vaccination" ? C.success : evt.type === "fair" ? C.petrol : C.accent, fontSize: 10, fontWeight: 800, fontFamily: font, lineHeight: 1 }}>{evt.date.split(" ")[0]}</span>
                      <span style={{ color: evt.type === "vaccination" ? C.success : evt.type === "fair" ? C.petrol : C.accent, fontSize: 8, fontWeight: 600, fontFamily: font }}>{evt.date.split(" ")[1]}</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ color: C.text, fontSize: 13, fontWeight: 700, margin: 0, fontFamily: font }}>{evt.title}</p>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
                        {I.clock(10, C.textGhost)}
                        <span style={{ color: C.textDim, fontSize: 10, fontFamily: font }}>{evt.time}</span>
                        <span style={{ color: C.textGhost, fontSize: 8 }}>·</span>
                        <span style={{ color: C.textDim, fontSize: 10, fontFamily: font }}>{evt.confirmed} confirmados</span>
                        {evt.discount && <span style={{ color: C.success, fontSize: 9, fontWeight: 700, background: C.success + "10", padding: "1px 6px", borderRadius: 4 }}>-{evt.discount}</span>}
                      </div>
                    </div>
                    {I.arrowRight(12, C.accent)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ===== TAB BAR ===== */}
        <div style={{
          display: "flex", padding: "10px 16px 28px", background: C.bgCard,
          borderTop: `1px solid ${C.border}`,
        }}>
          {tabs.map(t => {
            const active = tab === t.id;
            const isSOS = t.id === "sos";
            return (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                background: "none", border: "none", cursor: "pointer", padding: "6px 0",
                position: "relative",
              }}>
                {active && <div style={{ position: "absolute", top: -11, width: 24, height: 3, borderRadius: 2, background: isSOS ? C.danger : C.accent }} />}
                <div style={{ position: "relative" }}>
                  {t.icon(22, active ? (isSOS ? C.danger : C.accent) : C.textGhost)}
                  {t.badge && (
                    <div style={{ position: "absolute", top: -4, right: -8, minWidth: 16, height: 16, borderRadius: 8, background: C.danger, display: "flex", alignItems: "center", justifyContent: "center", border: `2px solid ${C.bgCard}` }}>
                      <span style={{ color: "#fff", fontSize: 8, fontWeight: 800, fontFamily: fontMono }}>{t.badge}</span>
                    </div>
                  )}
                </div>
                <span style={{ color: active ? (isSOS ? C.danger : C.accent) : C.textGhost, fontSize: 10, fontWeight: active ? 700 : 500, fontFamily: font }}>{t.label}</span>
              </button>
            );
          })}
        </div>

        <style>{`
          ::-webkit-scrollbar{width:0;height:0}
          @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.5;transform:scale(1.15)}}
        `}</style>
      </div>
    </div>
  );
}
