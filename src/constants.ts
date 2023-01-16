// The minimum width of the mobile.
// If the window width is smaller than this width in the first view, the side panel will be hidden.
export const MINIMUM_MOBILE_WIDTH: number = 640;

// Flag to be specified when zooming out PDF.
export const ZOOM_OUT: number = 0;

// Flag to specify when PDF is zoomed in.
export const ZOOM_IN: number = 1;

// Scaling factor for PDF dimensions to be drawn.
export const PDF_DRAWING_SCALE: number = 1.5;

// The number of seconds of delay between the request for resizing and the actual resizing.
export const RESIZE_DELAY_SECONDS: number = 0.5;

// Canvas area limit for drawing PDF (unit: px).
// If the zoom causes the canvas area (width*height) to exceed the maximum value, a value that does not exceed the maximum value is set as the area.
export const CANVAS_AREA_LIMIT: number = 5 * 1024 * 1024;

// // Maximum canvas width to draw the PDF.
// // If zooming causes the maximum value to be exceeded, the canvas width will be set to a value that does not exceed the maximum value.
// export const MAXIMUM_CANVAS_WIDTH = 0;

// // Maximum canvas height to draw the PDF.
// // If zooming causes the maximum value to be exceeded, the canvas height will be set to a value that does not exceed the maximum value.
// export const MAXIMUM_CANVAS_HEIGHT = 0;