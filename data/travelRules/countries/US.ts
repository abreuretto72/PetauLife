/**
 * US — Estados Unidos.
 *
 * Brasil é classificado pelo CDC como país de ALTO RISCO pra raiva canina
 * desde 2021. Cães vindos do Brasil precisam de protocolos adicionais:
 * titulação RNATT, Dog Import Form, USDA APHIS Health Certificate. Gatos
 * têm regras mais simples (basicamente atestado USDA).
 *
 * Fontes:
 *   - https://www.cdc.gov/importation/dogs/index.html
 *   - https://www.aphis.usda.gov/aphis/pet-travel
 */

import type { TravelRule, TravelRequirement } from '../types';

const US_REQUIREMENTS: TravelRequirement[] = [
  {
    id: 'us_microchip',
    documentType: 'microchip',
    titleKey: 'travel.req.us_microchip.title',
    descriptionKey: 'travel.req.us_microchip.description',
    daysBeforeTravel: { min: 0, max: 99999 },
    appliesTo: ['all'],
    mandatory: true,
    category: 'identification',
  },
  {
    id: 'us_aphis_health_certificate',
    documentType: 'health_certificate',
    titleKey: 'travel.req.us_aphis_health_certificate.title',
    descriptionKey: 'travel.req.us_aphis_health_certificate.description',
    daysBeforeTravel: { min: 0, max: 10 },
    appliesTo: ['all'],
    mandatory: true,
    category: 'documentation',
  },
  {
    id: 'us_cdc_high_risk_protocol',
    documentType: 'other',
    titleKey: 'travel.req.us_cdc_high_risk_protocol.title',
    descriptionKey: 'travel.req.us_cdc_high_risk_protocol.description',
    daysBeforeTravel: { min: 30, max: 180 },
    appliesTo: ['dog'],
    mandatory: true,
    category: 'documentation',
  },
  {
    id: 'us_rabies_titer',
    documentType: 'lab_result',
    titleKey: 'travel.req.us_rabies_titer.title',
    descriptionKey: 'travel.req.us_rabies_titer.description',
    daysBeforeTravel: { min: 30, max: 365 },
    appliesTo: ['dog'],
    mandatory: true,
    category: 'testing',
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

export const US: TravelRule = {
  countryCode: 'US',
  countryNameKey: 'travel.country.US',
  flag: '🇺🇸',
  region: 'NA',
  source: 'static_catalog',
  lastReviewed: '2026-04',
  generalNotesKey: 'travel.general_notes.US',
  requirements: US_REQUIREMENTS,
};
