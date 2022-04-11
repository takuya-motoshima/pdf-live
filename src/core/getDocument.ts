import Language from '~/interfaces/Language';

/**
  * Load a PDF document.
  *
  * @param  {string} url
  * @param  {string} workerSrc
  * @return {PDFDocumentProxy}
  */
export default async (url: string, workerSrc: string, language: Language): Promise<any> => {
  try {
    // Setting worker path to worker bundle.
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

    // Delimiter for timestamp parameter to invalidate cache.
    const delimiter = url.indexOf('?') === -1 ? '?' : '&';

    // Loading a document.
    const pdfDoc = await window.pdfjsLib.getDocument(`${url}${delimiter}t=${+new Date()}`).promise;
    // console.log(`Loaded ${url}. Total number of pages is ${pdfDoc.numPages}`);
    return pdfDoc;
  } catch (err) {
    throw new Error(language.message.badDocument);
  }
}