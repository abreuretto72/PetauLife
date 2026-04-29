import type { TravelRule } from '../types';
import { EU_COMMON_REQUIREMENTS } from '../shared/euCommon';

export const GR: TravelRule = {
  countryCode: 'GR',
  countryNameKey: 'travel.country.GR',
  flag: '🇬🇷',
  region: 'EU',
  source: 'static_catalog',
  lastReviewed: '2026-04',
  requirements: EU_COMMON_REQUIREMENTS,
};
