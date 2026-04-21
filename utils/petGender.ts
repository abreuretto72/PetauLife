/**
 * petGender.ts
 *
 * Helpers for grammatically correct gendered phrases in Portuguese.
 * English has no such issue — use only in PT-BR context.
 *
 * Usage with react-i18next context:
 *   import { sexContext } from '../utils/petGender';
 *   t('diary.diaryOf', { name: pet.name, context: sexContext(pet.sex) })
 *
 * Translation keys must have a `_female` variant in pt-BR.json:
 *   "diary.diaryOf": "Diário do {{name}}"
 *   "diary.diaryOf_female": "Diário da {{name}}"
 *
 * When context is 'female', react-i18next automatically uses `key_female`.
 * When context is 'male' or undefined, it falls back to the base key (masculine).
 */

export type PetSex = 'male' | 'female' | null | undefined;

/**
 * Returns the i18next context string for the pet's sex.
 * Pass the result as `context` to any `t()` call that has a `_female` variant.
 */
export function sexContext(sex: PetSex): 'female' | undefined {
  return sex === 'female' ? 'female' : undefined;
}
