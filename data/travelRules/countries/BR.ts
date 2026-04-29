/**
 * BR — Brasil (doméstico).
 * Voos domésticos exigem atestado de saúde + vacinas em dia. NÃO precisa CVI
 * (CVI é só pra exportação). Companhias aéreas exigem caixa adequada.
 */

import type { TravelRule } from '../types';

export const BR: TravelRule = {
  countryCode: 'BR',
  countryNameKey: 'travel.country.BR',
  flag: '🇧🇷',
  region: 'BR',
  source: 'static_catalog',
  lastReviewed: '2026-04',
  requirements: [
    {
      id: 'br_domestic_health',
      documentType: 'health_certificate',
      titleKey: 'travel.req.br_domestic_health.title',
      descriptionKey: 'travel.req.br_domestic_health.description',
      daysBeforeTravel: { min: 0, max: 10 },
      appliesTo: ['all'],
      mandatory: true,
      category: 'documentation',
    },
    {
      id: 'br_domestic_vaccines',
      documentType: 'rabies_vaccine',
      titleKey: 'travel.req.br_domestic_vaccines.title',
      descriptionKey: 'travel.req.br_domestic_vaccines.description',
      daysBeforeTravel: { min: 30, max: 365 },
      appliesTo: ['all'],
      mandatory: true,
      category: 'vaccination',
    },
    {
      id: 'generic_iata_crate',
      documentType: 'other',
      titleKey: 'travel.req.generic_iata_crate.title',
      descriptionKey: 'travel.req.generic_iata_crate.description',
      daysBeforeTravel: { min: 7, max: 99999 },
      appliesTo: ['all'],
      mandatory: false,
      category: 'transport',
    },
  ],
};
