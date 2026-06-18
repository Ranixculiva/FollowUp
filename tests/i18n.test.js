const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
    t,
    resolveKey,
    interpolate,
    normalizeLocale,
    setMessages
} = require('../js/i18n.js');

const sampleMessages = {
    app: { title: '客戶管理系統' },
    greeting: 'Hello {name}',
    nested: { deep: { value: 'ok' } }
};

test('resolveKey reads nested locale keys', () => {
    setMessages(sampleMessages);
    assert.equal(resolveKey('app.title'), '客戶管理系統');
    assert.equal(resolveKey('nested.deep.value'), 'ok');
    assert.equal(resolveKey('missing.key'), undefined);
});

test('interpolate replaces named params', () => {
    assert.equal(interpolate('Hello {name}', { name: 'Ada' }), 'Hello Ada');
    assert.equal(interpolate('Count {count}', {}), 'Count {count}');
});

test('t returns translated strings with interpolation', () => {
    setMessages(sampleMessages);
    assert.equal(t('app.title'), '客戶管理系統');
    assert.equal(t('greeting', { name: 'Ranix' }), 'Hello Ranix');
    assert.equal(t('missing.key'), 'missing.key');
});

test('normalizeLocale maps browser tags to supported locales', () => {
    assert.equal(normalizeLocale('zh-TW'), 'zh-TW');
    assert.equal(normalizeLocale('zh-HK'), 'zh-TW');
    assert.equal(normalizeLocale('en-US'), 'en');
    assert.equal(normalizeLocale('fr-FR'), 'zh-TW');
    assert.equal(normalizeLocale(undefined), 'zh-TW');
});
