# Changelog
All notable changes to this project will be documented in this file.

## [1.0.18] - 2023/1/15
### Changed
- Updated pdfjs-dist version from 2.15.349 to 3.2.146.
- Changed so that if there are multiple resize requests at the same time, the page with the latest resize request is rendered.
- Page number width in the mobile header (window width less than 640px) changed from 40px to 48px.
- If the area of the canvas on which the PDF is drawn exceeds the maximum value (5 * 1024 * 1024px), the area will be adjusted to fit within the maximum value.

## [1.0.17] - 2023/1/15
- Fixed a bug that the horizontal scroll bar in the PDF drawing area could not be moved by dragging.

## [1.0.16] - 2023/1/13
### Fixed
- Fixed a bug that when the PDF is larger than the drawing area, the horizontal position of the PDF is fixed at the center and text on the left and right edges cannot be seen.
- Fixed a bug that caused an error (Uncaught TypeError: Cannot read properties of undefined (reading 'dataset')) when resizing a window after zooming with the mouse wheel and the PDF was not resized.

## [1.0.15] - 2023/1/11
### Changed
- In the initial display, if the actual width of the PDF is larger than the drawing area, the PDF is fixed to fit in the drawing area.
- Delete prototyp(./prototype).

## [1.0.14] - 2022/8/15
### Changed
- If the format of cMap is a relative path, convert it to URL format and load it.

## [1.0.13] - 2022/8/12
### Changed
- Document completion event (documentLoaded) is now fixed to invoke when all pages have been rendered.

## [1.0.12] - 2022/7/19
### Changed
- Added 'pl-' prefix to PDF Live CSS classes to prevent CSS conflicts.

## [1.0.11] - 2022/7/8
### Added
- Added print and download methods to PDF viewer elements.

## [1.0.10] - 2022/6/16
### Changed
- Updated pdfjs-dist version from "v2.13.216" to "v2.14.305". See [https://github.com/mozilla/pdf.js/releases/tag/v2.14.305](https://github.com/mozilla/pdf.js/releases/tag/v2.14.305)
- cMap can now be used to prevent garbled PDFs that use special fonts such as Japanese.
  ```html
  <pdf-live src="sample.pdf" worker="node_modules/pdf-live/dist/pdf.worker.js"
    cmap="/node_modules/pdf-live/dist/cmaps"></pdf-live>
  ```

## [1.0.9] - 2022/4/15
### Changed
- Set the appropriate font size for each viewport width.
- If the locale is Japanese, the appropriate font family is set.

## [1.0.8] - 2022/4/15
### Changed
- The padding of the buttons in the modal was increased.

### Fixed
- Fixed a bug that the submit button of the password modal was not locale-aware.

## [1.0.7] - 2022/4/15
### Fixed
- Fixed a bug where the locale was not applied to password modal error messages.

## [1.0.6] - 2022/4/15
### Changed
- Enclose the modal title name of the warning modal and password modal in h2.

### Fixed
- Fixed a bug that the file name specified in the title attribute was not applied to the download file name.

## [1.0.5] - 2022/4/14
### Added
- Added title attribute to PDF live elements. For more information, see [here](https://lab.octopass.tech/pdf-live/docs/#api-properties).

## [1.0.4] - 2022/4/13
### Changed
- PDF Live now supports IOS Safari.
- Initial zoom is 100% if viewport width is greater than 640px, otherwise fits page width.

## [1.0.3] - 2022/4/13
### Changed
- Hide document title if viewport width is smaller than 640px.
- If the viewport width is smaller than 640px, the left panel is hidden in the first view.

## [1.0.2] - 2022/4/13
### Changed
- Fix typos in README.

## [1.0.1] - 2022/4/13
### Changed
- Add form attribute to password modal submit.

## [1.0.0] - 2022/4/12
### Added
- First release.

[1.0.1]: https://github.com/takuya-motoshima/pdf-live/compare/v1.0.0...v1.0.1
[1.0.2]: https://github.com/takuya-motoshima/pdf-live/compare/v1.0.1...v1.0.2
[1.0.3]: https://github.com/takuya-motoshima/pdf-live/compare/v1.0.2...v1.0.3
[1.0.4]: https://github.com/takuya-motoshima/pdf-live/compare/v1.0.3...v1.0.4
[1.0.5]: https://github.com/takuya-motoshima/pdf-live/compare/v1.0.4...v1.0.5
[1.0.6]: https://github.com/takuya-motoshima/pdf-live/compare/v1.0.5...v1.0.6
[1.0.7]: https://github.com/takuya-motoshima/pdf-live/compare/v1.0.6...v1.0.7
[1.0.8]: https://github.com/takuya-motoshima/pdf-live/compare/v1.0.7...v1.0.8
[1.0.9]: https://github.com/takuya-motoshima/pdf-live/compare/v1.0.8...v1.0.9
[1.0.10]: https://github.com/takuya-motoshima/pdf-live/compare/v1.0.9...v1.0.10
[1.0.11]: https://github.com/takuya-motoshima/pdf-live/compare/v1.0.10...v1.0.11
[1.0.12]: https://github.com/takuya-motoshima/pdf-live/compare/v1.0.11...v1.0.12
[1.0.13]: https://github.com/takuya-motoshima/pdf-live/compare/v1.0.12...v1.0.13
[1.0.14]: https://github.com/takuya-motoshima/pdf-live/compare/v1.0.13...v1.0.14
[1.0.15]: https://github.com/takuya-motoshima/pdf-live/compare/v1.0.14...v1.0.15
[1.0.16]: https://github.com/takuya-motoshima/pdf-live/compare/v1.0.15...v1.0.16
[1.0.17]: https://github.com/takuya-motoshima/pdf-live/compare/v1.0.16...v1.0.17
[1.0.18]: https://github.com/takuya-motoshima/pdf-live/compare/v1.0.17...v1.0.18