import * as constants from '~/constants';
import PageViewport from '~/interfaces/PageViewport';

/**
  * Create a page node.
  */
export default (mode: 'render'|'resize', page: any, pageNumber: number, zoomFactor: number = 1) : [HTMLDivElement, HTMLCanvasElement, PageViewport, number] => {
  // Calculate the display area of the page.
  const viewport = page.getViewport({scale: constants.BASIC_SCALE * zoomFactor});

  // Create or find page node.
  let pageNode: HTMLDivElement;
  if (mode === 'render') {
    // Create a page node.
    pageNode = document.createElement('div');
    pageNode.id = `page${pageNumber}`;
    pageNode.classList.add('pl-page');
    pageNode.dataset.pageNumber = pageNumber.toString();
  } else
    // Find the page node.
    pageNode = document.querySelector(`#page${pageNumber}`) as HTMLDivElement;

  // Set page node dimensions.
  pageNode.style.width = `${Math.floor(viewport.width)}px`;
  pageNode.style.height = `${Math.floor(viewport.height)}px`;
  pageNode.style.margin = `${zoomFactor * 4}px auto`; // Horizontal margins are changed to auto to center the PDF (1/12/2023).

  // Delete an existing canvas node.
  // Create a canvas node. When performing a continuous resizing operation, multiple renderings are performed on the same canvas, which is not possible, so create a new canvas node without reusing it.
  if (mode === 'resize')
    pageNode.querySelector('canvas')?.remove();

  // Create a canvas node.
  const canvas = document.createElement('canvas') as HTMLCanvasElement;

  // Support HiDPI-screens.
  let outputScale = window.devicePixelRatio || 1;

  // Actual dimensions of the canvas.
  let width = viewport.width * outputScale;
  let height = viewport.height * outputScale;
  // console.log(`Canvas dimension is ${Math.floor(width)}/${Math.floor(height)}, scale is ${Math.floor(outputScale * 100)/100}`);
  if (width * height > constants.CANVAS_AREA_THRESHOLD) {
    // If the canvas area exceeds the threshold, the dimensions are recalculated to fit within the threshold.
    outputScale = 1;
    // outputScale = Math.sqrt((constants.CANVAS_AREA_THRESHOLD / width) / height);
    width = viewport.width * outputScale;
    height = viewport.height * outputScale;
    // console.log(`Recalculated canvas dimension is ${Math.floor(width)}/${Math.floor(height)}, scale is ${Math.floor(outputScale * 100)/100}`);
  }

  // Set the dimensions of the canvas node.
  canvas.width = Math.floor(width);
  canvas.height = Math.floor(height);

  // Append a canvas node to a page node.
  pageNode.appendChild(canvas);
  return [pageNode, canvas, viewport, outputScale];
}