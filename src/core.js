/* =========================================================
   星降マート — rainy corner diorama
   Shared scene kit: palette, toon materials, geometry helpers,
   signage / texture helpers, glow decals, outline pass.
   Plain-script global namespace: window.DIORAMA
   ========================================================= */
(function () {
  'use strict';

  const D = (window.DIORAMA = window.DIORAMA || {});
  D.T = THREE;
  D.errors = [];
  window.addEventListener('error', function (e) {
    D.errors.push(String(e.message || e.error || e));
  });
  window.addEventListener('unhandledrejection', function (e) {
    D.errors.push('promise: ' + String(e.reason));
  });

  /* ---------------------------------------------------------
     Layout constants (1 unit ~= 1 metre, +Z faces the opening view)
     --------------------------------------------------------- */
  D.config = {
    BASE: 26,
    HALF: 13,
    Y: {
      ROAD: 0.02,
      WALK: 0.15,
      CURB: 0.17,
      STORE: 0.19,
      MARK: 0.032,
    },
    ZONE: {
      store: { x0: -6.8, x1: 1.4, z0: -6.2, z1: 0.6 },
      alley: { x0: -9.0, x1: -6.8, z0: -6.6, z1: 1.0 },
      leftBuilding: { x0: -11.2, x1: -9.0, z0: -7.2, z1: 1.0 },
      forecourt: { x0: -11.2, x1: 4.8, z0: 0.6, z1: 4.2 },
      eastWalk: { x0: 1.4, x1: 4.8, z0: -6.6, z1: 4.2 },
      frontRoad: { x0: -13, x1: 8.6, z0: 4.2, z1: 9.6 },
      sideRoad: { x0: 4.8, x1: 8.6, z0: -8.0, z1: 9.6 },
      farWalk: { x0: 8.6, x1: 10.6, z0: -8.0, z1: 4.2 },
      frontWalk: { x0: -13, x1: 13, z0: 9.6, z1: 13 },
      backYard: { x0: -9.0, x1: 4.8, z0: -8.8, z1: -6.6 },
      backHouses: { x0: -12.8, x1: 4.8, z0: -12.8, z1: -8.8 },
    },
  };

  D.palette = {
    night: 0x0b0e1a,
    ink: 0x171426,
    deepNavy: 0x1a2036,
    asphalt: 0x222738,
    asphaltDark: 0x161a27,
    sidewalk: 0x8f929c,
    sidewalkDark: 0x6c7180,
    curb: 0xb9bcc2,
    storeWall: 0xe8ddc8,
    storeWallShade: 0xcfc3ad,
    teal: 0x0d5b58,
    tealLight: 0x2c9b91,
    coral: 0xff6d5d,
    mustard: 0xffc65c,
    cream: 0xfff3d2,
    warm: 0xffc681,
    warmDeep: 0xff9552,
    cool: 0xbfe1ff,
    neonPink: 0xff5b9d,
    neonCyan: 0x6ce9ff,
    wood: 0x5a4235,
    woodDark: 0x322821,
    leaf: 0x1c4b42,
    leafLight: 0x2e7060,
    metal: 0x8b95a4,
    metalDark: 0x3a4050,
    shadow: 0x15121f,
  };

  const C = D.config;
  const P = D.palette;

  /* ---------------------------------------------------------
     Small utilities
     --------------------------------------------------------- */
  D.rng = function (seed) {
    let a = seed >>> 0;
    return function () {
      a += 0x6d2b79f5;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  D.rand = D.rng(90210);
  D.lerp = (a, b, t) => a + (b - a) * t;
  D.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  D.deg = (d) => (d * Math.PI) / 180;

  D.updaters = [];
  D.onUpdate = function (fn) {
    D.updaters.push(fn);
  };

  D.layer = function (name) {
    const g = new D.T.Group();
    g.name = name;
    (D.root || D.scene).add(g);
    return g;
  };

  /* ---------------------------------------------------------
     Toon ramp + materials
     --------------------------------------------------------- */
  function makeRamp(stops) {
    const data = new Uint8Array(stops.length * 4);
    for (let i = 0; i < stops.length; i++) {
      const v = Math.round(stops[i] * 255);
      data[i * 4 + 0] = v;
      data[i * 4 + 1] = v;
      data[i * 4 + 2] = v;
      data[i * 4 + 3] = 255;
    }
    const tex = new D.T.DataTexture(data, stops.length, 1, D.T.RGBAFormat);
    tex.minFilter = D.T.NearestFilter;
    tex.magFilter = D.T.NearestFilter;
    tex.generateMipmaps = false;
    tex.needsUpdate = true;
    return tex;
  }
  D.ramps = {
    soft: makeRamp([0.36, 0.55, 0.72, 0.86, 1.0]),
    crisp: makeRamp([0.3, 0.58, 0.82, 1.0]),
    bright: makeRamp([0.55, 0.72, 0.88, 1.0]),
  };

  D.toon = function (color, opts) {
    opts = opts || {};
    const m = new D.T.MeshToonMaterial({
      color: color,
      gradientMap: opts.gradientMap || D.ramps.crisp,
      side: opts.side !== undefined ? opts.side : D.T.FrontSide,
      transparent: !!opts.transparent,
      opacity: opts.opacity !== undefined ? opts.opacity : 1,
      map: opts.map || null,
      emissive: opts.emissive || 0x000000,
      emissiveIntensity: opts.emissiveIntensity !== undefined ? opts.emissiveIntensity : 1,
      depthWrite: opts.depthWrite !== undefined ? opts.depthWrite : true,
      fog: opts.fog !== undefined ? opts.fog : true,
    });
    m.userData.toon = true;
    if (opts.flat) m.flatShading = true;
    return m;
  };

  D.standard = function (color, opts) {
    opts = opts || {};
    return new D.T.MeshStandardMaterial({
      color: color,
      roughness: opts.roughness !== undefined ? opts.roughness : 0.62,
      metalness: opts.metalness !== undefined ? opts.metalness : 0.05,
      map: opts.map || null,
      emissive: opts.emissive || 0x000000,
      emissiveIntensity: opts.emissiveIntensity !== undefined ? opts.emissiveIntensity : 1,
      side: opts.side !== undefined ? opts.side : D.T.FrontSide,
      transparent: !!opts.transparent,
      opacity: opts.opacity !== undefined ? opts.opacity : 1,
      envMapIntensity: opts.envMapIntensity !== undefined ? opts.envMapIntensity : 1,
      depthWrite: opts.depthWrite !== undefined ? opts.depthWrite : true,
      roughnessMap: opts.roughnessMap || null,
      normalMap: opts.normalMap || null,
      normalScale: opts.normalScale || new D.T.Vector2(1, 1),
      bumpMap: opts.bumpMap || null,
      bumpScale: opts.bumpScale !== undefined ? opts.bumpScale : 0.02,
      alphaMap: opts.alphaMap || null,
      alphaTest: opts.alphaTest !== undefined ? opts.alphaTest : 0,
      polygonOffset: !!opts.polygonOffset,
      polygonOffsetFactor: opts.polygonOffsetFactor || 0,
      polygonOffsetUnits: opts.polygonOffsetUnits || 0,
    });
  };

  D.basic = function (color, opts) {
    opts = opts || {};
    return new D.T.MeshBasicMaterial({
      color: color,
      map: opts.map || null,
      side: opts.side !== undefined ? opts.side : D.T.FrontSide,
      transparent: !!opts.transparent,
      opacity: opts.opacity !== undefined ? opts.opacity : 1,
      depthWrite: opts.depthWrite !== undefined ? opts.depthWrite : true,
      blending: opts.blending !== undefined ? opts.blending : D.T.NormalBlending,
      toneMapped: opts.toneMapped !== undefined ? opts.toneMapped : true,
      fog: opts.fog !== undefined ? opts.fog : true,
      alphaTest: opts.alphaTest || 0,
      alphaMap: opts.alphaMap || null,
    });
  };

  D.glass = function (color, opts) {
    opts = opts || {};
    return new D.T.MeshPhysicalMaterial({
      color: color,
      metalness: 0.0,
      roughness: opts.roughness !== undefined ? opts.roughness : 0.06,
      transparent: true,
      opacity: opts.opacity !== undefined ? opts.opacity : 0.22,
      side: opts.side !== undefined ? opts.side : D.T.DoubleSide,
      depthWrite: false,
      envMapIntensity: 1.4,
      clearcoat: 1,
      clearcoatRoughness: 0.04,
      toneMapped: opts.toneMapped !== undefined ? opts.toneMapped : true,
    });
  };

  D.neon = function (color) {
    return new D.T.MeshBasicMaterial({ color: color, toneMapped: false, fog: false });
  };

  D.envMapIntensity = function (mat, v) {
    if (mat) mat.envMapIntensity = v;
    return mat;
  };

  /* ---------------------------------------------------------
     Canvas texture helpers
     --------------------------------------------------------- */
  D.maxAniso = 8;
  D.canvasTexture = function (w, h, draw, opts) {
    opts = opts || {};
    const cv = document.createElement('canvas');
    cv.width = w;
    cv.height = h;
    const ctx = cv.getContext('2d');
    draw(ctx, w, h);
    const tex = new D.T.CanvasTexture(cv);
    tex.colorSpace = D.T.SRGBColorSpace;
    tex.anisotropy = D.maxAniso;
    if (opts.repeat) {
      tex.wrapS = tex.wrapT = D.T.RepeatWrapping;
      tex.repeat.set(opts.repeat[0], opts.repeat[1]);
    }
    if (opts.clamp) {
      tex.wrapS = tex.wrapT = D.T.ClampToEdgeWrapping;
    }
    tex.needsUpdate = true;
    return tex;
  };

  D.texture = function (canvas) {
    const tex = new D.T.CanvasTexture(canvas);
    tex.colorSpace = D.T.SRGBColorSpace;
    tex.anisotropy = D.maxAniso;
    tex.needsUpdate = true;
    return tex;
  };

  D.roundRect = function (ctx, x, y, w, h, r) {
    r = Math.min(r, w * 0.5, h * 0.5);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  };

  D.drawText = function (ctx, text, x, y, opts) {
    opts = opts || {};
    ctx.save();
    ctx.font = opts.font || '700 48px "Yu Gothic", "Meiryo", sans-serif';
    ctx.fillStyle = opts.color || '#ffffff';
    ctx.textAlign = opts.align || 'center';
    ctx.textBaseline = opts.baseline || 'middle';
    if ('letterSpacing' in ctx && opts.spacing) ctx.letterSpacing = opts.spacing + 'px';
    if (opts.stroke) {
      ctx.lineWidth = opts.strokeWidth || 4;
      ctx.strokeStyle = opts.stroke;
      ctx.strokeText(text, x, y);
    }
    if (opts.shadow) {
      ctx.shadowColor = opts.shadow;
      ctx.shadowBlur = opts.shadowBlur || 20;
    }
    ctx.fillText(text, x, y);
    ctx.restore();
  };

  D.verticalText = function (ctx, text, x, y, step, opts) {
    opts = opts || {};
    ctx.save();
    ctx.font = opts.font || '700 40px "Yu Gothic", "Meiryo", sans-serif';
    ctx.fillStyle = opts.color || '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < text.length; i++) {
      ctx.fillText(text[i], x, y + i * step);
    }
    ctx.restore();
  };

  /* Radial glow texture (white, alpha falloff) */
  D.tex = {};
  D.tex.glow = D.canvasTexture(256, 256, (ctx) => {
    const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.18, 'rgba(255,255,255,0.8)');
    g.addColorStop(0.5, 'rgba(255,255,255,0.22)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
  });

  /* Wet-neon streak texture for flat reflection decals */
  D.tex.streak = D.canvasTexture(256, 512, (ctx) => {
    ctx.clearRect(0, 0, 256, 512);
    const rr = D.rng(77);
    for (let i = 0; i < 34; i++) {
      const x = rr() * 256;
      const w = 1 + rr() * 6;
      const y = rr() * 300;
      const len = 100 + rr() * 400;
      const a = 0.04 + rr() * 0.22;
      const g = ctx.createLinearGradient(0, y, 0, y + len);
      g.addColorStop(0, 'rgba(255,255,255,0)');
      g.addColorStop(0.35, 'rgba(255,255,255,' + a + ')');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x, y, w, len);
    }
    const edge = ctx.createLinearGradient(0, 0, 256, 0);
    edge.addColorStop(0, 'rgba(0,0,0,1)');
    edge.addColorStop(0.16, 'rgba(0,0,0,0)');
    edge.addColorStop(0.84, 'rgba(0,0,0,0)');
    edge.addColorStop(1, 'rgba(0,0,0,1)');
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = edge;
    ctx.fillRect(0, 0, 256, 512);
    ctx.globalCompositeOperation = 'source-over';
  }, { clamp: true });

  /* Soft-edged vertical pool (for warm light spilling from windows/doors) */
  D.tex.pool = D.canvasTexture(256, 256, (ctx) => {
    const g = ctx.createRadialGradient(128, 120, 10, 128, 128, 128);
    g.addColorStop(0, 'rgba(255,255,255,0.95)');
    g.addColorStop(0.35, 'rgba(255,255,255,0.45)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
  });

  /* ---------------------------------------------------------
     Geometry helpers
     --------------------------------------------------------- */
  D.geo = {};

  D.geo.box = function (w, h, d, seg) {
    return new D.T.BoxGeometry(w, h, d, seg || 1, seg || 1, seg || 1);
  };

  D.geo.roundedRectShape = function (w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    const s = new D.T.Shape();
    s.moveTo(-w / 2 + r, -h / 2);
    s.lineTo(w / 2 - r, -h / 2);
    s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
    s.lineTo(w / 2, h / 2 - r);
    s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
    s.lineTo(-w / 2 + r, h / 2);
    s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
    s.lineTo(-w / 2, -h / 2 + r);
    s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
    return s;
  };

  /* Rounded slab / plinth. Geometry is centered on Y. */
  D.geo.roundedSlab = function (w, d, h, r, bevel) {
    const shape = D.geo.roundedRectShape(w, d, r);
    const geo = new D.T.ExtrudeGeometry(shape, {
      depth: h,
      bevelEnabled: true,
      bevelThickness: bevel || 0.045,
      bevelSize: bevel || 0.045,
      bevelSegments: 2,
      curveSegments: 10,
    });
    geo.translate(0, 0, -h / 2);
    geo.rotateX(-Math.PI / 2);
    geo.computeVertexNormals();
    return geo;
  };

  D.geo.roundedBox = function (w, h, d, r) {
    const shape = D.geo.roundedRectShape(w, h, r);
    const geo = new D.T.ExtrudeGeometry(shape, {
      depth: d,
      bevelEnabled: true,
      bevelThickness: Math.min(0.02, d * 0.08),
      bevelSize: Math.min(0.02, d * 0.08),
      bevelSegments: 2,
      curveSegments: 6,
    });
    geo.translate(0, 0, -d / 2);
    geo.computeVertexNormals();
    return geo;
  };

  D.mesh = function (geo, mat, opts) {
    opts = opts || {};
    const m = new D.T.Mesh(geo, mat);
    m.position.set(opts.x || 0, opts.y || 0, opts.z || 0);
    if (opts.rx) m.rotation.x = opts.rx;
    if (opts.ry) m.rotation.y = opts.ry;
    if (opts.rz) m.rotation.z = opts.rz;
    m.castShadow = opts.cast !== undefined ? opts.cast : true;
    m.receiveShadow = opts.receive !== undefined ? opts.receive : true;
    if (opts.renderOrder) m.renderOrder = opts.renderOrder;
    if (opts.name) m.name = opts.name;
    if (opts.parent) opts.parent.add(m);
    return m;
  };

  D.box = function (parent, w, h, d, mat, opts) {
    opts = opts || {};
    const m = D.mesh(D.geo.box(w, h, d), mat, opts);
    if (parent) parent.add(m);
    return m;
  };

  D.plane = function (parent, w, h, mat, opts) {
    opts = opts || {};
    const m = D.mesh(new D.T.PlaneGeometry(w, h), mat, opts);
    if (parent) parent.add(m);
    return m;
  };

  D.cyl = function (parent, rt, rb, h, seg, mat, opts) {
    opts = opts || {};
    const m = D.mesh(new D.T.CylinderGeometry(rt, rb, h, seg, opts.hSeg || 1, !!opts.open), mat, opts);
    if (parent) parent.add(m);
    return m;
  };

  D.sphere = function (parent, r, ws, hs, mat, opts) {
    opts = opts || {};
    const m = D.mesh(new D.T.SphereGeometry(r, ws || 16, hs || 12), mat, opts);
    if (parent) parent.add(m);
    return m;
  };

  D.torus = function (parent, r, tube, rs, ts, mat, opts) {
    opts = opts || {};
    const m = D.mesh(new D.T.TorusGeometry(r, tube, rs || 8, ts || 24), mat, opts);
    if (parent) parent.add(m);
    return m;
  };

  D.capsule = function (parent, r, len, cs, rs, mat, opts) {
    opts = opts || {};
    const m = D.mesh(new D.T.CapsuleGeometry(r, len, cs || 4, rs || 8), mat, opts);
    if (parent) parent.add(m);
    return m;
  };

  D.tube = function (parent, points, radius, mat, opts) {
    opts = opts || {};
    const curve = new D.T.CatmullRomCurve3(points);
    const geo = new D.T.TubeGeometry(curve, opts.segments || 32, radius, opts.radial || 5, false);
    const m = D.mesh(geo, mat, { cast: opts.cast !== undefined ? opts.cast : false, receive: false, parent });
    return m;
  };

  D.line = function (parent, points, color, opacity) {
    const geo = new D.T.BufferGeometry().setFromPoints(points);
    const mat = new D.T.LineBasicMaterial({
      color: color,
      transparent: opacity !== undefined,
      opacity: opacity !== undefined ? opacity : 1,
      toneMapped: false,
      fog: false,
    });
    const line = new D.T.Line(geo, mat);
    if (parent) parent.add(line);
    return line;
  };

  D.radialShape = function (points) {
    const shape = new D.T.Shape();
    shape.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) shape.lineTo(points[i][0], points[i][1]);
    shape.closePath();
    return shape;
  };

  /* ---------------------------------------------------------
     Glow sprites / wet reflection decals
     --------------------------------------------------------- */
  D.glowSprite = function (parent, opts) {
    opts = opts || {};
    const mat = new D.T.SpriteMaterial({
      map: opts.map || D.tex.glow,
      color: opts.color !== undefined ? opts.color : 0xffffff,
      transparent: true,
      opacity: opts.opacity !== undefined ? opts.opacity : 0.45,
      blending: D.T.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
      fog: false,
    });
    const s = new D.T.Sprite(mat);
    s.position.set(opts.x || 0, opts.y || 0, opts.z || 0);
    const size = opts.size || 2;
    s.scale.set(size * (opts.aspect || 1), size, 1);
    if (opts.parent !== false && parent) parent.add(s);
    return s;
  };

  D.floorGlow = function (parent, opts) {
    opts = opts || {};
    const w = opts.w || 2;
    const l = opts.l || 5;
    const mat = new D.T.MeshBasicMaterial({
      map: opts.map || D.tex.streak,
      color: opts.color !== undefined ? opts.color : 0xffffff,
      transparent: true,
      opacity: opts.opacity !== undefined ? opts.opacity : 0.36,
      blending: D.T.AdditiveBlending,
      depthWrite: false,
      side: D.T.DoubleSide,
      toneMapped: false,
      fog: false,
    });
    const m = D.mesh(new D.T.PlaneGeometry(w, l), mat, {
      x: opts.x || 0,
      y: opts.y !== undefined ? opts.y : C.Y.ROAD + 0.012,
      z: opts.z || 0,
      rx: -Math.PI / 2,
      ry: opts.rotation || 0,
      cast: false,
      receive: false,
      renderOrder: 4,
      parent,
    });
    m.userData.noOutline = true;
    return m;
  };

  /* Soft fake-light pool on the wet ground */
  D.lightPool = function (parent, opts) {
    opts = opts || {};
    const mat = new D.T.MeshBasicMaterial({
      map: D.tex.pool,
      color: opts.color !== undefined ? opts.color : P.warm,
      transparent: true,
      opacity: opts.opacity !== undefined ? opts.opacity : 0.28,
      blending: D.T.AdditiveBlending,
      depthWrite: false,
      side: D.T.DoubleSide,
      toneMapped: false,
      fog: false,
    });
    const m = D.mesh(new D.T.PlaneGeometry(opts.w || 4, opts.l || 4), mat, {
      x: opts.x || 0,
      y: opts.y !== undefined ? opts.y : C.Y.ROAD + 0.011,
      z: opts.z || 0,
      rx: -Math.PI / 2,
      ry: opts.rotation || 0,
      cast: false,
      receive: false,
      renderOrder: 3,
      parent,
    });
    m.userData.noOutline = true;
    return m;
  };

  /* ---------------------------------------------------------
     Signage helpers
     --------------------------------------------------------- */
  D.signPanel = function (parent, tex, w, h, opts) {
    opts = opts || {};
    const group = new D.T.Group();
    group.position.set(opts.x || 0, opts.y || 0, opts.z || 0);
    if (opts.ry) group.rotation.y = opts.ry;
    if (opts.rx) group.rotation.x = opts.rx;
    if (opts.rz) group.rotation.z = opts.rz;
    parent.add(group);
    const depth = opts.depth !== undefined ? opts.depth : 0.08;
    if (depth > 0) {
      const backing = D.box(group, w + 0.03, h + 0.03, depth, opts.backingMat || D.toon(opts.backingColor || 0x27313f, { gradientMap: D.ramps.soft }), {
        y: 0,
        z: -depth / 2,
        cast: true,
        receive: true,
      });
      backing.userData.noOutline = opts.noOutlineBacking || false;
    }
    const faceMat = new D.T.MeshBasicMaterial({
      map: tex,
      transparent: !!opts.transparent,
      opacity: opts.opacity !== undefined ? opts.opacity : 1,
      toneMapped: opts.toneMapped !== undefined ? opts.toneMapped : false,
      side: opts.side !== undefined ? opts.side : D.T.FrontSide,
      fog: !!opts.fog,
      alphaTest: opts.alphaTest || 0,
    });
    const face = D.plane(group, w, h, faceMat, {
      z: depth / 2 + 0.003,
      cast: false,
      receive: false,
      renderOrder: 5,
    });
    face.userData.noOutline = true;
    group.userData.face = face;
    return group;
  };

  D.verticalSign = function (parent, tex, w, h, opts) {
    opts = opts || {};
    const g = new D.T.Group();
    g.position.set(opts.x || 0, opts.y || 0, opts.z || 0);
    g.rotation.y = opts.ry || 0;
    parent.add(g);
    const depth = opts.depth || 0.14;
    const backingMat = opts.backingMat || D.toon(0x22303d, { gradientMap: D.ramps.soft });
    D.box(g, w + 0.05, h + 0.05, depth, backingMat, { z: 0, cast: true, receive: true });
    const mat = new D.T.MeshBasicMaterial({
      map: tex,
      side: D.T.DoubleSide,
      transparent: !!opts.transparent,
      opacity: opts.opacity !== undefined ? opts.opacity : 1,
      toneMapped: false,
      fog: false,
    });
    const face = D.plane(g, w, h, mat, { z: depth / 2 + 0.004, cast: false, receive: false, renderOrder: 5 });
    face.userData.noOutline = true;
    return g;
  };

  /* Thin neon tube, returns group with glow sprite optional */
  D.neonTube = function (parent, a, b, radius, color, opts) {
    opts = opts || {};
    const mid = new D.T.Vector3((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
    const dir = new D.T.Vector3(b.x - a.x, b.y - a.y, b.z - a.z);
    const len = dir.length();
    const geo = new D.T.CylinderGeometry(radius, radius, len, 6);
    const mesh = new D.T.Mesh(geo, D.neon(color));
    mesh.position.copy(mid);
    mesh.quaternion.setFromUnitVectors(new D.T.Vector3(0, 1, 0), dir.clone().normalize());
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    parent.add(mesh);
    return mesh;
  };

  /* ---------------------------------------------------------
     Outline (inverted hull, screen-constant thickness)
     --------------------------------------------------------- */
  D.outlineMaterial = function (thickness, color) {
    return new D.T.ShaderMaterial({
      uniforms: {
        uThickness: { value: thickness || 0.0015 },
        uColor: { value: new D.T.Color(color || 0x14111d) },
      },
      vertexShader: [
        'uniform float uThickness;',
        'void main() {',
        '  vec4 mv = modelViewMatrix * vec4(position, 1.0);',
        '  vec3 n = normalize(normalMatrix * normal);',
        '  mv.xyz += n * uThickness * max(1.0, -mv.z);',
        '  gl_Position = projectionMatrix * mv;',
        '}',
      ].join('\n'),
      fragmentShader: [
        'uniform vec3 uColor;',
        'void main() { gl_FragColor = vec4(uColor, 1.0); }',
      ].join('\n'),
      side: D.T.BackSide,
      depthWrite: true,
      toneMapped: false,
      fog: false,
    });
  };

  D.outline = function (mesh, thickness, color) {
    if (!mesh || !mesh.geometry) return null;
    const mat = D.outlineMaterial(thickness || 0.0015, color);
    const hull = new D.T.Mesh(mesh.geometry, mat);
    hull.castShadow = false;
    hull.receiveShadow = false;
    hull.userData.isOutline = true;
    hull.renderOrder = (mesh.renderOrder || 0) - 0.1;
    mesh.add(hull);
    return hull;
  };

  D.autoOutline = function (root, opts) {
    opts = opts || {};
    const minRadius = opts.minRadius !== undefined ? opts.minRadius : 0.24;
    const thick = opts.thickness !== undefined ? opts.thickness : 0.00145;
    const list = [];
    root.updateMatrixWorld(true);
    root.traverse((o) => {
      if (!o.isMesh || o.isInstancedMesh || o.userData.isOutline || o.userData.noOutline) return;
      if (o.material && !Array.isArray(o.material)) {
        const m = o.material;
        const eligible = (m.isMeshToonMaterial || m.isMeshStandardMaterial) && !m.transparent;
        if (!eligible) return;
        const geo = o.geometry;
        if (!geo) return;
        if (!geo.boundingSphere) geo.computeBoundingSphere();
        if (!geo.boundingSphere) return;
        const scale = Math.max(Math.abs(o.scale.x), Math.abs(o.scale.y), Math.abs(o.scale.z));
        if (geo.boundingSphere.radius * scale < minRadius) return;
        // Skip flat road/ground-like slabs that own no outlines by default.
        const bb = geo.boundingBox;
        if (!bb) geo.computeBoundingBox();
        list.push(o);
      }
    });
    for (const o of list) D.outline(o, thick, opts.color);
    return list.length;
  };

  /* ---------------------------------------------------------
     Environment / background
     --------------------------------------------------------- */
  D.makeEnvironment = function (renderer) {
    const pmrem = new D.T.PMREMGenerator(renderer);
    const tex = D.canvasTexture(1024, 512, (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#070912');
      g.addColorStop(0.42, '#11162a');
      g.addColorStop(0.58, '#37283c');
      g.addColorStop(0.72, '#1b2435');
      g.addColorStop(1, '#06070c');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      // soft neon smears on the horizon
      const smears = [
        [0.16, 0.55, '#ffae66', 0.35, 330],
        [0.33, 0.52, '#5fe7ff', 0.22, 280],
        [0.62, 0.54, '#ff5f9e', 0.2, 260],
        [0.82, 0.56, '#ffd48a', 0.3, 300],
      ];
      for (const s of smears) {
        const gg = ctx.createRadialGradient(s[0] * w, s[1] * h, 0, s[0] * w, s[1] * h, s[4]);
        gg.addColorStop(0, s[2]);
        gg.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.globalAlpha = s[3];
        ctx.fillStyle = gg;
        ctx.fillRect(0, 0, w, h);
      }
      ctx.globalAlpha = 1;
      // tiny city pin lights
      const rr = D.rng(4);
      for (let i = 0; i < 180; i++) {
        const x = rr() * w;
        const y = h * (0.34 + rr() * 0.28);
        ctx.fillStyle = rr() > 0.5 ? 'rgba(255,214,160,0.5)' : 'rgba(150,235,255,0.36)';
        ctx.fillRect(x, y, 1 + rr() * 2, 1);
      }
    });
    tex.mapping = D.T.EquirectangularReflectionMapping;
    const env = pmrem.fromEquirectangular(tex).texture;
    tex.dispose();
    pmrem.dispose();
    return env;
  };

  D.skyGradientTexture = function () {
    return D.canvasTexture(1200, 800, (ctx, w, h) => {
      const g = ctx.createRadialGradient(w * 0.5, h * 0.44, 20, w * 0.5, h * 0.5, h * 0.95);
      g.addColorStop(0, '#202038');
      g.addColorStop(0.32, '#15162a');
      g.addColorStop(0.68, '#0a0b14');
      g.addColorStop(1, '#04050a');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      // faint colored atmosphere behind the miniature (purple / teal / warm)
      const glows = [
        [w * 0.5, h * 0.39, w * 0.42, 'rgba(105,94,178,0.20)'],
        [w * 0.24, h * 0.58, w * 0.34, 'rgba(35,93,121,0.14)'],
        [w * 0.77, h * 0.57, w * 0.32, 'rgba(118,55,92,0.12)'],
        [w * 0.48, h * 0.72, w * 0.3, 'rgba(117,77,52,0.10)'],
      ];
      for (const gl of glows) {
        const rg = ctx.createRadialGradient(gl[0], gl[1], 0, gl[0], gl[1], gl[2]);
        rg.addColorStop(0, gl[3]);
        rg.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = rg;
        ctx.fillRect(0, 0, w, h);
      }

      // extremely subtle distant bokeh
      const rr = D.rng(52);
      for (let i = 0; i < 46; i++) {
        const x = w * (0.18 + rr() * 0.68);
        const y = h * (0.28 + rr() * 0.5);
        const r = 2 + rr() * 12;
        const col = rr() > 0.55 ? 'rgba(255,203,143,' : 'rgba(119,174,220,';
        const bg = ctx.createRadialGradient(x, y, 0, x, y, r);
        bg.addColorStop(0, col + (0.02 + rr() * 0.05) + ')');
        bg.addColorStop(1, col + '0)');
        ctx.fillStyle = bg;
        ctx.fillRect(x - r, y - r, r * 2, r * 2);
      }

      // vignette baked into the backdrop
      const vg = ctx.createRadialGradient(w * 0.5, h * 0.48, h * 0.24, w * 0.5, h * 0.52, h * 0.88);
      vg.addColorStop(0, 'rgba(0,0,0,0)');
      vg.addColorStop(0.72, 'rgba(0,0,0,0.22)');
      vg.addColorStop(1, 'rgba(0,0,0,0.62)');
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, w, h);
    });
  };

  /* ---------------------------------------------------------
     Misc background silhouettes: a reusable little house shell
     --------------------------------------------------------- */
  D.simpleHouse = function (parent, opts) {
    opts = opts || {};
    const g = new D.T.Group();
    g.position.set(opts.x || 0, opts.y || 0, opts.z || 0);
    g.rotation.y = opts.ry || 0;
    parent.add(g);
    const w = opts.w || 3;
    const d = opts.d || 2.6;
    const h = opts.h || 2.6;
    const wallMat = opts.wallMat || D.toon(opts.wallColor || 0x4b4b5c, { gradientMap: D.ramps.soft });
    const roofMat = opts.roofMat || D.toon(opts.roofColor || 0x252536, { gradientMap: D.ramps.soft });
    D.box(g, w, h, d, wallMat, { y: h / 2, cast: true, receive: true });
    // gabled roof (two slanted slabs)
    const roofH = opts.roofH || 0.9;
    const slope = Math.atan2(roofH, w / 2);
    const slab = Math.sqrt((w / 2) ** 2 + roofH ** 2) + 0.25;
    const left = D.box(g, slab, 0.1, d + 0.55, roofMat, {
      x: -w / 4,
      y: h + roofH / 2 - 0.05,
      z: 0,
      rz: slope,
      cast: true,
    });
    const right = D.box(g, slab, 0.1, d + 0.55, roofMat, {
      x: w / 4,
      y: h + roofH / 2 - 0.05,
      z: 0,
      rz: -slope,
      cast: true,
    });
    // one warm window
    if (opts.window !== false) {
      const winMat = D.basic(opts.windowColor || 0xffb877, { toneMapped: false });
      const win = D.plane(g, w * 0.3, h * 0.28, winMat, {
        x: (opts.windowX || 0.15) * w,
        y: h * 0.58,
        z: d / 2 + 0.011,
      });
      win.userData.noOutline = true;
      const frame = D.box(g, w * 0.32, h * 0.3, 0.03, D.toon(0x3a3040), {
        x: (opts.windowX || 0.15) * w,
        y: h * 0.58,
        z: d / 2 + 0.002,
        cast: false,
      });
      frame.userData.noOutline = true;
    }
    return g;
  };

  /* Foliage clump: a few low-poly spheres for anime trees/bushes */
  D.foliage = function (parent, opts) {
    opts = opts || {};
    const g = new D.T.Group();
    g.position.set(opts.x || 0, opts.y || 0, opts.z || 0);
    parent.add(g);
    const colors = opts.colors || [0x183f38, 0x225349, 0x2c6556];
    const rr = D.rng(opts.seed || 3);
    const count = opts.count || 5;
    for (let i = 0; i < count; i++) {
      const r = (opts.r || 0.8) * (0.65 + rr() * 0.55);
      const mat = D.toon(colors[Math.floor(rr() * colors.length)], {
        gradientMap: D.ramps.soft,
        flat: true,
      });
      const m = D.sphere(g, r, 9, 7, mat, {
        x: (rr() - 0.5) * (opts.spread || 1.6),
        y: (opts.height || 0) + rr() * (opts.rise || 1.1),
        z: (rr() - 0.5) * (opts.spread || 1.6),
        rx: rr() * 3,
        ry: rr() * 3,
        cast: true,
        receive: true,
      });
      m.scale.y = 0.78 + rr() * 0.32;
    }
    return g;
  };

  /* ---------------------------------------------------------
     Convenience: a round lamp with glow
     --------------------------------------------------------- */
  D.lampGlow = function (parent, opts) {
    opts = opts || {};
    const color = opts.color !== undefined ? opts.color : P.warm;
    const g = new D.T.Group();
    g.position.set(opts.x || 0, opts.y || 0, opts.z || 0);
    parent.add(g);
    if (opts.housing !== false) {
      const housingMat = D.toon(opts.housingColor || 0x50515e, { gradientMap: D.ramps.soft });
      D.sphere(g, opts.housingR || 0.18, 12, 8, housingMat, { y: 0, cast: true });
    }
    const bulbMat = D.basic(color, { toneMapped: false });
    D.sphere(g, opts.bulbR || 0.13, 10, 8, bulbMat, { y: -0.01, cast: false });
    D.glowSprite(g, {
      x: 0,
      y: -0.03,
      z: 0,
      color: color,
      size: opts.glow || 1.5,
      opacity: opts.glowOpacity !== undefined ? opts.glowOpacity : 0.55,
    });
    return g;
  };

  /* ---------------------------------------------------------
     Static geometry batcher.
     Merges opaque meshes that share a material into one mesh per
     (material, shadow flags, renderOrder) bucket. Transforms are baked
     relative to `layer`; animated/rare objects can opt out with
     userData.noMerge on themselves or any ancestor. Invisible once
     outlines have been generated, but a large draw-call win.
     --------------------------------------------------------- */
  D.staticBatch = function (layer, opts) {
    opts = opts || {};
    const T = D.T;
    layer.updateMatrixWorld(true);
    const invRoot = new T.Matrix4().copy(layer.matrixWorld).invert();
    const buckets = new Map();
    const victims = [];
    layer.traverse((o) => {
      if (!o.isMesh || o.isInstancedMesh || o.isSkinnedMesh || o.isBatchedMesh) return;
      if (o.userData.isOutline || o.userData.noBatch) return;
      if (Array.isArray(o.material)) return;
      const mat = o.material;
      if (!mat) return;
      // Skip anything that needs per-object sorting / blending.
      if (mat.transparent || mat.opacity < 1 || mat.blending !== T.NormalBlending) return;
      if (mat.vertexColors) return;
      if (o.skeleton || o.morphTargetInfluences) return;
      let p = o.parent;
      while (p && p !== layer) {
        if (p.userData && (p.userData.noMerge || p.userData.isOutline)) return;
        p = p.parent;
      }
      if (!o.geometry || !o.geometry.attributes || !o.geometry.attributes.position) return;
      if (!o.geometry.attributes.normal) return;
      if (mat.map && !o.geometry.attributes.uv) return;
      if (o.geometry.morphAttributes && Object.keys(o.geometry.morphAttributes).length) return;
      const key =
        mat.uuid +
        '|' + (o.castShadow ? 1 : 0) +
        '|' + (o.receiveShadow ? 1 : 0) +
        '|' + (o.userData.noOutline ? 1 : 0) +
        '|' + (o.renderOrder | 0);
      let b = buckets.get(key);
      if (!b) {
        b = {
          mat,
          cast: o.castShadow,
          receive: o.receiveShadow,
          noOutline: !!o.userData.noOutline,
          renderOrder: o.renderOrder | 0,
          geos: [],
        };
        buckets.set(key, b);
      }
      const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
      const m = new T.Matrix4().multiplyMatrices(invRoot, o.matrixWorld);
      g.applyMatrix4(m);
      b.geos.push(g);
      victims.push(o);
    });
    for (let i = 0; i < victims.length; i++) {
      const v = victims[i];
      if (v.parent) v.parent.remove(v);
    }
    let count = 0;
    for (const b of buckets.values()) {
      if (!b.geos.length) continue;
      let mesh = null;
      if (b.geos.length === 1) {
        mesh = new T.Mesh(b.geos[0], b.mat);
      } else {
        let vCount = 0;
        for (const g of b.geos) vCount += g.attributes.position.count;
        const pos = new Float32Array(vCount * 3);
        const nor = new Float32Array(vCount * 3);
        const hasUV = b.geos.every((g) => !!g.attributes.uv);
        const uv = hasUV ? new Float32Array(vCount * 2) : null;
        let po = 0;
        let no = 0;
        let uo = 0;
        for (const g of b.geos) {
          pos.set(g.attributes.position.array, po);
          po += g.attributes.position.array.length;
          nor.set(g.attributes.normal.array, no);
          no += g.attributes.normal.array.length;
          if (hasUV) {
            uv.set(g.attributes.uv.array, uo);
            uo += g.attributes.uv.array.length;
          }
          g.dispose();
        }
        const merged = new T.BufferGeometry();
        merged.setAttribute('position', new T.BufferAttribute(pos, 3));
        merged.setAttribute('normal', new T.BufferAttribute(nor, 3));
        if (hasUV) merged.setAttribute('uv', new T.BufferAttribute(uv, 2));
        merged.computeBoundingSphere();
        mesh = new T.Mesh(merged, b.mat);
      }
      mesh.castShadow = b.cast;
      mesh.receiveShadow = b.receive;
      mesh.renderOrder = b.renderOrder;
      mesh.userData.noOutline = b.noOutline;
      layer.add(mesh);
      count++;
    }
    return { before: victims.length, after: count };
  };

  /* ---------------------------------------------------------
     Debug / self-test
     --------------------------------------------------------- */
  D.ready = false;
})();
