/* Joinerycraft design creator: controls and the SVG front view. Sizes and cabinet
   positions come from the shared layout model in js/layout.js. */
(function () {
  'use strict';
  var root = document.getElementById('designer');
  if (!root) return;

  function shade(hex, f) {
    var n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    function c(v) { return Math.max(0, Math.min(255, Math.round(f < 1 ? v * f : v + (255 - v) * (f - 1)))); }
    return '#' + ((1 << 24) + (c(r) << 16) + (c(g) << 8) + c(b)).toString(16).slice(1);
  }
  /* Real Polytec and Laminex board colours (js/boards.js) */
  var CABINET = (window.JC_BOARDS || [{ val: 'p-classic-white', name: 'Classic White', brand: 'Polytec', hex: '#f7f6f2' }]).map(function (b) {
    return { val: b.val, name: b.name, brand: b.brand, group: b.group, wood: b.wood, swatch: b.hex, url: b.url, img: b.img, fill: b.wood ? 'url(#w-' + b.val + ')' : b.hex, edge: shade(b.hex, 0.82) };
  });
  function cname(o) { return o.val === 'timber' ? 'timber' : o.brand ? o.brand + ' ' + o.name : o.name.toLowerCase(); }
  function woodDefs() {
    var out = '';
    CABINET.forEach(function (c) {
      if (!c.wood) return;
      out += '<pattern id="w-' + c.val + '" width="60" height="16" patternUnits="userSpaceOnUse"><rect width="60" height="16" fill="' + c.swatch + '"/>' +
        '<path d="M0 4 Q15 2 30 5 T60 4" stroke="' + shade(c.swatch, 0.84) + '" stroke-width="1.4" fill="none"/>' +
        '<path d="M0 11 Q20 13 35 10 T60 12" stroke="' + shade(c.swatch, 1.12) + '" stroke-width="1.2" fill="none"/></pattern>';
    });
    return out;
  }
  /* Real Caesarstone and Quantum Quartz stone colours, plus timber (js/boards.js) */
  var BENCH = (window.JC_STONES || [{ val: 'timber', name: 'Timber', brand: 'Timber', hex: '#c9a06e', group: 'Timber tops' }]).map(function (b) {
    return { val: b.val, name: b.name, brand: b.brand, group: b.group, vein: b.vein, swatch: b.hex, url: b.url, img: b.img, fill: b.val === 'timber' ? 'url(#oak)' : b.vein ? 'url(#v-' + b.val + ')' : b.hex };
  });
  function veinDefs() {
    var out = '';
    BENCH.forEach(function (c) {
      if (!c.vein) return;
      var dark = parseInt(c.swatch.slice(1, 3), 16) < 0x80;
      var v1 = dark ? shade(c.swatch, 1.55) : shade(c.swatch, 0.74), v2 = dark ? shade(c.swatch, 1.3) : shade(c.swatch, 0.86);
      out += '<pattern id="v-' + c.val + '" width="220" height="40" patternUnits="userSpaceOnUse"><rect width="220" height="40" fill="' + c.swatch + '"/>' +
        '<path d="M0 30 C40 22 70 34 110 18 S180 8 220 16" stroke="' + v1 + '" stroke-width="1.3" fill="none"/>' +
        '<path d="M30 0 C60 12 90 6 120 26 S170 38 200 40" stroke="' + v2 + '" stroke-width="1" fill="none"/></pattern>';
    });
    return out;
  }
  var HANDLE = [
    { val: 'black', name: 'Matte black', fill: '#1d1d1d' },
    { val: 'brass', name: 'Brushed brass', fill: '#c4a15a' },
    { val: 'steel', name: 'Brushed steel', fill: '#a9adb1' },
    { val: 'none', name: 'No handles (push to open)', fill: 'none' }
  ];
  var LABELS = {
    door: { flat: 'flat panel doors', shaker: 'shaker doors', fingerpull: 'fingerpull doors' },
    splash: { subway: 'white subway tile splashback', stone: 'matching stone splashback', glass: 'smoked glass splashback' }
  };
  /* room colours, so people can see the joinery against walls and floors like their own */
  var WALLS = [
    { val: 'warm-white', name: 'Warm white', fill: '#efe9e0' },
    { val: 'white', name: 'Bright white', fill: '#f7f7f4' },
    { val: 'greige', name: 'Greige', fill: '#d8cfc2' },
    { val: 'sage', name: 'Soft sage', fill: '#c8cfbe' },
    { val: 'blue', name: 'Pale blue', fill: '#cdd7dc' },
    { val: 'charcoal', name: 'Charcoal', fill: '#55534f' },
    { val: 'tile-white', name: 'White tiles', fill: '#f4f4f1', tile: true }
  ];
  var FLOORS = [
    { val: 'oak-light', name: 'Light oak timber', fill: '#d8c3a2', kind: 'timber' },
    { val: 'oak-mid', name: 'Mid oak timber', fill: '#b68c60', kind: 'timber' },
    { val: 'walnut', name: 'Dark timber', fill: '#6f5038', kind: 'timber' },
    { val: 'stone', name: 'Beige stone tiles', fill: '#d6c8b3', kind: 'tile' },
    { val: 'tile-white', name: 'White tiles', fill: '#ecebe7', kind: 'tile' },
    { val: 'tile-grey', name: 'Grey tiles', fill: '#b6b4af', kind: 'tile' },
    { val: 'concrete', name: 'Polished concrete', fill: '#a9a7a2', kind: 'concrete' }
  ];
  var lists = { cabinet: CABINET, bench: BENCH, handle: HANDLE, wall: WALLS, floor: FLOORS };

  /* starting design follows what is most asked for in 2026: L-shape with an island, timber-look
     base cupboards with white overheads, flat doors, white stone benchtop and splashback */
  var ks = { shape: 'l', wall: 4.2, side: 2.4, bases: 0, island: 'on', islandLen: 2.4, pantry: 'off', fridge: 'on', dishwasher: 'on', overheads: 'full',
    door: 'flat', base: 'p-prime-oak', upper: 'p-classic-white', bench: 'cs-empira-white', splash: 'stone', handle: 'brass', wallC: 'warm-white', floorC: 'oak-light' };
  var ws = { wtype: 'builtin', wdoors: 'hinged', door: 'flat', finish: 'p-prime-oak', internals: 'balanced', light: 'on', handle: 'black',
    width: 2.4, height: 2.4, doorCount: 0, panelCount: 0, bsec: [], showInside: 'off', wshape: 'u', wwidth: 3.2, wside: 1.6, wcount: {}, wsec: {}, wallC: 'warm-white', floorC: 'oak-light' };
  /* laundry: sage green shaker base, white overheads, stacked washer and dryer with a broom cupboard */
  var ls = { lwall: 2.4, machines: 'stacked', broom: 'on', overheads: 'full',
    door: 'shaker', base: 'p-oasis', upper: 'p-classic-white', bench: 'cs-empira-white', splash: 'subway', handle: 'brass', wallC: 'tile-white', floorC: 'tile-white' };
  /* vanity: wall-hung oak with a white stone top, above-counter basin and a round mirror */
  var vs = { vwall: 1.2, mount: 'wall', basins: 'single', vfront: 'drawers', mirror: 'round', tower: 'off',
    door: 'flat', base: 'p-prime-oak', upper: 'p-prime-oak', bench: 'cs-empira-white', handle: 'brass', wallC: 'tile-white', floorC: 'tile-white' };
  var STATES = { kitchen: ks, laundry: ls, vanity: vs, wardrobe: ws };
  var mode = 'kitchen';
  var state = ks;

  /* Build swatch buttons. Board colours get a Polytec / Laminex switch and small dots. */
  function makeSwatch(o, compact) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'opt opt-swatch' + (compact ? ' opt-dot' : '');
    b.dataset.val = o.val;
    b.title = o.brand ? o.brand + ' ' + o.name : o.name;
    b.setAttribute('aria-label', b.title);
    var dot = document.createElement('span');
    dot.className = 'dot' + (o.wood || o.val === 'timber' ? ' dot-wood' : '') + (o.vein ? ' dot-vein' : '');
    if (o.val === 'none') dot.classList.add('dot-none');
    else dot.style.backgroundColor = o.swatch || o.fill;
    b.appendChild(dot);
    if (!compact) {
      var t = document.createElement('span');
      t.className = 'opt-label';
      t.textContent = o.name.replace(' (push to open)', '');
      b.appendChild(t);
    }
    return b;
  }
  root.querySelectorAll('[data-swatches]').forEach(function (row) {
    var kind = row.dataset.swatches;
    var list = lists[kind];
    if (kind === 'handle' || kind === 'wall' || kind === 'floor') {
      lists[kind].forEach(function (o) { row.appendChild(makeSwatch(o)); });
      return;
    }
    row.classList.add('board-picker');
    var brands = [];
    list.forEach(function (o) { if (brands.indexOf(o.brand) === -1) brands.push(o.brand); });
    var tabs = document.createElement('div');
    tabs.className = 'brand-tabs';
    brands.forEach(function (brand, i) {
      var t = document.createElement('button');
      t.type = 'button';
      t.className = 'brand-tab' + (i === 0 ? ' is-active' : '');
      t.textContent = brand;
      t.dataset.brand = brand;
      t.setAttribute('aria-pressed', String(i === 0));
      tabs.appendChild(t);
    });
    row.appendChild(tabs);
    brands.forEach(function (brand, i) {
      var pane = document.createElement('div');
      pane.className = 'brand-pane';
      pane.dataset.brand = brand;
      pane.hidden = i !== 0;
      var lastGroup = null, wrap = null;
      list.forEach(function (o) {
        if (o.brand !== brand) return;
        if (o.group !== lastGroup) {
          lastGroup = o.group;
          var h = document.createElement('p');
          h.className = 'dot-group';
          h.textContent = o.group;
          pane.appendChild(h);
          wrap = document.createElement('div');
          wrap.className = 'dot-row';
          pane.appendChild(wrap);
        }
        wrap.appendChild(makeSwatch(o, true));
      });
      row.appendChild(pane);
    });
    var cur = document.createElement('p');
    cur.className = 'opt-current';
    row.appendChild(cur);
    tabs.addEventListener('click', function (e) {
      var t = e.target.closest('.brand-tab');
      if (t) showBrand(row, t.dataset.brand);
    });
  });
  function showBrand(row, brand) {
    row.querySelectorAll('.brand-tab').forEach(function (t) {
      var on = t.dataset.brand === brand;
      t.classList.toggle('is-active', on);
      t.setAttribute('aria-pressed', String(on));
    });
    row.querySelectorAll('.brand-pane').forEach(function (p) { p.hidden = p.dataset.brand !== brand; });
  }

  function find(list, v) { for (var i = 0; i < list.length; i++) if (list[i].val === v) return list[i]; return list[0]; }

  /* SVG helpers */
  function rect(x, y, w, h, fill, extra) {
    return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + fill + '"' + (extra || '') + '/>';
  }

  function door(x, y, w, h, c, opts) {
    // opts: {drawer, upper, hingeLeft}
    var out = rect(x, y, w, h, c.fill, ' stroke="' + c.edge + '" stroke-width="1.2"');
    var st = state.door;
    if (st === 'shaker') {
      var i = Math.min(9, w * 0.12, h * 0.16);
      out += rect(x + i, y + i, w - 2 * i, h - 2 * i, 'none', ' stroke="' + c.edge + '" stroke-width="2"');
      if (h - 2 * i > 6) out += rect(x + i + 2, y + i + 2, w - 2 * i - 4, h - 2 * i - 4, 'rgba(0,0,0,0.03)');
    }
    if (st === 'fingerpull') {
      var gy = opts.upper ? y + h - 5 : y;
      out += rect(x, gy, w, 5, 'rgba(0,0,0,0.28)');
      return out;
    }
    var hd = find(HANDLE, state.handle);
    if (hd.val === 'none') return out;
    if (opts.drawer) {
      var hw = Math.min(46, w * 0.45);
      out += rect(x + (w - hw) / 2, y + Math.min(14, h * 0.28), hw, 4, hd.fill, ' rx="2"');
    } else {
      var hx = opts.hingeLeft ? x + w - 12 : x + 8;
      var hy = opts.tall ? y + h * 0.42 : opts.upper ? y + h - 46 : y + 12;
      if (opts.tall) { out += rect(hx, hy, 4, 70, hd.fill, ' rx="2"'); return out; }
      out += rect(hx, hy, 4, 34, hd.fill, ' rx="2"');
    }
    return out;
  }

  /* ---------- shared layout model (js/layout.js) ---------- */
  var L = window.JCLayout, DIM = L.dims;
  var model = null;
  function build() { if (mode === 'vanity') vs.upper = vs.base; model = L.build(mode, state); return model; }
  function mm(v) { return Math.round(v * 1000); }

  var DEFS_COMMON = '<pattern id="oak" width="60" height="16" patternUnits="userSpaceOnUse"><rect width="60" height="16" fill="#c9a06e"/><path d="M0 4 Q15 2 30 5 T60 4" stroke="#b48a58" stroke-width="1.4" fill="none"/><path d="M0 11 Q20 13 35 10 T60 12" stroke="#d8b483" stroke-width="1.2" fill="none"/></pattern>' +
    '<pattern id="subway" width="48" height="24" patternUnits="userSpaceOnUse"><rect width="48" height="24" fill="#f7f7f5"/><path d="M0 0.5H48M0 12.5H48M0.5 0V12M24.5 12V24" stroke="#d7d5d0" stroke-width="1"/></pattern>' +
    '<linearGradient id="glass" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#4a4d50"/><stop offset=".5" stop-color="#5d6164"/><stop offset="1" stop-color="#3e4144"/></linearGradient>' +
    '<linearGradient id="mirror" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#dfe5e9"/><stop offset=".45" stop-color="#f6f8f9"/><stop offset=".55" stop-color="#cfd7dc"/><stop offset="1" stop-color="#e6ebee"/></linearGradient>' +
    '<linearGradient id="steelg" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#b9bdc1"/><stop offset=".5" stop-color="#d9dcdf"/><stop offset="1" stop-color="#aeb2b6"/></linearGradient>' +
    '<linearGradient id="led" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#ffe7b0" stop-opacity=".9"/><stop offset="1" stop-color="#ffe7b0" stop-opacity="0"/></linearGradient>' +
    '<linearGradient id="floor" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#d8cdbd"/><stop offset="1" stop-color="#c7b9a5"/></linearGradient>';
  function roomOf(st) { return { wall: find(WALLS, st.wallC), floor: find(FLOORS, st.floorC) }; }
  function roomFill(SW, SH, floorY) {
    var r = roomOf(state), w = r.wall, f = r.floor, out = '';
    out += '<defs><pattern id="wallTile" width="40" height="40" patternUnits="userSpaceOnUse"><rect width="40" height="40" fill="' + w.fill + '"/><path d="M0 .5H40M.5 0V40" stroke="#dcdad4" stroke-width="1"/></pattern>' +
      '<pattern id="floorPat" width="' + (f.kind === 'timber' ? 120 : 60) + '" height="' + (f.kind === 'timber' ? 14 : 18) + '" patternUnits="userSpaceOnUse"><rect width="120" height="18" fill="' + f.fill + '"/>' +
      (f.kind === 'concrete' ? '' : '<path d="M0 .5H120' + (f.kind === 'timber' ? 'M60.5 0V14' : 'M.5 0V18') + '" stroke="' + shade(f.fill, 0.86) + '" stroke-width="1"/>') + '</pattern></defs>';
    out += rect(0, 0, SW, floorY, w.tile ? 'url(#wallTile)' : w.fill) + rect(0, floorY, SW, SH - floorY, 'url(#floorPat)');
    return out + '<rect x="0" y="' + floorY + '" width="' + SW + '" height="' + (SH - floorY) + '" fill="url(#floor)" opacity=".25"/>';
  }
  function svgOpen(W, H) {
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet"><defs>' + DEFS_COMMON + woodDefs() + veinDefs() + '</defs>';
  }
  function txt(x, y, s, anchor, size) {
    return '<text x="' + x + '" y="' + y + '" font-size="' + (size || 12) + '" font-family="Inter, system-ui, sans-serif" font-weight="600" fill="#6b645b" text-anchor="' + (anchor || 'middle') + '">' + s + '</text>';
  }
  /* dimension line with the size in mm */
  function dimH(x0, x1, y, label) {
    return '<path d="M' + x0 + ' ' + (y - 5) + 'V' + (y + 5) + 'M' + x1 + ' ' + (y - 5) + 'V' + (y + 5) + 'M' + x0 + ' ' + y + 'H' + x1 + '" stroke="#8b8378" stroke-width="1"/>' +
      rect((x0 + x1) / 2 - 34, y - 9, 68, 17, '#efe9e0') + txt((x0 + x1) / 2, y + 4, label);
  }
  function dimV(x, y0, y1, label) {
    var my = (y0 + y1) / 2;
    return '<path d="M' + (x - 5) + ' ' + y0 + 'H' + (x + 5) + 'M' + (x - 5) + ' ' + y1 + 'H' + (x + 5) + 'M' + x + ' ' + y0 + 'V' + y1 + '" stroke="#8b8378" stroke-width="1"/>' +
      '<g transform="rotate(-90 ' + x + ' ' + my + ')">' + rect(x - 34, my - 9, 68, 17, '#efe9e0') + txt(x, my + 4, label) + '</g>';
  }
  /* small top-down plan in the corner, so L and U shapes read in the front view */
  function planInset(m) {
    var rw = m.room.w, rd = Math.min(m.room.d, 4.6), bw = 124, bh = 84;
    var k = Math.min((bw - 16) / rw, (bh - 22) / rd), ox = 12 + (bw - rw * k) / 2 + rw * k / 2, oz = 12 + 6;
    var out = '<g class="plan">' + rect(12, 10, bw, bh, 'rgba(255,255,255,.85)', ' rx="8" stroke="#e2dbd0"') +
      '<path d="M' + (ox - rw * k / 2) + ' ' + (oz + rd * k) + 'V' + oz + 'H' + (ox + rw * k / 2) + 'V' + (oz + rd * k) + '" stroke="#8b8378" stroke-width="2" fill="none"/>';
    function poly(pts, fill) {
      return '<polygon points="' + pts.map(function (p) { return (ox + p[0] * k).toFixed(1) + ',' + (oz + p[1] * k).toFixed(1); }).join(' ') + '" fill="' + fill + '"/>';
    }
    m.runs.forEach(function (r) {
      var d = m.kind === 'kitchen' ? 0.6 : 0.6, c = Math.cos(r.rot), s = Math.sin(r.rot);
      var pts = [[0, 0], [r.len, 0], [r.len, d], [0, d]].map(function (p) { return [r.pos[0] + p[0] * c + p[1] * s, r.pos[1] - p[0] * s + p[1] * c]; });
      out += poly(pts, '#9a6232');
    });
    if (m.island) {
      var i = m.island, x0 = i.cx - i.len / 2, z0 = i.z, z1 = i.z + i.depth + i.overhang;
      out += poly([[x0, z0], [x0 + i.len, z0], [x0 + i.len, z1], [x0, z1]], '#c4a172');
    }
    out += txt(12 + bw / 2, 10 + bh - 6, 'Plan view', 'middle', 10);
    return out + '</g>';
  }

  /* ---------- kitchen front view ---------- */
  function renderKitchen() {
    var m = build();
    var base = find(CABINET, state.base), upper = find(CABINET, state.upper), bench = find(BENCH, state.bench);
    var back = m.runs[0], W = back.len;
    var SW = 800, SH = 520, floorY = 446;
    var k = m.kind === 'vanity' ? Math.min(200, 600 / W) : Math.min(150, 640 / W), x0 = (SW - W * k) / 2;
    if (m.shape !== 'straight' || m.island) x0 = Math.max(x0, Math.min(150, SW - 20 - W * k));
    function X(v) { return x0 + v * k; }
    function Y(v) { return floorY - v * k; }
    var svg = svgOpen(SW, SH);
    svg += roomFill(SW, SH, floorY);
    var metal = state.handle === 'brass' ? '#c4a15a' : state.handle === 'steel' ? '#a9adb1' : '#2a2a2a';
    var bTop = DIM.BASE_TOP + DIM.BENCH_T;
    // splashback and benchtop
    var splashFill = state.splash === 'subway' ? 'url(#subway)' : state.splash === 'glass' ? 'url(#glass)' : bench.fill;
    if (back.splash && state.overheads !== 'none') svg += rect(X(back.splash[0]), Y(DIM.UP_BOT), (back.splash[1] - back.splash[0]) * k, (DIM.UP_BOT - bTop) * k, splashFill);
    else if (back.splash) svg += rect(X(back.splash[0]), Y(bTop + 0.3), (back.splash[1] - back.splash[0]) * k, 0.3 * k, splashFill);
    var bH = DIM.BASE_TOP - DIM.KICK;
    function machine2d(x, y0, w, kind) {
      var mw = Math.min(0.6, it2w(w)) * k, mx = x + (w - mw) / 2, mh = 0.84 * k, cy = Y(y0 + 0.38);
      return rect(mx, Y(y0 + 0.84), mw, mh, '#f2f2f0', ' rx="4" stroke="#cfd0cf"') + rect(mx + 6, Y(y0 + 0.8), mw - 12, 5, '#3a3a3a', ' rx="2"') +
        '<circle cx="' + (mx + mw / 2) + '" cy="' + cy + '" r="' + (0.2 * k) + '" fill="#b9bdc1"/><circle cx="' + (mx + mw / 2) + '" cy="' + cy + '" r="' + (0.16 * k) + '" fill="' + (kind === 'dryer' ? '#2b2b2b' : '#4a4d50') + '"/>';
    }
    function it2w(wpx) { return wpx / k - 0.03; }
    back.items.forEach(function (it, i) {
      var x = X(it.x), w = it.w * k;
      if (it.t === 'base' && (it.kind === 'washer' || it.kind === 'dryer')) { svg += machine2d(x, 0, w, it.kind); return; }
      if (it.t === 'base') {
        var top = Y(DIM.BASE_TOP), h = bH * k, dn = it.dn || 3;
        if (it.kind === 'drawers') { for (var q = 0; q < dn; q++) svg += door(x, top + q * h / dn, w, h / dn, base, { drawer: true }); }
        else if (it.kind === 'oven') {
          svg += door(x, top, w, 0.16 * k, base, { drawer: true });
          svg += rect(x + 3, top + 0.17 * k, w - 6, h - 0.18 * k, '#1f1f1f', ' rx="3"') + rect(x + 8, top + 0.22 * k, w - 16, 6, '#3c3c3c', ' rx="2"') + rect(x + 10, top + 0.3 * k, w - 20, h - 0.36 * k, '#2b2b2b', ' rx="2"');
          svg += rect(x + w * 0.12, Y(bTop) - 3, w * 0.76, 3, '#1f1f1f');
        } else if (it.kind === 'dw') svg += door(x, top, w, h, base, { drawer: true });
        else if (it.kind === 'corner') {
          var pw = w * 0.42;
          svg += it.side === 'L' ? rect(x, top, pw, h, base.fill, ' stroke="' + base.edge + '"') + door(x + pw, top, w - pw, h, base, { hingeLeft: false }) :
            door(x, top, w - pw, h, base, { hingeLeft: true }) + rect(x + w - pw, top, pw, h, base.fill, ' stroke="' + base.edge + '"');
        } else if (it.w > 0.65) { svg += door(x, top, w / 2, h, base, { hingeLeft: false }) + door(x + w / 2, top, w / 2, h, base, { hingeLeft: true }); }
        else svg += door(x, top, w, h, base, { hingeLeft: i % 2 === 1 });
        if (it.kind === 'sink' || it.kind === 'tub') {
          var tx = x + w / 2;
          svg += '<path d="M' + tx + ' ' + Y(bTop) + ' V' + (Y(bTop) - 0.24 * k) + ' Q' + tx + ' ' + (Y(bTop) - 0.3 * k) + ' ' + (tx + 10) + ' ' + (Y(bTop) - 0.3 * k) + ' Q' + (tx + 19) + ' ' + (Y(bTop) - 0.3 * k) + ' ' + (tx + 19) + ' ' + (Y(bTop) - 0.22 * k) + '" stroke="' + metal + '" stroke-width="4" fill="none" stroke-linecap="round"/>';
        }
        if (!DIM.FLOAT) svg += rect(x, Y(DIM.KICK), w, DIM.KICK * k, 'rgba(0,0,0,.35)');
      } else if (it.t === 'mirror') {
        if (it.kind === 'cabinet') {
          var nd = it.w > 0.65 ? 2 : 1;
          svg += rect(x, Y(DIM.UP_TOP), w, (DIM.UP_TOP - DIM.UP_BOT) * k, upper.fill, ' stroke="' + upper.edge + '"');
          for (var mq = 0; mq < nd; mq++) svg += rect(x + mq * w / nd + 2, Y(DIM.UP_TOP) + 2, w / nd - 4, (DIM.UP_TOP - DIM.UP_BOT) * k - 4, 'url(#mirror)', ' stroke="#c9cfd3"');
        } else {
          var rr = Math.min(0.32, it.w / 2) * k;
          svg += '<circle cx="' + (x + w / 2) + '" cy="' + Y((DIM.UP_TOP + DIM.UP_BOT) / 2) + '" r="' + rr + '" fill="url(#mirror)" stroke="' + metal + '" stroke-width="4"/>';
        }
      } else if (it.t === 'upper') {
        svg += door(x, Y(DIM.UP_TOP), w, (DIM.UP_TOP - DIM.UP_BOT) * k, upper, { upper: true, hingeLeft: it.hingeLeft });
      } else if (it.t === 'shelf') {
        [1.62, 1.98].forEach(function (sy, j) {
          svg += rect(x, Y(sy), w, 0.035 * k, upper.fill, ' stroke="' + upper.edge + '"');
          for (var p = 0; p < Math.floor(it.w / 0.35); p++) svg += rect(x + 10 + p * 0.35 * k, Y(sy) - (0.12 + (p + j) % 2 * 0.06) * k, 0.12 * k, (0.12 + (p + j) % 2 * 0.06) * k, ['#d9d2c7', '#9aa5ad', '#c8b9a3', '#6f8f5f'][(p + j) % 4], ' rx="3"');
        });
      } else if (it.t === 'hood') {
        svg += rect(x, Y(DIM.UP_TOP), w, (DIM.UP_TOP - 1.78) * k, upper.fill, ' stroke="' + upper.edge + '" stroke-width="1.2"');
        svg += '<path d="M' + (x - 6) + ' ' + Y(1.78) + ' H' + (x + w + 6) + ' L' + (x + w) + ' ' + Y(1.7) + ' H' + x + ' Z" fill="#9b9ea1"/>';
      } else if (it.t === 'tall') {
        var tTop = Y(DIM.TALL_TOP);
        if (it.kind === 'pantry' || it.kind === 'broom' || it.kind === 'linen') {
          var tc = it.kind === 'linen' ? base : upper, th = (DIM.TALL_TOP - DIM.KICK) * k;
          svg += it.w > 0.65 ? door(x, tTop, w / 2, th, tc, { hingeLeft: false, tall: true }) + door(x + w / 2, tTop, w / 2, th, tc, { hingeLeft: true, tall: true }) : door(x, tTop, w, th, tc, { hingeLeft: false, tall: true });
          if (!DIM.FLOAT) svg += rect(x, Y(DIM.KICK), w, DIM.KICK * k, 'rgba(0,0,0,.35)');
        } else if (it.kind === 'stack') {
          svg += door(x, tTop, w, (DIM.TALL_TOP - 1.8) * k, upper, { upper: true, hingeLeft: true });
          svg += rect(x, Y(1.8), w, 1.8 * k, '#d6d0c6') + rect(x, Y(1.8), 3, 1.8 * k, upper.fill) + rect(x + w - 3, Y(1.8), 3, 1.8 * k, upper.fill);
          svg += machine2d(x, 0, w, 'washer') + machine2d(x, 0.88, w, 'dryer');
        } else {
          svg += door(x, tTop, w, 0.3 * k, upper, { upper: true, hingeLeft: true });
          svg += rect(x, Y(1.9), w, 1.9 * k, '#d6d0c6');
          svg += rect(x + 0.04 * k, Y(1.82), w - 0.08 * k, 1.82 * k, 'url(#steelg)', ' rx="3" stroke="#9ea2a6"') + rect(x + 0.04 * k, Y(1.08), w - 0.08 * k, 2, '#8f9397') + rect(x + w / 2 - 8, Y(1.5), 4, 0.3 * k, '#8f9397', ' rx="2"') + rect(x + w / 2 + 4, Y(1.5), 4, 0.3 * k, '#8f9397', ' rx="2"');
        }
      }
    });
    if (back.bench) svg += rect(X(back.bench[0]) - 4, Y(bTop), (back.bench[1] - back.bench[0]) * k + 8, DIM.BENCH_T * k + 1, bench.fill, ' stroke="rgba(0,0,0,.12)"');
    if (DIM.FLOAT) svg += '<ellipse cx="' + X(W / 2) + '" cy="' + (floorY + 4) + '" rx="' + (W * k / 2) + '" ry="6" fill="rgba(0,0,0,.08)"/>';
    (back.basins || []).forEach(function (cx) {
      var bx = X(cx);
      svg += '<path d="M' + bx + ' ' + Y(bTop + 0.3) + ' h-3 M' + (bx - 12) + ' ' + Y(bTop + 0.3) + ' H' + (bx + 4) + '" stroke="' + metal + '" stroke-width="5" stroke-linecap="round"/>';
      svg += '<path d="M' + (bx - 0.2 * k) + ' ' + Y(bTop + 0.13) + ' H' + (bx + 0.2 * k) + ' L' + (bx + 0.15 * k) + ' ' + Y(bTop) + ' H' + (bx - 0.15 * k) + ' Z" fill="#fbfbf9" stroke="#d6d2ca" stroke-width="1.2"/>';
    });
    // side runs seen end-on
    m.runs.forEach(function (r) {
      if (r.id !== 'left' && r.id !== 'right') return;
      var ex = r.id === 'left' ? X(0) - 6 : X(W) - 6;
      svg += rect(ex, Y(DIM.BASE_TOP + DIM.BENCH_T), 6, (DIM.BASE_TOP + DIM.BENCH_T) * k, 'rgba(0,0,0,.18)');
    });
    svg += dimH(X(0), X(W), Y(DIM.UP_TOP) - 18, mm(W) + ' mm');
    // island in front
    if (m.island) {
      var I = m.island, ik = k * 1.04, iy0 = SH - 16;
      var ix = SW / 2 + I.cx * k - I.len * ik / 2, ih = bH * ik;
      var itop = iy0 - DIM.BASE_TOP * ik;
      [-0.75, 0, 0.75].slice(0, Math.min(3, Math.max(1, Math.round(I.len / 0.8)))).forEach(function (off, j, arr) {
        var px = SW / 2 + I.cx * k + (arr.length === 1 ? 0 : (j - (arr.length - 1) / 2) * Math.min(0.75, I.len / 3) * k);
        svg += '<line x1="' + px + '" y1="0" x2="' + px + '" y2="' + (itop - 0.85 * k) + '" stroke="#2a2a2a" stroke-width="1.5"/>';
        svg += '<path d="M' + (px - 16) + ' ' + (itop - 0.72 * k) + ' Q' + px + ' ' + (itop - 0.92 * k) + ' ' + (px + 16) + ' ' + (itop - 0.72 * k) + ' Z" fill="' + metal + '"/>';
      });
      svg += '<ellipse cx="' + (ix + I.len * ik / 2) + '" cy="' + (iy0 + 6) + '" rx="' + (I.len * ik / 2 + 20) + '" ry="8" fill="rgba(0,0,0,.12)"/>';
      svg += rect(ix - 0.03 * ik, itop - DIM.BENCH_T * ik, I.len * ik + 0.06 * ik, DIM.BENCH_T * ik, bench.fill, ' stroke="rgba(0,0,0,.15)"');
      if (I.waterfall) svg += rect(ix - 0.03 * ik, itop, 0.03 * ik, DIM.BASE_TOP * ik, bench.fill, ' stroke="rgba(0,0,0,.12)"') + rect(ix + I.len * ik, itop, 0.03 * ik, DIM.BASE_TOP * ik, bench.fill, ' stroke="rgba(0,0,0,.12)"');
      I.items.forEach(function (it, q) {
        var x = ix + it.x * ik, w = it.w * ik;
        if (it.kind === 'drawers') for (var r = 0; r < 3; r++) svg += door(x, itop + r * ih / 3, w, ih / 3, base, { drawer: true });
        else svg += door(x, itop, w, ih, base, { hingeLeft: q % 2 === 1 });
      });
      svg += rect(ix, iy0 - DIM.KICK * ik, I.len * ik, DIM.KICK * ik, 'rgba(0,0,0,.35)');
      for (var st = 0; st < Math.min(I.seats, 5); st++) {
        var sx = ix + (st + 0.5) * (I.len * ik / Math.min(I.seats, 5));
        svg += rect(sx - 20, iy0 - 0.66 * ik, 40, 9, '#6b5a4a', ' rx="5"');
        svg += '<path d="M' + (sx - 14) + ' ' + (iy0 - 0.62 * ik) + ' L' + (sx - 19) + ' ' + (iy0 + 6) + ' M' + (sx + 14) + ' ' + (iy0 - 0.62 * ik) + ' L' + (sx + 19) + ' ' + (iy0 + 6) + ' M' + (sx - 17) + ' ' + (iy0 - 0.25 * ik) + ' H' + (sx + 17) + '" stroke="' + metal + '" stroke-width="3" fill="none"/>';
      }
    }
    if (m.shape !== 'straight' || m.island) svg += planInset(m);
    return svg + '</svg>';
  }

  /* ---------- wardrobe sections, drawn in metres ---------- */
  var CLOTHES2D = ['#8d9aa8', '#d9c9b3', '#5d6a63', '#b88a7a', '#e8e3da', '#3f4650', '#a7b49c'];
  function bay2d(x, w, kind, H, X0, Y, k, c, trim, light, i) {
    var f = H / 2.4, out = '', bx = X0(x) + 4, bw = w * k - 8, inner = '#f7f4ef';
    out += rect(bx, Y(H - 0.02), bw, (H - 0.1) * k, inner);
    if (light) out += rect(bx, Y(H - 0.02), bw, 0.4 * k, 'url(#led)') + rect(bx, Y(H - 0.02), bw, 3, '#ffe7b0');
    function shelf(y) { return rect(bx, Y(y), bw, 0.025 * k, c.fill, ' stroke="' + c.edge + '" stroke-width=".6"'); }
    function rail(y, len) {
      var o = rect(bx + 3, Y(y), bw - 6, 3, trim);
      for (var q = 0; q < Math.floor((bw - 12) / 10); q++) o += rect(bx + 6 + q * 10, Y(y) + 4, 7, (len - (q % 3) * 0.08) * k, CLOTHES2D[(q + i) % CLOTHES2D.length], ' rx="2"');
      return o;
    }
    if (kind === 'hang') out += shelf(2.0 * f) + rail(1.92 * f, 1.25 * f);
    if (kind === 'hang2') out += shelf(2.05 * f) + rail(1.97 * f, 0.8 * f) + shelf(1.05 * f) + rail(0.99 * f, 0.75 * f);
    if (kind === 'shelf') for (var sy = 0.45; sy < H - 0.2; sy += 0.36) out += shelf(sy) + rect(bx + 8, Y(sy + 0.12), bw - 20, 0.12 * k, ['#c8b9a3', '#e6ded1', '#9aa5ad'][Math.round(sy * 10) % 3], ' rx="2"');
    if (kind === 'drawers') {
      var dh = 0.85 / 4;
      for (var q = 0; q < 4; q++) out += door(bx, Y(0.1 + (q + 1) * dh), bw, dh * k - 2, c, { drawer: true });
      out += shelf(0.95);
      for (var y2 = 1.35; y2 < H - 0.2; y2 += 0.4) out += shelf(y2);
      out += rect(bx + 10, Y(1.57), bw - 24, 0.2 * k, '#d9cfc0', ' rx="2"');
    }
    if (kind === 'shoes') for (var hy = 0.35; hy < H - 0.2; hy += 0.3) {
      out += '<path d="M' + bx + ' ' + Y(hy - 0.05) + ' L' + (bx + bw) + ' ' + Y(hy + 0.05) + '" stroke="' + (c.wood ? c.edge : c.fill) + '" stroke-width="4"/>';
      for (var p = 0; p < Math.floor(w / 0.18); p++) out += rect(bx + 6 + p * 0.18 * k, Y(hy + 0.04 + p * 0.025) - 2, 0.12 * k, 0.06 * k, p % 2 ? '#3a3936' : '#b88a7a', ' rx="4"');
    }
    out += rect(bx, Y(0.1), bw, 0.025 * k, c.fill);
    return out;
  }

  function renderWardrobe() {
    var m = build();
    var c = find(CABINET, ws.finish), hd = find(HANDLE, ws.handle);
    var trim = hd.val === 'none' ? '#b9bcbf' : hd.fill;
    var SW = 800, SH = 520, floorY = 450;
    var run = m.runs[0], W = run.len, H = m.height;
    var k = Math.min(m.kind === 'walkin' ? 145 : 150, 600 / W, 360 / H), x0 = (SW - W * k) / 2;
    if (m.kind === 'walkin' && m.shape !== 'straight') x0 = Math.max(x0, Math.min(150, SW - 60 - W * k));
    function X(v) { return x0 + v * k; }
    function Y(v) { return floorY - v * k; }
    var svg = svgOpen(SW, SH);
    svg += roomFill(SW, SH, floorY);
    svg += '<ellipse cx="' + (x0 + W * k / 2) + '" cy="' + (floorY + 6) + '" rx="' + (W * k / 2 + 30) + '" ry="9" fill="rgba(0,0,0,.1)"/>';
    var inside = m.kind === 'walkin' || ws.showInside === 'on';
    svg += rect(X(0) - 6, Y(H) - 6, W * k + 12, H * k + 6, m.kind === 'walkin' ? c.fill : '#e4ddd2', m.kind === 'walkin' ? ' stroke="' + c.edge + '"' : '');
    if (inside) {
      if (m.kind === 'builtin') svg += rect(X(0), Y(H), W * k, H * k, c.fill, ' stroke="' + c.edge + '"');
      run.items.forEach(function (it, i) { if (it.t === 'bay') svg += bay2d(it.x, it.w, it.kind, H, X, Y, k, c, trim, m.kind === 'walkin' && ws.light === 'on', i); });
      svg += rect(X(0), Y(0.08), W * k, 0.08 * k, 'rgba(0,0,0,.3)');
    } else if (ws.wdoors === 'hinged') {
      run.items.forEach(function (it) { if (it.t === 'door') svg += door(X(it.x), Y(H), it.w * k, (H - 0.08) * k, c, { hingeLeft: it.hingeLeft, tall: true }); });
      svg += rect(X(0), Y(0.08), W * k, 0.08 * k, 'rgba(0,0,0,.3)');
    } else {
      run.items.forEach(function (it) {
        if (it.t !== 'slide') return;
        var fill = ws.wdoors === 'mirror' ? 'url(#mirror)' : c.fill, px = X(it.x), pw = it.w * k;
        svg += rect(px, Y(H), pw, H * k, fill, ' stroke="' + trim + '" stroke-width="5"');
        if (ws.wdoors === 'mirror') svg += '<path d="M' + (px + pw * 0.2) + ' ' + (Y(H) + 40) + ' L' + (px + pw * 0.55) + ' ' + (Y(H) + 160) + '" stroke="#fff" stroke-width="6" opacity=".6"/>';
      });
      svg += rect(X(0), Y(H) - 6, W * k, 6, trim) + rect(X(0), floorY - 4, W * k, 4, trim);
    }
    svg += dimH(X(0), X(W), Y(H) - 22, mm(W) + ' mm');
    svg += dimV(X(W) + 24, Y(H), floorY, mm(H) + ' mm');
    if (m.kind === 'walkin' && m.shape !== 'straight') svg += planInset(m);
    return svg + '</svg>';
  }

  function render() {
    var svg = mode === 'wardrobe' ? renderWardrobe() : renderKitchen();
    document.getElementById('designPreview').innerHTML = svg;
    syncControls();
    schedule3D();
    if (typeof autosave === 'function') autosave();
  }
  var pending3d = 0;
  function schedule3D() {
    if (!window.JC3D || !view3d || pending3d) return;
    pending3d = requestAnimationFrame(function () { pending3d = 0; window.JC3D.update(); });
  }

  /* ---------- controls ---------- */
  function shown(rule) {
    // "key=a,b" or "key!=a", several joined with ";"
    return rule.split(';').every(function (part) {
      var neg = part.indexOf('!=') > -1, kv = part.split(neg ? '!=' : '=');
      var hit = kv[1].split(',').indexOf(String(state[kv[0]])) > -1;
      return neg ? !hit : hit;
    });
  }
  function countKey(key) {
    if (key === 'doors') return ws.wdoors === 'hinged' ? 'doorCount' : 'panelCount';
    return key;
  }
  function countLimits(key) {
    if (key === 'bases') return model.limits.bases;
    if (key === 'doors') return model.limits.doors;
    if (key.indexOf('wcount.') === 0) return model.limits[key.slice(7)];
    return [1, 1];
  }
  function countValue(key) {
    if (key === 'bases') return model.counts.bases;
    if (key === 'doors') return model.counts.doors;
    if (key.indexOf('wcount.') === 0) return model.sections[key.slice(7)].length;
    return 0;
  }

  function sectionEditor() {
    var box = document.getElementById('secEditor');
    if (!box) return;
    if (mode !== 'wardrobe') { box.innerHTML = ''; return; }
    var keyNow = JSON.stringify(model.sections) + ws.wtype + ws.wdoors;
    if (box.dataset.key === keyNow) return;
    box.dataset.key = keyNow;
    var html = '';
    var walls = model.kind === 'walkin' ? model.runs.map(function (r) { return [r.id, r.label]; }) : [['wall', ws.wdoors === 'hinged' ? 'Sections (one per pair of doors)' : 'Sections (one per door)']];
    walls.forEach(function (wl) {
      var list = model.sections[wl[0]];
      html += '<div class="sec-wall"><div class="sec-head"><span>' + wl[1] + '</span>';
      if (model.kind === 'walkin') {
        var lim = model.limits[wl[0]];
        html += '<span class="stepper"><button type="button" class="step-btn" data-step="wcount.' + wl[0] + '" data-dir="-1" aria-label="Fewer sections"' + (list.length <= lim[0] ? ' disabled' : '') + '>&minus;</button><output>' + list.length + '</output>' +
          '<button type="button" class="step-btn" data-step="wcount.' + wl[0] + '" data-dir="1" aria-label="More sections"' + (list.length >= lim[1] ? ' disabled' : '') + '>+</button></span>';
      }
      html += '</div><div class="sec-list">';
      list.forEach(function (kind, i) {
        html += '<label>' + (i + 1) + '<select data-sec="' + wl[0] + '" data-i="' + i + '" aria-label="' + wl[1] + ' section ' + (i + 1) + '">';
        Object.keys(L.SECTION).forEach(function (v) { html += '<option value="' + v + '"' + (v === kind ? ' selected' : '') + '>' + L.SECTION[v] + '</option>'; });
        html += '</select></label>';
      });
      html += '</div></div>';
    });
    box.innerHTML = html;
  }

  function wardrobeSummary() {
    var fin = cname(find(CABINET, ws.finish));
    var hd = find(HANDLE, ws.handle), m = model;
    function secs(list) {
      var c = {};
      list.forEach(function (k) { c[k] = (c[k] || 0) + 1; });
      return list.length + ' sections (' + Object.keys(c).map(function (k) { return L.SECTION[k].toLowerCase() + (c[k] > 1 ? ' x ' + c[k] : ''); }).join(', ') + ')';
    }
    if (m.kind === 'walkin') {
      var shapeName = { straight: 'One-wall', l: 'L-shaped', u: 'U-shaped' }[m.shape];
      var size = mm(m.sizes.wwidth) + (m.shape !== 'straight' ? ' x ' + mm(m.sizes.wside) : '') + ' mm';
      var all = [];
      m.runs.forEach(function (r) { all = all.concat(r.sections); });
      return shapeName + ' walk-in robe, ' + size + ', in ' + fin + ': ' + secs(all) + (ws.light === 'on' ? ', LED strip lighting' : '') + (hd.val === 'none' ? ', push-to-open drawers.' : ', ' + hd.name.toLowerCase() + ' handles.');
    }
    var dims = mm(m.sizes.width) + ' wide x ' + mm(m.sizes.height) + ' high';
    var inside = ' Inside: ' + secs(m.sections.wall) + '.';
    if (ws.wdoors === 'mirror') return 'Built-in robe, ' + dims + ', ' + m.counts.doors + ' sliding mirror doors, ' + (hd.val === 'none' ? 'aluminium' : hd.name.toLowerCase()) + ' frames, ' + fin + ' interior.' + inside;
    if (ws.wdoors === 'slidingpanel') return 'Built-in robe, ' + dims + ', ' + m.counts.doors + ' sliding doors in ' + fin + ', ' + (hd.val === 'none' ? 'aluminium' : hd.name.toLowerCase()) + ' frames.' + inside;
    var hs = ws.door === 'fingerpull' ? 'fingerpull (no handles)' : (hd.val === 'none' ? 'push-to-open' : hd.name.toLowerCase() + ' handles');
    return 'Built-in robe, ' + dims + ', ' + m.counts.doors + ' hinged ' + LABELS.door[ws.door] + ' in ' + fin + ', ' + hs + '.' + inside;
  }

  function syncControls() {
    document.getElementById('designSummary').textContent = summary();
    root.querySelectorAll('.opt-group').forEach(function (g) {
      var only = g.dataset.only;
      var show = (' ' + g.dataset.mode + ' ').indexOf(' ' + mode + ' ') > -1;
      if (show && only) {
        if (only === 'builtin' || only === 'walkin') show = ws.wtype === only;
        else show = ws.wtype === 'builtin' && ws.wdoors === only;
      }
      if (show && g.dataset.show) show = shown(g.dataset.show);
      if (show && 'adv' in g.dataset && !advanced) show = false;
      g.hidden = !show;
      if (!show) return;
      var key = g.dataset.opt;
      g.querySelectorAll('.opt').forEach(function (b) {
        var on = b.dataset.toggle ? state[b.dataset.toggle] === 'on' : b.dataset.val === state[key];
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', String(on));
      });
      g.querySelectorAll('[data-show]').forEach(function (row) { row.hidden = !shown(row.dataset.show); });
      g.querySelectorAll('[data-size]').forEach(function (inp) {
        var key2 = inp.dataset.size, lim = model.limits && model.limits[key2];
        if (lim) { inp.max = lim[1]; inp.min = lim[0]; }
        var v = model.sizes[key2] || state[key2];
        if (document.activeElement !== inp) inp.value = v;
        var num = g.querySelector('[data-size-mm="' + key2 + '"]');
        if (num && document.activeElement !== num) { num.value = mm(v); if (lim) num.max = mm(lim[1]); }
      });
      g.querySelectorAll('output[data-count]').forEach(function (o) {
        var ck = o.dataset.count, v = countValue(ck), lim = countLimits(ck);
        o.textContent = v;
        o.parentNode.querySelectorAll('.step-btn').forEach(function (b) { b.disabled = b.dataset.dir === '1' ? v >= lim[1] : v <= lim[0]; });
        if (ck === 'doors') o.closest('.step-row').querySelector('.size-label').textContent = ws.wdoors === 'hinged' ? 'Number of doors' : 'Number of sliding doors';
      });
      var picker = g.querySelector('.board-picker');
      if (picker) {
        var sel = find(lists[picker.dataset.swatches], state[key]);
        showCurrent(picker.querySelector('.opt-current'), sel);
        var shownTab = picker.querySelector('.brand-tab.is-active');
        if (!picker.dataset.touched || (shownTab && shownTab.dataset.brand !== sel.brand && lastPickFromRandom)) showBrand(picker, sel.brand);
      }
    });
    sectionEditor();
  }

  /* the chosen colour, with the supplier's own swatch photo and a link to their colour page */
  function host(u) { return u.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]; }
  function showCurrent(el, sel) {
    if (el.dataset.val === sel.val) return;
    el.dataset.val = sel.val;
    el.textContent = '';
    if (sel.val === 'timber') { el.textContent = 'Timber top'; return; }
    if (sel.img) {
      var im = document.createElement('img');
      im.className = 'opt-photo';
      im.src = sel.img;
      im.alt = sel.brand + ' ' + sel.name + ' sample';
      im.loading = 'lazy';
      im.referrerPolicy = 'no-referrer';
      im.style.backgroundColor = sel.swatch;
      im.onerror = function () { im.remove(); };
      el.appendChild(im);
    }
    var t = document.createElement('span');
    t.className = 'opt-current-text';
    var b = document.createElement('strong');
    b.textContent = sel.brand + ' ' + sel.name;
    t.appendChild(b);
    if (sel.url) {
      var a = document.createElement('a');
      a.href = sel.url;
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = 'See it on ' + host(sel.url) + ' \u2197';
      t.appendChild(a);
      var c = document.createElement('small');
      c.textContent = 'Sample photo: ' + (sel.brand === 'Quantum Quartz' ? 'WK Stone' : sel.brand);
      t.appendChild(c);
    }
    el.appendChild(t);
  }

  function summary() {
    var t = summaryCore(), D2 = L.dims, x = [];
    if (mode === 'wardrobe') { if (Math.abs(D2.W_D - 0.6) > 0.005) x.push(mm(D2.W_D) + ' mm deep'); }
    else if (mode === 'vanity') {
      if (Math.abs(D2.BASE_TOP + D2.BENCH_T - 0.85) > 0.005) x.push(mm(D2.BASE_TOP + D2.BENCH_T) + ' mm high');
      if (Math.abs(D2.BASE_D - 0.44) > 0.005) x.push(mm(D2.BASE_D + 0.02) + ' mm deep');
    } else {
      if (Math.abs(D2.UP_TOP - 2.2) > 0.005) x.push(mm(D2.UP_TOP) + ' mm to top of cupboards');
      if (Math.abs(D2.BASE_TOP + D2.BENCH_T - 0.91) > 0.005) x.push(mm(D2.BASE_TOP + D2.BENCH_T) + ' mm bench height');
      if (Math.abs(D2.BASE_D - 0.58) > 0.005) x.push(mm(D2.BASE_D + 0.02) + ' mm deep base cupboards');
      if (Math.abs(D2.UP_D - 0.34) > 0.005 && state.overheads === 'full') x.push(mm(D2.UP_D) + ' mm deep overheads');
      if (Math.abs(D2.FRIDGE_W - 0.92) > 0.005 && state.fridge === 'on') x.push(mm(D2.FRIDGE_W) + ' mm fridge space');
    }
    t = x.length ? t.replace(/\.$/, '') + '. Custom sizes: ' + x.join(', ') + '.' : t;
    var rm = roomOf(state);
    return t + ' Shown with ' + rm.wall.name.toLowerCase() + ' walls and ' + rm.floor.name.toLowerCase() + ' floor.';
  }

  /* every choice, one per line, for the quote email */
  function designDetails() {
    if (!model) build();
    var m = model, st = state, D2 = L.dims, out = [];
    function row(k, v) { if (v !== '' && v != null) out.push(k + ': ' + v); }
    function on(v) { return v === 'on' ? 'Yes' : 'No'; }
    function board(v) { return cname(find(CABINET, v)); }
    function bench() { return cname(find(BENCH, st.bench)); }
    var DOOR = { flat: 'Flat panel', shaker: 'Shaker', fingerpull: 'Fingerpull' };
    var hdl = st.door === 'fingerpull' ? 'Fingerpull (no handles)' : find(HANDLE, st.handle).name;
    row('Designing', { kitchen: 'Kitchen', laundry: 'Laundry', vanity: 'Vanity', wardrobe: 'Wardrobe' }[mode]);
    if (mode === 'kitchen') {
      row('Shape', { straight: 'Straight', l: 'L-shape', u: 'U-shape', galley: 'Galley' }[m.shape]);
      row('Back wall', mm(m.sizes.wall) + ' mm');
      if (m.shape === 'l' || m.shape === 'u') row('Side walls', mm(m.sizes.side) + ' mm');
      row('Base cupboards on back wall', m.counts.bases);
      row('Island', m.island ? 'Yes, ' + mm(m.island.len) + ' mm' : 'No');
      row('Pantry', on(st.pantry));
      row('Fridge space', st.fridge === 'on' ? 'Yes, ' + mm(D2.FRIDGE_W) + ' mm wide' : 'No');
      row('Dishwasher', st.dishwasher === 'off' ? 'No' : 'Yes');
    }
    if (mode === 'laundry') {
      row('Laundry wall', mm(m.sizes.lwall) + ' mm');
      row('Washer & dryer', { stacked: 'Stacked tower', side: 'Side by side under bench', washer: 'Washer only under bench' }[st.machines]);
      row('Broom cupboard', on(st.broom));
    }
    if (mode === 'kitchen' || mode === 'laundry') {
      row('Overheads', { full: 'Cupboards', shelves: 'Open shelves', none: 'None' }[st.overheads]);
      row('Door style', DOOR[st.door]);
      row('Base colour', board(st.base));
      row('Overhead colour', board(st.upper));
      row('Benchtop', bench());
      row('Splashback', LABELS.splash[st.splash].charAt(0).toUpperCase() + LABELS.splash[st.splash].slice(1));
      row('Handles', hdl);
      row('Top of cupboards', mm(D2.UP_TOP) + ' mm');
      row('Bench height', mm(D2.BASE_TOP + D2.BENCH_T) + ' mm');
      row('Base cupboard depth', mm(D2.BASE_D + 0.02) + ' mm');
      if (st.overheads === 'full') row('Overhead depth', mm(D2.UP_D) + ' mm');
    }
    if (mode === 'vanity') {
      row('Style', st.mount === 'floor' ? 'Floor-standing' : 'Wall-hung');
      row('Width', mm(m.sizes.vwall) + ' mm');
      row('Height to top', mm(D2.BASE_TOP + D2.BENCH_T) + ' mm');
      row('Depth', mm(D2.BASE_D + 0.02) + ' mm');
      row('Basins', m.counts.basins + ' above-counter');
      row('Fronts', st.vfront === 'doors' ? 'Doors' : 'Drawers');
      row('Mirror', { round: 'Round mirror', cabinet: 'Mirror shaving cabinet', none: 'None' }[st.mirror]);
      row('Linen tower', on(st.tower));
      row('Door style', DOOR[st.door]);
      row('Colour', board(st.base));
      row('Top', bench());
      row('Handles', hdl);
    }
    if (mode === 'wardrobe') {
      row('Type', st.wtype === 'walkin' ? 'Walk-in robe' : 'Built-in robe');
      if (m.kind === 'walkin') {
        row('Shape', { straight: 'One wall', l: 'L-shape', u: 'U-shape' }[m.shape]);
        row('Back wall', mm(m.sizes.wwidth) + ' mm');
        if (m.shape !== 'straight') row('Side walls', mm(m.sizes.wside) + ' mm');
        m.runs.forEach(function (r) { row(r.label + ' sections', r.sections.map(function (k) { return L.SECTION[k]; }).join(', ')); });
        row('LED lighting', on(st.light));
      } else {
        row('Size', mm(m.sizes.width) + ' wide x ' + mm(m.sizes.height) + ' high');
        row('Doors', { hinged: 'Hinged', slidingpanel: 'Sliding panel', mirror: 'Sliding mirror' }[st.wdoors] + ', ' + m.counts.doors);
        if (st.wdoors === 'hinged') row('Door style', DOOR[st.door]);
        row('Sections', m.sections.wall.map(function (k) { return L.SECTION[k]; }).join(', '));
      }
      row('Depth', mm(D2.W_D) + ' mm');
      row('Finish', board(st.finish));
      row('Handles', find(HANDLE, st.handle).name);
    }
    var rm = roomOf(st);
    row('Room shown with', rm.wall.name + ' walls, ' + rm.floor.name.toLowerCase() + ' floor');
    return out.join('\n');
  }
  function summaryCore() {
    if (!model) build();
    if (mode === 'wardrobe') return wardrobeSummary();
    if (mode === 'laundry') return laundrySummary();
    if (mode === 'vanity') return vanitySummary();
    var m = model;
    var base = cname(find(CABINET, state.base)), upper = cname(find(CABINET, state.upper));
    var colours = base === upper ? base : base + ' base with ' + upper + ' overheads';
    var handles = state.door === 'fingerpull' ? 'fingerpull (no handles)' : find(HANDLE, state.handle).name.toLowerCase() + (state.handle === 'none' ? '' : ' handles');
    var shapeName = { straight: 'Straight', l: 'L-shaped', u: 'U-shaped', galley: 'Galley' }[m.shape];
    var size = mm(m.sizes.wall) + (m.shape === 'l' || m.shape === 'u' ? ' x ' + mm(m.sizes.side) : '') + ' mm';
    var extras = [];
    if (m.island) extras.push(mm(m.island.len) + ' mm island');
    if (state.pantry === 'on') extras.push('pantry');
    if (state.fridge === 'on') extras.push('fridge space');
    if (state.dishwasher !== 'off') extras.push('dishwasher');
    var ups = { full: '', shelves: ', open shelves instead of overheads', none: ', no overheads' }[state.overheads] || '';
    return shapeName + ' kitchen, ' + size + ', ' + m.counts.bases + ' base cupboards on the back wall' + (extras.length ? ', ' + extras.join(', ') : '') + ups + '. ' +
      LABELS.door[state.door].charAt(0).toUpperCase() + LABELS.door[state.door].slice(1) + ' in ' + colours + ', ' +
      cname(find(BENCH, state.bench)) + ' benchtop, ' + LABELS.splash[state.splash] + ', ' + handles + '.';
  }

  function doorsIn(colours) {
    var d = LABELS.door[state.door];
    return d.charAt(0).toUpperCase() + d.slice(1) + ' in ' + colours;
  }
  function handlesText() {
    return state.door === 'fingerpull' ? 'fingerpull (no handles)' : find(HANDLE, state.handle).name.toLowerCase() + (state.handle === 'none' ? '' : ' handles');
  }
  function laundrySummary() {
    var m = model, base = cname(find(CABINET, state.base)), upper = cname(find(CABINET, state.upper));
    var colours = base === upper ? base : base + ' base with ' + upper + ' overheads';
    var mach = { stacked: 'stacked washer and dryer tower', side: 'washer and dryer side by side under the bench', washer: 'washer under the bench' }[state.machines];
    var ups = { full: '', shelves: ', open shelves instead of overheads', none: ', no overheads' }[state.overheads] || '';
    return 'Laundry, ' + mm(m.sizes.lwall) + ' mm wall, laundry tub, ' + mach + (state.broom === 'on' ? ', broom cupboard' : '') + ups + '. ' +
      doorsIn(colours) + ', ' + cname(find(BENCH, state.bench)) + ' benchtop, ' + LABELS.splash[state.splash] + ', ' + handlesText() + '.';
  }
  function vanitySummary() {
    var m = model, nb = m.counts.basins;
    var mir = { round: nb > 1 ? 'round mirrors' : 'round mirror', cabinet: nb > 1 ? 'mirror shaving cabinets' : 'mirror shaving cabinet', none: '' }[state.mirror];
    return (state.mount === 'floor' ? 'Floor-standing' : 'Wall-hung') + ' vanity, ' + mm(m.sizes.vwall) + ' mm wide, ' + (nb > 1 ? 'two above-counter basins' : 'above-counter basin') +
      ', ' + (state.vfront === 'doors' ? 'doors' : 'drawers') + (state.tower === 'on' ? ', linen tower' : '') + (mir ? ', ' + mir : '') + '. ' +
      doorsIn(cname(find(CABINET, state.base))) + ', ' + cname(find(BENCH, state.bench)) + ' top, ' + handlesText() + '.';
  }

  root.querySelectorAll('[data-mode-tab]').forEach(function (t) {
    t.addEventListener('click', function () {
      mode = t.dataset.modeTab;
      state = STATES[mode] || ks;
      root.querySelectorAll('[data-mode-tab]').forEach(function (x) {
        var on = x === t;
        x.classList.toggle('is-active', on);
        x.setAttribute('aria-pressed', String(on));
      });
      render();
    });
  });

  /* quick start shows the main choices; "Customise" opens sizes, cupboards and the rest */
  var advanced = false;
  try { advanced = localStorage.getItem('jc-designer-adv') === '1'; } catch (e) {}
  var advBtn = document.getElementById('advToggle');
  function syncAdv() {
    root.classList.toggle('is-advanced', advanced);
    if (advBtn) advBtn.setAttribute('aria-expanded', String(advanced));
  }
  if (advBtn) advBtn.addEventListener('click', function () {
    advanced = !advanced;
    try { localStorage.setItem('jc-designer-adv', advanced ? '1' : '0'); } catch (e) {}
    syncAdv();
    syncControls();
    if (!advanced) advBtn.scrollIntoView({ block: 'nearest' });
  });
  syncAdv();

  var lastPickFromRandom = false;
  root.addEventListener('click', function (e) {
    if (locked && e.target.closest('.designer-controls')) return;
    var tab = e.target.closest('.brand-tab');
    if (tab) { tab.closest('.board-picker').dataset.touched = '1'; return; }
    lastPickFromRandom = false;
    var step = e.target.closest('[data-step]');
    if (step) {
      if (step.disabled) return;
      var sk = step.dataset.step, lim = countLimits(sk), v = Math.max(lim[0], Math.min(lim[1], countValue(sk) + Number(step.dataset.dir)));
      if (sk.indexOf('wcount.') === 0) { ws.wcount = ws.wcount || {}; ws.wcount[sk.slice(7)] = v; }
      else state[countKey(sk)] = v;
      return render();
    }
    var b = e.target.closest('.opt');
    if (!b) return;
    if (b.dataset.toggle) {
      var tk = b.dataset.toggle;
      state[tk] = state[tk] === 'on' ? 'off' : 'on';
      return render();
    }
    var g = b.closest('.opt-group');
    state[g.dataset.opt] = b.dataset.val;
    if (g.dataset.opt === 'internals') { ws.bsec = []; ws.wsec = {}; }
    render();
  });
  root.addEventListener('input', function (e) {
    if (locked) return;
    var t = e.target;
    if (t.dataset.size) { state[t.dataset.size] = parseFloat(t.value); render(); }
  });
  root.addEventListener('change', function (e) {
    if (locked) return;
    var t = e.target;
    if (t.dataset.sizeMm) {
      var v = parseFloat(t.value);
      if (!isNaN(v)) state[t.dataset.sizeMm] = v / 1000;
      t.blur();
      render();
    }
    if (t.dataset.sec) {
      var list = model.sections[t.dataset.sec].slice();
      list[Number(t.dataset.i)] = t.value;
      if (model.kind === 'walkin') { ws.wsec = ws.wsec || {}; ws.wsec[t.dataset.sec] = list; }
      else ws.bsec = list;
      render();
    }
  });

  document.getElementById('designRandom').addEventListener('click', function () {
    lastPickFromRandom = true;
    function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
    if (mode === 'wardrobe') {
      ws.wtype = pick(['builtin', 'walkin']);
      ws.wdoors = pick(['hinged', 'slidingpanel', 'mirror']);
      ws.door = pick(['flat', 'shaker', 'fingerpull']);
      ws.finish = pick(CABINET).val;
      ws.internals = pick(['balanced', 'hanging', 'drawers']);
      ws.bsec = []; ws.wsec = {};
      ws.wshape = pick(['straight', 'l', 'u', 'u']);
      ws.light = pick(['on', 'off']);
      ws.handle = pick(HANDLE).val;
      return render();
    }
    state.door = pick(['flat', 'shaker', 'fingerpull']);
    state.base = pick(CABINET).val;
    state.bench = pick(BENCH).val;
    state.handle = pick(HANDLE).val;
    if (mode === 'laundry') {
      state.machines = pick(['stacked', 'side', 'washer']);
      state.broom = pick(['on', 'off']);
      state.overheads = pick(['full', 'full', 'shelves']);
      state.upper = Math.random() < 0.55 ? 'p-classic-white' : state.base;
      state.splash = pick(['subway', 'stone', 'glass']);
      return render();
    }
    if (mode === 'vanity') {
      state.mount = pick(['wall', 'wall', 'floor']);
      state.basins = pick(['single', 'double']);
      state.vfront = pick(['drawers', 'doors']);
      state.mirror = pick(['round', 'cabinet']);
      state.tower = pick(['on', 'off', 'off']);
      return render();
    }
    state.shape = pick(['straight', 'straight', 'l', 'u', 'galley']);
    state.island = state.shape === 'u' ? 'off' : pick(['on', 'on', 'off']);
    state.pantry = pick(['on', 'off']);
    state.overheads = pick(['full', 'full', 'shelves']);
    state.door = pick(['flat', 'shaker', 'fingerpull']);
    state.base = pick(CABINET).val;
    state.upper = Math.random() < 0.55 ? 'p-classic-white' : state.base;
    state.bench = pick(BENCH).val;
    state.splash = pick(['subway', 'stone', 'glass']);
    state.handle = pick(HANDLE).val;
    render();
  });

  document.getElementById('designSend').addEventListener('click', function () {
    var text = 'My design: ' + summary();
    var field = document.getElementById('designField');
    if (field) field.value = text;
    /* the link is a frozen snapshot: the whole design is written into the link itself,
       stamped with the time, and opens read-only */
    var sent = new Date();
    var snap = snapshot(); snap.q = 1; snap.t = sent.getTime();
    var linkF = document.getElementById('designLinkField');
    if (linkF) linkF.value = location.origin + '/?d=' + enc(snap) + '#design';
    var detF = document.getElementById('designDetailsField');
    if (detF) detF.value = 'Sent ' + sent.toLocaleString('en-AU', { dateStyle: 'medium', timeStyle: 'short' }) + '\n' + designDetails();
    var list = document.getElementById('cabinetListField');
    if (list && window.JCExport) list.value = window.JCExport.csv();
    var form = document.getElementById('quoteForm');
    if (!form) return;
    var details = form.querySelector('#details');
    if (details && details.value.indexOf('My design:') === -1) details.value = text + (details.value ? '\n' + details.value : '');
    var radio = form.querySelector('input[name=project][value="' + { kitchen: 'Kitchen', wardrobe: 'Wardrobes', laundry: 'Laundry', vanity: 'Vanity / bathroom' }[mode] + '"]');
    if (radio) {
      radio.checked = true;
      radio.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });

  /* 3D view: three.js is only downloaded the first time someone opens it */
  var view3d = false, loading3d = false;
  window.JCDesigner = {
    get mode() { return mode; },
    get state() { return state; },
    CABINET: CABINET, BENCH: BENCH, HANDLE: HANDLE, WALLS: WALLS, FLOORS: FLOORS,
    model: function () { return L.build(mode, state); }
  };
  var pane3d = document.getElementById('design3d');
  var pane2d = document.getElementById('designPreview');
  function loadScript(src, cb) {
    var s = document.createElement('script');
    s.src = src; s.async = true;
    s.onload = cb;
    s.onerror = function () { pane3d.classList.remove('is-loading'); loading3d = false; setView('2d'); };
    document.head.appendChild(s);
  }
  function ensure3D() {
    if (window.JC3D) return Promise.resolve();
    return new Promise(function (res, rej) {
      var tries = 0;
      if (!view3d) { pane3d.hidden = false; pane3d.style.position = 'absolute'; pane3d.style.left = '-9999px'; pane3d.style.width = '800px'; view3d = true; var hiddenLoad = true; }
      startLoad();
      (function wait() {
        if (window.JC3D) {
          if (hiddenLoad) { pane3d.hidden = true; pane3d.style.cssText = ''; view3d = false; }
          window.JC3D.update();
          return res();
        }
        if (++tries > 150) return rej();
        setTimeout(wait, 100);
      })();
    });
  }
  window.JCDesigner.ensure3D = ensure3D;
  function startLoad() {
    if (window.JC3D || loading3d) return;
    loading3d = true;
    pane3d.classList.add('is-loading');
    var three = window.THREE ? function (cb) { cb(); } : function (cb) { loadScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js', cb); };
    three(function () {
      loadScript('js/designer3d.js', function () { pane3d.classList.remove('is-loading'); });
    });
  }
  function setViewButtons(v) {
    root.querySelectorAll('[data-view]').forEach(function (b) {
      var on = b.dataset.view === v;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', String(on));
    });
  }
  function setView(v) {
    view3d = v === '3d';
    setViewButtons(v);
    pane2d.hidden = view3d;
    pane3d.hidden = !view3d;
    if (!view3d) return;
    if (window.JC3D) return window.JC3D.update();
    startLoad();
  }
  root.querySelectorAll('[data-view]').forEach(function (b) {
    b.addEventListener('click', function () { setView(b.dataset.view); });
  });

  window.JCDesigner.setView = setView;
  /* desktop: quote button, save and downloads sit under the sticky preview; phones: under the options */
  (function () {
    var cta = document.getElementById('designerCta'), st = document.getElementById('ctaSlotStage'), ct = document.getElementById('ctaSlotControls');
    if (!cta || !st || !ct || !window.matchMedia) return;
    var mq = window.matchMedia('(min-width: 901px)');
    var place = function () { (mq.matches ? st : ct).appendChild(cta); };
    place();
    if (mq.addEventListener) mq.addEventListener('change', place); else if (mq.addListener) mq.addListener(place);
  })();

  /* ---------- saving: auto-save on this device + a link that reopens the design anywhere ---------- */
  var SAVE_KEY = 'jc-design-v1';
  function snapshot() { return { v: 1, mode: mode, k: ks, w: ws, l: ls, b: vs }; }
  function enc(o) { return btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
  function dec(t) { t = t.replace(/-/g, '+').replace(/_/g, '/'); while (t.length % 4) t += '='; return JSON.parse(decodeURIComponent(escape(atob(t)))); }
  function designLink() { return location.origin + '/?d=' + enc(snapshot()) + '#design'; }
  function restore(o) {
    if (!o || o.v !== 1) return false;
    if (o.k) Object.keys(o.k).forEach(function (k) { if (k in ks || /^(benchH|baseD|upD|upTop|fridgeW)$/.test(k)) ks[k] = o.k[k]; });
    if (o.w) Object.keys(o.w).forEach(function (k) { if (k in ws || k === 'wdepth') ws[k] = o.w[k]; });
    if (o.l) Object.keys(o.l).forEach(function (k) { if (k in ls || /^(benchH|baseD|upD|upTop)$/.test(k)) ls[k] = o.l[k]; });
    if (o.b) Object.keys(o.b).forEach(function (k) { if (k in vs || /^(benchH|baseD)$/.test(k)) vs[k] = o.b[k]; });
    if (STATES[o.mode]) {
      var tab = root.querySelector('[data-mode-tab="' + o.mode + '"]');
      if (tab && o.mode !== mode) tab.click();
    }
    return true;
  }
  var saveTimer = 0, restoredFrom = '', locked = false;
  function autosave() {
    clearTimeout(saveTimer);
    if (locked) return;
    saveTimer = setTimeout(function () { try { localStorage.setItem(SAVE_KEY, JSON.stringify(snapshot())); } catch (e) {} }, 400);
  }
  window.JCDesigner.link = designLink;
  var qs = new URLSearchParams(location.search);
  var snapAt = 0;
  if (qs.get('d')) { try { var so = dec(qs.get('d')); if (restore(so)) { restoredFrom = so.q ? 'quote' : 'link'; snapAt = so.t || 0; } } catch (e) {} }
  else if (!qs.get('look') && !qs.get('design')) {
    try { if (restore(JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'))) restoredFrom = 'device'; } catch (e) {}
  }
  /* a quote snapshot opens locked: what the customer sent, dated, and nobody can change it.
     "Edit a copy" unlocks a copy to play with; the emailed link itself never changes. */
  if (restoredFrom === 'quote') {
    locked = true;
    root.classList.add('is-locked');
    var ban = document.createElement('div');
    ban.className = 'snap-banner';
    ban.setAttribute('role', 'status');
    var when = snapAt ? new Date(snapAt).toLocaleString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : '';
    ban.innerHTML = '<div><strong>Quote snapshot</strong><span>' + (when ? 'Sent ' + when + '. ' : '') + 'This is exactly what was sent with the quote request, and it can\u2019t be changed.</span></div>' +
      '<button type="button" class="btn btn-outline btn-sm" data-unlock>Edit a copy</button>';
    var stage = root.querySelector('.designer-stage');
    stage.insertBefore(ban, stage.firstChild);
    ban.querySelector('[data-unlock]').addEventListener('click', function () {
      locked = false;
      root.classList.remove('is-locked');
      ban.remove();
      try { history.replaceState(null, '', location.pathname + '#design'); } catch (e) {}
      autosave();
    });
  }
  var saveBar = document.getElementById('designSave');
  if (saveBar) {
    var note = saveBar.querySelector('.save-note');
    if (restoredFrom && restoredFrom !== 'quote') note.classList.add('show');
    if (restoredFrom === 'device') note.textContent = 'Welcome back. We reopened your last design.';
    else if (restoredFrom === 'link') note.textContent = 'Opened a saved design. Any changes save on this device.';
    saveBar.addEventListener('click', function (e) {
      var b = e.target.closest('[data-save]');
      if (!b) return;
      if (b.dataset.save === 'restart' && !window.confirm('Start a new design? This clears the design saved on this device. Any links you saved will still open it.')) return;
      if (b.dataset.save === 'fresh' || b.dataset.save === 'restart') {
        try { localStorage.removeItem(SAVE_KEY); } catch (er) {}
        location.href = location.pathname + '#design';
        location.reload();
        return;
      }
      var url = designLink(), done = function (msg) { note.textContent = msg; note.classList.add('show'); };
      if (b.dataset.save === 'share' && navigator.share) {
        navigator.share({ title: 'My Joinerycraft design', text: summary(), url: url }).catch(function () {});
        return;
      }
      var fallback = function () {
        var inp = saveBar.querySelector('.save-link');
        inp.hidden = false; inp.value = url; inp.focus(); inp.select();
        done('Copy this link and keep it, or send it to yourself.');
      };
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(url).then(function () { done('Link copied. Bookmark it, or paste it into a message to yourself, to come back to this design.'); }, fallback);
      else fallback();
    });
    if (navigator.share) { var sb = saveBar.querySelector('[data-save="share"]'); if (sb) sb.hidden = false; }
  }

  /* deep link: ?design=wardrobe opens the wardrobe tab */
  var want = new URLSearchParams(location.search).get('design');
  var wantTab = want && root.querySelector('[data-mode-tab="' + want.replace(/[^a-z]/g, '') + '"]');
  if (wantTab && want !== mode) wantTab.click();
  /* ?look=hamptons etc. preloads a kitchen style (used by the style pages) */
  var LOOKS = {
    hamptons: { door: 'shaker', base: 'p-natural-cotton', upper: 'p-natural-cotton', bench: 'cs-calacatta-nuvo', splash: 'subway', handle: 'brass', shape: 'l', island: 'on' },
    shaker: { door: 'shaker', base: 'p-oasis', upper: 'p-classic-white', bench: 'cs-empira-white', splash: 'subway', handle: 'black' },
    modern: { door: 'fingerpull', base: 'p-polar-white', upper: 'p-polar-white', bench: 'qq-concrete-matte', splash: 'stone', handle: 'none', shape: 'l', island: 'on' },
    twotone: { door: 'flat', base: 'p-mercurio-grey', upper: 'p-classic-white', bench: 'cs-snow', splash: 'stone', handle: 'steel' },
    timber: { door: 'flat', base: 'p-prime-oak', upper: 'p-classic-white', bench: 'cs-pure-white', splash: 'stone', handle: 'black', shape: 'galley', island: 'off' }
  };
  var look = LOOKS[(new URLSearchParams(location.search).get('look') || '').replace(/[^a-z]/g, '')];
  if (look && mode === 'kitchen') Object.keys(look).forEach(function (k) { ks[k] = look[k]; });
  render();
  /* open on the 3D view; three.js downloads once the designer is close to the screen */
  setViewButtons('3d');
  pane2d.hidden = true;
  pane3d.hidden = false;
  view3d = true;
  pane3d.classList.add('is-loading');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      if (es.some(function (e) { return e.isIntersecting; })) { io.disconnect(); if (view3d) startLoad(); }
    }, { rootMargin: '600px 0px' });
    io.observe(root);
  } else startLoad();
})();
