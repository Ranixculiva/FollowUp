/**
 * Backup format versioning for JSON export/import.
 * Bump BACKUP_FORMAT_VERSION when the exported data shape changes.
 */
const BACKUP_FORMAT_VERSION = 1;
const LEGACY_BACKUP_VERSION = 0;

function createBackupPayload(customers) {
    return {
        formatVersion: BACKUP_FORMAT_VERSION,
        exportedAt: new Date().toISOString(),
        customers
    };
}

function parseBackupJson(parsed) {
    if (Array.isArray(parsed)) {
        return { formatVersion: LEGACY_BACKUP_VERSION, customers: parsed };
    }

    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.customers)) {
        throw new Error('無效的 JSON 格式');
    }

    const formatVersion = Number(parsed.formatVersion);
    if (!Number.isInteger(formatVersion) || formatVersion < 0) {
        throw new Error('無效的備份版本');
    }

    return { formatVersion, customers: parsed.customers };
}

function validateBackupVersion(fileVersion) {
    if (fileVersion > BACKUP_FORMAT_VERSION) {
        return {
            ok: false,
            message: `此備份檔版本 (${fileVersion}) 較新，目前應用程式僅支援版本 ${BACKUP_FORMAT_VERSION}。\n請先更新應用程式後再匯入，以免資料損壞。`
        };
    }

    return { ok: true };
}

const backupApi = {
    BACKUP_FORMAT_VERSION,
    LEGACY_BACKUP_VERSION,
    createBackupPayload,
    parseBackupJson,
    validateBackupVersion
};

if (typeof window !== 'undefined') {
    Object.assign(window, backupApi);
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = backupApi;
}
