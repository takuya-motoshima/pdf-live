// Highlight the code block.
for (let code of document.querySelectorAll('pre code'))
  hljs.highlightBlock(code);

// Overlay when the sidebar opens.
const sidebar = document.querySelector('[data-element="sidebar"]');
const collapse = new bootstrap.Collapse(sidebar, {toggle: false});

// Show overlay when opening sidebar.
sidebar.addEventListener('shown.bs.collapse', () => {
  document.body.setAttribute('data-offcanvas-sidebar', 'on');
}, {passive: true});

// Hide the overlay when you close the sidebar.
sidebar.addEventListener('hidden.bs.collapse', () => { 
  document.body.removeAttribute('data-offcanvas-sidebar');
}, {passive: true});

// Close the sidebar when the overlay is clicked.
document.querySelector('.sidebar-overlay').addEventListener('click', () => {
  collapse.hide();
}, {passive: true});

// Clipboard.
for (let target of document.querySelectorAll('.btn-clipboard'))
  new ClipboardJS(target, {
    target: trigger => {
      console.log('trigger.nextElementSibling=', trigger.nextElementSibling);
      return trigger.nextElementSibling;
    }
  }).on('success', e => {
    const title = e.trigger.title;
    const icon = e.trigger.querySelector('i');
    const className = icon.className;
    e.clearSelection(),
    e.trigger.title = 'Copied!',
    icon.className = 'fas fa-check';
    setTimeout(() => {
      e.trigger.title = title;
      icon.className = className;
    }, 2000);
  });