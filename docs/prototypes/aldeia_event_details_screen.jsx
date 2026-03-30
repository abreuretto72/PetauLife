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
  purple: "#9B59B6",
  gold: "#F39C12", goldSoft: "#F39C1212",
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
  dog: (s=20,c=C.accent) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10 5.172C10 3.782 8.423 2.679 6.5 3c-2.823.47-4.113 6.006-4 7 .137 1.217.652 2 1.5 2.5V19a2 2 0 002 2h10a2 2 0 002-2v-6.328c.848-.5 1.363-1.283 1.5-2.5.113-.994-1.177-6.53-4-7C13.577 2.679 12 3.782 12 5.172V5.5"/><circle cx="8.5" cy="10" r="1" fill={c} stroke="none"/><circle cx="13.5" cy="10" r="1" fill={c} stroke="none"/></svg>,
  cat: (s=20,c=C.purple) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c4.97 0 9-2.686 9-6v-.8c0-1.3-.3-2.3-1-3.2 0-2-1-3.5-3-4l1-6-4 3c-1.3-.4-2.7-.4-4 0L6 2l1 6c-2 .5-3 2-3 4-.7.9-1 1.9-1 3.2v.8c0 3.314 4.03 6 9 6z"/><circle cx="9" cy="13" r="1" fill={c} stroke="none"/><circle cx="15" cy="13" r="1" fill={c} stroke="none"/></svg>,
  mapPin: (s=16,c=C.petrol) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  clock: (s=14,c=C.accent) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>,
  calendar: (s=18,c=C.accent) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  users: (s=18,c=C.petrol) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
  user: (s=18,c="#fff") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  check: (s=14,c=C.success) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20,6 9,17 4,12"/></svg>,
  sparkle: (s=14,c=C.purple) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z"/></svg>,
  alertTri: (s=14,c=C.warning) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  trophy: (s=14,c=C.gold) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 010-5H6M18 9h1.5a2.5 2.5 0 000-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22M18 2H6v7a6 6 0 0012 0V2z"/></svg>,
  arrowRight: (s=14,c=C.accent) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9,6 15,12 9,18"/></svg>,
  camera: (s=16,c=C.accent) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  navigation: (s=14,c="#fff") => <svg width={s} height={s} viewBox="0 0 24 24" fill={c} stroke={c} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><polygon points="3,11 22,2 13,21 11,13"/></svg>,
  sun: (s=16,c=C.warning) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
  star: (s=12,c=C.gold) => <svg width={s} height={s} viewBox="0 0 24 24" fill={c} stroke={c} strokeWidth="1"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>,
  x: (s=14,c=C.danger) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
};

// ======================== EVENT DATA ========================
const eventData = {
  title: "Passeio Coletivo no Parque Central",
  type: "walk",
  description: "Vamos reunir a matilha da Aldeia Salto para um passeio juntos! Todos os portes são bem-vindos. Traga água e saquinhos.",
  date: "Sábado, 05 de Abril 2026",
  dateShort: "Sáb 05/04",
  startTime: "08:00",
  endTime: "10:00",
  location: "Parque Central — Entrada principal",
  locationCity: "Salto, SP",
  maxPets: 20,
  organizer: { name: "Carlos Mendes", pet: "Thor", title: "Guardião", level: "guardian" },
  credits: 25,
  weather: "Ensolarado, 24°C",
  status: "upcoming",
};

const attendees = [
  { name: "Carlos Mendes", pet: "Thor", breed: "Golden", species: "dog", status: "confirmed", isOrganizer: true, checkedIn: false },
  { name: "Ana Martins", pet: "Rex", breed: "Labrador", species: "dog", status: "confirmed", isOrganizer: false, checkedIn: false },
  { name: "Maria Santos", pet: "Luna", breed: "Siamês", species: "cat", status: "confirmed", isOrganizer: false, checkedIn: false },
  { name: "João Santos", pet: "Bob", breed: "SRD", species: "dog", status: "confirmed", isOrganizer: false, checkedIn: false },
  { name: "Paula Ribeiro", pet: "Mel", breed: "Poodle", species: "dog", status: "maybe", isOrganizer: false, checkedIn: false },
  { name: "Pedro Alves", pet: "Pipoca", breed: "SRD", species: "dog", status: "confirmed", isOrganizer: false, checkedIn: false },
  { name: "Lúcia Ferreira", pet: "Nina", breed: "Labrador", species: "dog", status: "confirmed", isOrganizer: false, checkedIn: false },
];

