// Database initialization
const DB_NAME = 'CustomerDB';
const DB_VERSION = 1;
let db;

const initDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            reject('Error opening database');
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;

            // Create customers store
            const customerStore = db.createObjectStore('customers', { keyPath: 'id', autoIncrement: true });
            
            // Create indexes for searching
            customerStore.createIndex('name', 'name', { unique: false });
            customerStore.createIndex('contact', 'contact', { unique: false });
            customerStore.createIndex('address', 'address', { unique: false });
            
            // Create followups store with reference to customer
            const followupStore = db.createObjectStore('followups', { keyPath: 'id', autoIncrement: true });
            followupStore.createIndex('customerId', 'customerId', { unique: false });
            followupStore.createIndex('date', 'date', { unique: false });
        };
    });
};

// CRUD Operations for Customers
const addCustomer = (customerData) => {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['customers'], 'readwrite');
        const store = transaction.objectStore('customers');
        
        // Add timestamp
        customerData.createdAt = new Date().toISOString();
        customerData.updatedAt = new Date().toISOString();

        const request = store.add(customerData);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject('Error adding customer');
    });
};

const updateCustomer = (id, customerData) => {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['customers'], 'readwrite');
        const store = transaction.objectStore('customers');

        // Update timestamp
        customerData.updatedAt = new Date().toISOString();
        customerData.id = id;

        const request = store.put(customerData);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject('Error updating customer');
    });
};

const getCustomer = (id) => {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['customers'], 'readonly');
        const store = transaction.objectStore('customers');
        const request = store.get(id);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject('Error getting customer');
    });
};

const getAllCustomers = () => {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['customers'], 'readonly');
        const store = transaction.objectStore('customers');
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject('Error getting all customers');
    });
};

const deleteCustomer = (id) => {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['customers'], 'readwrite');
        const store = transaction.objectStore('customers');
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => reject('Error deleting customer');
    });
};

// Clear all customers from the database
const clearAllCustomers = () => {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['customers'], 'readwrite');
        const store = transaction.objectStore('customers');
        const request = store.clear();

        request.onsuccess = () => resolve();
        request.onerror = () => reject('Error clearing customers');
    });
};

// Search Operations
const searchCustomers = async (query) => {
    const transaction = db.transaction(['customers'], 'readonly');
    const store = transaction.objectStore('customers');
    const customers = await new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject('Error searching customers');
    });

    // Convert query to lowercase for case-insensitive search
    query = query.toLowerCase();

    return customers.filter(customer => {
        return (
            customer.name?.toLowerCase().includes(query) ||
            customer.contact?.toLowerCase().includes(query) ||
            customer.address?.toLowerCase().includes(query) ||
            customer.occupation?.toLowerCase().includes(query) ||
            customer.notes?.toLowerCase().includes(query)
        );
    });
};

// Follow-up Operations
const addFollowup = (followupData) => {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['followups'], 'readwrite');
        const store = transaction.objectStore('followups');
        
        // Add timestamp
        followupData.createdAt = new Date().toISOString();

        const request = store.add(followupData);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject('Error adding followup');
    });
};

const getCustomerFollowups = (customerId) => {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['followups'], 'readonly');
        const store = transaction.objectStore('followups');
        const index = store.index('customerId');
        const request = index.getAll(customerId);

        request.onsuccess = () => {
            // Sort followups by date
            const followups = request.result.sort((a, b) => 
                new Date(b.date) - new Date(a.date)
            );
            resolve(followups);
        };
        request.onerror = () => reject('Error getting followups');
    });
};

const getAllFollowups = () => {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['followups'], 'readonly');
        const store = transaction.objectStore('followups');
        const request = store.getAll();

        request.onsuccess = () => {
            // Sort followups by date
            const followups = request.result.sort((a, b) => 
                new Date(b.date) - new Date(a.date)
            );
            resolve(followups);
        };
        request.onerror = () => reject('Error getting all followups');
    });
};

// Initialize database when the script loads
initDB().catch(console.error);

// Export functions to global scope
window.initDB = initDB;
window.addCustomer = addCustomer;
window.updateCustomer = updateCustomer;
window.getCustomer = getCustomer;
window.getAllCustomers = getAllCustomers;
window.deleteCustomer = deleteCustomer;
window.clearAllCustomers = clearAllCustomers;
window.searchCustomers = searchCustomers;
window.getCustomerFollowups = getCustomerFollowups;
