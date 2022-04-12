/**
  * Resize page.
  *
  * @param {any[]}  pages
  * @param {number} zoomFactor
  */
export default async (pages, zoomFactor = 1.0) => {
  for (let i=0; i<pages.length; i++) {
    // Fetch page.
    const page = pages[i];

    // Calculate the display area of the page.
    const viewport = page.getViewport({scale: 1.5 * zoomFactor});

    // Support HiDPI-screens.
    const devicePixelRatio = window.devicePixelRatio || 1;

    // Find the page node.
    const pageNode = document.querySelector(`#page${i+1}`);
    pageNode.style.width = `${Math.floor(viewport.width)}px`;
    pageNode.style.height = `${Math.floor(viewport.height)}px`;
    pageNode.style.margin = `${zoomFactor * 4}px`;

    // Create a canvas node. When performing a continuous resizing operation, multiple renderings are performed on the same canvas, which is not possible, so create a new canvas node without reusing it.
    pageNode.querySelector('canvas')?.remove();
    const canvas = document.createElement('canvas');

    // Append a canvas node to a page node.
    canvas.width = Math.floor(viewport.width * devicePixelRatio);
    canvas.height = Math.floor(viewport.height * devicePixelRatio);
    pageNode.appendChild(canvas);
    
    // Render page content on canvas.
    page.render({
      canvasContext: canvas.getContext('2d'), 
      transform: devicePixelRatio !== 1 ? [devicePixelRatio, 0, 0, devicePixelRatio, 0, 0] : null,
      viewport
    });
  }
}