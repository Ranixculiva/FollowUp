// UI State
let currentCustomerId = null;
let isEditing = false;
let hasUnsavedChanges = false;
const LIST_PREFS_KEY = 'followup_list_prefs';

let showOnlyStep2 = false;
let countryFilter = '';
let sortField = 'updated';
let sortDir = 'desc';
let listPanelOpen = false;
let listViewMode = 'customers';
let followupSortField = 'discussionDate';
let followupSortDir = 'desc';

const SORT_FIELD_LABELS = {
    updated: 'sort.updated',
    created: 'sort.created',
    lastContact: 'sort.lastContact',
    name: 'sort.name',
    steam: 'sort.steam'
};

const FOLLOWUP_SORT_FIELD_LABELS = {
    discussionDate: 'followup.sort.discussionDate',
    followupDate: 'followup.sort.actionDate'
};

function getSortFieldLabel(field) {
    const key = SORT_FIELD_LABELS[field];
    return key ? t(key) : field;
}

function getFollowupSortFieldLabel(field) {
    const key = FOLLOWUP_SORT_FIELD_LABELS[field];
    return key ? t(key) : field;
}

function loadListPrefs() {
    try {
        const raw = localStorage.getItem(LIST_PREFS_KEY);
        if (!raw) return;
        const prefs = JSON.parse(raw);
        if (typeof prefs.showOnlyStep2 === 'boolean') showOnlyStep2 = prefs.showOnlyStep2;
        if (typeof prefs.countryFilter === 'string') countryFilter = prefs.countryFilter;
        if (prefs.sortField && SORT_FIELD_LABELS[prefs.sortField]) sortField = prefs.sortField;
        if (prefs.sortDir === 'asc' || prefs.sortDir === 'desc') sortDir = prefs.sortDir;
        if (prefs.followupSortField && FOLLOWUP_SORT_FIELD_LABELS[prefs.followupSortField]) {
            followupSortField = prefs.followupSortField;
        }
        if (prefs.followupSortDir === 'asc' || prefs.followupSortDir === 'desc') {
            followupSortDir = prefs.followupSortDir;
        }
        if (typeof prefs.listPanelOpen === 'boolean') listPanelOpen = prefs.listPanelOpen;
    } catch (error) {
        console.warn('Could not load list preferences', error);
    }
}

function saveListPrefs() {
    try {
        localStorage.setItem(LIST_PREFS_KEY, JSON.stringify({
            showOnlyStep2,
            countryFilter,
            sortField,
            sortDir,
            followupSortField,
            followupSortDir,
            listPanelOpen
        }));
    } catch (error) {
        console.warn('Could not save list preferences', error);
    }
}

function hasNonDefaultSort() {
    return sortField !== 'updated' || sortDir !== 'desc';
}

function hasActiveListFilters() {
    return showOnlyStep2 || Boolean(countryFilter);
}

function hasNonDefaultFollowupSort() {
    return followupSortField !== 'discussionDate' || followupSortDir !== 'desc';
}

function hasActiveListControls() {
    if (listViewMode === 'followups') {
        return hasNonDefaultFollowupSort();
    }
    return hasActiveListFilters() || hasNonDefaultSort();
}

// Initialize UI
async function initializeUI() {
    try {
        await I18n.init();

        // Initialize database first
        await initDB();
        
        // Load country list (offline fallback, optional online refresh)
        await Countries.init();

        // Initialize form
        const formContainer = document.getElementById('customerForm');
        if (!formContainer) {
            throw new Error('Customer form container not found');
        }
        FormGenerator.generateForm('customerForm');

        loadListPrefs();
        const listViewSticky = document.getElementById('listViewSticky');
        if (listViewSticky) {
            listViewSticky.appendChild(createListToolbar());
        } else {
            document.querySelector('.container').insertBefore(
                createListToolbar(),
                document.querySelector('.customer-list')
            );
        }
        syncListToolbarUI();

        I18n.onLocaleChange(() => {
            refreshLocalizedUI();
        });
        
    // Set up search handler
    const searchBar = document.querySelector('.search-bar');
        if (searchBar) {
    searchBar.addEventListener('input', debounce(handleSearch, 300));
        } else {
            console.warn('Search bar element not found. Search functionality will be disabled.');
        }

        // Set up form change tracking and STEAM score calculation
        bindCustomerFormListeners();

        // Initial setup of Step2 tab visibility
        const isStep2Input = document.getElementById('isStep2');
        if (isStep2Input) {
            toggleStep2TabVisibility(isStep2Input.checked);
        }

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
        const message = (typeof I18n !== 'undefined' && I18n.hasTranslation('error.initFailed'))
            ? t('error.initFailed')
            : '初始化失敗，請重新整理頁面';
        alert(message);
    }
}

function bindCustomerFormListeners() {
    document.querySelectorAll('#customerForm input, #customerForm select, #customerForm textarea').forEach(input => {
        input.addEventListener('change', () => {
            hasUnsavedChanges = true;
            if (input.id.startsWith('steam') || input.id === 'onlineSales' || input.id === 'connections') {
                calculateSteamScore();
            }
            if (input.id === 'isStep2') {
                toggleStep2TabVisibility(input.checked);
            }
        });
    });
}

