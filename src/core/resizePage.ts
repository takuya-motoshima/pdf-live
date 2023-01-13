import * as constants from '~/constants';
import createPageNode from '~/core/createPageNode';

/**
  * Resize page.
  */
export default (pages: any[], zoomFactor: number = 1): void => {
  for (let pageNumber=1; pageNumber<=pages.length; pageNumber++) {
    // Fetch page.
    const page = pages[pageNumber - 1];

    // Create a page node.
    const [_, canvas, viewport, devicePixelRatio] = createPageNode('resize', page, pageNumber, zoomFactor);

    // Render page content on canvas.
    page.render({
      canvasContext: canvas.getContext('2d'), 
      transform: devicePixelRatio !== 1 ? [devicePixelRatio, 0, 0, devicePixelRatio, 0, 0] : null,
      viewport
    });
  }
}