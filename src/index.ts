import './index.css';
import getDocument from '~/core/getDocument';
import renderPages from '~/core/renderPages';
import resizePage from '~/core/resizePage';
import printPdf from '~/core/printPdf';
import downloadPdf from '~/core/downloadPdf';
import loadPdfJs from '~/core/loadPdfJs';
import LoadingModal from '~/components/LoadingModal';
import ErrorModal from '~/components/ErrorModal';
// import warningModal from '~/components/warningModal';
// import passwordModal from '~/components/passwordModal';
import LeftPanel from '~/components/LeftPanel';
import ZoomNav from '~/components/ZoomNav';
import PageNav from '~/components/PageNav';
import getFilename from '~/helpers/getFilename';
import Viewport from '~/interfaces/Viewport';
import i18n from '~/i18n';
import Language from './interfaces/Language';
import hbs from 'handlebars-extd';
import BadDocumentError from '~/exceptions/BadDocumentError';

/**
 * PDF LIVE component class.
 */
class PdfLive extends HTMLElement {
  /** @type {LoadingModal} */
  private loadingModal: LoadingModal = new LoadingModal(this);

  /** @type {ErrorModal} */
  private errorModal: ErrorModal = new ErrorModal(this);

  /** @type {Language} */
  private language: Language;

  /** @type {boolean} */
  private loaded: boolean = false;

  /** @type {boolean} */
  private calledLoadHandler : boolean = false;

  /**
   * constructor
   */
  constructor() {
    super();

    // Show loading.
    this.loadingModal.show();

    // Extract locale.
    this.language = i18n(this.getAttribute('lang') || 'en');
  }

  /**
   * Called every time the element is inserted into the DOM.
   * 
   * @return {void}
   */
  protected async connectedCallback(): Promise<void> {
    try {
      // Load pdf-dist JS.
      await loadPdfJs();

      // Set the pdf live application CSS class to the root node.
      this.classList.add('pl-app');

      // Render viewer.
      this.renderViewer();

      // Get the URL from the src attribute.
      const url = this.getAttribute('src');
      if (!url)
        throw new Error('Element "pdf-live" is missing required attribute "src"');

      // Get the Worker URL from the worker attribute..
      const workerSrc = this.getAttribute('worker');
      if (!workerSrc)
        throw new Error('Element "pdf-live" is missing required attribute "worker"');

      // Set the PDF file name in the title.
      document.title = getFilename(url);

      // Load a PDF document.
      const pdfDoc = await getDocument(url, workerSrc);

      // Keep page width and height for zoom factor calculation to fit by page or width.
      const standardViewport = await (async (): Promise<Viewport> => {
        const {width, height} = (await pdfDoc.getPage(1)).getViewport({scale: 1.5 * 1.0});
        return {width, height}
      })();

      // Initialize zoom menu.
      const zoomNav = (new ZoomNav(this, standardViewport)).onChange((zoomFactor: number) => {
        // Change the zoom factor of the page when the zoom is changed.
        // Resize page.
        resizePage(pages, zoomFactor);
      });

      // Render pages.
      const pages = await renderPages(pdfDoc, zoomNav.getZoomFactor());

      // Initialize the left panel.
      const leftPanel = (new LeftPanel(this, pages)).onSelect((pageNum: number) => {
        // Thumbnail selection event.
        // View the page corresponding to the selected thumbnail in the viewer.
        pageNav.activatePage(pageNum);
      });

      // Initialize page navigation.
      const pageNav = (new PageNav(this, pdfDoc.numPages)).onChange((pageNum: number) => {
        // If the page you are browsing changes.
        // Activate the thumbnail page of the browsing page.
        leftPanel.activatePage(pageNum);

        // Invoke pagechange event.
        this.invoke('pageChange', {pageNum});
      });

      // Print PDF.
      this.querySelector('[data-element="printButton"]')!.addEventListener('click', async () => {
        await printPdf(url);
        // await printPdf(pdfDoc);
      }, {passive: true});

      // Download PDF.
      this.querySelector('[data-element="downloadButton"]')!.addEventListener('click', async () => {
        await downloadPdf(pdfDoc, getFilename(url));
      }, {passive: true});

      // Show page container after successful loading of PDF.
      this.querySelector('[data-element="pagegContainer"]')!.classList.remove('pl-page-container-hide');

      // Check if the event has already been executed so that the documentLoaded event is not executed twice.
      if (!this.calledLoadHandler)
        // Invoke PDF document loaded event.
        this.invoke('documentLoaded');

      // Turn on the document loaded flag.
      this.loaded = true;
    } catch (err) {
      let message = 'Unknown Error';
      if (err instanceof BadDocumentError)
        message = this.language.message.badDocument;
      else if (err instanceof Error)
        message = err.message;
      else
        message = String(err);
      this.errorModal.show(message);
      throw err;
    } finally {
      // Hide loading.
      this.loadingModal.hide();
    }
  }