async function refreshLocalizedUI() {
    rebuildListToolbar();
    I18n.applyDomI18n();
    Countries.refreshAllSelects();

    const formContainer = document.getElementById('customerForm');
    if (!formContainer) {
        return;
    }

    const savedId = currentCustomerId;
    const wasEditing = isEditing;
    FormGenerator.generateForm('customerForm');
    bindCustomerFormListeners();

    if (wasEditing && savedId) {
        const customer = await getCustomer(savedId);
        if (customer) {
            FormGenerator.loadData(customer);
            document.querySelector('.customer-title').textContent = customer.name || t('customer.unnamed');
        }
    } else if (wasEditing) {
        document.querySelector('.customer-title').textContent = t('nav.addCustomer');
    }

    const isStep2Input = document.getElementById('isStep2');
    if (isStep2Input) {
        toggleStep2TabVisibility(isStep2Input.checked);
    }
}

function rebuildListToolbar() {
    const existing = document.getElementById('listToolbar');
    if (existing) {
        existing.remove();
    }

    const listViewSticky = document.getElementById('listViewSticky');
    const toolbar = createListToolbar();
    if (listViewSticky) {
        listViewSticky.appendChild(toolbar);
    } else {
        const customerList = document.querySelector('.customer-list');
        document.querySelector('.container').insertBefore(toolbar, customerList);
    }

    syncListToolbarUI();
    refreshListView();
}

async function refreshListView() {
    if (listViewMode === 'followups') {
        await renderFollowUpList();
        return;
    }
    await refreshCustomerList();
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

function createListToolbar() {
    const toolbar = document.createElement('div');
    toolbar.className = 'list-toolbar';
    toolbar.id = 'listToolbar';

    const header = document.createElement('div');
    header.className = 'toolbar-header';

    const toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.className = 'toolbar-toggle';
    toggleBtn.id = 'toolbarToggle';
    toggleBtn.setAttribute('aria-controls', 'toolbarPanel');
    toggleBtn.setAttribute('aria-expanded', 'false');
    const toggleIcon = document.createElement('span');
    toggleIcon.className = 'material-icons toolbar-toggle-icon';
    toggleIcon.textContent = 'expand_more';
    toggleBtn.appendChild(toggleIcon);
    const toggleLabel = document.createElement('span');
    toggleLabel.id = 'toolbarToggleLabel';
    toggleLabel.textContent = t('toolbar.filterSort');
    toggleBtn.appendChild(document.createTextNode(' '));
    toggleBtn.appendChild(toggleLabel);
    toggleBtn.addEventListener('click', () => {
        listPanelOpen = !listPanelOpen;
        syncListToolbarUI();
        saveListPrefs();
    });
    header.appendChild(toggleBtn);

    const summary = document.createElement('span');
    summary.className = 'toolbar-summary';
    summary.id = 'toolbarSummary';
    header.appendChild(summary);

    const clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.className = 'toolbar-clear';
    clearBtn.id = 'toolbarClear';
    clearBtn.textContent = t('toolbar.clear');
    clearBtn.addEventListener('click', clearListControls);
    header.appendChild(clearBtn);

    toolbar.appendChild(header);

    const panel = document.createElement('div');
    panel.className = 'toolbar-panel';
    panel.id = 'toolbarPanel';

    const filterSection = document.createElement('div');
    filterSection.className = 'toolbar-section toolbar-section-customers';
    const filterHeading = document.createElement('span');
    filterHeading.className = 'toolbar-heading';
    filterHeading.textContent = t('toolbar.filter');
    filterSection.appendChild(filterHeading);

    const filterRow = document.createElement('div');
    filterRow.className = 'toolbar-row';

    const step2Chip = document.createElement('label');
    step2Chip.className = 'toolbar-chip';
    const step2Input = document.createElement('input');
    step2Input.type = 'checkbox';
    step2Input.id = 'filterStep2';
    step2Input.addEventListener('change', () => {
        showOnlyStep2 = step2Input.checked;
        saveListPrefs();
        updateToolbarSummary();
        refreshListView();
    });
    step2Chip.appendChild(step2Input);
    step2Chip.appendChild(document.createTextNode(` ${t('toolbar.step2Only')}`));
    filterRow.appendChild(step2Chip);

    const countryField = document.createElement('div');
    countryField.className = 'toolbar-field toolbar-field-grow';
    const countryLabel = document.createElement('label');
    countryLabel.htmlFor = 'filterCountry';
    countryLabel.textContent = t('toolbar.country');
    const countrySelect = document.createElement('select');
    countrySelect.id = 'filterCountry';
    countrySelect.className = 'toolbar-select';
    countrySelect.innerHTML = `<option value="">${t('toolbar.allCountries')}</option>`;
    countrySelect.addEventListener('change', () => {
        countryFilter = countrySelect.value;
        saveListPrefs();
        updateToolbarSummary();
        refreshListView();
    });
    countryField.appendChild(countryLabel);
    countryField.appendChild(countrySelect);
    filterRow.appendChild(countryField);
    filterSection.appendChild(filterRow);
    panel.appendChild(filterSection);

    const sortSection = document.createElement('div');
    sortSection.className = 'toolbar-section toolbar-section-customers';
    const sortHeading = document.createElement('span');
    sortHeading.className = 'toolbar-heading';
    sortHeading.textContent = t('toolbar.sort');
    sortSection.appendChild(sortHeading);

    const sortRow = document.createElement('div');
    sortRow.className = 'toolbar-row toolbar-sort-row';

    const sortSelect = document.createElement('select');
    sortSelect.id = 'sortField';
    sortSelect.className = 'toolbar-select toolbar-field-grow';
    sortSelect.setAttribute('aria-label', t('toolbar.sortFieldAria'));
    Object.keys(SORT_FIELD_LABELS).forEach((value) => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = getSortFieldLabel(value);
        sortSelect.appendChild(option);
    });
    sortSelect.addEventListener('change', () => {
        sortField = sortSelect.value;
        saveListPrefs();
        syncListToolbarUI();
        refreshListView();
    });
    sortRow.appendChild(sortSelect);

    const sortDirBtn = document.createElement('button');
    sortDirBtn.type = 'button';
    sortDirBtn.id = 'sortDirBtn';
    sortDirBtn.className = 'toolbar-icon-btn';
    sortDirBtn.addEventListener('click', () => {
        sortDir = sortDir === 'desc' ? 'asc' : 'desc';
        saveListPrefs();
        syncListToolbarUI();
        refreshListView();
    });
    sortRow.appendChild(sortDirBtn);
    sortSection.appendChild(sortRow);
    panel.appendChild(sortSection);

    const followupSortSection = document.createElement('div');
    followupSortSection.className = 'toolbar-section toolbar-section-followups';
    followupSortSection.hidden = true;

    const followupSortHeading = document.createElement('span');
    followupSortHeading.className = 'toolbar-heading';
    followupSortHeading.textContent = t('toolbar.sort');
    followupSortSection.appendChild(followupSortHeading);

    const followupSortRow = document.createElement('div');
    followupSortRow.className = 'toolbar-row toolbar-sort-row';

    const followupSortSelect = document.createElement('select');
    followupSortSelect.id = 'followupSortField';
    followupSortSelect.className = 'toolbar-select toolbar-field-grow';
    followupSortSelect.setAttribute('aria-label', t('toolbar.sortFieldAria'));
    Object.keys(FOLLOWUP_SORT_FIELD_LABELS).forEach((value) => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = getFollowupSortFieldLabel(value);
        followupSortSelect.appendChild(option);
    });
    followupSortSelect.addEventListener('change', () => {
        followupSortField = followupSortSelect.value;
        saveListPrefs();
        syncListToolbarUI();
        refreshListView();
    });
    followupSortRow.appendChild(followupSortSelect);

    const followupSortDirBtn = document.createElement('button');
    followupSortDirBtn.type = 'button';
    followupSortDirBtn.id = 'followupSortDirBtn';
    followupSortDirBtn.className = 'toolbar-icon-btn';
    followupSortDirBtn.addEventListener('click', () => {
        followupSortDir = followupSortDir === 'desc' ? 'asc' : 'desc';
        saveListPrefs();
        syncListToolbarUI();
        refreshListView();
    });
    followupSortRow.appendChild(followupSortDirBtn);
    followupSortSection.appendChild(followupSortRow);
    panel.appendChild(followupSortSection);

    toolbar.appendChild(panel);
    return toolbar;
}

