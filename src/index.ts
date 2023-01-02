import './index.css';
import getDocument from '~/core/getDocument';
import renderPages from '~/core/renderPages';
import resizePage from '~/core/resizePage';
import printPdf from '~/core/printPdf';
import downloadPdf from '~/core/downloadPdf';
import setTheme from '~/core/setTheme';
import restoreTheme from '~/core/restoreTheme';
import loadPdfJs from '~/core/loadPdfJs';
import Loading from '~/components/Loading';
import ErrorModal from '~/components/ErrorModal';
import PasswordModal from '~/components/PasswordModal';
import LeftPanel from '~/components/LeftPanel';
import ZoomNav from '~/components/ZoomNav';
import PageNav from '~/components/PageNav';
import getFilename from '~/helpers/getFilename';
import Viewport from '~/interfaces/Viewport';
import i18n from '~/i18n';
import Language from '~/interfaces/Language';
import hbs from 'handlebars-extd';
import isAsyncFunction from '~/shared/isAsyncFunction';

// The minimum width of the mobile.
// If the window width is smaller than this width in the first view, the side panel will be hidden.
const MINIMUM_MOBILE_WIDTH = 640;

/**
 * PDFLiveElement.
 */
class PDFLiveElement extends HTMLElement {
  /** @type {Loading} */
  private readonly loading: Loading = new Loading(this);

  /** @type {ErrorModal} */
  private readonly errorModal: ErrorModal = new ErrorModal(this);

  /** @type {PasswordModal} */
  private readonly passwordModal: PasswordModal;

  /** @type {Language} */
  private readonly language: Language;

  /** @type {boolean} */
  private loaded: boolean = false;

  /** @type {boolean} */
  private calledLoadListener : boolean = false;

  /** @type {boolean} */
  private pageNav: PageNav|undefined;

  /** @type {HTMLDivElement} */
  private readonly documentTitle: HTMLDivElement;

  /** @type {HTMLButtonElement} */
  private readonly printButton: HTMLButtonElement;

  /** @type {HTMLButtonElement} */
  private readonly downloadButton: HTMLButtonElement;

  /** @type {HTMLButtonElement} */
  private readonly themeChangeButton: HTMLButtonElement;

  /** @type {{[key: string]: Function}} */
  private readonly listeners: {[key: string]: Function|undefined} = {
    pageChange: undefined,
    documentLoaded: undefined,
    passwordEnter: undefined
  };

  /** @type {string|undefined} */
  private documentUrl: string|undefined = undefined;

  /** @type {any|undefined} */
  private documentObject: any|undefined = undefined;

  /**
   * constructor
   */
  constructor() {
    super();

    // Restore theme.
    if (this.getAttribute('restoretheme') !== 'false')
      restoreTheme();

    // language.
    const lang = this.getAttribute('lang') || 'en';

    // Extract locale.
    this.language = i18n(lang);

    // Set the current locale to the data-lang attribute.
    document.documentElement.setAttribute('data-lang', lang);

    // Render viewer.
    this.render();

    // Document title.
    this.documentTitle = this.querySelector('[data-element="title"]') as HTMLDivElement;

    // Print button.
    this.printButton = this.querySelector('[data-element="printButton"]') as HTMLButtonElement;

    // Download button.
    this.downloadButton = this.querySelector('[data-element="downloadButton"]') as HTMLButtonElement;

    // Change Theme button.
    this.themeChangeButton = this.querySelector('[data-element="themeChangeButton"]') as HTMLButtonElement;

    // Password Modal.
    this.passwordModal = new PasswordModal(this, this.language);
  }

