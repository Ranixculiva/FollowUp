/**
 * Country list loader (offline-first).
 *
 * Online sources (optional refresh when navigator.onLine):
 * - zh_TW names: https://github.com/umpirsky/country-list (same as bundled fallback)
 * - REST Countries: https://restcountries.com/v3.1/all (English / nativeName.zho; not used for labels)
 */
const Countries = (() => {
    const STORAGE_KEY = 'followup_countries_v2';
    /** Default order: TW → ID → HK → MY → SG → AU → GB → US → CN */
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
            return { value: entry, label: entry };
        }
        return {
            value: entry.value || entry.label,
            label: entry.label || entry.value,
            code: entry.code || ''
        };
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
        const seen = new Set();
        const deduped = list
            .map(normalizeOption)
            .filter(item => item.value && !seen.has(item.value) && seen.add(item.value));

        return deduped.sort((a, b) => {
            const priorityDiff = getPriorityIndex(a) - getPriorityIndex(b);
            if (priorityDiff !== 0) {
                return priorityDiff;
            }
            return a.label.localeCompare(b.label, 'zh-Hant');
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
        placeholder.textContent = '請選擇';
        selectEl.appendChild(placeholder);

        getOptions().forEach(({ value, label }) => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = label;
            selectEl.appendChild(option);
        });

        if (current && !Array.from(selectEl.options).some(opt => opt.value === current)) {
            const legacy = document.createElement('option');
            legacy.value = current;
            legacy.textContent = current;
            selectEl.appendChild(legacy);
        }

        selectEl.value = current || '';
    }

    function orderLabels(labels) {
        return orderCountries(labels.map(label => ({ value: label, label }))).map(item => item.value);
    }

    return { init, getOptions, fillSelect, orderLabels };
})();

window.Countries = Countries;
