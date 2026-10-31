/* =========================================================
   星降マート — street props builder
   vending machine, mamachari bicycle, umbrella stand, recycling
   bins, cork notice board, A-frame sign, Japanese road signs,
   curved-arm street lamp, concrete utility pole + sagging wires,
   corner pipe guardrail, doorstep mat, AC units, sleeping cat,
   potted plants.  All procedural, toon-shaded, canvas labels.
   ========================================================= */
(function () {
  'use strict';

  const D = window.DIORAMA;
  const T = THREE;
  const C = D.config;
  const P = D.palette;
  const Y = C.Y;

  /* ------------------------------------------------------------------
     tiny local helpers
     ------------------------------------------------------------------ */
  function V(x, y, z) {
    return new T.Vector3(x, y, z);
  }

  function grp(parent, x, y, z, ry) {
    const g = new T.Group();
    g.position.set(x || 0, y || 0, z || 0);
    if (ry) g.rotation.y = ry;
    if (parent) parent.add(g);
    return g;
  }

  /* cylinder between two points (frame tubes, pipes, posts) */
  function strut(parent, a, b, r, mat, opts) {
    opts = opts || {};
    const dir = new T.Vector3().subVectors(b, a);
    const len = dir.length();
    if (len < 1e-5) return null;
    const m = D.cyl(parent, r, r, len, opts.seg || 8, mat, {
      cast: opts.cast !== undefined ? opts.cast : true,
      receive: opts.receive !== undefined ? opts.receive : true,
    });
    m.position.copy(a).add(b).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), dir.normalize());
    if (opts.noOutline) m.userData.noOutline = true;
    return m;
  }

  /* catenary-ish sagging cable through a & b (D.tube of a curved path) */
  function cable(parent, a, b, sag, r, mat, opts) {
    opts = opts || {};
    const n = opts.steps || 6;
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      pts.push(
        new T.Vector3(
          a.x + (b.x - a.x) * t,
          a.y + (b.y - a.y) * t - sag * Math.sin(Math.PI * t),
          a.z + (b.z - a.z) * t
        )
      );
    }
    const m = D.tube(parent, pts, r, mat, {
      segments: opts.segments || 26,
      radial: opts.radial || 4,
      cast: false,
    });
    m.userData.noOutline = true;
    return m;
  }

  function tex(w, h, draw, opts) {
    return D.canvasTexture(w, h, draw, opts || { clamp: true });
  }

  /* unlit texture plane (sign faces, labels, posters) */
  function signFace(parent, map, w, h, opts) {
    opts = opts || {};
    const mat = new T.MeshBasicMaterial({
      map: map,
      transparent: !!opts.transparent,
      opacity: opts.opacity !== undefined ? opts.opacity : 1,
      alphaTest: opts.alphaTest || 0,
      side: opts.side !== undefined ? opts.side : T.FrontSide,
      toneMapped: opts.toneMapped !== undefined ? opts.toneMapped : false,
      fog: opts.fog !== undefined ? opts.fog : false,
      depthWrite: opts.depthWrite !== undefined ? opts.depthWrite : true,
    });
    const m = D.plane(parent, w, h, mat, {
      x: opts.x || 0,
      y: opts.y || 0,
      z: opts.z || 0,
      rx: opts.rx,
      ry: opts.ry,
      rz: opts.rz,
      cast: false,
      receive: false,
      renderOrder: opts.renderOrder || 5,
    });
    m.userData.noOutline = true;
    return m;
  }

  /* ------------------------------------------------------------------
     canvas textures
     ------------------------------------------------------------------ */
  function texVendingHeader() {
    return tex(512, 112, (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#0c4a4e');
      g.addColorStop(1, '#0a3438');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(140,240,255,0.16)';
      ctx.fillRect(0, 0, w, 8);
      ctx.fillStyle = '#ffd45e';
      ctx.beginPath();
      ctx.arc(52, 56, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0a3438';
      D.drawText(ctx, '★', 52, 58, { font: '700 30px "Yu Gothic", sans-serif' });
      D.drawText(ctx, 'つめた〜い', 210, 40, {
        font: '700 34px "Yu Gothic", "Meiryo", "MS Gothic", sans-serif',
        color: '#fff4d8',
      });
      D.drawText(ctx, 'HOSHIFURI  DRINK', 210, 82, {
        font: '700 24px "Yu Gothic", "Meiryo", sans-serif',
        color: '#8fe6ea',
      });
      ctx.fillStyle = '#ff6d5d';
      ctx.fillRect(430, 26, 60, 62);
      D.drawText(ctx, '24', 460, 58, { font: '700 34px "Yu Gothic", sans-serif', color: '#fff4e2' });
      ctx.fillStyle = 'rgba(255,255,255,0.10)';
      ctx.fillRect(0, h - 6, w, 6);
    });
  }

  function texVendingDisplay() {
    return tex(512, 400, (ctx, w, h) => {
      // dark lit interior of the display window
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#06222c');
      g.addColorStop(0.55, '#0a3540');
      g.addColorStop(1, '#0e4450');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      // soft glow columns behind the real 3D cans (rows sit at y=1.16 / 1.39)
      for (let i = 0; i < 5; i++) {
        const x = 30 + i * 96;
        const rg = ctx.createRadialGradient(x + 24, 300, 6, x + 24, 300, 120);
        rg.addColorStop(0, 'rgba(180,240,255,0.40)');
        rg.addColorStop(1, 'rgba(140,220,255,0)');
        ctx.fillStyle = rg;
        ctx.fillRect(x - 40, 160, 150, 240);
      }
      // top row: small drawn cans (the upper shelf has no 3D props)
      const topCols = ['#ff6d5d', '#ffd45e', '#6fd8c8', '#8fb0ff', '#ff9ac4', '#f5efe2'];
      for (let i = 0; i < 6; i++) {
        const x = 22 + i * 80;
        // glow
        ctx.fillStyle = 'rgba(160,236,255,0.16)';
        D.roundRect(ctx, x - 8, 8, 66, 96, 14);
        ctx.fill();
        ctx.fillStyle = topCols[i];
        D.roundRect(ctx, x, 20, 52, 70, 9);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        D.roundRect(ctx, x + 5, 23, 42, 7, 3);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.86)';
        D.roundRect(ctx, x + 4, 44, 44, 22, 3);
        ctx.fill();
        ctx.fillStyle = 'rgba(24,44,60,0.8)';
        ctx.font = '700 11px "Yu Gothic", "Meiryo", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(['COLD', 'TEA', 'MILK', 'SODA', 'CAFE', 'AQUA'][i], x + 26, 59);
        // price tag hanging under the shelf
        ctx.fillStyle = '#e83b3b';
        ctx.fillRect(x + 2, 96, 48, 13);
        ctx.fillStyle = '#fff6e6';
        ctx.font = '700 10px "Yu Gothic", sans-serif';
        ctx.fillText('¥120', x + 26, 106);
      }
      // glowing shelf strips aligned with the 3D shelves
      for (const y of [153, 307]) {
        ctx.fillStyle = 'rgba(236,252,255,0.94)';
        ctx.fillRect(0, y, w, 6);
        const sg = ctx.createLinearGradient(0, y + 6, 0, y + 30);
        sg.addColorStop(0, 'rgba(150,225,255,0.42)');
        sg.addColorStop(1, 'rgba(120,200,255,0)');
        ctx.fillStyle = sg;
        ctx.fillRect(0, y + 6, w, 26);
      }
      // bottom price strip
      ctx.fillStyle = '#d93a3a';
      ctx.fillRect(0, h - 42, w, 30);
      for (let i = 0; i < 6; i++) {
        D.drawText(ctx, '¥120', 44 + i * 84, h - 26, {
          font: '700 21px "Yu Gothic", "Meiryo", sans-serif',
          color: '#fff6e6',
        });
      }
      ctx.fillStyle = 'rgba(190,240,255,0.7)';
      D.drawText(ctx, 'つめた〜い  のみもの', w / 2, h - 58, {
        font: '700 18px "Yu Gothic", "Meiryo", sans-serif',
      });
      // glass glare
      const gl = ctx.createLinearGradient(0, 0, w, h);
      gl.addColorStop(0, 'rgba(255,255,255,0)');
      gl.addColorStop(0.4, 'rgba(255,255,255,0.12)');
      gl.addColorStop(0.5, 'rgba(255,255,255,0.02)');
      gl.addColorStop(1, 'rgba(160,220,255,0)');
      ctx.fillStyle = gl;
      ctx.fillRect(0, 0, w, h);
    });
  }

  function texButtonPanel() {
    return tex(384, 112, (ctx, w, h) => {
      ctx.fillStyle = '#191d27';
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 6; i++) {
        const x = 12 + i * 61;
        ctx.fillStyle = i % 2 ? '#2b3648' : '#313e52';
        D.roundRect(ctx, x, 14, 50, 84, 10);
        ctx.fill();
        ctx.strokeStyle = 'rgba(140,235,255,0.8)';
        ctx.lineWidth = 2;
        D.roundRect(ctx, x, 14, 50, 84, 10);
        ctx.stroke();
        D.drawText(ctx, String(i + 1), x + 25, 40, {
          font: '700 22px "Yu Gothic", sans-serif',
          color: '#bff4ff',
        });
        D.drawText(ctx, '¥120', x + 25, 78, {
          font: '700 16px "Yu Gothic", sans-serif',
          color: '#ffd98a',
        });
      }
    });
  }

  function texCoinPanel() {
    return tex(256, 256, (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, h, 0);
      g.addColorStop(0, '#aeb6c2');
      g.addColorStop(1, '#7c8592');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#2a2f3a';
      D.roundRect(ctx, 16, 14, 224, 228, 16);
      ctx.fill();
      D.drawText(ctx, '硬貨', 68, 52, { font: '700 28px "Yu Gothic", sans-serif', color: '#f2efe6' });
      D.drawText(ctx, 'COIN', 68, 82, { font: '700 18px "Meiryo", sans-serif', color: '#8fa4b8' });
      D.drawText(ctx, '紙幣  BILL', 170, 52, { font: '700 18px "Yu Gothic", sans-serif', color: '#8fa4b8' });
      // coin slot
      ctx.fillStyle = '#0b0d12';
      ctx.fillRect(58, 104, 18, 70);
      ctx.fillStyle = '#c8d2de';
      ctx.fillRect(55, 100, 24, 6);
      // bill slot
      ctx.fillStyle = '#0b0d12';
      ctx.fillRect(146, 126, 84, 12);
      // coin return lever
      ctx.fillStyle = '#ff6d5d';
      D.roundRect(ctx, 176, 168, 60, 34, 8);
      ctx.fill();
      D.drawText(ctx, '返却', 206, 186, { font: '700 20px "Yu Gothic", sans-serif', color: '#2a1414' });
      // coin return dish
      ctx.fillStyle = '#0b0d12';
      ctx.beginPath();
      ctx.arc(196, 226, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e9e2cf';
      ctx.beginPath();
      ctx.arc(196, 226, 12, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function texDelivery() {
    return tex(256, 80, (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      D.drawText(ctx, '取出口', 128, 28, {
        font: '700 30px "Yu Gothic", "Meiryo", sans-serif',
        color: '#f6e8c8',
      });
      D.drawText(ctx, 'PUSH  ▶', 128, 60, {
        font: '700 22px "Yu Gothic", "Meiryo", sans-serif',
        color: '#ffb45e',
      });
    });
  }

  function texVendingSideSticker() {
    return tex(256, 256, (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#f4ead4';
      D.roundRect(ctx, 8, 8, 240, 240, 18);
      ctx.fill();
      ctx.strokeStyle = '#0d5b58';
      ctx.lineWidth = 6;
      D.roundRect(ctx, 16, 16, 224, 224, 14);
      ctx.stroke();
      // snow flake
      ctx.strokeStyle = '#2c9b91';
      ctx.lineWidth = 5;
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(128, 74);
        ctx.lineTo(128 + Math.cos(a) * 42, 74 + Math.sin(a) * 42);
        ctx.stroke();
      }
      ctx.fillStyle = '#0d5b58';
      D.drawText(ctx, '星降マート', 128, 156, {
        font: '700 34px "Yu Gothic", "Meiryo", sans-serif',
      });
      ctx.fillStyle = '#c4472f';
      D.drawText(ctx, 'COLD DRINK', 128, 198, {
        font: '700 20px "Yu Gothic", sans-serif',
      });
    });
  }

  function texNoticeBoard() {
    const rr = D.rng(88);
    return tex(768, 640, (ctx, w, h) => {
      // cork
      ctx.fillStyle = '#a97c50';
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 5200; i++) {
        const v = 120 + Math.floor(rr() * 80);
        ctx.fillStyle = 'rgba(' + v + ',' + Math.floor(v * 0.78) + ',' + Math.floor(v * 0.5) + ',' + (0.08 + rr() * 0.26) + ')';
        ctx.fillRect(rr() * w, rr() * h, 1 + rr() * 4, 1 + rr() * 3);
      }
      ctx.fillStyle = 'rgba(60,38,20,0.18)';
      ctx.fillRect(0, 0, w, 18);
      ctx.fillRect(0, h - 18, w, 18);
      // header strip
      ctx.fillStyle = '#f0e5cd';
      ctx.fillRect(24, 20, 260, 40);
      D.drawText(ctx, '地域のお知らせ', 154, 41, {
        font: '700 24px "Yu Gothic", "Meiryo", sans-serif',
        color: '#3a3022',
      });
      // poster A: live
      ctx.fillStyle = '#ff6d5d';
      ctx.fillRect(40, 86, 210, 300);
      ctx.fillStyle = '#2a1730';
      ctx.fillRect(52, 98, 186, 276);
      ctx.save();
      ctx.translate(196, 150);
      ctx.rotate(-Math.PI / 2);
      D.drawText(ctx, 'LIVE', 0, 0, {
        font: '700 74px "Yu Gothic", "Meiryo", sans-serif',
        color: '#ffd45e',
      });
      ctx.restore();
      D.drawText(ctx, '星屑ナイト', 145, 300, {
        font: '700 28px "Yu Gothic", "Meiryo", sans-serif',
        color: '#fff1e0',
      });
      D.drawText(ctx, '9.22  sat  20:00', 145, 344, {
        font: '700 18px "Yu Gothic", sans-serif',
        color: '#ff9ac4',
      });
      // poster B: part time
      ctx.fillStyle = '#e8f1e8';
      ctx.fillRect(280, 68, 200, 290);
      ctx.strokeStyle = '#0d5b58';
      ctx.lineWidth = 6;
      ctx.strokeRect(280, 68, 200, 290);
      D.drawText(ctx, 'アルバイト', 380, 132, {
        font: '700 36px "Yu Gothic", "Meiryo", sans-serif',
        color: '#0d5b58',
      });
      D.drawText(ctx, '募集', 380, 176, {
        font: '700 36px "Yu Gothic", "Meiryo", sans-serif',
        color: '#0d5b58',
      });
      ctx.fillStyle = '#0d5b58';
      ctx.fillRect(306, 208, 148, 4);
      D.drawText(ctx, '深夜 22:00〜', 380, 250, {
        font: '700 20px "Yu Gothic", sans-serif',
        color: '#2c4a46',
      });
      D.drawText(ctx, '时给 1200円', 380, 290, {
        font: '700 22px "Yu Gothic", sans-serif',
        color: '#c4472f',
      });
      // poster C: sale
      ctx.fillStyle = '#ffd45e';
      ctx.fillRect(508, 92, 220, 250);
      D.drawText(ctx, 'SALE', 618, 152, {
        font: '700 54px "Yu Gothic", "Meiryo", sans-serif',
        color: '#c4472f',
      });
      ctx.fillStyle = '#c4472f';
      ctx.fillRect(524, 186, 188, 6);
      D.drawText(ctx, 'おでん 20% OFF', 618, 232, {
        font: '700 26px "Yu Gothic", sans-serif',
        color: '#3a2410',
      });
      D.drawText(ctx, '10.1〜10.8', 618, 278, {
        font: '700 22px "Yu Gothic", sans-serif',
        color: '#3a2410',
      });
      // paper notes
      ctx.save();
      ctx.translate(70, 430);
      ctx.rotate(-0.04);
      ctx.fillStyle = '#f3efe4';
      ctx.fillRect(0, 0, 250, 180);
      ctx.fillStyle = '#7d8b9a';
      for (let i = 0; i < 6; i++) ctx.fillRect(18, 30 + i * 24, 210 - (i % 3) * 34, 3);
      ctx.fillStyle = '#c4472f';
      D.drawText(ctx, '本日 特売', 120, 20, { font: '700 22px "Yu Gothic", sans-serif' });
      ctx.restore();
      ctx.save();
      ctx.translate(370, 400);
      ctx.rotate(0.03);
      ctx.fillStyle = '#f5f1e8';
      ctx.fillRect(0, 0, 330, 200);
      ctx.strokeStyle = '#9aa3ad';
      ctx.lineWidth = 2;
      for (let i = 0; i < 7; i++) {
        ctx.beginPath();
        ctx.moveTo(20, 40 + i * 24);
        ctx.lineTo(300 - (i % 2) * 50, 40 + i * 24);
        ctx.stroke();
      }
      ctx.fillStyle = '#1b4fa0';
      D.drawText(ctx, 'まちの掲示板', 165, 18, { font: '700 20px "Yu Gothic", sans-serif' });
      ctx.restore();
      // push pins
      const pins = [
        [140, 96, '#ff5b6e'],
        [372, 78, '#2c9b91'],
        [612, 100, '#ffb43e'],
        [86, 432, '#6ca8ff'],
        [388, 404, '#ff8fc0'],
      ];
      for (const p of pins) {
        ctx.fillStyle = 'rgba(0,0,0,0.28)';
        ctx.beginPath();
        ctx.arc(p[0] + 2, p[1] + 3, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = p[2];
        ctx.beginPath();
        ctx.arc(p[0], p[1], 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.beginPath();
        ctx.arc(p[0] - 2, p[1] - 3, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }

  function texAFrame() {
    return tex(512, 640, (ctx, w, h) => {
      ctx.fillStyle = '#141d20';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      for (let i = 0; i < 5; i++) ctx.fillRect(26, 180 + i * 90, w - 52, 3);
      ctx.strokeStyle = '#e9dfc4';
      ctx.lineWidth = 8;
      ctx.strokeRect(18, 18, w - 36, h - 36);
      ctx.strokeStyle = 'rgba(233,223,196,0.35)';
      ctx.lineWidth = 3;
      ctx.strokeRect(34, 34, w - 68, h - 68);
      D.drawText(ctx, '本日のおすすめ', w / 2, 92, {
        font: '700 46px "Yu Gothic", "Meiryo", "MS Gothic", sans-serif',
        color: '#ffe9b0',
      });
      ctx.fillStyle = '#ff6d5d';
      ctx.fillRect(140, 122, 232, 6);
      const items = [
        ['ホットコーヒー', '¥100'],
        ['肉まん', '¥120'],
        ['おでん', '¥90'],
        ['からあげ', '¥180'],
      ];
      for (let i = 0; i < items.length; i++) {
        const y = 210 + i * 78;
        D.drawText(ctx, items[i][0], 58, y, {
          font: '700 32px "Yu Gothic", "Meiryo", sans-serif',
          color: '#f2ebd6',
          align: 'left',
        });
        D.drawText(ctx, items[i][1], w - 58, y, {
          font: '700 32px "Yu Gothic", sans-serif',
          color: '#ffd45e',
          align: 'right',
        });
      }
      D.drawText(ctx, '★ あたたかい おでん ★', w / 2, 540, {
        font: '700 24px "Yu Gothic", sans-serif',
        color: '#8fe6ea',
      });
      D.drawText(ctx, 'OPEN  24H', w / 2, 584, {
        font: '700 30px "Yu Gothic", sans-serif',
        color: '#ff9ac4',
      });
    });
  }

  function texStopSign() {
    return tex(256, 256, (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(128, 244);
      ctx.lineTo(12, 34);
      ctx.lineTo(244, 34);
      ctx.closePath();
      ctx.fillStyle = '#cf2b25';
      ctx.fill();
      ctx.lineWidth = 18;
      ctx.strokeStyle = '#f5f1e8';
      ctx.stroke();
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(120,20,20,0.5)';
      ctx.stroke();
      D.drawText(ctx, '止まれ', 128, 112, {
        font: '700 44px "Yu Gothic", "Meiryo", "MS Gothic", sans-serif',
        color: '#fff8ec',
      });
    });
  }

  function texParkingSign() {
    return tex(256, 320, (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#1b4fa0';
      D.roundRect(ctx, 8, 8, 240, 304, 18);
      ctx.fill();
      ctx.strokeStyle = '#eef3ff';
      ctx.lineWidth = 6;
      D.roundRect(ctx, 20, 20, 216, 280, 12);
      ctx.stroke();
      D.drawText(ctx, 'P', 128, 108, {
        font: '700 128px "Yu Gothic", "Meiryo", sans-serif',
        color: '#ffffff',
      });
      D.drawText(ctx, '駐車場', 128, 212, {
        font: '700 40px "Yu Gothic", "Meiryo", sans-serif',
        color: '#ffffff',
      });
      D.drawText(ctx, '24H', 128, 268, {
        font: '700 30px "Yu Gothic", sans-serif',
        color: '#bcd6ff',
      });
    });
  }

  function texOneWaySign() {
    return tex(320, 200, (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#1b4fa0';
      D.roundRect(ctx, 6, 6, 308, 188, 16);
      ctx.fill();
      ctx.strokeStyle = '#eef3ff';
      ctx.lineWidth = 5;
      D.roundRect(ctx, 18, 18, 284, 164, 10);
      ctx.stroke();
      // one-way arrow
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(58, 86, 178, 26);
      ctx.beginPath();
      ctx.moveTo(236, 68);
      ctx.lineTo(296, 99);
      ctx.lineTo(236, 130);
      ctx.closePath();
      ctx.fill();
      D.drawText(ctx, '一方通行', 158, 158, {
        font: '700 30px "Yu Gothic", "Meiryo", sans-serif',
        color: '#dce8ff',
      });
    });
  }

  function texBinLabel(color, title, sub, icon) {
    return tex(256, 256, (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = color;
      D.roundRect(ctx, 4, 4, 248, 248, 20);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.75)';
      ctx.lineWidth = 5;
      D.roundRect(ctx, 14, 14, 228, 228, 14);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.94)';
      if (icon === 'can') {
        D.roundRect(ctx, 92, 44, 72, 94, 10);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.94)';
        ctx.fillRect(100, 44, 56, 8);
        ctx.fillStyle = color;
        ctx.fillRect(100, 74, 56, 8);
      } else if (icon === 'bottle') {
        D.roundRect(ctx, 108, 40, 40, 26, 6);
        ctx.fill();
        D.roundRect(ctx, 98, 62, 60, 78, 16);
        ctx.fill();
        ctx.fillStyle = color;
        ctx.fillRect(104, 86, 48, 8);
      } else {
        ctx.beginPath();
        ctx.moveTo(94, 52);
        ctx.lineTo(162, 52);
        ctx.lineTo(150, 132);
        ctx.lineTo(106, 132);
        ctx.closePath();
        ctx.fill();
      }
      D.drawText(ctx, title, 128, 190, {
        font: '700 34px "Yu Gothic", "Meiryo", "MS Gothic", sans-serif',
        color: '#ffffff',
      });
      D.drawText(ctx, sub, 128, 226, {
        font: '700 22px "Yu Gothic", "Meiryo", sans-serif',
        color: 'rgba(255,255,255,0.85)',
      });
    });
  }

  function texDoorMat() {
    const rr = D.rng(19);
    return tex(640, 360, (ctx, w, h) => {
      ctx.fillStyle = '#2b3049';
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 3000; i++) {
        ctx.fillStyle = 'rgba(' + (40 + rr() * 30) + ',' + (48 + rr() * 30) + ',' + (70 + rr() * 30) + ',0.35)';
        ctx.fillRect(rr() * w, rr() * h, 2, 2);
      }
      ctx.strokeStyle = '#c9a46a';
      ctx.lineWidth = 10;
      ctx.strokeRect(20, 20, w - 40, h - 40);
      ctx.strokeStyle = 'rgba(201,164,106,0.55)';
      ctx.lineWidth = 4;
      ctx.strokeRect(40, 40, w - 80, h - 80);
      // star logo
      ctx.save();
      ctx.translate(98, 178);
      ctx.fillStyle = '#ffd45e';
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        const r = i % 2 === 0 ? 46 : 20;
        ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      D.drawText(ctx, '星降マート', 340, 150, {
        font: '700 52px "Yu Gothic", "Meiryo", "MS Gothic", sans-serif',
        color: '#f3e8cc',
      });
      D.drawText(ctx, 'WELCOME', 340, 222, {
        font: '700 28px "Yu Gothic", "Meiryo", sans-serif',
        color: '#c9a46a',
      });
      D.drawText(ctx, 'HOSHIFURI MART', 340, 268, {
        font: '700 20px "Yu Gothic", sans-serif',
        color: 'rgba(201,164,106,0.75)',
      });
    });
  }

  function texACGrille() {
    return tex(256, 256, (ctx, w, h) => {
      ctx.fillStyle = '#d9d8cf';
      ctx.fillRect(0, 0, w, h);
      // louvers
      for (let i = 0; i < 14; i++) {
        ctx.fillStyle = i % 2 ? 'rgba(140,140,132,0.5)' : 'rgba(240,240,232,0.6)';
        ctx.fillRect(12, 18 + i * 16, 150, 7);
      }
      // fan grille
      ctx.fillStyle = '#b9b8af';
      ctx.beginPath();
      ctx.arc(198, 124, 46, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#8d8c84';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(198, 124, 46, 0, Math.PI * 2);
      ctx.stroke();
      for (let i = 0; i < 5; i++) {
        ctx.strokeStyle = 'rgba(110,110,102,0.65)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(198, 124, 10 + i * 8, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.fillStyle = '#5d6168';
      D.drawText(ctx, 'HOSHIFURI', 88, 232, { font: '700 20px "Yu Gothic", sans-serif' });
      ctx.strokeStyle = 'rgba(90,90,84,0.6)';
      ctx.lineWidth = 6;
      ctx.strokeRect(3, 3, w - 6, h - 6);
    });
  }

  function texWarningSleeve() {
    return tex(256, 256, (ctx, w, h) => {
      ctx.fillStyle = '#e9c23c';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#1d1d22';
      for (let i = -1; i < 6; i++) {
        ctx.save();
        ctx.translate(0, i * 56);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(256, 26);
        ctx.lineTo(256, 40);
        ctx.lineTo(0, 14);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      ctx.fillStyle = '#1d1d22';
      D.drawText(ctx, '高圧危険', 128, 108, {
        font: '700 44px "Yu Gothic", "Meiryo", "MS Gothic", sans-serif',
        color: '#f3d34a',
      });
      D.drawText(ctx, '触るな', 128, 160, {
        font: '700 40px "Yu Gothic", "Meiryo", sans-serif',
        color: '#f3d34a',
      });
    });
  }

  function texPolePlate() {
    return tex(128, 160, (ctx, w, h) => {
      ctx.fillStyle = '#eef0ec';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#20242a';
      ctx.lineWidth = 6;
      ctx.strokeRect(4, 4, w - 8, h - 8);
      D.drawText(ctx, '電柱', 64, 34, { font: '700 26px "Yu Gothic", sans-serif', color: '#20242a' });
      D.drawText(ctx, '星降', 64, 76, { font: '700 28px "Yu Gothic", sans-serif', color: '#20242a' });
      D.drawText(ctx, 'No.7', 64, 116, { font: '700 24px "Yu Gothic", sans-serif', color: '#20242a' });
      D.drawText(ctx, 'HOSHIFURI', 64, 144, { font: '700 10px "Yu Gothic", sans-serif', color: '#20242a' });
    });
  }

  function texLampBanner() {
    return tex(128, 384, (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#123c46');
      g.addColorStop(1, '#0a232b');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(143,230,234,0.6)';
      ctx.lineWidth = 4;
      ctx.strokeRect(8, 8, w - 16, h - 16);
      D.verticalText(ctx, '星降通り', 64, 78, 62, {
        font: '700 42px "Yu Gothic", "Meiryo", sans-serif',
        color: '#eaf7ef',
      });
      ctx.fillStyle = '#ffd45e';
      ctx.beginPath();
      ctx.arc(64, 322, 16, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  /* ------------------------------------------------------------------
     shared materials
     ------------------------------------------------------------------ */
  function makeMaterials() {
    const M = {};
    M.cream = D.toon(0xf0e4cc, { gradientMap: D.ramps.crisp });
    M.creamDark = D.toon(0xd8cbb2, { gradientMap: D.ramps.crisp });
    M.teal = D.toon(0x14595a, { gradientMap: D.ramps.crisp });
    M.tealDark = D.toon(0x0b3b3f, { gradientMap: D.ramps.soft });
    M.coral = D.toon(0xd9564b, { gradientMap: D.ramps.crisp });
    M.mustard = D.toon(0xe9b246, { gradientMap: D.ramps.crisp });
    M.metal = D.toon(0x98a1ad, { gradientMap: D.ramps.crisp });
    M.metalDark = D.toon(0x454c59, { gradientMap: D.ramps.soft });
    M.steel = D.standard(0xb9c2ce, { roughness: 0.32, metalness: 0.72, envMapIntensity: 1.25 });
    M.steelDark = D.standard(0x6e7785, { roughness: 0.4, metalness: 0.6, envMapIntensity: 1.0 });
    M.black = D.toon(0x1d1e26, { gradientMap: D.ramps.soft });
    M.rubber = D.toon(0x191b22, { gradientMap: D.ramps.soft });
    M.concrete = D.toon(0x8d919d, { gradientMap: D.ramps.soft });
    M.concreteDark = D.toon(0x666b78, { gradientMap: D.ramps.soft });
    M.white = D.toon(0xdde0e4, { gradientMap: D.ramps.soft });
    M.wood = D.toon(0x7b5c43, { gradientMap: D.ramps.soft });
    M.woodDark = D.toon(0x46332a, { gradientMap: D.ramps.soft });
    M.terracotta = D.toon(0x9c5b44, { gradientMap: D.ramps.crisp });
    M.soil = D.toon(0x2b2320, { gradientMap: D.ramps.soft });
    M.fur = D.toon(0x50556b, { gradientMap: D.ramps.soft, flat: true });
    M.furLight = D.toon(0xe4d6bd, { gradientMap: D.ramps.soft });
    M.leaf = D.toon(0x2e6b58, { gradientMap: D.ramps.soft, flat: true });
    M.leafDark = D.toon(0x1d4a3f, { gradientMap: D.ramps.soft, flat: true });
    M.binBlue = D.toon(0x1f5aa8, { gradientMap: D.ramps.crisp });
    M.binTeal = D.toon(0x1d7f75, { gradientMap: D.ramps.crisp });
    M.binGrey = D.toon(0x8a7f6c, { gradientMap: D.ramps.crisp });
    M.wire = D.standard(0x2b2e3a, { roughness: 0.55, metalness: 0.4, envMapIntensity: 0.8 });
    M.glowCyan = D.basic(0x9fe8ff, { toneMapped: false });
    M.glowCool = D.basic(0xd6ecff, { toneMapped: false });
    M.glowWarm = D.basic(0xffc47e, { toneMapped: false });
    return M;
  }

  /* ------------------------------------------------------------------
     1. glowing Japanese vending machine
        body x 1.75..2.65, z -2.4..-1.5, front faces +X
     ------------------------------------------------------------------ */
  function buildVending(parent, M, A) {
    const G = grp(parent, 2.2, Y.WALK, -1.95, Math.PI / 2); // local +Z -> world +X
    G.name = 'vending';

    // concrete pad + dark base
    D.box(G, 1.04, 0.06, 1.04, M.concreteDark, { y: 0.03, cast: false, receive: true });
    D.box(G, 0.9, 0.11, 0.88, M.metalDark, { y: 0.115, cast: true, receive: true });

    // body: local width 0.9, height 1.74 (y .16..1.90), depth .88
    const bodyCream = D.toon(0xe6d6b6, { gradientMap: D.ramps.crisp });
    D.box(G, 0.9, 1.74, 0.88, bodyCream, { y: 1.03, cast: true, receive: true });
    // soft side bevel strips
    D.box(G, 0.03, 1.74, 0.04, M.creamDark, { x: 0.435, y: 1.03, z: 0.42, cast: false });
    D.box(G, 0.03, 1.74, 0.04, M.creamDark, { x: -0.435, y: 1.03, z: 0.42, cast: false });

    // ---- top canopy + cool under-strip ----
    D.box(G, 0.98, 0.06, 0.96, M.creamDark, { y: 1.93, cast: true, receive: true });
    D.box(G, 0.94, 0.015, 0.05, M.metal, { y: 1.898, z: 0.4, cast: false });
    const topStrip = D.box(G, 0.84, 0.014, 0.03, M.glowCyan, { y: 1.896, z: 0.445, cast: false });
    topStrip.userData.noOutline = true;

    // ---- brand header (lit) ----
    D.box(G, 0.88, 0.20, 0.03, M.tealDark, { y: 1.775, z: 0.452, cast: false });
    signFace(G, texVendingHeader(), 0.84, 0.17, { y: 1.775, z: 0.4705 });
    D.box(G, 0.9, 0.018, 0.03, M.coral, { y: 1.665, z: 0.458, cast: false });

    // ---- display window ----
    // interior glow panel
    const disp = D.box(G, 0.80, 0.64, 0.02, M.metalDark, { y: 1.335, z: 0.442, cast: false });
    disp.userData.noOutline = true;
    signFace(G, texVendingDisplay(), 0.78, 0.60, { y: 1.335, z: 0.4545 });
    // shelves
    for (const y of [1.16, 1.39]) {
      D.box(G, 0.78, 0.014, 0.03, M.steel, { y: y, z: 0.456, cast: false });
      D.box(G, 0.76, 0.012, 0.018, M.metal, { y: y - 0.014, z: 0.466, cast: false });
    }
    // real 3D cans / bottles behind glass (unlit colours survive the cyan spill light)
    const canGeoCols = [0xd8483c, 0xd9a52c, 0x2f8f7f, 0x4668b8];
    const canMats = canGeoCols.map((c) => D.basic(c, { toneMapped: true }));
    const canXs = [-0.27, -0.09, 0.09, 0.27];
    for (let row = 0; row < 2; row++) {
      const baseY = row === 0 ? 1.168 : 1.398;
      for (let i = 0; i < 4; i++) {
        D.cyl(G, 0.031, 0.031, 0.105, 8, canMats[(i + row) % 4], {
          x: canXs[i],
          y: baseY + 0.055,
          z: 0.462,
          cast: false,
        });
        D.cyl(G, 0.032, 0.032, 0.012, 8, M.steel, {
          x: canXs[i],
          y: baseY + 0.112,
          z: 0.462,
          cast: false,
        });
      }
    }
    // two bottles on the upper shelf
    for (const bx of [-0.18, 0.18]) {
      D.cyl(G, 0.028, 0.03, 0.12, 8, D.basic(0x1d6f6b, { toneMapped: true }), { x: bx, y: 1.462, z: 0.462, cast: false });
      D.cyl(G, 0.013, 0.026, 0.05, 8, D.basic(0x1d6f6b, { toneMapped: true }), { x: bx, y: 1.545, z: 0.462, cast: false });
      D.cyl(G, 0.016, 0.016, 0.016, 8, D.basic(0xd8483c, { toneMapped: true }), { x: bx, y: 1.578, z: 0.462, cast: false });
    }
    // glass + bezel
    const glassMat = D.glass(0xc8ecff, { opacity: 0.10 });
    const glass = D.plane(G, 0.78, 0.62, glassMat, { y: 1.335, z: 0.492, cast: false, receive: false });
    glass.userData.noOutline = true;
    D.box(G, 0.86, 0.03, 0.04, M.creamDark, { y: 1.655, z: 0.46, cast: false });
    D.box(G, 0.86, 0.03, 0.04, M.creamDark, { y: 1.015, z: 0.46, cast: false });
    D.box(G, 0.03, 0.67, 0.04, M.creamDark, { x: -0.405, y: 1.335, z: 0.46, cast: false });
    D.box(G, 0.03, 0.67, 0.04, M.creamDark, { x: 0.405, y: 1.335, z: 0.46, cast: false });

    // ---- selection button strip ----
    D.box(G, 0.86, 0.19, 0.025, M.tealDark, { y: 0.89, z: 0.452, cast: false });
    signFace(G, texButtonPanel(), 0.80, 0.155, { y: 0.89, z: 0.4665 });
    for (let i = 0; i < 6; i++) {
      const bx = -0.3 + i * 0.12;
      D.box(G, 0.05, 0.035, 0.018, i % 2 ? D.basic(0xffb45e, { toneMapped: false }) : D.basic(0x8fe6ff, { toneMapped: false }), {
        x: bx,
        y: 0.89,
        z: 0.474,
        cast: false,
      });
    }

    // ---- lower teal panel ----
    D.box(G, 0.9, 0.63, 0.02, M.teal, { y: 0.475, z: 0.449, cast: false });

    // coin / bill panel (right)
    D.box(G, 0.28, 0.24, 0.02, M.metal, { x: 0.26, y: 0.665, z: 0.457, cast: false });
    signFace(G, texCoinPanel(), 0.25, 0.215, { x: 0.26, y: 0.665, z: 0.4695 });
    D.box(G, 0.012, 0.055, 0.012, M.black, { x: 0.315, y: 0.708, z: 0.477, cast: false });
    D.box(G, 0.085, 0.01, 0.01, M.black, { x: 0.225, y: 0.698, z: 0.477, cast: false });
    D.box(G, 0.05, 0.026, 0.018, M.coral, { x: 0.3, y: 0.594, z: 0.477, cast: false });
    D.cyl(G, 0.028, 0.028, 0.012, 10, M.black, { x: 0.19, y: 0.6, z: 0.477, rx: Math.PI / 2, cast: false });

    // delivery slot
    D.box(G, 0.64, 0.25, 0.02, M.black, { y: 0.425, z: 0.452, cast: false });
    D.box(G, 0.6, 0.21, 0.024, M.tealDark, { y: 0.425, z: 0.462, cast: true });
    signFace(G, texDelivery(), 0.34, 0.105, { y: 0.425, z: 0.477 });
    D.box(G, 0.5, 0.016, 0.02, M.steel, { y: 0.512, z: 0.474, cast: false });
    // kick plate + vents
    D.box(G, 0.86, 0.12, 0.02, M.metalDark, { y: 0.225, z: 0.457, cast: false });
    for (let i = 0; i < 3; i++) {
      D.box(G, 0.34, 0.012, 0.012, M.black, { x: -0.16, y: 0.19 + i * 0.028, z: 0.468, cast: false });
    }

    // ---- side detail (local -X face = world +Z, camera side) ----
    for (let i = 0; i < 3; i++) {
      D.box(G, 0.02, 0.018, 0.3, M.metalDark, { x: -0.452, y: 1.2 + i * 0.07, z: 0.06, cast: false });
    }
    signFace(G, texVendingSideSticker(), 0.3, 0.3, { x: -0.456, y: 1.55, z: -0.06, ry: -Math.PI / 2 });
    D.box(G, 0.02, 0.9, 0.03, M.creamDark, { x: 0.452, y: 1.05, z: -0.2, cast: false });

    // ---- small ground-level service box beside the machine (world space) ----
    D.box(parent, 0.1, 0.14, 0.16, M.metalDark, { x: 1.46, y: 0.3, z: -2.5, cast: false });
    D.box(parent, 0.05, 0.05, 0.3, M.metalDark, { x: 1.46, y: 0.22, z: -2.3, cast: false });

    // ---- glow (kept off the lit display face so the products stay readable) ----
    D.glowSprite(parent, { x: 3.15, y: 1.4, z: -1.95, color: 0x9fe8ff, size: 2.4, opacity: 0.20 });
    D.glowSprite(parent, { x: 2.78, y: 2.02, z: -1.95, color: 0x9fe8ff, size: 1.1, opacity: 0.22 });
    D.lightPool(parent, {
      x: 3.28,
      z: -1.95,
      w: 2.6,
      l: 2.2,
      color: 0x8fe9ff,
      opacity: 0.20,
      y: Y.WALK + 0.009,
    });
    D.floorGlow(parent, {
      x: 3.55,
      z: -1.95,
      w: 1.2,
      l: 2.5,
      rotation: Math.PI / 2,
      color: 0x9fe8ff,
      opacity: 0.30,
      y: Y.WALK + 0.012,
    });

    A.vendingGlow = new T.Vector3(2.92, 1.3, -1.95);
  }

  /* ------------------------------------------------------------------
     2. mamachari bicycle with basket (~x2.1, z-4.2)
     ------------------------------------------------------------------ */
  function buildBicycle(parent, M) {
    const R = 0.335;
    const G = grp(parent, 2.1, Y.WALK, -4.2, 0);
    G.rotation.z = 0.12; // leaning on its kickstand
    G.name = 'mamachari';

    const frame = D.toon(0xb5564b, { gradientMap: D.ramps.crisp });
    const frameDark = D.toon(0x84443c, { gradientMap: D.ramps.crisp });
    const fenderMat = D.toon(0xe3d6bd, { gradientMap: D.ramps.crisp });
    const saddleMat = D.toon(0x4c3626, { gradientMap: D.ramps.soft });

    /* ---- wheels ---- */
    const spokeMat = new T.LineBasicMaterial({
      color: 0xb6c0cc,
      transparent: true,
      opacity: 0.55,
      toneMapped: false,
      fog: false,
    });
    function wheel(z) {
      const g = new T.Group();
      g.position.set(0, R, z);
      g.rotation.y = Math.PI / 2;
      G.add(g);
      D.torus(g, R, 0.032, 6, 26, M.rubber, { cast: true });
      D.torus(g, R - 0.066, 0.013, 5, 26, M.steel, { cast: false });
      D.cyl(g, 0.032, 0.032, 0.1, 10, M.steel, { rx: Math.PI / 2, cast: false });
      const pts = [];
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        pts.push(V(0, 0, 0));
        pts.push(V(Math.cos(a) * (R - 0.08), Math.sin(a) * (R - 0.08), 0));
      }
      const spokes = new T.LineSegments(new T.BufferGeometry().setFromPoints(pts), spokeMat);
      spokes.userData.noOutline = true;
      g.add(spokes);
      // fender hugging the top of the tyre
      const fender = D.mesh(new T.TorusGeometry(R + 0.052, 0.019, 5, 16, Math.PI * 0.88), fenderMat, {
        cast: true,
        receive: true,
      });
      fender.rotation.z = Math.PI * 0.06;
      g.add(fender);
      return g;
    }
    wheel(0.52); // front
    wheel(-0.52); // rear

    /* ---- frame ---- */
    // head tube
    strut(G, V(0, 0.60, 0.44), V(0, 0.88, 0.36), 0.025, frame);
    // main curved tube (step-through)
    D.tube(G, [V(0, 0.66, 0.43), V(0, 0.49, 0.27), V(0, 0.37, 0.09), V(0, 0.335, -0.01)], 0.026, frame, {
      segments: 16,
      radial: 6,
    });
    // upper step-through curve
    D.tube(G, [V(0, 0.86, 0.35), V(0, 0.70, 0.12), V(0, 0.71, -0.06), V(0, 0.80, -0.23)], 0.023, frame, {
      segments: 16,
      radial: 6,
    });
    // seat tube
    strut(G, V(0, 0.335, -0.01), V(0, 0.82, -0.26), 0.024, frame);
    // chainstays / seatstays
    strut(G, V(-0.035, 0.34, -0.02), V(-0.05, 0.335, -0.52), 0.015, frameDark);
    strut(G, V(0.035, 0.34, -0.02), V(0.05, 0.335, -0.52), 0.015, frameDark);
    strut(G, V(-0.04, 0.79, -0.25), V(-0.05, 0.335, -0.52), 0.013, frame);
    strut(G, V(0.04, 0.79, -0.25), V(0.05, 0.335, -0.52), 0.013, frame);
    // fork blades
    strut(G, V(-0.045, 0.62, 0.43), V(-0.02, 0.335, 0.53), 0.014, M.steel);
    strut(G, V(0.045, 0.62, 0.43), V(0.02, 0.335, 0.53), 0.014, M.steel);
    // seatpost + saddle
    strut(G, V(0, 0.82, -0.26), V(0, 0.95, -0.30), 0.014, M.steel);
    D.mesh(D.geo.roundedBox(0.15, 0.05, 0.3, 0.02), saddleMat, { x: 0, y: 0.975, z: -0.31, cast: true });
    strut(G, V(0, 0.95, -0.30), V(0, 0.985, -0.22), 0.012, M.steel);
    // spring under saddle
    D.cyl(G, 0.02, 0.02, 0.05, 8, M.steelDark, { x: 0, y: 0.93, z: -0.34, cast: false });

    /* ---- handlebar ---- */
    strut(G, V(0, 0.88, 0.36), V(0, 1.0, 0.3), 0.019, M.steel);
    D.tube(G, [V(-0.3, 1.01, 0.14), V(-0.17, 1.01, 0.235), V(0, 1.005, 0.285), V(0.17, 1.01, 0.235), V(0.3, 1.01, 0.14)], 0.016, M.steel, { segments: 14, radial: 6 });
    strut(G, V(-0.29, 1.01, 0.15), V(-0.37, 1.008, 0.07), 0.027, M.woodDark);
    strut(G, V(0.29, 1.01, 0.15), V(0.37, 1.008, 0.07), 0.027, M.woodDark);
    // brake levers
    D.box(G, 0.08, 0.012, 0.014, M.steelDark, { x: -0.24, y: 0.995, z: 0.2, rz: 0.25, cast: false });
    D.box(G, 0.08, 0.012, 0.014, M.steelDark, { x: 0.24, y: 0.995, z: 0.2, rz: -0.25, cast: false });
    // bell
    D.sphere(G, 0.034, 10, 8, M.steel, { x: -0.17, y: 1.04, z: 0.25, cast: false });
    D.box(G, 0.03, 0.01, 0.02, M.steelDark, { x: -0.13, y: 1.035, z: 0.25, cast: false });

    /* ---- front basket (wire texture planes) ---- */
    const basketTex = tex(128, 128, (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(208,216,226,0.95)';
      ctx.lineWidth = 4;
      for (let i = 0; i <= 6; i++) {
        const p = 6 + i * 19;
        ctx.beginPath();
        ctx.moveTo(p, 4);
        ctx.lineTo(p, h - 4);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(4, p);
        ctx.lineTo(w - 4, p);
        ctx.stroke();
      }
      ctx.strokeStyle = '#e9eef4';
      ctx.lineWidth = 8;
      ctx.strokeRect(2, 2, w - 4, h - 4);
    });
    function basketPanel(w, h, opts) {
      return signFace(G, basketTex, w, h, Object.assign({ transparent: true, alphaTest: 0.4, side: T.DoubleSide }, opts));
    }
    const bx = 0;
    const bz = 0.6;
    const by = 0.885;
    basketPanel(0.3, 0.22, { x: bx, y: by, z: bz + 0.12 });
    basketPanel(0.3, 0.22, { x: bx, y: by, z: bz - 0.12 });
    basketPanel(0.24, 0.22, { x: bx - 0.15, y: by, z: bz, ry: Math.PI / 2 });
    basketPanel(0.24, 0.22, { x: bx + 0.15, y: by, z: bz, ry: Math.PI / 2 });
    const bottom = D.plane(G, 0.3, 0.24, D.basic(0x39414d, { toneMapped: true }), {
      x: bx,
      y: 0.775,
      z: bz,
      rx: -Math.PI / 2,
      cast: false,
      receive: false,
    });
    bottom.userData.noOutline = true;
    // basket rim + mounts
    strut(G, V(-0.15, 0.995, bz + 0.12), V(0.15, 0.995, bz + 0.12), 0.012, M.steel, { cast: false });
    strut(G, V(-0.15, 0.995, bz - 0.12), V(0.15, 0.995, bz - 0.12), 0.012, M.steel, { cast: false });
    strut(G, V(-0.15, 0.995, bz - 0.12), V(-0.15, 0.995, bz + 0.12), 0.012, M.steel, { cast: false });
    strut(G, V(0.15, 0.995, bz - 0.12), V(0.15, 0.995, bz + 0.12), 0.012, M.steel, { cast: false });
    strut(G, V(0, 0.8, bz - 0.12), V(0, 0.6, 0.44), 0.012, M.steel, { cast: false });

    /* ---- front lamp / rear reflector ---- */
    D.box(G, 0.058, 0.05, 0.05, M.steelDark, { x: 0, y: 0.7, z: 0.53, cast: false });
    const lampFace = D.plane(G, 0.05, 0.042, D.basic(0xfff0c0, { toneMapped: false }), {
      x: 0,
      y: 0.7,
      z: 0.556,
      cast: false,
      receive: false,
    });
    lampFace.userData.noOutline = true;
    const reflector = D.box(G, 0.055, 0.04, 0.012, D.basic(0xff5b5b, { toneMapped: false }), {
      x: 0,
      y: 0.52,
      z: -0.56,
      cast: false,
    });
    reflector.userData.noOutline = true;

    /* ---- rear rack ---- */
    D.box(G, 0.26, 0.02, 0.34, M.steel, { x: 0, y: 0.72, z: -0.44, cast: true });
    strut(G, V(-0.1, 0.71, -0.3), V(-0.05, 0.4, -0.5), 0.01, M.steelDark, { cast: false });
    strut(G, V(0.1, 0.71, -0.3), V(0.05, 0.4, -0.5), 0.01, M.steelDark, { cast: false });

    /* ---- drivetrain ---- */
    D.cyl(G, 0.088, 0.088, 0.014, 14, M.steelDark, { x: 0.05, y: 0.34, z: -0.02, rz: Math.PI / 2, cast: false });
    strut(G, V(0.06, 0.34, -0.02), V(0.06, 0.27, 0.09), 0.012, M.steelDark, { cast: false });
    strut(G, V(0.06, 0.34, -0.02), V(0.06, 0.41, -0.13), 0.012, M.steelDark, { cast: false });
    D.box(G, 0.09, 0.016, 0.05, M.black, { x: 0.1, y: 0.27, z: 0.09, cast: false });
    D.box(G, 0.09, 0.016, 0.05, M.black, { x: 0.1, y: 0.41, z: -0.13, cast: false });
    // chain guard
    D.box(G, 0.02, 0.055, 0.44, M.steel, { x: 0.075, y: 0.375, z: -0.27, cast: false });

    /* ---- kickstand ---- */
    strut(G, V(0.05, 0.3, -0.28), V(0.16, -0.03, -0.52), 0.013, M.steelDark, { cast: false });
    D.box(G, 0.07, 0.02, 0.04, M.steelDark, { x: 0.16, y: -0.036, z: -0.52, cast: false });

    /* ---- little warm glow at the front lamp ---- */
    D.glowSprite(parent, { x: 2.1, y: Y.WALK + 0.72, z: -3.64, color: 0xffe2b0, size: 0.5, opacity: 0.28 });
  }

  /* ------------------------------------------------------------------
     3. umbrella stand near the store entrance
     ------------------------------------------------------------------ */
  function buildUmbrellaStand(parent, M) {
    const G = grp(parent, 1.07, Y.WALK, 1.02);
    G.name = 'umbrella-stand';
    // stand
    D.cyl(G, 0.16, 0.145, 0.52, 16, M.metalDark, { y: 0.26, open: true, cast: true });
    D.cyl(G, 0.155, 0.155, 0.02, 16, M.metalDark, { y: 0.015, cast: false });
    D.torus(G, 0.16, 0.016, 6, 18, M.steel, { y: 0.52, rx: Math.PI / 2, cast: false });
    D.torus(G, 0.152, 0.012, 5, 18, M.steel, { y: 0.3, rx: Math.PI / 2, cast: false });
    D.box(G, 0.16, 0.03, 0.03, M.metalDark, { y: 0.52, z: 0.14, cast: false });

    const colors = [0xff6d5d, 0xe9b246, 0x2c9b91];
    const tilts = [
      [-0.2, 0.16, 0.14],
      [0.14, -0.2, 0.07],
      [0.04, 0.26, 0.19],
    ];
    for (let i = 0; i < 3; i++) {
      const U = new T.Group();
      U.position.set(-0.065 + i * 0.065, 0.16, -0.03 + i * 0.045);
      U.rotation.set(tilts[i][0], tilts[i][1], tilts[i][2]);
      G.add(U);
      const fabric = D.toon(colors[i], { gradientMap: D.ramps.crisp });
      // shaft
      D.cyl(U, 0.011, 0.011, 1.06, 8, M.steelDark, { y: 0.53, cast: true });
      // folded canopy: widest under the handle, tapering to the tip
      D.cyl(U, 0.082, 0.02, 0.62, 10, fabric, { y: 0.7, cast: true, receive: true });
      // canopy folds / centre crease
      D.cyl(U, 0.058, 0.016, 0.61, 6, D.toon(colors[i], { gradientMap: D.ramps.soft }), { y: 0.7, rz: 0.02, cast: false });
      // tie band
      D.torus(U, 0.05, 0.011, 5, 12, M.steelDark, { y: 0.63, rx: Math.PI / 2, cast: false });
      // hook handle (half torus in a vertical plane)
      D.mesh(new T.TorusGeometry(0.055, 0.014, 6, 14, Math.PI), M.wood, {
        x: 0.055,
        y: 1.05,
        z: 0,
        cast: false,
      });
      D.cyl(U, 0.017, 0.017, 0.04, 8, M.steelDark, { y: 1.045, cast: false });
      // ferrule tip
      D.cyl(U, 0.005, 0.016, 0.08, 6, M.steel, { y: 0.35, cast: false });
    }
    // small drip tray
    D.cyl(G, 0.2, 0.2, 0.012, 16, M.metalDark, { y: 0.006, cast: false });
  }

  /* ------------------------------------------------------------------
     4. three recycling bins around x3.4 z0.3
     ------------------------------------------------------------------ */
  function buildBins(parent, M) {
    const labels = [
      { color: '#1f5aa8', title: 'カン', sub: 'CAN', icon: 'can', mat: M.binBlue },
      { color: '#1d7f75', title: 'ペット', sub: 'PET BOTTLE', icon: 'bottle', mat: M.binTeal },
      { color: '#8a7f6c', title: 'もえる', sub: 'BURNABLE', icon: 'bag', mat: M.binGrey },
    ];
    const zs = [-0.32, 0.28, 0.88];
    for (let i = 0; i < 3; i++) {
      const G = grp(parent, 3.42, Y.WALK, zs[i], 0);
      G.name = 'bin-' + i;
      // body
      D.cyl(G, 0.19, 0.165, 0.68, 14, labels[i].mat, { y: 0.36, cast: true, receive: true });
      // label facing +X
      signFace(G, texBinLabel(labels[i].color, labels[i].title, labels[i].sub, labels[i].icon), 0.3, 0.3, {
        x: 0.196,
        y: 0.42,
        ry: Math.PI / 2,
      });
      // base ring + lid
      D.cyl(G, 0.2, 0.2, 0.03, 14, M.metalDark, { y: 0.715, cast: true });
      D.torus(G, 0.195, 0.014, 5, 16, M.steel, { y: 0.732, rx: Math.PI / 2, cast: false });
      // round opening
      D.cyl(G, 0.085, 0.085, 0.014, 12, M.black, { x: 0.0, y: 0.733, z: 0.0, cast: false });
      D.torus(G, 0.088, 0.008, 4, 14, M.steel, { y: 0.74, rx: Math.PI / 2, cast: false });
      // small foot
      D.cyl(G, 0.17, 0.17, 0.02, 12, M.black, { y: 0.01, cast: false });
    }
  }

  /* ------------------------------------------------------------------
     5. cork notice / poster board on the store east wall
     ------------------------------------------------------------------ */
  function buildNoticeBoard(parent, M) {
    // mounted in the free glass panel of the east facade (z -3.3 .. -2.2),
    // north of the vending machine, clear of the store's own window decals
    const G = grp(parent, 1.43, 0, -2.75, 0);
    G.name = 'notice-board';
    // board body
    D.box(G, 0.06, 1.0, 1.2, M.woodDark, { x: 0.03, y: 1.55, cast: true, receive: true });
    // cork face (+X)
    D.box(G, 0.012, 0.9, 1.1, D.toon(0xffffff, { map: texNoticeBoard() }), { x: 0.066, y: 1.55, cast: false });
    // frame
    D.box(G, 0.1, 0.07, 1.28, M.wood, { x: 0.04, y: 2.08, cast: true });
    D.box(G, 0.1, 0.07, 1.28, M.wood, { x: 0.04, y: 1.02, cast: true });
    D.box(G, 0.1, 1.12, 0.07, M.wood, { x: 0.04, y: 1.55, z: 0.6, cast: true });
    D.box(G, 0.1, 1.12, 0.07, M.wood, { x: 0.04, y: 1.55, z: -0.6, cast: true });
    // little rain eave above the board
    D.box(G, 0.3, 0.035, 1.32, M.metalDark, { x: 0.1, y: 2.16, z: 0, rz: -0.12, cast: true });
    strut(G, V(0.0, 1.95, 0.45), V(0.26, 2.12, 0.45), 0.012, M.steelDark, { cast: false });
    strut(G, V(0.0, 1.95, -0.45), V(0.26, 2.12, -0.45), 0.012, M.steelDark, { cast: false });
    // raised paper corners for depth
    D.plane(G, 0.26, 0.2, D.basic(0xffd45e, { toneMapped: true }), {
      x: 0.076,
      y: 1.86,
      z: 0.28,
      ry: Math.PI / 2,
      rz: 0.06,
      cast: false,
      receive: false,
    }).userData.noOutline = true;
    D.plane(G, 0.2, 0.26, D.basic(0xe8f1e8, { toneMapped: true }), {
      x: 0.076,
      y: 1.2,
      z: -0.2,
      ry: Math.PI / 2,
      rz: -0.05,
      cast: false,
      receive: false,
    }).userData.noOutline = true;
    // small shop plate below / beside the board
    D.box(G, 0.03, 0.22, 0.4, M.creamDark, { x: 0.02, y: 0.78, z: -0.66, cast: false });
    signFace(G, tex(256, 128, (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#f4ead4';
      D.roundRect(ctx, 2, 2, w - 4, h - 4, 10);
      ctx.fill();
      D.drawText(ctx, '営業中', w / 2, 46, { font: '700 40px "Yu Gothic", sans-serif', color: '#c4472f' });
      D.drawText(ctx, 'OPEN 24H', w / 2, 94, { font: '700 26px "Yu Gothic", sans-serif', color: '#0d5b58' });
    }), 0.36, 0.18, { x: 0.038, y: 0.78, z: -0.66, ry: Math.PI / 2 });
  }

  /* ------------------------------------------------------------------
     6. A-frame sandwich sign near the entrance
     ------------------------------------------------------------------ */
  function buildAFrame(parent, M) {
    const G = grp(parent, 2.56, Y.WALK, 2.02, 0.42);
    G.name = 'a-frame';
    function board(z, rx, textured) {
      const B = new T.Group();
      B.position.set(0, 0.43, z);
      B.rotation.x = rx;
      G.add(B);
      D.box(B, 0.62, 0.84, 0.03, M.woodDark, { cast: true, receive: true });
      if (textured) signFace(B, texAFrame(), 0.58, 0.8, { z: 0.017 });
      else D.box(B, 0.56, 0.78, 0.012, M.tealDark, { z: 0.02, cast: false });
      // wood frame edges
      D.box(B, 0.66, 0.05, 0.05, M.wood, { y: 0.42, cast: true });
      D.box(B, 0.66, 0.05, 0.05, M.wood, { y: -0.42, cast: true });
      D.box(B, 0.05, 0.84, 0.05, M.wood, { x: -0.31, cast: true });
      D.box(B, 0.05, 0.84, 0.05, M.wood, { x: 0.31, cast: true });
      // rubber feet
      D.box(B, 0.07, 0.035, 0.06, M.black, { x: -0.28, y: -0.44, z: 0, cast: false });
      D.box(B, 0.07, 0.035, 0.06, M.black, { x: 0.28, y: -0.44, z: 0, cast: false });
      return B;
    }
    // front board faces +Z, top leans back toward centre; back board mirrored
    board(0.16, -0.19, true);
    board(-0.16, 0.19, false);
    // hinge
    D.cyl(G, 0.022, 0.022, 0.6, 10, M.steelDark, { y: 0.85, rx: 0, rz: Math.PI / 2, cast: false });
    // little chalk text on back board (still legible when orbited)
    signFace(G, tex(256, 256, (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#1d2a2a';
      ctx.fillRect(0, 0, w, h);
      D.drawText(ctx, 'OPEN', w / 2, 90, { font: '700 54px "Yu Gothic", sans-serif', color: '#ffe9b0' });
      D.drawText(ctx, '24 HOURS', w / 2, 160, { font: '700 30px "Yu Gothic", sans-serif', color: '#8fe6ea' });
    }), 0.4, 0.4, { x: 0.08, y: 0.55, z: 0.03, ry: Math.PI, rx: 0.19 });
  }

  /* ------------------------------------------------------------------
     7. Japanese road signs: red 止まれ triangle + blue P / one-way
     ------------------------------------------------------------------ */
  function buildRoadSigns(parent, M) {
    /* stop sign at the alley mouth */
    const S = grp(parent, -6.6, Y.WALK, 1.34, 0.2);
    S.name = 'stop-sign';
    D.cyl(S, 0.055, 0.07, 0.1, 10, M.concreteDark, { y: 0.05, cast: false });
    D.cyl(S, 0.034, 0.034, 2.32, 10, M.steelDark, { y: 1.16, cast: true });
    D.cyl(S, 0.036, 0.036, 0.04, 10, M.steel, { y: 2.33, cast: false });
    // back plate slightly bigger than the triangle
    D.box(S, 0.6, 0.56, 0.02, M.metalDark, { y: 1.94, z: -0.025, cast: true });
    signFace(S, texStopSign(), 0.64, 0.62, { y: 1.93, z: 0.002, transparent: true, alphaTest: 0.35, side: T.DoubleSide });
    // bracket
    D.box(S, 0.03, 0.08, 0.1, M.steelDark, { y: 1.93, z: -0.05, cast: false });

    /* blue parking + one-way signs near the parking bays */
    const B = grp(parent, 3.98, Y.WALK, 2.62, 0.3);
    B.name = 'parking-sign';
    D.cyl(B, 0.05, 0.065, 0.09, 10, M.concreteDark, { y: 0.045, cast: false });
    D.cyl(B, 0.032, 0.032, 2.28, 10, M.steelDark, { y: 1.14, cast: true });
    D.cyl(B, 0.034, 0.034, 0.04, 10, M.steel, { y: 2.29, cast: false });
    // parking plate
    D.box(B, 0.44, 0.56, 0.02, M.metalDark, { y: 1.92, z: -0.028, cast: true });
    signFace(B, texParkingSign(), 0.42, 0.53, { y: 1.92, z: 0.002 });
    // one-way plate below
    D.box(B, 0.52, 0.34, 0.02, M.metalDark, { y: 1.48, z: -0.028, cast: true });
    signFace(B, texOneWaySign(), 0.5, 0.31, { y: 1.48, z: 0.002 });
    // small clamps
    D.box(B, 0.04, 0.05, 0.03, M.steel, { y: 2.2, z: -0.02, cast: false });
    D.box(B, 0.04, 0.05, 0.03, M.steel, { y: 1.65, z: -0.02, cast: false });
  }

  /* ------------------------------------------------------------------
     8. curved-arm street lamp on the far walk
        pole (9.2, .9) head (8.2, 5.15, .9)
     ------------------------------------------------------------------ */
  function buildStreetLamp(parent, M, A) {
    const G = grp(parent, 9.2, Y.WALK, 0.9);
    G.name = 'street-lamp';
    // base
    D.box(G, 0.44, 0.1, 0.44, M.concreteDark, { y: 0.05, cast: true, receive: true });
    D.cyl(G, 0.15, 0.19, 0.12, 12, M.metalDark, { y: 0.1, cast: false });
    // tapered pole
    D.cyl(G, 0.072, 0.125, 5.2, 12, M.metalDark, { y: 2.72, cast: true });
    // collars
    D.torus(G, 0.105, 0.018, 5, 12, M.metal, { y: 0.42, rx: Math.PI / 2, cast: false });
    D.torus(G, 0.082, 0.014, 5, 12, M.metal, { y: 3.2, rx: Math.PI / 2, cast: false });
    // curved arm
    D.tube(
      G,
      [V(0, 5.3, 0), V(-0.05, 5.52, 0), V(-0.42, 5.62, 0), V(-0.82, 5.48, 0), V(-0.97, 5.3, 0), V(-1.0, 5.16, 0)],
      0.052,
      M.metalDark,
      { segments: 22, radial: 7, cast: true }
    );
    // brace
    strut(G, V(-0.02, 5.0, 0), V(-0.55, 5.55, 0), 0.022, M.metalDark, { cast: false });
    // lamp head: dark housing so the silhouette reads against the sky
    D.cyl(G, 0.11, 0.2, 0.1, 14, M.metalDark, { x: -1.0, y: 5.31, cast: true });
    D.cyl(G, 0.2, 0.2, 0.07, 14, M.metalDark, { x: -1.0, y: 5.22, cast: true });
    D.torus(G, 0.2, 0.016, 5, 16, M.steel, { x: -1.0, y: 5.185, rx: Math.PI / 2, cast: false });
    D.cyl(G, 0.155, 0.155, 0.03, 16, M.glowCool, { x: -1.0, y: 5.165, cast: false });
    D.cyl(G, 0.09, 0.17, 0.05, 12, M.metalDark, { x: -1.0, y: 5.135, cast: false });
    // little support fin
    D.box(G, 0.05, 0.1, 0.05, M.metalDark, { x: -0.86, y: 5.38, rz: -0.3, cast: false });
    // glow & ground pool
    D.glowSprite(parent, { x: 8.2, y: 5.16, z: 0.9, color: 0xd4eaff, size: 2.1, opacity: 0.45 });
    D.glowSprite(parent, { x: 8.2, y: 5.16, z: 0.9, color: 0xffffff, size: 0.8, opacity: 0.55 });
    D.box(G, 0.05, 0.72, 0.26, M.metalDark, { y: 2.0, z: 0.16, cast: false });
    signFace(G, texLampBanner(), 0.26, 0.66, { y: 2.0, z: 0.295, side: T.DoubleSide });
    strut(G, V(0.06, 2.36, 0), V(0.06, 2.36, 0.3), 0.012, M.steelDark, { cast: false });
    strut(G, V(0.06, 1.64, 0), V(0.06, 1.64, 0.3), 0.012, M.steelDark, { cast: false });
    // base bolts
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + 0.4;
      D.cyl(G, 0.014, 0.014, 0.03, 6, M.steel, {
        x: Math.cos(a) * 0.17,
        y: 0.115,
        z: Math.sin(a) * 0.17,
        cast: false,
      });
    }
    // glow & ground pool
    D.lightPool(parent, {
      x: 8.2,
      z: 0.9,
      w: 5.4,
      l: 5.4,
      color: 0xbfe0ff,
      opacity: 0.2,
      y: Y.WALK + 0.009,
    });
    D.floorGlow(parent, {
      x: 8.2,
      z: 1.1,
      w: 1.5,
      l: 3.2,
      color: 0xcfe8ff,
      opacity: 0.18,
      y: Y.WALK + 0.012,
    });

    A.streetLamp = new T.Vector3(8.2, 5.15, 0.9);
  }

  /* ------------------------------------------------------------------
     9. concrete utility pole + sagging wires
     ------------------------------------------------------------------ */
  function buildUtilityPole(parent, M) {
    const G = grp(parent, 4.3, Y.WALK, 1.3);
    G.name = 'utility-pole';

    const concreteTex = tex(128, 512, (ctx, w, h) => {
      ctx.fillStyle = '#8d919d';
      ctx.fillRect(0, 0, w, h);
      const rr = D.rng(51);
      for (let i = 0; i < 2200; i++) {
        const v = 118 + Math.floor(rr() * 46);
        ctx.fillStyle = 'rgba(' + v + ',' + v + ',' + (v + 6) + ',' + (0.1 + rr() * 0.24) + ')';
        ctx.fillRect(rr() * w, rr() * h, 1 + rr() * 3, 1 + rr() * 3);
      }
      ctx.strokeStyle = 'rgba(70,74,86,0.28)';
      ctx.lineWidth = 2;
      for (const x of [18, 64, 110]) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(60,64,76,0.3)';
      ctx.lineWidth = 3;
      for (let y = 60; y < h; y += 96) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
    });
    const poleMat = D.toon(0xffffff, { map: concreteTex });

    // base + tapered shaft (7.2 tall)
    D.cyl(G, 0.2, 0.235, 0.22, 12, M.concreteDark, { y: 0.11, cast: true, receive: true });
    D.cyl(G, 0.105, 0.175, 7.0, 12, poleMat, { y: 3.72, cast: true, receive: true });
    D.cyl(G, 0.13, 0.13, 0.05, 12, M.concreteDark, { y: 7.2, cast: false });
    // warning sleeve
    D.cyl(G, 0.19, 0.2, 0.85, 12, D.toon(0xffffff, { map: texWarningSleeve() }), { y: 0.78, cast: false });
    // pole number plate
    signFace(G, texPolePlate(), 0.2, 0.25, { y: 2.1, z: 0.178, side: T.DoubleSide });
    // step bolts
    for (let i = 0; i < 6; i++) {
      const side = i % 2 ? 1 : -1;
      D.cyl(G, 0.012, 0.012, 0.22, 6, M.steelDark, {
        x: side * 0.13,
        y: 2.1 + i * 0.55,
        z: 0,
        rz: Math.PI / 2,
        cast: false,
      });
    }
    // crossarm 1 (along Z) with insulators
    D.box(G, 0.09, 0.1, 1.8, M.metalDark, { y: 6.95, cast: true });
    for (const z of [-0.7, -0.32, 0.32, 0.7]) {
      D.cyl(G, 0.05, 0.062, 0.11, 8, D.toon(0xcfd3d9, { gradientMap: D.ramps.crisp }), {
        y: 7.05,
        z: z,
        cast: false,
      });
      D.cyl(G, 0.028, 0.028, 0.12, 8, M.steelDark, { y: 7.05, z: z, cast: false });
    }
    // crossarm 2 (along X)
    D.box(G, 1.5, 0.085, 0.085, M.metalDark, { y: 6.55, cast: true });
    for (const x of [-0.55, -0.25, 0.25, 0.55]) {
      D.cyl(G, 0.045, 0.055, 0.1, 8, D.toon(0xcfd3d9, { gradientMap: D.ramps.crisp }), {
        x: x,
        y: 6.64,
        cast: false,
      });
      D.cyl(G, 0.025, 0.025, 0.1, 8, M.steelDark, { x: x, y: 6.64, cast: false });
    }
    // transformer
    D.cyl(G, 0.26, 0.26, 0.56, 12, M.metalDark, { x: 0.3, y: 5.42, cast: true });
    for (let i = 0; i < 4; i++) {
      D.box(G, 0.5, 0.03, 0.02, M.metal, { x: 0.3, y: 5.24 + i * 0.12, z: 0.26, cast: false });
    }
    D.cyl(G, 0.08, 0.08, 0.08, 8, M.steelDark, { x: 0.3, y: 5.74, cast: false });
    D.box(G, 0.14, 0.1, 0.06, M.metal, { x: 0.1, y: 5.42, z: 0, cast: false });
    // junction boxes + cable coil
    D.box(G, 0.18, 0.26, 0.1, M.metalDark, { x: 0, y: 4.6, z: 0.18, cast: false });
    D.box(G, 0.14, 0.2, 0.09, M.metalDark, { x: 0, y: 3.35, z: 0.16, cast: false });
    D.torus(G, 0.16, 0.028, 5, 14, M.black, { x: 0.14, y: 3.85, z: 0.05, rx: Math.PI / 2, cast: false });
    D.torus(G, 0.13, 0.024, 5, 14, M.black, { x: 0.14, y: 3.82, z: 0.05, rx: Math.PI / 2, cast: false });

    /* ---- wires: all D.tube catenary curves ---- */
    const topY = Y.WALK + 6.95; // crossarm 1 height
    const arm2Y = Y.WALK + 6.55;
    // high-tension run to the back-left utility pole (approx -11.8, -7.6)
    cable(parent, V(4.3, topY + 0.1, 1.3 + 0.7), V(-11.8, 6.2, -7.5), 0.62, 0.024, M.wire);
    cable(parent, V(4.3, topY + 0.1, 1.3 + 0.32), V(-11.8, 6.05, -7.7), 0.56, 0.023, M.wire);
    cable(parent, V(4.3, topY + 0.1, 1.3 - 0.32), V(-11.7, 5.95, -7.75), 0.58, 0.023, M.wire);
    cable(parent, V(4.3, topY + 0.1, 1.3 - 0.7), V(-11.65, 5.8, -7.4), 0.6, 0.021, M.wire);
    // high-tension run over the side road to the far buildings (+X)
    cable(parent, V(4.3 + 0.55, arm2Y + 0.09, 1.3), V(10.6, 5.2, -2.3), 0.34, 0.021, M.wire);
    cable(parent, V(4.3 + 0.25, arm2Y + 0.09, 1.3), V(10.6, 5.0, 0.9), 0.3, 0.021, M.wire);
    // service drops to the store roof edge / east wall
    cable(parent, V(4.3, Y.WALK + 4.85, 1.3), V(1.44, 3.55, -2.6), 0.3, 0.022, M.wire);
    cable(parent, V(4.3, Y.WALK + 4.4, 1.3), V(1.44, 3.45, -4.7), 0.34, 0.021, M.wire);
    cable(parent, V(4.3, Y.WALK + 3.6, 1.2), V(1.46, 3.05, -0.7), 0.28, 0.017, M.wire);
    // low comm span toward the far walk
    cable(parent, V(4.3, Y.WALK + 4.1, 1.55), V(10.6, 3.5, 2.7), 0.3, 0.024, M.wire);
  }

  /* ------------------------------------------------------------------
     10. white pipe corner guardrail near the T-junction
     ------------------------------------------------------------------ */
  function buildGuardrail(parent, M) {
    const G = grp(parent, 0, 0, 0);
    G.name = 'corner-guardrail';
    const railMat = D.toon(0xe7e9ec, { gradientMap: D.ramps.crisp });
    const posts = [
      V(4.72, Y.WALK, 2.88),
      V(4.72, Y.WALK, 4.16),
      V(3.82, Y.WALK, 4.16),
    ];
    for (const p of posts) {
      D.cyl(G, 0.038, 0.042, 0.94, 10, railMat, { x: p.x, y: p.y + 0.47, z: p.z, cast: true });
      D.cyl(G, 0.055, 0.055, 0.05, 10, M.metalDark, { x: p.x, y: p.y + 0.025, z: p.z, cast: false });
      D.sphere(G, 0.043, 8, 6, railMat, { x: p.x, y: p.y + 0.95, z: p.z, cast: false });
      // reflective band
      D.cyl(G, 0.043, 0.043, 0.09, 10, D.toon(0xff8a5c, { gradientMap: D.ramps.soft }), {
        x: p.x,
        y: p.y + 0.78,
        z: p.z,
        cast: false,
      });
    }
    // top + mid rails (two legs of the corner)
    for (const h of [0.92, 0.55]) {
      D.cyl(G, 0.028, 0.028, 1.28, 8, railMat, {
        x: 4.72,
        y: Y.WALK + h,
        z: 2.88 + 0.64,
        rx: Math.PI / 2,
        cast: false,
      });
      D.cyl(G, 0.028, 0.028, 0.9, 8, railMat, {
        x: 4.72 - 0.45,
        y: Y.WALK + h,
        z: 4.16,
        rz: Math.PI / 2,
        cast: false,
      });
      // elbow at the corner
      D.sphere(G, 0.032, 8, 6, railMat, { x: 4.72, y: Y.WALK + h, z: 4.16, cast: false });
    }
  }

  /* ------------------------------------------------------------------
     11. doorstep welcome mat at the auto door
     ------------------------------------------------------------------ */
  function buildDoorMat(parent, M) {
    const mat = D.box(parent, 1.3, 0.022, 0.74, D.toon(0xffffff, { map: texDoorMat() }), {
      x: 0.34,
      y: Y.WALK + 0.012,
      z: 1.06,
      cast: false,
      receive: true,
    });
    mat.userData.noOutline = true;
    // slim metal threshold in front of the door
    const th = D.box(parent, 1.2, 0.03, 0.08, M.steelDark, { x: 0.4, y: Y.WALK + 0.012, z: 0.65, cast: false });
    th.userData.noOutline = true;
  }

  /* ------------------------------------------------------------------
     12. two outdoor AC units
     ------------------------------------------------------------------ */
  function buildACUnits(parent, M) {
    const grilleTex = texACGrille();

    function acBody(x, y, z, w, h, d, name) {
      const U = grp(parent, x, y, z);
      U.name = name;
      D.box(U, d, h, w, M.white, { cast: true, receive: true }); // depth along X
      // textured front facing +X
      signFace(U, grilleTex, w - 0.06, h - 0.08, { x: d / 2 + 0.006, ry: Math.PI / 2, toneMapped: true });
      // top lip
      D.box(U, d + 0.02, 0.03, w + 0.02, M.creamDark, { y: h / 2 + 0.01, cast: false });
      // pipe cover (lower right)
      D.box(U, d * 0.5, 0.07, 0.1, M.creamDark, { x: -d * 0.15, y: -h / 2 + 0.02, z: w / 2 - 0.02, cast: false });
      return U;
    }

    // wall-mounted unit on the solid service wall, stacked above the floor unit
    const U1 = acBody(1.57, 2.9, -5.58, 0.72, 0.5, 0.28, 'ac-wall');
    // brackets
    D.box(U1, 0.3, 0.045, 0.05, M.steelDark, { x: -0.02, y: -0.28, z: 0.26, cast: false });
    D.box(U1, 0.3, 0.045, 0.05, M.steelDark, { x: -0.02, y: -0.28, z: -0.26, cast: false });
    // insulated pipe run up over the parapet + drain hose down the wall
    cable(parent, V(1.44, 3.12, -5.9), V(1.46, 3.52, -6.02), 0.06, 0.026, M.creamDark, { steps: 3, segments: 10 });
    cable(parent, V(1.44, 3.1, -5.86), V(1.46, 3.44, -5.98), 0.05, 0.018, M.creamDark, { steps: 3, segments: 10 });
    cable(parent, V(1.5, 2.66, -5.26), V(1.42, 0.5, -5.2), 0.04, 0.012, M.creamDark, { steps: 5, segments: 16 });

    // ground-standing unit at the back of the east walk
    D.box(parent, 0.94, 0.06, 0.44, M.concrete, { x: 1.68, y: Y.WALK + 0.03, z: -5.58, cast: false, receive: true });
    acBody(1.7, Y.WALK + 0.36, -5.58, 0.82, 0.56, 0.32, 'ac-floor');
    // feet
    D.box(parent, 0.06, 0.06, 0.06, M.steelDark, { x: 1.58, y: Y.WALK + 0.06, z: -5.9, cast: false });
    D.box(parent, 0.06, 0.06, 0.06, M.steelDark, { x: 1.58, y: Y.WALK + 0.06, z: -5.26, cast: false });
    // pipes / valve cover
    cable(parent, V(1.54, Y.WALK + 0.4, -5.86), V(1.46, Y.WALK + 1.15, -5.95), 0.04, 0.022, M.creamDark, { steps: 3, segments: 10 });
    cable(parent, V(1.54, Y.WALK + 0.36, -5.82), V(1.46, Y.WALK + 0.9, -5.9), 0.03, 0.017, M.creamDark, { steps: 3, segments: 10 });
    D.box(parent, 0.1, 0.18, 0.12, M.steelDark, { x: 1.47, y: Y.WALK + 1.24, z: -5.96, cast: false });
    // tiny condensation puddle stain
    D.plane(parent, 0.5, 0.5, D.basic(0x2a3040, { transparent: true, opacity: 0.22, toneMapped: false, depthWrite: false }), {
      x: 1.95,
      y: Y.WALK + 0.004,
      z: -5.5,
      rx: -Math.PI / 2,
      cast: false,
      receive: false,
    }).userData.noOutline = true;
  }

  /* ------------------------------------------------------------------
     13. sleeping cat on top of the vending machine
     ------------------------------------------------------------------ */
  function buildCat(parent, M) {
    const G = grp(parent, 2.3, Y.WALK + 1.96, -1.86, -0.9);
    G.name = 'sleeping-cat';
    // curled body
    const body = D.sphere(G, 0.145, 12, 10, M.fur, { y: 0.09, cast: true });
    body.scale.set(1.02, 0.62, 1.32);
    // cream chest patch
    const chest = D.sphere(G, 0.085, 10, 8, M.furLight, { x: 0, y: 0.085, z: 0.12, cast: false });
    chest.scale.set(1.0, 0.85, 0.95);
    // head
    D.sphere(G, 0.105, 12, 10, M.fur, { x: 0.0, y: 0.155, z: 0.175, cast: true });
    // ears
    D.cyl(G, 0.002, 0.042, 0.075, 4, M.fur, { x: -0.062, y: 0.245, z: 0.155, rx: -0.3, rz: 0.1, cast: false });
    D.cyl(G, 0.002, 0.042, 0.075, 4, M.fur, { x: 0.062, y: 0.245, z: 0.155, rx: -0.3, rz: -0.1, cast: false });
    // muzzle
    const muzzle = D.sphere(G, 0.055, 10, 8, M.furLight, { x: 0, y: 0.118, z: 0.262, cast: false });
    muzzle.scale.set(1.3, 0.8, 0.72);
    // closed eyes
    D.box(G, 0.038, 0.008, 0.012, M.black, { x: -0.052, y: 0.176, z: 0.256, rz: 0.14, cast: false });
    D.box(G, 0.038, 0.008, 0.012, M.black, { x: 0.052, y: 0.176, z: 0.256, rz: -0.14, cast: false });
    // nose + tiny mouth
    D.sphere(G, 0.013, 6, 6, D.toon(0xd98a8a, { gradientMap: D.ramps.soft }), { x: 0, y: 0.112, z: 0.3, cast: false });
    // tail wrapped around the body
    D.mesh(new T.TorusGeometry(0.115, 0.027, 6, 18, Math.PI * 1.45), M.fur, {
      x: -0.02,
      y: 0.045,
      z: -0.06,
      rx: Math.PI / 2,
      rz: 0.6,
      cast: false,
    });
    // front paws tucked under the chin
    const paw1 = D.sphere(G, 0.05, 8, 6, M.furLight, { x: -0.075, y: 0.045, z: 0.22, cast: false });
    paw1.scale.set(1.25, 0.5, 1.0);
    const paw2 = D.sphere(G, 0.05, 8, 6, M.furLight, { x: 0.075, y: 0.045, z: 0.22, cast: false });
    paw2.scale.set(1.25, 0.5, 1.0);
    // warm hint of body heat on the machine's canopy
    D.glowSprite(G, { x: 0, y: -0.05, z: 0.03, color: 0xffd8a0, size: 0.8, opacity: 0.18 });
  }

  /* ------------------------------------------------------------------
     14. potted plants
     ------------------------------------------------------------------ */
  function buildPottedPlants(parent, M) {
    function pot(x, z, s, seed) {
      const G = grp(parent, x, Y.WALK, z);
      D.cyl(G, 0.16 * s, 0.115 * s, 0.3 * s, 12, M.terracotta, { y: 0.15 * s, cast: true, receive: true });
      D.cyl(G, 0.17 * s, 0.17 * s, 0.035 * s, 12, M.terracotta, { y: 0.29 * s, cast: false });
      D.cyl(G, 0.14 * s, 0.14 * s, 0.02, 12, M.soil, { y: 0.3 * s, cast: false });
      D.foliage(G, {
        x: 0,
        y: 0.3 * s,
        z: 0,
        r: 0.17 * s,
        count: 5,
        spread: 0.3 * s,
        rise: 0.24 * s,
        height: 0,
        seed: seed,
        colors: [0x1d4a3f, 0x2e6b58, 0x24574a],
      });
      return G;
    }
    pot(1.76, 0.34, 1.0, 7); // beside the east wall near the notice board
    pot(3.82, -5.7, 1.25, 13); // back of the east walk
    pot(2.86, 1.2, 0.85, 23); // by the storefront / vending end
  }

  /* ------------------------------------------------------------------
     assemble
     ------------------------------------------------------------------ */
  D.buildProps = function (layer) {
    const M = makeMaterials();
    const A = (D.anchors = D.anchors || {});
    let meshCount = 0;

    buildVending(layer, M, A);
    buildBicycle(layer, M);
    buildUmbrellaStand(layer, M);
    buildBins(layer, M);
    buildNoticeBoard(layer, M);
    buildAFrame(layer, M);
    buildRoadSigns(layer, M);
    buildStreetLamp(layer, M, A);
    buildUtilityPole(layer, M);
    buildGuardrail(layer, M);
    buildDoorMat(layer, M);
    buildACUnits(layer, M);
    buildCat(layer, M);
    buildPottedPlants(layer, M);

    layer.traverse((o) => {
      if (o.isMesh) meshCount++;
    });
    D.propsMeshCount = meshCount;
  };
})();
