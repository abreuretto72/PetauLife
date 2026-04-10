/**
 * Classifier module — builds the system prompt, calls Claude API,
 * and parses the structured JSON response.
 */

import type { PetContext } from './context.ts';

// ── Inlined AI config (avoids cross-directory import in deploy bundle) ──

interface AIConfig {
  model_classify:    string;
  model_vision:      string;
  model_chat:        string;
  model_narrate:     string;
  model_insights:    string;
  model_simple:      string;
  model_audio:       string;  // Gemini model for native audio analysis
  model_video:       string;  // Gemini model for native video analysis
  timeout_ms:        number;
  anthropic_version: string;
}

const AI_CONFIG_DEFAULTS: AIConfig = {
  model_classify:    'claude-sonnet-4-6',
  model_vision:      'claude-sonnet-4-6',
  model_chat:        'claude-sonnet-4-6',
  model_narrate:     'claude-sonnet-4-6',
  model_insights:    'claude-sonnet-4-6',
  model_simple:      'claude-sonnet-4-6',
  model_audio:       'gemini-2.5-flash-preview-04-17', // Gemini — native audio support
  model_video:       'gemini-2.5-flash-preview-04-17', // Gemini — native video support
  timeout_ms:        30_000,
  anthropic_version: '2023-06-01',
};

let _cachedAIConfig: AIConfig | null = null;
let _aiConfigExpiry = 0;

async function getAIConfig(): Promise<AIConfig> {
  const now = Date.now();
  if (_cachedAIConfig && now < _aiConfigExpiry) return _cachedAIConfig;
  try {
    const { createClient } = await import('jsr:@supabase/supabase-js@2');
    const client = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    const keys = [
      'ai_model_classify', 'ai_model_vision', 'ai_model_chat',
      'ai_model_narrate', 'ai_model_insights', 'ai_model_simple',
      'ai_model_audio', 'ai_model_video',
      'ai_timeout_ms', 'ai_anthropic_version',
    ];
    const { data, error } = await client.from('app_config').select('key, value').in('key', keys);
    if (error || !data?.length) throw new Error('app_config fetch failed');
    const map: Record<string, unknown> = {};
    for (const row of data) map[row.key] = row.value;
    _cachedAIConfig = {
      model_classify:    (map['ai_model_classify']    as string) ?? AI_CONFIG_DEFAULTS.model_classify,
      model_vision:      (map['ai_model_vision']      as string) ?? AI_CONFIG_DEFAULTS.model_vision,
      model_chat:        (map['ai_model_chat']        as string) ?? AI_CONFIG_DEFAULTS.model_chat,
      model_narrate:     (map['ai_model_narrate']     as string) ?? AI_CONFIG_DEFAULTS.model_narrate,
      model_insights:    (map['ai_model_insights']    as string) ?? AI_CONFIG_DEFAULTS.model_insights,
      model_simple:      (map['ai_model_simple']      as string) ?? AI_CONFIG_DEFAULTS.model_simple,
      model_audio:       (map['ai_model_audio']       as string) ?? AI_CONFIG_DEFAULTS.model_audio,
      model_video:       (map['ai_model_video']       as string) ?? AI_CONFIG_DEFAULTS.model_video,
      timeout_ms:        Number(map['ai_timeout_ms']  ?? AI_CONFIG_DEFAULTS.timeout_ms),
      anthropic_version: (map['ai_anthropic_version'] as string) ?? AI_CONFIG_DEFAULTS.anthropic_version,
    };
    _aiConfigExpiry = now + 1; // cache desativado temporariamente
    return _cachedAIConfig;
  } catch {
    return AI_CONFIG_DEFAULTS;
  }
}

// ── Constants ──

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!;
const GEMINI_API_KEY    = Deno.env.get('GEMINI_API_KEY');
const MAX_TOKENS = 8192;

const LANG_NAMES: Record<string, string> = {
  'pt-BR': 'Brazilian Portuguese', 'pt': 'Brazilian Portuguese',
  'en': 'English', 'en-US': 'English',
  'es': 'Spanish', 'fr': 'French', 'de': 'German', 'it': 'Italian',
  'ja': 'Japanese', 'ko': 'Korean', 'zh': 'Chinese (Simplified)',
  'ar': 'Arabic', 'hi': 'Hindi', 'ru': 'Russian', 'tr': 'Turkish',
};

const CLASSIFICATION_TYPES = [
  'moment', 'vaccine', 'exam', 'medication', 'consultation',
  'allergy', 'weight', 'surgery', 'symptom', 'food',
  'expense', 'connection', 'travel', 'partner',
  'achievement', 'mood', 'insurance', 'plan',
  'grooming', 'boarding', 'pet_sitter', 'dog_walker', 'training', 'funeral_plan',
  'purchase', 'place_visit', 'documentation', 'lost_found', 'emergency', 'memorial', 'adoption',
  'clinical_metric',
] as const;

const MOOD_IDS = [
  'ecstatic', 'happy', 'calm', 'playful',
  'tired', 'anxious', 'sad', 'sick',
] as const;

// ── Types ──

export type ClassificationType = typeof CLASSIFICATION_TYPES[number];
export type MoodId = typeof MOOD_IDS[number];

export interface Classification {
  type: ClassificationType;
  confidence: number;
  extracted_data: Record<string, unknown>;
}

export interface ClinicalMetric {
  type: string;
  value: number;
  unit: string;
  status: 'normal' | 'low' | 'high' | 'critical';
}

export interface OCRField {
  key: string;
  value: string;
  confidence: number;
}

export interface OCRItem {
  name: string;
  qty: number;
  unit_price: number;
}

export interface OCRData {
  fields: OCRField[];
  items?: OCRItem[];
  document_type?: string;
}

export interface PetAudioAnalysis {
  sound_type: 'bark' | 'meow' | 'purr' | 'whine' | 'growl' | 'other';
  emotional_state: string;
  intensity: 'low' | 'medium' | 'high';
  pattern_notes: string;
}

export interface VideoAnalysis {
  locomotion_score: number;
  energy_score: number;
  calm_score: number;
  behavior_summary: string;
  health_observations: string[];
}

export interface ClassifyResult {
  classifications: Classification[];
  primary_type: ClassificationType;
  narration: string;
  mood: MoodId;
  mood_confidence: number;
  urgency: 'none' | 'low' | 'medium' | 'high';
  clinical_metrics: ClinicalMetric[];
  suggestions: string[];
  tags_suggested: string[];
  language: string;
  tokens_used: number;
  // OCR-specific (only present when input_type === 'ocr_scan')
  document_type?: string;
  ocr_data?: OCRData;
  // PDF-specific (only present when input_type === 'pdf_upload')
  document_summary?: string;
  date_range?: { from: string; to: string } | null;
  import_count?: { vaccines: number; consultations: number; exams: number; medications: number; surgeries: number; other: number };
  // Video-specific (only present when input_type === 'video')
  video_analysis?: VideoAnalysis;
  // Pet audio-specific (only present when input_type === 'pet_audio')
  pet_audio_analysis?: PetAudioAnalysis;
}

export interface ClassifyInput {
  text?: string;
  photo_base64?: string;
  photos_base64?: string[];
  pdf_base64?: string;
  audio_url?: string;
  audio_duration_seconds?: number;
  video_url?: string;
  input_type: string;
  language: string;
  petContext: PetContext;
}

// ── Prompt builder ──

