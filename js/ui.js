// UI State
let currentCustomerId = null;
let isEditing = false;
let hasUnsavedChanges = false;

// Initialize UI
async function initializeUI() {
    try {
        // Initialize database first
        await initDB();
        
        // Initialize form
        const formContainer = document.getElementById('customerForm');
        if (!formContainer) {
            throw new Error('Customer form container not found');
        }
        FormGenerator.generateForm('customerForm');
        
        // Set up search handler
        const searchBar = document.querySelector('.search-bar');
        if (searchBar) {
            searchBar.addEventListener('input', debounce(handleSearch, 300));
        } else {
            console.warn('Search bar element not found. Search functionality will be disabled.');
        }

        // Set up form change tracking
        const formInputs = document.querySelectorAll('input, select, textarea');
        formInputs.forEach(input => {
            input.addEventListener('change', () => {
                hasUnsavedChanges = true;
            });
        });

        // Add event listeners
        const addCustomerLink = document.querySelector('.nav-item[onclick="showAddCustomer()"]');
        if (addCustomerLink) {
            addCustomerLink.addEventListener('click', (e) => {
                e.preventDefault();
                showAddCustomer();
            });
        } else {
            console.warn('Add customer link not found. Add customer functionality will be disabled.');
        }

        const customerForm = document.getElementById('customerForm');
        if (customerForm) {
            customerForm.addEventListener('submit', handleFormSubmit);
        } else {
            console.warn('Customer form not found. Form submission will be disabled.');
        }

        // Load initial customer list
        await refreshCustomerList();
    } catch (error) {
        console.error('Error initializing application:', error);
        // Show error to user
        alert('Error initializing application. Please refresh the page.');
    }
}

// Start initialization when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeUI);
} else {
    initializeUI();
}

// Debounce function for search
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Search handler
async function handleSearch(event) {
    const query = event.target.value.trim();
    const customers = query ? await searchCustomers(query) : await getAllCustomers();
    displayCustomers(customers);
}

// Display customers in the list
function displayCustomers(customers) {
    const customerList = document.getElementById('customerList');
    customerList.innerHTML = '';

    customers.forEach(customer => {
        const card = createCustomerCard(customer);
        card.addEventListener('click', () => {
            loadCustomerData(customer);
        });
        customerList.appendChild(card);
    });
}

// Show customer detail view
async function showCustomerDetail(customerId) {
    currentCustomerId = customerId;
    isEditing = true;
    hasUnsavedChanges = false;

    const customer = await getCustomer(customerId);
    const detailView = document.getElementById('customerDetail');
    
    // Fill in basic info
    Object.keys(customer).forEach(key => {
        const element = document.getElementById(key);
        if (element) {
            if (element.type === 'checkbox') {
                element.checked = customer[key];
            } else {
                element.value = customer[key];
            }
        }
    });

    // Load followups
    await refreshFollowups(customerId);

    // Show detail view
    detailView.classList.add('active');
    showTab('basic');
}

// Show add customer view
function showAddCustomer() {
    currentCustomerId = null;
    isEditing = false;
    hasUnsavedChanges = false;

    // Clear all fields
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        if (input.type === 'checkbox') {
            input.checked = false;
        } else {
            input.value = '';
        }
    });

    // Clear followups if timeline exists
    const timeline = document.getElementById('followupTimeline');
    if (timeline) {
        timeline.innerHTML = '';
    }

    // Show detail view
    const detailView = document.getElementById('customerDetail');
    detailView.classList.add('active');
    showTab('basic');
}

// Handle back button
function handleBack() {
    if (hasUnsavedChanges) {
        if (confirm('您有未儲存的更改，確定要離開嗎？')) {
            hasUnsavedChanges = false;
            showCustomers();
        }
    } else {
        showCustomers();
    }
}

