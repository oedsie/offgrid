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
  var PRIJS_STROOM = 0.27;          // € per kWh, gemiddeld
  var PRIJS_GAS = 1.35;             // € per m³
  var TERUGLEVERVERGOEDING = 0.03;  // € per kWh, na het einde van de salderingsregeling
  var PRIJSVERSCHIL = 0.10;         // € per kWh, verschil tussen dure en goedkope uren bij een dynamisch contract
  var EV_KWH = 2500;                // kWh per jaar die een elektrische auto thuis laadt

  var root = document.getElementById('bespaarcheck');
  if (!root || !document.getElementById('bc-range')) return;

  // kwh = stroomverbruik, gas = gasverbruik, pv = opwek zonnepanelen, bat = batterij in kWh
  var types = {
    flat:   { kwh: 2000, gas: 650,  pv: 1000, bat: 5 },
    tussen: { kwh: 2700, gas: 1000, pv: 2700, bat: 8 },
    hoek:   { kwh: 3000, gas: 1300, pv: 3100, bat: 10 },
    vrij:   { kwh: 3600, gas: 1900, pv: 4300, bat: 12 }
  };
  var state = { type: 'tussen', has: {} };

  var kwhIn = document.getElementById('bc-kwh');
  var gasIn = document.getElementById('bc-gas');
  var rangeEl = document.getElementById('bc-range');
  var linesEl = document.getElementById('bc-lines');
  var emptyEl = document.getElementById('bc-empty');
  document.getElementById('bc-assump').textContent =
    '€ ' + fmt(PRIJS_STROOM) + ' per kWh, € ' + fmt(PRIJS_GAS) + ' per m³ gas, € ' + fmt(TERUGLEVERVERGOEDING) +
    ' per kWh terugleververgoeding na het einde van de salderingsregeling op 1 januari 2027 en voor slim regelen een dynamisch energiecontract';

  function fmt(n) { return n.toFixed(2).replace('.', ','); }
  function eur(n) { return '€ ' + Math.round(n).toLocaleString('nl-NL'); }
  function round(n, step) { return Math.round(n / step) * step; }

  // Waarde van slim regelen, voor het systeem zoals het na het advies is
  function ems(t, kwh, gas, has) {
    var parts = [];
    var wpKwh = has.wp ? t.gas * 3 : (gas > 0 ? 0.5 * gas * 2.5 : 0);
    // 1. Zonnestroom slim inzetten: 10% van de opwek naar eigen gebruik in plaats van terugleveren
    parts.push(['Zonnestroom zelf gebruiken', 0.10 * t.pv * (PRIJS_STROOM - TERUGLEVERVERGOEDING)]);
    // 2. Batterij laden in goedkope uren en ontladen in dure uren: 200 cycli per jaar, 60% van de capaciteit
    parts.push(['Batterij laden als stroom goedkoop is', 200 * 0.6 * t.bat * 0.9 * PRIJSVERSCHIL]);
    // 3. Warmtepomp draait vaker op zonnestroom en in goedkope uren
    if (wpKwh > 0) parts.push(['Warmtepomp op goedkope uren', wpKwh * 0.3 * PRIJSVERSCHIL]);
    // 4. Auto laden in de goedkoopste uren en op zonnestroom
    if (has.ev) parts.push(['Auto slim laden', EV_KWH * 0.8 * PRIJSVERSCHIL]);
    // 5. Inzicht in verbruik en minder sluipverbruik
    parts.push(['Inzicht en minder sluipverbruik', 0.04 * kwh * PRIJS_STROOM]);
    return parts;
  }

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
    if (!has.ems) {
      var parts = ems(t, kwh, gas, has);
      lines.push(['Slim regelen met EMS', parts.reduce(function (s, p) { return s + p[1]; }, 0), parts]);
    }
    lines = lines.filter(function (l) { return l[1] > 0; });
    var total = lines.reduce(function (s, l) { return s + l[1]; }, 0);

    linesEl.innerHTML = '';
    lines.forEach(function (l) {
      var li = document.createElement('li');
      li.style.cssText = 'padding-bottom:10px;border-bottom:1px solid rgba(28,37,55,0.2)';
      var row = document.createElement('div');
      row.style.cssText = 'display:flex;justify-content:space-between;gap:16px';
      var a = document.createElement('span'); a.textContent = l[0];
      var b = document.createElement('span'); b.textContent = eur(round(l[1], 10)); b.style.cssText = 'font-weight:700;white-space:nowrap';
      row.appendChild(a); row.appendChild(b); li.appendChild(row);
      if (l[2]) {
        var sub = document.createElement('ul');
        sub.style.cssText = 'list-style:none;margin:8px 0 0;padding:0 0 0 14px;border-left:2px solid rgba(28,37,55,0.35);display:flex;flex-direction:column;gap:4px;font-size:15px';
        l[2].forEach(function (p) {
          if (p[1] < 5) return;
          var s = document.createElement('li');
          s.style.cssText = 'display:flex;justify-content:space-between;gap:16px';
          var x = document.createElement('span'); x.textContent = p[0];
          var y = document.createElement('span'); y.textContent = eur(round(p[1], 5)); y.style.cssText = 'white-space:nowrap';
          s.appendChild(x); s.appendChild(y); sub.appendChild(s);
        });
        li.appendChild(sub);
      }
      linesEl.appendChild(li);
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

/* Off-grid Energiesystemen – ankerlinks niet onder de vaste header laten vallen
   De kop van elke sectie komt 24px onder de header te staan. */
(function () {
  var header = document.querySelector('header');
  if (!header) return;
  // positie in de pagina zonder animatie-verschuivingen (transforms tellen niet mee)
  function top(n) { var t = 0; while (n) { t += n.offsetTop; n = n.offsetParent; } return t; }
  function update() {
    var h = header.offsetHeight;
    document.querySelectorAll('#top, main [id], section[id]').forEach(function (el) {
      if (top(el) < 2 * h) { el.style.scrollMarginTop = top(el) + 'px'; return; } // bovenaan de pagina: helemaal naar boven
      var kop = el.querySelector('h1, h2');
      var binnen = kop ? top(kop) - top(el) : 0;
      el.style.scrollMarginTop = Math.round(h + 24 - binnen) + 'px';
    });
  }
  update();
  window.addEventListener('resize', update);
  window.addEventListener('load', update);
  // het logo (#top) gaat altijd helemaal naar boven
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href="#top"]');
    if (!a) return;
    e.preventDefault();
    var smooth = !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    window.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'auto' });
    if (history.replaceState) history.replaceState(null, '', '#top');
  });
})();