function syncListToolbarUI() {
    const panel = document.getElementById('toolbarPanel');
    const toggle = document.getElementById('toolbarToggle');
    const toggleIcon = toggle?.querySelector('.toolbar-toggle-icon');
    const toggleLabel = document.getElementById('toolbarToggleLabel');
    const step2 = document.getElementById('filterStep2');
    const country = document.getElementById('filterCountry');
    const sortSelect = document.getElementById('sortField');
    const sortDirBtn = document.getElementById('sortDirBtn');
    const followupSortSelect = document.getElementById('followupSortField');
    const followupSortDirBtn = document.getElementById('followupSortDirBtn');
    const isFollowups = listViewMode === 'followups';

    document.querySelectorAll('.toolbar-section-customers').forEach((section) => {
        section.classList.toggle('is-hidden', isFollowups);
        section.hidden = isFollowups;
    });
    document.querySelectorAll('.toolbar-section-followups').forEach((section) => {
        section.classList.toggle('is-hidden', !isFollowups);
        section.hidden = !isFollowups;
    });

    if (panel) {
        panel.classList.toggle('is-open', listPanelOpen);
    }
    if (toggle) {
        toggle.setAttribute('aria-expanded', String(listPanelOpen));
    }
    if (toggleIcon) {
        toggleIcon.textContent = listPanelOpen ? 'expand_less' : 'expand_more';
    }
    if (toggleLabel) {
        toggleLabel.textContent = isFollowups ? t('followup.sort.toolbar') : t('toolbar.filterSort');
    }
    if (step2) step2.checked = showOnlyStep2;
    if (country && country.value !== countryFilter) country.value = countryFilter;
    if (sortSelect) sortSelect.value = sortField;
    if (sortDirBtn) {
        const icon = sortDirBtn.querySelector('.material-icons') || document.createElement('span');
        icon.className = 'material-icons';
        icon.textContent = sortDir === 'desc' ? 'arrow_downward' : 'arrow_upward';
        if (!sortDirBtn.querySelector('.material-icons')) {
            sortDirBtn.appendChild(icon);
        }
        sortDirBtn.setAttribute(
            'aria-label',
            sortDir === 'desc' ? t('sort.desc') : t('sort.asc')
        );
    }
    if (followupSortSelect) followupSortSelect.value = followupSortField;
    if (followupSortDirBtn) {
        const icon = followupSortDirBtn.querySelector('.material-icons') || document.createElement('span');
        icon.className = 'material-icons';
        icon.textContent = followupSortDir === 'desc' ? 'arrow_downward' : 'arrow_upward';
        if (!followupSortDirBtn.querySelector('.material-icons')) {
            followupSortDirBtn.appendChild(icon);
        }
        followupSortDirBtn.setAttribute(
            'aria-label',
            followupSortDir === 'desc' ? t('sort.desc') : t('sort.asc')
        );
    }

    updateToolbarSummary();
}

