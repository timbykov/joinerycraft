/* Joinerycraft design creator: layout model.
   Turns the customer's choices (sizes, shape, cabinet counts, sections) into a list of
   runs and cabinets in metres. The front view, the 3D view and the cabinet list export
   all draw from this one model, so they always agree. */
(function () {
  'use strict';

  var KICK = 0.15, BASE_TOP = 0.87, BENCH_T = 0.04, BASE_D = 0.58, UP_BOT = 1.5, UP_TOP = 2.2, UP_D = 0.34, TALL_TOP = 2.2;
  var CEIL = 2.7, FRIDGE_W = 0.92, W_D = 0.6, FLOAT = false, BULK = true;
  var DIMS = {};
  /* heights and depths the customer can change (Customise > Heights & depths).
     Kitchens and laundries share one set of sizes; vanities are lower, shallower and can be wall-hung. */
  function setDims(mode, s) {
    var c = function (v, d, lo, hi) { v = +v || d; return Math.min(hi, Math.max(lo, v)); };
    if (mode === 'wardrobe') { W_D = c(s.wdepth, 0.6, 0.45, 0.7); CEIL = 2.7; }
    else if (mode === 'vanity') {
      BENCH_T = 0.02;
      BASE_TOP = c(s.benchH, 0.85, 0.8, 0.95) - BENCH_T;
      BASE_D = c(s.baseD, 0.46, 0.38, 0.56) - 0.02;
      FLOAT = s.mount !== 'floor';
      KICK = FLOAT ? Math.max(0.2, BASE_TOP - 0.5) : 0.15; // wall-hung: a 500 mm high cabinet off the floor
      UP_BOT = BASE_TOP + BENCH_T + 0.35;
      UP_TOP = UP_BOT + 0.75;
      TALL_TOP = UP_TOP;
      UP_D = 0.15;
      CEIL = 2.4; BULK = false;
    } else {
      BENCH_T = 0.04; KICK = 0.15; UP_BOT = 1.5; FLOAT = false; BULK = true;
      BASE_TOP = c(s.benchH, 0.91, 0.85, 0.95) - BENCH_T;
      BASE_D = c(s.baseD, 0.6, 0.56, 0.7) - 0.02;
      UP_D = c(s.upD, 0.34, 0.3, 0.4);
      /* overheads, pantry and fridge cupboard all finish at one height; the room is drawn
         with the cupboards running to the ceiling, so there is no bulkhead to set */
      UP_TOP = TALL_TOP = CEIL = c(s.upTop, 2.2, 2.0, 2.7);
      FRIDGE_W = c(s.fridgeW, 0.92, 0.7, 1.0);
    }
    DIMS.KICK = KICK; DIMS.BASE_TOP = BASE_TOP; DIMS.BENCH_T = BENCH_T; DIMS.BASE_D = BASE_D; DIMS.UP_BOT = UP_BOT; DIMS.UP_TOP = UP_TOP;
    DIMS.UP_D = UP_D; DIMS.TALL_TOP = TALL_TOP; DIMS.CEIL = CEIL; DIMS.FRIDGE_W = FRIDGE_W; DIMS.W_D = W_D; DIMS.FLOAT = FLOAT; DIMS.BULK = BULK;
    return { benchH: BASE_TOP + BENCH_T, baseD: BASE_D + 0.02, upD: UP_D, upTop: UP_TOP, fridgeW: FRIDGE_W, wdepth: W_D };
  }
  var SECTION = { hang: 'Long hanging', hang2: 'Double hanging', shelf: 'Shelves', drawers: 'Drawers + shelves', shoes: 'Shoe shelves' };
  var MIX = {
    balanced: ['hang2', 'shelf', 'drawers', 'hang', 'shoes'],
    hanging: ['hang2', 'hang', 'shelf', 'hang2', 'hang'],
    drawers: ['drawers', 'shoes', 'hang2', 'drawers', 'shelf']
  };

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function r1(v) { return Math.round(v * 1000) / 1000; }

  /* keep the sections someone already picked, add or drop from the end */
  function fit(arr, n, pattern, offset) {
    arr = (arr || []).slice(0, n);
    for (var i = arr.length; i < n; i++) arr.push(pattern[(i + (offset || 0)) % pattern.length]);
    return arr;
  }

  function countFor(len, wanted, minW, maxW, ideal) {
    var lo = Math.max(1, Math.ceil(len / maxW - 1e-6)), hi = Math.max(lo, Math.floor(len / minW + 1e-6));
    var n = wanted ? clamp(wanted, lo, hi) : clamp(Math.round(len / ideal), lo, hi);
    return { n: n, min: lo, max: hi };
  }

  /* ---------------- kitchen ---------------- */
  /* opts: cook index, sink, dishwasher, cornerL, cornerR (blind corner cabinets at the ends) */
  function baseUnits(len, n, opts) {
    opts = opts || {};
    var w = len / n, items = [];
    for (var i = 0; i < n; i++) items.push({ t: 'base', x: r1(i * w), w: r1(w), kind: i % 3 === 0 ? 'drawers' : 'door' });
    var lo = opts.cornerL && n > 1 ? 1 : 0, hi = opts.cornerR && n > 1 ? n - 2 : n - 1;
    if (opts.cook != null) {
      var c = clamp(opts.cook, lo, Math.max(lo, hi));
      items[c].kind = 'oven';
      if (opts.sink && n >= 3) {
        var s = c - lo >= 2 ? c - 2 : (hi - c >= 2 ? c + 2 : (c - lo >= 1 ? lo : (hi > c ? hi : -1)));
        if (s === c) s = -1;
        if (s >= 0) {
          items[s].kind = 'sink';
          var dw = s + 1 <= hi && s + 1 !== c ? s + 1 : (s - 1 >= lo && s - 1 !== c ? s - 1 : -1);
          if (opts.dishwasher && dw >= 0) items[dw].kind = 'dw';
        }
      }
    }
    if (opts.cornerL && items[0].kind !== 'oven') { items[0].kind = 'corner'; items[0].side = 'L'; }
    if (opts.cornerR && n > 1 && items[n - 1].kind !== 'oven') { items[n - 1].kind = 'corner'; items[n - 1].side = 'R'; }
    fitWidths(items, len);
    return items;
  }

  /* appliances, the sink and blind corners get standard widths, the rest share what is left.
     Try the full set of standard widths first, then drop the sink and corner, then the dishwasher. */
  function fitWidths(items, len) {
    [{ oven: 0.6, dw: 0.6, sink: 0.8, corner: 0.95 }, { oven: 0.6, dw: 0.6 }, { oven: 0.6 }].some(function (FIX) {
      var fixed = 0, free = 0;
      items.forEach(function (it) { if (FIX[it.kind]) fixed += FIX[it.kind]; else free++; });
      if (!fixed || !free || (len - fixed) / free < 0.3) return false;
      var fw = (len - fixed) / free, x = 0;
      items.forEach(function (it) { var ww = FIX[it.kind] || fw; it.x = r1(x); it.w = r1(ww); x += ww; });
      return true;
    });
  }

  function upperUnits(a, b, style, out) {
    var len = b - a;
    if (len < 0.25) return;
    if (style === 'shelves') { out.push({ t: 'shelf', x: r1(a), w: r1(len) }); return; }
    var m = Math.max(1, Math.round(len / 0.6)), w = len / m;
    for (var j = 0; j < m; j++) out.push({ t: 'upper', x: r1(a + j * w), w: r1(w), hingeLeft: j % 2 === 0 });
  }

  function tallUnits(list, end, out) {
    var x = end;
    list.forEach(function (t) { x -= t.w; out.push({ t: 'tall', x: r1(x), w: t.w, kind: t.kind }); });
    return x;
  }

  function kitchen(s) {
    var shape = s.shape || 'straight';
    var W = clamp(s.wall || 4.2, 2.4, 9.0), S = clamp(s.side || 2.4, 1.2, 6.0);
    var corner = shape === 'l' || shape === 'u';
    var RET = BASE_D + 0.02; // a side run starts in front of the back run
    var talls = [];
    if (s.pantry === 'on') talls.push({ w: 0.9, kind: 'pantry' });
    if (s.fridge === 'on') talls.push({ w: FRIDGE_W, kind: 'fridge' });
    var tallW = talls.reduce(function (a, t) { return a + t.w; }, 0);
    var left = s.fridgeSide === 'left';
    /* where the fridge and pantry go: the chosen end of the back wall, but never in a corner.
       In an L or U they go at the open end of that side wall instead. */
    var sideFits = S - tallW >= 0.55;
    var where = 'backR';
    if (shape === 'u') where = sideFits ? (left ? 'sideL' : 'sideR') : 'backR';
    else if (shape === 'l') where = left && sideFits ? 'sideL' : 'backR';
    else where = left ? 'backL' : 'backR';
    var onBack = where === 'backR' || where === 'backL';
    var B = onBack ? W - tallW : W, off = where === 'backL' ? tallW : 0;
    var islandSink = s.island === 'on' && shape !== 'galley' && s.sinkAt === 'island';
    var cnt = countFor(B, s.bases, 0.3, 1.0, 0.6);
    var n = cnt.n, uw = B / n;
    var cook = Math.round((B / 2) / uw - 0.5);
    var back = { id: 'back', label: 'Back wall', len: W, pos: [-W / 2, 0], rot: 0, bench: [off, off + B], splash: [off, off + B], items: [] };
    back.items = baseUnits(B, n, { cook: cook, sink: !islandSink, dishwasher: s.dishwasher !== 'off', cornerL: corner, cornerR: shape === 'u' });
    back.items.forEach(function (it) { it.x = r1(it.x + off); });
    if (where === 'backR') tallUnits(talls, W, back.items);
    if (where === 'backL') tallUnits(talls.slice().reverse(), tallW, back.items);
    var oven = back.items.filter(function (it) { return it.kind === 'oven'; })[0];
    var hoodW = Math.min(0.9, Math.max(0.6, oven.w + 0.1)), hoodC = oven.x + oven.w / 2;
    var hood = { t: 'hood', x: r1(hoodC - hoodW / 2), w: r1(hoodW) };
    back.items.push(hood);
    var ups = s.overheads || 'full';
    if (ups !== 'none') {
      upperUnits(off, hood.x, ups, back.items);
      upperUnits(hood.x + hood.w, off + B, ups, back.items);
    }
    var runs = [back];
    var reach = RET - UP_D; // side overheads run back to meet the back overheads
    function sideRun(id, label, pos, rot, isRight) {
      // the left wall runs from its open end (x=0) to the corner; the right wall from the corner to its open end
      var hasT = (isRight && where === 'sideR') || (!isRight && where === 'sideL');
      var bl = hasT ? S - tallW : S, o = !isRight && hasT ? tallW : 0;
      var c2 = countFor(bl, 0, 0.3, 1.0, 0.6);
      var run = { id: id, label: label, len: S, pos: pos, rot: rot, bench: [o, o + bl], splash: ups === 'none' ? null : [o, o + bl], items: baseUnits(bl, c2.n) };
      run.items.forEach(function (it) { it.x = r1(it.x + o); });
      if (hasT) { if (isRight) tallUnits(talls, S, run.items); else tallUnits(talls.slice().reverse(), tallW, run.items); }
      if (ups !== 'none') { if (isRight) upperUnits(-reach, bl, ups, run.items); else upperUnits(o, S + reach, ups, run.items); }
      return run;
    }
    if (corner) runs.push(sideRun('left', 'Left wall', [-W / 2, RET + S], Math.PI / 2, false));
    if (shape === 'u') runs.push(sideRun('right', 'Right wall', [W / 2, RET], -Math.PI / 2, true));
    var gz = BASE_D + 1.2 + BASE_D;
    if (shape === 'galley') {
      var cg = countFor(W, 0, 0.3, 1.0, 0.6);
      runs.push({ id: 'opp', label: 'Opposite wall', len: W, pos: [W / 2, gz], rot: Math.PI, bench: [0, W], splash: null, items: baseUnits(W, cg.n) });
    }
    var island = null, iMax = shape === 'u' ? W - 2 * RET - 1.8 : shape === 'l' ? W - RET - 1.6 : W - 0.4;
    iMax = Math.max(1.2, Math.min(6.0, iMax));
    if (s.island === 'on' && shape !== 'galley') {
      var L = clamp(s.islandLen || 2.4, 1.2, iMax);
      var ic = countFor(L, 0, 0.3, 1.0, 0.6), inn = ic.n;
      if (islandSink) inn = Math.max(inn, s.dishwasher !== 'off' ? 3 : 2);
      var iItems = [];
      for (var q = 0; q < inn; q++) iItems.push({ t: 'base', x: r1(q * L / inn), w: r1(L / inn), kind: q === 0 || q === inn - 1 ? 'drawers' : 'door' });
      if (islandSink) {
        var si = Math.floor((inn - 1) / 2);
        iItems[si].kind = 'sink';
        if (s.dishwasher !== 'off') iItems[si + 1 < inn ? si + 1 : si - 1].kind = 'dw';
        fitWidths(iItems, L);
      }
      island = { len: L, cx: shape === 'l' ? RET / 2 + 0.3 : 0, z: BASE_D + 1.05, depth: 0.62, overhang: 0.34, items: iItems, seats: Math.max(1, Math.floor(L / 0.6)), waterfall: s.bench !== 'timber', sink: islandSink };
    }
    var depth = Math.max(3.6, shape === 'galley' ? gz + 1.2 : (island ? island.z + 1.9 : 2.6), corner ? RET + S + 1.0 : 0);
    return {
      kind: 'kitchen', shape: shape, runs: runs, island: island, room: { w: W, d: depth, h: 2.7, sideWalls: corner || shape === 'galley' },
      limits: { bases: [cnt.min, cnt.max], islandLen: [1.2, r1(iMax)] }, counts: { bases: n },
      sizes: { wall: W, side: S, islandLen: island ? island.len : 0 }, tallsAt: talls.length ? where : '',
      target: [0, 1.1, Math.min(1.6, depth / 2.4)], radius: Math.max(5.6, W * 1.15 + 1.4, corner ? S * 1.3 + 3 : 0)
    };
  }


  /* ---------------- laundry ---------------- */
  /* tub, cupboards, washer and dryer under the bench (or stacked in a tall space), optional broom cupboard */
  function laundry(s) {
    var mach = s.machines || 'stacked';
    var talls = [];
    if (mach === 'stacked') talls.push({ w: 0.7, kind: 'stack' });
    if (s.broom === 'on') talls.push({ w: 0.45, kind: 'broom' });
    var tallW = talls.reduce(function (a, t) { return a + t.w; }, 0);
    var app = mach === 'side' ? [{ kind: 'washer', w: 0.65 }, { kind: 'dryer', w: 0.65 }] : mach === 'washer' ? [{ kind: 'washer', w: 0.65 }] : [];
    var appW = app.reduce(function (a, t) { return a + t.w; }, 0);
    var minW = r1(tallW + 0.6 + appW);
    var W = clamp(s.lwall || 2.4, Math.max(1.2, minW), 4.0), B = r1(W - tallW);
    var rest = B - 0.6 - appW, items = [], x = 0;
    var tubW = rest < 0.3 ? 0.6 + rest : 0.6;
    items.push({ t: 'base', x: 0, w: r1(tubW), kind: 'tub' });
    x = tubW;
    if (rest >= 0.3) {
      var n = Math.max(1, Math.round(rest / 0.6)), cw = rest / n;
      for (var i = 0; i < n; i++) { items.push({ t: 'base', x: r1(x), w: r1(cw), kind: i === 0 ? 'drawers' : 'door' }); x += cw; }
    }
    app.forEach(function (a) { items.push({ t: 'base', x: r1(x), w: a.w, kind: a.kind }); x += a.w; });
    tallUnits(talls, W, items);
    var ups = s.overheads || 'full';
    if (ups !== 'none') upperUnits(0, B, ups, items);
    var back = { id: 'back', label: 'Laundry wall', len: W, pos: [-W / 2, 0], rot: 0, bench: [0, B], splash: [0, B], items: items };
    return {
      kind: 'laundry', shape: 'straight', runs: [back], island: null, room: { w: Math.max(W, 2.4), d: 2.6, h: 2.7, sideWalls: false },
      limits: { lwall: [Math.max(1.2, minW), 4.0] }, counts: {}, sizes: { lwall: W },
      target: [0, 1.1, 0.5], radius: Math.max(4.2, W * 1.2 + 1.8)
    };
  }

  /* ---------------- vanity ---------------- */
  /* wall-hung or floor-standing vanity, one or two above-counter basins, mirror or shaving cabinet, optional linen tower */
  function vanity(s) {
    var tower = s.tower === 'on' ? 0.4 : 0;
    var minW = r1(0.6 + tower);
    var W = clamp(s.vwall || 1.2, Math.max(0.6, minW), 2.4), B = r1(W - tower);
    var nb = s.basins === 'double' && B >= 1.2 ? 2 : 1;
    var n = Math.max(1, Math.round(B / 0.6)), cw = B / n, items = [];
    for (var i = 0; i < n; i++) items.push({ t: 'base', x: r1(i * cw), w: r1(cw), kind: s.vfront === 'doors' ? 'door' : 'drawers', dn: 2 });
    if (tower) items.push({ t: 'tall', x: r1(B), w: tower, kind: 'linen' });
    var basins = [];
    for (var b = 0; b < nb; b++) basins.push(r1(B * (b + 0.5) / nb));
    var mir = s.mirror || 'round';
    if (mir !== 'none') basins.forEach(function (cx) {
      var mw = mir === 'cabinet' ? Math.min(0.9, B / nb - 0.08) : Math.min(0.64, B / nb - 0.1);
      items.push({ t: 'mirror', x: r1(cx - mw / 2), w: r1(mw), kind: mir });
    });
    var back = { id: 'back', label: 'Vanity wall', len: W, pos: [-W / 2, 0], rot: 0, bench: [0, B], splash: null, items: items, basins: basins };
    return {
      kind: 'vanity', shape: 'straight', runs: [back], island: null, room: { w: Math.max(W + 1, 2.4), d: 2.2, h: 2.4, sideWalls: false },
      limits: { vwall: [Math.max(0.6, minW), 2.4] }, counts: { basins: nb }, sizes: { vwall: W },
      target: [0, 1.0, 0.35], radius: Math.max(3.0, W * 1.35 + 1.5)
    };
  }

  /* ---------------- wardrobes ---------------- */
  function builtin(s) {
    var W = clamp(s.width || 2.4, 0.9, 4.8), H = clamp(s.height || 2.4, 2.1, 2.7);
    var hinged = s.wdoors === 'hinged';
    var dc = hinged ? countFor(W, s.doorCount, 0.3, 0.65, 0.6) : countFor(W, s.panelCount, 0.6, 1.6, 1.0);
    if (!hinged) { dc.min = Math.max(2, dc.min); dc.max = Math.min(4, Math.max(dc.min, dc.max)); dc.n = clamp(dc.n, dc.min, dc.max); }
    var nd = dc.n;
    var nsec = hinged ? Math.ceil(nd / 2) : nd;
    var sections = fit(s.bsec, nsec, MIX[s.internals] || MIX.balanced);
    var run = { id: 'wall', label: 'Wall', len: W, pos: [-W / 2, 0], rot: 0, items: [] };
    var sw = W / nsec;
    sections.forEach(function (k, i) { run.items.push({ t: 'bay', x: r1(i * sw), w: r1(sw), kind: k }); });
    if (hinged) {
      // doors in pairs over sections; an odd door count gives a single door on the last section
      var x = 0, di = 0;
      for (var i2 = 0; i2 < nsec; i2++) {
        var pair = (i2 < nsec - 1 || nd % 2 === 0) ? 2 : 1, dw = sw / pair;
        for (var p = 0; p < pair; p++) { run.items.push({ t: 'door', x: r1(x + p * dw), w: r1(dw), hingeLeft: p === 1 || pair === 1 ? false : true, single: pair === 1, idx: di++ }); }
        if (pair === 2) run.items[run.items.length - 1].hingeLeft = false, run.items[run.items.length - 2].hingeLeft = true;
        x += sw;
      }
    } else {
      var pw = W / nd + 0.04;
      for (var k2 = 0; k2 < nd; k2++) run.items.push({ t: 'slide', x: r1(k2 * ((W - pw) / Math.max(1, nd - 1))), w: r1(pw), layer: k2 % 2 });
    }
    return {
      kind: 'builtin', runs: [run], height: H, room: { w: W, d: 3.2, h: Math.max(2.7, H + 0.2), sideWalls: false },
      sections: { wall: sections }, limits: { doors: [dc.min, dc.max] }, counts: { doors: nd },
      sizes: { width: W, height: H },
      target: [0, H / 2 + 0.05, 0.5], radius: Math.max(4.6, W * 1.25 + 2.2)
    };
  }

  function walkin(s) {
    var shape = s.wshape || 'u';
    var W = clamp(s.wwidth || 3.2, 1.8, 4.0), S = clamp(s.wside || 1.6, 1.0, 3.0), H = 2.4;
    var pat = MIX[s.internals] || MIX.balanced;
    var sec = s.wsec || {};
    var out = { back: null, left: null, right: null };
    var runs = [];
    var wc = s.wcount || {}, lim = {};
    function nsec(id, len) {
      var lo = Math.max(1, Math.ceil(len / 1.2 - 1e-6)), hi = Math.max(lo, Math.floor(len / 0.45 + 1e-6));
      lim[id] = [lo, hi];
      return clamp(wc[id] || Math.round(len / 0.8), lo, hi);
    }
    var nb = nsec('back', W);
    out.back = fit(sec.back, nb, pat);
    runs.push({ id: 'back', label: 'Back wall', len: W, pos: [-W / 2, 0], rot: 0, sections: out.back });
    if (shape === 'l' || shape === 'u') {
      out.left = fit(sec.left, nsec('left', S), pat, 3);
      runs.push({ id: 'left', label: 'Left wall', len: S, pos: [-W / 2, 0.6 + S], rot: Math.PI / 2, sections: out.left });
    }
    if (shape === 'u') {
      out.right = fit(sec.right, nsec('right', S), pat, 1);
      runs.push({ id: 'right', label: 'Right wall', len: S, pos: [W / 2, 0.6], rot: -Math.PI / 2, sections: out.right });
    }
    runs.forEach(function (r) {
      var bw = r.len / r.sections.length;
      r.items = r.sections.map(function (k, i) { return { t: 'bay', x: r1(i * bw), w: r1(bw), kind: k }; });
    });
    return {
      kind: 'walkin', runs: runs, height: H, room: { w: W, d: shape === 'straight' ? 2.6 : 0.6 + S + 0.9, h: 2.7, sideWalls: shape !== 'straight' },
      shape: shape, sections: out, limits: lim, sizes: { wwidth: W, wside: S },
      target: [0, 1.2, 0.9], radius: Math.max(5.0, W * 1.2 + 1.6)
    };
  }

  function build(mode, s) {
    var ds = setDims(mode, s);
    var m = mode === 'wardrobe' ? (s.wtype === 'walkin' ? walkin(s) : builtin(s)) : mode === 'laundry' ? laundry(s) : mode === 'vanity' ? vanity(s) : kitchen(s);
    m.sizes = m.sizes || {};
    Object.keys(ds).forEach(function (k) { if (m.sizes[k] === undefined) m.sizes[k] = ds[k]; });
    return m;
  }
  setDims('kitchen', {}); setDims('wardrobe', {});

  window.JCLayout = {
    build: build, SECTION: SECTION, MIX: MIX, fit: fit,
    dims: DIMS
  };
})();
