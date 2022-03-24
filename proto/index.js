import getDocument from './core/getDocument.js';
import renderPages from './core/renderPages.js';
import resizePage from './core/resizePage.js';
import printPdf from './core/printPdf.js';
import downloadPdf from './core/downloadPdf.js';
import LoadingModal from './components/LoadingModal.js';
import ErrorModal from './components/ErrorModal.js';
// import warningModal from './components/warningModal.js';
// import passwordModal from './components/passwordModal.js';
import LeftPanel from './components/LeftPanel.js';
import ZoomNav from './components/ZoomNav.js';
import PageNav from './components/PageNav.js';
import getFilename from './helpers/getFilename.js';
import i18n from './i18n/index.js';

const url = 'sample.pdf';
const context = document.querySelector('[data-element="app"]');
const errorModal = new ErrorModal(context);
const loadingModal = new LoadingModal(context);

(async () => {
  try {
    // Show loading.
    loadingModal.show();

    // // Rendering request task.
    // let renderTask = null;

    // Set the PDF file name in the title.
    document.title = getFilename(url);

    // Load a PDF document.
    const pdfDoc = await getDocument(url);

    // Keep page width and height for zoom factor calculation to fit by page or width.
    const standardViewport = await (async () => {
      const {width, height} = (await pdfDoc.getPage(1)).getViewport({scale: 1.5 * 1.0});
      return {width, height}
    })();

    // Initialize zoom menu.
    const zoomNav = (new ZoomNav(standardViewport)).onChange(zoomFactor => {
      // Change the zoom factor of the page when the zoom is changed.
      // Resize page.
      resizePage(pages, zoomFactor);
    });

    // Render pages.
    const pages = await renderPages(pdfDoc, zoomNav.getZoomFactor());

    // Initialize the left panel.
    const leftPanel = (new LeftPanel(pages)).onSelect(pageNum => {
      // Thumbnail selection event.
      // View the page corresponding to the selected thumbnail in the viewer.
      pageNav.activatePage(pageNum);
    });

    // Initialize page navigation.
    const pageNav = (new PageNav(pdfDoc.numPages)).onChange(pageNum => {
      // If the page you are browsing changes.
      // Activate the thumbnail page of the browsing page.
      leftPanel.activatePage(pageNum);
    });

    // Print PDF.
    document.querySelector('[data-element="printButton"]').addEventListener('click', async () => {
      await printPdf(url);
      // await printPdf(pdfDoc);
    }, {passive: true});

    // Download PDF.
    document.querySelector('[data-element="downloadButton"]').addEventListener('click', async () => {
      await downloadPdf(pdfDoc, getFilename(url));
    }, {passive: true});

    // Show page container after successful loading of PDF.
    document.querySelector('[data-element="pagegContainer"]').classList.remove('pl-page-container-hide');

    // warningModal.show();
    // passwordModal.show();
  } catch (err) {
    errorModal.show(err.message);
    throw err;
  } finally {
    // Hide loading.
    loadingModal.hide();
  }
})();