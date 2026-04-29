-- ═══════════════════════════════════════════════════════════════════════════
-- Seed de teste — IA Proativa do Pet (Camadas 1-4)
--
-- Idempotente: roda DELETE antes de INSERT pra todas as linhas com
-- tag 'seed:proactive_test' nas tags JSONB.
--
-- Uso:
--   psql ... -f supabase/seeds/proactive_test_data.sql
-- OU
--   supabase db reset → supabase db push (se usar workflow declarativo)
--
-- Pets afetados:
--   - Mana (Chihuahua filhote)  — vacina vencendo + banho atrasado + microchip jaja
--   - Pico (Border Collie)       — sazonalidade coceira + troca de ração c/ cocô mole
--   - cria "Frida" idosa se ela ainda não existir → apatia recente
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. CLEAN UP — remove dados sintéticos anteriores ────────────────────────

DELETE FROM diary_entries
 WHERE tags @> '["seed:proactive_test"]'::jsonb;

DELETE FROM vaccines
 WHERE notes LIKE '%[seed:proactive_test]%';

DELETE FROM medications
 WHERE notes LIKE '%[seed:proactive_test]%';

DELETE FROM consultations
 WHERE notes LIKE '%[seed:proactive_test]%';

DELETE FROM pet_insights
 WHERE source = 'seed_proactive_test';

-- ── 2. PET 1: Mana — vacina vencendo + banho atrasado ───────────────────────

DO $$
DECLARE
  v_pet RECORD;
BEGIN
  SELECT id, user_id, name INTO v_pet
    FROM pets WHERE name = 'Mana' AND COALESCE(is_active, TRUE) LIMIT 1;
  IF v_pet.id IS NULL THEN RAISE NOTICE 'Mana not found, skipping pet 1 seed'; RETURN; END IF;

  -- Vacina vencendo em 5 dias
  INSERT INTO vaccines (pet_id, user_id, name, date_administered, next_due_date, is_active, notes)
  VALUES (v_pet.id, v_pet.user_id, 'V10', CURRENT_DATE - 360, CURRENT_DATE + 5, TRUE, '[seed:proactive_test]');

  -- 4 entries de banho nos ultimos 90 dias (com intervalo medio ~22d → ja passou da media de 1.3×)
  INSERT INTO diary_entries (pet_id, user_id, content, narration, tags, primary_type, entry_date, mood_score, mood_id, is_active)
  VALUES
    (v_pet.id, v_pet.user_id, 'Banho mensal na pet shop.', 'A Mana saiu cheirosa e leve.', '["banho","seed:proactive_test"]', 'bath', CURRENT_DATE - 90, 75, 'happy', TRUE),
    (v_pet.id, v_pet.user_id, 'Banho em casa, secador rapido.', 'A Mana cooperou bem.', '["banho","seed:proactive_test"]', 'bath', CURRENT_DATE - 65, 70, 'calm', TRUE),
    (v_pet.id, v_pet.user_id, 'Banho com tosa higienica.', 'A Mana ficou bem.', '["banho","seed:proactive_test"]', 'bath', CURRENT_DATE - 42, 72, 'happy', TRUE),
    (v_pet.id, v_pet.user_id, 'Banho rapido em casa.', 'Mana ficou tranquila.', '["banho","seed:proactive_test"]', 'bath', CURRENT_DATE - 30, 68, 'calm', TRUE);
  -- Ultimo banho: -30d. Media observada: ~20d. Logo, esta fora do limite de 1.3*20=26d.

  RAISE NOTICE 'Pet 1 (Mana) seed: vacina+banho criados';
END $$;

-- ── 3. PET 2: Pico — sazonalidade coceira + correlacao alimentar ────────────

DO $$
DECLARE
  v_pet RECORD;
  v_year INT;
  v_month INT;
  v_day INT;
  v_count INT;
