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
```js
import pdfLive from 'pdf-live'; 

// Loading a document.
await pdfLive.loadDocument('helloworld.pdf');
```

### ES5 syntax
```html
<script src="node_modules/pdf-live/dist/build.js"></script>
<script>
  // Loading a document.
  await pdfLive.loadDocument('helloworld.pdf');
</script>
```

## Author
**Takuya Motoshima**

* [github/takuya-motoshima](https://github.com/takuya-motoshima)
* [twitter/TakuyaMotoshima](https://twitter.com/TakuyaMotoshima)
* [facebook/takuya.motoshima.7](https://www.facebook.com/takuya.motoshima.7)

## License
[MIT](LICENSE)

## Note
express
  50%   382/495   306/396
  100%  573/742   612/792
  200%  1530/1980 1224/1584
  400%  1382/423  1106/339
pdf.js
  50%   510/660   408/528
  100%  1020/1320 816/1056
  200%  2040/2640 1632/2112
  400%  3608/4664 3269/4228
