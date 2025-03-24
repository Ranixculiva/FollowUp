function getCustomers(callback) {
    const transaction = db.transaction(["customers"], "readonly");
    const store = transaction.objectStore("customers");
    const request = store.getAll();

    request.onsuccess = () => {
        // Convert plain objects back to Customer instances
        const customers = request.result.map(data => new Customer(data));
        callback(customers);
    };
}

function saveCustomer(customer, followup, callback) {
    // Ensure customer is a Customer instance
    const customerInstance = customer instanceof Customer ? customer : new Customer(customer);
    
    const transaction = db.transaction(["customers"], "readwrite");
    const store = transaction.objectStore("customers");
    const request = store.add(customerInstance);

    request.onsuccess = () => {
        if (followup && followup.plan && followup.date) {
            // Ensure followup is a Followup instance
            const followupInstance = followup instanceof Followup ? followup : new Followup({
                ...followup,
                customerId: request.result
            });

            const followupTransaction = db.transaction(["followups"], "readwrite");
            const followupStore = followupTransaction.objectStore("followups");
            followupStore.add(followupInstance);
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
        // Generate a unique ID if not provided
        this.id = data.id || this.generateId();
        
        // Generate properties from form config
        this.generateProperties(data);
        
        // Metadata
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = data.updatedAt || new Date().toISOString();
    }

    // Generate a unique ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Generate properties from form config
    generateProperties(data) {
        // Process each section in the form config
        Object.entries(formConfig.sections).forEach(([sectionId, section]) => {
            // Handle list type sections
            if (section.type === 'list') {
                this[sectionId] = data[sectionId] || [];
                return;
            }

            // Handle subsections if they exist
            if (section.subsections) {
                Object.values(section.subsections).forEach(subsection => {
                    subsection.fields.forEach(field => {
                        // Handle different field types
                        switch (field.type) {
                            case 'checkbox':
                                this[field.id] = data[field.id] || false;
                                break;
                            case 'date':
                                this[field.id] = data[field.id] || new Date().toISOString().split('T')[0];
                                break;
                            case 'number':
                                this[field.id] = data[field.id] || 0;
                                break;
                            default:
                                this[field.id] = data[field.id] || '';
                        }
                    });
                });
            }

            // Handle regular fields if they exist
            if (section.fields) {
                section.fields.forEach(field => {
                    // Handle different field types
                    switch (field.type) {
                        case 'checkbox-group':
                            // For checkbox groups, create boolean properties for each option
                            field.options.forEach(option => {
                                this[option.id] = data[option.id] || false;
                            });
                            break;
                        case 'checkbox':
                            this[field.id] = data[field.id] || false;
                            break;
                        case 'date':
                            this[field.id] = data[field.id] || new Date().toISOString().split('T')[0];
                            break;
                        case 'number':
                            this[field.id] = data[field.id] || 0;
                            break;
                        default:
                            this[field.id] = data[field.id] || '';
                    }
                });
            }
        });
    }

    // Get primary needs
    getPrimaryNeeds() {
        const needs = [];
        // Find the needs section in form config
        const needsSection = Object.values(formConfig.sections).find(section => 
            section.fields.some(field => field.type === 'checkbox-group' && field.id === 'needs')
        );
        
        if (needsSection) {
            const needsField = needsSection.fields.find(field => field.type === 'checkbox-group' && field.id === 'needs');
            if (needsField) {
                needsField.options.forEach(option => {
                    if (this[option.id]) {
                        needs.push(option.label);
                    }
                });
            }
        }
        
        return needs;
    }

    // Validate customer data
    validate() {
        const errors = [];
        
        // Process each section in the form config
        Object.entries(formConfig.sections).forEach(([sectionId, section]) => {
            // Handle list type sections
            if (section.type === 'list') {
                if (Array.isArray(this[sectionId])) {
                    this[sectionId].forEach((item, index) => {
                        section.itemFields.forEach(field => {
                            if (field.required && (!item[field.id] || (typeof item[field.id] === 'string' && !item[field.id].trim()))) {
                                errors.push(`第 ${index + 1} 個${section.title}的 ${field.label}為必填欄位`);
                            }
                        });
                    });
                }
                return;
            }

            // Handle subsections if they exist
            if (section.subsections) {
                Object.values(section.subsections).forEach(subsection => {
                    subsection.fields.forEach(field => {
                        if (field.required) {
                            if (field.type === 'checkbox') {
                                if (!this[field.id]) {
                                    errors.push(`${field.label}為必填欄位`);
                                }
                            } else if (field.type === 'date') {
                                if (!this[field.id] || !this.isValidDate(this[field.id])) {
                                    errors.push(`${field.label}為必填欄位`);
                                }
                            } else if (!this[field.id] || (typeof this[field.id] === 'string' && !this[field.id].trim())) {
                                errors.push(`${field.label}為必填欄位`);
                            }
                        }
                    });
                });
            }

            // Handle regular fields if they exist
            if (section.fields) {
                section.fields.forEach(field => {
                    if (field.required) {
                        if (field.type === 'checkbox-group') {
                            const hasChecked = field.options.some(option => this[option.id]);
                            if (!hasChecked) {
                                errors.push(`${field.label}為必填欄位`);
                            }
                        } else if (field.type === 'checkbox') {
                            if (!this[field.id]) {
                                errors.push(`${field.label}為必填欄位`);
                            }
                        } else if (field.type === 'date') {
                            if (!this[field.id] || !this.isValidDate(this[field.id])) {
                                errors.push(`${field.label}為必填欄位`);
                            }
                        } else if (!this[field.id] || (typeof this[field.id] === 'string' && !this[field.id].trim())) {
                            errors.push(`${field.label}為必填欄位`);
                        }
                    }
                });
            }
        });

        return errors;
    }

    // Validate date format
    isValidDate(dateString) {
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date);
    }

    // Create a summary of the customer
    getSummary() {
        const summary = {
            name: this.name,
            lastUpdated: new Date(this.updatedAt).toLocaleDateString()
        };

        // Add contact information
        const contactFields = ['phone', 'line', 'fb', 'ig'];
        const contact = contactFields.find(field => this[field]);
        if (contact) {
            summary.contact = this[contact];
        }

        // Add address if available
        if (this.address) {
            summary.address = this.address;
        }

        // Add needs
        summary.needs = this.getPrimaryNeeds();

        return summary;
    }
}

