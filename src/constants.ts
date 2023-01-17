// The minimum width of the mobile.
// If the window width is smaller than this width in the first view, the side panel will be hidden.
export const MINIMUM_MOBILE_WIDTH: number = 640;

// Flag to be specified when zooming out PDF.
export const ZOOM_OUT: number = 0;

// Flag to specify when PDF is zoomed in.
export const ZOOM_IN: number = 1;

// Scaling factor for PDF dimensions to be drawn.
export const BASIC_SCALE: number = 1.5;

// Delay milliseconds between resize request and actual resize.
export const DELAY_RESIZE_MS: number = 500;

// Threshold of the canvas area that can be drawn on by the browser.
export const CANVAS_AREA_THRESHOLD: number = 5 * 1024 * 1024;