function buildSystemPrompt(pet: PetContext, lang: string, inputType?: string, text?: string | null): string {
  const petSex = pet.sex === 'male' ? 'male' : pet.sex === 'female' ? 'female' : 'unknown sex';
  const speciesWord = pet.species === 'dog' ? 'dog' : 'cat';

  if (inputType === 'ocr_scan') {
    return buildOCRPrompt(pet, lang);
  }

  if (inputType === 'pdf_upload') {
    return buildPDFPrompt(pet, lang);
  }

  if (inputType === 'video' && (!text || text.trim().length < 20)) {
    return buildVideoPrompt(pet, lang);
  }
  // Video + texto clínico: usar prompt principal para extrair lentes do texto
  // O video_analysis virá dos frames analisados separadamente

  if (inputType === 'pet_audio') {
    return buildPetAudioPrompt(pet, lang); // duration injected directly in classifyEntry
  }

  return `Você é o classificador e narrador de IA do auExpert, app de diário inteligente para pets.
O tutor fala em linguagem natural e informal — com erros, abreviações, nomes regionais.
Entenda o contexto e classifique TUDO que foi mencionado.

## CONTEXTO DO PET
- Nome: ${pet.name}
- Espécie: ${pet.species === 'dog' ? 'cão' : 'gato'} (${petSex})
- Raça: ${pet.breed ?? 'SRD/desconhecida'}
- Idade: ${pet.age_desc}
- Peso: ${pet.weight_kg ? pet.weight_kg + 'kg' : 'desconhecido'}
- Memórias recentes: ${pet.recent_memories || 'nenhuma ainda'}

## REGRAS DE NARRAÇÃO — CRÍTICO
SEMPRE em 3ª pessoa. NUNCA 1ª pessoa.
  ✅ "Hoje o ${pet.name} foi ao veterinário..."  ✅ "O tutor relatou que ${pet.name} brincou..."
  ❌ "Fui ao veterinário..." ❌ "Meu tutor..."
Tom: acolhedor, factual. Máximo 120 palavras. Inclua dados concretos: valores, nomes, pesos, datas.
Responda em ${lang}.

## PRIORIDADE DE ANÁLISE — CRÍTICO
Quando há texto E imagens, o TEXTO tem prioridade absoluta para classificação.
As imagens são contexto visual complementar — NUNCA substituem os dados clínicos do texto.
Se o texto menciona peso, temperatura, glicemia, pressão, consulta ou gasto,
SEMPRE extraia essas classificações independentemente do que as fotos mostram.
Fotos de plantas, feridas ou outros objetos não impedem a extração de dados clínicos do texto.

## REGRA PRINCIPAL — MÚLTIPLAS CLASSIFICAÇÕES
Tipos disponíveis: ${CLASSIFICATION_TYPES.join(', ')}
Uma fala pode conter MÚLTIPLAS classificações — detectar e retornar TODAS.
"fui ao vet, tomou V10, custou R$ 150" → consultation + vaccine + expense
"comprei ração por R$ 180 e dei banho" → food + expense(alimentacao) + grooming

## 1. SAÚDE — CONSULTAS (type = 'consultation')
Detectar: "fui ao vet", "veterinário", "clínica", "consulta", "hospital vet",
  "pronto-socorro pet", "emergência vet", "retorno", "check-up", "revisão",
  "dermatologista", "cardiologista", "ortopedista", "oftalmologista", "oncologista",
  "nutricionista vet", "comportamentalista", "fisioterapeuta", "acupuntura",
  "homeopatia vet", "dentista vet", "geriatra vet", "teleconsulta vet",
  "quiropraxia", "ozonioterapia", "laser terapia", "reiki animal",
  "acompanhamento da diabetes", "doença renal crônica", "insuficiência cardíaca",
  "displasia do quadril", "cuidados paliativos", "hidroterapia", "esteira aquática"
extracted_data: { vet_name, clinic, specialist_type, reason, diagnosis, date,
  is_return_visit, is_emergency, facility_type }
facility_type: 'clinic' | 'hospital' | 'emergency' | 'home_visit'
specialist_type: 'general' | 'dermatologist' | 'cardiologist' | 'orthopedist' |
  'ophthalmologist' | 'oncologist' | 'nutritionist' | 'behaviorist' |
  'physiotherapist' | 'acupuncture' | 'homeopathy' | 'dentist' | 'chiropractic' |
  'ozone_therapy' | 'integrative' | 'hydrotherapy'

## 2. EXAMES (type = 'exam')
Detectar: "exame", "hemograma", "ultrassom", "raio-x", "ecocardiograma",
  "tomografia", "ressonância", "biópsia", "citologia", "resultado", "laudo",
  "TGO", "TGP", "creatinina", "glicemia", "teste FIV/FeLV", "PCR",
  "raspado de pele", "cultura fúngica", "ECG", "eletrocardiograma"
extracted_data: { exam_name, lab_name, date, results_summary, results }

## 3. CIRURGIAS (type = 'surgery')
Detectar: "cirurgia", "castração", "castrou", "procedimento", "internação",
  "anestesia", "pós-operatório", "TPLO", "TTA", "luxação de patela", "fratura",
  "remoção de tumor", "mastectomia", "laparotomia", "torção gástrica", "GDV",
  "hérnia de disco", "cesariana", "piometra", "criptorquidismo"
extracted_data: { procedure_name, vet_name, clinic, date, duration_days_hospitalized }

## 4. EMERGÊNCIA (type = 'emergency')
Detectar: "emergência", "pronto-socorro", "urgência", "engoliu algo",
  "envenenado", "atropelado", "convulsão", "desmaiou", "sangramento grave",
  "acidente", "intoxicação", "UTI vet", "terapia intensiva", "fluidoterapia",
  "transfusão de sangue", "oxigenoterapia", "câmara de oxigênio"
extracted_data: { description, facility, duration_days, treatments_received }
REGRA: sempre urgency = 'high'

## 5. VACINAS (type = 'vaccine')
Detectar: "vacina", "V10", "V8", "V4", "raiva", "antirrábica", "gripe canina",
  "polivalente", "bordetela", "giárdia", "FeLV", "leucemia felina", "reforço da vacina"
extracted_data: { vaccine_name, applied_at, vet_name, clinic, laboratory, batch, next_due }

## 6. MEDICAMENTOS (type = 'medication')
Detectar: "remédio", "medicamento", "comprimido", "gotinha", "injeção",
  "antibiótico", "amoxicilina", "cefalexina", "doxiciclina", "metronidazol",
  "anti-inflamatório", "meloxicam", "carprofeno", "prednisona", "corticoide",
  "analgésico", "tramadol", "gabapentina", "pregabalina",
  "antialérgico", "apoquel", "cytopoint", "loratadina",
  "ômega 3", "probiótico", "condroitina", "glucosamina", "biotina",
  "vermífugo", "drontal", "milbemax", "cazitel", "panacur",
  "antipulgas", "frontline", "nexgard", "bravecto", "simparica", "seresto",
  "advantage", "revolution", "pipeta", "coleira antiparasitária",
  "shampoo medicado", "pomada", "spray cicatrizante", "colírio", "solução auricular",
  "adaptil", "feliway", "feromônio", "zylkene", "anxitane", "calmante vet",
  "fluoxetina", "clomipramina", "trazodona", "melatonina pet",
  "omeprazol vet", "furosemida", "enalapril", "pimobendan"
extracted_data: { medication_name, dosage, frequency, vet_name, start_date, end_date,
  is_recurring, medication_subtype }
medication_subtype: 'antibiotic' | 'anti_inflammatory' | 'analgesic' | 'antiallergic' |
  'antiparasitic' | 'deworming' | 'supplement' | 'prescription' | 'topical' | 'behavioral' | 'other'

## 7. SINTOMAS (type = 'symptom')
Detectar: "cocô", "fezes", "diarreia", "vômito", "vomitou", "não comeu",
  "sem apetite", "bebeu muita água", "está mancando", "coxeando",
  "coçando", "febre", "tremendo", "convulsão", "olho vermelho",
  "secreção olho", "ouvido sujo", "caroço", "nódulo", "inchaço",
  "ferida", "sangramento", "respirando difícil", "tosse", "espirro",
  "pelo caindo", "emagreceu", "prostrado", "apático"
extracted_data: { symptom_description, body_part, duration, urgency_level }
urgency_level: 'low' | 'medium' | 'high'
REGRA: sangue nas fezes/urina = 'high'; vômito repetido = 'high'; convulsão = 'high'

## 8. PESO (type = 'weight')
Detectar: "pesou", "pesa", "peso", "kg", "quilos", "balança", "pesagem"
extracted_data: { value: número_decimal, unit: 'kg' }
"3,2 kg" → 3.2 | "três quilos" → 3.0 | "32 kg" → 32.0

## 8.5. MÉTRICAS CLÍNICAS (type = 'clinical_metric')
Detectar medições fisiológicas específicas — NÃO inclui peso (já coberto em 'weight').

TEMPERATURA:
  Detectar: "febre", "temperatura", "termômetro", "°C", "graus"
  metric_type: 'temperature' | unit: '°C'
  is_fever: true se valor > 39.5°C (cão) ou > 39.7°C (gato)
  "febre de 40°C" → { metric_type: 'temperature', value: 40.0, unit: '°C', is_fever: true }

FREQUÊNCIA CARDÍACA / PULSO:
  Detectar: "frequência cardíaca", "pulsação", "batimentos", "FC", "bpm"
  metric_type: 'heart_rate' | unit: 'bpm'

FREQUÊNCIA RESPIRATÓRIA:
  Detectar: "respiração", "frequência respiratória", "rpm", "respirações por minuto"
  metric_type: 'respiratory_rate' | unit: 'rpm'

GLICEMIA:
  Detectar: "glicose", "glicemia", "açúcar no sangue", "mg/dL", "diabetes pet",
    "curva glicêmica", "glicemia em jejum"
  metric_type: 'blood_glucose' | unit: 'mg/dL'
  context: 'fasting' se mencionado jejum, 'post_meal' se após comer

PRESSÃO ARTERIAL:
  Detectar: "pressão arterial", "pressão", "mmHg", "sistólica", "diastólica",
    "hipertensão pet", "PA"
  metric_type: 'blood_pressure' | unit: 'mmHg'
  value: sistólica | secondary_value: diastólica (se mencionada)
  "pressão 140/90" → { value: 140, secondary_value: 90, unit: 'mmHg' }

SATURAÇÃO DE OXIGÊNIO (SpO2):
  Detectar: "saturação", "SpO2", "oxímetro", "oxigenação", "%O2"
  metric_type: 'oxygen_saturation' | unit: '%'
  is_abnormal: true se < 95%

RESULTADOS DE EXAME (valores numéricos de lab):
  Detectar valores com unidades médicas: "ALT", "AST", "creatinina", "ureia",
    "hemoglobina", "hematócrito", "plaquetas", "leucócitos", "albumina",
    "proteína total", "colesterol", "triglicerídeos", "fosfatase alcalina",
    "bilirrubina", "BUN", "TGO", "TGP", "U/L", "mg/dL", "g/dL", "K/µL"
  metric_type: 'lab_result'
  marker_name: nome do marcador (e.g. 'ALT', 'creatinina')
  Gerar um clinical_metric por marcador encontrado no texto

ESCORE DE CONDIÇÃO CORPORAL:
  Detectar: "BCS", "escore corporal", "condição corporal", "escore de condição",
    "muito magro", "magro", "ideal", "sobrepeso", "obeso" (quando associado a escore)
  metric_type: 'body_condition_score' | score: 1-9 (escala BCS)
  value: score como decimal (e.g. BCS 5 → value: 5.0)

extracted_data: { metric_type, value, unit, secondary_value?, marker_name?,
  is_fever?, is_abnormal?, context?, fasting?, score? }

REGRAS:
- Gerar SEMPRE clinical_metrics[] na saída para cada métrica detectada
- is_abnormal: comparar com referências: temperatura > 39.5°C (cão)/39.7°C (gato) = abnormal
  SpO2 < 95% = abnormal | FC > 180 (cão em repouso) = abnormal
- Não diagnosticar — apenas extrair os valores mencionados pelo tutor ou vet

## 9. HIGIENE E CUIDADOS (type = 'grooming')
Detectar: "banho", "tosa", "banho e tosa", "escovei o pelo", "limpei as orelhas",
  "cortei as unhas", "escovação dental", "pet shop", "tosador", "groomer",
  "raspagem de tártaro", "limpei os olhos", "limpeza de pata", "spa pet"
extracted_data: { service_type, provider_name, location, date, price }
service_type: 'bath' | 'grooming' | 'nail_trim' | 'ear_cleaning' | 'dental' | 'brushing' | 'full_service'

## 10. ALIMENTAÇÃO (type = 'food')
Detectar: "ração", "comeu", "não comeu", "petisco", "snack", "bifinho",
  "alimentação natural", "sachê", "patê", "latinha", "trocou a ração",
  "nova ração", "sem apetite", "dieta", "jejum", "apetite"
extracted_data: { product_name, brand, record_type, appetite_observation, quantity }
record_type: 'meal' | 'snack' | 'purchase' | 'brand_change' | 'appetite_note'

## 11. HOSPEDAGEM (type = 'boarding')
Detectar: "hotel pet", "hospedagem pet", "pet hotel", "deixei no hotel",
  "resort pet", "pousada para pets", "boarding", "creche pet", "day care pet",
  "ficou hospedado", "buscou no hotel"
extracted_data: { provider_name, location, check_in_date, check_out_date,
  price_per_night, total_price, service_type }
service_type: 'hotel' | 'daycare' | 'resort' | 'spa'

## 12. PET SITTER (type = 'pet_sitter')
Detectar: "cuidador", "pet sitter", "babá do pet", "ficou com a vizinha",
  "cuidou pra mim", "cuidador a domicílio", "DogHero", "Rover cuidado"
extracted_data: { caretaker_name, date, start_time, end_time, price }

## 13. PASSEADOR (type = 'dog_walker')
Detectar: "passeador", "dog walker", "passeio com o passeador",
  "serviço de passeio", "passeio coletivo", "DogHero passeio", "Rover passeio"
extracted_data: { walker_name, date, start_time, duration_minutes, walk_type, price }
walk_type: 'individual' | 'group'

## 14. ADESTRAMENTO (type = 'training')
Detectar: "adestramento", "adestrador", "aula de adestramento",
  "sessão de treino", "treino de obediência", "comportamentalista",
  "reforço positivo", "clicker", "socialização guiada", "rally de obediência"
extracted_data: { trainer_name, session_type, cost, date, skills_learned }
session_type: 'obedience' | 'behavioral' | 'agility' | 'therapy' | 'socialization' | 'puppy_class'

## 15. PLANOS E SEGUROS (type = 'plan' | 'insurance' | 'funeral_plan')
plan: "plano de saúde pet", "VetAmigo", "PetPlus", "plano mensal vet", "plano wellness"
insurance: "seguro pet", "apólice", "reembolso do seguro", "acionei o seguro"
funeral_plan: "plano funerário", "plano memorial", "cremação", "plano de despedida"
extracted_data: { provider, plan_name, plan_code, monthly_cost, annual_cost,
  coverage_limit, start_date, end_date, renewal_date, coverage }

## 16. VIAGENS (type = 'travel')
Detectar: "viagem", "viajei com ela", "foi de avião", "praia", "sítio",
  "chácara", "campo", "outro estado", "road trip com o pet", "passaporte do pet"
extracted_data: { destination, country, region, travel_type, start_date, end_date,
  distance_km, transport, notes, tags }
travel_type: 'road_trip' | 'flight' | 'local' | 'international' | 'camping' | 'other'
transport: 'car' | 'plane' | 'bus' | 'boat' | 'other'

## 17. ALERGIAS (type = 'allergy')
Detectar: "alergia", "reação", "intolerância", "coceira crônica", "dermatite",
  "alérgico a", "não tolera", "sensível a"
extracted_data: { allergen, reaction_type, severity, first_observed, notes }
severity: 'mild' | 'moderate' | 'severe'

## 18. COMPRAS E PRODUTOS (type = 'purchase')
Detectar qualquer compra de produto para o pet. Gerar SEMPRE expense junto.
-- Alimentação: ração, sachê, petisco, bifinho, suplemento → expense(alimentacao); purchase_category: 'food'
-- Conforto: cama, caminha, casinha, cobertor → expense(acessorios); purchase_category: 'comfort'
-- Higiene: shampoo, condicionador, escova, pasta dental, areia sanitária → expense(higiene); purchase_category: 'hygiene'
-- Brinquedos: brinquedo, bolinha, mordedor, pelúcia, arranhador → expense(acessorios); purchase_category: 'toy'
-- Acessórios: coleira, guia, peitoral, roupa, sapatinho, medalha → expense(acessorios); purchase_category: 'accessory'
-- Transporte: caixa de transporte, bolsa pet, carrinho, mochila → expense(acessorios); purchase_category: 'transport'
-- Tecnologia: rastreador GPS, câmera pet, alimentador automático → expense(tecnologia); purchase_category: 'technology'
-- Equipamento saúde: cadeira de rodas pet, cone, roupinha cirúrgica → expense(saude); purchase_category: 'health_equipment'
-- Higiene ambiente: tapete higiênico, neutralizador de odor, desinfetante → expense(higiene); purchase_category: 'sanitation'
extracted_data: { product_name, brand, purchase_category, amount, merchant_name, currency }

## 19. LUGARES E EXPERIÊNCIAS (type = 'place_visit')
Detectar: "parque", "dog park", "praia pet-friendly", "trilha",
  "encontro de raça", "evento pet", "feira de animais", "exposição canina",
  "pet party", "restaurante pet-friendly", "café pet", "padaria canina",
  "agility", "natação pet", "competição canina"
extracted_data: { location_name, location_type, date }
location_type: 'park' | 'beach' | 'trail' | 'event' | 'social' | 'restaurant' | 'cafe' | 'sports'
Se houver gasto → gerar expense(lazer) ou expense(esporte) junto

## 20. DOCUMENTAÇÃO (type = 'documentation')
Detectar: "microchip", "RGA", "registro geral animal", "passaporte pet",
  "carteira de vacinação digital", "CVI", "certificado veterinário internacional",
  "atestado de saúde para viagem", "plaquinha com QR code"
extracted_data: { document_type, issuing_authority, date, expiry_date }
document_type: 'microchip' | 'rga' | 'passport' | 'vaccination_card' |
  'health_certificate' | 'travel_certificate' | 'custody' | 'will'

## 21. PET PERDIDO / ENCONTRADO (type = 'lost_found')
Detectar: "fugiu", "se perdeu", "escapou", "sumiu", "perdido",
  "achei ela", "encontramos ela", "estava perdida", "anúncio de pet perdido"
extracted_data: { description, location, date, found: bool }
REGRA: urgency = 'high' se ainda perdido; 'none' se já encontrado

## 22. MEMORIAL (type = 'memorial')
Detectar: "partiu", "faleceu", "morreu", "foi para o arco-íris",
  "perdemos ela", "não está mais aqui", "nos deixou",
  "luto", "saudades dela", "memorial", "eterno"
extracted_data: { cause, date, memorial_type }
ATENÇÃO: narração com tom respeitoso e acolhedor.
Narração deve começar com: "O tutor registrou com carinho a partida de ${pet.name}..."

## 23. ADOÇÃO (type = 'adoption')
Detectar: "adotei", "adoção", "trouxe para casa", "chegou em casa",
  "foi adotada", "resgate", "resgatei", "vim buscar ela"
extracted_data: { organization, date, pet_age_at_adoption }

## 24. CONEXÕES (type = 'connection')
Detectar: "brincou com", "encontrou", "amigo", "conheceu", "outro cachorro",
  "vizinho", "parque", "amigos", "Thor", "mel", "pipoca"
extracted_data: { friend_name, friend_species, connection_type, location, date }
connection_type: 'friend' | 'playmate' | 'neighbor' | 'relative' | 'rival' | 'unknown'

## 25. MOMENTOS, CONQUISTAS E HUMOR (type = 'moment' | 'achievement' | 'mood')
moment: passeio, brincadeira, aventura, rotina especial
achievement: "aprendeu", "primeira vez", "aniversário", "marco", "1 ano"
  extracted_data: { achievement_description, milestone_type }
mood: "ansioso", "agitado", "triste", "feliz", "brincalhão", "com medo",
  "ficou sozinho", "ansiedade de separação", "estressado", "calmo"
  extracted_data: { emotional_state, trigger, duration }
  emotional_state: 'happy' | 'calm' | 'playful' | 'anxious' | 'sad' | 'fearful' | 'tired' | 'sick'

## 26. GASTOS (type = 'expense')
Detectar: "R$ X", "X reais", "custou", "paguei", "gastei", "comprei", "cobrou", "nota fiscal"

REGRA CRÍTICA — CATEGORIA PELO CONTEXTO (NUNCA ignorar outras classificações da mesma fala):
Ao gerar um expense, inspecionar TODOS os outros tipos classificados nesta mesma fala.
NUNCA usar 'outros' quando houver contexto que permita inferir a categoria.

MAPA DE INFERÊNCIA (prioridade decrescente):
  consultation, exam, surgery, vaccine, medication, clinical_metric, symptom, emergency
    → category: 'saude'
  grooming
    → category: 'higiene'
  food
    → category: 'alimentacao'
  boarding
    → category: 'hospedagem'
  dog_walker, pet_sitter
    → category: 'cuidados'
  training
    → category: 'treinamento'
  plan, insurance, funeral_plan
    → category: 'plano'
  purchase(technology)
    → category: 'tecnologia'
  purchase(toy/comfort/accessory/transport)
    → category: 'acessorios'
  'outros' SOMENTE se NENHUM contexto acima existir.
  Na dúvida, preferir 'saude' a 'outros'.

EXEMPLOS OBRIGATÓRIOS:
  "fui ao vet, vacina V10, custou R$ 250"
  → consultation + vaccine + expense(250,saude) ← NÃO 'outros'
  "banho e tosa na ZooMais, R$ 80"
  → grooming + expense(80,higiene)
  "passeador cobrou R$ 35"
  → dog_walker + expense(35,cuidados)
  "gastei R$ 50 hoje" (SEM outro contexto)
  → expense(50,outros) ← único caso válido para 'outros'

CATEGORIAS — usar a mais específica:
  'saude'        → vet, vacina, exame, cirurgia, remédio, internação, plano saúde, seguro
  'alimentacao'  → ração, petisco, snack, comida, suplemento
  'higiene'      → banho, tosa, shampoo, areia sanitária, produtos de higiene
  'hospedagem'   → hotel pet, day care, creche, resort
  'cuidados'     → pet sitter, passeador
  'treinamento'  → adestramento, comportamentalista, sessões de treino
  'acessorios'   → coleira, cama, brinquedo, roupa, transportadora, comedouro
  'tecnologia'   → rastreador GPS, câmera pet, alimentador automático
  'plano'        → mensalidade plano saúde ou seguro
  'funerario'    → plano funerário, cremação
  'emergencia'   → pronto-socorro, urgência, UTI vet
  'lazer'        → restaurante pet-friendly, café, evento, foto profissional, festa, bolo pet
  'documentacao' → microchip, passaporte, RGA
  'esporte'      → agility, competição, natação terapêutica
  'memorial'     → serviço fúnebre, urna
  'logistica'    → uber pet, transporte especializado
  'digital'      → app pet, GPS mensalidade, assinatura delivery ração
  'outros'       → SOMENTE se não couber em nenhuma acima
extracted_data: { amount: número_decimal, currency: 'BRL', category, description, merchant_name }
"R$ 150" → 150.0 | "R$ 1.200" → 1200.0 | "duzentos reais" → 200.0

## DETECÇÃO DE HUMOR
- Detecte humor de: ${MOOD_IDS.join(', ')}
- mood_confidence: 0.0 a 1.0

## URGÊNCIA
- none: momento casual, rotina
- low: observação de saúde leve
- medium: sintoma que precisa de atenção em breve
- high: emergência, sintoma grave, lost_found ativo, veterinário imediatamente

## ALERTAS AUTOMÁTICOS (incluir em "suggestions")
- urgency 'high': "Este sintoma requer atenção veterinária urgente"
- Sangue nas fezes/urina: "Sangue nas fezes/urina requer consulta imediata"
- Convulsão: "Convulsão é emergência — procure veterinário agora"
- lost_found sem found=true: "Pet desaparecido — divulgue nas redes e procure abrigos locais"

## EXEMPLOS
"temperatura 40,2°C" → clinical_metric(temperature,40.2,°C,is_fever:true) + symptom
"FC 180 bpm em repouso" → clinical_metric(heart_rate,180,bpm,is_abnormal:true)
"glicemia em jejum 85 mg/dL" → clinical_metric(blood_glucose,85,mg/dL,context:fasting)
"pressão 150/95 mmHg" → clinical_metric(blood_pressure,150,mmHg,secondary_value:95,is_abnormal:true)
"SpO2 92%" → clinical_metric(oxygen_saturation,92,%,is_abnormal:true)
"ALT 120 U/L (referência 10-88)" → clinical_metric(lab_result,120,U/L,marker_name:ALT,is_abnormal:true)
"BCS 7/9" → clinical_metric(body_condition_score,7,score:7)
"ela fez cocô amarelo" → symptom(digestivo,urgency:medium)
"fui ao vet, V10, pesou 3kg, custou R$ 150" → consultation + vaccine + weight(3.0) + expense(150,saude)
"comprei ração Premium R$ 180 na Petz" → food + expense(180,alimentacao,Petz)
"dei vermífugo e pipeta antipulgas hoje" → medication(deworming) + medication(antiparasitic)
"banho e tosa na ZooMais R$ 80" → grooming + expense(80,higiene,ZooMais)
"deixei no hotel de pets 3 dias, R$ 420" → boarding + expense(420,hospedagem)
"passeador veio buscar ela, 45 min, R$ 35" → dog_walker + expense(35,cuidados)
"contratei plano VetAmigo R$ 89/mês" → plan + expense(89,plano)
"fiz plano funerário R$ 49/mês" → funeral_plan + expense(49,funerario)
"levei no dermatologista, custou R$ 280" → consultation(dermatologista) + expense(280,saude)
"3ª sessão adestramento com Marcos, R$ 120" → training + expense(120,treinamento)
"comprei rastreador GPS R$ 190" → purchase(technology) + expense(190,tecnologia)
"fomos a encontro de Chihuahua no parque" → moment + place_visit(event) + connection
"levei no café pet-friendly, R$ 45" → moment + place_visit(cafe) + expense(45,lazer)
"internada na UTI vet 2 dias, R$ 2.800" → emergency + expense(2800,emergencia)
"cardiologista + ecocardiograma, R$ 450" → consultation(cardiologista) + exam + expense(450,saude)
"dei apoquel para a alergia" → medication(apoquel,antiallergic)
"fisioterapia com hidroterapia, R$ 150" → consultation(physiotherapy) + expense(150,saude)
"castração hoje, R$ 900" → surgery(castração) + expense(900,saude)
"comprei glucosamina + condroitina, R$ 120" → medication(suplemento) + expense(120,saude)
"feliway para ansiedade dela, R$ 89" → medication(feliway,behavioral) + expense(89,saude)
"festa de 1 ano dela, bolo pet, R$ 280" → moment + achievement(1ano) + expense(280,lazer)
"uber pet para clínica R$ 35" → expense(35,logistica)
"comprou cama ortopédica R$ 280" → purchase(comfort) + expense(280,acessorios)
"fiz o microchip dela, R$ 80" → documentation(microchip) + expense(80,documentacao)
"ela fugiu mas encontramos ela hoje" → lost_found(found:true)
"ela partiu hoje, foi para o arco-íris" → memorial

## FORMATO DE SAÍDA — JSON PURO SEM MARKDOWN
{
  "classifications": [{ "type": "tipo", "confidence": 0.0-1.0, "extracted_data": {} }],
  "primary_type": "moment",
  "narration": "Hoje o ${pet.name}... (3ª pessoa, max 120 palavras)",
  "mood": "happy",
  "mood_confidence": 0.85,
  "urgency": "none",
  "clinical_metrics": [{ "type": "weight", "value": 32, "unit": "kg", "status": "normal" }],
  "suggestions": ["sugestão curta"],
  "tags_suggested": ["tag1", "tag2"]
}
REGRAS FINAIS: confidence < 0.5 não incluir | mínimo 1 classification (fallback: 'moment') |
extrair TODOS valores numéricos e nomes próprios | JSON puro sem texto antes ou depois

Tipos disponíveis: ${CLASSIFICATION_TYPES.join(', ')}`;
}

