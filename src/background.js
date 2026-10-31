/* =========================================================
   星降マート — neighbourhood / background builder
   Old cafe "喫茶 月灯" (left), the alley, the far-side row of
   narrow buildings, back houses, foreground wall / hedge /
   trees and the left service strip.  Everything procedural.
   Owned by bg-builder.  No external assets.
   ========================================================= */
(function () {
  'use strict';

  const D = window.DIORAMA;
  const T = THREE;
  const P = D.palette;
  const PI = Math.PI;
  const HP = Math.PI / 2;

  const TEX = {};
  const MAT = {};
  let inited = false;

  /* =========================================================
     tiny local utilities
     ========================================================= */
  const FONT = (size, weight) =>
    (weight || 700) + ' ' + size + 'px "Yu Gothic", "Meiryo", "MS Gothic", sans-serif';

  function grp(parent, x, y, z, ry) {
    const g = new T.Group();
    g.position.set(x || 0, y || 0, z || 0);
    if (ry) g.rotation.y = ry;
    parent.add(g);
    return g;
  }

  function facade(parent, x, y, z, ry) {
    const g = grp(parent, x, y, z, ry);
    g.userData.facade = true;
    return g;
  }

  function bx(parent, w, h, d, mat, o) {
    return D.box(parent, w, h, d, mat, o || {});
  }

  function flat(parent, w, h, d, mat, o) {
    const m = D.box(parent, w, h, d, mat, o || {});
    m.userData.noOutline = true;
    return m;
  }

  function triShape(w, rise) {
    const s = new T.Shape();
    s.moveTo(-w / 2, 0);
    s.lineTo(w / 2, 0);
    s.lineTo(0, rise);
    s.closePath();
    return s;
  }

  /* sagging overhead cable */
  function wire(parent, a, b, sag, color, opacity) {
    const pts = [];
    for (let i = 0; i <= 14; i++) {
      const t = i / 14;
      pts.push(
        new T.Vector3(
          a.x + (b.x - a.x) * t,
          a.y + (b.y - a.y) * t - sag * 4 * t * (1 - t),
          a.z + (b.z - a.z) * t
        )
      );
    }
    return D.line(parent, pts, color || 0x39415c, opacity === undefined ? 0.9 : opacity);
  }

  /* =========================================================
     procedural canvas textures
     ========================================================= */
  function makeTextures() {
    /* ---- plaster / concrete wall skins ---- */
    TEX.plaster = D.canvasTexture(256, 256, (ctx, w, h) => {
      ctx.fillStyle = '#cfc9d4';
      ctx.fillRect(0, 0, w, h);
      const rr = D.rng(11);
      for (let i = 0; i < 1500; i++) {
        const v = 185 + Math.floor(rr() * 46);
        ctx.fillStyle = 'rgba(' + v + ',' + v + ',' + (v + 6) + ',' + (0.05 + rr() * 0.1) + ')';
        ctx.fillRect(rr() * w, rr() * h, 1 + rr() * 3, 1 + rr() * 3);
      }
      for (let i = 0; i < 9; i++) {
        const x = rr() * w;
        const y = rr() * h * 0.8;
        const r = 10 + rr() * 32;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, 'rgba(74,68,84,0.17)');
        g.addColorStop(1, 'rgba(74,68,84,0)');
        ctx.fillStyle = g;
        ctx.fillRect(x - r, y - r, r * 2, r * 2);
      }
      for (let i = 0; i < 18; i++) {
        const x = rr() * w;
        const len = 24 + rr() * h;
        ctx.fillStyle = 'rgba(56,52,68,' + (0.04 + rr() * 0.1) + ')';
        ctx.fillRect(x, 0, 1 + rr() * 3, len);
      }
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      ctx.fillRect(0, h * 0.12, w, 2);
    }, { repeat: [2, 2] });

    TEX.concrete = D.canvasTexture(256, 256, (ctx, w, h) => {
      ctx.fillStyle = '#bdc0c8';
      ctx.fillRect(0, 0, w, h);
      const rr = D.rng(23);
      for (let i = 0; i < 1700; i++) {
        const v = 150 + Math.floor(rr() * 70);
        ctx.fillStyle = 'rgba(' + v + ',' + (v + 2) + ',' + (v + 6) + ',' + (0.08 + rr() * 0.14) + ')';
        ctx.fillRect(rr() * w, rr() * h, 1 + rr() * 2.5, 1 + rr() * 2.5);
      }
      for (let i = 0; i < 22; i++) {
        const x = rr() * w;
        const len = 20 + rr() * h;
        ctx.fillStyle = 'rgba(42,44,54,' + (0.05 + rr() * 0.13) + ')';
        ctx.fillRect(x, 0, 1 + rr() * 4, len);
      }
      // horizontal panel seams
      ctx.strokeStyle = 'rgba(56,58,68,0.35)';
      ctx.lineWidth = 2;
      for (let y = 64; y < h; y += 64) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      // moss / damp at the bottom
      const mg = ctx.createLinearGradient(0, h * 0.68, 0, h);
      mg.addColorStop(0, 'rgba(38,62,48,0)');
      mg.addColorStop(1, 'rgba(34,58,46,0.32)');
      ctx.fillStyle = mg;
      ctx.fillRect(0, h * 0.68, w, h * 0.32);
    }, { repeat: [2, 2] });

    TEX.concreteLong = D.canvasTexture(512, 256, (ctx, w, h) => {
      ctx.fillStyle = '#b4b7c0';
      ctx.fillRect(0, 0, w, h);
      const rr = D.rng(41);
      for (let i = 0; i < 2600; i++) {
        const v = 140 + Math.floor(rr() * 80);
        ctx.fillStyle = 'rgba(' + v + ',' + (v + 2) + ',' + (v + 6) + ',' + (0.06 + rr() * 0.12) + ')';
        ctx.fillRect(rr() * w, rr() * h, 1 + rr() * 3, 1 + rr() * 3);
      }
      // vertical joints every 96px
      ctx.strokeStyle = 'rgba(66,68,78,0.45)';
      ctx.lineWidth = 3;
      for (let x = 96; x < w; x += 96) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      // drips
      for (let i = 0; i < 40; i++) {
        const x = rr() * w;
        const len = 20 + rr() * h;
        ctx.fillStyle = 'rgba(40,44,54,' + (0.04 + rr() * 0.12) + ')';
        ctx.fillRect(x, 0, 1 + rr() * 3, len);
      }
      // cap band
      ctx.fillStyle = 'rgba(255,255,255,0.10)';
      ctx.fillRect(0, 6, w, 6);
    }, { repeat: [1, 1] });

    /* ---- dark weathered wood (vertical planks) ---- */
    TEX.wood = D.canvasTexture(256, 256, (ctx, w, h) => {
      ctx.fillStyle = '#71533d';
      ctx.fillRect(0, 0, w, h);
      const rr = D.rng(31);
      for (let x = 0; x < w; x += 42) {
        const v = rr();
        ctx.fillStyle = v > 0.5 ? 'rgba(255,220,180,0.05)' : 'rgba(20,10,6,0.10)';
        ctx.fillRect(x, 0, 42, h);
        ctx.fillStyle = 'rgba(22,12,8,0.6)';
        ctx.fillRect(x, 0, 2, h);
        // grain
        for (let i = 0; i < 5; i++) {
          ctx.strokeStyle = 'rgba(30,18,10,' + (0.12 + rr() * 0.15) + ')';
          ctx.lineWidth = 1;
          ctx.beginPath();
          const gx = x + 6 + rr() * 30;
          ctx.moveTo(gx, 0);
          for (let y = 0; y < h; y += 32) ctx.lineTo(gx + (rr() - 0.5) * 6, y);
          ctx.stroke();
        }
      }
      // knots
      for (let i = 0; i < 4; i++) {
        const x = rr() * w;
        const y = rr() * h;
        ctx.strokeStyle = 'rgba(24,13,7,0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(x, y, 5 + rr() * 5, 9 + rr() * 8, 0, 0, PI * 2);
        ctx.stroke();
      }
    }, { repeat: [2, 2] });

    TEX.woodDark = D.canvasTexture(256, 256, (ctx, w, h) => {
      ctx.fillStyle = '#4a3628';
      ctx.fillRect(0, 0, w, h);
      const rr = D.rng(37);
      for (let x = 0; x < w; x += 30) {
        ctx.fillStyle = 'rgba(14,8,5,0.55)';
        ctx.fillRect(x, 0, 2, h);
        ctx.strokeStyle = 'rgba(160,120,90,0.10)';
        ctx.beginPath();
        ctx.moveTo(x + 8, 0);
        ctx.lineTo(x + 8 + (rr() - 0.5) * 10, h);
        ctx.stroke();
      }
    }, { repeat: [3, 2] });

    /* ---- roof tiles ---- */
    function tileTex(base, hi, lo, seed) {
      return D.canvasTexture(256, 256, (ctx, w, h) => {
        ctx.fillStyle = base;
        ctx.fillRect(0, 0, w, h);
        const rr = D.rng(seed);
        const rowH = 26;
        for (let y = 0, row = 0; y < h; y += rowH, row++) {
          ctx.fillStyle = hi;
          ctx.fillRect(0, y + 2, w, 4);
          ctx.fillStyle = lo;
          ctx.fillRect(0, y + rowH - 6, w, 6);
          for (let x = (row % 2) * 16; x < w; x += 32) {
            ctx.fillStyle = lo;
            ctx.fillRect(x, y + 2, 2, rowH - 4);
            ctx.fillStyle = 'rgba(255,255,255,0.06)';
            ctx.fillRect(x + 4, y + 6, 10, 3);
          }
          // slanted light
          ctx.fillStyle = 'rgba(255,255,255,0.035)';
          ctx.fillRect(0, y + 8, w, 3);
        }
        for (let i = 0; i < 250; i++) {
          ctx.fillStyle = 'rgba(0,0,0,' + (0.03 + rr() * 0.08) + ')';
          ctx.fillRect(rr() * w, rr() * h, 1 + rr() * 3, 1 + rr() * 2);
        }
      }, { repeat: [2, 3] });
    }
    TEX.roofBlue = tileTex('#3d445c', '#525b78', '#252b3d', 51);
    TEX.roofBrown = tileTex('#4a363a', '#63484c', '#2b1e21', 53);
    TEX.roofDark = tileTex('#343a4c', '#474e63', '#1f2331', 55);

    /* ---- roller shutter ---- */
    TEX.shutter = D.canvasTexture(256, 256, (ctx, w, h) => {
      ctx.fillStyle = '#474e60';
      ctx.fillRect(0, 0, w, h);
      const rr = D.rng(61);
      for (let y = 0; y < h; y += 13) {
        ctx.fillStyle = '#5c657c';
        ctx.fillRect(0, y + 2, w, 3);
        ctx.fillStyle = '#2b303e';
        ctx.fillRect(0, y + 9, w, 4);
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        ctx.fillRect(0, y + 3, w, 1);
      }
      // grime streaks
      for (let i = 0; i < 14; i++) {
        const x = rr() * w;
        ctx.fillStyle = 'rgba(24,27,34,' + (0.06 + rr() * 0.16) + ')';
        ctx.fillRect(x, rr() * h * 0.4, 2 + rr() * 8, 40 + rr() * h);
      }
      // old stickers / tape
      ctx.fillStyle = 'rgba(214,205,180,0.55)';
      ctx.fillRect(24, 168, 38, 26);
      ctx.fillStyle = 'rgba(230,133,154,0.5)';
      ctx.fillRect(178, 196, 30, 20);
      ctx.fillStyle = 'rgba(20,22,28,0.5)';
      ctx.font = '700 11px "Segoe UI", sans-serif';
      ctx.fillText('P', 32, 185);
      // bottom shadow
      const g = ctx.createLinearGradient(0, h - 40, 0, h);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, 'rgba(0,0,0,0.45)');
      ctx.fillStyle = g;
      ctx.fillRect(0, h - 40, w, 40);
    }, { clamp: true });

    /* ---- AC front panel ---- */
    TEX.ac = D.canvasTexture(256, 256, (ctx, w, h) => {
      ctx.fillStyle = '#9aa3b5';
      ctx.fillRect(0, 0, w, h);
      const rr = D.rng(67);
      // louver half
      ctx.fillStyle = '#7d8799';
      ctx.fillRect(8, 10, 150, h - 20);
      for (let y = 16; y < h - 12; y += 12) {
        ctx.fillStyle = '#aab3c4';
        ctx.fillRect(12, y, 142, 3);
        ctx.fillStyle = '#586074';
        ctx.fillRect(12, y + 6, 142, 2);
      }
      // fan ring
      ctx.beginPath();
      ctx.arc(198, 128, 44, 0, PI * 2);
      ctx.fillStyle = '#2f3542';
      ctx.fill();
      ctx.lineWidth = 5;
      ctx.strokeStyle = '#b9c2d2';
      ctx.stroke();
      ctx.strokeStyle = '#6d7688';
      ctx.lineWidth = 3;
      for (let i = 0; i < 3; i++) {
        const a = i * 2.1 + 0.4;
        ctx.beginPath();
        ctx.moveTo(198, 128);
        ctx.lineTo(198 + Math.cos(a) * 34, 128 + Math.sin(a) * 34);
        ctx.stroke();
      }
      // bolts + label
      ctx.fillStyle = '#5b6376';
      for (const p of [[14, 14], [242, 14], [14, 242], [242, 242]]) ctx.fillRect(p[0] - 3, p[1] - 3, 6, 6);
      ctx.fillStyle = 'rgba(240,244,250,0.7)';
      ctx.fillRect(12, 224, 90, 14);
      ctx.fillStyle = 'rgba(30,34,42,0.8)';
      ctx.font = '700 10px "Segoe UI", sans-serif';
      ctx.fillText('HOSHIFURI', 16, 235);
      // grime
      for (let i = 0; i < 240; i++) {
        ctx.fillStyle = 'rgba(30,34,42,' + (0.02 + rr() * 0.05) + ')';
        ctx.fillRect(rr() * w, rr() * h, 1 + rr() * 2, 1 + rr() * 2);
      }
    }, { clamp: true });

    /* ---- warm curtained windows ---- */
    function warmWindowTex(seed, curtain, trim) {
      return D.canvasTexture(256, 320, (ctx, w, h) => {
        const g = ctx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, '#ffe2b0');
        g.addColorStop(0.44, '#ffc17c');
        g.addColorStop(1, '#b56e3c');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
        const rr = D.rng(seed);
        // warm bloom in the middle
        const rg = ctx.createRadialGradient(w / 2, h * 0.48, 8, w / 2, h * 0.5, w * 0.9);
        rg.addColorStop(0, 'rgba(255,248,220,0.85)');
        rg.addColorStop(1, 'rgba(255,200,120,0)');
        ctx.fillStyle = rg;
        ctx.fillRect(0, 0, w, h);
        // curtains: two side panels + folds
        ctx.fillStyle = curtain;
        ctx.fillRect(0, 0, 62, h);
        ctx.fillRect(w - 62, 0, 62, h);
        ctx.fillStyle = 'rgba(0,0,0,0.12)';
        for (let i = 0; i < 6; i++) {
          ctx.fillRect(8 + i * 9, 0, 3, h);
          ctx.fillRect(w - 14 - i * 9, 0, 3, h);
        }
        ctx.fillStyle = 'rgba(255,255,255,0.18)';
        for (let i = 0; i < 3; i++) {
          ctx.fillRect(24 + i * 12, 0, 2, h);
          ctx.fillRect(w - 28 - i * 12, 0, 2, h);
        }
        // valance
        ctx.fillStyle = 'rgba(60,32,24,0.55)';
        ctx.fillRect(0, 0, w, 20);
        // hanging pendant lamp silhouette
        ctx.strokeStyle = 'rgba(60,36,24,0.75)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(w / 2, 0);
        ctx.lineTo(w / 2, 54);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(w / 2, 40, 15, PI, PI * 2);
        ctx.fillStyle = 'rgba(255,246,214,0.95)';
        ctx.fill();
        ctx.fillStyle = 'rgba(80,46,26,0.7)';
        ctx.fillRect(w / 2 - 16, 54, 32, 5);
        // plant silhouette at the sill
        ctx.fillStyle = 'rgba(58,36,24,0.8)';
        ctx.beginPath();
        ctx.ellipse(w - 44, h - 26, 26, 24, 0, 0, PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(40,52,34,0.85)';
        for (let i = 0; i < 4; i++) {
          ctx.beginPath();
          ctx.ellipse(w - 60 + i * 12, h - 52 - rr() * 16, 7, 15, rr() - 0.5, 0, PI * 2);
          ctx.fill();
        }
        // glass reflection
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = 'rgba(200,220,255,0.06)';
        ctx.beginPath();
        ctx.moveTo(30, 0);
        ctx.lineTo(96, 0);
        ctx.lineTo(40, h);
        ctx.lineTo(0, h);
        ctx.fill();
        ctx.restore();
        // trim vignette
        ctx.strokeStyle = trim;
        ctx.lineWidth = 10;
        ctx.strokeRect(0, 0, w, h);
        // horizontal muntin hint
        ctx.fillStyle = 'rgba(38,26,20,0.4)';
        ctx.fillRect(0, h * 0.56, w, 5);
      }, { clamp: true });
    }
    TEX.warmWin = warmWindowTex(71, 'rgba(255,214,170,0.92)', 'rgba(30,20,16,0.55)');
    TEX.warmWin2 = warmWindowTex(73, 'rgba(255,182,168,0.9)', 'rgba(26,18,20,0.55)');

    /* ---- cool apartment window ---- */
    TEX.coolWin = D.canvasTexture(256, 256, (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#1a2b46');
      g.addColorStop(0.6, '#0e1728');
      g.addColorStop(1, '#070c16');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      // blinds
      ctx.fillStyle = 'rgba(120,160,210,0.13)';
      for (let y = 8; y < h; y += 15) ctx.fillRect(0, y, w, 4);
      // faint tv glow
      const rg = ctx.createRadialGradient(w * 0.68, h * 0.4, 4, w * 0.68, h * 0.4, 90);
      rg.addColorStop(0, 'rgba(110,220,255,0.20)');
      rg.addColorStop(1, 'rgba(110,220,255,0)');
      ctx.fillStyle = rg;
      ctx.fillRect(0, 0, w, h);
      // cat silhouette on sill
      ctx.fillStyle = 'rgba(6,10,16,0.9)';
      ctx.beginPath();
      ctx.ellipse(w * 0.32, h - 34, 20, 26, 0, 0, PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(w * 0.32, h - 62, 13, 0, PI * 2);
      ctx.fill();
      // ears
      ctx.beginPath();
      ctx.moveTo(w * 0.32 - 10, h - 70);
      ctx.lineTo(w * 0.32 - 15, h - 84);
      ctx.lineTo(w * 0.32 - 3, h - 74);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(w * 0.32 + 10, h - 70);
      ctx.lineTo(w * 0.32 + 15, h - 84);
      ctx.lineTo(w * 0.32 + 3, h - 74);
      ctx.fill();
      ctx.strokeStyle = 'rgba(26,20,18,0.4)';
      ctx.lineWidth = 8;
      ctx.strokeRect(0, 0, w, h);
    }, { clamp: true });

    /* ---- lit shoji screen ---- */
    TEX.shoji = D.canvasTexture(256, 256, (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#e8c68c');
      g.addColorStop(0.5, '#d3a96c');
      g.addColorStop(1, '#8f6a3e');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(48,32,20,0.85)';
      ctx.lineWidth = 6;
      for (let x = 0; x <= w; x += 42) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y <= h; y += 42) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(30,20,12,0.9)';
      ctx.lineWidth = 12;
      ctx.strokeRect(0, 0, w, h);
      // warm lamp glow
      const rg = ctx.createRadialGradient(w * 0.55, h * 0.52, 4, w * 0.55, h * 0.52, 120);
      rg.addColorStop(0, 'rgba(255,240,200,0.55)');
      rg.addColorStop(1, 'rgba(255,240,200,0)');
      ctx.fillStyle = rg;
      ctx.fillRect(0, 0, w, h);
    }, { clamp: true });

    /* ---- cafe vertical sign 喫茶 月灯 ---- */
    TEX.cafeSign = D.canvasTexture(192, 640, (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#3a2518');
      g.addColorStop(0.5, '#241611');
      g.addColorStop(1, '#120c09');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      const rg = ctx.createRadialGradient(w / 2, h * 0.45, 10, w / 2, h * 0.45, 240);
      rg.addColorStop(0, 'rgba(255,172,86,0.30)');
      rg.addColorStop(1, 'rgba(255,172,86,0)');
      ctx.fillStyle = rg;
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#8a6034';
      ctx.lineWidth = 6;
      D.roundRect(ctx, 10, 10, w - 20, h - 20, 14);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,208,140,0.25)';
      ctx.lineWidth = 2;
      D.roundRect(ctx, 20, 20, w - 40, h - 40, 10);
      ctx.stroke();
      // moon
      ctx.save();
      ctx.shadowColor = '#ffb45e';
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(w / 2, 70, 23, 0, PI * 2);
      ctx.fillStyle = '#ffe7bd';
      ctx.fill();
      ctx.restore();
      // vertical text
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffd9a1';
      ctx.font = FONT(42);
      ctx.fillText('喫', w / 2, 158);
      ctx.fillText('茶', w / 2, 206);
      ctx.save();
      ctx.shadowColor = '#ff9b4a';
      ctx.shadowBlur = 26;
      ctx.fillStyle = '#ffe6bb';
      ctx.font = FONT(86);
      ctx.fillText('月', w / 2, 322);
      ctx.fillText('灯', w / 2, 420);
      ctx.restore();
      // red seal
      ctx.fillStyle = 'rgba(150,36,30,0.92)';
      ctx.fillRect(w / 2 - 21, 486, 42, 42);
      ctx.fillStyle = '#f6e6cf';
      ctx.font = FONT(26);
      ctx.fillText('珈', w / 2, 508);
      ctx.fillStyle = '#c79a63';
      ctx.font = '700 15px "Segoe UI", sans-serif';
      ctx.fillText('C O F F E E', w / 2, 566);
      ctx.fillStyle = 'rgba(255,214,150,0.5)';
      ctx.fillRect(w / 2 - 34, 592, 68, 2);
    }, { clamp: true });

    /* ---- cafe horizontal fascia ---- */
    TEX.cafeHori = D.canvasTexture(512, 160, (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#33231a');
      g.addColorStop(0.55, '#20140f');
      g.addColorStop(1, '#120c09');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#8a6034';
      ctx.lineWidth = 5;
      D.roundRect(ctx, 8, 8, w - 16, h - 16, 8);
      ctx.stroke();
      ctx.save();
      ctx.shadowColor = '#ff9b4a';
      ctx.shadowBlur = 18;
      ctx.fillStyle = '#ffe6bb';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = FONT(66);
      ctx.fillText('喫茶  月灯', w / 2, h * 0.44);
      ctx.restore();
      ctx.fillStyle = '#c79a63';
      ctx.font = '700 19px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('C O F F E E   &   B A R', w / 2, h * 0.8);
    }, { clamp: true });

    /* ---- snack bar neon スナック星屑 ---- */
    TEX.snackSign = D.canvasTexture(224, 640, (ctx, w, h) => {
      ctx.fillStyle = '#0a0710';
      ctx.fillRect(0, 0, w, h);
      const rg = ctx.createRadialGradient(w / 2, h * 0.52, 6, w / 2, h * 0.52, 250);
      rg.addColorStop(0, 'rgba(255,70,150,0.18)');
      rg.addColorStop(1, 'rgba(255,70,150,0)');
      ctx.fillStyle = rg;
      ctx.fillRect(0, 0, w, h);
      ctx.save();
      ctx.shadowColor = '#ff2f86';
      ctx.shadowBlur = 16;
      ctx.strokeStyle = '#ff6fa8';
      ctx.lineWidth = 5;
      D.roundRect(ctx, 12, 12, w - 24, h - 24, 18);
      ctx.stroke();
      ctx.restore();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      // small vertical "スナック"
      ctx.save();
      ctx.shadowColor = '#ff5b9d';
      ctx.shadowBlur = 14;
      ctx.fillStyle = '#ffd0e0';
      ctx.font = FONT(34);
      ctx.fillText('ス', w / 2, 88);
      ctx.fillText('ナ', w / 2, 130);
      ctx.fillText('ッ', w / 2, 172);
      ctx.fillText('ク', w / 2, 214);
      ctx.restore();
      // stars
      ctx.fillStyle = 'rgba(255,180,215,0.85)';
      for (const s of [[52, 250], [176, 268], [60, 470], [170, 500], [46, 560], [178, 580]]) {
        ctx.beginPath();
        ctx.arc(s[0], s[1], 2.5, 0, PI * 2);
        ctx.fill();
      }
      // big 星屑
      ctx.save();
      ctx.shadowColor = '#ff2f86';
      ctx.shadowBlur = 32;
      ctx.fillStyle = '#ff9ec4';
      ctx.font = FONT(94);
      ctx.fillText('星', w / 2, 348);
      ctx.fillText('屑', w / 2, 458);
      ctx.restore();
      ctx.save();
      ctx.shadowColor = '#ff5b9d';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#ffd9e7';
      ctx.font = '700 20px "Segoe UI", sans-serif';
      ctx.fillText('S N A C K', w / 2, 556);
      ctx.restore();
    }, { clamp: true });

    /* ---- cyan cleaning shop sign ---- */
    TEX.cyanSign = D.canvasTexture(512, 176, (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#0b2028');
      g.addColorStop(0.5, '#07161d');
      g.addColorStop(1, '#041016');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      ctx.save();
      ctx.shadowColor = '#32c8e8';
      ctx.shadowBlur = 16;
      ctx.strokeStyle = '#6ce9ff';
      ctx.lineWidth = 5;
      D.roundRect(ctx, 9, 9, w - 18, h - 18, 10);
      ctx.stroke();
      ctx.restore();
      // snowflake mark
      ctx.save();
      ctx.translate(58, h / 2);
      ctx.strokeStyle = '#8ff2ff';
      ctx.lineWidth = 3;
      for (let i = 0; i < 6; i++) {
        ctx.rotate(PI / 3);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -22);
        ctx.stroke();
      }
      ctx.restore();
      ctx.save();
      ctx.shadowColor = '#3ad6f4';
      ctx.shadowBlur = 22;
      ctx.fillStyle = '#c8f8ff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = FONT(62);
      ctx.fillText('クリーニング', w / 2 + 26, h * 0.46);
      ctx.restore();
      ctx.fillStyle = '#6ce9ff';
      ctx.font = FONT(22);
      ctx.textAlign = 'center';
      ctx.fillText('月 白', w / 2 + 26, h * 0.82);
    }, { clamp: true });

    /* ---- cyan vertical blade sign ---- */
    TEX.cyanBlade = D.canvasTexture(192, 640, (ctx, w, h) => {
      ctx.fillStyle = '#06131a';
      ctx.fillRect(0, 0, w, h);
      const rg = ctx.createRadialGradient(w / 2, h * 0.46, 6, w / 2, h * 0.46, 250);
      rg.addColorStop(0, 'rgba(70,220,255,0.15)');
      rg.addColorStop(1, 'rgba(70,220,255,0)');
      ctx.fillStyle = rg;
      ctx.fillRect(0, 0, w, h);
      ctx.save();
      ctx.shadowColor = '#32c8e8';
      ctx.shadowBlur = 14;
      ctx.strokeStyle = '#6ce9ff';
      ctx.lineWidth = 5;
      D.roundRect(ctx, 10, 10, w - 20, h - 20, 14);
      ctx.stroke();
      ctx.restore();
      // snowflake
      ctx.save();
      ctx.translate(w / 2, 86);
      ctx.strokeStyle = '#a8f4ff';
      ctx.lineWidth = 4;
      for (let i = 0; i < 6; i++) {
        ctx.rotate(PI / 3);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -30);
        ctx.stroke();
      }
      ctx.restore();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.save();
      ctx.shadowColor = '#3ad6f4';
      ctx.shadowBlur = 24;
      ctx.fillStyle = '#c8f8ff';
      ctx.font = FONT(50);
      const t = 'クリーニング';
      for (let i = 0; i < t.length; i++) ctx.fillText(t[i], w / 2, 168 + i * 62);
      ctx.restore();
      ctx.save();
      ctx.shadowColor = '#32c8e8';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#9ef2ff';
      ctx.font = FONT(30);
      ctx.fillText('月白', w / 2, 596);
      ctx.restore();
    }, { clamp: true });

    /* ---- "closed today" plate ---- */
    TEX.closedPlate = D.canvasTexture(256, 128, (ctx, w, h) => {
      ctx.fillStyle = '#2b2426';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#8d4a44';
      ctx.lineWidth = 6;
      D.roundRect(ctx, 8, 8, w - 16, h - 16, 8);
      ctx.stroke();
      ctx.fillStyle = '#f2e6d2';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = FONT(52);
      ctx.fillText('本日休業', w / 2, h / 2);
    }, { clamp: true });

    /* ---- cafe chalk menu ---- */
    TEX.menu = D.canvasTexture(256, 320, (ctx, w, h) => {
      ctx.fillStyle = '#211d1a';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#6a5136';
      ctx.lineWidth = 10;
      ctx.strokeRect(5, 5, w - 10, h - 10);
      ctx.fillStyle = '#e8dbc0';
      ctx.textAlign = 'center';
      ctx.font = FONT(30);
      ctx.fillText('本日の珈琲', w / 2, 56);
      ctx.strokeStyle = 'rgba(232,219,192,0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(40, 76);
      ctx.lineTo(w - 40, 76);
      ctx.stroke();
      ctx.textAlign = 'left';
      ctx.font = FONT(23);
      ctx.fillStyle = '#d8c9ab';
      const rows = [['ブレンド', '400'], ['カフェオレ', '450'], ['ケーキ', '500']];
      for (let i = 0; i < rows.length; i++) {
        ctx.fillText(rows[i][0], 34, 130 + i * 46);
        ctx.textAlign = 'right';
        ctx.fillText(rows[i][1] + '円', w - 34, 130 + i * 46);
        ctx.textAlign = 'left';
      }
      ctx.fillStyle = 'rgba(255,190,120,0.6)';
      ctx.font = FONT(18);
      ctx.textAlign = 'center';
      ctx.fillText('月灯', w / 2, 290);
    }, { clamp: true });

    /* ---- colorful poster ---- */
    TEX.poster = D.canvasTexture(256, 384, (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, '#2a1836');
      g.addColorStop(0.5, '#4a1c3a');
      g.addColorStop(1, '#0d2030');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(255,150,200,0.7)';
      ctx.lineWidth = 3;
      ctx.strokeRect(10, 10, w - 20, h - 20);
      ctx.fillStyle = '#ff7fb4';
      ctx.beginPath();
      ctx.arc(w / 2, 120, 60, 0, PI * 2);
      ctx.fill();
      ctx.fillStyle = '#17202f';
      ctx.beginPath();
      ctx.arc(w / 2 + 16, 106, 50, 0, PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e9f6ff';
      for (let i = 0; i < 22; i++) {
        const rr = D.rng(i + 90);
        ctx.fillRect(rr() * w, rr() * h * 0.55, 2, 2);
      }
      ctx.fillStyle = '#ffe9c9';
      ctx.textAlign = 'center';
      ctx.font = FONT(34);
      ctx.fillText('星屑', w / 2, 250);
      ctx.font = '700 22px "Segoe UI", sans-serif';
      ctx.fillStyle = '#8ff2ff';
      ctx.fillText('LIVE', w / 2, 300);
      ctx.fillStyle = '#ffd0e0';
      ctx.font = FONT(16);
      ctx.fillText('毎週 金曜 20:00', w / 2, 336);
    }, { clamp: true });

    /* ---- building name plate ---- */
    TEX.namePlate = D.canvasTexture(256, 128, (ctx, w, h) => {
      ctx.fillStyle = '#1a1e26';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#6f7688';
      ctx.lineWidth = 4;
      ctx.strokeRect(4, 4, w - 8, h - 8);
      ctx.fillStyle = '#d9d2c0';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = FONT(44);
      ctx.fillText('月光荘', w / 2, h / 2);
    }, { clamp: true });

    /* ---- noren cloth panels ---- */
    function norenTex(text, moon, seed) {
      return D.canvasTexture(128, 256, (ctx, w, h) => {
        ctx.fillStyle = '#1b2a4b';
        ctx.fillRect(0, 0, w, h);
        const rr = D.rng(seed);
        for (let i = 0; i < 7; i++) {
          ctx.fillStyle = 'rgba(' + (i % 2 ? 255 : 0) + ',' + (i % 2 ? 255 : 0) + ',' + (i % 2 ? 255 : 0) + ',' + (i % 2 ? 0.025 : 0.05) + ')';
          ctx.fillRect(i * 18, 0, 9, h);
        }
        ctx.fillStyle = '#101b33';
        ctx.fillRect(0, 0, w, 16);
        ctx.fillRect(0, h - 18, w, 18);
        if (moon) {
          ctx.beginPath();
          ctx.arc(w / 2, 50, 21, 0, PI * 2);
          ctx.fillStyle = '#f1e8d6';
          ctx.fill();
          ctx.fillStyle = '#1b2a4b';
          ctx.beginPath();
          ctx.arc(w / 2 + 9, 44, 18, 0, PI * 2);
          ctx.fill();
        }
        const y0 = moon ? 100 : 76;
        for (let i = 0; i < text.length; i++) {
          ctx.fillStyle = '#f3ecdd';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.font = FONT(52);
          ctx.fillText(text[i], w / 2, y0 + i * 58);
        }
        // bottom grime
        ctx.fillStyle = 'rgba(6,10,18,0.3)';
        ctx.fillRect(0, h - 30, w, 12);
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        ctx.fillRect(0, 20, w, 2);
      }, { clamp: true });
    }
    TEX.noren0 = norenTex('喫', false, 81);
    TEX.noren1 = norenTex('茶', false, 82);
    TEX.noren2 = norenTex('月灯', true, 83);
    /* dark red bar noren */
    function barNorenTex(text, seed) {
      return D.canvasTexture(128, 256, (ctx, w, h) => {
        ctx.fillStyle = '#4a1b26';
        ctx.fillRect(0, 0, w, h);
        for (let i = 0; i < 7; i++) {
          ctx.fillStyle = 'rgba(' + (i % 2 ? 255 : 0) + ',' + (i % 2 ? 255 : 0) + ',' + (i % 2 ? 255 : 0) + ',' + (i % 2 ? 0.02 : 0.05) + ')';
          ctx.fillRect(i * 18, 0, 9, h);
        }
        ctx.fillStyle = '#2c0f17';
        ctx.fillRect(0, 0, w, 14);
        ctx.fillRect(0, h - 16, w, 16);
        ctx.fillStyle = '#f3dfd2';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = FONT(46);
        for (let i = 0; i < text.length; i++) ctx.fillText(text[i], w / 2, 80 + i * 56);
        ctx.fillStyle = '#d9a04e';
        ctx.fillRect(w / 2 - 18, 206, 36, 3);
        ctx.fillStyle = 'rgba(6,6,10,0.28)';
        ctx.fillRect(0, h - 26, w, 10);
      }, { clamp: true });
    }
    TEX.barNoren0 = barNorenTex('ス', 84);
    TEX.barNoren1 = barNorenTex('ナ', 85);
    TEX.barNoren2 = barNorenTex('ック', 86);

    /* ---- paper lantern wrap ---- */
    TEX.lantern = D.canvasTexture(256, 256, (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#ffd9a0');
      g.addColorStop(0.5, '#ffe9c2');
      g.addColorStop(1, '#e7ae68');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      // bamboo ribs
      ctx.strokeStyle = 'rgba(150,86,40,0.45)';
      ctx.lineWidth = 2;
      for (let y = 12; y < h; y += 22) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      // red bands
      ctx.fillStyle = '#b23a2e';
      ctx.fillRect(0, 8, w, 14);
      ctx.fillRect(0, h - 22, w, 14);
      // text (wrap around)
      ctx.fillStyle = 'rgba(120,28,22,0.95)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = FONT(64);
      ctx.fillText('月', w * 0.28, h / 2);
      ctx.fillText('灯', w * 0.74, h / 2);
      // stains
      const rr = D.rng(91);
      for (let i = 0; i < 80; i++) {
        ctx.fillStyle = 'rgba(160,94,44,' + (0.03 + rr() * 0.05) + ')';
        ctx.fillRect(rr() * w, rr() * h, 1 + rr() * 3, 1 + rr() * 3);
      }
    }, { repeat: [1, 1] });

    /* ---- gravel strip ---- */
    TEX.gravel = D.canvasTexture(256, 256, (ctx, w, h) => {
      ctx.fillStyle = '#2b2d36';
      ctx.fillRect(0, 0, w, h);
      const rr = D.rng(101);
      for (let i = 0; i < 2600; i++) {
        const v = 40 + Math.floor(rr() * 70);
        ctx.fillStyle = 'rgba(' + v + ',' + (v + 2) + ',' + (v + 8) + ',' + (0.25 + rr() * 0.5) + ')';
        ctx.fillRect(rr() * w, rr() * h, 1 + rr() * 3, 1 + rr() * 2);
      }
      for (let i = 0; i < 40; i++) {
        const x = rr() * w;
        const y = rr() * h;
        ctx.fillStyle = 'rgba(150,150,165,0.25)';
        ctx.fillRect(x, y, 1, 1);
      }
    }, { repeat: [4, 4] });

    /* ---- drain grate ---- */
    TEX.grate = D.canvasTexture(128, 128, (ctx, w, h) => {
      ctx.fillStyle = '#14171e';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#596173';
      ctx.lineWidth = 4;
      for (let x = 8; x < w; x += 16) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 8; y < h; y += 24) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      ctx.strokeStyle = '#8a92a4';
      ctx.lineWidth = 5;
      ctx.strokeRect(2, 2, w - 4, h - 4);
    }, { clamp: true });

    /* ---- corrugated metal (shed / fence) ---- */
    TEX.corrugated = D.canvasTexture(128, 128, (ctx, w, h) => {
      ctx.fillStyle = '#5a6070';
      ctx.fillRect(0, 0, w, h);
      for (let x = 0; x < w; x += 12) {
        ctx.fillStyle = '#6e7587';
        ctx.fillRect(x, 0, 5, h);
        ctx.fillStyle = '#3c4252';
        ctx.fillRect(x + 7, 0, 3, h);
      }
      const rr = D.rng(111);
      for (let i = 0; i < 40; i++) {
        ctx.fillStyle = 'rgba(120,72,40,' + (0.05 + rr() * 0.12) + ')';
        ctx.fillRect(rr() * w, rr() * h, 2 + rr() * 6, 3 + rr() * 10);
      }
    }, { repeat: [2, 1] });
  }

  /* =========================================================
     materials
     ========================================================= */
  function makeMaterials() {
    MAT.cafePlaster = D.toon(0x4f4652, { gradientMap: D.ramps.soft, map: TEX.plaster });
    MAT.cafeWood = D.toon(0xffffff, { gradientMap: D.ramps.soft, map: TEX.wood });
    MAT.cafeWoodDark = D.toon(0xb9a08c, { gradientMap: D.ramps.soft, map: TEX.woodDark });
    MAT.beam = D.toon(0x2c1f18, { gradientMap: D.ramps.soft });
    MAT.stone = D.toon(0x3f3f4a, { gradientMap: D.ramps.soft });
    MAT.stoneBase = D.toon(0x2e2f38, { gradientMap: D.ramps.soft, map: TEX.concrete });
    MAT.concrete = D.toon(0x5a5d69, { gradientMap: D.ramps.soft, map: TEX.concrete });
    MAT.concreteLong = D.toon(0x565a66, { gradientMap: D.ramps.soft, map: TEX.concreteLong });
    MAT.concreteCap = D.toon(0x6f727e, { gradientMap: D.ramps.soft });
    MAT.wallA = D.toon(0x3a3f50, { gradientMap: D.ramps.soft, map: TEX.concrete });
    MAT.wallB = D.toon(0x413640, { gradientMap: D.ramps.soft, map: TEX.plaster });
    MAT.wallC = D.toon(0x34424b, { gradientMap: D.ramps.soft, map: TEX.concrete });
    MAT.wallBack = D.toon(0x2e333f, { gradientMap: D.ramps.soft, map: TEX.concrete });
    MAT.wallHouse1 = D.toon(0x4a4249, { gradientMap: D.ramps.soft, map: TEX.plaster });
    MAT.wallHouse2 = D.toon(0x3d424d, { gradientMap: D.ramps.soft, map: TEX.concrete });
    MAT.wallHouse3 = D.toon(0x51473d, { gradientMap: D.ramps.soft, map: TEX.plaster });
    MAT.wallShed = D.toon(0x6f7580, { gradientMap: D.ramps.soft, map: TEX.corrugated });
    MAT.roofTile = D.toon(0x9aa2b8, { gradientMap: D.ramps.soft, map: TEX.roofBlue });
    MAT.roofTileBrown = D.toon(0xb0a29a, { gradientMap: D.ramps.soft, map: TEX.roofBrown });
    MAT.roofTileDark = D.toon(0x949bad, { gradientMap: D.ramps.soft, map: TEX.roofDark });
    MAT.roofFascia = D.toon(0x241d19, { gradientMap: D.ramps.soft });
    MAT.roofFlat = D.toon(0x333743, { gradientMap: D.ramps.soft, map: TEX.concrete });
    MAT.woodPanel = D.toon(0xffffff, { gradientMap: D.ramps.soft, map: TEX.wood });
    MAT.woodDark = D.toon(0xffffff, { gradientMap: D.ramps.soft, map: TEX.woodDark });
    MAT.winFrame = D.toon(0x241f29, { gradientMap: D.ramps.soft });
    MAT.winRecess = D.toon(0x14161d, { gradientMap: D.ramps.soft });
    MAT.sill = D.toon(0x474c59, { gradientMap: D.ramps.soft });
    MAT.doorFrame = D.toon(0x1f1917, { gradientMap: D.ramps.soft });
    MAT.doorDark = D.toon(0x343d4a, { gradientMap: D.ramps.soft });
    MAT.doorWood = D.toon(0x4b382b, { gradientMap: D.ramps.soft, map: TEX.woodDark });
    MAT.shutter = D.toon(0xffffff, { gradientMap: D.ramps.soft, map: TEX.shutter });
    MAT.acBody = D.toon(0x8b93a2, { gradientMap: D.ramps.soft });
    MAT.acPanel = D.toon(0xffffff, { gradientMap: D.ramps.soft, map: TEX.ac });
    MAT.pipe = D.standard(0x585f6c, { roughness: 0.42, metalness: 0.55 });
    MAT.metal = D.standard(0x6e7787, { roughness: 0.38, metalness: 0.65 });
    MAT.metalDark = D.standard(0x343a46, { roughness: 0.5, metalness: 0.5 });
    MAT.glassDark = D.standard(0x0c1521, { roughness: 0.08, metalness: 0.72, envMapIntensity: 1.8 });
    MAT.puddle = D.standard(0x050a12, { roughness: 0.035, metalness: 0.94, envMapIntensity: 2.6, transparent: true, opacity: 0.92 });
    MAT.trash = D.standard(0x1b202a, { roughness: 0.42, metalness: 0.18 });
    MAT.bin = D.toon(0x334a5c, { gradientMap: D.ramps.soft });
    MAT.pot = D.toon(0x5f4232, { gradientMap: D.ramps.soft });
    MAT.potRim = D.toon(0x7a5c44, { gradientMap: D.ramps.soft });
    MAT.grate = D.toon(0xffffff, { gradientMap: D.ramps.soft, map: TEX.grate });
    MAT.gravel = D.toon(0x9b9daa, { gradientMap: D.ramps.soft, map: TEX.gravel });
    MAT.alleyFloor = D.toon(0x3f414b, { gradientMap: D.ramps.soft, map: TEX.concrete });
    MAT.hedge = D.toon(0x1b3a32, { gradientMap: D.ramps.soft, flat: true });
    MAT.hedgeLight = D.toon(0x265046, { gradientMap: D.ramps.soft, flat: true });
    MAT.trunk = D.toon(0x352a22, { gradientMap: D.ramps.soft });
    MAT.tank = D.toon(0x6f7683, { gradientMap: D.ramps.soft });
    MAT.tankDark = D.toon(0x474e59, { gradientMap: D.ramps.soft });
    MAT.signBack = D.toon(0x1a1620, { gradientMap: D.ramps.soft });
    MAT.signBackWarm = D.toon(0x2a1a12, { gradientMap: D.ramps.soft });
    MAT.signBackNeon = D.toon(0x140c18, { gradientMap: D.ramps.soft });
    MAT.lanternPaper = D.basic(0xffffff, { map: TEX.lantern, toneMapped: false });
    MAT.menu = D.toon(0xffffff, { gradientMap: D.ramps.soft, map: TEX.menu });
    MAT.poster = D.toon(0xffffff, { gradientMap: D.ramps.soft, map: TEX.poster });
    MAT.namePlate = D.toon(0xffffff, { gradientMap: D.ramps.soft, map: TEX.namePlate });
    MAT.closedPlate = D.toon(0xffffff, { gradientMap: D.ramps.soft, map: TEX.closedPlate });
    MAT.glowWarm = D.basic(0xffc07a, { toneMapped: false });
    MAT.clothA = D.toon(0xd8d4c8, { gradientMap: D.ramps.soft, side: T.DoubleSide });
    MAT.clothB = D.toon(0x8fa6c4, { gradientMap: D.ramps.soft, side: T.DoubleSide });
    MAT.clothC = D.toon(0xc98a86, { gradientMap: D.ramps.soft, side: T.DoubleSide });
  }

  /* =========================================================
     facade detail helpers (all work in facade-local space:
     +X right along the wall, +Y up, +Z outward)
     ========================================================= */
  function addWindow(fg, o) {
    const w = o.w || 1;
    const h = o.h || 1;
    const g = grp(fg, o.x || 0, o.y || 0, o.z || 0, o.ry || 0);
    flat(g, w + 0.2, h + 0.2, 0.1, o.recessMat || MAT.winRecess, { z: -0.03, cast: false, receive: false });
    flat(g, w + 0.12, h + 0.12, 0.07, o.frameMat || MAT.winFrame, { z: 0.025, cast: false, receive: false });
    const paneMat = o.lit
      ? D.basic(0xffffff, { map: o.tex || TEX.warmWin, toneMapped: false })
      : MAT.glassDark;
    const pane = D.plane(g, w, h, paneMat, { z: 0.07, cast: false, receive: false });
    pane.userData.noOutline = true;
    if (o.mullion !== false) {
      flat(g, o.mullionW || 0.055, h, 0.045, MAT.winFrame, { z: 0.08, cast: false, receive: false });
      if (o.hbar) flat(g, w, 0.055, 0.045, MAT.winFrame, { z: 0.08, cast: false, receive: false });
    }
    if (o.bars) {
      for (let i = 1; i <= o.bars; i++) {
        flat(g, 0.035, h * 0.92, 0.04, MAT.woodDark, {
          x: -w / 2 + (w * i) / (o.bars + 1),
          z: 0.09,
          cast: false,
          receive: false,
        });
      }
    }
    if (o.sill !== false) {
      flat(g, w + 0.3, 0.07, 0.17, MAT.sill, { y: -h / 2 - 0.11, z: 0.06, cast: false, receive: true });
    }
    if (o.glow) {
      D.glowSprite(g, {
        x: 0,
        y: 0,
        z: 0.38,
        color: o.glowColor || 0xffbe78,
        size: o.glowSize || Math.max(w, h) * 2.2,
        opacity: o.glowOpacity !== undefined ? o.glowOpacity : 0.24,
      });
    }
    return g;
  }

  function addShutter(fg, o) {
    const w = o.w || 1.6;
    const h = o.h || 1.4;
    const g = grp(fg, o.x || 0, o.y || 0, o.z || 0);
    flat(g, w + 0.2, h + 0.24, 0.1, MAT.winRecess, { z: -0.03, cast: false, receive: false });
    const panel = D.box(g, w, h, 0.06, MAT.shutter, { z: 0.03, cast: false, receive: true });
    panel.userData.noOutline = true;
    flat(g, w + 0.22, 0.22, 0.16, MAT.metalDark, { y: h / 2 + 0.16, z: 0.04, cast: true, receive: true });
    flat(g, w * 0.22, 0.05, 0.06, MAT.metalDark, { y: -h / 2 + 0.16, z: 0.08, cast: false });
    return g;
  }

  function addDoor(fg, o) {
    const w = o.w || 0.9;
    const h = o.h || 1.9;
    const g = grp(fg, o.x || 0, o.y || 0, o.z || 0);
    flat(g, w + 0.16, h + 0.12, 0.1, MAT.doorFrame, { z: -0.02, cast: false, receive: false });
    bx(g, w, h, 0.08, o.mat || MAT.doorDark, { z: 0.03, cast: false, receive: true }).userData.noOutline = true;
    if (o.warm) {
      const p = D.plane(g, w * 0.66, h * 0.42, D.basic(0xffffff, { map: o.tex || TEX.warmWin, toneMapped: false }), {
        y: h * 0.14,
        z: 0.085,
        cast: false,
        receive: false,
      });
      p.userData.noOutline = true;
      D.glowSprite(g, { x: 0, y: h * 0.1, z: 0.4, color: 0xffb36e, size: 1.6, opacity: 0.22 });
    }
    flat(g, w + 0.34, 0.13, 0.36, MAT.stone, { y: -h / 2 - 0.02, z: 0.16, cast: false, receive: true });
    return g;
  }

  function addAC(fg, o) {
    const s = o.scale || 1;
    const g = grp(fg, o.x || 0, o.y || 3.0, o.z || 0);
    bx(g, 0.64 * s, 0.44 * s, 0.27 * s, MAT.acBody, { z: 0.17 * s, cast: true, receive: true });
    const panel = D.plane(g, 0.6 * s, 0.4 * s, D.basic(0xffffff, { map: TEX.ac }), {
      z: 0.31 * s,
      cast: false,
      receive: false,
    });
    panel.userData.noOutline = true;
    flat(g, 0.76 * s, 0.1 * s, 0.34 * s, MAT.metalDark, { y: -0.19 * s, z: 0.06 * s, cast: false, receive: false });
    D.cyl(g, 0.026, 0.026, 0.62 * s, 5, MAT.pipe, { x: 0.24 * s, y: -0.42 * s, z: 0.22 * s, cast: false });
    return g;
  }

  function addPot(parent, o) {
    const s = o.scale || 1;
    const g = grp(parent, o.x || 0, o.y || 0, o.z || 0);
    D.cyl(g, 0.17 * s, 0.12 * s, 0.26 * s, 8, o.potMat || MAT.pot, { y: 0.13 * s, cast: true, receive: true });
    D.cyl(g, 0.18 * s, 0.18 * s, 0.04 * s, 8, MAT.potRim, { y: 0.26 * s, cast: false });
    D.foliage(g, {
      x: 0,
      y: 0.28 * s,
      z: 0,
      r: 0.23 * s,
      count: o.count || 3,
      spread: 0.3 * s,
      rise: 0.36 * s,
      colors: o.colors || [0x1c4a3e, 0x27604f, 0x173b33],
      seed: o.seed || 7,
    });
    return g;
  }

  function addPipe(fg, o) {
    const y0 = o.y0 !== undefined ? o.y0 : 0.04;
    const y1 = o.y1 !== undefined ? o.y1 : 5.2;
    const g = grp(fg, o.x || 0, 0, o.z || 0.1);
    D.cyl(g, 0.05, 0.05, y1 - y0, 6, o.mat || MAT.pipe, { y: (y0 + y1) / 2, cast: false });
    for (let i = 0; i < 2; i++) {
      flat(g, 0.14, 0.05, 0.1, MAT.metalDark, { x: 0, y: y0 + (y1 - y0) * (0.25 + i * 0.5), z: -0.06, cast: false });
    }
    D.cyl(g, 0.055, 0.055, 0.28, 6, MAT.pipe, { x: 0.11, y: y0 + 0.03, z: 0, rz: HP, cast: false });
    return g;
  }

  function addNoren(fg, o) {
    const w = o.w || 0.34;
    const h = o.h || 0.46;
    const g = grp(fg, o.x || 0, o.y || 2.3, o.z || 0.12);
    D.cyl(g, 0.023, 0.023, w * 3.5, 6, MAT.beam, { rz: HP, cast: false });
    const texs = o.texs || [TEX.noren0, TEX.noren1, TEX.noren2];
    for (let i = 0; i < 3; i++) {
      const tex = texs[i];
      const mat = new T.MeshToonMaterial({
        map: tex,
        gradientMap: D.ramps.soft,
        side: T.DoubleSide,
        color: 0xffffff,
      });
      const panel = D.plane(g, w, h, mat, {
        x: (i - 1) * (w + 0.022),
        y: -h / 2 - 0.02,
        z: 0.012,
        cast: false,
        receive: true,
      });
      panel.rotation.y = (i - 1) * 0.05;
      panel.userData.noOutline = true;
    }
    return g;
  }

  function addAwning(fg, o) {
    const w = o.w || 2;
    const proj = o.proj || 0.5;
    const slope = o.slope || 0.2;
    const y = o.y || 3.1;
    const g = grp(fg, o.x || 0, y, o.z || 0);
    const drop = proj * Math.tan(slope);
    D.box(g, w, 0.08, proj / Math.cos(slope), o.mat || MAT.roofTileDark, {
      z: proj / 2,
      y: -drop / 2,
      rx: slope,
      cast: true,
      receive: true,
    });
    flat(g, w, 0.11, 0.06, MAT.roofFascia, { z: proj, y: -drop - 0.02, cast: false });
    const b1 = flat(g, 0.05, 0.05, proj * 0.9, MAT.metalDark, { x: -w / 2 + 0.18, y: -drop * 0.55, z: proj * 0.5, cast: false });
    b1.rotation.x = -slope;
    const b2 = flat(g, 0.05, 0.05, proj * 0.9, MAT.metalDark, { x: w / 2 - 0.18, y: -drop * 0.55, z: proj * 0.5, cast: false });
    b2.rotation.x = -slope;
    return g;
  }

  function addBalcony(fg, o) {
    const w = o.w || 2;
    const dep = o.depth || 0.5;
    const y = o.y || 3.4;
    const g = grp(fg, o.x || 0, y, o.z || 0);
    flat(g, w, 0.1, dep, MAT.concrete, { z: dep / 2, cast: true, receive: true });
    flat(g, w, 0.055, 0.055, MAT.metal, { z: dep, y: 0.66, cast: false });
    flat(g, w, 0.05, 0.05, MAT.metal, { z: dep, y: 0.3, cast: false });
    const n = Math.max(2, Math.round(w / 0.55));
    for (let i = 0; i <= n; i++) {
      flat(g, 0.04, 0.66, 0.04, MAT.metal, { x: -w / 2 + (w * i) / n, z: dep, y: 0.33, cast: false });
    }
    return g;
  }

  function addAntenna(parent, o) {
    const h = o.h || 2.2;
    const g = grp(parent, o.x || 0, o.y || 0, o.z || 0);
    D.cyl(g, 0.03, 0.05, h, 5, MAT.metalDark, { y: h / 2, cast: false });
    for (let i = 0; i < 3; i++) {
      flat(g, (o.w || 1.1) - i * 0.22, 0.035, 0.035, MAT.metalDark, { y: h * (0.52 + i * 0.17), cast: false });
    }
    return g;
  }

  function addTank(parent, o) {
    const g = grp(parent, o.x || 0, o.y || 0, o.z || 0);
    D.cyl(g, 0.52, 0.52, 1.0, 10, MAT.tank, { y: 0.5, cast: true, receive: true });
    D.cyl(g, 0.56, 0.56, 0.07, 10, MAT.tankDark, { y: 1.02, cast: false });
    for (let i = 0; i < 4; i++) {
      const a = i * HP + 0.4;
      flat(g, 0.065, 0.42, 0.065, MAT.metalDark, {
        x: Math.cos(a) * 0.36,
        y: -0.2,
        z: Math.sin(a) * 0.36,
        cast: false,
      });
    }
    return g;
  }

  function addTree(parent, o) {
    const s = o.scale || 1;
    const h = o.h || 4.4;
    const g = grp(parent, o.x || 0, 0, o.z || 0, o.ry || 0);
    D.cyl(g, 0.14 * s, 0.23 * s, h * 0.6, 7, MAT.trunk, { y: h * 0.3, cast: true, receive: true });
    D.cyl(g, 0.07 * s, 0.1 * s, h * 0.3, 5, MAT.trunk, { y: h * 0.58, x: 0.2 * s, rz: -0.48, cast: true });
    D.cyl(g, 0.06 * s, 0.09 * s, h * 0.26, 5, MAT.trunk, { y: h * 0.55, x: -0.17 * s, rz: 0.42, cast: true });
    D.foliage(g, {
      x: 0,
      y: h * 0.63,
      z: 0,
      r: (o.r || 1.05) * s,
      count: o.count || 4,
      spread: (o.spread || 1.5) * s,
      rise: (o.rise || 0.95) * s,
      seed: o.seed || 3,
      colors: o.colors || [0x173b33, 0x1f4a3f, 0x285c4c],
    });
    return g;
  }

  function addFence(parent, o) {
    const len = o.len || 3;
    const h = o.h || 1.1;
    const g = grp(parent, o.x || 0, o.y || 0, o.z || 0, o.ry || 0);
    if (o.kind === 'metal') {
      const n = Math.max(2, Math.round(len / 0.5));
      flat(g, len, h * 0.75, 0.05, MAT.metalDark, { y: h * 0.45, z: 0.01, cast: false });
      flat(g, len, 0.06, 0.08, MAT.metal, { y: h * 0.78, cast: false });
      for (let i = 0; i <= n; i++) {
        flat(g, 0.04, h * 0.75, 0.04, MAT.metalDark, { x: -len / 2 + (len * i) / n, y: h * 0.45, cast: false });
      }
    } else {
      const posts = Math.max(1, Math.round(len / 0.85));
      bx(g, len, h * 0.78, 0.07, MAT.woodPanel, { y: h * 0.44, z: 0, cast: true, receive: true });
      for (let i = 0; i <= posts; i++) {
        bx(g, 0.09, h, 0.1, MAT.beam, { x: -len / 2 + (len * i) / posts, y: h / 2, cast: true, receive: true });
      }
      flat(g, len + 0.06, 0.07, 0.12, MAT.beam, { y: h + 0.02, cast: false });
    }
    return g;
  }

  /* =========================================================
     1) LEFT BUILDING — old cafe 喫茶 月灯
     x -11.2..-9.0, z -7.2..1.0, faces east (+X) and south (+Z)
     ========================================================= */
  let anim = [];

  function buildCafe(layer) {
    const g = grp(layer, -10.1, 0, -3.1);
    const W = 2.2;
    const DEP = 8.2;
    const GROUND = 3.05;
    const UPPER = 2.45;
    const EAVE = GROUND + UPPER; // 5.5
    const RISE = 1.35;

    /* ---- shells ---- */
    bx(g, W, GROUND, DEP, MAT.cafeWood, { y: GROUND / 2, cast: true, receive: true });
    bx(g, W, UPPER, DEP, MAT.cafePlaster, { y: GROUND + UPPER / 2, cast: true, receive: true });
    flat(g, W + 0.1, 0.3, DEP + 0.1, MAT.stone, { y: 0.15, cast: true, receive: true });

    /* ---- timber framing bands around both storeys ---- */
    for (const yy of [GROUND + 0.06, EAVE - 0.1]) {
      bx(g, 0.1, 0.15, DEP + 0.04, MAT.beam, { x: W / 2 + 0.02, y: yy, z: 0, cast: false, receive: false });
      bx(g, 0.1, 0.15, DEP + 0.04, MAT.beam, { x: -W / 2 - 0.02, y: yy, z: 0, cast: false, receive: false });
      bx(g, W + 0.04, 0.15, 0.1, MAT.beam, { y: yy, z: DEP / 2 + 0.02, cast: false, receive: false });
      bx(g, W + 0.04, 0.15, 0.1, MAT.beam, { y: yy, z: -DEP / 2 - 0.02, cast: false, receive: false });
    }
    const upperPosts = [-3.6, -1.6, 0.4, 2.4, 3.9];
    for (const pz of upperPosts) {
      bx(g, 0.1, UPPER - 0.2, 0.07, MAT.beam, { x: W / 2 + 0.03, y: GROUND + UPPER / 2, z: pz, cast: false, receive: false });
    }
    for (const px of [-0.95, 0.05, 1.0]) {
      bx(g, 0.07, UPPER - 0.2, 0.1, MAT.beam, { y: GROUND + UPPER / 2, z: DEP / 2 + 0.03, x: px, cast: false, receive: false });
    }
    bx(g, 0.1, UPPER - 0.2, 0.07, MAT.beam, { x: W / 2 + 0.03, y: GROUND + UPPER / 2, z: -1.2, cast: false, receive: false });
    bx(g, 0.1, UPPER - 0.2, 0.07, MAT.beam, { x: -W / 2 - 0.03, y: GROUND + UPPER / 2, z: -2.6, cast: false, receive: false });

    /* ---- roof (gable, ridge along Z) ---- */
    const slope = Math.atan2(RISE, W / 2);
    const slabLen = Math.hypot(W / 2, RISE) + 0.24;
    D.box(g, slabLen, 0.11, DEP + 0.36, MAT.roofTile, {
      x: 0.56,
      y: EAVE + RISE / 2,
      rz: -slope,
      cast: true,
      receive: true,
    });
    D.box(g, slabLen, 0.11, DEP + 0.36, MAT.roofTile, {
      x: -0.56,
      y: EAVE + RISE / 2,
      rz: slope,
      cast: true,
      receive: true,
    });
    D.cyl(g, 0.1, 0.1, DEP + 0.5, 7, MAT.roofFascia, { y: EAVE + RISE + 0.05, rx: HP, cast: true });
    // eave fascia + gutter
    for (const sx of [1, -1]) {
      flat(g, 0.1, 0.2, DEP + 0.4, MAT.roofFascia, { x: sx * (W / 2 + 0.03), y: EAVE - 0.06, cast: false });
      D.cyl(g, 0.06, 0.06, DEP + 0.36, 6, MAT.metalDark, { x: sx * (W / 2 + 0.14), y: EAVE - 0.16, rx: HP, cast: false });
    }
    // gable infill triangles + barge boards + attic vents
    const tri = new T.ShapeGeometry(triShape(W, RISE));
    for (const zz of [1, -1]) {
      D.mesh(tri, MAT.cafePlaster, { y: EAVE, z: zz * DEP / 2, cast: false, receive: true, parent: g });
      const b1 = D.box(g, 0.12, slabLen, 0.09, MAT.roofFascia, {
        x: W / 4,
        y: EAVE + RISE / 2 + 0.04,
        z: zz * (DEP / 2 + 0.05),
        rz: -slope,
        cast: false,
      });
      b1.userData.noOutline = true;
      const b2 = D.box(g, 0.12, slabLen, 0.09, MAT.roofFascia, {
        x: -W / 4,
        y: EAVE + RISE / 2 + 0.04,
        z: zz * (DEP / 2 + 0.05),
        rz: slope,
        cast: false,
      });
      b2.userData.noOutline = true;
      flat(g, 0.34, 0.05, 0.05, MAT.beam, { y: EAVE + RISE * 0.55, z: zz * (DEP / 2 + 0.08), cast: false });
      if (zz > 0) {
        D.torus(g, 0.17, 0.03, 6, 16, MAT.roofFascia, { y: EAVE + 0.62, z: DEP / 2 + 0.07, cast: false });
        flat(g, 0.28, 0.28, 0.03, MAT.winRecess, { y: EAVE + 0.62, z: DEP / 2 + 0.05, cast: false });
        flat(g, 0.2, 0.2, 0.02, MAT.glowWarm, { y: EAVE + 0.62, z: DEP / 2 + 0.08, cast: false });
      }
    }
    // chimney / roof vent
    D.cyl(g, 0.15, 0.18, 0.9, 7, MAT.roofFlat, { x: 0.45, y: EAVE + RISE + 0.3, z: 1.6, cast: true });
    flat(g, 0.44, 0.08, 0.44, MAT.roofFascia, { x: 0.45, y: EAVE + RISE + 0.76, z: 1.6, cast: false });
    addAntenna(g, { x: 0.1, y: EAVE + RISE - 0.15, z: -3.1, h: 2.6, w: 1.25 });

    /* =========================================================
       south facade (faces the forecourt, most visible opening view)
       ========================================================= */
    const fs = facade(g, 0, 0, DEP / 2, 0);

    // ground floor wooden shopfront
    flat(fs, 2.06, 2.82, 0.08, MAT.cafeWoodDark, { y: 1.47, z: 0.03, cast: false, receive: true });
    // sliding door with warm interior
    const doorG = grp(fs, 0.28, 1.18, 0.06);
    flat(doorG, 1.08, 2.14, 0.08, MAT.doorFrame, { cast: false, receive: false });
    const doorPane = D.plane(doorG, 0.9, 1.94, D.basic(0xffffff, { map: TEX.warmWin2, toneMapped: false }), {
      z: 0.05,
      cast: false,
      receive: false,
    });
    doorPane.userData.noOutline = true;
    flat(doorG, 0.05, 1.94, 0.04, MAT.woodDark, { z: 0.065, cast: false });
    flat(doorG, 0.9, 0.05, 0.04, MAT.woodDark, { y: 0.28, z: 0.065, cast: false });
    flat(doorG, 1.3, 0.13, 0.38, MAT.stone, { y: -1.08, z: 0.2, cast: false, receive: true });
    D.glowSprite(doorG, { x: 0, y: 0.15, z: 0.55, color: 0xffbc74, size: 1.9, opacity: 0.3 });
    // noren over the door
    addNoren(fs, { x: 0.28, y: 2.4, w: 0.34, h: 0.48, z: 0.15 });
    // lattice window left of the door
    flat(fs, 0.64, 1.24, 0.07, MAT.winRecess, { x: -0.72, y: 1.66, z: 0.02, cast: false, receive: false });
    const latPane = D.plane(fs, 0.52, 1.1, D.basic(0xffffff, { map: TEX.warmWin, toneMapped: false }), {
      x: -0.72,
      y: 1.66,
      z: 0.065,
      cast: false,
      receive: false,
    });
    latPane.userData.noOutline = true;
    for (let i = 1; i <= 3; i++) {
      flat(fs, 0.035, 1.1, 0.04, MAT.woodDark, { x: -0.72 - 0.26 + (0.52 * i) / 4, y: 1.66, z: 0.085, cast: false });
    }
    flat(fs, 0.66, 0.06, 0.14, MAT.sill, { x: -0.72, y: 1.03, z: 0.08, cast: false });
    D.glowSprite(fs, { x: -0.72, y: 1.7, z: 0.4, color: 0xffc07a, size: 1.5, opacity: 0.18 });
    // fascia sign
    D.signPanel(fs, TEX.cafeHori, 1.42, 0.38, {
      x: 0.03,
      y: 2.88,
      z: 0.07,
      depth: 0.07,
      backingColor: 0x1a110d,
    });
    // shallow tiled hisashi above the shopfront
    addAwning(fs, { w: 2.26, y: 3.24, z: 0.02, proj: 0.46, slope: 0.2, mat: MAT.roofTileDark });
    D.glowSprite(fs, { x: -0.55, y: 2.98, z: 0.35, color: 0xffc07a, size: 0.8, opacity: 0.22 });
    D.glowSprite(fs, { x: 0.6, y: 2.98, z: 0.35, color: 0xffc07a, size: 0.8, opacity: 0.22 });
    // menu board
    D.plane(fs, 0.3, 0.4, D.basic(0xffffff, { map: TEX.menu }), {
      x: 0.92,
      y: 1.72,
      z: 0.075,
      cast: false,
      receive: false,
    }).userData.noOutline = true;
    // potted plants at the door
    addPot(fs, { x: -0.98, z: 0.32, scale: 0.95, seed: 21 });
    addPot(fs, { x: 0.92, z: 0.3, scale: 0.8, seed: 22 });

    // upstairs warm window w/ curtains + flower box
    addWindow(fs, {
      x: 0.02,
      y: 4.4,
      w: 1.18,
      h: 1.06,
      lit: true,
      tex: TEX.warmWin,
      glow: true,
      glowSize: 2.5,
      glowOpacity: 0.26,
      hbar: true,
    });
    flat(fs, 1.4, 0.14, 0.34, MAT.woodDark, { y: 3.74, z: 0.18, cast: true, receive: true });
    addPot(fs, { x: -0.36, y: 3.8, z: 0.2, scale: 0.55, seed: 23 });
    addPot(fs, { x: 0.42, y: 3.8, z: 0.2, scale: 0.5, seed: 24 });

    /* =========================================================
       east facade (along the alley) — big face seen from the left
       ========================================================= */
    const fe = facade(g, W / 2, 0, 0, HP);

    flat(fe, DEP - 0.3, 2.84, 0.07, MAT.cafeWoodDark, { y: 1.46, z: 0.03, cast: false, receive: true });
    // warm ground-floor window
    addWindow(fe, {
      x: 1.5,
      y: 1.78,
      w: 0.9,
      h: 1.0,
      lit: true,
      tex: TEX.warmWin2,
      glow: true,
      glowSize: 1.9,
      glowOpacity: 0.2,
    });
    // old shuttered service window
    addShutter(fe, { x: -1.0, y: 1.68, w: 1.2, h: 1.4 });
    // rear service door (warm glimpse)
    addDoor(fe, { x: 3.18, y: 0.98, w: 0.84, h: 1.94, warm: true, mat: MAT.doorWood });
    // AC unit
    addAC(fe, { x: 0.25, y: 2.98, scale: 0.95 });
    // drainpipes
    addPipe(fe, { x: -3.68, y0: 0.05, y1: EAVE - 0.1 });
    addPipe(fe, { x: 3.72, y0: 0.05, y1: EAVE - 0.1 });
    // potted plants along the alley wall
    addPot(fe, { x: -3.25, z: 0.28, scale: 1.0, seed: 31 });
    addPot(fe, { x: -2.92, z: 0.26, scale: 0.72, seed: 32 });
    addPot(fe, { x: 2.25, z: 0.26, scale: 0.85, seed: 33 });
    // upstairs warm window
    addWindow(fe, {
      x: -1.1,
      y: 4.42,
      w: 1.3,
      h: 1.05,
      lit: true,
      tex: TEX.warmWin,
      glow: true,
      glowSize: 2.7,
      glowOpacity: 0.25,
      hbar: true,
      bars: false,
    });
    flat(fe, 1.5, 0.13, 0.32, MAT.woodDark, { x: -1.1, y: 3.76, z: 0.16, cast: true, receive: true });
    addPot(fe, { x: -1.45, y: 3.82, z: 0.18, scale: 0.5, seed: 34 });
    addPot(fe, { x: -0.75, y: 3.82, z: 0.18, scale: 0.46, seed: 35 });
    // wall meter box + small notices
    flat(fe, 0.28, 0.4, 0.12, MAT.metalDark, { x: 2.55, y: 2.2, z: 0.07, cast: false });
    D.plane(fe, 0.24, 0.34, D.basic(0xffffff, { map: TEX.poster }), {
      x: 1.95,
      y: 2.35,
      z: 0.072,
      cast: false,
      receive: false,
    }).userData.noOutline = true;

    /* =========================================================
       west + north faces (behind / left orbit)
       ========================================================= */
    const fw = facade(g, -W / 2, 0, 0, -HP);
    addWindow(fw, {
      x: 1.1,
      y: 4.35,
      w: 0.9,
      h: 0.95,
      lit: true,
      tex: TEX.warmWin2,
      glow: true,
      glowSize: 1.8,
      glowOpacity: 0.18,
    });
    addWindow(fw, { x: -1.4, y: 1.85, w: 0.8, h: 0.9 });
    addPipe(fw, { x: 2.85, y0: 0.05, y1: EAVE - 0.1 });
    addAC(fw, { x: -2.9, y: 2.7, scale: 0.9 });

    const fn = facade(g, 0, 0, -DEP / 2, PI);
    addWindow(fn, { x: 0.8, y: 4.3, w: 0.8, h: 0.9 });
    addWindow(fn, { x: -0.85, y: 1.9, w: 0.7, h: 0.8 });
    addPipe(fn, { x: 1.02, y0: 0.05, y1: EAVE - 0.12 });
    flat(fn, 0.3, 0.4, 0.12, MAT.metalDark, { x: -1.0, y: 2.4, z: 0.06, cast: false });

    /* =========================================================
       projecting warm blade sign 喫茶 月灯  (~ -8.85, 3.3, 0.2)
       ========================================================= */
    D.verticalSign(layer, TEX.cafeSign, 0.52, 1.56, {
      x: -8.86,
      y: 3.3,
      z: 0.2,
      depth: 0.13,
      backingMat: MAT.signBackWarm,
    });
    // iron bracket
    flat(layer, 0.22, 0.055, 0.055, MAT.metalDark, { x: -9.0, y: 4.12, z: 0.2, cast: false });
    flat(layer, 0.05, 0.44, 0.05, MAT.metalDark, { x: -8.9, y: 3.94, z: 0.2, cast: false });
    const cafeSignGlow = D.glowSprite(layer, {
      x: -8.84,
      y: 3.3,
      z: 0.52,
      color: 0xffab60,
      size: 2.3,
      opacity: 0.34,
    });
    const cafeSignGlow2 = D.glowSprite(layer, {
      x: -8.84,
      y: 3.3,
      z: -0.12,
      color: 0xffab60,
      size: 1.6,
      opacity: 0.18,
    });
    anim.push({ o: cafeSignGlow, base: 0.34, amp: 0.05, speed: 2.1, phase: 0 });
    anim.push({ o: cafeSignGlow2, base: 0.18, amp: 0.03, speed: 2.1, phase: 0.5 });
    D.floorGlow(layer, {
      x: -8.7,
      z: 0.5,
      w: 1.5,
      l: 2.6,
      color: 0xffa860,
      opacity: 0.28,
      y: 0.172,
    });
    D.lightPool(layer, { x: -8.7, z: 0.8, w: 2.2, l: 2.6, color: 0xffab68, opacity: 0.18, y: 0.171 });
  }

  /* =========================================================
     2) ALLEY — dark slot between cafe and store
     x -9.0..-6.8, z -6.6..1.0
     ========================================================= */
  function buildAlley(layer) {
    /* dark paved lane (slightly raised, sits above base ground) */
    const floor = flat(
      layer,
      2.16,
      0.04,
      7.55,
      MAT.alleyFloor,
      { x: -7.9, y: 0.155, z: -2.8, cast: false, receive: true }
    );
    floor.userData.noOutline = true;

    /* rear wall + wooden gate */
    bx(layer, 2.18, 2.55, 0.18, MAT.concrete, { x: -7.9, y: 1.28, z: -6.55, cast: true, receive: true });
    flat(layer, 2.3, 0.14, 0.32, MAT.concreteCap, { x: -7.9, y: 2.62, z: -6.55, cast: true, receive: true });
    bx(layer, 1.06, 1.9, 0.08, MAT.woodPanel, { x: -7.55, y: 0.96, z: -6.43, cast: true, receive: true });
    bx(layer, 0.1, 2.08, 0.14, MAT.beam, { x: -8.12, y: 1.04, z: -6.43, cast: true });
    bx(layer, 0.1, 2.08, 0.14, MAT.beam, { x: -6.98, y: 1.04, z: -6.43, cast: true });
    flat(layer, 1.34, 0.12, 0.18, MAT.beam, { x: -7.55, y: 2.12, z: -6.43, cast: false });
    D.lampGlow(layer, {
      x: -7.55,
      y: 2.42,
      z: -6.32,
      color: 0xffb066,
      housing: true,
      glow: 1.4,
      glowOpacity: 0.5,
      bulbR: 0.07,
      housingR: 0.1,
    });

    /* overhead cable + hanging paper lantern */
    wire(layer, new T.Vector3(-9.0, 3.42, -1.15), new T.Vector3(-6.8, 3.5, -1.15), 0.2, 0x2e3448, 0.85);
    const lantern = grp(layer, -7.9, 2.62, -1.15);
    lantern.userData.noMerge = true;
    D.cyl(lantern, 0.018, 0.018, 0.5, 5, MAT.metalDark, { y: 0.55, cast: false });
    D.cyl(lantern, 0.205, 0.205, 0.44, 12, MAT.lanternPaper, { cast: false });
    D.cyl(lantern, 0.13, 0.16, 0.06, 8, MAT.beam, { y: 0.24, cast: false });
    D.cyl(lantern, 0.16, 0.13, 0.05, 8, MAT.beam, { y: -0.24, cast: false });
    D.glowSprite(lantern, { x: 0, y: 0, z: 0.3, color: 0xffc07a, size: 1.9, opacity: 0.42 });
    D.glowSprite(lantern, { x: 0, y: 0, z: -0.28, color: 0xffc07a, size: 1.5, opacity: 0.3 });
    anim.push({ o: lantern, sway: 0.045, speed: 0.85, phase: 0.2 });

    /* light pool + puddle on the alley ground */
    D.lightPool(layer, { x: -7.9, z: -1.15, w: 2.2, l: 3.0, color: 0xffb168, opacity: 0.3, y: 0.18 });
    const puddle = D.plane(layer, 1.05, 1.7, MAT.puddle, {
      x: -7.62,
      y: 0.178,
      z: -2.2,
      rx: -HP,
      cast: false,
      receive: false,
    });
    puddle.userData.noOutline = true;
    D.floorGlow(layer, {
      x: -7.6,
      z: -2.2,
      w: 0.8,
      l: 1.4,
      color: 0x9fd8ff,
      opacity: 0.16,
      y: 0.181,
    });

    /* crates, bottles, trash bags */
    const crateMat = MAT.woodPanel;
    bx(layer, 0.52, 0.34, 0.38, crateMat, { x: -8.42, y: 0.17, z: -5.55, cast: true, receive: true });
    bx(layer, 0.52, 0.34, 0.38, crateMat, { x: -8.42, y: 0.51, z: -5.55, cast: true, receive: true });
    bx(layer, 0.52, 0.34, 0.38, crateMat, { x: -8.42, y: 0.17, z: -5.12, cast: true, receive: true });
    bx(layer, 0.46, 0.3, 0.34, MAT.bin, { x: -7.86, y: 0.15, z: -5.5, cast: true, receive: true });
    bx(layer, 0.46, 0.34, 0.34, crateMat, { x: -7.3, y: 0.17, z: -5.52, cast: true, receive: true });
    const bag1 = D.sphere(layer, 0.26, 10, 8, MAT.trash, { x: -8.62, y: 0.24, z: -4.9, cast: true });
    bag1.scale.set(1.15, 0.85, 1);
    const bag2 = D.sphere(layer, 0.21, 10, 8, MAT.trash, { x: -8.18, y: 0.19, z: -4.95, cast: true });
    bag2.scale.set(1.1, 0.8, 1.05);
    const bag3 = D.sphere(layer, 0.17, 8, 6, MAT.trash, { x: -8.36, y: 0.15, z: -4.65, cast: true });
    bag3.scale.set(1, 0.75, 1);

    /* drain grate + overflow pipes on the store side */
    flat(layer, 0.56, 0.05, 0.86, MAT.grate, { x: -7.28, y: 0.178, z: -0.55, cast: false, receive: false });
    const sf = facade(layer, -6.8, 0, 0, -HP);
    addPipe(sf, { x: 1.5, y0: 0.05, y1: 3.6 });
    addPipe(sf, { x: -2.2, y0: 0.05, y1: 2.9, z: 0.1 });
    flat(sf, 0.34, 0.46, 0.14, MAT.metalDark, { x: -0.6, y: 2.1, z: 0.08, cast: false });
    const led = D.plane(sf, 0.05, 0.05, D.basic(0x7bff9a, { toneMapped: false }), {
      x: -0.5,
      y: 2.04,
      z: 0.16,
      cast: false,
      receive: false,
    });
    led.userData.noOutline = true;

    /* old boards leaning on the cafe wall */
    const bd = bx(layer, 0.5, 0.9, 0.05, MAT.woodPanel, { x: -8.78, y: 0.45, z: -3.6, cast: true, receive: true });
    bd.rotation.x = -0.16;
    bd.rotation.z = 0.08;
    const bd2 = bx(layer, 0.4, 0.7, 0.04, MAT.woodDark, { x: -8.7, y: 0.35, z: -3.3, cast: true, receive: true });
    bd2.rotation.x = -0.2;
    bd2.rotation.z = -0.06;

    /* small planter / bucket at the mouth */
    addPot(layer, { x: -8.72, z: 0.35, scale: 0.8, seed: 41 });
    D.cyl(layer, 0.13, 0.11, 0.3, 8, MAT.bin, { x: -7.15, y: 0.16, z: 0.3, cast: false });
    const bucketGlow = D.plane(layer, 0.16, 0.05, MAT.glowWarm, {
      x: -7.15,
      y: 0.33,
      z: 0.3,
      rx: -HP,
      cast: false,
      receive: false,
    });
    bucketGlow.userData.noOutline = true;

    /* a glimpse of a lit transom above the gate */
    flat(layer, 0.5, 0.3, 0.04, MAT.glowWarm, { x: -7.95, y: 2.34, z: -6.44, cast: false });

    /* AC unit on the cafe wall inside the alley */
    const af = facade(layer, -9.0, 0, -4.1, HP);
    addAC(af, { x: 0, y: 2.75, scale: 0.85 });
  }

  /* =========================================================
     3) FAR-SIDE ROW — three narrow buildings facing -X
     x 10.6..12.85, z -7.8..4.0
     ========================================================= */
  function rowShell(layer, zc, w, hh, wallMat) {
    const g = grp(layer, 11.725, 0, zc);
    bx(g, 2.25, hh, w, wallMat, { y: hh / 2, cast: true, receive: true });
    const face = facade(g, -1.125, 0, 0, -HP);
    const back = facade(g, 1.125, 0, 0, HP);
    const endS = facade(g, 0, 0, w / 2, 0);
    const endN = facade(g, 0, 0, -w / 2, PI);
    return { g, face, back, endS, endN, zc, w, hh };
  }

  function buildFarRow(layer) {
    /* ---------------- building A : apartment / office ---------------- */
    const A = rowShell(layer, -5.55, 4.5, 6.4, MAT.wallA);
    const fA = A.face;
    // base band + step
    flat(fA, 4.5, 0.36, 0.1, MAT.stoneBase, { y: 0.18, z: 0.04, cast: false, receive: true });
    flat(fA, 4.4, 0.16, 0.26, MAT.concrete, { y: 0.08, z: 0.14, cast: false, receive: true });
    // ground floor: shutters, door, lamps
    addShutter(fA, { x: -1.05, y: 1.16, w: 1.5, h: 1.36 });
    addDoor(fA, { x: 1.62, y: 0.98, w: 0.84, h: 1.9, mat: MAT.doorDark });
    D.lampGlow(fA, { x: 1.62, y: 2.25, z: 0.22, color: 0xffb877, housing: true, glow: 1.0, glowOpacity: 0.4, bulbR: 0.06, housingR: 0.09 });
    // name plate + poster
    D.signPanel(fA, TEX.namePlate, 0.62, 0.3, { x: 1.0, y: 2.32, z: 0.06, depth: 0.05, backingColor: 0x14161c });
    D.plane(fA, 0.34, 0.5, D.basic(0xffffff, { map: TEX.poster }), {
      x: -1.92,
      y: 1.9,
      z: 0.06,
      cast: false,
      receive: false,
    }).userData.noOutline = true;
    // second floor balcony + windows
    addBalcony(fA, { x: -0.75, y: 3.42, w: 2.1, depth: 0.55 });
    addWindow(fA, {
      x: -0.75,
      y: 4.55,
      w: 1.55,
      h: 1.12,
      lit: true,
      tex: TEX.warmWin2,
      glow: true,
      glowSize: 2.8,
      glowOpacity: 0.2,
      hbar: true,
    });
    addWindow(fA, { x: 1.62, y: 4.55, w: 0.9, h: 1.0, cool: true });
    // AC + pipes + plants
    addAC(fA, { x: -1.98, y: 2.7, scale: 0.95 });
    addAC(fA, { x: 1.96, y: 5.0, scale: 0.75 });
    addPipe(fA, { x: -2.22, y0: 0.05, y1: 6.25 });
    addPipe(fA, { x: 2.2, y0: 0.05, y1: 6.25 });
    addPot(fA, { x: -2.05, z: 0.3, scale: 0.95, seed: 51 });
    addPot(fA, { x: 2.05, z: 0.28, scale: 0.8, seed: 52 });
    // roof + parapet + clutter
    flat(A.g, 2.25, 0.16, 4.5, MAT.roofFlat, { y: 6.48, cast: false, receive: true });
    for (const s of [-1, 1]) {
      flat(A.g, 2.25, 0.5, 0.18, MAT.wallA, { y: 6.73, z: s * 2.16, cast: true, receive: true });
      flat(A.g, 0.18, 0.5, 4.5, MAT.wallA, { x: s * 1.04, y: 6.73, cast: true, receive: true });
    }
    addTank(A.g, { x: -0.45, y: 6.56, z: 0.9 });
    addAntenna(A.g, { x: 0.5, y: 6.56, z: -1.2, h: 2.4, w: 1.2 });
    addAC(A.g, { x: 0.55, y: 7.2, z: 0.9, scale: 0.7 });
    D.cyl(A.g, 0.07, 0.09, 0.9, 5, MAT.metalDark, { x: -0.85, y: 6.95, z: -1.4, cast: false });
    // north end
    addWindow(A.endN, { x: 0.3, y: 4.4, w: 0.7, h: 0.9 });
    addPipe(A.endN, { x: 0.72, y0: 0.05, y1: 6.2 });
    // back (east face, seen from the opening view)
    const bA = A.back;
    flat(bA, 4.5, 6.4, 0.06, MAT.wallBack, { y: 3.2, z: -0.03, cast: false, receive: true });
    addDoor(bA, { x: 1.5, y: 0.98, w: 0.82, h: 1.9, mat: MAT.doorDark });
    addWindow(bA, { x: -1.2, y: 4.5, w: 0.85, h: 0.95, cool: true });
    addWindow(bA, { x: 0.9, y: 4.5, w: 0.8, h: 0.9, lit: true, tex: TEX.warmWin2, glow: true, glowSize: 1.6, glowOpacity: 0.14 });
    addWindow(bA, { x: -1.85, y: 1.7, w: 0.65, h: 0.75 });
    addAC(bA, { x: -1.9, y: 2.9, scale: 0.85 });
    addPipe(bA, { x: 2.2, y0: 0.05, y1: 6.25 });
    D.lampGlow(bA, { x: 1.5, y: 2.28, z: 0.22, color: 0xffb877, housing: true, glow: 1.0, glowOpacity: 0.35, bulbR: 0.06, housingR: 0.09 });
    // exterior corridor rail at back
    addBalcony(bA, { x: -0.9, y: 3.6, w: 2.2, depth: 0.42 });
    D.cyl(bA, 0.09, 0.11, 0.8, 5, MAT.metalDark, { x: 1.9, y: 4.2, z: 0.16, cast: false });

    /* ---------------- building B : snack bar スナック星屑 ---------------- */
    const B = rowShell(layer, -1.3, 4.0, 4.95, MAT.wallB);
    const fB = B.face;
    flat(fB, 4.0, 0.36, 0.1, MAT.stoneBase, { y: 0.18, z: 0.04, cast: false, receive: true });
    flat(fB, 3.9, 0.16, 0.26, MAT.concrete, { y: 0.08, z: 0.14, cast: false, receive: true });
    // bar door + noren + lamp
    addDoor(fB, { x: 0.55, y: 0.98, w: 0.8, h: 1.9, warm: true, mat: MAT.doorWood });
    addNoren(fB, {
      x: 0.55,
      y: 2.14,
      w: 0.28,
      h: 0.4,
      z: 0.14,
      texs: [TEX.barNoren0, TEX.barNoren1, TEX.barNoren2],
    });
    D.lampGlow(fB, { x: 0.55, y: 2.42, z: 0.3, color: 0xff9f9c, housing: true, glow: 1.1, glowOpacity: 0.5, bulbR: 0.07, housingR: 0.1 });
    // shuttered window next to the bar
    addShutter(fB, { x: -1.3, y: 1.2, w: 1.25, h: 1.3 });
    // second floor window
    addWindow(fB, {
      x: -0.9,
      y: 3.92,
      w: 1.05,
      h: 0.92,
      lit: true,
      tex: TEX.warmWin2,
      glow: true,
      glowSize: 2.1,
      glowOpacity: 0.2,
    });
    addWindow(fB, { x: 1.35, y: 3.92, w: 0.75, h: 0.85 });
    addAC(fB, { x: 1.7, y: 2.65, scale: 0.85 });
    addPipe(fB, { x: -1.94, y0: 0.05, y1: 4.8 });
    addPipe(fB, { x: 1.94, y0: 0.05, y1: 4.8 });
    addPot(fB, { x: -1.75, z: 0.28, scale: 0.9, seed: 61 });
    addPot(fB, { x: 1.25, z: 0.26, scale: 0.7, seed: 62 });
    // sign board above the bar door
    D.signPanel(fB, TEX.snackSign, 0.34, 0.9, { x: -0.25, y: 2.55, z: 0.05, depth: 0.06, backingColor: 0x120a16 });
    // gabled tiled roof (ridge along z)
    const rSlope = Math.atan2(1.15, 1.125);
    const rLen = Math.hypot(1.125, 1.15) + 0.24;
    D.box(B.g, rLen, 0.11, 4.36, MAT.roofTileDark, { x: 0.56, y: 5.525, rz: -rSlope, cast: true, receive: true });
    D.box(B.g, rLen, 0.11, 4.36, MAT.roofTileDark, { x: -0.56, y: 5.525, rz: rSlope, cast: true, receive: true });
    // gable infill triangles at both ends
    for (const zz of [1, -1]) {
      D.mesh(new T.ShapeGeometry(triShape(2.25, 1.15)), MAT.wallB, {
        y: 4.95,
        z: zz * 2.0,
        cast: false,
        receive: true,
        parent: B.g,
      });
    }
    D.cyl(B.g, 0.09, 0.09, 4.5, 7, MAT.roofFascia, { y: 6.18, rx: HP, cast: true });
    flat(B.g, 0.14, 0.2, 4.3, MAT.roofFascia, { x: -1.16, y: 4.85, cast: false });
    flat(B.g, 0.14, 0.2, 4.3, MAT.roofFascia, { x: 1.16, y: 4.85, cast: false });
    addAntenna(B.g, { x: 0.4, y: 6.2, z: -1.1, h: 1.9, w: 0.9 });
    D.cyl(B.g, 0.07, 0.08, 0.7, 5, MAT.metalDark, { x: -0.6, y: 5.6, z: 1.2, cast: false });
    // back (east) side
    const bB = B.back;
    flat(bB, 4.0, 4.95, 0.06, MAT.wallBack, { y: 2.47, z: -0.03, cast: false, receive: true });
    addWindow(bB, { x: -1.2, y: 3.7, w: 0.8, h: 0.9, cool: true });
    addWindow(bB, { x: 1.2, y: 1.7, w: 0.7, h: 0.8 });
    addAC(bB, { x: 1.55, y: 2.75, scale: 0.8 });
    addPipe(bB, { x: -1.92, y0: 0.05, y1: 4.8 });
    bx(bB, 0.5, 0.32, 0.36, MAT.woodPanel, { x: 0.3, y: 0.16, z: 0.3, cast: true, receive: true });
    bx(bB, 0.46, 0.3, 0.32, MAT.woodPanel, { x: 0.3, y: 0.46, z: 0.3, cast: true, receive: true });
    D.lampGlow(bB, { x: -1.4, y: 2.3, z: 0.22, color: 0xffb877, housing: true, glow: 0.9, glowOpacity: 0.3, bulbR: 0.055, housingR: 0.08 });

    /* ---------------- building C : cyan-lit closed shop ---------------- */
    const C = rowShell(layer, 2.35, 3.3, 4.25, MAT.wallC);
    const fC = C.face;
    flat(fC, 3.3, 0.36, 0.1, MAT.stoneBase, { y: 0.18, z: 0.04, cast: false, receive: true });
    flat(fC, 3.2, 0.16, 0.26, MAT.concrete, { y: 0.08, z: 0.14, cast: false, receive: true });
    // closed roller shutter
    addShutter(fC, { x: 0.25, y: 1.08, w: 2.1, h: 1.72 });
    // cyan sign above the shutter
    D.signPanel(fC, TEX.cyanSign, 1.95, 0.56, { x: 0.25, y: 2.48, z: 0.06, depth: 0.08, backingColor: 0x061017 });
    // closed plate + small window
    D.plane(fC, 0.42, 0.21, D.basic(0xffffff, { map: TEX.closedPlate }), {
      x: 1.24,
      y: 1.55,
      z: 0.07,
      cast: false,
      receive: false,
    }).userData.noOutline = true;
    addWindow(fC, { x: -1.2, y: 1.8, w: 0.62, h: 0.72, cool: true });
    addWindow(fC, { x: -1.2, y: 3.35, w: 0.68, h: 0.78, cool: true });
    addAC(fC, { x: 1.28, y: 3.1, scale: 0.8 });
    addPipe(fC, { x: -1.52, y0: 0.05, y1: 4.1 });
    addPipe(fC, { x: 1.52, y0: 0.05, y1: 4.1 });
    addPot(fC, { x: -1.2, z: 0.3, scale: 0.85, seed: 71 });
    addPot(fC, { x: 0.85, z: 0.28, scale: 0.7, seed: 72 });
    // cyan neon tube under the eave
    D.neonTube(layer, new T.Vector3(10.52, 2.86, 1.0), new T.Vector3(10.52, 2.86, 3.7), 0.018, 0x6ce9ff);
    const cyanGlow = D.glowSprite(layer, { x: 10.4, y: 2.5, z: 2.5, color: 0x62e8ff, size: 3.0, opacity: 0.3 });
    anim.push({ o: cyanGlow, base: 0.3, amp: 0.06, speed: 3.4, phase: 1.2 });
    D.lightPool(layer, { x: 9.95, z: 2.5, w: 2.4, l: 3.6, color: 0x6ce9ff, opacity: 0.16, y: 0.165 });
    // cyan projecting blade sign at the corner (visible from the opening view)
    D.verticalSign(layer, TEX.cyanBlade, 0.42, 1.2, {
      x: 10.18,
      y: 2.35,
      z: 3.62,
      depth: 0.12,
      backingMat: MAT.signBack,
    });
    D.glowSprite(layer, { x: 10.05, y: 2.35, z: 3.9, color: 0x62e8ff, size: 2.4, opacity: 0.32 });
    D.neonTube(layer, new T.Vector3(10.06, 1.8, 3.42), new T.Vector3(10.06, 2.95, 3.42), 0.018, 0x6ce9ff);
    D.floorGlow(layer, { x: 10.02, z: 3.5, w: 1.2, l: 2.2, color: 0x6ce9ff, opacity: 0.24, y: 0.166 });
    // roof + parapet + clutter
    flat(C.g, 2.25, 0.14, 3.3, MAT.roofFlat, { y: 4.32, cast: false, receive: true });
    for (const s of [-1, 1]) {
      flat(C.g, 2.25, 0.44, 0.16, MAT.wallC, { y: 4.55, z: s * 1.58, cast: true, receive: true });
      flat(C.g, 0.16, 0.44, 3.3, MAT.wallC, { x: s * 1.05, y: 4.55, cast: true, receive: true });
    }
    addTank(C.g, { x: -0.4, y: 4.4, z: -0.4, });
    addAntenna(C.g, { x: -0.1, y: 4.4, z: 1.1, h: 1.8, w: 0.85 });
    D.cyl(C.g, 0.06, 0.08, 0.6, 5, MAT.metalDark, { x: 0.6, y: 4.6, z: -0.9, cast: false });
    // south end (faces the opening camera)
    const eC = C.endS;
    flat(eC, 2.25, 4.25, 0.07, MAT.wallC, { y: 2.12, z: -0.03, cast: false, receive: true });
    flat(eC, 2.05, 0.3, 0.1, MAT.stoneBase, { y: 0.15, z: 0.04, cast: false, receive: true });
    addShutter(eC, { x: 0.2, y: 1.02, w: 1.55, h: 1.6 });
    D.signPanel(eC, TEX.cyanSign, 1.7, 0.48, { x: 0.08, y: 2.42, z: 0.06, depth: 0.08, backingColor: 0x061017 });
    D.plane(eC, 0.36, 0.18, D.basic(0xffffff, { map: TEX.closedPlate }), {
      x: 0.2,
      y: 1.3,
      z: 0.1,
      cast: false,
      receive: false,
    }).userData.noOutline = true;
    addWindow(eC, { x: -0.72, y: 3.35, w: 0.6, h: 0.66, cool: true });
    addAC(eC, { x: 0.82, y: 3.3, scale: 0.7 });
    addPipe(eC, { x: 1.02, y0: 0.05, y1: 4.1 });
    addPot(eC, { x: -0.9, z: 0.3, scale: 0.8, seed: 73 });
    D.lightPool(eC, { x: 0.3, z: 0.7, w: 1.8, l: 1.8, color: 0x6ce9ff, opacity: 0.14, y: 0.165 });
    // back (east) side of C
    const bC = C.back;
    flat(bC, 3.3, 4.25, 0.06, MAT.wallBack, { y: 2.12, z: -0.03, cast: false, receive: true });
    addDoor(bC, { x: -1.0, y: 0.98, w: 0.76, h: 1.9, mat: MAT.doorDark });
    addWindow(bC, { x: 1.1, y: 3.4, w: 0.7, h: 0.8, cool: true });
    addAC(bC, { x: 1.45, y: 2.5, scale: 0.75 });
    addPipe(bC, { x: -1.55, y0: 0.05, y1: 4.1 });
    for (let i = 0; i < 3; i++) {
      bx(bC, 0.52, 0.24, 0.4, MAT.woodPanel, { x: 0.2 + i * 0.1, y: 0.12 + i * 0.25, z: 0.3, cast: true, receive: true });
    }
    D.lampGlow(bC, { x: -0.95, y: 2.32, z: 0.2, color: 0xffb877, housing: true, glow: 0.85, glowOpacity: 0.28, bulbR: 0.05, housingR: 0.08 });

    /* ---- the magenta blade sign スナック星屑  ~ (10.0, 3.0, -0.6) ----
       shifted slightly west of the facade so the far-row roofline never cuts
       it off from the opening SE camera; it hangs over the far walk. */
    D.verticalSign(layer, TEX.snackSign, 0.62, 1.9, {
      x: 9.32,
      y: 3.2,
      z: -0.6,
      depth: 0.15,
      backingMat: MAT.signBackNeon,
    });
    D.neonTube(layer, new T.Vector3(9.0, 2.22, -0.5), new T.Vector3(9.0, 4.18, -0.5), 0.024, 0xff5b9d);
    D.neonTube(layer, new T.Vector3(9.64, 2.22, -0.5), new T.Vector3(9.64, 4.18, -0.5), 0.024, 0xff5b9d);
    const pinkTop = D.glowSprite(layer, { x: 9.32, y: 3.2, z: -0.16, color: 0xff5b9d, size: 4.4, opacity: 0.42 });
    const pinkGlow = D.glowSprite(layer, { x: 9.32, y: 3.2, z: -0.34, color: 0xff5b9d, size: 2.4, opacity: 0.55 });
    const pinkGlowB = D.glowSprite(layer, { x: 9.32, y: 3.2, z: -0.9, color: 0xff5b9d, size: 1.8, opacity: 0.2 });
    anim.push({ o: pinkGlow, base: 0.55, amp: 0.08, speed: 3.2, phase: 0.7 });
    anim.push({ o: pinkGlowB, base: 0.2, amp: 0.04, speed: 3.2, phase: 0.2 });
    D.neonTube(layer, new T.Vector3(9.0, 2.14, -0.62), new T.Vector3(9.64, 2.14, -0.62), 0.022, 0xff5b9d);
    // support arm back to the snack bar facade
    flat(layer, 1.34, 0.055, 0.055, MAT.metalDark, { x: 9.96, y: 4.2, z: -0.6, cast: false });
    flat(layer, 0.05, 0.5, 0.05, MAT.metalDark, { x: 9.36, y: 4.4, z: -0.6, cast: false });
    D.floorGlow(layer, { x: 9.55, z: -0.6, w: 1.7, l: 3.8, color: 0xff5b9d, opacity: 0.34, y: 0.166 });
    D.lightPool(layer, { x: 9.7, z: -0.6, w: 2.9, l: 3.9, color: 0xff5b9d, opacity: 0.2, y: 0.165 });

    /* ---- corner blade of the same snack bar, facing the opening SE view ----
       Projecting from the far row near z=3.1 so its SOUTH face (normal +Z)
       reads straight at the default camera. This is the neon accent for the
       hero view; the original bar sign above stays at (10, 3, -0.6). */
    D.verticalSign(layer, TEX.snackSign, 0.68, 1.9, {
      x: 9.98,
      y: 3.06,
      z: 3.08,
      ry: 0,
      depth: 0.15,
      backingMat: MAT.signBackNeon,
    });
    flat(layer, 0.9, 0.05, 0.05, MAT.metalDark, { x: 10.42, y: 4.06, z: 3.08, cast: false });
    flat(layer, 0.05, 0.5, 0.05, MAT.metalDark, { x: 10.05, y: 4.26, z: 3.08, cast: false });
    D.neonTube(layer, new T.Vector3(9.62, 2.1, 3.18), new T.Vector3(9.62, 4.02, 3.18), 0.024, 0xff5b9d);
    D.neonTube(layer, new T.Vector3(10.34, 2.1, 3.18), new T.Vector3(10.34, 4.02, 3.18), 0.024, 0xff5b9d);
    D.neonTube(layer, new T.Vector3(9.62, 4.02, 3.18), new T.Vector3(10.34, 4.02, 3.18), 0.024, 0xff8fc0);
    D.neonTube(layer, new T.Vector3(9.62, 2.1, 3.18), new T.Vector3(10.34, 2.1, 3.18), 0.024, 0xff8fc0);
    const pinkCorner = D.glowSprite(layer, { x: 9.98, y: 3.06, z: 3.4, color: 0xff5b9d, size: 4.6, opacity: 0.48 });
    anim.push({ o: pinkCorner, base: 0.48, amp: 0.07, speed: 2.7, phase: 1.4 });
    D.floorGlow(layer, { x: 9.9, z: 3.2, w: 1.9, l: 3.6, color: 0xff5b9d, opacity: 0.38, y: 0.166 });
    D.lightPool(layer, { x: 9.95, z: 3.2, w: 2.9, l: 3.4, color: 0xff5b9d, opacity: 0.22, y: 0.165 });

    /* cyan accent lantern at the far-row south corner (paired with the
       laundry shop's cyan light) */
    D.lampGlow(layer, {
      x: 10.42,
      y: 2.72,
      z: 3.86,
      color: 0x6ce9ff,
      housing: true,
      glow: 1.9,
      glowOpacity: 0.5,
      bulbR: 0.11,
      housingR: 0.15,
    });
    flat(layer, 0.3, 0.05, 0.05, MAT.metalDark, { x: 10.55, y: 2.95, z: 3.86, cast: false });
    D.floorGlow(layer, { x: 10.15, z: 3.8, w: 1.1, l: 2.0, color: 0x6ce9ff, opacity: 0.24, y: 0.166 });
    // small pink noren curtain over the bar door (from far row facade)
    // (already added noren above)
  }

  /* =========================================================
     4) BACK HOUSES — small Japanese houses behind the yard
     z -8.8..-12.8, x -12.8..8.5
     ========================================================= */
  function addHouse(layer, o) {
    const g = grp(layer, o.x, 0, o.z, o.ry || 0);
    const w = o.w;
    const d = o.d;
    const h = o.h;
    const roofH = o.roofH || 1.0;
    const wallMat = o.wallMat || MAT.wallHouse1;
    const roofMat = o.roofMat || MAT.roofTileBrown;
    bx(g, w, h, d, wallMat, { y: h / 2, cast: true, receive: true });
    flat(g, w + 0.06, 0.2, d + 0.06, MAT.stoneBase, { y: 0.1, cast: false, receive: true });
    const slope = Math.atan2(roofH, d / 2);
    const slabLen = Math.hypot(d / 2, roofH) + 0.26;
    D.box(g, w + 0.5, 0.11, slabLen, roofMat, { y: h + roofH / 2 - 0.02, z: d / 4, rx: slope, cast: true, receive: true });
    D.box(g, w + 0.5, 0.11, slabLen, roofMat, { y: h + roofH / 2 - 0.02, z: -d / 4, rx: -slope, cast: true, receive: true });
    D.cyl(g, 0.09, 0.09, w + 0.5, 6, MAT.roofFascia, { y: h + roofH + 0.01, rz: HP, cast: true });
    // gable infill ends
    const tri = new T.ShapeGeometry(triShape(d, roofH));
    D.mesh(tri, wallMat, { x: w / 2, y: h, ry: HP, cast: false, receive: true, parent: g });
    D.mesh(tri, wallMat, { x: -w / 2, y: h, ry: -HP, cast: false, receive: true, parent: g });
    // eave fascia front / back
    flat(g, w + 0.5, 0.11, 0.09, MAT.roofFascia, { y: h - 0.04, z: d / 2 + 0.18, cast: false });
    flat(g, w + 0.5, 0.11, 0.09, MAT.roofFascia, { y: h - 0.04, z: -d / 2 - 0.18, cast: false });
    return g;
  }

  function buildBackHouses(layer) {
    /* ---------------- houses ---------------- */
    const H1 = addHouse(layer, {
      x: -10.5,
      z: -10.7,
      w: 3.6,
      d: 3.4,
      h: 2.75,
      roofH: 1.0,
      wallMat: MAT.wallHouse1,
      roofMat: MAT.roofTileBrown,
    });
    const f1 = facade(H1, 0, 0, 1.7, 0);
    addWindow(f1, { x: 0.65, y: 1.55, w: 0.8, h: 0.75, lit: true, tex: TEX.shoji, glow: true, glowSize: 1.6, glowOpacity: 0.16 });
    addWindow(f1, { x: -0.75, y: 1.6, w: 0.7, h: 0.7 });
    addDoor(f1, { x: 1.35, y: 0.9, w: 0.7, h: 1.7, warm: true, mat: MAT.doorWood });
    addPot(f1, { x: 0.1, z: 0.24, scale: 0.72, seed: 81 });
    addAC(f1, { x: -1.3, y: 2.2, scale: 0.7 });
    addPipe(f1, { x: 1.62, y0: 0.05, y1: 2.9 });
    const b1 = facade(H1, 0, 0, -1.7, PI);
    addWindow(b1, { x: 0.2, y: 1.6, w: 0.7, h: 0.65, lit: true, tex: TEX.coolWin, glow: true, glowColor: 0x8fd8ff, glowSize: 1.2, glowOpacity: 0.1 });
    addPipe(b1, { x: -1.4, y0: 0.05, y1: 2.9 });
    addAntenna(H1, { x: 0.5, y: 3.7, z: -0.7, h: 1.7, w: 0.8 });

    const H2 = addHouse(layer, {
      x: -5.7,
      z: -10.85,
      w: 4.3,
      d: 3.3,
      h: 2.55,
      roofH: 0.95,
      wallMat: MAT.wallHouse2,
      roofMat: MAT.roofTileDark,
    });
    const f2 = facade(H2, 0, 0, 1.65, 0);
    addWindow(f2, { x: -0.9, y: 1.5, w: 0.9, h: 0.8, lit: true, tex: TEX.warmWin2, glow: true, glowSize: 1.7, glowOpacity: 0.16 });
    addWindow(f2, { x: 1.1, y: 1.55, w: 0.75, h: 0.7 });
    addDoor(f2, { x: 0.3, y: 0.85, w: 0.66, h: 1.6, mat: MAT.doorDark });
    addAC(f2, { x: 1.8, y: 2.2, scale: 0.65 });
    addPipe(f2, { x: -2.0, y0: 0.05, y1: 2.7 });
    addPot(f2, { x: 1.65, z: 0.24, scale: 0.66, seed: 82 });
    D.cyl(H2, 0.04, 0.05, 0.9, 5, MAT.metalDark, { x: 0.9, y: 3.4, z: 0.9, cast: false });
    const b2 = facade(H2, 0, 0, -1.65, PI);
    addWindow(b2, { x: -0.8, y: 1.55, w: 0.7, h: 0.65, lit: true, tex: TEX.shoji, glow: true, glowSize: 1.3, glowOpacity: 0.12 });
    addWindow(b2, { x: 1.1, y: 1.5, w: 0.65, h: 0.6 });
    addPipe(b2, { x: -1.85, y0: 0.05, y1: 2.7 });
    addAC(b2, { x: 1.65, y: 2.1, scale: 0.6 });

    const H3 = addHouse(layer, {
      x: -0.8,
      z: -10.7,
      w: 4.0,
      d: 3.3,
      h: 3.1,
      roofH: 1.05,
      wallMat: MAT.wallHouse3,
      roofMat: MAT.roofTileBrown,
    });
    const f3 = facade(H3, 0, 0, 1.65, 0);
    addWindow(f3, { x: -1.15, y: 2.1, w: 0.85, h: 0.8, lit: true, tex: TEX.warmWin, glow: true, glowSize: 1.9, glowOpacity: 0.18 });
    addWindow(f3, { x: 0.85, y: 2.15, w: 0.8, h: 0.78, lit: true, tex: TEX.shoji, glow: true, glowSize: 1.6, glowOpacity: 0.15 });
    addBalcony(f3, { x: -0.1, y: 1.35, w: 2.0, depth: 0.45 });
    addDoor(f3, { x: 1.55, y: 0.9, w: 0.68, h: 1.7, warm: true, mat: MAT.doorWood });
    addAC(f3, { x: 1.85, y: 2.4, scale: 0.7 });
    addPipe(f3, { x: -1.82, y0: 0.05, y1: 3.3 });
    addTank(H3, { x: -0.5, y: 4.2, z: 0.6 });
    addAntenna(H3, { x: 1.0, y: 4.2, z: -0.9, h: 1.6, w: 0.75 });
    const b3 = facade(H3, 0, 0, -1.65, PI);
    addWindow(b3, { x: 0.4, y: 2.1, w: 0.75, h: 0.7, lit: true, tex: TEX.warmWin2, glow: true, glowSize: 1.5, glowOpacity: 0.13 });
    addWindow(b3, { x: -1.1, y: 2.1, w: 0.7, h: 0.65 });
    addPipe(b3, { x: 1.55, y0: 0.05, y1: 3.3 });
    D.cyl(b3, 0.18, 0.18, 0.5, 8, MAT.metalDark, { x: -1.6, y: 0.25, z: 0.2, cast: true });

    /* taller narrow apartment for skyline variation */
    const H4 = grp(layer, 3.6, 0, -10.9);
    bx(H4, 3.0, 5.3, 3.2, MAT.wallHouse2, { y: 2.65, cast: true, receive: true });
    flat(H4, 3.06, 0.2, 3.26, MAT.stoneBase, { y: 0.1, cast: false, receive: true });
    flat(H4, 3.0, 0.16, 3.2, MAT.roofFlat, { y: 5.38, cast: false, receive: true });
    for (const s of [-1, 1]) {
      flat(H4, 3.0, 0.4, 0.14, MAT.wallHouse2, { y: 5.58, z: s * 1.53, cast: true, receive: true });
      flat(H4, 0.14, 0.4, 3.2, MAT.wallHouse2, { x: s * 1.43, y: 5.58, cast: true, receive: true });
    }
    const f4 = facade(H4, 0, 0, 1.6, 0);
    for (let i = 0; i < 3; i++) {
      const yy = 1.35 + i * 1.55;
      addWindow(f4, {
        x: -0.55,
        y: yy,
        w: 0.95,
        h: 0.9,
        lit: i === 2,
        tex: TEX.warmWin2,
        cool: i !== 2,
        glow: i === 2,
        glowSize: 1.6,
        glowOpacity: 0.16,
      });
      addBalcony(f4, { x: 0.15, y: yy - 0.55, w: 1.55, depth: 0.38 });
    }
    addDoor(f4, { x: 0.95, y: 0.95, w: 0.62, h: 1.8, mat: MAT.doorDark });
    addAC(f4, { x: 1.05, y: 2.6, scale: 0.65 });
    addPipe(f4, { x: -1.35, y0: 0.05, y1: 5.2 });
    addAntenna(H4, { x: 0.7, y: 5.4, z: -0.8, h: 1.8, w: 0.8 });
    const b4 = facade(H4, 0, 0, -1.6, PI);
    addWindow(b4, { x: 0.2, y: 3.9, w: 0.8, h: 0.8, lit: true, tex: TEX.warmWin2, glow: true, glowSize: 1.5, glowOpacity: 0.12 });
    addWindow(b4, { x: 0.2, y: 2.2, w: 0.8, h: 0.8 });
    addPipe(b4, { x: 1.25, y0: 0.05, y1: 5.2 });

    /* low house at the right end */
    const H5 = addHouse(layer, {
      x: 6.9,
      z: -10.6,
      w: 2.7,
      d: 3.1,
      h: 2.5,
      roofH: 0.9,
      wallMat: MAT.wallHouse1,
      roofMat: MAT.roofTileDark,
    });
    const f5 = facade(H5, 0, 0, 1.55, 0);
    addWindow(f5, { x: 0.3, y: 1.45, w: 0.8, h: 0.7, lit: true, tex: TEX.warmWin, glow: true, glowSize: 1.4, glowOpacity: 0.14 });
    addDoor(f5, { x: -0.85, y: 0.85, w: 0.6, h: 1.6, mat: MAT.doorWood });
    addAC(f5, { x: 1.05, y: 2.1, scale: 0.6 });
    addPipe(f5, { x: -1.28, y0: 0.05, y1: 2.6 });
    addAntenna(H5, { x: 0.2, y: 3.4, z: 0, h: 1.5, w: 0.7 });

    /* ---------------- yard fence, gates, greenery ---------------- */
    addFence(layer, { x: -7.4, z: -8.84, len: 2.9, h: 1.05, kind: 'wood', ry: 0 });
    addFence(layer, { x: -4.55, z: -8.84, len: 2.5, h: 1.25, kind: 'metal', ry: 0 });
    addFence(layer, { x: -1.9, z: -8.84, len: 2.4, h: 1.1, kind: 'wood', ry: 0 });
    addFence(layer, { x: 1.4, z: -8.84, len: 3.2, h: 1.55, kind: 'wood', ry: 0 });
    addFence(layer, { x: 4.4, z: -8.84, len: 2.5, h: 1.3, kind: 'metal', ry: 0 });
    // gate posts + low hedge clumps at the yard edge
    addPot(layer, { x: -3.1, z: -8.7, scale: 0.8, seed: 91 });
    addPot(layer, { x: 1.6, z: -8.66, scale: 0.9, seed: 92 });
    D.foliage(layer, { x: 6.4, y: 0.2, z: -9.2, r: 0.55, count: 3, spread: 1.1, rise: 0.6, seed: 93 });
    D.foliage(layer, { x: -8.4, y: 0.2, z: -9.15, r: 0.5, count: 3, spread: 1.0, rise: 0.55, seed: 94 });

    /* ---------------- trees ---------------- */
    addTree(layer, { x: -8.7, z: -12.2, h: 5.3, r: 1.35, count: 5, spread: 1.9, seed: 95, colors: [0x14352e, 0x1c463c, 0x245748] });
    addTree(layer, { x: -3.2, z: -12.45, h: 4.5, r: 1.15, count: 4, spread: 1.6, seed: 96, colors: [0x16382f, 0x204a3f, 0x2a5a4a] });
    addTree(layer, { x: 1.7, z: -12.35, h: 5.0, r: 1.25, count: 4, spread: 1.7, seed: 97, colors: [0x14352e, 0x1c463c, 0x245748] });
    addTree(layer, { x: 5.9, z: -12.4, h: 4.4, r: 1.1, count: 4, spread: 1.5, seed: 98, colors: [0x173b33, 0x1f4a3f, 0x285c4c] });
    addTree(layer, { x: 7.9, z: -12.0, h: 3.8, r: 0.9, count: 3, spread: 1.2, seed: 99 });

    /* small sheds / clutter in the yard */
    bx(layer, 1.2, 1.6, 1.0, MAT.wallShed, { x: -8.35, y: 0.8, z: -8.0, cast: true, receive: true });
    flat(layer, 1.4, 0.09, 1.2, MAT.roofFascia, { x: -8.35, y: 1.66, z: -8.0, rx: 0.08, cast: true });
    bx(layer, 0.34, 0.4, 0.3, MAT.metalDark, { x: 3.0, y: 0.2, z: -8.35, cast: true });
    bx(layer, 0.34, 0.4, 0.3, MAT.metalDark, { x: 3.45, y: 0.2, z: -8.35, cast: true });
    // meter boxes on house walls
    flat(layer, 0.3, 0.42, 0.14, MAT.metalDark, { x: -9.0, y: 1.9, z: -9.05, cast: false });
    flat(layer, 0.3, 0.42, 0.14, MAT.metalDark, { x: -4.1, y: 1.85, z: -9.25, cast: false });
  }

  /* =========================================================
     5) FOREGROUND — low concrete wall + hedge + street trees
     z ~ 12.4 (does not block the store view)
     ========================================================= */
  function buildForeground(layer) {
    /* long low wall with posts + cap */
    bx(layer, 24.6, 0.72, 0.32, MAT.concreteLong, { x: 0, y: 0.36, z: 12.35, cast: true, receive: true });
    flat(layer, 24.9, 0.1, 0.44, MAT.concreteCap, { x: 0, y: 0.77, z: 12.35, cast: true, receive: true });
    const postXs = [-12.2, -8.1, -4.0, 0.1, 4.2, 8.3, 12.2];
    for (const px of postXs) {
      bx(layer, 0.18, 0.92, 0.42, MAT.concrete, { x: px, y: 0.46, z: 12.35, cast: true, receive: true });
      flat(layer, 0.26, 0.08, 0.5, MAT.concreteCap, { x: px, y: 0.95, z: 12.35, cast: false });
    }
    // damp / moss along the wall base
    flat(layer, 24.4, 0.16, 0.36, MAT.hedge, { x: 0, y: 0.1, z: 12.35, cast: false, receive: false }).userData.noOutline = true;
    // hedge behind the wall
    bx(layer, 20.8, 1.0, 0.6, MAT.hedge, { x: -0.4, y: 0.5, z: 12.72, cast: true, receive: true });
    bx(layer, 15.0, 0.5, 0.5, MAT.hedgeLight, { x: 1.2, y: 1.06, z: 12.72, cast: true, receive: true });
    D.foliage(layer, { x: -9.5, y: 1.0, z: 12.66, r: 0.6, count: 3, spread: 1.4, rise: 0.5, seed: 201 });
    D.foliage(layer, { x: -3.1, y: 1.0, z: 12.68, r: 0.62, count: 3, spread: 1.5, rise: 0.5, seed: 202 });
    D.foliage(layer, { x: 4.2, y: 1.0, z: 12.68, r: 0.6, count: 3, spread: 1.4, rise: 0.5, seed: 203 });
    D.foliage(layer, { x: 9.6, y: 1.0, z: 12.66, r: 0.55, count: 3, spread: 1.3, rise: 0.45, seed: 204 });

    /* three stylised street trees framing the opening view */
    addTree(layer, {
      x: -11.55,
      z: 12.15,
      h: 5.2,
      r: 1.3,
      count: 5,
      spread: 1.9,
      seed: 211,
      colors: [0x153a32, 0x1e4a3e, 0x2a5e4e],
    });
    addTree(layer, {
      x: -4.9,
      z: 12.1,
      h: 4.4,
      r: 1.05,
      count: 4,
      spread: 1.6,
      seed: 212,
      colors: [0x14352e, 0x1c463c, 0x275849],
    });
    addTree(layer, {
      x: 11.35,
      z: 12.1,
      h: 4.9,
      r: 1.2,
      count: 4,
      spread: 1.7,
      seed: 213,
      colors: [0x153a32, 0x1f4a3d, 0x285a49],
    });
    // low shrub row in front of the wall
    D.foliage(layer, { x: -7.4, y: 0.32, z: 12.02, r: 0.32, count: 3, spread: 1.2, rise: 0.25, seed: 214 });
    D.foliage(layer, { x: 2.2, y: 0.32, z: 12.02, r: 0.3, count: 3, spread: 1.1, rise: 0.22, seed: 215 });

    /* a tiny warm garden lamp behind the hedge */
    bx(layer, 0.12, 0.5, 0.12, MAT.metalDark, { x: -1.6, y: 0.25, z: 12.55, cast: false });
    D.sphere(layer, 0.1, 8, 6, MAT.glowWarm, { x: -1.6, y: 0.58, z: 12.55, cast: false });
    D.glowSprite(layer, { x: -1.6, y: 0.6, z: 12.55, color: 0xffc07a, size: 1.2, opacity: 0.3 });
    D.lightPool(layer, { x: -1.6, z: 11.95, w: 2.0, l: 1.6, color: 0xffb168, opacity: 0.14, y: 0.158 });
  }

  /* =========================================================
     6) LEFT STRIP — low wall + service garden (x -13..-11.2)
     ========================================================= */
  function buildLeftStrip(layer) {
    /* boundary wall */
    bx(layer, 0.3, 0.86, 24.7, MAT.concreteLong, { x: -12.55, y: 0.43, z: -0.15, cast: true, receive: true });
    flat(layer, 0.44, 0.1, 24.9, MAT.concreteCap, { x: -12.55, y: 0.9, z: -0.15, cast: true, receive: true });
    const zs = [-12.1, -8.2, -4.3, -0.4, 3.5, 7.4, 11.3];
    for (const pz of zs) {
      bx(layer, 0.44, 1.02, 0.18, MAT.concrete, { x: -12.55, y: 0.51, z: pz, cast: true, receive: true });
      flat(layer, 0.52, 0.08, 0.26, MAT.concreteCap, { x: -12.55, y: 1.05, z: pz, cast: false });
    }
    // ivy / moss on the inside of the wall
    D.foliage(layer, { x: -12.38, y: 0.55, z: 5.2, r: 0.35, count: 3, spread: 1.5, rise: 0.4, seed: 221 });
    D.foliage(layer, { x: -12.35, y: 0.5, z: -9.4, r: 0.32, count: 3, spread: 1.2, rise: 0.35, seed: 222 });

    /* gravel service strip */
    const gv = D.plane(layer, 1.18, 24.6, MAT.gravel, {
      x: -11.87,
      y: 0.045,
      z: -0.15,
      rx: -HP,
      cast: false,
      receive: true,
    });
    gv.userData.noOutline = true;

    /* lean-to shed against the cafe west wall */
    bx(layer, 0.95, 1.9, 2.3, MAT.wallShed, { x: -11.72, y: 0.95, z: -5.7, cast: true, receive: true });
    const shedRoof = D.box(layer, 1.2, 0.09, 2.5, MAT.roofFascia, {
      x: -11.68,
      y: 1.96,
      z: -5.7,
      rz: 0.12,
      cast: true,
      receive: true,
    });
    shedRoof.rotation.z = -0.12;
    bx(layer, 0.62, 0.9, 0.75, MAT.metalDark, { x: -11.75, y: 0.45, z: -2.4, cast: true, receive: true });
    flat(layer, 0.66, 0.06, 0.8, MAT.metal, { x: -11.75, y: 0.93, z: -2.4, cast: false });

    /* shelf rack with pipes / crates */
    for (let i = 0; i < 2; i++) {
      bx(layer, 0.08, 1.5, 0.08, MAT.metalDark, { x: -11.85 + i * 0.55, y: 0.75, z: 0.9, cast: false });
    }
    flat(layer, 0.68, 0.05, 0.5, MAT.metalDark, { x: -11.58, y: 0.72, z: 0.9, cast: false });
    flat(layer, 0.68, 0.05, 0.5, MAT.metalDark, { x: -11.58, y: 1.28, z: 0.9, cast: false });
    bx(layer, 0.5, 0.3, 0.36, MAT.woodPanel, { x: -11.6, y: 0.9, z: 0.9, cast: true });
    bx(layer, 0.4, 0.28, 0.32, MAT.bin, { x: -11.55, y: 1.47, z: 0.9, cast: true });

    /* bins, crates, gas cylinders, plants down the strip */
    D.cyl(layer, 0.2, 0.18, 0.72, 10, MAT.bin, { x: -11.95, y: 0.36, z: 3.4, cast: true });
    D.cyl(layer, 0.22, 0.22, 0.06, 10, MAT.metalDark, { x: -11.95, y: 0.75, z: 3.4, cast: false });
    D.cyl(layer, 0.2, 0.18, 0.72, 10, MAT.bin, { x: -11.45, y: 0.36, z: 3.6, cast: true });
    D.cyl(layer, 0.22, 0.22, 0.06, 10, MAT.metalDark, { x: -11.45, y: 0.75, z: 3.6, cast: false });
    bx(layer, 0.48, 0.32, 0.4, MAT.woodPanel, { x: -11.9, y: 0.16, z: 4.8, cast: true });
    bx(layer, 0.48, 0.32, 0.4, MAT.woodPanel, { x: -11.9, y: 0.48, z: 4.8, cast: true });
    bx(layer, 0.44, 0.3, 0.36, MAT.woodPanel, { x: -11.35, y: 0.15, z: 4.9, cast: true });
    for (let i = 0; i < 2; i++) {
      D.cyl(layer, 0.15, 0.15, 0.85, 10, MAT.metal, { x: -11.9 + i * 0.4, y: 0.43, z: 6.0 + i * 0.05, cast: true });
      D.cyl(layer, 0.05, 0.05, 0.12, 6, MAT.metalDark, { x: -11.9 + i * 0.4, y: 0.9, z: 6.0 + i * 0.05, cast: false });
    }
    addPot(layer, { x: -11.75, z: 7.4, scale: 1.0, seed: 231 });
    addPot(layer, { x: -11.5, z: 8.4, scale: 0.8, seed: 232 });
    addPot(layer, { x: -11.9, z: 10.6, scale: 0.9, seed: 233 });
    D.foliage(layer, { x: -11.7, y: 0.25, z: 9.6, r: 0.4, count: 3, spread: 1.0, rise: 0.45, seed: 234 });

    /* small tree / shrubs behind the wall */
    addTree(layer, { x: -12.05, z: 9.7, h: 3.6, r: 0.85, count: 3, spread: 1.1, seed: 235 });
    addTree(layer, { x: -12.0, z: -11.3, h: 4.4, r: 1.0, count: 4, spread: 1.3, seed: 236 });
    D.foliage(layer, { x: -12.2, y: 0.3, z: -12.4, r: 0.5, count: 3, spread: 1.1, rise: 0.5, seed: 237 });

    /* cafe west wall details facing the strip */
    const wf = facade(layer, -11.2, 0, 0, -HP);
    addWindow(wf, {
      x: -0.5,
      y: 4.3,
      w: 0.85,
      h: 0.95,
      lit: true,
      tex: TEX.warmWin,
      glow: true,
      glowSize: 1.7,
      glowOpacity: 0.16,
    });
    addWindow(wf, { x: 2.4, y: 1.9, w: 0.8, h: 0.85 });
    addPipe(wf, { x: 3.4, y0: 0.05, y1: 5.35 });
    addAC(wf, { x: 1.6, y: 2.65, scale: 0.9 });

    /* the second utility pole (wires from the props pole terminate here) */
    const pole = grp(layer, -11.9, 0, -7.6);
    D.cyl(pole, 0.16, 0.22, 7.6, 9, MAT.metal, { y: 3.8, cast: true });
    for (let i = 0; i < 2; i++) {
      flat(pole, 1.5 - i * 0.35, 0.1, 0.1, MAT.metalDark, { y: 6.6 + i * 0.5, cast: false });
      for (let j = 0; j < 3; j++) {
        D.cyl(pole, 0.05, 0.06, 0.14, 6, MAT.wallShed, {
          x: -0.62 + j * 0.62,
          y: 6.7 + i * 0.5,
          cast: false,
        });
      }
    }
    D.cyl(pole, 0.3, 0.3, 0.62, 10, MAT.tankDark, { x: 0.34, y: 5.9, cast: true });
    flat(pole, 0.3, 0.46, 0.16, MAT.metalDark, { x: 0.15, y: 3.1, cast: false });
    // little transformer/pole signage
    flat(pole, 0.22, 0.6, 0.05, MAT.metalDark, { x: 0, y: 4.4, z: 0.2, cast: false });
  }

  /* =========================================================
     7) OVERHEAD WIRES / POLE TO POLE
     ========================================================= */
  function buildWires(layer) {
    const poleTop = new T.Vector3(-11.88, 7.15, -7.6);
    // main pole is built by the props module near (4.3, ~7, 1.3)
    wire(layer, new T.Vector3(-11.85, 7.1, -7.75), new T.Vector3(4.3, 6.95, 1.15), 0.62);
    wire(layer, new T.Vector3(-11.7, 7.05, -7.4), new T.Vector3(4.5, 6.9, 1.4), 0.58);
    wire(layer, new T.Vector3(-12.0, 6.6, -7.85), new T.Vector3(4.25, 6.45, 1.05), 0.75);
    // pole to cafe roof
    wire(layer, poleTop, new T.Vector3(-9.1, 6.2, 0.55), 0.28);
    wire(layer, new T.Vector3(-11.8, 6.6, -7.5), new T.Vector3(-10.2, 6.85, -1.2), 0.2);
    // pole to the back apartments / far row roofscape
    wire(layer, new T.Vector3(-11.75, 6.95, -7.85), new T.Vector3(-0.9, 5.9, -12.3), 0.55);
    wire(layer, new T.Vector3(-11.6, 6.7, -7.9), new T.Vector3(3.6, 5.5, -12.4), 0.5);
    wire(layer, new T.Vector3(-11.7, 6.55, -7.7), new T.Vector3(12.0, 6.55, -5.6), 0.7);
    // along the far row rooftops
    wire(layer, new T.Vector3(12.0, 6.5, -7.0), new T.Vector3(12.1, 4.6, 3.6), 0.4);
    wire(layer, new T.Vector3(11.9, 6.2, -6.6), new T.Vector3(12.2, 4.5, 3.2), 0.35);
    // small alley-side service wire from cafe to store roof
    wire(layer, new T.Vector3(-9.02, 3.6, -2.3), new T.Vector3(-6.82, 3.75, -2.45), 0.12, 0x2a2f42, 0.8);

    /* published anchors */
    D.anchors = D.anchors || {};
    D.anchors.cafeSign = new T.Vector3(-8.86, 3.3, 0.2);
    D.anchors.pinkSign = new T.Vector3(10.0, 3.0, -0.6);
    D.anchors.pinkSignCorner = new T.Vector3(9.98, 3.06, 3.08);
    D.anchors.cyanShop = new T.Vector3(10.18, 2.35, 3.62);
    D.anchors.backPole = new T.Vector3(-11.9, 4.0, -7.6);
  }

  /* =========================================================
     static detail batcher
     Hundreds of tiny decorative boxes share only a handful of
     materials; bake them into per-material meshes so the module
     stays cheap to draw while keeping all the geometric detail.
     Animated groups can opt out with userData.noMerge.
     ========================================================= */
  function batchStatic(layer) {
    layer.updateMatrixWorld(true);
    const invRoot = new T.Matrix4().copy(layer.matrixWorld).invert();
    const buckets = new Map();
    const victims = [];
    layer.traverse((o) => {
      if (!o.isMesh || o.userData.isOutline || Array.isArray(o.material)) return;
      let p = o.parent;
      while (p && p !== layer) {
        if (p.userData && p.userData.noMerge) return;
        p = p.parent;
      }
      if (!o.geometry || !o.geometry.attributes || !o.geometry.attributes.position) return;
      if (o.userData.noBatch) return;
      const key =
        o.material.uuid +
        '|' + (o.castShadow ? 1 : 0) +
        '|' + (o.receiveShadow ? 1 : 0) +
        '|' + (o.userData.noOutline ? 1 : 0) +
        '|' + (o.renderOrder | 0);
      let b = buckets.get(key);
      if (!b) {
        b = {
          mat: o.material,
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
      let mesh;
      if (b.geos.length === 1) {
        mesh = new T.Mesh(b.geos[0], b.mat);
      } else {
        let vCount = 0;
        for (const g of b.geos) vCount += g.attributes.position.count;
        const pos = new Float32Array(vCount * 3);
        const nor = new Float32Array(vCount * 3);
        const uv = new Float32Array(vCount * 2);
        let po = 0;
        let no = 0;
        let uo = 0;
        for (const g of b.geos) {
          pos.set(g.attributes.position.array, po);
          po += g.attributes.position.array.length;
          if (g.attributes.normal) {
            nor.set(g.attributes.normal.array, no);
            no += g.attributes.normal.array.length;
          }
          if (g.attributes.uv) {
            uv.set(g.attributes.uv.array, uo);
            uo += g.attributes.uv.array.length;
          }
          g.dispose();
        }
        const merged = new T.BufferGeometry();
        merged.setAttribute('position', new T.BufferAttribute(pos, 3));
        merged.setAttribute('normal', new T.BufferAttribute(nor, 3));
        merged.setAttribute('uv', new T.BufferAttribute(uv, 2));
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
    return count;
  }

  /* =========================================================
     animation hook (subtle neon / lantern life)
     ========================================================= */
  function startAnim() {
    if (startAnim._done) return;
    startAnim._done = true;
    D.onUpdate((dt, elapsed) => {
      for (let i = 0; i < anim.length; i++) {
        const a = anim[i];
        if (a.o && a.o.material && a.o.isSprite) {
          a.o.material.opacity = a.base + Math.sin(elapsed * a.speed + a.phase) * a.amp;
        }
        if (a.sway) {
          a.o.rotation.z = Math.sin(elapsed * a.speed + a.phase) * a.sway;
          a.o.rotation.x = Math.cos(elapsed * a.speed * 0.8 + a.phase) * a.sway * 0.5;
        }
      }
    });
  }

  /* =========================================================
     main builder
     ========================================================= */
  D.buildBackground = function (layer) {
    if (!inited) {
      makeTextures();
      makeMaterials();
      inited = true;
    }
    anim = [];
    buildCafe(layer);
    buildAlley(layer);
    buildFarRow(layer);
    buildBackHouses(layer);
    buildForeground(layer);
    buildLeftStrip(layer);
    buildWires(layer);
    batchStatic(layer);
    startAnim();
  };
})();
