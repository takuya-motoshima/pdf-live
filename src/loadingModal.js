import Modal from './Modal.js';

export default new (class extends Modal {
  render() {
    return `<div class="Modal LoadingModal closed">
              <div class="container">
                <div class="inner-wrapper"></div>
              </div>
            </div>`;
  }
})()