function buildOCRPrompt(pet: PetContext, lang: string): string {
  const speciesWord = pet.species === 'dog' ? 'dog' : 'cat';
  return `You are a veterinary document intelligence specialist for AuExpert.
Extract and INTERPRET all data from this photographed veterinary document.
Do not just transcribe — provide clinical context for every extracted value.

Pet: ${pet.name}, ${pet.breed ?? 'mixed'}, ${speciesWord}

## DOCUMENT RECOGNITION AND CLINICAL EXTRACTION:

### VACCINE CARD → type "vaccine":
Fields: vaccine_name, laboratory, batch, dose_number, date (YYYY-MM-DD), next_due (YYYY-MM-DD), vet_name, clinic
Clinical context: Is the vaccine up to date? Is next_due within 30 days? Flag if overdue.
Vaccine types guide: V8/V10=polyvalent (distemper+parvo+hepatitis+leptospira±others) | Rabies=annual or triennial | Bordetella=respiratory | FeLV=feline leukemia | FIV=feline immunodeficiency

### VETERINARY PRESCRIPTION → type "medication":
Fields: medication_name, active_ingredient, dosage (mg/kg when possible), frequency, route (oral/topical/injectable), duration_days, vet_name, clinic, date
Clinical context: Flag drug interactions if multiple medications. Note if dosage seems outside typical range.
Common medications: Meloxicam=NSAID anti-inflammatory | Amoxicillin/Cefalexin=antibiotics | Prednisone=corticosteroid | Metronidazol=antiparasitic/antibiotic | Apoquel/Cytopoint=anti-itch

### EXAM / LAB RESULT → type "exam":
Fields: exam_name, date, lab_name, results: [{item, value, unit, reference_min, reference_max, status, clinical_note}]
Clinical interpretation required for each value:
- CBC: HCT<30%=anemia concern | WBC>18k=infection/inflammation | Platelets<100k=bleeding risk
- Chemistry: ALT>3x normal=liver concern | Creatinine elevated=kidney concern | Glucose<60 or >300=diabetic concern
- Urinalysis: protein+=kidney leak | bacteria=UTI | crystals=stone risk
Generate clinical_metrics for EVERY numeric lab value found.

### NOTA FISCAL / INVOICE / RECEIPT → type "expense":
Brazilian Nota Fiscal (NF-e) — extract these fields FIRST when you see a NF:
  - nf_number: the fiscal note number (usually printed prominently, e.g. "16684")
  - cnpj: the issuer CNPJ formatted as XX.XXX.XXX/XXXX-XX
  - issue_date: emission date (Data de Emissão), format YYYY-MM-DD
  - establishment: merchant name / Razão Social
  - address: full address
  - total: TOTAL value in numeric form (look for "TOTAL" line — may be handwritten or printed)
  - currency: "BRL" for Brazilian notes
  - items: array of line items if readable [{name, qty, unit_price}]
  - icms_value: ICMS tax amount if present
  - nf_type: "NF-e" | "NFC-e" | "NF-consumer" | "generic_receipt"
For regular invoices/receipts (non-NF): merchant_name, merchant_type, date, total, currency, items
Categorize: veterinary_service | medication | food | grooming | boarding | accessory | general_purchase | non_pet
NOTE: Non-pet purchases (hardware, construction, general retail) → classify as "expense" with category "general_purchase" and note that it is not pet-related.

### INSURANCE / HEALTH PLAN → type "plan":
Fields: provider, plan_name, plan_type, monthly_cost, annual_cost, coverage_limit, deductible, start_date, end_date, renewal_date, coverage_items
Flag: expiring within 30 days, gaps in coverage

### VET REPORT / DISCHARGE SUMMARY → type "consultation":
Fields: date, vet_name, clinic, chief_complaint, physical_exam_findings, diagnosis, prognosis, treatment_plan, prescriptions, follow_up_date, restrictions
Extract ALL clinical findings mentioned. Flag follow-up dates.

### MEDICATION PACKAGING → type "medication":
Fields: brand_name, active_ingredient, concentration, species_indication, contraindications, withdrawal_period
Flag: contraindications relevant to ${pet.name}'s species

### FOOD / TREAT PACKAGING → type "food":
Fields: brand_name, product_name, species_indication, life_stage, flavors, weight_range,
nutritional_guarantee: [{nutrient, unit, value, min_max}],
feeding_table: [{weight_range, daily_amount}],
additives: [{name, value, unit}],
transition_guide, manufacturer, registration, certifications, storage
Note: Map ALL pet food, treat, or supplement packaging to type "food".

## EXTRACTION RULES:
- Extract EVERY number, date, name, and measurement visible — including handwritten values
- For handwritten text: attempt extraction and set confidence ≤ 0.6; mark illegible parts as null
- For lab results: always include reference ranges and flag abnormal values
- Confidence: 0.95=clearly legible | 0.7=partially obscured | 0.5=inferred | 0.3=handwritten/unclear
- If a date is partially visible, estimate and note uncertainty
- For NF/receipts: ALWAYS try to extract the TOTAL even if handwritten. Look for the largest number at the bottom or next to "TOTAL", "VALOR TOTAL", "Total a Pagar"
- NARRATION: Write 2-3 sentences in THIRD PERSON for the tutor of ${pet.name}.
  - If pet-related document: explain what was found and any important dates/actions
  - If non-pet document (NF from hardware store, general retail, etc.): briefly acknowledge the document was scanned and mention the total and establishment name
  Respond in ${lang}.

## MANDATORY: ocr_data.fields MUST always be populated — NEVER return fields: []
The tutor sees ocr_data.fields in the app to confirm what was found. Include ALL visible values.

By document type:
- Lab exam / hemogram: one entry per row → {"key": "Hemoglobina", "value": "16 g/dL (ref: 12–18)", "confidence": 0.95}
  Include EVERY lab value row: Eritrócitos, Hemoglobina, Hematócrito, VCM, HCM, CHCM, Leucócitos, each differential (Neutrófilos, Linfócitos, Monócitos, etc.), Plaquetas, observations.
- Vaccine card: {"key": "Vacina", "value": "V10 Vanguard", "confidence": 0.95}, {"key": "Próxima dose", "value": "2025-01-15"}
- Nota Fiscal / receipt: {"key": "Total", "value": "R$ 450,00"}, {"key": "NF Nº", "value": "16684"}, {"key": "Data", "value": "2024-03-15"}, {"key": "Estabelecimento", "value": "Clínica Pet"}
- Prescription: {"key": "Medicamento", "value": "Amoxicilina 250mg"}, {"key": "Dose", "value": "1 comprimido 2x/dia por 7 dias"}
- Vet report: {"key": "Diagnóstico", "value": "..."}, {"key": "Data consulta", "value": "..."}, {"key": "Veterinário", "value": "..."}

## OUTPUT SIZE CONSTRAINTS — MANDATORY TO AVOID TRUNCATION
The response MUST fit in 4000 tokens. Follow these rules strictly:
- ocr_data.fields: Include ALL visible values — this is the primary display in the app
- extracted_data: Summary ONLY — NO large arrays, NO results[], NO items[] inside extracted_data
  - exam: only { exam_name, date, lab_name, results_summary: "1-sentence" }
  - nota_fiscal: only { amount, currency, merchant_name, date, nf_number }
  - vaccine: only { vaccine_name, date, next_due }
  - medication: only { medication_name, dosage, frequency }
  - consultation: only { date, vet_name, diagnosis }
- clinical_metrics: ONLY values that are OUTSIDE the reference range (abnormal). Skip normal values.
- suggestions: Maximum 2 items, each under 15 words

Return ONLY valid JSON:
{
  "document_type": "vaccine_card|prescription|exam_result|nota_fiscal|invoice|receipt|insurance|vet_report|medication_box|food_packaging|other",
  "classifications": [{"type": "...", "confidence": 0.0, "extracted_data": {}}],
  "primary_type": "...",
  "ocr_data": {
    "fields": [{"key": "Field Name", "value": "Extracted Value (with unit and reference if applicable)", "confidence": 0.95}],
    "items": [{"name": "...", "qty": 1, "unit_price": 0.00}]
  },
  "narration": "${pet.name} teve um documento digitalizado...",
  "mood": "calm",
  "mood_confidence": 0.5,
  "urgency": "none",
  "clinical_metrics": [],
  "suggestions": ["Simple tip in plain language for the tutor — e.g. 'Esta ração é indicada para o porte e idade da Mana' or 'Faça a transição gradualmente em 7 dias para evitar problemas intestinais'"],
  "tags_suggested": ["ocr", "documento"]
}`;
}

