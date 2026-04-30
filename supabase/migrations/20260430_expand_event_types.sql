-- 20260430_expand_event_types — Expande o CHECK constraint de event_type
-- pra cobrir todos os tipos do diário do tutor (saúde, estética, alimentação,
-- comportamento, documentação, cuidados delegados, viagens, administrativo).
--
-- Mantém retro-compatibilidade: nenhum tipo existente foi removido.
-- Adiciona 15 tipos novos:
--   alternative_therapy, nutrition_consult, ear_cleaning,
--   food_change, diet_start, sport_class,
--   asa_expiry, prescription_expiry, municipal_license,
--   pet_sitter, dog_walker, boarding, daycare,
--   pet_transport, product_expiry.

ALTER TABLE scheduled_events
  DROP CONSTRAINT IF EXISTS scheduled_events_event_type_check;

ALTER TABLE scheduled_events
  ADD CONSTRAINT scheduled_events_event_type_check
  CHECK (event_type IN (
    -- Saúde / medicina
    'consultation', 'return_visit', 'exam', 'surgery',
    'physiotherapy', 'alternative_therapy',
    'vaccine', 'travel_vaccine',
    'medication_dose', 'medication_series',
    'deworming', 'antiparasitic',
    'nutrition_consult',

    -- Estética / bem-estar
    'grooming', 'nail_trim', 'ear_cleaning', 'dental_cleaning', 'microchip',

    -- Alimentação
    'food_change', 'diet_start',

    -- Comportamento
    'training', 'behaviorist', 'sport_class', 'socialization',

    -- Documentação
    'asa_expiry', 'prescription_expiry', 'municipal_license',

    -- Cuidados delegados (tutor)
    'pet_sitter', 'dog_walker', 'boarding', 'daycare',

    -- Viagens
    'travel_checklist', 'pet_transport',

    -- Administrativo / financeiro
    'plan_renewal', 'insurance_renewal', 'plan_payment',
    'product_expiry',

    -- Fallback
    'custom'
  ));

NOTIFY pgrst, 'reload schema';
