import { useState, useRef } from "react";

// ======================== DESIGN TOKENS v5 ========================
const C = {
  bg: "#0F1923", bgCard: "#162231", bgDeep: "#0B1219",
  card: "#1A2B3D", cardHover: "#1E3145", glow: "#2A4A6B",
  accent: "#E8813A", accentLight: "#F09A56", accentDark: "#CC6E2E",
  accentGlow: "#E8813A15", accentMed: "#E8813A30",
  petrol: "#1B8EAD", petrolLight: "#22A8CC", petrolDark: "#15748F", petrolGlow: "#1B8EAD15",
  success: "#2ECC71", successSoft: "#2ECC7112",
  danger: "#E74C3C", dangerSoft: "#E74C3C12",
  warning: "#F1C40F", warningSoft: "#F1C40F12",
  purple: "#9B59B6", purpleLight: "#B07CC6", purpleGlow: "#9B59B620",
  gold: "#F39C12", goldSoft: "#F39C1212",
  rose: "#E84393", roseSoft: "#E8439312",
  sky: "#3498DB", skySoft: "#3498DB12",
  lime: "#A8D948",
  text: "#E8EDF2", textSec: "#8FA3B8", textDim: "#5E7A94", textGhost: "#2E4254",
  border: "#1E3248", borderLight: "#243A50",
  shadowAccent: "0 8px 30px rgba(232,129,58,0.25)",
};
const font = "'Sora', -apple-system, sans-serif";
const fontMono = "'JetBrains Mono', monospace";
const fontHand = "'Caveat', cursive";

// ======================== SVG ICONS ========================
const I = {
  dog: (s=24,c=C.accent) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10 5.172C10 3.782 8.423 2.679 6.5 3c-2.823.47-4.113 6.006-4 7 .137 1.217.652 2 1.5 2.5V19a2 2 0 002 2h10a2 2 0 002-2v-6.328c.848-.5 1.363-1.283 1.5-2.5.113-.994-1.177-6.53-4-7C13.577 2.679 12 3.782 12 5.172V5.5"/><path d="M14.5 14.5c0 .828-1.12 1.5-2.5 1.5s-2.5-.672-2.5-1.5"/><circle cx="8.5" cy="10" r="1" fill={c} stroke="none"/><circle cx="13.5" cy="10" r="1" fill={c} stroke="none"/></svg>,
  cat: (s=24,c=C.purple) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c4.97 0 9-2.686 9-6v-.8c0-1.3-.3-2.3-1-3.2 0-2-1-3.5-3-4l1-6-4 3c-1.3-.4-2.7-.4-4 0L6 2l1 6c-2 .5-3 2-3 4-.7.9-1 1.9-1 3.2v.8c0 3.314 4.03 6 9 6z"/><circle cx="9" cy="13" r="1" fill={c} stroke="none"/><circle cx="15" cy="13" r="1" fill={c} stroke="none"/><path d="M10 16.5c0 .5.9 1 2 1s2-.5 2-1"/></svg>,
  back: (s=18,c=C.accent) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15,18 9,12 15,6"/></svg>,
  arrowRight: (s=14,c=C.accent) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9,6 15,12 9,18"/></svg>,
  settings: (s=20,c=C.accent) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9c.18-.47.04-1-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06c.5.37 1.35.51 1.82.33.47-.18.82-.7 1-1.51V3a2 2 0 014 0v.09c.18.81.53 1.33 1 1.51.47.18 1.32.04 1.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06c-.37.82-.51 1.35-.33 1.82.18.47.7.82 1.51 1H21a2 2 0 010 4h-.09c-.81.18-1.33.53-1.51 1z"/></svg>,
  camera: (s=20,c=C.accent) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  sparkle: (s=16,c=C.accent) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z"/></svg>,
  // Feature icons
  bookOpen: (s=22,c=C.accent) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>,
  shieldCheck: (s=22,c=C.success) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9,12 11,14 15,10"/></svg>,
  scanEye: (s=22,c=C.purple) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  users: (s=22,c=C.petrol) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
  trophy: (s=22,c=C.gold) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 010-5H6"/><path d="M18 9h1.5a2.5 2.5 0 000-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22"/><path d="M18 2H6v7a6 6 0 0012 0V2z"/></svg>,
  hourglass: (s=22,c=C.rose) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 22h14"/><path d="M5 2h14"/><path d="M17 22v-4.172a2 2 0 00-.586-1.414L12 12l-4.414 4.414A2 2 0 007 17.828V22"/><path d="M7 2v4.172a2 2 0 00.586 1.414L12 12l4.414-4.414A2 2 0 0017 6.172V2"/></svg>,
  scroll: (s=22,c=C.rose) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M8 21h12a2 2 0 002-2v-2H10v2a2 2 0 11-4 0V5a2 2 0 10-4 0v3h4"/><path d="M19 17V5a2 2 0 00-2-2H4"/></svg>,
  qr: (s=22,c=C.sky) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="8" height="8" rx="1"/><rect x="14" y="2" width="8" height="8" rx="1"/><rect x="2" y="14" width="8" height="8" rx="1"/><rect x="14" y="14" width="4" height="4" rx="0.5"/><line x1="22" y1="14" x2="22" y2="14.01"/><line x1="22" y1="18" x2="22" y2="22"/><line x1="18" y1="22" x2="18" y2="22.01"/></svg>,
  apple: (s=22,c=C.lime) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 5-3.5 5-8s-2.5-6-5-6c-1.25 0-2.5 1-4 1s-2.75-1-4-1c-2.5 0-5 1.5-5 6s2 8 5 8c1.25 0 2.5-1.06 4-1.06z"/><path d="M12 7c0-3 2-5 4-5"/></svg>,
  map: (s=22,c=C.sky) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="1,6 1,22 8,18 16,22 23,18 23,2 16,6 8,2"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>,
  umbrella: (s=22,c=C.petrol) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M23 12a11.05 11.05 0 00-22 0"/><path d="M12 12v9a3 3 0 006 0"/><line x1="12" y1="2" x2="12" y2="3"/></svg>,
  trendingUp: (s=22,c=C.success) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="23,6 13.5,15.5 8.5,10.5 1,18"/><polyline points="17,6 23,6 23,12"/></svg>,
  // Decorative
  syringe: (s=14,c=C.danger) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2l4 4M17 7l3-3M19 9l-8.7 8.7c-.4.4-1 .4-1.4 0L5.3 14.1c-.4-.4-.4-1 0-1.4L14 4M2 22l4-4M7 13l4 4M10 10l4 4"/></svg>,
  check: (s=14,c=C.success) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20,6 9,17 4,12"/></svg>,
  alertTri: (s=14,c=C.danger) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  clock: (s=12,c=C.textGhost) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>,
  heart: (s=16,c=C.accent) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>,
};