function updateToolbarSummary() {
    const summary = document.getElementById('toolbarSummary');
    const clearBtn = document.getElementById('toolbarClear');
    if (!summary) return;

    const parts = [];

    if (listViewMode === 'followups') {
        if (hasNonDefaultFollowupSort()) {
            const arrow = followupSortDir === 'desc' ? '↓' : '↑';
            parts.push(`${getFollowupSortFieldLabel(followupSortField)} ${arrow}`);
        }
    } else {
        if (hasActiveListFilters()) {
            const filters = [];
            if (showOnlyStep2) filters.push('Step 2');
            if (countryFilter) filters.push(Countries.getDisplayLabelForValue(countryFilter));
            parts.push(filters.join(' · '));
        }
        if (hasNonDefaultSort()) {
            const arrow = sortDir === 'desc' ? '↓' : '↑';
            parts.push(`${getSortFieldLabel(sortField)} ${arrow}`);
        }
    }

    summary.textContent = parts.join(' · ');
    if (clearBtn) {
        clearBtn.hidden = !hasActiveListControls();
    }
}

function clearListControls() {
    if (listViewMode === 'followups') {
        followupSortField = 'discussionDate';
        followupSortDir = 'desc';
    } else {
        showOnlyStep2 = false;
        countryFilter = '';
        sortField = 'updated';
        sortDir = 'desc';
    }
    saveListPrefs();
    syncListToolbarUI();
    refreshListView();
}

function getCountriesInUse(customers) {
    const countries = new Set();
    customers.forEach(customer => {
        if (customer.country) {
            countries.add(customer.country);
        }
    });
    return window.Countries
        ? Countries.orderLabels([...countries])
        : [...countries].sort((a, b) => a.localeCompare(b, 'zh-Hant'));
}

async function updateCountryFilterOptions(customers) {
    const select = document.getElementById('filterCountry');
    if (!select) {
        return;
    }

    const countries = getCountriesInUse(customers);
    const previous = countryFilter || select.value;

    select.innerHTML = `<option value="">${t('toolbar.allCountries')}</option>`;
    countries.forEach(country => {
        const option = document.createElement('option');
        option.value = country;
        option.textContent = Countries.getDisplayLabelForValue(country);
        select.appendChild(option);
    });

    if (previous && !countries.includes(previous)) {
        const legacy = document.createElement('option');
        legacy.value = previous;
        legacy.textContent = Countries.getDisplayLabelForValue(previous);
        select.appendChild(legacy);
    }

    select.value = countries.includes(previous) || previous ? previous : '';
    countryFilter = select.value;
    saveListPrefs();
}

function applyListFilters(customers) {
    if (showOnlyStep2) {
        customers = customers.filter(customer => customer.isStep2);
    }

    if (countryFilter) {
        customers = customers.filter(customer => customer.country === countryFilter);
    }

    return customers;
}

async function getFilteredListCustomers() {
    const searchBar = document.querySelector('.search-bar');
    const query = searchBar?.value.trim();
    let customers = query ? await searchCustomers(query) : await getAllCustomers();
    customers = applyListFilters(customers);
    return sortCustomers(customers);
}

function getDialogCustomerOrder(allCustomers, filteredCustomers) {
    const filteredIds = new Set(filteredCustomers.map(customer => String(customer.id)));
    const remaining = sortCustomers(
        allCustomers.filter(customer => !filteredIds.has(String(customer.id)))
    );
    return [...filteredCustomers, ...remaining];
}

async function getReportCustomers() {
    const useFiltered = document.getElementById('reportUseFilteredList')?.checked;

    if (useFiltered) {
        const customers = await getFilteredListCustomers();
        if (customers.length === 0) {
            throw new Error('EMPTY_FILTERED');
        }
        return customers;
    }

    const selectedCheckboxes = document.querySelectorAll('#reportCustomerList input.report-customer-checkbox:checked');
    const selectedIds = Array.from(selectedCheckboxes).map(cb => cb.value);

    if (selectedIds.length === 0) {
        throw new Error('NONE_SELECTED');
    }

    const allCustomers = await getAllCustomers();
    const filteredCustomers = await getFilteredListCustomers();
    const listOrder = getDialogCustomerOrder(allCustomers, filteredCustomers);
    const selectedIdSet = new Set(selectedIds.map(String));
    const customers = listOrder.filter(customer => selectedIdSet.has(String(customer.id)));

    for (const id of selectedIds) {
        if (!customers.some(customer => String(customer.id) === String(id))) {
            const customer = await getCustomer(id);
            if (customer) {
                customers.push(customer);
            }
        }
    }

    if (customers.length === 0) {
        throw new Error('NONE_SELECTED');
    }

    return customers;
}

function handleReportSelectionError(error) {
    if (error.message === 'EMPTY_FILTERED') {
        alert(t('report.noFilteredCustomers'));
        return;
    }
    if (error.message === 'NONE_SELECTED') {
        alert(t('report.selectAtLeastOne'));
        return;
    }
    throw error;
}

// Search handler
async function handleSearch(event) {
    const query = event.target.value.trim();
    if (listViewMode === 'followups') {
        await renderFollowUpList();
        return;
    }

    const customers = query ? await searchCustomers(query) : await getAllCustomers();
    displayCustomers(customers);
}

