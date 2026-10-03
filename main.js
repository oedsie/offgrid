/* Off-grid Energiesystemen – scroll-animaties
   Laat elementen met de class "og-reveal" verschijnen zodra ze in beeld komen.
   Werkt in alle moderne browsers (Chrome, Edge, Safari, Firefox). */
(function () {
  var items = document.querySelectorAll('.og-reveal');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduce || !('IntersectionObserver' in window)) {
    items.forEach(function (el) { el.classList.add('is-visible'); });
    return;
  }

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });

  items.forEach(function (el) { observer.observe(el); });
})();
