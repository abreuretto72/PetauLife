import { useState } from "react";

// ======================== DESIGN TOKENS v6 ========================
const C = {
  bg: "#0F1923", bgCard: "#162231", bgDeep: "#0B1219",
  card: "#1A2B3D", cardHover: "#1E3145",
  accent: "#E8813A", accentLight: "#F09A56", accentDark: "#CC6E2E",
  accentGlow: "#E8813A15", accentMed: "#E8813A25",
  petrol: "#1B8EAD", petrolDark: "#15748F", petrolGlow: "#1B8EAD15",
  success: "#2ECC71", successSoft: "#2ECC7112",
  danger: "#E74C3C", dangerSoft: "#E74C3C12",
  warning: "#F1C40F",
  purple: "#9B59B6", purpleGlow: "#9B59B620",
  gold: "#F39C12", goldSoft: "#F39C1212",
  rose: "#E84393",
  text: "#E8EDF2", textSec: "#8FA3B8", textDim: "#5E7A94", textGhost: "#2E4254",
  border: "#1E3248",
  shadowAccent: "0 8px 30px rgba(232,129,58,0.25)",
};
const font = "'Sora', -apple-system, sans-serif";
const fontMono = "'JetBrains Mono', monospace";
const fontHand = "'Caveat', cursive";

// ======================== SVG ICONS ========================
const I = {
  back: (s=18,c=C.accent) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15,18 9,12 15,6"/></svg>,
  share: (s=18,c=C.accent) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>,
  heart: (s=18,c=C.accent) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>,
  heartFill: (s=18,c=C.accent) => <svg width={s} height={s} viewBox="0 0 24 24" fill={c} stroke={c} strokeWidth="1"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>,
  dog: (s=24,c=C.accent) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10 5.172C10 3.782 8.423 2.679 6.5 3c-2.823.47-4.113 6.006-4 7 .137 1.217.652 2 1.5 2.5V19a2 2 0 002 2h10a2 2 0 002-2v-6.328c.848-.5 1.363-1.283 1.5-2.5.113-.994-1.177-6.53-4-7C13.577 2.679 12 3.782 12 5.172V5.5"/><circle cx="8.5" cy="10" r="1" fill={c} stroke="none"/><circle cx="13.5" cy="10" r="1" fill={c} stroke="none"/></svg>,
  cat: (s=24,c=C.purple) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c4.97 0 9-2.686 9-6v-.8c0-1.3-.3-2.3-1-3.2 0-2-1-3.5-3-4l1-6-4 3c-1.3-.4-2.7-.4-4 0L6 2l1 6c-2 .5-3 2-3 4-.7.9-1 1.9-1 3.2v.8c0 3.314 4.03 6 9 6z"/><circle cx="9" cy="13" r="1" fill={c} stroke="none"/><circle cx="15" cy="13" r="1" fill={c} stroke="none"/></svg>,
  sparkle: (s=14,c=C.purple) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z"/></svg>,
  shield: (s=16,c=C.success) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9,12 11,14 15,10"/></svg>,
  trophy: (s=16,c=C.gold) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 010-5H6M18 9h1.5a2.5 2.5 0 000-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22M18 2H6v7a6 6 0 0012 0V2z"/></svg>,
  users: (s=16,c=C.petrol) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
  bookOpen: (s=16,c=C.accent) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>,
  scanEye: (s=16,c=C.purple) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  trendUp: (s=14,c=C.success) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23,6 13.5,15.5 8.5,10.5 1,18"/><polyline points="17,6 23,6 23,12"/></svg>,
  trendDown: (s=14,c=C.danger) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23,18 13.5,8.5 8.5,13.5 1,6"/><polyline points="17,18 23,18 23,12"/></svg>,
  msgCircle: (s=16,c=C.accent) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg>,
  camera: (s=16,c=C.accent) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  arrowRight: (s=14,c=C.accent) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9,6 15,12 9,18"/></svg>,
  check: (s=12,c=C.success) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20,6 9,17 4,12"/></svg>,
  star: (s=14,c=C.gold) => <svg width={s} height={s} viewBox="0 0 24 24" fill={c} stroke={c} strokeWidth="1"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>,
  starEmpty: (s=14,c=C.textGhost) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>,
  mapPin: (s=12,c=C.petrol) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  syringe: (s=12,c=C.success) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2l4 4M17 7l3-3M19 9l-8.7 8.7c-.4.4-1 .4-1.4 0L5.3 14.1c-.4-.4-.4-1 0-1.4L14 4M2 22l4-4M7 13l4 4M10 10l4 4"/></svg>,
  download: (s=16,c=C.accent) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
};