// ======================== PET DATA ========================
const rexData = {
  name: "Rex", species: "dog", breed: "Labrador Retriever",
  age: "3 anos", weight: "32 kg", sex: "Macho", neutered: true,
  microchip: "985112345678901",
  healthScore: 92, mood: "Feliz", moodColor: C.success,
  happinessScore: 87, happinessTrend: "+5%",
  diaryCount: 47, photoCount: 127, vaccinesDue: 2, vaccinesOk: 6,
  allergies: ["Frango", "Pólen"],
  coPetParents: 4,
  achievements: 12, level: 8, xp: 1240, xpNext: 1800,
  lastDiary: "Hoje fui pro parque e encontrei aquele Golden grandão de novo. Corremos tanto que dormi no carro voltando pra casa. Melhor terça da minha vida.",
  lastDiaryTime: "Hoje 16:45",
  aiPersonality: "Brincalhão, energético, sociável. Adora correr e conhecer novos amigos. Tem medo de trovão.",
};

const recentTimeline = [
  { type: "diary", label: "Passeio no parque", time: "Hoje 16:45", color: C.accent },
  { type: "photo", label: "Análise de saúde IA", time: "Ontem 11:20", color: C.purple },
  { type: "vaccine", label: "V10 aplicada", time: "15 Mar", color: C.success },
  { type: "mood", label: "Humor: Animado", time: "14 Mar", color: C.petrol },
];

// ======================== FEATURE GRID ========================
const features = {
  mvp: [
    { id: "diary", label: "Diário", sub: "47 entradas", icon: (s,c) => I.bookOpen(s,c), color: C.accent, badge: null },
    { id: "health", label: "Prontuário", sub: "Vacinas e alergias", icon: (s,c) => I.shieldCheck(s,c), color: C.success, badge: "2", badgeColor: C.danger },
    { id: "photo", label: "Análise IA", sub: "127 fotos analisadas", icon: (s,c) => I.scanEye(s,c), color: C.purple, badge: null },
  ],
  future: [
    { id: "happiness", label: "Felicidade", sub: "Curva emocional", icon: (s,c) => I.trendingUp(s,c), color: C.success },
    { id: "coparents", label: "Cuidadores", sub: "4 pessoas", icon: (s,c) => I.users(s,c), color: C.petrol },
    { id: "achievements", label: "Conquistas", sub: "12/30 emblemas", icon: (s,c) => I.trophy(s,c), color: C.gold },
    { id: "capsule", label: "Cápsulas", sub: "3 programadas", icon: (s,c) => I.hourglass(s,c), color: C.rose },
    { id: "testament", label: "Testamento", sub: "Configurado", icon: (s,c) => I.scroll(s,c), color: C.rose },
    { id: "qr", label: "Carteirinha", sub: "QR Code digital", icon: (s,c) => I.qr(s,c), color: C.sky },
    { id: "nutrition", label: "Nutrição", sub: "Cardápio ativo", icon: (s,c) => I.apple(s,c), color: C.lime },
    { id: "travel", label: "Viagens", sub: "2 registros", icon: (s,c) => I.map(s,c), color: C.sky },
    { id: "insurance", label: "Seguros", sub: "Plano ativo", icon: (s,c) => I.umbrella(s,c), color: C.petrol },
  ],
};

