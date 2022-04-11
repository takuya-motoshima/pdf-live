/**
  * Load a PDF document.
  */
export default async url => {
  try {
    // Setting worker path to worker bundle.
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'libs/pdf.worker.min.js';

    // Delimiter for timestamp parameter to invalidate cache.
    const delimiter = url.indexOf('?') === -1 ? '?' : '&';

    // Loading a document.
    const pdfDoc = await pdfjsLib.getDocument(`${url}${delimiter}t=${+new Date()}`).promise;
    // console.log(`Loaded ${url}. Total number of pages is ${pdfDoc.numPages}`);
    return pdfDoc;
  } catch (err) {
    throw new Error('Failed to load document. The document is either corrupt or not valid.');
  }
}