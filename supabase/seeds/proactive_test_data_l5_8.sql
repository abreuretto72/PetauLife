-- ═══════════════════════════════════════════════════════════════════════════
-- Seed de teste — IA Proativa do Pet (Camadas 5-8)
--
-- Idempotente. Roda DELETE antes de INSERT em cada bloco. Estende o seed
-- base (proactive_test_data.sql) com cenários específicos das camadas
-- 5 (Coach), 6 (Família), 7 (Pet ops) e 8 (Companhia emocional).
--
-- Uso:
--   psql ... -f supabase/seeds/proactive_test_data.sql       -- (base)
--   psql ... -f supabase/seeds/proactive_test_data_l5_8.sql  -- (este)
--
-- Pets afetados (do seed base):
--   - Mana   (Chihuahua filhote)
--   - Pico   (Border Collie)
--   - Frida  (Golden Retriever idosa)
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. CLEANUP — remove dados sintéticos anteriores deste bloco ─────────────

DELETE FROM chronic_conditions WHERE notes='[seed:l5_8_test]';
DELETE FROM medications WHERE notes='[seed:l5_8_test]';
DELETE FROM consultations WHERE notes='[seed:l5_8_test]';
DELETE FROM trips WHERE metadata @> '{"seed":"l5_8_test"}'::jsonb;
DELETE FROM pet_lifecycle_events WHERE metadata @> '{"seed":"l5_8_test"}'::jsonb;

-- ── 2. CAMADA 5 — Coach por raça/idade/condição ────────────────────────────
-- Frida (Golden idosa) ganha 1 condição crônica → L5 vai sugerir manejo + senior care

DO $$
DECLARE v_pet RECORD;
BEGIN
  SELECT id, user_id INTO v_pet FROM pets WHERE name='Frida' AND COALESCE(is_active, TRUE) LIMIT 1;
  IF v_pet.id IS NULL THEN RAISE NOTICE 'Frida not found, skipping L5 seed'; RETURN; END IF;

  -- Displasia coxofemoral (clássico em Golden idosa)
  INSERT INTO chronic_conditions (pet_id, user_id, name, code, severity, status, treatment_summary, diagnosed_date, source, is_active, notes)
  VALUES (v_pet.id, v_pet.user_id, 'Displasia coxofemoral', 'M16.7',
          'moderate', 'active',
          'Carprofeno 75mg 1x dia + condroprotetor + reduzir caminhadas longas',
          CURRENT_DATE - 240, 'seed', TRUE, '[seed:l5_8_test]');

  RAISE NOTICE 'L5 seed: Frida ganhou condição crônica (displasia)';
END $$;

-- ── 3. CAMADA 6 — Multi-pet / multi-tutor ─────────────────────────────────
-- Já coberto naturalmente pelo seed base (Mana + Pico + Frida = 3 pets).
-- L6 vai detectar comparações de meals/walks/diary entries.

-- ── 4. CAMADA 7 — Pet ops ──────────────────────────────────────────────────

DO $$
DECLARE v_mana RECORD; v_pico RECORD; v_trip_id UUID;
BEGIN
  SELECT id, user_id INTO v_mana FROM pets WHERE name='Mana' AND COALESCE(is_active, TRUE) LIMIT 1;
  SELECT id, user_id INTO v_pico FROM pets WHERE name='Pico' AND COALESCE(is_active, TRUE) LIMIT 1;
  IF v_mana.id IS NULL THEN RAISE NOTICE 'Mana not found, skipping L7 seed'; RETURN; END IF;

  -- prescription_renewal: Apoquel terminando em 4 dias
  INSERT INTO medications (pet_id, user_id, name, frequency, start_date, end_date, reason, is_active, notes)
  VALUES (v_mana.id, v_mana.user_id, 'Apoquel 5,4mg', '1x ao dia',
          CURRENT_DATE - 10, CURRENT_DATE + 4,
          'Prurido alérgico em fase aguda', TRUE, '[seed:l5_8_test]');

  -- vet_consultation_prep: consulta com follow_up em 3d
  INSERT INTO consultations (pet_id, user_id, date, time, veterinarian, clinic, type, summary, follow_up_at, is_active, notes)
  VALUES (v_mana.id, v_mana.user_id, CURRENT_DATE - 14, '14:30:00',
          'Dra. Helena Brito', 'Clínica Vet Aldeia', 'rotina',
          'Consulta de rotina com queixa de coceira pós-passeio.', CURRENT_DATE + 3, TRUE,
          '[seed:l5_8_test]');

  -- trip_anticipation: viagem em 12d
  IF v_pico.id IS NOT NULL THEN
    INSERT INTO trips (tutor_id, destination_country_code, destination_city, start_date, end_date,
                       transport_mode, purpose, status, metadata, created_at, updated_at)
    VALUES (v_mana.user_id, 'BR', 'Rio de Janeiro', CURRENT_DATE + 12, CURRENT_DATE + 19,
            'car', 'leisure', 'planning', '{"seed":"l5_8_test"}'::jsonb, NOW(), NOW())
    RETURNING id INTO v_trip_id;

    INSERT INTO trip_pets (trip_id, pet_id, created_at)
    VALUES (v_trip_id, v_mana.id, NOW()),
           (v_trip_id, v_pico.id, NOW());
  END IF;

  RAISE NOTICE 'L7 seed: Apoquel + consulta retorno + viagem RJ criados';
