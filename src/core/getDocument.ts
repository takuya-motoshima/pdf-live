/**
  * Load a PDF document.
  *
  * @param  {string} url
  * @param  {string} workerSrc
  * @return {PDFDocumentProxy}
  */
export default async (url: string, workerSrc: string): Promise<any> => {
// export default async (url: string): Promise<pdfjsLib.PDFDocumentProxy> => {
  // Setting worker path to worker bundle.
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

  // Loading a document.
  const pdfDoc = await window.pdfjsLib.getDocument(url).promise;
  console.log(`Loaded ${url}. Total number of pages is ${pdfDoc.numPages}`);
  return pdfDoc;
}