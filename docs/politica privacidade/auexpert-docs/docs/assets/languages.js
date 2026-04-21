/**
 * Configuração de idiomas suportados pelo site auExpert.
 *
 * Para adicionar um novo idioma:
 *   1. Crie `locales/<code>.json` com as mesmas chaves dos arquivos existentes.
 *   2. Adicione uma entrada aqui com { code, label, flag, dir }.
 *   3. Pronto — nenhuma mudança no HTML ou CSS necessária.
 *
 * `dir` é opcional (default 'ltr'). Use 'rtl' para árabe, hebraico, etc.
 */
const SUPPORTED_LANGUAGES = [
  { code: 'pt-BR', label: 'Português (Brasil)',    flag: '🇧🇷', dir: 'ltr' },
  { code: 'pt-PT', label: 'Português (Portugal)',  flag: '🇵🇹', dir: 'ltr' },
  { code: 'en-US', label: 'English (US)',          flag: '🇺🇸', dir: 'ltr' },
  { code: 'es-MX', label: 'Español (México)',      flag: '🇲🇽', dir: 'ltr' },
  { code: 'es-AR', label: 'Español (Argentina)',   flag: '🇦🇷', dir: 'ltr' },
];

const DEFAULT_LANGUAGE = 'pt-BR';
const STORAGE_KEY = 'auexpert-docs-lang';
