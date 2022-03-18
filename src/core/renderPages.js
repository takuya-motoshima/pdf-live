/**
  * Render pages.
  *
  * @param {PDFDocumentProxy} pdfDoc
  * @param {number} zoomFactor
  */
export default async (pdfDoc, zoomFactor = 1.0) => {
  // console.log(`Zoom factor: ${zoomFactor}`);
  // console.log(`Total number of pages: ${pdfDoc.numPages}`);

  // Find dependent nodes.
  const pageView = document.querySelector('[data-element="pageView"]');

  // Page object to return to caller.
  const pages = [];

  // Draw page by page.
  for (let num=1; num<=pdfDoc.numPages; num++) {
    // Fetch page.
    const page = await pdfDoc.getPage(num);

    // Calculate the display area of the page.
    const viewport = page.getViewport({scale: 1.5 * zoomFactor});

    // Support HiDPI-screens.
    const devicePixelRatio = window.devicePixelRatio || 1;

    // Create a page node.
    const pageNode = document.createElement('div');
    pageNode.id = `page${num}`;
    pageNode.style.width = `${Math.floor(viewport.width)}px`;
    pageNode.style.height = `${Math.floor(viewport.height)}px`;
    pageNode.style.margin = `${zoomFactor * 4}px`;
    pageNode.classList.add('pl-page');
    pageNode.dataset.pageNumber = num;

    // Create a canvas node.
    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(viewport.width * devicePixelRatio);
    canvas.height = Math.floor(viewport.height * devicePixelRatio);
    pageNode.appendChild(canvas);

    // Append page node to page viewer.
    pageView.appendChild(pageNode);

    // Render page content on canvas.
    page.render({
      canvasContext: canvas.getContext('2d'), 
      transform: devicePixelRatio !== 1 ? [devicePixelRatio, 0, 0, devicePixelRatio, 0, 0] : null,
      viewport
    });

    // Set the return page object.
    pages.push(page);
  }
  return pages;
}