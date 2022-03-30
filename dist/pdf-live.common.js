'use strict';

class BaseError extends Error {
    /**
     * Base error class.
     *
     * @param {string} message
     */
    constructor(message) {
        // Pass the message to the parent constructor.
        super(message);
        // Maintains proper stack trace for where our error was thrown (only available on V8)
        if (Error.captureStackTrace)
            Error.captureStackTrace(this, this.constructor);
    }
}

class BadDocumentError extends BaseError {
    /**
     * PDF document loading failure error.
     *
     * @param {string} message
     */
    constructor(message) {
        // Pass the message to the parent constructor.
        super(message);
        this.name = 'BadDocumentError';
    }
}

/**
  * Load a PDF document.
  *
  * @param  {string} url
  * @param  {string} workerSrc
  * @return {PDFDocumentProxy}
  */
var getDocument = async (url, workerSrc) => {
    try {
        // Setting worker path to worker bundle.
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;
        // Loading a document.
        const pdfDoc = await window.pdfjsLib.getDocument(url).promise;
        // console.log(`Loaded ${url}. Total number of pages is ${pdfDoc.numPages}`);
        return pdfDoc;
    }
    catch (err) {
        throw new BadDocumentError(err instanceof Error ? err.message : String(err));
    }
};

/**
  * Render pages.
  *
  * @param    {PDFDocumentProxy} pdfDoc
  * @param    {number}           zoomFactor
  * @returns  {Promise<any[]>}
  */
var renderPages = async (pdfDoc, zoomFactor = 1.0) => {
    // console.log(`Zoom factor: ${zoomFactor}`);
    // console.log(`Total number of pages: ${pdfDoc.numPages}`);
    // Find dependent nodes.
    const pageView = document.querySelector('[data-element="pageView"]');
    // Page object to return to caller.
    const pages = [];
    // Draw page by page.
    for (let num = 1; num <= pdfDoc.numPages; num++) {
        // Fetch page.
        const page = await pdfDoc.getPage(num);
        // Calculate the display area of the page.
        const viewport = page.getViewport({ scale: 1.5 * zoomFactor });
        // Support HiDPI-screens.
        const devicePixelRatio = window.devicePixelRatio || 1;
        // Create a page node.
        const pageNode = document.createElement('div');
        pageNode.id = `page${num}`;
        pageNode.style.width = `${Math.floor(viewport.width)}px`;
        pageNode.style.height = `${Math.floor(viewport.height)}px`;
        pageNode.style.margin = `${zoomFactor * 4}px`;
        pageNode.classList.add('pl-page');
        pageNode.dataset.pageNumber = num.toString();
        // Create a canvas node.
        const canvas = document.createElement('canvas');
        canvas.width = Math.floor(viewport.width * devicePixelRatio);
        canvas.height = Math.floor(viewport.height * devicePixelRatio);
        pageNode.appendChild(canvas);
        // Append page node to page viewer.
        pageView.appendChild(pageNode);
        // Render page content on canvas.
        page.render({
            canvasContext: canvas.getContext('2d'),
            transform: devicePixelRatio !== 1 ? [devicePixelRatio, 0, 0, devicePixelRatio, 0, 0] : null,
            viewport
        });
        // Set the return page object.
        pages.push(page);
    }
    return pages;
};

/**
  * Resize page.
  *
  * @param {any[]}  pages
  * @param {number} zoomFactor
  */
var resizePage = (pages, zoomFactor = 1.0) => {
    // console.log(`Resize to ${zoomFactor} times`);
    for (let num = 1; num <= pages.length; num++) {
        // Fetch page.
        const page = pages[num - 1];
        // Calculate the display area of the page.
        const viewport = page.getViewport({ scale: 1.5 * zoomFactor });
        // Support HiDPI-screens.
        const devicePixelRatio = window.devicePixelRatio || 1;
        // Find the page node.
        const pageNode = document.querySelector(`#page${num}`);
        pageNode.style.width = `${Math.floor(viewport.width)}px`;
        pageNode.style.height = `${Math.floor(viewport.height)}px`;
        pageNode.style.margin = `${zoomFactor * 4}px`;
        // Create a canvas node. When performing a continuous resizing operation, multiple renderings are performed on the same canvas, which is not possible, so create a new canvas node without reusing it.
        pageNode.querySelector('canvas')?.remove();
        const canvas = document.createElement('canvas');
        // Append a canvas node to a page node.
        canvas.width = Math.floor(viewport.width * devicePixelRatio);
        canvas.height = Math.floor(viewport.height * devicePixelRatio);
        pageNode.appendChild(canvas);
        // Render page content on canvas.
        page.render({
            canvasContext: canvas.getContext('2d'),
            transform: devicePixelRatio !== 1 ? [devicePixelRatio, 0, 0, devicePixelRatio, 0, 0] : null,
            viewport
        });
    }
};

// import {PDFDocumentProxy} from 'pdfjs-dist';
/**
 * Print PDF.
 *
 * @param {string} url
 */
var printPdf = async (url) => {
    // Iframe for embedding print data.
    const printFrame = document.querySelector('[data-element="printFrame"]');
    // Load PDF into iframe.
    printFrame.src = url;
    return new Promise(rslv => {
        printFrame.addEventListener('load', () => {
            // Print after loading the PDF data.
            printFrame.contentWindow.print();
            rslv();
        }, { passive: true, once: true });
    });
};
// /**
//  * Print PDF.
//  *
//  * @param {PDFDocumentProxy} pdfDoc
//  */
// export default async pdfDoc => {
//   // Access raw PDF data.
//   const data = await pdfDoc.getData();
// 
//   // Create a Uint8Array object.
//   const arr = new Uint8Array(data);
// 
//   // Convert Uint8Array to blob.
//   const blob = new Blob([arr], {type: 'application/pdf'});
// 
//   // Iframe for embedding print data.
//   const printFrame = document.querySelector('[data-element="printFrame"]');
// 
//   // Embed PDF data in a frame.
//   printFrame.src = URL.createObjectURL(blob);
// 
//   return new Promise(rslv => {
//     printFrame.addEventListener('load', () => {
//       // Print after loading the PDF data.
//       printFrame.contentWindow.print();
//       rslv();
//     }, {passive: true, once: true});
//   });
// }

/**
 * Download PDF.
 *
 * @param {any}     pdfDoc
 * @param {string}  downloadName
 */
var downloadPdf = async (pdfDoc, downloadName) => {
    // Access raw PDF data.
    const data = await pdfDoc.getData();
    // Create a Uint8Array object.
    const arr = new Uint8Array(data);
    // Convert Uint8Array to a file object.
    const file = new File([arr], downloadName, { type: 'application/pdf' });
    // Create anchor element for PDF download.
    const a = document.createElement('a');
    // Set the download file name.
    a.download = downloadName;
    // tabnabbing.
    a.rel = 'noopener';
    // Load PDF into anchor element.
    a.href = URL.createObjectURL(file);
    // Release the URL so that it doesn't keep the file reference.
    setTimeout(() => URL.revokeObjectURL(a.href), 4E4);
    // Start PDF download.
    setTimeout(() => a.dispatchEvent(new MouseEvent('click')), 0);
};

/**
 * Modal base class.
 */
class Modal {
    /** @type {HTMLDivElement} */
    modalNode;
    /**
     * Construct modal. Add modal node defined in subclass to context.
     *
     * @param {HTMLElement} context
     */
    constructor(context) {
        // Append modal node to #app node.
        context.insertAdjacentHTML('beforeend', this.render());
        // Keep the added modal node.
        this.modalNode = context.lastChild;
        // Find and keep the data-element element.
        for (let node of Array.from(this.modalNode.querySelectorAll('[data-element]')))
            this[node.dataset.element] = node;
    }
    /**
     * Returns modal node HTML.
     */
    render() {
        return '';
    }
    /**
     * Show modal.
     */
    show() {
        this.modalNode.classList.replace('pl-modal-hide', 'pl-modal-show');
    }
    /**
     * Hide modal.
     */
    hide() {
        this.modalNode.classList.replace('pl-modal-show', 'pl-modal-hide');
    }
}

/**
 * Show loading.
 */
class LoadingModal extends Modal {
    /**
     * Render the content of this component.
     *
     * @returns {string} Modal HTML.
     */
    render() {
        return `<div class="pl-modal pl-loading-modal pl-modal-hide">
              <div class="pl-modal-container">
                <div class="pl-loading-modal-spinner"></div>
              </div>
            </div>`;
    }
}

/**
 * Error modal.
 */
class ErrorModal extends Modal {
    /** @type {HTMLDivElement} */
    message;
    /**
     * Construct modal.
     *
     * @param {HTMLElement} context
     */
    constructor(context) {
        super(context);
        this.message = this.modalNode.querySelector('[data-element="message"]');
    }
    /**
     * Render the content of this component.
     *
     * @returns {string} Modal HTML.
     */
    render() {
        return `<div class="pl-modal pl-error-modal pl-modal-hide" data-element="errorModal">
              <div data-element="message" class="pl-modal-container">This is an error</div>
            </div>`;
    }
    /**
     * Show modal.
     *
     * @param {string} message
     */
    show(message) {
        this.message.textContent = message;
        super.show();
    }
}

/**
 * Left panel controller.
 */
class LeftPanel {
    /** @type {HTMLButtonElement} */
    leftPanelToggle;
    /** @type {HTMLDivElement} */
    leftPanel;
    /** @type {HTMLDivElement} */
    pagegContainer;
    /** @type {HTMLDivElement} */
    thumbnailsPanel;
    /** @type {HTMLDivElement[]} */
    thumbnailNodes = [];
    /** @type {HTMLDivElement|null} */
    activeThumbnailNode = undefined;
    /** @type {(pageNum: number) => void} */
    selectHandler = (pageNum) => { };
    /**
     * Controls opening and closing of the left panel and rendering of page thumbnails.
     *
     * @param {HTMLElement} context
     * @param {any[]}       pages
     */
    constructor(context, pages) {
        // Find dependent nodes.
        this.leftPanelToggle = context.querySelector('[data-element="leftPanelToggle"]');
        this.leftPanel = context.querySelector('[data-element="leftPanel"]');
        this.pagegContainer = context.querySelector('[data-element="pagegContainer"]');
        this.thumbnailsPanel = context.querySelector('[data-element="thumbnailsPanel"]');
        // Toggle the opening and closing of the left panel.
        this.leftPanelToggle.addEventListener('click', () => {
            if (this.leftPanel.classList.contains('pl-left-panel-closed'))
                this.open();
            else
                this.close();
        }, { passive: true });
        // Render thumbnail images.
        this.thumbnailNodes = this.render(pages);
        // Keep currently active thumbnail node.
        this.activeThumbnailNode = this.thumbnailNodes.find(thumbnailNode => thumbnailNode.classList.contains('pl-thumbnail-active'));
        // Add click event for thumbnail node.
        for (let thumbnailNode of this.thumbnailNodes) {
            thumbnailNode.addEventListener('click', evnt => {
                // Deactivate currently active thumbnails.
                this.activeThumbnailNode.classList.remove('pl-thumbnail-active');
                // Activate the selected thumbnail.
                evnt.currentTarget.classList.add('pl-thumbnail-active');
                this.activeThumbnailNode = evnt.currentTarget;
                // Invoke thumbnail selection event.
                const pageNum = parseInt(this.activeThumbnailNode.dataset.pageNumber, 10);
                this.selectHandler(pageNum);
            }, { passive: true });
        }
    }
    /**
     * Open the left panel.
     */
    open() {
        this.leftPanel.classList.remove('pl-left-panel-closed');
        this.pagegContainer.classList.add('pl-page-container-open');
    }
    /**
     * Close left panel.
     */
    close() {
        this.leftPanel.classList.add('pl-left-panel-closed');
        this.pagegContainer.classList.remove('pl-page-container-open');
    }
    /**
     * Activate thumbnails.
     *
     * @param {number} pageNum
     */
    activatePage(pageNum) {
        // Deactivate currently active thumbnails.
        if (this.activeThumbnailNode)
            this.activeThumbnailNode.classList.remove('pl-thumbnail-active');
        // Activates the thumbnail corresponding to the specified page number.
        const targetThumbnailNode = this.thumbnailNodes.find(thumbnailNode => thumbnailNode.dataset.pageNumber == pageNum.toString());
        if (targetThumbnailNode) {
            // Activate the target thumbnail.
            targetThumbnailNode.classList.add('pl-thumbnail-active');
            this.activeThumbnailNode = targetThumbnailNode;
            // Change the scroll position of the thumbnail viewer to a position where the active thumbnail node can be displayed.
            const panelRect = this.thumbnailsPanel.getBoundingClientRect();
            const thumbnailRect = this.activeThumbnailNode.getBoundingClientRect();
            const isViewable = thumbnailRect.top >= panelRect.top && thumbnailRect.top <= panelRect.top + this.thumbnailsPanel.clientHeight;
            if (!isViewable)
                this.thumbnailsPanel.scrollTop = thumbnailRect.top + this.thumbnailsPanel.scrollTop - panelRect.top;
        }
    }
    /**
     * Render thumbnail images.
     *
     * @param   {any[]} pages
     * @returns {HTMLDivElement[]}
     */
    render(pages) {
        // console.log('Start rendering thumbnails, pages=', pages);
        const thumbnailNodes = [];
        for (let num = 1; num <= pages.length; num++) {
            // Fetch page.
            const page = pages[num - 1];
            // Calculate the display area of the page.
            const viewport = page.getViewport({ scale: 1.5 });
            // Create a thumbnail container node.
            const thumbnailNode = document.createElement('div');
            thumbnailNode.classList.add('pl-thumbnail');
            thumbnailNode.dataset.pageNumber = num.toString();
            // Activate the thumbnail on the first page.
            if (num === 1)
                thumbnailNode.classList.add('pl-thumbnail-active');
            // Create a canvas node.
            const canvas = document.createElement('canvas');
            canvas.classList.add('pl-thumbnail-image');
            canvas.width = Math.floor(viewport.width);
            canvas.height = Math.floor(viewport.height);
            thumbnailNode.appendChild(canvas);
            // Create a thumbnail number label node.
            const label = document.createElement('div');
            label.classList.add('pl-thumbnail-label');
            label.textContent = num.toString();
            thumbnailNode.appendChild(label);
            // Append Thumbnail Container Node.
            this.thumbnailsPanel.appendChild(thumbnailNode);
            // Render page content on canvas.
            page.render({ canvasContext: canvas.getContext('2d'), viewport });
            // Set the created thumbnail node as the return value.
            thumbnailNodes.push(thumbnailNode);
        }
        return thumbnailNodes;
    }
    /**
     * Thumbnail selection event. Returns the page number of the selected thumbnail to the handler.
     *
     * @param   {(pageNum: number) => void}
     * @returns {LeftPanel} The instance on which this method was called.
     */
    onSelect(handler) {
        this.selectHandler = handler;
        return this;
    }
}

/**
  * Check if there is a point inside the rectangle.
  *
  * @param    {Point} point
  * @param    {Rect} rect
  * @returns  {boolean}
  */
var pointInRectangle = (point, rect) => {
    return rect.x <= point.x && point.x <= rect.x + rect.width && rect.y <= point.y && point.y <= rect.y + rect.height;
};

/**
 * Check if `value` is a number.
 *
 * @param   {any}     value The value to check.
 * @returns {boolean}       Returns `true` if `value` is a number, else `false`.
 */
var isNumber = (value) => {
    return !isNaN(parseFloat(value)) && isFinite(value);
};

const ZOOM_OUT = 0;
const ZOOM_IN = 1;
/**
 * Page zoom control.
 */
class ZoomNav {
    /** @type {Viewport} */
    standardViewport;
    /** @type {HTMLDivElement} */
    zoomToggle;
    /** @type {HTMLDivElement} */
    zoomMenu;
    /** @type {HTMLButtonElement[]} */
    zoomSelects;
    /** @type {HTMLButtonElement} */
    zoomOutButton;
    /** @type {HTMLButtonElement} */
    zoomInButton;
    /** @type {HTMLFormElement} */
    zoomForm;
    /** @type {HTMLInputElement} */
    zoomInput;
    /** @type {HTMLDivElement} */
    pageView;
    /** @type {number|null} */
    resizeTimeout = null;
    /** @type {number} */
    lastZoom;
    /** @type {number[]} */
    zoomList;
    /** @type {number} */
    minZoom;
    /** @type {number} */
    maxZoom;
    /** @type {(zoomFactor: number) => void} */
    changeHandler = (zoomFactor) => { };
    /**
     * Control the zoom factor change event of a page.
     *
     * @param {HTMLDivElement}  context
     * @param {Viewport}        standardViewport
     */
    constructor(context, standardViewport) {
        // Keep page width and height for zoom factor calculation to fit by page or width.
        this.standardViewport = standardViewport;
        // Find dependent nodes.
        this.zoomToggle = context.querySelector('[data-element="zoomToggle"]');
        this.zoomMenu = context.querySelector('[data-element="zoomMenu"]');
        this.zoomSelects = Array.from(context.querySelectorAll('[data-element="zoomSelect"]'));
        this.zoomOutButton = context.querySelector('[data-element="zoomOutButton"]');
        this.zoomInButton = context.querySelector('[data-element="zoomInButton"]');
        this.zoomForm = context.querySelector('[data-element="zoomForm"]');
        this.zoomInput = context.querySelector('[data-element="zoomInput"]');
        this.pageView = context.querySelector('[data-element="pageView"]');
        // Last input zoom.
        this.lastZoom = parseInt(this.zoomInput.value, 10);
        // All zooms that can be selected from the screen.
        this.zoomList = this.zoomSelects.flatMap((zoomSelect) => {
            const zoom = parseInt(zoomSelect.dataset.value, 10);
            return isNumber(zoom) ? zoom : [];
        });
        // Minimum zoom.
        this.minZoom = Math.min(...this.zoomList);
        // Maximum zoom.
        this.maxZoom = Math.max(...this.zoomList);
        // Toggle the opening and closing of the zoom overlay.
        this.zoomToggle.addEventListener('click', (evnt) => {
            if (this.zoomMenu.classList.contains('pl-zoom-menu-closed')) {
                // Stops event propagation to the body so that the process of closing the zoom overlay for body click events does not run.
                evnt.stopPropagation();
                // Layout the zoom overlay.
                this.layout();
                // Open zoom overlay.
                this.open();
            }
            else
                // Close zoom overlay.
                this.close();
        }, { passive: true });
        // Change zoom factor.
        for (let zoomSelect of this.zoomSelects)
            zoomSelect.addEventListener('click', evnt => {
                // Close zoom menu.
                this.close();
                // Deselect a zoom item that was already selected.
                this.deselectMenu();
                // Activate the selected zoom item.
                const targetNode = evnt.target;
                targetNode.classList.add('pl-zoom-menu-item-selected');
                // Calculate zoom factor.
                const zoomFactor = this.calcFactor(targetNode.dataset.value);
                // Set the zoom percentage to the text node.
                this.zoomInput.value = Math.floor(zoomFactor * 100).toString();
                // Keep the last input value.
                this.lastZoom = parseInt(this.zoomInput.value, 10);
                // Invoke zoom change event.
                this.changeHandler(zoomFactor);
            }, { passive: true });
        // When the window is resized.
        window.addEventListener('resize', () => {
            // Preventing multiple launches of resizing events.
            if (this.resizeTimeout)
                clearTimeout(this.resizeTimeout);
            this.resizeTimeout = window.setTimeout(() => {
                // Recalculates the position of the zoom overlay node.
                this.layout();
                // If the zoom mode is "page fit" or "width fit", resize the page.
                const selectedZoom = this.zoomSelects.find(zoomSelect => zoomSelect.classList.contains('pl-zoom-menu-item-selected'));
                const currentZoom = selectedZoom.dataset.value;
                if (currentZoom === 'pageFit' || currentZoom === 'pageWidth') {
                    // Calculate zoom factor.
                    const zoomFactor = this.calcFactor(currentZoom);
                    // Invoke zoom change event.
                    this.changeHandler(zoomFactor);
                }
            }, 100);
        }, { passive: true });
        // When the screen is clicked.
        document.body.addEventListener('click', evnt => {
            // Close if zoom overlay is open.
            if (!this.zoomMenu.classList.contains('pl-zoom-menu-closed')
                && !pointInRectangle({ x: evnt.pageX, y: evnt.pageY }, this.zoomMenu.getBoundingClientRect()))
                this.close();
        }, { passive: true });
        // Zoom out the page.
        this.zoomOutButton.addEventListener('click', () => {
            // Calculate zoom step.
            this.calcStep(ZOOM_OUT);
        }, { passive: true });
        // Zoom in on the page.
        this.zoomInButton.addEventListener('click', () => {
            // Calculate zoom step.
            this.calcStep(ZOOM_IN);
        }, { passive: true });
        // Hold down the Ctrl key and rotate the mouse wheel to zoom. 
        window.addEventListener('wheel', evnt => {
            // Do nothing if the Ctrl key is not pressed.
            if (!evnt.ctrlKey)
                return;
            // Stop existing mouse wheel action.
            evnt.preventDefault();
            // Calculate the next zoom factor.
            const currentZoom = this.lastZoom;
            let newZoom = currentZoom;
            if (evnt.deltaY < 0) {
                // Rotate the mouse wheel upwards to zoom in.
                // Activate the zoom out button.
                this.zoomOutButton.disabled = false;
                // Do nothing if the current zoom factor is maximum.
                if (currentZoom >= this.maxZoom)
                    return;
                // Calculate new zoom factor.
                const multiple = 1.25;
                newZoom = Math.min(Math.floor(currentZoom * multiple), this.maxZoom);
                // When the zoom factor reaches the maximum, disable the zoom-in button.
                this.zoomInButton.disabled = newZoom >= this.maxZoom;
            }
            else if (evnt.deltaY > 0) {
                // Rotate the mouse wheel downwards to zoom out.
                // Activate the zoom-in button.
                this.zoomInButton.disabled = false;
                // Do nothing if the current zoom factor is minimum.
                if (currentZoom <= this.minZoom)
                    return;
                // Calculate new zoom factor.
                const multiple = .8;
                newZoom = Math.max(Math.floor(currentZoom * multiple), this.minZoom);
                // When the zoom factor reaches the minimum, disable the zoom out button.
                this.zoomOutButton.disabled = newZoom <= this.minZoom;
            }
            // Set the new zoom factor to the zoom input value.
            this.zoomInput.value = newZoom.toString();
            // Keep the last input value.
            this.lastZoom = parseInt(this.zoomInput.value, 10);
            // Activate the zoom menu that matches the current zoom factor.
            this.activateMenu(this.zoomInput.value);
            // Calculate zoom factor.
            const zoomFactor = this.calcFactor(this.zoomInput.value);
            // Invoke zoom change event.
            this.changeHandler(zoomFactor);
        }, { passive: false });
        // Focus out zoom input.
        this.zoomInput.addEventListener('blur', () => {
            // Zoom page according to the zoom you enter.
            this.enterZoom();
        }, { passive: true });
        // Submit page input form.
        this.zoomForm.addEventListener('submit', evnt => {
            evnt.preventDefault();
            // Zoom page according to the zoom you enter.
            this.enterZoom();
        }, { passive: false });
        // // Press Enter key with input zoom.
        // this.zoomInput.addEventListener('keydown', evnt => {
        //   // Ignore other than enter key.
        //   if (evnt.key !== 'Enter' && evnt.keyCode !== 13)
        //     return;
        //   // Zoom page according to the zoom you enter.
        //   this.enterZoom();
        // }, {passive: true});
    }
    /**
     * Open zoom overlay.
     */
    open() {
        this.zoomMenu.classList.remove('pl-zoom-menu-closed');
    }
    /**
     * Close zoom overlay.
     */
    close() {
        this.zoomMenu.classList.add('pl-zoom-menu-closed');
    }
    /**
     * Recalculates the position of the zoom overlay node.
     */
    layout() {
        const toogleRect = this.zoomToggle.getBoundingClientRect();
        this.zoomMenu.style.top = `${toogleRect.bottom}px`;
        this.zoomMenu.style.left = `${toogleRect.left}px`;
    }
    /**
     * Calculate zoom factor.
     *
     * @param   {string} zoom
     * @returns {number}
     */
    calcFactor(zoom) {
        let zoomFactor = 1.0;
        if (isNumber(zoom))
            // Convert specified percentage to ratio.
            zoomFactor = parseInt(zoom, 10) / 100;
        else if (zoom === 'pageFit')
            // Calculate the width and height of the page that fits the height of the container.
            zoomFactor = this.pageView.clientHeight / this.standardViewport.height;
        else if (zoom === 'pageWidth')
            // Calculate the width and height of the page that fits the width of the container.
            zoomFactor = this.pageView.clientWidth / this.standardViewport.width;
        return zoomFactor;
    }
    /**
     * Returns the current zoom factor.
     *
     * @returns {number}
     */
    getZoomFactor() {
        return this.calcFactor(this.zoomInput.value);
    }
    /**
     * Deselect a zoom item that was already selected.
     */
    deselectMenu() {
        const selectedZoom = this.zoomSelects.find(zoomSelect => zoomSelect.classList.contains('pl-zoom-menu-item-selected'));
        if (selectedZoom)
            selectedZoom.classList.remove('pl-zoom-menu-item-selected');
    }
    /**
     * Activate the zoom menu.
     *
     * @param {string} value
     */
    activateMenu(value) {
        // Deselect a zoom item that was already selected.
        this.deselectMenu();
        // Activate the zoom menu that matches the current zoom factor.
        const zoomSelect = this.zoomSelects.find(zoomSelect => zoomSelect.dataset.value == value);
        if (zoomSelect)
            zoomSelect.classList.add('pl-zoom-menu-item-selected');
    }
    /**
     * Zoom page according to the zoom you enter.
     */
    enterZoom() {
        // Converts the entered zoom to a numerical value.
        let currentZoom = parseInt(this.zoomInput.value, 10);
        // Check if the input value is a valid number.
        if (!isNaN(currentZoom)) {
            if (currentZoom < this.minZoom)
                // If the input is less than the minimum value, set the minimum value to the input.
                currentZoom = this.minZoom;
            else if (currentZoom > this.maxZoom)
                // If the input exceeds the maximum value, set the maximum value to the input.
                currentZoom = this.maxZoom;
            // Set the adjustment value to the input node.
            this.zoomInput.value = currentZoom.toString();
            // Keep the last input value.
            this.lastZoom = parseInt(this.zoomInput.value, 10);
            // When the zoom factor reaches the minimum, disable the zoom out button.
            this.zoomOutButton.disabled = this.zoomInput.value == this.minZoom.toString();
            // When the zoom factor reaches the maximum, disable the zoom-in button.
            this.zoomInButton.disabled = this.zoomInput.value == this.maxZoom.toString();
            // Calculate zoom factor.
            const zoomFactor = this.calcFactor(this.zoomInput.value);
            // Invoke zoom change event.
            this.changeHandler(zoomFactor);
        }
        else
            // If the input zoom is an invalid number, set the previous value to the input zoom.
            this.zoomInput.value = this.lastZoom.toString();
    }
    /**
     * Calculate zoom step.
     *
     * @param {number} zoomDir Zoom direction. 0: Zoom out, 1: Zoom in
     */
    calcStep(zoomDir) {
        // Calculate the next zoom.
        if (zoomDir === ZOOM_OUT)
            // Set a zoom factor one step smaller than the current one.
            this.zoomInput.value = (this.zoomList.sort((a, b) => b - a).find(zoom => zoom < this.lastZoom) ?? this.minZoom).toString();
        else
            // Set a zoom factor one step larger than the current one.
            this.zoomInput.value = (this.zoomList.sort((a, b) => a - b).find(zoom => zoom > this.lastZoom) ?? this.maxZoom).toString();
        // Keep the last input value.
        this.lastZoom = parseInt(this.zoomInput.value, 10);
        // Controlling the activation of zoom-in and zoom-out buttons.
        if (zoomDir === ZOOM_OUT) {
            // When the zoom factor reaches the minimum, disable the zoom out button.
            this.zoomOutButton.disabled = this.zoomInput.value == this.minZoom.toString();
            // Activate the zoom-in button.
            this.zoomInButton.disabled = false;
        }
        else {
            // When the zoom factor reaches the maximum, disable the zoom-in button.
            this.zoomInButton.disabled = this.zoomInput.value == this.maxZoom.toString();
            // Activate the zoom out button.
            this.zoomOutButton.disabled = false;
        }
        // Activate the zoom menu that matches the current zoom factor.
        this.activateMenu(this.zoomInput.value);
        // Calculate zoom factor.
        const zoomFactor = this.calcFactor(this.zoomInput.value);
        // Invoke zoom change event.
        this.changeHandler(zoomFactor);
    }
    /**
     * Zoom change event. Returns the zoom factor to the event handler.
     *
     * @param {(zoomFactor: number) => void}
     * @returns {ZoomNav} The instance on which this method was called.
     */
    onChange(handler) {
        this.changeHandler = handler;
        return this;
    }
}

/**
 * Control page navigation.
 */
class PageNav {
    /** @type {HTMLInputElement} */
    pageInput;
    /** @type {HTMLSpanElement} */
    totalPage;
    /** @type {HTMLButtonElement} */
    prevPageButton;
    /** @type {HTMLButtonElement} */
    nextPageButton;
    /** @type {HTMLDivElement} */
    pageView;
    /** @type {HTMLDivElement[]} */
    pageNodes;
    /** @type {HTMLFormElement} */
    pageForm;
    /** @type {number} */
    minPage = 1;
    /** @type {number} */
    maxPage;
    /** @type {number} */
    lastPage = 1;
    /** @type {(pageNum: number) => void} */
    changeHandler = (pageNum) => { };
    /**
     * Construct page navigation.
     *
     * @param {HTMLElement} context
     * @param {number}      numPages
     */
    constructor(context, numPages) {
        // Find dependent nodes.
        this.pageInput = context.querySelector('[data-element="pageInput"]');
        this.totalPage = context.querySelector('[data-element="totalPage"]');
        this.prevPageButton = context.querySelector('[data-element="prevPageButton"]');
        this.nextPageButton = context.querySelector('[data-element="nextPageButton"]');
        this.pageView = context.querySelector('[data-element="pageView"]');
        this.pageNodes = Array.from(this.pageView.querySelectorAll('[id^="page"]'));
        this.pageForm = context.querySelector('[data-element="pageForm"]');
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
                const targetNode = entry.target;
                // The number of the page you are currently viewing.
                const pageNum = parseInt(targetNode.dataset.pageNumber, 10);
                // Update page number.
                this.updatePage(pageNum);
                // Invoke browsing page change event.
                this.changeHandler(pageNum);
            });
        }, {
            root: this.pageView,
            rootMargin: '-50% 0px',
            threshold: 0 // The threshold is 0
        });
        // Observe the page node as an intersection judgment target. 
        for (let pageNode of this.pageNodes)
            observer.observe(pageNode);
        // Focus out page input.
        this.pageInput.addEventListener('blur', () => {
            // Display the page corresponding to the entered page number.
            this.enterPage();
        }, { passive: true });
        // Submit page input form.
        this.pageForm.addEventListener('submit', evnt => {
            evnt.preventDefault();
            // Display the page corresponding to the entered page number.
            this.enterPage();
        }, { passive: false });
        // To the previous page.
        this.prevPageButton.addEventListener('click', () => {
            this.activatePage(parseInt(this.pageInput.value, 10) - 1);
        }, { passive: true });
        // To the next page.
        this.nextPageButton.addEventListener('click', () => {
            this.activatePage(parseInt(this.pageInput.value, 10) + 1);
        }, { passive: true });
    }
    /**
     * Activate the specified page.
     *
     * @param {number} pageNum
     */
    activatePage(pageNum) {
        // Find the target page node.
        const targetNode = this.pageNodes.find(pageNode => pageNode.dataset.pageNumber == pageNum.toString());
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
    updatePage(pageNum) {
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
    enterPage() {
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
        }
        else
            // If the input zoom is an invalid number, set the previous value to the input zoom.
            this.pageInput.value = this.lastPage.toString();
    }
    /**
     * Browsing page change event. Returns the number of the page being viewed to the event handler.
     *
     * @param   {(pageNum: number) => void}
     * @returns {PageNav} The instance on which this method was called.
     */
    onChange(handler) {
        this.changeHandler = handler;
        return this;
    }
}

