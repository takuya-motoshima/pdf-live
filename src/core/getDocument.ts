import Language from '~/interfaces/Language';
import relativePathToUrl from '~/shared/relativePathToUrl';

/**
  * Load a PDF document.
  */
export default async (documentUrl: string, workerSrc: string, language: Language, cMapUrl?: string): Promise<any> => {
  try {
    // Setting worker path to worker bundle.
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

    // // Add a timestamp parameter to document URLs to always read the latest documents.
    // const delimiter = documentUrl.indexOf('?') === -1 ? '?' : '&';
    // documentUrl += `${delimiter}t=${+new Date()}`;

    // If the CMap format is a relative path, convert it to URL format.
    if (cMapUrl)
      cMapUrl = relativePathToUrl(cMapUrl);
    // If there is no slash at the end of cMap, add it.
    // if (cMapUrl && cMapUrl.slice(-1) !== '/')
    //   cMapUrl += '/';

    // Loading a document.
    const pdfDoc = await window.pdfjsLib.getDocument({
      url: documentUrl,
      cMapUrl,
      cMapPacked: true
    }).promise;
    return pdfDoc;
  } catch (err) {
    throw new Error(language.message.badDocument);
  }
}