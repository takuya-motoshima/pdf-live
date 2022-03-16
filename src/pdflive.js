import getDocument from './core/getDocument.js';
import renderPages from './core/renderPages.js';
import resizePage from './core/resizePage.js';
import loadingModal from './components/loadingModal.js';
// import errorModal from './components/errorModal.js';
// import warningModal from './components/warningModal.js';
// import passwordModal from './components/passwordModal.js';
import LeftPanel from './components/LeftPanel.js';
import ZoomMenu from './components/ZoomMenu.js';
import PageNav from './components/PageNav.js';

(async () => {
  try {
    // Show loading.
    loadingModal.open();

    // Find dependent nodes.
    // const pageView = document.querySelector('[data-element="pageView"]');
    const totalPage = document.querySelector('[data-element="totalPage"]');

    // Rendering request task.
    let renderTask = null;

    // Init viewer.
    const pdfDoc = await getDocument('sample/portrait3.pdf');
    // const pdfDoc = await getDocument('sample/landscape.pdf');

    // Show total number of pages.
    totalPage.textContent = pdfDoc.numPages;

    // Keep page width and height for zoom factor calculation to fit by page or width.
    const standardViewport = await (async () => {
      const {width, height} = (await pdfDoc.getPage(1)).getViewport({scale: 1.5 * 1.0});
      // const [width, height] = (await pdfDoc.getPage(1)).view.slice(2);
      return {width, height}
    })();

    // Initialize zoom menu.
    const zoomMenu = new ZoomMenu(standardViewport);

    // Change the zoom factor of the page when the zoom is changed.
    zoomMenu.onChangeZoom(zoomFactor => {
      // Resize page.
      resizePage(pages, zoomFactor);
    });


    // Render pages.
    const pages = await renderPages(pdfDoc, zoomMenu.getZoomFactor());

    // Initialize the left panel.
    const leftPanel = new LeftPanel(pages);

    // Initialize page navigation.
    const pageNav = new PageNav();  

    // If the page you are browsing changes.
    pageNav.onChangeBrowsingPage(pageNumber => {
      // Activate the thumbnail page of the browsing page.
      // console.log(`Received browsing page number ${pageNumber}`);
      leftPanel.activateThumbnailPage(pageNumber);
    });

    // Hide loading.
    loadingModal.close();

    // warningModal.open();
    // errorModal.open();
    // passwordModal.open();
  } catch (err) {
    alert(err);
  }
})();