/* Joinerycraft design creator: export.
   Turns the current design into a cabinet list (CSV, sizes in mm) that can be
   mapped into Cabinet Vision / Mozaik / 3D Kitchens, and a 3D model (.glb).
   Sizes come from the same layout model as the front and 3D views (js/layout.js). */
(function () {
  'use strict';
  var D = window.JCDesigner;
  if (!D) return;

  function find(list, v) { for (var i = 0; i < list.length; i++) if (list[i].val === v) return list[i]; return list[0]; }
  function board(v) { var b = find(D.CABINET, v); return { brand: b.brand || '', name: b.name }; }
  function handleName(v) { return find(D.HANDLE, v).name; }
  var DOOR = { flat: 'Flat panel', shaker: 'Shaker', fingerpull: 'Fingerpull' };
  var r = Math.round;

  var DIM = window.JCLayout.dims, SEC = window.JCLayout.SECTION;
  var BASE_H, UP_H, TALL_H;
  function heights() { BASE_H = (DIM.BASE_TOP - DIM.KICK) * 1000; UP_H = (DIM.UP_TOP - DIM.UP_BOT) * 1000; TALL_H = (DIM.TALL_TOP - DIM.KICK) * 1000; }
  var BASE_DESC = {
    door: function (w) { return w > 650 ? '2 door base' : '1 door base'; },
    drawers: function (w, it) { return (it.dn || 3) + ' drawer ' + (D.mode === 'vanity' ? 'vanity' : 'base'); },
    tub: function (w) { return (w > 650 ? '2 door' : '1 door') + ' laundry tub base'; },
    oven: function () { return 'Oven housing with drawer above'; },
    sink: function (w) { return (w > 650 ? '2 door' : '1 door') + ' sink base'; },
    dw: function () { return 'Dishwasher space with integrated panel'; },
    corner: function () { return 'Blind corner base'; }
  };

  function kitchenRows(s) {
    var rows = [], base = board(s.base), up = board(s.upper), bench = find(D.BENCH, s.bench), m = D.model();
    var door = DOOR[s.door], hd = s.door === 'fingerpull' ? 'Fingerpull' : handleName(s.handle);
    function add(loc, type, desc, w, h, d, qty, mat, notes) {
      rows.push({ location: loc, type: type, description: desc, width: r(w), height: r(h), depth: r(d), qty: qty || 1,
        door: mat ? door : '', brand: mat ? mat.brand : '', colour: mat ? mat.name : '', handles: mat ? hd : '', notes: notes || '' });
    }
    var V = D.mode === 'vanity', bDepth = r((DIM.BASE_D + 0.04) * 1000), bT = r(DIM.BENCH_T * 1000);
    var kick = 0, benchName = bench.val === 'timber' ? 'Timber' : bench.brand + ' ' + bench.name;
    var sp = { subway: 'Subway tile (by others)', stone: 'Stone to match benchtop', glass: 'Smoked glass' }[s.splash];
    var splashH = s.overheads === 'none' ? 300 : (DIM.UP_BOT - DIM.BASE_TOP - DIM.BENCH_T) * 1000;
    m.runs.forEach(function (run) {
      var loc = run.label;
      run.items.forEach(function (it) {
        var w = it.w * 1000;
        if (it.t === 'base' && (it.kind === 'washer' || it.kind === 'dryer')) {
          rows.push({ location: loc, type: 'Space', description: (it.kind === 'washer' ? 'Washing machine' : 'Dryer') + ' space under bench', width: r(w), height: r(DIM.BASE_TOP * 1000), depth: 0, qty: 1, door: '', brand: '', colour: '', handles: '', notes: 'Front loader by others' });
        } else if (it.t === 'base') {
          kick += w;
          add(loc, V ? 'Vanity' : 'Base', BASE_DESC[it.kind](w, it), w, BASE_H, r(DIM.BASE_D * 1000 - 20), 1, base,
            ((V && DIM.FLOAT ? 'Wall-hung, ' + r(DIM.KICK * 1000) + ' mm off the floor. ' : '') +
            ({ oven: 'Under cooktop', sink: 'Sink and tap above', tub: 'Inset laundry tub and tap above', dw: '600 mm dishwasher by others', corner: 'Blind corner, ' + (it.side === 'L' ? 'left' : 'right') + ' end' }[it.kind] || '')).trim());
        } else if (it.t === 'mirror') {
          if (it.kind === 'cabinet') add(loc, 'Wall', 'Mirror shaving cabinet', w, UP_H, r(DIM.UP_D * 1000), 1, up, (w > 650 ? '2' : '1') + ' mirror doors, bottom at ' + r(DIM.UP_BOT * 1000) + ' mm');
          else rows.push({ location: loc, type: 'Mirror', description: 'Round mirror', width: r(Math.min(640, w)), height: r(Math.min(640, w)), depth: 0, qty: 1, door: '', brand: '', colour: '', handles: '', notes: 'By others, centred over basin' });
        } else if (it.t === 'upper') add(loc, 'Wall', '1 door wall cabinet', w, UP_H, r(DIM.UP_D * 1000), 1, up, '');
        else if (it.t === 'shelf') add(loc, 'Wall', 'Open shelves x 2', w, 35, 260, 2, up, 'Floating shelves at 1620 and 1980 mm');
        else if (it.t === 'hood') add(loc, 'Wall', 'Rangehood canopy', w, 420, 420, 1, up, 'Rangehood insert by others');
        else if (it.t === 'tall' && it.kind === 'pantry') { kick += w; add(loc, 'Tall', '2 door pantry', w, TALL_H, 600, 1, up, ''); }
        else if (it.t === 'tall' && it.kind === 'broom') { kick += w; add(loc, 'Tall', '1 door broom cupboard', w, TALL_H, 600, 1, up, ''); }
        else if (it.t === 'tall' && it.kind === 'linen') { if (!DIM.FLOAT) kick += w; add(loc, 'Tall', '1 door linen tower', w, TALL_H, r(DIM.BASE_D * 1000 - 20), 1, base, DIM.FLOAT ? 'Wall-hung' : ''); }
        else if (it.t === 'tall' && it.kind === 'stack') {
          add(loc, 'Wall', 'Cupboard over washer and dryer', w - 36, r((DIM.TALL_TOP - 1.8) * 1000), 600, 1, up, '');
          add(loc, 'Panel', 'Washer/dryer tower end panels', 18, DIM.TALL_TOP * 1000, 620, 2, up, 'Stacked washer and dryer by others, space ' + r(w - 36) + ' mm wide');
        }
        else if (it.t === 'tall') {
          add(loc, 'Wall', 'Bridging cupboard over fridge', w - 36, 300, 600, 1, up, '');
          add(loc, 'Panel', 'Fridge end panels', 18, DIM.TALL_TOP * 1000, 620, 2, up, 'Fridge space ' + r(w - 36) + ' mm wide');
        }
      });
      if (run.bench) {
        var bl = (run.bench[1] - run.bench[0]) * 1000;
        rows.push({ location: loc, type: 'Benchtop', description: bT + ' mm ' + (V ? 'vanity top' : 'benchtop'), width: r(bl), height: bT, depth: bDepth, qty: 1, door: '', brand: bench.brand, colour: bench.name, handles: '', notes: benchName });
      }
      if (run.splash) rows.push({ location: loc, type: 'Splashback', description: sp, width: r((run.splash[1] - run.splash[0]) * 1000), height: r(splashH), depth: 0, qty: 1, door: '', brand: s.splash === 'stone' ? bench.brand : '', colour: s.splash === 'stone' ? bench.name : '', handles: '', notes: '' });
    });
    if (m.island) {
      var I = m.island;
      I.items.forEach(function (it) {
        kick += it.w * 1000;
        add('Island', 'Base', it.kind === 'drawers' ? '3 drawer base' : (it.w > 0.65 ? '2 door base' : '1 door base'), it.w * 1000, BASE_H, 600, 1, base, 'Faces back wall');
      });
      var wf = I.waterfall, iw = I.len * 1000 + (wf ? 80 : 40), idp = (I.depth + I.overhang) * 1000;
      rows.push({ location: 'Island', type: 'Benchtop', description: '40 mm island top with ' + r(I.overhang * 1000) + ' mm seating overhang' + (wf ? ' and 2 waterfall ends' : ''), width: r(iw), height: 40, depth: r(idp), qty: 1, door: '', brand: bench.brand, colour: bench.name, handles: '', notes: (wf ? 'Waterfall ends ' + r(idp) + ' x ' + r(DIM.BASE_TOP * 1000) + ' x 40. ' : '') + 'Seats ' + I.seats });
    }
    (m.runs[0].basins || []).forEach(function (cx, i) {
      rows.push({ location: m.runs[0].label, type: 'Basin', description: 'Above-counter basin with wall tap', width: 400, height: 130, depth: 0, qty: 1, door: '', brand: '', colour: '', handles: '', notes: 'By others. Centre ' + r(cx * 1000) + ' mm from left end' });
    });
    if (kick > 0 && !DIM.FLOAT) add('All', 'Kickboard', 'Kickboards', kick, r(DIM.KICK * 1000), 0, 1, null, 'Total length. Dark or matching, ' + r(DIM.KICK * 1000) + ' mm high');
    return rows;
  }

  function wardrobeRows(s) {
    var rows = [], fin = board(s.finish), hd = handleName(s.handle), m = D.model();
    function add(loc, type, desc, w, h, d, qty, notes, door, handles) {
      rows.push({ location: loc, type: type, description: desc, width: r(w), height: r(h), depth: r(d), qty: qty || 1,
        door: door || '', brand: fin.brand, colour: fin.name, handles: handles || '', notes: notes || '' });
    }
    function drawerNote(k) { return k === 'drawers' ? '4 drawers, ' + (s.handle === 'none' ? 'push to open' : hd + ' handles') : ''; }
    if (m.kind === 'builtin') {
      var run = m.runs[0], H = m.height * 1000;
      var bays = run.items.filter(function (it) { return it.t === 'bay'; });
      if (s.wdoors === 'hinged') {
        var doors = run.items.filter(function (it) { return it.t === 'door'; });
        bays.forEach(function (b, i) {
          var nd = doors.filter(function (d) { return d.x >= b.x - 0.001 && d.x < b.x + b.w - 0.001; }).length;
          add('Wall', 'Tall', nd + ' door robe: ' + SEC[b.kind].toLowerCase(), b.w * 1000, H, r(DIM.W_D * 1000), 1, 'Section ' + (i + 1) + ', on 80 mm kick. ' + drawerNote(b.kind), DOOR[s.door], s.door === 'fingerpull' ? 'Fingerpull' : hd);
        });
      } else {
        bays.forEach(function (b, i) { add('Wall', 'Robe carcass', 'Robe section: ' + SEC[b.kind].toLowerCase(), b.w * 1000, H, r(DIM.W_D * 1000), 1, 'Section ' + (i + 1) + '. ' + drawerNote(b.kind)); });
        var sl = run.items.filter(function (it) { return it.t === 'slide'; });
        add('Wall', 'Sliding door', s.wdoors === 'mirror' ? 'Sliding mirror door' : 'Sliding door, board panel', sl[0].w * 1000, H - 60, 0, sl.length, (s.handle === 'none' ? 'Aluminium' : hd) + ' frames, top and bottom tracks ' + r(m.sizes.width * 1000) + ' mm', s.wdoors === 'mirror' ? 'Mirror' : 'Board panel', '');
      }
      return rows;
    }
    m.runs.forEach(function (run) {
      run.items.forEach(function (b, i) {
        var dr = b.kind === 'drawers';
        add(run.label, 'Open bay', SEC[b.kind], b.w * 1000, m.height * 1000, r(DIM.W_D * 1000), 1, 'Section ' + (i + 1) + (dr ? '. ' + drawerNote(b.kind) : ''), dr ? 'Flat panel' : '', dr ? hd : '');
      });
    });
    if (s.light === 'on') rows.push({ location: 'All', type: 'Lighting', description: 'LED strip lighting under top panels', width: 0, height: 0, depth: 0, qty: 1, door: '', brand: '', colour: '', handles: '', notes: 'Electrician by others' });
    return rows;
  }

  function rows() {
    heights();
    return D.mode === 'wardrobe' ? wardrobeRows(D.state) : kitchenRows(D.state);
  }

  var COLS = [['item', 'Item'], ['location', 'Location'], ['type', 'Type'], ['description', 'Description'], ['width', 'Width (mm)'], ['height', 'Height (mm)'], ['depth', 'Depth (mm)'], ['qty', 'Qty'], ['door', 'Door style'], ['brand', 'Brand'], ['colour', 'Colour'], ['handles', 'Handles'], ['notes', 'Notes']];
  function csv() {
    var list = rows();
    var out = [COLS.map(function (c) { return c[1]; }).join(',')];
    list.forEach(function (row, i) {
      row.item = i + 1;
      out.push(COLS.map(function (c) {
        var v = row[c[0]] === 0 && c[0] !== 'qty' ? '' : String(row[c[0]] == null ? '' : row[c[0]]);
        return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
      }).join(','));
    });
    return '# Joinerycraft design: ' + (document.getElementById('designSummary') || {}).textContent + '\n' + out.join('\n') + '\n';
  }

  function save(blob, name) {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }
  function stamp() { var d = new Date(); return d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0'); }

  function loadScript(src) {
    return new Promise(function (res, rej) {
      var s = document.createElement('script');
      s.src = src; s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
  }
  /* Resolves with the 3D model as a binary .glb ArrayBuffer. */
  function glbBuffer() {
    return D.ensure3D().then(function () {
      if (window.THREE.GLTFExporter) return;
      return loadScript('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/exporters/GLTFExporter.js');
    }).then(function () {
      window.JC3D.update();
      var obj = window.JC3D.model();
      return new Promise(function (res) {
        new window.THREE.GLTFExporter().parse(obj, res, { binary: true, onlyVisible: true, maxTextureSize: 512 });
      });
    });
  }
  /* The same model as base64, for attaching to the quote email. */
  function glbBase64() {
    return glbBuffer().then(function (buf) {
      var bytes = new Uint8Array(buf), bin = '';
      for (var i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
      return btoa(bin);
    });
  }
  function glb(btn) {
    var label = btn.textContent;
    btn.textContent = 'Preparing 3D model…';
    btn.disabled = true;
    glbBuffer().then(function (result) {
      save(new Blob([result], { type: 'model/gltf-binary' }), 'joinerycraft-' + D.mode + '-' + stamp() + '.glb');
      btn.textContent = label; btn.disabled = false;
    }).catch(function () { btn.textContent = 'Couldn’t export, try again'; btn.disabled = false; });
  }

  document.getElementById('exportCsv').addEventListener('click', function () {
    save(new Blob([csv()], { type: 'text/csv' }), 'joinerycraft-' + D.mode + '-cabinets-' + stamp() + '.csv');
  });
  document.getElementById('exportGlb').addEventListener('click', function () { glb(this); });

  window.JCExport = { csv: csv, rows: rows, glbBase64: glbBase64, mode: function () { return D.mode; } };
})();
