function initUI() {
    // Initialize based on current page
    if (document.querySelector('.customer-list')) {
        showCustomers();
        initSearchBar();
    } else if (document.getElementById('customerDetail')) {
        const urlParams = new URLSearchParams(window.location.search);
        const customerId = urlParams.get('id');
        if (customerId) {
            loadCustomerDetail(customerId);
        }
    }
}

function initSearchBar() {
    const searchBar = document.querySelector('.search-bar');
    if (searchBar) {
        searchBar.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            filterCustomers(searchTerm);
        });
    }
}

function filterCustomers(searchTerm) {
    getCustomers(customers => {
        const filtered = customers.filter(customer => 
            customer.name?.toLowerCase().includes(searchTerm) ||
            customer.phone?.toLowerCase().includes(searchTerm)
        );
        displayCustomers(filtered);
    });
}

function displayCustomers(customers) {
    const customerList = document.getElementById('customerList');
    if (!customerList) return;

    customerList.innerHTML = '';
    customers.forEach(customer => {
        const card = document.createElement('div');
        card.className = 'customer-card';
        card.innerHTML = `
            <h3>${customer.name || '未命名'}</h3>
            <p>${customer.phone || '無電話'}</p>
        `;
        card.onclick = () => window.location.href = `customer-detail.html?id=${customer.id}`;
        customerList.appendChild(card);
    });
}

function showTab(tabName) {
    document.querySelectorAll('.form-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.form-section').forEach(section => section.classList.remove('active'));
    
    document.querySelector(`.form-tab[onclick="showTab('${tabName}')"]`).classList.add('active');
    document.getElementById(`${tabName}Section`).classList.add('active');
}

function loadCustomerDetail(id) {
    getCustomer(id, customer => {
        if (customer) {
            document.getElementById('name').value = customer.name || '';
            document.getElementById('contact').value = customer.contact || '';
            document.getElementById('address').value = customer.address || '';
            document.getElementById('familyStatus').value = customer.familyStatus || '';
            document.getElementById('children').value = customer.children || '';
            document.getElementById('formF').value = customer.formF || '0';
            document.getElementById('formO').value = customer.formO || '0';
            document.getElementById('formR').value = customer.formR || '0';
            document.getElementById('formM').value = customer.formM || '0';
            
            loadFollowups(id);
        }
    });
}

function displayFollowups(followups) {
    const timeline = document.getElementById('followupTimeline');
    if (!timeline) return;

    timeline.innerHTML = '';
    followups
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .forEach(followup => {
            const item = document.createElement('div');
            item.className = 'timeline-item';
            item.innerHTML = `
                <div><strong>${followup.date}</strong></div>
                <div>${followup.plan}</div>
            `;
            timeline.appendChild(item);
        });
}

function saveCustomer() {
    const customer = {
        name: document.getElementById('name').value,
        contact: document.getElementById('contact').value,
        address: document.getElementById('address').value,
        familyStatus: document.getElementById('familyStatus').value,
        children: document.getElementById('children').value,
        formF: document.getElementById('formF').value,
        formO: document.getElementById('formO').value,
        formR: document.getElementById('formR').value,
        formM: document.getElementById('formM').value
    };

    const followup = {
        plan: document.getElementById('followupPlan').value,
        date: document.getElementById('followupDate').value
    };

    saveCustomer(customer, followup, () => {
        window.location.href = 'index.html';
    });
}
