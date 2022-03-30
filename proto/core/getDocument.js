import BadDocumentError from '../exceptions/BadDocumentError.js';

/**
  * Load a PDF document.
  */
export default async url => {
  try {
    // Setting worker path to worker bundle.
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'libs/pdf.worker.js';

    // Loading a document.
    const pdfDoc = await pdfjsLib.getDocument(url).promise;
    // console.log(`Loaded ${url}. Total number of pages is ${pdfDoc.numPages}`);
    return pdfDoc;
  } catch (err) {
    throw new BadDocumentError(err instanceof Error ? err.message : String(err));
  }
}