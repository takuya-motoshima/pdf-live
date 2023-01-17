import createPageNode from '~/core/createPageNode';

/**
  * Render pages.
  */
export default async (pdfDocument: any, zoomFactor: number = 1): Promise<any[]> => {
  // Find dependent nodes.
  const pageView = document.querySelector('[data-element="pageView"]') as HTMLDivElement;

  // Page object to return to caller.
  const pages = [];

  // Draw page by page.
  for (let pageNumber=1; pageNumber<=pdfDocument.numPages; pageNumber++) {
    // Fetch page.
    const page = await pdfDocument.getPage(pageNumber);

    // Create a page node.
    const [pageNode, canvas, viewport, outputScale] = createPageNode('render', page, pageNumber, zoomFactor);

    // Append page node to page viewer.
    pageView.appendChild(pageNode);

    // Render page content on canvas.
    const task = page.render({
      canvasContext: canvas.getContext('2d'), 
      transform: outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null,
      viewport
    });

    // Wait for rendering to complete.
    await task.promise;

    // Set the return page object.
    pages.push(page);
  }
  return pages;
}