import type { TravelRule } from '../types';
import { AU_OCEANIA_REQUIREMENTS } from '../shared/auOceaniaCommon';

export const NZ: TravelRule = {
  countryCode: 'NZ',
  countryNameKey: 'travel.country.NZ',
  flag: '🇳🇿',
  region: 'AS_OC',
  source: 'static_catalog',
  lastReviewed: '2026-04',
  generalNotesKey: 'travel.general_notes.NZ',
  requirements: AU_OCEANIA_REQUIREMENTS,
};
