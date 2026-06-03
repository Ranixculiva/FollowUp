/**
 * Country list loader (offline-first).
 *
 * Online sources (optional refresh when navigator.onLine):
 * - zh_TW names: https://github.com/umpirsky/country-list (same as bundled fallback)
 * - REST Countries: https://restcountries.com/v3.1/all (English / nativeName.zho; not used for labels)
 */
const Countries = (() => {
    const STORAGE_KEY = 'followup_countries_v1';
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

    function dedupeSort(list) {
        const seen = new Set();
        return list
            .map(normalizeOption)
            .filter(item => item.value && !seen.has(item.value) && seen.add(item.value))
            .sort((a, b) => a.label.localeCompare(b.label, 'zh-Hant'));
    }

    function readCache() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return null;
            return dedupeSort(JSON.parse(raw));
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
        return dedupeSort(await response.json());
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
        return dedupeSort(list);
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
                options = dedupeSort(MINIMAL_FALLBACK);
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
        return options || dedupeSort(MINIMAL_FALLBACK);
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

    return { init, getOptions, fillSelect };
})();

window.Countries = Countries;