// Save customer data
async function saveCustomer() {
    try {
        // Validate form
        const errors = FormGenerator.validateForm();
        if (errors.length > 0) {
            alert(errors.join('\n'));
            return;
        }

        // Get form data using FormGenerator
        const formData = FormGenerator.getFormData();
        
        // Create customer object
        const customer = new Customer(formData);
        
        // Validate customer data
        const validationErrors = customer.validate();
        if (validationErrors.length > 0) {
            alert(validationErrors.join('\n'));
            return;
        }

        if (isEditing) {
            await updateCustomer(currentCustomerId, customer);
        } else {
            await addCustomer(customer);
        }

        // Save followup if entered
        const followupPlan = document.getElementById('followupPlan')?.value;
        const followupDate = document.getElementById('followupDate')?.value;
        const followupFeedback = document.getElementById('followupFeedback')?.value;

        if (followupPlan && followupDate) {
            const followup = new Followup({
                customerId: currentCustomerId,
                plan: followupPlan,
                date: followupDate,
                feedback: followupFeedback
            });

            const followupErrors = followup.validate();
            if (followupErrors.length > 0) {
                alert(followupErrors.join('\n'));
                return;
            }

            await addFollowup(followup);
        }

        // Reset unsaved changes flag
        hasUnsavedChanges = false;

        // Refresh UI
        await refreshCustomerList();
        showCustomers();
    } catch (error) {
        console.error('Error saving customer:', error);
        alert('儲存失敗，請稍後再試');
    }
}

// Refresh customer list
async function refreshCustomerList() {
    const customers = await getAllCustomers();
    displayCustomers(customers);
}

// Refresh followups for a customer
async function refreshFollowups(customerId) {
    const followups = await getCustomerFollowups(customerId);
    displayFollowups(followups);
}

// Display followups in timeline
function displayFollowups(followups) {
    const timeline = document.getElementById('followupTimeline');
    timeline.innerHTML = '';

    followups.forEach(followup => {
        const item = document.createElement('div');
        item.className = 'timeline-item';

        const date = document.createElement('div');
        date.className = 'timeline-date';
        date.textContent = new Date(followup.date).toLocaleDateString();

        const content = document.createElement('div');
        content.className = 'timeline-content';
        content.textContent = followup.plan;

        if (followup.feedback) {
            const feedback = document.createElement('div');
            feedback.className = 'timeline-feedback';
            feedback.textContent = followup.feedback;
            content.appendChild(feedback);
        }

        item.appendChild(date);
        item.appendChild(content);
        timeline.appendChild(item);
    });
}

// Show customers list view
async function showCustomers() {
    document.getElementById('customerDetail').classList.remove('active');
    await refreshCustomerList();
}

// Show followups view
async function showFollowUps() {
    const followups = await getAllFollowups();
    // Group followups by date
    const followupsByDate = followups.reduce((acc, followup) => {
        const date = new Date(followup.date).toLocaleDateString();
        if (!acc[date]) acc[date] = [];
        acc[date].push(followup);
        return acc;
    }, {});

    const customerList = document.getElementById('customerList');
    customerList.innerHTML = '';

    // Create a card for each date
    for (const [date, dateFollowups] of Object.entries(followupsByDate)) {
        const card = document.createElement('div');
        card.className = 'customer-card';

        const dateHeader = document.createElement('div');
        dateHeader.className = 'customer-name';
        dateHeader.textContent = date;

        const followupsList = document.createElement('div');
        followupsList.className = 'customer-info';

        // Process all followups for this date
        const followupItems = await Promise.all(dateFollowups.map(async followup => {
            const followupItem = document.createElement('div');
            followupItem.style.marginBottom = '8px';
            
            let customerName = '未命名';
            if (followup.customerId) {
                try {
                    const customer = await getCustomer(followup.customerId);
                    if (customer && customer.name) {
                        customerName = customer.name;
                    }
                } catch (error) {
                    console.warn('Error fetching customer:', error);
                }
            }
            
            followupItem.innerHTML = `
                <strong>${customerName}</strong>: ${followup.plan}
                ${followup.feedback ? `<div class="timeline-feedback">${followup.feedback}</div>` : ''}
            `;
            return followupItem;
        }));

        followupsList.append(...followupItems);
        card.appendChild(dateHeader);
        card.appendChild(followupsList);
        customerList.appendChild(card);
    }
}

