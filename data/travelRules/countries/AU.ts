import type { TravelRule } from '../types';
import { AU_OCEANIA_REQUIREMENTS } from '../shared/auOceaniaCommon';

export const AU: TravelRule = {
  countryCode: 'AU',
  countryNameKey: 'travel.country.AU',
  flag: '🇦🇺',
  region: 'AS_OC',
  source: 'static_catalog',
  lastReviewed: '2026-04',
  generalNotesKey: 'travel.general_notes.AU',
  requirements: AU_OCEANIA_REQUIREMENTS,
};