// Followup data structure
class Followup {
    constructor(data = {}) {
        // Generate a unique ID if not provided
        this.id = data.id || this.generateId();
        this.customerId = data.customerId;
        
        // Generate properties from form config
        this.generateProperties(data);
        
        // Metadata
        this.createdAt = data.createdAt || new Date().toISOString();
    }

    // Generate a unique ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Generate properties from form config
    generateProperties(data) {
        // Find the followup section in form config
        const followupSection = Object.values(formConfig.sections).find(section => 
            section.id === 'followup'
        );
        
        if (followupSection) {
            followupSection.fields.forEach(field => {
                // Handle different field types
                switch (field.type) {
                    case 'textarea':
                    case 'text':
                    case 'date':
                    default:
                        // For other fields, use the field value or empty string
                        this[field.id] = data[field.id] || '';
                }
            });
        }
    }

    // Validate followup data
    validate() {
        const errors = [];
        
        // Only validate customerId if it's not being set by the system
        if (!this.customerId && !this.id) {
            errors.push('客戶ID為必填欄位');
        }

        // Find the followup section in form config
        const followupSection = Object.values(formConfig.sections).find(section => 
            section.id === 'followup'
        );
        
        if (followupSection) {
            followupSection.fields.forEach(field => {
                // Check required fields
                if (field.required) {
                    if (!this[field.id] || (typeof this[field.id] === 'string' && !this[field.id].trim())) {
                        errors.push(`${field.label}為必填欄位`);
                    }
                }
            });
        }

        return errors;
    }
}

// Export classes
window.Customer = Customer;
window.Followup = Followup;
