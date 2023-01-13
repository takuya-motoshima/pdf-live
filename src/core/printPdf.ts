// import {PDFDocumentProxy} from 'pdfjs-dist';

/**
 * Print PDF.
 */
export default async (documentUrl: string): Promise<void> => {
  // Iframe for embedding print data.
  const printFrame = document.querySelector('[data-element="printFrame"]') as HTMLIFrameElement;

  // Load PDF into iframe.
  printFrame.src = documentUrl;
  return new Promise<void>(rslv => {
    printFrame.addEventListener('load', () => {
      // Print after loading the PDF data.
      printFrame.contentWindow!.print();
      rslv();
    }, {passive: true, once: true});
  });
}
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
//   return new Promise(rslv => {
//     printFrame.addEventListener('load', () => {
//       // Print after loading the PDF data.
//       printFrame.contentWindow.print();
//       rslv();
//     }, {passive: true, once: true});
//   });
// }