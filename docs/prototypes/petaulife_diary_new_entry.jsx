import { useState, useRef, useEffect } from "react";

// ======================== DESIGN TOKENS v5 ========================
const C = {
  bg: "#0F1923", bgCard: "#162231", bgDeep: "#0B1219",
  card: "#1A2B3D", cardHover: "#1E3145",
  accent: "#E8813A", accentLight: "#F09A56", accentDark: "#CC6E2E",
  accentGlow: "#E8813A15", accentMed: "#E8813A30",
  petrol: "#1B8EAD", petrolDark: "#15748F",
  success: "#2ECC71", successSoft: "#2ECC7112",
  danger: "#E74C3C", dangerSoft: "#E74C3C12",
  warning: "#F1C40F",
  purple: "#9B59B6", purpleGlow: "#9B59B620",
  gold: "#F39C12",
  rose: "#E84393",
  text: "#E8EDF2", textSec: "#8FA3B8", textDim: "#5E7A94", textGhost: "#2E4254",
  placeholder: "#5E7A94",
  border: "#1E3248",
  shadowAccent: "0 8px 30px rgba(232,129,58,0.25)",
};
const font = "'Sora', -apple-system, sans-serif";
const fontMono = "'JetBrains Mono', monospace";
const fontHand = "'Caveat', cursive";

// ======================== SVG ICONS ========================
const I = {
  back: (s=18,c=C.accent) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15,18 9,12 15,6"/></svg>,
  x: (s=18,c=C.accent) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  mic: (s=24,c=C.accent) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 00-3 3v6a3 3 0 006 0V5a3 3 0 00-3-3z"/><path d="M19 10v1a7 7 0 01-14 0v-1"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="8" y1="22" x2="16" y2="22"/></svg>,
  micLg: (s=48,c=C.accent) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 00-3 3v6a3 3 0 006 0V5a3 3 0 00-3-3z"/><path d="M19 10v1a7 7 0 01-14 0v-1"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="8" y1="22" x2="16" y2="22"/></svg>,
  camera: (s=24,c=C.accent) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  image: (s=20,c=C.accent) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21,15 16,10 5,21"/></svg>,
  video: (s=20,c=C.accent) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="15" height="16" rx="2"/><path d="M17 9l5-3v12l-5-3"/></svg>,
  type: (s=20,c=C.accent) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="4,7 4,4 20,4 20,7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>,
  sparkle: (s=16,c=C.accent) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z"/></svg>,
  sparkleAI: (s=18,c=C.purple) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z"/></svg>,
  check: (s=16,c=C.success) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20,6 9,17 4,12"/></svg>,
  refresh: (s=16,c=C.accent) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="23,4 23,10 17,10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>,
  send: (s=18,c="#fff") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22,2 15,22 11,13 2,9"/></svg>,
  tag: (s=14,c=C.petrol) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
  star: (s=16,c=C.gold) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>,
  starFill: (s=16,c=C.gold) => <svg width={s} height={s} viewBox="0 0 24 24" fill={c} stroke={c} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>,
  dog: (s=20,c=C.accent) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10 5.172C10 3.782 8.423 2.679 6.5 3c-2.823.47-4.113 6.006-4 7 .137 1.217.652 2 1.5 2.5V19a2 2 0 002 2h10a2 2 0 002-2v-6.328c.848-.5 1.363-1.283 1.5-2.5.113-.994-1.177-6.53-4-7C13.577 2.679 12 3.782 12 5.172V5.5"/><circle cx="8.5" cy="10" r="1" fill={c} stroke="none"/><circle cx="13.5" cy="10" r="1" fill={c} stroke="none"/></svg>,
  pencil: (s=16,c=C.accent) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.83 2.83 0 114 4L7.5 20.5 2 22l1.5-5.5z"/></svg>,
  trash: (s=16,c=C.danger) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3,6 5,6 21,6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>,
  clock: (s=12,c=C.textGhost) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>,
  plus: (s=16,c=C.accent) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  shieldCheck: (s=14,c=C.success) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9,12 11,14 15,10"/></svg>,
};

