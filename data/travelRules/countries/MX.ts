/**
 * MX — México. SENASICA. Atestado de saúde + vacinação básica.
 * Fonte: https://www.gob.mx/senasica
 */

import type { TravelRule, TravelRequirement } from '../types';

const MX_REQUIREMENTS: TravelRequirement[] = [
  {
    id: 'mx_health_certificate',
    documentType: 'health_certificate',
    titleKey: 'travel.req.mx_health_certificate.title',
    descriptionKey: 'travel.req.mx_health_certificate.description',
    daysBeforeTravel: { min: 0, max: 15 },
    appliesTo: ['all'],
    mandatory: true,
    category: 'documentation',
  },
  {
    id: 'mx_rabies_vaccine',
    documentType: 'rabies_vaccine',
    titleKey: 'travel.req.mx_rabies_vaccine.title',
    descriptionKey: 'travel.req.mx_rabies_vaccine.description',
    daysBeforeTravel: { min: 30, max: 365 },
    appliesTo: ['all'],
    mandatory: true,
    category: 'vaccination',
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

export const MX: TravelRule = {
  countryCode: 'MX',
  countryNameKey: 'travel.country.MX',
  flag: '🇲🇽',
  region: 'NA',
  source: 'static_catalog',
  lastReviewed: '2026-04',
  requirements: MX_REQUIREMENTS,
};
