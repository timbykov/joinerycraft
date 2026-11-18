/* Joinerycraft kitchen design creator: builds an SVG front view from the chosen options. */
(function () {
  'use strict';
  var root = document.getElementById('designer');
  if (!root) return;

  var CABINET = [
    { val: 'white', name: 'Classic white', fill: '#f4f2ee', edge: '#d9d4cb' },
    { val: 'warmgrey', name: 'Warm grey', fill: '#cfc8bd', edge: '#b3aa9c' },
    { val: 'sage', name: 'Sage', fill: '#9fae96', edge: '#84937b' },
    { val: 'navy', name: 'Navy', fill: '#2f3d55', edge: '#222d40' },
    { val: 'charcoal', name: 'Charcoal', fill: '#3a3936', edge: '#272624' },
    { val: 'oak', name: 'Natural oak', fill: 'url(#oak)', swatch: '#c9a06e', edge: '#a8804f' },
    { val: 'walnut', name: 'Walnut', fill: 'url(#walnut)', swatch: '#6e4a31', edge: '#4f3422' }
  ];
  var BENCH = [
    { val: 'white', name: 'Pure white stone', fill: '#fbfbf9' },
    { val: 'calacatta', name: 'Calacatta stone', fill: 'url(#marble)', swatch: '#f1efea' },
    { val: 'concrete', name: 'Concrete grey stone', fill: '#a7a49f' },
    { val: 'black', name: 'Black stone', fill: '#262524' },
    { val: 'timber', name: 'Timber top', fill: 'url(#oak)', swatch: '#c9a06e' }
  ];
  var HANDLE = [
    { val: 'black', name: 'Matte black', fill: '#1d1d1d' },
    { val: 'brass', name: 'Brushed brass', fill: '#c4a15a' },
    { val: 'steel', name: 'Brushed steel', fill: '#a9adb1' },
    { val: 'none', name: 'No handles (push to open)', fill: 'none' }
  ];
  var LABELS = {
    layout: { wall: 'Wall-run kitchen', island: 'Kitchen with island', pantry: 'Kitchen with island and pantry' },
    door: { flat: 'flat panel doors', shaker: 'shaker doors', fingerpull: 'fingerpull doors' },
    splash: { subway: 'white subway tile splashback', stone: 'matching stone splashback', glass: 'smoked glass splashback' }
  };
  var lists = { cabinet: CABINET, bench: BENCH, handle: HANDLE };

  var ks = { layout: 'island', door: 'shaker', base: 'sage', upper: 'white', bench: 'calacatta', splash: 'subway', handle: 'brass' };
  var ws = { wtype: 'walkin', wdoors: 'hinged', door: 'shaker', finish: 'oak', internals: 'balanced', light: 'on', handle: 'black' };
  var mode = 'kitchen';
  var state = ks;

  /* Build swatch buttons */
  root.querySelectorAll('[data-swatches]').forEach(function (row) {
    lists[row.dataset.swatches].forEach(function (o) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'opt opt-swatch';
      b.dataset.val = o.val;
      b.title = o.name;
      b.setAttribute('aria-label', o.name);
      var dot = document.createElement('span');
      dot.className = 'dot';
      if (o.val === 'none') dot.classList.add('dot-none');
      else dot.style.background = o.swatch || o.fill;
      b.appendChild(dot);
      var t = document.createElement('span');
      t.className = 'opt-label';
      t.textContent = o.name.replace(' (push to open)', '');
      b.appendChild(t);
      row.appendChild(b);
    });
  });

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
      var i = Math.min(9, w * 0.12);
      out += rect(x + i, y + i, w - 2 * i, h - 2 * i, 'none', ' stroke="' + c.edge + '" stroke-width="2"');
      out += rect(x + i + 2, y + i + 2, w - 2 * i - 4, h - 2 * i - 4, 'rgba(0,0,0,0.03)');
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

  function baseRun(x0, x1, top, bottom, c, withOven) {
    var out = '';
    var w = x1 - x0;
    var n = Math.max(2, Math.round(w / 92));
    var dw = w / n;
    var ovenIdx = withOven ? Math.floor(n / 2) : -1;
    for (var i = 0; i < n; i++) {
      var x = x0 + i * dw;
      if (i === ovenIdx) {
        out += door(x, top, dw, 30, c, { drawer: true });
        out += rect(x + 4, top + 34, dw - 8, bottom - top - 38, '#1f1f1f', ' rx="3"');
        out += rect(x + 10, top + 42, dw - 20, 8, '#3c3c3c', ' rx="2"');
        out += rect(x + 12, top + 58, dw - 24, bottom - top - 72, '#2b2b2b', ' rx="2"');
      } else if (i % 3 === 0) {
        var dh = (bottom - top) / 3;
        for (var k = 0; k < 3; k++) out += door(x, top + k * dh, dw, dh, c, { drawer: true });
      } else {
        out += door(x, top, dw, bottom - top, c, { hingeLeft: i % 2 === 1 });
      }
    }
    return out;
  }

  function wardrobeSummary() {
    var fin = find(CABINET, ws.finish).name.toLowerCase();
    var hd = find(HANDLE, ws.handle);
    if (ws.wtype === 'walkin') {
      var mix = { balanced: 'a balanced mix of hanging, shelves and drawers', hanging: 'mostly hanging space', drawers: 'lots of drawers and shoe shelves' }[ws.internals];
      return 'Walk-in robe in ' + fin + ' with ' + mix + (ws.light === 'on' ? ', LED strip lighting' : '') + (hd.val === 'none' ? ', push-to-open drawers.' : ', ' + hd.name.toLowerCase() + ' handles.');
    }
    if (ws.wdoors === 'mirror') return 'Built-in robe with sliding mirror doors, ' + (hd.val === 'none' ? 'aluminium' : hd.name.toLowerCase()) + ' frames, ' + fin + ' interior.';
    if (ws.wdoors === 'slidingpanel') return 'Built-in robe with sliding doors in ' + fin + ', ' + (hd.val === 'none' ? 'aluminium' : hd.name.toLowerCase()) + ' frames.';
    var hs = ws.door === 'fingerpull' ? 'fingerpull (no handles)' : (hd.val === 'none' ? 'push-to-open' : hd.name.toLowerCase() + ' handles');
    return 'Built-in robe with hinged ' + LABELS.door[ws.door] + ' in ' + fin + ', ' + hs + '.';
  }

  function renderWardrobe() {
    var c = find(CABINET, ws.finish);
    var hd = find(HANDLE, ws.handle);
    var trim = hd.val === 'none' ? '#b9bcbf' : hd.fill;
    var W = 800, H = 520, x0 = 90, x1 = 710, top = 50, floorY = 450;
    var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet"><defs>' +
      '<pattern id="oak" width="60" height="16" patternUnits="userSpaceOnUse"><rect width="60" height="16" fill="#c9a06e"/><path d="M0 4 Q15 2 30 5 T60 4" stroke="#b48a58" stroke-width="1.4" fill="none"/><path d="M0 11 Q20 13 35 10 T60 12" stroke="#d8b483" stroke-width="1.2" fill="none"/></pattern>' +
      '<pattern id="walnut" width="60" height="16" patternUnits="userSpaceOnUse"><rect width="60" height="16" fill="#6e4a31"/><path d="M0 5 Q15 3 30 6 T60 5" stroke="#5a3b26" stroke-width="1.5" fill="none"/><path d="M0 12 Q20 14 35 11 T60 13" stroke="#80583c" stroke-width="1.2" fill="none"/></pattern>' +
      '<linearGradient id="mirror" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#dfe5e9"/><stop offset=".45" stop-color="#f6f8f9"/><stop offset=".55" stop-color="#cfd7dc"/><stop offset="1" stop-color="#e6ebee"/></linearGradient>' +
      '<linearGradient id="floor" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#d8cdbd"/><stop offset="1" stop-color="#c7b9a5"/></linearGradient>' +
      '<linearGradient id="led" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#ffe7b0" stop-opacity=".9"/><stop offset="1" stop-color="#ffe7b0" stop-opacity="0"/></linearGradient>' +
      '</defs>';
    svg += rect(0, 0, W, floorY, '#efe9e0') + rect(0, floorY, W, H - floorY, 'url(#floor)');
    svg += '<ellipse cx="400" cy="' + (floorY + 6) + '" rx="330" ry="9" fill="rgba(0,0,0,.1)"/>';

    if (ws.wtype === 'builtin') {
      svg += rect(x0 - 6, top - 6, x1 - x0 + 12, floorY - top + 6, '#e4ddd2');
      if (ws.wdoors === 'hinged') {
        var n = 6, dw = (x1 - x0) / n;
        for (var i = 0; i < n; i++) svg += door(x0 + i * dw, top, dw, floorY - top - 14, c, { hingeLeft: i % 2 === 1, tall: true });
        svg += rect(x0, floorY - 14, x1 - x0, 14, 'rgba(0,0,0,.3)');
      } else {
        var pn = 3, pw = (x1 - x0) / pn + 14;
        for (var k = 0; k < pn; k++) {
          var px = x0 + k * ((x1 - x0 - pw) / (pn - 1));
          var fill = ws.wdoors === 'mirror' ? 'url(#mirror)' : c.fill;
          svg += rect(px, top, pw, floorY - top, fill, ' stroke="' + trim + '" stroke-width="5"');
          if (ws.wdoors === 'mirror') svg += '<path d="M' + (px + 30) + ' ' + (top + 40) + ' L' + (px + 90) + ' ' + (top + 160) + '" stroke="#fff" stroke-width="6" opacity=".6"/>';
        }
        svg += rect(x0, top - 6, x1 - x0, 6, trim) + rect(x0, floorY - 4, x1 - x0, 4, trim);
      }
    } else {
      var bays = ws.internals === 'hanging' ? ['hang2', 'hang', 'shelf', 'hang', 'hang2'] :
        ws.internals === 'drawers' ? ['shoes', 'drawers', 'hang', 'drawers', 'shoes'] :
        ['hang2', 'shelf', 'drawers', 'hang', 'shoes'];
      var bw = (x1 - x0) / bays.length, inner = '#f7f4ef';
      svg += rect(x0 - 8, top - 8, x1 - x0 + 16, floorY - top + 8, c.fill, ' stroke="' + c.edge + '"');
      bays.forEach(function (b, i) {
        var bx = x0 + i * bw + 6, bwi = bw - 12, by = top + 6, bh = floorY - top - 20;
        svg += rect(bx, by, bwi, bh, inner);
        if (ws.light === 'on') svg += rect(bx, by, bwi, 60, 'url(#led)') + rect(bx, by, bwi, 3, '#ffe7b0');
        svg += rect(bx, by + 34, bwi, 6, c.fill);
        var clothes = ['#8d9aa8', '#d9c9b3', '#5d6a63', '#b88a7a', '#e8e3da', '#3f4650', '#a7b49c'];
        function rail(ry, len) {
          var out = rect(bx + 4, ry, bwi - 8, 3, trim);
          for (var q = 0; q < Math.floor((bwi - 14) / 11); q++) out += rect(bx + 8 + q * 11, ry + 5, 8, len - (q % 3) * 12, clothes[(q + i) % clothes.length], ' rx="2"');
          return out;
        }
        function drawers(dy, count) {
          var out = '', dh = (by + bh - dy) / count;
          for (var q = 0; q < count; q++) out += door(bx, dy + q * dh, bwi, dh - 2, c, { drawer: true });
          return out;
        }
        if (b === 'hang') svg += rail(by + 56, 250);
        if (b === 'hang2') svg += rail(by + 56, 130) + rect(bx, by + 205, bwi, 5, c.fill) + rail(by + 222, 140);
        if (b === 'shelf') for (var sy = by + 90; sy < by + bh - 20; sy += 56) { svg += rect(bx, sy, bwi, 5, c.fill); svg += rect(bx + 10, sy - 22, bwi - 24, 22, ['#c8b9a3', '#e6ded1', '#9aa5ad'][Math.floor(sy) % 3], ' rx="2"'); }
        if (b === 'drawers') { svg += rect(bx, by + 110, bwi, 5, c.fill) + rect(bx + 12, by + 80, bwi - 28, 30, '#d9cfc0', ' rx="2"'); svg += drawers(by + 160, 5); }
        if (b === 'shoes') for (var hy = by + 70; hy < by + bh - 20; hy += 42) {
          svg += '<path d="M' + bx + ' ' + (hy + 18) + ' L' + (bx + bwi) + ' ' + hy + '" stroke="' + (c.val === 'oak' || c.val === 'walnut' ? c.edge : c.fill) + '" stroke-width="5"/>';
          svg += rect(bx + 14, hy - 4, 20, 9, '#3a3936', ' rx="4"') + rect(bx + 46, hy - 8, 20, 9, '#b88a7a', ' rx="4"');
        }
      });
      svg += rect(x0, floorY - 14, x1 - x0, 14, 'rgba(0,0,0,.3)');
    }
    svg += '</svg>';
    document.getElementById('designPreview').innerHTML = svg;
    syncControls();
    if (window.JC3D && view3d) window.JC3D.update();
  }

  function render() {
    if (mode === 'wardrobe') return renderWardrobe();
    var base = find(CABINET, state.base);
    var upper = find(CABINET, state.upper);
    var bench = find(BENCH, state.bench);
    var W = 800, H = 520;
    var left = 50, right = state.layout === 'pantry' ? 650 : 750;
    var benchY = 300, baseTop = 314, baseBot = 432, kick = 446;
    var upTop = 64, upBot = 196;
    var hoodX = (left + right) / 2 - 60, hoodW = 120;

    var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">';
    svg += '<defs>' +
      '<pattern id="oak" width="60" height="16" patternUnits="userSpaceOnUse"><rect width="60" height="16" fill="#c9a06e"/><path d="M0 4 Q15 2 30 5 T60 4" stroke="#b48a58" stroke-width="1.4" fill="none"/><path d="M0 11 Q20 13 35 10 T60 12" stroke="#d8b483" stroke-width="1.2" fill="none"/></pattern>' +
      '<pattern id="walnut" width="60" height="16" patternUnits="userSpaceOnUse"><rect width="60" height="16" fill="#6e4a31"/><path d="M0 5 Q15 3 30 6 T60 5" stroke="#5a3b26" stroke-width="1.5" fill="none"/><path d="M0 12 Q20 14 35 11 T60 13" stroke="#80583c" stroke-width="1.2" fill="none"/></pattern>' +
      '<pattern id="marble" width="220" height="40" patternUnits="userSpaceOnUse"><rect width="220" height="40" fill="#f3f1ec"/><path d="M0 30 C40 22 70 34 110 18 S180 8 220 16" stroke="#b9b4ab" stroke-width="1.3" fill="none"/><path d="M30 0 C60 12 90 6 120 26 S170 38 200 40" stroke="#d2cdc4" stroke-width="1" fill="none"/></pattern>' +
      '<pattern id="subway" width="48" height="24" patternUnits="userSpaceOnUse"><rect width="48" height="24" fill="#f7f7f5"/><path d="M0 0.5H48M0 12.5H48M0.5 0V12M24.5 12V24" stroke="#d7d5d0" stroke-width="1"/></pattern>' +
      '<linearGradient id="glass" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#4a4d50"/><stop offset=".5" stop-color="#5d6164"/><stop offset="1" stop-color="#3e4144"/></linearGradient>' +
      '<linearGradient id="floor" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#d8cdbd"/><stop offset="1" stop-color="#c7b9a5"/></linearGradient>' +
      '</defs>';

    // room
    svg += rect(0, 0, W, kick, '#efe9e0');
    svg += rect(0, kick, W, H - kick, 'url(#floor)');
    // pendant lights
    if (state.layout !== 'wall') {
      [300, 400, 500].forEach(function (px) {
        svg += '<line x1="' + px + '" y1="0" x2="' + px + '" y2="232" stroke="#2a2a2a" stroke-width="1.5"/>';
        svg += '<path d="M' + (px - 16) + ' 252 Q' + px + ' 222 ' + (px + 16) + ' 252 Z" fill="' + (state.handle === 'brass' ? '#c4a15a' : '#2a2a2a') + '"/>';
      });
    }

    // splashback
    var splashFill = state.splash === 'subway' ? 'url(#subway)' : state.splash === 'glass' ? 'url(#glass)' : bench.fill;
    svg += rect(left, upBot, right - left, benchY - upBot, splashFill);

    // overheads (leave a gap for the rangehood)
    var upW = (hoodX - left);
    var nUp = Math.max(2, Math.round(upW / 90));
    var uw = upW / nUp;
    for (var i = 0; i < nUp; i++) svg += door(left + i * uw, upTop, uw, upBot - upTop, upper, { upper: true, hingeLeft: i % 2 === 0 });
    var upW2 = right - (hoodX + hoodW);
    var nUp2 = Math.max(2, Math.round(upW2 / 90));
    var uw2 = upW2 / nUp2;
    for (var j = 0; j < nUp2; j++) svg += door(hoodX + hoodW + j * uw2, upTop, uw2, upBot - upTop, upper, { upper: true, hingeLeft: j % 2 === 0 });
    // rangehood
    svg += rect(hoodX, upTop, hoodW, 96, upper.fill, ' stroke="' + upper.edge + '" stroke-width="1.2"');
    svg += '<path d="M' + (hoodX - 8) + ' ' + (upTop + 96) + ' H' + (hoodX + hoodW + 8) + ' L' + (hoodX + hoodW) + ' ' + (upTop + 132) + ' H' + hoodX + ' Z" fill="#9b9ea1"/>';
    // cooktop
    svg += rect(hoodX + 14, benchY - 4, hoodW - 28, 4, '#1f1f1f');

    // benchtop & bases
    svg += rect(left - 6, benchY, right - left + 12, baseTop - benchY, bench.fill, ' stroke="rgba(0,0,0,.12)"');
    svg += baseRun(left, right, baseTop, baseBot, base, true);
    svg += rect(left, baseBot, right - left, kick - baseBot, 'rgba(0,0,0,.35)');
    // sink tap on wall run
    var tapX = left + 110;
    svg += '<path d="M' + tapX + ' ' + benchY + ' V' + (benchY - 34) + ' Q' + tapX + ' ' + (benchY - 44) + ' ' + (tapX + 12) + ' ' + (benchY - 44) + ' Q' + (tapX + 22) + ' ' + (benchY - 44) + ' ' + (tapX + 22) + ' ' + (benchY - 32) + '" stroke="' + (state.handle === 'brass' ? '#c4a15a' : '#2a2a2a') + '" stroke-width="4" fill="none" stroke-linecap="round"/>';

    // pantry
    if (state.layout === 'pantry') {
      var px0 = 654, pw = 96;
      svg += door(px0, upTop, pw / 2, kick - upTop - 14, upper, { hingeLeft: false, tall: true });
      svg += door(px0 + pw / 2, upTop, pw / 2, kick - upTop - 14, upper, { hingeLeft: true, tall: true });
      svg += rect(px0, kick - 14, pw, 14, 'rgba(0,0,0,.35)');
    }

    // island
    if (state.layout !== 'wall') {
      var ix0 = 170, ix1 = 630, iTop = 360, iBench = 346, iBot = 494;
      svg += '<ellipse cx="400" cy="' + (iBot + 8) + '" rx="250" ry="10" fill="rgba(0,0,0,.12)"/>';
      svg += rect(ix0 - 18, iBench, ix1 - ix0 + 36, iTop - iBench, bench.fill, ' stroke="rgba(0,0,0,.15)"');
      if (state.bench !== 'timber') {
        svg += rect(ix0 - 18, iTop, 14, iBot - iTop, bench.fill, ' stroke="rgba(0,0,0,.12)"');
        svg += rect(ix1 + 4, iTop, 14, iBot - iTop, bench.fill, ' stroke="rgba(0,0,0,.12)"');
      }
      var n = 4, iw = (ix1 - ix0) / n;
      for (var k = 0; k < n; k++) svg += door(ix0 + k * iw, iTop, iw, iBot - iTop, base, { hingeLeft: k % 2 === 1 });
      // stools
      [260, 400, 540].forEach(function (sx) {
        var col = state.handle === 'brass' ? '#c4a15a' : '#2a2a2a';
        svg += rect(sx - 22, 418, 44, 10, '#6b5a4a', ' rx="5"');
        svg += '<path d="M' + (sx - 16) + ' 428 L' + (sx - 22) + ' 512 M' + (sx + 16) + ' 428 L' + (sx + 22) + ' 512 M' + (sx - 19) + ' 478 H' + (sx + 19) + '" stroke="' + col + '" stroke-width="3" fill="none"/>';
      });
    }
    svg += '</svg>';
    document.getElementById('designPreview').innerHTML = svg;
    syncControls();
    if (window.JC3D && view3d) window.JC3D.update();
  }

  function syncControls() {
    document.getElementById('designSummary').textContent = summary();
    root.querySelectorAll('.opt-group').forEach(function (g) {
      var only = g.dataset.only;
      var show = g.dataset.mode === mode;
      if (show && only) {
        if (only === 'builtin' || only === 'walkin') show = ws.wtype === only;
        else show = ws.wtype === 'builtin' && ws.wdoors === only;
      }
      g.hidden = !show;
      var key = g.dataset.opt;
      g.querySelectorAll('.opt').forEach(function (b) {
        var on = b.dataset.val === state[key];
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', String(on));
      });
    });
  }

  function summary() {
    if (mode === 'wardrobe') return wardrobeSummary();
    var base = find(CABINET, state.base).name, upper = find(CABINET, state.upper).name;
    var colours = base === upper ? base.toLowerCase() : base.toLowerCase() + ' base with ' + upper.toLowerCase() + ' overheads';
    var handles = state.door === 'fingerpull' ? 'fingerpull (no handles)' : find(HANDLE, state.handle).name.toLowerCase() + (state.handle === 'none' ? '' : ' handles');
    return LABELS.layout[state.layout] + ': ' + LABELS.door[state.door] + ' in ' + colours + ', ' +
      find(BENCH, state.bench).name.toLowerCase() + ' benchtop, ' + LABELS.splash[state.splash] + ', ' + handles + '.';
  }

  root.querySelectorAll('[data-mode-tab]').forEach(function (t) {
    t.addEventListener('click', function () {
      mode = t.dataset.modeTab;
      state = mode === 'kitchen' ? ks : ws;
      root.querySelectorAll('[data-mode-tab]').forEach(function (x) {
        var on = x === t;
        x.classList.toggle('is-active', on);
        x.setAttribute('aria-pressed', String(on));
      });
      render();
    });
  });

  root.addEventListener('click', function (e) {
    var b = e.target.closest('.opt');
    if (!b) return;
    var g = b.closest('.opt-group');
    state[g.dataset.opt] = b.dataset.val;
    render();
  });

  document.getElementById('designRandom').addEventListener('click', function () {
    function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
    if (mode === 'wardrobe') {
      ws.wtype = pick(['builtin', 'walkin']);
      ws.wdoors = pick(['hinged', 'slidingpanel', 'mirror']);
      ws.door = pick(['flat', 'shaker', 'fingerpull']);
      ws.finish = pick(CABINET).val;
      ws.internals = pick(['balanced', 'hanging', 'drawers']);
      ws.light = pick(['on', 'off']);
      ws.handle = pick(HANDLE).val;
      return render();
    }
    state.layout = pick(['wall', 'island', 'pantry']);
    state.door = pick(['flat', 'shaker', 'fingerpull']);
    state.base = pick(CABINET).val;
    state.upper = Math.random() < 0.55 ? 'white' : state.base;
    state.bench = pick(BENCH).val;
    state.splash = pick(['subway', 'stone', 'glass']);
    state.handle = pick(HANDLE).val;
    render();
  });

  document.getElementById('designSend').addEventListener('click', function () {
    var text = 'My design: ' + summary();
    var field = document.getElementById('designField');
    if (field) field.value = text;
    var form = document.getElementById('quoteForm');
    if (!form) return;
    var details = form.querySelector('#details');
    if (details && details.value.indexOf('My design:') === -1) details.value = text + (details.value ? '\n' + details.value : '');
    var radio = form.querySelector('input[name=project][value="' + (mode === 'wardrobe' ? 'Wardrobes' : 'Kitchen') + '"]');
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
    CABINET: CABINET, BENCH: BENCH, HANDLE: HANDLE
  };
  var pane3d = document.getElementById('design3d');
  var pane2d = document.getElementById('designPreview');
  function loadScript(src, cb) {
    var s = document.createElement('script');
    s.src = src; s.async = true;
    s.onload = cb;
    s.onerror = function () { pane3d.classList.remove('is-loading'); pane3d.insertAdjacentHTML('beforeend', '<p class="d3-error">The 3D view couldn\'t load. Check your connection and try again.</p>'); loading3d = false; };
    document.head.appendChild(s);
  }
  function setView(v) {
    view3d = v === '3d';
    root.querySelectorAll('[data-view]').forEach(function (b) {
      var on = b.dataset.view === v;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', String(on));
    });
    pane2d.hidden = view3d;
    pane3d.hidden = !view3d;
    if (!view3d) return;
    if (window.JC3D) return window.JC3D.update();
    if (loading3d) return;
    loading3d = true;
    pane3d.classList.add('is-loading');
    var three = window.THREE ? function (cb) { cb(); } : function (cb) { loadScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js', cb); };
    three(function () {
      loadScript('js/designer3d.js', function () { pane3d.classList.remove('is-loading'); });
    });
  }
  root.querySelectorAll('[data-view]').forEach(function (b) {
    b.addEventListener('click', function () { setView(b.dataset.view); });
  });

  render();
})();
