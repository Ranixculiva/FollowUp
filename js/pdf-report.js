/**
 * Export customer reports as PDF (summary table + full detail per customer).
 */
async function generatePdfReport() {
    const selectedCheckboxes = document.querySelectorAll('#reportCustomerList input[type="checkbox"]:checked');
    const selectedIds = Array.from(selectedCheckboxes).map(cb => cb.value);

    if (selectedIds.length === 0) {
        alert('請選擇至少一位客戶');
        return;
    }

    if (typeof html2pdf === 'undefined') {
        alert('PDF 元件尚未載入，請重新整理頁面');
        return;
    }

    let exportRoot = null;

    try {
        const customers = [];
        for (const id of selectedIds) {
            const customer = await getCustomer(id);
            if (customer) {
                customers.push(customer);
            }
        }

        if (customers.length === 0) {
            alert('找不到選取的客戶資料');
            return;
        }

        customers.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'zh-Hant'));

        exportRoot = document.createElement('div');
        exportRoot.className = 'pdf-export-root';
        exportRoot.appendChild(ReportBuilder.createFullReportElement(customers));
        document.body.appendChild(exportRoot);

        const dateStamp = new Date().toISOString().slice(0, 10);
        const filename = `客戶報表_${dateStamp}.pdf`;

        await html2pdf()
            .set({
                margin: [8, 8, 8, 8],
                filename,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: {
                    scale: 2,
                    useCORS: true,
                    scrollX: 0,
                    scrollY: 0
                },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
                pagebreak: {
                    mode: ['css', 'legacy'],
                    before: '.pdf-detail-page',
                    avoid: '.report-section'
                }
            })
            .from(exportRoot.querySelector('.pdf-document'))
            .save();

        closeReportDialog();
    } catch (error) {
        console.error('Error generating PDF:', error);
        alert('匯出 PDF 失敗，請稍後再試');
    } finally {
        if (exportRoot?.parentNode) {
            exportRoot.parentNode.removeChild(exportRoot);
        }
    }
}

window.generatePdfReport = generatePdfReport;
