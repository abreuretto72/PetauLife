import type { TravelRule } from '../types';
import { MERCOSUL_COMMON_REQUIREMENTS } from '../shared/mercosulCommon';

// Colombia: regras parecidas a Mercosul (não-membro mas comparáveis).
export const CO: TravelRule = {
  countryCode: 'CO',
  countryNameKey: 'travel.country.CO',
  flag: '🇨🇴',
  region: 'SA',
  source: 'static_catalog',
  lastReviewed: '2026-04',
  requirements: MERCOSUL_COMMON_REQUIREMENTS,
};
