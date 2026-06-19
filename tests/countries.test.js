const { test, before, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const en = require('../locales/en.json');
const zhTW = require('../locales/zh-TW.json');
const fallback = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../data/countries-fallback.json'), 'utf8')
);

globalThis.__FOLLOWUP_LOCALES__ = { en, 'zh-TW': zhTW };
global.I18n = require('../js/i18n.js');
global.t = global.I18n.t;
const Countries = require('../js/countries.js');

before(async () => {
    await global.I18n.setLocale('zh-TW', { persist: false });
    Countries.setOptionsForTesting(fallback);
});

afterEach(async () => {
    await global.I18n.setLocale('zh-TW', { persist: false });
});

test('country option values stay Chinese for database compatibility', () => {
    const samples = [
        { code: 'TW', value: '台灣' },
        { code: 'US', value: '美國' },
        { code: 'HK', value: '中國香港特別行政區' },
        { code: 'JP', value: '日本' }
    ];

    for (const sample of samples) {
        const option = Countries.getOptions().find((item) => item.code === sample.code);
        assert.ok(option, `missing country option for ${sample.code}`);
        assert.equal(option.value, sample.value);
        assert.equal(option.label, sample.value);
    }
});

test('English UI translates stored Chinese country names without changing them', async () => {
    const customer = { name: 'Ada', country: '台灣' };

    await global.I18n.setLocale('en', { persist: false });

    assert.equal(customer.country, '台灣');
    assert.equal(Countries.getDisplayLabelForValue(customer.country), 'Taiwan');
    assert.equal(Countries.getDisplayLabelForValue('美國'), 'United States');
    assert.equal(Countries.getDisplayLabelForValue('日本'), 'Japan');
    assert.equal(
        Countries.getDisplayLabelForValue('中國香港特別行政區'),
        'Hong Kong SAR China'
    );
});

test('Traditional Chinese UI keeps stored country names as display text', async () => {
    await global.I18n.setLocale('zh-TW', { persist: false });

    assert.equal(Countries.getDisplayLabelForValue('台灣'), '台灣');
    assert.equal(Countries.getDisplayLabelForValue('美國'), '美國');
    assert.equal(Countries.getDisplayLabelForValue('中國香港特別行政區'), '中國香港特別行政區');
});

test('getDisplayLabel only affects presentation, not option storage fields', async () => {
    await global.I18n.setLocale('en', { persist: false });

    const option = Countries.getOptions().find((item) => item.code === 'SG');
    const snapshot = { value: option.value, label: option.label, code: option.code };

    assert.equal(Countries.getDisplayLabel(option), 'Singapore');
    assert.deepEqual(
        { value: option.value, label: option.label, code: option.code },
        snapshot
    );
});

test('unknown stored country values pass through unchanged in any locale', async () => {
    const legacy = '自訂國家';

    await global.I18n.setLocale('en', { persist: false });
    assert.equal(Countries.getDisplayLabelForValue(legacy), legacy);

    await global.I18n.setLocale('zh-TW', { persist: false });
    assert.equal(Countries.getDisplayLabelForValue(legacy), legacy);
});
