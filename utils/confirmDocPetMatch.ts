/**
 * utils/confirmDocPetMatch.ts
 *
 * Helper unificado para checar se o nome do pet detectado num documento
 * (via OCR) bate com o pet ativo. Se nao bater, dispara confirm() Elite
 * pra deixar o tutor decidir se prossegue.
 *
 * Retorna `true` quando o tutor pode prosseguir (match, unknown, ou
 * confirmou continuar). Retorna `false` apenas quando ha mismatch e
 * o tutor escolheu cancelar.
 *
 * Uso tipico em modais OCR:
 *
 *   const should = await confirmDocPetMatch({
 *     detected: result.detected_pet_name,
 *     activePet: { id: petId, name: petName },
 *     otherPets: pets.filter(p => p.id !== petId),
 *     confirm, t,
 *   });
 *   if (!should) return;            // tutor cancelou
 *   applyOcrResult(result);         // segue normal
 */
import { matchDetectedPetToActive, type OtherPet } from './petNameMatch';

type ConfirmFn = (opts: {
  text: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  yesLabel?: string;
  noLabel?: string;
}) => Promise<boolean>;

type TFn = (key: string, opts?: Record<string, unknown>) => string;

export async function confirmDocPetMatch(args: {
  detected: string | null | undefined;
  activePet: { id: string; name: string };
  otherPets?: OtherPet[];
  confirm: ConfirmFn;
  t: TFn;
}): Promise<boolean> {
  const { detected, activePet, otherPets = [], confirm, t } = args;

  const m = matchDetectedPetToActive(detected, activePet, otherPets);

  // Sem nome detectado ou bate com o pet ativo: prossegue silencioso.
  if (m.kind !== 'mismatch') return true;

  // Mismatch — pergunta ao tutor.
  const message = m.suggestedPetName
    ? t('docMismatch.messageWithSuggestion', {
        detectedName: detected ?? '?',
        activeName: activePet.name,
      })
    : t('docMismatch.messageGeneric', {
        detectedName: detected ?? '?',
        activeName: activePet.name,
      });

  return await confirm({
    text: message,
    type: 'warning',
    yesLabel: t('docMismatch.continue'),
    noLabel: t('docMismatch.cancel'),
  });
}
