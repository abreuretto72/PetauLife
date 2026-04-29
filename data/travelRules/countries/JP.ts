import type { TravelRule } from '../types';
import { JP_STRICT_RABIES_REQUIREMENTS } from '../shared/strictRabies';

export const JP: TravelRule = {
  countryCode: 'JP',
  countryNameKey: 'travel.country.JP',
  flag: '🇯🇵',
  region: 'AS_OC',
  source: 'static_catalog',
  lastReviewed: '2026-04',
  generalNotesKey: 'travel.general_notes.JP',
  requirements: JP_STRICT_RABIES_REQUIREMENTS,
};
