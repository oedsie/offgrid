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

/* Off-grid Energiesystemen – bespaarcheck
   Pas hier de uitgangspunten aan als de energieprijzen veranderen. */
(function () {
  var PRIJS_STROOM = 0.27;          // € per kWh
  var PRIJS_GAS = 1.35;             // € per m³
  var TERUGLEVERVERGOEDING = 0.03;  // € per kWh, na het einde van de salderingsregeling

  var root = document.getElementById('bespaarcheck');
  if (!root) return;

  var types = {
    flat:   { kwh: 2000, gas: 650,  pv: 1000 },
    tussen: { kwh: 2700, gas: 1000, pv: 2700 },
    hoek:   { kwh: 3000, gas: 1300, pv: 3100 },
    vrij:   { kwh: 3600, gas: 1900, pv: 4300 }
  };
  var state = { type: 'tussen', has: {} };

  var kwhIn = document.getElementById('bc-kwh');
  var gasIn = document.getElementById('bc-gas');
  var rangeEl = document.getElementById('bc-range');
  var linesEl = document.getElementById('bc-lines');
  var emptyEl = document.getElementById('bc-empty');
  document.getElementById('bc-assump').textContent =
    '€ ' + fmt(PRIJS_STROOM) + ' per kWh, € ' + fmt(PRIJS_GAS) + ' per m³ gas en € ' + fmt(TERUGLEVERVERGOEDING) +
    ' per kWh terugleververgoeding na het einde van de salderingsregeling op 1 januari 2027';

  function fmt(n) { return n.toFixed(2).replace('.', ','); }
  function eur(n) { return '€ ' + Math.round(n).toLocaleString('nl-NL'); }
  function round(n, step) { return Math.round(n / step) * step; }

  function calc() {
    var t = types[state.type], has = state.has;
    var kwh = parseFloat(kwhIn.value) > 0 ? parseFloat(kwhIn.value) : t.kwh;
    var gas = gasIn.value !== '' && parseFloat(gasIn.value) >= 0 ? parseFloat(gasIn.value) : t.gas;
    kwhIn.placeholder = 'Bijv. ' + t.kwh.toLocaleString('nl-NL');
    gasIn.placeholder = 'Bijv. ' + t.gas.toLocaleString('nl-NL');
    var lines = [];
    if (!has.pv) lines.push([state.type === 'flat' ? 'Zonnepanelen (bij een geschikt dak)' : 'Zonnepanelen',
      0.25 * t.pv * PRIJS_STROOM + 0.75 * t.pv * TERUGLEVERVERGOEDING]);
    if (!has.bat) lines.push(['Thuisbatterij', 0.2 * t.pv * (PRIJS_STROOM - TERUGLEVERVERGOEDING)]);
    if (!has.wp && gas > 0) { var saved = 0.5 * gas; lines.push(['Hybride warmtepomp', saved * PRIJS_GAS - saved * 2.5 * PRIJS_STROOM]); }
    if (!has.ems) lines.push([has.ev ? 'Slim regelen met EMS, inclusief slim laden' : 'Slim regelen met EMS',
      0.03 * (kwh * PRIJS_STROOM + gas * PRIJS_GAS) + (has.ev ? 120 : 0)]);
    lines = lines.filter(function (l) { return l[1] > 0; });
    var total = lines.reduce(function (s, l) { return s + l[1]; }, 0);

    linesEl.innerHTML = '';
    lines.forEach(function (l) {
      var li = document.createElement('li');
      li.style.cssText = 'display:flex;justify-content:space-between;gap:16px;padding-bottom:10px;border-bottom:1px solid rgba(28,37,55,0.2)';
      var a = document.createElement('span'); a.textContent = l[0];
      var b = document.createElement('span'); b.textContent = eur(round(l[1], 10)); b.style.cssText = 'font-weight:700;white-space:nowrap';
      li.appendChild(a); li.appendChild(b); linesEl.appendChild(li);
    });
    emptyEl.hidden = lines.length > 0;
    linesEl.hidden = lines.length === 0;
    rangeEl.textContent = total > 0 ? eur(round(total * 0.7, 50)) + ' – ' + eur(round(total, 50)) : 'Al goed op weg';
  }

  root.querySelectorAll('[data-type]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      state.type = btn.getAttribute('data-type');
      root.querySelectorAll('[data-type]').forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
      calc();
    });
  });
  root.querySelectorAll('[data-feat]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var id = btn.getAttribute('data-feat');
      state.has[id] = !state.has[id];
      btn.setAttribute('aria-pressed', String(!!state.has[id]));
      calc();
    });
  });
  kwhIn.addEventListener('input', calc);
  gasIn.addEventListener('input', calc);
  calc();
})();
