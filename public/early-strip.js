(function () {
  function strip() {
    try {
      document.querySelectorAll("[bis_skin_checked]").forEach(function (el) {
        el.removeAttribute("bis_skin_checked");
      });
    } catch (e) {}
  }

  strip();

  var observer = new MutationObserver(strip);

  function watch() {
    if (!document.documentElement) return;
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["bis_skin_checked"],
    });
  }

  if (document.documentElement) {
    watch();
  } else {
    document.addEventListener("DOMContentLoaded", watch);
  }

  window.addEventListener("load", function () {
    strip();
    window.setTimeout(function () {
      observer.disconnect();
      strip();
    }, 250);
  });
})();
