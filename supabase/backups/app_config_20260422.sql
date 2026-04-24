-- =====================================================================
-- BACKUP — public.app_config
-- Gerado: 2026-04-22
-- Supabase project: peqpkzituzpwukzusgcq
-- Total de linhas: 16
-- =====================================================================
--
-- Como restaurar:
--   psql ... -f app_config_20260422.sql
-- ou colar o bloco UPSERT no SQL Editor do Supabase.
--
-- O INSERT abaixo usa ON CONFLICT (key) DO UPDATE, então é idempotente:
-- pode rodar quantas vezes quiser sem duplicar — apenas restaura os
-- valores para o snapshot de 2026-04-22.
--
-- Schema da tabela (para referência):
--   key         VARCHAR  PRIMARY KEY
--   value       JSONB    NOT NULL
--   description TEXT     NULL
--   updated_at  TIMESTAMPTZ DEFAULT now()
--
-- =====================================================================
-- ATENÇÃO — Observações do snapshot
-- =====================================================================
--
-- 6 chaves têm `value = "claude-opus-4-6"` mas suas descrições indicam
-- que o valor deveria ser numérico ou enum (não um nome de modelo):
--
--   - classification_threshold     ("Min confidence to classify")
--   - max_photos_per_entry         ("Max photos per entry")
--   - max_video_seconds            ("Max video duration")
--   - narration_max_words          ("Max narration words")
--   - narration_style              ("Narration style")
--   - suggestion_threshold         ("Min confidence to suggest module")
--
-- Esses valores parecem incorretos (seed antigo ou override errado).
-- O backup preserva o estado ATUAL como-está; se forem corrigidos
-- depois, gerar um novo backup.
--
-- =====================================================================

BEGIN;

INSERT INTO public.app_config (key, value, description, updated_at) VALUES
  ('ai_anthropic_version',     '"2023-06-01"'::jsonb,               'Versão da API Anthropic',                                '2026-04-01 23:32:50.109805+00'),
  ('ai_model_audio',           '"gemini-3-flash-preview"'::jsonb,   NULL,                                                     '2026-04-10 11:46:49.19866+00'),
  ('ai_model_chat',            '"claude-sonnet-4-6"'::jsonb,        'Modelo para conversas e personalidade',                  '2026-04-01 23:32:50.109805+00'),
  ('ai_model_classify',        '"claude-sonnet-4-6"'::jsonb,        'Modelo para classificação do diário',                    '2026-04-01 23:32:50.109805+00'),
  ('ai_model_insights',        '"claude-haiku-4-5-20251001"'::jsonb,'Modelo para geração de insights',                        '2026-04-01 23:32:50.109805+00'),
  ('ai_model_narrate',         '"claude-sonnet-4-6"'::jsonb,        'Modelo para narração do diário',                         '2026-04-01 23:32:50.109805+00'),
  ('ai_model_simple',          '"claude-sonnet-4-6"'::jsonb,        'Modelo para tarefas simples (tradução, OCR parse)',      '2026-04-01 23:32:50.109805+00'),
  ('ai_model_video',           '"gemini-3-flash-preview"'::jsonb,   NULL,                                                     '2026-04-10 11:58:18.204151+00'),
  ('ai_model_vision',          '"claude-sonnet-4-6"'::jsonb,        'Modelo para análise de foto/vídeo (vision)',             '2026-04-01 23:32:50.109805+00'),
  ('ai_timeout_ms',            '55000'::jsonb,                      'Timeout padrão para chamadas à API Anthropic (ms)',      '2026-04-01 23:32:50.109805+00'),
  ('classification_threshold', '"claude-opus-4-6"'::jsonb,          'Min confidence to classify',                             '2026-03-30 20:21:01.8753+00'),
  ('max_photos_per_entry',     '"claude-opus-4-6"'::jsonb,          'Max photos per entry',                                   '2026-03-30 20:21:01.8753+00'),
  ('max_video_seconds',        '"claude-opus-4-6"'::jsonb,          'Max video duration',                                     '2026-03-30 20:21:01.8753+00'),
  ('narration_max_words',      '"claude-opus-4-6"'::jsonb,          'Max narration words',                                    '2026-03-30 20:21:01.8753+00'),
  ('narration_style',          '"claude-opus-4-6"'::jsonb,          'Narration style',                                        '2026-03-30 20:21:01.8753+00'),
  ('suggestion_threshold',     '"claude-opus-4-6"'::jsonb,          'Min confidence to suggest module',                       '2026-03-30 20:21:01.8753+00')
ON CONFLICT (key) DO UPDATE
  SET value       = EXCLUDED.value,
      description = EXCLUDED.description,
      updated_at  = EXCLUDED.updated_at;

COMMIT;

-- =====================================================================
-- Verificação pós-restore
-- =====================================================================
--
-- SELECT COUNT(*) AS total FROM public.app_config;
-- -- esperado: 16
--
-- SELECT key, value FROM public.app_config ORDER BY key;
-- -- esperado: mesmos 16 key/value do snapshot acima
--
-- =====================================================================