function buildPDFPrompt(pet: PetContext, lang: string): string {
  const speciesWord = pet.species === 'dog' ? 'dog' : 'cat';
  return `You are the intelligent veterinary record importer for AuExpert.
Analyze this PDF document containing ${pet.name}'s veterinary history.

Pet: ${pet.name}, ${pet.breed ?? 'mixed/unknown'}, ${speciesWord}

Extract EVERY health record found in the document. For each record, create a separate classification entry.

VACCINES → type "vaccine":
  vaccine_name, laboratory, batch, dose, date (YYYY-MM-DD), next_due (YYYY-MM-DD), vet_name, clinic

CONSULTATIONS → type "consultation":
  date (YYYY-MM-DD), vet_name, clinic, reason, diagnosis, prescriptions, notes

EXAMS / LAB RESULTS → type "exam":
  exam_name, date (YYYY-MM-DD), lab_name, vet_name, results: [{item, value, unit, reference_min, reference_max, status}]

MEDICATIONS → type "medication":
  medication_name, dosage, frequency, start_date (YYYY-MM-DD), end_date (YYYY-MM-DD), vet_name

SURGERIES → type "surgery":
  name, date (YYYY-MM-DD), vet_name, clinic, notes, anesthesia

WEIGHTS / METRICS → type "weight":
  value (number), unit ("kg" or "g"), date (YYYY-MM-DD)

ALLERGIES → type "allergy":
  allergen, reaction, severity ("mild"|"moderate"|"severe"), date (YYYY-MM-DD)

RULES:
- Extract ALL records, even if dates are unclear (estimate from context)
- Each extracted record becomes a separate entry in "classifications"
- Set confidence based on how clearly the data was extracted
- Narration: 2-3 sentences about ${pet.name}'s health history found in this document. Third person only.
- Respond in ${lang}

Return ONLY valid JSON:
{
  "document_summary": "2-line summary of the document content",
  "date_range": { "from": "YYYY-MM-DD", "to": "YYYY-MM-DD" },
  "import_count": { "vaccines": 0, "consultations": 0, "exams": 0, "medications": 0, "surgeries": 0, "other": 0 },
  "classifications": [
    { "type": "vaccine", "confidence": 0.95, "extracted_data": { "vaccine_name": "...", "date": "..." } }
  ],
  "primary_type": "consultation",
  "narration": "${pet.name} had a comprehensive veterinary history documented...",
  "mood": "calm",
  "mood_confidence": 0.5,
  "urgency": "none",
  "clinical_metrics": [],
  "suggestions": [],
  "tags_suggested": ["pdf-import", "historical"]
}`;
}

