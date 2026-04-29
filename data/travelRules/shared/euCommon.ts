/**
 * data/travelRules/shared/euCommon.ts
 *
 * Requirements compartilhados pelos países da União Europeia (e EFTA — CH).
 * Base do regime EU Pet Travel Scheme (Regulation 576/2013):
 *   - Microchip ISO 11784/11785 implantado
 *   - Vacina antirrábica válida (≥21 dias após aplicação, ≤1 ano)
 *   - Atestado de saúde EU (até 10 dias antes do embarque)
 *   - CVI MAPA pra saída do Brasil
 *
 * Países que adicionam Echinococcus pra cães: IE, FI, MT, NO, GB (pós-Brexit).
 * Use EU_ECHINOCOCCUS quando aplicável.
 */

import type { TravelRequirement } from '../types';

export const EU_COMMON_REQUIREMENTS: TravelRequirement[] = [
  {
    id: 'eu_microchip_iso',
    documentType: 'microchip',
    titleKey: 'travel.req.eu_microchip_iso.title',
    descriptionKey: 'travel.req.eu_microchip_iso.description',
    daysBeforeTravel: { min: 0, max: 99999 },
    appliesTo: ['all'],
    mandatory: true,
    category: 'identification',
  },
  {
    id: 'eu_rabies_vaccine',
    documentType: 'rabies_vaccine',
    titleKey: 'travel.req.eu_rabies_vaccine.title',
    descriptionKey: 'travel.req.eu_rabies_vaccine.description',
    daysBeforeTravel: { min: 21, max: 365 },
    appliesTo: ['all'],
    mandatory: true,
    category: 'vaccination',
  },
  {
    id: 'eu_health_certificate',
    documentType: 'health_certificate',
    titleKey: 'travel.req.eu_health_certificate.title',
    descriptionKey: 'travel.req.eu_health_certificate.description',
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

/** Tratamento de Echinococcus — exigido em IE, FI, MT, NO, GB pra cães. */
export const EU_ECHINOCOCCUS: TravelRequirement = {
  id: 'eu_echinococcus_treatment',
  documentType: 'prescription',
  titleKey: 'travel.req.eu_echinococcus_treatment.title',
  descriptionKey: 'travel.req.eu_echinococcus_treatment.description',
  daysBeforeTravel: { min: 1, max: 5 },
  appliesTo: ['dog'],
  mandatory: true,
  category: 'preparation',
};
