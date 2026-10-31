/* =========================================================
   星降マート — convenience store builder
   Facade, glass storefront, automatic door, signage, lit
   interior, rooftop clutter and service sides for the
   square-street corner diorama. Owned by store-builder.
   Attaches everything into D.groups.store.
   ========================================================= */
(function () {
  'use strict';

  const D = window.DIORAMA;
  const T = D.T;
  const P = D.palette;

  /* ---------------------------------------------------------
     Footprint / layout constants
     --------------------------------------------------------- */
  const X0 = -6.8;
  const X1 = 1.4;
  const Z0 = -6.2;
  const Z1 = 0.6;
  const W = X1 - X0;
  const DP = Z1 - Z0;
  const CX = (X0 + X1) / 2;
  const CZ = (Z0 + Z1) / 2;
  const FLOOR = D.config.Y.STORE; // 0.19
  const EAVE = 3.45;
  const PARA = 3.72;
  const WT = 0.24; // wall thickness
  const GX0 = X0 + WT;
  const GX1 = X1 - WT;
  const GZ0 = Z0 + WT;
  const GZ1 = Z1 - WT;
  const IW = GX1 - GX0;
  const ID = GZ1 - GZ0;
  const ICX = (GX0 + GX1) / 2;
  const ICZ = (GZ0 + GZ1) / 2;
  const GLASS_B = 0.54;
  const GLASS_T = 2.82;
  const CEIL = 3.0;
  const DOOR_L = -0.92;
  const DOOR_R = 1.0;
  const WIN_L = X0 + 0.36; // -6.44
  const WIN_R = DOOR_L; // -0.92
  const EG_BACK = -4.55; // back edge of east glass
  const EG_FRONT = 0.24; // front edge of east glass
  const FASCIA_Y = 3.34;
  const FASCIA_H = 0.74;

  const rnd = D.rng(31337);

  /* =========================================================
     Textures (all procedural canvas)
     ========================================================= */
  function makeTextures() {
    const TEX = {};

    /* ---------- little drawing helpers ---------- */
    function star(ctx, cx, cy, r, points, inner, color) {
      ctx.beginPath();
      for (let i = 0; i < points * 2; i++) {
        const a = -Math.PI / 2 + (i * Math.PI) / points;
        const rr = i % 2 === 0 ? r : r * inner;
        const px = cx + Math.cos(a) * rr;
        const py = cy + Math.sin(a) * rr;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
    }

    function crescent(ctx, cx, cy, r, moonColor, starColor, cutColor) {
      ctx.save();
      ctx.fillStyle = moonColor;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = cutColor;
      ctx.beginPath();
      ctx.arc(cx + r * 0.44, cy - r * 0.16, r * 0.84, 0, Math.PI * 2);
      ctx.fill();
      star(ctx, cx + r * 0.16, cy + r * 0.52, r * 0.42, 5, 0.44, starColor);
      star(ctx, cx - r * 0.62, cy - r * 0.44, r * 0.16, 4, 0.36, starColor);
      ctx.restore();
    }

    function setFont(ctx, px, weight) {
      ctx.font =
        (weight || 700) +
        ' ' +
        px +
        'px "Yu Gothic", "Meiryo", "MS Gothic", "Hiragino Sans", sans-serif';
    }

    const JP = '"Yu Gothic", "Meiryo", "MS Gothic", "Hiragino Sans", sans-serif';

    /* ---------- floor tiles ---------- */
    TEX.floor = D.canvasTexture(
      512,
      512,
      (ctx, w, h) => {
        ctx.fillStyle = '#c7b99f';
        ctx.fillRect(0, 0, w, h);
        const rr = D.rng(771);
        const n = 4;
        const s = w / n;
        for (let y = 0; y < n; y++) {
          for (let x = 0; x < n; x++) {
            const v = 186 + Math.floor(rr() * 26);
            ctx.fillStyle = 'rgb(' + v + ',' + (v - 13) + ',' + (v - 36) + ')';
            ctx.fillRect(x * s, y * s, s, s);
            // speckle
            for (let i = 0; i < 40; i++) {
              const a = 0.04 + rr() * 0.1;
              ctx.fillStyle = 'rgba(90,78,58,' + a + ')';
              ctx.fillRect(x * s + rr() * s, y * s + rr() * s, 1 + rr() * 2, 1 + rr() * 2);
            }
          }
        }
        ctx.strokeStyle = '#9d8f76';
        ctx.lineWidth = 4;
        for (let i = 0; i <= n; i++) {
          ctx.beginPath();
          ctx.moveTo(i * s, 0);
          ctx.lineTo(i * s, h);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(0, i * s);
          ctx.lineTo(w, i * s);
          ctx.stroke();
        }
        // soft warm sheen
        const g = ctx.createLinearGradient(0, 0, w, h);
        g.addColorStop(0, 'rgba(255,236,196,0.16)');
        g.addColorStop(0.5, 'rgba(255,236,196,0.02)');
        g.addColorStop(1, 'rgba(120,110,96,0.12)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      },
      { repeat: [6, 5] }
    );

    /* ---------- dark teal base tiles ---------- */
    TEX.band = D.canvasTexture(
      512,
      256,
      (ctx, w, h) => {
        ctx.fillStyle = '#0d3d3b';
        ctx.fillRect(0, 0, w, h);
        const rr = D.rng(313);
        const cols = 8;
        const rows = 4;
        const tw = w / cols;
        const th = h / rows;
        for (let y = 0; y < rows; y++) {
          for (let x = 0; x < cols; x++) {
            const v = 16 + Math.floor(rr() * 16);
            ctx.fillStyle = 'rgb(' + (v + 1) + ',' + (v + 42) + ',' + (v + 40) + ')';
            ctx.fillRect(x * tw + 2, y * th + 2, tw - 4, th - 4);
            ctx.fillStyle = 'rgba(150,230,220,' + (0.03 + rr() * 0.06) + ')';
            ctx.fillRect(x * tw + 5, y * th + 4, tw * 0.6, 3);
          }
        }
        ctx.strokeStyle = '#2f7a74';
        ctx.lineWidth = 3;
        for (let i = 0; i <= cols; i++) {
          ctx.beginPath();
          ctx.moveTo(i * tw, 0);
          ctx.lineTo(i * tw, h);
          ctx.stroke();
        }
        for (let i = 0; i <= rows; i++) {
          ctx.beginPath();
          ctx.moveTo(0, i * th);
          ctx.lineTo(w, i * th);
          ctx.stroke();
        }
      },
      { repeat: [9, 1] }
    );

    /* ---------- front fascia lightbox ---------- */
    TEX.frontSign = D.canvasTexture(
      2048,
      196,
      (ctx, w, h) => {
        const g = ctx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, '#f4e2b8');
        g.addColorStop(0.5, '#ecd39c');
        g.addColorStop(1, '#dbbd7f');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
        const rg = ctx.createRadialGradient(730, h * 0.5, 10, 730, h * 0.5, 700);
        rg.addColorStop(0, 'rgba(255,236,190,0.55)');
        rg.addColorStop(1, 'rgba(255,236,190,0)');
        ctx.fillStyle = rg;
        ctx.fillRect(0, 0, w, h);

        // borders
        ctx.strokeStyle = '#0a423f';
        ctx.lineWidth = 13;
        ctx.strokeRect(9, 9, w - 18, h - 18);
        ctx.strokeStyle = '#ff6d5d';
        ctx.lineWidth = 3;
        ctx.strokeRect(28, 28, w - 56, h - 56);

        crescent(ctx, 156, h * 0.5, 52, '#0a423f', '#e8503f', '#eddaae');

        D.drawText(ctx, '星降マート', 690, h * 0.41, {
          font: '700 104px ' + JP,
          color: '#073330',
          align: 'center',
          baseline: 'middle',
        });
        D.drawText(ctx, 'HOSHIFURI MART', 690, h * 0.78, {
          font: '700 38px "Trebuchet MS", "Segoe UI", Arial, sans-serif',
          color: '#9e3a28',
          align: 'center',
          baseline: 'middle',
          spacing: 8,
        });
        D.drawText(ctx, '24時間営業', 1370, h * 0.5, {
          font: '700 47px ' + JP,
          color: '#073330',
          align: 'center',
          baseline: 'middle',
        });

        // coral 24H badge
        const bx = 1772;
        const by = h * 0.5;
        const br = 64;
        ctx.fillStyle = '#e8503f';
        ctx.beginPath();
        ctx.arc(bx, by, br, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#f8e6bc';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(bx, by, br - 7, 0, Math.PI * 2);
        ctx.stroke();
        D.drawText(ctx, '24H', bx, by - 7, {
          font: '700 58px "Trebuchet MS", Arial, sans-serif',
          color: '#fff4da',
        });
        D.drawText(ctx, 'OPEN', bx, by + 32, {
          font: '700 19px Arial, sans-serif',
          color: '#fff4da',
          spacing: 2,
        });

        // sparkles between text and badge
        star(ctx, 1550, 62, 13, 5, 0.42, '#1d7d74');
        star(ctx, 1598, 124, 9, 4, 0.4, '#e8503f');
        star(ctx, 1650, 70, 16, 5, 0.42, '#c9553f');
        star(ctx, 1696, 132, 9, 4, 0.4, '#1d7d74');
      },
      { clamp: true }
    );

    /* ---------- east fascia (24H) ---------- */
    TEX.eastSign = D.canvasTexture(
      960,
      320,
      (ctx, w, h) => {
        const g = ctx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, '#0e5652');
        g.addColorStop(0.6, '#0a4643');
        g.addColorStop(1, '#073533');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = '#f2ddb2';
        ctx.lineWidth = 9;
        ctx.strokeRect(9, 9, w - 18, h - 18);
        ctx.strokeStyle = '#ff6d5d';
        ctx.lineWidth = 3;
        ctx.strokeRect(27, 27, w - 54, h - 54);

        D.drawText(ctx, '24H', 300, h * 0.42, {
          font: '700 186px "Trebuchet MS", Arial, sans-serif',
          color: '#f8e7c2',
          align: 'center',
          baseline: 'middle',
        });
        D.drawText(ctx, 'OPEN 24 HOURS', 300, h * 0.79, {
          font: '700 35px "Trebuchet MS", Arial, sans-serif',
          color: '#ffb08e',
          align: 'center',
          baseline: 'middle',
          spacing: 6,
        });
        crescent(ctx, 770, h * 0.44, 74, '#f8e7c2', '#ff7d63', '#0a4643');
        D.drawText(ctx, '星降マート', 770, h * 0.84, {
          font: '700 34px ' + JP,
          color: '#f8e7c2',
          align: 'center',
          baseline: 'middle',
        });
        star(ctx, 600, 94, 14, 5, 0.42, '#ffb08e');
        star(ctx, 640, 240, 10, 4, 0.4, '#8fd8cf');
      },
      { clamp: true }
    );

    /* ---------- projecting vertical blade sign ---------- */
    TEX.bladeSign = D.canvasTexture(
      512,
      832,
      (ctx, w, h) => {
        const g = ctx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, '#f7e8c2');
        g.addColorStop(0.55, '#efd9a8');
        g.addColorStop(1, '#dcc088');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = '#073a37';
        ctx.lineWidth = 14;
        ctx.strokeRect(11, 11, w - 22, h - 22);
        ctx.strokeStyle = '#e8503f';
        ctx.lineWidth = 4;
        ctx.strokeRect(32, 32, w - 64, h - 64);

        crescent(ctx, 256, 128, 74, '#073a37', '#e8503f', '#efd9a8');
        D.verticalText(ctx, '星降マート', 256, 266, 106, {
          font: '700 100px ' + JP,
          color: '#073a37',
        });
        D.drawText(ctx, 'HOSHIFURI', 256, 742, {
          font: '700 27px "Trebuchet MS", Arial, sans-serif',
          color: '#9e3a28',
          spacing: 4,
        });
        D.drawText(ctx, '24H', 256, 786, {
          font: '700 48px "Trebuchet MS", Arial, sans-serif',
          color: '#c9412e',
        });
        star(ctx, 100, 190, 12, 4, 0.4, '#c9412e');
        star(ctx, 416, 320, 12, 4, 0.4, '#1d7d74');
        star(ctx, 96, 700, 10, 4, 0.4, '#1d7d74');
      },
      { clamp: true }
    );

    /* ---------- lit drink fridge wall ---------- */
    TEX.fridge = D.canvasTexture(
      1536,
      1024,
      (ctx, w, h) => {
        const rr = D.rng(551);
        ctx.fillStyle = '#0a2527';
        ctx.fillRect(0, 0, w, h);
        const bottles = [
          '#d9f1ff',
          '#ffd39b',
          '#ff9b86',
          '#b9ecc4',
          '#dcc4ff',
          '#ffe97f',
          '#f5f5f5',
          '#7fd2ff',
          '#ffadc7',
          '#bfffa6',
          '#ffcf6e',
          '#9ad6c9',
        ];
        const doors = 5;
        const dw = w / doors;
        for (let d = 0; d < doors; d++) {
          const x0 = d * dw;
          // cabinet interior
          ctx.fillStyle = '#071b1d';
          ctx.fillRect(x0 + 10, 26, dw - 20, h - 52);
          // bright cold LED at the top of every door
          const lg = ctx.createLinearGradient(0, 30, 0, 120);
          lg.addColorStop(0, 'rgba(226,250,255,0.95)');
          lg.addColorStop(1, 'rgba(190,238,255,0)');
          ctx.fillStyle = lg;
          ctx.fillRect(x0 + 18, 30, dw - 36, 96);
          ctx.fillStyle = '#eefdff';
          ctx.fillRect(x0 + 26, 40, dw - 52, 7);
          // 4 shelf rows
          for (let r = 0; r < 4; r++) {
            const sy = 214 + r * 190;
            ctx.fillStyle = '#aec4c8';
            ctx.fillRect(x0 + 20, sy, dw - 40, 7);
            ctx.fillStyle = '#f4fdfe';
            ctx.fillRect(x0 + 20, sy, dw - 40, 2);
            // bottles standing on the shelf
            let bx = x0 + 26;
            while (bx < x0 + dw - 60) {
              const bw = 24 + Math.floor(rr() * 12);
              const bh = 66 + Math.floor(rr() * 42);
              ctx.fillStyle = bottles[Math.floor(rr() * bottles.length)];
              D.roundRect(ctx, bx, sy - bh, bw, bh, 7);
              ctx.fill();
              // cap
              ctx.fillStyle = 'rgba(255,255,255,0.85)';
              ctx.fillRect(bx + bw * 0.32, sy - bh - 8, bw * 0.36, 9);
              // label band
              ctx.fillStyle = 'rgba(20,40,60,' + (0.25 + rr() * 0.35) + ')';
              ctx.fillRect(bx + 3, sy - bh * 0.62, bw - 6, bh * 0.28);
              ctx.fillStyle = 'rgba(255,255,255,0.7)';
              ctx.fillRect(bx + 5, sy - bh * 0.55, bw - 10, 3);
              bx += bw + 5;
            }
            // price tags on the shelf edge
            for (let t = 0; t < 3; t++) {
              const tx = x0 + 34 + t * (dw - 88) * 0.5;
              ctx.fillStyle = t === 1 ? '#ff7a63' : '#fdf3dd';
              ctx.fillRect(tx, sy + 10, 46, 20);
              ctx.fillStyle = '#3a3020';
              ctx.fillRect(tx + 5, sy + 16, 20, 3);
              ctx.fillStyle = t === 1 ? '#fff4e0' : '#c9553f';
              ctx.fillRect(tx + 6, sy + 23, 30, 4);
            }
          }
          // glass sheet reflections
          ctx.save();
          ctx.beginPath();
          ctx.rect(x0 + 10, 26, dw - 20, h - 52);
          ctx.clip();
          ctx.globalAlpha = 0.1;
          ctx.fillStyle = '#eaffff';
          ctx.beginPath();
          ctx.moveTo(x0 + 20, h - 60);
          ctx.lineTo(x0 + 120, 20);
          ctx.lineTo(x0 + 210, 20);
          ctx.lineTo(x0 + 110, h - 60);
          ctx.closePath();
          ctx.fill();
          ctx.globalAlpha = 0.06;
          ctx.beginPath();
          ctx.moveTo(x0 + 150, h - 40);
          ctx.lineTo(x0 + 250, 20);
          ctx.lineTo(x0 + 300, h - 40);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
          // aluminium door frame
          ctx.fillStyle = '#c6d2d8';
          ctx.fillRect(x0, 0, 12, h);
          ctx.fillRect(x0 + dw - 12, 0, 12, h);
          ctx.fillStyle = '#eaf4f6';
          ctx.fillRect(x0 + 3, 0, 3, h);
          // handle
          ctx.fillStyle = '#dce8ec';
          ctx.fillRect(x0 + dw - 40, h * 0.4, 9, 130);
          ctx.fillStyle = '#8fa3a8';
          ctx.fillRect(x0 + dw - 44, h * 0.38, 17, 20);
          ctx.fillRect(x0 + dw - 44, h * 0.62, 17, 20);
        }
        // bottom kick plate + top rail
        ctx.fillStyle = '#8fa0a4';
        ctx.fillRect(0, h - 26, w, 26);
        ctx.fillStyle = '#b9c9cd';
        ctx.fillRect(0, 0, w, 26);
        ctx.fillStyle = '#eef8fa';
        ctx.fillRect(0, 22, w, 4);
      },
      { clamp: true }
    );

    /* ---------- posters ---------- */
    TEX.posterKaraage = D.canvasTexture(
      512,
      720,
      (ctx, w, h) => {
        const g = ctx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, '#ff8b56');
        g.addColorStop(0.55, '#ffa64d');
        g.addColorStop(1, '#ffcf6a');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#fff8e8';
        ctx.fillRect(0, 0, w, 150);
        D.drawText(ctx, '新発売', w / 2, 78, {
          font: '700 74px ' + JP,
          color: '#e0522f',
          spacing: 8,
        });
        D.drawText(ctx, 'からあげ', w / 2, 250, {
          font: '700 104px ' + JP,
          color: '#fffdf2',
          stroke: '#b83a1f',
          strokeWidth: 10,
        });
        D.drawText(ctx, 'ジューシー！', w / 2, 350, {
          font: '700 46px ' + JP,
          color: '#7a2a10',
        });
        // fried chicken blobs
        const rr = D.rng(99);
        for (let i = 0; i < 7; i++) {
          const x = 120 + (i % 4) * 95 + rr() * 20;
          const y = 440 + Math.floor(i / 4) * 70 + rr() * 20;
          ctx.fillStyle = i % 2 ? '#d98a2b' : '#e8a13a';
          ctx.beginPath();
          ctx.ellipse(x, y, 44 + rr() * 14, 32 + rr() * 10, rr() * 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = 'rgba(255,230,150,0.5)';
          ctx.beginPath();
          ctx.ellipse(x - 8, y - 8, 22, 12, 0.4, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = '#fff8e8';
        ctx.fillRect(0, h - 130, w, 130);
        D.drawText(ctx, '210円', 140, h - 64, {
          font: '700 64px "Trebuchet MS", Arial, sans-serif',
          color: '#0d5b58',
        });
        D.drawText(ctx, 'ほっかほか', 370, h - 64, {
          font: '700 33px ' + JP,
          color: '#e0522f',
        });
      },
      { clamp: true }
    );

    TEX.posterCoffee = D.canvasTexture(
      512,
      720,
      (ctx, w, h) => {
        ctx.fillStyle = '#fff6e0';
        ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = '#0d5b58';
        ctx.lineWidth = 12;
        ctx.strokeRect(10, 10, w - 20, h - 20);
        D.drawText(ctx, '淹れたて', w / 2, 92, {
          font: '700 78px ' + JP,
          color: '#0d5b58',
        });
        D.drawText(ctx, 'HOT COFFEE', w / 2, 166, {
          font: '700 32px "Trebuchet MS", Arial, sans-serif',
          color: '#c9553f',
          spacing: 5,
        });
        // cup
        ctx.fillStyle = '#ffffff';
        D.roundRect(ctx, 160, 300, 190, 210, 26);
        ctx.fill();
        ctx.fillStyle = '#0d5b58';
        D.roundRect(ctx, 160, 300, 190, 54, 20);
        ctx.fill();
        ctx.fillStyle = '#f2e6ce';
        ctx.fillRect(186, 430, 138, 40);
        ctx.fillStyle = '#ffffff';
        D.roundRect(ctx, 350, 360, 52, 90, 26);
        ctx.fill();
        ctx.fillStyle = '#fff6e0';
        D.roundRect(ctx, 342, 352, 26, 106, 12);
        ctx.fill();
        // steam
        ctx.strokeStyle = 'rgba(13,91,88,0.5)';
        ctx.lineWidth = 7;
        ctx.lineCap = 'round';
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.moveTo(200 + i * 55, 280);
          ctx.bezierCurveTo(190 + i * 55, 235, 225 + i * 55, 215, 210 + i * 55, 170);
          ctx.stroke();
        }
        const g = ctx.createLinearGradient(0, 540, 0, h);
        g.addColorStop(0, '#ffe6b8');
        g.addColorStop(1, '#ffd48a');
        ctx.fillStyle = g;
        ctx.fillRect(0, 548, w, h - 548);
        D.drawText(ctx, 'Mサイズ', w / 2, 600, {
          font: '700 40px ' + JP,
          color: '#7a4a22',
        });
        D.drawText(ctx, '100円', w / 2, 668, {
          font: '700 66px "Trebuchet MS", Arial, sans-serif',
          color: '#c9553f',
        });
        star(ctx, 90, 600, 20, 5, 0.42, '#ff6d5d');
        star(ctx, 430, 620, 14, 4, 0.4, '#2c9b91');
      },
      { clamp: true }
    );

    TEX.posterIce = D.canvasTexture(
      512,
      720,
      (ctx, w, h) => {
        const g = ctx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, '#7fe0f4');
        g.addColorStop(0.5, '#4cb9de');
        g.addColorStop(1, '#2a7fa8');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
        D.drawText(ctx, 'アイス', w / 2, 140, {
          font: '700 132px ' + JP,
          color: '#ffffff',
          stroke: '#1d5f83',
          strokeWidth: 12,
        });
        D.drawText(ctx, '全品 20%OFF', w / 2, 268, {
          font: '700 56px ' + JP,
          color: '#fff2b8',
        });
        // popsicles
        const cols = ['#ff8fa5', '#ffd25c', '#b7ff9e'];
        for (let i = 0; i < 3; i++) {
          const x = 110 + i * 110;
          ctx.fillStyle = cols[i];
          D.roundRect(ctx, x, 340, 88, 200, 30);
          ctx.fill();
          ctx.fillStyle = '#f4dfb8';
          ctx.fillRect(x + 34, 522, 20, 86);
          ctx.fillStyle = 'rgba(255,255,255,0.55)';
          ctx.fillRect(x + 14, 360, 16, 140);
        }
        for (let i = 0; i < 8; i++) {
          const sx = 40 + (i % 4) * 120;
          const sy = 40 + Math.floor(i / 4) * 660;
          star(ctx, sx, sy, 14, 4, 0.4, 'rgba(255,255,255,0.8)');
        }
        ctx.fillStyle = '#fff8e0';
        ctx.fillRect(0, h - 84, w, 84);
        D.drawText(ctx, 'つめたい おやつ', w / 2, h - 42, {
          font: '700 34px ' + JP,
          color: '#1d5f83',
        });
      },
      { clamp: true }
    );

    TEX.posterATM = D.canvasTexture(
      512,
      720,
      (ctx, w, h) => {
        ctx.fillStyle = '#0d5b58';
        ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = '#ffe9bd';
        ctx.lineWidth = 10;
        ctx.strokeRect(12, 12, w - 24, h - 24);
        star(ctx, 256, 120, 56, 5, 0.44, '#ffd98e');
        D.drawText(ctx, 'ATM', w / 2, 300, {
          font: '700 150px "Trebuchet MS", Arial, sans-serif',
          color: '#fff8e8',
        });
        D.drawText(ctx, '24時間ご利用いただけます', w / 2, 440, {
          font: '700 34px ' + JP,
          color: '#ffe9bd',
        });
        ctx.fillStyle = '#ff6d5d';
        ctx.beginPath();
        ctx.arc(256, 570, 70, 0, Math.PI * 2);
        ctx.fill();
        D.drawText(ctx, '24H', 256, 570, {
          font: '700 62px "Trebuchet MS", Arial, sans-serif',
          color: '#fff8e8',
        });
        D.drawText(ctx, 'HOSHIFURI MART', w / 2, 680, {
          font: '700 24px "Trebuchet MS", Arial, sans-serif',
          color: '#9fd8cf',
          spacing: 4,
        });
      },
      { clamp: true }
    );

    /* ---------- magazine rack cover art ---------- */
    TEX.magazines = D.canvasTexture(
      1280,
      320,
      (ctx, w, h) => {
        ctx.fillStyle = '#1b2b33';
        ctx.fillRect(0, 0, w, h);
        const rr = D.rng(818);
        const covers = [
          ['#ff7a63', '#fff6dc'],
          ['#6ce9ff', '#123a48'],
          ['#ffd25c', '#5a3a10'],
          ['#c9a7ff', '#2a1a44'],
          ['#9ee87a', '#183a18'],
          ['#ff9ecb', '#461a30'],
          ['#ffffff', '#0d5b58'],
          ['#ffae66', '#4a2410'],
          ['#8fd0ff', '#123040'],
          ['#ffe28a', '#4a3a10'],
        ];
        for (let i = 0; i < 10; i++) {
          const cw = 108;
          const ch = 168;
          const x = 34 + i * 122;
          const y = 118 + (i % 3) * 6;
          const c = covers[i];
          ctx.fillStyle = 'rgba(0,0,0,0.4)';
          ctx.fillRect(x + 5, y + 6, cw, ch);
          ctx.fillStyle = c[0];
          ctx.fillRect(x, y, cw, ch);
          ctx.fillStyle = c[1];
          ctx.fillRect(x, y, cw, 34);
          ctx.fillStyle = 'rgba(255,255,255,0.86)';
          ctx.fillRect(x + 8, y + 8, cw - 30, 7);
          ctx.fillStyle = 'rgba(255,255,255,0.55)';
          ctx.fillRect(x + 8, y + 22, cw - 48, 4);
          // cover art block
          ctx.fillStyle = 'rgba(255,255,255,0.24)';
          D.roundRect(ctx, x + 12, y + 52, cw - 24, ch - 84, 6);
          ctx.fill();
          ctx.fillStyle = 'rgba(0,0,0,0.28)';
          for (let l = 0; l < 3; l++) ctx.fillRect(x + 16, y + 60 + l * 9, cw - 32 - l * 12, 3);
          // bottom title strip
          ctx.fillStyle = 'rgba(255,255,255,0.8)';
          ctx.fillRect(x + 6, y + ch - 24, cw - 12, 16);
          ctx.fillStyle = 'rgba(20,20,30,0.6)';
          ctx.fillRect(x + 10, y + ch - 18, cw - 26, 4);
        }
        // rack lip
        ctx.fillStyle = '#d9ccb2';
        ctx.fillRect(0, h - 36, w, 36);
        ctx.fillStyle = '#8a7c63';
        ctx.fillRect(0, h - 36, w, 4);
        ctx.fillStyle = '#ff7a63';
        ctx.fillRect(0, h - 12, w, 3);
      },
      { clamp: true }
    );

    /* ---------- shelf price strip ---------- */
    TEX.price = D.canvasTexture(
      512,
      64,
      (ctx, w, h) => {
        ctx.fillStyle = '#f6eede';
        ctx.fillRect(0, 0, w, h);
        const rr = D.rng(12);
        for (let i = 0; i < 10; i++) {
          const x = 6 + i * 50;
          ctx.fillStyle = i % 3 === 0 ? '#ff7a63' : i % 3 === 1 ? '#0d5b58' : '#ffffff';
          ctx.fillRect(x, 8, 42, 42);
          ctx.fillStyle = i % 3 === 1 ? '#fff6dc' : '#3a3020';
          ctx.fillRect(x + 6, 18, 30, 4);
          ctx.fillRect(x + 6, 28, 20, 3);
        }
      },
      { clamp: true }
    );

    /* ---------- entrance mats ---------- */
    TEX.mat = D.canvasTexture(
      512,
      256,
      (ctx, w, h) => {
        ctx.fillStyle = '#123c3b';
        ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = '#e8dcbd';
        ctx.lineWidth = 7;
        ctx.strokeRect(14, 14, w - 28, h - 28);
        ctx.strokeStyle = '#2c9b91';
        ctx.lineWidth = 3;
        ctx.strokeRect(28, 28, w - 56, h - 56);
        crescent(ctx, 104, h / 2, 34, '#e8dcbd', '#ff6d5d', '#123c3b');
        D.drawText(ctx, '星降マート', 300, h * 0.42, {
          font: '700 52px ' + JP,
          color: '#f4e8c8',
          align: 'center',
        });
        D.drawText(ctx, 'WELCOME', 300, h * 0.72, {
          font: '700 26px "Trebuchet MS", Arial, sans-serif',
          color: '#ffb27a',
          spacing: 6,
        });
      },
      { clamp: true }
    );

    /* ---------- frosted window brand decal ---------- */
    TEX.brandDecal = D.canvasTexture(
      1024,
      256,
      (ctx, w, h) => {
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = 'rgba(255,248,232,0.93)';
        D.roundRect(ctx, 6, 10, w - 12, h - 20, 26);
        ctx.fill();
        ctx.strokeStyle = 'rgba(13,91,88,0.85)';
        ctx.lineWidth = 6;
        D.roundRect(ctx, 6, 10, w - 12, h - 20, 26);
        ctx.stroke();
        crescent(ctx, 104, h / 2, 54, '#0d5b58', '#ff6d5d', '#fff8e8');
        D.drawText(ctx, '星降マート', 348, h * 0.38, {
          font: '700 66px ' + JP,
          color: '#0d5b58',
        });
        D.drawText(ctx, 'HOSHIFURI MART · 24H', 348, h * 0.72, {
          font: '700 27px "Trebuchet MS", Arial, sans-serif',
          color: '#c9553f',
          spacing: 4,
        });
        star(ctx, 660, 58, 12, 4, 0.4, '#ff6d5d');
        star(ctx, 700, 196, 9, 4, 0.4, '#2c9b91');
      },
      { clamp: true }
    );

    /* ---------- glass stickers ---------- */
    TEX.sticker24h = D.canvasTexture(
      512,
      224,
      (ctx, w, h) => {
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = '#e8483a';
        D.roundRect(ctx, 4, 4, w - 8, h - 8, 26);
        ctx.fill();
        ctx.strokeStyle = '#fff3dc';
        ctx.lineWidth = 7;
        D.roundRect(ctx, 15, 15, w - 30, h - 30, 18);
        ctx.stroke();
        D.drawText(ctx, '24時間営業', w / 2, h * 0.4, {
          font: '700 74px ' + JP,
          color: '#fffaf0',
        });
        D.drawText(ctx, '年中無休', w / 2, h * 0.75, {
          font: '700 34px ' + JP,
          color: '#ffe1b8',
          spacing: 6,
        });
      },
      { clamp: true }
    );

    TEX.stickerATM = D.canvasTexture(
      384,
      256,
      (ctx, w, h) => {
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = '#0d5b58';
        D.roundRect(ctx, 4, 4, w - 8, h - 8, 24);
        ctx.fill();
        ctx.strokeStyle = '#fff3d6';
        ctx.lineWidth = 6;
        D.roundRect(ctx, 14, 14, w - 28, h - 28, 16);
        ctx.stroke();
        D.drawText(ctx, 'ATM', w / 2, h * 0.4, {
          font: '700 96px "Trebuchet MS", Arial, sans-serif',
          color: '#fff8e8',
        });
        D.drawText(ctx, '24時間', w / 2, h * 0.76, {
          font: '700 42px ' + JP,
          color: '#ffd08a',
        });
      },
      { clamp: true }
    );

    TEX.stickerOpen = D.canvasTexture(
      512,
      192,
      (ctx, w, h) => {
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = 'rgba(255,250,240,0.92)';
        D.roundRect(ctx, 4, 4, w - 8, h - 8, 22);
        ctx.fill();
        ctx.strokeStyle = '#0d5b58';
        ctx.lineWidth = 7;
        D.roundRect(ctx, 12, 12, w - 24, h - 24, 16);
        ctx.stroke();
        D.drawText(ctx, 'OPEN', 150, h * 0.44, {
          font: '700 74px "Trebuchet MS", Arial, sans-serif',
          color: '#0d5b58',
        });
        D.drawText(ctx, '24H', 356, h * 0.44, {
          font: '700 74px "Trebuchet MS", Arial, sans-serif',
          color: '#ff6d5d',
        });
        D.drawText(ctx, '星降マート', w / 2, h * 0.78, {
          font: '700 34px ' + JP,
          color: '#c9553f',
        });
      },
      { clamp: true }
    );

    TEX.stickerDoor = D.canvasTexture(
      384,
      160,
      (ctx, w, h) => {
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = 'rgba(255,251,240,0.9)';
        D.roundRect(ctx, 4, 4, w - 8, h - 8, 18);
        ctx.fill();
        ctx.strokeStyle = '#0d5b58';
        ctx.lineWidth = 5;
        D.roundRect(ctx, 10, 10, w - 20, h - 20, 12);
        ctx.stroke();
        D.drawText(ctx, '自動ドア', w / 2, h * 0.44, {
          font: '700 56px ' + JP,
          color: '#0d5b58',
        });
        D.drawText(ctx, 'AUTOMATIC DOOR', w / 2, h * 0.78, {
          font: '700 22px Arial, sans-serif',
          color: '#c9553f',
          spacing: 2,
        });
      },
      { clamp: true }
    );

    /* ---------- notice board ---------- */
    TEX.notice = D.canvasTexture(
      384,
      480,
      (ctx, w, h) => {
        ctx.fillStyle = '#7a5b3c';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#c9a878';
        ctx.fillRect(8, 8, w - 16, h - 16);
        ctx.fillStyle = '#0d5b58';
        ctx.fillRect(8, 8, w - 16, 56);
        D.drawText(ctx, 'お知らせ', w / 2, 38, {
          font: '700 36px ' + JP,
          color: '#fdf3da',
        });
        const papers = [
          [30, 86, 150, 170, '#fffaf0', '#c9553f'],
          [200, 96, 150, 130, '#ffead0', '#0d5b58'],
          [34, 274, 150, 140, '#f2f7ff', '#2c6fa8'],
          [200, 246, 150, 180, '#fff3d7', '#a35a22'],
        ];
        for (const p of papers) {
          ctx.fillStyle = 'rgba(0,0,0,0.2)';
          ctx.fillRect(p[0] + 4, p[1] + 5, p[2], p[3]);
          ctx.fillStyle = p[4];
          ctx.fillRect(p[0], p[1], p[2], p[3]);
          ctx.fillStyle = p[5];
          ctx.fillRect(p[0] + 10, p[1] + 12, p[2] - 20, 8);
          ctx.fillStyle = 'rgba(60,50,40,0.55)';
          for (let l = 0; l < 5; l++) {
            ctx.fillRect(p[0] + 12, p[1] + 36 + l * 12, p[2] - 24 - (l % 2) * 20, 3);
          }
        }
      },
      { clamp: true }
    );

    /* ---------- AC fan grille ---------- */
    TEX.acGrille = D.canvasTexture(
      256,
      256,
      (ctx, w, h) => {
        ctx.fillStyle = '#6b7480';
        ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = '#4d545e';
        ctx.lineWidth = 2;
        ctx.strokeRect(8, 8, w - 16, h - 16);
        const cx = w / 2;
        const cy = h / 2;
        ctx.fillStyle = '#23282f';
        ctx.beginPath();
        ctx.arc(cx, cy, 100, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#59616d';
        for (let i = 0; i < 14; i++) {
          const a = (i / 14) * Math.PI * 2;
          ctx.beginPath();
          ctx.moveTo(cx + Math.cos(a) * 18, cy + Math.sin(a) * 18);
          ctx.lineTo(cx + Math.cos(a) * 98, cy + Math.sin(a) * 98);
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.arc(cx, cy, 72, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx, cy, 46, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#59616d';
        ctx.beginPath();
        ctx.arc(cx, cy, 18, 0, Math.PI * 2);
        ctx.fill();
      },
      { clamp: true }
    );

    /* ---------- staff-only sign ---------- */
    TEX.staff = D.canvasTexture(
      320,
      140,
      (ctx, w, h) => {
        ctx.fillStyle = '#f4efe2';
        ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = '#3a4050';
        ctx.lineWidth = 5;
        ctx.strokeRect(5, 5, w - 10, h - 10);
        D.drawText(ctx, 'STAFF ONLY', w / 2, 46, {
          font: '700 34px "Trebuchet MS", Arial, sans-serif',
          color: '#333a48',
        });
        D.drawText(ctx, '関係者以外立入禁止', w / 2, 100, {
          font: '700 24px ' + JP,
          color: '#b83a2c',
        });
      },
      { clamp: true }
    );

    /* ---------- fridge header strip ---------- */
    TEX.drinkHeader = D.canvasTexture(
      768,
      96,
      (ctx, w, h) => {
        ctx.fillStyle = '#0d5b58';
        ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = '#ffd98e';
        ctx.lineWidth = 4;
        ctx.strokeRect(6, 6, w - 12, h - 12);
        D.drawText(ctx, 'COLD DRINK', 220, h / 2, {
          font: '700 42px "Trebuchet MS", Arial, sans-serif',
          color: '#fff6dd',
          spacing: 4,
        });
        D.drawText(ctx, 'つめたい お飲みもの', 560, h / 2, {
          font: '700 32px ' + JP,
          color: '#ffcf8a',
        });
      },
      { clamp: true }
    );

    /* ---------- entrance header lightbox ---------- */
    TEX.entrance = D.canvasTexture(
      640,
      128,
      (ctx, w, h) => {
        ctx.fillStyle = '#0a4643';
        ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = '#f2ddb2';
        ctx.lineWidth = 5;
        ctx.strokeRect(6, 6, w - 12, h - 12);
        D.drawText(ctx, '入口', 92, h / 2, {
          font: '700 62px ' + JP,
          color: '#f9e8c4',
        });
        D.drawText(ctx, 'ENTRANCE', 370, h / 2, {
          font: '700 46px "Trebuchet MS", Arial, sans-serif',
          color: '#ffb08e',
          spacing: 6,
        });
        star(ctx, 560, h / 2, 20, 5, 0.42, '#f9e8c4');
      },
      { clamp: true }
    );

    /* ---------- hanging OPEN sign ---------- */
    TEX.openHang = D.canvasTexture(
      512,
      256,
      (ctx, w, h) => {
        ctx.fillStyle = '#0d5b58';
        ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = '#ffe6b3';
        ctx.lineWidth = 8;
        ctx.strokeRect(9, 9, w - 18, h - 18);
        D.drawText(ctx, 'OPEN', w / 2, 96, {
          font: '700 118px "Trebuchet MS", Arial, sans-serif',
          color: '#fff7e2',
        });
        D.drawText(ctx, '星降マート', w / 2, 186, {
          font: '700 36px ' + JP,
          color: '#ffb483',
        });
        star(ctx, 58, 60, 16, 5, 0.42, '#ffd98e');
        star(ctx, 456, 190, 12, 4, 0.4, '#ffd98e');
      },
      { clamp: true }
    );

    /* ---------- cigarette / candy wall ---------- */
    TEX.cigWall = D.canvasTexture(
      768,
      512,
      (ctx, w, h) => {
        ctx.fillStyle = '#1a2028';
        ctx.fillRect(0, 0, w, h);
        const rr = D.rng(4242);
        const packs = [
          '#ff7a63',
          '#ffd25c',
          '#6ce9ff',
          '#9ee87a',
          '#ffffff',
          '#c9a7ff',
          '#ff9ecb',
          '#ffae66',
        ];
        for (let row = 0; row < 4; row++) {
          const y = 40 + row * 112;
          ctx.fillStyle = '#8a7c63';
          ctx.fillRect(20, y + 78, w - 40, 8);
          let x = 34;
          while (x < w - 60) {
            const pw = 42 + rr() * 14;
            const ph = 62;
            ctx.fillStyle = packs[Math.floor(rr() * packs.length)];
            ctx.fillRect(x, y + 78 - ph, pw, ph);
            ctx.fillStyle = 'rgba(255,255,255,0.8)';
            ctx.fillRect(x + 4, y + 78 - ph + 5, pw - 8, 10);
            ctx.fillStyle = 'rgba(30,25,20,0.5)';
            ctx.fillRect(x + 6, y + 40, pw - 12, 4);
            x += pw + 7;
          }
        }
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.fillRect(0, 0, w, 26);
      },
      { clamp: true }
    );

    return TEX;
  }

  /* =========================================================
     Materials
     ========================================================= */
  function makeMaterials(TEX) {
    const M = {};
    M.wall = D.toon(0xdccdb3, { gradientMap: D.ramps.soft });
    M.wallWarm = D.toon(0xe3d5ba, { gradientMap: D.ramps.soft });
    M.wallTop = D.toon(0xc3b59b, { gradientMap: D.ramps.soft });
    M.canopy = D.toon(0xd3c09e, { gradientMap: D.ramps.soft });
    M.interiorWall = D.toon(0xf5e8ce, {
      gradientMap: D.ramps.soft,
      emissive: 0x4a2f16,
      emissiveIntensity: 0.5,
    });
    M.ceiling = D.toon(0xf8eedb, {
      gradientMap: D.ramps.soft,
      emissive: 0x3d2a15,
      emissiveIntensity: 0.6,
    });
    M.soffit = D.toon(0xe8c795, {
      gradientMap: D.ramps.soft,
      emissive: 0x3a220c,
      emissiveIntensity: 0.5,
    });
    M.teal = D.toon(P.teal, { gradientMap: D.ramps.soft });
    M.tealLight = D.toon(P.tealLight, { gradientMap: D.ramps.soft });
    M.tealDark = D.toon(0x0a3a38, { gradientMap: D.ramps.soft });
    M.coral = D.toon(P.coral, { gradientMap: D.ramps.crisp });
    M.cream = D.toon(P.cream, { gradientMap: D.ramps.soft });
    M.metal = D.standard(0x8b95a4, { roughness: 0.34, metalness: 0.7, envMapIntensity: 1.0 });
    M.metalDark = D.standard(0x39404d, { roughness: 0.42, metalness: 0.55, envMapIntensity: 0.8 });
    M.metalLight = D.standard(0x9aa7b5, { roughness: 0.32, metalness: 0.62, envMapIntensity: 1.0 });
    M.doorFrame = D.standard(0x4c5462, { roughness: 0.36, metalness: 0.62, envMapIntensity: 0.9 });
    M.shelf = D.toon(0xe8e0cd, { gradientMap: D.ramps.soft });
    M.shelfSide = D.toon(0x1f6763, { gradientMap: D.ramps.soft });
    M.counter = D.toon(0x1d6561, { gradientMap: D.ramps.soft });
    M.counterTop = D.standard(0xf3e7cf, { roughness: 0.28, metalness: 0.12, envMapIntensity: 0.9 });
    M.floor = D.standard(0xffffff, {
      map: TEX.floor,
      roughness: 0.26,
      metalness: 0.18,
      envMapIntensity: 0.8,
    });
    M.band = D.standard(0xffffff, {
      map: TEX.band,
      roughness: 0.3,
      metalness: 0.3,
      envMapIntensity: 0.9,
    });
    M.concrete = D.standard(0x494e5a, { roughness: 0.55, metalness: 0.12 });
    M.roof = D.standard(0x3c424d, { roughness: 0.55, metalness: 0.18 });
    M.roofBody = D.toon(0x5f6875, { gradientMap: D.ramps.soft });
    M.vent = D.standard(0x707a87, { roughness: 0.42, metalness: 0.45, envMapIntensity: 0.8 });
    M.glass = D.glass(0xa9d6e4, { opacity: 0.13 });
    M.glass.envMapIntensity = 0.65;
    M.glassThin = D.glass(0xcfe8ee, { opacity: 0.09 });
    M.glassThin.envMapIntensity = 0.6;
    M.emWarm = D.basic(0xfff2d8, { toneMapped: false });
    M.emCool = D.basic(0xd9f6ff, { toneMapped: false });
    M.emCoral = D.basic(0xff8a6a, { toneMapped: false });
    M.emTeal = D.basic(0x7dffe6, { toneMapped: false });
    M.emFridge = D.basic(0xffffff, { toneMapped: false, map: TEX.fridge });
    M.signBack = D.toon(0x0e3d3b, { gradientMap: D.ramps.soft });
    M.price = D.basic(0xffffff, { map: TEX.price, toneMapped: true });
    M.poster = (tex) => D.basic(0xffffff, { map: tex, toneMapped: true });

    // colourful product palette (shared)
    const prodCols = [
      0xff6d5d, 0xffc65c, 0x2c9b91, 0x6ce9ff, 0xff9ecb, 0x9ee87a, 0xff9552, 0xc9a7ff,
      0xfff1cf, 0x7ad1c8, 0xe8688a, 0x8fd0ff, 0xffd98e, 0xa8e6d4,
    ];
    M.prod = prodCols.map((c) =>
      D.toon(c, { gradientMap: D.ramps.crisp, emissive: c, emissiveIntensity: 0.055 })
    );
    M.magThin = D.toon(0xf2e6cf, { gradientMap: D.ramps.soft });
    return M;
  }

  /* =========================================================
     Small build helpers
     ========================================================= */
  function addPlane(parent, w, h, mat, x, y, z, rx, ry, rz) {
    const m = D.plane(parent, w, h, mat, {
      x: x || 0,
      y: y || 0,
      z: z || 0,
      rx: rx || 0,
      ry: ry || 0,
      rz: rz || 0,
      cast: false,
      receive: false,
    });
    m.userData.noOutline = true;
    return m;
  }

  function addDecal(parent, tex, w, h, x, y, z, ry, opacity) {
    const mat = new T.MeshBasicMaterial({
      map: tex,
      transparent: true,
      opacity: opacity !== undefined ? opacity : 1,
      toneMapped: false,
      depthWrite: false,
      side: T.DoubleSide,
      fog: false,
    });
    const m = addPlane(parent, w, h, mat, x, y, z, 0, ry || 0, 0);
    m.renderOrder = 7;
    return m;
  }

  function strut(parent, a, b, r, mat) {
    const A = new T.Vector3(a[0], a[1], a[2]);
    const B = new T.Vector3(b[0], b[1], b[2]);
    const dir = B.clone().sub(A);
    const len = dir.length();
    const m = D.cyl(parent, r, r, len, 6, mat, { cast: false, receive: false });
    m.position.copy(A.clone().add(B).multiplyScalar(0.5));
    m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), dir.normalize());
    return m;
  }

  /* =========================================================
     SHELL — plinth, walls, parapet, roof deck, liners
     ========================================================= */
  function buildShell(layer, M) {
    // foundation plinth (store sits 4cm proud of the forecourt)
    D.box(layer, W + 0.16, FLOOR, DP + 0.16, M.concrete, {
      x: CX,
      y: FLOOR / 2,
      z: CZ,
      cast: true,
      receive: true,
    });

    // interior tiled floor
    const fl = addPlane(layer, IW, ID, M.floor, ICX, FLOOR + 0.004, ICZ, -Math.PI / 2, 0, 0);
    fl.receiveShadow = true;

    // ---- back / west solid walls ----
    D.box(layer, W, EAVE - FLOOR, WT, M.wall, {
      x: CX,
      y: (FLOOR + EAVE) / 2,
      z: Z0 + WT / 2,
      cast: true,
      receive: true,
    });
    D.box(layer, WT, EAVE - FLOOR, DP, M.wall, {
      x: X0 + WT / 2,
      y: (FLOOR + EAVE) / 2,
      z: CZ,
      cast: true,
      receive: true,
    });

    // ---- front header band + east header band ----
    D.box(layer, W, EAVE - GLASS_T, WT, M.wall, {
      x: CX,
      y: (GLASS_T + EAVE) / 2,
      z: Z1 - WT / 2,
      cast: true,
      receive: true,
    });
    D.box(layer, WT, EAVE - GLASS_T, DP, M.wall, {
      x: X1 - WT / 2,
      y: (GLASS_T + EAVE) / 2,
      z: CZ,
      cast: true,
      receive: true,
    });

    // ---- solid back part of the east wall (stockroom) ----
    D.box(layer, WT, GLASS_T - FLOOR, EG_BACK - Z0, M.wall, {
      x: X1 - WT / 2,
      y: (FLOOR + GLASS_T) / 2,
      z: (Z0 + EG_BACK) / 2,
      cast: true,
      receive: true,
    });

    // ---- base tile bands ----
    D.box(layer, W, GLASS_B - FLOOR, WT + 0.04, M.band, {
      x: CX,
      y: (FLOOR + GLASS_B) / 2,
      z: Z1 - (WT + 0.04) / 2,
      cast: true,
      receive: true,
    });
    D.box(layer, WT + 0.04, GLASS_B - FLOOR, DP, M.band, {
      x: X1 - (WT + 0.04) / 2,
      y: (FLOOR + GLASS_B) / 2,
      z: CZ,
      cast: true,
      receive: true,
    });

    // ---- corner pilasters ----
    for (const cx of [X0 + 0.18, X1 - 0.2]) {
      const cxp = cx;
      D.box(layer, 0.38, EAVE - FLOOR, 0.38, M.wall, {
        x: cxp,
        y: (FLOOR + EAVE) / 2,
        z: Z1 - 0.19,
        cast: true,
        receive: true,
      });
      D.box(layer, 0.44, 0.075, 0.44, M.teal, {
        x: cxp,
        y: 0.585,
        z: Z1 - 0.19,
        cast: false,
        receive: true,
      });
      D.box(layer, 0.44, 0.075, 0.44, M.teal, {
        x: cxp,
        y: 2.86,
        z: Z1 - 0.19,
        cast: false,
        receive: true,
      });
    }

    // ---- parapet ----
    const par = [
      [W + 0.32, PARA - EAVE, 0.26, CX, 0.55],
      [0.26, PARA - EAVE, DP + 0.32, 1.35, CZ],
      [W + 0.32, PARA - EAVE, 0.26, CX, -6.15],
      [0.26, PARA - EAVE, DP + 0.32, -6.75, CZ],
    ];
    for (const p of par) {
      D.box(layer, p[0], p[1], p[2], M.wallTop, {
        x: p[3],
        y: (EAVE + PARA) / 2,
        z: p[4],
        cast: true,
        receive: true,
      });
    }
    // teal parapet cap
    const caps = [
      [W + 0.38, 0.05, 0.3, CX, 0.55],
      [0.3, 0.05, DP + 0.38, 1.35, CZ],
      [W + 0.38, 0.05, 0.3, CX, -6.15],
      [0.3, 0.05, DP + 0.38, -6.75, CZ],
    ];
    for (const c of caps) {
      D.box(layer, c[0], c[1], c[2], M.teal, {
        x: c[3],
        y: PARA - 0.012,
        z: c[4],
        cast: false,
        receive: false,
      });
    }

    // roof deck
    D.box(layer, W - 0.46, 0.06, DP - 0.46, M.roof, {
      x: CX,
      y: EAVE - 0.03,
      z: CZ,
      cast: false,
      receive: true,
    });

    // interior ceiling
    D.box(layer, IW + 0.1, 0.12, ID + 0.1, M.ceiling, {
      x: ICX,
      y: CEIL + 0.06,
      z: ICZ,
      cast: false,
      receive: false,
    });

    // ---- interior wall liners (warm, slightly self-lit) ----
    addPlane(layer, IW, CEIL - FLOOR, M.interiorWall, ICX, (FLOOR + CEIL) / 2, GZ0 + 0.003, 0, 0, 0);
    addPlane(layer, ID, CEIL - FLOOR, M.interiorWall, GX0 + 0.003, (FLOOR + CEIL) / 2, ICZ, 0, Math.PI / 2, 0);
    addPlane(
      layer,
      EG_BACK - GZ0,
      CEIL - FLOOR,
      M.interiorWall,
      GX1 - 0.003,
      (FLOOR + CEIL) / 2,
      (GZ0 + EG_BACK) / 2,
      0,
      -Math.PI / 2,
      0
    );
    addPlane(layer, IW, CEIL - GLASS_T, M.interiorWall, ICX, (GLASS_T + CEIL) / 2, GZ1 - 0.003, 0, Math.PI, 0);

    // interior wainscot stripes
    D.box(layer, IW, 0.07, 0.02, M.teal, { x: ICX, y: 0.92, z: GZ0 + 0.02, cast: false, receive: false });
    D.box(layer, 0.02, 0.07, ID, M.teal, { x: GX0 + 0.02, y: 0.92, z: ICZ, cast: false, receive: false });
    D.box(layer, 0.02, 0.07, EG_BACK - GZ0, M.teal, {
      x: GX1 - 0.02,
      y: 0.92,
      z: (GZ0 + EG_BACK) / 2,
      cast: false,
      receive: false,
    });

    // exterior trims
    D.box(layer, W, 0.035, 0.03, M.teal, { x: CX, y: GLASS_B + 0.018, z: Z1 + 0.005, cast: false, receive: false });
    D.box(layer, 0.03, 0.035, DP, M.teal, { x: X1 + 0.005, y: GLASS_B + 0.018, z: CZ, cast: false, receive: false });
    // thin coral pinstripe under the sign
    D.box(layer, W - 0.5, 0.022, 0.03, M.coral, { x: CX, y: GLASS_T + 0.04, z: Z1 + 0.006, cast: false, receive: false });
    D.box(layer, 0.03, 0.022, DP - 0.5, M.coral, { x: X1 + 0.006, y: GLASS_T + 0.04, z: CZ, cast: false, receive: false });

    // drainpipes at the two visible corners
    for (const c of [
      [X0 - 0.05, Z1 - 0.06],
      [X1 + 0.05, Z1 - 0.06],
    ]) {
      D.cyl(layer, 0.055, 0.055, EAVE - 0.1, 8, M.metalLight, {
        x: c[0],
        y: (EAVE - 0.1) / 2 + 0.1,
        z: c[1],
        cast: false,
        receive: true,
      });
      for (const yy of [1.0, 2.3]) {
        D.box(layer, 0.1, 0.05, 0.14, M.metalDark, {
          x: c[0],
          y: yy,
          z: c[1] + 0.06,
          cast: false,
          receive: false,
        });
      }
      D.cyl(layer, 0.055, 0.055, 0.16, 8, M.metalLight, {
        x: c[0],
        y: 0.11,
        z: c[1] + 0.08,
        rx: Math.PI / 2,
        cast: false,
        receive: false,
      });
    }
  }

  /* =========================================================
     FRONT STOREFRONT — window band, mullions, posters
     ========================================================= */
  function buildFrontFacade(layer, M, TEX) {
    const winW = WIN_R - WIN_L;
    const glassH = GLASS_T - GLASS_B;
    const glassY = (GLASS_B + GLASS_T) / 2;

    // one big glass sheet (the mullions sit on top of it)
    const glass = addPlane(layer, winW, glassH, M.glass, (WIN_L + WIN_R) / 2, glassY, Z1 - 0.018, 0, 0, 0);
    glass.renderOrder = 3;

    // aluminium sill and head rails
    D.box(layer, winW + 0.08, 0.1, 0.2, M.metalLight, {
      x: (WIN_L + WIN_R) / 2,
      y: GLASS_B + 0.01,
      z: Z1 - 0.06,
      cast: true,
      receive: true,
    });
    D.box(layer, winW + 0.08, 0.1, 0.2, M.metalLight, {
      x: (WIN_L + WIN_R) / 2,
      y: GLASS_T - 0.02,
      z: Z1 - 0.06,
      cast: true,
      receive: true,
    });
    // transom bar
    D.box(layer, winW + 0.04, 0.055, 0.15, M.metal, {
      x: (WIN_L + WIN_R) / 2,
      y: 2.15,
      z: Z1 - 0.045,
      cast: false,
      receive: true,
    });
    // vertical mullions
    const mullions = [-5.06, -3.68, -2.3];
    for (const mx of mullions) {
      D.box(layer, 0.075, glassH, 0.17, M.metal, {
        x: mx,
        y: glassY,
        z: Z1 - 0.05,
        cast: true,
        receive: true,
      });
    }
    // end posts
    D.box(layer, 0.09, glassH, 0.19, M.metal, {
      x: WIN_L + 0.045,
      y: glassY,
      z: Z1 - 0.05,
      cast: true,
      receive: true,
    });
    D.box(layer, 0.09, glassH, 0.19, M.metal, {
      x: WIN_R - 0.045,
      y: glassY,
      z: Z1 - 0.05,
      cast: true,
      receive: true,
    });

    // window posters (upper transom strip) — they read from the default view
    addDecal(layer, TEX.posterKaraage, 0.5, 0.62, -6.05, 2.47, Z1 + 0.015);
    addDecal(layer, TEX.posterIce, 0.5, 0.62, -2.34, 2.47, Z1 + 0.015);
    // frosted brand decal in the middle of the transom
    addDecal(layer, TEX.brandDecal, 2.4, 0.6, -4.2, 2.47, Z1 + 0.015, 0, 0.97);

    // glass stickers
    addDecal(layer, TEX.sticker24h, 0.92, 0.4, -1.42, 1.28, Z1 + 0.016);
    // small price / campaign sticker
    addDecal(layer, TEX.stickerOpen, 0.62, 0.23, -5.55, 1.4, Z1 + 0.016, 0, 0.9);
  }

  /* =========================================================
     AUTOMATIC SLIDING DOOR (front-right)
     ========================================================= */
  function buildDoor(layer, M, TEX) {
    const mid = (DOOR_L + DOOR_R) / 2;
    const openW = DOOR_R - DOOR_L;

    // jamb posts
    for (const jx of [DOOR_L - 0.015, DOOR_R + 0.015]) {
      D.box(layer, 0.11, GLASS_T - FLOOR, 0.22, M.doorFrame, {
        x: jx,
        y: (FLOOR + GLASS_T) / 2,
        z: Z1 - 0.06,
        cast: true,
        receive: true,
      });
    }
    // header above the doors + track housing
    D.box(layer, openW + 0.24, GLASS_T - 2.58, 0.22, M.wallTop, {
      x: mid,
      y: (2.58 + GLASS_T) / 2,
      z: Z1 - 0.07,
      cast: true,
      receive: true,
    });
    D.box(layer, openW + 0.12, 0.14, 0.26, M.doorFrame, {
      x: mid,
      y: 2.62,
      z: Z1 - 0.05,
      cast: false,
      receive: true,
    });
    // lit "entrance" lightbox mounted on the canopy lip (visible from the SE view)
    D.box(layer, 1.56, 0.22, 0.07, M.signBack, { x: mid, y: 2.865, z: Z1 + 1.09, cast: true, receive: true });
    addPlane(
      layer,
      1.48,
      0.18,
      D.basic(0xffffff, { map: TEX.entrance, toneMapped: false }),
      mid,
      2.865,
      Z1 + 1.13,
      0,
      0,
      0
    );
    D.glowSprite(layer, { x: mid, y: 2.86, z: Z1 + 1.28, color: 0xffd9a8, size: 1.6, opacity: 0.24 });
    // motion sensor
    D.box(layer, 0.3, 0.1, 0.12, M.metalDark, { x: mid, y: 2.52, z: Z1 + 0.03, cast: false, receive: false });
    const sensorLed = D.box(layer, 0.05, 0.03, 0.02, M.emTeal, {
      x: mid - 0.08,
      y: 2.52,
      z: Z1 + 0.095,
      cast: false,
      receive: false,
    });
    sensorLed.userData.noOutline = true;
    D.glowSprite(layer, { x: mid - 0.08, y: 2.52, z: Z1 + 0.12, color: 0x8dffe8, size: 0.4, opacity: 0.4 });

    // two sliding leaves on separate tracks
    const leaves = [
      { x: mid + openW / 4, z: Z1 - 0.035, w: openW / 2 - 0.03 },
      { x: mid - openW / 4, z: Z1 - 0.085, w: openW / 2 - 0.03 },
    ];
    for (const lf of leaves) {
      const y0 = FLOOR + 0.03;
      const y1 = 2.56;
      const hh = y1 - y0;
      const yy = (y0 + y1) / 2;
      // glass
      const gp = addPlane(layer, lf.w - 0.09, hh - 0.09, M.glassThin, lf.x, yy, lf.z, 0, 0, 0);
      gp.renderOrder = 3;
      // frame
      D.box(layer, 0.05, hh, 0.06, M.doorFrame, { x: lf.x - lf.w / 2 + 0.022, y: yy, z: lf.z, cast: true });
      D.box(layer, 0.05, hh, 0.06, M.doorFrame, { x: lf.x + lf.w / 2 - 0.022, y: yy, z: lf.z, cast: true });
      D.box(layer, lf.w, 0.06, 0.06, M.doorFrame, { x: lf.x, y: y1 - 0.03, z: lf.z, cast: true });
      D.box(layer, lf.w, 0.08, 0.06, M.doorFrame, { x: lf.x, y: y0 + 0.035, z: lf.z, cast: true });
      // bright aluminium edge highlight
      D.box(layer, 0.012, hh, 0.062, M.metalLight, { x: lf.x + lf.w / 2 - 0.048, y: yy, z: lf.z, cast: false });
      // handle
      D.box(layer, 0.04, 0.46, 0.04, M.metalDark, { x: lf.x + lf.w / 2 - 0.1, y: 1.25, z: lf.z - 0.045, cast: false });
    }
    // rubber meeting strip
    D.box(layer, 0.04, 2.5, 0.05, M.metalDark, { x: mid, y: FLOOR + 1.28, z: Z1 - 0.06, cast: false });

    // floor track + threshold + step
    D.box(layer, openW + 0.1, 0.018, 0.12, M.metalDark, { x: mid, y: FLOOR + 0.01, z: Z1 - 0.05, cast: false, receive: false });
    D.box(layer, openW + 0.16, 0.04, 0.34, M.concrete, {
      x: mid,
      y: 0.172,
      z: Z1 + 0.15,
      cast: true,
      receive: true,
    });
    // entrance mat outside
    D.box(layer, 1.72, 0.025, 0.92, M.tealDark, {
      x: mid,
      y: 0.163,
      z: Z1 + 0.78,
      cast: false,
      receive: true,
    });
    addPlane(layer, 1.66, 0.86, D.basic(0xffffff, { map: TEX.mat, toneMapped: true }), mid, 0.177, Z1 + 0.78, -Math.PI / 2, 0, 0);
    // interior runner mat
    const insideMat = D.basic(0xffffff, { map: TEX.mat, toneMapped: true, transparent: true, opacity: 0.9 });
    addPlane(layer, 1.5, 0.78, insideMat, mid, FLOOR + 0.007, Z1 - 0.62, -Math.PI / 2, 0, 0);

    // door decals
    addDecal(layer, TEX.stickerDoor, 0.52, 0.22, mid - openW / 4, 0.98, Z1 + 0.012);
    addDecal(layer, TEX.stickerOpen, 0.66, 0.25, mid + openW / 4, 1.98, Z1 + 0.012, 0, 0.95);

    // ceiling-mounted "OPEN" hang sign just inside the door
    const hang = new T.Group();
    hang.position.set(mid, 2.28, Z1 - 0.96);
    layer.add(hang);
    D.box(hang, 0.86, 0.4, 0.06, M.signBack, { cast: true });
    const hangFace = D.basic(0xffffff, { map: TEX.openHang, toneMapped: false });
    addPlane(hang, 0.8, 0.34, hangFace, 0, 0, 0.035, 0, 0, 0);
    addPlane(hang, 0.8, 0.34, hangFace, 0, 0, -0.035, 0, Math.PI, 0);
    strut(hang, [-0.3, 0.2, 0], [-0.3, 0.72, 0], 0.008, M.metalDark);
    strut(hang, [0.3, 0.2, 0], [0.3, 0.72, 0], 0.008, M.metalDark);
    D.glowSprite(layer, { x: mid, y: 2.26, z: Z1 - 0.88, color: 0xffc98d, size: 1.6, opacity: 0.25 });

    return sensorLed;
  }

  /* =========================================================
     EAST STOREFRONT — glass band + service wall details
     ========================================================= */
  function buildEastFacade(layer, M, TEX) {
    const winW = EG_FRONT - EG_BACK;
    const glassH = GLASS_T - GLASS_B;
    const glassY = (GLASS_B + GLASS_T) / 2;
    const zc = (EG_BACK + EG_FRONT) / 2;

    const glass = addPlane(layer, winW, glassH, M.glass, X1 - 0.018, glassY, zc, 0, Math.PI / 2, 0);
    glass.renderOrder = 3;

    // sill / head rails
    D.box(layer, 0.2, 0.1, winW + 0.08, M.metalLight, {
      x: X1 - 0.06,
      y: GLASS_B + 0.01,
      z: zc,
      cast: true,
      receive: true,
    });
    D.box(layer, 0.2, 0.1, winW + 0.08, M.metalLight, {
      x: X1 - 0.06,
      y: GLASS_T - 0.02,
      z: zc,
      cast: true,
      receive: true,
    });
    D.box(layer, 0.15, 0.055, winW + 0.04, M.metal, {
      x: X1 - 0.045,
      y: 2.15,
      z: zc,
      cast: false,
      receive: true,
    });
    // vertical mullions
    for (const mz of [-3.35, -2.15, -0.95]) {
      D.box(layer, 0.17, glassH, 0.075, M.metal, {
        x: X1 - 0.05,
        y: glassY,
        z: mz,
        cast: true,
        receive: true,
      });
    }
    for (const zz of [EG_BACK + 0.045, EG_FRONT - 0.045]) {
      D.box(layer, 0.19, glassH, 0.09, M.metal, {
        x: X1 - 0.05,
        y: glassY,
        z: zz,
        cast: true,
        receive: true,
      });
    }

    // east glass stickers / decals
    addDecal(layer, TEX.stickerATM, 0.62, 0.42, X1 + 0.016, 1.45, -0.6, Math.PI / 2, 0.95);
    addDecal(layer, TEX.sticker24h, 0.8, 0.36, X1 + 0.016, 2.46, -2.7, Math.PI / 2, 0.9);
    addDecal(layer, TEX.stickerOpen, 0.72, 0.27, X1 + 0.016, 1.2, -3.7, Math.PI / 2, 0.85);

    /* ---- service wall (solid part of the east facade) ---- */
    // small barred window
    D.box(layer, 0.07, 0.78, 0.94, M.metalDark, {
      x: X1 + 0.02,
      y: 1.98,
      z: -5.22,
      cast: true,
      receive: true,
    });
    addPlane(layer, 0.8, 0.62, M.glassThin, X1 + 0.06, 1.98, -5.22, 0, Math.PI / 2, 0);
    for (let i = 0; i < 3; i++) {
      D.box(layer, 0.035, 0.66, 0.035, M.metalLight, {
        x: X1 + 0.07,
        y: 1.98,
        z: -5.5 + i * 0.28,
        cast: false,
        receive: false,
      });
    }
    // vent grille
    D.box(layer, 0.06, 0.5, 0.72, M.metalDark, { x: X1 + 0.02, y: 0.92, z: -5.2, cast: false, receive: true });
    for (let i = 0; i < 4; i++) {
      D.box(layer, 0.07, 0.04, 0.66, M.metal, { x: X1 + 0.04, y: 0.76 + i * 0.1, z: -5.2, cast: false, receive: false });
    }
    // meter boxes + conduit
    D.box(layer, 0.1, 0.42, 0.32, M.metalLight, { x: X1 + 0.06, y: 1.55, z: -4.78, cast: true, receive: true });
    D.box(layer, 0.11, 0.2, 0.26, M.metalDark, { x: X1 + 0.065, y: 1.2, z: -5.85, cast: false, receive: false });
    D.box(layer, 0.05, 0.05, 3.6, M.metalDark, { x: X1 + 0.03, y: 2.62, z: -3.4, cast: false, receive: false });
    // notice board
    D.box(layer, 0.06, 0.84, 0.74, M.tealDark, { x: X1 + 0.03, y: 1.86, z: -5.7, cast: true, receive: true });
    addPlane(layer, 0.66, 0.76, D.basic(0xffffff, { map: TEX.notice, toneMapped: true }), X1 + 0.065, 1.86, -5.7, 0, Math.PI / 2, 0);
    // small wall lamp over the service window
    D.box(layer, 0.08, 0.1, 0.24, M.metalDark, { x: X1 + 0.06, y: 2.52, z: -5.22, cast: false, receive: false });
    D.box(layer, 0.03, 0.05, 0.16, M.emWarm, { x: X1 + 0.1, y: 2.47, z: -5.22, cast: false, receive: false });
    D.glowSprite(layer, { x: X1 + 0.18, y: 2.42, z: -5.22, color: 0xffbf80, size: 1.0, opacity: 0.4 });

    // drainpipe on the east corner of the glass
    D.cyl(layer, 0.055, 0.055, EAVE - 0.1, 8, M.metalLight, {
      x: X1 + 0.09,
      y: (EAVE - 0.1) / 2 + 0.15,
      z: EG_BACK - 0.06,
      cast: false,
      receive: true,
    });
    for (const yy of [0.9, 2.2]) {
      D.box(layer, 0.14, 0.05, 0.1, M.metalDark, {
        x: X1 + 0.04,
        y: yy,
        z: EG_BACK - 0.06,
        cast: false,
        receive: false,
      });
    }
  }

  /* =========================================================
     CANOPY / AWNING with downlights
     ========================================================= */
  function buildCanopy(layer, M, TEX) {
    const canW = W + 0.06;
    const canZ0 = Z1 + 0.02;
    const canZ1 = Z1 + 1.06;
    const canY = 2.92;

    // slab
    D.box(layer, canW, 0.12, canZ1 - canZ0, M.canopy, {
      x: CX,
      y: canY,
      z: (canZ0 + canZ1) / 2,
      cast: true,
      receive: true,
    });
    // front lip (deeper fascia)
    D.box(layer, canW + 0.06, 0.25, 0.08, M.canopy, {
      x: CX,
      y: canY - 0.065,
      z: canZ1,
      cast: true,
      receive: true,
    });
    // lip trims
    D.box(layer, canW + 0.08, 0.035, 0.085, M.teal, { x: CX, y: canY + 0.02, z: canZ1 + 0.002, cast: false, receive: false });
    D.box(layer, canW + 0.08, 0.018, 0.088, M.coral, { x: CX, y: canY - 0.16, z: canZ1 + 0.004, cast: false, receive: false });

    // soffit (faces down, warm)
    addPlane(layer, canW - 0.1, canZ1 - canZ0 - 0.06, M.soffit, CX, canY - 0.062, (canZ0 + canZ1) / 2, Math.PI / 2, 0, 0);

    // recessed downlights + glows
    for (const lx of [-5.4, -3.2, -1.0, 0.7]) {
      D.cyl(layer, 0.12, 0.12, 0.03, 14, M.metalDark, {
        x: lx,
        y: canY - 0.075,
        z: 1.2,
        cast: false,
        receive: false,
      });
      D.cyl(layer, 0.082, 0.082, 0.018, 14, M.emWarm, {
        x: lx,
        y: canY - 0.092,
        z: 1.2,
        cast: false,
        receive: false,
      });
      D.glowSprite(layer, { x: lx, y: canY - 0.14, z: 1.2, color: 0xffd2a0, size: 0.85, opacity: 0.26 });
    }

    // support rods back to the wall
    for (const rx of [-5.6, -2.6, 0.45]) {
      strut(layer, [rx, canY + 0.05, canZ1 - 0.02], [rx, 3.34, Z1 + 0.03], 0.017, M.metalDark);
      D.box(layer, 0.08, 0.08, 0.05, M.metalDark, { x: rx, y: 3.34, z: Z1 + 0.035, cast: false, receive: false });
    }

    // security camera tucked under the canopy near the door
    D.box(layer, 0.09, 0.06, 0.09, M.metalLight, { x: 1.12, y: canY - 0.09, z: 1.3, cast: false, receive: false });
    const cam = D.box(layer, 0.14, 0.1, 0.2, M.metalLight, { x: 1.12, y: canY - 0.13, z: 1.2, cast: false, receive: false });
    cam.rotation.x = -0.45;
    D.cyl(layer, 0.045, 0.045, 0.03, 10, M.metalDark, {
      x: 1.12,
      y: canY - 0.18,
      z: 1.12,
      rx: Math.PI / 2 - 0.45,
      cast: false,
      receive: false,
    });
    D.box(layer, 0.03, 0.02, 0.02, M.emCoral, { x: 1.16, y: canY - 0.115, z: 1.11, cast: false, receive: false });
    D.glowSprite(layer, { x: 1.13, y: canY - 0.18, z: 1.1, color: 0xff9a6a, size: 0.3, opacity: 0.35 });
  }

  /* =========================================================
     SIGNAGE — front fascia, east 24H, projecting blade sign
     ========================================================= */
  function buildSignage(layer, M, TEX) {
    // ---------- front lightbox fascia ----------
    D.signPanel(layer, TEX.frontSign, 7.9, FASCIA_H, {
      x: CX,
      y: FASCIA_Y,
      z: 0.762,
      depth: 0.07,
      backingColor: 0x0e3d3b,
      noOutlineBacking: true,
    });
    // mounting frame behind the lightbox
    D.box(layer, 7.94, FASCIA_H + 0.06, 0.12, M.tealDark, {
      x: CX,
      y: FASCIA_Y,
      z: 0.665,
      cast: true,
      receive: true,
    });
    // thin glow wash above and below the sign
    D.glowSprite(layer, { x: -4.6, y: 3.36, z: 0.94, color: 0xffd8a6, size: 2.4, opacity: 0.09 });
    D.glowSprite(layer, { x: -0.8, y: 3.36, z: 0.94, color: 0xffd8a6, size: 2.4, opacity: 0.09 });

    // ---------- east 24H fascia ----------
    D.signPanel(layer, TEX.eastSign, 2.1, 0.7, {
      x: 1.437,
      y: 3.28,
      z: -0.88,
      ry: Math.PI / 2,
      depth: 0.07,
      backingColor: 0x0e3d3b,
      noOutlineBacking: true,
    });
    D.box(layer, 0.12, 0.74, 2.14, M.tealDark, {
      x: 1.36,
      y: 3.28,
      z: -0.88,
      cast: true,
      receive: true,
    });
    D.glowSprite(layer, { x: 1.62, y: 3.28, z: -0.88, color: 0xffd6a0, size: 2.2, opacity: 0.22 });

    // ---------- projecting blade sign near the corner ----------
    // Mounted high and proud of the east/front corner so it clears the
    // utility pole, vending machine and canopy in the opening SE view.
    const bx = 2.2;
    const by = 3.36;
    const bz = 0.52;
    const bw = 1.3;
    const bh = 1.72;
    D.verticalSign(layer, TEX.bladeSign, bw, bh, {
      x: bx,
      y: by,
      z: bz,
      ry: 0,
      depth: 0.08,
      backingMat: M.signBack,
    });
    D.verticalSign(layer, TEX.bladeSign, bw, bh, {
      x: bx,
      y: by,
      z: bz,
      ry: Math.PI,
      depth: 0.08,
      backingMat: M.signBack,
    });
    // bracket arms
    for (const ay of [2.62, 3.55]) {
      strut(layer, [1.36, ay, bz], [1.6, ay, bz], 0.032, M.metalDark);
      D.box(layer, 0.08, 0.26, 0.26, M.metalDark, { x: 1.43, y: ay, z: bz, cast: false, receive: false });
      D.box(layer, 0.06, 0.06, 0.06, M.metalDark, { x: bx - bw / 2 - 0.02, y: ay, z: bz, cast: false, receive: false });
    }
    // coral neon edge on the outer rim (both faces)
    for (const nz of [bz + 0.048, bz - 0.048]) {
      D.neonTube(layer, new T.Vector3(bx + bw / 2 + 0.02, 2.53, nz), new T.Vector3(bx + bw / 2 + 0.02, 4.2, nz), 0.022, 0xff8a6a);
    }
    D.neonTube(
      layer,
      new T.Vector3(bx - bw / 2 - 0.03, 2.52, bz + 0.05),
      new T.Vector3(bx + bw / 2 + 0.03, 2.52, bz + 0.05),
      0.016,
      0xff8a6a
    );
    D.glowSprite(layer, { x: bx + bw / 2 + 0.08, y: 3.36, z: bz + 0.16, color: 0xff9472, size: 2.2, opacity: 0.42 });
    D.glowSprite(layer, { x: bx, y: 3.42, z: bz + 0.24, color: 0xffd9a6, size: 3.6, opacity: 0.36 });
    D.glowSprite(layer, { x: bx, y: 3.42, z: bz - 0.24, color: 0xffd9a6, size: 3.0, opacity: 0.28 });
    // small back-lit halo behind the blade on the wall
    D.glowSprite(layer, { x: 1.55, y: 3.2, z: bz, color: 0xffc48d, size: 2.0, opacity: 0.18 });
  }

  /* =========================================================
     INTERIOR — fixtures, lighting, product, fridges, counter
     ========================================================= */
  function makeGondola(layer, M, o) {
    const g = new T.Group();
    g.position.set(o.x, 0, o.z);
    if (o.ry) g.rotation.y = o.ry;
    layer.add(g);
    const w = o.w;
    const d = o.d;
    const h = o.h;
    const y0 = FLOOR;
    const rr = D.rng(o.seed || 7);

    // body
    D.box(g, w, 0.1, d, M.shelfSide, { y: y0 + 0.05, cast: true, receive: true });
    D.box(g, w, h, 0.05, M.shelfSide, { y: y0 + h / 2, z: -d / 2 + 0.025, cast: true, receive: true });
    D.box(g, 0.05, h, d, M.shelfSide, { x: -w / 2 + 0.025, y: y0 + h / 2, cast: true, receive: true });
    D.box(g, 0.05, h, d, M.shelfSide, { x: w / 2 - 0.025, y: y0 + h / 2, cast: true, receive: true });
    // header rail
    D.box(g, w, 0.07, d + 0.02, M.coral, { y: y0 + h - 0.03, cast: false, receive: true });

    const levels = o.levels || [0.14, 0.52, 0.9, 1.28];
    for (const ly of levels) {
      D.box(g, w - 0.1, 0.045, d - 0.04, M.shelf, {
        y: y0 + ly,
        z: 0.01,
        cast: true,
        receive: true,
      });
      // price strip along the front edge
      addPlane(g, w - 0.16, 0.05, M.price, 0, y0 + ly - 0.02, d / 2 + 0.006, 0, 0, 0);
      // product row
      const usable = w - 0.28;
      let px = -usable / 2;
      const maxH = ly >= 1.2 ? 0.2 : 0.3;
      for (let i = 0; i < 7; i++) {
        const pw = 0.12 + rr() * 0.09;
        const ph = 0.13 + rr() * maxH;
        const pd = 0.13 + rr() * 0.1;
        if (px + pw > usable / 2) break;
        D.box(g, pw, ph, pd, M.prod[Math.floor(rr() * M.prod.length)], {
          x: px + pw / 2,
          y: y0 + ly + 0.023 + ph / 2,
          z: d / 2 - 0.12,
          cast: false,
          receive: true,
        });
        px += pw + 0.025 + rr() * 0.035;
      }
    }
    return g;
  }

  function buildInterior(layer, M, TEX) {
    const lights = [];

    /* ---------------- ceiling fluorescent strips ---------------- */
    for (const sz of [-1.3, -3.3, -5.1]) {
      D.box(layer, 4.3, 0.05, 0.17, M.emWarm, { x: -3.6, y: CEIL - 0.035, z: sz, cast: false, receive: false });
      D.box(layer, 4.36, 0.04, 0.24, M.metalLight, { x: -3.6, y: CEIL - 0.008, z: sz, cast: false, receive: false });
      D.glowSprite(layer, { x: -3.6, y: CEIL - 0.12, z: sz, color: 0xffe7bd, size: 2.4, opacity: 0.12 });
    }
    D.box(layer, 1.7, 0.05, 0.17, M.emWarm, { x: 0.35, y: CEIL - 0.035, z: -2.4, cast: false, receive: false });
    D.box(layer, 1.76, 0.04, 0.24, M.metalLight, { x: 0.35, y: CEIL - 0.008, z: -2.4, cast: false, receive: false });
    // a few round ceiling downlights near the glass
    for (const dx of [-5.2, -3.2, -1.2, 0.6]) {
      D.cyl(layer, 0.09, 0.09, 0.02, 12, M.emWarm, { x: dx, y: CEIL - 0.02, z: -0.7, cast: false, receive: false });
    }

    /* ---------------- drink fridge wall (back right) ---------------- */
    const fg = new T.Group();
    fg.position.set(-0.4, 0, -5.68);
    layer.add(fg);
    D.box(fg, 3.0, 2.06, 0.56, M.metalDark, { y: 1.22, cast: true, receive: true });
    // lit bottle face
    const face = D.basic(0xffffff, { map: TEX.fridge, toneMapped: false });
    addPlane(fg, 2.9, 1.8, face, 0, 1.2, 0.285, 0, 0, 0);
    // glass sheen over the doors
    const fglass = addPlane(fg, 2.9, 1.8, M.glassThin, 0, 1.2, 0.3, 0, 0, 0);
    fglass.renderOrder = 3;
    // door frames + handles
    for (let i = 0; i < 6; i++) {
      const fx = -1.45 + i * 0.58;
      D.box(fg, 0.035, 1.86, 0.05, M.metalLight, { x: fx, y: 1.2, z: 0.305, cast: false, receive: false });
      if (i < 5) {
        D.box(fg, 0.03, 0.5, 0.03, M.metalLight, { x: fx + 0.5, y: 1.15, z: 0.33, cast: false, receive: false });
      }
    }
    D.box(fg, 2.92, 0.09, 0.06, M.metalLight, { y: 2.15, z: 0.31, cast: false, receive: false });
    D.box(fg, 2.92, 0.13, 0.06, M.metalDark, { y: 0.33, z: 0.31, cast: false, receive: false });
    // lit header lightbox
    D.box(fg, 2.9, 0.22, 0.07, M.signBack, { y: 2.32, z: 0.33, cast: true, receive: true });
    addPlane(fg, 2.82, 0.18, D.basic(0xffffff, { map: TEX.drinkHeader, toneMapped: false }), 0, 2.32, 0.372, 0, 0, 0);
    D.glowSprite(layer, { x: -0.4, y: 1.5, z: -5.2, color: 0xcdeeff, size: 2.8, opacity: 0.22 });
    D.glowSprite(layer, { x: 0.4, y: 1.0, z: -5.12, color: 0xffe2b0, size: 1.8, opacity: 0.16 });

    /* interior posters above the fridges (close-up detail) */
    addPlane(layer, 0.5, 0.66, M.poster(TEX.posterCoffee), -1.5, 2.7, GZ0 + 0.01, 0, 0, 0);
    addPlane(layer, 0.5, 0.66, M.poster(TEX.posterKaraage), -0.9, 2.7, GZ0 + 0.01, 0, 0, 0);
    addPlane(layer, 0.46, 0.6, M.poster(TEX.posterATM), -2.1, 2.68, GZ0 + 0.01, 0, 0, 0);

    /* ---------------- magazine rack along the front glass ---------------- */
    const mg = new T.Group();
    mg.position.set(-4.35, 0, -0.72);
    layer.add(mg);
    D.box(mg, 4.2, 0.5, 0.44, M.tealDark, { y: FLOOR + 0.25, cast: true, receive: true });
    D.box(mg, 4.24, 0.045, 0.48, M.shelf, { y: FLOOR + 0.52, cast: true, receive: true });
    D.box(mg, 4.2, 0.16, 0.05, M.coral, { y: FLOOR + 0.42, z: 0.215, cast: false, receive: false });
    // slanted magazine display
    const magPlane = addPlane(
      mg,
      4.1,
      0.95,
      D.basic(0xffffff, { map: TEX.magazines, toneMapped: true }),
      0,
      FLOOR + 0.99,
      -0.02,
      -0.3,
      0,
      0
    );
    magPlane.renderOrder = 2;
    // shelf lip
    D.box(mg, 4.2, 0.05, 0.1, M.metalDark, { y: FLOOR + 0.565, z: 0.22, cast: false, receive: false });
    // 3D magazines leaning in front of the display
    for (let i = 0; i < 5; i++) {
      const mm = D.box(mg, 0.27, 0.35, 0.035, M.prod[i % M.prod.length], {
        x: -1.7 + i * 0.85,
        y: FLOOR + 0.72,
        z: 0.19,
        rx: -0.28,
        cast: false,
        receive: true,
      });
      D.box(mg, 0.22, 0.05, 0.037, M.cream, {
        x: -1.68 + i * 0.85,
        y: FLOOR + 0.84,
        z: 0.215,
        rx: -0.28,
        cast: false,
        receive: false,
      });
    }
    // little hanging POP sign on the rack
    addPlane(mg, 0.62, 0.26, M.poster(TEX.stickerOpen), 1.55, FLOOR + 1.12, 0.28, 0, 0, 0);

    /* ---------------- two front gondolas ---------------- */
    makeGondola(layer, M, {
      x: -4.4,
      z: -1.78,
      w: 3.0,
      h: 1.62,
      d: 0.76,
      seed: 11,
      levels: [0.14, 0.5, 0.88, 1.26],
    });
    makeGondola(layer, M, {
      x: -4.2,
      z: -3.16,
      w: 2.9,
      h: 1.34,
      d: 0.72,
      seed: 23,
      levels: [0.14, 0.46, 0.78, 1.08],
    });
    /* east aisle gondola facing the side window (seen through east glass) */
    makeGondola(layer, M, {
      x: 0.47,
      z: -3.35,
      w: 2.1,
      h: 1.5,
      d: 0.64,
      ry: -Math.PI / 2,
      seed: 37,
      levels: [0.14, 0.48, 0.84, 1.18],
    });

    /* ---------------- checkout counter ---------------- */
    const cg = new T.Group();
    cg.position.set(-1.45, 0, -1.55);
    layer.add(cg);
    D.box(cg, 1.9, 0.82, 0.62, M.counter, { y: FLOOR + 0.41, cast: true, receive: true });
    D.box(cg, 1.92, 0.4, 0.02, M.cream, { y: FLOOR + 0.36, z: 0.32, cast: false, receive: false });
    D.box(cg, 1.92, 0.03, 0.024, M.coral, { y: FLOOR + 0.6, z: 0.322, cast: false, receive: false });
    D.box(cg, 2.0, 0.06, 0.7, M.counterTop, { y: FLOOR + 0.85, cast: true, receive: true });
    // register + screen
    D.box(cg, 0.3, 0.1, 0.26, M.metalDark, { x: 0.1, y: FLOOR + 0.93, z: -0.02, cast: true });
    D.box(cg, 0.07, 0.22, 0.05, M.metalDark, { x: 0.1, y: FLOOR + 1.08, z: -0.08, cast: false });
    const regScreen = D.box(cg, 0.36, 0.26, 0.05, M.metalDark, { x: 0.1, y: FLOOR + 1.22, z: -0.05, rx: -0.25, cast: false });
    addPlane(
      cg,
      0.3,
      0.2,
      D.basic(0x1a3b3a, { toneMapped: false }),
      0.1,
      FLOOR + 1.22,
      -0.022,
      -0.25,
      0,
      0
    );
    D.glowSprite(layer, { x: -1.35, y: FLOOR + 1.25, z: -1.6, color: 0x8ff0dc, size: 0.7, opacity: 0.25 });
    // coffee machine
    D.box(cg, 0.4, 0.52, 0.36, M.metalDark, { x: 0.6, y: FLOOR + 1.16, z: -0.02, cast: true, receive: true });
    D.box(cg, 0.44, 0.06, 0.4, M.metalLight, { x: 0.6, y: FLOOR + 1.45, z: -0.02, cast: true });
    D.box(cg, 0.34, 0.2, 0.02, M.emCoral, { x: 0.6, y: FLOOR + 1.2, z: 0.17, cast: false, receive: false });
    D.box(cg, 0.26, 0.08, 0.2, M.metalLight, { x: 0.6, y: FLOOR + 0.94, z: 0.14, cast: false });
    D.box(cg, 0.09, 0.11, 0.09, M.cream, { x: 0.44, y: FLOOR + 0.95, z: 0.2, cast: false });
    D.glowSprite(layer, { x: -0.85, y: FLOOR + 1.2, z: -1.4, color: 0xffa878, size: 0.7, opacity: 0.3 });
    // hot snack warmer
    D.box(cg, 0.46, 0.1, 0.32, M.metalDark, { x: -0.72, y: FLOOR + 0.92, z: -0.02, cast: true });
    D.box(cg, 0.4, 0.22, 0.26, M.emWarm, { x: -0.72, y: FLOOR + 1.06, z: -0.02, cast: false });
    const hotGlass = addPlane(cg, 0.44, 0.3, M.glassThin, -0.72, FLOOR + 1.1, 0.1, 0, 0, 0);
    hotGlass.renderOrder = 4;
    D.glowSprite(layer, { x: -2.17, y: FLOOR + 1.1, z: -1.5, color: 0xffb066, size: 0.7, opacity: 0.32 });
    // cup stack + card reader
    for (let i = 0; i < 3; i++) {
      D.cyl(cg, 0.045, 0.035, 0.075, 10, M.cream, { x: 0.34, y: FLOOR + 0.92 + i * 0.078, z: 0.06, cast: false });
    }
    D.box(cg, 0.12, 0.06, 0.1, M.metalDark, { x: -0.25, y: FLOOR + 0.91, z: 0.18, cast: false });

    /* behind-counter cigarette / candy wall */
    const cw = new T.Group();
    cw.position.set(-1.45, 0, -2.18);
    layer.add(cw);
    D.box(cw, 1.8, 2.0, 0.3, M.shelfSide, { y: FLOOR + 1.0, cast: true, receive: true });
    addPlane(cw, 1.66, 1.36, D.basic(0xffffff, { map: TEX.cigWall, toneMapped: true }), 0, FLOOR + 1.05, 0.155, 0, 0, 0);
    D.box(cw, 1.82, 0.2, 0.34, M.tealDark, { y: FLOOR + 2.02, cast: true, receive: true });
    addPlane(cw, 1.5, 0.14, D.basic(0xffffff, { map: TEX.drinkHeader, toneMapped: true }), 0, FLOOR + 2.02, 0.172, 0, 0, 0);

    /* ---------------- chest freezer near the door ---------------- */
    const fr = new T.Group();
    fr.position.set(0.42, 0, -1.95);
    layer.add(fr);
    D.box(fr, 0.82, 0.78, 0.62, M.cream, { y: FLOOR + 0.39, cast: true, receive: true });
    D.box(fr, 0.84, 0.1, 0.64, M.teal, { y: FLOOR + 0.06, cast: false, receive: true });
    D.box(fr, 0.8, 0.05, 0.58, M.emCool, { y: FLOOR + 0.82, cast: false, receive: false });
    const fz = addPlane(fr, 0.8, 0.58, M.glassThin, 0, FLOOR + 0.86, 0, -Math.PI / 2 + 0.02, 0, 0);
    fz.renderOrder = 3;
    D.box(fr, 0.76, 0.02, 0.5, M.glassThin, { y: FLOOR + 0.88, cast: false });
    D.box(fr, 0.5, 0.16, 0.02, M.coral, { y: FLOOR + 0.62, z: 0.32, cast: false, receive: false });
    addPlane(fr, 0.46, 0.13, M.poster(TEX.posterIce), 0, FLOOR + 0.62, 0.333, 0, 0, 0);
    D.glowSprite(layer, { x: 0.42, y: FLOOR + 1.0, z: -1.8, color: 0x9fe4ff, size: 1.1, opacity: 0.25 });

    /* ---------------- floor light pools ---------------- */
    D.lightPool(layer, { x: -3.2, z: -1.4, w: 4.6, l: 2.4, color: 0xffc98d, opacity: 0.2, y: FLOOR + 0.012 });
    D.lightPool(layer, { x: 0.2, z: -2.4, w: 3.2, l: 2.4, color: 0xffd6a4, opacity: 0.16, y: FLOOR + 0.012 });
    D.lightPool(layer, { x: -0.2, z: -0.1, w: 2.2, l: 1.6, color: 0xffc07a, opacity: 0.22, y: FLOOR + 0.012 });

    /* ---------------- interior point lights ---------------- */
    const L1 = new T.PointLight(0xffd49b, 13, 8, 1.6);
    L1.position.set(-3.3, 2.5, -1.2);
    layer.add(L1);
    const L2 = new T.PointLight(0xffe3bb, 10, 7, 1.7);
    L2.position.set(0.0, 2.4, -3.6);
    layer.add(L2);
    const L3 = new T.PointLight(0xd6f2ff, 5, 3.6, 1.8);
    L3.position.set(0.3, 1.8, -4.9);
    layer.add(L3);
    lights.push(L1, L2, L3);

    return lights;
  }

  /* =========================================================
     ROOFTOP — AC units, vents, railing, antenna
     ========================================================= */
  function buildRoof(layer, M, TEX) {
    function acUnit(x, z, ry) {
      const g = new T.Group();
      g.position.set(x, EAVE - 0.02, z);
      g.rotation.y = ry || 0;
      layer.add(g);
      D.box(g, 0.92, 0.6, 0.46, M.roofBody, { y: 0.32, cast: true, receive: true });
      D.box(g, 0.86, 0.06, 0.42, M.metalDark, { y: 0.635, cast: false, receive: false });
      // front fan grille
      addPlane(g, 0.56, 0.56, D.basic(0xffffff, { map: TEX.acGrille, toneMapped: true }), 0, 0.34, 0.235, 0, 0, 0);
      D.torus(g, 0.29, 0.02, 6, 20, M.metalDark, { y: 0.34, z: 0.245, rx: Math.PI / 2, cast: false });
      // side details
      D.box(g, 0.05, 0.28, 0.34, M.metalDark, { x: -0.44, y: 0.34, cast: false });
      D.box(g, 0.05, 0.14, 0.3, M.metal, { x: 0.465, y: 0.42, cast: false });
      for (const fx of [-0.3, 0.3]) {
        D.box(g, 0.1, 0.08, 0.5, M.metalDark, { x: fx, y: 0.04, cast: false });
      }
      D.cyl(g, 0.028, 0.028, 0.34, 6, M.metalLight, { x: 0.28, y: 0.76, z: -0.12, cast: false });
    }

    acUnit(-5.2, -3.3, 0.12);
    acUnit(-2.05, -4.75, 0.5);
    acUnit(0.4, -2.15, -0.35);

    // vent stacks
    const vents = [
      [-4.05, -5.3, 0.16, 0.62],
      [0.72, -5.5, 0.11, 0.42],
      [-6.05, -2.3, 0.13, 0.5],
    ];
    for (const v of vents) {
      D.cyl(layer, v[2], v[2], v[3], 10, M.vent, { x: v[0], y: EAVE + v[3] / 2, z: v[1], cast: true, receive: true });
      D.cyl(layer, v[2] * 1.55, v[2] * 1.35, 0.055, 10, M.metalDark, {
        x: v[0],
        y: EAVE + v[3] + 0.02,
        z: v[1],
        cast: true,
      });
    }
    // box vent hood
    D.box(layer, 0.44, 0.3, 0.4, M.metalDark, { x: -1.15, y: EAVE + 0.15, z: -3.3, cast: true });
    D.box(layer, 0.5, 0.05, 0.46, M.roof, { x: -1.15, y: EAVE + 0.32, z: -3.3, cast: false });
    // roof hatch
    D.box(layer, 0.72, 0.1, 0.72, M.metalDark, { x: 0.25, y: EAVE + 0.05, z: -5.5, cast: true });
    D.box(layer, 0.8, 0.04, 0.8, M.roof, { x: 0.25, y: EAVE + 0.11, z: -5.5, cast: false });

    // low railing along the back roof edge
    const railY = EAVE + 0.02;
    for (let i = 0; i < 5; i++) {
      D.cyl(layer, 0.022, 0.022, 0.56, 6, M.metalDark, {
        x: -6.1 + i * 0.72,
        y: railY + 0.28,
        z: -5.82,
        cast: false,
      });
    }
    D.box(layer, 3.0, 0.035, 0.035, M.metal, { x: -4.66, y: railY + 0.5, z: -5.82, cast: false });
    D.box(layer, 3.0, 0.03, 0.03, M.metal, { x: -4.66, y: railY + 0.26, z: -5.82, cast: false });

    // antenna mast
    D.cyl(layer, 0.018, 0.022, 1.35, 6, M.metal, { x: -6.25, y: EAVE + 0.68, z: -5.2, cast: false });
    for (let i = 0; i < 3; i++) {
      D.box(layer, 0.7, 0.018, 0.018, M.metal, {
        x: -6.25,
        y: EAVE + 0.55 + i * 0.28,
        z: -5.2,
        cast: false,
      });
    }
    D.box(layer, 0.02, 0.02, 0.6, M.metal, { x: -6.25, y: EAVE + 1.1, z: -5.2, cast: false });

    // conduit runs across the parapet
    D.box(layer, 0.06, 0.06, 5.6, M.metalDark, { x: -6.45, y: EAVE + 0.34, z: -2.7, cast: false });
    D.box(layer, 4.4, 0.06, 0.06, M.metalDark, { x: -3.7, y: EAVE + 0.34, z: -5.8, cast: false });
  }

  /* =========================================================
     SERVICE SIDES — back + west walls
     ========================================================= */
  function buildService(layer, M, TEX) {
    /* ---------------- back wall (faces -Z) ---------------- */
    // service door
    D.box(layer, 1.0, 2.05, 0.08, M.metalDark, { x: -4.4, y: FLOOR + 1.03, z: Z0 - 0.05, cast: true, receive: true });
    for (const dx of [-0.52, 0.52]) {
      D.box(layer, 0.06, 2.12, 0.06, M.metal, { x: -4.4 + dx, y: FLOOR + 1.05, z: Z0 - 0.07, cast: false });
    }
    D.box(layer, 1.1, 0.07, 0.06, M.metal, { x: -4.4, y: FLOOR + 2.12, z: Z0 - 0.07, cast: false });
    D.box(layer, 0.06, 0.2, 0.06, M.metalLight, { x: -4.0, y: FLOOR + 1.02, z: Z0 - 0.1, cast: false });
    addPlane(layer, 0.5, 0.22, M.poster(TEX.staff), -4.4, FLOOR + 1.72, Z0 - 0.095, 0, Math.PI, 0);
    // lamp over the door
    D.lampGlow(layer, { x: -4.4, y: FLOOR + 2.5, z: Z0 - 0.12, color: 0xffb877, size: 1.3, glow: 1.5, glowOpacity: 0.5 });

    // barred little window
    D.box(layer, 0.92, 0.72, 0.07, M.metalDark, { x: -2.35, y: FLOOR + 1.95, z: Z0 - 0.04, cast: true });
    addPlane(layer, 0.78, 0.58, M.glassThin, -2.35, FLOOR + 1.95, Z0 - 0.085, 0, Math.PI, 0);
    for (let i = 0; i < 3; i++) {
      D.box(layer, 0.035, 0.62, 0.035, M.metalLight, {
        x: -2.62 + i * 0.27,
        y: FLOOR + 1.95,
        z: Z0 - 0.095,
        cast: false,
      });
    }

    // pipes and vents
    for (const px of [-6.05, -1.2]) {
      D.cyl(layer, 0.05, 0.05, EAVE - 0.2, 8, M.metalLight, {
        x: px,
        y: (EAVE - 0.2) / 2 + 0.16,
        z: Z0 - 0.09,
        cast: false,
        receive: true,
      });
    }
    D.box(layer, 0.05, 0.06, 4.6, M.metalDark, { x: -6.05, y: 2.6, z: -4.0, cast: false });
    D.box(layer, 0.06, 0.5, 0.66, M.metalDark, { x: -3.1, y: FLOOR + 0.85, z: Z0 - 0.06, cast: false });
    for (let i = 0; i < 4; i++) {
      D.box(layer, 0.07, 0.04, 0.6, M.metal, { x: -3.1, y: FLOOR + 0.68 + i * 0.1, z: Z0 - 0.08, cast: false });
    }
    // small wall-mounted AC box
    D.box(layer, 0.62, 0.4, 0.24, M.roofBody, { x: -5.35, y: FLOOR + 2.3, z: Z0 - 0.14, cast: true });
    addPlane(layer, 0.5, 0.3, D.basic(0xffffff, { map: TEX.acGrille, toneMapped: true }), -5.35, FLOOR + 2.3, Z0 - 0.265, 0, Math.PI, 0);

    /* ---------------- west wall (faces -X) ---------------- */
    D.box(layer, 0.08, 2.05, 0.95, M.metalDark, { x: X0 - 0.05, y: FLOOR + 1.03, z: -4.15, cast: true, receive: true });
    for (const dz of [-0.5, 0.5]) {
      D.box(layer, 0.06, 2.12, 0.06, M.metal, { x: X0 - 0.07, y: FLOOR + 1.05, z: -4.15 + dz, cast: false });
    }
    D.box(layer, 0.06, 0.07, 1.05, M.metal, { x: X0 - 0.07, y: FLOOR + 2.12, z: -4.15, cast: false });
    D.box(layer, 0.06, 0.2, 0.06, M.metalLight, { x: X0 - 0.1, y: FLOOR + 1.02, z: -3.75, cast: false });
    addPlane(layer, 0.5, 0.22, M.poster(TEX.staff), X0 - 0.095, FLOOR + 1.72, -4.15, 0, -Math.PI / 2, 0);
    D.lampGlow(layer, { x: X0 - 0.14, y: FLOOR + 2.5, z: -4.15, color: 0xffb877, size: 1.2, glow: 1.3, glowOpacity: 0.45 });
    // meter box + vent
    D.box(layer, 0.12, 0.46, 0.36, M.metalLight, { x: X0 - 0.06, y: 1.7, z: -2.2, cast: true });
    D.box(layer, 0.05, 0.42, 0.62, M.metalDark, { x: X0 - 0.05, y: 0.95, z: -5.3, cast: false });
    for (let i = 0; i < 3; i++) {
      D.box(layer, 0.06, 0.04, 0.56, M.metal, { x: X0 - 0.07, y: 0.78 + i * 0.12, z: -5.3, cast: false });
    }
    // pipe run up the alley wall
    D.cyl(layer, 0.045, 0.045, EAVE - 0.3, 8, M.metalLight, { x: X0 - 0.1, y: (EAVE - 0.3) / 2 + 0.2, z: -5.9, cast: false });
  }

  /* =========================================================
     GLOW — warm spill, wet light pools, night bloom helpers
     ========================================================= */
  function buildGlow(layer, M, TEX) {
    // warm interior bleeding through the front glass
    D.glowSprite(layer, { x: -5.3, y: 1.5, z: 0.85, color: 0xffc48a, size: 3.6, opacity: 0.13 });
    D.glowSprite(layer, { x: -2.6, y: 1.6, z: 0.85, color: 0xffc48a, size: 3.2, opacity: 0.12 });
    D.glowSprite(layer, { x: 0.06, y: 1.4, z: 0.85, color: 0xffc07a, size: 2.8, opacity: 0.16 });
    // east window spill
    D.glowSprite(layer, { x: 1.55, y: 1.6, z: -1.6, color: 0xffcf98, size: 3.8, opacity: 0.12 });
    D.glowSprite(layer, { x: 1.55, y: 1.5, z: -3.6, color: 0xbfeaff, size: 3.2, opacity: 0.16 });
    // light spilling on the forecourt
    D.lightPool(layer, { x: -2.7, z: 1.9, w: 8.2, l: 2.6, color: 0xffbd85, opacity: 0.2, y: 0.156 });
    D.lightPool(layer, { x: 0.05, z: 1.5, w: 3.0, l: 2.2, color: 0xffc78f, opacity: 0.24, y: 0.157 });
    D.floorGlow(layer, { x: 0.05, z: 2.9, w: 2.4, l: 4.4, color: 0xff9a5a, opacity: 0.22, y: 0.158 });
    D.lightPool(layer, { x: 2.5, z: -3.1, w: 2.6, l: 4.2, color: 0xbfe8ff, opacity: 0.13, y: 0.156, rotation: Math.PI / 2 });
  }

  /* =========================================================
     BUILD ENTRY
     ========================================================= */
  D.buildStore = function (layer) {
    const TEX = makeTextures();
    const M = makeMaterials(TEX);

    buildShell(layer, M);
    buildFrontFacade(layer, M, TEX);
    const sensorLed = buildDoor(layer, M, TEX);
    buildEastFacade(layer, M, TEX);
    buildCanopy(layer, M, TEX);
    buildSignage(layer, M, TEX);
    buildInterior(layer, M, TEX);
    buildRoof(layer, M, TEX);
    buildService(layer, M, TEX);
    buildGlow(layer, M, TEX);

    let meshCount = 0;
    layer.traverse((o) => {
      if (o.isMesh) meshCount++;
    });
    D.storeInfo = { meshes: meshCount };
    D.anchors = D.anchors || {};
    D.anchors.storeSign = new T.Vector3(CX, FASCIA_Y, 0.95);
    D.anchors.storeDoor = new T.Vector3(0.04, 1.3, 0.7);

    // tiny living details: blinking sensor + softly pulsing fridge glow
    const ledMat = sensorLed && sensorLed.material;
    let t = 0;
    D.onUpdate((dt) => {
      t += dt;
      if (ledMat) ledMat.opacity = 0.55 + Math.sin(t * 2.4) * 0.3;
      if (D.storeInfo) D.storeInfo.time = t;
    });
  };
})();
