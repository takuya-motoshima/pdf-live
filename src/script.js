import loadingModal from './loadingModal.js';
import errorModal from './errorModal.js';
import warningModal from './warningModal.js';
import passwordModal from './passwordModal.js';

(async () => {
  try {
    /**
    * Open the left panel.
    */
    function openLeftPanel() {
      console.log('Open the left panel');
      leftPanel.classList.remove('closed')
      pagegContainer.classList.add('open')
    }

    /**
    * Close left panel.
    */
    function closeLeftPanel() {
      console.log('Close left panel');
      leftPanel.classList.add('closed')
      pagegContainer.classList.remove('open')
    }

    /**
      * Init PDF viewer.
      */
    async function initPDFViewer(url) {
      // Setting worker path to worker bundle.
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'src/pdf.worker.js';

      // Loading a document.
      return pdfjsLib.getDocument(url).promise;
    }

    /**
      * Render all PDF pages.
      */
    async function renderAllPages(pdf) {
      console.log(`pdf.numPages=${pdf.numPages}`);
      // Show total number of pages.
      totalPage.textContent = pdf.numPages;

      // Draw PDF page by page.
      for (let pageNum=1; pageNum<=pdf.numPages; pageNum++) {
        await renderPage(pdf, pageNum);
        // console.log(`Render the ${pageNum}th page`);
      }
    }

    /**
    * Open zoom overlay.
    */
    function openZoomOverlay() {
      zoomOverlay.classList.remove('closed');
    }

    /**
    * Close zoom overlay.
    */
    function closeZoomOverlay() {
      zoomOverlay.classList.add('closed');
    }

    /**
    * Layout the zoom overlay.
    */
    function layoutZoomOverlay() {
      const rect =  toggleZoomOverlay.getBoundingClientRect();
      zoomOverlay.style.top = `${rect.bottom}px`;
      zoomOverlay.style.left = `${rect.left}px`;
    }

    /**
    * Check if there is a point inside the rectangle.
    */
    function pointInRectangle(point, rect) {
      return rect.x <= point.x && point.x <= rect.x + rect.width && rect.y <= point.y && point.y <= rect.y + rect.height;
    }

    /**
      * Render the specified page of PDF.
      */
    async function renderPage(pdf, pageNum) {
      // Fetch the specified page.
      const page = await pdf.getPage(pageNum);
      if (pageNum === 1)
        console.log('page.view=', page.view);

      // Support HiDPI-screens.
      const outputScale = window.devicePixelRatio || 1;
      if (pageNum === 1)
        console.log('outputScale=', outputScale);

      const viewport = page.getViewport({scale: 1});
      // const viewport = page.getViewport({scale: 1.5});
      if (pageNum === 1)
        console.log('viewport=', viewport);

      // Current page scale.
      const currentScale = parseInt(scaleInput.value, 10) / 100;

      // Calculate section margins.
      const sectionMargin = currentScale * 4;

      // Create PDF page elements.
      const section = document.createElement('div');
      section.id = `section${pageNum}`;
      section.style.width = `${Math.floor(viewport.width * .5)}px`;
      section.style.height = `${Math.floor(viewport.height * .5)}px`;
      section.style.margin = `${sectionMargin}px`;
      section.classList.add('pl-page');

      const canvas = document.createElement('canvas');
      canvas.width = Math.floor(viewport.width * outputScale);
      canvas.height = Math.floor(viewport.height * outputScale);

      section.appendChild(canvas);
      pagegView.appendChild(section);

      // Draw contents of a PDF file to a Canvas.
      page.render({
        canvasContext: canvas.getContext('2d'),
        transform: outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null,
        viewport
      });
    }

    // Show loading.
    loadingModal.open();

    const leftPanel = document.querySelector('[data-element="leftPanel"]');
    const leftPanelButton = document.querySelector('[data-element="leftPanelButton"]');
    const pagegContainer = document.querySelector('[data-element="pagegContainer"]');
    const pagegView = document.querySelector('[data-element="pagegView"]');
    const toggleZoomOverlay = document.querySelector('[data-element="toggleZoomOverlay"]');
    const zoomOverlay = document.querySelector('[data-element="zoomOverlay"]');
    const scaleInput = document.querySelector('[data-element="scaleInput"]');
    const totalPage = document.querySelector('[data-element="totalPage"]');
    const currentPageInput = document.querySelector('[data-element="currentPageInput"]');
    const zoomOutButton = document.querySelector('[data-element="zoomOutButton"]');
    const zoomInButton = document.querySelector('[data-element="zoomInButton"]');
    const zoomSelects = document.querySelectorAll('[data-element="zoomSelect"]');
    const scales = [...zoomSelects].flatMap(zoomSelect => {
      const scale = parseInt(zoomSelect.dataset.value, 10);
      return !isNaN(scale) ? scale : [];
    });
    // console.log('scales=', scales);

    // Toggle the opening and closing of the left panel.
    leftPanelButton.addEventListener('click', () => {
      if (leftPanel.classList.contains('closed'))
        openLeftPanel();
      else
        closeLeftPanel();
    });

    // Toggle the opening and closing of the zoom overlay.
    toggleZoomOverlay.addEventListener('click', (evnt) => {
      if (zoomOverlay.classList.contains('closed')) {
        // Stops event propagation to the body so that the process of closing the zoom overlay for body click events does not run.
        evnt.stopPropagation();

        // Open zoom overlay.
        // Layout the zoom overlay.
        layoutZoomOverlay();

        // Open zoom overlay.
        openZoomOverlay();
      } else
        // Close zoom overlay.
        closeZoomOverlay();
    });

    // Recalculate the layout and size of each element when the window is resized.
    window.addEventListener('resize', () => {
      // Layout the zoom overlay.
      layoutZoomOverlay();
    });

    // When the screen is clicked.
    document.body.addEventListener('click', evnt => {
      // Close if zoom overlay is open.
      if (!zoomOverlay.classList.contains('closed') && !pointInRectangle({x: evnt.pageX, y: evnt.pageY}, zoomOverlay.getBoundingClientRect()))
        closeZoomOverlay();
    });

    // Change page scale.
    for (let zoomSelect of zoomSelects)
      zoomSelect.addEventListener('click', evnt => {
        const selectedScale = evnt.target.dataset.value;
        console.log(`Select scale ${selectedScale}`);
        closeZoomOverlay();
        if (!isNaN(parseInt(selectedScale, 10)))
          scaleInput.value = selectedScale;
      });

    // Zoom out PDF page.
    zoomOutButton.addEventListener('click', () => {
      const currentScale = parseInt(scaleInput.value, 10);
      const minScale = Math.min(...scales);
      scaleInput.value = scales.sort((a, b) => b - a).find(scale => scale < currentScale) ?? minScale;
    });

    // Zoom in on PDF page.
    zoomInButton.addEventListener('click', () => {
      const currentScale = parseInt(scaleInput.value, 10);
      const maxScale = Math.max(...scales);
      scaleInput.value = scales.sort((a, b) => a - b).find(scale => scale > currentScale) ?? maxScale;
    });

    // Init PDF viewer.
    const pdf = await initPDFViewer('sample3.pdf');

    // Render all PDF pages.
    renderAllPages(pdf);

    // Hide loading.
    loadingModal.close();

    // warningModal.open();
    // errorModal.open();
    // passwordModal.open();
  } catch (err) {
    alert(err);
  }
})();