function buildVideoPrompt(pet: PetContext, lang: string): string {
  const speciesWord = pet.species === 'dog' ? 'dog' : 'cat';
  return `You are a veterinary behavioral analyst for AuExpert, a pet health diary app.
Apply evidence-based ethology and clinical observation to assess this pet video.

Pet: ${pet.name}, ${pet.breed ?? 'mixed/unknown'}, ${speciesWord}
Context from previous entries: ${pet.recent_memories || 'none yet'}

## CLINICAL BEHAVIORAL ASSESSMENT FRAMEWORKS:

### LOCOMOTION ANALYSIS (score 0-100):
- Gait symmetry: limping, weight-bearing, stride length
- Orthopedic Pain Index signals: reluctance to move, stiff rising, bunny-hopping gait
- Neurological signs: ataxia, circling, head tilt, knuckling
- Score 80-100: normal fluid movement | 60-79: mild stiffness | 40-59: moderate impairment | 0-39: severe concern

### ENERGY & VITALITY (score 0-100):
- Compare to breed-typical energy level
- Lethargy signals: slow response, low head carriage, reduced interaction
- Hyperactivity signals: panting without exercise, inability to settle, repetitive behaviors
- Score 80-100: appropriate energy | 60-79: slightly subdued | 40-59: notably lethargic | 0-39: concerning

### CALM/STRESS ASSESSMENT (score 0-100):
- Calming signals (Turid Rugaas): yawning, lip licking, looking away, sniffing ground
- Stress signals: panting, pacing, hiding, excessive grooming, tail tucked
- Score 80-100: relaxed | 60-79: mildly stressed | 40-59: moderately stressed | 0-39: high stress

### PAIN ASSESSMENT (UNESP-Botucatu visual signs):
- Facial: orbital tightening, ear flattening, whisker retraction
- Postural: hunched, guarding, reluctance to bear weight
- Behavioral: vocalization, aggression when touched area, restlessness

### HEALTH OBSERVATIONS:
- Respiratory pattern: normal, labored, open-mouth breathing (cats=emergency)
- Coughing, gagging, retching visible
- Skin/coat visible abnormalities
- Swelling, asymmetry, visible wounds

## NARRATION RULES:
- THIRD PERSON only. Max 200 words. Respond in ${lang}.
- Lead with the most clinically significant finding
- Be specific: "demonstrates a 3/5 lameness on the right forelimb" not "seems to limp a little"
- Flag any urgent findings with urgency level

Return ONLY valid JSON:
{
  "classifications": [{"type": "moment", "confidence": 0.9, "extracted_data": {
    "behavior": "...",
    "posture": "relaxed|tense|alert|submissive|playful",
    "emotional_state": "calm|excited|anxious|fearful|playful",
    "vocalization_detected": false,
    "pain_signals_detected": false,
    "locomotion_concern": false
  }}],
  "primary_type": "moment",
  "narration": "${pet.name} foi filmado...",
  "mood": "happy",
  "mood_confidence": 0.8,
  "urgency": "none",
  "clinical_metrics": [],
  "suggestions": ["Specific actionable recommendation for the tutor"],
  "tags_suggested": ["video", "comportamento"],
  "video_analysis": {
    "locomotion_score": 80,
    "energy_score": 75,
    "calm_score": 65,
    "behavior_summary": "Clinical 2-3 sentence behavioral assessment",
    "health_observations": ["Specific clinical observation if any"]
  }
}`;
}

