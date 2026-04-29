/**
 * data/travelRules/shared/strictRabies.ts
 *
 * Requirements para Japão — protocolo antirrábico estrito de 180+ dias.
 *
 * Fluxo padrão (resumido):
 *   1. Microchip ISO antes da 1ª vacina antirrábica
 *   2. Duas doses de antirrábica (intervalo 30+ dias)
 *   3. Teste RNATT (titulação) — sangue colhido após 2ª dose
 *   4. Aguardar 180+ dias após colheita do RNATT
 *   5. Notificação prévia ao Animal Quarantine Service japonês (40+ dias antes)
 *   6. Atestado de exportação MAPA + tradução juramentada
 *   7. Quarentena na chegada (variável conforme atendimento ao protocolo)
 *
 * Lista oficial: https://www.maff.go.jp/aqs/english/animal/dog/import-other.html
 *
 * IMPORTANTE: validar com autoridade japonesa antes do go-live.
 */

import type { TravelRequirement } from '../types';

export const JP_STRICT_RABIES_REQUIREMENTS: TravelRequirement[] = [
  {
    id: 'jp_microchip',
    documentType: 'microchip',
    titleKey: 'travel.req.jp_microchip.title',
    descriptionKey: 'travel.req.jp_microchip.description',
    daysBeforeTravel: { min: 180, max: 99999 },
    appliesTo: ['all'],
    mandatory: true,
    category: 'identification',
  },
  {
    id: 'jp_rabies_two_doses',
    documentType: 'rabies_vaccine',
    titleKey: 'travel.req.jp_rabies_two_doses.title',
    descriptionKey: 'travel.req.jp_rabies_two_doses.description',
    daysBeforeTravel: { min: 180, max: 365 },
    appliesTo: ['all'],
    mandatory: true,
    category: 'vaccination',
  },
  {
    id: 'jp_rabies_titer',
    documentType: 'lab_result',
    titleKey: 'travel.req.jp_rabies_titer.title',
    descriptionKey: 'travel.req.jp_rabies_titer.description',
    daysBeforeTravel: { min: 180, max: 730 },
    appliesTo: ['all'],
    mandatory: true,
    category: 'testing',
  },
  {
    id: 'jp_180_days_wait',
    documentType: 'other',
    titleKey: 'travel.req.jp_180_days_wait.title',
    descriptionKey: 'travel.req.jp_180_days_wait.description',
    daysBeforeTravel: { min: 180, max: 99999 },
    appliesTo: ['all'],
    mandatory: true,
    category: 'preparation',
  },
  {
    id: 'jp_advance_notification',
    documentType: 'other',
    titleKey: 'travel.req.jp_advance_notification.title',
    descriptionKey: 'travel.req.jp_advance_notification.description',
    daysBeforeTravel: { min: 40, max: 180 },
    appliesTo: ['all'],
    mandatory: true,
    category: 'documentation',
  },
  {
    id: 'jp_export_certificate',
    documentType: 'health_certificate',
    titleKey: 'travel.req.jp_export_certificate.title',
    descriptionKey: 'travel.req.jp_export_certificate.description',
    daysBeforeTravel: { min: 0, max: 10 },
    appliesTo: ['all'],
    mandatory: true,
    category: 'documentation',
  },
];
