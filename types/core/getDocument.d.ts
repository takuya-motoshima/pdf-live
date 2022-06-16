import Language from '~/interfaces/Language';
declare const _default: (url: string, workerSrc: string, language: Language, cMapUrl?: string | undefined) => Promise<any>;
/**
  * Load a PDF document.
  *
  * @param  {string} url
  * @param  {string} workerSrc
  * @param  {string} cMapUrl
  * @return {PDFDocumentProxy}
  */
export default _default;
