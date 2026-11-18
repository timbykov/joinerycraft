(function () {
  'use strict';
  var doc = document.documentElement;
  doc.classList.remove('no-js');
  doc.classList.add('js');

  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  /* Mobile menu */
  var toggle = document.getElementById('menuToggle');
  var menu = document.getElementById('mobileMenu');
  function setMenu(open) {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.hidden = !open;
  }
  if (toggle && menu) {
    toggle.addEventListener('click', function () { setMenu(menu.hidden); });
    menu.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  }

  /* Project filters */
  var filters = document.querySelectorAll('.filter');
  var tiles = document.querySelectorAll('.tile');
  function applyFilter(cat) {
    filters.forEach(function (f) {
      var on = f.dataset.filter === cat;
      f.classList.toggle('is-active', on);
      f.setAttribute('aria-pressed', String(on));
    });
    currentCat = cat;
    var limit = expanded ? Infinity : (window.innerWidth < 640 ? 6 : 9);
    var shown = 0, total = 0;
    tiles.forEach(function (t) {
      var match = cat === 'all' || t.dataset.cat === cat;
      if (match) total++;
      t.hidden = !(match && shown < limit);
      if (!t.hidden) shown++;
    });
    if (moreBtn) {
      moreBtn.hidden = shown >= total;
      moreBtn.textContent = 'Show ' + (total - shown) + ' more project' + (total - shown === 1 ? '' : 's');
    }
  }
  var currentCat = 'all', expanded = false;
  var moreBtn = document.getElementById('moreProjects');
  if (moreBtn) {
    moreBtn.addEventListener('click', function () {
      var firstNew = null;
      expanded = true;
      var before = Array.prototype.filter.call(tiles, function (t) { return !t.hidden; });
      applyFilter(currentCat);
      tiles.forEach(function (t) { if (!t.hidden && before.indexOf(t) === -1 && !firstNew) firstNew = t; });
      if (firstNew) firstNew.querySelector('.tile-btn').focus({ preventScroll: true });
    });
    applyFilter('all');
  }
  filters.forEach(function (f) { f.addEventListener('click', function () { applyFilter(f.dataset.filter); }); });
  document.querySelectorAll('[data-filter-link]').forEach(function (a) {
    a.addEventListener('click', function () { applyFilter(a.dataset.filterLink); });
  });

  /* Lightbox */
  var lb = document.getElementById('lightbox');
  var lbImg = document.getElementById('lbImg');
  var lbCap = document.getElementById('lbCap');
  var current = -1;
  var lastFocus = null;
  function visibleButtons() {
    return Array.prototype.filter.call(document.querySelectorAll('.tile-btn'), function (b) { return !b.closest('.tile').hidden; });
  }
  function show(i) {
    var list = visibleButtons();
    if (!list.length) return;
    current = (i + list.length) % list.length;
    var b = list[current];
    lbImg.src = b.dataset.full;
    lbImg.alt = b.querySelector('img').alt;
    lbCap.textContent = b.dataset.caption;
    if (b.dataset.ig) {
      var a = document.createElement('a');
      a.href = b.dataset.ig; a.target = '_blank'; a.rel = 'noopener';
      a.textContent = 'View on Instagram';
      lbCap.appendChild(a);
    }
  }
  function openLb(btn) {
    lastFocus = btn;
    show(visibleButtons().indexOf(btn));
    lb.hidden = false;
    document.body.style.overflow = 'hidden';
    lb.querySelector('.lb-close').focus();
  }
  function closeLb() {
    lb.hidden = true;
    lbImg.src = '';
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  }
  document.querySelectorAll('.tile-btn').forEach(function (b) { b.addEventListener('click', function () { openLb(b); }); });
  if (lb) {
    lb.querySelector('.lb-close').addEventListener('click', closeLb);
    lb.querySelector('.lb-prev').addEventListener('click', function () { show(current - 1); });
    lb.querySelector('.lb-next').addEventListener('click', function () { show(current + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) closeLb(); });
    document.addEventListener('keydown', function (e) {
      if (lb.hidden) return;
      if (e.key === 'Escape') closeLb();
      if (e.key === 'ArrowLeft') show(current - 1);
      if (e.key === 'ArrowRight') show(current + 1);
    });
    var touchX = null;
    lb.addEventListener('touchstart', function (e) { touchX = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      if (touchX === null) return;
      var dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1));
      touchX = null;
    });
  }

  /* Multi-step quote form */
  var form = document.getElementById('quoteForm');
  if (form) {
    var steps = form.querySelectorAll('.form-step');
    var bars = form.querySelectorAll('.form-progress span');
    var label = document.getElementById('stepLabel');
    var err = document.getElementById('formError');
    var step = 0;

    function go(n) {
      step = n;
      steps.forEach(function (s, i) { s.classList.toggle('is-current', i === n); });
      bars.forEach(function (b, i) { b.classList.toggle('is-done', i <= n); });
      label.textContent = 'Step ' + (n + 1) + ' of ' + steps.length;
      err.innerHTML = ''; shown = false;
      var nav = steps[n].querySelector('.form-nav');
      if (nav) nav.parentNode.insertBefore(err, nav.nextSibling);
      var first = steps[n].querySelector('input:not([type=hidden]), select, textarea');
      if (first && n > 0) first.focus({ preventScroll: true });
    }

    /* Errors: each field with a problem gets a red outline, a tinted background and a message
       under it; a summary next to the button links to each one. Fixing a field clears it straight away. */
    var ICON = '<svg class="err-icon" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="8" fill="currentColor"/><path d="M8 4v5" stroke="#fff" stroke-width="2" stroke-linecap="round"/><circle cx="8" cy="11.8" r="1.1" fill="#fff"/></svg>';
    var MSG = {
      project: 'Please choose what you are planning.',
      stage: 'Please choose where you are at.',
      timing: 'Please choose when you would like it done.',
      budget: 'Please choose a rough budget.',
      name: 'Please enter your name.',
      suburb: 'Please enter your suburb.',
      phone: 'Please enter a phone number we can call.',
      email: 'Please enter your email address.'
    };
    var NAMES = { project: 'Project', stage: 'Stage', timing: 'Timing', budget: 'Budget', name: 'Name', suburb: 'Suburb', phone: 'Phone', email: 'Email' };
    var shown = false;
    function problem(f) {
      if (f.type === 'radio') return form.querySelector('input[name="' + f.name + '"]:checked') ? '' : MSG[f.name];
      var v = f.value.trim();
      if (!v) return MSG[f.id] || 'Please fill this in.';
      if (f.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Please check your email address, e.g. name@example.com.';
      if (f.type === 'tel' && v.replace(/\D/g, '').length < 8) return 'Please check your phone number.';
      return '';
    }
    function holder(f) { return f.type === 'radio' ? f.closest('.choice-grid') : f.closest('.field'); }
    function mark(f, msg) {
      var h = holder(f), key = f.type === 'radio' ? f.name : f.id;
      if (!h) return;
      h.classList.toggle('has-error', !!msg);
      (f.type === 'radio' ? form.querySelectorAll('input[name="' + f.name + '"]') : [f]).forEach(function (x) { x.setAttribute('aria-invalid', String(!!msg)); });
      var m = document.getElementById(key + '-err');
      if (!m) {
        m = document.createElement('p');
        m.className = 'field-msg';
        m.id = key + '-err';
        h.parentNode.insertBefore(m, h.nextSibling);
        if (f.type !== 'radio') h.appendChild(m);
        (f.type === 'radio' ? form.querySelectorAll('input[name="' + f.name + '"]') : [f]).forEach(function (x) { x.setAttribute('aria-describedby', m.id); });
      }
      m.innerHTML = msg ? ICON + '<span>' + msg + '</span>' : '';
      m.hidden = !msg;
    }
    function fieldsIn(n) {
      var seen = {};
      return Array.prototype.filter.call(steps[n].querySelectorAll('[required]'), function (f) {
        if (f.type !== 'radio') return true;
        if (seen[f.name]) return false;
        return (seen[f.name] = true);
      });
    }
    function summary(bad) {
      if (!bad.length) { err.innerHTML = ''; return; }
      var links = bad.map(function (f) {
        var key = f.type === 'radio' ? f.name : f.id;
        return '<a href="#' + (f.type === 'radio' ? 'quoteForm' : f.id) + '" data-jump="' + key + '">' + (NAMES[key] || key) + '</a>';
      });
      var list = links.length > 1 ? links.slice(0, -1).join(', ') + ' and ' + links[links.length - 1] : links[0];
      err.innerHTML = ICON + '<span>Almost there: please check ' + list + '.</span>';
    }
    function validStep(n) {
      var bad = [];
      fieldsIn(n).forEach(function (f) {
        var msg = problem(f);
        mark(f, msg);
        if (msg) bad.push(f);
      });
      shown = bad.length > 0;
      summary(bad);
      if (bad.length) {
        var f0 = bad[0];
        if (f0.type === 'radio') holder(f0).scrollIntoView({ block: 'center', behavior: 'smooth' });
        else f0.focus();
      }
      return !bad.length;
    }
    function recheck(f) {
      if (!f.required && f.type !== 'radio') return;
      var h = holder(f);
      if (!h || !h.classList.contains('has-error')) { if (!shown) return; }
      mark(f, problem(f));
      if (shown) summary(fieldsIn(step).filter(function (x) { return problem(x); }));
    }
    form.addEventListener('input', function (e) { recheck(e.target); });
    form.addEventListener('change', function (e) { recheck(e.target); });
    err.addEventListener('click', function (e) {
      var a = e.target.closest('[data-jump]');
      if (!a) return;
      e.preventDefault();
      var k = a.dataset.jump, f = document.getElementById(k) || form.querySelector('input[name="' + k + '"]');
      if (!f) return;
      if (f.type === 'radio') { holder(f).scrollIntoView({ block: 'center', behavior: 'smooth' }); f.focus({ preventScroll: true }); }
      else { f.scrollIntoView({ block: 'center', behavior: 'smooth' }); f.focus({ preventScroll: true }); }
    });

    form.querySelectorAll('[data-next]').forEach(function (b) {
      b.addEventListener('click', function () { if (validStep(step)) go(step + 1); });
    });
    form.querySelectorAll('[data-back]').forEach(function (b) {
      b.addEventListener('click', function () { go(step - 1); });
    });
    form.querySelectorAll('input[name=project]').forEach(function (r) {
      r.addEventListener('change', function () { setTimeout(function () { go(1); }, 180); });
    });
    /* Form sending. On Netlify the form posts natively (Netlify Forms).
       Anywhere else (e.g. Cloudflare Pages) it goes to Web3Forms once
       WEB3FORMS_KEY is filled in. Get a free key at web3forms.com using
       the business email; that is where enquiries will arrive. */
    var WEB3FORMS_KEY = 'dc49c959-89b8-4237-a3fa-7b38894c377f';
    var onNetlify = /netlify\.app$/.test(location.hostname) || !WEB3FORMS_KEY;
    if (!onNetlify) {
      var fileField = form.querySelector('input[type=file]');
      if (fileField) {
        fileField.hidden = true; fileField.disabled = true;
        var alt = form.querySelector('.files-alt'); if (alt) alt.hidden = false;
        var fl = form.querySelector('label[for=files]'); if (fl) fl.textContent = 'Photos or plans';
      }
    }
    form.addEventListener('submit', function (e) {
      if (!validStep(2)) { e.preventDefault(); return; }
      if (onNetlify) return;
      e.preventDefault();
      var btn = form.querySelector('button[type=submit]');
      if (btn) { btn.disabled = true; btn.dataset.label = btn.textContent; btn.textContent = 'Sending...'; }
      var data = {};
      new FormData(form).forEach(function (v, k) {
        if (k === 'form-name' || k === 'files' || typeof v !== 'string') return;
        data[k] = data[k] ? data[k] + ', ' + v : v;
      });
      if (data['bot-field']) return;
      delete data['bot-field'];
      data.access_key = WEB3FORMS_KEY;
      data.subject = 'New quote request: ' + (data.project || 'website') + ' (' + (data.suburb || '') + ')';
      data.from_name = 'Joinerycraft website';
      fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(data)
      }).then(function (r) { return r.json(); }).then(function (j) {
        if (!j.success) throw new Error(j.message || 'failed');
        location.href = '/thank-you.html';
      }).catch(function () {
        err.innerHTML = ICON + '<span>Sorry, that did not send. Please try again or call 1300 205 498.</span>';
        if (btn) { btn.disabled = false; btn.textContent = btn.dataset.label; }
      });
    });

    /* Buttons that preselect a project type, e.g. "Book a showroom visit" */
    document.querySelectorAll('[data-project]').forEach(function (a) {
      a.addEventListener('click', function () {
        var r = form.querySelector('input[name=project][value="' + a.dataset.project + '"]');
        if (r) { r.checked = true; go(1); }
      });
    });
    go(0);

    var qp = new URLSearchParams(location.search).get('project');
    if (qp) {
      var pre = form.querySelector('input[name=project][value="' + qp.replace(/"/g, '') + '"]');
      if (pre) { pre.checked = true; go(1); }
    }
  }

  /* Reveal on scroll */
  if ('IntersectionObserver' in window) {
    var els = document.querySelectorAll('.section-head, .service-card, .step, .review, .showroom > *, .quote > *, .faq-list');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    els.forEach(function (el) { el.classList.add('reveal'); io.observe(el); });
  }
})();