const aiAlerts = [
  { type: "conflict", message: "Rex e Simba não se dão bem. Simba não está confirmado, mas fique atento.", severity: "low" },
  { type: "tip", message: "Mel (Poodle) é pequena. Recomende que chegue 10min antes dos cães grandes para se acomodar.", severity: "info" },
  { type: "weather", message: "Previsão de sol forte. Leve água extra e busque sombra entre 9h-10h.", severity: "info" },
];

const eventPhotos = [1,2,3,4]; // Placeholder

const statusColors = { confirmed: C.success, maybe: C.warning, cancelled: C.danger };
const statusLabels = { confirmed: "Confirmado", maybe: "Talvez", cancelled: "Cancelou" };
const typeColors = { walk: C.accent, fair: C.petrol, vaccination: C.success, social: C.purple, rescue: C.danger, workshop: C.gold, adoption: C.rose };
const typeLabels = { walk: "Passeio", fair: "Feira", vaccination: "Vacinação", social: "Social", rescue: "Resgate", workshop: "Workshop", adoption: "Adoção" };

// ======================== MAIN ========================
export default function EventDetails() {
  const [myStatus, setMyStatus] = useState("none"); // none | confirmed | maybe | cancelled
  const [activeTab, setActiveTab] = useState("info"); // info | attendees | photos | ai
  const evt = eventData;
  const evtColor = typeColors[evt.type];
  const confirmed = attendees.filter(a => a.status === "confirmed").length;
  const petsCount = attendees.filter(a => a.status !== "cancelled").length;

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", padding: 20, background: `radial-gradient(ellipse at 50% 0%, #162231, #0B1219 70%)`, fontFamily: font }}>
      <link href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />

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
          <span style={{ color: C.textDim, fontSize: 12, fontFamily: font }}>Evento da Aldeia</span>
          <button style={{ background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 12, width: 42, height: 42, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {I.share(18, C.accent)}
          </button>
        </div>

        {/* ===== EVENT HERO ===== */}
        <div style={{ padding: "20px 20px 0" }}>
          {/* Type badge + title */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ color: evtColor, fontSize: 10, fontWeight: 700, background: evtColor + "12", padding: "3px 10px", borderRadius: 6, fontFamily: font }}>{typeLabels[evt.type]}</span>
            <span style={{ color: C.textGhost, fontSize: 10, fontFamily: font }}>{evt.status === "upcoming" ? "Em breve" : evt.status === "ongoing" ? "Acontecendo agora" : "Encerrado"}</span>
          </div>
          <h1 style={{ color: C.text, fontSize: 22, fontWeight: 800, margin: "0 0 14px", fontFamily: font, lineHeight: 1.3 }}>{evt.title}</h1>

          {/* Date, time, location cards */}
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <div style={{ flex: 1, background: C.card, borderRadius: 14, padding: "14px 12px", border: `1px solid ${C.border}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                {I.calendar(14, C.accent)}
                <span style={{ color: C.textDim, fontSize: 9, fontWeight: 700, fontFamily: font }}>DATA</span>
              </div>
              <p style={{ color: C.text, fontSize: 13, fontWeight: 700, margin: 0, fontFamily: font }}>{evt.dateShort}</p>
            </div>
            <div style={{ flex: 1, background: C.card, borderRadius: 14, padding: "14px 12px", border: `1px solid ${C.border}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                {I.clock(14, C.accent)}
                <span style={{ color: C.textDim, fontSize: 9, fontWeight: 700, fontFamily: font }}>HORÁRIO</span>
              </div>
              <p style={{ color: C.text, fontSize: 13, fontWeight: 700, margin: 0, fontFamily: fontMono }}>{evt.startTime} — {evt.endTime}</p>
            </div>
            <div style={{ flex: 1, background: C.card, borderRadius: 14, padding: "14px 12px", border: `1px solid ${C.border}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                {I.users(14, C.petrol)}
                <span style={{ color: C.textDim, fontSize: 9, fontWeight: 700, fontFamily: font }}>VAGAS</span>
              </div>
              <p style={{ color: C.text, fontSize: 13, fontWeight: 700, margin: 0, fontFamily: fontMono }}>{confirmed}/{evt.maxPets}</p>
            </div>
          </div>

          {/* Location card */}
          <div style={{
            display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
            background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, marginBottom: 14, cursor: "pointer",
          }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: C.petrol + "10", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {I.mapPin(18, C.petrol)}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ color: C.text, fontSize: 13, fontWeight: 700, margin: 0, fontFamily: font }}>{evt.location}</p>
              <p style={{ color: C.textDim, fontSize: 11, margin: "2px 0 0", fontFamily: font }}>{evt.locationCity}</p>
            </div>
            <button style={{ background: C.accent + "12", border: `1px solid ${C.accent}20`, borderRadius: 10, padding: "8px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
              {I.navigation(12, C.accent)}
              <span style={{ color: C.accent, fontSize: 10, fontWeight: 700, fontFamily: font }}>Ir</span>
            </button>
          </div>

          {/* Weather + Credits */}
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, background: C.warningSoft, borderRadius: 10, padding: "8px 12px", border: `1px solid ${C.warning}10` }}>
              {I.sun(14, C.warning)}
              <span style={{ color: C.warning, fontSize: 11, fontWeight: 600, fontFamily: font }}>{evt.weather}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: C.goldSoft, borderRadius: 10, padding: "8px 12px", border: `1px solid ${C.gold}10` }}>
              {I.trophy(12, C.gold)}
              <span style={{ color: C.gold, fontSize: 11, fontWeight: 700, fontFamily: fontMono }}>+{evt.credits} PC</span>
            </div>
          </div>

          {/* RSVP Buttons */}
          <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
            <button onClick={() => setMyStatus(myStatus === "confirmed" ? "none" : "confirmed")} style={{
              flex: 2, padding: "14px", borderRadius: 14, cursor: "pointer",
              background: myStatus === "confirmed" ? C.success + "12" : `linear-gradient(135deg, ${C.accent}, ${C.accentDark})`,
              border: myStatus === "confirmed" ? `2px solid ${C.success}30` : "none",
              color: myStatus === "confirmed" ? C.success : "#fff",
              fontSize: 14, fontWeight: 700, fontFamily: font,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              boxShadow: myStatus === "confirmed" ? "none" : C.shadowAccent,
            }}>
              {myStatus === "confirmed" ? I.check(16, C.success) : null}
              {myStatus === "confirmed" ? "Confirmado!" : "Confirmar Presença"}
            </button>
            <button onClick={() => setMyStatus(myStatus === "maybe" ? "none" : "maybe")} style={{
              flex: 1, padding: "14px", borderRadius: 14, cursor: "pointer",
              background: myStatus === "maybe" ? C.warning + "10" : C.card,
              border: `1.5px solid ${myStatus === "maybe" ? C.warning + "30" : C.border}`,
              color: myStatus === "maybe" ? C.warning : C.textDim,
              fontSize: 13, fontWeight: 600, fontFamily: font,
            }}>Talvez</button>
          </div>
        </div>

        {/* ===== TABS ===== */}
        <div style={{ display: "flex", gap: 4, padding: "16px 20px 0" }}>
          {[
            { id: "info", label: "Detalhes" },
            { id: "attendees", label: `Confirmados (${confirmed})` },
            { id: "photos", label: "Fotos" },
            { id: "ai", label: "IA", badge: aiAlerts.length },
          ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
              flex: 1, padding: "9px 4px", borderRadius: 10, cursor: "pointer",
              background: activeTab === t.id ? C.accent + "12" : "transparent",
              border: `1.5px solid ${activeTab === t.id ? C.accent + "30" : C.border}`,
              position: "relative",
            }}>
              <span style={{ color: activeTab === t.id ? C.accent : C.textDim, fontSize: 11, fontWeight: 700, fontFamily: font }}>{t.label}</span>
              {t.badge && (
                <div style={{ position: "absolute", top: -4, right: -2, minWidth: 14, height: 14, borderRadius: 7, background: C.purple, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ color: "#fff", fontSize: 8, fontWeight: 800, fontFamily: fontMono }}>{t.badge}</span>
                </div>
              )}
            </button>
          ))}
        </div>

        <div style={{ padding: "14px 20px 30px" }}>

          {/* ==================== TAB: INFO ==================== */}
          {activeTab === "info" && (
            <>
              {/* Description */}
              <div style={{ background: C.card, borderRadius: 16, padding: "14px 16px", border: `1px solid ${C.border}`, marginBottom: 14 }}>
                <p style={{ color: C.textSec, fontSize: 13, lineHeight: 1.7, margin: 0, fontFamily: font }}>{evt.description}</p>
              </div>

              {/* Map placeholder */}
              <div style={{
                height: 180, borderRadius: 18, marginBottom: 14,
                background: `linear-gradient(180deg, ${C.card}, ${C.bgCard})`,
                border: `1px solid ${C.border}`,
                position: "relative", overflow: "hidden",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {/* Grid */}
                {[...Array(6)].map((_,i) => <div key={`v${i}`} style={{ position: "absolute", top: 0, left: `${(i+1)*16.6}%`, width: 1, height: "100%", background: C.border, opacity: 0.3 }} />)}
                {[...Array(4)].map((_,i) => <div key={`h${i}`} style={{ position: "absolute", left: 0, top: `${(i+1)*25}%`, height: 1, width: "100%", background: C.border, opacity: 0.3 }} />)}
                {/* Event pin */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 10,
                    background: evtColor + "20", border: `2.5px solid ${evtColor}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {I.mapPin(16, evtColor)}
                  </div>
                  <span style={{ color: evtColor, fontSize: 9, fontWeight: 700, fontFamily: font, background: C.bg + "DD", padding: "2px 6px", borderRadius: 4 }}>{evt.location.split("—")[0].trim()}</span>
                </div>
                {/* Confirmed attendee dots */}
                {[
                  { x: 35, y: 40 }, { x: 55, y: 55 }, { x: 60, y: 30 }, { x: 30, y: 65 }, { x: 70, y: 50 },
                ].map((d, i) => (
                  <div key={i} style={{ position: "absolute", left: `${d.x}%`, top: `${d.y}%`, width: 8, height: 8, borderRadius: 4, background: C.success, opacity: 0.5, border: `1px solid ${C.bg}` }} />
                ))}
              </div>

              {/* Organizer */}
              <p style={{ color: C.textGhost, fontSize: 10, fontWeight: 700, letterSpacing: 2, margin: "0 0 10px", fontFamily: font }}>ORGANIZADOR</p>
              <div style={{
                display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
                background: C.card, borderRadius: 14, border: `1px solid ${C.accent}12`, marginBottom: 14, cursor: "pointer",
              }}>
                <div style={{ width: 44, height: 44, borderRadius: 14, background: `linear-gradient(135deg, ${C.accent}, ${C.accentDark})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 4px 12px ${C.accent}20` }}>
                  {I.user(20, "#fff")}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ color: C.text, fontSize: 14, fontWeight: 700, fontFamily: font }}>{evt.organizer.name}</span>
                    <span style={{ color: C.accent, fontSize: 9, fontWeight: 700, background: C.accentGlow, padding: "2px 6px", borderRadius: 4 }}>{evt.organizer.title}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 3 }}>
                    {I.dog(12, C.accent)}
                    <span style={{ color: C.textDim, fontSize: 11, fontFamily: font }}>com {evt.organizer.pet}</span>
                  </div>
                </div>
                {I.arrowRight(12, C.accent)}
              </div>

              {/* Attendees preview */}
              <p style={{ color: C.textGhost, fontSize: 10, fontWeight: 700, letterSpacing: 2, margin: "0 0 10px", fontFamily: font }}>QUEM VAI ({confirmed})</p>
              <div style={{ display: "flex", gap: -8, marginBottom: 8 }}>
                {attendees.filter(a => a.status === "confirmed").slice(0, 6).map((a, i) => (
                  <div key={i} style={{
                    width: 36, height: 36, borderRadius: 12,
                    background: a.species === "cat" ? C.purple + "15" : C.accent + "15",
                    border: `2px solid ${C.bg}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    marginLeft: i > 0 ? -8 : 0, zIndex: 10 - i,
                  }}>
                    {a.species === "cat" ? I.cat(16, C.purple) : I.dog(16, C.accent)}
                  </div>
                ))}
                {confirmed > 6 && (
                  <div style={{
                    width: 36, height: 36, borderRadius: 12, marginLeft: -8,
                    background: C.card, border: `2px solid ${C.bg}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <span style={{ color: C.textDim, fontSize: 10, fontWeight: 700, fontFamily: fontMono }}>+{confirmed - 6}</span>
                  </div>
                )}
              </div>
              <button onClick={() => setActiveTab("attendees")} style={{
                width: "100%", padding: 10, borderRadius: 10, cursor: "pointer",
                background: "transparent", border: `1px solid ${C.border}`,
                color: C.accent, fontSize: 12, fontWeight: 600, fontFamily: font,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
              }}>
                Ver todos os confirmados {I.arrowRight(10, C.accent)}
              </button>
            </>
          )}

          {/* ==================== TAB: ATTENDEES ==================== */}
          {activeTab === "attendees" && (
            <>
              {/* Stats */}
              <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                {[
                  { label: "Confirmados", value: attendees.filter(a => a.status === "confirmed").length, color: C.success },
                  { label: "Talvez", value: attendees.filter(a => a.status === "maybe").length, color: C.warning },
                  { label: "Cães", value: attendees.filter(a => a.species === "dog" && a.status !== "cancelled").length, color: C.accent },
                  { label: "Gatos", value: attendees.filter(a => a.species === "cat" && a.status !== "cancelled").length, color: C.purple },
                ].map((s, i) => (
                  <div key={i} style={{ flex: 1, background: C.card, borderRadius: 12, padding: "10px 6px", textAlign: "center", border: `1px solid ${C.border}` }}>
                    <span style={{ color: s.color, fontSize: 18, fontWeight: 800, fontFamily: fontMono }}>{s.value}</span>
                    <span style={{ color: C.textDim, fontSize: 9, fontFamily: font, display: "block", marginTop: 2 }}>{s.label}</span>
                  </div>
                ))}
              </div>

              {/* List */}
              {attendees.map((a, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
                  background: a.isOrganizer ? C.accent + "04" : C.card,
                  borderRadius: 14, border: `1px solid ${a.isOrganizer ? C.accent + "12" : C.border}`, marginBottom: 8, cursor: "pointer",
                }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: 14,
                    background: a.species === "cat" ? C.purple + "10" : C.accent + "10",
                    border: `1.5px solid ${a.species === "cat" ? C.purple : C.accent}20`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    position: "relative",
                  }}>
                    {a.species === "cat" ? I.cat(22, C.purple) : I.dog(22, C.accent)}
                    {a.isOrganizer && (
                      <div style={{ position: "absolute", top: -4, right: -4, width: 14, height: 14, borderRadius: 4, background: C.gold, display: "flex", alignItems: "center", justifyContent: "center", border: `1.5px solid ${C.bg}` }}>
                        {I.star(7, "#fff")}
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ color: C.text, fontSize: 13, fontWeight: 700, fontFamily: font }}>{a.pet}</span>
                      {a.isOrganizer && <span style={{ color: C.gold, fontSize: 8, fontWeight: 700, background: C.goldSoft, padding: "1px 5px", borderRadius: 3 }}>Organizador</span>}
                    </div>
                    <span style={{ color: C.textDim, fontSize: 11, fontFamily: font, display: "block", marginTop: 2 }}>
                      {a.breed} · {a.name}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    {a.status === "confirmed" ? I.check(12, C.success) : a.status === "maybe" ? I.alertTri(12, C.warning) : I.x(12, C.danger)}
                    <span style={{ color: statusColors[a.status], fontSize: 10, fontWeight: 600, fontFamily: font }}>{statusLabels[a.status]}</span>
                  </div>
                </div>
              ))}

              {/* Check-in section (visible on event day) */}
              <div style={{
                background: C.purple + "06", borderRadius: 16, padding: "16px", marginTop: 8,
                border: `1px solid ${C.purple}12`,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                  {I.mapPin(14, C.purple)}
                  <span style={{ color: C.purple, fontSize: 11, fontWeight: 700, fontFamily: font }}>CHECK-IN POR GPS</span>
                </div>
                <p style={{ color: C.textDim, fontSize: 11, lineHeight: 1.5, margin: "0 0 12px", fontFamily: font }}>
                  No dia do evento, faça check-in quando chegar. O GPS confirma sua presença automaticamente e registra no diário do pet.
                </p>
                <button style={{
                  width: "100%", padding: 12, borderRadius: 12, cursor: "pointer",
                  background: C.card, border: `1.5px solid ${C.purple}20`,
                  color: C.purple, fontSize: 13, fontWeight: 700, fontFamily: font,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6, opacity: 0.5,
                }}>
                  {I.mapPin(14, C.purple)} Check-in disponível no dia do evento
                </button>
              </div>
            </>
          )}

          {/* ==================== TAB: PHOTOS ==================== */}
          {activeTab === "photos" && (
            <>
              <div style={{
                background: C.card, borderRadius: 16, padding: "20px", marginBottom: 16,
                border: `1px solid ${C.border}`, textAlign: "center",
              }}>
                {I.camera(32, C.textGhost)}
                <p style={{ color: C.textDim, fontSize: 13, margin: "10px 0 4px", fontFamily: font }}>As fotos aparecem durante e após o evento</p>
                <p style={{ color: C.textGhost, fontSize: 11, margin: 0, fontFamily: font }}>Todos os participantes podem contribuir</p>
              </div>

              <div style={{
                background: C.purple + "06", borderRadius: 14, padding: "12px 14px",
                border: `1px solid ${C.purple}12`,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  {I.sparkle(12, C.purple)}
                  <span style={{ color: C.purple, fontSize: 10, fontWeight: 700, fontFamily: font }}>O QUE A IA VAI FAZER</span>
                </div>
                <p style={{ color: C.textSec, fontSize: 11, lineHeight: 1.6, margin: 0, fontFamily: font }}>
                  Após o evento, a IA vai: gerar narração automática para cada pet participante, atualizar o grafo social (quem interagiu com quem), registrar no diário de cada pet, e criar a galeria coletiva do evento.
                </p>
              </div>

              {/* Preview of what it'll look like */}
              <p style={{ color: C.textGhost, fontSize: 10, fontWeight: 700, letterSpacing: 2, margin: "18px 0 10px", fontFamily: font }}>EXEMPLO (de eventos passados)</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                {eventPhotos.map((_, i) => (
                  <div key={i} style={{
                    aspectRatio: i === 0 ? "16/10" : "1", borderRadius: 14,
                    background: `linear-gradient(135deg, ${C.card}, ${C.bgCard})`,
                    border: `1px solid ${C.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    gridColumn: i === 0 ? "1 / -1" : "auto",
                  }}>
                    {I.camera(20, C.textGhost)}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ==================== TAB: AI ==================== */}
          {activeTab === "ai" && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
                {I.sparkle(14, C.purple)}
                <span style={{ color: C.purple, fontSize: 12, fontWeight: 700, fontFamily: font }}>Alertas e dicas da IA para este evento</span>
              </div>

              {aiAlerts.map((alert, i) => {
                const aColor = alert.type === "conflict" ? C.warning : alert.type === "weather" ? C.warning : C.purple;
                const aIcon = alert.type === "conflict" ? I.alertTri(14, aColor) : alert.type === "weather" ? I.sun(14, aColor) : I.sparkle(12, aColor);
                const aLabel = alert.type === "conflict" ? "CONFLITO ENTRE PETS" : alert.type === "weather" ? "CLIMA" : "DICA DA IA";
                return (
                  <div key={i} style={{
                    background: aColor + "06", borderRadius: 16, padding: "14px 16px",
                    border: `1px solid ${aColor}12`, marginBottom: 10,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                      {aIcon}
                      <span style={{ color: aColor, fontSize: 10, fontWeight: 700, letterSpacing: 0.5, fontFamily: font }}>{aLabel}</span>
                    </div>
                    <p style={{ color: C.textSec, fontSize: 12, lineHeight: 1.6, margin: 0, fontFamily: font }}>{alert.message}</p>
                  </div>
                );
              })}

              {/* AI predictions */}
              <p style={{ color: C.textGhost, fontSize: 10, fontWeight: 700, letterSpacing: 2, margin: "16px 0 10px", fontFamily: font }}>PREVISÃO DA IA</p>

              <div style={{ background: C.card, borderRadius: 16, padding: "14px 16px", border: `1px solid ${C.border}`, marginBottom: 10 }}>
                <p style={{ color: C.textDim, fontSize: 10, fontWeight: 700, margin: "0 0 6px", fontFamily: font }}>COMPATIBILIDADE DO GRUPO</p>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ flex: 1, height: 6, borderRadius: 3, background: C.border }}>
                    <div style={{ width: "82%", height: "100%", borderRadius: 3, background: `linear-gradient(90deg, ${C.success}, ${C.accent})` }} />
                  </div>
                  <span style={{ color: C.success, fontSize: 14, fontWeight: 800, fontFamily: fontMono }}>82%</span>
                </div>
                <p style={{ color: C.textDim, fontSize: 10, margin: "6px 0 0", fontFamily: font }}>Baseado no grafo social dos pets confirmados</p>
              </div>

              <div style={{ background: C.card, borderRadius: 16, padding: "14px 16px", border: `1px solid ${C.border}`, marginBottom: 10 }}>
                <p style={{ color: C.textDim, fontSize: 10, fontWeight: 700, margin: "0 0 6px", fontFamily: font }}>HUMOR PREVISTO APÓS O EVENTO</p>
                <div style={{ display: "flex", gap: 6 }}>
                  {[
                    { pet: "Thor", mood: "Eufórico", color: C.gold },
                    { pet: "Rex", mood: "Feliz", color: C.success },
                    { pet: "Luna", mood: "Calma", color: C.petrol },
                    { pet: "Bob", mood: "Cansado", color: C.purple },
                  ].map((p, i) => (
                    <div key={i} style={{ flex: 1, background: p.color + "08", borderRadius: 10, padding: "8px 4px", textAlign: "center", border: `1px solid ${p.color}10` }}>
                      <span style={{ color: C.text, fontSize: 10, fontWeight: 700, fontFamily: font, display: "block" }}>{p.pet}</span>
                      <span style={{ color: p.color, fontSize: 9, fontWeight: 600, fontFamily: font }}>{p.mood}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background: C.card, borderRadius: 16, padding: "14px 16px", border: `1px solid ${C.border}` }}>
                <p style={{ color: C.textDim, fontSize: 10, fontWeight: 700, margin: "0 0 6px", fontFamily: font }}>NARRAÇÃO PREVISTA PARA O REX</p>
                <p style={{ color: C.textSec, fontSize: 13, lineHeight: 1.6, margin: 0, fontFamily: "'Caveat', cursive", fontStyle: "italic" }}>
                  "Sábado foi dia de encontro da Aldeia no parque. Corri com o Thor, brinquei com a Mel e até a Luna apareceu. O Bob dormiu na sombra, como sempre. Voltei destruído mas feliz."
                </p>
              </div>
            </>
          )}
        </div>

        <style>{`::-webkit-scrollbar{width:0;height:0}`}</style>
      </div>
    </div>
  );
}
