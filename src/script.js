import loadingModal from './loadingModal.js';

(async () => {

  // Show loading.
  loadingModal.open();

  const leftPanel = document.querySelector('[data-element="leftPanel"]');
  const leftPanelButton = document.querySelector('[data-element="leftPanelButton"]');
  const documentContentContainer = document.querySelector('[data-element="documentContentContainer"]');
  const leftPanelCloseButton = document.querySelector('[data-element="leftPanelCloseButton"]');
  const zoomOverlay = document.querySelector('[data-element="zoomOverlay"]');

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

  // Toggle the opening and closing of the left panel.
  leftPanelButton.addEventListener('click', () => {
    if (leftPanel.classList.contains('closed'))
      openLeftPanel();
    else
      closeLeftPanel();
  });

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
      await renderPage(pageNum);
      console.log(`Render the ${pageNum}th page`);
    }
  }

  /**
    * Render the specified page of PDF.
    */
  async function renderPage(pageNum) {
    // Fetch the specified page.
    const page = await pdf.getPage(pageNum);

    // Support HiDPI-screens.
    const outputScale = window.devicePixelRatio || 1;
    const viewport = page.getViewport({scale: 1.5});
    const canvas = $('<canvas/>').appendTo(viewer)
      .attr({width: Math.floor(viewport.width * outputScale), height: Math.floor(viewport.height * outputScale)})
      .css({width: Math.floor(viewport.width), height: Math.floor(viewport.height)});
    page.render({
      canvasContext: canvas.get(0).getContext('2d'),
      transform: outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null,
      viewport: viewport
    });
  }

  // Close left panel.
  leftPanelCloseButton.addEventListener('click', () => {
    closeLeftPanel();
  });

  // Open the zoom panel.
  zoomOverlay.addEventListener('click', () => {
    closeLeftPanel();
  });

  // Init PDF viewer.
  const pdf = await initPDFViewer('sample.pdf');

  // Render all PDF pages.
  renderAllPages(pdf);

  // Hide loading.
  loadingModal.close();
})();
