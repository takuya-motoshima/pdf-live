# pdf-live
![heading](heading.svg)

'PDF LIVE' is a PDF viewer that extends the open source 'mozilla/pdf.js'.
You can start the PDF viewer with toolbar right away with 'PDF LIVE'.

<div style="page-break-before: always;"></div>

## Install
Install with [npm](https://www.npmjs.com/).
```sh
npm install pdf-live
```

## Quick Start

### ES6 syntax
HTML:
```html
<pdf-live src="sample.pdf" lang="ja" worker="node_modules/pdf-live/dist/pdf.worker.js"></pdf-live>
```

JS:
```js
import './node_modules/pdf-live/dist/pdf-live.esm.js';
```

### ES5 syntax
```html
<pdf-live src="sample.pdf" lang="ja" worker="node_modules/pdf-live/dist/pdf.worker.js"></pdf-live>

<script src="node_modules/pdf-live/dist/pdf-live.js"></script>
<script>
</script>
```

## Author
**Takuya Motoshima**

* [github/takuya-motoshima](https://github.com/takuya-motoshima)
* [twitter/TakuyaMotoshima](https://twitter.com/TakuyaMotoshima)
* [facebook/takuya.motoshima.7](https://www.facebook.com/takuya.motoshima.7)

## License
[MIT](LICENSE)