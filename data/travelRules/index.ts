/**
 * data/travelRules/index.ts
 *
 * Catálogo estático de regras de viagem por país. Cobre 25 destinos
 * principais do tutor brasileiro de elite. Países fora desta lista
 * disparam fluxo de geração via IA (`travel_rules_generated`) com
 * fallback genérico enquanto a geração ocorre.
 *
 * Regras revisadas em abril/2026. Validar com fontes oficiais antes
 * do go-live (ver VALIDATION_REQUIRED.md). Tutor sempre deve confirmar
 * com vet, embaixada/consulado e companhia aérea.
 */

import type { TravelRule } from './types';

import { BR } from './countries/BR';
import { AR } from './countries/AR';
import { UY } from './countries/UY';
import { PY } from './countries/PY';
import { CL } from './countries/CL';
import { CO } from './countries/CO';
import { PT } from './countries/PT';
import { ES } from './countries/ES';
import { FR } from './countries/FR';
import { IT } from './countries/IT';
import { DE } from './countries/DE';
import { NL } from './countries/NL';
import { BE } from './countries/BE';
import { AT } from './countries/AT';
import { IE } from './countries/IE';
import { GR } from './countries/GR';
import { SE } from './countries/SE';
import { GB } from './countries/GB';
import { US } from './countries/US';
import { CA } from './countries/CA';
import { MX } from './countries/MX';
import { JP } from './countries/JP';
import { AU } from './countries/AU';
import { NZ } from './countries/NZ';
import { AE } from './countries/AE';
import { CH } from './countries/CH';

export const TRAVEL_RULES: Record<string, TravelRule> = {
  BR, AR, UY, PY, CL, CO,
  PT, ES, FR, IT, DE, NL, BE, AT, IE, GR, SE,
  GB,
  US, CA, MX,
  JP, AU, NZ,
  AE, CH,
};

/** Verifica se o pais esta no catalogo estatico. */
export function isInStaticCatalog(countryCode: string): boolean {
  return countryCode in TRAVEL_RULES;
}

/** Devolve a regra estatica do pais ou undefined. */
export function getStaticRule(countryCode: string): TravelRule | undefined {
  return TRAVEL_RULES[countryCode];
}

/** Lista de codigos ISO no catalogo (uso pra UI de selecao). */
export const STATIC_COUNTRY_CODES: string[] = Object.keys(TRAVEL_RULES);

export type { TravelRule, TravelRequirement, Region, RequirementCategory } from './types';
export { GENERIC_INTERNATIONAL } from './genericInternational';