// ======================== PET DATA ========================
const petData = {
  name: "Rex", species: "dog", breed: "Labrador Retriever",
  age: "3 anos", weight: "32 kg", sex: "Macho",
  healthScore: 92, happinessScore: 87, level: 8,
  mood: "Feliz", moodColor: C.success,
  admirations: 28, ranking: 2, rankingTotal: 67,
  diaryCount: 47, photoCount: 127,
  vaccinesStatus: "Em dia",
  personality: "Brincalhão, energético, sociável. Adora correr e conhecer novos amigos. Tem medo de trovão mas ama chuva.",
  tutorName: "Ana Martins", tutorTitle: "Tutora Exemplar", tutorProofOfLove: "Ouro",
  aldeia: "Aldeia Salto",
  lastNarration: "Hoje fui pro parque com o Thor. A gente correu tanto que eu dormi no carro. O papai João levou a gente. Melhor terça da minha vida.",
  lastNarrationTime: "Hoje 16:45",
};

const friends = [
  { name: "Thor", breed: "Golden", species: "dog", relationship: "best_friend", compatibility: 94, timesMet: 12 },
  { name: "Mel", breed: "Poodle", species: "dog", relationship: "friend", compatibility: 82, timesMet: 7 },
  { name: "Luna", breed: "Siamês", species: "cat", relationship: "acquaintance", compatibility: 55, timesMet: 3 },
  { name: "Bob", breed: "SRD", species: "dog", relationship: "friend", compatibility: 78, timesMet: 5 },
  { name: "Pipoca", breed: "SRD", species: "dog", relationship: "friend", compatibility: 71, timesMet: 4 },
];

const gallery = [1,2,3,4,5,6];

const comparison = [
  { label: "Saúde IA", mine: 92, avg: 78, better: true },
  { label: "Diário/mês", mine: 12, avg: 6, better: true },
  { label: "Passeios/sem", mine: 5, avg: 3, better: true },
  { label: "Humor médio", mine: 87, avg: 71, better: true },
  { label: "Amigos", mine: 5, avg: 3, better: true },
  { label: "Vacinas", mine: "Dia", avg: "82%", better: true },
];

const badges = [
  { name: "Patas Incansáveis", desc: "100 passeios", color: C.accent },
  { name: "Social Butterfly", desc: "5+ amigos", color: C.petrol },
  { name: "Queridinho", desc: "20+ admirações", color: C.gold },
  { name: "Saudável", desc: "Saúde IA > 90", color: C.success },
];

const relColors = { best_friend: C.gold, friend: C.accent, acquaintance: C.petrol, neutral: C.textDim, avoid: C.danger };
const relLabels = { best_friend: "Melhor amigo", friend: "Amigo", acquaintance: "Conhecido", neutral: "Neutro", avoid: "Evita" };