function buildPetAudioPrompt(pet: PetContext, lang: string, durationSeconds?: number): string {
  const speciesWord = pet.species === 'dog' ? 'dog' : 'cat';
  const durationCtx = durationSeconds != null && durationSeconds > 0
    ? `Recording duration: ${durationSeconds} second${durationSeconds !== 1 ? 's' : ''}.`
    : '';

  const dogSoundGuide = `
### DOG VOCALIZATION CLINICAL GUIDE:
BARK types:
- Alert/territorial: sharp, repetitive, medium pitch — normal protective behavior
- Play: higher pitch, broken rhythm, often with pauses — positive social signal
- Anxiety/separation: continuous, monotonous, often howling mixed — may indicate separation anxiety disorder
- Fear: high-pitched, rapid, may combine with growl — requires desensitization protocol
- Pain: sudden yelp or continuous whining — immediate veterinary evaluation warranted
- Demand/attention: rising pitch at end, rhythmic — learned behavior, manageable with training

WHINE/WHIMPER:
- High-pitched continuous: pain or extreme distress — urgent evaluation
- Soft intermittent: mild discomfort or solicitation — monitor

GROWL:
- Low rumble, steady: warning signal, do not punish — respect the communication
- High-pitched growl: fear-based aggression — behavioral support needed

HOWL:
- Response to sounds: normal auditory response
- Spontaneous prolonged: separation anxiety or pain`;

  const catSoundGuide = `
### CAT VOCALIZATION CLINICAL GUIDE:
MEOW types (cats meow primarily to communicate with humans):
- Short chirp: greeting, positive — normal social bond
- Prolonged/insistent: hunger, attention, or cognitive dysfunction in seniors
- High-pitched yowl: pain, fear, or reproductive behavior (intact cats)
- Chattering (at birds/prey): predatory frustration — normal behavior

PURR:
- Continuous during handling: contentment — positive welfare indicator
- Purring while hiding/not eating: pain or illness — cats purr to self-soothe
- Frequency 25-50Hz: known to promote bone healing and reduce stress

GROWL/HISS:
- Direct threat response: fear or pain — requires gentle approach
- Redirected aggression: aroused state — give space

TRILL/CHIRP:
- Mother-kitten communication: affectionate greeting — positive

YOWL (senior cats especially):
- Nighttime yowling: possible hyperthyroidism, hypertension, cognitive dysfunction — veterinary evaluation`;

  const soundGuide = pet.species === 'dog' ? dogSoundGuide : catSoundGuide;

  return `You are a veterinary ethologist and animal communication specialist for AuExpert.
The tutor recorded a vocalization from their pet and wants to understand it better.
${durationCtx ? `\n${durationCtx}` : ''}
Pet: ${pet.name}, ${pet.breed ?? 'mixed/unknown'}, ${speciesWord}
Recent behavioral context: ${pet.recent_memories || 'none yet'}

${soundGuide}

## ASSESSMENT TASK:
The tutor may have described what they heard in their message, or may have just attached the audio without description.
Based on whatever context is available (description, duration, pet history, species/breed behavior):
1. Classify the most likely sound type based on the context
2. Assess the most probable emotional/health state
3. Determine urgency — some vocalizations require immediate veterinary attention
4. Provide actionable guidance for the tutor

## URGENCY TRIGGERS (set urgency to "high"):
- Sudden yelp or cry in dogs
- Continuous yowling in cats (especially seniors)
- Whimpering that doesn't stop
- Growling accompanied by aggression
- Any vocalization combined with refusal to eat/move

## NARRATION RULES:
- THIRD PERSON only. Max 150 words. Respond in ${lang}.
- Write as if commenting on what ${pet.name} communicated through the sound
- Use the pet's breed/species typical behavior to inform the analysis
- NEVER say the audio couldn't be analyzed — always provide a plausible interpretation
- Be empathetic but scientifically grounded

Return ONLY valid JSON:
{
  "classifications": [{"type": "mood", "confidence": 0.85, "extracted_data": {
    "sound_type": "bark|whine|growl|howl|meow|purr|hiss|yowl|chirp|other",
    "sound_subtype": "alert|play|anxiety|fear|pain|demand|greeting|other",
    "emotional_state": "content|playful|anxious|fearful|in-pain|stressed|alert|excited",
    "intensity": "low|medium|high",
    "pattern_notes": "Clinical description of the vocal pattern and its significance",
    "requires_vet_attention": false
  }}],
  "primary_type": "mood",
  "narration": "${pet.name} vocalizou...",
  "mood": "calm",
  "mood_confidence": 0.85,
  "urgency": "none",
  "clinical_metrics": [],
  "suggestions": ["Specific actionable recommendation based on the sound assessment"],
  "tags_suggested": ["audio", "vocalizacao"],
  "pet_audio_analysis": {
    "sound_type": "bark",
    "emotional_state": "playful",
    "intensity": "medium",
    "pattern_notes": "Clinical interpretation of the sound pattern"
  }
}`;
}

function buildPDFMessages(pdfBase64: string, text?: string): ClaudeMessage[] {
  return [{
    role: 'user',
    content: [
      {
        type: 'document',
        source: { type: 'base64', media_type: 'application/pdf', data: pdfBase64 },
      },
      {
        type: 'text',
        text: text ?? 'Analyze this veterinary document and extract all health records for this pet.',
      },
    ],
  }];
}

// ── Message builder ──

interface ClaudeMessage {
  role: string;
  content: unknown;
}

function buildOCRMessages(photo_base64?: string): ClaudeMessage[] {
  if (!photo_base64) return [{ role: 'user', content: 'No image provided.' }];
  return [{
    role: 'user',
    content: [
      {
        type: 'image',
        source: { type: 'base64', media_type: detectMediaType(photo_base64), data: photo_base64 },
      },
      { type: 'text', text: 'Analyze this veterinary document. Extract ALL visible fields and populate ocr_data.fields with every key-value pair found — one entry per data row. Never return fields as an empty array.' },
    ],
  }];
}

function buildMessages(text?: string, photos_base64?: string[]): ClaudeMessage[] {
  const photos = (photos_base64 ?? []).slice(0, 5); // max 5 images
  if (photos.length > 0) {
    const imageContent = photos.map((p) => ({
      type: 'image',
      source: { type: 'base64', media_type: detectMediaType(p), data: p },
    }));
    return [{
      role: 'user',
      content: [
        ...imageContent,
        {
          type: 'text',
          text: text || (photos.length > 1 ? 'Analyze these images of my pet.' : 'Analyze this image of my pet.'),
        },
      ],
    }];
  }

  return [{ role: 'user', content: text || '(Tutor shared a pet diary entry — analyze it.)' }];
}

function detectMediaType(base64: string): string {
  if (base64.startsWith('/9j/')) return 'image/jpeg';
  if (base64.startsWith('iVBOR')) return 'image/png';
  if (base64.startsWith('UklGR')) return 'image/webp';
  return 'image/jpeg';
}

// ── Audio fetch helper ──

/** Detect actual audio format from magic bytes — ignores HTTP Content-Type header */
function detectAudioMimeFromBytes(bytes: Uint8Array): string {
  if (bytes.length < 4) return 'audio/mp4';
  // MP3: ID3 tag header
  if (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) return 'audio/mp3';
  // MP3: MPEG sync word (FF Ex or FF Fx)
  if (bytes[0] === 0xFF && (bytes[1] & 0xE0) === 0xE0) return 'audio/mp3';
  // WAV: RIFF....WAVE
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) return 'audio/wav';
  // OGG: OggS
  if (bytes[0] === 0x4F && bytes[1] === 0x67 && bytes[2] === 0x67 && bytes[3] === 0x53) return 'audio/ogg';
  // FLAC: fLaC
  if (bytes[0] === 0x66 && bytes[1] === 0x4C && bytes[2] === 0x61 && bytes[3] === 0x43) return 'audio/flac';
  // WebM: EBML header
  if (bytes[0] === 0x1A && bytes[1] === 0x45 && bytes[2] === 0xDF && bytes[3] === 0xA3) return 'audio/webm';
  // MP4/M4A: ftyp box at offset 4
  if (bytes.length >= 8 && bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70) return 'audio/mp4';
  return 'audio/mp4';
}

async function fetchAudioAsBase64(url: string): Promise<{ base64: string; mediaType: string } | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12_000);
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!response.ok) {
      console.warn('[classifier] Audio fetch failed:', response.status);
      return null;
    }
    const contentLength = Number(response.headers.get('content-length') ?? 0);
    if (contentLength > 5 * 1024 * 1024) {
      console.warn('[classifier] Audio too large, skipping download:', contentLength);
      return null;
    }
    const buffer = await response.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    // Detect actual format from magic bytes — do NOT trust HTTP Content-Type
    // (Supabase Storage serves MP3 files as video/mp4 when path ends in .mp4)
    const mediaType = detectAudioMimeFromBytes(bytes);
    const chunkSize = 8192;
    let binary = '';
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(i, Math.min(i + chunkSize, bytes.length)));
    }
    console.log('[classifier] Audio fetched | detectedMimeType:', mediaType, '| bytes:', bytes.length);
    return { base64: btoa(binary), mediaType };
  } catch (err) {
    console.warn('[classifier] Audio fetch error:', String(err));
    return null;
  }
}

// ── Claude API call ──

async function callClaude(
  systemPrompt: string,
  messages: ClaudeMessage[],
  maxTokens: number = MAX_TOKENS,
  extraHeaders: Record<string, string> = {},
  modelOverride?: string,
): Promise<{ text: string; tokensUsed: number }> {
  const cfg = await getAIConfig();
  const model = modelOverride ?? cfg.model_classify;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), cfg.timeout_ms);
  let response: Response;
  try {
    response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': cfg.anthropic_version,
        ...extraHeaders,
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        system: systemPrompt,
        messages,
      }),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('[classifier] Claude API error:', response.status, errorBody);
    throw new Error(`Claude API error: ${response.status}`);
  }

  const aiResponse = await response.json();
  const textContent = aiResponse.content?.find((c: { type: string }) => c.type === 'text');

  if (!textContent?.text) {
    throw new Error('Empty AI response');
  }

  return {
    text: textContent.text,
    tokensUsed: aiResponse.usage?.output_tokens ?? 0,
  };
}

// ── Gemini API ──