BEGIN
  SELECT id, user_id, name INTO v_pet
    FROM pets WHERE name = 'Pico' AND COALESCE(is_active, TRUE) LIMIT 1;
  IF v_pet.id IS NULL THEN RAISE NOTICE 'Pico not found, skipping pet 2 seed'; RETURN; END IF;

  -- Coceira reincidente em set-out de 2024 e 2025 (10 menções por janela)
  FOR v_year IN 2024..2025 LOOP
    FOR v_month IN 9..10 LOOP
      FOR v_count IN 1..5 LOOP
        v_day := 5 + (v_count * 5); -- dias 10, 15, 20, 25, 30
        INSERT INTO diary_entries (pet_id, user_id, content, narration, tags, primary_type, entry_date, mood_score, mood_id, is_active)
        VALUES (
          v_pet.id, v_pet.user_id,
          'O Pico voltou a se cocar muito hoje, principalmente no peito e atras das orelhas.',
          'O Pico parecia incomodado, lambendo as patas e cocando.',
          '["coceira","alergia","seed:proactive_test"]',
          'health',
          make_date(v_year, v_month, v_day),
          55, 'tired',
          TRUE
        );
      END LOOP;
    END LOOP;
  END LOOP;

  -- Cocô mole apos troca de marca de racao (marco/2025)
  INSERT INTO diary_entries (pet_id, user_id, content, narration, tags, primary_type, entry_date, mood_score, mood_id, is_active)
  VALUES
    (v_pet.id, v_pet.user_id, 'Comecamos racao Premium X — Pico aceitou.', 'Pico provou e gostou.', '["nutricao","racao","seed:proactive_test"]', 'nutrition', '2025-03-01', 70, 'happy', TRUE),
    (v_pet.id, v_pet.user_id, 'Coco mais mole hoje.', 'Pico fez no parque.', '["coco_mole","seed:proactive_test"]', 'health', '2025-03-04', 60, 'calm', TRUE),
    (v_pet.id, v_pet.user_id, 'Coco ainda mole.', 'Continua amolecido.', '["coco_mole","seed:proactive_test"]', 'health', '2025-03-07', 55, 'tired', TRUE),
    (v_pet.id, v_pet.user_id, 'Cocô voltou ao normal apos uma semana.', 'Pico ja com fezes firmes.', '["seed:proactive_test"]', 'health', '2025-03-15', 75, 'happy', TRUE);

  -- Vacinas e check-ups historicos (12+ meses pra alimentar baselines)
  INSERT INTO diary_entries (pet_id, user_id, content, tags, primary_type, entry_date, is_active)
  SELECT v_pet.id, v_pet.user_id,
         'Passeio matinal de 30min no parque.',
         '["passeio","seed:proactive_test"]',
         'walk',
         CURRENT_DATE - g.day,
         TRUE
    FROM generate_series(0, 360, 3) AS g(day); -- ~120 walks ao longo do ano

  RAISE NOTICE 'Pet 2 (Pico) seed: 20 entries de coceira + ração + 120 walks';
END $$;

-- ── 4. PET 3: Pet idoso com apatia (cria "Frida" se nao existir) ────────────

DO $$
DECLARE
  v_pet_id UUID;
  v_user_id UUID;
BEGIN
  SELECT id, user_id INTO v_pet_id, v_user_id
    FROM pets WHERE name = 'Frida' AND COALESCE(is_active, TRUE) LIMIT 1;

  IF v_pet_id IS NULL THEN
    -- Cria Frida usando o tutor da Mana
    SELECT user_id INTO v_user_id FROM pets WHERE name = 'Mana' LIMIT 1;
    IF v_user_id IS NULL THEN RAISE NOTICE 'No tutor for Frida (Mana not found), skipping pet 3 seed'; RETURN; END IF;

    INSERT INTO pets (user_id, name, species, breed, weight_kg, estimated_age_months, birth_date, is_active)
    VALUES (v_user_id, 'Frida', 'dog', 'Golden Retriever', 28.5, 132, CURRENT_DATE - INTERVAL '11 years', TRUE)
    RETURNING id INTO v_pet_id;
  END IF;

  -- 30 dias de entries com apatia recorrente
  INSERT INTO diary_entries (pet_id, user_id, content, narration, tags, primary_type, entry_date, mood_score, mood_id, is_active)
  SELECT v_pet_id, v_user_id,
         CASE WHEN g.day < 14
              THEN 'A Frida está mais quieta que o normal hoje.'
              ELSE 'A Frida brincou um pouco no quintal.' END,
         CASE WHEN g.day < 14
              THEN 'A Frida deitou cedo, comeu pouco.'
              ELSE 'A Frida abanou o rabo na hora do passeio.' END,
         CASE WHEN g.day < 14 THEN '["apatia","sono","seed:proactive_test"]'::jsonb
                              ELSE '["seed:proactive_test"]'::jsonb END,
         'general',
         CURRENT_DATE - g.day,
         CASE WHEN g.day < 14 THEN 35 ELSE 65 END,
         CASE WHEN g.day < 14 THEN 'tired' ELSE 'calm' END,
         TRUE
    FROM generate_series(0, 30) AS g(day);

  RAISE NOTICE 'Pet 3 (Frida) seed: 31 entries com 14 dias de apatia recente';
END $$;

COMMIT;

-- ── 5. Smoke test pos-seed ──────────────────────────────────────────────────

SELECT
  p.name AS pet,
  COUNT(DISTINCT v.id) AS vaccines_total,
  COUNT(DISTINCT m.id) AS medications_total,
  COUNT(DISTINCT c.id) AS consultations_total,
  COUNT(DISTINCT de.id) FILTER (WHERE de.tags @> '["seed:proactive_test"]'::jsonb) AS seed_entries
FROM pets p
LEFT JOIN vaccines v ON v.pet_id = p.id AND COALESCE(v.is_active, TRUE)
LEFT JOIN medications m ON m.pet_id = p.id AND COALESCE(m.is_active, TRUE)
LEFT JOIN consultations c ON c.pet_id = p.id AND COALESCE(c.is_active, TRUE)
LEFT JOIN diary_entries de ON de.pet_id = p.id AND COALESCE(de.is_active, TRUE)
WHERE p.name IN ('Mana', 'Pico', 'Frida')
  AND COALESCE(p.is_active, TRUE)
GROUP BY p.name;
