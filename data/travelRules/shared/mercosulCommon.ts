/**
 * data/travelRules/shared/mercosulCommon.ts
 *
 * Requirements base pra países do bloco Mercosul (AR, UY, PY) e Chile/Colombia
 * que têm regras parecidas. Base do CVI Mercosul + RES MAPA.
 */

import type { TravelRequirement } from '../types';

export const MERCOSUL_COMMON_REQUIREMENTS: TravelRequirement[] = [
  {
    id: 'mercosul_cvi',
    documentType: 'health_certificate',
    titleKey: 'travel.req.mercosul_cvi.title',
    descriptionKey: 'travel.req.mercosul_cvi.description',
    daysBeforeTravel: { min: 0, max: 60 },
    appliesTo: ['all'],
    mandatory: true,
    category: 'documentation',
  },
  {
    id: 'mercosul_rabies_vaccine',
    documentType: 'rabies_vaccine',
    titleKey: 'travel.req.mercosul_rabies_vaccine.title',
    descriptionKey: 'travel.req.mercosul_rabies_vaccine.description',
    daysBeforeTravel: { min: 30, max: 365 },
    appliesTo: ['all'],
    mandatory: true,
    category: 'vaccination',
  },
  {
    id: 'mercosul_microchip',
    documentType: 'microchip',
    titleKey: 'travel.req.mercosul_microchip.title',
    descriptionKey: 'travel.req.mercosul_microchip.description',
    daysBeforeTravel: { min: 0, max: 99999 },
    appliesTo: ['all'],
    mandatory: false,
    category: 'identification',
  },
];

/** Chile exige tratamento antiparasitário interno+externo nos 7 dias antes. */
export const CL_PARASITIC_TREATMENT: TravelRequirement = {
  id: 'cl_parasitic_treatment',
  documentType: 'prescription',
  titleKey: 'travel.req.cl_parasitic_treatment.title',
  descriptionKey: 'travel.req.cl_parasitic_treatment.description',
  daysBeforeTravel: { min: 1, max: 7 },
  appliesTo: ['all'],
  mandatory: true,
  category: 'preparation',
};
