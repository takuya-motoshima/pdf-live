/**
 * Control page navigation.
 */
export default class PageNav {
  /** @type {HTMLInputElement} */
  private readonly pageInput: HTMLInputElement;

  /** @type {HTMLSpanElement} */
  private readonly totalPage: HTMLSpanElement;

  /** @type {HTMLButtonElement} */
  private readonly prevPageButton: HTMLButtonElement;

  /** @type {HTMLButtonElement} */
  private readonly nextPageButton: HTMLButtonElement;

  /** @type {HTMLDivElement} */
  private readonly pageView: HTMLDivElement;

  /** @type {HTMLDivElement[]} */
  private readonly pageNodes: HTMLDivElement[];

  /** @type {HTMLFormElement} */
  private readonly pageForm: HTMLFormElement;

  /** @type {number} */
  private readonly minPage: number = 1;

  /** @type {number} */
  private readonly maxPage: number;

  /** @type {number} */
  private lastPage: number = 1;

  /** @type {(pageNum: number) => void} */
  private changeHandler: (pageNum: number) => void = (pageNum: number): void => {};

  /**
   * Construct page navigation.
   *
   * @param {HTMLElement} context
   * @param {number}      numPages
   */
  constructor(context: HTMLElement, numPages: number) {
    // Find dependent nodes.
    this.pageInput = context.querySelector('[data-element="pageInput"]') as HTMLInputElement;
    this.totalPage = context.querySelector('[data-element="totalPage"]') as HTMLSpanElement;
    this.prevPageButton = context.querySelector('[data-element="prevPageButton"]') as HTMLButtonElement;
    this.nextPageButton = context.querySelector('[data-element="nextPageButton"]') as HTMLButtonElement;
    this.pageView = context.querySelector('[data-element="pageView"]') as HTMLDivElement;
    this.pageNodes = Array.from(this.pageView.querySelectorAll('[id^="page"]')) as HTMLDivElement[];
    this.pageForm = context.querySelector('[data-element="pageForm"]') as HTMLFormElement;

    // Show total number of pages.
    this.totalPage.textContent = numPages.toString();

    // Minimum page number.
    this.maxPage = numPages;

    // Shows the number of the page at the current scroll position.
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        // Ignore page nodes that are not in the display area.
        if (!entry.isIntersecting) 
          return;
        // When a page node appears in the display area.
        // The page node currently being viewed.
        const targetNode = entry.target as HTMLDivElement;
        
        // The number of the page you are currently viewing.
        const pageNum = parseInt(targetNode.dataset.pageNumber as string, 10);

        // Update page number.
        this.updatePage(pageNum);

        // Invoke browsing page change event.
        this.changeHandler(pageNum);
      });
    }, {
      root: this.pageView,
      rootMargin: '-50% 0px', // Use the center as a criterion
      threshold: 0 // The threshold is 0
    });

    // Observe the page node as an intersection judgment target. 
    for (let pageNode of this.pageNodes)
      observer.observe(pageNode);

    // Focus out page input.
    this.pageInput.addEventListener('blur', () => {
      // Display the page corresponding to the entered page number.
      this.enterPage();
    }, {passive: true});

    // Submit page input form.
    this.pageForm.addEventListener('submit', evnt => {
      evnt.preventDefault();

      // Display the page corresponding to the entered page number.
      this.enterPage();
    }, {passive: false});

    // To the previous page.
    this.prevPageButton.addEventListener('click', () => {
      this.activatePage(parseInt(this.pageInput.value, 10) - 1);
    }, {passive: true});

    // To the next page.
    this.nextPageButton.addEventListener('click', () => {
      this.activatePage(parseInt(this.pageInput.value, 10) + 1);
    }, {passive: true});
  }

  /**
   * Activate the specified page.
   *
   * @param {number} pageNum
   */
  public activatePage(pageNum: number): void {
    // Find the target page node.
    const targetNode = this.pageNodes.find(pageNode => pageNode.dataset.pageNumber == pageNum.toString()) as HTMLDivElement;

    // Display the target page node in the viewer.
    this.pageView.scrollTop = targetNode.offsetTop;

    // Update page number.
    this.updatePage(pageNum);
  }

  /**
   * Update page number.
   *
   * @param {number} pageNum
   */
  private updatePage(pageNum: number): void {
    // Show page number.
    this.pageInput.value = pageNum.toString();

    // Keep the last input value.
    this.lastPage = parseInt(this.pageInput.value, 10);

    // When the page reaches the minimum, disable the previous page button.
    this.prevPageButton.disabled = pageNum == this.minPage;

    // When the page reaches its maximum, disable the Next Page button.
    this.nextPageButton.disabled = pageNum == this.maxPage;
  }

  /**
   * Display the page corresponding to the entered page number.
   */
  private enterPage(): void {
    // Converts the entered page to a number.
    let pageNum = parseInt(this.pageInput.value, 10);

    // Check if the input value is a valid number.
    if (!isNaN(pageNum)) {
      if (pageNum < this.minPage)
        // If the input is less than the minimum value, set the minimum value to the input.
        pageNum = this.minPage;
      else if (pageNum > this.maxPage)
        // If the input exceeds the maximum value, set the maximum value to the input.
        pageNum = this.maxPage;

      // Activate the specified page..
      this.activatePage(pageNum);
    } else
      // If the input zoom is an invalid number, set the previous value to the input zoom.
      this.pageInput.value = this.lastPage.toString();
  }

  /**
   * Browsing page change event. Returns the number of the page being viewed to the event handler.
   *
   * @param   {(pageNum: number) => void}
   * @returns {PageNav} The instance on which this method was called.
   */
  public onChange(handler: (pageNum: number) => void): PageNav {
    this.changeHandler = handler;
    return this;
  }

  /**
   * Returns the current page number.
   *
   * @return {number}
   */
  public getCurrentPageNumber(): number {
    return parseInt(this.pageInput.value, 10);
  }
}