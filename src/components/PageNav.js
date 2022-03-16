/**
 * Control page navigation.
 */
export default class {
  /**
   * Construct page navigation.
   */
  constructor() {
    // Find dependent nodes.
    this.pageInput = document.querySelector('[data-element="pageInput"]');
    this.totalPage = document.querySelector('[data-element="totalPage"]');
    this.prevPageButton = document.querySelector('[data-element="prevPageButton"]');
    this.nextPageButton = document.querySelector('[data-element="nextPageButton"]');
    this.pageView = document.querySelector('[data-element="pageView"]');
    this.pages = this.pageView.querySelectorAll('[id^="page"]');
    console.log('this.pages=', this.pages);

    // Shows the number of the page at the current scroll position.
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) 
          return;
        // When a page node appears in the display area.
        console.log(entry.target);
        // activateIndex(entry.target);
      });
    }, {
      root: this.pageView,
      rootMargin: '-50% 0px', // Use the center as a criterion
      threshold: 0 // The threshold is 0
    });

    // Observe the page node as an intersection judgment target. 
    for (let page of this.pages)
      observer.observe(page);
  }
}