// Get STEAM total score from stored value or field values
function getSteamScore(customer) {
    const steamFields = [
        'steamS',
        'steamT',
        'steamE',
        'steamA',
        'steamM',
        'onlineSales',
        'connections'
    ];

    const fromFields = steamFields.reduce((sum, field) => {
        const value = parseInt(customer[field], 10);
        return sum + (isNaN(value) ? 0 : value);
    }, 0);

    if (fromFields > 0) {
        return fromFields;
    }

    const stored = parseInt(customer.totalScore, 10);
    return isNaN(stored) ? 0 : stored;
}

function getSortValue(customer, field) {
    switch (field) {
        case 'name':
            return customer.name || '';
        case 'steam':
            return getSteamScore(customer);
        case 'created':
            return customer.createdAt || '';
        case 'lastContact':
            return customer.lastInviteDate || '';
        case 'updated':
        default:
            return customer.updatedAt || '';
    }
}

function isEmptySortValue(value, field) {
    if (field === 'name') {
        return !String(value).trim();
    }
    if (field === 'steam') {
        return value === 0;
    }
    return !value;
}

function compareSortValues(aVal, bVal, field) {
    if (field === 'name') {
        return String(aVal).localeCompare(String(bVal), 'zh-Hant');
    }
    if (field === 'steam') {
        return aVal - bVal;
    }
    return new Date(aVal).getTime() - new Date(bVal).getTime();
}

function sortCustomers(customers) {
    const sorted = [...customers];
    sorted.sort((a, b) => {
        const aVal = getSortValue(a, sortField);
        const bVal = getSortValue(b, sortField);
        const aEmpty = isEmptySortValue(aVal, sortField);
        const bEmpty = isEmptySortValue(bVal, sortField);

        if (aEmpty && bEmpty) return 0;
        if (aEmpty) return 1;
        if (bEmpty) return -1;

        const cmp = compareSortValues(aVal, bVal, sortField);
        return sortDir === 'asc' ? cmp : -cmp;
    });
    return sorted;
}