// ======================== MOOD DATA ========================
const moods = [
  { id: "ecstatic", label: "Eufórico", color: C.gold, score: 100, icon: (s=28,c=C.gold) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 3 4 3 4-3 4-3"/><line x1="9" y1="8" x2="9.01" y2="8" strokeWidth="3" strokeLinecap="round"/><line x1="15" y1="8" x2="15.01" y2="8" strokeWidth="3" strokeLinecap="round"/><path d="M7 5l2 2M17 5l-2 2" strokeWidth="1.2"/></svg> },
  { id: "happy", label: "Feliz", color: C.success, score: 80, icon: (s=28,c=C.success) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="3" strokeLinecap="round"/><line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="3" strokeLinecap="round"/></svg> },
  { id: "calm", label: "Calmo", color: C.petrol, score: 60, icon: (s=28,c=C.petrol) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="8" y1="15" x2="16" y2="15"/><line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="3" strokeLinecap="round"/><line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="3" strokeLinecap="round"/></svg> },
  { id: "tired", label: "Cansado", color: C.purple, score: 40, icon: (s=28,c=C.purple) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="8" y1="15" x2="16" y2="15"/><path d="M9 9.5c0-.28.22-.5.5-.5s.5.22.5.5" strokeWidth="1.5"/><path d="M14 9.5c0-.28.22-.5.5-.5s.5.22.5.5" strokeWidth="1.5"/></svg> },
  { id: "anxious", label: "Ansioso", color: C.rose, score: 25, icon: (s=28,c=C.rose) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M16 16s-1.5-2-4-2-4 2-4 2"/><line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="3" strokeLinecap="round"/><line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="3" strokeLinecap="round"/></svg> },
  { id: "sad", label: "Triste", color: C.textDim, score: 10, icon: (s=28,c=C.textDim) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M16 16s-1.5-2-4-2-4 2-4 2"/><line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="3" strokeLinecap="round"/><line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="3" strokeLinecap="round"/><path d="M8 5l1 1M16 5l-1 1" strokeWidth="1"/></svg> },
];

const suggestedTags = ["parque", "passeio", "brincadeira", "chuva", "sol", "veterinário", "banho", "petisco", "amigos", "sono", "corrida", "carro"];

// ======================== MAIN ========================
export default function DiaryNewEntry() {
  const [step, setStep] = useState("input"); // input | mood | processing | preview | done
  const [inputMode, setInputMode] = useState(null); // mic | camera | text
  const [isRecording, setIsRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [tutorText, setTutorText] = useState("");
  const [selectedMood, setSelectedMood] = useState(null);
  const [aiSuggestedMood, setAiSuggestedMood] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [isSpecial, setIsSpecial] = useState(false);
  const [aiNarration, setAiNarration] = useState("");
  const [aiTags, setAiTags] = useState([]);
  const [aiMoodScore, setAiMoodScore] = useState(0);
  const [processingLine, setProcessingLine] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const containerRef = useRef();
  const timerRef = useRef(null);

  // Recording timer
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => setRecordTime(t => t + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRecording]);

  const formatTime = (s) => `${Math.floor(s/60)}:${(s%60).toString().padStart(2,"0")}`;

  const startRecording = () => { setIsRecording(true); setRecordTime(0); setInputMode("mic"); };
  const stopRecording = () => {
    setIsRecording(false);
    setTutorText("Levei o Rex no parque hoje, ele brincou com um Golden enorme e voltou super cansado. Dormiu no carro voltando pra casa.");
    setStep("mood");
  };

  const handleCameraCapture = () => {
    setInputMode("camera");
    setPhotos([{ id: 1, placeholder: true }]);
    setTimeout(() => {
      setTutorText("");
      setAiSuggestedMood("happy");
      setSelectedMood("happy");
      setStep("mood");
    }, 500);
  };

  const handleTextMode = () => { setInputMode("text"); };

  const handleSubmitText = () => {
    if (tutorText.length >= 3) setStep("mood");
  };

  const handleProcess = () => {
    setStep("processing");
    setProcessingLine(0);
    const lines = [0, 1, 2, 3, 4];
    lines.forEach((_, i) => {
      setTimeout(() => setProcessingLine(i + 1), i * 600);
    });
    setTimeout(() => {
      setAiNarration("Hoje eu conheci um cara chamado Thor, um Golden enorme que deve pesar uns 40 quilos. A gente correu tanto pelo parque que minha língua quase arrastava no chão. Na volta, apaguei no banco do carro antes da Ana ligar o motor. Melhor terça-feira da minha vida.");
      setAiTags(["parque", "amigos", "corrida"]);
      setAiMoodScore(85);
      setStep("preview");
    }, 3200);
  };

  const pet = { name: "Rex", breed: "Labrador Retriever" };
  const moodData = moods.find(m => m.id === selectedMood);

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", padding: 20, background: `radial-gradient(ellipse at 50% 0%, #162231, #0B1219 70%)`, fontFamily: font }}>
      <link href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=Caveat:wght@400;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <div ref={containerRef} style={{ width: 400, maxHeight: 820, background: C.bg, borderRadius: 44, overflow: "auto", position: "relative", boxShadow: `0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px ${C.border}` }}>
        {/* Notch */}
        <div style={{ position: "sticky", top: 0, zIndex: 30, display: "flex", justifyContent: "center", padding: "8px 0 0", background: `linear-gradient(to bottom, ${C.bg}, transparent)` }}>
          <div style={{ width: 120, height: 28, borderRadius: 20, background: "#000" }} />
        </div>

        {/* Header */}
        <div style={{ padding: "12px 20px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button onClick={() => { if (step === "input" && !inputMode) return; if (step === "input") setInputMode(null); else if (step === "mood") setStep("input"); else if (step === "preview") setStep("mood"); }} style={{ background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 12, width: 42, height: 42, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {I.back(18, C.accent)}
          </button>
          <div style={{ textAlign: "center" }}>
            <h2 style={{ color: C.text, fontSize: 17, fontWeight: 700, margin: 0, fontFamily: font }}>
              {isEditing ? "Editar Entrada" : "Nova Entrada"}
            </h2>
            <p style={{ color: C.textDim, fontSize: 11, margin: "2px 0 0", fontFamily: font }}>Diário do {pet.name}</p>
          </div>
          <button style={{ background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 12, width: 42, height: 42, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {I.x(16, C.accent)}
          </button>
        </div>

        {/* Progress */}
        <div style={{ display: "flex", gap: 4, padding: "16px 20px 0" }}>
          {["input", "mood", "preview"].map((s, i) => (
            <div key={s} style={{ flex: 1, height: 3, borderRadius: 2, background: ["input","mood","processing","preview","done"].indexOf(step) >= i ? C.accent : C.border, transition: "all 0.3s" }} />
          ))}
        </div>

        <div style={{ padding: "20px 20px 36px" }}>

          {/* ==================== STEP: INPUT ==================== */}
          {step === "input" && !inputMode && (
            <>
              <h3 style={{ color: C.text, fontSize: 20, fontWeight: 700, margin: "0 0 6px", fontFamily: font }}>Como você quer contar?</h3>
              <p style={{ color: C.textDim, fontSize: 13, margin: "0 0 28px", fontFamily: font }}>A IA vai transformar na voz do {pet.name}</p>

              {/* MIC — Primary */}
              <button onClick={startRecording} style={{
                width: "100%", padding: "28px 20px", borderRadius: 22, cursor: "pointer",
                background: `linear-gradient(145deg, ${C.accent}12, ${C.accent}06)`,
                border: `2px solid ${C.accent}30`,
                display: "flex", flexDirection: "column", alignItems: "center", gap: 14, marginBottom: 14,
                position: "relative", overflow: "hidden",
              }}>
                <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 120, height: 120, borderRadius: "50%", background: `radial-gradient(circle, ${C.accent}08, transparent 70%)`, pointerEvents: "none" }} />
                <div style={{ width: 72, height: 72, borderRadius: 24, background: `linear-gradient(135deg, ${C.accent}, ${C.accentDark})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: C.shadowAccent, position: "relative", zIndex: 1 }}>
                  {I.micLg(38, "#fff")}
                </div>
                <span style={{ color: C.accent, fontSize: 17, fontWeight: 700, fontFamily: font, position: "relative", zIndex: 1 }}>Falar</span>
                <span style={{ color: C.textDim, fontSize: 12, fontFamily: font, position: "relative", zIndex: 1 }}>Conte o que aconteceu com a voz</span>
              </button>

              {/* Secondary row */}
              <div style={{ display: "flex", gap: 12 }}>
                <button onClick={handleCameraCapture} style={{
                  flex: 1, padding: "22px 14px", borderRadius: 18, cursor: "pointer",
                  background: C.card, border: `1.5px solid ${C.border}`,
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
                }}>
                  <div style={{ width: 48, height: 48, borderRadius: 16, background: C.purple + "10", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {I.camera(24, C.purple)}
                  </div>
                  <span style={{ color: C.text, fontSize: 13, fontWeight: 700, fontFamily: font }}>Foto</span>
                  <span style={{ color: C.textDim, fontSize: 10, fontFamily: font }}>IA analisa e narra</span>
                </button>

                <button onClick={handleTextMode} style={{
                  flex: 1, padding: "22px 14px", borderRadius: 18, cursor: "pointer",
                  background: C.card, border: `1.5px solid ${C.border}`,
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
                }}>
                  <div style={{ width: 48, height: 48, borderRadius: 16, background: C.petrol + "10", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {I.type(24, C.petrol)}
                  </div>
                  <span style={{ color: C.text, fontSize: 13, fontWeight: 700, fontFamily: font }}>Digitar</span>
                  <span style={{ color: C.textDim, fontSize: 10, fontFamily: font }}>Escrever manualmente</span>
                </button>
              </div>
            </>
          )}

          {/* MIC RECORDING */}
          {step === "input" && inputMode === "mic" && isRecording && (
            <div style={{ textAlign: "center", padding: "30px 0" }}>
              <div style={{
                width: 120, height: 120, borderRadius: 40, margin: "0 auto 24px",
                background: `linear-gradient(135deg, ${C.accent}15, ${C.accent}08)`,
                border: `3px solid ${C.accent}30`,
                display: "flex", alignItems: "center", justifyContent: "center",
                animation: "breathe 1.5s ease infinite",
                boxShadow: `0 0 60px ${C.accent}15`,
              }}>
                {I.micLg(52, C.accent)}
              </div>
              <p style={{ color: C.accent, fontSize: 32, fontWeight: 800, margin: "0 0 8px", fontFamily: fontMono }}>{formatTime(recordTime)}</p>
              <p style={{ color: C.textSec, fontSize: 14, margin: "0 0 32px", fontFamily: font }}>Escutando... fale naturalmente</p>
              <button onClick={stopRecording} style={{
                width: 72, height: 72, borderRadius: 24, cursor: "pointer", margin: "0 auto",
                background: `linear-gradient(135deg, ${C.danger}, #C0392B)`,
                border: "none", display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: `0 6px 20px ${C.danger}30`,
              }}>
                <div style={{ width: 22, height: 22, borderRadius: 4, background: "#fff" }} />
              </button>
              <p style={{ color: C.textDim, fontSize: 12, margin: "12px 0 0", fontFamily: font }}>Toque para parar</p>
            </div>
          )}

          {/* TEXT INPUT MODE */}
          {step === "input" && inputMode === "text" && (
            <>
              <h3 style={{ color: C.text, fontSize: 18, fontWeight: 700, margin: "0 0 16px", fontFamily: font }}>O que aconteceu?</h3>
              <div style={{
                background: C.card, borderRadius: 18, padding: "16px", marginBottom: 16,
                border: `1.5px solid ${tutorText.length > 0 ? C.accent + "40" : C.border}`,
                transition: "all 0.25s",
                minHeight: 140,
              }}>
                <textarea
                  value={tutorText} onChange={e => setTutorText(e.target.value)}
                  placeholder="Conte o que aconteceu com o Rex hoje..."
                  style={{
                    width: "100%", border: "none", background: "transparent", outline: "none",
                    fontFamily: font, fontSize: 15, color: C.text, resize: "none", minHeight: 100,
                    lineHeight: 1.7,
                  }}
                />
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8, borderTop: `1px solid ${C.border}`, paddingTop: 10 }}>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>{I.camera(20, C.accent)}</button>
                    <button style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>{I.image(20, C.accent)}</button>
                    <button style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>{I.video(20, C.accent)}</button>
                    <button style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>{I.mic(20, C.accent)}</button>
                  </div>
                  <span style={{ color: tutorText.length > 1800 ? C.danger : C.textGhost, fontSize: 10, fontFamily: fontMono }}>{tutorText.length}/2000</span>
                </div>
              </div>

              {/* Photos attached */}
              {photos.length > 0 && (
                <div style={{ display: "flex", gap: 8, marginBottom: 16, overflowX: "auto" }}>
                  {photos.map((p, i) => (
                    <div key={i} style={{ width: 72, height: 72, borderRadius: 14, background: C.bgCard, border: `1.5px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, position: "relative" }}>
                      {I.image(24, C.textGhost)}
                      <button style={{ position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: 6, background: C.danger, border: `2px solid ${C.bg}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                        {I.x(10, "#fff")}
                      </button>
                    </div>
                  ))}
                  <button style={{ width: 72, height: 72, borderRadius: 14, background: C.accent + "08", border: `1.5px dashed ${C.accent}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer" }}>
                    {I.plus(20, C.accent)}
                  </button>
                </div>
              )}

              <button onClick={handleSubmitText} disabled={tutorText.length < 3} style={{
                width: "100%", padding: "15px", borderRadius: 14, cursor: tutorText.length >= 3 ? "pointer" : "default",
                background: tutorText.length >= 3 ? `linear-gradient(135deg, ${C.accent}, ${C.accentDark})` : C.card,
                border: tutorText.length >= 3 ? "none" : `1.5px solid ${C.border}`,
                color: tutorText.length >= 3 ? "#fff" : C.textGhost,
                fontSize: 15, fontWeight: 700, fontFamily: font,
                boxShadow: tutorText.length >= 3 ? C.shadowAccent : "none",
                opacity: tutorText.length >= 3 ? 1 : 0.5,
              }}>Próximo: Escolher Humor</button>
            </>
          )}

          {/* ==================== STEP: MOOD ==================== */}
          {step === "mood" && (
            <>
              <h3 style={{ color: C.text, fontSize: 18, fontWeight: 700, margin: "0 0 6px", fontFamily: font }}>Como o {pet.name} estava?</h3>
              {aiSuggestedMood && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
                  {I.sparkleAI(14, C.purple)}
                  <span style={{ color: C.purple, fontSize: 12, fontFamily: font }}>IA sugere: <b>{moods.find(m => m.id === aiSuggestedMood)?.label}</b></span>
                </div>
              )}
              {!aiSuggestedMood && <p style={{ color: C.textDim, fontSize: 13, margin: "0 0 16px", fontFamily: font }}>Selecione o humor do {pet.name} neste momento</p>}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 24 }}>
                {moods.map(m => (
                  <button key={m.id} onClick={() => setSelectedMood(m.id)} style={{
                    padding: "18px 8px", borderRadius: 18, cursor: "pointer",
                    background: selectedMood === m.id ? m.color + "12" : C.card,
                    border: `2px solid ${selectedMood === m.id ? m.color + "40" : C.border}`,
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                    transition: "all 0.2s",
                    boxShadow: selectedMood === m.id ? `0 4px 16px ${m.color}15` : "none",
                  }}>
                    {m.icon(selectedMood === m.id ? 32 : 28, selectedMood === m.id ? m.color : C.textGhost)}
                    <span style={{ color: selectedMood === m.id ? m.color : C.textDim, fontSize: 11, fontWeight: 700, fontFamily: font }}>{m.label}</span>
                  </button>
                ))}
              </div>

              {/* Transcribed text preview */}
              {tutorText && (
                <div style={{ background: C.card, borderRadius: 16, padding: "14px 16px", marginBottom: 16, border: `1px solid ${C.border}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                    {inputMode === "mic" ? I.mic(14, C.accent) : inputMode === "camera" ? I.camera(14, C.accent) : I.type(14, C.accent)}
                    <span style={{ color: C.textDim, fontSize: 10, fontWeight: 700, fontFamily: font }}>
                      {inputMode === "mic" ? "TRANSCRITO DA VOZ" : inputMode === "camera" ? "GERADO DA FOTO" : "SEU TEXTO"}
                    </span>
                    <button style={{ background: "none", border: "none", cursor: "pointer", marginLeft: "auto", padding: 2 }}>{I.pencil(12, C.accent)}</button>
                  </div>
                  <p style={{ color: C.textSec, fontSize: 13, lineHeight: 1.6, margin: 0, fontFamily: font }}>{tutorText}</p>
                </div>
              )}

              <button onClick={handleProcess} disabled={!selectedMood} style={{
                width: "100%", padding: "15px", borderRadius: 14, cursor: selectedMood ? "pointer" : "default",
                background: selectedMood ? `linear-gradient(135deg, ${C.accent}, ${C.accentDark})` : C.card,
                border: selectedMood ? "none" : `1.5px solid ${C.border}`,
                color: selectedMood ? "#fff" : C.textGhost,
                fontSize: 15, fontWeight: 700, fontFamily: font,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                boxShadow: selectedMood ? C.shadowAccent : "none",
                opacity: selectedMood ? 1 : 0.5,
              }}>
                {I.sparkle(16, selectedMood ? "#fff" : C.textGhost)} Gerar Narração do {pet.name}
              </button>
            </>
          )}

          {/* ==================== STEP: PROCESSING ==================== */}
          {step === "processing" && (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <div style={{
                width: 90, height: 90, borderRadius: 30, margin: "0 auto 28px",
                background: C.purple + "10", border: `2.5px solid ${C.purple}25`,
                display: "flex", alignItems: "center", justifyContent: "center",
                animation: "breathe 2s ease infinite",
                boxShadow: `0 0 50px ${C.purple}10`,
              }}>
                {I.sparkleAI(40, C.purple)}
              </div>
              <p style={{ color: C.purple, fontSize: 16, fontWeight: 700, margin: "0 0 24px", fontFamily: font }}>Gerando narração...</p>

              {["Analisando o texto...", "Buscando memórias do RAG...", "Construindo personalidade...", "Escrevendo na voz do Rex...", "Sugerindo tags..."].map((line, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 10, justifyContent: "center",
                  marginBottom: 10, opacity: processingLine > i ? 1 : 0.2,
                  transition: "opacity 0.4s",
                }}>
                  {processingLine > i ? I.check(14, C.success) : (
                    <div style={{ width: 14, height: 14, borderRadius: 7, border: `2px solid ${C.textGhost}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {processingLine === i && <div style={{ width: 6, height: 6, borderRadius: 3, background: C.purple, animation: "pulse 1s ease infinite" }} />}
                    </div>
                  )}
                  <span style={{ color: processingLine > i ? C.textSec : C.textGhost, fontSize: 13, fontFamily: font }}>{line}</span>
                </div>
              ))}
            </div>
          )}

          {/* ==================== STEP: PREVIEW ==================== */}
          {step === "preview" && (
            <>
              {/* Tutor text */}
              <div style={{ background: C.card, borderRadius: 16, padding: "14px 16px", marginBottom: 3, border: `1px solid ${C.border}`, borderBottom: `1px dashed ${C.border}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <div style={{ width: 22, height: 22, borderRadius: 7, background: C.accent + "12", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {I.dog(12, C.accent)}
                  </div>
                  <span style={{ color: C.textDim, fontSize: 10, fontWeight: 700, fontFamily: font }}>TUTOR ESCREVEU</span>
                  <button style={{ background: "none", border: "none", cursor: "pointer", marginLeft: "auto", padding: 2 }}>{I.pencil(12, C.accent)}</button>
                </div>
                <p style={{ color: C.textSec, fontSize: 13, lineHeight: 1.6, margin: 0, fontFamily: font }}>{tutorText}</p>
              </div>

              {/* AI narration */}
              <div style={{ background: C.card, borderRadius: 16, padding: "16px 18px", marginBottom: 16, border: `1px solid ${C.purple}15`, borderTop: "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                  {I.sparkleAI(14, C.purple)}
                  <span style={{ color: C.purple, fontSize: 10, fontWeight: 700, fontFamily: font }}>REX NARRA</span>
                  <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
                    <button style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}>{I.refresh(14, C.accent)}</button>
                  </div>
                </div>
                <p style={{
                  color: C.text, fontSize: 16, lineHeight: 1.9, margin: 0,
                  fontFamily: fontHand, fontStyle: "italic",
                }}>"{aiNarration}"</p>
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 10, justifyContent: "flex-end" }}>
                  <span style={{ color: C.textGhost, fontSize: 10, fontFamily: font }}>— {pet.name}</span>
                  {I.dog(12, C.accent)}
                </div>
              </div>

              {/* Mood + Score */}
              {moodData && (
                <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                  <div style={{ flex: 1, background: moodData.color + "10", borderRadius: 14, padding: "12px 14px", border: `1px solid ${moodData.color}15`, display: "flex", alignItems: "center", gap: 10 }}>
                    {moodData.icon(24, moodData.color)}
                    <div>
                      <p style={{ color: moodData.color, fontSize: 13, fontWeight: 700, margin: 0, fontFamily: font }}>{moodData.label}</p>
                      <p style={{ color: C.textDim, fontSize: 10, margin: "1px 0 0", fontFamily: font }}>Humor selecionado</p>
                    </div>
                  </div>
                  <div style={{ width: 80, background: C.card, borderRadius: 14, padding: "12px", border: `1px solid ${C.border}`, textAlign: "center" }}>
                    <span style={{ color: C.accent, fontSize: 22, fontWeight: 800, fontFamily: fontMono }}>{aiMoodScore}</span>
                    <p style={{ color: C.textDim, fontSize: 9, margin: "2px 0 0", fontFamily: font }}>Score IA</p>
                  </div>
                </div>
              )}

              {/* Tags */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                  {I.tag(14, C.petrol)}
                  <span style={{ color: C.textDim, fontSize: 11, fontWeight: 700, fontFamily: font }}>TAGS</span>
                  <span style={{ color: C.purple, fontSize: 9, fontWeight: 600, fontFamily: font, marginLeft: 4 }}>sugeridas pela IA</span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {[...new Set([...aiTags, ...suggestedTags.slice(0, 6)])].map(t => {
                    const isSel = selectedTags.includes(t) || aiTags.includes(t);
                    return (
                      <button key={t} onClick={() => {
                        setSelectedTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
                      }} style={{
                        padding: "5px 12px", borderRadius: 8, cursor: "pointer",
                        background: isSel ? C.petrol + "15" : C.card,
                        border: `1.5px solid ${isSel ? C.petrol + "35" : C.border}`,
                        color: isSel ? C.petrol : C.textDim,
                        fontSize: 11, fontWeight: isSel ? 700 : 500, fontFamily: font,
                      }}>#{t}</button>
                    );
                  })}
                </div>
              </div>

              {/* Special moment toggle */}
              <button onClick={() => setIsSpecial(!isSpecial)} style={{
                display: "flex", alignItems: "center", gap: 12, width: "100%",
                background: isSpecial ? C.gold + "08" : C.card,
                border: `1.5px solid ${isSpecial ? C.gold + "30" : C.border}`,
                borderRadius: 14, padding: "14px 16px", cursor: "pointer",
                marginBottom: 20, textAlign: "left",
              }}>
                {isSpecial ? I.starFill(20, C.gold) : I.star(20, C.textGhost)}
                <div>
                  <p style={{ color: isSpecial ? C.gold : C.textSec, fontSize: 13, fontWeight: 700, margin: 0, fontFamily: font }}>Momento Especial</p>
                  <p style={{ color: C.textDim, fontSize: 10, margin: "2px 0 0", fontFamily: font }}>Destacar na timeline (aniversários, marcos...)</p>
                </div>
              </button>

              {/* Action buttons */}
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setStep("mood")} style={{
                  flex: 1, padding: 14, borderRadius: 14, cursor: "pointer",
                  background: C.card, border: `1.5px solid ${C.border}`,
                  color: C.textSec, fontSize: 13, fontWeight: 600, fontFamily: font,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                }}>
                  {I.refresh(14, C.accent)} Refazer
                </button>
                <button onClick={() => setStep("done")} style={{
                  flex: 2, padding: 14, borderRadius: 14, cursor: "pointer",
                  background: `linear-gradient(135deg, ${C.accent}, ${C.accentDark})`,
                  border: "none", color: "#fff", fontSize: 15, fontWeight: 700, fontFamily: font,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  boxShadow: C.shadowAccent,
                }}>
                  {I.send(16, "#fff")} Publicar
                </button>
              </div>
            </>
          )}

          {/* ==================== STEP: DONE ==================== */}
          {step === "done" && (
            <div style={{ textAlign: "center", padding: "50px 0" }}>
              <div style={{
                width: 90, height: 90, borderRadius: 30, margin: "0 auto 24px",
                background: C.success + "10", border: `3px solid ${C.success}30`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {I.check(44, C.success)}
              </div>
              <h3 style={{ color: C.success, fontSize: 22, fontWeight: 700, margin: "0 0 8px", fontFamily: font }}>Publicado!</h3>
              <p style={{ color: C.textSec, fontSize: 14, margin: "0 0 8px", fontFamily: font }}>Entrada salva no diário do {pet.name}</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center", marginBottom: 24 }}>
                {[
                  { icon: I.check(10, C.success), label: "Diário salvo" },
                  { icon: I.check(10, C.success), label: "Humor registrado" },
                  { icon: I.check(10, C.success), label: "Embedding gerado" },
                  { icon: I.check(10, C.success), label: "RAG atualizado" },
                ].map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, background: C.success + "08", padding: "4px 10px", borderRadius: 8 }}>
                    {item.icon}
                    <span style={{ color: C.success, fontSize: 10, fontWeight: 600, fontFamily: font }}>{item.label}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => { setStep("input"); setInputMode(null); setTutorText(""); setSelectedMood(null); setAiNarration(""); setPhotos([]); setSelectedTags([]); setIsSpecial(false); setAiSuggestedMood(null); }} style={{
                padding: "14px 32px", borderRadius: 14, cursor: "pointer",
                background: C.card, border: `1.5px solid ${C.border}`,
                color: C.accent, fontSize: 14, fontWeight: 700, fontFamily: font,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8, margin: "0 auto",
              }}>
                {I.plus(14, C.accent)} Nova entrada
              </button>
            </div>
          )}
        </div>

        <style>{`
          ::-webkit-scrollbar{width:0;height:0}
          textarea::placeholder{color:${C.placeholder} !important;opacity:1 !important}
          input::placeholder{color:${C.placeholder} !important;opacity:1 !important}
          @keyframes breathe{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.05);opacity:0.85}}
          @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.4;transform:scale(0.7)}}
        `}</style>
      </div>
    </div>
  );
}
