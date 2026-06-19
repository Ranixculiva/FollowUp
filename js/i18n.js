/**
 * FollowUp UI localization.
 * Bundled locales load synchronously; JSON fetch is optional refresh.
 */
const LOCALE_STORAGE_KEY = 'followup_locale';
const DEFAULT_LOCALE = 'zh-TW';
const SUPPORTED_LOCALES = ['zh-TW', 'en'];

let messages = {};
let currentLocale = DEFAULT_LOCALE;
const localeListeners = [];
let localeSwitcherBound = false;

function getBundledLocales() {
    if (typeof globalThis !== 'undefined' && globalThis.__FOLLOWUP_LOCALES__) {
        return globalThis.__FOLLOWUP_LOCALES__;
    }
    return null;
}

function resolveKey(key) {
    return key.split('.').reduce((value, part) => {
        if (value == null || typeof value !== 'object') {
            return undefined;
        }
        return value[part];
    }, messages);
}

function interpolate(text, params = {}) {
    return String(text).replace(/\{(\w+)\}/g, (_, name) => {
        return Object.prototype.hasOwnProperty.call(params, name)
            ? String(params[name])
            : `{${name}}`;
    });
}

function t(key, params) {
    const value = resolveKey(key);
    if (value === undefined) {
        console.warn(`Missing i18n key: ${key}`);
        return key;
    }
    if (typeof value !== 'string') {
        console.warn(`i18n key is not a string: ${key}`);
        return key;
    }
    return interpolate(value, params);
}

function hasTranslation(key) {
    return resolveKey(key) !== undefined;
}

function normalizeLocale(locale) {
    if (!locale) {
        return DEFAULT_LOCALE;
    }
    if (SUPPORTED_LOCALES.includes(locale)) {
        return locale;
    }
    const lower = String(locale).toLowerCase();
    if (lower.startsWith('zh')) {
        return 'zh-TW';
    }
    if (lower.startsWith('en')) {
        return 'en';
    }
    return DEFAULT_LOCALE;
}

async function loadLocaleFile(locale) {
    const bundled = getBundledLocales()?.[locale];
    if (bundled) {
        return bundled;
    }

    try {
        const response = await fetch(`./locales/${locale}.json`);
        if (response.ok) {
            return response.json();
        }
    } catch (error) {
        console.warn(`Locale fetch failed for ${locale}`, error);
    }

    throw new Error(`Locale not available: ${locale}`);
}

async function setLocale(locale, options = {}) {
    const { persist = true } = options;
    const normalized = normalizeLocale(locale);

    let data;
    try {
        data = await loadLocaleFile(normalized);
    } catch (error) {
        if (normalized !== DEFAULT_LOCALE) {
            console.warn(`Falling back to ${DEFAULT_LOCALE}`, error);
            return setLocale(DEFAULT_LOCALE, options);
        }
        throw error;
    }

    messages = data;
    currentLocale = normalized;

    if (typeof document !== 'undefined') {
        document.documentElement.lang = normalized;
        applyDomI18n();
    }

    if (persist) {
        try {
            localStorage.setItem(LOCALE_STORAGE_KEY, normalized);
        } catch (storageError) {
            console.warn('Could not persist locale preference', storageError);
        }
    }

    localeListeners.forEach((listener) => listener(currentLocale));
}

function getLocale() {
    return currentLocale;
}

function onLocaleChange(listener) {
    localeListeners.push(listener);
}

function applyDomI18n(root = document) {
    root.querySelectorAll('[data-i18n]').forEach((element) => {
        const key = element.getAttribute('data-i18n');
        const attr = element.getAttribute('data-i18n-attr');
        const text = t(key);
        if (attr) {
            element.setAttribute(attr, text);
        } else {
            element.textContent = text;
        }
    });

    const titleKey = document.querySelector('meta[name="i18n-title"]')?.content;
    if (titleKey) {
        document.title = t(titleKey);
    }
}

function setupLocaleSwitcher(root = document) {
    if (localeSwitcherBound) {
        updateLocaleSwitcherState(root);
        return;
    }

    root.querySelectorAll('[data-set-locale]').forEach((button) => {
        button.addEventListener('click', async () => {
            const locale = button.getAttribute('data-set-locale');
            if (!locale || locale === currentLocale) {
                return;
            }
            try {
                await setLocale(locale);
                updateLocaleSwitcherState(root);
            } catch (error) {
                console.error('Locale switch failed', error);
                alert(t('error.localeSwitchFailed'));
            }
        });
    });

    localeSwitcherBound = true;
    updateLocaleSwitcherState(root);
}

function updateLocaleSwitcherState(root = document) {
    root.querySelectorAll('[data-set-locale]').forEach((button) => {
        const locale = button.getAttribute('data-set-locale');
        const isActive = locale === currentLocale;
        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
}

async function init() {
    let savedLocale;
    try {
        savedLocale = localStorage.getItem(LOCALE_STORAGE_KEY);
    } catch (error) {
        console.warn('Could not read locale preference', error);
    }

    await setLocale(savedLocale || navigator.language, { persist: false });
    setupLocaleSwitcher();
}

function setMessages(data) {
    messages = data;
}

const I18n = {
    LOCALE_STORAGE_KEY,
    DEFAULT_LOCALE,
    SUPPORTED_LOCALES,
    t,
    hasTranslation,
    resolveKey,
    interpolate,
    normalizeLocale,
    setLocale,
    getLocale,
    onLocaleChange,
    applyDomI18n,
    setupLocaleSwitcher,
    updateLocaleSwitcherState,
    init,
    setMessages
};

if (typeof window !== 'undefined') {
    window.I18n = I18n;
    window.t = t;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = I18n;
}
