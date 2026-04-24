/**
 * AI config loader — reads model names and defaults from app_config
 * with a 5-min in-memory cache (currently disabled: expiry = now + 1).
 *
 * Inlined inside the classify-diary-entry deploy bundle to avoid
 * cross-directory imports at deploy time.
 *
 * Formato em app_config (JSONB):
 *   - String:  "claude-sonnet-4-6"                     — modelo único
 *   - Array:   ["claude-opus-4-7", "claude-opus-4-6"] — cadeia com fallback
 * Esta função normaliza ambos em: model_* (primeiro da cadeia) + model_*_chain (array).
 */

export interface AIConfig {
  // Primary — primeiro da cadeia. Backward compat para callers que querem um único modelo.
  model_classify:    string;
  model_vision:      string;
  model_chat:        string;
  model_narrate:     string;
  model_insights:    string;
  model_simple:      string;
  model_audio:       string;  // Gemini model for native audio analysis
  model_video:       string;  // Gemini model for native video analysis

  // Full chain — use com callAnthropicWithFallback
  model_classify_chain:  string[];
  model_vision_chain:    string[];
  model_chat_chain:      string[];
  model_narrate_chain:   string[];
  model_insights_chain:  string[];
  model_simple_chain:    string[];

  timeout_ms:        number;
  anthropic_version: string;
}

const DEFAULT_CLASSIFY = ['claude-sonnet-4-6'];
const DEFAULT_VISION   = ['claude-opus-4-7', 'claude-opus-4-6', 'claude-sonnet-4-6'];
const DEFAULT_CHAT     = ['claude-sonnet-4-6'];
const DEFAULT_NARRATE  = ['claude-sonnet-4-6'];
const DEFAULT_INSIGHTS = ['claude-haiku-4-5-20251001', 'claude-sonnet-4-6'];
const DEFAULT_SIMPLE   = ['claude-sonnet-4-6'];

function toChain(raw: unknown, fallback: string[]): string[] {
  if (Array.isArray(raw)) {
    const filtered = raw.map((x) => String(x).trim()).filter(Boolean);
    return filtered.length > 0 ? filtered : fallback;
  }
  if (typeof raw === 'string' && raw.trim().length > 0) {
    return [raw.trim()];
  }
  return fallback;
}

const AI_CONFIG_DEFAULTS: AIConfig = {
  model_classify:        DEFAULT_CLASSIFY[0],
  model_vision:          DEFAULT_VISION[0],
  model_chat:            DEFAULT_CHAT[0],
  model_narrate:         DEFAULT_NARRATE[0],
  model_insights:        DEFAULT_INSIGHTS[0],
  model_simple:          DEFAULT_SIMPLE[0],
  model_audio:           'gemini-2.5-flash-preview-04-17',
  model_video:           'gemini-2.5-flash-preview-04-17',

  model_classify_chain:  DEFAULT_CLASSIFY,
  model_vision_chain:    DEFAULT_VISION,
  model_chat_chain:      DEFAULT_CHAT,
  model_narrate_chain:   DEFAULT_NARRATE,
  model_insights_chain:  DEFAULT_INSIGHTS,
  model_simple_chain:    DEFAULT_SIMPLE,

  timeout_ms:        30_000,
  anthropic_version: '2023-06-01',
};

let _cachedAIConfig: AIConfig | null = null;
let _aiConfigExpiry = 0;

export async function getAIConfig(): Promise<AIConfig> {
  const now = Date.now();
  if (_cachedAIConfig && now < _aiConfigExpiry) return _cachedAIConfig;
  try {
    const { createClient } = await import('jsr:@supabase/supabase-js@2');
    const client = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    const keys = [
      'ai_model_classify', 'ai_model_vision', 'ai_model_chat',
      'ai_model_narrate', 'ai_model_insights', 'ai_model_simple',
      'ai_model_audio', 'ai_model_video',
      'ai_timeout_ms', 'ai_anthropic_version',
    ];
    const { data, error } = await client.from('app_config').select('key, value').in('key', keys);
    if (error || !data?.length) throw new Error('app_config fetch failed');
    const map: Record<string, unknown> = {};
    for (const row of data) map[row.key] = row.value;

    // Normaliza string OU array pra chain (array) + primary (primeiro)
    const classifyChain = toChain(map['ai_model_classify'], DEFAULT_CLASSIFY);
    const visionChain   = toChain(map['ai_model_vision'],   DEFAULT_VISION);
    const chatChain     = toChain(map['ai_model_chat'],     DEFAULT_CHAT);
    const narrateChain  = toChain(map['ai_model_narrate'],  DEFAULT_NARRATE);
    const insightsChain = toChain(map['ai_model_insights'], DEFAULT_INSIGHTS);
    const simpleChain   = toChain(map['ai_model_simple'],   DEFAULT_SIMPLE);

    _cachedAIConfig = {
      model_classify:        classifyChain[0],
      model_vision:          visionChain[0],
      model_chat:            chatChain[0],
      model_narrate:         narrateChain[0],
      model_insights:        insightsChain[0],
      model_simple:          simpleChain[0],
      model_audio:           (map['ai_model_audio']       as string) ?? AI_CONFIG_DEFAULTS.model_audio,
      model_video:           (map['ai_model_video']       as string) ?? AI_CONFIG_DEFAULTS.model_video,

      model_classify_chain:  classifyChain,
      model_vision_chain:    visionChain,
      model_chat_chain:      chatChain,
      model_narrate_chain:   narrateChain,
      model_insights_chain:  insightsChain,
      model_simple_chain:    simpleChain,

      timeout_ms:        Number(map['ai_timeout_ms']  ?? AI_CONFIG_DEFAULTS.timeout_ms),
      anthropic_version: (map['ai_anthropic_version'] as string) ?? AI_CONFIG_DEFAULTS.anthropic_version,
    };
    _aiConfigExpiry = now + 30_000; // 30s cache, propagação rápida de rollback
    return _cachedAIConfig;
  } catch (e) {
    console.warn('[classifier:ai-config] falling back to DEFAULTS:', (e as Error)?.message ?? e);
    return AI_CONFIG_DEFAULTS;
  }
}
