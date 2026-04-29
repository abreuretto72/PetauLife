import type { TravelRule } from '../types';
import { MERCOSUL_COMMON_REQUIREMENTS } from '../shared/mercosulCommon';

export const AR: TravelRule = {
  countryCode: 'AR',
  countryNameKey: 'travel.country.AR',
  flag: '🇦🇷',
  region: 'SA',
  source: 'static_catalog',
  lastReviewed: '2026-04',
  requirements: MERCOSUL_COMMON_REQUIREMENTS,
};
