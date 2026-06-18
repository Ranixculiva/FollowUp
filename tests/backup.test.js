const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
    createBackupPayload,
    parseBackupJson,
    validateBackupVersion,
    BACKUP_FORMAT_VERSION
} = require('../js/backup.js');

const sampleCustomers = [{ id: '1', name: 'Alice' }];

const richCustomers = [
    {
        id: 'cust-1',
        name: '王小明',
        contact: '91234567',
        address: '台北市',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-06-01T00:00:00.000Z',
        notes: 'note with "quotes" and, commas',
        tags: ['vip', 'referral']
    },
    {
        id: 'cust-2',
        name: '李美華',
        contact: null,
        evaluations: { score: 85 }
    }
];

test('export then import round-trip preserves customer data', () => {
    const original = structuredClone(richCustomers);

    const jsonText = JSON.stringify(createBackupPayload(original), null, 2);
    const parsedFile = JSON.parse(jsonText);
    const versionCheck = validateBackupVersion(parsedFile.formatVersion);
    const { customers: imported } = parseBackupJson(parsedFile);

    assert.equal(versionCheck.ok, true);
    assert.deepEqual(imported, original);
});

test('createBackupPayload wraps customers with current formatVersion', () => {
    const payload = createBackupPayload(sampleCustomers);

    assert.equal(payload.formatVersion, BACKUP_FORMAT_VERSION);
    assert.equal(payload.customers, sampleCustomers);
    assert.match(payload.exportedAt, /^\d{4}-\d{2}-\d{2}T/);
});

test('parseBackupJson accepts legacy plain customer arrays as version 0', () => {
    const result = parseBackupJson(sampleCustomers);

    assert.equal(result.formatVersion, 0);
    assert.deepEqual(result.customers, sampleCustomers);
});

test('parseBackupJson accepts versioned backup objects', () => {
    const backup = {
        formatVersion: 1,
        exportedAt: '2026-06-18T12:00:00.000Z',
        customers: sampleCustomers
    };

    const result = parseBackupJson(backup);
    assert.equal(result.formatVersion, 1);
    assert.deepEqual(result.customers, sampleCustomers);
});

test('parseBackupJson rejects invalid backup shapes', () => {
    assert.throws(() => parseBackupJson(null), /backup\.invalidJson/);
    assert.throws(() => parseBackupJson({ formatVersion: 1 }), /backup\.invalidJson/);
    assert.throws(
        () => parseBackupJson({ formatVersion: 1.5, customers: [] }),
        /backup\.invalidVersion/
    );
    assert.throws(
        () => parseBackupJson({ formatVersion: -1, customers: [] }),
        /backup\.invalidVersion/
    );
});

test('validateBackupVersion allows same and older backup versions', () => {
    assert.equal(validateBackupVersion(BACKUP_FORMAT_VERSION).ok, true);
    assert.equal(validateBackupVersion(0).ok, true);
});

test('validateBackupVersion blocks backups newer than the app', () => {
    const newerVersion = BACKUP_FORMAT_VERSION + 1;
    const result = validateBackupVersion(newerVersion);

    assert.equal(result.ok, false);
    assert.equal(result.messageKey, 'backup.versionTooNew');
    assert.equal(result.params.version, newerVersion);
    assert.equal(result.params.supported, BACKUP_FORMAT_VERSION);
});
