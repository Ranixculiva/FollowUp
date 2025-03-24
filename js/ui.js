// UI State
let currentCustomerId = null;
let isEditing = false;
let hasUnsavedChanges = false;

// Initialize UI
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Initialize database first
        await initDB();
        
        // Set up search handler
        const searchBar = document.querySelector('.search-bar');
        searchBar.addEventListener('input', debounce(handleSearch, 300));

        // Set up form change tracking
        const formInputs = document.querySelectorAll('input, select, textarea');
        formInputs.forEach(input => {
            input.addEventListener('change', () => {
                hasUnsavedChanges = true;
            });
        });

        // Load initial customer list
        await refreshCustomerList();
    } catch (error) {
        console.error('Error initializing application:', error);
        // Show error to user
        alert('Error initializing application. Please refresh the page.');
    }
});

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
        const card = document.createElement('div');
        card.className = 'customer-card';
        card.onclick = () => showCustomerDetail(customer.id);

        const name = document.createElement('div');
        name.className = 'customer-name';
        name.textContent = customer.name || '未命名';

        const info = document.createElement('div');
        info.className = 'customer-info';
        info.textContent = [
            customer.contact,
            customer.address,
            `FORM分數: ${calculateFormScore(customer)}`
        ].filter(Boolean).join(' | ');

        card.appendChild(name);
        card.appendChild(info);
        customerList.appendChild(card);
    });
}

// Calculate FORM score
function calculateFormScore(customer) {
    const scores = ['formF', 'formO', 'formR', 'formM']
        .map(key => parseInt(customer[key] || 0));
    return scores.reduce((a, b) => a + b, 0);
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

    // Update FORM scores
    updateScore();

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

    // Clear followups
    document.getElementById('followupTimeline').innerHTML = '';

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
    const customerData = {
        name: document.getElementById('name').value,
        contact: document.getElementById('contact').value,
        address: document.getElementById('address').value,
        ageGender: document.getElementById('ageGender').value,
        howMet: document.getElementById('howMet').value,
        familyStatus: document.getElementById('familyStatus').value,
        children: document.getElementById('children').value,
        occupation: document.getElementById('occupation').value,
        leisure: document.getElementById('leisure').value,
        financialStatus: document.getElementById('financialStatus').value,
        healthStatus: document.getElementById('healthStatus').value,
        futureExpectations: document.getElementById('futureExpectations').value,
        formF: document.getElementById('formF').value,
        formO: document.getElementById('formO').value,
        formR: document.getElementById('formR').value,
        formM: document.getElementById('formM').value,
        needWeightLoss: document.getElementById('needWeightLoss').checked,
        needSkincare: document.getElementById('needSkincare').checked,
        needHealth: document.getElementById('needHealth').checked,
        needIncome: document.getElementById('needIncome').checked,
        needPassiveIncome: document.getElementById('needPassiveIncome').checked
    };

    try {
        if (isEditing) {
            await updateCustomer(currentCustomerId, customerData);
        } else {
            await addCustomer(customerData);
        }

        // Save followup if entered
        const followupPlan = document.getElementById('followupPlan').value;
        const followupDate = document.getElementById('followupDate').value;
        const followupFeedback = document.getElementById('followupFeedback').value;

        if (followupPlan && followupDate) {
            await addFollowup({
                customerId: currentCustomerId,
                plan: followupPlan,
                date: followupDate,
                feedback: followupFeedback
            });
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
function showCustomers() {
    document.getElementById('customerDetail').classList.remove('active');
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
    Object.entries(followupsByDate).forEach(([date, dateFollowups]) => {
        const card = document.createElement('div');
        card.className = 'customer-card';

        const dateHeader = document.createElement('div');
        dateHeader.className = 'customer-name';
        dateHeader.textContent = date;

        const followupsList = document.createElement('div');
        followupsList.className = 'customer-info';

        dateFollowups.forEach(async followup => {
            const customer = await getCustomer(followup.customerId);
            const followupItem = document.createElement('div');
            followupItem.style.marginBottom = '8px';
            followupItem.innerHTML = `
                <strong>${customer?.name || '未命名'}</strong>: ${followup.plan}
                ${followup.feedback ? `<div class="timeline-feedback">${followup.feedback}</div>` : ''}
            `;
            followupsList.appendChild(followupItem);
        });

        card.appendChild(dateHeader);
        card.appendChild(followupsList);
        customerList.appendChild(card);
    });
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

// Update FORM scores
function updateScore() {
    ['F', 'O', 'R', 'M'].forEach(letter => {
        const score = document.getElementById(`form${letter}`).value;
        document.getElementById(`form${letter}Score`).textContent = score;
    });
}

// Load customer data into form
function loadCustomerData(customer) {
    document.getElementById('name').value = customer.name || '';
    document.getElementById('phone').value = customer.phone || '';
    document.getElementById('line').value = customer.line || '';
    document.getElementById('fb').value = customer.fb || '';
    document.getElementById('ig').value = customer.ig || '';
    document.getElementById('address').value = customer.address || '';
    document.getElementById('age').value = customer.age || '';
    document.getElementById('gender').value = customer.gender || '';
    document.getElementById('howMet').value = customer.howMet || '';
    document.getElementById('personality').value = customer.personality || '';
    document.getElementById('familyStatus').value = customer.familyStatus || '';
    document.getElementById('children').value = customer.children || '';
    document.getElementById('occupation').value = customer.occupation || '';
    document.getElementById('leisure').value = customer.leisure || '';
    document.getElementById('financialStatus').value = customer.financialStatus || '';
    document.getElementById('healthStatus').value = customer.healthStatus || '';
    document.getElementById('futureExpectations').value = customer.futureExpectations || '';
    
    // FORM evaluation
    document.getElementById('formF').value = customer.formF || '0';
    document.getElementById('formO').value = customer.formO || '0';
    document.getElementById('formR').value = customer.formR || '0';
    document.getElementById('formM').value = customer.formM || '0';

    // Needs analysis
    document.getElementById('needWeightLoss').checked = customer.needWeightLoss || false;
    document.getElementById('needSkincare').checked = customer.needSkincare || false;
    document.getElementById('needHealth').checked = customer.needHealth || false;
    document.getElementById('needIncome').checked = customer.needIncome || false;
    document.getElementById('needPassiveIncome').checked = customer.needPassiveIncome || false;
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
    card.onclick = () => showCustomerDetail(customer.id);

    const contact = customer.phone || customer.line || customer.fb || customer.ig;
    card.innerHTML = `
        <div class="customer-name">${customer.name}</div>
        <div class="customer-contact">${contact || '無聯絡方式'}</div>
        <div class="customer-address">${customer.address || '無地址'}</div>
        <div class="customer-form-score">FORM: ${customer.calculateFormScore()}</div>
    `;

    return card;
}
