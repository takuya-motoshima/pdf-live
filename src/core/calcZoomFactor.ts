import isNumber from '~/shared/isNumber';
import PageViewport from '~/interfaces/PageViewport';

/**
  * Calculate the page zoom ratio.
  */
export default (zoomValue: string, pageView: HTMLDivElement, pageViewport: PageViewport): number => {
  let zoomFactor = 1;
  if (isNumber(zoomValue))
    // Convert specified percentage to ratio.
    zoomFactor = parseInt(zoomValue, 10) / 100;
  else if (zoomValue === 'pageFit')
    // Calculate the width and height of the page that fits the height of the container.
    zoomFactor = pageView.clientHeight / pageViewport.height;
  else if (zoomValue === 'pageWidth')
    // Calculate the width and height of the page that fits the width of the container.
    zoomFactor = pageView.clientWidth / pageViewport.width;
  return zoomFactor;
}