interface GeminiPart {
  text?: string;
  inlineData?: { mimeType: string; data: string };
}

/**
 * Fetch a media file from URL and return it as base64 + detected MIME type.
 * Storage bucket serves all audio as video/mp4 — magic bytes detection corrects this.
 */
async function fetchMediaBase64(url: string): Promise<{ data: string; mimeType: string }> {
  const t0 = Date.now();
  console.log('[gemini:fetch] → GET', url.slice(0, 100));
  const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  console.log('[gemini:fetch] HTTP', res.status, '| content-type:', res.headers.get('content-type'), '| content-length:', res.headers.get('content-length'), '|', Date.now() - t0, 'ms');
  if (!res.ok) throw new Error(`Media fetch failed: HTTP ${res.status} — ${url.slice(0, 80)}`);

  const buffer = await res.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const rawBytes = buffer.byteLength;
  console.log('[gemini:fetch] Downloaded', rawBytes, 'bytes (', Math.round(rawBytes / 1024), 'KB ) in', Date.now() - t0, 'ms');

  const headerMime = (res.headers.get('content-type') ?? '').split(';')[0].trim();
  let mimeType = headerMime;
  let mimeSource = 'header';

  if (!mimeType || mimeType === 'application/octet-stream' || mimeType === 'video/mp4') {
    // Detect from magic bytes — bucket always serves audio as video/mp4
    const b0 = bytes[0], b1 = bytes[1], b2 = bytes[2], b3 = bytes[3];
    const b4 = bytes[4], b5 = bytes[5], b6 = bytes[6], b7 = bytes[7];
    console.log('[gemini:fetch] Magic bytes:', [b0, b1, b2, b3, b4, b5, b6, b7].map(b => b?.toString(16).padStart(2,'0')).join(' '));

    if (b0 === 0x49 && b1 === 0x44 && b2 === 0x33) {
      mimeType = 'audio/mpeg'; mimeSource = 'magic:ID3';
    } else if (b0 === 0xFF && (b1 & 0xE0) === 0xE0) {
      mimeType = 'audio/mpeg'; mimeSource = 'magic:MP3-sync';
    } else if (b0 === 0x52 && b1 === 0x49 && b2 === 0x46 && b3 === 0x46) {
      mimeType = 'audio/wav'; mimeSource = 'magic:RIFF';
    } else if (b0 === 0x4F && b1 === 0x67 && b2 === 0x67 && b3 === 0x53) {
      mimeType = 'audio/ogg'; mimeSource = 'magic:OGG';
    } else if (b4 === 0x66 && b5 === 0x74 && b6 === 0x79 && b7 === 0x70) {
      const brand = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]);
      console.log('[gemini:fetch] ftyp brand:', JSON.stringify(brand));
      mimeType = (brand === 'M4A ' || brand === 'M4B ' || brand === 'f4a ') ? 'audio/mp4' : 'video/mp4';
      mimeSource = `magic:ftyp(${brand.trim()})`;
    } else {
      mimeType = 'video/mp4'; mimeSource = 'fallback';
    }
  }

  console.log('[gemini:fetch] MIME resolved:', mimeType, '| source:', mimeSource, '| header was:', headerMime || '(empty)');

  // Encode in 32KB chunks to avoid stack overflow on large files
  const t1 = Date.now();
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  const b64 = btoa(binary);
  console.log('[gemini:fetch] base64 encoded:', b64.length, 'chars (', Math.round(b64.length * 0.75 / 1024), 'KB ) in', Date.now() - t1, 'ms');
  return { data: b64, mimeType };
}

/** Call Gemini generateContent with inline media parts. */
async function callGemini(
  systemPrompt: string,
  parts: GeminiPart[],
  model: string,
  maxTokens: number = MAX_TOKENS,
): Promise<{ text: string; tokensUsed: number }> {
  if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not configured');

  const mediaParts = parts.filter(p => p.inlineData);
  const textParts  = parts.filter(p => p.text);
  console.log('[gemini:api] → generateContent | model:', model, '| maxTokens:', maxTokens,
    '| mediaParts:', mediaParts.length, '| textParts:', textParts.length,
    '| inlineData KB:', mediaParts.reduce((s, p) => s + Math.round((p.inlineData?.data?.length ?? 0) * 0.75 / 1024), 0));

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
  const bodyObj = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: 'user', parts }],
    generationConfig: { maxOutputTokens: maxTokens, temperature: 0.3 },
  };
  const bodyStr = JSON.stringify(bodyObj);
  console.log('[gemini:api] Request body size:', Math.round(bodyStr.length / 1024), 'KB');

  const t0 = Date.now();
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: bodyStr,
    signal: AbortSignal.timeout(60_000),
  });
  console.log('[gemini:api] HTTP', res.status, '|', Date.now() - t0, 'ms');

  if (!res.ok) {
    const errText = await res.text();
    console.error('[gemini:api] ERROR body:', errText.slice(0, 500));
    throw new Error(`Gemini API error: ${res.status} — ${errText.slice(0, 200)}`);
  }

  const data = await res.json() as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
      finishReason?: string;
      safetyRatings?: unknown[];
    }>;
    usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number; totalTokenCount?: number };
    error?: { code?: number; message?: string; status?: string };
  };

  if (data.error) {
    console.error('[gemini:api] Response error:', JSON.stringify(data.error));
    throw new Error(`Gemini error: ${data.error.status} — ${data.error.message}`);
  }

  const candidate = data.candidates?.[0];
  console.log('[gemini:api] candidates:', data.candidates?.length ?? 0,
    '| finishReason:', candidate?.finishReason,
    '| usage: prompt=', data.usageMetadata?.promptTokenCount,
    'candidates=', data.usageMetadata?.candidatesTokenCount,
    'total=', data.usageMetadata?.totalTokenCount);

  const text = candidate?.content?.parts?.[0]?.text ?? '';
  if (!text) {
    console.error('[gemini:api] Empty text — full response:', JSON.stringify(data).slice(0, 600));
    throw new Error(`Gemini: empty response (finishReason=${candidate?.finishReason ?? 'unknown'})`);
  }

  console.log('[gemini:api] Response text length:', text.length, '| first 300:', text.slice(0, 300));
  return { text, tokensUsed: data.usageMetadata?.totalTokenCount ?? 0 };
}

/** Fetch media URL → base64 → Gemini analysis. */
async function callGeminiMedia(
  systemPrompt: string,
  mediaUrl: string,
  mediaKind: 'audio' | 'video',
  tutorText: string | undefined,
  model: string,
  maxTokens: number,
): Promise<{ rawText: string; tokensUsed: number }> {
  const t0 = Date.now();
  console.log(`[gemini:${mediaKind}] ▶ START | model:`, model, '| hasTutorText:', !!(tutorText?.trim()), '| url:', mediaUrl.slice(0, 100));

  const { data, mimeType } = await fetchMediaBase64(mediaUrl);

  const parts: GeminiPart[] = [{ inlineData: { mimeType, data } }];
  if (tutorText?.trim()) {
    parts.push({ text: `Tutor's description: "${tutorText.trim()}"` });
    console.log(`[gemini:${mediaKind}] Tutor description included (${tutorText.trim().length} chars)`);
  }
  parts.push({ text: 'Return ONLY the JSON object as specified in the system prompt.' });

  console.log(`[gemini:${mediaKind}] Calling Gemini API...`);
  const { text, tokensUsed } = await callGemini(systemPrompt, parts, model, maxTokens);

  console.log(`[gemini:${mediaKind}] ✅ DONE | tokens:`, tokensUsed, '| total time:', Date.now() - t0, 'ms');
  return { rawText: text, tokensUsed };
}

// ── JSON parser with fallback ──

function parseClassification(rawText: string, fallbackText?: string): Record<string, unknown> {
  let jsonText = rawText.trim();

  // Strip markdown code fences if present
  if (jsonText.startsWith('```')) {
    jsonText = jsonText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }

  try {
    const parsed = JSON.parse(jsonText);
    console.log('[classifier] JSON parse OK | keys:', Object.keys(parsed).join(', '));
    if (parsed.ocr_data) {
      console.log('[classifier] OCR parsed | document_type:', parsed.document_type, '| fields:', parsed.ocr_data?.fields?.length ?? 0);
      if (parsed.ocr_data?.fields?.length) {
        console.log('[classifier] OCR first 3 fields:', JSON.stringify(parsed.ocr_data.fields.slice(0, 3)));
      }
    }
    return parsed;
  } catch {
    console.error('[classifier] JSON parse FAILED | chars:', jsonText.length, '| first 400:', jsonText.slice(0, 400));
    console.error('[classifier] JSON last 200:', jsonText.slice(-200));
    return {
      classifications: [{ type: 'moment', confidence: 1.0, extracted_data: {} }],
      primary_type: 'moment',
      narration: fallbackText || 'Entry recorded.',
      mood: 'calm',
      mood_confidence: 0.5,
      urgency: 'none',
      clinical_metrics: [],
      suggestions: [],
      tags_suggested: [],
    };
  }
}

// ── Expense category inference fallback ──

/**
 * If the AI returned expense.category = 'outros' (or blank/other) but
 * other classifications in the same entry provide clear context, override it.
 * This is a safety net — the system prompt already instructs the AI to do this,
 * but the fallback guarantees correctness even if the AI misses it.
 */
function inferExpenseCategory(classifications: Classification[]): Classification[] {
  const types = classifications.map((c) => c.type);

  return classifications.map((cls) => {
    if (cls.type !== 'expense') return cls;

    const cat = cls.extracted_data?.category as string | undefined;
    if (cat && cat !== 'outros' && cat !== 'other' && cat !== '') {
      return cls; // already has a valid category — keep it
    }

    let inferred = 'outros';

    if (types.some((t) =>
      ['consultation', 'exam', 'surgery', 'vaccine', 'medication',
        'clinical_metric', 'symptom', 'emergency'].includes(t)
    )) {
      inferred = 'saude';
    } else if (types.includes('grooming')) {
      inferred = 'higiene';
    } else if (types.includes('food')) {
      inferred = 'alimentacao';
    } else if (types.includes('boarding')) {
      inferred = 'hospedagem';
    } else if (types.some((t) => ['dog_walker', 'pet_sitter'].includes(t))) {
      inferred = 'cuidados';
    } else if (types.includes('training')) {
      inferred = 'treinamento';
    } else if (types.some((t) => ['plan', 'insurance', 'funeral_plan'].includes(t))) {
      inferred = 'plano';
    }

    if (inferred !== 'outros') {
      console.log(`[classifier] inferExpenseCategory: overriding '${cat ?? ''}' → '${inferred}' (context types: ${types.filter(t => t !== 'expense').join(', ')})`);
    }

    return {
      ...cls,
      extracted_data: { ...cls.extracted_data, category: inferred },
    };
  });
}

