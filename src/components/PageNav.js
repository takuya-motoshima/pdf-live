/**
 * Control page navigation.
 */
export default class {
  /**
   * Construct page navigation.
   */
  constructor() {
    // Find dependent nodes.
    this.currentPageInput = document.querySelector('[data-element="currentPageInput"]');
    this.totalPage = document.querySelector('[data-element="totalPage"]');
    this.prevPageButton = document.querySelector('[data-element="prevPageButton"]');
    this.nextPageButton = document.querySelector('[data-element="nextPageButton"]');
    this.pageView = document.querySelector('[data-element="pageView"]');
    this.pagesNodes = this.pageView.querySelectorAll('[id^="page"]');

    // Handler for change event for the page you are viewing.
    this.changeBrowsingPageHandler = pageNumber => {};

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
        const pageNumber = parseInt(pageNode.dataset.pageNumber, 10);
        // console.log(`View page ${pageNumber}`);

        // Show current page number.
        this.currentPageInput.value = pageNumber;

        // Invoke browsing page change event.
        this.changeBrowsingPageHandler(pageNumber);
      });
    }, {
      root: this.pageView,
      rootMargin: '-50% 0px', // Use the center as a criterion
      threshold: 0 // The threshold is 0
    });

    // Observe the page node as an intersection judgment target. 
    for (let pagesNode of this.pagesNodes)
      observer.observe(pagesNode);
  }

  /**
   * Activate the specified page.

   * @param {number} pageNumber
   */
  activatePage(pageNumber) {
    // Find the target page node.
    const targetPageNode = [...this.pagesNodes].find(pagesNode => pagesNode.dataset.pageNumber == pageNumber);

    // Display the target page node in the viewer.
    this.pageView.scrollTop = targetPageNode.offsetTop;

    // Show page number.
    this.currentPageInput.value = pageNumber;
  }

  /**
   * Browsing page change event.
   * Returns the number of the page being viewed to the event handler.
   *
   * @param {(pageNumber: number): void => {}}
   */
  onChangeBrowsingPage(handler) {
    this.changeBrowsingPageHandler = handler;
  }
}