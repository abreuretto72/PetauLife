/**
 * data/travelRules/types.ts
 *
 * Tipos do catálogo estático de regras de viagem por país.
 * Cada país é um TravelRule com lista de TravelRequirement.
 *
 * IMPORTANTE: titleKey/descriptionKey/countryNameKey/generalNotesKey são
 * *chaves i18n* — toda renderização final passa por t() com locale corrente.
 */

import type { DocumentType, RulesSource } from '../../types/trip';

export type Region = 'BR' | 'SA' | 'EU' | 'GB' | 'NA' | 'AS_OC' | 'OTHER';

export type RequirementCategory =
  | 'vaccination'
  | 'documentation'
  | 'identification'
  | 'transport'
  | 'preparation'
  | 'testing';

export interface TravelRequirement {
  /** Identificador estável — chave do checklist_state. Ex: 'eu_rabies_vaccine'. */
  id: string;
  documentType: DocumentType;
  titleKey: string;        // chave i18n
  descriptionKey: string;  // chave i18n
  daysBeforeTravel: {
    /** dias mínimos antes da viagem em que o documento deve ser obtido/válido */
    min: number;
    /** dias máximos antes da viagem (validade) */
    max: number;
  };
  appliesTo: ('dog' | 'cat' | 'all')[];
  mandatory: boolean;
  category: RequirementCategory;
}

export interface TravelRule {
  countryCode: string;        // 'DE'
  countryNameKey: string;     // chave i18n: 'travel.country.DE'
  flag: string;               // emoji 🇩🇪
  region: Region;
  requirements: TravelRequirement[];
  source: RulesSource;        // 'static_catalog' para os hardcoded
  lastReviewed: string;       // 'YYYY-MM' — quando o conteúdo foi revisado
  generalNotesKey?: string;   // chave i18n opcional pra notas adicionais
}
