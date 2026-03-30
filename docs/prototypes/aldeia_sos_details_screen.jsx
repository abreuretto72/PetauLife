import { useState } from "react";

// ======================== DESIGN TOKENS v6 ========================
const C = {
  bg: "#0F1923", bgCard: "#162231", bgDeep: "#0B1219",
  card: "#1A2B3D", cardHover: "#1E3145",
  accent: "#E8813A", accentLight: "#F09A56", accentDark: "#CC6E2E",
  accentGlow: "#E8813A15", accentMed: "#E8813A25",
  petrol: "#1B8EAD", petrolDark: "#15748F",
  success: "#2ECC71", successSoft: "#2ECC7112",
  danger: "#E74C3C", dangerSoft: "#E74C3C12",
  warning: "#F1C40F", warningSoft: "#F1C40F12",
  purple: "#9B59B6", purpleGlow: "#9B59B620",
  gold: "#F39C12",
  text: "#E8EDF2", textSec: "#8FA3B8", textDim: "#5E7A94", textGhost: "#2E4254",
  border: "#1E3248",
  shadowAccent: "0 8px 30px rgba(232,129,58,0.25)",
};
const font = "'Sora', -apple-system, sans-serif";
const fontMono = "'JetBrains Mono', monospace";

// ======================== SVG ICONS ========================
const I = {
  back: (s=18,c=C.accent) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15,18 9,12 15,6"/></svg>,
  share: (s=18,c=C.accent) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>,
  dog: (s=24,c=C.accent) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10 5.172C10 3.782 8.423 2.679 6.5 3c-2.823.47-4.113 6.006-4 7 .137 1.217.652 2 1.5 2.5V19a2 2 0 002 2h10a2 2 0 002-2v-6.328c.848-.5 1.363-1.283 1.5-2.5.113-.994-1.177-6.53-4-7C13.577 2.679 12 3.782 12 5.172V5.5"/><circle cx="8.5" cy="10" r="1" fill={c} stroke="none"/><circle cx="13.5" cy="10" r="1" fill={c} stroke="none"/></svg>,
  mapPin: (s=16,c=C.danger) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  clock: (s=12,c=C.textGhost) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>,
  alertTri: (s=18,c=C.danger) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  phone: (s=16,c=C.accent) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>,
  shield: (s=16,c=C.success) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9,12 11,14 15,10"/></svg>,
  user: (s=18,c="#fff") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  eye: (s=16,c=C.petrol) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  camera: (s=16,c=C.accent) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  sparkle: (s=14,c=C.purple) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z"/></svg>,
  arrowRight: (s=14,c=C.accent) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9,6 15,12 9,18"/></svg>,
  check: (s=14,c=C.success) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20,6 9,17 4,12"/></svg>,
  megaphone: (s=20,c=C.danger) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11l18-5v12L3 13v-2z"/><path d="M11.6 16.8a3 3 0 11-5.8-1.6"/></svg>,
  navigation: (s=16,c=C.accent) => <svg width={s} height={s} viewBox="0 0 24 24" fill={c} stroke={c} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><polygon points="3,11 22,2 13,21 11,13"/></svg>,
  syringe: (s=14,c=C.danger) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2l4 4M17 7l3-3M19 9l-8.7 8.7c-.4.4-1 .4-1.4 0L5.3 14.1c-.4-.4-.4-1 0-1.4L14 4M2 22l4-4M7 13l4 4M10 10l4 4"/></svg>,
  heartPulse: (s=18,c=C.danger) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M19.5 12.572l-7.5 7.428-7.5-7.428A5 5 0 1112 6.006a5 5 0 017.5 6.572"/><path d="M5 12h2l2 3 4-6 2 3h4"/></svg>,
  info: (s=14,c=C.petrol) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>,
  search: (s=16,c=C.textDim) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
};