// Tab switching
function showTab(tabName) {
    // Hide all sections
    document.querySelectorAll('.form-section').forEach(section => {
        section.classList.remove('active');
    });

    // Show selected section
    document.getElementById(`${tabName}Section`).classList.add('active');

    // Update tab styling
    document.querySelectorAll('.form-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`.form-tab[onclick="showTab('${tabName}')"]`).classList.add('active');
}

// Load customer data into form
function loadCustomerData(customer) {
    FormGenerator.loadData(customer);
}

// Get form data
function getFormData() {
    return {
        name: document.getElementById('name').value,
        phone: document.getElementById('phone').value,
        line: document.getElementById('line').value,
        fb: document.getElementById('fb').value,
        ig: document.getElementById('ig').value,
        address: document.getElementById('address').value,
        age: document.getElementById('age').value,
        gender: document.getElementById('gender').value,
        howMet: document.getElementById('howMet').value,
        personality: document.getElementById('personality').value,
        familyStatus: document.getElementById('familyStatus').value,
        children: document.getElementById('children').value,
        occupation: document.getElementById('occupation').value,
        leisure: document.getElementById('leisure').value,
        financialStatus: document.getElementById('financialStatus').value,
        healthStatus: document.getElementById('healthStatus').value,
        futureExpectations: document.getElementById('futureExpectations').value,
        
        // FORM evaluation
        formF: document.getElementById('formF').value,
        formO: document.getElementById('formO').value,
        formR: document.getElementById('formR').value,
        formM: document.getElementById('formM').value,

        // Needs analysis
        needWeightLoss: document.getElementById('needWeightLoss').checked,
        needSkincare: document.getElementById('needSkincare').checked,
        needHealth: document.getElementById('needHealth').checked,
        needIncome: document.getElementById('needIncome').checked,
        needPassiveIncome: document.getElementById('needPassiveIncome').checked
    };
}

// Display customer card
function createCustomerCard(customer) {
    const card = document.createElement('div');
    card.className = 'customer-card';
    
    const name = document.createElement('h3');
    name.textContent = customer.name;
    card.appendChild(name);
    
    // Get first available contact method
    const contact = customer.phone || customer.line || customer.fb || customer.ig;
    if (contact) {
        const contactInfo = document.createElement('p');
        contactInfo.textContent = contact;
        card.appendChild(contactInfo);
    }
    
    const address = document.createElement('p');
    address.textContent = customer.address;
    card.appendChild(address);
    
    return card;
}

// Handle form submission
async function handleFormSubmit(event) {
    event.preventDefault();
    
    // Validate form
    const errors = FormGenerator.validateForm();
    if (errors.length > 0) {
        alert(errors.join('\n'));
        return;
    }
    
    // Get form data
    const formData = FormGenerator.getFormData();
    
    // Create customer
    const customer = new Customer(formData);
    
    try {
        await db.addCustomer(customer);
        loadCustomers();
        event.target.reset();
    } catch (error) {
        alert('Error adding customer: ' + error.message);
    }
}

// Load all customers
async function loadCustomers() {
    try {
        const customers = await db.getAllCustomers();
        const container = document.getElementById('customerList');
        container.innerHTML = '';
        
        customers.forEach(customer => {
            const card = createCustomerCard(customer);
            card.addEventListener('click', () => {
                loadCustomerData(customer);
            });
            container.appendChild(card);
        });
    } catch (error) {
        alert('Error loading customers: ' + error.message);
    }
}

// Handle add customer button click
function handleAddCustomer() {
    document.getElementById('customerForm').reset();
}
