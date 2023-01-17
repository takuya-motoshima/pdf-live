import createPageNode from '~/core/createPageNode';

// The sequence number of the drawing.
// This ensures that if multiple resizes are requested at the same time, the page of the latest resize request is drawn.
let draw = -1;

/**
  * Resize page.
  */
export default async (pages: any[], zoomFactor: number = 1): Promise<void> => {
  (async (pages: any[], zoomFactor: number, currentDraw: number) => {
    // console.log(`Start resizing(${currentDraw})`);
    for (let pageNumber=1, numberOfPages=pages.length; pageNumber<=numberOfPages; pageNumber++) {
      if (draw !== currentDraw) {
        // If it is not the latest resize request, the drawing is canceled.
        // console.log(`Cancel resize(${currentDraw})`);
        return;
      }

      // Fetch page.
      const page = pages[pageNumber - 1];

      // Create a page node.
      const [_, canvas, viewport, outputScale] = createPageNode('resize', page, pageNumber, zoomFactor);

      // Render page content on canvas.
      const task = page.render({
        canvasContext: canvas.getContext('2d'), 
        transform: outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null,
        viewport
      });

      // Wait for rendering to complete.
      await task.promise;
      // console.log(`Resize page ${pageNumber} of ${numberOfPages}(${currentDraw})`);
    }
  })(pages, zoomFactor, ++draw);
}