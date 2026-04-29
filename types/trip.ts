/**
 * types/trip.ts
 *
 * Tipos do módulo de viagem (PR1 — Fases 1+2).
 *
 * Tabelas correspondentes em Supabase: trips, trip_pets, trip_documents,
 * travel_rules_generated. Diary tem FK opcional `trip_id`.
 */

export type TransportMode = 'plane' | 'car' | 'bus' | 'ship' | 'train' | 'other';

export type TripPurpose =
  | 'tourism' | 'relocation' | 'competition' | 'treatment' | 'other';

export type TripStatus =
  | 'planning' | 'preparing' | 'active' | 'returning' | 'completed' | 'archived';

export type DocumentType =
  | 'rabies_vaccine'
  | 'health_certificate'
  | 'microchip'
  | 'eu_pet_passport'
  | 'flight_ticket'
  | 'hotel_reservation'
  | 'prescription'
  | 'lab_result'
  | 'other';

export type DocumentStatus = 'pending_review' | 'confirmed' | 'rejected';

/** Estado de cada item do checklist (key = requirement.id) */
export interface ChecklistItemState {
  status: 'pending' | 'in_progress' | 'completed' | 'not_applicable';
  document_id?: string;
  notes?: string;
  completed_at?: string;
}

export type ChecklistState = Record<string, ChecklistItemState>;

/** Origem das regras: estática (catálogo), IA (gerada+cache) ou genérica (fallback) */
export type RulesSource = 'static_catalog' | 'ai_generated' | 'generic_fallback';

export type GeneratedRulesConfidence = 'high' | 'medium' | 'low';

export interface GeneratedRulesCitation {
  title: string;
  url?: string;
  authority?: string;  // 'USDA APHIS', 'Embaixada do Brasil em X', 'IATA', ...
}

// ─── Linhas de tabela (Database<...>['public']['Tables']) ───────────────────

export interface Trip {
  id: string;
  tutor_id: string;
  destination_country_code: string;     // ISO 3166-1 alpha-2
  destination_city: string | null;
  start_date: string;                   // 'yyyy-mm-dd'
  end_date: string;
  actual_return_date: string | null;
  transport_mode: TransportMode;
  purpose: TripPurpose;
  status: TripStatus;
  checklist_state: ChecklistState;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface TripPet {
  trip_id: string;
  pet_id: string;
  created_at: string;
}

export interface TripDocument {
  id: string;
  trip_id: string;
  pet_id: string | null;
  document_type: DocumentType | string;
  storage_path: string;
  extracted_data: Record<string, unknown>;
  issued_date: string | null;
  expires_at: string | null;
  status: DocumentStatus;
  created_at: string;
  updated_at: string;
}

export interface TravelRulesGenerated {
  id: string;
  country_code: string;
  pet_species: 'dog' | 'cat' | 'all';
  origin_country_code: string;
  rules_data: Record<string, unknown>;
  confidence_level: GeneratedRulesConfidence;
  sources: GeneratedRulesCitation[];
  model_used: string;
  generated_at: string;
  expires_at: string;
  community_validations: unknown[];
  created_at: string;
}
