import isNumber from '~/shared/isNumber';
import Viewport from '~/interfaces/Viewport';

/**
  * Calculate the page zoom ratio.
  *
  * @param   {string} zoom
  * @returns {number}
  */
export default (zoom: string, pageView: HTMLDivElement, defaultViewport: Viewport): number => {
  let zoomFactor = 1;
  if (isNumber(zoom))
    // Convert specified percentage to ratio.
    zoomFactor = parseInt(zoom, 10) / 100;
  else if (zoom === 'pageFit')
    // Calculate the width and height of the page that fits the height of the container.
    zoomFactor = pageView.clientHeight / defaultViewport.height;
  else if (zoom === 'pageWidth')
    // Calculate the width and height of the page that fits the width of the container.
    zoomFactor = pageView.clientWidth / defaultViewport.width;
  return zoomFactor;
}