END $$;

-- ── 5. CAMADA 8 — Companhia emocional ─────────────────────────────────────
-- 8a (marcos afetivos): aniversário de Mana ajustado pro mês atual
-- 8a (adoption_anniversary): registro de adoção de Pico há 3 anos
-- 8b (chronic_disease): Frida já tem displasia (item 2)
-- 8b (euthanasia_discussion): NÃO cria seed — exige sinais agregados reais
-- 8c (memorial_mode): NÃO cria seed — testa só com pet sintético separado
-- 8d (tutor_difficulty): NÃO cria seed automaticamente — exige tutor isolado

DO $$
DECLARE v_pico RECORD;
BEGIN
  SELECT id, user_id INTO v_pico FROM pets WHERE name='Pico' AND COALESCE(is_active, TRUE) LIMIT 1;
  IF v_pico.id IS NULL THEN RAISE NOTICE 'Pico not found, skipping L8a seed'; RETURN; END IF;

  -- Adoção do Pico há 3 anos (mesmo mês+dia de hoje)
  INSERT INTO pet_lifecycle_events (pet_id, user_id, event_type, event_date, notes, metadata, is_active)
  VALUES (v_pico.id, v_pico.user_id, 'adoption',
          make_date(EXTRACT(YEAR FROM CURRENT_DATE)::int - 3,
                    EXTRACT(MONTH FROM CURRENT_DATE)::int,
                    EXTRACT(DAY FROM CURRENT_DATE)::int),
          'Pico chegou em casa.',
          '{"seed":"l5_8_test"}'::jsonb, TRUE);

  RAISE NOTICE 'L8a seed: aniversário de adoção do Pico (3 anos hoje)';
END $$;

COMMIT;

-- ── 6. SMOKE TEST PÓS-SEED ─────────────────────────────────────────────────

SELECT
  p.name AS pet,
  COUNT(DISTINCT cc.id) FILTER (WHERE cc.notes='[seed:l5_8_test]') AS chronic_conditions_added,
  COUNT(DISTINCT m.id)  FILTER (WHERE m.notes ='[seed:l5_8_test]') AS medications_added,
  COUNT(DISTINCT c.id)  FILTER (WHERE c.notes ='[seed:l5_8_test]') AS consultations_added,
  COUNT(DISTINCT le.id) FILTER (WHERE le.metadata @> '{"seed":"l5_8_test"}'::jsonb) AS lifecycle_events_added
FROM pets p
LEFT JOIN chronic_conditions cc ON cc.pet_id = p.id AND COALESCE(cc.is_active, TRUE)
LEFT JOIN medications m ON m.pet_id = p.id AND COALESCE(m.is_active, TRUE)
LEFT JOIN consultations c ON c.pet_id = p.id AND COALESCE(c.is_active, TRUE)
LEFT JOIN pet_lifecycle_events le ON le.pet_id = p.id AND COALESCE(le.is_active, TRUE)
WHERE p.name IN ('Mana', 'Pico', 'Frida')
  AND COALESCE(p.is_active, TRUE)
GROUP BY p.name
ORDER BY p.name;

-- Trips do tutor:
SELECT t.id, t.destination_city, t.start_date, t.status, COUNT(tp.pet_id) AS pets
  FROM trips t
  LEFT JOIN trip_pets tp ON tp.trip_id = t.id
 WHERE t.metadata @> '{"seed":"l5_8_test"}'::jsonb
 GROUP BY t.id, t.destination_city, t.start_date, t.status;
