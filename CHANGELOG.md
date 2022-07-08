# Changelog
All notable changes to this project will be documented in this file.

## [1.0.11] - 2022-07-08
### Fixed
- Added print and download methods to PDF viewer elements.

## [1.0.10] - 2022-06-16
### Fixed
- Updated pdfjs-dist version from "v2.13.216" to "v2.14.305". See [https://github.com/mozilla/pdf.js/releases/tag/v2.14.305](https://github.com/mozilla/pdf.js/releases/tag/v2.14.305)
- cMap can now be used to prevent garbled PDFs that use special fonts such as Japanese.
  ```html
  <pdf-live src="sample.pdf" worker="node_modules/pdf-live/dist/pdf.worker.js"
    cmap="/node_modules/pdf-live/dist/cmaps"></pdf-live>
  ```

## [1.0.9] - 2022-04-15
### Fixed
- Set the appropriate font size for each viewport width.
- If the locale is Japanese, the appropriate font family is set.

## [1.0.8] - 2022-04-15
### Fixed
- Fixed a bug that the submit button of the password modal was not locale-aware.
- The padding of the buttons in the modal was increased.

## [1.0.7] - 2022-04-15
### Fixed
- Fixed a bug where the locale was not applied to password modal error messages.

## [1.0.6] - 2022-04-15
### Fixed
- Fixed a bug that the file name specified in the title attribute was not applied to the download file name.
- Enclose the modal title name of the warning modal and password modal in h2.

## [1.0.5] - 2022-04-14
### Fixed
- Added title attribute to PDF live elements. For more information, see [here](https://lab.octopass.tech/pdf-live/docs/#api-properties).

## [1.0.4] - 2022-04-13
### Fixed
- PDF Live now supports IOS Safari.
- Initial zoom is 100% if viewport width is greater than 640px, otherwise fits page width.

## [1.0.3] - 2022-04-13
### Fixed
- Hide document title if viewport width is smaller than 640px.
- If the viewport width is smaller than 640px, the left panel is hidden in the first view.

## [1.0.2] - 2022-04-13
### Fixed
- Fix typos in README.

## [1.0.1] - 2022-04-13
### Fixed
- Add form attribute to password modal submit.

## [1.0.0] - 2022-04-12
### Fixed
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