// Display customers in the list
function displayCustomers(customers) {
    const customerList = document.getElementById('customerList');
    customerList.innerHTML = '';

    customers = applyListFilters(customers);
    customers = sortCustomers(customers);

    if (customers.length === 0) {
        const empty = document.createElement('p');
        empty.className = 'list-empty';
        empty.textContent = hasActiveListFilters()
            ? t('list.noResults')
            : t('list.empty');
        customerList.appendChild(empty);
        return;
    }

    customers.forEach(customer => {
        const card = createCustomerCard(customer);
        card.addEventListener('click', () => {
            showCustomerDetail(customer.id);
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
    
    // Update customer title
    document.querySelector('.customer-title').textContent = customer.name || t('customer.unnamed');
    
    // Load all customer data using FormGenerator
    FormGenerator.loadData(customer);

    // Update Step2 tab visibility based on loaded data
    toggleStep2TabVisibility(customer.isStep2 || false);

    // Show detail view
    detailView.classList.add('active');
    showTab('basic');
}

// Show add customer view
function showAddCustomer() {
    currentCustomerId = null;
    isEditing = false;
    hasUnsavedChanges = false;

    // Clear customer title
    document.querySelector('.customer-title').textContent = t('nav.addCustomer');

    // Clear form using FormGenerator
    FormGenerator.loadData({});

    // Hide Step2 tab for new customers
    toggleStep2TabVisibility(false);

    // Show detail view
    const detailView = document.getElementById('customerDetail');
    detailView.classList.add('active');
    showTab('basic');
}

// Handle back button
function handleBack() {
    if (hasUnsavedChanges) {
        if (confirm(t('confirm.unsavedLeave'))) {
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

        // Reset unsaved changes flag
        hasUnsavedChanges = false;

        // Refresh UI
        await refreshCustomerList();
        showCustomers();
    } catch (error) {
        console.error('Error saving customer:', error);
        alert(t('error.saveFailed'));
    }
}

// Refresh customer list
async function refreshCustomerList() {
    const customers = await getAllCustomers();
    await updateCountryFilterOptions(customers);
    updateToolbarSummary();

    const searchBar = document.querySelector('.search-bar');
    const query = searchBar?.value.trim();
    if (query) {
        const results = await searchCustomers(query);
        displayCustomers(results);
        return;
    }

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
    listViewMode = 'customers';
    syncListToolbarUI();
    await refreshCustomerList();
}

function collectFollowupsFromCustomers(customers) {
    const allFollowups = [];

    customers.forEach((customer) => {
        if (customer.followup && Array.isArray(customer.followup)) {
            customer.followup.forEach((followup) => {
                allFollowups.push({
                    customerId: customer.id,
                    customerName: customer.name || t('customer.unnamedShort'),
                    ...followup
                });
            });
        }
    });

    return allFollowups;
}

function matchesFollowupSearch(followup, query) {
    const normalized = query.toLowerCase();
    return [followup.customerName, followup.followupPlan, followup.followupFeedback]
        .some((value) => value && String(value).toLowerCase().includes(normalized));
}

async function renderFollowUpList() {
    const customerList = document.getElementById('customerList');
    customerList.innerHTML = '';
    updateToolbarSummary();

    try {
        const customers = await getAllCustomers();
        let allFollowups = collectFollowupsFromCustomers(customers);

        const searchBar = document.querySelector('.search-bar');
        const query = searchBar?.value.trim();
        if (query) {
            allFollowups = allFollowups.filter((followup) => matchesFollowupSearch(followup, query));
        }

        if (allFollowups.length === 0) {
            const empty = document.createElement('p');
            empty.className = 'list-empty';
            empty.textContent = query ? t('list.noResults') : t('followup.sort.empty');
            customerList.appendChild(empty);
            return;
        }

        const groups = FollowupSort.groupFollowupsByDate(allFollowups, {
            field: followupSortField,
            ascending: followupSortDir === 'asc'
        });

        groups.forEach(({ dateLabel, items: followups }) => {
            const card = document.createElement('div');
            card.className = 'customer-card';

            const dateHeader = document.createElement('div');
            dateHeader.className = 'customer-name';
            dateHeader.textContent = dateLabel || t('followup.noDiscussionDate');

            const followupsList = document.createElement('div');
            followupsList.className = 'customer-info';

            followups.forEach((followup) => {
                const followupItem = document.createElement('div');
                followupItem.className = 'followup-item';
                followupItem.style.marginBottom = '8px';
                followupItem.style.cursor = 'pointer';
                followupItem.innerHTML = `
                    <strong>${followup.customerName}</strong>: ${followup.followupPlan}
                    ${followup.followupFeedback ? `<div class="timeline-feedback">${followup.followupFeedback}</div>` : ''}
                `;

                followupItem.addEventListener('click', () => {
                    showCustomerDetail(followup.customerId);
                    setTimeout(() => showTab('followup'), 100);
                });

                followupsList.appendChild(followupItem);
            });

            card.appendChild(dateHeader);
            card.appendChild(followupsList);
            customerList.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading followups:', error);
        alert(t('followup.loadFailed'));
    }
}

// Show followups view
async function showFollowUps() {
    document.getElementById('customerDetail').classList.remove('active');
    listViewMode = 'followups';
    syncListToolbarUI();
    await renderFollowUpList();
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
    const selectedTab = document.querySelector(`.form-tab[onclick="showTab('${tabName}')"]`);
    selectedTab.classList.add('active');

    // Scroll the selected tab to center
    const tabsContainer = document.querySelector('.form-tabs');
    const tabsContainerWidth = tabsContainer.offsetWidth;
    const tabOffsetLeft = selectedTab.offsetLeft;
    const tabWidth = selectedTab.offsetWidth;
    const scrollLeft = tabOffsetLeft - (tabsContainerWidth / 2) + (tabWidth / 2);
    
    tabsContainer.scrollTo({
        left: scrollLeft,
        behavior: 'smooth'
    });
}

// Load customer data into form
function loadCustomerData(customer) {
    FormGenerator.loadData(customer);
}

// Display customer card
function createCustomerCard(customer) {
    const card = document.createElement('div');
    card.className = 'customer-card';
    
    // Add Step2 indicator if applicable
    if (customer.isStep2) {
        const step2Badge = document.createElement('div');
        step2Badge.className = 'step2-badge';
        step2Badge.textContent = 'Step 2';
        card.appendChild(step2Badge);
    }
    
    const name = document.createElement('h3');
    name.textContent = customer.name;
    card.appendChild(name);
    
    // Add age with highlight if in range
    if (customer.age) {
        const age = document.createElement('p');
        age.textContent = `${customer.age}歲`;
        if (customer.age >= 30 && customer.age <= 55) {
            age.className = 'highlight-age';
        }
        card.appendChild(age);
    }
    
    // Add occupation if available
    if (customer.occupation) {
        const occupation = document.createElement('p');
        occupation.textContent = customer.occupation;
        card.appendChild(occupation);
    }

    if (customer.country) {
        const country = document.createElement('p');
        country.className = 'customer-country';
        country.textContent = Countries.getDisplayLabelForValue(customer.country);
        card.appendChild(country);
    }
    
    const steamScore = getSteamScore(customer);
    if (steamScore > 0) {
        const scoreEl = document.createElement('p');
        scoreEl.className = 'steam-score';
        scoreEl.textContent = `STEAM: ${steamScore}`;
        card.appendChild(scoreEl);
    }

    // Add color rating if available
    if (customer.colorRating) {
        const colorRating = document.createElement('div');
        colorRating.className = `color-rating ${customer.colorRating}`;
        card.appendChild(colorRating);
    }
    
    // Get first available contact method
    const contact = customer.phone || customer.line || customer.fb || customer.ig;
    if (contact) {
        const contactInfo = document.createElement('p');
        contactInfo.textContent = contact;
        card.appendChild(contactInfo);
    }
    
    // Add last follow-up date if available
    if (customer.lastInviteDate) {
        const lastContact = document.createElement('p');
        lastContact.className = 'last-contact';
        lastContact.textContent = t('customer.lastContact', {
            date: new Date(customer.lastInviteDate).toLocaleDateString(I18n.getLocale())
        });
        card.appendChild(lastContact);
    }
    
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
        await addCustomer(customer);
        loadCustomers();
        event.target.reset();
    } catch (error) {
        alert(t('customer.addFailed', { message: error.message }));
    }
}

// Load all customers
async function loadCustomers() {
    try {
        const customers = await getAllCustomers();
        displayCustomers(customers);
    } catch (error) {
        console.error('Error loading customers:', error);
        alert(t('customer.loadFailed'));
    }
}

// Handle add customer button click
function handleAddCustomer() {
    document.getElementById('customerForm').reset();
}

// Delete customer
async function handleDeleteCustomer() {
    if (!currentCustomerId) {
        alert(t('customer.deleteNotFound'));
        return;
    }

    if (!confirm(t('confirm.deleteCustomer'))) {
        return;
    }

    try {
        await deleteCustomer(currentCustomerId);
        showCustomers();
    } catch (error) {
        console.error('Error deleting customer:', error);
        alert(t('customer.deleteFailed'));
    }
}

// Calculate STEAM score from the customer form
function calculateSteamScore() {
    const steamFields = [
        'steamS',
        'steamT',
        'steamE',
        'steamA',
        'steamM',
        'onlineSales',
        'connections'
    ];

    const formData = {};
    steamFields.forEach(field => {
        const select = document.getElementById(field);
        if (select && select.value) {
            formData[field] = select.value;
        }
    });

    const totalScoreInput = document.getElementById('totalScore');
    if (totalScoreInput) {
        totalScoreInput.value = getSteamScore(formData);
    }
}

// Toggle Step2 tab visibility
function toggleStep2TabVisibility(show) {
    const step2Tab = document.querySelector('.form-tab[onclick="showTab(\'step2\')"]');
    if (step2Tab) {
        if (show) {
            step2Tab.style.display = '';
        } else {
            step2Tab.style.display = 'none';
            // If currently on Step2 tab, switch to basic tab
            if (document.getElementById('step2Section').classList.contains('active')) {
                showTab('basic');
            }
        }
    }
}

// Show report dialog
async function showReportDialog() {
    const dialog = document.getElementById('reportDialog');
    const customerList = document.getElementById('reportCustomerList');
    const selectAll = document.getElementById('reportSelectAll');
    const useFiltered = document.getElementById('reportUseFilteredList');
    customerList.innerHTML = '';

    const allCustomers = await getAllCustomers();
    const filteredCustomers = await getFilteredListCustomers();
    const customers = getDialogCustomerOrder(allCustomers, filteredCustomers);
    const countEl = document.getElementById('reportFilteredCount');
    if (countEl) {
        countEl.textContent = String(filteredCustomers.length);
    }

    if (customers.length === 0) {
        customerList.innerHTML = `<p class="report-empty-hint">${t('report.emptyCustomers')}</p>`;
    } else {
        const filteredIds = new Set(filteredCustomers.map(customer => String(customer.id)));
        customers.forEach(customer => {
            const item = document.createElement('div');
            item.className = 'report-customer-item';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'report-customer-checkbox';
            checkbox.value = customer.id;

            const label = document.createElement('label');
            const steamScore = getSteamScore(customer);
            const steamHint = steamScore > 0 ? ` · STEAM ${steamScore}` : '';
            label.textContent = `${customer.name || t('customer.unnamedShort')}${customer.age ? ` (${t('customer.ageYears', { age: customer.age })})` : ''}${steamHint}`;

            item.appendChild(checkbox);
            item.appendChild(label);
            customerList.appendChild(item);

            if (filteredIds.has(String(customer.id))) {
                item.classList.add('report-customer-item--in-filter');
            }
        });
    }

    if (selectAll) {
        selectAll.checked = false;
        selectAll.disabled = false;
    }

    if (useFiltered) {
        useFiltered.checked = true;
    }

    await toggleReportFilteredMode();
    dialog.style.display = 'block';
}

async function toggleReportFilteredMode() {
    const useFiltered = document.getElementById('reportUseFilteredList')?.checked;
    const list = document.getElementById('reportCustomerList');
    const selectAll = document.getElementById('reportSelectAll');
    const filteredCustomers = await getFilteredListCustomers();
    const filteredIds = new Set(filteredCustomers.map(customer => String(customer.id)));

    document.querySelectorAll('.report-customer-checkbox').forEach(checkbox => {
        checkbox.checked = useFiltered ? filteredIds.has(String(checkbox.value)) : checkbox.checked;
        checkbox.disabled = useFiltered;
    });

    if (selectAll) {
        selectAll.disabled = useFiltered;
        if (useFiltered) {
            selectAll.checked = false;
        }
    }

    list?.classList.toggle('is-disabled', Boolean(useFiltered));
}

function toggleReportSelectAll(checked) {
    if (document.getElementById('reportUseFilteredList')?.checked) {
        return;
    }
    document.querySelectorAll('.report-customer-checkbox').forEach(checkbox => {
        checkbox.checked = checked;
    });
}

// Close report dialog
function closeReportDialog() {
    document.getElementById('reportDialog').style.display = 'none';
}

// Generate report for selected customers
async function generateReport() {
    let customers;

    try {
        customers = await getReportCustomers();
    } catch (error) {
        handleReportSelectionError(error);
        return;
    }

    try {
        // Hide all main content
        document.querySelector('.container').style.display = 'none';
        document.querySelector('.detail-view').style.display = 'none';

        // Create report container
        const reportContent = document.createElement('div');
        reportContent.id = 'reportContent';
        reportContent.style.padding = '20px';
        reportContent.style.background = 'white';
        reportContent.appendChild(ReportBuilder.createFullReportElement(customers));

        // Add report to body
        document.body.appendChild(reportContent);

        // Close dialog and print
        closeReportDialog();
        window.print();

        // Cleanup after printing
        document.body.removeChild(reportContent);
        document.querySelector('.container').style.display = '';
        document.querySelector('.detail-view').style.display = '';
    } catch (error) {
        console.error('Error generating report:', error);
        alert(t('report.generateFailed'));
        
        // Restore display in case of error
        document.querySelector('.container').style.display = '';
        document.querySelector('.detail-view').style.display = '';
    }
}

window.getReportCustomers = getReportCustomers;
window.handleReportSelectionError = handleReportSelectionError;
async function exportToCSV() {
    try {
        const customers = await getAllCustomers();
        if (customers.length === 0) {
            alert(t('export.noCustomers'));
            return;
        }

        // Define CSV headers based on basic customer information
        const headers = [
            'ID', '姓名', '電話', 'Line', 'FB', 'IG',
            '年齡', '性別', '職業', '居住地', '國家/地區', '如何認識',
            'Step2', '顏色評級', '最近聯繫日期'
        ];

        // Convert customers to CSV rows
        const rows = customers.map(customer => [
            customer.id,
            customer.name || '',
            customer.phone || '',
            customer.line || '',
            customer.fb || '',
            customer.ig || '',
            customer.age || '',
            customer.gender || '',
            customer.occupation || '',
            customer.address || '',
            customer.country || '',
            customer.howMet || '',
            customer.isStep2 ? '是' : '否',
            customer.colorRating || '',
            customer.lastInviteDate || ''
        ]);

        // Create CSV content
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => 
                typeof cell === 'string' ? `"${cell.replace(/"/g, '""')}"` : cell
            ).join(','))
        ].join('\n');

        // Create and trigger download
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const date = new Date().toISOString().split('T')[0];
        a.href = url;
        a.download = `customers_${date}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        alert(t('export.csvSuccess'));
    } catch (error) {
        console.error('匯出 CSV 時發生錯誤：', error);
        alert(t('export.failed'));
    }
}

// Export data to JSON format
async function exportToJSON() {
    try {
        const customers = await getAllCustomers();
        if (customers.length === 0) {
            alert(t('export.noCustomers'));
            return;
        }

        const jsonString = JSON.stringify(createBackupPayload(customers), null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const date = new Date().toISOString().split('T')[0];
        a.href = url;
        a.download = `customers_${date}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        alert(t('export.jsonSuccess'));
    } catch (error) {
        console.error('匯出 JSON 時發生錯誤：', error);
        alert(t('export.failed'));
    }
}

// Handle file import
async function handleFileImport(event) {
    try {
        const file = event.target.files[0];
        if (!file) return;

        const confirmImport = confirm(t('confirm.importOverwrite'));
        if (!confirmImport) {
            event.target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                let importedCustomers;
                
                if (file.name.endsWith('.json')) {
                    const backup = parseBackupJson(JSON.parse(e.target.result));
                    const versionCheck = validateBackupVersion(backup.formatVersion);
                    if (!versionCheck.ok) {
                        alert(t(versionCheck.messageKey, versionCheck.params));
                        return;
                    }
                    importedCustomers = backup.customers;
                } else if (file.name.endsWith('.csv')) {
                    // Handle CSV import
                    importedCustomers = parseCSV(e.target.result);
                } else {
                    throw new Error('import.unsupportedFile');
                }

                // Clear existing data
                await clearAllCustomers();

                // Import all customers
                for (const customer of importedCustomers) {
                    await addCustomer(customer);
                }

                alert(t('import.success'));
                loadCustomers();
            } catch (error) {
                console.error('解析檔案時發生錯誤：', error);
                const message = I18n.hasTranslation(error.message)
                    ? t(error.message)
                    : t('import.invalidFile');
                alert(message);
            }
        };

        if (file.name.endsWith('.csv')) {
            reader.readAsText(file, 'UTF-8');
        } else {
            reader.readAsText(file);
        }
    } catch (error) {
        console.error('匯入資料時發生錯誤：', error);
        alert(t('import.failed'));
    }
    event.target.value = '';
}

// Parse CSV content
function parseCSV(csvContent) {
    try {
        const lines = csvContent.split('\n');
        const headers = lines[0].split(',').map(header => 
            header.trim().replace(/^"/, '').replace(/"$/, '')
        );

        return lines.slice(1).filter(line => line.trim()).map(line => {
            const values = line.split(',').map(value => 
                value.trim().replace(/^"/, '').replace(/"$/, '')
            );
            
            const customer = {};
            headers.forEach((header, index) => {
                let value = values[index] || '';
                
                // Convert specific fields
                if (header === 'Step2') {
                    value = value === '是';
                } else if (header === '年齡') {
                    value = value ? parseInt(value) : null;
                }
                
                // Map CSV headers to customer properties
                const propertyMap = {
                    'ID': 'id',
                    '姓名': 'name',
                    '電話': 'phone',
                    'Line': 'line',
                    'FB': 'fb',
                    'IG': 'ig',
                    '年齡': 'age',
                    '性別': 'gender',
                    '職業': 'occupation',
                    '居住地': 'address',
                    '地址': 'address',
                    '國家/地區': 'country',
                    '如何認識': 'howMet',
                    'Step2': 'isStep2',
                    '顏色評級': 'colorRating',
                    '最近聯繫日期': 'lastInviteDate'
                };

                const propertyName = propertyMap[header];
                if (propertyName) {
                    customer[propertyName] = value;
                }
            });

            return customer;
        });
    } catch (error) {
        console.error('解析 CSV 時發生錯誤：', error);
        throw new Error('CSV 格式錯誤');
    }
}
