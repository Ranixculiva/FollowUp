/**
 * Export customer reports as PDF (summary table + full detail per customer).
 */
async function generatePdfReport() {
    if (typeof html2pdf === 'undefined') {
        alert('PDF 元件尚未載入，請重新整理頁面');
        return;
    }

    let customers;

    try {
        customers = await getReportCustomers();
    } catch (error) {
        handleReportSelectionError(error);
        return;
    }

    let exportRoot = null;

    try {
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