// ======================== MAIN ========================
export default function PetPublicProfile() {
  const [admired, setAdmired] = useState(false);
  const [showCard, setShowCard] = useState(false);
  const [activeTab, setActiveTab] = useState("about"); // about | gallery | friends | compare
  const pet = petData;
  const petColor = pet.species === "dog" ? C.accent : C.purple;

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", padding: 20, background: `radial-gradient(ellipse at 50% 0%, #162231, #0B1219 70%)`, fontFamily: font }}>
      <link href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=Caveat:wght@400;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <div style={{ width: 400, maxHeight: 820, background: C.bg, borderRadius: 44, overflow: "auto", position: "relative", boxShadow: `0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px ${C.border}` }}>
        {/* Notch */}
        <div style={{ position: "sticky", top: 0, zIndex: 30, display: "flex", justifyContent: "center", padding: "8px 0 0", background: `linear-gradient(to bottom, ${C.bg}, transparent)` }}>
          <div style={{ width: 120, height: 28, borderRadius: 20, background: "#000" }} />
        </div>

        {/* Header */}
        <div style={{ padding: "12px 20px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button style={{ background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 12, width: 42, height: 42, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {I.back(18, C.accent)}
          </button>
          <span style={{ color: C.textDim, fontSize: 12, fontFamily: font }}>Perfil na Aldeia</span>
          <button onClick={() => setShowCard(!showCard)} style={{ background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 12, width: 42, height: 42, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {I.share(18, C.accent)}
          </button>
        </div>

        {/* ===== HERO ===== */}
        <div style={{ textAlign: "center", padding: "24px 20px 0" }}>
          {/* Avatar */}
          <div style={{ position: "relative", display: "inline-block", marginBottom: 16 }}>
            <div style={{
              width: 110, height: 110, borderRadius: 36,
              background: C.bgCard, border: `3px solid ${petColor}25`,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: `0 0 40px ${petColor}10`,
            }}>
              {I.dog(56, petColor)}
            </div>
            {/* Ranking badge */}
            <div style={{
              position: "absolute", top: -6, right: -10,
              background: `linear-gradient(135deg, ${C.gold}, ${C.accent})`,
              borderRadius: 10, padding: "4px 10px",
              boxShadow: `0 4px 12px ${C.gold}30`, border: `2px solid ${C.bg}`,
              display: "flex", alignItems: "center", gap: 4,
            }}>
              {I.trophy(12, "#fff")}
              <span style={{ color: "#fff", fontSize: 11, fontWeight: 800, fontFamily: fontMono }}>#{pet.ranking}</span>
            </div>
            {/* Mood dot */}
            <div style={{
              position: "absolute", bottom: 2, right: 2,
              width: 20, height: 20, borderRadius: 8,
              background: pet.moodColor, border: `3px solid ${C.bg}`,
            }} />
          </div>

          {/* Name */}
          <h1 style={{ color: C.text, fontSize: 28, fontWeight: 800, margin: "0 0 4px", fontFamily: font }}>{pet.name}</h1>
          <p style={{ color: C.textDim, fontSize: 14, margin: "0 0 4px", fontFamily: font }}>{pet.breed} · {pet.age} · {pet.weight}</p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 16 }}>
            {I.mapPin(11, C.petrol)}
            <span style={{ color: C.petrol, fontSize: 11, fontFamily: font }}>{pet.aldeia}</span>
            <span style={{ color: C.textGhost, fontSize: 9 }}>·</span>
            <span style={{ color: C.textDim, fontSize: 11, fontFamily: font }}>#{pet.ranking} de {pet.rankingTotal} pets</span>
          </div>

          {/* ADMIRE BUTTON */}
          <button onClick={() => setAdmired(!admired)} style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            padding: "14px 32px", borderRadius: 16, cursor: "pointer",
            background: admired ? C.accent + "12" : `linear-gradient(135deg, ${C.accent}, ${C.accentDark})`,
            border: admired ? `2px solid ${C.accent}30` : "none",
            boxShadow: admired ? "none" : C.shadowAccent,
            transition: "all 0.3s",
          }}>
            {admired ? I.heartFill(22, C.accent) : I.heart(22, "#fff")}
            <span style={{ color: admired ? C.accent : "#fff", fontSize: 16, fontWeight: 700, fontFamily: font }}>
              {admired ? "Admirado!" : "Admirar"}
            </span>
            <span style={{
              color: admired ? C.accent : "rgba(255,255,255,0.7)",
              fontSize: 13, fontWeight: 600, fontFamily: fontMono,
            }}>{pet.admirations + (admired ? 1 : 0)}</span>
          </button>
        </div>

        {/* ===== SCORES ===== */}
        <div style={{ display: "flex", gap: 8, padding: "20px 20px 0" }}>
          {[
            { label: "Saúde IA", value: pet.healthScore, color: C.success, icon: I.shield(14, C.success) },
            { label: "Felicidade", value: pet.happinessScore, color: C.accent, icon: I.heart(12, C.accent) },
            { label: "Amigos", value: friends.length, color: C.petrol, icon: I.users(14, C.petrol) },
            { label: "Nível", value: pet.level, color: C.gold, icon: I.trophy(14, C.gold) },
          ].map((s, i) => (
            <div key={i} style={{ flex: 1, background: C.card, borderRadius: 14, padding: "12px 6px", textAlign: "center", border: `1px solid ${C.border}` }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, marginBottom: 4 }}>
                {s.icon}
                <span style={{ color: s.color, fontSize: 20, fontWeight: 800, fontFamily: fontMono }}>{s.value}</span>
              </div>
              <span style={{ color: C.textDim, fontSize: 9, fontWeight: 600, fontFamily: font }}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* ===== TUTOR INFO ===== */}
        <div style={{
          margin: "16px 20px 0", padding: "12px 16px",
          background: C.card, borderRadius: 14, border: `1px solid ${C.border}`,
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <div style={{ width: 36, height: 36, borderRadius: 12, background: `linear-gradient(135deg, ${C.accent}, ${C.accentDark})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
          <div style={{ flex: 1 }}>
            <span style={{ color: C.text, fontSize: 13, fontWeight: 700, fontFamily: font }}>{pet.tutorName}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
              <span style={{ color: C.accent, fontSize: 10, fontWeight: 600, fontFamily: font }}>{pet.tutorTitle}</span>
              <span style={{ color: C.gold, fontSize: 9, fontWeight: 700, background: C.goldSoft, padding: "1px 6px", borderRadius: 4 }}>PoL {pet.tutorProofOfLove}</span>
            </div>
          </div>
          {I.msgCircle(18, C.accent)}
        </div>

        {/* ===== TABS ===== */}
        <div style={{ display: "flex", gap: 4, padding: "18px 20px 0" }}>
          {[
            { id: "about", label: "Sobre" },
            { id: "gallery", label: "Galeria" },
            { id: "friends", label: "Amigos" },
            { id: "compare", label: "Ranking" },
          ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
              flex: 1, padding: "10px 6px", borderRadius: 10, cursor: "pointer",
              background: activeTab === t.id ? C.accent + "12" : "transparent",
              border: `1.5px solid ${activeTab === t.id ? C.accent + "30" : C.border}`,
            }}>
              <span style={{ color: activeTab === t.id ? C.accent : C.textDim, fontSize: 12, fontWeight: 700, fontFamily: font }}>{t.label}</span>
            </button>
          ))}
        </div>

        <div style={{ padding: "16px 20px 30px" }}>

          {/* ===== TAB: ABOUT ===== */}
          {activeTab === "about" && (
            <>
              {/* Personality */}
              <div style={{ background: C.purple + "06", borderRadius: 16, padding: "14px 16px", border: `1px solid ${C.purple}12`, marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  {I.sparkle(12, C.purple)}
                  <span style={{ color: C.purple, fontSize: 10, fontWeight: 700, fontFamily: font }}>PERSONALIDADE (IA)</span>
                </div>
                <p style={{ color: C.textSec, fontSize: 13, lineHeight: 1.7, margin: 0, fontFamily: font }}>{pet.personality}</p>
              </div>

              {/* Last narration */}
              <div style={{ background: C.card, borderRadius: 16, padding: "16px 18px", border: `1px solid ${C.accent}10`, marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                  {I.sparkle(12, C.accent)}
                  <span style={{ color: C.accent, fontSize: 10, fontWeight: 700, fontFamily: font }}>ÚLTIMA NARRAÇÃO</span>
                  <span style={{ color: C.textGhost, fontSize: 9, fontFamily: fontMono, marginLeft: "auto" }}>{pet.lastNarrationTime}</span>
                </div>
                <p style={{ color: C.text, fontSize: 15, lineHeight: 1.8, margin: 0, fontFamily: fontHand, fontStyle: "italic" }}>
                  "{pet.lastNarration}"
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 8, justifyContent: "flex-end" }}>
                  <span style={{ color: C.textGhost, fontSize: 10, fontFamily: font }}>— {pet.name}</span>
                  {I.dog(12, C.accent)}
                </div>
              </div>

              {/* Quick stats */}
              <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                {[
                  { icon: I.bookOpen(14, C.accent), value: pet.diaryCount, label: "Diários" },
                  { icon: I.scanEye(14, C.purple), value: pet.photoCount, label: "Análises" },
                  { icon: I.syringe(12, C.success), value: pet.vaccinesStatus, label: "Vacinas" },
                ].map((s, i) => (
                  <div key={i} style={{ flex: 1, background: C.card, borderRadius: 12, padding: "12px 6px", textAlign: "center", border: `1px solid ${C.border}` }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, marginBottom: 4 }}>
                      {s.icon}
                      <span style={{ color: C.text, fontSize: 14, fontWeight: 700, fontFamily: fontMono }}>{s.value}</span>
                    </div>
                    <span style={{ color: C.textDim, fontSize: 9, fontFamily: font }}>{s.label}</span>
                  </div>
                ))}
              </div>

              {/* Badges */}
              <p style={{ color: C.textGhost, fontSize: 10, fontWeight: 700, letterSpacing: 2, margin: "0 0 10px", fontFamily: font }}>CONQUISTAS</p>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
                {badges.map((b, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 5,
                    background: b.color + "08", border: `1px solid ${b.color}15`,
                    borderRadius: 10, padding: "6px 10px",
                  }}>
                    {I.star(10, b.color)}
                    <span style={{ color: b.color, fontSize: 10, fontWeight: 700, fontFamily: font }}>{b.name}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ===== TAB: GALLERY ===== */}
          {activeTab === "gallery" && (
            <>
              <p style={{ color: C.textDim, fontSize: 12, margin: "0 0 12px", fontFamily: font }}>
                {I.sparkle(10, C.purple)} Top {gallery.length} fotos selecionadas pela IA
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 14 }}>
                {gallery.map((_, i) => (
                  <div key={i} style={{
                    aspectRatio: "1", borderRadius: 14, cursor: "pointer",
                    background: `linear-gradient(135deg, ${C.card}, ${C.bgCard})`,
                    border: `1px solid ${C.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    position: "relative",
                  }}>
                    {I.camera(22, C.textGhost)}
                    {i === 0 && (
                      <div style={{ position: "absolute", top: 6, left: 6, background: C.gold, borderRadius: 5, padding: "2px 6px" }}>
                        <span style={{ color: "#fff", fontSize: 8, fontWeight: 800 }}>TOP</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <button style={{
                width: "100%", padding: 12, borderRadius: 12, cursor: "pointer",
                background: C.card, border: `1.5px solid ${C.border}`,
                color: C.accent, fontSize: 13, fontWeight: 700, fontFamily: font,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}>
                {I.camera(14, C.accent)} Ver todas as {pet.photoCount} fotos
              </button>
            </>
          )}

          {/* ===== TAB: FRIENDS ===== */}
          {activeTab === "friends" && (
            <>
              {/* Graph visual */}
              <div style={{
                height: 180, borderRadius: 18, marginBottom: 16,
                background: C.card, border: `1px solid ${C.border}`,
                position: "relative", overflow: "hidden",
              }}>
                {/* Center = Rex */}
                <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", zIndex: 2 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 16, background: C.accent + "15", border: `2.5px solid ${C.accent}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {I.dog(24, C.accent)}
                  </div>
                  <span style={{ position: "absolute", bottom: -14, left: "50%", transform: "translateX(-50%)", color: C.accent, fontSize: 9, fontWeight: 800, fontFamily: font, whiteSpace: "nowrap" }}>REX</span>
                </div>
                {/* Friends around */}
                {[
                  { name: "Thor", x: 22, y: 25, sp: "dog", rel: "best_friend" },
                  { name: "Mel", x: 75, y: 20, sp: "dog", rel: "friend" },
                  { name: "Luna", x: 80, y: 70, sp: "cat", rel: "acquaintance" },
                  { name: "Bob", x: 18, y: 75, sp: "dog", rel: "friend" },
                  { name: "Pipoca", x: 50, y: 85, sp: "dog", rel: "friend" },
                ].map((f, i) => (
                  <div key={i} style={{ position: "absolute", left: `${f.x}%`, top: `${f.y}%`, transform: "translate(-50%,-50%)", textAlign: "center", zIndex: 1 }}>
                    {/* Connection line */}
                    <div style={{ position: "absolute", top: "50%", left: "50%", width: 1, height: 40, background: relColors[f.rel] + "30", transform: "rotate(45deg)", transformOrigin: "top left" }} />
                    <div style={{ width: 32, height: 32, borderRadius: 10, background: relColors[f.rel] + "10", border: `1.5px solid ${relColors[f.rel]}40`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {f.sp === "cat" ? I.cat(16, C.purple) : I.dog(16, relColors[f.rel])}
                    </div>
                    <span style={{ color: C.textDim, fontSize: 8, fontWeight: 700, fontFamily: font, display: "block", marginTop: 2 }}>{f.name}</span>
                  </div>
                ))}
              </div>

              {/* Friends list */}
              {friends.map((f, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
                  background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, marginBottom: 8, cursor: "pointer",
                }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: (f.species === "cat" ? C.purple : relColors[f.relationship]) + "10", display: "flex", alignItems: "center", justifyContent: "center", border: `1.5px solid ${relColors[f.relationship]}25` }}>
                    {f.species === "cat" ? I.cat(20, C.purple) : I.dog(20, relColors[f.relationship])}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ color: C.text, fontSize: 13, fontWeight: 700, fontFamily: font }}>{f.name}</span>
                      <span style={{ color: relColors[f.relationship], fontSize: 9, fontWeight: 700, background: relColors[f.relationship] + "10", padding: "2px 6px", borderRadius: 4 }}>{relLabels[f.relationship]}</span>
                    </div>
                    <span style={{ color: C.textDim, fontSize: 11, fontFamily: font, display: "block", marginTop: 2 }}>{f.breed} · {f.timesMet} encontros</span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ color: C.petrol, fontSize: 14, fontWeight: 800, fontFamily: fontMono }}>{f.compatibility}%</span>
                    <span style={{ color: C.textGhost, fontSize: 8, fontFamily: font, display: "block" }}>match</span>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* ===== TAB: COMPARE / RANKING ===== */}
          {activeTab === "compare" && (
            <>
              {/* Ranking position */}
              <div style={{
                background: `linear-gradient(135deg, ${C.gold}08, ${C.accent}04)`,
                borderRadius: 18, padding: "18px 20px", marginBottom: 16,
                border: `1px solid ${C.gold}15`, textAlign: "center",
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 8 }}>
                  {I.trophy(20, C.gold)}
                  <span style={{ color: C.gold, fontSize: 24, fontWeight: 800, fontFamily: fontMono }}>#{pet.ranking}</span>
                  <span style={{ color: C.textDim, fontSize: 12, fontFamily: font }}>de {pet.rankingTotal} pets</span>
                </div>
                <p style={{ color: C.textDim, fontSize: 12, margin: 0, fontFamily: font }}>
                  {pet.name} é o <span style={{ color: C.gold, fontWeight: 700 }}>{pet.ranking}º pet mais admirado</span> da {pet.aldeia}
                </p>
              </div>

              {/* Comparison bars */}
              <p style={{ color: C.textGhost, fontSize: 10, fontWeight: 700, letterSpacing: 2, margin: "0 0 12px", fontFamily: font }}>{pet.name.toUpperCase()} vs MÉDIA DA ALDEIA</p>
              {comparison.map((c, i) => {
                const pct = typeof c.mine === "number" && typeof c.avg === "number" ? Math.min((c.mine / Math.max(c.mine, c.avg)) * 100, 100) : 100;
                const avgPct = typeof c.avg === "number" && typeof c.mine === "number" ? Math.min((c.avg / Math.max(c.mine, c.avg)) * 100, 100) : 50;
                return (
                  <div key={i} style={{ marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ color: C.textDim, fontSize: 11, fontWeight: 600, fontFamily: font }}>{c.label}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ color: C.accent, fontSize: 12, fontWeight: 800, fontFamily: fontMono }}>{c.mine}</span>
                        <span style={{ color: C.textGhost, fontSize: 9 }}>vs</span>
                        <span style={{ color: C.textDim, fontSize: 11, fontFamily: fontMono }}>{c.avg}</span>
                        {c.better ? I.trendUp(10, C.success) : I.trendDown(10, C.danger)}
                      </div>
                    </div>
                    <div style={{ position: "relative", height: 6, borderRadius: 3, background: C.border }}>
                      <div style={{ position: "absolute", top: 0, left: 0, height: "100%", width: `${avgPct}%`, borderRadius: 3, background: C.textGhost + "40" }} />
                      <div style={{ position: "absolute", top: 0, left: 0, height: "100%", width: `${pct}%`, borderRadius: 3, background: `linear-gradient(90deg, ${C.accent}, ${C.gold})` }} />
                    </div>
                  </div>
                );
              })}

              {/* Verdict */}
              <div style={{
                background: C.success + "08", borderRadius: 14, padding: "14px 16px", marginTop: 8,
                border: `1px solid ${C.success}12`,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  {I.sparkle(12, C.purple)}
                  <span style={{ color: C.purple, fontSize: 10, fontWeight: 700, fontFamily: font }}>VEREDICTO DA IA</span>
                </div>
                <p style={{ color: C.textSec, fontSize: 12, lineHeight: 1.6, margin: 0, fontFamily: font }}>
                  <b style={{ color: C.text }}>{pet.name}</b> está no <span style={{ color: C.success, fontWeight: 700 }}>Top 10%</span> dos pets mais bem cuidados da {pet.aldeia}. {pet.tutorName} é uma tutora exemplar.
                </p>
              </div>

              {/* Share card button */}
              <button onClick={() => setShowCard(true)} style={{
                width: "100%", padding: 14, marginTop: 14, borderRadius: 14, cursor: "pointer",
                background: `linear-gradient(135deg, ${C.accent}, ${C.accentDark})`,
                border: "none", color: "#fff", fontSize: 14, fontWeight: 700, fontFamily: font,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                boxShadow: C.shadowAccent,
              }}>
                {I.share(16, "#fff")} Compartilhar Cartão do {pet.name}
              </button>
            </>
          )}
        </div>

        {/* ===== SHAREABLE CARD MODAL ===== */}
        {showCard && (
          <div onClick={() => setShowCard(false)} style={{
            position: "absolute", inset: 0, zIndex: 50,
            background: "rgba(0,0,0,0.65)", backdropFilter: "blur(10px)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
          }}>
            <div onClick={e => e.stopPropagation()} style={{
              width: "100%", maxWidth: 320, borderRadius: 24,
              background: `linear-gradient(180deg, ${C.card}, ${C.bgDeep})`,
              border: `1px solid ${C.border}`, overflow: "hidden",
              boxShadow: C.shadowLg,
            }}>
              {/* Card content */}
              <div style={{ padding: "28px 24px 20px", textAlign: "center" }}>
                {/* Pet avatar */}
                <div style={{
                  width: 80, height: 80, borderRadius: 26, margin: "0 auto 14px",
                  background: C.bgCard, border: `2.5px solid ${petColor}25`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {I.dog(42, petColor)}
                </div>
                <h3 style={{ color: C.text, fontSize: 22, fontWeight: 800, margin: "0 0 4px", fontFamily: font }}>{pet.name}</h3>
                <p style={{ color: C.textDim, fontSize: 12, margin: "0 0 4px", fontFamily: font }}>{pet.breed} · {pet.age}</p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, marginBottom: 14 }}>
                  {I.trophy(12, C.gold)}
                  <span style={{ color: C.gold, fontSize: 12, fontWeight: 700, fontFamily: font }}>#{pet.ranking} da {pet.aldeia}</span>
                </div>

                {/* Stats */}
                <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
                  {[
                    { label: "Saúde", value: pet.healthScore, color: C.success },
                    { label: "Humor", value: pet.happinessScore, color: C.accent },
                    { label: "Admirações", value: pet.admirations, color: C.gold },
                  ].map((s, i) => (
                    <div key={i} style={{ flex: 1, background: C.bgCard, borderRadius: 10, padding: "8px 4px", border: `1px solid ${C.border}` }}>
                      <span style={{ color: s.color, fontSize: 16, fontWeight: 800, fontFamily: fontMono, display: "block" }}>{s.value}</span>
                      <span style={{ color: C.textDim, fontSize: 8, fontFamily: font }}>{s.label}</span>
                    </div>
                  ))}
                </div>

                {/* Personality */}
                <p style={{ color: C.textSec, fontSize: 11, lineHeight: 1.5, margin: "0 0 16px", fontFamily: fontHand, fontStyle: "italic" }}>
                  "{pet.personality.split('.')[0]}."
                </p>

                {/* Divider */}
                <div style={{ borderTop: `1px dashed ${C.border}`, margin: "0 0 14px" }} />

                {/* auExpert branding */}
                <p style={{ color: C.textDim, fontSize: 10, margin: "0 0 2px", fontFamily: font, fontWeight: 700, letterSpacing: 1 }}>
                  <span style={{ color: C.petrol }}>au</span><span style={{ color: C.text }}>Expert</span>
                </p>
                <p style={{ color: C.textGhost, fontSize: 9, margin: "0 0 12px", fontFamily: font }}>Uma inteligência única para o seu pet</p>

                {/* QR placeholder */}
                <div style={{
                  width: 80, height: 80, borderRadius: 12, margin: "0 auto",
                  background: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <div style={{ width: 60, height: 60, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 2 }}>
                    {[...Array(9)].map((_, i) => (
                      <div key={i} style={{ background: i % 3 === 0 || i === 4 ? "#000" : i % 2 ? "#000" : "#fff", borderRadius: 1 }} />
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", borderTop: `1px solid ${C.border}` }}>
                <button onClick={() => setShowCard(false)} style={{
                  flex: 1, padding: 14, background: "transparent", border: "none",
                  borderRight: `1px solid ${C.border}`, cursor: "pointer",
                  color: C.textDim, fontSize: 13, fontWeight: 600, fontFamily: font,
                }}>Fechar</button>
                <button style={{
                  flex: 1, padding: 14, background: "transparent", border: "none",
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  color: C.accent, fontSize: 13, fontWeight: 700, fontFamily: font,
                }}>
                  {I.download(14, C.accent)} Salvar
                </button>
                <button style={{
                  flex: 1, padding: 14, background: "transparent", border: "none",
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  color: C.accent, fontSize: 13, fontWeight: 700, fontFamily: font,
                }}>
                  {I.share(14, C.accent)} Enviar
                </button>
              </div>
            </div>
          </div>
        )}

        <style>{`::-webkit-scrollbar{width:0;height:0}`}</style>
      </div>
    </div>
  );
}