  /**
   * Called every time the element is inserted into the DOM.
   * 
   * @return {void}
   */
  protected async connectedCallback(): Promise<void> {
    try {
      // Show loading.
      this.loading.show();

      // Get the URL from the src attribute.
      const url = this.getAttribute('src');
      if (!url)
        throw new Error('Element pdf-live is missing required attribute src');

      // Keep the URL of the PDF document.
      this.documentUrl = url;

      // Set the PDF file name in the title.
      if (this.getAttribute('title'))
        this.documentTitle.textContent = document.title = this.getAttribute('title') as string;
      else
        this.documentTitle.textContent = document.title = getFilename(url);

      // Get the Worker URL from the worker attribute.
      const workerSrc = this.getAttribute('worker');
      if (!workerSrc)
        throw new Error('Element pdf-live is missing required attribute worker');

      // Load pdf-dist JS.
      loadPdfJs();

      // Path of cMaps.
      let cMapUrl;
      if (this.getAttribute('cmap'))
        cMapUrl = this.getAttribute('cmap') as string;

      // Load a PDF document.
      this.documentObject = await getDocument(url, workerSrc, this.language, cMapUrl);

      // Check for password protection.
      if (this.hasAttribute('protected')) {   
        // If password protection is on.
        // Hide loading.
        this.loading.hide();

        // Set password enter event for password modal.
        this.passwordModal.onEnter(async (password: string): Promise<boolean> => {
          return new Promise<boolean>(async (rslv, rej) => {
            if (!this.listeners.passwordEnter)
              return void rej(new Error('Password protection requires password enter event'));
            if (isAsyncFunction(this.listeners.passwordEnter))
              rslv(await this.listeners.passwordEnter(password));
            else
              rslv(this.listeners.passwordEnter(password));
          });
        });

        // Displays a password entry form.
        await this.passwordModal.show();

        // Show loading.
        this.loading.show();
      }

      // Keep page width and height for zoom factor calculation to fit by page or width.
      const defaultViewport = await (async (): Promise<Viewport> => {
        const {width, height} = (await this.documentObject.getPage(1)).getViewport({scale: 1.5 * 1.0});
        return {width, height}
      })();

      // Initialize zoom menu.
      const zoomNav = (new ZoomNav(this, defaultViewport)).onChange((zoomFactor: number) => {
        // Change the zoom factor of the page when the zoom is changed.
        // Resize page.
        resizePage(pages, zoomFactor);
      });

      // Render pages.
      const pages = await renderPages(this.documentObject, zoomNav.getZoomFactor());

      // Initialize the left panel.
      const leftPanel = (new LeftPanel(this, pages)).onSelect((pageNum: number) => {
        // Thumbnail selection event.
        // View the page corresponding to the selected thumbnail in the viewer.
        this.pageNav?.activatePage(pageNum);
      });

      // Initialize page navigation.
      this.pageNav = (new PageNav(this, this.documentObject.numPages)).onChange((pageNum: number) => {
        // If the page you are browsing changes.
        // Activate the thumbnail page of the browsing page.
        leftPanel.activatePage(pageNum);

        // Invoke pagechange event.
        if (this.listeners.pageChange)
          this.listeners.pageChange(pageNum);
      });

      // Print PDF.
      this.printButton.addEventListener('click', async () => {
        await printPdf(url);
      }, {passive: true});

      // Download PDF.
      this.downloadButton.addEventListener('click', async () => {
        // Download Documentation.
        await this.download();
      }, {passive: true});

      // Change theme. 
      this.themeChangeButton.addEventListener('click', evnt => {
        // Current theme.
        let currentTheme = document.documentElement.getAttribute('data-theme');

        // New theme.
        const target = evnt.currentTarget as HTMLButtonElement;
        let newTheme;
        if (!currentTheme || currentTheme === 'light') {
          newTheme = 'dark';
          target.setAttribute('data-mode', 'dark');
          target.setAttribute('aria-label', this.language.action.darkMode);
          target.setAttribute('title', this.language.action.darkMode);
        } else {
          newTheme = 'light';
          target.setAttribute('data-mode', 'light');
          target.setAttribute('aria-label', this.language.action.lightMode);
          target.setAttribute('title', this.language.action.lightMode);
        }

        // Update theme.
        setTheme(newTheme);
      }, {passive: true});

      // Show page container after successful loading of PDF.
      this.classList.add('pl-document-loaded');

      // Check if the event has already been executed so that the documentLoaded event is not executed twice.
      if (!this.calledLoadListener && this.listeners.documentLoaded)
        // Invoke PDF document loaded event.
        this.listeners.documentLoaded()

      // Turn on the document loaded flag.
      this.loaded = true;
    } catch (err) {
      // Show error.
      this.errorModal.show(err instanceof Error ? err.message : String(err));
      throw err;
    } finally {
      // Hide loading.
      this.loading.hide();
    }
  }

