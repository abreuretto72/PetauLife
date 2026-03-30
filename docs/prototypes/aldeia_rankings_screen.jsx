import { useState } from "react";

const C = {
  bg: "#0F1923", bgCard: "#162231", bgDeep: "#0B1219",
  card: "#1A2B3D", cardHover: "#1E3145",
  accent: "#E8813A", accentLight: "#F09A56", accentDark: "#CC6E2E",
  accentGlow: "#E8813A15",
  petrol: "#1B8EAD",
  success: "#2ECC71", successSoft: "#2ECC7112",
  danger: "#E74C3C",
  warning: "#F1C40F",
  purple: "#9B59B6",
  gold: "#F39C12", goldSoft: "#F39C1212",
  text: "#E8EDF2", textSec: "#8FA3B8", textDim: "#5E7A94", textGhost: "#2E4254",
  border: "#1E3248",
};
const font = "'Sora', -apple-system, sans-serif";
const fontMono = "'JetBrains Mono', monospace";

const I = {
  back: (s=18,c=C.accent) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15,18 9,12 15,6"/></svg>,
  trophy: (s=16,c=C.gold) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 010-5H6M18 9h1.5a2.5 2.5 0 000-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22M18 2H6v7a6 6 0 0012 0V2z"/></svg>,
  heart: (s=14,c=C.accent) => <svg width={s} height={s} viewBox="0 0 24 24" fill={c} stroke={c} strokeWidth="1"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>,
  shield: (s=14,c=C.success) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9,12 11,14 15,10"/></svg>,
  users: (s=14,c=C.petrol) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
  star: (s=12,c=C.gold) => <svg width={s} height={s} viewBox="0 0 24 24" fill={c} stroke={c} strokeWidth="1"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>,
  dog: (s=20,c=C.accent) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10 5.172C10 3.782 8.423 2.679 6.5 3c-2.823.47-4.113 6.006-4 7 .137 1.217.652 2 1.5 2.5V19a2 2 0 002 2h10a2 2 0 002-2v-6.328c.848-.5 1.363-1.283 1.5-2.5.113-.994-1.177-6.53-4-7C13.577 2.679 12 3.782 12 5.172V5.5"/><circle cx="8.5" cy="10" r="1" fill={c} stroke="none"/><circle cx="13.5" cy="10" r="1" fill={c} stroke="none"/></svg>,
  cat: (s=20,c=C.purple) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c4.97 0 9-2.686 9-6v-.8c0-1.3-.3-2.3-1-3.2 0-2-1-3.5-3-4l1-6-4 3c-1.3-.4-2.7-.4-4 0L6 2l1 6c-2 .5-3 2-3 4-.7.9-1 1.9-1 3.2v.8c0 3.314 4.03 6 9 6z"/><circle cx="9" cy="13" r="1" fill={c} stroke="none"/><circle cx="15" cy="13" r="1" fill={c} stroke="none"/></svg>,
  user: (s=18,c=C.accent) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  handshake: (s=14,c=C.petrol) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 17a1 1 0 01-1 1H6l-4 4V8a2 2 0 012-2h6a2 2 0 012 2v9z"/><path d="M14 9h4a2 2 0 012 2v11l-4-4h-4a1 1 0 01-1-1v-1"/></svg>,
  globe: (s=14,c=C.petrol) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>,
  arrowRight: (s=12,c=C.accent) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9,6 15,12 9,18"/></svg>,
};

