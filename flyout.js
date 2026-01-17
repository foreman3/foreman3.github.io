(() => {
  const isDesktop = window.matchMedia('(pointer: fine)').matches;
  if (!isDesktop) return;

  const flyout = document.getElementById('flyout-nav');
  const panel = document.getElementById('flyout-panel');

  if (!flyout || !panel) return;

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
