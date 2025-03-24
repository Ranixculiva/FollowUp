let db;
const dbName = "CustomerDB";

function initDB() {
    const request = indexedDB.open(dbName, 1);

    request.onerror = (event) => {
        console.error("Database error:", event.target.error);
    };

    request.onupgradeneeded = (event) => {
        db = event.target.result;
        
        if (!db.objectStoreNames.contains("customers")) {
            const customerStore = db.createObjectStore("customers", { keyPath: "id", autoIncrement: true });
            customerStore.createIndex("name", "name", { unique: false });
            customerStore.createIndex("phone", "phone", { unique: false });
        }

        if (!db.objectStoreNames.contains("followups")) {
            const followupStore = db.createObjectStore("followups", { keyPath: "id", autoIncrement: true });
            followupStore.createIndex("customerId", "customerId", { unique: false });
            followupStore.createIndex("date", "date", { unique: false });
        }
    };

    request.onsuccess = (event) => {
        db = event.target.result;
        // Initialize UI after DB is ready
        if (typeof initUI === 'function') {
            initUI();
        }
    };
}

// Initialize database when script loads
initDB();
