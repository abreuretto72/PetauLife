/**
 * CA — Canadá. CFIA. Mais simples que EUA — vacinação antirrábica + atestado.
 * Fonte: https://inspection.canada.ca/importing-food-plants-or-animals/
 */

import type { TravelRule, TravelRequirement } from '../types';

const CA_REQUIREMENTS: TravelRequirement[] = [
  {
    id: 'ca_rabies_vaccine',
    documentType: 'rabies_vaccine',
    titleKey: 'travel.req.ca_rabies_vaccine.title',
    descriptionKey: 'travel.req.ca_rabies_vaccine.description',
    daysBeforeTravel: { min: 30, max: 365 },
    appliesTo: ['all'],
    mandatory: true,
    category: 'vaccination',
  },
  {
    id: 'ca_health_certificate',
    documentType: 'health_certificate',
    titleKey: 'travel.req.ca_health_certificate.title',
    descriptionKey: 'travel.req.ca_health_certificate.description',
    daysBeforeTravel: { min: 0, max: 30 },
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

export const CA: TravelRule = {
  countryCode: 'CA',
  countryNameKey: 'travel.country.CA',
  flag: '🇨🇦',
  region: 'NA',
  source: 'static_catalog',
  lastReviewed: '2026-04',
  requirements: CA_REQUIREMENTS,
};
