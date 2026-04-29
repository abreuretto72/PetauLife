/**
 * GB — Reino Unido (pós-Brexit).
 *
 * EU Pet Passport NÃO é mais aceito pra entrada no UK desde 2021. Em vez
 * disso usa-se Animal Health Certificate (AHC) emitido por vet OFFICIAL no
 * país de origem. Microchip ISO + antirrábica seguem padrão UE. Cães precisam
 * tratamento contra Echinococcus (tapeworm) entre 24h e 120h antes da entrada.
 *
 * Fonte oficial: https://www.gov.uk/bring-pet-to-great-britain
 */

import type { TravelRule, TravelRequirement } from '../types';

const GB_REQUIREMENTS: TravelRequirement[] = [
  {
    id: 'gb_microchip',
    documentType: 'microchip',
    titleKey: 'travel.req.gb_microchip.title',
    descriptionKey: 'travel.req.gb_microchip.description',
    daysBeforeTravel: { min: 0, max: 99999 },
    appliesTo: ['all'],
    mandatory: true,
    category: 'identification',
  },
  {
    id: 'gb_rabies_vaccine',
    documentType: 'rabies_vaccine',
    titleKey: 'travel.req.gb_rabies_vaccine.title',
    descriptionKey: 'travel.req.gb_rabies_vaccine.description',
    daysBeforeTravel: { min: 21, max: 365 },
    appliesTo: ['all'],
    mandatory: true,
    category: 'vaccination',
  },
  {
    id: 'gb_animal_health_certificate',
    documentType: 'health_certificate',
    titleKey: 'travel.req.gb_animal_health_certificate.title',
    descriptionKey: 'travel.req.gb_animal_health_certificate.description',
    daysBeforeTravel: { min: 0, max: 10 },
    appliesTo: ['all'],
    mandatory: true,
    category: 'documentation',
  },
  {
    id: 'gb_tapeworm_treatment',
    documentType: 'prescription',
    titleKey: 'travel.req.gb_tapeworm_treatment.title',
    descriptionKey: 'travel.req.gb_tapeworm_treatment.description',
    daysBeforeTravel: { min: 1, max: 5 },
    appliesTo: ['dog'],
    mandatory: true,
    category: 'preparation',
  },
  {
    id: 'br_cvi_export',
    documentType: 'health_certificate',
    titleKey: 'travel.req.br_cvi_export.title',
    descriptionKey: 'travel.req.br_cvi_export.description',
    daysBeforeTravel: { min: 0, max: 60 },
    appliesTo: ['all'],
    mandatory: true,
    category: 'documentation',
  },
];

export const GB: TravelRule = {
  countryCode: 'GB',
  countryNameKey: 'travel.country.GB',
  flag: '🇬🇧',
  region: 'GB',
  source: 'static_catalog',
  lastReviewed: '2026-04',
  requirements: GB_REQUIREMENTS,
};
