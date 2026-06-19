/**
 * Country list loader (offline-first).
 */
const Countries = (() => {
    const STORAGE_KEY = 'followup_countries_v2';
    const PRIORITY_COUNTRY_CODES = ['TW', 'ID', 'HK', 'MY', 'SG', 'AU', 'GB', 'US', 'CN'];
    const PRIORITY_LABELS = [
        '台灣',
        '印尼',
        '中國香港特別行政區',
        '香港',
        '馬來西亞',
        '新加坡',
        '澳洲',
        '英國',
        '美國',
        '中國'
    ];
    const FALLBACK_URL = './data/countries-fallback.json';
    const REMOTE_ZH_TW_URL =
        'https://raw.githubusercontent.com/umpirsky/country-list/master/data/zh_TW/country.json';

    const MINIMAL_FALLBACK = [
        '台灣', '香港', '澳門', '馬來西亞', '新加坡', '印尼', '泰國', '越南',
        '菲律賓', '日本', '韓國', '澳洲', '紐西蘭', '美國', '加拿大', '中國', '其他'
    ].map(name => ({ value: name, label: name }));

    let options = null;

    function normalizeOption(entry) {
        if (typeof entry === 'string') {
            return { value: entry, label: entry, code: '' };
        }
        return {
            value: entry.value || entry.label,
            label: entry.label || entry.value,
            code: entry.code || ''
        };
    }

    function getLocaleTag() {
        if (typeof I18n !== 'undefined' && I18n.getLocale) {
            return I18n.getLocale();
        }
        return 'zh-TW';
    }

    function getDisplayLabel(item) {
        if (typeof t !== 'function') {
            return item.label;
        }

        if (item.code) {
            const byCode = t(`countries.${item.code}`);
            if (byCode !== `countries.${item.code}`) {
                return byCode;
            }
        }

        const byValue = t(`countries.${item.value}`);
        if (byValue !== `countries.${item.value}`) {
            return byValue;
        }

        return item.label;
    }

    function getDisplayLabelForValue(value) {
        if (!value) {
            return '';
        }

        const option = getOptions().find((item) => item.value === value);
        if (option) {
            return getDisplayLabel(option);
        }

        if (typeof t === 'function') {
            const translated = t(`countries.${value}`);
            if (translated !== `countries.${value}`) {
                return translated;
            }
        }

        return value;
    }

    function getPriorityIndex(item) {
        const codeIndex = PRIORITY_COUNTRY_CODES.indexOf(item.code || '');
        if (codeIndex >= 0) {
            return codeIndex;
        }
        const labelIndex = PRIORITY_LABELS.indexOf(item.value);
        return labelIndex >= 0 ? labelIndex : PRIORITY_LABELS.length;
    }

    function orderCountries(list) {
        const localeTag = getLocaleTag();
        const seen = new Set();
        const deduped = list
            .map(normalizeOption)
            .filter(item => item.value && !seen.has(item.value) && seen.add(item.value));

        return deduped.sort((a, b) => {
            const priorityDiff = getPriorityIndex(a) - getPriorityIndex(b);
            if (priorityDiff !== 0) {
                return priorityDiff;
            }
            return getDisplayLabel(a).localeCompare(getDisplayLabel(b), localeTag);
        });
    }

    function readCache() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return null;
            return orderCountries(JSON.parse(raw));
        } catch {
            return null;
        }
    }

    function writeCache(list) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
        } catch (error) {
            console.warn('Could not cache country list', error);
        }
    }

    async function fetchBundledFallback() {
        const response = await fetch(FALLBACK_URL);
        if (!response.ok) {
            throw new Error(`Bundled fallback failed: ${response.status}`);
        }
        return orderCountries(await response.json());
    }

    async function fetchRemoteZhTw() {
        const response = await fetch(REMOTE_ZH_TW_URL, { signal: AbortSignal.timeout(8000) });
        if (!response.ok) {
            throw new Error(`Remote zh_TW list failed: ${response.status}`);
        }
        const data = await response.json();
        const list = Object.entries(data).map(([code, label]) => ({
            value: label,
            label,
            code
        }));
        return orderCountries(list);
    }

    async function init() {
        if (options) {
            return options;
        }

        options = readCache();

        if (!options) {
            try {
                options = await fetchBundledFallback();
            } catch (error) {
                console.warn('Bundled country list unavailable', error);
                options = orderCountries(MINIMAL_FALLBACK);
            }
        }

        if (navigator.onLine) {
            try {
                const remote = await fetchRemoteZhTw();
                options = remote;
                writeCache(remote);
            } catch (error) {
                console.warn('Online country refresh skipped', error);
            }
        }

        return options;
    }

    function getOptions() {
        return options || orderCountries(MINIMAL_FALLBACK);
    }

    function fillSelect(selectEl, selectedValue) {
        if (!selectEl) return;

        const current = selectedValue !== undefined ? selectedValue : selectEl.value;
        selectEl.innerHTML = '';

        const placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = typeof t === 'function'
            ? t('forms.common.pleaseSelect')
            : '請選擇';
        selectEl.appendChild(placeholder);

        getOptions().forEach((item) => {
            const option = document.createElement('option');
            option.value = item.value;
            option.textContent = getDisplayLabel(item);
            selectEl.appendChild(option);
        });

        if (current && !Array.from(selectEl.options).some(opt => opt.value === current)) {
            const legacy = document.createElement('option');
            legacy.value = current;
            legacy.textContent = getDisplayLabelForValue(current);
            selectEl.appendChild(legacy);
        }

        selectEl.value = current || '';
    }

    function orderLabels(labels) {
        return orderCountries(labels.map(label => ({ value: label, label })))
            .map(item => item.value);
    }

    function refreshAllSelects() {
        if (typeof document === 'undefined') {
            return;
        }

        document.querySelectorAll('#country, #filterCountry').forEach((selectEl) => {
            fillSelect(selectEl);
        });
    }

    if (typeof I18n !== 'undefined' && I18n.onLocaleChange) {
        I18n.onLocaleChange(() => {
            options = options ? orderCountries(options) : options;
            refreshAllSelects();
        });
    }

    const api = {
        init,
        getOptions,
        fillSelect,
        orderLabels,
        getDisplayLabel,
        getDisplayLabelForValue,
        refreshAllSelects
    };

    if (typeof window !== 'undefined') {
        window.Countries = api;
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            ...api,
            setOptionsForTesting(list) {
                options = orderCountries(list);
            },
            resetOptionsForTesting() {
                options = null;
            }
        };
    }

    return api;
})();
