/* =========================================================
   HOSHIFURI MART - ground, road and square diorama plinth
   street-builder module:
   - collectible rounded plinth (26 x 26, top y = 0)
   - wet asphalt T-junction, forecourt / walks, curbs + cuts
   - gutters + metal grates, manholes, road paint, zebra crossings
   - tactile paving, parking bays, puddles, wet-sheen decals
   ========================================================= */
(function () {
  'use strict';
  const D = window.DIORAMA;
  const T = THREE;
  const C = D.config;
  const P = D.palette;
  const Y = C.Y;

  /* ---------------- layout constants (inside -12.8 .. 12.8) ------------- */
  const EDGE = 12.8;

  const ROAD_F = { x0: -EDGE, x1: 8.6, z0: 4.2, z1: 9.6 };   // front (E-W) road
  const ROAD_S = { x0: 4.8, x1: 8.6, z0: -8.0, z1: 4.2 };    // side (N-S) road
  const WALK = {
    forecourt: { x0: -11.2, x1: 4.8, z0: 0.6, z1: 4.2 },
    east: { x0: 1.4, x1: 4.8, z0: -6.6, z1: 0.6 },
    far: { x0: 8.6, x1: 10.6, z0: -8.0, z1: 4.2 },
    front: { x0: -EDGE, x1: EDGE, z0: 9.6, z1: EDGE },
    corner: { x0: 8.6, x1: EDGE, z0: 4.2, z1: 9.6 },
  };
  const ALLEY = { x0: -9.0, x1: -6.8, z0: -6.6, z1: 0.6 };
  const YARD = {
    back: { x0: -9.0, x1: 4.8, z0: -8.8, z1: -6.6 },
    left: { x0: -EDGE, x1: -11.2, z0: -8.8, z1: 4.2 },
    farPlot: { x0: 10.6, x1: EDGE, z0: -8.8, z1: 4.2 },
    backPlot: { x0: -EDGE, x1: EDGE, z0: -EDGE, z1: -8.8 },
  };

  /* front crossing band (across the front road) and side crossing band */
  const XW_F = { x0: 2.2, x1: 4.5 };            // x band
  const XW_S = { z0: 1.4, z1: 3.6 };            // z band
  const DRIVE = { x0: -7.2, x1: -4.2 };         // forecourt driveway cut

  const noOut = function (m) {
    m.userData.noOutline = true;
    return m;
  };

  /* =====================================================================
     tiny mesh helpers
     ===================================================================== */
  function flat(parent, w, d, mat, x, y, z) {
    const m = new T.Mesh(new T.PlaneGeometry(w, d), mat);
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, y, z);
    m.castShadow = false;
    m.receiveShadow = true;
    parent.add(m);
    return noOut(m);
  }

  /* flat plane whose uv is driven by world position so tiles line up */
  function flatUV(parent, w, d, tile, mat, x, y, z) {
    const geo = new T.PlaneGeometry(w, d);
    const pos = geo.attributes.position;
    const uv = geo.attributes.uv;
    for (let i = 0; i < uv.count; i++) {
      uv.setXY(i, (pos.getX(i) + x) / tile, (z - pos.getY(i)) / tile);
    }
    const m = new T.Mesh(geo, mat);
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, y, z);
    m.castShadow = false;
    m.receiveShadow = true;
    parent.add(m);
    return noOut(m);
  }

  function rect(parent, x0, x1, z0, z1, y, mat) {
    return flat(parent, x1 - x0, z1 - z0, mat, (x0 + x1) / 2, y, (z0 + z1) / 2);
  }

  function block(parent, x0, x1, z0, z1, y0, y1, mat, opts) {
    opts = opts || {};
    const m = new T.Mesh(new T.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), mat);
    m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    m.castShadow = opts.cast !== undefined ? opts.cast : true;
    m.receiveShadow = opts.receive !== undefined ? opts.receive : true;
    if (opts.noOutline) noOut(m);
    if (opts.name) m.name = opts.name;
    parent.add(m);
    return m;
  }

  /* sloped ramp rectangle. axis 'z': slope runs along Z; sign +1 = high end
     is toward +Z. yLow = height at the low end. */
  function ramp(parent, cx, cz, width, run, rise, axis, sign, yLow, mat) {
    const len = Math.hypot(run, rise);
    const geo = new T.PlaneGeometry(width, len);
    const u = axis === 'z' ? new T.Vector3(1, 0, 0) : new T.Vector3(0, 0, 1);
    const v =
      axis === 'z'
        ? new T.Vector3(0, rise / len, (sign * run) / len)
        : new T.Vector3((sign * run) / len, rise / len, 0);
    const n = new T.Vector3().crossVectors(u, v);
    const mtx = new T.Matrix4().makeBasis(u, v, n);
    const m = new T.Mesh(geo, mat);
    m.quaternion.setFromRotationMatrix(mtx);
    const xc = cx + (axis === 'x' ? (sign * run) / 2 : 0);
    const zc = cz + (axis === 'z' ? (sign * run) / 2 : 0);
    m.position.set(xc, yLow + rise / 2, zc);
    m.castShadow = false;
    m.receiveShadow = true;
    parent.add(m);
    return noOut(m);
  }

  /* =====================================================================
     procedural textures
     ===================================================================== */
  function makeAsphalt(px, py, seed, opt) {
    opt = opt || {};
    const rr = D.rng(seed);
    const map = D.canvasTexture(
      px,
      py,
      function (ctx, w, h) {
        ctx.fillStyle = opt.base || '#2b3142';
        ctx.fillRect(0, 0, w, h);

        // broad wet / worn mottling
        for (let i = 0; i < 34; i++) {
          const x = rr() * w;
          const y = rr() * h;
          const r = (0.05 + rr() * 0.28) * w;
          const g = ctx.createRadialGradient(x, y, 0, x, y, r);
          const dark = rr() > 0.42;
          g.addColorStop(0, dark ? 'rgba(9,11,19,0.26)' : 'rgba(76,86,112,0.10)');
          g.addColorStop(0.62, dark ? 'rgba(9,11,19,0.10)' : 'rgba(76,86,112,0.04)');
          g.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = g;
          ctx.fillRect(0, 0, w, h);
        }

        // tyre tracks: dark bands at fixed v (front road) or u (side road)
        if (opt.tracksV) {
          for (let i = 0; i < opt.tracksV.length; i++) {
            const t = opt.tracksV[i];
            const g = ctx.createLinearGradient(0, t.v * h - t.w / 2, 0, t.v * h + t.w / 2);
            g.addColorStop(0, 'rgba(8,10,17,0)');
            g.addColorStop(0.5, 'rgba(8,10,17,' + (t.a || 0.18) + ')');
            g.addColorStop(1, 'rgba(8,10,17,0)');
            ctx.fillStyle = g;
            ctx.fillRect(0, t.v * h - t.w / 2, w, t.w);
          }
        }
        if (opt.tracksU) {
          for (let i = 0; i < opt.tracksU.length; i++) {
            const t = opt.tracksU[i];
            const g = ctx.createLinearGradient(t.u * w - t.w / 2, 0, t.u * w + t.w / 2, 0);
            g.addColorStop(0, 'rgba(8,10,17,0)');
            g.addColorStop(0.5, 'rgba(8,10,17,' + (t.a || 0.18) + ')');
            g.addColorStop(1, 'rgba(8,10,17,0)');
            ctx.fillStyle = g;
            ctx.fillRect(t.u * w - t.w / 2, 0, t.w, h);
          }
        }

        // baked-in parking wear
        if (opt.bays) {
          for (let i = 0; i < opt.bays.length; i++) {
            const b = opt.bays[i];
            const g = ctx.createLinearGradient(0, b.v0 * h, 0, b.v1 * h);
            g.addColorStop(0, 'rgba(6,8,13,0.10)');
            g.addColorStop(0.6, 'rgba(6,8,13,0.26)');
            g.addColorStop(1, 'rgba(6,8,13,0.06)');
            ctx.fillStyle = g;
            ctx.fillRect(b.u0 * w, b.v0 * h, (b.u1 - b.u0) * w, (b.v1 - b.v0) * h);
          }
        }

        // long wet sheen streaks (subtle reflected light on the film of water)
        for (let i = 0; i < 7; i++) {
          const y = rr() * h;
          const hh = 2 + rr() * 9;
          const g = ctx.createLinearGradient(0, y, 0, y + hh);
          g.addColorStop(0, 'rgba(0,0,0,0)');
          g.addColorStop(0.5, 'rgba(118,140,182,' + (0.03 + rr() * 0.05) + ')');
          g.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = g;
          ctx.fillRect(0, y, w, hh);
        }

        // aggregate grain
        const n = Math.floor((w * h) / 115);
        for (let i = 0; i < n; i++) {
          const v = 26 + Math.floor(rr() * 54);
          ctx.fillStyle = 'rgba(' + v + ',' + (v + 4) + ',' + (v + 15) + ',' + (0.08 + rr() * 0.3) + ')';
          const s = 0.7 + rr() * 1.9;
          ctx.fillRect(rr() * w, rr() * h, s, s);
        }
        // wet glints
        for (let i = 0; i < n / 6; i++) {
          ctx.fillStyle = 'rgba(158,178,214,' + (0.05 + rr() * 0.14) + ')';
          ctx.fillRect(rr() * w, rr() * h, 1, 1);
        }

        // cracks
        ctx.strokeStyle = 'rgba(8,9,15,0.55)';
        ctx.lineWidth = 1;
        const cracks = opt.cracks !== false ? Math.max(2, Math.floor(w / 220)) : 0;
        for (let i = 0; i < cracks; i++) {
          ctx.beginPath();
          let x = rr() * w;
          let y = rr() * h;
          ctx.moveTo(x, y);
          for (let j = 0; j < 5 + rr() * 7; j++) {
            x += (rr() - 0.5) * w * 0.07;
            y += (rr() - 0.5) * h * 0.18;
            ctx.lineTo(x, y);
          }
          ctx.stroke();
        }

        // tar repair patches
        if (opt.patches) {
          for (let i = 0; i < opt.patches.length; i++) {
            const p = opt.patches[i];
            const x = p.u * w;
            const y = p.v * h;
            const pw = p.w * w;
            const ph = p.h * h;
            ctx.fillStyle = 'rgba(13,15,23,0.5)';
            D.roundRect(ctx, x - pw / 2, y - ph / 2, pw, ph, 2);
            ctx.fill();
            ctx.strokeStyle = 'rgba(6,7,12,0.75)';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.strokeStyle = 'rgba(88,98,124,0.16)';
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }

        // oil stains
        const oils = opt.oil || 0;
        for (let i = 0; i < oils; i++) {
          const x = rr() * w;
          const y = rr() * h;
          const r = w * (0.012 + rr() * 0.04);
          const g = ctx.createRadialGradient(x, y, 0, x, y, r);
          g.addColorStop(0, 'rgba(4,5,9,0.55)');
          g.addColorStop(0.65, 'rgba(6,8,14,0.28)');
          g.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.ellipse(x, y, r, r * 0.62, rr() * 3, 0, 6.2832);
          ctx.fill();
        }
      },
      { clamp: true }
    );

    const rough = D.canvasTexture(
      Math.max(64, px >> 1),
      Math.max(64, py >> 1),
      function (ctx, w, h) {
        ctx.fillStyle = '#8f8f8f';
        ctx.fillRect(0, 0, w, h);
        for (let i = 0; i < 34; i++) {
          const x = rr() * w;
          const y = rr() * h;
          const r = (0.03 + rr() * 0.22) * w;
          const g = ctx.createRadialGradient(x, y, 0, x, y, r);
          const wet = rr() > 0.34;
          g.addColorStop(0, wet ? 'rgba(24,24,24,0.92)' : 'rgba(206,206,206,0.3)');
          g.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = g;
          ctx.fillRect(0, 0, w, h);
        }
        const n = Math.floor((w * h) / 80);
        for (let i = 0; i < n; i++) {
          const v = 80 + Math.floor(rr() * 100);
          ctx.fillStyle = 'rgba(' + v + ',' + v + ',' + v + ',' + (0.1 + rr() * 0.28) + ')';
          ctx.fillRect(rr() * w, rr() * h, 1.6, 1.6);
        }
      },
      { clamp: true }
    );
    rough.colorSpace = T.NoColorSpace;
    return { map: map, rough: rough };
  }

  function makePaving(px, seed) {
    const rr = D.rng(seed);
    const n = 4;
    const map = D.canvasTexture(
      px,
      px,
      function (ctx, w, h) {
        ctx.fillStyle = '#747984';
        ctx.fillRect(0, 0, w, h);
        const cw = w / n;
        for (let iy = 0; iy < n; iy++) {
          for (let ix = 0; ix < n; ix++) {
            const v = 118 + Math.floor(rr() * 26) - 10;
            ctx.fillStyle = 'rgb(' + v + ',' + (v + 3) + ',' + (v + 10) + ')';
            ctx.fillRect(ix * cw + 2.5, iy * cw + 2.5, cw - 5, cw - 5);
            // per-slab speckle
            for (let k = 0; k < 90; k++) {
              const g = 90 + Math.floor(rr() * 70);
              ctx.fillStyle = 'rgba(' + g + ',' + g + ',' + (g + 6) + ',' + (0.06 + rr() * 0.2) + ')';
              ctx.fillRect(ix * cw + rr() * cw, iy * cw + rr() * cw, 1 + rr() * 2, 1 + rr() * 2);
            }
            // faint damp patch per slab
            if (rr() > 0.6) {
              const gx = ix * cw + cw * (0.2 + rr() * 0.6);
              const gy = iy * cw + cw * (0.2 + rr() * 0.6);
              const gr = ctx.createRadialGradient(gx, gy, 0, gx, gy, cw * 0.55);
              gr.addColorStop(0, 'rgba(30,34,44,0.16)');
              gr.addColorStop(1, 'rgba(30,34,44,0)');
              ctx.fillStyle = gr;
              ctx.fillRect(ix * cw, iy * cw, cw, cw);
            }
          }
        }
        // joints
        ctx.strokeStyle = 'rgba(34,37,46,0.9)';
        ctx.lineWidth = Math.max(2, px / 220);
        for (let i = 0; i <= n; i++) {
          ctx.beginPath();
          ctx.moveTo(i * cw, 0);
          ctx.lineTo(i * cw, h);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(0, i * cw);
          ctx.lineTo(w, i * cw);
          ctx.stroke();
        }
        // grime along joints
        ctx.strokeStyle = 'rgba(52,58,72,0.28)';
        ctx.lineWidth = Math.max(4, px / 120);
        for (let i = 0; i <= n; i++) {
          ctx.beginPath();
          ctx.moveTo(i * cw + 3, 0);
          ctx.lineTo(i * cw + 3, h);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(0, i * cw + 3);
          ctx.lineTo(w, i * cw + 3);
          ctx.stroke();
        }
        // stains
        for (let i = 0; i < 14; i++) {
          const x = rr() * w;
          const y = rr() * h;
          const r = w * (0.02 + rr() * 0.09);
          const g = ctx.createRadialGradient(x, y, 0, x, y, r);
          g.addColorStop(0, 'rgba(24,28,38,' + (0.08 + rr() * 0.16) + ')');
          g.addColorStop(1, 'rgba(24,28,38,0)');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.ellipse(x, y, r, r * (0.5 + rr() * 0.5), rr() * 3, 0, 6.2832);
          ctx.fill();
        }
      },
      { repeat: [1, 1] }
    );
    const rough = D.canvasTexture(
      px / 2,
      px / 2,
      function (ctx, w, h) {
        ctx.fillStyle = '#9a9a9a';
        ctx.fillRect(0, 0, w, h);
        for (let i = 0; i < 26; i++) {
          const x = rr() * w;
          const y = rr() * h;
          const r = (0.03 + rr() * 0.16) * w;
          const g = ctx.createRadialGradient(x, y, 0, x, y, r);
          g.addColorStop(0, 'rgba(52,52,52,0.7)');
          g.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = g;
          ctx.fillRect(0, 0, w, h);
        }
        for (let i = 0; i < (w * h) / 90; i++) {
          const v = 100 + Math.floor(rr() * 90);
          ctx.fillStyle = 'rgba(' + v + ',' + v + ',' + v + ',' + (0.1 + rr() * 0.3) + ')';
          ctx.fillRect(rr() * w, rr() * h, 1.5, 1.5);
        }
      },
      { repeat: [1, 1] }
    );
    rough.colorSpace = T.NoColorSpace;
    return { map: map, rough: rough };
  }

  function makeEarth(px, seed) {
    const rr = D.rng(seed);
    return D.canvasTexture(
      px,
      px,
      function (ctx, w, h) {
        ctx.fillStyle = '#1b1a23';
        ctx.fillRect(0, 0, w, h);
        for (let i = 0; i < 24; i++) {
          const x = rr() * w;
          const y = rr() * h;
          const r = w * (0.04 + rr() * 0.16);
          const g = ctx.createRadialGradient(x, y, 0, x, y, r);
          g.addColorStop(0, rr() > 0.5 ? 'rgba(8,8,13,0.4)' : 'rgba(58,58,72,0.12)');
          g.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = g;
          ctx.fillRect(0, 0, w, h);
        }
        for (let i = 0; i < (w * h) / 190; i++) {
          const v = 20 + Math.floor(rr() * 48);
          ctx.fillStyle = 'rgba(' + v + ',' + (v + 1) + ',' + (v + 5) + ',' + (0.15 + rr() * 0.4) + ')';
          const s = 1 + rr() * 3;
          ctx.fillRect(rr() * w, rr() * h, s, s * (0.6 + rr() * 0.7));
        }
        for (let i = 0; i < (w * h) / 900; i++) {
          ctx.fillStyle = 'rgba(44,66,52,' + (0.1 + rr() * 0.25) + ')';
          ctx.fillRect(rr() * w, rr() * h, 1 + rr() * 3, 1 + rr() * 2);
        }
      },
      { repeat: [1, 1] }
    );
  }

  function makeGutter() {
    const rr = D.rng(311);
    const tex = D.canvasTexture(256, 64, function (ctx, w, h) {
      ctx.fillStyle = '#5e626b';
      ctx.fillRect(0, 0, w, h);
      // concrete shoulders
      ctx.fillStyle = '#7b808a';
      ctx.fillRect(0, 0, w, h * 0.16);
      ctx.fillRect(0, h * 0.84, w, h * 0.16);
      ctx.fillStyle = '#14161d';
      ctx.fillRect(0, h * 0.24, w, h * 0.52);
      // wet highlight in the channel
      const g = ctx.createLinearGradient(0, h * 0.42, 0, h * 0.78);
      g.addColorStop(0, 'rgba(126,150,186,0.16)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, h * 0.42, w, h * 0.36);
      // joint lines every repeat
      ctx.fillStyle = 'rgba(18,20,27,0.9)';
      ctx.fillRect(0, 0, 3, h);
      // grime specks
      for (let i = 0; i < 130; i++) {
        const v = 60 + Math.floor(rr() * 60);
        ctx.fillStyle = 'rgba(' + v + ',' + (v + 4) + ',' + (v + 10) + ',' + (0.1 + rr() * 0.3) + ')';
        ctx.fillRect(rr() * w, rr() * h, 1 + rr() * 2, 1 + rr() * 2);
      }
    });
    tex.wrapS = T.RepeatWrapping;
    tex.wrapT = T.ClampToEdgeWrapping;
    return tex;
  }

  function makeGrate() {
    const rr = D.rng(913);
    return D.canvasTexture(128, 128, function (ctx, w, h) {
      ctx.fillStyle = '#0a0c11';
      ctx.fillRect(0, 0, w, h);
      // frame
      ctx.strokeStyle = '#79828f';
      ctx.lineWidth = 7;
      ctx.strokeRect(3.5, 3.5, w - 7, h - 7);
      ctx.strokeStyle = 'rgba(20,24,32,0.9)';
      ctx.lineWidth = 2;
      ctx.strokeRect(8, 8, w - 16, h - 16);
      // bars running along u, slots between them
      const bars = 6;
      for (let i = 0; i < bars; i++) {
        const y = 12 + (i * (h - 24)) / (bars - 1);
        const g = ctx.createLinearGradient(0, y - 4, 0, y + 4);
        g.addColorStop(0, '#9aa3b1');
        g.addColorStop(0.45, '#5c6573');
        g.addColorStop(1, '#282e39');
        ctx.fillStyle = g;
        ctx.fillRect(11, y - 3.4, w - 22, 6.8);
      }
      // cross ties
      ctx.fillStyle = '#3c434f';
      ctx.fillRect(w * 0.34, 10, 4, h - 20);
      ctx.fillRect(w * 0.66, 10, 4, h - 20);
      // wet glints + leaf
      ctx.fillStyle = 'rgba(160,205,255,0.16)';
      ctx.fillRect(14, 16, w - 28, 3);
      ctx.fillStyle = 'rgba(60,74,44,0.7)';
      ctx.beginPath();
      ctx.ellipse(w * 0.3, h * 0.72, 7, 3.4, 0.6, 0, 6.2832);
      ctx.fill();
      for (let i = 0; i < 26; i++) {
        ctx.fillStyle = 'rgba(20,24,32,' + (0.2 + rr() * 0.4) + ')';
        ctx.fillRect(rr() * w, rr() * h, 2, 2);
      }
    });
  }

  function makeManhole() {
    const rr = D.rng(707);
    return D.canvasTexture(256, 256, function (ctx, w, h) {
      const cx = w / 2;
      const cy = h / 2;
      const cg = ctx.createRadialGradient(cx - 30, cy - 30, 10, cx, cy, 128);
      cg.addColorStop(0, '#3b4150');
      cg.addColorStop(0.7, '#2a2e3a');
      cg.addColorStop(1, '#1c1f28');
      ctx.fillStyle = cg;
      ctx.fillRect(0, 0, w, h);
      // rim
      ctx.strokeStyle = '#69717f';
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.arc(cx, cy, 119, 0, 6.2832);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(10,12,17,0.9)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy, 112, 0, 6.2832);
      ctx.stroke();
      // concentric rings
      ctx.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        ctx.strokeStyle = i % 2 ? 'rgba(126,136,154,0.3)' : 'rgba(14,16,22,0.6)';
        ctx.beginPath();
        ctx.arc(cx, cy, 40 + i * 22, 0, 6.2832);
        ctx.stroke();
      }
      // diamond grip pattern
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, 106, 0, 6.2832);
      ctx.clip();
      for (let i = -12; i <= 12; i++) {
        ctx.strokeStyle = 'rgba(10,12,17,0.45)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx - 128, cy + i * 14);
        ctx.lineTo(cx + 128, cy + i * 14 - 64);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx - 128, cy + i * 14 - 64);
        ctx.lineTo(cx + 128, cy + i * 14);
        ctx.stroke();
      }
      ctx.restore();
      // centre mark (hoshifuri)
      D.drawText(ctx, '\u661f', cx, cy + 3, {
        font: '700 58px "Yu Gothic","Meiryo","MS Gothic",sans-serif',
        color: 'rgba(158,170,190,0.75)',
      });
      // bolts
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * 6.2832;
        ctx.fillStyle = 'rgba(150,160,178,0.5)';
        ctx.beginPath();
        ctx.arc(cx + Math.cos(a) * 100, cy + Math.sin(a) * 100, 3.6, 0, 6.2832);
        ctx.fill();
      }
      // wet wear
      for (let i = 0; i < 130; i++) {
        ctx.fillStyle = 'rgba(180,200,230,' + (0.02 + rr() * 0.07) + ')';
        ctx.fillRect(rr() * w, rr() * h, 1 + rr() * 2, 1 + rr() * 2);
      }
    });
  }

  function makeTactile() {
    const rr = D.rng(140);
    return D.canvasTexture(
      128,
      128,
      function (ctx, w, h) {
        // two by two dots per texture tile (0.3 m)
        const g = ctx.createLinearGradient(0, 0, w, h);
        g.addColorStop(0, '#b8891f');
        g.addColorStop(1, '#a5761a');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
        for (let iy = 0; iy < 2; iy++) {
          for (let ix = 0; ix < 2; ix++) {
            const cx = 32 + ix * 64;
            const cy = 32 + iy * 64;
            const dg = ctx.createRadialGradient(cx - 6, cy - 6, 1, cx, cy, 21);
            dg.addColorStop(0, '#ffe08a');
            dg.addColorStop(0.45, '#d9a52c');
            dg.addColorStop(1, '#7d5611');
            ctx.fillStyle = dg;
            ctx.beginPath();
            ctx.arc(cx, cy, 20, 0, 6.2832);
            ctx.fill();
            ctx.strokeStyle = 'rgba(60,40,8,0.35)';
            ctx.lineWidth = 2;
            ctx.stroke();
          }
        }
        // grime
        for (let i = 0; i < 60; i++) {
          ctx.fillStyle = 'rgba(28,22,8,' + (0.05 + rr() * 0.16) + ')';
          ctx.fillRect(rr() * w, rr() * h, 1 + rr() * 3, 1 + rr() * 3);
        }
      },
      { repeat: [1, 1] }
    );
  }

  function makeStopText() {
    const rr = D.rng(2201);
    return D.canvasTexture(256, 512, function (ctx, w, h) {
      ctx.clearRect(0, 0, w, h);
      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.rotate(Math.PI);
      ctx.fillStyle = 'rgba(228,233,240,0.94)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '900 156px "Yu Gothic","Meiryo","MS Gothic",sans-serif';
      ctx.fillText('\u6b62', 0, 186);
      ctx.fillText('\u307e', 0, 0);
      ctx.fillText('\u308c', 0, -186);
      ctx.restore();
      // worn paint
      ctx.globalCompositeOperation = 'destination-out';
      for (let i = 0; i < 260; i++) {
        ctx.fillStyle = 'rgba(0,0,0,' + (0.2 + rr() * 0.75) + ')';
        ctx.fillRect(rr() * w, rr() * h, 1 + rr() * 5, 1 + rr() * 4);
      }
      ctx.globalCompositeOperation = 'source-over';
    });
  }

  function makeNumber(n) {
    return D.canvasTexture(96, 120, function (ctx, w, h) {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(226,231,239,0.92)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '800 104px "Arial Narrow",Arial,sans-serif';
      ctx.fillText(String(n), w / 2, h / 2 + 4);
    });
  }

  function makeLetterP() {
    return D.canvasTexture(128, 128, function (ctx, w, h) {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(226,231,239,0.9)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '900 110px Arial,sans-serif';
      ctx.fillText('P', w / 2, h / 2 + 6);
    });
  }

  function makePlaque() {
    return D.canvasTexture(1024, 80, function (ctx, w, h) {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#2a2318');
      g.addColorStop(0.5, '#3a3022');
      g.addColorStop(1, '#211b12');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(186,152,92,0.75)';
      ctx.lineWidth = 3;
      ctx.strokeRect(10, 8, w - 20, h - 16);
      ctx.strokeStyle = 'rgba(20,16,10,0.9)';
      ctx.lineWidth = 1;
      ctx.strokeRect(16, 13, w - 32, h - 26);
      // small diamond separators
      ctx.fillStyle = 'rgba(196,162,102,0.8)';
      for (const x of [w * 0.14, w * 0.86]) {
        ctx.beginPath();
        ctx.moveTo(x, h / 2 - 9);
        ctx.lineTo(x + 9, h / 2);
        ctx.lineTo(x, h / 2 + 9);
        ctx.lineTo(x - 9, h / 2);
        ctx.closePath();
        ctx.fill();
      }
      D.drawText(ctx, '\u661f\u964d\u30de\u30fc\u30c8', w / 2, h / 2 - 5, {
        font: '700 40px "Yu Gothic","Meiryo","MS Gothic",sans-serif',
        color: 'rgba(222,189,128,0.92)',
        spacing: 7,
      });
      D.drawText(ctx, 'HOSHIFURI  MART', w / 2, h / 2 + 26, {
        font: '600 13px "Segoe UI",Arial,sans-serif',
        color: 'rgba(176,146,96,0.8)',
        spacing: 5,
      });
    });
  }

  /* Bake lane paint directly into the road colour + roughness maps.
     This keeps paint perfectly flush with the wet asphalt (no z-fighting)
     and lets the paint share the wet sheen of the road. */
  function bakeRoadMarks(mapTex, roughTex, kind) {
    const map = mapTex.image;
    const rough = roughTex.image;
    const mc = map.getContext('2d');
    const rc = rough.getContext('2d');
    const W = map.width;
    const H = map.height;
    const RW = rough.width;
    const RH = rough.height;
    const front = kind === 'front';
    const toPx = function (x, z, scale) {
      const u = front ? (x + 12.8) / 21.4 : (x - 4.8) / 3.8;
      const v = front ? (z - 4.2) / 5.4 : (z + 8.0) / 12.2;
      return [u * W * scale, v * H * scale];
    };
    function fill(x0, x1, z0, z1, alpha) {
      const a = toPx(Math.min(x0, x1), Math.min(z0, z1), 1);
      const b = toPx(Math.max(x0, x1), Math.max(z0, z1), 1);
      mc.fillStyle = 'rgba(224,230,238,' + (alpha === undefined ? 0.86 : alpha) + ')';
      mc.fillRect(a[0], a[1], b[0] - a[0], b[1] - a[1]);
      const ra = toPx(Math.min(x0, x1), Math.min(z0, z1), RW / W);
      const rb = toPx(Math.max(x0, x1), Math.max(z0, z1), RW / W);
      rc.fillStyle = 'rgba(26,26,26,0.85)';
      rc.fillRect(ra[0], ra[1], rb[0] - ra[0], rb[1] - ra[1]);
    }
    const rr = D.rng(front ? 3101 : 3102);

    if (front) {
      // zebra bars across the front road
      let z0 = 4.62;
      for (let i = 0; i < 5; i++) {
        fill(2.25, 4.45, z0, z0 + 0.55, 0.9);
        z0 += 1.0;
      }
      // edge lines
      fill(-12.7, -7.3, 4.66, 4.78);
      fill(-4.1, 2.15, 4.66, 4.78);
      fill(-12.7, 2.15, 9.04, 9.16);
      fill(4.55, 8.5, 9.04, 9.16);
      // centre dashes
      for (let x = -12.6; x < 2.0; x += 3.4) {
        const x1 = Math.min(x + 1.6, 2.1);
        if (x1 - x > 0.3) fill(x, x1, 6.84, 6.96);
      }
    } else {
      // zebra bars across the side road
      let x0 = 5.05;
      for (let i = 0; i < 4; i++) {
        fill(x0, x0 + 0.5, 1.45, 3.55, 0.9);
        x0 += 0.9;
      }
      // edge lines
      fill(5.3, 5.42, -7.9, 1.35);
      fill(5.3, 5.42, 3.65, 4.1);
      fill(7.98, 8.1, -7.9, 1.35);
      fill(7.98, 8.1, 3.65, 9.4);
      // centre dashes
      for (let z = -7.8; z < 0.8; z += 3.4) {
        const z1 = Math.min(z + 1.6, 1.3);
        if (z1 - z > 0.3) fill(6.64, 6.76, z, z1);
      }
      // stop line
      fill(6.78, 8.04, 0.95, 1.35);
      // tomare painted for the southbound lane (reads from the north)
      const c = toPx(7.4, -1.4, 1);
      mc.save();
      mc.translate(c[0], c[1]);
      mc.rotate(Math.PI);
      mc.fillStyle = 'rgba(228,233,240,0.9)';
      mc.textAlign = 'center';
      mc.textBaseline = 'middle';
      mc.font = '900 88px "Yu Gothic","Meiryo","MS Gothic",sans-serif';
      mc.fillText('\u6b62', 0, 84);
      mc.fillText('\u307e', 0, 0);
      mc.fillText('\u308c', 0, -84);
      mc.restore();
    }

    // worn patches in the paint
    mc.save();
    mc.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 320; i++) {
      mc.fillStyle = 'rgba(0,0,0,' + (0.12 + rr() * 0.5) + ')';
      mc.fillRect(rr() * W, rr() * H, 1 + rr() * 3.4, 1 + rr() * 2.2);
    }
    mc.restore();
    mapTex.needsUpdate = true;
    roughTex.needsUpdate = true;
  }

  /* =====================================================================
     build
     ===================================================================== */
  D.buildStreet = function (layer, baseLayer) {
    /* ------------------------------------------------------------------
       1. collectible plinth - top surface exactly at y = 0, 26 x 26
       ------------------------------------------------------------------ */
    const topMat = D.standard(0x2a2836, {
      roughness: 0.26,
      metalness: 0.28,
      envMapIntensity: 1.3,
    });
    const brassMat = D.standard(0x9a7b45, {
      roughness: 0.24,
      metalness: 0.85,
      envMapIntensity: 1.7,
      emissive: 0x160f04,
      emissiveIntensity: 1,
    });
    const bodyMat = D.standard(0x201e2c, {
      roughness: 0.32,
      metalness: 0.2,
      envMapIntensity: 1.15,
    });
    const footMat = D.standard(0x14131e, {
      roughness: 0.42,
      metalness: 0.16,
      envMapIntensity: 0.9,
    });

    /* NOTE: D.geo.roundedSlab expands by bevelThickness on BOTH ends, so the
       geometry total height is (h + 2*bevel). Layers below are positioned so
       the top plate's top face lands exactly on y = 0 (base top). */
    const topPlate = D.mesh(D.geo.roundedSlab(25.9, 25.9, 0.12, 0.34, 0.035), topMat, {
      y: -0.095,
      cast: true,
      receive: true,
    });
    baseLayer.add(topPlate);

    const trimTop = D.mesh(D.geo.roundedSlab(25.8, 25.8, 0.035, 0.36, 0.03), brassMat, {
      y: -0.2375,
      cast: false,
      receive: false,
    });
    baseLayer.add(trimTop);

    const body = D.mesh(D.geo.roundedSlab(25.5, 25.5, 0.38, 0.46, 0.04), bodyMat, {
      y: -0.515,
      cast: true,
      receive: true,
    });
    baseLayer.add(body);

    const trimLow = D.mesh(D.geo.roundedSlab(25.56, 25.56, 0.024, 0.48, 0.026), brassMat, {
      y: -0.783,
      cast: false,
      receive: false,
    });
    baseLayer.add(trimLow);

    const foot = D.mesh(D.geo.roundedSlab(25.8, 25.8, 0.14, 0.5, 0.04), footMat, {
      y: -0.931,
      cast: true,
      receive: true,
    });
    baseLayer.add(foot);

    const footCap = D.mesh(D.geo.roundedSlab(25.3, 25.3, 0.025, 0.44, 0.025), bodyMat, {
      y: -1.0785,
      cast: false,
      receive: false,
    });
    baseLayer.add(footCap);

    // engraved name plaque on the front (south) face of the plinth
    const plaqueTex = makePlaque();
    const plaqueMat = D.standard(0xffffff, {
      map: plaqueTex,
      roughness: 0.34,
      metalness: 0.7,
      envMapIntensity: 1.1,
    });
    const plaque = D.plane(layer, 4.8, 0.36, plaqueMat, {
      x: 0,
      y: -0.455,
      z: 12.83,
      cast: false,
      receive: false,
    });
    noOut(plaque);

    /* ------------------------------------------------------------------
       2. material set
       ------------------------------------------------------------------ */
    const asphaltFront = makeAsphalt(1024, 256, 101, {
      base: '#2f3648',
      tracksV: [
        { v: 0.265 - 0.139, w: 30, a: 0.2 },
        { v: 0.265 + 0.139, w: 30, a: 0.2 },
        { v: 0.735 - 0.139, w: 30, a: 0.2 },
        { v: 0.735 + 0.139, w: 30, a: 0.2 },
      ],
      oil: 5,
      patches: [
        { u: 0.3, v: 0.55, w: 0.12, h: 0.16 },
        { u: 0.72, v: 0.36, w: 0.08, h: 0.2 },
      ],
    });
    const asphaltSide = makeAsphalt(256, 1024, 202, {
      base: '#2e3546',
      tracksU: [
        { u: 0.25 - 0.14, w: 12, a: 0.18 },
        { u: 0.25 + 0.14, w: 12, a: 0.18 },
        { u: 0.75 - 0.14, w: 12, a: 0.18 },
        { u: 0.75 + 0.14, w: 12, a: 0.18 },
      ],
      oil: 4,
      patches: [{ u: 0.5, v: 0.42, w: 0.3, h: 0.06 }],
    });
    const forecourt = makeAsphalt(1024, 256, 303, {
      base: '#2a3141',
      tracksV: [
        { v: 0.2, w: 22, a: 0.12 },
        { v: 0.62, w: 26, a: 0.1 },
      ],
      bays: [
        { u0: 0.27, u1: 0.35, v0: 0.2, v1: 0.9 },
        { u0: 0.37, u1: 0.45, v0: 0.2, v1: 0.9 },
        { u0: 0.47, u1: 0.55, v0: 0.2, v1: 0.9 },
      ],
      oil: 7,
      patches: [{ u: 0.62, v: 0.5, w: 0.16, h: 0.3 }],
    });
    const paving = makePaving(512, 404);
    const earth = makeEarth(256, 505);
    bakeRoadMarks(asphaltFront.map, asphaltFront.rough, 'front');
    bakeRoadMarks(asphaltSide.map, asphaltSide.rough, 'side');
    const gutterTex = makeGutter();
    const grateTex = makeGrate();
    const manholeTex = makeManhole();
    const tactileTex = makeTactile();

    const roadFrontMat = D.standard(0xffffff, {
      map: asphaltFront.map,
      roughnessMap: asphaltFront.rough,
      roughness: 1.0,
      metalness: 0.12,
      envMapIntensity: 2.4,
    });
    const roadSideMat = D.standard(0xffffff, {
      map: asphaltSide.map,
      roughnessMap: asphaltSide.rough,
      roughness: 1.0,
      metalness: 0.12,
      envMapIntensity: 2.4,
    });
    const forecourtMat = D.standard(0xffffff, {
      map: forecourt.map,
      roughnessMap: forecourt.rough,
      roughness: 1.0,
      metalness: 0.1,
      envMapIntensity: 1.7,
    });
    const pavingMat = D.standard(0xffffff, {
      map: paving.map,
      roughnessMap: paving.rough,
      roughness: 1.0,
      metalness: 0.07,
      envMapIntensity: 0.85,
    });
    const alleyMat = D.standard(0xdfe2e8, {
      map: paving.map,
      roughnessMap: paving.rough,
      roughness: 1.0,
      metalness: 0.07,
      envMapIntensity: 0.7,
    });
    const earthMat = D.standard(0xffffff, { map: earth, roughness: 0.62, metalness: 0.03, envMapIntensity: 0.5 });
    const darkBaseMat = D.standard(0x14131d, { roughness: 0.52, metalness: 0.05, envMapIntensity: 0.4 });
    const curbMat = D.standard(0xa9adb6, { roughness: 0.36, metalness: 0.06, envMapIntensity: 1.0 });
    const rampMat = D.standard(0x8f939c, { roughness: 0.4, metalness: 0.05, envMapIntensity: 0.8 });
    const gutterMat = D.standard(0xffffff, { map: gutterTex, roughness: 0.32, metalness: 0.35, envMapIntensity: 1.1 });
    const grateMat = D.standard(0xffffff, { map: grateTex, roughness: 0.34, metalness: 0.62, envMapIntensity: 1.2 });
    const manholeMat = D.standard(0xffffff, { map: manholeTex, roughness: 0.3, metalness: 0.55, envMapIntensity: 1.15 });
    const paintMat = D.standard(0xd8dde5, { roughness: 0.24, metalness: 0.06, envMapIntensity: 1.5 });
    const tactileMat = D.standard(0xffffff, {
      map: tactileTex,
      roughness: 0.44,
      metalness: 0.04,
      envMapIntensity: 0.8,
      emissive: 0x1d1302,
      emissiveIntensity: 1,
    });
    const numberMat = D.standard(0xffffff, {
      map: makeNumber(1),
      transparent: true,
      roughness: 0.3,
      metalness: 0.04,
      envMapIntensity: 1.1,
      depthWrite: false,
    });
    const pMat = D.standard(0xffffff, {
      map: makeLetterP(),
      transparent: true,
      roughness: 0.3,
      metalness: 0.04,
      envMapIntensity: 1.1,
      depthWrite: false,
    });
    const puddleMat = new T.MeshPhysicalMaterial({
      color: 0x2c3a52,
      roughness: 0.02,
      metalness: 0.05,
      clearcoat: 1,
      clearcoatRoughness: 0.02,
      envMapIntensity: 4.2,
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
      emissive: 0x060b14,
      emissiveIntensity: 1,
    });

    /* ------------------------------------------------------------------
       3. plinth-top ground under everything (fills every gap)
       ------------------------------------------------------------------ */
    block(layer, -EDGE, EDGE, -EDGE, EDGE, -0.03, 0.012, darkBaseMat, { cast: false, noOutline: true });
    flatUV(layer, 2 * EDGE, 2 * EDGE, 1.5, earthMat, 0, 0.013, 0, 1.5);

    /* ------------------------------------------------------------------
       4. road surfaces
       ------------------------------------------------------------------ */
    const rfW = ROAD_F.x1 - ROAD_F.x0;
    const rfD = ROAD_F.z1 - ROAD_F.z0;
    flat(layer, rfW, rfD, roadFrontMat, (ROAD_F.x0 + ROAD_F.x1) / 2, Y.ROAD, (ROAD_F.z0 + ROAD_F.z1) / 2);
    const rsW = ROAD_S.x1 - ROAD_S.x0;
    const rsD = ROAD_S.z1 - ROAD_S.z0;
    flat(layer, rsW, rsD, roadSideMat, (ROAD_S.x0 + ROAD_S.x1) / 2, Y.ROAD + 0.0004, (ROAD_S.z0 + ROAD_S.z1) / 2);

    /* ------------------------------------------------------------------
       5. pavement slabs (box body + world-tiled top surface)
       ------------------------------------------------------------------ */
    function walkSlab(x0, x1, z0, z1, h, topMat, sideMat, tile) {
      const w = x1 - x0;
      const d = z1 - z0;
      block(layer, x0, x1, z0, z1, -0.02, h, sideMat || curbMat, { cast: false, noOutline: true });
      flatUV(layer, w, d, tile || 2, topMat, (x0 + x1) / 2, h + 0.002, (z0 + z1) / 2);
    }

    walkSlab(WALK.forecourt.x0, WALK.forecourt.x1, WALK.forecourt.z0, WALK.forecourt.z1, Y.WALK, forecourtMat, curbMat);
    walkSlab(WALK.east.x0, WALK.east.x1, WALK.east.z0, WALK.east.z1, Y.WALK, pavingMat, curbMat);
    walkSlab(WALK.far.x0, WALK.far.x1, WALK.far.z0, WALK.far.z1, Y.WALK, pavingMat, curbMat);
    walkSlab(WALK.front.x0, WALK.front.x1, WALK.front.z0, WALK.front.z1, Y.WALK, pavingMat, curbMat);
    walkSlab(WALK.corner.x0, WALK.corner.x1, WALK.corner.z0, WALK.corner.z1, Y.WALK, pavingMat, curbMat);

    // alley floor (concrete)
    walkSlab(ALLEY.x0, ALLEY.x1, ALLEY.z0, ALLEY.z1, Y.WALK, alleyMat, curbMat);

    // softer surfaces: back yard, left service strip, far plot, back plot
    walkSlab(YARD.back.x0, YARD.back.x1, YARD.back.z0, YARD.back.z1, 0.1, earthMat, darkBaseMat, 1.5);
    walkSlab(YARD.left.x0, YARD.left.x1, YARD.left.z0, YARD.left.z1, 0.1, earthMat, darkBaseMat, 1.5);
    walkSlab(YARD.farPlot.x0, YARD.farPlot.x1, YARD.farPlot.z0, YARD.farPlot.z1, 0.12, pavingMat, curbMat);
    walkSlab(YARD.backPlot.x0, YARD.backPlot.x1, YARD.backPlot.z0, YARD.backPlot.z1, 0.06, earthMat, darkBaseMat, 1.5);

    // low concrete edge where the yard steps down from the walks
    block(layer, -9.0, -6.8, -6.72, -6.58, 0.09, 0.16, curbMat, { cast: false });
    block(layer, 1.4, 4.8, -6.72, -6.58, 0.09, 0.16, curbMat, { cast: false });
    block(layer, 4.72, 4.88, -8.8, -6.6, -0.02, 0.16, curbMat, { cast: false });

    /* ------------------------------------------------------------------
       6. curbs - sit on the road side of every pavement edge
       ------------------------------------------------------------------ */
    const CURB_Y0 = -0.02;
    // north edge of front road (forecourt side)
    block(layer, -EDGE, DRIVE.x0, 4.2, 4.36, CURB_Y0, Y.CURB, curbMat);
    block(layer, DRIVE.x1, XW_F.x0, 4.2, 4.36, CURB_Y0, Y.CURB, curbMat);
    block(layer, XW_F.x1, 4.8, 4.2, 4.36, CURB_Y0, Y.CURB, curbMat);
    // south edge of front road (front walk side)
    block(layer, -EDGE, XW_F.x0, 9.44, 9.6, CURB_Y0, Y.CURB, curbMat);
    block(layer, XW_F.x1, 8.6, 9.44, 9.6, CURB_Y0, Y.CURB, curbMat);
    // west edge of side road (forecourt / east walk side)
    block(layer, 4.8, 4.96, -8.0, XW_S.z0, CURB_Y0, Y.CURB, curbMat);
    block(layer, 4.8, 4.96, XW_S.z1, 4.2, CURB_Y0, Y.CURB, curbMat);
    // east edge of side road (far walk / corner apron)
    block(layer, 8.44, 8.6, -8.0, XW_S.z0, CURB_Y0, Y.CURB, curbMat);
    block(layer, 8.44, 8.6, XW_S.z1, 9.6, CURB_Y0, Y.CURB, curbMat);

    /* curb cuts / ramps */
    // front crossing, north end (pavement 0.152 -> road 0.021)
    ramp(layer, (XW_F.x0 + XW_F.x1) / 2, 4.62, XW_F.x1 - XW_F.x0, 0.42, Y.WALK + 0.002 - 0.021, 'z', -1, 0.021, rampMat);
    // front crossing, south end
    ramp(layer, (XW_F.x0 + XW_F.x1) / 2, 9.18, XW_F.x1 - XW_F.x0, 0.42, Y.WALK + 0.002 - 0.021, 'z', 1, 0.021, rampMat);
    // side crossing, west end
    ramp(layer, 5.22, (XW_S.z0 + XW_S.z1) / 2, XW_S.z1 - XW_S.z0, 0.42, Y.WALK + 0.002 - 0.021, 'x', -1, 0.021, rampMat);
    // side crossing, east end
    ramp(layer, 8.18, (XW_S.z0 + XW_S.z1) / 2, XW_S.z1 - XW_S.z0, 0.42, Y.WALK + 0.002 - 0.021, 'x', 1, 0.021, rampMat);
    // forecourt driveway
    ramp(layer, (DRIVE.x0 + DRIVE.x1) / 2, 4.9, DRIVE.x1 - DRIVE.x0, 0.7, Y.WALK + 0.002 - 0.021, 'z', -1, 0.021, rampMat);

    /* ------------------------------------------------------------------
       7. gutter channels + metal grates
       ------------------------------------------------------------------ */
    const GUT_Y = Y.ROAD + 0.0035;
    function gutterX(x0, x1, zc) {
      const w = x1 - x0;
      const geo = new T.PlaneGeometry(w, 0.26);
      const uv = geo.attributes.uv;
      for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * (w / 2), uv.getY(i));
      const m = new T.Mesh(geo, gutterMat);
      m.rotation.x = -Math.PI / 2;
      m.position.set((x0 + x1) / 2, GUT_Y, zc);
      m.castShadow = false;
      m.receiveShadow = true;
      layer.add(m);
      noOut(m);
    }
    function gutterZ(z0, z1, xc) {
      const len = z1 - z0;
      const geo = new T.PlaneGeometry(len, 0.26);
      const uv = geo.attributes.uv;
      for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * (len / 2), uv.getY(i));
      const m = new T.Mesh(geo, gutterMat);
      m.rotation.x = -Math.PI / 2;
      m.rotation.z = Math.PI / 2;
      m.position.set(xc, GUT_Y, (z0 + z1) / 2);
      m.castShadow = false;
      m.receiveShadow = true;
      layer.add(m);
      noOut(m);
    }
    gutterX(-EDGE, DRIVE.x0, 4.49);        // north gutter, west of drive
    gutterX(DRIVE.x1, XW_F.x0, 4.49);      // north gutter, between drive & crossing
    gutterX(-EDGE, XW_F.x0, 9.31);         // south gutter, west of crossing
    gutterX(XW_F.x1, 8.6, 9.31);           // south gutter, east of crossing
    gutterZ(-8.0, XW_S.z0, 5.09);          // west gutter, north of crossing
    gutterZ(XW_S.z1, 4.2, 5.09);           // west gutter, south of crossing
    gutterZ(-8.0, XW_S.z0, 8.31);          // east gutter, north of crossing
    gutterZ(XW_S.z1, 9.6, 8.31);           // east gutter, south of crossing

    const grateGeo = new T.PlaneGeometry(0.62, 0.24);
    function grate(x, z, vertical) {
      const m = new T.Mesh(grateGeo, grateMat);
      m.rotation.x = -Math.PI / 2;
      if (vertical) m.rotation.z = Math.PI / 2;
      m.position.set(x, GUT_Y + 0.0032, z);
      m.castShadow = false;
      m.receiveShadow = true;
      layer.add(m);
      noOut(m);
    }
    // north gutter grates
    grate(-11.6, 4.49, false);
    grate(-9.2, 4.49, false);
    grate(-3.2, 4.49, false);
    grate(0.6, 4.49, false);
    // south gutter grates
    grate(-11.4, 9.31, false);
    grate(-7.9, 9.31, false);
    grate(-4.4, 9.31, false);
    grate(-0.9, 9.31, false);
    grate(6.4, 9.31, false);
    // west gutter grates
    grate(5.09, -6.2, true);
    grate(5.09, -2.6, true);
    // east gutter grates
    grate(8.31, -6.6, true);
    grate(8.31, -2.8, true);
    grate(8.31, 5.2, true);
    grate(8.31, 8.0, true);

    /* ------------------------------------------------------------------
       8. manholes
       ------------------------------------------------------------------ */
    function manhole(x, z) {
      const rimMat = D.standard(0x40454f, { roughness: 0.42, metalness: 0.5, envMapIntensity: 0.9 });
      const g = new T.CylinderGeometry(0.34, 0.36, 0.022, 26, 1);
      const m = new T.Mesh(g, [rimMat, manholeMat, rimMat]);
      m.position.set(x, Y.ROAD + 0.016, z);
      m.castShadow = false;
      m.receiveShadow = true;
      layer.add(m);
      noOut(m);
      return m;
    }
    manhole(-5.3, 7.7);
    manhole(6.55, 6.3);
    manhole(6.6, -3.1);

    /* ------------------------------------------------------------------
       9. painted markings
       ------------------------------------------------------------------ */
    const MARK = Y.MARK;
    function paint(x0, x1, z0, z1, y, mat) {
      return rect(layer, x0, x1, z0, z1, y || MARK, mat || paintMat);
    }

    // Road paint (zebra crossings, edge + centre lines, stop line, tomare)
    // is baked into the wet asphalt maps in bakeRoadMarks() so it stays
    // perfectly flush with the road and shares its reflective sheen.

    /* ------------------------------------------------------------------
       10. forecourt: entrance plaza, parking bays, wheel stops, numbers
       ------------------------------------------------------------------ */
    // light concrete pedestrian plaza (from store door to the front crossing)
    flatUV(layer, 2.1, 2.3, 2, pavingMat, 1.25, Y.WALK + 0.006, 1.75);
    flatUV(layer, 4.3, 1.3, 2, pavingMat, 2.35, Y.WALK + 0.006, 3.55);
    // driveway apron concrete
    flatUV(layer, 3.0, 1.3, 2, pavingMat, (DRIVE.x0 + DRIVE.x1) / 2, Y.WALK + 0.006, 3.55);

    // parking bay lines (3 bays west of the entrance plaza)
    const BAYS = [-6.9, -4.9, -2.9, -0.9];
    for (let i = 0; i < BAYS.length; i++) paint(BAYS[i] - 0.05, BAYS[i] + 0.05, 0.85, 3.0, 0.158);
    // wheel stops near the store front
    for (let i = 0; i < 3; i++) {
      const bx = (BAYS[i] + BAYS[i + 1]) / 2;
      block(layer, bx - 0.42, bx + 0.42, 1.13, 1.31, Y.WALK + 0.002, Y.WALK + 0.15, curbMat, { cast: true });
    }
    // bay numbers
    const numTex = [makeNumber(1), makeNumber(2), makeNumber(3)];
    for (let i = 0; i < 3; i++) {
      const bx = (BAYS[i] + BAYS[i + 1]) / 2;
      const mat = numberMat.clone();
      mat.map = numTex[i];
      mat.needsUpdate = true;
      const m = D.plane(layer, 0.5, 0.62, mat, {
        x: bx,
        y: 0.159,
        z: 2.55,
        rx: -Math.PI / 2,
        cast: false,
        receive: false,
        renderOrder: 2,
      });
      noOut(m);
    }
    // painted P by the forecourt entrance
    const pSign = D.plane(layer, 1.1, 1.4, pMat, {
      x: -8.9,
      y: 0.158,
      z: 3.5,
      rx: -Math.PI / 2,
      cast: false,
      receive: false,
      renderOrder: 2,
    });
    noOut(pSign);

    /* ------------------------------------------------------------------
       11. tactile paving at the four crossing ramps
       ------------------------------------------------------------------ */
    flatUV(layer, XW_F.x1 - XW_F.x0, 0.56, 0.3, tactileMat, (XW_F.x0 + XW_F.x1) / 2, Y.WALK + 0.008, 3.86);
    flatUV(layer, XW_F.x1 - XW_F.x0, 0.56, 0.3, tactileMat, (XW_F.x0 + XW_F.x1) / 2, Y.WALK + 0.008, 9.94);
    flatUV(layer, 0.56, XW_S.z1 - XW_S.z0, 0.3, tactileMat, 4.46, Y.WALK + 0.008, (XW_S.z0 + XW_S.z1) / 2);
    flatUV(layer, 0.56, XW_S.z1 - XW_S.z0, 0.3, tactileMat, 8.94, Y.WALK + 0.008, (XW_S.z0 + XW_S.z1) / 2);

    /* ------------------------------------------------------------------
       12. alley drainage
       ------------------------------------------------------------------ */
    // shallow channel along the alley
    flatUV(layer, 0.24, 5.4, 2, gutterMat, -7.9, Y.WALK + 0.0025, -3.0);
    const alleyGrateGeo = new T.PlaneGeometry(0.6, 0.24);
    for (const gz of [-4.6, -1.4]) {
      const m = new T.Mesh(alleyGrateGeo, grateMat);
      m.rotation.x = -Math.PI / 2;
      m.rotation.z = Math.PI / 2;
      m.position.set(-7.9, Y.WALK + 0.004, gz);
      m.castShadow = false;
      m.receiveShadow = true;
      layer.add(m);
      noOut(m);
    }
    // wide grate across the alley mouth
    const mouthGrate = new T.Mesh(new T.PlaneGeometry(1.7, 0.26), grateMat);
    mouthGrate.rotation.x = -Math.PI / 2;
    mouthGrate.position.set(-7.9, Y.WALK + 0.004, 0.5);
    mouthGrate.castShadow = false;
    mouthGrate.receiveShadow = true;
    layer.add(mouthGrate);
    noOut(mouthGrate);

    /* ------------------------------------------------------------------
       13. puddles - physically wet, mirror-dark discs
       ------------------------------------------------------------------ */
    function puddle(x, z, r, seed, y, squash) {
      const rr = D.rng(seed);
      const pts = 13;
      const shape = new T.Shape();
      for (let i = 0; i < pts; i++) {
        const a = (i / pts) * Math.PI * 2;
        const rad = r * (0.62 + rr() * 0.62);
        const px = Math.cos(a) * rad;
        const py = Math.sin(a) * rad * (squash || 1);
        if (i === 0) shape.moveTo(px, py);
        else shape.lineTo(px, py);
      }
      shape.closePath();
      const geo = new T.ShapeGeometry(shape);
      const m = new T.Mesh(geo, puddleMat);
      m.rotation.x = -Math.PI / 2;
      m.rotation.z = rr() * 6.2832;
      m.position.set(x, y, z);
      m.castShadow = false;
      m.receiveShadow = false;
      m.renderOrder = 1;
      layer.add(m);
      noOut(m);
      return m;
    }

    // roads
    puddle(-9.4, 5.7, 1.15, 1, 0.0345, 0.8);
    puddle(-1.4, 8.4, 0.85, 2, 0.0345, 0.7);
    puddle(5.2, 7.9, 0.9, 3, 0.0345, 0.9);
    puddle(6.9, -4.4, 1.0, 4, 0.0345, 0.85);
    puddle(7.5, 0.3, 0.65, 5, 0.0345, 0.75);
    puddle(-11.6, 6.4, 0.8, 6, 0.0345, 0.7);
    // pavements
    puddle(-4.6, 3.5, 0.8, 7, Y.WALK + 0.013, 0.8);
    puddle(3.0, -3.6, 0.85, 9, Y.WALK + 0.013, 0.9);
    puddle(3.9, -5.4, 0.55, 10, Y.WALK + 0.013, 1);
    puddle(-6.0, 11.3, 1.15, 11, Y.WALK + 0.013, 0.7);
    puddle(5.4, 10.7, 0.7, 12, Y.WALK + 0.013, 0.8);
    puddle(9.4, 2.9, 0.65, 13, Y.WALK + 0.013, 0.9);
    puddle(10.4, 6.6, 0.9, 14, Y.WALK + 0.013, 0.8);
    puddle(-1.2, -7.6, 0.75, 16, 0.113, 0.9);

    /* ------------------------------------------------------------------
       14. wet neon reflection sheen (neutral areas only)
       ------------------------------------------------------------------ */
    const glows = [
      { x: 7.9, z: 1.4, w: 1.8, l: 6.4, color: 0xbfd9ff, opacity: 0.2, y: 0.0245 },
      { x: 8.0, z: -2.1, w: 1.1, l: 4.6, color: 0xff5b9d, opacity: 0.16, y: 0.0245 },
      { x: 3.25, z: 7.2, w: 2.5, l: 4.6, color: 0xa9c6ff, opacity: 0.12, y: 0.0345 },
      { x: -10.1, z: 6.5, w: 1.7, l: 3.8, color: 0xffa562, opacity: 0.11, y: 0.0245 },
      { x: -6.2, z: 11.2, w: 3.0, l: 3.4, color: 0xffc681, opacity: 0.14, y: 0.1555 },
      { x: 3.4, z: 2.5, w: 1.4, l: 3.8, color: 0x6ce9ff, opacity: 0.09, y: 0.1555 },
      { x: -2.0, z: 6.9, w: 17.0, l: 4.0, color: 0xb9c9ef, opacity: 0.07, y: 0.0232 },
      { x: 6.7, z: 0.6, w: 3.2, l: 10.0, color: 0xc6dcff, opacity: 0.06, y: 0.0232 },
      { x: 0.6, z: 2.0, w: 9.0, l: 3.0, color: 0xc9d8f2, opacity: 0.06, y: 0.1555 },
    ];
    for (let i = 0; i < glows.length; i++) {
      D.floorGlow(layer, glows[i]);
    }
    D.lightPool(layer, { x: 8.9, z: 0.9, w: 3.4, l: 3.4, color: 0xcfe3ff, opacity: 0.2, y: 0.1555 });
    D.lightPool(layer, { x: 9.4, z: -1.6, w: 2.6, l: 2.6, color: 0xff5b9d, opacity: 0.12, y: 0.1555 });

    // faint mirror sheen across both crossings (reads as wet reflective paint)
    const crossGlow = [
      { x: 3.35, z: 6.9, w: 2.2, l: 5.2, color: 0xdbe6ff, opacity: 0.09, y: 0.0335 },
      { x: 6.7, z: 2.5, w: 2.0, l: 3.4, color: 0xdbe6ff, opacity: 0.08, y: 0.0335 },
    ];
    for (let i = 0; i < crossGlow.length; i++) D.floorGlow(layer, crossGlow[i]);

    /* ------------------------------------------------------------------
       15. small ground details
       ------------------------------------------------------------------ */
    // painted utility covers on the far walk / front walk
    const utilityMat = D.standard(0x30343d, { roughness: 0.35, metalness: 0.55, envMapIntensity: 1.0 });
    const u1 = D.plane(layer, 0.56, 0.56, utilityMat, {
      x: 9.6,
      y: Y.WALK + 0.005,
      z: -1.7,
      rx: -Math.PI / 2,
      cast: false,
      receive: true,
    });
    noOut(u1);
    const u2 = D.plane(layer, 0.5, 0.5, utilityMat, {
      x: -8.4,
      y: Y.WALK + 0.005,
      z: 11.4,
      rx: -Math.PI / 2,
      cast: false,
      receive: true,
    });
    noOut(u2);

    // a couple of manhole-style covers in the back yard
    block(layer, 3.7, 4.15, -8.2, -7.75, 0.1, 0.105, utilityMat, { cast: false });

    // narrow white gutter line along the front-walk edge (subtle)
    paint(-12.7, 8.5, 9.72, 9.8, 0.1555);
  };
})();