  /**
   * Define elements
   *
   * @return {PdfLive}
   */
  public static define(): typeof PdfLive {
    if (window.customElements.get('pdf-live'))
      return this;
    window.customElements.define('pdf-live', this);
    return this;
  }

  /**
   * Generate elements
   *
   * @return {PdfLive}
   */
  public static createElement(): PdfLive {
    const PdfLive = this.define();
    return new PdfLive();
  }

  /**
   * Add event listener
   * 
   * @param  {'pageChange'|'documentLoaded'}  type
   * @param  {() => void}                     listener
   * @param  {{once: boolen}}                 options.once
   * @return {PdfLive}
   */
   public on(type: 'pageChange'|'documentLoaded', listener: (evnt?: Event) => void, options: {once: boolean } = {once: false}): PdfLive {
    // Set event handler.
    this.addEventListener(type, listener, options);

    // If the document is already loaded and the loaded event is set, immediately invoke the loaded event..
    if (type === 'documentLoaded' || this.loaded) {
      this.invoke('documentLoaded');
      this.calledLoadHandler = true;
    }
    return this;
  }

  /**
   * Remove event listener
   * 
   * @param  {string}     type
   * @param  {() => void} listener
   * @return {PdfLive}
   */
   public off(type: string, listener: (evnt?: Event) => void): PdfLive {
    this.removeEventListener(type, listener);
    return this;
  }

  /**
   * Call event listener
   * 
   * @param  {string} type
   * @param  {Object} detail
   * @return {void}
   */
  private invoke(type: string, detail: {} = {}): void {
    const evnt = new CustomEvent(type, {detail});
    this.dispatchEvent(evnt);
  }

