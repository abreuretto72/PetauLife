/**
 * AE — Emirados Árabes Unidos.
 * Import permit + microchip ISO + antirrábica + atestado oficial.
 * Fonte: https://www.moccae.gov.ae/en/services/livestock-development.aspx
 */

import type { TravelRule, TravelRequirement } from '../types';

const AE_REQUIREMENTS: TravelRequirement[] = [
  {
    id: 'ae_import_permit',
    documentType: 'other',
    titleKey: 'travel.req.ae_import_permit.title',
    descriptionKey: 'travel.req.ae_import_permit.description',
    daysBeforeTravel: { min: 7, max: 60 },
    appliesTo: ['all'],
    mandatory: true,
    category: 'documentation',
  },
  {
    id: 'ae_microchip',
    documentType: 'microchip',
    titleKey: 'travel.req.ae_microchip.title',
    descriptionKey: 'travel.req.ae_microchip.description',
    daysBeforeTravel: { min: 0, max: 99999 },
    appliesTo: ['all'],
    mandatory: true,
    category: 'identification',
  },
  {
    id: 'ae_rabies_vaccine',
    documentType: 'rabies_vaccine',
    titleKey: 'travel.req.ae_rabies_vaccine.title',
    descriptionKey: 'travel.req.ae_rabies_vaccine.description',
    daysBeforeTravel: { min: 21, max: 365 },
    appliesTo: ['all'],
    mandatory: true,
    category: 'vaccination',
  },
  {
    id: 'ae_health_certificate',
    documentType: 'health_certificate',
    titleKey: 'travel.req.ae_health_certificate.title',
    descriptionKey: 'travel.req.ae_health_certificate.description',
    daysBeforeTravel: { min: 0, max: 10 },
    appliesTo: ['all'],
    mandatory: true,
    category: 'documentation',
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

export const AE: TravelRule = {
  countryCode: 'AE',
  countryNameKey: 'travel.country.AE',
  flag: '🇦🇪',
  region: 'OTHER',
  source: 'static_catalog',
  lastReviewed: '2026-04',
  requirements: AE_REQUIREMENTS,
};
