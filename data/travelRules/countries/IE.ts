import type { TravelRule } from '../types';
import { EU_COMMON_REQUIREMENTS, EU_ECHINOCOCCUS } from '../shared/euCommon';

// Irlanda: UE base + tratamento Echinococcus pra cães (regra estendida).
export const IE: TravelRule = {
  countryCode: 'IE',
  countryNameKey: 'travel.country.IE',
  flag: '🇮🇪',
  region: 'EU',
  source: 'static_catalog',
  lastReviewed: '2026-04',
  requirements: [...EU_COMMON_REQUIREMENTS, EU_ECHINOCOCCUS],
};