  /**
   * Render viewer.
   */
  private renderViewer() {
    this.insertAdjacentHTML('beforeend', hbs.compile(
      `<!-- begin:Header -->
        <div data-element="header" class="pl-header">
          <div class="pl-header-items">
            <button data-element="leftPanelToggle"
                    class="pl-button"
                    aria-label="{{language.component.leftPanel}}"
                    title="{{language.component.leftPanel}}">
              <svg class="pl-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
                <path d="M0 96C0 78.33 14.33 64 32 64H416C433.7 64 448 78.33 448 96C448 113.7 433.7 128 416 128H32C14.33 128 0 113.7 0 96zM0 256C0 238.3 14.33 224 32 224H416C433.7 224 448 238.3 448 256C448 273.7 433.7 288 416 288H32C14.33 288 0 273.7 0 256zM416 448H32C14.33 448 0 433.7 0 416C0 398.3 14.33 384 32 384H416C433.7 384 448 398.3 448 416C448 433.7 433.7 448 416 448z"/>
              </svg>
            </button>
            <div class="pl-zoom-overlay">
              <button data-element="zoomOutButton"
                      class="pl-button action-button"
                      aria-label="{{language.action.zoomOut}}"
                      aria-keyshortcuts="Control+-"
                      title="{{language.action.zoomOut}}{{language.shortcut.zoomOut}}">
                <svg class="pl-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
                  <path d="M400 288h-352c-17.69 0-32-14.32-32-32.01s14.31-31.99 32-31.99h352c17.69 0 32 14.3 32 31.99S417.7 288 400 288z"/>
                </svg>
              </button>
              <div data-element="zoomToggle" class="pl-zoom-overlay-toggle">
                <div class="pl-zoom-overlay-toggle-text">
                  <form data-element="zoomForm">
                    <input data-element="zoomInput" type="text" class="pl-textarea" tabindex="-1" aria-label="Set zoom" value="100">
                  </form>
                  <span>%</span>
                </div>
                <button class="pl-button" aria-label="Zoom Controls">
                  <svg class="pl-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512">
                    <path d="M192 384c-8.188 0-16.38-3.125-22.62-9.375l-160-160c-12.5-12.5-12.5-32.75 0-45.25s32.75-12.5 45.25 0L192 306.8l137.4-137.4c12.5-12.5 32.75-12.5 45.25 0s12.5 32.75 0 45.25l-160 160C208.4 380.9 200.2 384 192 384z"/>
                  </svg>
                </button>
              </div>
              <button data-element="zoomInButton"
                      class="pl-button action-button"
                      aria-label="{{language.action.zoomIn}}"
                      aria-keyshortcuts="Control+="
                      title="{{language.action.zoomIn}}{{language.shortcut.zoomIn}}">
                <svg class="pl-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
                  <path d="M432 256c0 17.69-14.33 32.01-32 32.01H256v144c0 17.69-14.33 31.99-32 31.99s-32-14.3-32-31.99v-144H48c-17.67 0-32-14.32-32-32.01s14.33-31.99 32-31.99H192v-144c0-17.69 14.33-32.01 32-32.01s32 14.32 32 32.01v144h144C417.7 224 432 238.3 432 256z"/>
                </svg>
              </button>
            </div>
            <button data-element="printButton"
                    class="pl-button"
                    aria-label="{{language.action.print}}"
                    title="{{language.action.print}}">
              <svg class="pl-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                <path d="M448 192H64C28.65 192 0 220.7 0 256v96c0 17.67 14.33 32 32 32h32v96c0 17.67 14.33 32 32 32h320c17.67 0 32-14.33 32-32v-96h32c17.67 0 32-14.33 32-32V256C512 220.7 483.3 192 448 192zM384 448H128v-96h256V448zM432 296c-13.25 0-24-10.75-24-24c0-13.27 10.75-24 24-24s24 10.73 24 24C456 285.3 445.3 296 432 296zM128 64h229.5L384 90.51V160h64V77.25c0-8.484-3.375-16.62-9.375-22.62l-45.25-45.25C387.4 3.375 379.2 0 370.8 0H96C78.34 0 64 14.33 64 32v128h64V64z"/>
              </svg>
            </button>
            <button data-element="downloadButton"
                    class="pl-button"
                    aria-label="{{language.action.download}}"
                    title="{{language.action.download}}">
              <svg class="pl-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                <path d="M480 352h-133.5l-45.25 45.25C289.2 409.3 273.1 416 256 416s-33.16-6.656-45.25-18.75L165.5 352H32c-17.67 0-32 14.33-32 32v96c0 17.67 14.33 32 32 32h448c17.67 0 32-14.33 32-32v-96C512 366.3 497.7 352 480 352zM432 456c-13.2 0-24-10.8-24-24c0-13.2 10.8-24 24-24s24 10.8 24 24C456 445.2 445.2 456 432 456zM233.4 374.6C239.6 380.9 247.8 384 256 384s16.38-3.125 22.62-9.375l128-128c12.49-12.5 12.49-32.75 0-45.25c-12.5-12.5-32.76-12.5-45.25 0L288 274.8V32c0-17.67-14.33-32-32-32C238.3 0 224 14.33 224 32v242.8L150.6 201.4c-12.49-12.5-32.75-12.5-45.25 0c-12.49 12.5-12.49 32.75 0 45.25L233.4 374.6z"/>
              </svg>
            </button>
          </div>
          <div class="pl-header-border"></div>
        </div>
        <!-- end:Header -->
        
        <!-- begin:Content -->
        <div class="pl-content">

          <!-- begin:Left panel -->
          <!-- <div data-element="leftPanel" class="pl-left-panel"> -->
          <div data-element="leftPanel" class="pl-left-panel pl-left-panel-closed">
            <div class="pl-left-panel-container">
              <div data-element="thumbnailsPanel" class="pl-thumbnails-panel"></div>
            </div>
          </div>
          <!-- end:Left panel -->

          <!-- begin:Page container -->
          <!-- <div data-element="pagegContainer" class="pl-page-container pl-page-container-open"> -->
          <div data-element="pagegContainer" class="pl-page-container pl-page-container-hide">
            
            <!-- begin:Page view -->
            <div data-element="pageView" class="pl-page-view"></div>
            <!-- end:Page view -->

            <!-- begin:Page navigation -->
            <div class="pl-page-footer" style="width: calc(100% - 0px); margin-left: 0px;">
              <div data-element="pageNavOverlay" class="pl-page-nav-overlay">
                <button data-element="prevPageButton"
                        class="pl-button pl-side-arrow-container"
                        aria-label="{{language.action.pagePrev}}"
                        title="{{language.action.pagePrev}}"
                        disabled>
                  <svg class="pl-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 512">
                    <path d="M192 448c-8.188 0-16.38-3.125-22.62-9.375l-160-160c-12.5-12.5-12.5-32.75 0-45.25l160-160c12.5-12.5 32.75-12.5 45.25 0s12.5 32.75 0 45.25L77.25 256l137.4 137.4c12.5 12.5 12.5 32.75 0 45.25C208.4 444.9 200.2 448 192 448z"/>
                  </svg>
                </button>
                <div class="pl-page-nav-form-container">
                  <form data-element="pageForm">
                    <input data-element="pageInput" type="text" tabindex="-1" aria-label="Set page" value="1"> / <span data-element="totalPage">1</span>
                  </form>
                </div>
                <button data-element="nextPageButton"
                        class="pl-button pl-side-arrow-container"
                        aria-label="{{language.action.pageNext}}"
                        title="{{language.action.pageNext}}">
                  <svg class="pl-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 512">
                    <path d="M64 448c-8.188 0-16.38-3.125-22.62-9.375c-12.5-12.5-12.5-32.75 0-45.25L178.8 256L41.38 118.6c-12.5-12.5-12.5-32.75 0-45.25s32.75-12.5 45.25 0l160 160c12.5 12.5 12.5 32.75 0 45.25l-160 160C80.38 444.9 72.19 448 64 448z"/>
                  </svg>
                </button>
              </div>
            </div>
            <!-- end:Page navigation -->

          </div>
          <!-- end:Page container -->

        </div>
        <!-- end:Content -->

        <!-- begin:Zoom menu -->
        <div data-element="zoomMenu" class="pl-zoom-menu pl-zoom-menu-closed" role="listbox" aria-label="{{language.component.zoomOverlay}}">
          <button data-element="zoomSelect"
                  data-value="pageWidth"
                  class="pl-button pl-zoom-menu-item"
                  aria-label="{{language.action.fitToWidth}}"
                  role="option">
            <svg class="pl-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
              <path d="M447.1 319.1v135.1c0 13.26-10.75 23.1-23.1 23.1h-135.1c-12.94 0-24.61-7.781-29.56-19.75c-4.906-11.1-2.203-25.72 6.937-34.87l30.06-30.06L224 323.9l-71.43 71.44l30.06 30.06c9.156 9.156 11.91 22.91 6.937 34.87C184.6 472.2 172.9 479.1 160 479.1H24c-13.25 0-23.1-10.74-23.1-23.1v-135.1c0-12.94 7.781-24.61 19.75-29.56C23.72 288.8 27.88 288 32 288c8.312 0 16.5 3.242 22.63 9.367l30.06 30.06l71.44-71.44L84.69 184.6L54.63 214.6c-9.156 9.156-22.91 11.91-34.87 6.937C7.798 216.6 .0013 204.9 .0013 191.1v-135.1c0-13.26 10.75-23.1 23.1-23.1h135.1c12.94 0 24.61 7.781 29.56 19.75C191.2 55.72 191.1 59.87 191.1 63.1c0 8.312-3.237 16.5-9.362 22.63L152.6 116.7l71.44 71.44l71.43-71.44l-30.06-30.06c-9.156-9.156-11.91-22.91-6.937-34.87c4.937-11.95 16.62-19.75 29.56-19.75h135.1c13.26 0 23.1 10.75 23.1 23.1v135.1c0 12.94-7.781 24.61-19.75 29.56c-11.1 4.906-25.72 2.203-34.87-6.937l-30.06-30.06l-71.43 71.43l71.44 71.44l30.06-30.06c9.156-9.156 22.91-11.91 34.87-6.937C440.2 295.4 447.1 307.1 447.1 319.1z"/>
            </svg>
            {{language.action.fitToWidth}}
          </button>
          <button data-element="zoomSelect"
                  data-value="pageFit"
                  class="pl-button pl-zoom-menu-item"
                  aria-label="{{language.action.fitToPage}}"
                  role="option">
            <svg class="pl-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
              <path d="M208 281.4c-12.5-12.5-32.76-12.5-45.26-.002l-78.06 78.07l-30.06-30.06c-6.125-6.125-14.31-9.367-22.63-9.367c-4.125 0-8.279 .7891-12.25 2.43c-11.97 4.953-19.75 16.62-19.75 29.56v135.1C.0013 501.3 10.75 512 24 512h136c12.94 0 24.63-7.797 29.56-19.75c4.969-11.97 2.219-25.72-6.938-34.87l-30.06-30.06l78.06-78.07c12.5-12.49 12.5-32.75 .002-45.25L208 281.4zM487.1 0h-136c-12.94 0-24.63 7.797-29.56 19.75c-4.969 11.97-2.219 25.72 6.938 34.87l30.06 30.06l-78.06 78.07c-12.5 12.5-12.5 32.76 0 45.26l22.62 22.62c12.5 12.5 32.76 12.5 45.26 0l78.06-78.07l30.06 30.06c9.156 9.141 22.87 11.84 34.87 6.937C504.2 184.6 512 172.9 512 159.1V23.1C512 10.74 501.3 0 487.1 0z"/>
            </svg>
            {{language.action.fitToPage}}
          </button>
          <div class="pl-divider"></div>
          <button data-element="zoomSelect" data-value="50" class="pl-zoom-menu-item" aria-label="50%" role="option">50%</button>
          <button data-element="zoomSelect" data-value="75" class="pl-zoom-menu-item" aria-label="75%" role="option">75%</button>
          <button data-element="zoomSelect" data-value="100" class="pl-zoom-menu-item pl-zoom-menu-item-selected" aria-label="100%" role="option"">100%</button>
          <button data-element="zoomSelect" data-value="125" class="pl-zoom-menu-item" aria-label="125%" role="option"">125%</button>
          <button data-element="zoomSelect" data-value="150" class="pl-zoom-menu-item" aria-label="150%" role="option"">150%</button>
          <button data-element="zoomSelect" data-value="200" class="pl-zoom-menu-item" aria-label="200%" role="option"">200%</button>
          <!-- <button data-element="zoomSelect" data-value="300" class="pl-zoom-menu-item" aria-label="300%" role="option"">300%</button> -->
          <!-- <button data-element="zoomSelect" data-value="400" class="pl-zoom-menu-item" aria-label="400%" role="option"">400%</button> -->
        </div>
        <!-- end:Zoom menu -->
        <iframe data-element="printFrame" style="display: none;"></iframe>`)({language: this.language}));
  }
}

PdfLive.define();
export default PdfLive;