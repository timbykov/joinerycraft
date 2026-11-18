/* Joinerycraft design creator: 3D view.
   Builds a simple 3D room from the same choices as the front view, using three.js.
   Loaded only when someone opens the 3D view. */
(function () {
  'use strict';
  var D = window.JCDesigner;
  var host = document.getElementById('design3d');
  if (!D || !host || !window.THREE) return;
  var T = window.THREE;

  /* ---------- renderer, camera, lights ---------- */
  var renderer;
  try {
    renderer = new T.WebGLRenderer({ antialias: true, preserveDrawingBuffer: false });
  } catch (e) {
    host.classList.remove('is-loading');
    if (D.setView) D.setView('2d');
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  renderer.domElement.className = 'd3-canvas';
  renderer.domElement.setAttribute('aria-label', 'Rotatable 3D view of your design');
  renderer.domElement.setAttribute('role', 'img');
  host.insertBefore(renderer.domElement, host.firstChild);

  var scene = new T.Scene();
  scene.background = new T.Color('#efe9e0');
  var camera = new T.PerspectiveCamera(38, 1.6, 0.1, 60);

  scene.add(new T.HemisphereLight(0xffffff, 0xb5aa9a, 0.5));
  var sun = new T.DirectionalLight(0xffffff, 0.5);
  sun.position.set(3.5, 6, 6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -6; sun.shadow.camera.right = 6;
  sun.shadow.camera.top = 6; sun.shadow.camera.bottom = -6;
  sun.shadow.bias = -0.0008;
  scene.add(sun);
  var fill = new T.DirectionalLight(0xffffff, 0.14);
  fill.position.set(-4, 3, 5);
  scene.add(fill);

  var world = new T.Group();
  scene.add(world);

  /* ---------- textures & materials ---------- */
  function canvasTex(w, h, draw) {
    var c = document.createElement('canvas');
    c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    var t = new T.CanvasTexture(c);
    t.anisotropy = 4;
    return t;
  }
  function grain(base, dark, light) {
    return function (g, w, h) {
      g.fillStyle = base; g.fillRect(0, 0, w, h);
      for (var i = 0; i < 160; i++) {
        var y = Math.random() * h, a = 0.6 + Math.random() * 1.8;
        g.strokeStyle = Math.random() < 0.6 ? dark : light;
        g.globalAlpha = 0.18 + Math.random() * 0.3;
        g.lineWidth = 0.5 + Math.random() * 1.2;
        g.beginPath(); g.moveTo(0, y);
        for (var x = 0; x <= w; x += 16) g.lineTo(x, y + Math.sin(x / (30 + i % 7 * 9) + i) * a);
        g.stroke();
      }
      g.globalAlpha = 1;
    };
  }
  function marble(base) {
    var dark = parseInt(base.slice(1, 3), 16) < 0x80;
    return function (g, w, h) {
      g.fillStyle = base; g.fillRect(0, 0, w, h);
      for (var i = 0; i < 9; i++) {
        g.strokeStyle = dark ? (i % 3 ? shade(base, 1.3) : shade(base, 1.6)) : (i % 3 ? shade(base, 0.87) : shade(base, 0.74));
        g.lineWidth = i % 3 ? 1 : 2.2;
        g.beginPath();
        var y = Math.random() * h;
        g.moveTo(0, y);
        g.bezierCurveTo(w * 0.3, y + (Math.random() - 0.5) * 200, w * 0.6, y + (Math.random() - 0.5) * 200, w, y + (Math.random() - 0.5) * 120);
        g.stroke();
      }
    };
  }
  var TEX = {
    oak: canvasTex(256, 256, grain('#c9a06e', '#a97f4d', '#dcb987')),
    walnut: canvasTex(256, 256, grain('#6e4a31', '#4f3422', '#86603f')),
    floor: canvasTex(512, 512, function (g, w, h) {
      var cols = ['#d6c8b3', '#cfc0aa', '#dacdb9', '#d2c4ae'];
      for (var r = 0; r < 8; r++) {
        var off = (r % 2) * 128;
        for (var c = -1; c < 3; c++) {
          g.fillStyle = cols[(r + c + 4) % 4];
          g.fillRect(c * 256 + off, r * 64, 256, 64);
          g.strokeStyle = 'rgba(0,0,0,.08)'; g.lineWidth = 2;
          g.strokeRect(c * 256 + off, r * 64, 256, 64);
        }
      }
    }),
    subway: canvasTex(256, 256, function (g, w, h) {
      g.fillStyle = '#f7f7f5'; g.fillRect(0, 0, w, h);
      g.strokeStyle = '#d4d1cb'; g.lineWidth = 3;
      for (var r = 0; r < 8; r++) {
        g.beginPath(); g.moveTo(0, r * 32); g.lineTo(w, r * 32); g.stroke();
        for (var c = 0; c < 4; c++) {
          var x = c * 64 + (r % 2) * 32;
          g.beginPath(); g.moveTo(x, r * 32); g.lineTo(x, r * 32 + 32); g.stroke();
        }
      }
    })
  };
  [TEX.floor, TEX.subway].forEach(function (t) { t.wrapS = t.wrapT = T.RepeatWrapping; });

  var matCache = {};
  function mat(key, make) { return matCache[key] || (matCache[key] = make()); }
  function std(color, rough, metal, extra) {
    var o = { color: color, roughness: rough == null ? 0.65 : rough, metalness: metal || 0 };
    for (var k in extra || {}) o[k] = extra[k];
    return new T.MeshStandardMaterial(o);
  }
  function cabinetMat(val) {
    var c = find(D.CABINET, val);
    return mat('cab-' + c.val, function () {
      if (c.wood) return std(0xffffff, 0.6, 0, { map: canvasTex(256, 256, grain(c.swatch, shade(c.swatch, 0.8), shade(c.swatch, 1.15))) });
      return std(c.fill, 0.55);
    });
  }
  function benchMat(val) {
    return mat('bench-' + val, function () {
      if (val === 'timber') return std(0xffffff, 0.5, 0, { map: TEX.oak });
      var b = find(D.BENCH, val);
      if (b.vein) return std(0xffffff, 0.25, 0, { map: canvasTex(512, 512, marble(b.swatch)) });
      return std(b.swatch, 0.32);
    });
  }
  function handleMat(val) {
    return mat('handle-' + val, function () {
      if (val === 'brass') return std('#c4a15a', 0.35, 0.75);
      if (val === 'steel') return std('#b9bdc1', 0.3, 0.8);
      if (val === 'none') return std('#c3c6c9', 0.35, 0.6);
      return std('#1d1d1d', 0.5, 0.3);
    });
  }
  var M = {
    wall: std('#efe9e0', 0.95),
    sidewall: std('#e8e1d6', 0.95),
    ceiling: std('#f6f2ec', 0.95),
    floor: std(0xffffff, 0.8, 0, { map: TEX.floor }),
    kick: std('#2b2a28', 0.8),
    groove: std('#262523', 0.7),
    black: std('#1b1b1b', 0.35, 0.2),
    glass: std('#2a2c2e', 0.12, 0.4),
    steel: std('#a7abaf', 0.35, 0.7),
    fridge: std('#c3c7cb', 0.3, 0.25),
    inner: std('#f7f4ef', 0.7),
    mirror: std('#e9eff3', 0.08, 0.35, { emissive: '#8a959c', emissiveIntensity: 0.35 }),
    led: new T.MeshBasicMaterial({ color: '#fff1cc' }),
    bulb: new T.MeshBasicMaterial({ color: '#fff6dd' }),
    leaf: std('#6f8f5f', 0.8),
    pot: std('#d9d2c7', 0.7),
    stool: std('#6b5a4a', 0.7)
  };
  var CLOTHES = ['#8d9aa8', '#d9c9b3', '#5d6a63', '#b88a7a', '#e8e3da', '#3f4650', '#a7b49c', '#c9b28f'].map(function (c) { return std(c, 0.9); });

  function shade(hex, f) {
    var n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    function c(v) { return Math.max(0, Math.min(255, Math.round(f < 1 ? v * f : v + (255 - v) * (f - 1)))); }
    return '#' + ((1 << 24) + (c(r) << 16) + (c(g) << 8) + c(b)).toString(16).slice(1);
  }
  function find(list, v) { for (var i = 0; i < list.length; i++) if (list[i].val === v) return list[i]; return list[0]; }

  /* ---------- geometry helpers ---------- */
  var boxGeo = new T.BoxGeometry(1, 1, 1);
  // box from min corner (x,y,z) with size (w,h,d)
  function box(parent, x, y, z, w, h, d, m, noShadow) {
    var b = new T.Mesh(boxGeo, m);
    b.scale.set(w, h, d);
    b.position.set(x + w / 2, y + h / 2, z + d / 2);
    if (!noShadow) { b.castShadow = true; b.receiveShadow = true; }
    parent.add(b);
    return b;
  }
  function cyl(parent, r, len, m, axis, x, y, z) {
    var c = new T.Mesh(new T.CylinderGeometry(r, r, len, 12), m);
    if (axis === 'x') c.rotation.z = Math.PI / 2;
    if (axis === 'z') c.rotation.x = Math.PI / 2;
    c.position.set(x, y, z);
    c.castShadow = true;
    parent.add(c);
    return c;
  }

  /* A door or drawer front, facing +z, with its back face at z (local). */
  function front(parent, x, y, z, w, h, cm, o) {
    o = o || {};
    var st = o.style || 'flat', g = 0.003, t = 0.018;
    box(parent, x + g, y + g, z, w - 2 * g, h - 2 * g, t, cm);
    if (st === 'shaker') {
      var f = Math.min(0.07, w * 0.14, h * 0.2), ft = 0.008, zz = z + t;
      box(parent, x + g, y + h - g - f, zz, w - 2 * g, f, ft, cm);
      box(parent, x + g, y + g, zz, w - 2 * g, f, ft, cm);
      box(parent, x + g, y + g + f, zz, f, h - 2 * g - 2 * f, ft, cm);
      box(parent, x + w - g - f, y + g + f, zz, f, h - 2 * g - 2 * f, ft, cm);
    }
    if (st === 'fingerpull') {
      box(parent, x, o.upper ? y : y + h - 0.022, z + 0.004, w, 0.022, t, M.groove, true);
      return;
    }
    if (o.handle === 'none') return;
    var hm = handleMat(o.handle), hz = z + t + 0.012 + (st === 'shaker' ? 0.008 : 0);
    if (o.drawer) {
      var hw = Math.min(0.32, w * 0.5);
      box(parent, x + (w - hw) / 2, y + h - Math.min(0.06, h * 0.3), hz, hw, 0.012, 0.014, hm, true);
    } else {
      var len = o.tall ? 0.45 : 0.16;
      var hx = o.hingeLeft ? x + w - 0.045 : x + 0.033;
      var hy = o.tall ? y + h * 0.48 - len / 2 : o.upper ? y + 0.05 : y + h - 0.05 - len;
      box(parent, hx, hy, hz, 0.012, len, 0.014, hm, true);
    }
  }

  function room(width, depth, height, sideWalls) {
    var floor = new T.Mesh(new T.PlaneGeometry(14, 14), M.floor);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    M.floor.map.repeat.set(7, 7);
    world.add(floor);
    var back = new T.Mesh(new T.PlaneGeometry(14, height), M.wall);
    back.position.set(0, height / 2, 0);
    back.receiveShadow = true;
    world.add(back);
    if (sideWalls) {
      [-1, 1].forEach(function (s) {
        var w = new T.Mesh(new T.PlaneGeometry(depth, height), M.sidewall);
        w.rotation.y = -s * Math.PI / 2;
        w.position.set(s * width / 2, height / 2, depth / 2);
        w.receiveShadow = true;
        world.add(w);
      });
    }
  }

  /* ---------- kitchen ---------- */
  var DM = window.JCLayout.dims, KICK = DM.KICK, BASE_TOP = DM.BASE_TOP, BENCH_T = DM.BENCH_T, UP_BOT = DM.UP_BOT, UP_TOP = DM.UP_TOP, UP_D = DM.UP_D, TALL_TOP = DM.TALL_TOP;
  var CEIL = 2.7, D0 = 0.56;

  function tap(parent, x, z, bTop, hd) {
    var tapM = hd === 'brass' ? handleMat('brass') : hd === 'steel' ? handleMat('steel') : handleMat('black');
    cyl(parent, 0.014, 0.3, tapM, 'y', x, bTop + 0.15, z);
    var arc = new T.Mesh(new T.TorusGeometry(0.09, 0.012, 8, 16, Math.PI), tapM);
    arc.rotation.y = Math.PI / 2;
    arc.position.set(x, bTop + 0.3, z + 0.09);
    parent.add(arc);
  }

  function kitchenItem(g, it, i, c) {
    var x = it.x, w = it.w, st = c.st, hd = c.hd, h = BASE_TOP - KICK, bTop = BASE_TOP + BENCH_T;
    if (it.t === 'base') {
      box(g, x, KICK, 0, w, h, D0 - 0.002, c.baseM);
      box(g, x, 0, 0, w, KICK, D0 - 0.06, M.kick);
      if (it.kind === 'drawers') { for (var k = 0; k < 3; k++) front(g, x, KICK + k * h / 3, D0, w, h / 3, c.baseM, { style: st, handle: hd, drawer: true }); }
      else if (it.kind === 'oven') {
        front(g, x, BASE_TOP - 0.16, D0, w, 0.16, c.baseM, { style: st, handle: hd, drawer: true });
        box(g, x + 0.02, KICK + 0.02, D0, w - 0.04, h - 0.2, 0.02, M.glass);
        box(g, x + 0.06, KICK + h - 0.26, D0 + 0.02, w - 0.12, 0.015, 0.02, M.steel, true);
        box(g, x + Math.max(0.03, (w - 0.62) / 2), bTop, 0.06, Math.min(0.62, w - 0.06), 0.008, 0.5, M.black, true);
      } else if (it.kind === 'dw') front(g, x, KICK, D0, w, h, c.baseM, { style: st, handle: hd, drawer: true });
      else if (it.kind === 'corner') {
        var pw = w * 0.42;
        if (it.side === 'L') { box(g, x, KICK, D0, pw, h, 0.018, c.baseM); front(g, x + pw, KICK, D0, w - pw, h, c.baseM, { style: st, handle: hd }); }
        else { front(g, x, KICK, D0, w - pw, h, c.baseM, { style: st, handle: hd, hingeLeft: true }); box(g, x + w - pw, KICK, D0, pw, h, 0.018, c.baseM); }
      } else if (w > 0.65) {
        front(g, x, KICK, D0, w / 2, h, c.baseM, { style: st, handle: hd, hingeLeft: false });
        front(g, x + w / 2, KICK, D0, w / 2, h, c.baseM, { style: st, handle: hd, hingeLeft: true });
      } else front(g, x, KICK, D0, w, h, c.baseM, { style: st, handle: hd, hingeLeft: i % 2 === 1 });
      if (it.kind === 'sink') {
        var sw = Math.min(0.7, w - 0.1);
        box(g, x + (w - sw) / 2, bTop + 0.001, 0.12, sw, 0.004, 0.4, M.steel, true);
        tap(g, x + w / 2, 0.08, bTop, hd);
      }
    } else if (it.t === 'upper') {
      box(g, x, UP_BOT, 0, w, UP_TOP - UP_BOT, UP_D - 0.002, c.upM);
      front(g, x, UP_BOT, UP_D, w, UP_TOP - UP_BOT, c.upM, { style: st, handle: hd, upper: true, hingeLeft: it.hingeLeft });
      box(g, x, UP_TOP, 0, w, CEIL - UP_TOP, UP_D, M.ceiling);
    } else if (it.t === 'shelf') {
      [1.62, 1.98].forEach(function (y, j) {
        box(g, x, y, 0, w, 0.035, 0.26, c.upM);
        for (var p = 0; p < Math.floor(w / 0.35); p++) {
          var ph = 0.12 + ((p + j) % 2) * 0.06;
          cyl(g, 0.05, ph, [M.pot, CLOTHES[5], CLOTHES[1], M.leaf][(p + j) % 4], 'y', x + 0.2 + p * 0.35, y + 0.035 + ph / 2, 0.13);
        }
      });
    } else if (it.t === 'hood') {
      box(g, x, 1.78, 0, w, UP_TOP - 1.78, 0.42, c.upM);
      box(g, x - 0.01, 1.74, 0, w + 0.02, 0.04, 0.46, M.steel);
      box(g, x, UP_TOP, 0, w, CEIL - UP_TOP, 0.42, M.ceiling);
    } else if (it.t === 'tall') {
      if (it.kind === 'pantry') {
        box(g, x, KICK, 0, w, TALL_TOP - KICK, 0.6, c.upM);
        box(g, x, 0, 0, w, KICK, 0.54, M.kick);
        front(g, x, KICK, 0.6, w / 2, TALL_TOP - KICK, c.upM, { style: st, handle: hd, tall: true, hingeLeft: false });
        front(g, x + w / 2, KICK, 0.6, w / 2, TALL_TOP - KICK, c.upM, { style: st, handle: hd, tall: true, hingeLeft: true });
      } else {
        // fridge space: side panels, bridging cupboard above, and a fridge for scale
        box(g, x, 0, 0, 0.018, TALL_TOP, 0.62, c.upM);
        box(g, x + w - 0.018, 0, 0, 0.018, TALL_TOP, 0.62, c.upM);
        box(g, x + 0.018, 1.9, 0, w - 0.036, TALL_TOP - 1.9, 0.6, c.upM);
        front(g, x + 0.018, 1.9, 0.6, w - 0.036, TALL_TOP - 1.9, c.upM, { style: st, handle: hd, upper: true, hingeLeft: true });
        box(g, x + 0.04, 0, 0.02, w - 0.08, 1.82, 0.62, M.fridge);
        box(g, x + w / 2 - 0.03, 1.1, 0.64, 0.014, 0.45, 0.02, M.black, true);
        box(g, x + w / 2 + 0.016, 1.1, 0.64, 0.014, 0.45, 0.02, M.black, true);
      }
      box(g, x, TALL_TOP, 0, w, CEIL - TALL_TOP, 0.62, M.ceiling);
    }
  }

  function buildKitchen(s) {
    var m = D.model();
    room(m.room.w, m.room.d, CEIL, m.room.sideWalls);
    var c = { baseM: cabinetMat(s.base), upM: cabinetMat(s.upper), bM: benchMat(s.bench), hd: s.handle, st: s.door };
    var bTop = BASE_TOP + BENCH_T;
    var splashH = s.overheads === 'none' ? 0.3 : UP_BOT - bTop;
    m.runs.forEach(function (r) {
      var g = new T.Group();
      g.position.set(r.pos[0], 0, r.pos[1]);
      g.rotation.y = r.rot;
      world.add(g);
      r.items.forEach(function (it, i) { kitchenItem(g, it, i, c); });
      if (r.bench) box(g, r.bench[0], BASE_TOP, 0, r.bench[1] - r.bench[0], BENCH_T, 0.62, c.bM);
      if (r.splash) {
        var sw = r.splash[1] - r.splash[0], sm;
        if (s.splash === 'subway') {
          sm = std(0xffffff, 0.3, 0, { map: TEX.subway.clone() });
          sm.map.needsUpdate = true;
          sm.map.repeat.set(sw / 0.6, splashH / 0.3);
        } else sm = s.splash === 'glass' ? M.glass : c.bM;
        box(g, r.splash[0], bTop, 0, sw, splashH, 0.012, sm);
      }
      if (r.id === 'back' && r.bench) {
        var px = r.bench[1] - 0.35;
        cyl(g, 0.07, 0.14, M.pot, 'y', px, bTop + 0.07, 0.3);
        var leaf = new T.Mesh(new T.SphereGeometry(0.14, 10, 8), M.leaf);
        leaf.position.set(px, bTop + 0.25, 0.3);
        leaf.castShadow = true;
        g.add(leaf);
      }
    });

    if (m.island) {
      var I = m.island, iw = I.len, ix = -iw / 2, idp = I.depth, hd = s.handle;
      var isl = new T.Group();
      // build facing +z in local space (doors toward the wall), then turn it around
      box(isl, ix, KICK, 0, iw, BASE_TOP - KICK, idp, c.baseM);
      box(isl, ix, 0, 0.06, iw, KICK, idp - 0.06, M.kick);
      I.items.forEach(function (it, q) {
        if (it.kind === 'drawers') for (var r = 0; r < 3; r++) front(isl, ix + it.x, KICK + r * (BASE_TOP - KICK) / 3, idp, it.w, (BASE_TOP - KICK) / 3, c.baseM, { style: s.door, handle: hd, drawer: true });
        else front(isl, ix + it.x, KICK, idp, it.w, BASE_TOP - KICK, c.baseM, { style: s.door, handle: hd, hingeLeft: q % 2 === 1 });
      });
      var wf = I.waterfall;
      box(isl, ix - (wf ? 0.04 : 0.02), BASE_TOP, -I.overhang, iw + (wf ? 0.08 : 0.04), BENCH_T, idp + I.overhang, c.bM);
      if (wf) {
        box(isl, ix - 0.04, 0, -I.overhang, 0.04, BASE_TOP, idp + I.overhang, c.bM);
        box(isl, ix + iw, 0, -I.overhang, 0.04, BASE_TOP, idp + I.overhang, c.bM);
      }
      isl.rotation.y = Math.PI;
      isl.position.set(I.cx, 0, I.z + idp);
      world.add(isl);
      var sm = hd === 'brass' ? handleMat('brass') : handleMat('black');
      var seats = Math.min(I.seats, 5), sz = I.z + idp + 0.5;
      for (var q = 0; q < seats; q++) {
        var sx = I.cx - iw / 2 + (q + 0.5) * iw / seats;
        cyl(world, 0.19, 0.05, M.stool, 'y', sx, 0.66, sz);
        [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (p) {
          var leg = cyl(world, 0.011, 0.66, sm, 'y', sx + p[0] * 0.12, 0.32, sz + p[1] * 0.12);
          leg.rotation.z = p[0] * 0.08; leg.rotation.x = -p[1] * 0.08;
        });
        cyl(world, 0.008, 0.26, sm, 'x', sx, 0.26, sz + 0.12);
      }
      var np = Math.min(3, Math.max(1, Math.round(iw / 0.8))), gap = Math.min(0.75, iw / 3);
      for (var p2 = 0; p2 < np; p2++) {
        var px2 = I.cx + (p2 - (np - 1) / 2) * gap, pz = I.z + 0.45;
        cyl(world, 0.004, 0.75, M.black, 'y', px2, 2.32, pz);
        var lamp = new T.Mesh(new T.SphereGeometry(0.13, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), hd === 'brass' ? handleMat('brass') : M.black);
        lamp.material.side = T.DoubleSide;
        lamp.position.set(px2, 1.82, pz);
        world.add(lamp);
        var bulb = new T.Mesh(new T.SphereGeometry(0.04, 10, 8), M.bulb);
        bulb.position.set(px2, 1.8, pz);
        world.add(bulb);
      }
    }
    return { target: new T.Vector3(m.target[0], m.target[1], m.target[2]), radius: m.radius };
  }

  /* ---------- wardrobes ---------- */
  function buildBuiltin(s) {
    var m = D.model(), run = m.runs[0];
    var W = run.len, H = m.height, Dp = 0.6, x0 = -W / 2, open = s.showInside === 'on';
    room(Math.max(6, W + 2), 4, CEIL, false);
    var cm = cabinetMat(s.finish), hd = s.handle;
    var trimM = hd === 'none' ? handleMat('none') : handleMat(hd);
    var inside = new T.Group();
    inside.position.x = x0;
    world.add(inside);
    bays(inside, W, m.sections.wall, cm, s, H, false, 0.07);
    box(world, x0, H, 0, W, CEIL - H, Dp, M.ceiling);
    if (s.wdoors === 'hinged') {
      run.items.forEach(function (it) {
        if (it.t !== 'door') return;
        var o = { style: s.door, handle: hd, tall: true, hingeLeft: it.hingeLeft };
        if (!open) return front(world, x0 + it.x, 0.08, Dp, it.w, H - 0.08, cm, o);
        var pg = new T.Group();
        pg.position.set(x0 + it.x + (it.hingeLeft ? 0 : it.w), 0, Dp);
        front(pg, it.hingeLeft ? 0 : -it.w, 0.08, 0, it.w, H - 0.08, cm, o);
        pg.rotation.y = it.hingeLeft ? -1.3 : 1.3;
        world.add(pg);
      });
    } else {
      run.items.forEach(function (it, k) {
        if (it.t !== 'slide') return;
        // with "show inside" the doors slide over to the left end
        var px = open ? x0 + k * 0.05 : x0 + it.x, pw = it.w, pz = Dp + (it.layer ? 0.035 : 0);
        if (open && k > 0) return;
        var panelM = s.wdoors === 'mirror' ? M.mirror : cm;
        box(world, px + 0.025, 0.04, pz, pw - 0.05, H - 0.08, 0.016, panelM);
        box(world, px, 0.03, pz - 0.004, 0.025, H - 0.06, 0.028, trimM);
        box(world, px + pw - 0.025, 0.03, pz - 0.004, 0.025, H - 0.06, 0.028, trimM);
        box(world, px, H - 0.06, pz - 0.004, pw, 0.03, 0.028, trimM);
        box(world, px, 0.03, pz - 0.004, pw, 0.03, 0.028, trimM);
      });
      box(world, x0, H - 0.03, Dp - 0.01, W, 0.03, 0.09, trimM);
      box(world, x0, 0, Dp - 0.01, W, 0.03, 0.09, trimM);
    }
    // wall returns so the robe sits in a recess, plus a rug for scale
    box(world, x0 - 0.12, 0, 0, 0.12, CEIL, Dp + 0.08, M.sidewall);
    box(world, x0 + W, 0, 0, 0.12, CEIL, Dp + 0.08, M.sidewall);
    box(world, -Math.min(1.1, W / 2), 0.001, 1.25, Math.min(2.2, W), 0.006, 1.0, std('#cdbfab', 0.95), true);
    return { target: new T.Vector3(m.target[0], m.target[1], m.target[2]), radius: m.radius };
  }

  function bays(parent, length, list, cm, s, H, light, inset) {
    var Dp = 0.6, dz = Dp - (inset || 0.02), bw = length / list.length, gt = 0.018, f = H / 2.4;
    var trimM = s.handle === 'none' ? handleMat('none') : handleMat(s.handle);
    box(parent, 0, 0, 0, length, H, 0.012, M.inner); // back
    box(parent, 0, H - gt, 0, length, gt, Dp, cm);    // top
    box(parent, 0, 0, 0.02, length, 0.08, Dp - 0.04, M.kick);
    for (var g = 0; g <= list.length; g++) box(parent, Math.min(g * bw, length - gt), 0, 0, gt, H, Dp, cm);
    list.forEach(function (b, i) {
      var bx = i * bw + gt, iw = bw - gt;
      if (light) box(parent, bx, H - gt - 0.012, 0.05, iw, 0.01, 0.03, M.led, true);
      box(parent, bx, 0.08, 0.012, iw, gt, Dp - 0.02, cm); // base shelf
      function shelf(y) { box(parent, bx, y, 0.012, iw, gt, Dp - 0.02, cm); }
      function rail(y, len) {
        cyl(parent, 0.01, iw, trimM, 'x', bx + iw / 2, y, Dp / 2);
        var count = Math.floor((iw - 0.08) / 0.055);
        for (var q = 0; q < count; q++) {
          var cl = box(parent, bx + 0.05 + q * 0.055, y - len - 0.03 + (q % 3) * 0.08, Dp / 2 - 0.22, 0.03, len - (q % 3) * 0.08, 0.44, CLOTHES[(q + i) % CLOTHES.length]);
          cl.rotation.y = (q % 2 ? 0.08 : -0.06);
        }
      }
      if (b === 'hang') { shelf(2.0 * f); rail(1.92 * f, 1.25 * f); }
      if (b === 'hang2') { shelf(2.05 * f); rail(1.97 * f, 0.8 * f); shelf(1.05 * f); rail(0.99 * f, 0.75 * f); }
      if (b === 'shelf') for (var sy = 0.45; sy < H - 0.2; sy += 0.36) {
        shelf(sy);
        box(parent, bx + 0.06, sy + gt, 0.12, iw - 0.12, 0.12, 0.34, CLOTHES[Math.floor(sy * 10) % CLOTHES.length]);
      }
      if (b === 'drawers') {
        var dh = 0.85 / 4;
        for (var q = 0; q < 4; q++) front(parent, bx, 0.1 + q * dh, dz, iw, dh, cm, { style: 'flat', handle: s.handle, drawer: true });
        shelf(0.95);
        for (var y2 = 1.35; y2 < H - 0.2; y2 += 0.4) shelf(y2);
        box(parent, bx + 0.08, 1.37, 0.15, iw - 0.16, 0.2, 0.3, CLOTHES[4]);
      }
      if (b === 'shoes') for (var hy = 0.35; hy < H - 0.2; hy += 0.3) {
        box(parent, bx, hy, 0.05, iw, gt, Dp - 0.08, cm).rotation.x = 0.25;
        for (var p = 0; p < Math.floor(iw / 0.16); p++) {
          box(parent, bx + 0.03 + p * 0.16, hy + 0.03, 0.22, 0.09, 0.08, 0.26, p % 2 ? M.kick : CLOTHES[3]).rotation.x = 0.25;
        }
      }
    });
  }

  function buildWalkin(s) {
    var m = D.model(), H = m.height;
    room(m.room.w, m.room.d, CEIL, m.room.sideWalls);
    var cm = cabinetMat(s.finish);
    m.runs.forEach(function (r) {
      var g = new T.Group();
      bays(g, r.len, r.sections, cm, s, H, s.light === 'on');
      box(g, 0, H, 0, r.len, CEIL - H, 0.6, M.ceiling);
      g.rotation.y = r.rot;
      g.position.set(r.pos[0], 0, r.pos[1]);
      world.add(g);
    });
    var free = Math.max(0.9, m.room.d - 0.6), inner = m.room.w - (m.shape === 'u' ? 1.2 : m.shape === 'l' ? 0.6 : 0);
    var cx = m.shape === 'l' ? 0.3 : 0, cz = 0.6 + Math.min(free, 2.0) / 2;
    var rw = Math.min(1.8, inner - 0.4);
    box(world, cx - rw / 2, 0.001, cz - 0.6, rw, 0.006, 1.2, std('#cdbfab', 0.95), true);
    if (inner > 1.5) box(world, cx - 0.35, 0, cz - 0.22, 0.7, 0.42, 0.45, std('#b9a58c', 0.95));
    if (s.light === 'on') {
      var glow = new T.PointLight(0xffe3b0, 0.45, 5, 2);
      glow.position.set(0, 2.2, 1.0);
      world.add(glow);
    }
    return { target: new T.Vector3(m.target[0], m.target[1], m.target[2]), radius: m.radius };
  }
  /* ---------- camera control ---------- */
  var view = { theta: 0.42, phi: 1.22, radius: 6, target: new T.Vector3(0, 1.1, 1) };
  var lastMode = null;
  function placeCamera() {
    var sp = Math.sin(view.phi);
    camera.position.set(
      view.target.x + view.radius * sp * Math.sin(view.theta),
      view.target.y + view.radius * Math.cos(view.phi),
      view.target.z + view.radius * sp * Math.cos(view.theta)
    );
    camera.lookAt(view.target);
  }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  var el = renderer.domElement, pointers = {}, lastPinch = 0;
  el.addEventListener('pointerdown', function (e) {
    pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
    el.setPointerCapture(e.pointerId);
    host.classList.add('is-dragging');
  });
  el.addEventListener('pointermove', function (e) {
    var p = pointers[e.pointerId];
    if (!p) return;
    var ids = Object.keys(pointers);
    if (ids.length === 2) {
      pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
      var a = pointers[ids[0]], b = pointers[ids[1]];
      var dist = Math.hypot(a.x - b.x, a.y - b.y);
      if (lastPinch) zoom(lastPinch / dist);
      lastPinch = dist;
      return;
    }
    view.theta = clamp(view.theta - (e.clientX - p.x) * 0.008, -1.45, 1.45);
    view.phi = clamp(view.phi - (e.clientY - p.y) * 0.006, 0.75, 1.5);
    pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
    draw();
  });
  function up(e) {
    delete pointers[e.pointerId];
    lastPinch = 0;
    if (!Object.keys(pointers).length) host.classList.remove('is-dragging');
  }
  el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', up);
  el.addEventListener('wheel', function (e) {
    e.preventDefault();
    zoom(e.deltaY > 0 ? 1.08 : 0.93);
  }, { passive: false });
  function zoom(f) {
    view.radius = clamp(view.radius * f, 2.6, 13);
    draw();
  }
  host.querySelectorAll('[data-d3]').forEach(function (b) {
    b.addEventListener('click', function () {
      var a = b.dataset.d3;
      if (a === 'in') zoom(0.85);
      if (a === 'out') zoom(1.18);
      if (a === 'reset') { lastMode = null; update(); }
      if (a === 'full') toggleFull();
    });
  });

  /* ---------- build & render ---------- */
  function clear() {
    for (var i = world.children.length - 1; i >= 0; i--) {
      var o = world.children[i];
      world.remove(o);
      o.traverse(function (c) {
        if (c.geometry && c.geometry !== boxGeo) c.geometry.dispose();
      });
    }
  }

  function update() {
    clear();
    var mode = D.mode, s = D.state, frame;
    if (mode === 'wardrobe') frame = s.wtype === 'walkin' ? buildWalkin(s) : buildBuiltin(s);
    else frame = buildKitchen(s);
    var key = mode + (mode === 'wardrobe' ? s.wtype + (s.wtype === 'walkin' ? s.wshape : '') : s.shape);
    if (key !== lastMode) {
      lastMode = key;
      view.target.copy(frame.target);
      view.radius = frame.radius * (host.clientWidth && host.clientWidth < 520 ? 0.8 : 1);
      view.theta = mode === 'wardrobe' && s.wtype === 'walkin' ? 0.2 : mode === 'kitchen' && s.shape === 'galley' ? 0.75 : mode === 'kitchen' && s.shape !== 'straight' ? 0.3 : 0.42;
      view.phi = 1.22;
    }
    draw();
  }

  var raf = 0;
  function draw() {
    if (raf) return;
    raf = requestAnimationFrame(function () {
      raf = 0;
      resize();
      placeCamera();
      renderer.render(scene, camera);
    });
  }
  /* full screen: uses the browser's full screen where it can, otherwise fills the window */
  var fsReq = host.requestFullscreen || host.webkitRequestFullscreen;
  function fsEl() { return document.fullscreenElement || document.webkitFullscreenElement; }
  function setFull(on) {
    host.classList.toggle('is-full', on);
    document.body.classList.toggle('d3-locked', on);
    var b = host.querySelector('[data-d3="full"]');
    if (b) { b.setAttribute('aria-pressed', String(on)); b.setAttribute('aria-label', on ? 'Exit full screen' : 'Full screen'); }
    draw();
  }
  function toggleFull() {
    var on = !host.classList.contains('is-full');
    if (!on) {
      if (fsEl()) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      return setFull(false);
    }
    setFull(true);
    if (fsReq) try { var pr = fsReq.call(host); if (pr && pr.catch) pr.catch(function () {}); } catch (e) {}
  }
  ['fullscreenchange', 'webkitfullscreenchange'].forEach(function (ev) {
    document.addEventListener(ev, function () { if (!fsEl() && host.classList.contains('is-full')) setFull(false); });
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && host.classList.contains('is-full') && !fsEl()) setFull(false); });

  function resize() {
    var full = host.classList.contains('is-full');
    var w = host.clientWidth, h = full ? host.clientHeight : Math.round(w * 0.65);
    if (!w) return;
    var size = renderer.getSize(new T.Vector2());
    if (size.x !== w || size.y !== h) {
      renderer.setSize(w, h, false);
      el.style.width = '100%';
      el.style.height = h + 'px';
      camera.aspect = w / h;
      // portrait (phone full screen): keep the same side-to-side view so the room still fits
      camera.fov = h > w ? Math.min(80, 2 * Math.atan(Math.tan(31 * Math.PI / 180) * h / w) * 180 / Math.PI) : w < 520 ? 46 : 38;
      camera.updateProjectionMatrix();
    }
  }
  if ('ResizeObserver' in window) new ResizeObserver(draw).observe(host);
  else window.addEventListener('resize', draw);

  window.JC3D = { update: update, draw: draw, model: function () { return world; } };
  update();
})();
