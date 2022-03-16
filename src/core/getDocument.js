/**
  * Load a PDF document.
  */
export default async url => {
  // Setting worker path to worker bundle.
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'src/pdf.worker.js';

  // Loading a document.
  return pdfjsLib.getDocument(url).promise;
}