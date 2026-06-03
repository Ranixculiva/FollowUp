/**
 * Shared customer report data and HTML builders for print and PDF export.
 */
const ReportBuilder = (() => {
    const STEAM_SCORE_FIELDS = [
        { id: 'steamS', short: 'S' },
        { id: 'steamT', short: 'T' },
        { id: 'steamE', short: 'E' },
        { id: 'steamA', short: 'A' },
        { id: 'steamM', short: 'M' },
        { id: 'onlineSales', short: '網' },
        { id: 'connections', short: '脈' }
    ];

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function formatDisplay(value) {
        if (value === null || value === undefined || value === '') {
            return '—';
        }
        return String(value);
    }

    function findFieldConfig(fieldId) {
        for (const section of Object.values(formConfig.sections)) {
            if (section.fields) {
                const field = section.fields.find(item => item.id === fieldId);
                if (field) return field;
            }
            if (section.subsections) {
                for (const subsection of Object.values(section.subsections)) {
                    const field = subsection.fields.find(item => item.id === fieldId);
                    if (field) return field;
                }
            }
            if (section.type === 'list' && section.itemFields) {
                const field = section.itemFields.find(item => item.id === fieldId);
                if (field) return field;
            }
        }
        return null;
    }

    function getSelectLabel(fieldId, value) {
        if (value === null || value === undefined || value === '') {
            return '';
        }
        const field = findFieldConfig(fieldId);
        if (!field?.options) {
            return String(value);
        }
        const option = field.options.find(opt => opt.value === String(value));
        return option ? option.label : String(value);
    }

    function getSteamScore(customer) {
        const steamFields = [
            'steamS', 'steamT', 'steamE', 'steamA', 'steamM', 'onlineSales', 'connections'
        ];
        const fromFields = steamFields.reduce((sum, field) => {
            const parsed = parseInt(customer[field], 10);
            return sum + (Number.isNaN(parsed) ? 0 : parsed);
        }, 0);
        if (fromFields > 0) {
            return fromFields;
        }
        const stored = parseInt(customer.totalScore, 10);
        return Number.isNaN(stored) ? 0 : stored;
    }

    function getSteamLabel(fieldId, value) {
        return getSelectLabel(fieldId, value);
    }

    function getSteamNumeric(fieldId, value) {
        if (value === null || value === undefined || value === '') {
            return '—';
        }
        return String(value);
    }

    function formatFieldValue(customer, field) {
        const raw = customer[field.id];

        if (field.type === 'checkbox') {
            return raw ? '是' : '否';
        }

        if (field.type === 'checkbox-group') {
            return field.options
                .filter(option => customer[option.id])
                .map(option => option.label)
                .join('、') || '—';
        }

        if (field.type === 'select' || field.type === 'country-select') {
            const label = getSelectLabel(field.id, raw);
            return label || '—';
        }

        if (field.type === 'date') {
            return raw ? new Date(raw).toLocaleDateString('zh-TW') : '—';
        }

        if (field.type === 'number') {
            if (field.id === 'totalScore') {
                const score = getSteamScore(customer);
                return score > 0 ? String(score) : (raw ? String(raw) : '—');
            }
            return raw !== '' && raw !== null && raw !== undefined ? String(raw) : '—';
        }

        return raw ? String(raw) : '—';
    }

    function collectRegularFields(section) {
        const rows = [];

        if (section.subsections) {
            Object.values(section.subsections).forEach(subsection => {
                subsection.fields.forEach(field => {
                    rows.push({ label: field.label, value: formatFieldValue(customerRef, field) });
                });
            });
        }

        if (section.fields) {
            section.fields.forEach(field => {
                if (field.type === 'checkbox-group') {
                    rows.push({
                        label: field.label,
                        value: formatFieldValue(customerRef, field)
                    });
                } else {
                    rows.push({ label: field.label, value: formatFieldValue(customerRef, field) });
                }
            });
        }

        return rows;
    }

    let customerRef = null;

    function buildDetailSections(customer) {
        customerRef = customer;
        const sections = [];

        Object.entries(formConfig.sections).forEach(([sectionId, section]) => {
            if (section.type === 'list') {
                const items = Array.isArray(customer[sectionId]) ? customer[sectionId] : [];
                const rows = [];

                if (items.length === 0) {
                    rows.push({ label: '跟進計劃', value: '—' });
                } else {
                    items.forEach((item, index) => {
                        section.itemFields.forEach(field => {
                            const tempCustomer = { ...item };
                            customerRef = tempCustomer;
                            rows.push({
                                label: `計劃 ${index + 1} · ${field.label}`,
                                value: formatFieldValue(tempCustomer, field)
                            });
                        });
                    });
                }

                customerRef = customer;
                sections.push({ title: section.title, rows });
                return;
            }

            const rows = collectRegularFields(section);
            if (rows.length > 0) {
                sections.push({ title: section.title, rows });
            }
        });

        if (customer.occupation) {
            const basic = sections.find(section => section.title === '基本資料');
            if (basic && !basic.rows.some(row => row.label === '職業')) {
                basic.rows.push({ label: '職業', value: customer.occupation });
            }
        }

        customerRef = null;
        return sections;
    }

    function buildSummaryRow(customer, index) {
        const steamCells = STEAM_SCORE_FIELDS.map(({ id }) =>
            getSteamNumeric(id, customer[id])
        );
        const total = getSteamScore(customer);

        return {
            index: index + 1,
            name: customer.name || '未命名',
            age: customer.age ? `${customer.age}` : '—',
            gender: customer.gender || '—',
            country: customer.country || '—',
            phone: customer.phone || customer.line || customer.fb || customer.ig || '—',
            address: customer.address || '—',
            step2: customer.isStep2 ? '是' : '—',
            steam: steamCells,
            total: total > 0 ? String(total) : '—'
        };
    }

    function buildSummaryRows(customers) {
        return customers.map((customer, index) => buildSummaryRow(customer, index));
    }

    function renderSummaryTableHtml(customers) {
        const rows = buildSummaryRows(customers);
        const steamHeaders = STEAM_SCORE_FIELDS.map(field => field.short).join('</th><th>');

        const body = rows.map(row => `
            <tr>
                <td>${row.index}</td>
                <td>${escapeHtml(row.name)}</td>
                <td>${escapeHtml(row.age)}</td>
                <td>${escapeHtml(row.gender)}</td>
                <td>${escapeHtml(row.country)}</td>
                <td>${escapeHtml(row.phone)}</td>
                <td>${escapeHtml(row.address)}</td>
                <td>${escapeHtml(row.step2)}</td>
                ${row.steam.map(value => `<td>${escapeHtml(value)}</td>`).join('')}
                <td><strong>${escapeHtml(row.total)}</strong></td>
            </tr>
        `).join('');

        return `
            <section class="pdf-summary-section">
                <h1 class="pdf-title">客戶名單摘要</h1>
                <p class="pdf-meta">共 ${customers.length} 位客戶 · 產生時間：${new Date().toLocaleString('zh-TW')}</p>
                <table class="pdf-summary-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>姓名</th>
                            <th>年齡</th>
                            <th>性別</th>
                            <th>國家/地區</th>
                            <th>聯絡方式</th>
                            <th>居住地</th>
                            <th>Step 2</th>
                            <th>${steamHeaders}</th>
                            <th>總分</th>
                        </tr>
                    </thead>
                    <tbody>${body}</tbody>
                </table>
            </section>
        `;
    }

    function renderDetailSectionHtml(section) {
        const isFollowup = section.title === '跟進計劃';
        const sectionClass = isFollowup
            ? 'report-section report-section-followup'
            : 'report-section';

        const rows = section.rows.map(row => `
            <div class="report-field">
                <span class="report-field-label">${escapeHtml(row.label)}</span>
                <span class="report-field-value">${escapeHtml(row.value)}</span>
            </div>
        `).join('');

        return `
            <div class="${sectionClass}">
                <h3>${escapeHtml(section.title)}</h3>
                ${rows}
            </div>
        `;
    }

    function renderCustomerDetailHtml(customer) {
        const sections = buildDetailSections(customer);
        const name = customer.name || '未命名客戶';

        return `
            <article class="customer-report pdf-detail-page">
                <header class="pdf-detail-header">
                    <h2 class="pdf-detail-title">${escapeHtml(name)}</h2>
                </header>
                ${sections.map(renderDetailSectionHtml).join('')}
            </article>
        `;
    }

    function renderSummaryDocumentHtml(customers, includeDetailsHeading = false) {
        return `
            <div class="pdf-document pdf-summary-chunk">
                ${renderSummaryTableHtml(customers)}
                ${includeDetailsHeading ? '<div class="pdf-section-break"></div><h1 class="pdf-title pdf-details-heading">客戶詳細資料</h1>' : ''}
            </div>
        `;
    }

    function buildFullReportHtml(customers) {
        if (!customers.length) {
            return '';
        }

        return `
            <div class="pdf-document">
                ${renderSummaryTableHtml(customers)}
                <div class="pdf-section-break"></div>
                <section class="pdf-details-section">
                    <h1 class="pdf-title pdf-details-heading">客戶詳細資料</h1>
                    ${customers.map(renderCustomerDetailHtml).join('')}
                </section>
            </div>
        `;
    }

    function createSummaryReportElement(customers) {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = renderSummaryDocumentHtml(customers);
        return wrapper.firstElementChild;
    }

    function createCustomerDetailPageElement(customer, { showDetailsHeading = false } = {}) {
        const wrapper = document.createElement('div');
        wrapper.className = 'pdf-customer-chunk';
        if (showDetailsHeading) {
            const heading = document.createElement('h1');
            heading.className = 'pdf-title pdf-details-heading';
            heading.textContent = '客戶詳細資料';
            wrapper.appendChild(heading);
        }
        wrapper.appendChild(createCustomerReportElement(customer));
        return wrapper;
    }

    function createCustomerReportElement(customer) {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = renderCustomerDetailHtml(customer);
        return wrapper.firstElementChild;
    }

    function createFullReportElement(customers) {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = buildFullReportHtml(customers);
        return wrapper.firstElementChild;
    }

    return {
        escapeHtml,
        formatDisplay,
        getSteamScore,
        getSteamLabel,
        buildSummaryRows,
        buildDetailSections,
        buildFullReportHtml,
        createSummaryReportElement,
        createCustomerDetailPageElement,
        createCustomerReportElement,
        createFullReportElement
    };
})();

window.ReportBuilder = ReportBuilder;
