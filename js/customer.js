function getCustomers(callback) {
    const transaction = db.transaction(["customers"], "readonly");
    const store = transaction.objectStore("customers");
    const request = store.getAll();

    request.onsuccess = () => {
        callback(request.result);
    };
}

function getCustomer(id, callback) {
    const transaction = db.transaction(["customers"], "readonly");
    const store = transaction.objectStore("customers");
    const request = store.get(id);

    request.onsuccess = () => {
        callback(request.result);
    };
}

function saveCustomer(customer, followup, callback) {
    const transaction = db.transaction(["customers"], "readwrite");
    const store = transaction.objectStore("customers");
    const request = store.add(customer);

    request.onsuccess = () => {
        if (followup && followup.plan && followup.date) {
            const followupData = {
                customerId: request.result,
                plan: followup.plan,
                date: followup.date
            };

            const followupTransaction = db.transaction(["followups"], "readwrite");
            const followupStore = followupTransaction.objectStore("followups");
            followupStore.add(followupData);
        }

        if (callback) callback();
    };
}

function getFollowups(customerId, callback) {
    const transaction = db.transaction(["followups"], "readonly");
    const store = transaction.objectStore("followups");
    const index = store.index("customerId");
    const request = index.getAll(customerId);

    request.onsuccess = () => {
        callback(request.result);
    };
}

// Customer data structure
class Customer {
    constructor(data = {}) {
        this.id = data.id;
        this.name = data.name || '';
        this.contact = data.contact || '';
        this.address = data.address || '';
        this.ageGender = data.ageGender || '';
        this.howMet = data.howMet || '';
        this.familyStatus = data.familyStatus || '';
        this.children = data.children || '';
        this.occupation = data.occupation || '';
        this.leisure = data.leisure || '';
        this.financialStatus = data.financialStatus || '';
        this.healthStatus = data.healthStatus || '';
        this.futureExpectations = data.futureExpectations || '';
        
        // FORM evaluation
        this.formF = data.formF || '0';
        this.formO = data.formO || '0';
        this.formR = data.formR || '0';
        this.formM = data.formM || '0';

        // Needs analysis
        this.needWeightLoss = data.needWeightLoss || false;
        this.needSkincare = data.needSkincare || false;
        this.needHealth = data.needHealth || false;
        this.needIncome = data.needIncome || false;
        this.needPassiveIncome = data.needPassiveIncome || false;

        // Metadata
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = data.updatedAt || new Date().toISOString();
    }

    // Calculate total FORM score
    calculateFormScore() {
        return ['formF', 'formO', 'formR', 'formM']
            .map(key => parseInt(this[key] || 0))
            .reduce((a, b) => a + b, 0);
    }

    // Get primary needs
    getPrimaryNeeds() {
        const needs = [];
        if (this.needWeightLoss) needs.push('減脂減重');
        if (this.needSkincare) needs.push('保養彩妝');
        if (this.needHealth) needs.push('健康網站');
        if (this.needIncome) needs.push('增加收入');
        if (this.needPassiveIncome) needs.push('永續收入');
        return needs;
    }

    // Validate customer data
    validate() {
        const errors = [];
        
        // Required fields
        if (!this.name) errors.push('姓名為必填欄位');
        if (!this.contact) errors.push('聯絡方式為必填欄位');

        // FORM score validation
        ['formF', 'formO', 'formR', 'formM'].forEach(key => {
            const value = parseInt(this[key]);
            if (isNaN(value) || value < 0 || value > 5) {
                errors.push(`${key.slice(-1)} 分數必須在 0-5 之間`);
            }
        });

        return errors;
    }

    // Create a summary of the customer
    getSummary() {
        return {
            name: this.name,
            contact: this.contact,
            address: this.address,
            formScore: this.calculateFormScore(),
            needs: this.getPrimaryNeeds(),
            lastUpdated: new Date(this.updatedAt).toLocaleDateString()
        };
    }
}

// Followup data structure
class Followup {
    constructor(data = {}) {
        this.id = data.id;
        this.customerId = data.customerId;
        this.plan = data.plan || '';
        this.date = data.date || new Date().toISOString().split('T')[0];
        this.feedback = data.feedback || '';
        this.createdAt = data.createdAt || new Date().toISOString();
    }

    // Validate followup data
    validate() {
        const errors = [];
        
        if (!this.customerId) errors.push('客戶ID為必填欄位');
        if (!this.plan) errors.push('跟進計劃為必填欄位');
        if (!this.date) errors.push('執行日期為必填欄位');

        return errors;
    }
}

// Export classes
window.Customer = Customer;
window.Followup = Followup;
