# pdf-live
![heading](heading.svg)

'PDF LIVE' is a PDF viewer that extends the open source 'mozilla/pdf.js'. You can start the PDF viewer with toolbar right away with 'PDF LIVE'.

<div style="page-break-before: always;"></div>

## Install
Install with [npm](https://www.npmjs.com/):
```sh
npm i pdf-live
```

## Quick Start

### CSS
Copy-paste the stylesheet &lt;link&gt; into your &lt;head&gt; to load our CSS.
```css
<link rel="stylesheet" href="node_modules/pdf-live/dist/pdf-live.css">
```

### HTML
Copy-paste the icon &lt;link&gt; into your &lt;head&gt; to load our Favicon.  
This step is not required. If you do not wish to set a favicon, skip this step.
```html
<link rel="icon" type="image/svg+xml" href="node_modules/pdf-live/dist/favicon.svg">
```

Copy-paste the &lt;pdf-live&gt; into your &lt;body&gt; to load our PDF live.
```html
<pdf-live src="sample.pdf" lang="en" worker="node_modules/pdf-live/dist/pdf.worker.min.js"></pdf-live>
```

### JS
#### For ES6
To use PDF Live in ES6, simply import the PDF Live ESM module.
```html
<script type="module">
  import './node_modules/pdf-live/dist/pdf-live.esm.js';
</script>
```

#### For ES5
To use PDF Live in ES5, please load the UMD module of PDF Live with &lt;script&gt; tag.
```html
<script src="node_modules/pdf-live/dist/pdf-live.js"></script>
```

## Usage
The following example references a PDF live element from within the JS code and sets the event.
```js
// Find the PDFLive node.
const pdflive = document.querySelector('pdf-live');

// Set event handler for PDF Live.
pdflive
  .on('documentLoaded', () => {
    // PDF document load event.
    console.log('Loaded PDF document');
  })
  .on('pageChange', evnt => {
    // Page change event.
    const pageNum = evnt.detail.pageNum;
    console.log(`Opened page ${pageNum}`);
  });
```

## Author
**Takuya Motoshima**

* [github/takuya-motoshima](https://github.com/takuya-motoshima)
* [twitter/TakuyaMotoshima](https://twitter.com/TakuyaMotoshima)
* [facebook/takuya.motoshima.7](https://www.facebook.com/takuya.motoshima.7)

## License
[MIT](LICENSE)