/**
 * Returns the PDF file name from the URL.
 *
 * @param   {string} url
 * @returns {string} PDF file name.
 */
var getFilename = (url) => {
    // Find the file name without the extension from the URL.
    const matches = url.match(/([^/]+)\.pdf$/i);
    // If the file name cannot be found in the URL.
    if (!matches)
        return 'document.pdf';
    // Returns the filename found from the URL.
    return `${matches[1]}.pdf`;
};

var action$b = {
	cancel: "Abbrechen",
	close: "Schliessen",
	download: "Download",
	enterFullscreen: "Vollbildansicht",
	exitFullscreen: "Vollbildansicht beenden",
	fitToPage: "An Seite anpassen",
	fitToWidth: "An Breite anpassen",
	pagePrev: "Vorherige Seite",
	pageNext: "Nächste Seite",
	print: "Drucken",
	ok: "OK",
	submit: "OK",
	zoomIn: "Heranzoomen",
	zoomOut: "Rauszoomen",
	darkMode: "Dark Mode",
	lightMode: "Heller Modus"
};
var component$b = {
	leftPanel: "Linke Leiste",
	zoomOverlay: "Zoom-Overlay"
};
var message$b = {
	badDocument: "Fehler beim Laden des Dokuments. Das Dokument ist entweder defekt oder ungültig.",
	enterPassword: "Dieses Dokument ist durch ein Passwort geschützt. Bitte geben Sie ein Passwort ein",
	incorrectPassword: "Falsches Passwort, verbleibende Versuche: {{ remainingAttempts }}",
	notSupported: "Dieser Dateityp wird nicht unterstützt.",
	passwordRequired: "Passwort erforderlich",
	warning: "Warnung"
};
var shortcut$b = {
	zoomIn: "(Strg +)",
	zoomOut: "(Strg -)"
};
var de = {
	action: action$b,
	component: component$b,
	message: message$b,
	shortcut: shortcut$b
};

var action$a = {
	cancel: "Cancel",
	close: "Close",
	download: "Download",
	enterFullscreen: "Full screen",
	exitFullscreen: "Exit full screen",
	fitToPage: "Fit to page",
	fitToWidth: "Fit to width",
	pagePrev: "Previous page",
	pageNext: "Next page",
	print: "Print",
	ok: "OK",
	submit: "Submit",
	zoomIn: "Zoom in",
	zoomOut: "Zoom out",
	darkMode: "Dark mode",
	lightMode: "Light mode"
};
var component$a = {
	leftPanel: "Panel",
	zoomOverlay: "Zoom Overlay"
};
var message$a = {
	badDocument: "Failed to load document. The document is either corrupt or not valid.",
	enterPassword: "This document is password protected. Please enter a password",
	incorrectPassword: "Incorrect password, attempts left: {{ remainingAttempts }}",
	notSupported: "That file type is not supported.",
	passwordRequired: "Password required",
	warning: "Warning"
};
var shortcut$a = {
	zoomIn: "(Ctrl +)",
	zoomOut: "(Ctrl -)"
};
var en = {
	action: action$a,
	component: component$a,
	message: message$a,
	shortcut: shortcut$a
};

var action$9 = {
	cancel: "Cancelar",
	close: "Cerrar",
	download: "Descargar",
	enterFullscreen: "Pantalla completa",
	exitFullscreen: "Salir de pantalla completa",
	fitToPage: "Ajustar a la página",
	fitToWidth: "Ajustar al ancho",
	pagePrev: "Pagina anterior",
	pageNext: "Siguiente página",
	print: "Imprimir",
	ok: "OK",
	submit: "Enviar",
	zoomIn: "Acercar zoom",
	zoomOut: "Alejar zoom",
	darkMode: "Modo oscuro",
	lightMode: "Modo de luz"
};
var component$9 = {
	leftPanel: "Panel",
	zoomOverlay: "Superposición de zoom"
};
var message$9 = {
	badDocument: "Error al cargar el documento. El documento está dañado o no es válido.",
	enterPassword: "Este documento está protegido por contraseña. Introduce una contraseña",
	incorrectPassword: "Contraseña incorrecta, intentos restantes: {{ remainingAttempts }}",
	notSupported: "Ese tipo de archivo no es compatible.",
	passwordRequired: "Se requiere contraseña",
	warning: "Advertencia"
};
var shortcut$9 = {
	zoomIn: "(Ctrl +)",
	zoomOut: "(Ctrl -)"
};
var es = {
	action: action$9,
	component: component$9,
	message: message$9,
	shortcut: shortcut$9
};

var action$8 = {
	cancel: "Annuler",
	close: "Fermer",
	download: "Télécharger",
	enterFullscreen: "Plein écran",
	exitFullscreen: "Quitter le plein écran",
	fitToPage: "Ajuster à la page",
	fitToWidth: "Ajuster à la largeur",
	pagePrev: "Page précédente",
	pageNext: "Page suivante",
	print: "Imprimer",
	ok: "OK",
	submit: "Soumettre",
	zoomIn: "Zoom avant",
	zoomOut: "Zoom arrière",
	darkMode: "Mode sombre",
	lightMode: "Mode clair"
};
var component$8 = {
	leftPanel: "Panneau de gauche",
	zoomOverlay: "Superposition de zoom"
};
var message$8 = {
	badDocument: "Échec du chargement du document. Le document est corrompu ou non valide.",
	enterPassword: "Ce document est protégé par un mot de passe. Veuillez saisir ce mot de passe.",
	incorrectPassword: "Mot de passe incorrect. Tentatives restantes: {{remainingAttempts}}",
	notSupported: "Ce type de fichier n'est pas pris en charge.",
	passwordRequired: "Mot de passe requis",
	warning: "Avertissement"
};
var shortcut$8 = {
	zoomIn: "(Ctrl +)",
	zoomOut: "(Ctrl -)"
};
var fr = {
	action: action$8,
	component: component$8,
	message: message$8,
	shortcut: shortcut$8
};

var action$7 = {
	cancel: "Annulla",
	close: "Vicino",
	download: "Scarica",
	enterFullscreen: "A schermo intero",
	exitFullscreen: "Esci dalla modalità schermo intero",
	fitToPage: "Adatta alla pagina",
	fitToWidth: "Adatta alla larghezza",
	pagePrev: "Pagina precedente",
	pageNext: "Pagina successiva",
	print: "Stampa",
	ok: "ok",
	submit: "Invia",
	zoomIn: "Ingrandire",
	zoomOut: "Rimpicciolisci",
	darkMode: "Modalità scura",
	lightMode: "Modalità luce"
};
var component$7 = {
	leftPanel: "Pannello",
	zoomOverlay: "Sovrapposizione zoom"
};
var message$7 = {
	badDocument: "Caricamento del documento non riuscito. Il documento è corrotto o non valido.",
	enterPassword: "Questo documento è protetto da password. Per favore inserire una password",
	incorrectPassword: "Password errata, tentativi rimasti: {{rimanendo tentativi}}",
	notSupported: "Quel tipo di file non è supportato.",
	passwordRequired: "Password richiesta",
	warning: "Avvertimento"
};
var shortcut$7 = {
	zoomIn: "(Ctrl +)",
	zoomOut: "(Ctrl -)"
};
var it = {
	action: action$7,
	component: component$7,
	message: message$7,
	shortcut: shortcut$7
};

var action$6 = {
	cancel: "キャンセル",
	close: "閉じる",
	download: "ダウンロード",
	enterFullscreen: "全画面表示",
	exitFullscreen: "全画面表示を終了",
	fitToPage: "高さに合わせる",
	fitToWidth: "幅に合わせる",
	pagePrev: "前のページ",
	pageNext: "次のページ",
	print: "印刷",
	ok: "OK",
	submit: "送信",
	zoomIn: "ズームイン",
	zoomOut: "ズームアウト",
	darkMode: "ダークモード",
	lightMode: "ライトモード"
};
var component$6 = {
	leftPanel: "パネル",
	zoomOverlay: "ズームオーバーレイ"
};
var message$6 = {
	badDocument: "ドキュメントの読み込みに失敗しました。ドキュメントが破損しているか、有効ではありません。",
	enterPassword: "このドキュメントは、パスワードで保護されています。 パスワードを入力してください。",
	incorrectPassword: "パスワードが正しくありません。残りの試行回数：{{ remainingAttempts }}",
	notSupported: "このファイル形式はサポートされていません。",
	passwordRequired: "パスワードが必要です",
	warning: "警告"
};
var shortcut$6 = {
	zoomIn: "(Ctrl +)",
	zoomOut: "(Ctrl -)"
};
var ja = {
	action: action$6,
	component: component$6,
	message: message$6,
	shortcut: shortcut$6
};

var action$5 = {
	cancel: "취소",
	close: "닫기",
	download: "다운로드",
	enterFullscreen: "전체 화면",
	exitFullscreen: "전체 화면 끝내기",
	fitToPage: "페이지에 맞추기",
	fitToWidth: "너비에 맞추기",
	pagePrev: "이전 페이지",
	pageNext: "다음 페이지",
	print: "인쇄",
	ok: "확인",
	submit: "제출",
	zoomIn: "확대",
	zoomOut: "축소",
	darkMode: "다크모드",
	lightMode: "라이트모드"
};
var component$5 = {
	leftPanel: "패널",
	zoomOverlay: "줌 오버레이"
};
var message$5 = {
	badDocument: "문서를 로드하지 못했습니다. 문서가 손상되었거나 유효하지 않습니다.",
	enterPassword: "이 문서는 비밀번호로 보호되어 있습니다. 비밀번호를 입력하세요",
	incorrectPassword: "비밀번호가 잘못되었습니다. 남은 시도: {{ remainingAttempts }}",
	notSupported: "해당 유형의 파일은 지원되지 않습니다.",
	passwordRequired: "비밀번호가 필요합니다",
	warning: "경고"
};
var shortcut$5 = {
	zoomIn: "(Ctrl +)",
	zoomOut: "(Ctrl -)"
};
var ko = {
	action: action$5,
	component: component$5,
	message: message$5,
	shortcut: shortcut$5
};

var action$4 = {
	cancel: "Annuleren",
	close: "Sluiten",
	download: "Download bestand",
	enterFullscreen: "Document in volledig scherm",
	exitFullscreen: "Document normaal weergeven",
	fitToPage: "Vensterhoogte",
	fitToWidth: "Vensterbreedte",
	pagePrev: "Vorige pagina",
	pageNext: "Volgende bladzijde",
	print: "Printen",
	ok: "OK",
	submit: "Verzenden",
	zoomIn: "Zoom in",
	zoomOut: "Zoom uit",
	darkMode: "Donkere modus",
	lightMode: "Lichte modus"
};
var component$4 = {
	leftPanel: "Panel",
	zoomOverlay: "Zoom-overlay"
};
var message$4 = {
	badDocument: "Er is een fout opgetreden bij het laden van het document. Het document is corrupt of heeft een ongeldige indeling.",
	enterPassword: "Dit document heeft een wachtwoord beveiliging. Geef een wachtwoord",
	incorrectPassword: "Fout wachtwoord, overgebleven pogingen: {{ remainingAttempts }}",
	notSupported: "Dit bestandstype wordt niet ondersteund.",
	passwordRequired: "Wachtwoord vereist",
	warning: "Waarschuwing"
};
var shortcut$4 = {
	zoomIn: "(Ctrl +)",
	zoomOut: "(Ctrl -)"
};
var nl = {
	action: action$4,
	component: component$4,
	message: message$4,
	shortcut: shortcut$4
};

var action$3 = {
	cancel: "Cancelar",
	close: "Fechar",
	download: "Download",
	enterFullscreen: "Tela cheia",
	exitFullscreen: "Sair da tela cheia",
	fitToPage: "Ajustar à página",
	fitToWidth: "Ajustar à largura",
	pagePrev: "Página anterior",
	pageNext: "Próxima página",
	print: "Imprimir",
	ok: "OK",
	submit: "Enviar",
	zoomIn: "Aproximar",
	zoomOut: "Afastar",
	darkMode: "Modo escuro",
	lightMode: "Modo claro"
};
var component$3 = {
	leftPanel: "Painel",
	zoomOverlay: "Sobreposição de zoom"
};
var message$3 = {
	badDocument: "Falha ao carregar documento. O documento está corrompido ou é inválido.",
	enterPassword: "Esse documento é protegido por senha. Digite uma senha",
	incorrectPassword: "Senha incorreta. Tentativas restantes: {{ remainingAttempts }}",
	notSupported: "Esse tipo de arquivo não é compatível.",
	passwordRequired: "Senha obrigatória",
	warning: "Aviso"
};
var shortcut$3 = {
	zoomIn: "(Ctrl +)",
	zoomOut: "(Ctrl -)"
};
var pt_br = {
	action: action$3,
	component: component$3,
	message: message$3,
	shortcut: shortcut$3
};

var action$2 = {
	cancel: "Отменить",
	close: "Закрыть",
	download: "Скачать",
	enterFullscreen: "Полный экран",
	exitFullscreen: "Выйти из полного экрана",
	fitToPage: "Уместить страницу",
	fitToWidth: "Уместить по ширине",
	pagePrev: "Предыдущая страница",
	pageNext: "Следующая страница",
	print: "Распечатать",
	ok: "OK",
	submit: "Отправить",
	zoomIn: "Увеличить",
	zoomOut: "Уменьшить",
	darkMode: "Темный режим",
	lightMode: "Легкий режим"
};
var component$2 = {
	leftPanel: "Панель",
	zoomOverlay: "Наложение масштаба"
};
var message$2 = {
	badDocument: "Произошла ошибка при загрузке документа. Документ содержит ошибки или недостоверный.",
	enterPassword: "Документ защищен паролем. Пожалуйста введите пароль.",
	incorrectPassword: "Пароль неверный, {{ remainingAttempts }} попыток осталось.",
	notSupported: "Расширение файла не поддерживается.",
	passwordRequired: "Пароль необходим",
	warning: "Предупреждение"
};
var shortcut$2 = {
	zoomIn: "(Ctrl +)",
	zoomOut: "(Ctrl -)"
};
var ru = {
	action: action$2,
	component: component$2,
	message: message$2,
	shortcut: shortcut$2
};

var action$1 = {
	cancel: "取消",
	close: "关闭",
	download: "下载",
	enterFullscreen: "全屏",
	exitFullscreen: "退出全屏",
	fitToPage: "页面尺寸",
	fitToWidth: "自身尺寸",
	pagePrev: "上一页",
	pageNext: "下一页",
	print: "打印",
	ok: "好的",
	submit: "提交",
	zoomIn: "放大",
	zoomOut: "缩小",
	darkMode: "暗模式",
	lightMode: "灯光模式"
};
var component$1 = {
	leftPanel: "面板",
	zoomOverlay: "缩放叠加"
};
var message$1 = {
	badDocument: "无法加载文档，此文档已损坏或无效。",
	enterPassword: "此文档已被加密。请输入密码。",
	incorrectPassword: "密码错误，剩余输入机会：{{remainingAttempts}}",
	notSupported: "不支持该文件类型。",
	passwordRequired: "需要输入密码",
	warning: "警告"
};
var shortcut$1 = {
	zoomIn: "(Ctrl +)",
	zoomOut: "(Ctrl -)"
};
var zh_cn = {
	action: action$1,
	component: component$1,
	message: message$1,
	shortcut: shortcut$1
};

var action = {
	cancel: "取消",
	close: "關閉",
	download: "下載",
	enterFullscreen: "全螢幕",
	exitFullscreen: "退出全螢幕",
	fitToPage: "符合頁面大小",
	fitToWidth: "符合寬度",
	pagePrev: "上一頁",
	pageNext: "下一頁",
	print: "列印",
	ok: "OK",
	submit: "提交",
	zoomIn: "放大",
	zoomOut: "縮小",
	darkMode: "暗模式",
	lightMode: "燈光模式"
};
var component = {
	leftPanel: "面板",
	zoomOverlay: "縮放疊加"
};
var message = {
	badDocument: "無法載入文件。此文件已損壞或無效。",
	enterPassword: "文件有密碼保護。請輸入密碼",
	incorrectPassword: "密碼不正確，剩下 {{ remainingAttempts }} 次嘗試機會",
	notSupported: "不支援該檔案類型。",
	passwordRequired: "需要密碼",
	warning: "警告"
};
var shortcut = {
	zoomIn: "(Ctrl +)",
	zoomOut: "(Ctrl -)"
};
var zh_tw = {
	action: action,
	component: component,
	message: message,
	shortcut: shortcut
};

var i18n = (lang = 'en') => {
    const languages = { de, en, es, fr, it, ja, ko, nl, pt_br, ru, zh_cn, zh_tw };
    return languages[lang in languages ? lang : 'en'];
};

