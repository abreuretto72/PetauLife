/**
 * validatePetName — defensive validation for the pet name field.
 *
 * The only previous gate was `.trim() !== ''`, which accepted inputs like
 * "&&&&&&" or "123" or "!!!" as valid names. Confirmed bug with tutor-reported
 * case on 2026-04-23 ("a IA está aceitando qualquer coisa como nome").
 *
 * Rules (all must pass):
 *   1. Non-empty after trimming.
 *   2. Length between 2 and 40 characters (after whitespace collapse).
 *   3. Must contain at least one Unicode letter (`\p{L}`) — covers Latin,
 *      Cyrillic, CJK, Arabic, etc. Rejects purely-numeric/symbol inputs.
 *   4. Allowed characters only: Unicode letters + digits + space + hyphen +
 *      apostrophe + period. Rejects emoji, `&`, `@`, `#`, `$`, underscores,
 *      brackets, quotes, asterisks, etc.
 *
 * Examples:
 *   "Leo"          → ok
 *   "Maria-José"   → ok
 *   "D'Artagnan"   → ok
 *   "Dr. Rex"      → ok
 *   "Bê"           → ok (2 chars, accent)
 *   "R2-D2"        → ok (has letters, digits allowed)
 *   "123"          → invalid_no_letters
 *   "&&&&&"        → invalid_no_letters
 *   "🐶"            → invalid_chars (emoji not in allowed set)
 *   "A"            → invalid_too_short
 *   "x".repeat(41) → invalid_too_long
 *   "   "          → invalid_empty
 *
 * The function normalizes the input as a side benefit:
 *   - Trims leading/trailing whitespace
 *   - Collapses multiple consecutive spaces into one
 *
 * Callers should use the `normalized` field when persisting, not the raw input.
 */

export type PetNameValidationError =
  | 'empty'
  | 'too_short'
  | 'too_long'
  | 'no_letters'
  | 'invalid_chars';

export type PetNameValidationResult =
  | { ok: true; normalized: string }
  | { ok: false; error: PetNameValidationError };

const MIN_LEN = 2;
const MAX_LEN = 40;

// Allowed characters: Unicode letters, digits, whitespace, hyphen, apostrophe, period.
// We also accept the curly apostrophe "\u2019" (right single quotation mark) because
// iOS/macOS auto-correct converts straight ' to curly '.
const ALLOWED_CHARS_RE = /^[\p{L}\p{N}\s\-'\u2019.]+$/u;
const HAS_LETTER_RE = /\p{L}/u;

export function validatePetName(raw: string): PetNameValidationResult {
  if (typeof raw !== 'string') return { ok: false, error: 'empty' };

  const trimmed = raw.trim();
  if (trimmed.length === 0) return { ok: false, error: 'empty' };

  // Collapse consecutive whitespace (e.g., "Leo  Silva" → "Leo Silva")
  const normalized = trimmed.replace(/\s+/g, ' ');

  if (normalized.length < MIN_LEN) return { ok: false, error: 'too_short' };
  if (normalized.length > MAX_LEN) return { ok: false, error: 'too_long' };

  if (!HAS_LETTER_RE.test(normalized)) return { ok: false, error: 'no_letters' };
  if (!ALLOWED_CHARS_RE.test(normalized)) return { ok: false, error: 'invalid_chars' };

  return { ok: true, normalized };
}

/**
 * Maps a validation error to the matching i18n key under the `addPet.*` namespace.
 * Centralizing this here keeps callers terse and ensures consistency across the
 * AddPetModal and the edit screen.
 */
export function petNameErrorI18nKey(error: PetNameValidationError): string {
  switch (error) {
    case 'empty':        return 'addPet.nameRequired';
    case 'too_short':    return 'addPet.nameTooShort';
    case 'too_long':     return 'addPet.nameTooLong';
    case 'no_letters':   return 'addPet.nameInvalid';
    case 'invalid_chars': return 'addPet.nameInvalid';
  }
}
