import getDocument from './core/getDocument.js';
import renderPages from './core/renderPages.js';
import resizePage from './core/resizePage.js';
import printPdf from './core/printPdf.js';
import downloadPdf from './core/downloadPdf.js';
import setTheme from './core/setTheme.js';
import restoreTheme from './core/restoreTheme.js';
import LoadingModal from './components/LoadingModal.js';
import ErrorModal from './components/ErrorModal.js';
import PasswordModal from './components/PasswordModal.js';
import LeftPanel from './components/LeftPanel.js';
import ZoomNav from './components/ZoomNav.js';
import PageNav from './components/PageNav.js';
import getFilename from './helpers/getFilename.js';

const url = 'sample.pdf';
const context = document.querySelector('[data-element="app"]');
const errorModal = new ErrorModal(context);
const loadingModal = new LoadingModal(context);

// Password protection.
const protection = false;
// const protection = true;
const passwordModal = new PasswordModal(context);

(async () => {
  try {
    // Show loading.
    loadingModal.show();

    // Set the PDF file name in the title.
    document.querySelector('[data-element="title"]').textContent = document.title = getFilename(url);

    // Load a PDF document.
    const pdfDoc = await getDocument(url);

    // Keep page width and height for zoom factor calculation to fit by page or width.
    const defaultViewport = await (async () => {
      const {width, height} = (await pdfDoc.getPage(1)).getViewport({scale: 1.5 * 1.0});
      return {width, height}
    })();

    // Initialize zoom menu.
    const zoomNav = (new ZoomNav(defaultViewport)).onChange(zoomFactor => {
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

    // Change theme. 
    document.querySelector('[data-element="themeChangeButton"]').addEventListener('click', evnt => {
      // Current theme.
      let currentTheme = document.documentElement.getAttribute('data-theme');

      // New theme.
      const target = evnt.currentTarget;
      let newTheme;
      if (!currentTheme || currentTheme === 'light') {
        newTheme = 'dark';
        target.setAttribute('data-mode', 'dark');
        target.setAttribute('aria-label', 'Dark mode');
        target.setAttribute('title', 'Dark mode');
      } else {
        newTheme = 'light';
        target.setAttribute('data-mode', 'light');
        target.setAttribute('aria-label', 'Light mode');
        target.setAttribute('title', 'Light mode');
      }

      // Update theme.
      setTheme(newTheme);
    }, {passive: true});

    // Restore theme.
    restoreTheme();



    if (protection) {
      passwordModal.show();
    } else {
      // Show page container after successful loading of PDF.
      document.querySelector('[data-element="app"]').classList.add('pl-app-loaded');
    }

    // Hide loading.
    loadingModal.hide();
  } catch (err) {
    // Hide loading.
    loadingModal.hide();

    // Show error.
    errorModal.show(err.message);
    throw err;
  }
  // } finally {
  //   // Hide loading.
  //   loadingModal.hide();
  // }
})();