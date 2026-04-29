/**
 * utils/petNameMatch.ts
 *
 * Compara o nome do pet detectado em um documento (via OCR) com o nome
 * do pet ativo no app. Usado para alertar o tutor quando o documento
 * parece pertencer a outro pet — sem bloquear, apenas avisar.
 *
 * Regras de normalizacao:
 *  - lowercase
 *  - remove acentos (NFD + filter combining marks)
 *  - remove pontuacao e simbolos (deixa apenas letras + numeros + espaco)
 *  - colapsa espacos em 1
 *  - trim
 *
 * Estrategia de match (em ordem):
 *  1. Igualdade exata pos-normalizacao -> match
 *  2. Substring em qualquer direcao (cobre apelidos, ex: "Mana" em "Mana Joana") -> match
 *  3. Distancia de Levenshtein normalizada <= 0.25 (cobre typos OCR) -> match
 *  4. Caso contrario -> mismatch
 *
 * Tutor com varios pets:
 *  - Se a lista de pets do tutor for fornecida, retorna o pet alternativo
 *    quando bate com outro do tutor (suggestedPetName).
 */

export type MatchResult =
  | { kind: 'match' }
  | { kind: 'unknown' } // detected vazio, nada a checar
  | { kind: 'mismatch'; suggestedPetName?: string };

export interface OtherPet {
  id: string;
  name: string;
}

/** Normaliza string: lowercase, sem acento, sem pontuacao, espacos colapsados. */
export function normalizePetName(s: string | null | undefined): string {
  if (!s) return '';
  return s
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Levenshtein simples — O(m*n) tempo, O(min(m,n)) espaco. */
function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  // Garante que b é o menor para usar memória mínima
  if (a.length < b.length) {
    const tmp = a; a = b; b = tmp;
  }

  let prev = new Array(b.length + 1);
  let curr = new Array(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        curr[j - 1] + 1,    // insercao
        prev[j] + 1,        // remocao
        prev[j - 1] + cost, // substituicao
      );
    }
    [prev, curr] = [curr, prev];
  }
  return prev[b.length];
}

/** Distancia Levenshtein normalizada (0..1). */
function normalizedLevenshtein(a: string, b: string): number {
  if (a.length === 0 && b.length === 0) return 0;
  return levenshtein(a, b) / Math.max(a.length, b.length);
}

/**
 * Heuristica principal: 2 strings sao "provavelmente o mesmo pet"?
 *  - normaliza
 *  - igual exato -> true
 *  - uma contem a outra (>=3 chars) -> true (apelidos, primeiros nomes)
 *  - distancia normalizada <= 0.25 -> true (tolera erros OCR)
 */
export function isLikelySamePet(a: string | null | undefined, b: string | null | undefined): boolean {
  const na = normalizePetName(a);
  const nb = normalizePetName(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  // Substring em qualquer direcao (so se ambos tem 3+ chars pra evitar falso positivo)
  if (na.length >= 3 && nb.length >= 3) {
    if (na.includes(nb) || nb.includes(na)) return true;
  }
  // Tolerancia a erros de OCR
  const dist = normalizedLevenshtein(na, nb);
  return dist <= 0.25;
}

/**
 * Funcao principal — compara nome detectado no doc com pet ativo,
 * opcionalmente checando se bate com outros pets do tutor.
 *
 * @param detected Nome detectado no documento (pode ser null/vazio)
 * @param activePet Pet selecionado no app
 * @param otherPets Outros pets do mesmo tutor (opcional, para sugestao)
 */
export function matchDetectedPetToActive(
  detected: string | null | undefined,
  activePet: { id: string; name: string },
  otherPets: OtherPet[] = [],
): MatchResult {
  const detectedNorm = normalizePetName(detected);
  if (!detectedNorm) return { kind: 'unknown' };

  if (isLikelySamePet(detected, activePet.name)) {
    return { kind: 'match' };
  }

  // Mismatch — verifica se bate com outro pet do tutor pra sugerir
  for (const other of otherPets) {
    if (other.id === activePet.id) continue;
    if (isLikelySamePet(detected, other.name)) {
      return { kind: 'mismatch', suggestedPetName: other.name };
    }
  }

  return { kind: 'mismatch' };
}
