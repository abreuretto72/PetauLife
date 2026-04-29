import type { TravelRule } from '../types';
import { MERCOSUL_COMMON_REQUIREMENTS } from '../shared/mercosulCommon';

export const PY: TravelRule = {
  countryCode: 'PY',
  countryNameKey: 'travel.country.PY',
  flag: '🇵🇾',
  region: 'SA',
  source: 'static_catalog',
  lastReviewed: '2026-04',
  requirements: MERCOSUL_COMMON_REQUIREMENTS,
};
