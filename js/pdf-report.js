/**
 * Export customer reports as PDF (summary table + full detail per customer).
 *
 * html2pdf renders HTML to a canvas and slices it into pages, so one giant document
 * breaks unpredictably. We render summary + each customer separately, then merge
 * the PDF blobs with pdf-lib (copying jsPDF internal pages corrupts the output).
 */
const PDF_EXPORT_OPTIONS = {
    margin: [10, 10, 10, 10],
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
        scale: 2,
        useCORS: true,
        scrollX: 0,
        scrollY: 0,
        backgroundColor: '#ffffff'
    },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
};

const SUMMARY_PDF_OPTIONS = {
    ...PDF_EXPORT_OPTIONS,
    pagebreak: { mode: ['css', 'legacy'] }
};

const CUSTOMER_PDF_OPTIONS = {
    ...PDF_EXPORT_OPTIONS,
    pagebreak: {
        mode: ['css', 'legacy'],
        avoid: [
            '.pdf-detail-header',
            '.pdf-detail-title',
            '.report-field',
            '.report-section h3'
        ]
    }
};

async function renderElementToPdfBlob(element, options) {
    return html2pdf().set(options).from(element).outputPdf('blob');
}

async function mergePdfBlobs(blobs) {
    const { PDFDocument } = PDFLib;
    const merged = await PDFDocument.create();

    for (const blob of blobs) {
        const bytes = await blob.arrayBuffer();
        const doc = await PDFDocument.load(bytes);
        const pages = await merged.copyPages(doc, doc.getPageIndices());
        pages.forEach(page => merged.addPage(page));
    }

    return merged;
}

async function addPageNumbers(pdfDoc) {
    const { StandardFonts, rgb } = PDFLib;
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const pages = pdfDoc.getPages();
    const totalPages = pages.length;
    const fontSize = 10;
    const bottomOffset = 28;

    pages.forEach((page, index) => {
        const { width } = page.getSize();
        const label = `${index + 1} / ${totalPages}`;
        const textWidth = font.widthOfTextAtSize(label, fontSize);

        page.drawText(label, {
            x: (width - textWidth) / 2,
            y: bottomOffset,
            size: fontSize,
            font,
            color: rgb(0.35, 0.35, 0.35)
        });
    });

    return pdfDoc.save();
}

function downloadPdfBytes(bytes, filename) {
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}

async function generatePdfReport() {
    if (typeof html2pdf === 'undefined') {
        alert(t('pdf.notLoaded'));
        return;
    }

    if (typeof PDFLib === 'undefined') {
        alert(t('pdf.mergeNotLoaded'));
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
    const pdfButton = document.querySelector('#reportDialog .dialog-btn-primary');

    try {
        if (pdfButton) {
            pdfButton.disabled = true;
            pdfButton.textContent = t('pdf.generating');
        }

        exportRoot = document.createElement('div');
        exportRoot.className = 'pdf-export-root';
        document.body.appendChild(exportRoot);

        const dateStamp = new Date().toISOString().slice(0, 10);
        const filename = `客戶報表_${dateStamp}.pdf`;
        const pdfBlobs = [];

        const summaryElement = ReportBuilder.createSummaryReportElement(customers);
        exportRoot.appendChild(summaryElement);
        pdfBlobs.push(await renderElementToPdfBlob(summaryElement, SUMMARY_PDF_OPTIONS));
        exportRoot.removeChild(summaryElement);

        if (customers.length > 0) {
            const detailsTitleElement = ReportBuilder.createDetailsTitlePageElement();
            exportRoot.appendChild(detailsTitleElement);
            pdfBlobs.push(await renderElementToPdfBlob(detailsTitleElement, SUMMARY_PDF_OPTIONS));
            exportRoot.removeChild(detailsTitleElement);
        }

        for (let index = 0; index < customers.length; index += 1) {
            const partElements = ReportBuilder.createCustomerPdfPartElements(customers[index]);

            for (const partElement of partElements) {
                exportRoot.appendChild(partElement);
                pdfBlobs.push(await renderElementToPdfBlob(partElement, CUSTOMER_PDF_OPTIONS));
                exportRoot.removeChild(partElement);
            }
        }

        const mergedDoc = await mergePdfBlobs(pdfBlobs);
        const mergedBytes = await addPageNumbers(mergedDoc);
        downloadPdfBytes(mergedBytes, filename);
        closeReportDialog();
    } catch (error) {
        console.error('Error generating PDF:', error);
        alert(t('pdf.exportFailed', {
            message: error.message || t('pdf.retry')
        }));
    } finally {
        if (pdfButton) {
            pdfButton.disabled = false;
            pdfButton.textContent = t('report.exportPdf');
        }
        if (exportRoot?.parentNode) {
            exportRoot.parentNode.removeChild(exportRoot);
        }
    }
}

window.generatePdfReport = generatePdfReport;
