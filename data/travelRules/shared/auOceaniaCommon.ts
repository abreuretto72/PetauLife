/**
 * data/travelRules/shared/auOceaniaCommon.ts
 *
 * ATENÇÃO: Austrália e Nova Zelândia têm das regras MAIS RIGOROSAS do mundo
 * pra importação de pets. Inclui pré-aprovação por Import Permit, microchip
 * ISO obrigatório, antirrábica + teste de titulação RNATT (mínimo 180 dias
 * antes do embarque), múltiplos exames de doenças específicas (leishmaniose,
 * brucelose canina pra cães etc.), tratamento parasitário, atestado oficial
 * e quarentena no destino. PROCESSO TÍPICO DE 6+ MESES.
 *
 * Esta lista é orientativa — tutor DEVE consultar autoridade oficial:
 *   AU: https://www.agriculture.gov.au/biosecurity-trade/cats-dogs
 *   NZ: https://www.mpi.govt.nz/import/live-animals/cats-and-dogs/
 *
 * Antes do go-live em produção, validar TODOS os itens com:
 *   - DAFF (Australian Government Department of Agriculture, Fisheries and Forestry)
 *   - MPI NZ (Ministry for Primary Industries)
 *   - Vet brasileiro especialista em export pra Oceania
 */

import type { TravelRequirement } from '../types';

export const AU_OCEANIA_REQUIREMENTS: TravelRequirement[] = [
  {
    id: 'au_import_permit',
    documentType: 'other',
    titleKey: 'travel.req.au_import_permit.title',
    descriptionKey: 'travel.req.au_import_permit.description',
    daysBeforeTravel: { min: 30, max: 365 },
    appliesTo: ['all'],
    mandatory: true,
    category: 'documentation',
  },
  {
    id: 'au_microchip',
    documentType: 'microchip',
    titleKey: 'travel.req.au_microchip.title',
    descriptionKey: 'travel.req.au_microchip.description',
    daysBeforeTravel: { min: 0, max: 99999 },
    appliesTo: ['all'],
    mandatory: true,
    category: 'identification',
  },
  {
    id: 'au_rabies_vaccine',
    documentType: 'rabies_vaccine',
    titleKey: 'travel.req.au_rabies_vaccine.title',
    descriptionKey: 'travel.req.au_rabies_vaccine.description',
    daysBeforeTravel: { min: 180, max: 365 },
    appliesTo: ['all'],
    mandatory: true,
    category: 'vaccination',
  },
  {
    id: 'au_rnatt',
    documentType: 'lab_result',
    titleKey: 'travel.req.au_rnatt.title',
    descriptionKey: 'travel.req.au_rnatt.description',
    daysBeforeTravel: { min: 180, max: 730 },
    appliesTo: ['all'],
    mandatory: true,
    category: 'testing',
  },
  {
    id: 'au_disease_tests',
    documentType: 'lab_result',
    titleKey: 'travel.req.au_disease_tests.title',
    descriptionKey: 'travel.req.au_disease_tests.description',
    daysBeforeTravel: { min: 30, max: 180 },
    appliesTo: ['all'],
    mandatory: true,
    category: 'testing',
  },
  {
    id: 'au_parasitic_treatment',
    documentType: 'prescription',
    titleKey: 'travel.req.au_parasitic_treatment.title',
    descriptionKey: 'travel.req.au_parasitic_treatment.description',
    daysBeforeTravel: { min: 1, max: 21 },
    appliesTo: ['all'],
    mandatory: true,
    category: 'preparation',
  },
  {
    id: 'au_export_certificate',
    documentType: 'health_certificate',
    titleKey: 'travel.req.au_export_certificate.title',
    descriptionKey: 'travel.req.au_export_certificate.description',
    daysBeforeTravel: { min: 0, max: 5 },
    appliesTo: ['all'],
    mandatory: true,
    category: 'documentation',
  },
  {
    id: 'au_quarantine',
    documentType: 'other',
    titleKey: 'travel.req.au_quarantine.title',
    descriptionKey: 'travel.req.au_quarantine.description',
    daysBeforeTravel: { min: 0, max: 0 },
    appliesTo: ['all'],
    mandatory: true,
    category: 'transport',
  },
];