const rankings = {
  most_admired: [
    { pos: 1, name: "Thor", breed: "Golden", species: "dog", tutor: "Carlos", score: 34, isMe: false },
    { pos: 2, name: "Rex", breed: "Labrador", species: "dog", tutor: "Ana", score: 28, isMe: true },
    { pos: 3, name: "Luna", breed: "Siamês", species: "cat", tutor: "Maria", score: 22, isMe: false },
    { pos: 4, name: "Mel", breed: "Poodle", species: "dog", tutor: "Paula", score: 18, isMe: false },
    { pos: 5, name: "Bob", breed: "SRD", species: "dog", tutor: "João", score: 15, isMe: false },
  ],
  healthiest: [
    { pos: 1, name: "Luna", breed: "Siamês", species: "cat", tutor: "Maria", score: 98, isMe: false },
    { pos: 2, name: "Rex", breed: "Labrador", species: "dog", tutor: "Ana", score: 92, isMe: true },
    { pos: 3, name: "Thor", breed: "Golden", species: "dog", tutor: "Carlos", score: 91, isMe: false },
    { pos: 4, name: "Nina", breed: "Labrador", species: "dog", tutor: "Lúcia", score: 88, isMe: false },
    { pos: 5, name: "Mel", breed: "Poodle", species: "dog", tutor: "Paula", score: 85, isMe: false },
  ],
  most_social: [
    { pos: 1, name: "Thor", breed: "Golden", species: "dog", tutor: "Carlos", score: 14, isMe: false },
    { pos: 2, name: "Mel", breed: "Poodle", species: "dog", tutor: "Paula", score: 9, isMe: false },
    { pos: 3, name: "Rex", breed: "Labrador", species: "dog", tutor: "Ana", score: 7, isMe: true },
    { pos: 4, name: "Bob", breed: "SRD", species: "dog", tutor: "João", score: 5, isMe: false },
    { pos: 5, name: "Luna", breed: "Siamês", species: "cat", tutor: "Maria", score: 4, isMe: false },
  ],
  dedicated_tutor: [
    { pos: 1, name: "Ana Martins", pet: "Rex", score: "Ouro", isMe: true },
    { pos: 2, name: "Maria Santos", pet: "Luna", score: "Ouro", isMe: false },
    { pos: 3, name: "Carlos Mendes", pet: "Thor", score: "Prata", isMe: false },
    { pos: 4, name: "Lúcia Ferreira", pet: "Nina", score: "Prata", isMe: false },
    { pos: 5, name: "João Santos", pet: "Bob", score: "Bronze", isMe: false },
  ],
  solidary_tutor: [
    { pos: 1, name: "João Santos", pet: "Bob", score: 42, isMe: false },
    { pos: 2, name: "Ana Martins", pet: "Rex", score: 35, isMe: true },
    { pos: 3, name: "Carlos Mendes", pet: "Thor", score: 28, isMe: false },
    { pos: 4, name: "Paula Ribeiro", pet: "Mel", score: 21, isMe: false },
    { pos: 5, name: "Maria Santos", pet: "Luna", score: 18, isMe: false },
  ],
};

const aldeiaRank = [
  { pos: 1, name: "Aldeia Campinas", favors: 187, members: 85, isMe: false },
  { pos: 2, name: "Aldeia Jundiaí", favors: 156, members: 62, isMe: false },
  { pos: 3, name: "Aldeia Salto", favors: 127, members: 48, isMe: true },
  { pos: 4, name: "Aldeia Itu", favors: 98, members: 34, isMe: false },
  { pos: 5, name: "Aldeia Sorocaba", favors: 89, members: 71, isMe: false },
];

const medalColors = [C.gold, "#C0C0C0", "#CD7F32"];
const tabs = [
  { id: "admired", label: "Admirados", icon: I.heart, unit: "admirações" },
  { id: "healthy", label: "Saudáveis", icon: I.shield, unit: "/100" },
  { id: "social", label: "Sociáveis", icon: I.users, unit: "amigos" },
  { id: "tutor", label: "Tutores", icon: I.user, unit: "" },
  { id: "aldeia", label: "Aldeias", icon: I.globe, unit: "favores" },
];

