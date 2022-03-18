/**
 * Control page navigation.
 */
export default class PageNav {
  /**
   * Construct page navigation.
   *
   * @param {number} numPages
   */
  constructor(numPages) {
    // Find dependent nodes.
    this.pageInput = document.querySelector('[data-element="pageInput"]');
    this.totalPage = document.querySelector('[data-element="totalPage"]');
    this.prevPageButton = document.querySelector('[data-element="prevPageButton"]');
    this.nextPageButton = document.querySelector('[data-element="nextPageButton"]');
    this.pageView = document.querySelector('[data-element="pageView"]');
    this.pageNodes = this.pageView.querySelectorAll('[id^="page"]');
    this.pageInputForm = document.querySelector('[data-element="pageInputForm"]');

    // Show total number of pages.
    this.totalPage.textContent = numPages;

    // Maximum page number.
    this.minPageNum = 1;

    // Minimum page number.
    this.maxPageNum = numPages;

    // Last input page.
    this.lastPageNum = 1;

    // Handler for change event for the page you are viewing.
    this.changeBrowsingPageHandler = pageNum => {};

    // Shows the number of the page at the current scroll position.
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        // Ignore page nodes that are not in the display area.
        if (!entry.isIntersecting) 
          return;
        // When a page node appears in the display area.
        // The page node currently being viewed.
        const pageNode = entry.target;
        
        // The number of the page you are currently viewing.
        const pageNum = parseInt(pageNode.dataset.pageNumber, 10);

        // Update page number.
        this.updatePageNumber(pageNum);

        // Invoke browsing page change event.
        this.changeBrowsingPageHandler(pageNum);
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
    this.pageInputForm.addEventListener('submit', evnt => {
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
  activatePage(pageNum) {
    // Find the target page node.
    const targetPageNode = [...this.pageNodes].find(pageNode => pageNode.dataset.pageNumber == pageNum);

    // Display the target page node in the viewer.
    this.pageView.scrollTop = targetPageNode.offsetTop;

    // Update page number.
    this.updatePageNumber(pageNum);
  }

  /**
   * Update page number.
   */
  updatePageNumber(pageNum) {
    // Show page number.
    this.pageInput.value = pageNum;

    // Keep the last input value.
    this.lastPageNum = this.pageInput.value;

    // When the page reaches the minimum, disable the previous page button.
    this.prevPageButton.disabled = pageNum == this.minPageNum;

    // When the page reaches its maximum, disable the Next Page button.
    this.nextPageButton.disabled = pageNum == this.maxPageNum;
  }

  /**
   * Display the page corresponding to the entered page number.
   */
  enterPage() {
    // Converts the entered page to a number.
    let pageNum = parseInt(this.pageInput.value, 10);

    // Check if the input value is a valid number.
    if (!isNaN(pageNum)) {
      if (pageNum < this.minPageNum)
        // If the input is less than the minimum value, set the minimum value to the input.
        pageNum = this.minPageNum;
      else if (pageNum > this.maxPageNum)
        // If the input exceeds the maximum value, set the maximum value to the input.
        pageNum = this.maxPageNum;

      // Activate the specified page..
      this.activatePage(pageNum);
    } else
      // If the input zoom is an invalid number, set the previous value to the input zoom.
      this.pageInput.value = this.lastPageNum;
  }

  /**
   * Browsing page change event.
   * Returns the number of the page being viewed to the event handler.
   *
   * @param {(pageNum: number): void => {}}
   * @returns {PageNav} The instance on which this method was called.
   */
  onChangeBrowsingPage(handler) {
    this.changeBrowsingPageHandler = handler;
    return this;
  }
}