// ── Public API ──

/** Resolve language code to full language name. */
export function resolveLanguage(langCode: string): string {
  return LANG_NAMES[langCode] ?? LANG_NAMES[langCode?.split('-')[0]] ?? 'English';
}

/**
 * Classify a diary entry: build prompt, call Claude, parse response.
 * Returns a normalized ClassifyResult.
 */
export async function classifyEntry(input: ClassifyInput): Promise<ClassifyResult> {
  const lang = resolveLanguage(input.language);
  const systemPrompt = input.input_type === 'pet_audio'
    ? buildPetAudioPrompt(input.petContext, lang, input.audio_duration_seconds)
    : buildSystemPrompt(input.petContext, lang, input.input_type, input.text);

  let messages: ClaudeMessage[];
  let maxTokens = MAX_TOKENS;

  const aiConfig = await getAIConfig();
  let rawText: string;
  let tokensUsed: number;

  if (input.input_type === 'pdf_upload' && input.pdf_base64) {
    // ── Claude: PDF ──
    messages = buildPDFMessages(input.pdf_base64, input.text);
    maxTokens = 3000;
    console.log('[classifier] Calling Claude (PDF) | lang:', lang);
    ;({ text: rawText, tokensUsed } = await callClaude(systemPrompt, messages, maxTokens));

  } else if (input.input_type === 'ocr_scan') {
    // ── Claude: OCR ──
    maxTokens = 4000;
    const ocrPhoto = (input.photos_base64?.length ? input.photos_base64 : input.photo_base64 ? [input.photo_base64] : undefined)?.[0];
    console.log('[classifier] OCR branch | photo present:', !!ocrPhoto, '| photo KB:', ocrPhoto ? Math.round(ocrPhoto.length * 0.75 / 1024) : 0);
    messages = buildOCRMessages(ocrPhoto);
    console.log('[classifier] Calling Claude (OCR) | lang:', lang);
    ;({ text: rawText, tokensUsed } = await callClaude(systemPrompt, messages, maxTokens));

  } else if (input.input_type === 'pet_audio') {
    // ── pet_audio: Gemini (if key+url available) or text-Claude fallback ──
    console.log('[classifier] pet_audio | audio_url:', !!input.audio_url, '| GEMINI_API_KEY:', !!GEMINI_API_KEY, '| model_audio:', aiConfig.model_audio);
    if (input.audio_url && GEMINI_API_KEY) {
      try {
        ;({ rawText, tokensUsed } = await callGeminiMedia(
          systemPrompt, input.audio_url, 'audio', input.text, aiConfig.model_audio, maxTokens,
        ));
      } catch (err) {
        console.warn('[classifier] pet_audio — ❌ Gemini FAILED → text-Claude fallback | error:', String(err));
        const durationSec = input.audio_duration_seconds;
        const durationNote = durationSec != null && durationSec > 0 ? `[Audio recording: ${durationSec}s]` : '[Audio recording]';
        const audioCtx = input.text?.trim() ? `${durationNote}\nTutor's description: "${input.text.trim()}"` : durationNote;
        messages = buildMessages(audioCtx, undefined);
        ;({ text: rawText, tokensUsed } = await callClaude(systemPrompt, messages, maxTokens));
      }
    } else {
      const reason = !input.audio_url ? 'no audio_url' : 'no GEMINI_API_KEY';
      const durationSec = input.audio_duration_seconds;
      const durationNote = durationSec != null && durationSec > 0 ? `[Audio recording: ${durationSec}s]` : '[Audio recording]';
      const audioCtx = input.text?.trim() ? `${durationNote}\nTutor's description: "${input.text.trim()}"` : durationNote;
      messages = buildMessages(audioCtx, undefined);
      console.log('[classifier] pet_audio — text-Claude (reason:', reason, ') | duration:', durationSec, '| hasTutorDesc:', !!(input.text?.trim()));
      ;({ text: rawText, tokensUsed } = await callClaude(systemPrompt, messages, maxTokens));
    }

  } else if (input.input_type === 'video') {
    // ── video: Gemini (if key+url available) or Claude thumbnail fallback ──
    console.log('[classifier] video | video_url:', !!input.video_url, '| GEMINI_API_KEY:', !!GEMINI_API_KEY, '| model_video:', aiConfig.model_video);
    if (input.video_url && GEMINI_API_KEY) {
      try {
        ;({ rawText, tokensUsed } = await callGeminiMedia(
          systemPrompt, input.video_url, 'video', input.text, aiConfig.model_video, maxTokens,
        ));
      } catch (err) {
        console.warn('[classifier] video — ❌ Gemini FAILED → Claude thumbnail fallback | error:', String(err));
        const allPhotos = input.photos_base64?.length ? input.photos_base64 : input.photo_base64 ? [input.photo_base64] : undefined;
        messages = buildMessages(input.text, allPhotos?.slice(0, 1));
        ;({ text: rawText, tokensUsed } = await callClaude(systemPrompt, messages, maxTokens));
      }
    } else {
      const reason = !input.video_url ? 'no video_url' : 'no GEMINI_API_KEY';
      const allPhotos = input.photos_base64?.length ? input.photos_base64 : input.photo_base64 ? [input.photo_base64] : undefined;
      messages = buildMessages(input.text, allPhotos?.slice(0, 1));
      console.log('[classifier] video — Claude thumbnail (reason:', reason, ') | hasThumb:', !!(allPhotos?.length));
      ;({ text: rawText, tokensUsed } = await callClaude(systemPrompt, messages, maxTokens));
    }

  } else {
    // ── Claude: text / photos (default path) ──
    const allPhotos = input.photos_base64?.length
      ? input.photos_base64
      : input.photo_base64 ? [input.photo_base64] : undefined;
    const photos = allPhotos?.slice(0, 2);
    messages = buildMessages(input.text, photos);
    console.log('[classifier] Calling Claude | lang:', lang, '| maxTokens:', maxTokens, '| input_type:', input.input_type, '| photos:', photos?.length ?? 0);
    ;({ text: rawText, tokensUsed } = await callClaude(systemPrompt, messages, maxTokens));
  }

  // ── RAW RESPONSE TRACE ──
  console.log('[classifier] RAW response | tokens:', tokensUsed, '| chars:', rawText.length, '| input_type:', input.input_type);
  console.log('[classifier] RAW first 600:', rawText.slice(0, 600));
  if (rawText.length > 600) console.log('[classifier] RAW last 300:', rawText.slice(-300));

  const result = parseClassification(rawText, input.text);

  console.log('[classifier] OK —',
    'primary:', result.primary_type,
    'classifications:', (result.classifications as unknown[])?.length,
    'mood:', result.mood,
    'urgency:', result.urgency,
    'tokens:', tokensUsed,
  );

  // Apply expense category fallback (guarantees 'outros' is only used when truly no context)
  const rawClassifications = (result.classifications as Classification[]) ?? [{ type: 'moment', confidence: 1.0, extracted_data: {} }];
  const classifications = inferExpenseCategory(rawClassifications);

  // Normalize with safe defaults
  return {
    classifications,
    primary_type: (result.primary_type as ClassificationType) ?? 'moment',
    narration: (result.narration as string) ?? '',
    mood: (result.mood as MoodId) ?? 'calm',
    mood_confidence: (result.mood_confidence as number) ?? 0.5,
    urgency: (result.urgency as ClassifyResult['urgency']) ?? 'none',
    clinical_metrics: (result.clinical_metrics as ClinicalMetric[]) ?? [],
    suggestions: (result.suggestions as string[]) ?? [],
    tags_suggested: (result.tags_suggested as string[]) ?? [],
    language: input.language,
    tokens_used: tokensUsed,
    // OCR fields (only populated when input_type === 'ocr_scan')
    ...(input.input_type === 'ocr_scan' && (() => {
      const doc_type = (result.document_type as string) ?? 'other';
      const ocr_data = (result.ocr_data as OCRData) ?? { fields: [] };
      console.log('[classifier] RETURN OCR | document_type:', doc_type, '| fields:', ocr_data.fields?.length ?? 0, '| items:', ocr_data.items?.length ?? 0);
      if (ocr_data.fields?.length) {
        console.log('[classifier] RETURN OCR first 3 fields:', JSON.stringify(ocr_data.fields.slice(0, 3)));
      } else {
        console.warn('[classifier] RETURN OCR fields EMPTY — result.ocr_data was:', JSON.stringify(result.ocr_data)?.slice(0, 200));
      }
      return { document_type: doc_type, ocr_data };
    })()),
    // PDF fields (only populated when input_type === 'pdf_upload')
    ...(input.input_type === 'pdf_upload' && {
      document_summary: (result.document_summary as string) ?? null,
      date_range: (result.date_range as { from: string; to: string }) ?? null,
      import_count: (result.import_count as ClassifyResult['import_count']) ?? {
        vaccines: 0, consultations: 0, exams: 0, medications: 0, surgeries: 0, other: 0,
      },
    }),
    // Video fields (only populated when input_type === 'video')
    ...(input.input_type === 'video' && {
      video_analysis: (result.video_analysis as VideoAnalysis) ?? {
        locomotion_score: 70,
        energy_score: 70,
        calm_score: 70,
        behavior_summary: '',
        health_observations: [],
      },
    }),
    // Pet audio fields (only populated when input_type === 'pet_audio')
    ...(input.input_type === 'pet_audio' && {
      pet_audio_analysis: (result.pet_audio_analysis as PetAudioAnalysis) ?? {
        sound_type: 'other',
        emotional_state: 'unknown',
        intensity: 'medium',
        pattern_notes: '',
      },
    }),
  };
}
