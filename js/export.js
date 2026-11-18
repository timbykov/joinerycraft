/* Joinerycraft design creator: export.
   Turns the current design into a cabinet list (CSV, sizes in mm) that can be
   mapped into Cabinet Vision / Mozaik / 3D Kitchens, and a 3D model (.glb).
   The sizes match the 3D view. */
(function () {
  'use strict';
  var D = window.JCDesigner;
  if (!D) return;

  function find(list, v) { for (var i = 0; i < list.length; i++) if (list[i].val === v) return list[i]; return list[0]; }
  function board(v) { var b = find(D.CABINET, v); return { brand: b.brand || '', name: b.name }; }
  function handleName(v) { return find(D.HANDLE, v).name; }
  var DOOR = { flat: 'Flat panel', shaker: 'Shaker', fingerpull: 'Fingerpull' };
  var r = Math.round;

  function kitchenRows(s) {
    var rows = [], base = board(s.base), up = board(s.upper), bench = find(D.BENCH, s.bench);
    var door = DOOR[s.door], hd = s.door === 'fingerpull' ? 'Fingerpull' : handleName(s.handle);
    function add(loc, type, desc, w, h, d, qty, mat, notes) {
      rows.push({ location: loc, type: type, description: desc, width: r(w), height: r(h), depth: r(d), qty: qty || 1,
        door: mat ? door : '', brand: mat ? mat.brand : '', colour: mat ? mat.name : '', handles: mat ? hd : '', notes: notes || '' });
    }
    var runW = s.layout === 'pantry' ? 3600 : 4500, n = Math.max(3, Math.round(runW / 600)), uw = runW / n;
    var hoodW = 900, hoodLeft = (runW - hoodW) / 2;
    var ovenIdx = Math.floor((hoodLeft + hoodW / 2) / uw);
    var sinkIdx = Math.floor(1000 / uw);
    for (var i = 0; i < n; i++) {
      var note = i === sinkIdx ? 'Sink above' : '';
      if (i === ovenIdx) add('Back wall', 'Base', 'Oven housing with drawer above', uw, 720, 560, 1, base, 'Under cooktop');
      else if (i % 3 === 0) add('Back wall', 'Base', '3 drawer base', uw, 720, 560, 1, base, note);
      else add('Back wall', 'Base', '1 door base', uw, 720, 560, 1, base, note);
    }
    function upperRun(len, side) {
      if (len < 200) return;
      var m = Math.max(1, Math.round(len / 550));
      for (var j = 0; j < m; j++) add('Back wall', 'Wall', '1 door wall cabinet', len / m, 700, 340, 1, up, side);
    }
    upperRun(hoodLeft, 'Left of rangehood');
    add('Back wall', 'Wall', 'Rangehood canopy', hoodW, 420, 420, 1, up, 'Rangehood insert by others');
    upperRun(runW - hoodLeft - hoodW, 'Right of rangehood');
    if (s.layout === 'pantry') {
      add('Back wall', 'Tall', '2 door pantry', 880, 2050, 600, 1, up, 'Right end of run');
    }
    if (s.layout !== 'wall') {
      for (var q = 0; q < 4; q++) add('Island', 'Base', q === 0 || q === 3 ? '3 drawer base' : '1 door base', 600, 720, 620, 1, base, 'Faces back wall');
    }
    add('All', 'Kickboard', 'Kickboards', 0, 150, 0, 1, null, 'Dark or matching, 150 mm high');
    var benchName = bench.val === 'timber' ? 'Timber' : bench.brand + ' ' + bench.name;
    rows.push({ location: 'Back wall', type: 'Benchtop', description: '40 mm benchtop', width: runW + 40, height: 40, depth: 620, qty: 1, door: '', brand: bench.brand, colour: bench.name, handles: '', notes: benchName });
    if (s.layout !== 'wall') {
      var wf = bench.val !== 'timber';
      rows.push({ location: 'Island', type: 'Benchtop', description: '40 mm island top with seating overhang' + (wf ? ' and 2 waterfall ends' : ''), width: 2480, height: 40, depth: 960, qty: 1, door: '', brand: bench.brand, colour: bench.name, handles: '', notes: wf ? 'Waterfall ends 960 x 910 x 40' : '' });
    }
    var sp = { subway: 'Subway tile (by others)', stone: 'Stone to match benchtop', glass: 'Smoked glass' }[s.splash];
    rows.push({ location: 'Back wall', type: 'Splashback', description: sp, width: runW, height: 590, depth: 0, qty: 1, door: '', brand: s.splash === 'stone' ? bench.brand : '', colour: s.splash === 'stone' ? bench.name : '', handles: '', notes: '' });
    return rows;
  }

  function wardrobeRows(s) {
    var rows = [], fin = board(s.finish), hd = handleName(s.handle);
    function add(loc, type, desc, w, h, d, qty, notes, door, handles) {
      rows.push({ location: loc, type: type, description: desc, width: r(w), height: r(h), depth: r(d), qty: qty || 1,
        door: door || '', brand: fin.brand, colour: fin.name, handles: handles || '', notes: notes || '' });
    }
    if (s.wtype === 'builtin') {
      if (s.wdoors === 'hinged') {
        for (var i = 0; i < 3; i++) add('Wall', 'Tall', '2 door robe with hanging and shelf', 1000, 2300, 600, 1, 'On 100 mm kick', DOOR[s.door], s.door === 'fingerpull' ? 'Fingerpull' : hd);
      } else {
        add('Wall', 'Robe carcass', 'Built-in robe interior (hanging, shelves, drawers)', 3000, 2400, 600, 1, 'Recess fit to ceiling bulkhead');
        add('Wall', 'Sliding door', s.wdoors === 'mirror' ? 'Sliding mirror door' : 'Sliding door, board panel', 1040, 2340, 0, 3, (s.handle === 'none' ? 'Aluminium' : hd) + ' frames, top and bottom tracks', s.wdoors === 'mirror' ? 'Mirror' : 'Board panel', '');
      }
      return rows;
    }
    var sets = {
      balanced: [['Double hanging', 'Shelves', 'Drawers + shelves', 'Long hanging'], ['Long hanging', 'Shoe shelves'], ['Double hanging', 'Drawers + shelves']],
      hanging: [['Double hanging', 'Long hanging', 'Shelves', 'Double hanging'], ['Long hanging', 'Double hanging'], ['Double hanging', 'Long hanging']],
      drawers: [['Shoe shelves', 'Drawers + shelves', 'Long hanging', 'Drawers + shelves'], ['Shoe shelves', 'Drawers + shelves'], ['Double hanging', 'Shoe shelves']]
    }[s.internals];
    [['Back wall', 3200], ['Left wall', 1600], ['Right wall', 1600]].forEach(function (run, k) {
      var bays = sets[k], bw = run[1] / bays.length;
      bays.forEach(function (b) {
        add(run[0], 'Open bay', b, bw, 2400, 600, 1, b.indexOf('Drawers') === 0 ? '4 drawers, ' + (s.handle === 'none' ? 'push to open' : hd + ' handles') : '', b.indexOf('Drawers') === 0 ? 'Flat panel' : '', b.indexOf('Drawers') === 0 ? hd : '');
      });
    });
    if (s.light === 'on') rows.push({ location: 'All', type: 'Lighting', description: 'LED strip lighting under top panels', width: 0, height: 0, depth: 0, qty: 1, door: '', brand: '', colour: '', handles: '', notes: 'Electrician by others' });
    return rows;
  }

  function rows() {
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
  function glb(btn) {
    var label = btn.textContent;
    btn.textContent = 'Preparing 3D model…';
    btn.disabled = true;
    function done() { btn.textContent = label; btn.disabled = false; }
    D.ensure3D().then(function () {
      if (window.THREE.GLTFExporter) return;
      return loadScript('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/exporters/GLTFExporter.js');
    }).then(function () {
      window.JC3D.update();
      var obj = window.JC3D.model();
      new window.THREE.GLTFExporter().parse(obj, function (result) {
        save(new Blob([result], { type: 'model/gltf-binary' }), 'joinerycraft-' + D.mode + '-' + stamp() + '.glb');
        done();
      }, { binary: true, onlyVisible: true, maxTextureSize: 512 });
    }).catch(function () { btn.textContent = 'Couldn’t export, try again'; btn.disabled = false; });
  }

  document.getElementById('exportCsv').addEventListener('click', function () {
    save(new Blob([csv()], { type: 'text/csv' }), 'joinerycraft-' + D.mode + '-cabinets-' + stamp() + '.csv');
  });
  document.getElementById('exportGlb').addEventListener('click', function () { glb(this); });

  window.JCExport = { csv: csv, rows: rows };
})();