// ======================== SOS DATA ========================
const sosData = {
  type: "lost_pet", // medical | lost_pet | urgent_help
  pet: { name: "Pipoca", breed: "SRD", species: "dog", age: "2 anos", weight: "8 kg", color: C.accent },
  tutor: { name: "Pedro Alves", phone: "(11) 99888-7766" },
  description: "Pipoca fugiu pelo portão quando o entregador abriu. Estava sem coleira. Muito assustado com barulhos.",
  location: "Rua XV de Novembro, 340 — Salto, SP",
  startedAt: "14:37",
  elapsedTime: "1h 42min",
  searchPhase: 2,
  status: "active",

  // Proxy data (medical emergencies)
  proxy: {
    allergies: ["Frango"],
    medications: "Nenhuma",
    weight: "8 kg",
    lastVaccine: "V10 — 02/03/2026",
    vetName: "Dr. Carlos — VetAmigo",
    vetPhone: "(11) 4028-1234",
    emergencyContact: "Lúcia (mãe) — (11) 99777-6655",
    notes: "Pipoca tem medo de barulhos altos. Se assustou com fogos em janeiro. Tende a se esconder embaixo de carros.",
  },

  aiAnalysis: "Baseado na personalidade medrosa do Pipoca e no horário (tarde), ele provavelmente se escondeu em local próximo e coberto. Área mais provável: quadras ao norte da Rua XV, direção do Parque Central, onde há mais vegetação e sombra. Pipoca conhece o Parque Central (3 passeios registrados).",
};

const responders = [
  { name: "Carlos Mendes", distance: "500m", status: "searching", area: "Rua XV — Parque", time: "há 45min" },
  { name: "João Santos", distance: "800m", status: "on_my_way", area: "Saindo de casa", time: "há 12min" },
  { name: "Maria Lima", distance: "300m", status: "searching", area: "Praça da Igreja", time: "há 1h 10min" },
  { name: "Paula Ribeiro", distance: "1.2km", status: "info", area: "Enviou foto suspeita", time: "há 30min" },
  { name: "Ana Martins", distance: "600m", status: "searching", area: "Rua das Flores", time: "há 25min" },
  { name: "Bob (SRD) — tutor João", distance: "800m", status: "sniffing", area: "Ajudando na busca", time: "há 12min", isPet: true },
];

const sightings = [
  { id: 1, reporter: "Maria Lima", time: "15:12", location: "Praça da Igreja — esquina", description: "Vi um cachorro parecido correndo na esquina da praça. Marrom claro, pequeno.", hasPhoto: true, confirmed: false },
  { id: 2, reporter: "Carlos Mendes", time: "15:38", location: "Rua das Palmeiras, 120", description: "Tem um cachorro embaixo de um carro aqui. Parece assustado. Pode ser o Pipoca.", hasPhoto: true, confirmed: true },
  { id: 3, reporter: "Paula Ribeiro", time: "15:55", location: "Entrada do Parque Central", description: "Cachorro pequeno marrom entrou no parque pelo portão lateral.", hasPhoto: false, confirmed: false },
];

const timeline = [
  { time: "14:37", event: "SOS ativado", type: "system", detail: "Pedro reportou Pipoca perdido" },
  { time: "14:38", event: "Fase 1: Raio 1km", type: "system", detail: "12 tutores notificados" },
  { time: "14:42", event: "Carlos respondeu", type: "response", detail: "\"Estou perto, vou procurar\"" },
  { time: "14:45", event: "Maria respondeu", type: "response", detail: "\"Saindo agora pra praça\"" },
  { time: "15:00", event: "Ana respondeu", type: "response", detail: "\"Vou olhar pela Rua das Flores\"" },
  { time: "15:07", event: "Fase 2: Raio 3km", type: "system", detail: "Expandido para 34 tutores" },
  { time: "15:12", event: "Avistamento #1", type: "sighting", detail: "Maria: cachorro parecido na praça" },
  { time: "15:20", event: "IA analisou rota", type: "ai", detail: "Direção provável: norte, Parque Central" },
  { time: "15:38", event: "Avistamento #2", type: "sighting", detail: "Carlos: cachorro embaixo de carro" },
  { time: "15:55", event: "Avistamento #3", type: "sighting", detail: "Paula: cachorro entrou no parque" },
];

