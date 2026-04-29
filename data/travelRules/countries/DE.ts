import type { TravelRule } from '../types';
import { EU_COMMON_REQUIREMENTS } from '../shared/euCommon';

export const DE: TravelRule = {
  countryCode: 'DE',
  countryNameKey: 'travel.country.DE',
  flag: '🇩🇪',
  region: 'EU',
  source: 'static_catalog',
  lastReviewed: '2026-04',
  requirements: EU_COMMON_REQUIREMENTS,
};
