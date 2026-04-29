import type { TravelRule } from '../types';
import { EU_COMMON_REQUIREMENTS } from '../shared/euCommon';

// Suíça: não-UE mas EFTA, regras quase idênticas à UE pra pets.
// Confirmar com OSAV (Oficina Suíça de Segurança Alimentar e Veterinária).
export const CH: TravelRule = {
  countryCode: 'CH',
  countryNameKey: 'travel.country.CH',
  flag: '🇨🇭',
  region: 'OTHER',
  source: 'static_catalog',
  lastReviewed: '2026-04',
  requirements: EU_COMMON_REQUIREMENTS,
};
