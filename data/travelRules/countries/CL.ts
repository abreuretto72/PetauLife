import type { TravelRule } from '../types';
import { MERCOSUL_COMMON_REQUIREMENTS, CL_PARASITIC_TREATMENT } from '../shared/mercosulCommon';

// Chile: Mercosul base + tratamento antiparasitário interno+externo nos 7 dias antes.
export const CL: TravelRule = {
  countryCode: 'CL',
  countryNameKey: 'travel.country.CL',
  flag: '🇨🇱',
  region: 'SA',
  source: 'static_catalog',
  lastReviewed: '2026-04',
  requirements: [...MERCOSUL_COMMON_REQUIREMENTS, CL_PARASITIC_TREATMENT],
};
