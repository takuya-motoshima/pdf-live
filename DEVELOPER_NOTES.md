# Developer's Notes

## Side panel open/close condition at initial display.
If the window width is greater than 640px (src/constants.MINIMUM_MOBILE_WIDTH), the side panel will be open from the beginning.

## Zoom factor when initially displayed.
If the actual width of the PDF is larger than the PDF drawing area (div.pl-page-view), the PDF will be drawn to fit within the PDF drawing area (pageWidth).  
Otherwise, the PDF will be drawn with its actual dimensions (100%).