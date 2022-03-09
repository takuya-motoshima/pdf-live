import Modal from './Modal.js';

export default new (class extends Modal {
  render() {
    return `<div class="pl-modal pl-loading-modal closed">
              <div class="pl-modal-container">
                <div class="pl-loading-modal-spinner"></div>
              </div>
            </div>`;
  }
})()