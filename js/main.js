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
      err.textContent = '';
      var first = steps[n].querySelector('input:not([type=hidden]), select, textarea');
      if (first && n > 0) first.focus({ preventScroll: true });
    }

    function validStep(n) {
      var s = steps[n];
      if (n === 0) {
        if (!s.querySelector('input[name=project]:checked')) { err.textContent = 'Please choose what you are planning.'; return false; }
        return true;
      }
      var ok = true;
      s.querySelectorAll('[required]').forEach(function (f) {
        var bad = !f.value.trim() || (f.type === 'email' && !/^\S+@\S+\.\S+$/.test(f.value));
        f.classList.toggle('is-invalid', bad);
        f.setAttribute('aria-invalid', String(bad));
        if (bad && ok) { f.focus(); ok = false; }
      });
      if (!ok) err.textContent = 'Please fill in the highlighted fields.';
      return ok;
    }

    form.querySelectorAll('[data-next]').forEach(function (b) {
      b.addEventListener('click', function () { if (validStep(step)) go(step + 1); });
    });
    form.querySelectorAll('[data-back]').forEach(function (b) {
      b.addEventListener('click', function () { go(step - 1); });
    });
    form.querySelectorAll('input[name=project]').forEach(function (r) {
      r.addEventListener('change', function () { setTimeout(function () { go(1); }, 180); });
    });
    form.addEventListener('submit', function (e) {
      if (!validStep(2)) e.preventDefault();
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