const statusColors = { searching: C.accent, on_my_way: C.petrol, info: C.purple, sniffing: C.gold };
const statusLabels = { searching: "Procurando", on_my_way: "A caminho", info: "Informação", sniffing: "Farejando" };
const timelineColors = { system: C.textDim, response: C.success, sighting: C.warning, ai: C.purple };

// ======================== MAIN ========================
export default function SOSDetails() {
  const [activeTab, setActiveTab] = useState("map"); // map | proxy | timeline | responders
  const sos = sosData;

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", padding: 20, background: `radial-gradient(ellipse at 50% 0%, #162231, #0B1219 70%)`, fontFamily: font }}>
      <link href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <div style={{ width: 400, maxHeight: 820, background: C.bg, borderRadius: 44, overflow: "auto", position: "relative", boxShadow: `0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px ${C.border}` }}>
        {/* Notch */}
        <div style={{ position: "sticky", top: 0, zIndex: 30, display: "flex", justifyContent: "center", padding: "8px 0 0", background: `linear-gradient(to bottom, ${C.bg}, transparent)` }}>
          <div style={{ width: 120, height: 28, borderRadius: 20, background: "#000" }} />
        </div>

        {/* ===== HEADER ===== */}
        <div style={{ padding: "12px 20px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button style={{ background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 12, width: 42, height: 42, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {I.back(18, C.accent)}
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: 4, background: C.danger, animation: "blink 1s ease infinite" }} />
            <span style={{ color: C.danger, fontSize: 14, fontWeight: 700, fontFamily: font }}>SOS ATIVO</span>
          </div>
          <button style={{ background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 12, width: 42, height: 42, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {I.share(18, C.accent)}
          </button>
        </div>

        {/* ===== PET CARD ===== */}
        <div style={{
          margin: "16px 20px 0", padding: "16px 18px",
          background: C.danger + "06", borderRadius: 20,
          border: `1.5px solid ${C.danger}20`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 64, height: 64, borderRadius: 22,
              background: C.bgCard, border: `2.5px solid ${C.danger}30`,
              display: "flex", alignItems: "center", justifyContent: "center",
              position: "relative",
            }}>
              {I.dog(34, C.accent)}
              <div style={{ position: "absolute", top: -4, right: -4, width: 20, height: 20, borderRadius: 7, background: C.danger, display: "flex", alignItems: "center", justifyContent: "center", border: `2px solid ${C.bg}` }}>
                {I.alertTri(10, "#fff")}
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <h2 style={{ color: C.text, fontSize: 22, fontWeight: 800, margin: 0, fontFamily: font }}>{sos.pet.name}</h2>
                <span style={{ color: C.danger, fontSize: 10, fontWeight: 700, background: C.dangerSoft, padding: "2px 8px", borderRadius: 6, fontFamily: font }}>
                  {sos.type === "lost_pet" ? "PERDIDO" : sos.type === "medical" ? "EMERGÊNCIA" : "AJUDA"}
                </span>
              </div>
              <p style={{ color: C.textDim, fontSize: 12, margin: "3px 0 0", fontFamily: font }}>{sos.pet.breed} · {sos.pet.age} · {sos.pet.weight}</p>
              <p style={{ color: C.textDim, fontSize: 11, margin: "2px 0 0", fontFamily: font }}>Tutor: {sos.tutor.name}</p>
            </div>
          </div>

          {/* Timer + Phase */}
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <div style={{ flex: 1, background: C.card, borderRadius: 12, padding: "10px 12px", textAlign: "center", border: `1px solid ${C.border}` }}>
              <span style={{ color: C.danger, fontSize: 20, fontWeight: 800, fontFamily: fontMono }}>{sos.elapsedTime}</span>
              <span style={{ color: C.textDim, fontSize: 9, fontFamily: font, display: "block", marginTop: 2 }}>Tempo decorrido</span>
            </div>
            <div style={{ flex: 1, background: C.card, borderRadius: 12, padding: "10px 12px", textAlign: "center", border: `1px solid ${C.border}` }}>
              <span style={{ color: C.warning, fontSize: 20, fontWeight: 800, fontFamily: fontMono }}>Fase {sos.searchPhase}</span>
              <span style={{ color: C.textDim, fontSize: 9, fontFamily: font, display: "block", marginTop: 2 }}>Raio: {sos.searchPhase === 1 ? "1km" : sos.searchPhase === 2 ? "3km" : "5km"}</span>
            </div>
            <div style={{ flex: 1, background: C.card, borderRadius: 12, padding: "10px 12px", textAlign: "center", border: `1px solid ${C.border}` }}>
              <span style={{ color: C.success, fontSize: 20, fontWeight: 800, fontFamily: fontMono }}>{responders.length}</span>
              <span style={{ color: C.textDim, fontSize: 9, fontFamily: font, display: "block", marginTop: 2 }}>Ajudando</span>
            </div>
          </div>

          {/* Description */}
          <div style={{ background: C.card, borderRadius: 12, padding: "10px 14px", marginTop: 12, border: `1px solid ${C.border}` }}>
            <p style={{ color: C.textSec, fontSize: 12, lineHeight: 1.6, margin: 0, fontFamily: font }}>{sos.description}</p>
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 6 }}>
              {I.mapPin(11, C.danger)}
              <span style={{ color: C.danger, fontSize: 10, fontFamily: font }}>{sos.location}</span>
            </div>
          </div>
        </div>

        {/* ===== ACTION BUTTONS ===== */}
        <div style={{ display: "flex", gap: 8, padding: "14px 20px 0" }}>
          <button style={{
            flex: 2, padding: "14px", borderRadius: 14, cursor: "pointer",
            background: `linear-gradient(135deg, ${C.accent}, ${C.accentDark})`,
            border: "none", color: "#fff", fontSize: 14, fontWeight: 700, fontFamily: font,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            boxShadow: C.shadowAccent,
          }}>
            {I.navigation(16, "#fff")} Quero Ajudar
          </button>
          <button style={{
            flex: 1, padding: "14px", borderRadius: 14, cursor: "pointer",
            background: C.card, border: `1.5px solid ${C.border}`,
            color: C.accent, fontSize: 12, fontWeight: 700, fontFamily: font,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}>
            {I.eye(14, C.petrol)} Vi aqui!
          </button>
        </div>

        {/* ===== TABS ===== */}
        <div style={{ display: "flex", gap: 4, padding: "16px 20px 0" }}>
          {[
            { id: "map", label: "Mapa", badge: sightings.length },
            { id: "proxy", label: "Prontuário" },
            { id: "timeline", label: "Timeline" },
            { id: "responders", label: `Equipe (${responders.length})` },
          ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
              flex: 1, padding: "9px 4px", borderRadius: 10, cursor: "pointer",
              background: activeTab === t.id ? C.accent + "12" : "transparent",
              border: `1.5px solid ${activeTab === t.id ? C.accent + "30" : C.border}`,
              position: "relative",
            }}>
              <span style={{ color: activeTab === t.id ? C.accent : C.textDim, fontSize: 11, fontWeight: 700, fontFamily: font }}>{t.label}</span>
              {t.badge && (
                <div style={{ position: "absolute", top: -4, right: -2, minWidth: 14, height: 14, borderRadius: 7, background: C.warning, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ color: "#000", fontSize: 8, fontWeight: 800, fontFamily: fontMono }}>{t.badge}</span>
                </div>
              )}
            </button>
          ))}
        </div>

        <div style={{ padding: "14px 20px 30px" }}>

          {/* ==================== TAB: MAP ==================== */}
          {activeTab === "map" && (
            <>
              {/* Map */}
              <div style={{
                height: 240, borderRadius: 18, marginBottom: 14,
                background: `linear-gradient(180deg, ${C.card}, ${C.bgCard})`,
                border: `1.5px solid ${C.danger}15`,
                position: "relative", overflow: "hidden",
              }}>
                {/* Grid */}
                {[...Array(8)].map((_,i) => <div key={`v${i}`} style={{ position: "absolute", top: 0, left: `${(i+1)*12.5}%`, width: 1, height: "100%", background: C.border, opacity: 0.3 }} />)}
                {[...Array(5)].map((_,i) => <div key={`h${i}`} style={{ position: "absolute", left: 0, top: `${(i+1)*20}%`, height: 1, width: "100%", background: C.border, opacity: 0.3 }} />)}

                {/* Search radius circles */}
                <div style={{ position: "absolute", top: "42%", left: "35%", transform: "translate(-50%,-50%)", width: 200, height: 200, borderRadius: "50%", border: `1px dashed ${C.danger}20`, pointerEvents: "none" }} />
                <div style={{ position: "absolute", top: "42%", left: "35%", transform: "translate(-50%,-50%)", width: 120, height: 120, borderRadius: "50%", border: `1.5px dashed ${C.danger}30`, pointerEvents: "none" }} />

                {/* Last known position */}
                <div style={{ position: "absolute", left: "35%", top: "42%", transform: "translate(-50%,-50%)", zIndex: 3 }}>
                  <div style={{ width: 24, height: 24, borderRadius: 12, background: C.danger, display: "flex", alignItems: "center", justifyContent: "center", animation: "pulse 2s ease infinite", boxShadow: `0 0 20px ${C.danger}40` }}>
                    <div style={{ width: 8, height: 8, borderRadius: 4, background: "#fff" }} />
                  </div>
                  <span style={{ position: "absolute", top: 26, left: "50%", transform: "translateX(-50%)", color: C.danger, fontSize: 8, fontWeight: 800, fontFamily: font, whiteSpace: "nowrap", background: C.bg + "DD", padding: "1px 4px", borderRadius: 3 }}>Último local</span>
                </div>

                {/* Sighting pins */}
                {[
                  { x: 55, y: 30, label: "#1", confirmed: false },
                  { x: 65, y: 55, label: "#2", confirmed: true },
                  { x: 72, y: 25, label: "#3", confirmed: false },
                ].map((s, i) => (
                  <div key={i} style={{ position: "absolute", left: `${s.x}%`, top: `${s.y}%`, transform: "translate(-50%,-50%)", zIndex: 2 }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: s.confirmed ? 6 : 10,
                      background: s.confirmed ? C.success : C.warning,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      border: `2px solid ${C.bg}`,
                    }}>
                      <span style={{ color: "#fff", fontSize: 7, fontWeight: 800, fontFamily: fontMono }}>{s.label}</span>
                    </div>
                  </div>
                ))}

                {/* AI predicted route */}
                <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 1 }}>
                  <path d="M 140 100 Q 180 70 220 85 Q 260 100 280 60" stroke={C.purple} strokeWidth="2" strokeDasharray="6 4" fill="none" opacity="0.5" />
                </svg>

                {/* Searchers */}
                {[
                  { x: 25, y: 65, name: "Carlos" },
                  { x: 48, y: 75, name: "Maria" },
                  { x: 78, y: 45, name: "Ana" },
                ].map((s, i) => (
                  <div key={i} style={{ position: "absolute", left: `${s.x}%`, top: `${s.y}%`, transform: "translate(-50%,-50%)" }}>
                    <div style={{ width: 16, height: 16, borderRadius: 8, background: C.success + "30", border: `1.5px solid ${C.success}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <div style={{ width: 4, height: 4, borderRadius: 2, background: C.success }} />
                    </div>
                    <span style={{ position: "absolute", top: 18, left: "50%", transform: "translateX(-50%)", color: C.success, fontSize: 7, fontWeight: 700, fontFamily: font, whiteSpace: "nowrap" }}>{s.name}</span>
                  </div>
                ))}

                {/* Legend */}
                <div style={{ position: "absolute", bottom: 8, right: 8, background: C.bg + "EE", borderRadius: 8, padding: "6px 8px" }}>
                  {[
                    { color: C.danger, label: "Último local" },
                    { color: C.warning, label: "Avistamento" },
                    { color: C.success, label: "Confirmado" },
                    { color: C.purple, label: "Rota IA" },
                  ].map((l, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: i < 3 ? 3 : 0 }}>
                      <div style={{ width: 6, height: 6, borderRadius: 3, background: l.color }} />
                      <span style={{ color: C.textDim, fontSize: 7, fontFamily: font }}>{l.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Analysis */}
              <div style={{
                background: C.purple + "06", borderRadius: 14, padding: "12px 14px",
                border: `1px solid ${C.purple}12`, marginBottom: 14,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  {I.sparkle(12, C.purple)}
                  <span style={{ color: C.purple, fontSize: 10, fontWeight: 700, fontFamily: font }}>ANÁLISE DA IA — ROTA PROVÁVEL</span>
                </div>
                <p style={{ color: C.textSec, fontSize: 12, lineHeight: 1.6, margin: 0, fontFamily: font }}>{sos.aiAnalysis}</p>
              </div>

              {/* Sightings */}
              <p style={{ color: C.warning, fontSize: 10, fontWeight: 700, letterSpacing: 2, margin: "0 0 10px", fontFamily: font }}>AVISTAMENTOS ({sightings.length})</p>
              {sightings.map((s, i) => (
                <div key={s.id} style={{
                  background: s.confirmed ? C.success + "06" : C.card,
                  borderRadius: 14, padding: "12px 14px", marginBottom: 8,
                  border: `1px solid ${s.confirmed ? C.success + "20" : C.border}`,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: 7,
                      background: s.confirmed ? C.success + "15" : C.warning + "15",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <span style={{ color: s.confirmed ? C.success : C.warning, fontSize: 9, fontWeight: 800, fontFamily: fontMono }}>#{s.id}</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <span style={{ color: C.text, fontSize: 12, fontWeight: 700, fontFamily: font }}>{s.reporter}</span>
                      <span style={{ color: C.textGhost, fontSize: 10, fontFamily: fontMono, marginLeft: 6 }}>{s.time}</span>
                    </div>
                    {s.confirmed && (
                      <span style={{ color: C.success, fontSize: 9, fontWeight: 700, background: C.successSoft, padding: "2px 6px", borderRadius: 4 }}>Confirmado</span>
                    )}
                    {s.hasPhoto && I.camera(12, C.accent)}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
                    {I.mapPin(10, C.danger)}
                    <span style={{ color: C.textDim, fontSize: 10, fontFamily: font }}>{s.location}</span>
                  </div>
                  <p style={{ color: C.textSec, fontSize: 11, lineHeight: 1.5, margin: 0, fontFamily: font }}>{s.description}</p>
                </div>
              ))}
            </>
          )}

          {/* ==================== TAB: PROXY (Prontuário) ==================== */}
          {activeTab === "proxy" && (
            <>
              <div style={{
                background: C.danger + "06", borderRadius: 14, padding: "12px 14px",
                border: `1px solid ${C.danger}12`, marginBottom: 16,
                display: "flex", alignItems: "center", gap: 10,
              }}>
                {I.shield(16, C.success)}
                <p style={{ color: C.textSec, fontSize: 11, lineHeight: 1.5, margin: 0, fontFamily: font }}>
                  Dados compartilhados automaticamente com quem está ajudando. Visíveis apenas durante o SOS ativo.
                </p>
              </div>

              {/* Proxy cards */}
              {[
                { label: "ALERGIAS", value: sos.proxy.allergies.join(", "), icon: I.syringe(14, C.danger), color: C.danger, important: true },
                { label: "MEDICAÇÃO ATUAL", value: sos.proxy.medications, icon: I.heartPulse(14, C.petrol), color: C.petrol },
                { label: "PESO", value: sos.proxy.weight, icon: I.info(12, C.textDim), color: C.textDim },
                { label: "ÚLTIMA VACINA", value: sos.proxy.lastVaccine, icon: I.shield(14, C.success), color: C.success },
              ].map((item, i) => (
                <div key={i} style={{
                  background: item.important ? item.color + "06" : C.card,
                  borderRadius: 14, padding: "12px 16px", marginBottom: 8,
                  border: `1px solid ${item.important ? item.color + "15" : C.border}`,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                    {item.icon}
                    <span style={{ color: item.color, fontSize: 10, fontWeight: 700, letterSpacing: 1, fontFamily: font }}>{item.label}</span>
                  </div>
                  <p style={{ color: C.text, fontSize: 14, fontWeight: 600, margin: 0, fontFamily: font }}>{item.value}</p>
                </div>
              ))}

              {/* Vet contact */}
              <p style={{ color: C.textGhost, fontSize: 10, fontWeight: 700, letterSpacing: 2, margin: "16px 0 10px", fontFamily: font }}>CONTATOS DE EMERGÊNCIA</p>
              {[
                { label: "Veterinário", value: sos.proxy.vetName, phone: sos.proxy.vetPhone, color: C.success },
                { label: "Emergência", value: sos.proxy.emergencyContact, phone: null, color: C.danger },
                { label: "Tutor", value: sos.tutor.name, phone: sos.tutor.phone, color: C.accent },
              ].map((c, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
                  background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, marginBottom: 8,
                }}>
                  <div style={{ width: 36, height: 36, borderRadius: 12, background: c.color + "10", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {I.phone(16, c.color)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={{ color: C.textDim, fontSize: 10, fontWeight: 600, fontFamily: font }}>{c.label}</span>
                    <p style={{ color: C.text, fontSize: 13, fontWeight: 600, margin: "2px 0 0", fontFamily: font }}>{c.value}</p>
                  </div>
                  {c.phone && (
                    <button style={{
                      background: c.color + "12", border: `1px solid ${c.color}20`,
                      borderRadius: 10, padding: "8px 12px", cursor: "pointer",
                      display: "flex", alignItems: "center", gap: 5,
                    }}>
                      {I.phone(12, c.color)}
                      <span style={{ color: c.color, fontSize: 10, fontWeight: 700, fontFamily: font }}>Ligar</span>
                    </button>
                  )}
                </div>
              ))}

              {/* Important notes */}
              <div style={{
                background: C.warning + "06", borderRadius: 14, padding: "12px 14px",
                border: `1px solid ${C.warning}12`, marginTop: 8,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  {I.alertTri(12, C.warning)}
                  <span style={{ color: C.warning, fontSize: 10, fontWeight: 700, fontFamily: font }}>OBSERVAÇÕES IMPORTANTES</span>
                </div>
                <p style={{ color: C.textSec, fontSize: 12, lineHeight: 1.6, margin: 0, fontFamily: font }}>{sos.proxy.notes}</p>
              </div>

              {/* AI orientation */}
              <div style={{
                background: C.purple + "06", borderRadius: 14, padding: "12px 14px",
                border: `1px solid ${C.purple}12`, marginTop: 8,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  {I.sparkle(12, C.purple)}
                  <span style={{ color: C.purple, fontSize: 10, fontWeight: 700, fontFamily: font }}>ORIENTAÇÃO DA IA</span>
                </div>
                <p style={{ color: C.textSec, fontSize: 12, lineHeight: 1.6, margin: 0, fontFamily: font }}>
                  Pipoca é medroso com barulhos. Aproxime-se devagar, fale em tom baixo. Não corra em direção a ele — sente-se e espere. Ofereça petisco se tiver. Evite contato visual direto.
                </p>
              </div>
            </>
          )}

          {/* ==================== TAB: TIMELINE ==================== */}
          {activeTab === "timeline" && (
            <>
              <p style={{ color: C.textDim, fontSize: 11, margin: "0 0 14px", fontFamily: font }}>
                Todos os eventos desde o SOS ser ativado
              </p>
              {timeline.map((evt, i) => (
                <div key={i} style={{ display: "flex", gap: 12, marginBottom: 0 }}>
                  {/* Line + dot */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 20 }}>
                    <div style={{
                      width: 10, height: 10, borderRadius: 5, flexShrink: 0,
                      background: timelineColors[evt.type],
                      border: evt.type === "sighting" ? `2px solid ${C.warning}` : "none",
                      boxShadow: evt.type === "sighting" ? `0 0 8px ${C.warning}30` : "none",
                    }} />
                    {i < timeline.length - 1 && (
                      <div style={{ width: 1.5, flex: 1, minHeight: 30, background: C.border }} />
                    )}
                  </div>
                  {/* Content */}
                  <div style={{ flex: 1, paddingBottom: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ color: timelineColors[evt.type], fontSize: 10, fontWeight: 700, fontFamily: fontMono }}>{evt.time}</span>
                      <span style={{ color: C.text, fontSize: 12, fontWeight: 700, fontFamily: font }}>{evt.event}</span>
                    </div>
                    <p style={{ color: C.textDim, fontSize: 11, margin: "3px 0 0", fontFamily: font, lineHeight: 1.5 }}>{evt.detail}</p>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* ==================== TAB: RESPONDERS ==================== */}
          {activeTab === "responders" && (
            <>
              <p style={{ color: C.textDim, fontSize: 11, margin: "0 0 14px", fontFamily: font }}>
                {responders.length} pessoas e pets ajudando na busca
              </p>
              {responders.map((r, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
                  background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, marginBottom: 8,
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 14,
                    background: r.isPet ? C.gold + "10" : statusColors[r.status] + "10",
                    border: `1.5px solid ${r.isPet ? C.gold : statusColors[r.status]}25`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {r.isPet ? I.dog(20, C.gold) : I.user(18, statusColors[r.status])}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ color: C.text, fontSize: 13, fontWeight: 700, fontFamily: font }}>{r.name}</span>
                      <span style={{
                        color: statusColors[r.status], fontSize: 8, fontWeight: 700,
                        background: statusColors[r.status] + "12",
                        padding: "2px 6px", borderRadius: 4, fontFamily: font,
                      }}>{r.isPet ? "Farejando" : statusLabels[r.status]}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
                      {I.mapPin(9, C.textGhost)}
                      <span style={{ color: C.textDim, fontSize: 10, fontFamily: font }}>{r.area}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ color: C.petrol, fontSize: 12, fontWeight: 700, fontFamily: fontMono }}>{r.distance}</span>
                    <span style={{ color: C.textGhost, fontSize: 9, fontFamily: font, display: "block", marginTop: 2 }}>{r.time}</span>
                  </div>
                </div>
              ))}

              {/* Button - report sighting */}
              <button style={{
                width: "100%", padding: "14px", marginTop: 8, borderRadius: 14, cursor: "pointer",
                background: C.warning + "10", border: `1.5px solid ${C.warning}25`,
                color: C.warning, fontSize: 14, fontWeight: 700, fontFamily: font,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}>
                {I.eye(16, C.warning)} Reportar Avistamento
              </button>

              <button style={{
                width: "100%", padding: "14px", marginTop: 8, borderRadius: 14, cursor: "pointer",
                background: `linear-gradient(135deg, ${C.accent}, ${C.accentDark})`,
                border: "none", color: "#fff", fontSize: 14, fontWeight: 700, fontFamily: font,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                boxShadow: C.shadowAccent,
              }}>
                {I.navigation(14, "#fff")} Estou Procurando Aqui
              </button>
            </>
          )}
        </div>

        <style>{`
          ::-webkit-scrollbar{width:0;height:0}
          @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.5;transform:scale(1.3)}}
          @keyframes blink{0%,100%{opacity:1}50%{opacity:0.3}}
        `}</style>
      </div>
    </div>
  );
}
