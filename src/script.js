import loadingModal from './loadingModal.js';
// import errorModal from './errorModal.js';
// import warningModal from './warningModal.js';
// import passwordModal from './passwordModal.js';
import './leftPanel.js';
import zoomController from './zoomController.js';

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
      * Render all PDF pages.
      */
    async function renderPages(pdfDoc, scale = 1.0) {
      console.log(`Zoom factor: ${scale}`);
      console.log(`Total number of pages: ${pdfDoc.numPages}`);

      // Show total number of pages.
      totalPage.textContent = pdfDoc.numPages;

      // PDF page object to return to caller.
      const pages = [];

      // Draw PDF page by page.
      for (let num=1; num<=pdfDoc.numPages; num++) {
          // Fetch page.
          const page = await pdfDoc.getPage(num);

          // Calculate the display area of the page.
          const viewport = page.getViewport({scale: 1.5 * scale});

          // Support HiDPI-screens.
          const outputScale = window.devicePixelRatio || 1;

          // Create PDF page elements.
          const canvas = document.createElement('canvas');
          canvas.id = `page${num}`;
          canvas.width = Math.floor(viewport.width * outputScale);
          canvas.height = Math.floor(viewport.height * outputScale);
          canvas.style.width = `${Math.floor(viewport.width)}px`;
          canvas.style.height = `${Math.floor(viewport.height)}px`;
          canvas.style.margin = `${scale * 4}px`;
          canvas.classList.add('pl-page');
          pageView.appendChild(canvas);

          // Draw contents of a PDF file to a Canvas.
          page.render({
            canvasContext: canvas.getContext('2d'), 
            transform: outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null,
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
    function resizePage(scale = 1.0) {
      console.log(`Resize to ${scale} times`);
      for (let num=1; num<=pages.length; num++) {
          // Fetch page.
          const page = pages[num - 1];

          // Calculate the display area of the page.
          const viewport = page.getViewport({scale: 1.5 * scale});

          // Support HiDPI-screens.
          const outputScale = window.devicePixelRatio || 1;

          // Create PDF page elements.
          const canvas = document.querySelector(`#page${num}`);
          canvas.width = Math.floor(viewport.width * outputScale);
          canvas.height = Math.floor(viewport.height * outputScale);
          canvas.style.width = `${Math.floor(viewport.width)}px`;
          canvas.style.height = `${Math.floor(viewport.height)}px`;
          canvas.style.margin = `${scale * 4}px`;
          
          // Draw contents of a PDF file to a Canvas.
          page.render({
            canvasContext: canvas.getContext('2d'), 
            transform: outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null,
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

    // Init PDF viewer.
    const pdfDoc = await getDocument('sample3.pdf');

    // Render all PDF pages.
    const pages = await renderPages(pdfDoc, zoomController.getZoomFactor());

    // Change the zoom factor of the page when the zoom is changed.
    zoomController.onChangeZoom(scale => {
      // Resize page.
      resizePage(scale);
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