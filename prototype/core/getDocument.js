import relativePathToUrl from '../shared/relativePathToUrl.js';

/**
  * Load a PDF document.
  */
export default async url => {
  try {
    // Setting worker path to worker bundle.
    pdfjsLib.GlobalWorkerOptions.workerSrc = '../dist/pdf.worker.js';

    // // Add a timestamp parameter to document URLs to always read the latest documents.
    // const delimiter = url.indexOf('?') === -1 ? '?' : '&';
    // url += `${delimiter}t=${+new Date()}`;
    // console.log(`Document URL:${url}`);

    // If the CMap format is a relative path, convert it to URL format.
    let cMapUrl = '../dist/cmaps/';
    if (cMapUrl)
      cMapUrl = relativePathToUrl(cMapUrl);
    // console.log(`cMapUrl=${cMapUrl}`);

    // Loading a document.
    const pdfDoc = await pdfjsLib.getDocument({
      url,
      cMapUrl,
      cMapPacked: true
    }).promise;
    return pdfDoc;
  } catch (err) {
    throw new Error('Failed to load document. The document is either corrupt or not valid.');
  }
}