(function () {
  function hideLoader() {
    var screen = document.getElementById('btec-loading-screen');
    if (!screen) return;
    setTimeout(function () {
      screen.classList.add('btec-loaded');
    }, 350);
  }

  if (document.readyState === 'complete') hideLoader();
  else window.addEventListener('load', hideLoader, { once: true });

  // Safety fallback so a failed asset never leaves the site stuck on the loader.
  setTimeout(hideLoader, 3500);
})();
