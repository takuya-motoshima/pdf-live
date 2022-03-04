import loadingModal from './loadingModal.js';

(async () => {
  /**
  * Open the left panel.
  */
  function openLeftPanel() {
    console.log('Open the left panel');
    leftPanel.classList.remove('closed')
    documentContentContainer.classList.add('open')
  }

  /**
  * Close left panel.
  */
  function closeLeftPanel() {
    console.log('Close left panel');
    leftPanel.classList.add('closed')
    documentContentContainer.classList.remove('open')
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
    for (let pageNum=1; pageNum<=pdf.numPages; pageNum++) {
      await renderPage(pdf, pageNum);
      console.log(`Render the ${pageNum}th page`);
    }
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
    // console.log(`point=${JSON.stringify(point, null, 2)}`);
    return rect.x <= point.x && point.x <= rect.x + rect.width && rect.y <= point.y && point.y <= rect.y + rect.height;
  }

  /**
    * Render the specified page of PDF.
    */
  async function renderPage(pdf, pageNum) {
    // Fetch the specified page.
    const page = await pdf.getPage(pageNum);

    // Support HiDPI-screens.
    const outputScale = window.devicePixelRatio || 1;
    const viewport = page.getViewport({scale: 1.5});

    // Create PDF page elements.
    const section = document.createElement('div');
    section.id = `section${pageNum}`;
    section.classList.add('pageSection');

    const container = document.createElement('div');
    container.id = `pageContainer${pageNum}`;
    container.classList.add('pageContainer');

    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(viewport.width * outputScale);
    canvas.height = Math.floor(viewport.height * outputScale);
    canvas.style.width = `${Math.floor(viewport.width)}px`;
    canvas.style.height = `${Math.floor(viewport.height)}px`;

    container.appendChild(canvas);
    section.appendChild(container);
    viewer.appendChild(section);

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
  const documentContentContainer = document.querySelector('[data-element="documentContentContainer"]');
  const leftPanelCloseButton = document.querySelector('[data-element="leftPanelCloseButton"]');
  const toggleZoomOverlay = document.querySelector('[data-element="toggleZoomOverlay"]');
  const zoomOverlay = document.querySelector('[data-element="zoomOverlay"]');
  const viewer = document.querySelector('[data-element="viewer"]');

  // Toggle the opening and closing of the left panel.
  leftPanelButton.addEventListener('click', () => {
    if (leftPanel.classList.contains('closed'))
      openLeftPanel();
    else
      closeLeftPanel();
  });

  // Close left panel.
  leftPanelCloseButton.addEventListener('click', () => {
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
      zoomOverlay.classList.remove('closed');
    } else
      // Close zoom overlay.
      zoomOverlay.classList.add('closed');
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
      zoomOverlay.classList.add('closed');
  });

  // Init PDF viewer.
  const pdf = await initPDFViewer('sample.pdf');

  // Render all PDF pages.
  renderAllPages(pdf);

  // Hide loading.
  loadingModal.close();
})();