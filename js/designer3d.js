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
    host.insertAdjacentHTML('beforeend', '<p class="d3-error">Sorry, 3D isn\'t supported on this device. The front view still works.</p>');
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
  sun.shadow.camera.left = -5; sun.shadow.camera.right = 5;
  sun.shadow.camera.top = 5; sun.shadow.camera.bottom = -5;
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
  function buildKitchen(s) {
    room(6, 4, 2.7, false);
    var baseM = cabinetMat(s.base), upM = cabinetMat(s.upper), bM = benchMat(s.bench), hd = s.handle, st = s.door;
    var x0 = -2.25, x1 = s.layout === 'pantry' ? 1.35 : 2.25;
    var kickH = 0.15, baseTop = 0.87, benchT = 0.04, D0 = 0.56;
    var hoodW = 0.9, hoodX = (x0 + x1) / 2 - hoodW / 2;

    // base carcass, kick, fronts
    box(world, x0, kickH, 0, x1 - x0, baseTop - kickH, D0 - 0.002, baseM);
    box(world, x0, 0, 0, x1 - x0, kickH, D0 - 0.06, M.kick);
    var n = Math.max(3, Math.round((x1 - x0) / 0.6)), uw = (x1 - x0) / n;
    var ovenIdx = Math.floor((hoodX + hoodW / 2 - x0) / uw);
    for (var i = 0; i < n; i++) {
      var x = x0 + i * uw, h = baseTop - kickH;
      if (i === ovenIdx) {
        front(world, x, baseTop - 0.16, D0, uw, 0.16, baseM, { style: st, handle: hd, drawer: true });
        box(world, x + 0.02, kickH + 0.02, D0, uw - 0.04, h - 0.2, 0.02, M.glass);
        box(world, x + 0.06, kickH + h - 0.26, D0 + 0.02, uw - 0.12, 0.015, 0.02, M.steel, true);
      } else if (i % 3 === 0) {
        for (var k = 0; k < 3; k++) front(world, x, kickH + k * h / 3, D0, uw, h / 3, baseM, { style: st, handle: hd, drawer: true });
      } else {
        front(world, x, kickH, D0, uw, h, baseM, { style: st, handle: hd, hingeLeft: i % 2 === 1 });
      }
    }
    // benchtop
    box(world, x0 - 0.02, baseTop, 0, x1 - x0 + 0.04, benchT, 0.62, bM);
    var bTop = baseTop + benchT;

    // splashback
    var upBot = 1.5, upTop = 2.2;
    var sw = x1 - x0, sh = upBot - bTop;
    var splashM;
    if (s.splash === 'subway') {
      splashM = std(0xffffff, 0.3, 0, { map: TEX.subway.clone() });
      splashM.map.needsUpdate = true;
      splashM.map.repeat.set(sw / 0.6, sh / 0.3);
    } else if (s.splash === 'glass') splashM = M.glass;
    else splashM = bM;
    box(world, x0, bTop, 0, sw, sh, 0.012, splashM);

    // overheads with rangehood gap
    var UD = 0.34;
    function upperRun(a, b) {
      if (b - a < 0.2) return;
      box(world, a, upBot, 0, b - a, upTop - upBot, UD - 0.002, upM);
      var m = Math.max(1, Math.round((b - a) / 0.55)), w = (b - a) / m;
      for (var j = 0; j < m; j++) front(world, a + j * w, upBot, UD, w, upTop - upBot, upM, { style: st, handle: hd, upper: true, hingeLeft: j % 2 === 0 });
    }
    upperRun(x0, hoodX);
    upperRun(hoodX + hoodW, x1);
    // rangehood canopy and cooktop
    box(world, hoodX, 1.78, 0, hoodW, upTop - 1.78, 0.42, upM);
    box(world, hoodX - 0.01, 1.74, 0, hoodW + 0.02, 0.04, 0.46, M.steel);
    box(world, hoodX + 0.13, bTop, 0.06, hoodW - 0.26, 0.008, 0.5, M.black, true);
    // bulkhead to ceiling
    box(world, x0, upTop, 0, x1 - x0, 2.7 - upTop, UD, M.ceiling);

    // sink and tap
    var sinkX = x0 + 0.65;
    box(world, sinkX, bTop + 0.001, 0.12, 0.7, 0.004, 0.4, M.steel, true);
    var tapM = hd === 'brass' ? handleMat('brass') : hd === 'steel' ? handleMat('steel') : handleMat('black');
    cyl(world, 0.014, 0.3, tapM, 'y', sinkX + 0.35, bTop + 0.15, 0.08);
    var arc = new T.Mesh(new T.TorusGeometry(0.09, 0.012, 8, 16, Math.PI), tapM);
    arc.rotation.y = Math.PI / 2;
    arc.position.set(sinkX + 0.35, bTop + 0.3, 0.17);
    world.add(arc);

    // pantry
    if (s.layout === 'pantry') {
      var px = x1 + 0.02, pw = 2.25 - px, ph = 2.2;
      box(world, px, kickH, 0, pw, ph - kickH, 0.6, upM);
      box(world, px, 0, 0, pw, kickH, 0.54, M.kick);
      front(world, px, kickH, 0.6, pw / 2, ph - kickH, upM, { style: st, handle: hd, tall: true, hingeLeft: false });
      front(world, px + pw / 2, kickH, 0.6, pw / 2, ph - kickH, upM, { style: st, handle: hd, tall: true, hingeLeft: true });
      box(world, px, ph, 0, pw, 2.7 - ph, 0.6, M.ceiling);
    }

    // island
    if (s.layout !== 'wall') {
      var iz = 1.55, iw = 2.4, ix = -iw / 2, idp = 0.62;
      var isl = new T.Group();
      // build facing +z in local space (doors toward the wall), then turn it around
      box(isl, ix, kickH, 0, iw, baseTop - kickH, idp, baseM);
      box(isl, ix, 0, 0.06, iw, kickH, idp - 0.06, M.kick);
      var m = 4, w = iw / m;
      for (var q = 0; q < m; q++) {
        if (q === 0 || q === 3) for (var r = 0; r < 3; r++) front(isl, ix + q * w, kickH + r * (baseTop - kickH) / 3, idp, w, (baseTop - kickH) / 3, baseM, { style: st, handle: hd, drawer: true });
        else front(isl, ix + q * w, kickH, idp, w, baseTop - kickH, baseM, { style: st, handle: hd, hingeLeft: q % 2 === 1 });
      }
      var waterfall = s.bench !== 'timber';
      box(isl, ix - (waterfall ? 0.04 : 0.02), baseTop, -0.32, iw + (waterfall ? 0.08 : 0.04), benchT, idp + 0.34, bM);
      if (waterfall) {
        box(isl, ix - 0.04, 0, -0.32, 0.04, baseTop, idp + 0.34, bM);
        box(isl, ix + iw, 0, -0.32, 0.04, baseTop, idp + 0.34, bM);
      }
      isl.rotation.y = Math.PI;
      isl.position.set(0, 0, iz + idp);
      world.add(isl);
      // stools on the seating side
      var sm = hd === 'brass' ? handleMat('brass') : handleMat('black');
      [-0.7, 0, 0.7].forEach(function (sx) {
        var sz = iz + idp + 0.5;
        cyl(world, 0.19, 0.05, M.stool, 'y', sx, 0.66, sz);
        [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (p) {
          var leg = cyl(world, 0.011, 0.66, sm, 'y', sx + p[0] * 0.12, 0.32, sz + p[1] * 0.12);
          leg.rotation.z = p[0] * 0.08; leg.rotation.x = -p[1] * 0.08;
        });
        cyl(world, 0.008, 0.26, sm, 'x', sx, 0.26, sz + 0.12);
      });
      // pendants
      [-0.75, 0, 0.75].forEach(function (px2) {
        cyl(world, 0.004, 0.75, M.black, 'y', px2, 2.32, iz + 0.45);
        var shade = new T.Mesh(new T.SphereGeometry(0.13, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), hd === 'brass' ? handleMat('brass') : M.black);
        shade.material.side = T.DoubleSide;
        shade.position.set(px2, 1.82, iz + 0.45);
        world.add(shade);
        var bulb = new T.Mesh(new T.SphereGeometry(0.04, 10, 8), M.bulb);
        bulb.position.set(px2, 1.8, iz + 0.45);
        world.add(bulb);
      });
    }

    // a plant on the bench
    cyl(world, 0.07, 0.14, M.pot, 'y', x1 - 0.45, bTop + 0.07, 0.3);
    var leaf = new T.Mesh(new T.SphereGeometry(0.14, 10, 8), M.leaf);
    leaf.position.set(x1 - 0.45, bTop + 0.25, 0.3);
    leaf.castShadow = true;
    world.add(leaf);

    return { target: new T.Vector3(0, 1.1, 1.0), radius: 6.0 };
  }

  /* ---------- wardrobes ---------- */
  function buildBuiltin(s) {
    room(6, 4, 2.7, false);
    var cm = cabinetMat(s.finish), hd = s.handle;
    var x0 = -1.5, w = 3, H = 2.4, Dp = 0.6;
    var trimM = hd === 'none' ? handleMat('none') : handleMat(hd);
    box(world, x0, 0, 0, w, H, Dp - 0.002, cm);
    box(world, x0, H, 0, w, 2.7 - H, Dp, M.ceiling);
    if (s.wdoors === 'hinged') {
      box(world, x0, 0, 0, w, 0.1, Dp - 0.06, M.kick);
      var n = 6, dw = w / n;
      for (var i = 0; i < n; i++) front(world, x0 + i * dw, 0.1, Dp, dw, H - 0.1, cm, { style: s.door, handle: hd, tall: true, hingeLeft: i % 2 === 1 });
    } else {
      var pn = 3, pw = w / pn + 0.04;
      for (var k = 0; k < pn; k++) {
        var px = x0 + k * ((w - pw) / (pn - 1)), pz = Dp + (k % 2 ? 0.035 : 0);
        var panelM = s.wdoors === 'mirror' ? M.mirror : cm;
        box(world, px + 0.025, 0.04, pz, pw - 0.05, H - 0.08, 0.016, panelM);
        // aluminium frame
        box(world, px, 0.03, pz - 0.004, 0.025, H - 0.06, 0.028, trimM);
        box(world, px + pw - 0.025, 0.03, pz - 0.004, 0.025, H - 0.06, 0.028, trimM);
        box(world, px, H - 0.06, pz - 0.004, pw, 0.03, 0.028, trimM);
        box(world, px, 0.03, pz - 0.004, pw, 0.03, 0.028, trimM);
      }
      box(world, x0, H - 0.03, Dp - 0.01, w, 0.03, 0.09, trimM);
      box(world, x0, 0, Dp - 0.01, w, 0.03, 0.09, trimM);
    }
    // wall returns so the robe sits in a recess, plus a rug for scale
    box(world, x0 - 0.12, 0, 0, 0.12, 2.7, Dp + 0.08, M.sidewall);
    box(world, x0 + w, 0, 0, 0.12, 2.7, Dp + 0.08, M.sidewall);
    box(world, -1.1, 0.001, 1.25, 2.2, 0.006, 1.0, std('#cdbfab', 0.95), true);
    return { target: new T.Vector3(0, 1.2, 0.5), radius: 6.0 };
  }

  function bays(parent, length, list, cm, s) {
    var H = 2.4, Dp = 0.6, bw = length / list.length, gt = 0.018;
    var trimM = s.handle === 'none' ? handleMat('none') : handleMat(s.handle);
    box(parent, 0, 0, 0, length, H, 0.012, M.inner); // back
    box(parent, 0, H - gt, 0, length, gt, Dp, cm);    // top
    box(parent, 0, 0, 0.02, length, 0.08, Dp - 0.04, M.kick);
    for (var g = 0; g <= list.length; g++) box(parent, Math.min(g * bw, length - gt), 0, 0, gt, H, Dp, cm);
    list.forEach(function (b, i) {
      var bx = i * bw + gt, iw = bw - gt;
      if (s.light === 'on') box(parent, bx, H - gt - 0.012, 0.05, iw, 0.01, 0.03, M.led, true);
      box(parent, bx, 0.08, 0.012, iw, gt, Dp - 0.02, cm); // base shelf
      function rail(y, len) {
        cyl(parent, 0.01, iw, trimM, 'x', bx + iw / 2, y, Dp / 2);
        var count = Math.floor((iw - 0.08) / 0.055);
        for (var q = 0; q < count; q++) {
          var cl = box(parent, bx + 0.05 + q * 0.055, y - len - 0.03 + (q % 3) * 0.08, Dp / 2 - 0.22, 0.03, len - (q % 3) * 0.08, 0.44, CLOTHES[(q + i) % CLOTHES.length]);
          cl.rotation.y = (q % 2 ? 0.08 : -0.06);
        }
      }
      function drawers(n) {
        var dh = 0.85 / n;
        for (var q = 0; q < n; q++) front(parent, bx, 0.1 + q * dh, Dp - 0.02, iw, dh, cm, { style: 'flat', handle: s.handle, drawer: true });
        box(parent, bx, 0.95, 0.012, iw, gt, Dp - 0.02, cm);
      }
      if (b === 'hang') { box(parent, bx, 2.0, 0.012, iw, gt, Dp - 0.02, cm); rail(1.92, 1.25); }
      if (b === 'hang2') { box(parent, bx, 2.05, 0.012, iw, gt, Dp - 0.02, cm); rail(1.97, 0.8); box(parent, bx, 1.05, 0.012, iw, gt, Dp - 0.02, cm); rail(0.99, 0.75); }
      if (b === 'shelf') for (var sy = 0.45; sy < 2.2; sy += 0.36) {
        box(parent, bx, sy, 0.012, iw, gt, Dp - 0.02, cm);
        box(parent, bx + 0.06, sy + gt, 0.12, iw - 0.12, 0.12, 0.34, CLOTHES[Math.floor(sy * 10) % CLOTHES.length]);
      }
      if (b === 'drawers') {
        drawers(4);
        for (var y2 = 1.35; y2 < 2.2; y2 += 0.4) box(parent, bx, y2, 0.012, iw, gt, Dp - 0.02, cm);
        box(parent, bx + 0.08, 1.37, 0.15, iw - 0.16, 0.2, 0.3, CLOTHES[4]);
      }
      if (b === 'shoes') for (var hy = 0.35; hy < 2.2; hy += 0.3) {
        var sh = box(parent, bx, hy, 0.05, iw, gt, Dp - 0.08, cm);
        sh.rotation.x = 0.25;
        for (var p = 0; p < Math.floor(iw / 0.16); p++) {
          box(parent, bx + 0.03 + p * 0.16, hy + 0.03, 0.22, 0.09, 0.08, 0.26, p % 2 ? M.kick : CLOTHES[3]).rotation.x = 0.25;
        }
      }
    });
  }

  function buildWalkin(s) {
    var W = 3.2, Dd = 2.6;
    room(W, Dd, 2.7, true);
    var cm = cabinetMat(s.finish);
    var sets = {
      balanced: [['hang2', 'shelf', 'drawers', 'hang'], ['hang', 'shoes'], ['hang2', 'drawers']],
      hanging: [['hang2', 'hang', 'shelf', 'hang2'], ['hang', 'hang2'], ['hang2', 'hang']],
      drawers: [['shoes', 'drawers', 'hang', 'drawers'], ['shoes', 'drawers'], ['hang2', 'shoes']]
    }[s.internals] || [['hang2', 'shelf', 'drawers', 'hang'], ['hang', 'shoes'], ['hang2', 'drawers']];
    var back = new T.Group();
    bays(back, W, sets[0], cm, s);
    back.position.set(-W / 2, 0, 0);
    world.add(back);
    var sideLen = Dd - 0.6 - 0.4;
    var left = new T.Group();
    bays(left, sideLen, sets[1], cm, s);
    left.rotation.y = Math.PI / 2;
    left.position.set(-W / 2, 0, 0.6 + sideLen);
    world.add(left);
    var right = new T.Group();
    bays(right, sideLen, sets[2], cm, s);
    right.rotation.y = -Math.PI / 2;
    right.position.set(W / 2, 0, 0.6);
    world.add(right);
    // ceiling bulkheads above units
    box(world, -W / 2, 2.4, 0, W, 0.3, 0.6, M.ceiling);
    // centre ottoman and rug
    box(world, -0.9, 0.001, 0.95, 1.8, 0.006, 1.2, std('#cdbfab', 0.95), true);
    box(world, -0.35, 0, 1.3, 0.7, 0.42, 0.45, std('#b9a58c', 0.95));
    if (s.light === 'on') {
      var glow = new T.PointLight(0xffe3b0, 0.45, 5, 2);
      glow.position.set(0, 2.2, 1.0);
      world.add(glow);
    }
    return { target: new T.Vector3(0, 1.2, 0.9), radius: 5.4 };
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
    view.theta = clamp(view.theta - (e.clientX - p.x) * 0.008, -1.25, 1.25);
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
    view.radius = clamp(view.radius * f, 2.6, 9);
    draw();
  }
  host.querySelectorAll('[data-d3]').forEach(function (b) {
    b.addEventListener('click', function () {
      var a = b.dataset.d3;
      if (a === 'in') zoom(0.85);
      if (a === 'out') zoom(1.18);
      if (a === 'reset') { lastMode = null; update(); }
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
    var key = mode + (mode === 'wardrobe' ? s.wtype : '');
    if (key !== lastMode) {
      lastMode = key;
      view.target.copy(frame.target);
      view.radius = frame.radius * (host.clientWidth && host.clientWidth < 520 ? 0.8 : 1);
      view.theta = mode === 'wardrobe' && s.wtype === 'walkin' ? 0.2 : 0.42;
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
  function resize() {
    var w = host.clientWidth, h = Math.round(w * 0.65);
    if (!w) return;
    var size = renderer.getSize(new T.Vector2());
    if (size.x !== w || size.y !== h) {
      renderer.setSize(w, h, false);
      el.style.width = w + 'px';
      el.style.height = h + 'px';
      camera.aspect = w / h;
      camera.fov = w < 520 ? 46 : 38;
      camera.updateProjectionMatrix();
    }
  }
  if ('ResizeObserver' in window) new ResizeObserver(draw).observe(host);
  else window.addEventListener('resize', draw);

  window.JC3D = { update: update, draw: draw, model: function () { return world; } };
  update();
})();
