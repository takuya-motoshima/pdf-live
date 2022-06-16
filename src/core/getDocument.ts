import Language from '~/interfaces/Language';

/**
  * Load a PDF document.
  *
  * @param  {string} url
  * @param  {string} workerSrc
  * @param  {string} cMapUrl
  * @return {PDFDocumentProxy}
  */
export default async (url: string, workerSrc: string, language: Language, cMapUrl?: string): Promise<any> => {
  try {
    // Setting worker path to worker bundle.
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

    // Delimiter for timestamp parameter to invalidate cache.
    const delimiter = url.indexOf('?') === -1 ? '?' : '&';

    // If there is no slash at the end of cMap, add it.
    if (cMapUrl && cMapUrl.slice(-1) !== '/')
      cMapUrl += '/';

    // Loading a document.
    const pdfDoc = await window.pdfjsLib.getDocument({
      url: `${url}${delimiter}t=${+new Date()}`,
      cMapUrl,
      cMapPacked: true
    }).promise;
    return pdfDoc;
  } catch (err) {
    throw new Error(language.message.badDocument);
  }
}