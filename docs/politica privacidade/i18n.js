/**
 * Motor de internacionalização do site auExpert.
 *
 * - Carrega `locales/<lang>.json` via fetch
 * - Aplica textos nos elementos com atributo `data-i18n="caminho.da.chave"`
 * - Aplica atributos em `data-i18n-attr="placeholder:caminho.chave,title:outra.chave"`
 * - Persiste escolha do usuário em localStorage
 * - Detecta idioma do navegador como fallback
 * - Popula o seletor de idioma automaticamente
 */

(function () {
  'use strict';

  let currentLang = null;
  let translations = {};

  // -----------------------------------------------------------------
  // Detecção de idioma inicial
  // -----------------------------------------------------------------
  function detectLanguage() {
    // 1. Preferência salva
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && SUPPORTED_LANGUAGES.some((l) => l.code === saved)) {
      return saved;
    }

    // 2. Idioma exato do navegador
    const browser = navigator.language || navigator.userLanguage || '';
    if (SUPPORTED_LANGUAGES.some((l) => l.code === browser)) {
      return browser;
    }

    // 3. Match por prefixo (ex: 'pt' casa com 'pt-BR')
    const prefix = browser.split('-')[0];
    const prefixMatch = SUPPORTED_LANGUAGES.find((l) => l.code.startsWith(prefix));
    if (prefixMatch) return prefixMatch.code;

    // 4. Default
    return DEFAULT_LANGUAGE;
  }

  // -----------------------------------------------------------------
  // Carregamento do JSON
  // -----------------------------------------------------------------
  async function loadTranslations(lang) {
    try {
      const res = await fetch(`locales/${lang}.json`, { cache: 'no-cache' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error(`Failed to load locale ${lang}:`, err);
      if (lang !== DEFAULT_LANGUAGE) {
        console.warn(`Falling back to ${DEFAULT_LANGUAGE}`);
        return loadTranslations(DEFAULT_LANGUAGE);
      }
      return {};
    }
  }

  // -----------------------------------------------------------------
  // Resolve caminho aninhado: "section.title" → obj.section.title
  // Suporta arrays: "section.items.0.text"
  // -----------------------------------------------------------------
  function resolveKey(obj, path) {
    return path.split('.').reduce((acc, key) => {
      if (acc === undefined || acc === null) return undefined;
      return acc[key];
    }, obj);
  }

  // -----------------------------------------------------------------
  // Aplica tradução em um elemento
  // -----------------------------------------------------------------
  function applyToElement(el) {
    // data-i18n → textContent ou innerHTML (se começar com "html:")
    const key = el.getAttribute('data-i18n');
    if (key) {
      const useHtml = key.startsWith('html:');
      const realKey = useHtml ? key.slice(5) : key;
      const value = resolveKey(translations, realKey);
      if (value !== undefined) {
        if (useHtml) {
          el.innerHTML = value;
        } else {
          el.textContent = value;
        }
      } else {
        console.warn(`Missing translation key: ${realKey}`);
      }
    }

    // data-i18n-attr → atributos do elemento
    const attrSpec = el.getAttribute('data-i18n-attr');
    if (attrSpec) {
      attrSpec.split(',').forEach((pair) => {
        const [attr, attrKey] = pair.split(':').map((s) => s.trim());
        if (attr && attrKey) {
          const value = resolveKey(translations, attrKey);
          if (value !== undefined) el.setAttribute(attr, value);
        }
      });
    }
  }

  function applyAllTranslations() {
    document.querySelectorAll('[data-i18n], [data-i18n-attr]').forEach(applyToElement);

    // Aplica também lang e dir do documento
    const langConfig = SUPPORTED_LANGUAGES.find((l) => l.code === currentLang);
    document.documentElement.setAttribute('lang', currentLang);
    document.documentElement.setAttribute('dir', langConfig?.dir || 'ltr');

    // Atualiza título da página se houver chave de título
    const titleKey = document.querySelector('title')?.getAttribute('data-i18n');
    if (titleKey) {
      const titleValue = resolveKey(translations, titleKey);
      if (titleValue) document.title = titleValue;
    }
  }

  // -----------------------------------------------------------------
  // Conteúdo dinâmico (ex: listas geradas a partir do JSON)
  // Permite renderizar arrays/objetos como HTML estruturado.
  // -----------------------------------------------------------------
  function renderDynamicContent() {
    // Procura containers com data-i18n-list="caminho.da.lista"
    document.querySelectorAll('[data-i18n-list]').forEach((container) => {
      const key = container.getAttribute('data-i18n-list');
      const items = resolveKey(translations, key);
      if (!Array.isArray(items)) {
        console.warn(`Expected array at key: ${key}`);
        return;
      }

      const template = container.getAttribute('data-template') || 'li';
      container.innerHTML = items
        .map((item) => {
          if (typeof item === 'string') {
            return `<${template}>${item}</${template}>`;
          }
          // Objetos: { label, value } ou { term, definition }
          if (item.term && item.definition) {
            return `<div class="dl-item"><strong>${item.term}</strong> ${item.definition}</div>`;
          }
          return `<${template}>${JSON.stringify(item)}</${template}>`;
        })
        .join('');
    });

    // Renderização de seções estruturadas de documento jurídico
    renderDocumentSections();
  }

  function renderDocumentSections() {
    const container = document.querySelector('[data-i18n-sections]');
    if (!container) return;

    const key = container.getAttribute('data-i18n-sections');
    const sections = resolveKey(translations, key);
    if (!Array.isArray(sections)) return;

    container.innerHTML = sections
      .map((section, idx) => {
        const sectionId = `section-${idx + 1}`;
        let html = `<section id="${sectionId}" class="doc-section">`;
        html += `<h2>${section.number ? section.number + '. ' : ''}${escapeHtml(section.title)}</h2>`;

        if (section.intro) {
          html += `<p>${escapeHtml(section.intro)}</p>`;
        }

        if (Array.isArray(section.subsections)) {
          section.subsections.forEach((sub) => {
            html += `<h3>${sub.number ? sub.number + ' ' : ''}${escapeHtml(sub.title)}</h3>`;
            if (sub.intro) html += `<p>${escapeHtml(sub.intro)}</p>`;
            if (Array.isArray(sub.items)) {
              html += '<ul>' + sub.items.map((item) => `<li>${escapeHtml(item)}</li>`).join('') + '</ul>';
            }
            if (sub.outro) html += `<p>${escapeHtml(sub.outro)}</p>`;
          });
        }

        if (Array.isArray(section.items)) {
          html += '<ul>' + section.items.map((item) => `<li>${escapeHtml(item)}</li>`).join('') + '</ul>';
        }

        if (section.outro) {
          html += `<p>${escapeHtml(section.outro)}</p>`;
        }

        if (section.notice) {
          html += `<div class="notice">${escapeHtml(section.notice)}</div>`;
        }

        html += '</section>';
        return html;
      })
      .join('');

    // Atualiza sumário lateral
    renderTableOfContents(sections);
  }

  function renderTableOfContents(sections) {
    const toc = document.querySelector('[data-toc]');
    if (!toc) return;

    toc.innerHTML = sections
      .map((section, idx) => {
        const sectionId = `section-${idx + 1}`;
        return `<a href="#${sectionId}" class="toc-link">${section.number ? section.number + '. ' : ''}${escapeHtml(section.title)}</a>`;
      })
      .join('');
  }

  function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // -----------------------------------------------------------------
  // Seletor de idioma
  // -----------------------------------------------------------------
  function buildLanguageSelector() {
    const container = document.querySelector('[data-lang-selector]');
    if (!container) return;

    // Botão principal
    const current = SUPPORTED_LANGUAGES.find((l) => l.code === currentLang);
    container.innerHTML = `
      <button class="lang-btn" aria-haspopup="listbox" aria-expanded="false" id="lang-btn">
        <span class="lang-flag" aria-hidden="true">${current.flag}</span>
        <span class="lang-code">${current.code.split('-')[0].toUpperCase()}</span>
        <svg class="lang-chevron" width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
          <path d="M2 4l3 3 3-3" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <ul class="lang-menu" role="listbox" aria-label="Select language" id="lang-menu" hidden>
        ${SUPPORTED_LANGUAGES.map(
          (l) => `
          <li role="option" aria-selected="${l.code === currentLang}">
            <button type="button" class="lang-option ${l.code === currentLang ? 'active' : ''}" data-lang="${l.code}">
              <span class="lang-flag" aria-hidden="true">${l.flag}</span>
              <span>${l.label}</span>
            </button>
          </li>
        `
        ).join('')}
      </ul>
    `;

    const btn = container.querySelector('#lang-btn');
    const menu = container.querySelector('#lang-menu');

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = !menu.hidden;
      menu.hidden = isOpen;
      btn.setAttribute('aria-expanded', String(!isOpen));
    });

    document.addEventListener('click', (e) => {
      if (!container.contains(e.target)) {
        menu.hidden = true;
        btn.setAttribute('aria-expanded', 'false');
      }
    });

    container.querySelectorAll('.lang-option').forEach((opt) => {
      opt.addEventListener('click', async () => {
        const lang = opt.getAttribute('data-lang');
        if (lang && lang !== currentLang) {
          await changeLanguage(lang);
        }
        menu.hidden = true;
      });
    });
  }

  // -----------------------------------------------------------------
  // Orquestração
  // -----------------------------------------------------------------
  async function changeLanguage(lang) {
    currentLang = lang;
    localStorage.setItem(STORAGE_KEY, lang);
    translations = await loadTranslations(lang);
    applyAllTranslations();
    renderDynamicContent();
    buildLanguageSelector();
  }

  async function init() {
    currentLang = detectLanguage();
    translations = await loadTranslations(currentLang);
    applyAllTranslations();
    renderDynamicContent();
    buildLanguageSelector();
  }

  // Expor helper global para navegação pelo menu mobile, etc.
  window.auExpertI18n = {
    changeLanguage,
    getCurrentLanguage: () => currentLang,
    getTranslations: () => translations,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