function t(t){return t&&t.__esModule&&Object.prototype.hasOwnProperty.call(t,"default")?t.default:t}function e(t){throw new Error('Could not dynamically require "'+t+'". Please configure the dynamicRequireTargets or/and ignoreDynamicRequires option of @rollup/plugin-commonjs appropriately for this require call to work.')}var r=t(function(t){var e={};function n(r){if(e[r])return e[r].exports;var i=e[r]={exports:{},id:r,loaded:!1};return t[r].call(i.exports,i,i.exports,n),i.loaded=!0,i.exports}return n.m=t,n.c=e,n.p="",n(0)}([function(t,e,n){var r=n(1).default;e.__esModule=!0;var i=r(n(2)),s=r(n(45)),a=n(46),o=n(51),u=r(n(52)),l=r(n(49)),c=r(n(44)),h=i.default.create;function p(){var t=h();return t.compile=function(e,n){return o.compile(e,n,t)},t.precompile=function(e,n){return o.precompile(e,n,t)},t.AST=s.default,t.Compiler=o.Compiler,t.JavaScriptCompiler=u.default,t.Parser=a.parser,t.parse=a.parse,t.parseWithoutProcessing=a.parseWithoutProcessing,t}var d=p();d.create=p,c.default(d),d.Visitor=l.default,d.default=d,e.default=d,t.exports=e.default;},function(t,e){e.default=function(t){return t&&t.__esModule?t:{default:t}},e.__esModule=!0;},function(t,e,n){var r=n(3).default,i=n(1).default;e.__esModule=!0;var s=r(n(4)),a=i(n(37)),o=i(n(6)),u=r(n(5)),l=r(n(38)),c=i(n(44));function h(){var t=new s.HandlebarsEnvironment;return u.extend(t,s),t.SafeString=a.default,t.Exception=o.default,t.Utils=u,t.escapeExpression=u.escapeExpression,t.VM=l,t.template=function(e){return l.template(e,t)},t}var p=h();p.create=h,c.default(p),p.default=p,e.default=p,t.exports=e.default;},function(t,e){e.default=function(t){if(t&&t.__esModule)return t;var e={};if(null!=t)for(var n in t)Object.prototype.hasOwnProperty.call(t,n)&&(e[n]=t[n]);return e.default=t,e},e.__esModule=!0;},function(t,e,n){var r=n(1).default;e.__esModule=!0,e.HandlebarsEnvironment=c;var i=n(5),s=r(n(6)),a=n(10),o=n(30),u=r(n(32)),l=n(33);function c(t,e,n){this.helpers=t||{},this.partials=e||{},this.decorators=n||{},a.registerDefaultHelpers(this),o.registerDefaultDecorators(this);}e.VERSION="4.7.7",e.COMPILER_REVISION=8,e.LAST_COMPATIBLE_COMPILER_REVISION=7,e.REVISION_CHANGES={1:"<= 1.0.rc.2",2:"== 1.0.0-rc.3",3:"== 1.0.0-rc.4",4:"== 1.x.x",5:"== 2.0.0-alpha.x",6:">= 2.0.0-beta.1",7:">= 4.0.0 <4.3.0",8:">= 4.3.0"},c.prototype={constructor:c,logger:u.default,log:u.default.log,registerHelper:function(t,e){if("[object Object]"===i.toString.call(t)){if(e)throw new s.default("Arg not supported with multiple helpers");i.extend(this.helpers,t);}else this.helpers[t]=e;},unregisterHelper:function(t){delete this.helpers[t];},registerPartial:function(t,e){if("[object Object]"===i.toString.call(t))i.extend(this.partials,t);else {if(void 0===e)throw new s.default('Attempting to register a partial called "'+t+'" as undefined');this.partials[t]=e;}},unregisterPartial:function(t){delete this.partials[t];},registerDecorator:function(t,e){if("[object Object]"===i.toString.call(t)){if(e)throw new s.default("Arg not supported with multiple decorators");i.extend(this.decorators,t);}else this.decorators[t]=e;},unregisterDecorator:function(t){delete this.decorators[t];},resetLoggedPropertyAccesses:function(){l.resetLoggedProperties();}};var h=u.default.log;e.log=h,e.createFrame=i.createFrame,e.logger=u.default;},function(t,e){e.__esModule=!0,e.extend=a,e.indexOf=function(t,e){for(var n=0,r=t.length;n<r;n++)if(t[n]===e)return n;return -1},e.escapeExpression=function(t){if("string"!=typeof t){if(t&&t.toHTML)return t.toHTML();if(null==t)return "";if(!t)return t+"";t=""+t;}return i.test(t)?t.replace(r,s):t},e.isEmpty=function(t){return !t&&0!==t||!(!l(t)||0!==t.length)},e.createFrame=function(t){var e=a({},t);return e._parent=t,e},e.blockParams=function(t,e){return t.path=e,t},e.appendContextPath=function(t,e){return (t?t+".":"")+e};var n={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#x27;","`":"&#x60;","=":"&#x3D;"},r=/[&<>"'`=]/g,i=/[&<>"'`=]/;function s(t){return n[t]}function a(t){for(var e=1;e<arguments.length;e++)for(var n in arguments[e])Object.prototype.hasOwnProperty.call(arguments[e],n)&&(t[n]=arguments[e][n]);return t}var o=Object.prototype.toString;e.toString=o;var u=function(t){return "function"==typeof t};u(/x/)&&(e.isFunction=u=function(t){return "function"==typeof t&&"[object Function]"===o.call(t)}),e.isFunction=u;var l=Array.isArray||function(t){return !(!t||"object"!=typeof t)&&"[object Array]"===o.call(t)};e.isArray=l;},function(t,e,n){var r=n(7).default;e.__esModule=!0;var i=["description","fileName","lineNumber","endLineNumber","message","name","number","stack"];function s(t,e){var n=e&&e.loc,a=void 0,o=void 0,u=void 0,l=void 0;n&&(a=n.start.line,o=n.end.line,u=n.start.column,l=n.end.column,t+=" - "+a+":"+u);for(var c=Error.prototype.constructor.call(this,t),h=0;h<i.length;h++)this[i[h]]=c[i[h]];Error.captureStackTrace&&Error.captureStackTrace(this,s);try{n&&(this.lineNumber=a,this.endLineNumber=o,r?(Object.defineProperty(this,"column",{value:u,enumerable:!0}),Object.defineProperty(this,"endColumn",{value:l,enumerable:!0})):(this.column=u,this.endColumn=l));}catch(t){}}s.prototype=new Error,e.default=s,t.exports=e.default;},function(t,e,n){t.exports={default:n(8),__esModule:!0};},function(t,e,n){var r=n(9);t.exports=function(t,e,n){return r.setDesc(t,e,n)};},function(t,e){var n=Object;t.exports={create:n.create,getProto:n.getPrototypeOf,isEnum:{}.propertyIsEnumerable,getDesc:n.getOwnPropertyDescriptor,setDesc:n.defineProperty,setDescs:n.defineProperties,getKeys:n.keys,getNames:n.getOwnPropertyNames,getSymbols:n.getOwnPropertySymbols,each:[].forEach};},function(t,e,n){var r=n(1).default;e.__esModule=!0,e.registerDefaultHelpers=function(t){i.default(t),s.default(t),a.default(t),o.default(t),u.default(t),l.default(t),c.default(t);},e.moveHelperToHooks=function(t,e,n){t.helpers[e]&&(t.hooks[e]=t.helpers[e],n||delete t.helpers[e]);};var i=r(n(11)),s=r(n(12)),a=r(n(25)),o=r(n(26)),u=r(n(27)),l=r(n(28)),c=r(n(29));},function(t,e,n){e.__esModule=!0;var r=n(5);e.default=function(t){t.registerHelper("blockHelperMissing",(function(e,n){var i=n.inverse,s=n.fn;if(!0===e)return s(this);if(!1===e||null==e)return i(this);if(r.isArray(e))return e.length>0?(n.ids&&(n.ids=[n.name]),t.helpers.each(e,n)):i(this);if(n.data&&n.ids){var a=r.createFrame(n.data);a.contextPath=r.appendContextPath(n.data.contextPath,n.name),n={data:a};}return s(e,n)}));},t.exports=e.default;},function(t,e,n){(function(r){var i=n(13).default,s=n(1).default;e.__esModule=!0;var a=n(5),o=s(n(6));e.default=function(t){t.registerHelper("each",(function(t,e){if(!e)throw new o.default("Must pass iterator to #each");var n,s=e.fn,u=e.inverse,l=0,c="",h=void 0,p=void 0;function d(e,n,r){h&&(h.key=e,h.index=n,h.first=0===n,h.last=!!r,p&&(h.contextPath=p+e)),c+=s(t[e],{data:h,blockParams:a.blockParams([t[e],e],[p+e,null])});}if(e.data&&e.ids&&(p=a.appendContextPath(e.data.contextPath,e.ids[0])+"."),a.isFunction(t)&&(t=t.call(this)),e.data&&(h=a.createFrame(e.data)),t&&"object"==typeof t)if(a.isArray(t))for(var f=t.length;l<f;l++)l in t&&d(l,l,l===t.length-1);else if(r.Symbol&&t[r.Symbol.iterator]){for(var m=[],y=t[r.Symbol.iterator](),g=y.next();!g.done;g=y.next())m.push(g.value);for(f=(t=m).length;l<f;l++)d(l,l,l===t.length-1);}else n=void 0,i(t).forEach((function(t){void 0!==n&&d(n,l-1),n=t,l++;})),void 0!==n&&d(n,l-1,!0);return 0===l&&(c=u(this)),c}));},t.exports=e.default;}).call(e,function(){return this}());},function(t,e,n){t.exports={default:n(14),__esModule:!0};},function(t,e,n){n(15),t.exports=n(21).Object.keys;},function(t,e,n){var r=n(16);n(18)("keys",(function(t){return function(e){return t(r(e))}}));},function(t,e,n){var r=n(17);t.exports=function(t){return Object(r(t))};},function(t,e){t.exports=function(t){if(null==t)throw TypeError("Can't call method on  "+t);return t};},function(t,e,n){var r=n(19),i=n(21),s=n(24);t.exports=function(t,e){var n=(i.Object||{})[t]||Object[t],a={};a[t]=e(n),r(r.S+r.F*s((function(){n(1);})),"Object",a);};},function(t,e,n){var r=n(20),i=n(21),s=n(22),a=function(t,e,n){var o,u,l,c=t&a.F,h=t&a.G,p=t&a.S,d=t&a.P,f=t&a.B,m=t&a.W,y=h?i:i[e]||(i[e]={}),g=h?r:p?r[e]:(r[e]||{}).prototype;for(o in h&&(n=e),n)(u=!c&&g&&o in g)&&o in y||(l=u?g[o]:n[o],y[o]=h&&"function"!=typeof g[o]?n[o]:f&&u?s(l,r):m&&g[o]==l?function(t){var e=function(e){return this instanceof t?new t(e):t(e)};return e.prototype=t.prototype,e}(l):d&&"function"==typeof l?s(Function.call,l):l,d&&((y.prototype||(y.prototype={}))[o]=l));};a.F=1,a.G=2,a.S=4,a.P=8,a.B=16,a.W=32,t.exports=a;},function(t,e){var n=t.exports="undefined"!=typeof window&&window.Math==Math?window:"undefined"!=typeof self&&self.Math==Math?self:Function("return this")();"number"==typeof __g&&(__g=n);},function(t,e){var n=t.exports={version:"1.2.6"};"number"==typeof __e&&(__e=n);},function(t,e,n){var r=n(23);t.exports=function(t,e,n){if(r(t),void 0===e)return t;switch(n){case 1:return function(n){return t.call(e,n)};case 2:return function(n,r){return t.call(e,n,r)};case 3:return function(n,r,i){return t.call(e,n,r,i)}}return function(){return t.apply(e,arguments)}};},function(t,e){t.exports=function(t){if("function"!=typeof t)throw TypeError(t+" is not a function!");return t};},function(t,e){t.exports=function(t){try{return !!t()}catch(t){return !0}};},function(t,e,n){var r=n(1).default;e.__esModule=!0;var i=r(n(6));e.default=function(t){t.registerHelper("helperMissing",(function(){if(1!==arguments.length)throw new i.default('Missing helper: "'+arguments[arguments.length-1].name+'"')}));},t.exports=e.default;},function(t,e,n){var r=n(1).default;e.__esModule=!0;var i=n(5),s=r(n(6));e.default=function(t){t.registerHelper("if",(function(t,e){if(2!=arguments.length)throw new s.default("#if requires exactly one argument");return i.isFunction(t)&&(t=t.call(this)),!e.hash.includeZero&&!t||i.isEmpty(t)?e.inverse(this):e.fn(this)})),t.registerHelper("unless",(function(e,n){if(2!=arguments.length)throw new s.default("#unless requires exactly one argument");return t.helpers.if.call(this,e,{fn:n.inverse,inverse:n.fn,hash:n.hash})}));},t.exports=e.default;},function(t,e){e.__esModule=!0,e.default=function(t){t.registerHelper("log",(function(){for(var e=[void 0],n=arguments[arguments.length-1],r=0;r<arguments.length-1;r++)e.push(arguments[r]);var i=1;null!=n.hash.level?i=n.hash.level:n.data&&null!=n.data.level&&(i=n.data.level),e[0]=i,t.log.apply(t,e);}));},t.exports=e.default;},function(t,e){e.__esModule=!0,e.default=function(t){t.registerHelper("lookup",(function(t,e,n){return t?n.lookupProperty(t,e):t}));},t.exports=e.default;},function(t,e,n){var r=n(1).default;e.__esModule=!0;var i=n(5),s=r(n(6));e.default=function(t){t.registerHelper("with",(function(t,e){if(2!=arguments.length)throw new s.default("#with requires exactly one argument");i.isFunction(t)&&(t=t.call(this));var n=e.fn;if(i.isEmpty(t))return e.inverse(this);var r=e.data;return e.data&&e.ids&&((r=i.createFrame(e.data)).contextPath=i.appendContextPath(e.data.contextPath,e.ids[0])),n(t,{data:r,blockParams:i.blockParams([t],[r&&r.contextPath])})}));},t.exports=e.default;},function(t,e,n){var r=n(1).default;e.__esModule=!0,e.registerDefaultDecorators=function(t){i.default(t);};var i=r(n(31));},function(t,e,n){e.__esModule=!0;var r=n(5);e.default=function(t){t.registerDecorator("inline",(function(t,e,n,i){var s=t;return e.partials||(e.partials={},s=function(i,s){var a=n.partials;n.partials=r.extend({},a,e.partials);var o=t(i,s);return n.partials=a,o}),e.partials[i.args[0]]=i.fn,s}));},t.exports=e.default;},function(t,e,n){e.__esModule=!0;var r=n(5),i={methodMap:["debug","info","warn","error"],level:"info",lookupLevel:function(t){if("string"==typeof t){var e=r.indexOf(i.methodMap,t.toLowerCase());t=e>=0?e:parseInt(t,10);}return t},log:function(t){if(t=i.lookupLevel(t),"undefined"!=typeof console&&i.lookupLevel(i.level)<=t){var e=i.methodMap[t];console[e]||(e="log");for(var n=arguments.length,r=Array(n>1?n-1:0),s=1;s<n;s++)r[s-1]=arguments[s];console[e].apply(console,r);}}};e.default=i,t.exports=e.default;},function(t,e,n){var r=n(34).default,i=n(13).default,s=n(3).default;e.__esModule=!0,e.createProtoAccessControl=function(t){var e=r(null);e.constructor=!1,e.__defineGetter__=!1,e.__defineSetter__=!1,e.__lookupGetter__=!1;var n=r(null);return n.__proto__=!1,{properties:{whitelist:a.createNewLookupObject(n,t.allowedProtoProperties),defaultValue:t.allowProtoPropertiesByDefault},methods:{whitelist:a.createNewLookupObject(e,t.allowedProtoMethods),defaultValue:t.allowProtoMethodsByDefault}}},e.resultIsAllowed=function(t,e,n){return l("function"==typeof t?e.methods:e.properties,n)},e.resetLoggedProperties=function(){i(u).forEach((function(t){delete u[t];}));};var a=n(36),o=s(n(32)),u=r(null);function l(t,e){return void 0!==t.whitelist[e]?!0===t.whitelist[e]:void 0!==t.defaultValue?t.defaultValue:(function(t){!0!==u[t]&&(u[t]=!0,o.log("error",'Handlebars: Access has been denied to resolve the property "'+t+'" because it is not an "own property" of its parent.\nYou can add a runtime option to disable the check or this warning:\nSee https://handlebarsjs.com/api-reference/runtime-options.html#options-to-control-prototype-access for details'));}(e),!1)}},function(t,e,n){t.exports={default:n(35),__esModule:!0};},function(t,e,n){var r=n(9);t.exports=function(t,e){return r.create(t,e)};},function(t,e,n){var r=n(34).default;e.__esModule=!0,e.createNewLookupObject=function(){for(var t=arguments.length,e=Array(t),n=0;n<t;n++)e[n]=arguments[n];return i.extend.apply(void 0,[r(null)].concat(e))};var i=n(5);},function(t,e){function n(t){this.string=t;}e.__esModule=!0,n.prototype.toString=n.prototype.toHTML=function(){return ""+this.string},e.default=n,t.exports=e.default;},function(t,e,n){var r=n(39).default,i=n(13).default,s=n(3).default,a=n(1).default;e.__esModule=!0,e.checkRevision=function(t){var e=t&&t[0]||1,n=l.COMPILER_REVISION;if(!(e>=l.LAST_COMPATIBLE_COMPILER_REVISION&&e<=l.COMPILER_REVISION)){if(e<l.LAST_COMPATIBLE_COMPILER_REVISION){var r=l.REVISION_CHANGES[n],i=l.REVISION_CHANGES[e];throw new u.default("Template was precompiled with an older version of Handlebars than the current runtime. Please update your precompiler to a newer version ("+r+") or downgrade your runtime to an older version ("+i+").")}throw new u.default("Template was precompiled with a newer version of Handlebars than the current runtime. Please update your runtime to a newer version ("+t[1]+").")}},e.template=function(t,e){if(!e)throw new u.default("No environment passed to template");if(!t||!t.main)throw new u.default("Unknown template object: "+typeof t);t.main.decorator=t.main_d,e.VM.checkRevision(t.compiler);var n=t.compiler&&7===t.compiler[0],s={strict:function(t,e,n){if(!t||!(e in t))throw new u.default('"'+e+'" not defined in '+t,{loc:n});return s.lookupProperty(t,e)},lookupProperty:function(t,e){var n=t[e];return null==n||Object.prototype.hasOwnProperty.call(t,e)||p.resultIsAllowed(n,s.protoAccessControl,e)?n:void 0},lookup:function(t,e){for(var n=t.length,r=0;r<n;r++)if(null!=(t[r]&&s.lookupProperty(t[r],e)))return t[r][e]},lambda:function(t,e){return "function"==typeof t?t.call(e):t},escapeExpression:o.escapeExpression,invokePartial:function(n,r,i){i.hash&&(r=o.extend({},r,i.hash),i.ids&&(i.ids[0]=!0)),n=e.VM.resolvePartial.call(this,n,r,i);var s=o.extend({},i,{hooks:this.hooks,protoAccessControl:this.protoAccessControl}),a=e.VM.invokePartial.call(this,n,r,s);if(null==a&&e.compile&&(i.partials[i.name]=e.compile(n,t.compilerOptions,e),a=i.partials[i.name](r,s)),null!=a){if(i.indent){for(var l=a.split("\n"),c=0,h=l.length;c<h&&(l[c]||c+1!==h);c++)l[c]=i.indent+l[c];a=l.join("\n");}return a}throw new u.default("The partial "+i.name+" could not be compiled when running in runtime-only mode")},fn:function(e){var n=t[e];return n.decorator=t[e+"_d"],n},programs:[],program:function(t,e,n,r,i){var s=this.programs[t],a=this.fn(t);return e||i||r||n?s=d(this,t,a,e,n,r,i):s||(s=this.programs[t]=d(this,t,a)),s},data:function(t,e){for(;t&&e--;)t=t._parent;return t},mergeIfNeeded:function(t,e){var n=t||e;return t&&e&&t!==e&&(n=o.extend({},e,t)),n},nullContext:r({}),noop:e.VM.noop,compilerInfo:t.compiler};function a(e){var n=arguments.length<=1||void 0===arguments[1]?{}:arguments[1],r=n.data;a._setup(n),!n.partial&&t.useData&&(r=m(e,r));var i=void 0,o=t.useBlockParams?[]:void 0;function u(e){return ""+t.main(s,e,s.helpers,s.partials,r,o,i)}return t.useDepths&&(i=n.depths?e!=n.depths[0]?[e].concat(n.depths):n.depths:[e]),(u=y(t.main,u,s,n.depths||[],r,o))(e,n)}return a.isTop=!0,a._setup=function(r){if(r.partial)s.protoAccessControl=r.protoAccessControl,s.helpers=r.helpers,s.partials=r.partials,s.decorators=r.decorators,s.hooks=r.hooks;else {var a=o.extend({},e.helpers,r.helpers);!function(t,e){i(t).forEach((function(n){var r=t[n];t[n]=function(t,e){var n=e.lookupProperty;return h.wrapHelper(t,(function(t){return o.extend({lookupProperty:n},t)}))}(r,e);}));}(a,s),s.helpers=a,t.usePartial&&(s.partials=s.mergeIfNeeded(r.partials,e.partials)),(t.usePartial||t.useDecorators)&&(s.decorators=o.extend({},e.decorators,r.decorators)),s.hooks={},s.protoAccessControl=p.createProtoAccessControl(r);var u=r.allowCallsToHelperMissing||n;c.moveHelperToHooks(s,"helperMissing",u),c.moveHelperToHooks(s,"blockHelperMissing",u);}},a._child=function(e,n,r,i){if(t.useBlockParams&&!r)throw new u.default("must pass block params");if(t.useDepths&&!i)throw new u.default("must pass parent depths");return d(s,e,t[e],n,0,r,i)},a},e.wrapProgram=d,e.resolvePartial=function(t,e,n){return t?t.call||n.name||(n.name=t,t=n.partials[t]):t="@partial-block"===n.name?n.data["partial-block"]:n.partials[n.name],t},e.invokePartial=function(t,e,n){var r=n.data&&n.data["partial-block"];n.partial=!0,n.ids&&(n.data.contextPath=n.ids[0]||n.data.contextPath);var i=void 0;if(n.fn&&n.fn!==f&&function(){n.data=l.createFrame(n.data);var t=n.fn;i=n.data["partial-block"]=function(e){var n=arguments.length<=1||void 0===arguments[1]?{}:arguments[1];return n.data=l.createFrame(n.data),n.data["partial-block"]=r,t(e,n)},t.partials&&(n.partials=o.extend({},n.partials,t.partials));}(),void 0===t&&i&&(t=i),void 0===t)throw new u.default("The partial "+n.name+" could not be found");if(t instanceof Function)return t(e,n)},e.noop=f;var o=s(n(5)),u=a(n(6)),l=n(4),c=n(10),h=n(43),p=n(33);function d(t,e,n,r,i,s,a){function o(e){var i=arguments.length<=1||void 0===arguments[1]?{}:arguments[1],o=a;return !a||e==a[0]||e===t.nullContext&&null===a[0]||(o=[e].concat(a)),n(t,e,t.helpers,t.partials,i.data||r,s&&[i.blockParams].concat(s),o)}return (o=y(n,o,t,a,r,s)).program=e,o.depth=a?a.length:0,o.blockParams=i||0,o}function f(){return ""}function m(t,e){return e&&"root"in e||((e=e?l.createFrame(e):{}).root=t),e}function y(t,e,n,r,i,s){if(t.decorator){var a={};e=t.decorator(e,a,n,r&&r[0],i,s,r),o.extend(e,a);}return e}},function(t,e,n){t.exports={default:n(40),__esModule:!0};},function(t,e,n){n(41),t.exports=n(21).Object.seal;},function(t,e,n){var r=n(42);n(18)("seal",(function(t){return function(e){return t&&r(e)?t(e):e}}));},function(t,e){t.exports=function(t){return "object"==typeof t?null!==t:"function"==typeof t};},function(t,e){e.__esModule=!0,e.wrapHelper=function(t,e){return "function"!=typeof t?t:function(){var n=arguments[arguments.length-1];return arguments[arguments.length-1]=e(n),t.apply(this,arguments)}};},function(t,e){(function(n){e.__esModule=!0,e.default=function(t){var e=void 0!==n?n:window,r=e.Handlebars;t.noConflict=function(){return e.Handlebars===t&&(e.Handlebars=r),t};},t.exports=e.default;}).call(e,function(){return this}());},function(t,e){e.__esModule=!0;var n={helpers:{helperExpression:function(t){return "SubExpression"===t.type||("MustacheStatement"===t.type||"BlockStatement"===t.type)&&!!(t.params&&t.params.length||t.hash)},scopedId:function(t){return /^\.|this\b/.test(t.original)},simpleId:function(t){return 1===t.parts.length&&!n.helpers.scopedId(t)&&!t.depth}}};e.default=n,t.exports=e.default;},function(t,e,n){var r=n(1).default,i=n(3).default;e.__esModule=!0,e.parseWithoutProcessing=c,e.parse=function(t,e){var n=c(t,e);return new a.default(e).accept(n)};var s=r(n(47)),a=r(n(48)),o=i(n(50)),u=n(5);e.parser=s.default;var l={};function c(t,e){return "Program"===t.type?t:(s.default.yy=l,l.locInfo=function(t){return new l.SourceLocation(e&&e.srcName,t)},s.default.parse(t))}u.extend(l,o);},function(t,e){e.__esModule=!0;var n=function(){var t={trace:function(){},yy:{},symbols_:{error:2,root:3,program:4,EOF:5,program_repetition0:6,statement:7,mustache:8,block:9,rawBlock:10,partial:11,partialBlock:12,content:13,COMMENT:14,CONTENT:15,openRawBlock:16,rawBlock_repetition0:17,END_RAW_BLOCK:18,OPEN_RAW_BLOCK:19,helperName:20,openRawBlock_repetition0:21,openRawBlock_option0:22,CLOSE_RAW_BLOCK:23,openBlock:24,block_option0:25,closeBlock:26,openInverse:27,block_option1:28,OPEN_BLOCK:29,openBlock_repetition0:30,openBlock_option0:31,openBlock_option1:32,CLOSE:33,OPEN_INVERSE:34,openInverse_repetition0:35,openInverse_option0:36,openInverse_option1:37,openInverseChain:38,OPEN_INVERSE_CHAIN:39,openInverseChain_repetition0:40,openInverseChain_option0:41,openInverseChain_option1:42,inverseAndProgram:43,INVERSE:44,inverseChain:45,inverseChain_option0:46,OPEN_ENDBLOCK:47,OPEN:48,mustache_repetition0:49,mustache_option0:50,OPEN_UNESCAPED:51,mustache_repetition1:52,mustache_option1:53,CLOSE_UNESCAPED:54,OPEN_PARTIAL:55,partialName:56,partial_repetition0:57,partial_option0:58,openPartialBlock:59,OPEN_PARTIAL_BLOCK:60,openPartialBlock_repetition0:61,openPartialBlock_option0:62,param:63,sexpr:64,OPEN_SEXPR:65,sexpr_repetition0:66,sexpr_option0:67,CLOSE_SEXPR:68,hash:69,hash_repetition_plus0:70,hashSegment:71,ID:72,EQUALS:73,blockParams:74,OPEN_BLOCK_PARAMS:75,blockParams_repetition_plus0:76,CLOSE_BLOCK_PARAMS:77,path:78,dataName:79,STRING:80,NUMBER:81,BOOLEAN:82,UNDEFINED:83,NULL:84,DATA:85,pathSegments:86,SEP:87,$accept:0,$end:1},terminals_:{2:"error",5:"EOF",14:"COMMENT",15:"CONTENT",18:"END_RAW_BLOCK",19:"OPEN_RAW_BLOCK",23:"CLOSE_RAW_BLOCK",29:"OPEN_BLOCK",33:"CLOSE",34:"OPEN_INVERSE",39:"OPEN_INVERSE_CHAIN",44:"INVERSE",47:"OPEN_ENDBLOCK",48:"OPEN",51:"OPEN_UNESCAPED",54:"CLOSE_UNESCAPED",55:"OPEN_PARTIAL",60:"OPEN_PARTIAL_BLOCK",65:"OPEN_SEXPR",68:"CLOSE_SEXPR",72:"ID",73:"EQUALS",75:"OPEN_BLOCK_PARAMS",77:"CLOSE_BLOCK_PARAMS",80:"STRING",81:"NUMBER",82:"BOOLEAN",83:"UNDEFINED",84:"NULL",85:"DATA",87:"SEP"},productions_:[0,[3,2],[4,1],[7,1],[7,1],[7,1],[7,1],[7,1],[7,1],[7,1],[13,1],[10,3],[16,5],[9,4],[9,4],[24,6],[27,6],[38,6],[43,2],[45,3],[45,1],[26,3],[8,5],[8,5],[11,5],[12,3],[59,5],[63,1],[63,1],[64,5],[69,1],[71,3],[74,3],[20,1],[20,1],[20,1],[20,1],[20,1],[20,1],[20,1],[56,1],[56,1],[79,2],[78,1],[86,3],[86,1],[6,0],[6,2],[17,0],[17,2],[21,0],[21,2],[22,0],[22,1],[25,0],[25,1],[28,0],[28,1],[30,0],[30,2],[31,0],[31,1],[32,0],[32,1],[35,0],[35,2],[36,0],[36,1],[37,0],[37,1],[40,0],[40,2],[41,0],[41,1],[42,0],[42,1],[46,0],[46,1],[49,0],[49,2],[50,0],[50,1],[52,0],[52,2],[53,0],[53,1],[57,0],[57,2],[58,0],[58,1],[61,0],[61,2],[62,0],[62,1],[66,0],[66,2],[67,0],[67,1],[70,1],[70,2],[76,1],[76,2]],performAction:function(t,e,n,r,i,s,a){var o=s.length-1;switch(i){case 1:return s[o-1];case 2:this.$=r.prepareProgram(s[o]);break;case 3:case 4:case 5:case 6:case 7:case 8:this.$=s[o];break;case 9:this.$={type:"CommentStatement",value:r.stripComment(s[o]),strip:r.stripFlags(s[o],s[o]),loc:r.locInfo(this._$)};break;case 10:this.$={type:"ContentStatement",original:s[o],value:s[o],loc:r.locInfo(this._$)};break;case 11:this.$=r.prepareRawBlock(s[o-2],s[o-1],s[o],this._$);break;case 12:this.$={path:s[o-3],params:s[o-2],hash:s[o-1]};break;case 13:this.$=r.prepareBlock(s[o-3],s[o-2],s[o-1],s[o],!1,this._$);break;case 14:this.$=r.prepareBlock(s[o-3],s[o-2],s[o-1],s[o],!0,this._$);break;case 15:this.$={open:s[o-5],path:s[o-4],params:s[o-3],hash:s[o-2],blockParams:s[o-1],strip:r.stripFlags(s[o-5],s[o])};break;case 16:case 17:this.$={path:s[o-4],params:s[o-3],hash:s[o-2],blockParams:s[o-1],strip:r.stripFlags(s[o-5],s[o])};break;case 18:this.$={strip:r.stripFlags(s[o-1],s[o-1]),program:s[o]};break;case 19:var u=r.prepareBlock(s[o-2],s[o-1],s[o],s[o],!1,this._$),l=r.prepareProgram([u],s[o-1].loc);l.chained=!0,this.$={strip:s[o-2].strip,program:l,chain:!0};break;case 20:this.$=s[o];break;case 21:this.$={path:s[o-1],strip:r.stripFlags(s[o-2],s[o])};break;case 22:case 23:this.$=r.prepareMustache(s[o-3],s[o-2],s[o-1],s[o-4],r.stripFlags(s[o-4],s[o]),this._$);break;case 24:this.$={type:"PartialStatement",name:s[o-3],params:s[o-2],hash:s[o-1],indent:"",strip:r.stripFlags(s[o-4],s[o]),loc:r.locInfo(this._$)};break;case 25:this.$=r.preparePartialBlock(s[o-2],s[o-1],s[o],this._$);break;case 26:this.$={path:s[o-3],params:s[o-2],hash:s[o-1],strip:r.stripFlags(s[o-4],s[o])};break;case 27:case 28:this.$=s[o];break;case 29:this.$={type:"SubExpression",path:s[o-3],params:s[o-2],hash:s[o-1],loc:r.locInfo(this._$)};break;case 30:this.$={type:"Hash",pairs:s[o],loc:r.locInfo(this._$)};break;case 31:this.$={type:"HashPair",key:r.id(s[o-2]),value:s[o],loc:r.locInfo(this._$)};break;case 32:this.$=r.id(s[o-1]);break;case 33:case 34:this.$=s[o];break;case 35:this.$={type:"StringLiteral",value:s[o],original:s[o],loc:r.locInfo(this._$)};break;case 36:this.$={type:"NumberLiteral",value:Number(s[o]),original:Number(s[o]),loc:r.locInfo(this._$)};break;case 37:this.$={type:"BooleanLiteral",value:"true"===s[o],original:"true"===s[o],loc:r.locInfo(this._$)};break;case 38:this.$={type:"UndefinedLiteral",original:void 0,value:void 0,loc:r.locInfo(this._$)};break;case 39:this.$={type:"NullLiteral",original:null,value:null,loc:r.locInfo(this._$)};break;case 40:case 41:this.$=s[o];break;case 42:this.$=r.preparePath(!0,s[o],this._$);break;case 43:this.$=r.preparePath(!1,s[o],this._$);break;case 44:s[o-2].push({part:r.id(s[o]),original:s[o],separator:s[o-1]}),this.$=s[o-2];break;case 45:this.$=[{part:r.id(s[o]),original:s[o]}];break;case 46:this.$=[];break;case 47:s[o-1].push(s[o]);break;case 48:this.$=[];break;case 49:s[o-1].push(s[o]);break;case 50:this.$=[];break;case 51:s[o-1].push(s[o]);break;case 58:this.$=[];break;case 59:s[o-1].push(s[o]);break;case 64:this.$=[];break;case 65:s[o-1].push(s[o]);break;case 70:this.$=[];break;case 71:s[o-1].push(s[o]);break;case 78:this.$=[];break;case 79:s[o-1].push(s[o]);break;case 82:this.$=[];break;case 83:s[o-1].push(s[o]);break;case 86:this.$=[];break;case 87:s[o-1].push(s[o]);break;case 90:this.$=[];break;case 91:s[o-1].push(s[o]);break;case 94:this.$=[];break;case 95:s[o-1].push(s[o]);break;case 98:this.$=[s[o]];break;case 99:s[o-1].push(s[o]);break;case 100:this.$=[s[o]];break;case 101:s[o-1].push(s[o]);}},table:[{3:1,4:2,5:[2,46],6:3,14:[2,46],15:[2,46],19:[2,46],29:[2,46],34:[2,46],48:[2,46],51:[2,46],55:[2,46],60:[2,46]},{1:[3]},{5:[1,4]},{5:[2,2],7:5,8:6,9:7,10:8,11:9,12:10,13:11,14:[1,12],15:[1,20],16:17,19:[1,23],24:15,27:16,29:[1,21],34:[1,22],39:[2,2],44:[2,2],47:[2,2],48:[1,13],51:[1,14],55:[1,18],59:19,60:[1,24]},{1:[2,1]},{5:[2,47],14:[2,47],15:[2,47],19:[2,47],29:[2,47],34:[2,47],39:[2,47],44:[2,47],47:[2,47],48:[2,47],51:[2,47],55:[2,47],60:[2,47]},{5:[2,3],14:[2,3],15:[2,3],19:[2,3],29:[2,3],34:[2,3],39:[2,3],44:[2,3],47:[2,3],48:[2,3],51:[2,3],55:[2,3],60:[2,3]},{5:[2,4],14:[2,4],15:[2,4],19:[2,4],29:[2,4],34:[2,4],39:[2,4],44:[2,4],47:[2,4],48:[2,4],51:[2,4],55:[2,4],60:[2,4]},{5:[2,5],14:[2,5],15:[2,5],19:[2,5],29:[2,5],34:[2,5],39:[2,5],44:[2,5],47:[2,5],48:[2,5],51:[2,5],55:[2,5],60:[2,5]},{5:[2,6],14:[2,6],15:[2,6],19:[2,6],29:[2,6],34:[2,6],39:[2,6],44:[2,6],47:[2,6],48:[2,6],51:[2,6],55:[2,6],60:[2,6]},{5:[2,7],14:[2,7],15:[2,7],19:[2,7],29:[2,7],34:[2,7],39:[2,7],44:[2,7],47:[2,7],48:[2,7],51:[2,7],55:[2,7],60:[2,7]},{5:[2,8],14:[2,8],15:[2,8],19:[2,8],29:[2,8],34:[2,8],39:[2,8],44:[2,8],47:[2,8],48:[2,8],51:[2,8],55:[2,8],60:[2,8]},{5:[2,9],14:[2,9],15:[2,9],19:[2,9],29:[2,9],34:[2,9],39:[2,9],44:[2,9],47:[2,9],48:[2,9],51:[2,9],55:[2,9],60:[2,9]},{20:25,72:[1,35],78:26,79:27,80:[1,28],81:[1,29],82:[1,30],83:[1,31],84:[1,32],85:[1,34],86:33},{20:36,72:[1,35],78:26,79:27,80:[1,28],81:[1,29],82:[1,30],83:[1,31],84:[1,32],85:[1,34],86:33},{4:37,6:3,14:[2,46],15:[2,46],19:[2,46],29:[2,46],34:[2,46],39:[2,46],44:[2,46],47:[2,46],48:[2,46],51:[2,46],55:[2,46],60:[2,46]},{4:38,6:3,14:[2,46],15:[2,46],19:[2,46],29:[2,46],34:[2,46],44:[2,46],47:[2,46],48:[2,46],51:[2,46],55:[2,46],60:[2,46]},{15:[2,48],17:39,18:[2,48]},{20:41,56:40,64:42,65:[1,43],72:[1,35],78:26,79:27,80:[1,28],81:[1,29],82:[1,30],83:[1,31],84:[1,32],85:[1,34],86:33},{4:44,6:3,14:[2,46],15:[2,46],19:[2,46],29:[2,46],34:[2,46],47:[2,46],48:[2,46],51:[2,46],55:[2,46],60:[2,46]},{5:[2,10],14:[2,10],15:[2,10],18:[2,10],19:[2,10],29:[2,10],34:[2,10],39:[2,10],44:[2,10],47:[2,10],48:[2,10],51:[2,10],55:[2,10],60:[2,10]},{20:45,72:[1,35],78:26,79:27,80:[1,28],81:[1,29],82:[1,30],83:[1,31],84:[1,32],85:[1,34],86:33},{20:46,72:[1,35],78:26,79:27,80:[1,28],81:[1,29],82:[1,30],83:[1,31],84:[1,32],85:[1,34],86:33},{20:47,72:[1,35],78:26,79:27,80:[1,28],81:[1,29],82:[1,30],83:[1,31],84:[1,32],85:[1,34],86:33},{20:41,56:48,64:42,65:[1,43],72:[1,35],78:26,79:27,80:[1,28],81:[1,29],82:[1,30],83:[1,31],84:[1,32],85:[1,34],86:33},{33:[2,78],49:49,65:[2,78],72:[2,78],80:[2,78],81:[2,78],82:[2,78],83:[2,78],84:[2,78],85:[2,78]},{23:[2,33],33:[2,33],54:[2,33],65:[2,33],68:[2,33],72:[2,33],75:[2,33],80:[2,33],81:[2,33],82:[2,33],83:[2,33],84:[2,33],85:[2,33]},{23:[2,34],33:[2,34],54:[2,34],65:[2,34],68:[2,34],72:[2,34],75:[2,34],80:[2,34],81:[2,34],82:[2,34],83:[2,34],84:[2,34],85:[2,34]},{23:[2,35],33:[2,35],54:[2,35],65:[2,35],68:[2,35],72:[2,35],75:[2,35],80:[2,35],81:[2,35],82:[2,35],83:[2,35],84:[2,35],85:[2,35]},{23:[2,36],33:[2,36],54:[2,36],65:[2,36],68:[2,36],72:[2,36],75:[2,36],80:[2,36],81:[2,36],82:[2,36],83:[2,36],84:[2,36],85:[2,36]},{23:[2,37],33:[2,37],54:[2,37],65:[2,37],68:[2,37],72:[2,37],75:[2,37],80:[2,37],81:[2,37],82:[2,37],83:[2,37],84:[2,37],85:[2,37]},{23:[2,38],33:[2,38],54:[2,38],65:[2,38],68:[2,38],72:[2,38],75:[2,38],80:[2,38],81:[2,38],82:[2,38],83:[2,38],84:[2,38],85:[2,38]},{23:[2,39],33:[2,39],54:[2,39],65:[2,39],68:[2,39],72:[2,39],75:[2,39],80:[2,39],81:[2,39],82:[2,39],83:[2,39],84:[2,39],85:[2,39]},{23:[2,43],33:[2,43],54:[2,43],65:[2,43],68:[2,43],72:[2,43],75:[2,43],80:[2,43],81:[2,43],82:[2,43],83:[2,43],84:[2,43],85:[2,43],87:[1,50]},{72:[1,35],86:51},{23:[2,45],33:[2,45],54:[2,45],65:[2,45],68:[2,45],72:[2,45],75:[2,45],80:[2,45],81:[2,45],82:[2,45],83:[2,45],84:[2,45],85:[2,45],87:[2,45]},{52:52,54:[2,82],65:[2,82],72:[2,82],80:[2,82],81:[2,82],82:[2,82],83:[2,82],84:[2,82],85:[2,82]},{25:53,38:55,39:[1,57],43:56,44:[1,58],45:54,47:[2,54]},{28:59,43:60,44:[1,58],47:[2,56]},{13:62,15:[1,20],18:[1,61]},{33:[2,86],57:63,65:[2,86],72:[2,86],80:[2,86],81:[2,86],82:[2,86],83:[2,86],84:[2,86],85:[2,86]},{33:[2,40],65:[2,40],72:[2,40],80:[2,40],81:[2,40],82:[2,40],83:[2,40],84:[2,40],85:[2,40]},{33:[2,41],65:[2,41],72:[2,41],80:[2,41],81:[2,41],82:[2,41],83:[2,41],84:[2,41],85:[2,41]},{20:64,72:[1,35],78:26,79:27,80:[1,28],81:[1,29],82:[1,30],83:[1,31],84:[1,32],85:[1,34],86:33},{26:65,47:[1,66]},{30:67,33:[2,58],65:[2,58],72:[2,58],75:[2,58],80:[2,58],81:[2,58],82:[2,58],83:[2,58],84:[2,58],85:[2,58]},{33:[2,64],35:68,65:[2,64],72:[2,64],75:[2,64],80:[2,64],81:[2,64],82:[2,64],83:[2,64],84:[2,64],85:[2,64]},{21:69,23:[2,50],65:[2,50],72:[2,50],80:[2,50],81:[2,50],82:[2,50],83:[2,50],84:[2,50],85:[2,50]},{33:[2,90],61:70,65:[2,90],72:[2,90],80:[2,90],81:[2,90],82:[2,90],83:[2,90],84:[2,90],85:[2,90]},{20:74,33:[2,80],50:71,63:72,64:75,65:[1,43],69:73,70:76,71:77,72:[1,78],78:26,79:27,80:[1,28],81:[1,29],82:[1,30],83:[1,31],84:[1,32],85:[1,34],86:33},{72:[1,79]},{23:[2,42],33:[2,42],54:[2,42],65:[2,42],68:[2,42],72:[2,42],75:[2,42],80:[2,42],81:[2,42],82:[2,42],83:[2,42],84:[2,42],85:[2,42],87:[1,50]},{20:74,53:80,54:[2,84],63:81,64:75,65:[1,43],69:82,70:76,71:77,72:[1,78],78:26,79:27,80:[1,28],81:[1,29],82:[1,30],83:[1,31],84:[1,32],85:[1,34],86:33},{26:83,47:[1,66]},{47:[2,55]},{4:84,6:3,14:[2,46],15:[2,46],19:[2,46],29:[2,46],34:[2,46],39:[2,46],44:[2,46],47:[2,46],48:[2,46],51:[2,46],55:[2,46],60:[2,46]},{47:[2,20]},{20:85,72:[1,35],78:26,79:27,80:[1,28],81:[1,29],82:[1,30],83:[1,31],84:[1,32],85:[1,34],86:33},{4:86,6:3,14:[2,46],15:[2,46],19:[2,46],29:[2,46],34:[2,46],47:[2,46],48:[2,46],51:[2,46],55:[2,46],60:[2,46]},{26:87,47:[1,66]},{47:[2,57]},{5:[2,11],14:[2,11],15:[2,11],19:[2,11],29:[2,11],34:[2,11],39:[2,11],44:[2,11],47:[2,11],48:[2,11],51:[2,11],55:[2,11],60:[2,11]},{15:[2,49],18:[2,49]},{20:74,33:[2,88],58:88,63:89,64:75,65:[1,43],69:90,70:76,71:77,72:[1,78],78:26,79:27,80:[1,28],81:[1,29],82:[1,30],83:[1,31],84:[1,32],85:[1,34],86:33},{65:[2,94],66:91,68:[2,94],72:[2,94],80:[2,94],81:[2,94],82:[2,94],83:[2,94],84:[2,94],85:[2,94]},{5:[2,25],14:[2,25],15:[2,25],19:[2,25],29:[2,25],34:[2,25],39:[2,25],44:[2,25],47:[2,25],48:[2,25],51:[2,25],55:[2,25],60:[2,25]},{20:92,72:[1,35],78:26,79:27,80:[1,28],81:[1,29],82:[1,30],83:[1,31],84:[1,32],85:[1,34],86:33},{20:74,31:93,33:[2,60],63:94,64:75,65:[1,43],69:95,70:76,71:77,72:[1,78],75:[2,60],78:26,79:27,80:[1,28],81:[1,29],82:[1,30],83:[1,31],84:[1,32],85:[1,34],86:33},{20:74,33:[2,66],36:96,63:97,64:75,65:[1,43],69:98,70:76,71:77,72:[1,78],75:[2,66],78:26,79:27,80:[1,28],81:[1,29],82:[1,30],83:[1,31],84:[1,32],85:[1,34],86:33},{20:74,22:99,23:[2,52],63:100,64:75,65:[1,43],69:101,70:76,71:77,72:[1,78],78:26,79:27,80:[1,28],81:[1,29],82:[1,30],83:[1,31],84:[1,32],85:[1,34],86:33},{20:74,33:[2,92],62:102,63:103,64:75,65:[1,43],69:104,70:76,71:77,72:[1,78],78:26,79:27,80:[1,28],81:[1,29],82:[1,30],83:[1,31],84:[1,32],85:[1,34],86:33},{33:[1,105]},{33:[2,79],65:[2,79],72:[2,79],80:[2,79],81:[2,79],82:[2,79],83:[2,79],84:[2,79],85:[2,79]},{33:[2,81]},{23:[2,27],33:[2,27],54:[2,27],65:[2,27],68:[2,27],72:[2,27],75:[2,27],80:[2,27],81:[2,27],82:[2,27],83:[2,27],84:[2,27],85:[2,27]},{23:[2,28],33:[2,28],54:[2,28],65:[2,28],68:[2,28],72:[2,28],75:[2,28],80:[2,28],81:[2,28],82:[2,28],83:[2,28],84:[2,28],85:[2,28]},{23:[2,30],33:[2,30],54:[2,30],68:[2,30],71:106,72:[1,107],75:[2,30]},{23:[2,98],33:[2,98],54:[2,98],68:[2,98],72:[2,98],75:[2,98]},{23:[2,45],33:[2,45],54:[2,45],65:[2,45],68:[2,45],72:[2,45],73:[1,108],75:[2,45],80:[2,45],81:[2,45],82:[2,45],83:[2,45],84:[2,45],85:[2,45],87:[2,45]},{23:[2,44],33:[2,44],54:[2,44],65:[2,44],68:[2,44],72:[2,44],75:[2,44],80:[2,44],81:[2,44],82:[2,44],83:[2,44],84:[2,44],85:[2,44],87:[2,44]},{54:[1,109]},{54:[2,83],65:[2,83],72:[2,83],80:[2,83],81:[2,83],82:[2,83],83:[2,83],84:[2,83],85:[2,83]},{54:[2,85]},{5:[2,13],14:[2,13],15:[2,13],19:[2,13],29:[2,13],34:[2,13],39:[2,13],44:[2,13],47:[2,13],48:[2,13],51:[2,13],55:[2,13],60:[2,13]},{38:55,39:[1,57],43:56,44:[1,58],45:111,46:110,47:[2,76]},{33:[2,70],40:112,65:[2,70],72:[2,70],75:[2,70],80:[2,70],81:[2,70],82:[2,70],83:[2,70],84:[2,70],85:[2,70]},{47:[2,18]},{5:[2,14],14:[2,14],15:[2,14],19:[2,14],29:[2,14],34:[2,14],39:[2,14],44:[2,14],47:[2,14],48:[2,14],51:[2,14],55:[2,14],60:[2,14]},{33:[1,113]},{33:[2,87],65:[2,87],72:[2,87],80:[2,87],81:[2,87],82:[2,87],83:[2,87],84:[2,87],85:[2,87]},{33:[2,89]},{20:74,63:115,64:75,65:[1,43],67:114,68:[2,96],69:116,70:76,71:77,72:[1,78],78:26,79:27,80:[1,28],81:[1,29],82:[1,30],83:[1,31],84:[1,32],85:[1,34],86:33},{33:[1,117]},{32:118,33:[2,62],74:119,75:[1,120]},{33:[2,59],65:[2,59],72:[2,59],75:[2,59],80:[2,59],81:[2,59],82:[2,59],83:[2,59],84:[2,59],85:[2,59]},{33:[2,61],75:[2,61]},{33:[2,68],37:121,74:122,75:[1,120]},{33:[2,65],65:[2,65],72:[2,65],75:[2,65],80:[2,65],81:[2,65],82:[2,65],83:[2,65],84:[2,65],85:[2,65]},{33:[2,67],75:[2,67]},{23:[1,123]},{23:[2,51],65:[2,51],72:[2,51],80:[2,51],81:[2,51],82:[2,51],83:[2,51],84:[2,51],85:[2,51]},{23:[2,53]},{33:[1,124]},{33:[2,91],65:[2,91],72:[2,91],80:[2,91],81:[2,91],82:[2,91],83:[2,91],84:[2,91],85:[2,91]},{33:[2,93]},{5:[2,22],14:[2,22],15:[2,22],19:[2,22],29:[2,22],34:[2,22],39:[2,22],44:[2,22],47:[2,22],48:[2,22],51:[2,22],55:[2,22],60:[2,22]},{23:[2,99],33:[2,99],54:[2,99],68:[2,99],72:[2,99],75:[2,99]},{73:[1,108]},{20:74,63:125,64:75,65:[1,43],72:[1,35],78:26,79:27,80:[1,28],81:[1,29],82:[1,30],83:[1,31],84:[1,32],85:[1,34],86:33},{5:[2,23],14:[2,23],15:[2,23],19:[2,23],29:[2,23],34:[2,23],39:[2,23],44:[2,23],47:[2,23],48:[2,23],51:[2,23],55:[2,23],60:[2,23]},{47:[2,19]},{47:[2,77]},{20:74,33:[2,72],41:126,63:127,64:75,65:[1,43],69:128,70:76,71:77,72:[1,78],75:[2,72],78:26,79:27,80:[1,28],81:[1,29],82:[1,30],83:[1,31],84:[1,32],85:[1,34],86:33},{5:[2,24],14:[2,24],15:[2,24],19:[2,24],29:[2,24],34:[2,24],39:[2,24],44:[2,24],47:[2,24],48:[2,24],51:[2,24],55:[2,24],60:[2,24]},{68:[1,129]},{65:[2,95],68:[2,95],72:[2,95],80:[2,95],81:[2,95],82:[2,95],83:[2,95],84:[2,95],85:[2,95]},{68:[2,97]},{5:[2,21],14:[2,21],15:[2,21],19:[2,21],29:[2,21],34:[2,21],39:[2,21],44:[2,21],47:[2,21],48:[2,21],51:[2,21],55:[2,21],60:[2,21]},{33:[1,130]},{33:[2,63]},{72:[1,132],76:131},{33:[1,133]},{33:[2,69]},{15:[2,12],18:[2,12]},{14:[2,26],15:[2,26],19:[2,26],29:[2,26],34:[2,26],47:[2,26],48:[2,26],51:[2,26],55:[2,26],60:[2,26]},{23:[2,31],33:[2,31],54:[2,31],68:[2,31],72:[2,31],75:[2,31]},{33:[2,74],42:134,74:135,75:[1,120]},{33:[2,71],65:[2,71],72:[2,71],75:[2,71],80:[2,71],81:[2,71],82:[2,71],83:[2,71],84:[2,71],85:[2,71]},{33:[2,73],75:[2,73]},{23:[2,29],33:[2,29],54:[2,29],65:[2,29],68:[2,29],72:[2,29],75:[2,29],80:[2,29],81:[2,29],82:[2,29],83:[2,29],84:[2,29],85:[2,29]},{14:[2,15],15:[2,15],19:[2,15],29:[2,15],34:[2,15],39:[2,15],44:[2,15],47:[2,15],48:[2,15],51:[2,15],55:[2,15],60:[2,15]},{72:[1,137],77:[1,136]},{72:[2,100],77:[2,100]},{14:[2,16],15:[2,16],19:[2,16],29:[2,16],34:[2,16],44:[2,16],47:[2,16],48:[2,16],51:[2,16],55:[2,16],60:[2,16]},{33:[1,138]},{33:[2,75]},{33:[2,32]},{72:[2,101],77:[2,101]},{14:[2,17],15:[2,17],19:[2,17],29:[2,17],34:[2,17],39:[2,17],44:[2,17],47:[2,17],48:[2,17],51:[2,17],55:[2,17],60:[2,17]}],defaultActions:{4:[2,1],54:[2,55],56:[2,20],60:[2,57],73:[2,81],82:[2,85],86:[2,18],90:[2,89],101:[2,53],104:[2,93],110:[2,19],111:[2,77],116:[2,97],119:[2,63],122:[2,69],135:[2,75],136:[2,32]},parseError:function(t,e){throw new Error(t)},parse:function(t){var e=this,n=[0],r=[null],i=[],s=this.table,a="",o=0,u=0;this.lexer.setInput(t),this.lexer.yy=this.yy,this.yy.lexer=this.lexer,this.yy.parser=this,void 0===this.lexer.yylloc&&(this.lexer.yylloc={});var l=this.lexer.yylloc;i.push(l);var c=this.lexer.options&&this.lexer.options.ranges;"function"==typeof this.yy.parseError&&(this.parseError=this.yy.parseError);for(var h,p,d,f,m,y,g,_,v,k={};;){if(p=n[n.length-1],this.defaultActions[p]?d=this.defaultActions[p]:(null==h&&(v=void 0,"number"!=typeof(v=e.lexer.lex()||1)&&(v=e.symbols_[v]||v),h=v),d=s[p]&&s[p][h]),void 0===d||!d.length||!d[0]){var S="";for(m in _=[],s[p])this.terminals_[m]&&m>2&&_.push("'"+this.terminals_[m]+"'");S=this.lexer.showPosition?"Parse error on line "+(o+1)+":\n"+this.lexer.showPosition()+"\nExpecting "+_.join(", ")+", got '"+(this.terminals_[h]||h)+"'":"Parse error on line "+(o+1)+": Unexpected "+(1==h?"end of input":"'"+(this.terminals_[h]||h)+"'"),this.parseError(S,{text:this.lexer.match,token:this.terminals_[h]||h,line:this.lexer.yylineno,loc:l,expected:_});}if(d[0]instanceof Array&&d.length>1)throw new Error("Parse Error: multiple actions possible at state: "+p+", token: "+h);switch(d[0]){case 1:n.push(h),r.push(this.lexer.yytext),i.push(this.lexer.yylloc),n.push(d[1]),h=null,u=this.lexer.yyleng,a=this.lexer.yytext,o=this.lexer.yylineno,l=this.lexer.yylloc;break;case 2:if(y=this.productions_[d[1]][1],k.$=r[r.length-y],k._$={first_line:i[i.length-(y||1)].first_line,last_line:i[i.length-1].last_line,first_column:i[i.length-(y||1)].first_column,last_column:i[i.length-1].last_column},c&&(k._$.range=[i[i.length-(y||1)].range[0],i[i.length-1].range[1]]),void 0!==(f=this.performAction.call(k,a,u,o,this.yy,d[1],r,i)))return f;y&&(n=n.slice(0,-1*y*2),r=r.slice(0,-1*y),i=i.slice(0,-1*y)),n.push(this.productions_[d[1]][0]),r.push(k.$),i.push(k._$),g=s[n[n.length-2]][n[n.length-1]],n.push(g);break;case 3:return !0}}return !0}},e=function(){var t={EOF:1,parseError:function(t,e){if(!this.yy.parser)throw new Error(t);this.yy.parser.parseError(t,e);},setInput:function(t){return this._input=t,this._more=this._less=this.done=!1,this.yylineno=this.yyleng=0,this.yytext=this.matched=this.match="",this.conditionStack=["INITIAL"],this.yylloc={first_line:1,first_column:0,last_line:1,last_column:0},this.options.ranges&&(this.yylloc.range=[0,0]),this.offset=0,this},input:function(){var t=this._input[0];return this.yytext+=t,this.yyleng++,this.offset++,this.match+=t,this.matched+=t,t.match(/(?:\r\n?|\n).*/g)?(this.yylineno++,this.yylloc.last_line++):this.yylloc.last_column++,this.options.ranges&&this.yylloc.range[1]++,this._input=this._input.slice(1),t},unput:function(t){var e=t.length,n=t.split(/(?:\r\n?|\n)/g);this._input=t+this._input,this.yytext=this.yytext.substr(0,this.yytext.length-e-1),this.offset-=e;var r=this.match.split(/(?:\r\n?|\n)/g);this.match=this.match.substr(0,this.match.length-1),this.matched=this.matched.substr(0,this.matched.length-1),n.length-1&&(this.yylineno-=n.length-1);var i=this.yylloc.range;return this.yylloc={first_line:this.yylloc.first_line,last_line:this.yylineno+1,first_column:this.yylloc.first_column,last_column:n?(n.length===r.length?this.yylloc.first_column:0)+r[r.length-n.length].length-n[0].length:this.yylloc.first_column-e},this.options.ranges&&(this.yylloc.range=[i[0],i[0]+this.yyleng-e]),this},more:function(){return this._more=!0,this},less:function(t){this.unput(this.match.slice(t));},pastInput:function(){var t=this.matched.substr(0,this.matched.length-this.match.length);return (t.length>20?"...":"")+t.substr(-20).replace(/\n/g,"")},upcomingInput:function(){var t=this.match;return t.length<20&&(t+=this._input.substr(0,20-t.length)),(t.substr(0,20)+(t.length>20?"...":"")).replace(/\n/g,"")},showPosition:function(){var t=this.pastInput(),e=new Array(t.length+1).join("-");return t+this.upcomingInput()+"\n"+e+"^"},next:function(){if(this.done)return this.EOF;var t,e,n,r,i;this._input||(this.done=!0),this._more||(this.yytext="",this.match="");for(var s=this._currentRules(),a=0;a<s.length&&(!(n=this._input.match(this.rules[s[a]]))||e&&!(n[0].length>e[0].length)||(e=n,r=a,this.options.flex));a++);return e?((i=e[0].match(/(?:\r\n?|\n).*/g))&&(this.yylineno+=i.length),this.yylloc={first_line:this.yylloc.last_line,last_line:this.yylineno+1,first_column:this.yylloc.last_column,last_column:i?i[i.length-1].length-i[i.length-1].match(/\r?\n?/)[0].length:this.yylloc.last_column+e[0].length},this.yytext+=e[0],this.match+=e[0],this.matches=e,this.yyleng=this.yytext.length,this.options.ranges&&(this.yylloc.range=[this.offset,this.offset+=this.yyleng]),this._more=!1,this._input=this._input.slice(e[0].length),this.matched+=e[0],t=this.performAction.call(this,this.yy,this,s[r],this.conditionStack[this.conditionStack.length-1]),this.done&&this._input&&(this.done=!1),t||void 0):""===this._input?this.EOF:this.parseError("Lexical error on line "+(this.yylineno+1)+". Unrecognized text.\n"+this.showPosition(),{text:"",token:null,line:this.yylineno})},lex:function(){var t=this.next();return void 0!==t?t:this.lex()},begin:function(t){this.conditionStack.push(t);},popState:function(){return this.conditionStack.pop()},_currentRules:function(){return this.conditions[this.conditionStack[this.conditionStack.length-1]].rules},topState:function(){return this.conditionStack[this.conditionStack.length-2]},pushState:function(t){this.begin(t);},options:{},performAction:function(t,e,n,r){function i(t,n){return e.yytext=e.yytext.substring(t,e.yyleng-n+t)}switch(n){case 0:if("\\\\"===e.yytext.slice(-2)?(i(0,1),this.begin("mu")):"\\"===e.yytext.slice(-1)?(i(0,1),this.begin("emu")):this.begin("mu"),e.yytext)return 15;break;case 1:return 15;case 2:return this.popState(),15;case 3:return this.begin("raw"),15;case 4:return this.popState(),"raw"===this.conditionStack[this.conditionStack.length-1]?15:(i(5,9),"END_RAW_BLOCK");case 5:return 15;case 6:return this.popState(),14;case 7:return 65;case 8:return 68;case 9:return 19;case 10:return this.popState(),this.begin("raw"),23;case 11:return 55;case 12:return 60;case 13:return 29;case 14:return 47;case 15:case 16:return this.popState(),44;case 17:return 34;case 18:return 39;case 19:return 51;case 20:return 48;case 21:this.unput(e.yytext),this.popState(),this.begin("com");break;case 22:return this.popState(),14;case 23:return 48;case 24:return 73;case 25:case 26:return 72;case 27:return 87;case 28:break;case 29:return this.popState(),54;case 30:return this.popState(),33;case 31:return e.yytext=i(1,2).replace(/\\"/g,'"'),80;case 32:return e.yytext=i(1,2).replace(/\\'/g,"'"),80;case 33:return 85;case 34:case 35:return 82;case 36:return 83;case 37:return 84;case 38:return 81;case 39:return 75;case 40:return 77;case 41:return 72;case 42:return e.yytext=e.yytext.replace(/\\([\\\]])/g,"$1"),72;case 43:return "INVALID";case 44:return 5}},rules:[/^(?:[^\x00]*?(?=(\{\{)))/,/^(?:[^\x00]+)/,/^(?:[^\x00]{2,}?(?=(\{\{|\\\{\{|\\\\\{\{|$)))/,/^(?:\{\{\{\{(?=[^\/]))/,/^(?:\{\{\{\{\/[^\s!"#%-,\.\/;->@\[-\^`\{-~]+(?=[=}\s\/.])\}\}\}\})/,/^(?:[^\x00]+?(?=(\{\{\{\{)))/,/^(?:[\s\S]*?--(~)?\}\})/,/^(?:\()/,/^(?:\))/,/^(?:\{\{\{\{)/,/^(?:\}\}\}\})/,/^(?:\{\{(~)?>)/,/^(?:\{\{(~)?#>)/,/^(?:\{\{(~)?#\*?)/,/^(?:\{\{(~)?\/)/,/^(?:\{\{(~)?\^\s*(~)?\}\})/,/^(?:\{\{(~)?\s*else\s*(~)?\}\})/,/^(?:\{\{(~)?\^)/,/^(?:\{\{(~)?\s*else\b)/,/^(?:\{\{(~)?\{)/,/^(?:\{\{(~)?&)/,/^(?:\{\{(~)?!--)/,/^(?:\{\{(~)?![\s\S]*?\}\})/,/^(?:\{\{(~)?\*?)/,/^(?:=)/,/^(?:\.\.)/,/^(?:\.(?=([=~}\s\/.)|])))/,/^(?:[\/.])/,/^(?:\s+)/,/^(?:\}(~)?\}\})/,/^(?:(~)?\}\})/,/^(?:"(\\["]|[^"])*")/,/^(?:'(\\[']|[^'])*')/,/^(?:@)/,/^(?:true(?=([~}\s)])))/,/^(?:false(?=([~}\s)])))/,/^(?:undefined(?=([~}\s)])))/,/^(?:null(?=([~}\s)])))/,/^(?:-?[0-9]+(?:\.[0-9]+)?(?=([~}\s)])))/,/^(?:as\s+\|)/,/^(?:\|)/,/^(?:([^\s!"#%-,\.\/;->@\[-\^`\{-~]+(?=([=~}\s\/.)|]))))/,/^(?:\[(\\\]|[^\]])*\])/,/^(?:.)/,/^(?:$)/],conditions:{mu:{rules:[7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44],inclusive:!1},emu:{rules:[2],inclusive:!1},com:{rules:[6],inclusive:!1},raw:{rules:[3,4,5],inclusive:!1},INITIAL:{rules:[0,1,44],inclusive:!0}}};return t}();function n(){this.yy={};}return t.lexer=e,n.prototype=t,t.Parser=n,new n}();e.default=n,t.exports=e.default;},function(t,e,n){var r=n(1).default;e.__esModule=!0;var i=r(n(49));function s(){var t=arguments.length<=0||void 0===arguments[0]?{}:arguments[0];this.options=t;}function a(t,e,n){void 0===e&&(e=t.length);var r=t[e-1],i=t[e-2];return r?"ContentStatement"===r.type?(i||!n?/\r?\n\s*?$/:/(^|\r?\n)\s*?$/).test(r.original):void 0:n}function o(t,e,n){void 0===e&&(e=-1);var r=t[e+1],i=t[e+2];return r?"ContentStatement"===r.type?(i||!n?/^\s*?\r?\n/:/^\s*?(\r?\n|$)/).test(r.original):void 0:n}function u(t,e,n){var r=t[null==e?0:e+1];if(r&&"ContentStatement"===r.type&&(n||!r.rightStripped)){var i=r.value;r.value=r.value.replace(n?/^\s+/:/^[ \t]*\r?\n?/,""),r.rightStripped=r.value!==i;}}function l(t,e,n){var r=t[null==e?t.length-1:e-1];if(r&&"ContentStatement"===r.type&&(n||!r.leftStripped)){var i=r.value;return r.value=r.value.replace(n?/\s+$/:/[ \t]+$/,""),r.leftStripped=r.value!==i,r.leftStripped}}s.prototype=new i.default,s.prototype.Program=function(t){var e=!this.options.ignoreStandalone,n=!this.isRootSeen;this.isRootSeen=!0;for(var r=t.body,i=0,s=r.length;i<s;i++){var c=r[i],h=this.accept(c);if(h){var p=a(r,i,n),d=o(r,i,n),f=h.openStandalone&&p,m=h.closeStandalone&&d,y=h.inlineStandalone&&p&&d;h.close&&u(r,i,!0),h.open&&l(r,i,!0),e&&y&&(u(r,i),l(r,i)&&"PartialStatement"===c.type&&(c.indent=/([ \t]+$)/.exec(r[i-1].original)[1])),e&&f&&(u((c.program||c.inverse).body),l(r,i)),e&&m&&(u(r,i),l((c.inverse||c.program).body));}}return t},s.prototype.BlockStatement=s.prototype.DecoratorBlock=s.prototype.PartialBlockStatement=function(t){this.accept(t.program),this.accept(t.inverse);var e=t.program||t.inverse,n=t.program&&t.inverse,r=n,i=n;if(n&&n.chained)for(r=n.body[0].program;i.chained;)i=i.body[i.body.length-1].program;var s={open:t.openStrip.open,close:t.closeStrip.close,openStandalone:o(e.body),closeStandalone:a((r||e).body)};if(t.openStrip.close&&u(e.body,null,!0),n){var c=t.inverseStrip;c.open&&l(e.body,null,!0),c.close&&u(r.body,null,!0),t.closeStrip.open&&l(i.body,null,!0),!this.options.ignoreStandalone&&a(e.body)&&o(r.body)&&(l(e.body),u(r.body));}else t.closeStrip.open&&l(e.body,null,!0);return s},s.prototype.Decorator=s.prototype.MustacheStatement=function(t){return t.strip},s.prototype.PartialStatement=s.prototype.CommentStatement=function(t){var e=t.strip||{};return {inlineStandalone:!0,open:e.open,close:e.close}},e.default=s,t.exports=e.default;},function(t,e,n){var r=n(1).default;e.__esModule=!0;var i=r(n(6));function s(){this.parents=[];}function a(t){this.acceptRequired(t,"path"),this.acceptArray(t.params),this.acceptKey(t,"hash");}function o(t){a.call(this,t),this.acceptKey(t,"program"),this.acceptKey(t,"inverse");}function u(t){this.acceptRequired(t,"name"),this.acceptArray(t.params),this.acceptKey(t,"hash");}s.prototype={constructor:s,mutating:!1,acceptKey:function(t,e){var n=this.accept(t[e]);if(this.mutating){if(n&&!s.prototype[n.type])throw new i.default('Unexpected node type "'+n.type+'" found when accepting '+e+" on "+t.type);t[e]=n;}},acceptRequired:function(t,e){if(this.acceptKey(t,e),!t[e])throw new i.default(t.type+" requires "+e)},acceptArray:function(t){for(var e=0,n=t.length;e<n;e++)this.acceptKey(t,e),t[e]||(t.splice(e,1),e--,n--);},accept:function(t){if(t){if(!this[t.type])throw new i.default("Unknown type: "+t.type,t);this.current&&this.parents.unshift(this.current),this.current=t;var e=this[t.type](t);return this.current=this.parents.shift(),!this.mutating||e?e:!1!==e?t:void 0}},Program:function(t){this.acceptArray(t.body);},MustacheStatement:a,Decorator:a,BlockStatement:o,DecoratorBlock:o,PartialStatement:u,PartialBlockStatement:function(t){u.call(this,t),this.acceptKey(t,"program");},ContentStatement:function(){},CommentStatement:function(){},SubExpression:a,PathExpression:function(){},StringLiteral:function(){},NumberLiteral:function(){},BooleanLiteral:function(){},UndefinedLiteral:function(){},NullLiteral:function(){},Hash:function(t){this.acceptArray(t.pairs);},HashPair:function(t){this.acceptRequired(t,"value");}},e.default=s,t.exports=e.default;},function(t,e,n){var r=n(1).default;e.__esModule=!0,e.SourceLocation=function(t,e){this.source=t,this.start={line:e.first_line,column:e.first_column},this.end={line:e.last_line,column:e.last_column};},e.id=function(t){return /^\[.*\]$/.test(t)?t.substring(1,t.length-1):t},e.stripFlags=function(t,e){return {open:"~"===t.charAt(2),close:"~"===e.charAt(e.length-3)}},e.stripComment=function(t){return t.replace(/^\{\{~?!-?-?/,"").replace(/-?-?~?\}\}$/,"")},e.preparePath=function(t,e,n){n=this.locInfo(n);for(var r=t?"@":"",s=[],a=0,o=0,u=e.length;o<u;o++){var l=e[o].part,c=e[o].original!==l;if(r+=(e[o].separator||"")+l,c||".."!==l&&"."!==l&&"this"!==l)s.push(l);else {if(s.length>0)throw new i.default("Invalid path: "+r,{loc:n});".."===l&&a++;}}return {type:"PathExpression",data:t,depth:a,parts:s,original:r,loc:n}},e.prepareMustache=function(t,e,n,r,i,s){var a=r.charAt(3)||r.charAt(2),o="{"!==a&&"&"!==a;return {type:/\*/.test(r)?"Decorator":"MustacheStatement",path:t,params:e,hash:n,escaped:o,strip:i,loc:this.locInfo(s)}},e.prepareRawBlock=function(t,e,n,r){s(t,n),r=this.locInfo(r);var i={type:"Program",body:e,strip:{},loc:r};return {type:"BlockStatement",path:t.path,params:t.params,hash:t.hash,program:i,openStrip:{},inverseStrip:{},closeStrip:{},loc:r}},e.prepareBlock=function(t,e,n,r,a,o){r&&r.path&&s(t,r);var u=/\*/.test(t.open);e.blockParams=t.blockParams;var l=void 0,c=void 0;if(n){if(u)throw new i.default("Unexpected inverse block on decorator",n);n.chain&&(n.program.body[0].closeStrip=r.strip),c=n.strip,l=n.program;}return a&&(a=l,l=e,e=a),{type:u?"DecoratorBlock":"BlockStatement",path:t.path,params:t.params,hash:t.hash,program:e,inverse:l,openStrip:t.strip,inverseStrip:c,closeStrip:r&&r.strip,loc:this.locInfo(o)}},e.prepareProgram=function(t,e){if(!e&&t.length){var n=t[0].loc,r=t[t.length-1].loc;n&&r&&(e={source:n.source,start:{line:n.start.line,column:n.start.column},end:{line:r.end.line,column:r.end.column}});}return {type:"Program",body:t,strip:{},loc:e}},e.preparePartialBlock=function(t,e,n,r){return s(t,n),{type:"PartialBlockStatement",name:t.path,params:t.params,hash:t.hash,program:e,openStrip:t.strip,closeStrip:n&&n.strip,loc:this.locInfo(r)}};var i=r(n(6));function s(t,e){if(e=e.path?e.path.original:e,t.path.original!==e){var n={loc:t.path.loc};throw new i.default(t.path.original+" doesn't match "+e,n)}}},function(t,e,n){var r=n(34).default,i=n(1).default;e.__esModule=!0,e.Compiler=l,e.precompile=function(t,e,n){if(null==t||"string"!=typeof t&&"Program"!==t.type)throw new s.default("You must pass a string or Handlebars AST to Handlebars.precompile. You passed "+t);"data"in(e=e||{})||(e.data=!0),e.compat&&(e.useDepths=!0);var r=n.parse(t,e),i=(new n.Compiler).compile(r,e);return (new n.JavaScriptCompiler).compile(i,e)},e.compile=function(t,e,n){if(void 0===e&&(e={}),null==t||"string"!=typeof t&&"Program"!==t.type)throw new s.default("You must pass a string or Handlebars AST to Handlebars.compile. You passed "+t);"data"in(e=a.extend({},e))||(e.data=!0),e.compat&&(e.useDepths=!0);var r=void 0;function i(){var r=n.parse(t,e),i=(new n.Compiler).compile(r,e),s=(new n.JavaScriptCompiler).compile(i,e,void 0,!0);return n.template(s)}function o(t,e){return r||(r=i()),r.call(this,t,e)}return o._setup=function(t){return r||(r=i()),r._setup(t)},o._child=function(t,e,n,s){return r||(r=i()),r._child(t,e,n,s)},o};var s=i(n(6)),a=n(5),o=i(n(45)),u=[].slice;function l(){}function c(t,e){if(t===e)return !0;if(a.isArray(t)&&a.isArray(e)&&t.length===e.length){for(var n=0;n<t.length;n++)if(!c(t[n],e[n]))return !1;return !0}}function h(t){if(!t.path.parts){var e=t.path;t.path={type:"PathExpression",data:!1,depth:0,parts:[e.original+""],original:e.original+"",loc:e.loc};}}l.prototype={compiler:l,equals:function(t){var e=this.opcodes.length;if(t.opcodes.length!==e)return !1;for(var n=0;n<e;n++){var r=this.opcodes[n],i=t.opcodes[n];if(r.opcode!==i.opcode||!c(r.args,i.args))return !1}for(e=this.children.length,n=0;n<e;n++)if(!this.children[n].equals(t.children[n]))return !1;return !0},guid:0,compile:function(t,e){return this.sourceNode=[],this.opcodes=[],this.children=[],this.options=e,this.stringParams=e.stringParams,this.trackIds=e.trackIds,e.blockParams=e.blockParams||[],e.knownHelpers=a.extend(r(null),{helperMissing:!0,blockHelperMissing:!0,each:!0,if:!0,unless:!0,with:!0,log:!0,lookup:!0},e.knownHelpers),this.accept(t)},compileProgram:function(t){var e=(new this.compiler).compile(t,this.options),n=this.guid++;return this.usePartial=this.usePartial||e.usePartial,this.children[n]=e,this.useDepths=this.useDepths||e.useDepths,n},accept:function(t){if(!this[t.type])throw new s.default("Unknown type: "+t.type,t);this.sourceNode.unshift(t);var e=this[t.type](t);return this.sourceNode.shift(),e},Program:function(t){this.options.blockParams.unshift(t.blockParams);for(var e=t.body,n=e.length,r=0;r<n;r++)this.accept(e[r]);return this.options.blockParams.shift(),this.isSimple=1===n,this.blockParams=t.blockParams?t.blockParams.length:0,this},BlockStatement:function(t){h(t);var e=t.program,n=t.inverse;e=e&&this.compileProgram(e),n=n&&this.compileProgram(n);var r=this.classifySexpr(t);"helper"===r?this.helperSexpr(t,e,n):"simple"===r?(this.simpleSexpr(t),this.opcode("pushProgram",e),this.opcode("pushProgram",n),this.opcode("emptyHash"),this.opcode("blockValue",t.path.original)):(this.ambiguousSexpr(t,e,n),this.opcode("pushProgram",e),this.opcode("pushProgram",n),this.opcode("emptyHash"),this.opcode("ambiguousBlockValue")),this.opcode("append");},DecoratorBlock:function(t){var e=t.program&&this.compileProgram(t.program),n=this.setupFullMustacheParams(t,e,void 0),r=t.path;this.useDecorators=!0,this.opcode("registerDecorator",n.length,r.original);},PartialStatement:function(t){this.usePartial=!0;var e=t.program;e&&(e=this.compileProgram(t.program));var n=t.params;if(n.length>1)throw new s.default("Unsupported number of partial arguments: "+n.length,t);n.length||(this.options.explicitPartialContext?this.opcode("pushLiteral","undefined"):n.push({type:"PathExpression",parts:[],depth:0}));var r=t.name.original,i="SubExpression"===t.name.type;i&&this.accept(t.name),this.setupFullMustacheParams(t,e,void 0,!0);var a=t.indent||"";this.options.preventIndent&&a&&(this.opcode("appendContent",a),a=""),this.opcode("invokePartial",i,r,a),this.opcode("append");},PartialBlockStatement:function(t){this.PartialStatement(t);},MustacheStatement:function(t){this.SubExpression(t),t.escaped&&!this.options.noEscape?this.opcode("appendEscaped"):this.opcode("append");},Decorator:function(t){this.DecoratorBlock(t);},ContentStatement:function(t){t.value&&this.opcode("appendContent",t.value);},CommentStatement:function(){},SubExpression:function(t){h(t);var e=this.classifySexpr(t);"simple"===e?this.simpleSexpr(t):"helper"===e?this.helperSexpr(t):this.ambiguousSexpr(t);},ambiguousSexpr:function(t,e,n){var r=t.path,i=r.parts[0],s=null!=e||null!=n;this.opcode("getContext",r.depth),this.opcode("pushProgram",e),this.opcode("pushProgram",n),r.strict=!0,this.accept(r),this.opcode("invokeAmbiguous",i,s);},simpleSexpr:function(t){var e=t.path;e.strict=!0,this.accept(e),this.opcode("resolvePossibleLambda");},helperSexpr:function(t,e,n){var r=this.setupFullMustacheParams(t,e,n),i=t.path,a=i.parts[0];if(this.options.knownHelpers[a])this.opcode("invokeKnownHelper",r.length,a);else {if(this.options.knownHelpersOnly)throw new s.default("You specified knownHelpersOnly, but used the unknown helper "+a,t);i.strict=!0,i.falsy=!0,this.accept(i),this.opcode("invokeHelper",r.length,i.original,o.default.helpers.simpleId(i));}},PathExpression:function(t){this.addDepth(t.depth),this.opcode("getContext",t.depth);var e=t.parts[0],n=o.default.helpers.scopedId(t),r=!t.depth&&!n&&this.blockParamIndex(e);r?this.opcode("lookupBlockParam",r,t.parts):e?t.data?(this.options.data=!0,this.opcode("lookupData",t.depth,t.parts,t.strict)):this.opcode("lookupOnContext",t.parts,t.falsy,t.strict,n):this.opcode("pushContext");},StringLiteral:function(t){this.opcode("pushString",t.value);},NumberLiteral:function(t){this.opcode("pushLiteral",t.value);},BooleanLiteral:function(t){this.opcode("pushLiteral",t.value);},UndefinedLiteral:function(){this.opcode("pushLiteral","undefined");},NullLiteral:function(){this.opcode("pushLiteral","null");},Hash:function(t){var e=t.pairs,n=0,r=e.length;for(this.opcode("pushHash");n<r;n++)this.pushParam(e[n].value);for(;n--;)this.opcode("assignToHash",e[n].key);this.opcode("popHash");},opcode:function(t){this.opcodes.push({opcode:t,args:u.call(arguments,1),loc:this.sourceNode[0].loc});},addDepth:function(t){t&&(this.useDepths=!0);},classifySexpr:function(t){var e=o.default.helpers.simpleId(t.path),n=e&&!!this.blockParamIndex(t.path.parts[0]),r=!n&&o.default.helpers.helperExpression(t),i=!n&&(r||e);if(i&&!r){var s=t.path.parts[0],a=this.options;a.knownHelpers[s]?r=!0:a.knownHelpersOnly&&(i=!1);}return r?"helper":i?"ambiguous":"simple"},pushParams:function(t){for(var e=0,n=t.length;e<n;e++)this.pushParam(t[e]);},pushParam:function(t){var e=null!=t.value?t.value:t.original||"";if(this.stringParams)e.replace&&(e=e.replace(/^(\.?\.\/)*/g,"").replace(/\//g,".")),t.depth&&this.addDepth(t.depth),this.opcode("getContext",t.depth||0),this.opcode("pushStringParam",e,t.type),"SubExpression"===t.type&&this.accept(t);else {if(this.trackIds){var n=void 0;if(!t.parts||o.default.helpers.scopedId(t)||t.depth||(n=this.blockParamIndex(t.parts[0])),n){var r=t.parts.slice(1).join(".");this.opcode("pushId","BlockParam",n,r);}else (e=t.original||e).replace&&(e=e.replace(/^this(?:\.|$)/,"").replace(/^\.\//,"").replace(/^\.$/,"")),this.opcode("pushId",t.type,e);}this.accept(t);}},setupFullMustacheParams:function(t,e,n,r){var i=t.params;return this.pushParams(i),this.opcode("pushProgram",e),this.opcode("pushProgram",n),t.hash?this.accept(t.hash):this.opcode("emptyHash",r),i},blockParamIndex:function(t){for(var e=0,n=this.options.blockParams.length;e<n;e++){var r=this.options.blockParams[e],i=r&&a.indexOf(r,t);if(r&&i>=0)return [e,i]}}};},function(t,e,n){var r=n(13).default,i=n(1).default;e.__esModule=!0;var s=n(4),a=i(n(6)),o=n(5),u=i(n(53));function l(t){this.value=t;}function c(){}c.prototype={nameLookup:function(t,e){return this.internalNameLookup(t,e)},depthedLookup:function(t){return [this.aliasable("container.lookup"),"(depths, ",JSON.stringify(t),")"]},compilerInfo:function(){var t=s.COMPILER_REVISION;return [t,s.REVISION_CHANGES[t]]},appendToBuffer:function(t,e,n){return o.isArray(t)||(t=[t]),t=this.source.wrap(t,e),this.environment.isSimple?["return ",t,";"]:n?["buffer += ",t,";"]:(t.appendToBuffer=!0,t)},initializeBuffer:function(){return this.quotedString("")},internalNameLookup:function(t,e){return this.lookupPropertyFunctionIsUsed=!0,["lookupProperty(",t,",",JSON.stringify(e),")"]},lookupPropertyFunctionIsUsed:!1,compile:function(t,e,n,r){this.environment=t,this.options=e,this.stringParams=this.options.stringParams,this.trackIds=this.options.trackIds,this.precompile=!r,this.name=this.environment.name,this.isChild=!!n,this.context=n||{decorators:[],programs:[],environments:[]},this.preamble(),this.stackSlot=0,this.stackVars=[],this.aliases={},this.registers={list:[]},this.hashes=[],this.compileStack=[],this.inlineStack=[],this.blockParams=[],this.compileChildren(t,e),this.useDepths=this.useDepths||t.useDepths||t.useDecorators||this.options.compat,this.useBlockParams=this.useBlockParams||t.useBlockParams;var i=t.opcodes,s=void 0,o=void 0,u=void 0,l=void 0;for(u=0,l=i.length;u<l;u++)s=i[u],this.source.currentLocation=s.loc,o=o||s.loc,this[s.opcode].apply(this,s.args);if(this.source.currentLocation=o,this.pushSource(""),this.stackSlot||this.inlineStack.length||this.compileStack.length)throw new a.default("Compile completed with content left on stack");this.decorators.isEmpty()?this.decorators=void 0:(this.useDecorators=!0,this.decorators.prepend(["var decorators = container.decorators, ",this.lookupPropertyFunctionVarDeclaration(),";\n"]),this.decorators.push("return fn;"),r?this.decorators=Function.apply(this,["fn","props","container","depth0","data","blockParams","depths",this.decorators.merge()]):(this.decorators.prepend("function(fn, props, container, depth0, data, blockParams, depths) {\n"),this.decorators.push("}\n"),this.decorators=this.decorators.merge()));var c=this.createFunctionContext(r);if(this.isChild)return c;var h={compiler:this.compilerInfo(),main:c};this.decorators&&(h.main_d=this.decorators,h.useDecorators=!0);var p=this.context,d=p.programs,f=p.decorators;for(u=0,l=d.length;u<l;u++)d[u]&&(h[u]=d[u],f[u]&&(h[u+"_d"]=f[u],h.useDecorators=!0));return this.environment.usePartial&&(h.usePartial=!0),this.options.data&&(h.useData=!0),this.useDepths&&(h.useDepths=!0),this.useBlockParams&&(h.useBlockParams=!0),this.options.compat&&(h.compat=!0),r?h.compilerOptions=this.options:(h.compiler=JSON.stringify(h.compiler),this.source.currentLocation={start:{line:1,column:0}},h=this.objectLiteral(h),e.srcName?(h=h.toStringWithSourceMap({file:e.destName})).map=h.map&&h.map.toString():h=h.toString()),h},preamble:function(){this.lastContext=0,this.source=new u.default(this.options.srcName),this.decorators=new u.default(this.options.srcName);},createFunctionContext:function(t){var e=this,n="",i=this.stackVars.concat(this.registers.list);i.length>0&&(n+=", "+i.join(", "));var s=0;r(this.aliases).forEach((function(t){var r=e.aliases[t];r.children&&r.referenceCount>1&&(n+=", alias"+ ++s+"="+t,r.children[0]="alias"+s);})),this.lookupPropertyFunctionIsUsed&&(n+=", "+this.lookupPropertyFunctionVarDeclaration());var a=["container","depth0","helpers","partials","data"];(this.useBlockParams||this.useDepths)&&a.push("blockParams"),this.useDepths&&a.push("depths");var o=this.mergeSource(n);return t?(a.push(o),Function.apply(this,a)):this.source.wrap(["function(",a.join(","),") {\n  ",o,"}"])},mergeSource:function(t){var e=this.environment.isSimple,n=!this.forceBuffer,r=void 0,i=void 0,s=void 0,a=void 0;return this.source.each((function(t){t.appendToBuffer?(s?t.prepend("  + "):s=t,a=t):(s&&(i?s.prepend("buffer += "):r=!0,a.add(";"),s=a=void 0),i=!0,e||(n=!1));})),n?s?(s.prepend("return "),a.add(";")):i||this.source.push('return "";'):(t+=", buffer = "+(r?"":this.initializeBuffer()),s?(s.prepend("return buffer + "),a.add(";")):this.source.push("return buffer;")),t&&this.source.prepend("var "+t.substring(2)+(r?"":";\n")),this.source.merge()},lookupPropertyFunctionVarDeclaration:function(){return "\n      lookupProperty = container.lookupProperty || function(parent, propertyName) {\n        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {\n          return parent[propertyName];\n        }\n        return undefined\n    }\n    ".trim()},blockValue:function(t){var e=this.aliasable("container.hooks.blockHelperMissing"),n=[this.contextName(0)];this.setupHelperArgs(t,0,n);var r=this.popStack();n.splice(1,0,r),this.push(this.source.functionCall(e,"call",n));},ambiguousBlockValue:function(){var t=this.aliasable("container.hooks.blockHelperMissing"),e=[this.contextName(0)];this.setupHelperArgs("",0,e,!0),this.flushInline();var n=this.topStack();e.splice(1,0,n),this.pushSource(["if (!",this.lastHelper,") { ",n," = ",this.source.functionCall(t,"call",e),"}"]);},appendContent:function(t){this.pendingContent?t=this.pendingContent+t:this.pendingLocation=this.source.currentLocation,this.pendingContent=t;},append:function(){if(this.isInline())this.replaceStack((function(t){return [" != null ? ",t,' : ""']})),this.pushSource(this.appendToBuffer(this.popStack()));else {var t=this.popStack();this.pushSource(["if (",t," != null) { ",this.appendToBuffer(t,void 0,!0)," }"]),this.environment.isSimple&&this.pushSource(["else { ",this.appendToBuffer("''",void 0,!0)," }"]);}},appendEscaped:function(){this.pushSource(this.appendToBuffer([this.aliasable("container.escapeExpression"),"(",this.popStack(),")"]));},getContext:function(t){this.lastContext=t;},pushContext:function(){this.pushStackLiteral(this.contextName(this.lastContext));},lookupOnContext:function(t,e,n,r){var i=0;r||!this.options.compat||this.lastContext?this.pushContext():this.push(this.depthedLookup(t[i++])),this.resolvePath("context",t,i,e,n);},lookupBlockParam:function(t,e){this.useBlockParams=!0,this.push(["blockParams[",t[0],"][",t[1],"]"]),this.resolvePath("context",e,1);},lookupData:function(t,e,n){t?this.pushStackLiteral("container.data(data, "+t+")"):this.pushStackLiteral("data"),this.resolvePath("data",e,0,!0,n);},resolvePath:function(t,e,n,r,i){var s=this;if(this.options.strict||this.options.assumeObjects)this.push(function(t,e,n,r){var i=e.popStack(),s=0,a=n.length;for(t&&a--;s<a;s++)i=e.nameLookup(i,n[s],r);return t?[e.aliasable("container.strict"),"(",i,", ",e.quotedString(n[s]),", ",JSON.stringify(e.source.currentLocation)," )"]:i}(this.options.strict&&i,this,e,t));else for(var a=e.length;n<a;n++)this.replaceStack((function(i){var a=s.nameLookup(i,e[n],t);return r?[" && ",a]:[" != null ? ",a," : ",i]}));},resolvePossibleLambda:function(){this.push([this.aliasable("container.lambda"),"(",this.popStack(),", ",this.contextName(0),")"]);},pushStringParam:function(t,e){this.pushContext(),this.pushString(e),"SubExpression"!==e&&("string"==typeof t?this.pushString(t):this.pushStackLiteral(t));},emptyHash:function(t){this.trackIds&&this.push("{}"),this.stringParams&&(this.push("{}"),this.push("{}")),this.pushStackLiteral(t?"undefined":"{}");},pushHash:function(){this.hash&&this.hashes.push(this.hash),this.hash={values:{},types:[],contexts:[],ids:[]};},popHash:function(){var t=this.hash;this.hash=this.hashes.pop(),this.trackIds&&this.push(this.objectLiteral(t.ids)),this.stringParams&&(this.push(this.objectLiteral(t.contexts)),this.push(this.objectLiteral(t.types))),this.push(this.objectLiteral(t.values));},pushString:function(t){this.pushStackLiteral(this.quotedString(t));},pushLiteral:function(t){this.pushStackLiteral(t);},pushProgram:function(t){null!=t?this.pushStackLiteral(this.programExpression(t)):this.pushStackLiteral(null);},registerDecorator:function(t,e){var n=this.nameLookup("decorators",e,"decorator"),r=this.setupHelperArgs(e,t);this.decorators.push(["fn = ",this.decorators.functionCall(n,"",["fn","props","container",r])," || fn;"]);},invokeHelper:function(t,e,n){var r=this.popStack(),i=this.setupHelper(t,e),s=[];n&&s.push(i.name),s.push(r),this.options.strict||s.push(this.aliasable("container.hooks.helperMissing"));var a=["(",this.itemsSeparatedBy(s,"||"),")"],o=this.source.functionCall(a,"call",i.callParams);this.push(o);},itemsSeparatedBy:function(t,e){var n=[];n.push(t[0]);for(var r=1;r<t.length;r++)n.push(e,t[r]);return n},invokeKnownHelper:function(t,e){var n=this.setupHelper(t,e);this.push(this.source.functionCall(n.name,"call",n.callParams));},invokeAmbiguous:function(t,e){this.useRegister("helper");var n=this.popStack();this.emptyHash();var r=this.setupHelper(0,t,e),i=["(","(helper = ",this.lastHelper=this.nameLookup("helpers",t,"helper")," || ",n,")"];this.options.strict||(i[0]="(helper = ",i.push(" != null ? helper : ",this.aliasable("container.hooks.helperMissing"))),this.push(["(",i,r.paramsInit?["),(",r.paramsInit]:[],"),","(typeof helper === ",this.aliasable('"function"')," ? ",this.source.functionCall("helper","call",r.callParams)," : helper))"]);},invokePartial:function(t,e,n){var r=[],i=this.setupParams(e,1,r);t&&(e=this.popStack(),delete i.name),n&&(i.indent=JSON.stringify(n)),i.helpers="helpers",i.partials="partials",i.decorators="container.decorators",t?r.unshift(e):r.unshift(this.nameLookup("partials",e,"partial")),this.options.compat&&(i.depths="depths"),i=this.objectLiteral(i),r.push(i),this.push(this.source.functionCall("container.invokePartial","",r));},assignToHash:function(t){var e=this.popStack(),n=void 0,r=void 0,i=void 0;this.trackIds&&(i=this.popStack()),this.stringParams&&(r=this.popStack(),n=this.popStack());var s=this.hash;n&&(s.contexts[t]=n),r&&(s.types[t]=r),i&&(s.ids[t]=i),s.values[t]=e;},pushId:function(t,e,n){"BlockParam"===t?this.pushStackLiteral("blockParams["+e[0]+"].path["+e[1]+"]"+(n?" + "+JSON.stringify("."+n):"")):"PathExpression"===t?this.pushString(e):"SubExpression"===t?this.pushStackLiteral("true"):this.pushStackLiteral("null");},compiler:c,compileChildren:function(t,e){for(var n=t.children,r=void 0,i=void 0,s=0,a=n.length;s<a;s++){r=n[s],i=new this.compiler;var o=this.matchExistingProgram(r);if(null==o){this.context.programs.push("");var u=this.context.programs.length;r.index=u,r.name="program"+u,this.context.programs[u]=i.compile(r,e,this.context,!this.precompile),this.context.decorators[u]=i.decorators,this.context.environments[u]=r,this.useDepths=this.useDepths||i.useDepths,this.useBlockParams=this.useBlockParams||i.useBlockParams,r.useDepths=this.useDepths,r.useBlockParams=this.useBlockParams;}else r.index=o.index,r.name="program"+o.index,this.useDepths=this.useDepths||o.useDepths,this.useBlockParams=this.useBlockParams||o.useBlockParams;}},matchExistingProgram:function(t){for(var e=0,n=this.context.environments.length;e<n;e++){var r=this.context.environments[e];if(r&&r.equals(t))return r}},programExpression:function(t){var e=this.environment.children[t],n=[e.index,"data",e.blockParams];return (this.useBlockParams||this.useDepths)&&n.push("blockParams"),this.useDepths&&n.push("depths"),"container.program("+n.join(", ")+")"},useRegister:function(t){this.registers[t]||(this.registers[t]=!0,this.registers.list.push(t));},push:function(t){return t instanceof l||(t=this.source.wrap(t)),this.inlineStack.push(t),t},pushStackLiteral:function(t){this.push(new l(t));},pushSource:function(t){this.pendingContent&&(this.source.push(this.appendToBuffer(this.source.quotedString(this.pendingContent),this.pendingLocation)),this.pendingContent=void 0),t&&this.source.push(t);},replaceStack:function(t){var e=["("],n=void 0,r=void 0,i=void 0;if(!this.isInline())throw new a.default("replaceStack on non-inline");var s=this.popStack(!0);if(s instanceof l)e=["(",n=[s.value]],i=!0;else {r=!0;var o=this.incrStack();e=["((",this.push(o)," = ",s,")"],n=this.topStack();}var u=t.call(this,n);i||this.popStack(),r&&this.stackSlot--,this.push(e.concat(u,")"));},incrStack:function(){return this.stackSlot++,this.stackSlot>this.stackVars.length&&this.stackVars.push("stack"+this.stackSlot),this.topStackName()},topStackName:function(){return "stack"+this.stackSlot},flushInline:function(){var t=this.inlineStack;this.inlineStack=[];for(var e=0,n=t.length;e<n;e++){var r=t[e];if(r instanceof l)this.compileStack.push(r);else {var i=this.incrStack();this.pushSource([i," = ",r,";"]),this.compileStack.push(i);}}},isInline:function(){return this.inlineStack.length},popStack:function(t){var e=this.isInline(),n=(e?this.inlineStack:this.compileStack).pop();if(!t&&n instanceof l)return n.value;if(!e){if(!this.stackSlot)throw new a.default("Invalid stack pop");this.stackSlot--;}return n},topStack:function(){var t=this.isInline()?this.inlineStack:this.compileStack,e=t[t.length-1];return e instanceof l?e.value:e},contextName:function(t){return this.useDepths&&t?"depths["+t+"]":"depth"+t},quotedString:function(t){return this.source.quotedString(t)},objectLiteral:function(t){return this.source.objectLiteral(t)},aliasable:function(t){var e=this.aliases[t];return e?(e.referenceCount++,e):((e=this.aliases[t]=this.source.wrap(t)).aliasable=!0,e.referenceCount=1,e)},setupHelper:function(t,e,n){var r=[];return {params:r,paramsInit:this.setupHelperArgs(e,t,r,n),name:this.nameLookup("helpers",e,"helper"),callParams:[this.aliasable(this.contextName(0)+" != null ? "+this.contextName(0)+" : (container.nullContext || {})")].concat(r)}},setupParams:function(t,e,n){var r={},i=[],s=[],a=[],o=!n,u=void 0;o&&(n=[]),r.name=this.quotedString(t),r.hash=this.popStack(),this.trackIds&&(r.hashIds=this.popStack()),this.stringParams&&(r.hashTypes=this.popStack(),r.hashContexts=this.popStack());var l=this.popStack(),c=this.popStack();(c||l)&&(r.fn=c||"container.noop",r.inverse=l||"container.noop");for(var h=e;h--;)u=this.popStack(),n[h]=u,this.trackIds&&(a[h]=this.popStack()),this.stringParams&&(s[h]=this.popStack(),i[h]=this.popStack());return o&&(r.args=this.source.generateArray(n)),this.trackIds&&(r.ids=this.source.generateArray(a)),this.stringParams&&(r.types=this.source.generateArray(s),r.contexts=this.source.generateArray(i)),this.options.data&&(r.data="data"),this.useBlockParams&&(r.blockParams="blockParams"),r},setupHelperArgs:function(t,e,n,r){var i=this.setupParams(t,e,n);return i.loc=JSON.stringify(this.source.currentLocation),i=this.objectLiteral(i),r?(this.useRegister("options"),n.push("options"),["options=",i]):n?(n.push(i),""):i}},function(){for(var t="break else new var case finally return void catch for switch while continue function this with default if throw delete in try do instanceof typeof abstract enum int short boolean export interface static byte extends long super char final native synchronized class float package throws const goto private transient debugger implements protected volatile double import public let yield await null true false".split(" "),e=c.RESERVED_WORDS={},n=0,r=t.length;n<r;n++)e[t[n]]=!0;}(),c.isValidJavaScriptVariableName=function(t){return !c.RESERVED_WORDS[t]&&/^[a-zA-Z_$][0-9a-zA-Z_$]*$/.test(t)},e.default=c,t.exports=e.default;},function(t,e,n){var r=n(13).default;e.__esModule=!0;var i=n(5),s=void 0;function a(t,e,n){if(i.isArray(t)){for(var r=[],s=0,a=t.length;s<a;s++)r.push(e.wrap(t[s],n));return r}return "boolean"==typeof t||"number"==typeof t?t+"":t}function o(t){this.srcFile=t,this.source=[];}s||((s=function(t,e,n,r){this.src="",r&&this.add(r);}).prototype={add:function(t){i.isArray(t)&&(t=t.join("")),this.src+=t;},prepend:function(t){i.isArray(t)&&(t=t.join("")),this.src=t+this.src;},toStringWithSourceMap:function(){return {code:this.toString()}},toString:function(){return this.src}}),o.prototype={isEmpty:function(){return !this.source.length},prepend:function(t,e){this.source.unshift(this.wrap(t,e));},push:function(t,e){this.source.push(this.wrap(t,e));},merge:function(){var t=this.empty();return this.each((function(e){t.add(["  ",e,"\n"]);})),t},each:function(t){for(var e=0,n=this.source.length;e<n;e++)t(this.source[e]);},empty:function(){var t=this.currentLocation||{start:{}};return new s(t.start.line,t.start.column,this.srcFile)},wrap:function(t){var e=arguments.length<=1||void 0===arguments[1]?this.currentLocation||{start:{}}:arguments[1];return t instanceof s?t:(t=a(t,this,e),new s(e.start.line,e.start.column,this.srcFile,t))},functionCall:function(t,e,n){return n=this.generateList(n),this.wrap([t,e?"."+e+"(":"(",n,")"])},quotedString:function(t){return '"'+(t+"").replace(/\\/g,"\\\\").replace(/"/g,'\\"').replace(/\n/g,"\\n").replace(/\r/g,"\\r").replace(/\u2028/g,"\\u2028").replace(/\u2029/g,"\\u2029")+'"'},objectLiteral:function(t){var e=this,n=[];r(t).forEach((function(r){var i=a(t[r],e);"undefined"!==i&&n.push([e.quotedString(r),":",i]);}));var i=this.generateList(n);return i.prepend("{"),i.add("}"),i},generateList:function(t){for(var e=this.empty(),n=0,r=t.length;n<r;n++)n&&e.add(","),e.add(a(t[n],this));return e},generateArray:function(t){var e=this.generateList(t);return e.prepend("["),e.add("]"),e}},e.default=o,t.exports=e.default;}]));
/**!

 @license
 handlebars v4.7.7

Copyright (C) 2011-2019 by Yehuda Katz

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

*/function i(t){return "string"==typeof t}function s(t){return "object"==typeof t&&null!==t&&!Array.isArray(t)}function a(t){return "[object Array]"===Object.prototype.toString.call(t)}var o,u=Object.freeze({__proto__:null,opr:function(t,e,n){if("=="===e)return t==n;if("==="===e)return t===n;if("!="===e)return t!=n;if("!=="===e)return t!==n;if("<"===e)return t<n;if(">"===e)return t>n;if("<="===e)return t<=n;if(">="===e)return t>=n;throw new Error(`opr helper operator: ${e} is invalid`)},eq:function(t,e){return t===e},eqw:function(t,e){return t==e},neq:function(t,e){return t!==e},neqw:function(t,e){return t!=e},lt:function(t,e){return t<e},gt:function(t,e){return t>e},gte:function(t,e){return t>=e},lte:function(t,e){return t<=e},ifx:function(t,e,n){return s(n)&&"ifx"===n.name&&n.hasOwnProperty("hash")&&(n=""),t?e:n},not:function(t){return !t},empty:function(t){return "string"==typeof t?t=t.replace(/^[\s　]+|[\s　]+$/g,""):Array.isArray(t)&&0===t.length&&(t=null),!t},notEmpty:function(t){return "string"==typeof t?t=t.replace(/^[\s　]+|[\s　]+$/g,""):Array.isArray(t)&&0===t.length&&(t=null),!!t},count:function(t){return !!a(t)&&t.length},and:function(...t){s(t[t.length-1])&&t.pop();for(let e=0;e<t.length;e++)if(!t[e])return !1;return !0},or:function(...t){s(t[t.length-1])&&t.pop();for(let e=0;e<t.length;e++)if(t[e])return !0;return !1},coalesce:function(...t){s(t[t.length-1])&&t.pop();for(let e=0;e<t.length;e++)if(t[e])return t[e];return t.pop()},includes:function(t,e,n=!0){if(!a(t)||0===t.length)return !1;for(let r=0;r<t.length;r++)if(n&&t[r]===e||!n&&t[r]==e)return !0;return !1}}),l={exports:{}};(o=l).exports=function(){var t,n;function r(){return t.apply(null,arguments)}function i(t){return t instanceof Array||"[object Array]"===Object.prototype.toString.call(t)}function s(t){return null!=t&&"[object Object]"===Object.prototype.toString.call(t)}function a(t,e){return Object.prototype.hasOwnProperty.call(t,e)}function u(t){if(Object.getOwnPropertyNames)return 0===Object.getOwnPropertyNames(t).length;var e;for(e in t)if(a(t,e))return !1;return !0}function l(t){return void 0===t}function c(t){return "number"==typeof t||"[object Number]"===Object.prototype.toString.call(t)}function h(t){return t instanceof Date||"[object Date]"===Object.prototype.toString.call(t)}function p(t,e){var n,r=[];for(n=0;n<t.length;++n)r.push(e(t[n],n));return r}function d(t,e){for(var n in e)a(e,n)&&(t[n]=e[n]);return a(e,"toString")&&(t.toString=e.toString),a(e,"valueOf")&&(t.valueOf=e.valueOf),t}function f(t,e,n,r){return Pe(t,e,n,r,!0).utc()}function m(t){return null==t._pf&&(t._pf={empty:!1,unusedTokens:[],unusedInput:[],overflow:-2,charsLeftOver:0,nullInput:!1,invalidEra:null,invalidMonth:null,invalidFormat:!1,userInvalidated:!1,iso:!1,parsedDateParts:[],era:null,meridiem:null,rfc2822:!1,weekdayMismatch:!1}),t._pf}function y(t){if(null==t._isValid){var e=m(t),r=n.call(e.parsedDateParts,(function(t){return null!=t})),i=!isNaN(t._d.getTime())&&e.overflow<0&&!e.empty&&!e.invalidEra&&!e.invalidMonth&&!e.invalidWeekday&&!e.weekdayMismatch&&!e.nullInput&&!e.invalidFormat&&!e.userInvalidated&&(!e.meridiem||e.meridiem&&r);if(t._strict&&(i=i&&0===e.charsLeftOver&&0===e.unusedTokens.length&&void 0===e.bigHour),null!=Object.isFrozen&&Object.isFrozen(t))return i;t._isValid=i;}return t._isValid}function g(t){var e=f(NaN);return null!=t?d(m(e),t):m(e).userInvalidated=!0,e}n=Array.prototype.some?Array.prototype.some:function(t){var e,n=Object(this),r=n.length>>>0;for(e=0;e<r;e++)if(e in n&&t.call(this,n[e],e,n))return !0;return !1};var _=r.momentProperties=[],v=!1;function k(t,e){var n,r,i;if(l(e._isAMomentObject)||(t._isAMomentObject=e._isAMomentObject),l(e._i)||(t._i=e._i),l(e._f)||(t._f=e._f),l(e._l)||(t._l=e._l),l(e._strict)||(t._strict=e._strict),l(e._tzm)||(t._tzm=e._tzm),l(e._isUTC)||(t._isUTC=e._isUTC),l(e._offset)||(t._offset=e._offset),l(e._pf)||(t._pf=m(e)),l(e._locale)||(t._locale=e._locale),_.length>0)for(n=0;n<_.length;n++)l(i=e[r=_[n]])||(t[r]=i);return t}function S(t){k(this,t),this._d=new Date(null!=t._d?t._d.getTime():NaN),this.isValid()||(this._d=new Date(NaN)),!1===v&&(v=!0,r.updateOffset(this),v=!1);}function w(t){return t instanceof S||null!=t&&null!=t._isAMomentObject}function b(t){!1===r.suppressDeprecationWarnings&&"undefined"!=typeof console&&console.warn&&console.warn("Deprecation warning: "+t);}function x(t,e){var n=!0;return d((function(){if(null!=r.deprecationHandler&&r.deprecationHandler(null,t),n){var i,s,o,u=[];for(s=0;s<arguments.length;s++){if(i="","object"==typeof arguments[s]){for(o in i+="\n["+s+"] ",arguments[0])a(arguments[0],o)&&(i+=o+": "+arguments[0][o]+", ");i=i.slice(0,-2);}else i=arguments[s];u.push(i);}b(t+"\nArguments: "+Array.prototype.slice.call(u).join("")+"\n"+(new Error).stack),n=!1;}return e.apply(this,arguments)}),e)}var P,M={};function D(t,e){null!=r.deprecationHandler&&r.deprecationHandler(t,e),M[t]||(b(e),M[t]=!0);}function O(t){return "undefined"!=typeof Function&&t instanceof Function||"[object Function]"===Object.prototype.toString.call(t)}function N(t,e){var n,r=d({},t);for(n in e)a(e,n)&&(s(t[n])&&s(e[n])?(r[n]={},d(r[n],t[n]),d(r[n],e[n])):null!=e[n]?r[n]=e[n]:delete r[n]);for(n in t)a(t,n)&&!a(e,n)&&s(t[n])&&(r[n]=d({},r[n]));return r}function Y(t){null!=t&&this.set(t);}function E(t,e,n){var r=""+Math.abs(t),i=e-r.length;return (t>=0?n?"+":"":"-")+Math.pow(10,Math.max(0,i)).toString().substr(1)+r}r.suppressDeprecationWarnings=!1,r.deprecationHandler=null,P=Object.keys?Object.keys:function(t){var e,n=[];for(e in t)a(t,e)&&n.push(e);return n};var C=/(\[[^\[]*\])|(\\)?([Hh]mm(ss)?|Mo|MM?M?M?|Do|DDDo|DD?D?D?|ddd?d?|do?|w[o|w]?|W[o|W]?|Qo?|N{1,5}|YYYYYY|YYYYY|YYYY|YY|y{2,4}|yo?|gg(ggg?)?|GG(GGG?)?|e|E|a|A|hh?|HH?|kk?|mm?|ss?|S{1,9}|x|X|zz?|ZZ?|.)/g,L=/(\[[^\[]*\])|(\\)?(LTS|LT|LL?L?L?|l{1,4})/g,T={},I={};function A(t,e,n,r){var i=r;"string"==typeof r&&(i=function(){return this[r]()}),t&&(I[t]=i),e&&(I[e[0]]=function(){return E(i.apply(this,arguments),e[1],e[2])}),n&&(I[n]=function(){return this.localeData().ordinal(i.apply(this,arguments),t)});}function R(t,e){return t.isValid()?(e=H(e,t.localeData()),T[e]=T[e]||function(t){var e,n,r,i=t.match(C);for(e=0,n=i.length;e<n;e++)I[i[e]]?i[e]=I[i[e]]:i[e]=(r=i[e]).match(/\[[\s\S]/)?r.replace(/^\[|\]$/g,""):r.replace(/\\/g,"");return function(e){var r,s="";for(r=0;r<n;r++)s+=O(i[r])?i[r].call(e,t):i[r];return s}}(e),T[e](t)):t.localeData().invalidDate()}function H(t,e){var n=5;function r(t){return e.longDateFormat(t)||t}for(L.lastIndex=0;n>=0&&L.test(t);)t=t.replace(L,r),L.lastIndex=0,n-=1;return t}var F={};function j(t,e){var n=t.toLowerCase();F[n]=F[n+"s"]=F[e]=t;}function W(t){return "string"==typeof t?F[t]||F[t.toLowerCase()]:void 0}function B(t){var e,n,r={};for(n in t)a(t,n)&&(e=W(n))&&(r[e]=t[n]);return r}var V={};function U(t,e){V[t]=e;}function $(t){return t%4==0&&t%100!=0||t%400==0}function G(t){return t<0?Math.ceil(t)||0:Math.floor(t)}function z(t){var e=+t,n=0;return 0!==e&&isFinite(e)&&(n=G(e)),n}function q(t,e){return function(n){return null!=n?(K(this,t,n),r.updateOffset(this,e),this):Z(this,t)}}function Z(t,e){return t.isValid()?t._d["get"+(t._isUTC?"UTC":"")+e]():NaN}function K(t,e,n){t.isValid()&&!isNaN(n)&&("FullYear"===e&&$(t.year())&&1===t.month()&&29===t.date()?(n=z(n),t._d["set"+(t._isUTC?"UTC":"")+e](n,t.month(),wt(n,t.month()))):t._d["set"+(t._isUTC?"UTC":"")+e](n));}var J,X=/\d/,Q=/\d\d/,tt=/\d{3}/,et=/\d{4}/,nt=/[+-]?\d{6}/,rt=/\d\d?/,it=/\d\d\d\d?/,st=/\d\d\d\d\d\d?/,at=/\d{1,3}/,ot=/\d{1,4}/,ut=/[+-]?\d{1,6}/,lt=/\d+/,ct=/[+-]?\d+/,ht=/Z|[+-]\d\d:?\d\d/gi,pt=/Z|[+-]\d\d(?::?\d\d)?/gi,dt=/[0-9]{0,256}['a-z\u00A0-\u05FF\u0700-\uD7FF\uF900-\uFDCF\uFDF0-\uFF07\uFF10-\uFFEF]{1,256}|[\u0600-\u06FF\/]{1,256}(\s*?[\u0600-\u06FF]{1,256}){1,2}/i;function ft(t,e,n){J[t]=O(e)?e:function(t,r){return t&&n?n:e};}function mt(t,e){return a(J,t)?J[t](e._strict,e._locale):new RegExp(yt(t.replace("\\","").replace(/\\(\[)|\\(\])|\[([^\]\[]*)\]|\\(.)/g,(function(t,e,n,r,i){return e||n||r||i}))))}function yt(t){return t.replace(/[-\/\\^$*+?.()|[\]{}]/g,"\\$&")}J={};var gt,_t={};function vt(t,e){var n,r=e;for("string"==typeof t&&(t=[t]),c(e)&&(r=function(t,n){n[e]=z(t);}),n=0;n<t.length;n++)_t[t[n]]=r;}function kt(t,e){vt(t,(function(t,n,r,i){r._w=r._w||{},e(t,r._w,r,i);}));}function St(t,e,n){null!=e&&a(_t,t)&&_t[t](e,n._a,n,t);}function wt(t,e){if(isNaN(t)||isNaN(e))return NaN;var n,r=(e%(n=12)+n)%n;return t+=(e-r)/12,1===r?$(t)?29:28:31-r%7%2}gt=Array.prototype.indexOf?Array.prototype.indexOf:function(t){var e;for(e=0;e<this.length;++e)if(this[e]===t)return e;return -1},A("M",["MM",2],"Mo",(function(){return this.month()+1})),A("MMM",0,0,(function(t){return this.localeData().monthsShort(this,t)})),A("MMMM",0,0,(function(t){return this.localeData().months(this,t)})),j("month","M"),U("month",8),ft("M",rt),ft("MM",rt,Q),ft("MMM",(function(t,e){return e.monthsShortRegex(t)})),ft("MMMM",(function(t,e){return e.monthsRegex(t)})),vt(["M","MM"],(function(t,e){e[1]=z(t)-1;})),vt(["MMM","MMMM"],(function(t,e,n,r){var i=n._locale.monthsParse(t,r,n._strict);null!=i?e[1]=i:m(n).invalidMonth=t;}));var bt="January_February_March_April_May_June_July_August_September_October_November_December".split("_"),xt="Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec".split("_"),Pt=/D[oD]?(\[[^\[\]]*\]|\s)+MMMM?/,Mt=dt,Dt=dt;function Ot(t,e,n){var r,i,s,a=t.toLocaleLowerCase();if(!this._monthsParse)for(this._monthsParse=[],this._longMonthsParse=[],this._shortMonthsParse=[],r=0;r<12;++r)s=f([2e3,r]),this._shortMonthsParse[r]=this.monthsShort(s,"").toLocaleLowerCase(),this._longMonthsParse[r]=this.months(s,"").toLocaleLowerCase();return n?"MMM"===e?-1!==(i=gt.call(this._shortMonthsParse,a))?i:null:-1!==(i=gt.call(this._longMonthsParse,a))?i:null:"MMM"===e?-1!==(i=gt.call(this._shortMonthsParse,a))||-1!==(i=gt.call(this._longMonthsParse,a))?i:null:-1!==(i=gt.call(this._longMonthsParse,a))||-1!==(i=gt.call(this._shortMonthsParse,a))?i:null}function Nt(t,e){var n;if(!t.isValid())return t;if("string"==typeof e)if(/^\d+$/.test(e))e=z(e);else if(!c(e=t.localeData().monthsParse(e)))return t;return n=Math.min(t.date(),wt(t.year(),e)),t._d["set"+(t._isUTC?"UTC":"")+"Month"](e,n),t}function Yt(t){return null!=t?(Nt(this,t),r.updateOffset(this,!0),this):Z(this,"Month")}function Et(){function t(t,e){return e.length-t.length}var e,n,r=[],i=[],s=[];for(e=0;e<12;e++)n=f([2e3,e]),r.push(this.monthsShort(n,"")),i.push(this.months(n,"")),s.push(this.months(n,"")),s.push(this.monthsShort(n,""));for(r.sort(t),i.sort(t),s.sort(t),e=0;e<12;e++)r[e]=yt(r[e]),i[e]=yt(i[e]);for(e=0;e<24;e++)s[e]=yt(s[e]);this._monthsRegex=new RegExp("^("+s.join("|")+")","i"),this._monthsShortRegex=this._monthsRegex,this._monthsStrictRegex=new RegExp("^("+i.join("|")+")","i"),this._monthsShortStrictRegex=new RegExp("^("+r.join("|")+")","i");}function Ct(t){return $(t)?366:365}A("Y",0,0,(function(){var t=this.year();return t<=9999?E(t,4):"+"+t})),A(0,["YY",2],0,(function(){return this.year()%100})),A(0,["YYYY",4],0,"year"),A(0,["YYYYY",5],0,"year"),A(0,["YYYYYY",6,!0],0,"year"),j("year","y"),U("year",1),ft("Y",ct),ft("YY",rt,Q),ft("YYYY",ot,et),ft("YYYYY",ut,nt),ft("YYYYYY",ut,nt),vt(["YYYYY","YYYYYY"],0),vt("YYYY",(function(t,e){e[0]=2===t.length?r.parseTwoDigitYear(t):z(t);})),vt("YY",(function(t,e){e[0]=r.parseTwoDigitYear(t);})),vt("Y",(function(t,e){e[0]=parseInt(t,10);})),r.parseTwoDigitYear=function(t){return z(t)+(z(t)>68?1900:2e3)};var Lt=q("FullYear",!0);function Tt(t,e,n,r,i,s,a){var o;return t<100&&t>=0?(o=new Date(t+400,e,n,r,i,s,a),isFinite(o.getFullYear())&&o.setFullYear(t)):o=new Date(t,e,n,r,i,s,a),o}function It(t){var e,n;return t<100&&t>=0?((n=Array.prototype.slice.call(arguments))[0]=t+400,e=new Date(Date.UTC.apply(null,n)),isFinite(e.getUTCFullYear())&&e.setUTCFullYear(t)):e=new Date(Date.UTC.apply(null,arguments)),e}function At(t,e,n){var r=7+e-n;return -(7+It(t,0,r).getUTCDay()-e)%7+r-1}function Rt(t,e,n,r,i){var s,a,o=1+7*(e-1)+(7+n-r)%7+At(t,r,i);return o<=0?a=Ct(s=t-1)+o:o>Ct(t)?(s=t+1,a=o-Ct(t)):(s=t,a=o),{year:s,dayOfYear:a}}function Ht(t,e,n){var r,i,s=At(t.year(),e,n),a=Math.floor((t.dayOfYear()-s-1)/7)+1;return a<1?r=a+Ft(i=t.year()-1,e,n):a>Ft(t.year(),e,n)?(r=a-Ft(t.year(),e,n),i=t.year()+1):(i=t.year(),r=a),{week:r,year:i}}function Ft(t,e,n){var r=At(t,e,n),i=At(t+1,e,n);return (Ct(t)-r+i)/7}function jt(t,e){return t.slice(e,7).concat(t.slice(0,e))}A("w",["ww",2],"wo","week"),A("W",["WW",2],"Wo","isoWeek"),j("week","w"),j("isoWeek","W"),U("week",5),U("isoWeek",5),ft("w",rt),ft("ww",rt,Q),ft("W",rt),ft("WW",rt,Q),kt(["w","ww","W","WW"],(function(t,e,n,r){e[r.substr(0,1)]=z(t);})),A("d",0,"do","day"),A("dd",0,0,(function(t){return this.localeData().weekdaysMin(this,t)})),A("ddd",0,0,(function(t){return this.localeData().weekdaysShort(this,t)})),A("dddd",0,0,(function(t){return this.localeData().weekdays(this,t)})),A("e",0,0,"weekday"),A("E",0,0,"isoWeekday"),j("day","d"),j("weekday","e"),j("isoWeekday","E"),U("day",11),U("weekday",11),U("isoWeekday",11),ft("d",rt),ft("e",rt),ft("E",rt),ft("dd",(function(t,e){return e.weekdaysMinRegex(t)})),ft("ddd",(function(t,e){return e.weekdaysShortRegex(t)})),ft("dddd",(function(t,e){return e.weekdaysRegex(t)})),kt(["dd","ddd","dddd"],(function(t,e,n,r){var i=n._locale.weekdaysParse(t,r,n._strict);null!=i?e.d=i:m(n).invalidWeekday=t;})),kt(["d","e","E"],(function(t,e,n,r){e[r]=z(t);}));var Wt="Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"),Bt="Sun_Mon_Tue_Wed_Thu_Fri_Sat".split("_"),Vt="Su_Mo_Tu_We_Th_Fr_Sa".split("_"),Ut=dt,$t=dt,Gt=dt;function zt(t,e,n){var r,i,s,a=t.toLocaleLowerCase();if(!this._weekdaysParse)for(this._weekdaysParse=[],this._shortWeekdaysParse=[],this._minWeekdaysParse=[],r=0;r<7;++r)s=f([2e3,1]).day(r),this._minWeekdaysParse[r]=this.weekdaysMin(s,"").toLocaleLowerCase(),this._shortWeekdaysParse[r]=this.weekdaysShort(s,"").toLocaleLowerCase(),this._weekdaysParse[r]=this.weekdays(s,"").toLocaleLowerCase();return n?"dddd"===e?-1!==(i=gt.call(this._weekdaysParse,a))?i:null:"ddd"===e?-1!==(i=gt.call(this._shortWeekdaysParse,a))?i:null:-1!==(i=gt.call(this._minWeekdaysParse,a))?i:null:"dddd"===e?-1!==(i=gt.call(this._weekdaysParse,a))||-1!==(i=gt.call(this._shortWeekdaysParse,a))||-1!==(i=gt.call(this._minWeekdaysParse,a))?i:null:"ddd"===e?-1!==(i=gt.call(this._shortWeekdaysParse,a))||-1!==(i=gt.call(this._weekdaysParse,a))||-1!==(i=gt.call(this._minWeekdaysParse,a))?i:null:-1!==(i=gt.call(this._minWeekdaysParse,a))||-1!==(i=gt.call(this._weekdaysParse,a))||-1!==(i=gt.call(this._shortWeekdaysParse,a))?i:null}function qt(){function t(t,e){return e.length-t.length}var e,n,r,i,s,a=[],o=[],u=[],l=[];for(e=0;e<7;e++)n=f([2e3,1]).day(e),r=yt(this.weekdaysMin(n,"")),i=yt(this.weekdaysShort(n,"")),s=yt(this.weekdays(n,"")),a.push(r),o.push(i),u.push(s),l.push(r),l.push(i),l.push(s);a.sort(t),o.sort(t),u.sort(t),l.sort(t),this._weekdaysRegex=new RegExp("^("+l.join("|")+")","i"),this._weekdaysShortRegex=this._weekdaysRegex,this._weekdaysMinRegex=this._weekdaysRegex,this._weekdaysStrictRegex=new RegExp("^("+u.join("|")+")","i"),this._weekdaysShortStrictRegex=new RegExp("^("+o.join("|")+")","i"),this._weekdaysMinStrictRegex=new RegExp("^("+a.join("|")+")","i");}function Zt(){return this.hours()%12||12}function Kt(t,e){A(t,0,0,(function(){return this.localeData().meridiem(this.hours(),this.minutes(),e)}));}function Jt(t,e){return e._meridiemParse}A("H",["HH",2],0,"hour"),A("h",["hh",2],0,Zt),A("k",["kk",2],0,(function(){return this.hours()||24})),A("hmm",0,0,(function(){return ""+Zt.apply(this)+E(this.minutes(),2)})),A("hmmss",0,0,(function(){return ""+Zt.apply(this)+E(this.minutes(),2)+E(this.seconds(),2)})),A("Hmm",0,0,(function(){return ""+this.hours()+E(this.minutes(),2)})),A("Hmmss",0,0,(function(){return ""+this.hours()+E(this.minutes(),2)+E(this.seconds(),2)})),Kt("a",!0),Kt("A",!1),j("hour","h"),U("hour",13),ft("a",Jt),ft("A",Jt),ft("H",rt),ft("h",rt),ft("k",rt),ft("HH",rt,Q),ft("hh",rt,Q),ft("kk",rt,Q),ft("hmm",it),ft("hmmss",st),ft("Hmm",it),ft("Hmmss",st),vt(["H","HH"],3),vt(["k","kk"],(function(t,e,n){var r=z(t);e[3]=24===r?0:r;})),vt(["a","A"],(function(t,e,n){n._isPm=n._locale.isPM(t),n._meridiem=t;})),vt(["h","hh"],(function(t,e,n){e[3]=z(t),m(n).bigHour=!0;})),vt("hmm",(function(t,e,n){var r=t.length-2;e[3]=z(t.substr(0,r)),e[4]=z(t.substr(r)),m(n).bigHour=!0;})),vt("hmmss",(function(t,e,n){var r=t.length-4,i=t.length-2;e[3]=z(t.substr(0,r)),e[4]=z(t.substr(r,2)),e[5]=z(t.substr(i)),m(n).bigHour=!0;})),vt("Hmm",(function(t,e,n){var r=t.length-2;e[3]=z(t.substr(0,r)),e[4]=z(t.substr(r));})),vt("Hmmss",(function(t,e,n){var r=t.length-4,i=t.length-2;e[3]=z(t.substr(0,r)),e[4]=z(t.substr(r,2)),e[5]=z(t.substr(i));}));var Xt,Qt=q("Hours",!0),te={calendar:{sameDay:"[Today at] LT",nextDay:"[Tomorrow at] LT",nextWeek:"dddd [at] LT",lastDay:"[Yesterday at] LT",lastWeek:"[Last] dddd [at] LT",sameElse:"L"},longDateFormat:{LTS:"h:mm:ss A",LT:"h:mm A",L:"MM/DD/YYYY",LL:"MMMM D, YYYY",LLL:"MMMM D, YYYY h:mm A",LLLL:"dddd, MMMM D, YYYY h:mm A"},invalidDate:"Invalid date",ordinal:"%d",dayOfMonthOrdinalParse:/\d{1,2}/,relativeTime:{future:"in %s",past:"%s ago",s:"a few seconds",ss:"%d seconds",m:"a minute",mm:"%d minutes",h:"an hour",hh:"%d hours",d:"a day",dd:"%d days",w:"a week",ww:"%d weeks",M:"a month",MM:"%d months",y:"a year",yy:"%d years"},months:bt,monthsShort:xt,week:{dow:0,doy:6},weekdays:Wt,weekdaysMin:Vt,weekdaysShort:Bt,meridiemParse:/[ap]\.?m?\.?/i},ee={},ne={};function re(t,e){var n,r=Math.min(t.length,e.length);for(n=0;n<r;n+=1)if(t[n]!==e[n])return n;return r}function ie(t){return t?t.toLowerCase().replace("_","-"):t}function se(t){var n=null;if(void 0===ee[t]&&o&&o.exports)try{n=Xt._abbr,e("./locale/"+t),ae(n);}catch(e){ee[t]=null;}return ee[t]}function ae(t,e){var n;return t&&((n=l(e)?ue(t):oe(t,e))?Xt=n:"undefined"!=typeof console&&console.warn&&console.warn("Locale "+t+" not found. Did you forget to load it?")),Xt._abbr}function oe(t,e){if(null!==e){var n,r=te;if(e.abbr=t,null!=ee[t])D("defineLocaleOverride","use moment.updateLocale(localeName, config) to change an existing locale. moment.defineLocale(localeName, config) should only be used for creating a new locale See http://momentjs.com/guides/#/warnings/define-locale/ for more info."),r=ee[t]._config;else if(null!=e.parentLocale)if(null!=ee[e.parentLocale])r=ee[e.parentLocale]._config;else {if(null==(n=se(e.parentLocale)))return ne[e.parentLocale]||(ne[e.parentLocale]=[]),ne[e.parentLocale].push({name:t,config:e}),null;r=n._config;}return ee[t]=new Y(N(r,e)),ne[t]&&ne[t].forEach((function(t){oe(t.name,t.config);})),ae(t),ee[t]}return delete ee[t],null}function ue(t){var e;if(t&&t._locale&&t._locale._abbr&&(t=t._locale._abbr),!t)return Xt;if(!i(t)){if(e=se(t))return e;t=[t];}return function(t){for(var e,n,r,i,s=0;s<t.length;){for(e=(i=ie(t[s]).split("-")).length,n=(n=ie(t[s+1]))?n.split("-"):null;e>0;){if(r=se(i.slice(0,e).join("-")))return r;if(n&&n.length>=e&&re(i,n)>=e-1)break;e--;}s++;}return Xt}(t)}function le(t){var e,n=t._a;return n&&-2===m(t).overflow&&(e=n[1]<0||n[1]>11?1:n[2]<1||n[2]>wt(n[0],n[1])?2:n[3]<0||n[3]>24||24===n[3]&&(0!==n[4]||0!==n[5]||0!==n[6])?3:n[4]<0||n[4]>59?4:n[5]<0||n[5]>59?5:n[6]<0||n[6]>999?6:-1,m(t)._overflowDayOfYear&&(e<0||e>2)&&(e=2),m(t)._overflowWeeks&&-1===e&&(e=7),m(t)._overflowWeekday&&-1===e&&(e=8),m(t).overflow=e),t}var ce=/^\s*((?:[+-]\d{6}|\d{4})-(?:\d\d-\d\d|W\d\d-\d|W\d\d|\d\d\d|\d\d))(?:(T| )(\d\d(?::\d\d(?::\d\d(?:[.,]\d+)?)?)?)([+-]\d\d(?::?\d\d)?|\s*Z)?)?$/,he=/^\s*((?:[+-]\d{6}|\d{4})(?:\d\d\d\d|W\d\d\d|W\d\d|\d\d\d|\d\d|))(?:(T| )(\d\d(?:\d\d(?:\d\d(?:[.,]\d+)?)?)?)([+-]\d\d(?::?\d\d)?|\s*Z)?)?$/,pe=/Z|[+-]\d\d(?::?\d\d)?/,de=[["YYYYYY-MM-DD",/[+-]\d{6}-\d\d-\d\d/],["YYYY-MM-DD",/\d{4}-\d\d-\d\d/],["GGGG-[W]WW-E",/\d{4}-W\d\d-\d/],["GGGG-[W]WW",/\d{4}-W\d\d/,!1],["YYYY-DDD",/\d{4}-\d{3}/],["YYYY-MM",/\d{4}-\d\d/,!1],["YYYYYYMMDD",/[+-]\d{10}/],["YYYYMMDD",/\d{8}/],["GGGG[W]WWE",/\d{4}W\d{3}/],["GGGG[W]WW",/\d{4}W\d{2}/,!1],["YYYYDDD",/\d{7}/],["YYYYMM",/\d{6}/,!1],["YYYY",/\d{4}/,!1]],fe=[["HH:mm:ss.SSSS",/\d\d:\d\d:\d\d\.\d+/],["HH:mm:ss,SSSS",/\d\d:\d\d:\d\d,\d+/],["HH:mm:ss",/\d\d:\d\d:\d\d/],["HH:mm",/\d\d:\d\d/],["HHmmss.SSSS",/\d\d\d\d\d\d\.\d+/],["HHmmss,SSSS",/\d\d\d\d\d\d,\d+/],["HHmmss",/\d\d\d\d\d\d/],["HHmm",/\d\d\d\d/],["HH",/\d\d/]],me=/^\/?Date\((-?\d+)/i,ye=/^(?:(Mon|Tue|Wed|Thu|Fri|Sat|Sun),?\s)?(\d{1,2})\s(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s(\d{2,4})\s(\d\d):(\d\d)(?::(\d\d))?\s(?:(UT|GMT|[ECMP][SD]T)|([Zz])|([+-]\d{4}))$/,ge={UT:0,GMT:0,EDT:-240,EST:-300,CDT:-300,CST:-360,MDT:-360,MST:-420,PDT:-420,PST:-480};function _e(t){var e,n,r,i,s,a,o=t._i,u=ce.exec(o)||he.exec(o);if(u){for(m(t).iso=!0,e=0,n=de.length;e<n;e++)if(de[e][1].exec(u[1])){i=de[e][0],r=!1!==de[e][2];break}if(null==i)return void(t._isValid=!1);if(u[3]){for(e=0,n=fe.length;e<n;e++)if(fe[e][1].exec(u[3])){s=(u[2]||" ")+fe[e][0];break}if(null==s)return void(t._isValid=!1)}if(!r&&null!=s)return void(t._isValid=!1);if(u[4]){if(!pe.exec(u[4]))return void(t._isValid=!1);a="Z";}t._f=i+(s||"")+(a||""),be(t);}else t._isValid=!1;}function ve(t){var e=parseInt(t,10);return e<=49?2e3+e:e<=999?1900+e:e}function ke(t){var e,n,r,i,s,a,o,u,l=ye.exec(t._i.replace(/\([^)]*\)|[\n\t]/g," ").replace(/(\s\s+)/g," ").replace(/^\s\s*/,"").replace(/\s\s*$/,""));if(l){if(n=l[4],r=l[3],i=l[2],s=l[5],a=l[6],o=l[7],u=[ve(n),xt.indexOf(r),parseInt(i,10),parseInt(s,10),parseInt(a,10)],o&&u.push(parseInt(o,10)),e=u,!function(t,e,n){return !t||Bt.indexOf(t)===new Date(e[0],e[1],e[2]).getDay()||(m(n).weekdayMismatch=!0,n._isValid=!1,!1)}(l[1],e,t))return;t._a=e,t._tzm=function(t,e,n){if(t)return ge[t];if(e)return 0;var r=parseInt(n,10),i=r%100;return (r-i)/100*60+i}(l[8],l[9],l[10]),t._d=It.apply(null,t._a),t._d.setUTCMinutes(t._d.getUTCMinutes()-t._tzm),m(t).rfc2822=!0;}else t._isValid=!1;}function Se(t,e,n){return null!=t?t:null!=e?e:n}function we(t){var e,n,i,s,a,o=[];if(!t._d){for(i=function(t){var e=new Date(r.now());return t._useUTC?[e.getUTCFullYear(),e.getUTCMonth(),e.getUTCDate()]:[e.getFullYear(),e.getMonth(),e.getDate()]}(t),t._w&&null==t._a[2]&&null==t._a[1]&&function(t){var e,n,r,i,s,a,o,u,l;null!=(e=t._w).GG||null!=e.W||null!=e.E?(s=1,a=4,n=Se(e.GG,t._a[0],Ht(Me(),1,4).year),r=Se(e.W,1),((i=Se(e.E,1))<1||i>7)&&(u=!0)):(s=t._locale._week.dow,a=t._locale._week.doy,l=Ht(Me(),s,a),n=Se(e.gg,t._a[0],l.year),r=Se(e.w,l.week),null!=e.d?((i=e.d)<0||i>6)&&(u=!0):null!=e.e?(i=e.e+s,(e.e<0||e.e>6)&&(u=!0)):i=s),r<1||r>Ft(n,s,a)?m(t)._overflowWeeks=!0:null!=u?m(t)._overflowWeekday=!0:(o=Rt(n,r,i,s,a),t._a[0]=o.year,t._dayOfYear=o.dayOfYear);}(t),null!=t._dayOfYear&&(a=Se(t._a[0],i[0]),(t._dayOfYear>Ct(a)||0===t._dayOfYear)&&(m(t)._overflowDayOfYear=!0),n=It(a,0,t._dayOfYear),t._a[1]=n.getUTCMonth(),t._a[2]=n.getUTCDate()),e=0;e<3&&null==t._a[e];++e)t._a[e]=o[e]=i[e];for(;e<7;e++)t._a[e]=o[e]=null==t._a[e]?2===e?1:0:t._a[e];24===t._a[3]&&0===t._a[4]&&0===t._a[5]&&0===t._a[6]&&(t._nextDay=!0,t._a[3]=0),t._d=(t._useUTC?It:Tt).apply(null,o),s=t._useUTC?t._d.getUTCDay():t._d.getDay(),null!=t._tzm&&t._d.setUTCMinutes(t._d.getUTCMinutes()-t._tzm),t._nextDay&&(t._a[3]=24),t._w&&void 0!==t._w.d&&t._w.d!==s&&(m(t).weekdayMismatch=!0);}}function be(t){if(t._f!==r.ISO_8601)if(t._f!==r.RFC_2822){t._a=[],m(t).empty=!0;var e,n,i,s,a,o,u=""+t._i,l=u.length,c=0;for(i=H(t._f,t._locale).match(C)||[],e=0;e<i.length;e++)s=i[e],(n=(u.match(mt(s,t))||[])[0])&&((a=u.substr(0,u.indexOf(n))).length>0&&m(t).unusedInput.push(a),u=u.slice(u.indexOf(n)+n.length),c+=n.length),I[s]?(n?m(t).empty=!1:m(t).unusedTokens.push(s),St(s,n,t)):t._strict&&!n&&m(t).unusedTokens.push(s);m(t).charsLeftOver=l-c,u.length>0&&m(t).unusedInput.push(u),t._a[3]<=12&&!0===m(t).bigHour&&t._a[3]>0&&(m(t).bigHour=void 0),m(t).parsedDateParts=t._a.slice(0),m(t).meridiem=t._meridiem,t._a[3]=function(t,e,n){var r;return null==n?e:null!=t.meridiemHour?t.meridiemHour(e,n):null!=t.isPM?((r=t.isPM(n))&&e<12&&(e+=12),r||12!==e||(e=0),e):e}(t._locale,t._a[3],t._meridiem),null!==(o=m(t).era)&&(t._a[0]=t._locale.erasConvertYear(o,t._a[0])),we(t),le(t);}else ke(t);else _e(t);}function xe(t){var e=t._i,n=t._f;return t._locale=t._locale||ue(t._l),null===e||void 0===n&&""===e?g({nullInput:!0}):("string"==typeof e&&(t._i=e=t._locale.preparse(e)),w(e)?new S(le(e)):(h(e)?t._d=e:i(n)?function(t){var e,n,r,i,s,a,o=!1;if(0===t._f.length)return m(t).invalidFormat=!0,void(t._d=new Date(NaN));for(i=0;i<t._f.length;i++)s=0,a=!1,e=k({},t),null!=t._useUTC&&(e._useUTC=t._useUTC),e._f=t._f[i],be(e),y(e)&&(a=!0),s+=m(e).charsLeftOver,s+=10*m(e).unusedTokens.length,m(e).score=s,o?s<r&&(r=s,n=e):(null==r||s<r||a)&&(r=s,n=e,a&&(o=!0));d(t,n||e);}(t):n?be(t):function(t){var e=t._i;l(e)?t._d=new Date(r.now()):h(e)?t._d=new Date(e.valueOf()):"string"==typeof e?function(t){var e=me.exec(t._i);null===e?(_e(t),!1===t._isValid&&(delete t._isValid,ke(t),!1===t._isValid&&(delete t._isValid,t._strict?t._isValid=!1:r.createFromInputFallback(t)))):t._d=new Date(+e[1]);}(t):i(e)?(t._a=p(e.slice(0),(function(t){return parseInt(t,10)})),we(t)):s(e)?function(t){if(!t._d){var e=B(t._i),n=void 0===e.day?e.date:e.day;t._a=p([e.year,e.month,n,e.hour,e.minute,e.second,e.millisecond],(function(t){return t&&parseInt(t,10)})),we(t);}}(t):c(e)?t._d=new Date(e):r.createFromInputFallback(t);}(t),y(t)||(t._d=null),t))}function Pe(t,e,n,r,a){var o,l={};return !0!==e&&!1!==e||(r=e,e=void 0),!0!==n&&!1!==n||(r=n,n=void 0),(s(t)&&u(t)||i(t)&&0===t.length)&&(t=void 0),l._isAMomentObject=!0,l._useUTC=l._isUTC=a,l._l=n,l._i=t,l._f=e,l._strict=r,(o=new S(le(xe(l))))._nextDay&&(o.add(1,"d"),o._nextDay=void 0),o}function Me(t,e,n,r){return Pe(t,e,n,r,!1)}r.createFromInputFallback=x("value provided is not in a recognized RFC2822 or ISO format. moment construction falls back to js Date(), which is not reliable across all browsers and versions. Non RFC2822/ISO date formats are discouraged. Please refer to http://momentjs.com/guides/#/warnings/js-date/ for more info.",(function(t){t._d=new Date(t._i+(t._useUTC?" UTC":""));})),r.ISO_8601=function(){},r.RFC_2822=function(){};var De=x("moment().min is deprecated, use moment.max instead. http://momentjs.com/guides/#/warnings/min-max/",(function(){var t=Me.apply(null,arguments);return this.isValid()&&t.isValid()?t<this?this:t:g()})),Oe=x("moment().max is deprecated, use moment.min instead. http://momentjs.com/guides/#/warnings/min-max/",(function(){var t=Me.apply(null,arguments);return this.isValid()&&t.isValid()?t>this?this:t:g()}));function Ne(t,e){var n,r;if(1===e.length&&i(e[0])&&(e=e[0]),!e.length)return Me();for(n=e[0],r=1;r<e.length;++r)e[r].isValid()&&!e[r][t](n)||(n=e[r]);return n}var Ye=["year","quarter","month","week","day","hour","minute","second","millisecond"];function Ee(t){var e=B(t),n=e.year||0,r=e.quarter||0,i=e.month||0,s=e.week||e.isoWeek||0,o=e.day||0,u=e.hour||0,l=e.minute||0,c=e.second||0,h=e.millisecond||0;this._isValid=function(t){var e,n,r=!1;for(e in t)if(a(t,e)&&(-1===gt.call(Ye,e)||null!=t[e]&&isNaN(t[e])))return !1;for(n=0;n<Ye.length;++n)if(t[Ye[n]]){if(r)return !1;parseFloat(t[Ye[n]])!==z(t[Ye[n]])&&(r=!0);}return !0}(e),this._milliseconds=+h+1e3*c+6e4*l+1e3*u*60*60,this._days=+o+7*s,this._months=+i+3*r+12*n,this._data={},this._locale=ue(),this._bubble();}function Ce(t){return t instanceof Ee}function Le(t){return t<0?-1*Math.round(-1*t):Math.round(t)}function Te(t,e){A(t,0,0,(function(){var t=this.utcOffset(),n="+";return t<0&&(t=-t,n="-"),n+E(~~(t/60),2)+e+E(~~t%60,2)}));}Te("Z",":"),Te("ZZ",""),ft("Z",pt),ft("ZZ",pt),vt(["Z","ZZ"],(function(t,e,n){n._useUTC=!0,n._tzm=Ae(pt,t);}));var Ie=/([\+\-]|\d\d)/gi;function Ae(t,e){var n,r,i=(e||"").match(t);return null===i?null:0===(r=60*(n=((i[i.length-1]||[])+"").match(Ie)||["-",0,0])[1]+z(n[2]))?0:"+"===n[0]?r:-r}function Re(t,e){var n,i;return e._isUTC?(n=e.clone(),i=(w(t)||h(t)?t.valueOf():Me(t).valueOf())-n.valueOf(),n._d.setTime(n._d.valueOf()+i),r.updateOffset(n,!1),n):Me(t).local()}function He(t){return -Math.round(t._d.getTimezoneOffset())}function Fe(){return !!this.isValid()&&this._isUTC&&0===this._offset}r.updateOffset=function(){};var je=/^(-|\+)?(?:(\d*)[. ])?(\d+):(\d+)(?::(\d+)(\.\d*)?)?$/,We=/^(-|\+)?P(?:([-+]?[0-9,.]*)Y)?(?:([-+]?[0-9,.]*)M)?(?:([-+]?[0-9,.]*)W)?(?:([-+]?[0-9,.]*)D)?(?:T(?:([-+]?[0-9,.]*)H)?(?:([-+]?[0-9,.]*)M)?(?:([-+]?[0-9,.]*)S)?)?$/;function Be(t,e){var n,r,i,s,o,u,l=t,h=null;return Ce(t)?l={ms:t._milliseconds,d:t._days,M:t._months}:c(t)||!isNaN(+t)?(l={},e?l[e]=+t:l.milliseconds=+t):(h=je.exec(t))?(n="-"===h[1]?-1:1,l={y:0,d:z(h[2])*n,h:z(h[3])*n,m:z(h[4])*n,s:z(h[5])*n,ms:z(Le(1e3*h[6]))*n}):(h=We.exec(t))?(n="-"===h[1]?-1:1,l={y:Ve(h[2],n),M:Ve(h[3],n),w:Ve(h[4],n),d:Ve(h[5],n),h:Ve(h[6],n),m:Ve(h[7],n),s:Ve(h[8],n)}):null==l?l={}:"object"==typeof l&&("from"in l||"to"in l)&&(s=Me(l.from),o=Me(l.to),i=s.isValid()&&o.isValid()?(o=Re(o,s),s.isBefore(o)?u=Ue(s,o):((u=Ue(o,s)).milliseconds=-u.milliseconds,u.months=-u.months),u):{milliseconds:0,months:0},(l={}).ms=i.milliseconds,l.M=i.months),r=new Ee(l),Ce(t)&&a(t,"_locale")&&(r._locale=t._locale),Ce(t)&&a(t,"_isValid")&&(r._isValid=t._isValid),r}function Ve(t,e){var n=t&&parseFloat(t.replace(",","."));return (isNaN(n)?0:n)*e}function Ue(t,e){var n={};return n.months=e.month()-t.month()+12*(e.year()-t.year()),t.clone().add(n.months,"M").isAfter(e)&&--n.months,n.milliseconds=+e-+t.clone().add(n.months,"M"),n}function $e(t,e){return function(n,r){var i;return null===r||isNaN(+r)||(D(e,"moment()."+e+"(period, number) is deprecated. Please use moment()."+e+"(number, period). See http://momentjs.com/guides/#/warnings/add-inverted-param/ for more info."),i=n,n=r,r=i),Ge(this,Be(n,r),t),this}}function Ge(t,e,n,i){var s=e._milliseconds,a=Le(e._days),o=Le(e._months);t.isValid()&&(i=null==i||i,o&&Nt(t,Z(t,"Month")+o*n),a&&K(t,"Date",Z(t,"Date")+a*n),s&&t._d.setTime(t._d.valueOf()+s*n),i&&r.updateOffset(t,a||o));}Be.fn=Ee.prototype,Be.invalid=function(){return Be(NaN)};var ze=$e(1,"add"),qe=$e(-1,"subtract");function Ze(t){return "string"==typeof t||t instanceof String}function Ke(t){return w(t)||h(t)||Ze(t)||c(t)||function(t){var e=i(t),n=!1;return e&&(n=0===t.filter((function(e){return !c(e)&&Ze(t)})).length),e&&n}(t)||function(t){var e,n,r=s(t)&&!u(t),i=!1,o=["years","year","y","months","month","M","days","day","d","dates","date","D","hours","hour","h","minutes","minute","m","seconds","second","s","milliseconds","millisecond","ms"];for(e=0;e<o.length;e+=1)n=o[e],i=i||a(t,n);return r&&i}(t)||null==t}function Je(t){var e,n=s(t)&&!u(t),r=!1,i=["sameDay","nextDay","lastDay","nextWeek","lastWeek","sameElse"];for(e=0;e<i.length;e+=1)r=r||a(t,i[e]);return n&&r}function Xe(t,e){if(t.date()<e.date())return -Xe(e,t);var n=12*(e.year()-t.year())+(e.month()-t.month()),r=t.clone().add(n,"months");return -(n+(e-r<0?(e-r)/(r-t.clone().add(n-1,"months")):(e-r)/(t.clone().add(n+1,"months")-r)))||0}function Qe(t){var e;return void 0===t?this._locale._abbr:(null!=(e=ue(t))&&(this._locale=e),this)}r.defaultFormat="YYYY-MM-DDTHH:mm:ssZ",r.defaultFormatUtc="YYYY-MM-DDTHH:mm:ss[Z]";var tn=x("moment().lang() is deprecated. Instead, use moment().localeData() to get the language configuration. Use moment().locale() to change languages.",(function(t){return void 0===t?this.localeData():this.locale(t)}));function en(){return this._locale}function nn(t,e){return (t%e+e)%e}function rn(t,e,n){return t<100&&t>=0?new Date(t+400,e,n)-126227808e5:new Date(t,e,n).valueOf()}function sn(t,e,n){return t<100&&t>=0?Date.UTC(t+400,e,n)-126227808e5:Date.UTC(t,e,n)}function an(t,e){return e.erasAbbrRegex(t)}function on(){var t,e,n=[],r=[],i=[],s=[],a=this.eras();for(t=0,e=a.length;t<e;++t)r.push(yt(a[t].name)),n.push(yt(a[t].abbr)),i.push(yt(a[t].narrow)),s.push(yt(a[t].name)),s.push(yt(a[t].abbr)),s.push(yt(a[t].narrow));this._erasRegex=new RegExp("^("+s.join("|")+")","i"),this._erasNameRegex=new RegExp("^("+r.join("|")+")","i"),this._erasAbbrRegex=new RegExp("^("+n.join("|")+")","i"),this._erasNarrowRegex=new RegExp("^("+i.join("|")+")","i");}function un(t,e){A(0,[t,t.length],0,e);}function ln(t,e,n,r,i){var s;return null==t?Ht(this,r,i).year:(e>(s=Ft(t,r,i))&&(e=s),cn.call(this,t,e,n,r,i))}function cn(t,e,n,r,i){var s=Rt(t,e,n,r,i),a=It(s.year,0,s.dayOfYear);return this.year(a.getUTCFullYear()),this.month(a.getUTCMonth()),this.date(a.getUTCDate()),this}A("N",0,0,"eraAbbr"),A("NN",0,0,"eraAbbr"),A("NNN",0,0,"eraAbbr"),A("NNNN",0,0,"eraName"),A("NNNNN",0,0,"eraNarrow"),A("y",["y",1],"yo","eraYear"),A("y",["yy",2],0,"eraYear"),A("y",["yyy",3],0,"eraYear"),A("y",["yyyy",4],0,"eraYear"),ft("N",an),ft("NN",an),ft("NNN",an),ft("NNNN",(function(t,e){return e.erasNameRegex(t)})),ft("NNNNN",(function(t,e){return e.erasNarrowRegex(t)})),vt(["N","NN","NNN","NNNN","NNNNN"],(function(t,e,n,r){var i=n._locale.erasParse(t,r,n._strict);i?m(n).era=i:m(n).invalidEra=t;})),ft("y",lt),ft("yy",lt),ft("yyy",lt),ft("yyyy",lt),ft("yo",(function(t,e){return e._eraYearOrdinalRegex||lt})),vt(["y","yy","yyy","yyyy"],0),vt(["yo"],(function(t,e,n,r){var i;n._locale._eraYearOrdinalRegex&&(i=t.match(n._locale._eraYearOrdinalRegex)),n._locale.eraYearOrdinalParse?e[0]=n._locale.eraYearOrdinalParse(t,i):e[0]=parseInt(t,10);})),A(0,["gg",2],0,(function(){return this.weekYear()%100})),A(0,["GG",2],0,(function(){return this.isoWeekYear()%100})),un("gggg","weekYear"),un("ggggg","weekYear"),un("GGGG","isoWeekYear"),un("GGGGG","isoWeekYear"),j("weekYear","gg"),j("isoWeekYear","GG"),U("weekYear",1),U("isoWeekYear",1),ft("G",ct),ft("g",ct),ft("GG",rt,Q),ft("gg",rt,Q),ft("GGGG",ot,et),ft("gggg",ot,et),ft("GGGGG",ut,nt),ft("ggggg",ut,nt),kt(["gggg","ggggg","GGGG","GGGGG"],(function(t,e,n,r){e[r.substr(0,2)]=z(t);})),kt(["gg","GG"],(function(t,e,n,i){e[i]=r.parseTwoDigitYear(t);})),A("Q",0,"Qo","quarter"),j("quarter","Q"),U("quarter",7),ft("Q",X),vt("Q",(function(t,e){e[1]=3*(z(t)-1);})),A("D",["DD",2],"Do","date"),j("date","D"),U("date",9),ft("D",rt),ft("DD",rt,Q),ft("Do",(function(t,e){return t?e._dayOfMonthOrdinalParse||e._ordinalParse:e._dayOfMonthOrdinalParseLenient})),vt(["D","DD"],2),vt("Do",(function(t,e){e[2]=z(t.match(rt)[0]);}));var hn=q("Date",!0);A("DDD",["DDDD",3],"DDDo","dayOfYear"),j("dayOfYear","DDD"),U("dayOfYear",4),ft("DDD",at),ft("DDDD",tt),vt(["DDD","DDDD"],(function(t,e,n){n._dayOfYear=z(t);})),A("m",["mm",2],0,"minute"),j("minute","m"),U("minute",14),ft("m",rt),ft("mm",rt,Q),vt(["m","mm"],4);var pn=q("Minutes",!1);A("s",["ss",2],0,"second"),j("second","s"),U("second",15),ft("s",rt),ft("ss",rt,Q),vt(["s","ss"],5);var dn,fn,mn=q("Seconds",!1);for(A("S",0,0,(function(){return ~~(this.millisecond()/100)})),A(0,["SS",2],0,(function(){return ~~(this.millisecond()/10)})),A(0,["SSS",3],0,"millisecond"),A(0,["SSSS",4],0,(function(){return 10*this.millisecond()})),A(0,["SSSSS",5],0,(function(){return 100*this.millisecond()})),A(0,["SSSSSS",6],0,(function(){return 1e3*this.millisecond()})),A(0,["SSSSSSS",7],0,(function(){return 1e4*this.millisecond()})),A(0,["SSSSSSSS",8],0,(function(){return 1e5*this.millisecond()})),A(0,["SSSSSSSSS",9],0,(function(){return 1e6*this.millisecond()})),j("millisecond","ms"),U("millisecond",16),ft("S",at,X),ft("SS",at,Q),ft("SSS",at,tt),dn="SSSS";dn.length<=9;dn+="S")ft(dn,lt);function yn(t,e){e[6]=z(1e3*("0."+t));}for(dn="S";dn.length<=9;dn+="S")vt(dn,yn);fn=q("Milliseconds",!1),A("z",0,0,"zoneAbbr"),A("zz",0,0,"zoneName");var gn=S.prototype;function _n(t){return t}gn.add=ze,gn.calendar=function(t,e){1===arguments.length&&(arguments[0]?Ke(arguments[0])?(t=arguments[0],e=void 0):Je(arguments[0])&&(e=arguments[0],t=void 0):(t=void 0,e=void 0));var n=t||Me(),i=Re(n,this).startOf("day"),s=r.calendarFormat(this,i)||"sameElse",a=e&&(O(e[s])?e[s].call(this,n):e[s]);return this.format(a||this.localeData().calendar(s,this,Me(n)))},gn.clone=function(){return new S(this)},gn.diff=function(t,e,n){var r,i,s;if(!this.isValid())return NaN;if(!(r=Re(t,this)).isValid())return NaN;switch(i=6e4*(r.utcOffset()-this.utcOffset()),e=W(e)){case"year":s=Xe(this,r)/12;break;case"month":s=Xe(this,r);break;case"quarter":s=Xe(this,r)/3;break;case"second":s=(this-r)/1e3;break;case"minute":s=(this-r)/6e4;break;case"hour":s=(this-r)/36e5;break;case"day":s=(this-r-i)/864e5;break;case"week":s=(this-r-i)/6048e5;break;default:s=this-r;}return n?s:G(s)},gn.endOf=function(t){var e,n;if(void 0===(t=W(t))||"millisecond"===t||!this.isValid())return this;switch(n=this._isUTC?sn:rn,t){case"year":e=n(this.year()+1,0,1)-1;break;case"quarter":e=n(this.year(),this.month()-this.month()%3+3,1)-1;break;case"month":e=n(this.year(),this.month()+1,1)-1;break;case"week":e=n(this.year(),this.month(),this.date()-this.weekday()+7)-1;break;case"isoWeek":e=n(this.year(),this.month(),this.date()-(this.isoWeekday()-1)+7)-1;break;case"day":case"date":e=n(this.year(),this.month(),this.date()+1)-1;break;case"hour":e=this._d.valueOf(),e+=36e5-nn(e+(this._isUTC?0:6e4*this.utcOffset()),36e5)-1;break;case"minute":e=this._d.valueOf(),e+=6e4-nn(e,6e4)-1;break;case"second":e=this._d.valueOf(),e+=1e3-nn(e,1e3)-1;}return this._d.setTime(e),r.updateOffset(this,!0),this},gn.format=function(t){t||(t=this.isUtc()?r.defaultFormatUtc:r.defaultFormat);var e=R(this,t);return this.localeData().postformat(e)},gn.from=function(t,e){return this.isValid()&&(w(t)&&t.isValid()||Me(t).isValid())?Be({to:this,from:t}).locale(this.locale()).humanize(!e):this.localeData().invalidDate()},gn.fromNow=function(t){return this.from(Me(),t)},gn.to=function(t,e){return this.isValid()&&(w(t)&&t.isValid()||Me(t).isValid())?Be({from:this,to:t}).locale(this.locale()).humanize(!e):this.localeData().invalidDate()},gn.toNow=function(t){return this.to(Me(),t)},gn.get=function(t){return O(this[t=W(t)])?this[t]():this},gn.invalidAt=function(){return m(this).overflow},gn.isAfter=function(t,e){var n=w(t)?t:Me(t);return !(!this.isValid()||!n.isValid())&&("millisecond"===(e=W(e)||"millisecond")?this.valueOf()>n.valueOf():n.valueOf()<this.clone().startOf(e).valueOf())},gn.isBefore=function(t,e){var n=w(t)?t:Me(t);return !(!this.isValid()||!n.isValid())&&("millisecond"===(e=W(e)||"millisecond")?this.valueOf()<n.valueOf():this.clone().endOf(e).valueOf()<n.valueOf())},gn.isBetween=function(t,e,n,r){var i=w(t)?t:Me(t),s=w(e)?e:Me(e);return !!(this.isValid()&&i.isValid()&&s.isValid())&&("("===(r=r||"()")[0]?this.isAfter(i,n):!this.isBefore(i,n))&&(")"===r[1]?this.isBefore(s,n):!this.isAfter(s,n))},gn.isSame=function(t,e){var n,r=w(t)?t:Me(t);return !(!this.isValid()||!r.isValid())&&("millisecond"===(e=W(e)||"millisecond")?this.valueOf()===r.valueOf():(n=r.valueOf(),this.clone().startOf(e).valueOf()<=n&&n<=this.clone().endOf(e).valueOf()))},gn.isSameOrAfter=function(t,e){return this.isSame(t,e)||this.isAfter(t,e)},gn.isSameOrBefore=function(t,e){return this.isSame(t,e)||this.isBefore(t,e)},gn.isValid=function(){return y(this)},gn.lang=tn,gn.locale=Qe,gn.localeData=en,gn.max=Oe,gn.min=De,gn.parsingFlags=function(){return d({},m(this))},gn.set=function(t,e){if("object"==typeof t){var n,r=function(t){var e,n=[];for(e in t)a(t,e)&&n.push({unit:e,priority:V[e]});return n.sort((function(t,e){return t.priority-e.priority})),n}(t=B(t));for(n=0;n<r.length;n++)this[r[n].unit](t[r[n].unit]);}else if(O(this[t=W(t)]))return this[t](e);return this},gn.startOf=function(t){var e,n;if(void 0===(t=W(t))||"millisecond"===t||!this.isValid())return this;switch(n=this._isUTC?sn:rn,t){case"year":e=n(this.year(),0,1);break;case"quarter":e=n(this.year(),this.month()-this.month()%3,1);break;case"month":e=n(this.year(),this.month(),1);break;case"week":e=n(this.year(),this.month(),this.date()-this.weekday());break;case"isoWeek":e=n(this.year(),this.month(),this.date()-(this.isoWeekday()-1));break;case"day":case"date":e=n(this.year(),this.month(),this.date());break;case"hour":e=this._d.valueOf(),e-=nn(e+(this._isUTC?0:6e4*this.utcOffset()),36e5);break;case"minute":e=this._d.valueOf(),e-=nn(e,6e4);break;case"second":e=this._d.valueOf(),e-=nn(e,1e3);}return this._d.setTime(e),r.updateOffset(this,!0),this},gn.subtract=qe,gn.toArray=function(){var t=this;return [t.year(),t.month(),t.date(),t.hour(),t.minute(),t.second(),t.millisecond()]},gn.toObject=function(){var t=this;return {years:t.year(),months:t.month(),date:t.date(),hours:t.hours(),minutes:t.minutes(),seconds:t.seconds(),milliseconds:t.milliseconds()}},gn.toDate=function(){return new Date(this.valueOf())},gn.toISOString=function(t){if(!this.isValid())return null;var e=!0!==t,n=e?this.clone().utc():this;return n.year()<0||n.year()>9999?R(n,e?"YYYYYY-MM-DD[T]HH:mm:ss.SSS[Z]":"YYYYYY-MM-DD[T]HH:mm:ss.SSSZ"):O(Date.prototype.toISOString)?e?this.toDate().toISOString():new Date(this.valueOf()+60*this.utcOffset()*1e3).toISOString().replace("Z",R(n,"Z")):R(n,e?"YYYY-MM-DD[T]HH:mm:ss.SSS[Z]":"YYYY-MM-DD[T]HH:mm:ss.SSSZ")},gn.inspect=function(){if(!this.isValid())return "moment.invalid(/* "+this._i+" */)";var t,e,n,r="moment",i="";return this.isLocal()||(r=0===this.utcOffset()?"moment.utc":"moment.parseZone",i="Z"),t="["+r+'("]',e=0<=this.year()&&this.year()<=9999?"YYYY":"YYYYYY",n=i+'[")]',this.format(t+e+"-MM-DD[T]HH:mm:ss.SSS"+n)},"undefined"!=typeof Symbol&&null!=Symbol.for&&(gn[Symbol.for("nodejs.util.inspect.custom")]=function(){return "Moment<"+this.format()+">"}),gn.toJSON=function(){return this.isValid()?this.toISOString():null},gn.toString=function(){return this.clone().locale("en").format("ddd MMM DD YYYY HH:mm:ss [GMT]ZZ")},gn.unix=function(){return Math.floor(this.valueOf()/1e3)},gn.valueOf=function(){return this._d.valueOf()-6e4*(this._offset||0)},gn.creationData=function(){return {input:this._i,format:this._f,locale:this._locale,isUTC:this._isUTC,strict:this._strict}},gn.eraName=function(){var t,e,n,r=this.localeData().eras();for(t=0,e=r.length;t<e;++t){if(n=this.clone().startOf("day").valueOf(),r[t].since<=n&&n<=r[t].until)return r[t].name;if(r[t].until<=n&&n<=r[t].since)return r[t].name}return ""},gn.eraNarrow=function(){var t,e,n,r=this.localeData().eras();for(t=0,e=r.length;t<e;++t){if(n=this.clone().startOf("day").valueOf(),r[t].since<=n&&n<=r[t].until)return r[t].narrow;if(r[t].until<=n&&n<=r[t].since)return r[t].narrow}return ""},gn.eraAbbr=function(){var t,e,n,r=this.localeData().eras();for(t=0,e=r.length;t<e;++t){if(n=this.clone().startOf("day").valueOf(),r[t].since<=n&&n<=r[t].until)return r[t].abbr;if(r[t].until<=n&&n<=r[t].since)return r[t].abbr}return ""},gn.eraYear=function(){var t,e,n,i,s=this.localeData().eras();for(t=0,e=s.length;t<e;++t)if(n=s[t].since<=s[t].until?1:-1,i=this.clone().startOf("day").valueOf(),s[t].since<=i&&i<=s[t].until||s[t].until<=i&&i<=s[t].since)return (this.year()-r(s[t].since).year())*n+s[t].offset;return this.year()},gn.year=Lt,gn.isLeapYear=function(){return $(this.year())},gn.weekYear=function(t){return ln.call(this,t,this.week(),this.weekday(),this.localeData()._week.dow,this.localeData()._week.doy)},gn.isoWeekYear=function(t){return ln.call(this,t,this.isoWeek(),this.isoWeekday(),1,4)},gn.quarter=gn.quarters=function(t){return null==t?Math.ceil((this.month()+1)/3):this.month(3*(t-1)+this.month()%3)},gn.month=Yt,gn.daysInMonth=function(){return wt(this.year(),this.month())},gn.week=gn.weeks=function(t){var e=this.localeData().week(this);return null==t?e:this.add(7*(t-e),"d")},gn.isoWeek=gn.isoWeeks=function(t){var e=Ht(this,1,4).week;return null==t?e:this.add(7*(t-e),"d")},gn.weeksInYear=function(){var t=this.localeData()._week;return Ft(this.year(),t.dow,t.doy)},gn.weeksInWeekYear=function(){var t=this.localeData()._week;return Ft(this.weekYear(),t.dow,t.doy)},gn.isoWeeksInYear=function(){return Ft(this.year(),1,4)},gn.isoWeeksInISOWeekYear=function(){return Ft(this.isoWeekYear(),1,4)},gn.date=hn,gn.day=gn.days=function(t){if(!this.isValid())return null!=t?this:NaN;var e=this._isUTC?this._d.getUTCDay():this._d.getDay();return null!=t?(t=function(t,e){return "string"!=typeof t?t:isNaN(t)?"number"==typeof(t=e.weekdaysParse(t))?t:null:parseInt(t,10)}(t,this.localeData()),this.add(t-e,"d")):e},gn.weekday=function(t){if(!this.isValid())return null!=t?this:NaN;var e=(this.day()+7-this.localeData()._week.dow)%7;return null==t?e:this.add(t-e,"d")},gn.isoWeekday=function(t){if(!this.isValid())return null!=t?this:NaN;if(null!=t){var e=function(t,e){return "string"==typeof t?e.weekdaysParse(t)%7||7:isNaN(t)?null:t}(t,this.localeData());return this.day(this.day()%7?e:e-7)}return this.day()||7},gn.dayOfYear=function(t){var e=Math.round((this.clone().startOf("day")-this.clone().startOf("year"))/864e5)+1;return null==t?e:this.add(t-e,"d")},gn.hour=gn.hours=Qt,gn.minute=gn.minutes=pn,gn.second=gn.seconds=mn,gn.millisecond=gn.milliseconds=fn,gn.utcOffset=function(t,e,n){var i,s=this._offset||0;if(!this.isValid())return null!=t?this:NaN;if(null!=t){if("string"==typeof t){if(null===(t=Ae(pt,t)))return this}else Math.abs(t)<16&&!n&&(t*=60);return !this._isUTC&&e&&(i=He(this)),this._offset=t,this._isUTC=!0,null!=i&&this.add(i,"m"),s!==t&&(!e||this._changeInProgress?Ge(this,Be(t-s,"m"),1,!1):this._changeInProgress||(this._changeInProgress=!0,r.updateOffset(this,!0),this._changeInProgress=null)),this}return this._isUTC?s:He(this)},gn.utc=function(t){return this.utcOffset(0,t)},gn.local=function(t){return this._isUTC&&(this.utcOffset(0,t),this._isUTC=!1,t&&this.subtract(He(this),"m")),this},gn.parseZone=function(){if(null!=this._tzm)this.utcOffset(this._tzm,!1,!0);else if("string"==typeof this._i){var t=Ae(ht,this._i);null!=t?this.utcOffset(t):this.utcOffset(0,!0);}return this},gn.hasAlignedHourOffset=function(t){return !!this.isValid()&&(t=t?Me(t).utcOffset():0,(this.utcOffset()-t)%60==0)},gn.isDST=function(){return this.utcOffset()>this.clone().month(0).utcOffset()||this.utcOffset()>this.clone().month(5).utcOffset()},gn.isLocal=function(){return !!this.isValid()&&!this._isUTC},gn.isUtcOffset=function(){return !!this.isValid()&&this._isUTC},gn.isUtc=Fe,gn.isUTC=Fe,gn.zoneAbbr=function(){return this._isUTC?"UTC":""},gn.zoneName=function(){return this._isUTC?"Coordinated Universal Time":""},gn.dates=x("dates accessor is deprecated. Use date instead.",hn),gn.months=x("months accessor is deprecated. Use month instead",Yt),gn.years=x("years accessor is deprecated. Use year instead",Lt),gn.zone=x("moment().zone is deprecated, use moment().utcOffset instead. http://momentjs.com/guides/#/warnings/zone/",(function(t,e){return null!=t?("string"!=typeof t&&(t=-t),this.utcOffset(t,e),this):-this.utcOffset()})),gn.isDSTShifted=x("isDSTShifted is deprecated. See http://momentjs.com/guides/#/warnings/dst-shifted/ for more information",(function(){if(!l(this._isDSTShifted))return this._isDSTShifted;var t,e={};return k(e,this),(e=xe(e))._a?(t=e._isUTC?f(e._a):Me(e._a),this._isDSTShifted=this.isValid()&&function(t,e,n){var r,i=Math.min(t.length,e.length),s=Math.abs(t.length-e.length),a=0;for(r=0;r<i;r++)(n&&t[r]!==e[r]||!n&&z(t[r])!==z(e[r]))&&a++;return a+s}(e._a,t.toArray())>0):this._isDSTShifted=!1,this._isDSTShifted}));var vn=Y.prototype;function kn(t,e,n,r){var i=ue(),s=f().set(r,e);return i[n](s,t)}function Sn(t,e,n){if(c(t)&&(e=t,t=void 0),t=t||"",null!=e)return kn(t,e,n,"month");var r,i=[];for(r=0;r<12;r++)i[r]=kn(t,r,n,"month");return i}function wn(t,e,n,r){"boolean"==typeof t?(c(e)&&(n=e,e=void 0),e=e||""):(n=e=t,t=!1,c(e)&&(n=e,e=void 0),e=e||"");var i,s=ue(),a=t?s._week.dow:0,o=[];if(null!=n)return kn(e,(n+a)%7,r,"day");for(i=0;i<7;i++)o[i]=kn(e,(i+a)%7,r,"day");return o}vn.calendar=function(t,e,n){var r=this._calendar[t]||this._calendar.sameElse;return O(r)?r.call(e,n):r},vn.longDateFormat=function(t){var e=this._longDateFormat[t],n=this._longDateFormat[t.toUpperCase()];return e||!n?e:(this._longDateFormat[t]=n.match(C).map((function(t){return "MMMM"===t||"MM"===t||"DD"===t||"dddd"===t?t.slice(1):t})).join(""),this._longDateFormat[t])},vn.invalidDate=function(){return this._invalidDate},vn.ordinal=function(t){return this._ordinal.replace("%d",t)},vn.preparse=_n,vn.postformat=_n,vn.relativeTime=function(t,e,n,r){var i=this._relativeTime[n];return O(i)?i(t,e,n,r):i.replace(/%d/i,t)},vn.pastFuture=function(t,e){var n=this._relativeTime[t>0?"future":"past"];return O(n)?n(e):n.replace(/%s/i,e)},vn.set=function(t){var e,n;for(n in t)a(t,n)&&(O(e=t[n])?this[n]=e:this["_"+n]=e);this._config=t,this._dayOfMonthOrdinalParseLenient=new RegExp((this._dayOfMonthOrdinalParse.source||this._ordinalParse.source)+"|"+/\d{1,2}/.source);},vn.eras=function(t,e){var n,i,s,a=this._eras||ue("en")._eras;for(n=0,i=a.length;n<i;++n){switch(typeof a[n].since){case"string":s=r(a[n].since).startOf("day"),a[n].since=s.valueOf();}switch(typeof a[n].until){case"undefined":a[n].until=1/0;break;case"string":s=r(a[n].until).startOf("day").valueOf(),a[n].until=s.valueOf();}}return a},vn.erasParse=function(t,e,n){var r,i,s,a,o,u=this.eras();for(t=t.toUpperCase(),r=0,i=u.length;r<i;++r)if(s=u[r].name.toUpperCase(),a=u[r].abbr.toUpperCase(),o=u[r].narrow.toUpperCase(),n)switch(e){case"N":case"NN":case"NNN":if(a===t)return u[r];break;case"NNNN":if(s===t)return u[r];break;case"NNNNN":if(o===t)return u[r]}else if([s,a,o].indexOf(t)>=0)return u[r]},vn.erasConvertYear=function(t,e){var n=t.since<=t.until?1:-1;return void 0===e?r(t.since).year():r(t.since).year()+(e-t.offset)*n},vn.erasAbbrRegex=function(t){return a(this,"_erasAbbrRegex")||on.call(this),t?this._erasAbbrRegex:this._erasRegex},vn.erasNameRegex=function(t){return a(this,"_erasNameRegex")||on.call(this),t?this._erasNameRegex:this._erasRegex},vn.erasNarrowRegex=function(t){return a(this,"_erasNarrowRegex")||on.call(this),t?this._erasNarrowRegex:this._erasRegex},vn.months=function(t,e){return t?i(this._months)?this._months[t.month()]:this._months[(this._months.isFormat||Pt).test(e)?"format":"standalone"][t.month()]:i(this._months)?this._months:this._months.standalone},vn.monthsShort=function(t,e){return t?i(this._monthsShort)?this._monthsShort[t.month()]:this._monthsShort[Pt.test(e)?"format":"standalone"][t.month()]:i(this._monthsShort)?this._monthsShort:this._monthsShort.standalone},vn.monthsParse=function(t,e,n){var r,i,s;if(this._monthsParseExact)return Ot.call(this,t,e,n);for(this._monthsParse||(this._monthsParse=[],this._longMonthsParse=[],this._shortMonthsParse=[]),r=0;r<12;r++){if(i=f([2e3,r]),n&&!this._longMonthsParse[r]&&(this._longMonthsParse[r]=new RegExp("^"+this.months(i,"").replace(".","")+"$","i"),this._shortMonthsParse[r]=new RegExp("^"+this.monthsShort(i,"").replace(".","")+"$","i")),n||this._monthsParse[r]||(s="^"+this.months(i,"")+"|^"+this.monthsShort(i,""),this._monthsParse[r]=new RegExp(s.replace(".",""),"i")),n&&"MMMM"===e&&this._longMonthsParse[r].test(t))return r;if(n&&"MMM"===e&&this._shortMonthsParse[r].test(t))return r;if(!n&&this._monthsParse[r].test(t))return r}},vn.monthsRegex=function(t){return this._monthsParseExact?(a(this,"_monthsRegex")||Et.call(this),t?this._monthsStrictRegex:this._monthsRegex):(a(this,"_monthsRegex")||(this._monthsRegex=Dt),this._monthsStrictRegex&&t?this._monthsStrictRegex:this._monthsRegex)},vn.monthsShortRegex=function(t){return this._monthsParseExact?(a(this,"_monthsRegex")||Et.call(this),t?this._monthsShortStrictRegex:this._monthsShortRegex):(a(this,"_monthsShortRegex")||(this._monthsShortRegex=Mt),this._monthsShortStrictRegex&&t?this._monthsShortStrictRegex:this._monthsShortRegex)},vn.week=function(t){return Ht(t,this._week.dow,this._week.doy).week},vn.firstDayOfYear=function(){return this._week.doy},vn.firstDayOfWeek=function(){return this._week.dow},vn.weekdays=function(t,e){var n=i(this._weekdays)?this._weekdays:this._weekdays[t&&!0!==t&&this._weekdays.isFormat.test(e)?"format":"standalone"];return !0===t?jt(n,this._week.dow):t?n[t.day()]:n},vn.weekdaysMin=function(t){return !0===t?jt(this._weekdaysMin,this._week.dow):t?this._weekdaysMin[t.day()]:this._weekdaysMin},vn.weekdaysShort=function(t){return !0===t?jt(this._weekdaysShort,this._week.dow):t?this._weekdaysShort[t.day()]:this._weekdaysShort},vn.weekdaysParse=function(t,e,n){var r,i,s;if(this._weekdaysParseExact)return zt.call(this,t,e,n);for(this._weekdaysParse||(this._weekdaysParse=[],this._minWeekdaysParse=[],this._shortWeekdaysParse=[],this._fullWeekdaysParse=[]),r=0;r<7;r++){if(i=f([2e3,1]).day(r),n&&!this._fullWeekdaysParse[r]&&(this._fullWeekdaysParse[r]=new RegExp("^"+this.weekdays(i,"").replace(".","\\.?")+"$","i"),this._shortWeekdaysParse[r]=new RegExp("^"+this.weekdaysShort(i,"").replace(".","\\.?")+"$","i"),this._minWeekdaysParse[r]=new RegExp("^"+this.weekdaysMin(i,"").replace(".","\\.?")+"$","i")),this._weekdaysParse[r]||(s="^"+this.weekdays(i,"")+"|^"+this.weekdaysShort(i,"")+"|^"+this.weekdaysMin(i,""),this._weekdaysParse[r]=new RegExp(s.replace(".",""),"i")),n&&"dddd"===e&&this._fullWeekdaysParse[r].test(t))return r;if(n&&"ddd"===e&&this._shortWeekdaysParse[r].test(t))return r;if(n&&"dd"===e&&this._minWeekdaysParse[r].test(t))return r;if(!n&&this._weekdaysParse[r].test(t))return r}},vn.weekdaysRegex=function(t){return this._weekdaysParseExact?(a(this,"_weekdaysRegex")||qt.call(this),t?this._weekdaysStrictRegex:this._weekdaysRegex):(a(this,"_weekdaysRegex")||(this._weekdaysRegex=Ut),this._weekdaysStrictRegex&&t?this._weekdaysStrictRegex:this._weekdaysRegex)},vn.weekdaysShortRegex=function(t){return this._weekdaysParseExact?(a(this,"_weekdaysRegex")||qt.call(this),t?this._weekdaysShortStrictRegex:this._weekdaysShortRegex):(a(this,"_weekdaysShortRegex")||(this._weekdaysShortRegex=$t),this._weekdaysShortStrictRegex&&t?this._weekdaysShortStrictRegex:this._weekdaysShortRegex)},vn.weekdaysMinRegex=function(t){return this._weekdaysParseExact?(a(this,"_weekdaysRegex")||qt.call(this),t?this._weekdaysMinStrictRegex:this._weekdaysMinRegex):(a(this,"_weekdaysMinRegex")||(this._weekdaysMinRegex=Gt),this._weekdaysMinStrictRegex&&t?this._weekdaysMinStrictRegex:this._weekdaysMinRegex)},vn.isPM=function(t){return "p"===(t+"").toLowerCase().charAt(0)},vn.meridiem=function(t,e,n){return t>11?n?"pm":"PM":n?"am":"AM"},ae("en",{eras:[{since:"0001-01-01",until:1/0,offset:1,name:"Anno Domini",narrow:"AD",abbr:"AD"},{since:"0000-12-31",until:-1/0,offset:1,name:"Before Christ",narrow:"BC",abbr:"BC"}],dayOfMonthOrdinalParse:/\d{1,2}(th|st|nd|rd)/,ordinal:function(t){var e=t%10;return t+(1===z(t%100/10)?"th":1===e?"st":2===e?"nd":3===e?"rd":"th")}}),r.lang=x("moment.lang is deprecated. Use moment.locale instead.",ae),r.langData=x("moment.langData is deprecated. Use moment.localeData instead.",ue);var bn=Math.abs;function xn(t,e,n,r){var i=Be(e,n);return t._milliseconds+=r*i._milliseconds,t._days+=r*i._days,t._months+=r*i._months,t._bubble()}function Pn(t){return t<0?Math.floor(t):Math.ceil(t)}function Mn(t){return 4800*t/146097}function Dn(t){return 146097*t/4800}function On(t){return function(){return this.as(t)}}var Nn=On("ms"),Yn=On("s"),En=On("m"),Cn=On("h"),Ln=On("d"),Tn=On("w"),In=On("M"),An=On("Q"),Rn=On("y");function Hn(t){return function(){return this.isValid()?this._data[t]:NaN}}var Fn=Hn("milliseconds"),jn=Hn("seconds"),Wn=Hn("minutes"),Bn=Hn("hours"),Vn=Hn("days"),Un=Hn("months"),$n=Hn("years"),Gn=Math.round,zn={ss:44,s:45,m:45,h:22,d:26,w:null,M:11};function qn(t,e,n,r,i){return i.relativeTime(e||1,!!n,t,r)}var Zn=Math.abs;function Kn(t){return (t>0)-(t<0)||+t}function Jn(){if(!this.isValid())return this.localeData().invalidDate();var t,e,n,r,i,s,a,o,u=Zn(this._milliseconds)/1e3,l=Zn(this._days),c=Zn(this._months),h=this.asSeconds();return h?(t=G(u/60),e=G(t/60),u%=60,t%=60,n=G(c/12),c%=12,r=u?u.toFixed(3).replace(/\.?0+$/,""):"",i=h<0?"-":"",s=Kn(this._months)!==Kn(h)?"-":"",a=Kn(this._days)!==Kn(h)?"-":"",o=Kn(this._milliseconds)!==Kn(h)?"-":"",i+"P"+(n?s+n+"Y":"")+(c?s+c+"M":"")+(l?a+l+"D":"")+(e||t||u?"T":"")+(e?o+e+"H":"")+(t?o+t+"M":"")+(u?o+r+"S":"")):"P0D"}var Xn=Ee.prototype;return Xn.isValid=function(){return this._isValid},Xn.abs=function(){var t=this._data;return this._milliseconds=bn(this._milliseconds),this._days=bn(this._days),this._months=bn(this._months),t.milliseconds=bn(t.milliseconds),t.seconds=bn(t.seconds),t.minutes=bn(t.minutes),t.hours=bn(t.hours),t.months=bn(t.months),t.years=bn(t.years),this},Xn.add=function(t,e){return xn(this,t,e,1)},Xn.subtract=function(t,e){return xn(this,t,e,-1)},Xn.as=function(t){if(!this.isValid())return NaN;var e,n,r=this._milliseconds;if("month"===(t=W(t))||"quarter"===t||"year"===t)switch(e=this._days+r/864e5,n=this._months+Mn(e),t){case"month":return n;case"quarter":return n/3;case"year":return n/12}else switch(e=this._days+Math.round(Dn(this._months)),t){case"week":return e/7+r/6048e5;case"day":return e+r/864e5;case"hour":return 24*e+r/36e5;case"minute":return 1440*e+r/6e4;case"second":return 86400*e+r/1e3;case"millisecond":return Math.floor(864e5*e)+r;default:throw new Error("Unknown unit "+t)}},Xn.asMilliseconds=Nn,Xn.asSeconds=Yn,Xn.asMinutes=En,Xn.asHours=Cn,Xn.asDays=Ln,Xn.asWeeks=Tn,Xn.asMonths=In,Xn.asQuarters=An,Xn.asYears=Rn,Xn.valueOf=function(){return this.isValid()?this._milliseconds+864e5*this._days+this._months%12*2592e6+31536e6*z(this._months/12):NaN},Xn._bubble=function(){var t,e,n,r,i,s=this._milliseconds,a=this._days,o=this._months,u=this._data;return s>=0&&a>=0&&o>=0||s<=0&&a<=0&&o<=0||(s+=864e5*Pn(Dn(o)+a),a=0,o=0),u.milliseconds=s%1e3,t=G(s/1e3),u.seconds=t%60,e=G(t/60),u.minutes=e%60,n=G(e/60),u.hours=n%24,a+=G(n/24),i=G(Mn(a)),o+=i,a-=Pn(Dn(i)),r=G(o/12),o%=12,u.days=a,u.months=o,u.years=r,this},Xn.clone=function(){return Be(this)},Xn.get=function(t){return t=W(t),this.isValid()?this[t+"s"]():NaN},Xn.milliseconds=Fn,Xn.seconds=jn,Xn.minutes=Wn,Xn.hours=Bn,Xn.days=Vn,Xn.weeks=function(){return G(this.days()/7)},Xn.months=Un,Xn.years=$n,Xn.humanize=function(t,e){if(!this.isValid())return this.localeData().invalidDate();var n,r,i=!1,s=zn;return "object"==typeof t&&(e=t,t=!1),"boolean"==typeof t&&(i=t),"object"==typeof e&&(s=Object.assign({},zn,e),null!=e.s&&null==e.ss&&(s.ss=e.s-1)),n=this.localeData(),r=function(t,e,n,r){var i=Be(t).abs(),s=Gn(i.as("s")),a=Gn(i.as("m")),o=Gn(i.as("h")),u=Gn(i.as("d")),l=Gn(i.as("M")),c=Gn(i.as("w")),h=Gn(i.as("y")),p=s<=n.ss&&["s",s]||s<n.s&&["ss",s]||a<=1&&["m"]||a<n.m&&["mm",a]||o<=1&&["h"]||o<n.h&&["hh",o]||u<=1&&["d"]||u<n.d&&["dd",u];return null!=n.w&&(p=p||c<=1&&["w"]||c<n.w&&["ww",c]),(p=p||l<=1&&["M"]||l<n.M&&["MM",l]||h<=1&&["y"]||["yy",h])[2]=e,p[3]=+t>0,p[4]=r,qn.apply(null,p)}(this,!i,s,n),i&&(r=n.pastFuture(+this,r)),n.postformat(r)},Xn.toISOString=Jn,Xn.toString=Jn,Xn.toJSON=Jn,Xn.locale=Qe,Xn.localeData=en,Xn.toIsoString=x("toIsoString() is deprecated. Please use toISOString() instead (notice the capitals)",Jn),Xn.lang=tn,A("X",0,0,"unix"),A("x",0,0,"valueOf"),ft("x",ct),ft("X",/[+-]?\d+(\.\d{1,3})?/),vt("X",(function(t,e,n){n._d=new Date(1e3*parseFloat(t));})),vt("x",(function(t,e,n){n._d=new Date(z(t));})),
//! moment.js
r.version="2.29.1",t=Me,r.fn=gn,r.min=function(){var t=[].slice.call(arguments,0);return Ne("isBefore",t)},r.max=function(){var t=[].slice.call(arguments,0);return Ne("isAfter",t)},r.now=function(){return Date.now?Date.now():+new Date},r.utc=f,r.unix=function(t){return Me(1e3*t)},r.months=function(t,e){return Sn(t,e,"months")},r.isDate=h,r.locale=ae,r.invalid=g,r.duration=Be,r.isMoment=w,r.weekdays=function(t,e,n){return wn(t,e,n,"weekdays")},r.parseZone=function(){return Me.apply(null,arguments).parseZone()},r.localeData=ue,r.isDuration=Ce,r.monthsShort=function(t,e){return Sn(t,e,"monthsShort")},r.weekdaysMin=function(t,e,n){return wn(t,e,n,"weekdaysMin")},r.defineLocale=oe,r.updateLocale=function(t,e){if(null!=e){var n,r,i=te;null!=ee[t]&&null!=ee[t].parentLocale?ee[t].set(N(ee[t]._config,e)):(null!=(r=se(t))&&(i=r._config),e=N(i,e),null==r&&(e.abbr=t),(n=new Y(e)).parentLocale=ee[t],ee[t]=n),ae(t);}else null!=ee[t]&&(null!=ee[t].parentLocale?(ee[t]=ee[t].parentLocale,t===ae()&&ae(t)):null!=ee[t]&&delete ee[t]);return ee[t]},r.locales=function(){return P(ee)},r.weekdaysShort=function(t,e,n){return wn(t,e,n,"weekdaysShort")},r.normalizeUnits=W,r.relativeTimeRounding=function(t){return void 0===t?Gn:"function"==typeof t&&(Gn=t,!0)},r.relativeTimeThreshold=function(t,e){return void 0!==zn[t]&&(void 0===e?zn[t]:(zn[t]=e,"s"===t&&(zn.ss=e-1),!0))},r.calendarFormat=function(t,e){var n=t.diff(e,"days",!0);return n<-6?"sameElse":n<-1?"lastWeek":n<0?"lastDay":n<1?"sameDay":n<2?"nextDay":n<7?"nextWeek":"sameElse"},r.prototype=gn,r.HTML5_FMT={DATETIME_LOCAL:"YYYY-MM-DDTHH:mm",DATETIME_LOCAL_SECONDS:"YYYY-MM-DDTHH:mm:ss",DATETIME_LOCAL_MS:"YYYY-MM-DDTHH:mm:ss.SSS",DATE:"YYYY-MM-DD",TIME:"HH:mm",TIME_SECONDS:"HH:mm:ss",TIME_MS:"HH:mm:ss.SSS",WEEK:"GGGG-[W]WW",MONTH:"YYYY-MM"},r}();var c=l.exports;var h=Object.freeze({__proto__:null,formatDate:function(t,e,n){if(t=i(t)?t:"",i(n)||a(n)){const r=c(e||new Date);return r.locale(n),r.format(t)}return c(e||new Date).format(t)}});var p=Object.freeze({__proto__:null,classIf:function(t,e){return t?e:""},selectedIf:function(t){return t?"selected":""},checkedIf:function(t){return t?"checked":""},options:function(t,e){const n=e.hash.value||"value",r=e.hash.text||"text",i=e.hash.selected||null;return t.map(t=>{const e=t[n]||"",s=t[r]||"";return `<option value="${e}"${e==i?" selected":""}>${s}</option>`}).join("\n")}});var d,f=Object.freeze({__proto__:null,add:function(t,e){return Number(t)+Number(e)},sub:function(t,e){return Number(t)-Number(e)},ceil:function(t){return Math.ceil(Number(t))},floor:function(t){return Math.floor(Number(t))},abs:function(t){return Math.abs(Number(t))}}),m={};
/*! sprintf-js v1.1.2 | Copyright (c) 2007-present, Alexandru Mărășteanu <hello@alexei.ro> | BSD-3-Clause */
d=m,function(){var t={not_string:/[^s]/,not_bool:/[^t]/,not_type:/[^T]/,not_primitive:/[^v]/,number:/[diefg]/,numeric_arg:/[bcdiefguxX]/,json:/[j]/,not_json:/[^j]/,text:/^[^\x25]+/,modulo:/^\x25{2}/,placeholder:/^\x25(?:([1-9]\d*)\$|\(([^)]+)\))?(\+)?(0|'[^$])?(-)?(\d+)?(?:\.(\d+))?([b-gijostTuvxX])/,key:/^([a-z_][a-z_\d]*)/i,key_access:/^\.([a-z_][a-z_\d]*)/i,index_access:/^\[(\d+)\]/,sign:/^[+-]/};function e(n){return function(n,r){var i,s,a,o,u,l,c,h,p,d=1,f=n.length,m="";for(s=0;s<f;s++)if("string"==typeof n[s])m+=n[s];else if("object"==typeof n[s]){if((o=n[s]).keys)for(i=r[d],a=0;a<o.keys.length;a++){if(null==i)throw new Error(e('[sprintf] Cannot access property "%s" of undefined value "%s"',o.keys[a],o.keys[a-1]));i=i[o.keys[a]];}else i=o.param_no?r[o.param_no]:r[d++];if(t.not_type.test(o.type)&&t.not_primitive.test(o.type)&&i instanceof Function&&(i=i()),t.numeric_arg.test(o.type)&&"number"!=typeof i&&isNaN(i))throw new TypeError(e("[sprintf] expecting number but found %T",i));switch(t.number.test(o.type)&&(h=0<=i),o.type){case"b":i=parseInt(i,10).toString(2);break;case"c":i=String.fromCharCode(parseInt(i,10));break;case"d":case"i":i=parseInt(i,10);break;case"j":i=JSON.stringify(i,null,o.width?parseInt(o.width):0);break;case"e":i=o.precision?parseFloat(i).toExponential(o.precision):parseFloat(i).toExponential();break;case"f":i=o.precision?parseFloat(i).toFixed(o.precision):parseFloat(i);break;case"g":i=o.precision?String(Number(i.toPrecision(o.precision))):parseFloat(i);break;case"o":i=(parseInt(i,10)>>>0).toString(8);break;case"s":i=String(i),i=o.precision?i.substring(0,o.precision):i;break;case"t":i=String(!!i),i=o.precision?i.substring(0,o.precision):i;break;case"T":i=Object.prototype.toString.call(i).slice(8,-1).toLowerCase(),i=o.precision?i.substring(0,o.precision):i;break;case"u":i=parseInt(i,10)>>>0;break;case"v":i=i.valueOf(),i=o.precision?i.substring(0,o.precision):i;break;case"x":i=(parseInt(i,10)>>>0).toString(16);break;case"X":i=(parseInt(i,10)>>>0).toString(16).toUpperCase();}t.json.test(o.type)?m+=i:(!t.number.test(o.type)||h&&!o.sign?p="":(p=h?"+":"-",i=i.toString().replace(t.sign,"")),l=o.pad_char?"0"===o.pad_char?"0":o.pad_char.charAt(1):" ",c=o.width-(p+i).length,u=o.width&&0<c?l.repeat(c):"",m+=o.align?p+i+u:"0"===l?p+u+i:u+p+i);}return m}(function(e){if(r[e])return r[e];for(var n,i=e,s=[],a=0;i;){if(null!==(n=t.text.exec(i)))s.push(n[0]);else if(null!==(n=t.modulo.exec(i)))s.push("%");else {if(null===(n=t.placeholder.exec(i)))throw new SyntaxError("[sprintf] unexpected placeholder");if(n[2]){a|=1;var o=[],u=n[2],l=[];if(null===(l=t.key.exec(u)))throw new SyntaxError("[sprintf] failed to parse named argument key");for(o.push(l[1]);""!==(u=u.substring(l[0].length));)if(null!==(l=t.key_access.exec(u)))o.push(l[1]);else {if(null===(l=t.index_access.exec(u)))throw new SyntaxError("[sprintf] failed to parse named argument key");o.push(l[1]);}n[2]=o;}else a|=2;if(3===a)throw new Error("[sprintf] mixing positional and named placeholders is not (yet) supported");s.push({placeholder:n[0],param_no:n[1],keys:n[2],sign:n[3],pad_char:n[4],align:n[5],width:n[6],precision:n[7],type:n[8]});}i=i.substring(n[0].length);}return r[e]=s}(n),arguments)}function n(t,n){return e.apply(null,[t].concat(n||[]))}var r=Object.create(null);d.sprintf=e,d.vsprintf=n,"undefined"!=typeof window&&(window.sprintf=e,window.vsprintf=n);}();var y=Object.freeze({__proto__:null,slice:function(t,e,n){return "string"!=typeof t||"number"!=typeof e||t.length<e?t:"number"!=typeof n?t.slice(e):t.slice(e,n)},nltobr:function(t){return t.replace(/\r?\n|\r/g,"<br>")},sprintf:function(t,...e){const n=[];for(let t of e)s(t)&&s(t.hash)&&(t=t.hash),n.push(t);return n.length>0?m.vsprintf(t,n):t},lowercase:function(t){return i(t)?t.toLowerCase():t},uppercase:function(t){return i(t)?t.toUpperCase():t},concat:function(...t){return s(t[t.length-1])&&t.pop(),t.join("")},join:function(t,e){return e&&!s(e)||(e=""),!!a(t)&&t.join(e)}});for(let t of [u,h,p,f,y])for(let[e,n]of Object.entries(t))r.registerHelper(e,n);

/**
 * PDF LIVE component class.
 */
class PdfLive extends HTMLElement {
    /** @type {LoadingModal} */
    loadingModal = new LoadingModal(this);
    /** @type {ErrorModal} */
    errorModal = new ErrorModal(this);
    /** @type {Language} */
    language;
    /** @type {boolean} */
    loaded = false;
    /** @type {boolean} */
    calledLoadHandler = false;
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
    async connectedCallback() {
        try {
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
            const standardViewport = await (async () => {
                const { width, height } = (await pdfDoc.getPage(1)).getViewport({ scale: 1.5 * 1.0 });
                return { width, height };
            })();
            // Initialize zoom menu.
            const zoomNav = (new ZoomNav(this, standardViewport)).onChange((zoomFactor) => {
                // Change the zoom factor of the page when the zoom is changed.
                // Resize page.
                resizePage(pages, zoomFactor);
            });
            // Render pages.
            const pages = await renderPages(pdfDoc, zoomNav.getZoomFactor());
            // Initialize the left panel.
            const leftPanel = (new LeftPanel(this, pages)).onSelect((pageNum) => {
                // Thumbnail selection event.
                // View the page corresponding to the selected thumbnail in the viewer.
                pageNav.activatePage(pageNum);
            });
            // Initialize page navigation.
            const pageNav = (new PageNav(this, pdfDoc.numPages)).onChange((pageNum) => {
                // If the page you are browsing changes.
                // Activate the thumbnail page of the browsing page.
                leftPanel.activatePage(pageNum);
                // Invoke pagechange event.
                this.invoke('pageChange', { pageNum });
            });
            // Print PDF.
            this.querySelector('[data-element="printButton"]').addEventListener('click', async () => {
                await printPdf(url);
                // await printPdf(pdfDoc);
            }, { passive: true });
            // Download PDF.
            this.querySelector('[data-element="downloadButton"]').addEventListener('click', async () => {
                await downloadPdf(pdfDoc, getFilename(url));
            }, { passive: true });
            // Show page container after successful loading of PDF.
            this.querySelector('[data-element="pagegContainer"]').classList.remove('pl-page-container-hide');
            // Check if the event has already been executed so that the documentLoaded event is not executed twice.
            if (!this.calledLoadHandler)
                // Invoke PDF document loaded event.
                this.invoke('documentLoaded');
            // Turn on the document loaded flag.
            this.loaded = true;
        }
        catch (err) {
            let message = 'Unknown Error';
            if (err instanceof BadDocumentError)
                message = this.language.message.badDocument;
            else if (err instanceof Error)
                message = err.message;
            else
                message = String(err);
            this.errorModal.show(message);
            throw err;
        }
        finally {
            // Hide loading.
            this.loadingModal.hide();
        }
    }
    /**
     * Define elements
     *
     * @return {PdfLive}
     */
    static define() {
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
    static createElement() {
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
    on(type, listener, options = { once: false }) {
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
    off(type, listener) {
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
    invoke(type, detail = {}) {
        const evnt = new CustomEvent(type, { detail });
        this.dispatchEvent(evnt);
    }
    /**
     * Render viewer.
     */
    renderViewer() {
        this.insertAdjacentHTML('beforeend', r.compile(`<!-- begin:Header -->
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
        <iframe data-element="printFrame" style="display: none;"></iframe>`)({ language: this.language }));
    }
}
PdfLive.define();

module.exports = PdfLive;