  /**
   * Define elements
   *
   * @return {PDFLiveElement}
   */
  public static define(): typeof PDFLiveElement {
    if (window.customElements.get('pdf-live'))
      return this;
    window.customElements.define('pdf-live', this);
    return this;
  }

  /**
   * Generate elements
   *
   * @return {PDFLiveElement}
   */
  public static createElement(): PDFLiveElement {
    const PDFLiveElement = this.define();
    return new PDFLiveElement();
  }

  /**
   * Add event listener
   * 
   * @param  {'pageChange'|'documentLoaded'|'passwordEnter'}  type
   * @param  {Function}                                       listener
   * @return {PDFLiveElement}
   */
  public on(type: 'pageChange'|'documentLoaded'|'passwordEnter', listener: Function): PDFLiveElement {
    // Throws exception for invalid event types.
    if (!(type in this.listeners))
      throw new Error(`Invalid event type "${type}" dispatched in element <pdf-live>, Valid types are "pageChange", "documentLoaded", and "passwordEnter"`);

    // Set event listener.
    this.listeners[type] = listener;

    // If the document is already loaded and the loaded event is set, immediately invoke the loaded event.
    if (type === 'documentLoaded' && this.loaded) {
      if (this.listeners.documentLoaded)
        this.listeners.documentLoaded();
      this.calledLoadListener = true;
    }
    return this;
  }

  /**
   * Returns the current page number.
   *
   * @return {number}
   */
  public getCurrentPageNumber(): number {
    return this.pageNav!.getCurrentPageNumber();
  }

