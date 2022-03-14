import loadingModal from './components/loadingModal.js';
// import errorModal from './components/errorModal.js';
// import warningModal from './components/warningModal.js';
// import passwordModal from './components/passwordModal.js';
import leftPanel from './components/leftPanel.js';
import ZoomMenu from './components/ZoomMenu.js';

(async () => {
  try {
    /**
      * Load a PDF document.
      */
    async function getDocument(url) {
      // Setting worker path to worker bundle.
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'src/pdf.worker.js';

      // Loading a document.
      return pdfjsLib.getDocument(url).promise;
    }

    /**
      * Render pages.
      */
    async function renderPages(pdfDoc, zoomFactor = 1.0) {
      // console.log(`Zoom factor: ${zoomFactor}`);
      // console.log(`Total number of pages: ${pdfDoc.numPages}`);

      // Show total number of pages.
      totalPage.textContent = pdfDoc.numPages;

      // PDF page object to return to caller.
      const pages = [];

      // Draw PDF page by page.
      for (let num=1; num<=pdfDoc.numPages; num++) {
        // Fetch page.
        const page = await pdfDoc.getPage(num);

        // Calculate the display area of the page.
        const viewport = page.getViewport({scale: 1.5 * zoomFactor});

        // Support HiDPI-screens.
        const devicePixelRatio = window.devicePixelRatio || 1;

        // Create PDF page elements.
        const canvas = document.createElement('canvas');
        canvas.id = `page${num}`;
        canvas.width = Math.floor(viewport.width * devicePixelRatio);
        canvas.height = Math.floor(viewport.height * devicePixelRatio);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;
        canvas.style.margin = `${zoomFactor * 4}px`;
        canvas.classList.add('pl-page');
        pageView.appendChild(canvas);

        // Draw contents of a PDF file to a Canvas.
        page.render({
          canvasContext: canvas.getContext('2d'), 
          transform: devicePixelRatio !== 1 ? [devicePixelRatio, 0, 0, devicePixelRatio, 0, 0] : null,
          viewport
        });

        // Set the PDF page object to return.
        pages.push(page);
      }
      return pages;
    }

    /**
     * Resize page.
     */
    function resizePage(zoomFactor = 1.0) {
      console.log(`Resize to ${zoomFactor} times`);
      for (let num=1; num<=pages.length; num++) {
          // Fetch page.
          const page = pages[num - 1];

          // Calculate the display area of the page.
          const viewport = page.getViewport({scale: 1.5 * zoomFactor});

          // Support HiDPI-screens.
          const devicePixelRatio = window.devicePixelRatio || 1;

          // Create PDF page elements.
          const canvas = document.querySelector(`#page${num}`);
          canvas.width = Math.floor(viewport.width * devicePixelRatio);
          canvas.height = Math.floor(viewport.height * devicePixelRatio);
          canvas.style.width = `${Math.floor(viewport.width)}px`;
          canvas.style.height = `${Math.floor(viewport.height)}px`;
          canvas.style.margin = `${zoomFactor * 4}px`;
          
          // Draw contents of a PDF file to a Canvas.
          page.render({
            canvasContext: canvas.getContext('2d'), 
            transform: devicePixelRatio !== 1 ? [devicePixelRatio, 0, 0, devicePixelRatio, 0, 0] : null,
            viewport
          });
      }
    }

    // Show loading.
    loadingModal.open();

    // Find dependent elements.
    const pageView = document.querySelector('[data-element="pageView"]');
    const totalPage = document.querySelector('[data-element="totalPage"]');
    // const pageInput = document.querySelector('[data-element="pageInput"]');

    // Rendering request task.
    let renderTask = null;

    // Init PDF viewer.
    const pdfDoc = await getDocument('sample3.pdf');

    // Keep page width and height for zoom factor calculation to fit by page or width.
    const standardViewport = await (async () => {
      const {width, height} = (await pdfDoc.getPage(1)).getViewport({scale: 1.5 * 1.0});
      // const [width, height] = (await pdfDoc.getPage(1)).view.slice(2);
      return {width, height}
    })();

    // Initialize zoom menu.
    const zoomMenu = new ZoomMenu(standardViewport);

    // Render pages.
    const pages = await renderPages(pdfDoc, zoomMenu.getZoomFactor());

    // Render thumbnail images.
    leftPanel.renderThumbnails(pdfDoc);

    // Change the zoom factor of the page when the zoom is changed.
    zoomMenu.onChangeZoom(zoomFactor => {
      // Resize page.
      resizePage(zoomFactor);
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