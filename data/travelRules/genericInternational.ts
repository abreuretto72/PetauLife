/**
 * data/travelRules/genericInternational.ts
 *
 * Checklist genérica internacional — usada como fallback quando:
 *   1. País fora do catálogo estático E geração IA falhou
 *   2. País fora do catálogo E ainda aguardando geração IA
 *
 * Itens universais que valem pra quase qualquer destino internacional saindo
 * do Brasil. Janelas conservadoras (encurtadas em relação ao mínimo legal de
 * cada país) — melhor o tutor ter folga.
 *
 * IMPORTANTE: usar com banner de disclaimer "regras genéricas, consulte vet
 * + embaixada/consulado do destino antes de viajar".
 */

import type { TravelRule } from './types';

export const GENERIC_INTERNATIONAL: TravelRule = {
  countryCode: '__GENERIC__',
  countryNameKey: 'travel.country.__GENERIC__',
  flag: '🌍',
  region: 'OTHER',
  source: 'generic_fallback',
  lastReviewed: '2026-04',
  generalNotesKey: 'travel.generic.notes',
  requirements: [
    {
      id: 'generic_microchip',
      documentType: 'microchip',
      titleKey: 'travel.req.generic_microchip.title',
      descriptionKey: 'travel.req.generic_microchip.description',
      daysBeforeTravel: { min: 0, max: 99999 },
      appliesTo: ['all'],
      mandatory: true,
      category: 'identification',
    },
    {
      id: 'generic_rabies',
      documentType: 'rabies_vaccine',
      titleKey: 'travel.req.generic_rabies.title',
      descriptionKey: 'travel.req.generic_rabies.description',
      daysBeforeTravel: { min: 30, max: 365 },
      appliesTo: ['all'],
      mandatory: true,
      category: 'vaccination',
    },
    {
      id: 'generic_health_certificate',
      documentType: 'health_certificate',
      titleKey: 'travel.req.generic_health_certificate.title',
      descriptionKey: 'travel.req.generic_health_certificate.description',
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
    {
      id: 'generic_vaccines',
      documentType: 'other',
      titleKey: 'travel.req.generic_vaccines.title',
      descriptionKey: 'travel.req.generic_vaccines.description',
      daysBeforeTravel: { min: 30, max: 365 },
      appliesTo: ['all'],
      mandatory: false,
      category: 'vaccination',
    },
    {
      id: 'generic_dewormer',
      documentType: 'prescription',
      titleKey: 'travel.req.generic_dewormer.title',
      descriptionKey: 'travel.req.generic_dewormer.description',
      daysBeforeTravel: { min: 1, max: 30 },
      appliesTo: ['all'],
      mandatory: false,
      category: 'preparation',
    },
    {
      id: 'generic_transport_doc',
      documentType: 'flight_ticket',
      titleKey: 'travel.req.generic_transport_doc.title',
      descriptionKey: 'travel.req.generic_transport_doc.description',
      daysBeforeTravel: { min: 0, max: 90 },
      appliesTo: ['all'],
      mandatory: false,
      category: 'transport',
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