export default function RankingsScreen() {
  const [activeTab, setActiveTab] = useState("admired");
  const [tutorMode, setTutorMode] = useState("dedicated"); // dedicated | solidary

  const getData = () => {
    if (activeTab === "admired") return rankings.most_admired;
    if (activeTab === "healthy") return rankings.healthiest;
    if (activeTab === "social") return rankings.most_social;
    return [];
  };
  const data = getData();
  const tab = tabs.find(t => t.id === activeTab);

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", padding: 20, background: `radial-gradient(ellipse at 50% 0%, #162231, #0B1219 70%)`, fontFamily: font }}>
      <link href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <div style={{ width: 400, maxHeight: 820, background: C.bg, borderRadius: 44, overflow: "auto", position: "relative", boxShadow: `0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px ${C.border}` }}>
        <div style={{ position: "sticky", top: 0, zIndex: 30, display: "flex", justifyContent: "center", padding: "8px 0 0", background: `linear-gradient(to bottom, ${C.bg}, transparent)` }}>
          <div style={{ width: 120, height: 28, borderRadius: 20, background: "#000" }} />
        </div>

        {/* Header */}
        <div style={{ padding: "12px 20px 0", display: "flex", alignItems: "center", gap: 12 }}>
          <button style={{ background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 12, width: 42, height: 42, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {I.back(18, C.accent)}
          </button>
          <div style={{ flex: 1 }}>
            <h2 style={{ color: C.text, fontSize: 18, fontWeight: 800, margin: 0, fontFamily: font }}>Rankings da Aldeia</h2>
            <span style={{ color: C.textDim, fontSize: 11, fontFamily: font }}>Março 2026 · Aldeia Salto</span>
          </div>
          {I.trophy(22, C.gold)}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, padding: "16px 16px 0", overflowX: "auto" }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
              padding: "8px 14px", borderRadius: 10, cursor: "pointer", flexShrink: 0,
              background: activeTab === t.id ? C.accent + "12" : "transparent",
              border: `1.5px solid ${activeTab === t.id ? C.accent + "30" : C.border}`,
              display: "flex", alignItems: "center", gap: 5,
            }}>
              <span style={{ color: activeTab === t.id ? C.accent : C.textDim, fontSize: 11, fontWeight: 700, fontFamily: font }}>{t.label}</span>
            </button>
          ))}
        </div>

        <div style={{ padding: "16px 20px 30px" }}>

          {/* ===== PET RANKINGS (admired, healthy, social) ===== */}
          {(activeTab === "admired" || activeTab === "healthy" || activeTab === "social") && (
            <>
              {/* Podium */}
              <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 8, marginBottom: 20, height: 180 }}>
                {/* 2nd place */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 90 }}>
                  <div style={{ width: 52, height: 52, borderRadius: 18, background: "#C0C0C0" + "10", border: `2.5px solid #C0C0C0`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 6 }}>
                    {data[1]?.species === "cat" ? I.cat(26, C.purple) : I.dog(26, C.accent)}
                  </div>
                  <span style={{ color: C.text, fontSize: 12, fontWeight: 700, fontFamily: font }}>{data[1]?.name}</span>
                  <span style={{ color: C.textDim, fontSize: 9, fontFamily: font }}>{data[1]?.breed}</span>
                  <span style={{ color: "#C0C0C0", fontSize: 14, fontWeight: 800, fontFamily: fontMono, marginTop: 4 }}>{data[1]?.score}{tab?.unit === "/100" ? "" : ""}</span>
                  <div style={{ width: "100%", height: 60, background: "#C0C0C0" + "08", borderRadius: "12px 12px 0 0", border: `1px solid #C0C0C020`, marginTop: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ color: "#C0C0C0", fontSize: 20, fontWeight: 800, fontFamily: fontMono }}>2</span>
                  </div>
                </div>

                {/* 1st place */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 100 }}>
                  <div style={{ position: "relative" }}>
                    {I.trophy(18, C.gold)}
                  </div>
                  <div style={{ width: 64, height: 64, borderRadius: 22, background: C.gold + "10", border: `3px solid ${C.gold}`, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 4, marginBottom: 6, boxShadow: `0 0 30px ${C.gold}15` }}>
                    {data[0]?.species === "cat" ? I.cat(32, C.purple) : I.dog(32, C.accent)}
                  </div>
                  <span style={{ color: C.text, fontSize: 14, fontWeight: 800, fontFamily: font }}>{data[0]?.name}</span>
                  <span style={{ color: C.textDim, fontSize: 10, fontFamily: font }}>{data[0]?.breed}</span>
                  <span style={{ color: C.gold, fontSize: 18, fontWeight: 800, fontFamily: fontMono, marginTop: 4 }}>{data[0]?.score}</span>
                  <div style={{ width: "100%", height: 80, background: C.gold + "06", borderRadius: "12px 12px 0 0", border: `1px solid ${C.gold}15`, marginTop: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ color: C.gold, fontSize: 24, fontWeight: 800, fontFamily: fontMono }}>1</span>
                  </div>
                </div>

                {/* 3rd place */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 90 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 16, background: "#CD7F32" + "10", border: `2px solid #CD7F32`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 6 }}>
                    {data[2]?.species === "cat" ? I.cat(24, C.purple) : I.dog(24, C.accent)}
                  </div>
                  <span style={{ color: C.text, fontSize: 12, fontWeight: 700, fontFamily: font }}>{data[2]?.name}</span>
                  <span style={{ color: C.textDim, fontSize: 9, fontFamily: font }}>{data[2]?.breed}</span>
                  <span style={{ color: "#CD7F32", fontSize: 14, fontWeight: 800, fontFamily: fontMono, marginTop: 4 }}>{data[2]?.score}</span>
                  <div style={{ width: "100%", height: 44, background: "#CD7F32" + "06", borderRadius: "12px 12px 0 0", border: `1px solid #CD7F3215`, marginTop: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ color: "#CD7F32", fontSize: 18, fontWeight: 800, fontFamily: fontMono }}>3</span>
                  </div>
                </div>
              </div>

              {/* Remaining list */}
              {data.slice(3).map((item, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
                  background: item.isMe ? C.accent + "06" : C.card,
                  borderRadius: 14, border: `1px solid ${item.isMe ? C.accent + "15" : C.border}`, marginBottom: 8, cursor: "pointer",
                }}>
                  <span style={{ color: C.textGhost, fontSize: 14, fontWeight: 800, fontFamily: fontMono, width: 24, textAlign: "center" }}>{item.pos}</span>
                  <div style={{ width: 36, height: 36, borderRadius: 12, background: (item.species === "cat" ? C.purple : C.accent) + "10", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {item.species === "cat" ? I.cat(18, C.purple) : I.dog(18, C.accent)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={{ color: C.text, fontSize: 13, fontWeight: 700, fontFamily: font }}>{item.name}</span>
                    <span style={{ color: C.textDim, fontSize: 10, fontFamily: font, display: "block" }}>{item.breed} · {item.tutor}</span>
                  </div>
                  <span style={{ color: C.accent, fontSize: 14, fontWeight: 800, fontFamily: fontMono }}>{item.score}</span>
                  {item.isMe && <span style={{ color: C.accent, fontSize: 8, fontWeight: 700, background: C.accentGlow, padding: "2px 6px", borderRadius: 4 }}>VOCÊ</span>}
                </div>
              ))}
            </>
          )}

          {/* ===== TUTOR RANKINGS ===== */}
          {activeTab === "tutor" && (
            <>
              <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
                {[
                  { id: "dedicated", label: "Mais Dedicado" },
                  { id: "solidary", label: "Mais Solidário" },
                ].map(m => (
                  <button key={m.id} onClick={() => setTutorMode(m.id)} style={{
                    flex: 1, padding: "10px", borderRadius: 10, cursor: "pointer",
                    background: tutorMode === m.id ? C.petrol + "12" : C.card,
                    border: `1.5px solid ${tutorMode === m.id ? C.petrol + "30" : C.border}`,
                    color: tutorMode === m.id ? C.petrol : C.textDim,
                    fontSize: 12, fontWeight: 700, fontFamily: font,
                  }}>{m.label}</button>
                ))}
              </div>

              {(tutorMode === "dedicated" ? rankings.dedicated_tutor : rankings.solidary_tutor).map((item, i) => {
                const mc = i === 0 ? C.gold : i === 1 ? "#C0C0C0" : i === 2 ? "#CD7F32" : C.textGhost;
                return (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 12, padding: "14px 16px",
                    background: item.isMe ? C.accent + "06" : C.card,
                    borderRadius: 16, border: `1px solid ${item.isMe ? C.accent + "15" : i < 3 ? mc + "15" : C.border}`, marginBottom: 8, cursor: "pointer",
                  }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 9,
                      background: i < 3 ? mc + "12" : C.bgCard,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      border: i < 3 ? `1.5px solid ${mc}30` : "none",
                    }}>
                      <span style={{ color: i < 3 ? mc : C.textGhost, fontSize: 12, fontWeight: 800, fontFamily: fontMono }}>{item.pos}</span>
                    </div>
                    <div style={{ width: 40, height: 40, borderRadius: 14, background: C.accent + "10", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {I.user(20, C.accent)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <span style={{ color: C.text, fontSize: 13, fontWeight: 700, fontFamily: font }}>{item.name}</span>
                      <span style={{ color: C.textDim, fontSize: 10, fontFamily: font, display: "block", marginTop: 2 }}>
                        {tutorMode === "dedicated" ? `Proof of Love: ${item.score}` : `${item.score} favores este mês`}
                      </span>
                    </div>
                    {item.isMe && <span style={{ color: C.accent, fontSize: 8, fontWeight: 700, background: C.accentGlow, padding: "2px 6px", borderRadius: 4 }}>VOCÊ</span>}
                    {I.arrowRight(12, C.accent)}
                  </div>
                );
              })}
            </>
          )}

          {/* ===== ALDEIA vs ALDEIA ===== */}
          {activeTab === "aldeia" && (
            <>
              <p style={{ color: C.textDim, fontSize: 12, margin: "0 0 14px", fontFamily: font }}>Ranking entre Aldeias do estado de SP</p>
              {aldeiaRank.map((a, i) => {
                const mc = i === 0 ? C.gold : i === 1 ? "#C0C0C0" : i === 2 ? "#CD7F32" : C.textGhost;
                const maxFavors = aldeiaRank[0].favors;
                return (
                  <div key={i} style={{
                    background: a.isMe ? C.accent + "06" : C.card,
                    borderRadius: 16, padding: "14px 16px", marginBottom: 8,
                    border: `1px solid ${a.isMe ? C.accent + "15" : i < 3 ? mc + "15" : C.border}`,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: 9,
                        background: i < 3 ? mc + "12" : C.bgCard,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        border: i < 3 ? `1.5px solid ${mc}30` : "none",
                      }}>
                        <span style={{ color: i < 3 ? mc : C.textGhost, fontSize: 12, fontWeight: 800, fontFamily: fontMono }}>{a.pos}</span>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ color: C.text, fontSize: 14, fontWeight: 700, fontFamily: font }}>{a.name}</span>
                          {a.isMe && <span style={{ color: C.accent, fontSize: 8, fontWeight: 700, background: C.accentGlow, padding: "2px 6px", borderRadius: 4 }}>SUA ALDEIA</span>}
                        </div>
                        <span style={{ color: C.textDim, fontSize: 10, fontFamily: font }}>{a.members} membros</span>
                      </div>
                      <span style={{ color: C.accent, fontSize: 16, fontWeight: 800, fontFamily: fontMono }}>{a.favors}</span>
                    </div>
                    <div style={{ height: 5, borderRadius: 3, background: C.border }}>
                      <div style={{ height: "100%", width: `${(a.favors / maxFavors) * 100}%`, borderRadius: 3, background: a.isMe ? `linear-gradient(90deg, ${C.accent}, ${C.gold})` : i < 3 ? mc : C.textGhost + "40" }} />
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>

        <style>{`::-webkit-scrollbar{width:0;height:0}`}</style>
      </div>
    </div>
  );
}
