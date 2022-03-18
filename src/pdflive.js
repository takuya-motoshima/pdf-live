import getDocument from './core/getDocument.js';
import renderPages from './core/renderPages.js';
import resizePage from './core/resizePage.js';
import printPdf from './core/printPdf.js';
import loadingModal from './components/loadingModal.js';
// import errorModal from './components/errorModal.js';
// import warningModal from './components/warningModal.js';
// import passwordModal from './components/passwordModal.js';
import LeftPanel from './components/LeftPanel.js';
import ZoomMenu from './components/ZoomMenu.js';
import PageNav from './components/PageNav.js';

const url = 'sample/portrait3.pdf';

(async () => {
  try {
    // Show loading.
    loadingModal.open();

    // Find dependent nodes.
    const printButton = document.querySelector('[data-element="printButton"]');

    // // Rendering request task.
    // let renderTask = null;

    // Show PDF file name in title.
    document.title = `${url.substring(url.lastIndexOf('/')+1)} - PDF LIVE`;

    // Init viewer.
    const pdfDoc = await getDocument(url);

    // Keep page width and height for zoom factor calculation to fit by page or width.
    const standardViewport = await (async () => {
      const {width, height} = (await pdfDoc.getPage(1)).getViewport({scale: 1.5 * 1.0});
      // const [width, height] = (await pdfDoc.getPage(1)).view.slice(2);
      return {width, height}
    })();

    // Initialize zoom menu.
    const zoomMenu = (new ZoomMenu(standardViewport)).onChangeZoom(zoomFactor => {
      // Change the zoom factor of the page when the zoom is changed.
      // Resize page.
      resizePage(pages, zoomFactor);
    });

    // Render pages.
    const pages = await renderPages(pdfDoc, zoomMenu.getZoomFactor());

    // Initialize the left panel.
    const leftPanel = (new LeftPanel(pages)).onSelectThumbnail(pageNum => {
      // Thumbnail selection event.
      // View the page corresponding to the selected thumbnail in the viewer.
      pageNav.activatePage(pageNum);
    });

    // Initialize page navigation.
    const pageNav = (new PageNav(pdfDoc.numPages)).onChangeBrowsingPage(pageNum => {
      // If the page you are browsing changes.
      // Activate the thumbnail page of the browsing page.
      leftPanel.activateThumbnailPage(pageNum);
    });

    // Print PDF.
    printButton.addEventListener('click', async () => {
      await printPdf(pdfDoc);
    }, {passive: true});

    // Hide loading.
    loadingModal.close();

    // warningModal.open();
    // errorModal.open();
    // passwordModal.open();
  } catch (err) {
    alert(err);
  }
})();