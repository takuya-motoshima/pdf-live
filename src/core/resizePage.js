/**
  * Resize page.
  */
export default (pages, zoomFactor = 1.0) => {
  console.log(`Resize to ${zoomFactor} times`);
  for (let num=1; num<=pages.length; num++) {
    // Fetch page.
    const page = pages[num - 1];

    // Calculate the display area of the page.
    const viewport = page.getViewport({scale: 1.5 * zoomFactor});

    // Support HiDPI-screens.
    const devicePixelRatio = window.devicePixelRatio || 1;

    // Find the page node.
    const pageNode = document.querySelector(`#page${num}`);
    pageNode.style.width = `${Math.floor(viewport.width)}px`;
    pageNode.style.height = `${Math.floor(viewport.height)}px`;
    pageNode.style.margin = `${zoomFactor * 4}px`;

    // Find the canvas node.
    const canvas = pageNode.querySelector('canvas');
    canvas.width = Math.floor(viewport.width * devicePixelRatio);
    canvas.height = Math.floor(viewport.height * devicePixelRatio);
    
    // Render page content on canvas.
    page.render({
      canvasContext: canvas.getContext('2d'), 
      transform: devicePixelRatio !== 1 ? [devicePixelRatio, 0, 0, devicePixelRatio, 0, 0] : null,
      viewport
    });
  }
}