// Chamada Gemini 3.1 Flash Lite Preview com o mesmo prompt de produção do analyze-pet-photo
// Rodar: node gemini.mjs
// Pré-req: .env.local na raiz do projeto (E:\aa_projetos_claude\auExpert\.env.local) com GEMINI_API_KEY

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const ENV_FILE = path.join(ROOT, '.env.local');
const IMG_PATH = path.join(__dirname, 'frame.jpg');
const SYS_PATH = path.join(__dirname, 'system-prompt.txt');
const OUT_DIR = path.join(__dirname, 'results');
const OUT_FILE = path.join(OUT_DIR, 'gemini.json');

// Parse .env.local sem libs
const envText = fs.readFileSync(ENV_FILE, 'utf8');
const env = {};
for (const line of envText.split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const KEY = env.GEMINI_API_KEY;
if (!KEY) {
  console.error('ERRO: GEMINI_API_KEY não encontrada em', ENV_FILE);
  process.exit(1);
}

const systemPrompt = fs.readFileSync(SYS_PATH, 'utf8');
const userPrompt = 'Analyze this photo of a dog named Mana (Chihuahua). Respond in pt-BR.';
const b64 = fs.readFileSync(IMG_PATH).toString('base64');

const body = {
  systemInstruction: { parts: [{ text: systemPrompt }] },
  contents: [{
    role: 'user',
    parts: [
      { inline_data: { mime_type: 'image/jpeg', data: b64 } },
      { text: userPrompt },
    ],
  }],
  generationConfig: {
    temperature: 0.4,
    maxOutputTokens: 1500,
    responseMimeType: 'application/json',
  },
};

const MODEL = 'gemini-3.1-flash-lite-preview';
const URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${KEY}`;

console.log('>> Modelo:', MODEL);
console.log('>> Imagem:', IMG_PATH, `(${fs.statSync(IMG_PATH).size} bytes)`);
console.log('>> Chamando Gemini...');

const t0 = Date.now();
const res = await fetch(URL, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body),
});
const t1 = Date.now();
const text = await res.text();
const latencyMs = t1 - t0;

console.log(`>> Status: ${res.status}`);
console.log(`>> Latência: ${latencyMs}ms`);

fs.mkdirSync(OUT_DIR, { recursive: true });
let parsed;
try {
  parsed = JSON.parse(text);
} catch {
  fs.writeFileSync(OUT_FILE, text);
  console.error('Resposta não-JSON, salva em', OUT_FILE);
  process.exit(2);
}

// Enriquece com metadados
parsed._meta = { model: MODEL, latencyMs, httpStatus: res.status };
fs.writeFileSync(OUT_FILE, JSON.stringify(parsed, null, 2));

console.log('>> Salvo em:', OUT_FILE);

if (parsed.error) {
  console.error('\nERRO da API:');
  console.error(JSON.stringify(parsed.error, null, 2));
  process.exit(3);
}

// Extrai JSON da resposta
const candidateText = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
if (candidateText) {
  try {
    const clean = candidateText.replace(/^```json\s*/i, '').replace(/\s*```\s*$/i, '');
    const analysis = JSON.parse(clean);
    const parsedFile = path.join(OUT_DIR, 'gemini_parsed.json');
    fs.writeFileSync(parsedFile, JSON.stringify(analysis, null, 2));
    console.log('>> JSON parseado em:', parsedFile);
  } catch (e) {
    console.warn('>> Não consegui parsear JSON interno:', e.message);
  }
}

console.log('\n>> Usage:');
console.log(JSON.stringify(parsed.usageMetadata ?? {}, null, 2));