  /**
   * Render viewer.
   */
  private render(): void {
    const isMobile = window.innerWidth <= MINIMUM_MOBILE_WIDTH;
    const openLeftPanel = !isMobile;
    this.insertAdjacentHTML('beforeend', hbs.compile(
      `<!-- begin:Header -->
      <div data-element="header" class="pl-header">
        <div class="pl-header-container">
          <button data-element="leftPanelToggle" class="pl-left-panel-toggle pl-btn" aria-label="{{language.component.leftPanel}}" title="{{language.component.leftPanel}}">
            <svg class="pl-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
              <path d="M0 96C0 78.33 14.33 64 32 64H416C433.7 64 448 78.33 448 96C448 113.7 433.7 128 416 128H32C14.33 128 0 113.7 0 96zM0 256C0 238.3 14.33 224 32 224H416C433.7 224 448 238.3 448 256C448 273.7 433.7 288 416 288H32C14.33 288 0 273.7 0 256zM416 448H32C14.33 448 0 433.7 0 416C0 398.3 14.33 384 32 384H416C433.7 384 448 398.3 448 416C448 433.7 433.7 448 416 448z"/>
            </svg>
          </button>
          <div class="pl-document-title">
            <div data-element="title" class="pl-document-title-ellipsis"></div>
          </div>
          <div class="pl-zoom-overlay">
            <button data-element="zoomOutButton" class="pl-btn pl-btn-action" aria-label="{{language.action.zoomOut}}" aria-keyshortcuts="Control+-" title="{{language.action.zoomOut}}{{language.shortcut.zoomOut}}">
              <svg class="pl-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
                <path d="M400 288h-352c-17.69 0-32-14.32-32-32.01s14.31-31.99 32-31.99h352c17.69 0 32 14.3 32 31.99S417.7 288 400 288z"/>
              </svg>
            </button>
            <div data-element="zoomToggle" class="pl-zoom-overlay-toggle">
              <div class="pl-zoom-overlay-toggle-text">
                <form data-element="zoomForm">
                  <input data-element="zoomInput" type="text" class="textarea" tabindex="-1" aria-label="Set zoom">
                </form>
                <span>%</span>
              </div>
              <button class="pl-btn" aria-label="Zoom Controls">
                <svg class="pl-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512">
                  <path d="M192 384c-8.188 0-16.38-3.125-22.62-9.375l-160-160c-12.5-12.5-12.5-32.75 0-45.25s32.75-12.5 45.25 0L192 306.8l137.4-137.4c12.5-12.5 32.75-12.5 45.25 0s12.5 32.75 0 45.25l-160 160C208.4 380.9 200.2 384 192 384z"/>
                </svg>
              </button>
            </div>
            <button data-element="zoomInButton" class="pl-btn pl-btn-action" aria-label="{{language.action.zoomIn}}" aria-keyshortcuts="Control+=" title="{{language.action.zoomIn}}{{language.shortcut.zoomIn}}">
              <svg class="pl-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
                <path d="M432 256c0 17.69-14.33 32.01-32 32.01H256v144c0 17.69-14.33 31.99-32 31.99s-32-14.3-32-31.99v-144H48c-17.67 0-32-14.32-32-32.01s14.33-31.99 32-31.99H192v-144c0-17.69 14.33-32.01 32-32.01s32 14.32 32 32.01v144h144C417.7 224 432 238.3 432 256z"/>
              </svg>
            </button>
          </div>
          <div class="pl-header-nav">
            <button data-element="printButton" class="pl-btn" aria-label="{{language.action.print}}" title="{{language.action.print}}">
              <svg class="pl-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                <path d="M448 192H64C28.65 192 0 220.7 0 256v96c0 17.67 14.33 32 32 32h32v96c0 17.67 14.33 32 32 32h320c17.67 0 32-14.33 32-32v-96h32c17.67 0 32-14.33 32-32V256C512 220.7 483.3 192 448 192zM384 448H128v-96h256V448zM432 296c-13.25 0-24-10.75-24-24c0-13.27 10.75-24 24-24s24 10.73 24 24C456 285.3 445.3 296 432 296zM128 64h229.5L384 90.51V160h64V77.25c0-8.484-3.375-16.62-9.375-22.62l-45.25-45.25C387.4 3.375 379.2 0 370.8 0H96C78.34 0 64 14.33 64 32v128h64V64z"/>
              </svg>
            </button>
            <button data-element="downloadButton" class="pl-btn" aria-label="{{language.action.download}}" title="{{language.action.download}}">
              <svg class="pl-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                <path d="M480 352h-133.5l-45.25 45.25C289.2 409.3 273.1 416 256 416s-33.16-6.656-45.25-18.75L165.5 352H32c-17.67 0-32 14.33-32 32v96c0 17.67 14.33 32 32 32h448c17.67 0 32-14.33 32-32v-96C512 366.3 497.7 352 480 352zM432 456c-13.2 0-24-10.8-24-24c0-13.2 10.8-24 24-24s24 10.8 24 24C456 445.2 445.2 456 432 456zM233.4 374.6C239.6 380.9 247.8 384 256 384s16.38-3.125 22.62-9.375l128-128c12.49-12.5 12.49-32.75 0-45.25c-12.5-12.5-32.76-12.5-45.25 0L288 274.8V32c0-17.67-14.33-32-32-32C238.3 0 224 14.33 224 32v242.8L150.6 201.4c-12.49-12.5-32.75-12.5-45.25 0c-12.49 12.5-12.49 32.75 0 45.25L233.4 374.6z"/>
              </svg>
            </button>
            <button data-element="themeChangeButton" class="pl-btn" data-mode="light" aria-label="{{language.action.darkMode}}" title="{{language.action.darkMode}}">
              <svg class="pl-icon pl-icon-dark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                <path d="M279.135 512c78.756 0 150.982-35.804 198.844-94.775 28.27-34.831-2.558-85.722-46.249-77.401-82.348 15.683-158.272-47.268-158.272-130.792 0-48.424 26.06-92.292 67.434-115.836 38.745-22.05 28.999-80.788-15.022-88.919A257.936 257.936 0 0 0 279.135 0c-141.36 0-256 114.575-256 256 0 141.36 114.576 256 256 256zm0-464c12.985 0 25.689 1.201 38.016 3.478-54.76 31.163-91.693 90.042-91.693 157.554 0 113.848 103.641 199.2 215.252 177.944C402.574 433.964 344.366 464 279.135 464c-114.875 0-208-93.125-208-208s93.125-208 208-208z"/>
              </svg>
              <svg class="pl-icon pl-icon-light" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                <path d="M256 160c-52.9 0-96 43.1-96 96s43.1 96 96 96 96-43.1 96-96-43.1-96-96-96zm246.4 80.5l-94.7-47.3 33.5-100.4c4.5-13.6-8.4-26.5-21.9-21.9l-100.4 33.5-47.4-94.8c-6.4-12.8-24.6-12.8-31 0l-47.3 94.7L92.7 70.8c-13.6-4.5-26.5 8.4-21.9 21.9l33.5 100.4-94.7 47.4c-12.8 6.4-12.8 24.6 0 31l94.7 47.3-33.5 100.5c-4.5 13.6 8.4 26.5 21.9 21.9l100.4-33.5 47.3 94.7c6.4 12.8 24.6 12.8 31 0l47.3-94.7 100.4 33.5c13.6 4.5 26.5-8.4 21.9-21.9l-33.5-100.4 94.7-47.3c13-6.5 13-24.7.2-31.1zm-155.9 106c-49.9 49.9-131.1 49.9-181 0-49.9-49.9-49.9-131.1 0-181 49.9-49.9 131.1-49.9 181 0 49.9 49.9 49.9 131.1 0 181z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
      <!-- end:Header -->
      <!-- begin:Content -->
      <div class="pl-content">
        <!-- begin:Left panel -->
        <div data-element="leftPanel" class="pl-left-panel{{#unless openLeftPanel}} pl-left-panel-closed{{/unless}}">
          <div class="pl-left-panel-container">
            <div data-element="thumbnailsPanel" class="pl-thumbnails-panel"></div>
          </div>
        </div>
        <!-- end:Left panel -->
        <!-- begin:Page container -->
        <div data-element="pagegContainer" class="pl-page-container {{#if openLeftPanel}} pl-page-container-open{{/if}}">
          <!-- begin:Page view -->
          <div data-element="pageView" class="pl-page-view"></div>
          <!-- end:Page view -->
          <!-- begin:Page navigation -->
          <div class="pl-page-footer" style="width: calc(100% - 0px); margin-left: 0px;">
            <div data-element="pageNavOverlay" class="pl-page-nav-overlay">
              <button data-element="prevPageButton" class="pl-btn pl-btn-page" aria-label="{{language.action.pagePrev}}" title="{{language.action.pagePrev}}" disabled>
                <svg class="pl-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 512">
                  <path d="M192 448c-8.188 0-16.38-3.125-22.62-9.375l-160-160c-12.5-12.5-12.5-32.75 0-45.25l160-160c12.5-12.5 32.75-12.5 45.25 0s12.5 32.75 0 45.25L77.25 256l137.4 137.4c12.5 12.5 12.5 32.75 0 45.25C208.4 444.9 200.2 448 192 448z"/>
                </svg>
              </button>
              <div class="pl-page-nav-form-container">
                <form data-element="pageForm">
                  <input data-element="pageInput" type="text" tabindex="-1" aria-label="Set page" value="1"> / <span data-element="totalPage">1</span>
                </form>
              </div>
              <button data-element="nextPageButton" class="pl-btn pl-btn-page" aria-label="{{language.action.pageNext}}" title="{{language.action.pageNext}}">
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
        <button data-element="zoomSelect" data-value="pageWidth" class="pl-btn pl-zoom-menu-item{{#if isMobile}} pl-zoom-menu-item-selected{{/if}}" aria-label="{{language.action.fitToWidth}}" role="option">
          <svg class="pl-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M5.93,4.36,9.17,7.6a.39.39,0,0,1,0,.56l-1,1a.39.39,0,0,1-.56,0L4.36,5.93,2.68,7.6A.4.4,0,0,1,2,7.32V2.4A.4.4,0,0,1,2.4,2H7.32a.4.4,0,0,1,.28.68ZM7.6,14.83,4.36,18.07,2.68,16.4a.4.4,0,0,0-.68.28V21.6a.4.4,0,0,0,.4.4H7.32a.4.4,0,0,0,.28-.68L5.93,19.64,9.17,16.4a.39.39,0,0,0,0-.56l-1-1A.39.39,0,0,0,7.6,14.83ZM16.4,2.68l1.67,1.68L14.83,7.6a.39.39,0,0,0,0,.56l1,1a.39.39,0,0,0,.56,0l3.24-3.24L21.32,7.6A.4.4,0,0,0,22,7.32V2.4a.4.4,0,0,0-.4-.4H16.68A.4.4,0,0,0,16.4,2.68Zm-.56,12.15-1,1a.39.39,0,0,0,0,.56l3.24,3.24L16.4,21.32a.4.4,0,0,0,.28.68H21.6a.4.4,0,0,0,.4-.4V16.68a.4.4,0,0,0-.68-.28l-1.68,1.67L16.4,14.83A.39.39,0,0,0,15.84,14.83Z"></path>
          </svg>{{language.action.fitToWidth}}
        </button>
        <button data-element="zoomSelect" data-value="pageFit" class="pl-btn pl-zoom-menu-item" aria-label="{{language.action.fitToPage}}" role="option">
          <svg class="pl-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M9.76,13.06l-5,5L3.07,16.4a.4.4,0,0,0-.68.28V21.6a.4.4,0,0,0,.4.4H7.71A.4.4,0,0,0,8,21.32L6.32,19.64l5-5a.4.4,0,0,0,0-.57l-1-1A.39.39,0,0,0,9.76,13.06Zm7-10.38,1.67,1.68-5,5a.4.4,0,0,0,0,.57l1,1A.4.4,0,0,0,15,11l5-5L21.71,7.6a.4.4,0,0,0,.68-.28V2.4A.4.4,0,0,0,22,2H17.07A.4.4,0,0,0,16.79,2.68Z"></path>
          </svg>{{language.action.fitToPage}}
        </button>
        <div class="pl-divider"></div>
        <button data-element="zoomSelect" data-value="50" class="pl-zoom-menu-item" aria-label="50%" role="option">50%</button>
        <button data-element="zoomSelect" data-value="75" class="pl-zoom-menu-item" aria-label="75%" role="option">75%</button>
        <button data-element="zoomSelect" data-value="100" class="pl-zoom-menu-item{{#unless isMobile}} pl-zoom-menu-item-selected{{/unless}}" aria-label="100%" role="option"">100%</button>
        <button data-element="zoomSelect" data-value="125" class="pl-zoom-menu-item" aria-label="125%" role="option"">125%</button>
        <button data-element="zoomSelect" data-value="150" class="pl-zoom-menu-item" aria-label="150%" role="option"">150%</button>
        <button data-element="zoomSelect" data-value="200" class="pl-zoom-menu-item" aria-label="200%" role="option"">200%</button>
      </div>
      <!-- end:Zoom menu -->
      <iframe data-element="printFrame" style="display: none;"></iframe>`)({
        language: this.language,
        openLeftPanel,
        isMobile
      }));
  }

  /**
   * Print Documentation.
   */
  public async print(): Promise<void> {
    return printPdf(this.documentUrl as string);
  }

  /**
   * Download Documentation.
   */
  public async download(): Promise<void> {
    // File name to download.
    let documentTitle;
    if (this.getAttribute('title')) {
      documentTitle = this.getAttribute('title') as string;

      // Add .pdf extension if document name does not have one.
      if (!documentTitle.match(/\.pdf$/i))
        documentTitle += '.pdf';
    } else
      documentTitle = getFilename(this.documentUrl as string);

    // Download Documentation.
    await downloadPdf(this.documentObject, documentTitle);
  }
}
PDFLiveElement.define();
export default PDFLiveElement;