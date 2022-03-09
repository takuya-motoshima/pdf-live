import Modal from './Modal.js';

export default new (class extends Modal {
  render() {
    return `<div class="pl-modal pl-error-modal closed" data-element="errorModal">
              <div class="pl-modal-container">This is an error</div>
            </div>`;
  }
})()