// ======================== COMPONENT ========================
export default function PetDashboard() {
  const [activeSection, setActiveSection] = useState("all"); // all | mvp | future
  const containerRef = useRef();
  const pet = rexData;
  const petColor = pet.species === "dog" ? C.accent : C.purple;
  const xpPct = (pet.xp / pet.xpNext) * 100;

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", padding: 20, background: `radial-gradient(ellipse at 50% 0%, #162231, #0B1219 70%)`, fontFamily: font }}>
      <link href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=Caveat:wght@400;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <div ref={containerRef} style={{ width: 400, maxHeight: 820, background: C.bg, borderRadius: 44, overflow: "auto", position: "relative", boxShadow: `0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px ${C.border}` }}>
        {/* Notch */}
        <div style={{ position: "sticky", top: 0, zIndex: 30, display: "flex", justifyContent: "center", padding: "8px 0 0", background: `linear-gradient(to bottom, ${C.bg}, transparent)` }}>
          <div style={{ width: 120, height: 28, borderRadius: 20, background: "#000" }} />
        </div>

        {/* Glow */}
        <div style={{ position: "absolute", top: -40, left: "30%", width: 200, height: 200, borderRadius: "50%", background: `radial-gradient(circle, ${petColor}06, transparent 70%)`, pointerEvents: "none" }} />

        {/* ===== HEADER ===== */}
        <div style={{ padding: "12px 20px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button style={{ background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 12, width: 42, height: 42, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {I.back(18, C.accent)}
          </button>
          <h2 style={{ color: C.text, fontSize: 18, fontWeight: 700, margin: 0, fontFamily: font }}>{pet.name}</h2>
          <button style={{ background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 12, width: 42, height: 42, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {I.settings(18, C.accent)}
          </button>
        </div>

        {/* ===== PET PROFILE HERO ===== */}
        <div style={{ padding: "24px 20px 0", display: "flex", alignItems: "center", gap: 18 }}>
          {/* Avatar */}
          <div style={{
            width: 90, height: 90, borderRadius: 28, flexShrink: 0,
            background: C.bgCard, border: `3px solid ${petColor}25`,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 0 30px ${petColor}10`,
            position: "relative",
          }}>
            {I.dog(48, petColor)}
            {/* Camera button */}
            <button style={{
              position: "absolute", bottom: -4, right: -4,
              width: 28, height: 28, borderRadius: 9,
              background: C.card, border: `2px solid ${C.bg}`,
              display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
            }}>
              {I.camera(14, C.accent)}
            </button>
          </div>

          {/* Info */}
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <h1 style={{ color: C.text, fontSize: 26, fontWeight: 700, margin: 0, fontFamily: font }}>{pet.name}</h1>
              <div style={{ display: "flex", alignItems: "center", gap: 4, background: pet.moodColor + "12", padding: "3px 10px", borderRadius: 8 }}>
                <div style={{ width: 6, height: 6, borderRadius: 3, background: pet.moodColor }} />
                <span style={{ color: pet.moodColor, fontSize: 10, fontWeight: 700, fontFamily: font }}>{pet.mood}</span>
              </div>
            </div>
            <p style={{ color: C.textDim, fontSize: 13, margin: "0 0 8px", fontFamily: font }}>{pet.breed}</p>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {[pet.age, pet.weight, pet.sex, pet.neutered ? "Castrado" : "Inteiro"].map((tag, i) => (
                <span key={i} style={{ background: C.bgCard, color: C.textDim, fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 7, fontFamily: font, border: `1px solid ${C.border}` }}>{tag}</span>
              ))}
            </div>
          </div>
        </div>

        {/* ===== SCORE CARDS ===== */}
        <div style={{ display: "flex", gap: 8, padding: "20px 20px 0" }}>
          {[
            { label: "Saúde IA", value: pet.healthScore, color: pet.healthScore >= 90 ? C.success : C.warning, sub: pet.vaccinesDue > 0 ? `${pet.vaccinesDue} vacinas!` : "Em dia", subColor: pet.vaccinesDue > 0 ? C.danger : C.success },
            { label: "Felicidade", value: pet.happinessScore, color: C.accent, sub: pet.happinessTrend, subColor: C.success },
            { label: "Nível", value: pet.level, color: C.gold, sub: `${pet.xp} XP`, subColor: C.textDim },
          ].map((s, i) => (
            <div key={i} style={{ flex: 1, background: C.card, borderRadius: 18, padding: "16px 12px", textAlign: "center", border: `1px solid ${C.border}` }}>
              <span style={{ color: s.color, fontSize: 28, fontWeight: 800, fontFamily: fontMono, display: "block" }}>{s.value}</span>
              <p style={{ color: C.textDim, fontSize: 10, margin: "4px 0 2px", fontFamily: font, fontWeight: 600 }}>{s.label}</p>
              <span style={{ color: s.subColor, fontSize: 9, fontWeight: 700, fontFamily: font }}>{s.sub}</span>
            </div>
          ))}
        </div>

        {/* ===== VACCINE ALERT ===== */}
        {pet.vaccinesDue > 0 && (
          <button style={{
            display: "flex", width: "calc(100% - 40px)", margin: "14px 20px 0",
            padding: "12px 16px", borderRadius: 14,
            background: C.dangerSoft, border: `1px solid ${C.danger}18`,
            alignItems: "center", gap: 10, cursor: "pointer", fontFamily: font, textAlign: "left",
          }}>
            {I.alertTri(16, C.danger)}
            <span style={{ color: C.danger, fontSize: 12, fontWeight: 700, flex: 1 }}>{pet.vaccinesDue} vacinas vencidas</span>
            {I.arrowRight(12, C.danger)}
          </button>
        )}

        {/* ===== AI PERSONALITY ===== */}
        <div style={{
          margin: "16px 20px 0", padding: "16px 18px",
          background: C.purple + "08", borderRadius: 18, border: `1px solid ${C.purple}12`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
            {I.sparkle(14, C.purple)}
            <span style={{ color: C.purple, fontSize: 11, fontWeight: 700, fontFamily: font, letterSpacing: 0.5 }}>PERSONALIDADE (IA)</span>
          </div>
          <p style={{ color: C.textSec, fontSize: 12, lineHeight: 1.6, margin: 0, fontFamily: font }}>{pet.aiPersonality}</p>
        </div>

        {/* ===== FEATURE GRID — MVP ===== */}
        <div style={{ padding: "22px 20px 0" }}>
          <p style={{ color: C.textGhost, fontSize: 11, fontWeight: 700, letterSpacing: 2, margin: "0 0 14px", fontFamily: font }}>FUNCIONALIDADES</p>

          {/* MVP — 3 cards grandes */}
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            {features.mvp.map(f => (
              <button key={f.id} style={{
                flex: 1, background: C.card, borderRadius: 18, padding: "20px 10px",
                border: `1px solid ${C.border}`, cursor: "pointer",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
                position: "relative", overflow: "hidden",
              }}>
                {/* Glow */}
                <div style={{ position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)", width: 60, height: 60, borderRadius: "50%", background: `radial-gradient(circle, ${f.color}10, transparent 70%)`, pointerEvents: "none" }} />
                {/* Badge */}
                {f.badge && (
                  <div style={{ position: "absolute", top: 8, right: 8, width: 20, height: 20, borderRadius: 6, background: f.badgeColor, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ color: "#fff", fontSize: 10, fontWeight: 800, fontFamily: fontMono }}>{f.badge}</span>
                  </div>
                )}
                <div style={{ width: 48, height: 48, borderRadius: 16, background: f.color + "10", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", zIndex: 1 }}>
                  {f.icon(24, f.color)}
                </div>
                <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
                  <p style={{ color: C.text, fontSize: 13, fontWeight: 700, margin: 0, fontFamily: font }}>{f.label}</p>
                  <p style={{ color: C.textDim, fontSize: 9, margin: "3px 0 0", fontFamily: font }}>{f.sub}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Future — grid 3 colunas menor */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {features.future.map(f => (
              <button key={f.id} style={{
                background: C.card, borderRadius: 14, padding: "14px 8px",
                border: `1px solid ${C.border}`, cursor: "pointer",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
              }}>
                <div style={{ width: 36, height: 36, borderRadius: 12, background: f.color + "10", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {f.icon(20, f.color)}
                </div>
                <p style={{ color: C.text, fontSize: 11, fontWeight: 700, margin: 0, fontFamily: font }}>{f.label}</p>
                <p style={{ color: C.textDim, fontSize: 8, margin: 0, fontFamily: font }}>{f.sub}</p>
              </button>
            ))}
          </div>
        </div>

        {/* ===== ALLERGIES ===== */}
        {pet.allergies.length > 0 && (
          <div style={{ margin: "18px 20px 0", padding: "14px 18px", background: C.dangerSoft, borderRadius: 14, border: `1px solid ${C.danger}10` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              {I.alertTri(12, C.danger)}
              <span style={{ color: C.danger, fontSize: 11, fontWeight: 700, fontFamily: font }}>ALERGIAS CONHECIDAS</span>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {pet.allergies.map((a, i) => (
                <span key={i} style={{ background: C.danger + "15", color: C.danger, fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 8, fontFamily: font }}>{a}</span>
              ))}
            </div>
          </div>
        )}

        {/* ===== LAST AI NARRATION ===== */}
        <div style={{
          margin: "18px 20px 0", padding: "18px 20px",
          background: C.card, borderRadius: 20, border: `1px solid ${C.accent}10`,
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {I.sparkle(14, C.accent)}
              <span style={{ color: C.accent, fontSize: 11, fontWeight: 700, fontFamily: font }}>ÚLTIMA NARRAÇÃO</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              {I.clock(10, C.textGhost)}
              <span style={{ color: C.textGhost, fontSize: 10, fontFamily: fontMono }}>{pet.lastDiaryTime}</span>
            </div>
          </div>
          <p style={{
            color: C.textSec, fontSize: 15, lineHeight: 1.8, margin: 0,
            fontFamily: fontHand, fontStyle: "italic",
          }}>
            "{pet.lastDiary}"
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 12, justifyContent: "flex-end" }}>
            <span style={{ color: C.textDim, fontSize: 10, fontFamily: font }}>— {pet.name}</span>
            {I.dog(14, C.accent)}
          </div>
        </div>

        {/* ===== RECENT TIMELINE ===== */}
        <div style={{ padding: "22px 20px 0" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <p style={{ color: C.textGhost, fontSize: 11, fontWeight: 700, letterSpacing: 2, margin: 0, fontFamily: font }}>ATIVIDADE RECENTE</p>
            <button style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ color: C.accent, fontSize: 11, fontWeight: 700, fontFamily: font }}>Ver tudo</span>
              {I.arrowRight(12, C.accent)}
            </button>
          </div>

          {recentTimeline.map((item, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 14,
              padding: "12px 0",
              borderBottom: i < recentTimeline.length - 1 ? `1px solid ${C.border}` : "none",
            }}>
              <div style={{ width: 36, height: 36, borderRadius: 12, background: item.color + "10", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {item.type === "diary" && I.bookOpen(18, item.color)}
                {item.type === "photo" && I.scanEye(18, item.color)}
                {item.type === "vaccine" && I.shieldCheck(18, item.color)}
                {item.type === "mood" && I.heart(18, item.color)}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ color: C.text, fontSize: 13, fontWeight: 600, margin: 0, fontFamily: font }}>{item.label}</p>
                <p style={{ color: C.textGhost, fontSize: 10, margin: "2px 0 0", fontFamily: font }}>{item.time}</p>
              </div>
              {I.arrowRight(12, C.accent)}
            </div>
          ))}
        </div>

        {/* ===== MICROCHIP ===== */}
        <div style={{
          margin: "18px 20px 28px", padding: "14px 18px",
          background: C.card, borderRadius: 14, border: `1px solid ${C.border}`,
          display: "flex", alignItems: "center", gap: 12,
        }}>
          {I.qr(18, C.sky)}
          <div style={{ flex: 1 }}>
            <p style={{ color: C.textDim, fontSize: 10, fontWeight: 600, margin: 0, fontFamily: font }}>Microchip</p>
            <p style={{ color: C.text, fontSize: 13, fontWeight: 600, margin: "2px 0 0", fontFamily: fontMono }}>{pet.microchip}</p>
          </div>
          <button style={{ background: C.accent + "12", border: `1px solid ${C.accent}20`, borderRadius: 10, padding: "6px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
            {I.qr(14, C.accent)}
            <span style={{ color: C.accent, fontSize: 10, fontWeight: 700, fontFamily: font }}>QR Code</span>
          </button>
        </div>

        <style>{`::-webkit-scrollbar{width:0;height:0}`}</style>
      </div>
    </div>
  );
}
