(() => {
  const isDesktop = window.matchMedia('(pointer: fine)').matches;
  if (!isDesktop) return;

  const flyout = document.getElementById('flyout-nav');
  const panel = document.getElementById('flyout-panel');
  const toggle = flyout?.querySelector('.flyout-toggle');

  if (!flyout || !panel) return;

  const closeOnOutsideClick = (event) => {
    if (!flyout.classList.contains('is-open')) return;
    if (flyout.contains(event.target)) return;
    flyout.classList.remove('is-open');
  };

  if (toggle) {
    toggle.addEventListener('click', (event) => {
      event.stopPropagation();
      flyout.classList.toggle('is-open');
    });
  }
  document.addEventListener('click', closeOnOutsideClick);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      flyout.classList.remove('is-open');
    }
  });

  fetch('../sidebar.html')
    .then((response) => response.text())
    .then((html) => {
      panel.innerHTML = html;
      flyout.classList.add('is-ready');
      flyout.setAttribute('aria-hidden', 'false');
    })
    .catch(() => {
      flyout.classList.remove('is-ready');
    });
})();
