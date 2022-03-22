// import {PDFDocumentProxy} from 'pdfjs-dist';

/**
 * Print PDF.
 *
 * @param {string} url
 */
export default async url => {
  // Iframe for embedding print data.
  const printFrame = document.querySelector('[data-element="printFrame"]');

  // Load PDF into iframe.
  printFrame.src = url;
  return new Promise(resolve => {
    printFrame.addEventListener('load', () => {
      // Print after loading the PDF data.
      printFrame.contentWindow.print();
      resolve();
    }, {passive: true, once: true});
  });
}
// /**
//  * Print PDF.
//  *
//  * @param {PDFDocumentProxy} pdfDoc
//  */
// export default async pdfDoc => {
//   // Access raw PDF data.
//   const data = await pdfDoc.getData();
// 
//   // Create a Uint8Array object.
//   const arr = new Uint8Array(data);
// 
//   // Convert Uint8Array to blob.
//   const blob = new Blob([arr], {type: 'application/pdf'});
// 
//   // Iframe for embedding print data.
//   const printFrame = document.querySelector('[data-element="printFrame"]');
// 
//   // Embed PDF data in a frame.
//   printFrame.src = URL.createObjectURL(blob);
// 
//   return new Promise(resolve => {
//     printFrame.addEventListener('load', () => {
//       // Print after loading the PDF data.
//       printFrame.contentWindow.print();
//       resolve();
//     }, {passive: true, once: true});
//   });
// }