/* Off-grid Energiesystemen – teamfoto
   Standaard staat "Ons verhaal" open. Klik op een stip (of tab) om een teamlid te tonen.
   De teksten van het team staan in index.html, in het blok met id="team-data". */
(function () {
  var dataEl = document.getElementById('team-data');
  if (!dataEl) return;
  var team = JSON.parse(dataEl.textContent);
  var root = document.getElementById('over-ons');
  var story = document.getElementById('team-story');
  var person = document.getElementById('team-person');
  var els = {
    ai: document.getElementById('team-ai'),
    name: document.getElementById('team-name'),
    role: document.getElementById('team-role'),
    text: document.getElementById('team-text'),
    skills: document.getElementById('team-skills')
  };

  function show(id) {
    var p = team.filter(function (t) { return t.id === id; })[0] || null;
    story.hidden = !!p;
    person.hidden = !p;
    if (p) {
      els.ai.hidden = !p.ai;
      els.name.textContent = p.name;
      els.role.textContent = p.role;
      els.text.innerHTML = '';
      p.text.forEach(function (t) {
        var para = document.createElement('p'); para.style.margin = '0'; para.textContent = t; els.text.appendChild(para);
      });
      if (els.skills) {
        els.skills.innerHTML = '';
        p.skills.forEach(function (s) {
          var li = document.createElement('li'); li.textContent = s; els.skills.appendChild(li);
        });
        els.skills.hidden = p.skills.length === 0;
      }
    }
    var current = p ? p.id : 'verhaal';
    root.querySelectorAll('.og-hot').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-person') === current));
    });
    root.querySelectorAll('.og-tab').forEach(function (b) {
      b.setAttribute('aria-selected', String(b.getAttribute('data-person') === current));
    });
  }

  root.querySelectorAll('[data-person]').forEach(function (b) {
    b.addEventListener('click', function () {
      show(b.getAttribute('data-person'));
      var panel = document.getElementById('team-panel');
      if (panel && window.innerWidth < 1000 && panel.getBoundingClientRect().top > window.innerHeight * 0.6) {
        panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
  show('verhaal');
})();

/* Off-grid Energiesystemen – mobiel menu */
(function () {
  var btn = document.querySelector('.og-burger');
  var menu = document.getElementById('og-mobile-menu');
  if (!btn || !menu) return;
  var path = btn.querySelector('path');
  function set(open) {
    menu.hidden = !open;
    btn.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-label', open ? 'Menu sluiten' : 'Menu openen');
    path.setAttribute('d', open ? 'M6 6l12 12M18 6L6 18' : 'M4 7h16M4 12h16M4 17h16');
  }
  btn.addEventListener('click', function () { set(menu.hidden); });
  menu.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { set(false); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !menu.hidden) { set(false); btn.focus(); } });
  window.addEventListener('resize', function () { if (window.innerWidth > 900) set(false); });
})();

/* Off-grid Energiesystemen – contactformulier
   Aanvragen gaan via FormSubmit naar het adres hieronder. */
(function () {
  var ONTVANGER = 'info@offgridenergiesystemen.nl';
  var form = document.getElementById('og-contact');
  if (!form || !window.fetch) return;
  var btn = document.getElementById('og-contact-btn');
  var status = document.getElementById('og-contact-status');
  function melding(tekst, ok) {
    status.hidden = false;
    status.textContent = tekst;
    status.style.background = ok ? '#E3F6EE' : '#FBE9E9';
    status.style.color = ok ? '#0E6B47' : '#8A1F1F';
    status.style.borderLeft = '4px solid ' + (ok ? '#16BE7D' : '#C0392B');
  }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }
    var data = {};
    new FormData(form).forEach(function (v, k) { data[k] = v; });
    if (data._honey) return; // waarschijnlijk spam
    btn.disabled = true;
    var label = btn.textContent;
    btn.textContent = 'Bezig met versturen…';
    status.hidden = true;
    fetch('https://formsubmit.co/ajax/' + ONTVANGER, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(data)
    }).then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (res) {
        if (!res.ok || String(res.j.success) !== 'true') throw new Error(res.j.message || 'Versturen mislukt');
        form.reset();
        melding('Bedankt voor je aanvraag! We nemen zo snel mogelijk contact met je op.', true);
      })
      .catch(function () {
        melding('Het versturen is niet gelukt. Probeer het later opnieuw of mail ons via ' + ONTVANGER + '.', false);
      })
      .then(function () { btn.disabled = false; btn.textContent = label; });
  });
})();

