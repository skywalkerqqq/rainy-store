/* =========================================================
   星降マート — night lighting, rain, wet-air atmosphere
   ========================================================= */
(function () {
  'use strict';
  const D = window.DIORAMA;
  const T = THREE;
  const P = D.palette;

  D.anchors = D.anchors || {};

  D.buildAmbient = function (layer) {
    const scene = D.scene;

    /* ----------------------------- lights ----------------------------- */
    const hemi = new T.HemisphereLight(0x7d8fd4, 0x241a2b, 0.85);
    scene.add(hemi);
    D.hemi = hemi;

    const amb = new T.AmbientLight(0x303a5a, 0.38);
    scene.add(amb);

    const moon = new T.DirectionalLight(0x9db8ff, 2.35);
    moon.position.set(-13, 21, 15);
    moon.castShadow = true;
    moon.shadow.mapSize.set(2048, 2048);
    moon.shadow.camera.left = -18;
    moon.shadow.camera.right = 18;
    moon.shadow.camera.top = 18;
    moon.shadow.camera.bottom = -18;
    moon.shadow.camera.near = 1;
    moon.shadow.camera.far = 55;
    moon.shadow.bias = -0.00035;
    moon.shadow.normalBias = 0.035;
    moon.shadow.radius = 2.4;
    scene.add(moon);
    D.moon = moon;

    const warmBounce = new T.DirectionalLight(0xffad78, 0.62);
    warmBounce.position.set(7, 7.5, 13);
    scene.add(warmBounce);

    const rim = new T.DirectionalLight(0x9b6bff, 0.42);
    rim.position.set(14, 9, -14);
    scene.add(rim);
    D.rim = rim;

    const lights = [];
    D.cityLights = lights;

    function point(x, y, z, color, intensity, distance, decay) {
      const l = new T.PointLight(color, intensity, distance, decay === undefined ? 1.7 : decay);
      l.position.set(x, y, z);
      scene.add(l);
      lights.push(l);
      return l;
    }

    // Convenience-store interior washes spilling through the glass.
    D.storeLight = point(-2.4, 2.35, 1.35, 0xffcc91, 34, 11, 1.6);
    D.doorLight = point(0.45, 2.1, 1.55, 0xffc47e, 18, 7, 1.6);
    D.interiorLight = point(-2.2, 2.1, -2.7, 0xffe1ad, 15, 8, 1.8);

    // Cool streetlamp across the side road.
    D.streetLampLight = point(8.65, 5.15, 0.85, 0xcfe3ff, 46, 14, 1.7);
    // Vending machine cyan spill on the east wall.
    D.vendingLight = point(2.9, 1.25, -2.0, 0x8fe9ff, 11, 5.5, 1.7);
    // Little amber cafe sign in the alley / left building.
    D.cafeLight = point(-9.5, 2.9, 1.2, 0xffa562, 13, 6.5, 1.7);
    // Magenta snack-bar neon on the far side.
    D.pinkLight = point(10.0, 3.0, -0.6, 0xff5c9a, 15, 7, 1.8);
    // Cool spill from the far-side shuttered shop.
    D.cyanLight = point(10.0, 1.9, 4.7, 0x6bc8df, 7, 5, 1.8);

    // Soft under-awning downlights.
    for (const x of [-5.4, -3.2, -1.0, 0.7]) {
      D.glowSprite(layer, {
        x: x,
        y: 2.67,
        z: 1.45,
        color: 0xffd59d,
        size: 1.35,
        opacity: 0.22,
      });
    }

    /* Wet neon paint on the roads — additive fake reflections that tie the
       shopfront, vending machine and far-side neon into the ground. */
    const FX = D.anchors;
    D.floorGlow(layer, {
      x: -2.2,
      z: 2.5,
      w: 8.8,
      l: 4.6,
      color: 0xffc17c,
      opacity: 0.17,
      y: D.config.Y.WALK + 0.014,
    });
    D.lightPool(layer, {
      x: -1.8,
      z: 2.2,
      w: 10.5,
      l: 5.6,
      color: 0xffb56f,
      opacity: 0.10,
      y: D.config.Y.WALK + 0.013,
    });
    D.floorGlow(layer, {
      x: -2.0,
      z: 6.7,
      w: 7.4,
      l: 8.4,
      color: 0xffbd78,
      opacity: 0.1,
      y: D.config.Y.ROAD + 0.013,
    });
    D.floorGlow(layer, {
      x: 3.35,
      z: -2.1,
      w: 2.1,
      l: 3.4,
      color: FX.vendingGlow ? 0x8fe8ff : 0x8fe8ff,
      opacity: 0.2,
      rotation: Math.PI / 2,
      y: D.config.Y.WALK + 0.015,
    });
    D.lightPool(layer, {
      x: 3.1,
      z: -2.0,
      w: 2.8,
      l: 3.4,
      color: 0x8fe8ff,
      opacity: 0.15,
      y: D.config.Y.WALK + 0.014,
    });
    // far-side magenta neon smear across the wet side road
    D.floorGlow(layer, {
      x: 8.1,
      z: -0.45,
      w: 2.4,
      l: 5.8,
      color: 0xff5b9d,
      opacity: 0.15,
      rotation: Math.PI / 2,
      y: D.config.Y.ROAD + 0.014,
    });
    D.floorGlow(layer, {
      x: 7.5,
      z: 0.9,
      w: 3.2,
      l: 7.6,
      color: 0xbfe1ff,
      opacity: 0.12,
      y: D.config.Y.ROAD + 0.013,
    });
    D.floorGlow(layer, {
      x: 8.0,
      z: 3.4,
      w: 2.0,
      l: 4.4,
      color: 0x62e8ff,
      opacity: 0.09,
      y: D.config.Y.ROAD + 0.012,
    });
    D.floorGlow(layer, {
      x: 0.4,
      z: 1.05,
      w: 2.6,
      l: 3.0,
      color: 0xffe0ad,
      opacity: 0.17,
      y: D.config.Y.WALK + 0.016,
    });
    // a faint violet-pink answer from the far-side neon on the foreground road
    D.floorGlow(layer, {
      x: 7.3,
      z: 6.2,
      w: 1.8,
      l: 4.6,
      color: 0xff5b9d,
      opacity: 0.085,
      rotation: 0.24,
      y: D.config.Y.ROAD + 0.012,
    });
    // broad wet sky sheen so the foreground asphalt is not a dead void
    D.lightPool(layer, {
      x: -1.5,
      z: 8.0,
      w: 20,
      l: 7.2,
      color: 0x8ea9e8,
      opacity: 0.045,
      y: D.config.Y.ROAD + 0.009,
    });

    /* Light shafts: kept extremely subtle, like mist catching the lamps. */
    function beam(x, y, z, color, radius, height, opacity) {
      const geo = new T.CylinderGeometry(0.14, radius, height, 24, 1, true);
      const mat = new T.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: opacity,
        side: T.DoubleSide,
        blending: T.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
        fog: false,
      });
      const m = new T.Mesh(geo, mat);
      m.position.set(x, y - height / 2, z);
      m.userData.noOutline = true;
      layer.add(m);
      return m;
    }
    D.beamLamp = beam(8.65, 5.1, 0.85, 0xbfd9ff, 3.2, 5.0, 0.045);
    D.beamStore = beam(-0.2, 2.65, 1.7, 0xffc68b, 3.6, 2.55, 0.035);

    /* ----------------------------- rain ----------------------------- */
    const RAIN_COUNT = 1750;
    const rainGeo = new T.BufferGeometry();
    const rainPos = new Float32Array(RAIN_COUNT * 6);
    rainGeo.setAttribute('position', new T.BufferAttribute(rainPos, 3));
    const drops = [];
    const rr = D.rng(4711);

    function insideStore(x, z) {
      return x > -7.1 && x < 1.7 && z > -6.5 && z < 0.95;
    }
    function resetDrop(d, initial) {
      let x = 0;
      let z = 0;
      for (let tries = 0; tries < 8; tries++) {
        x = (rr() - 0.5) * 26.5;
        z = (rr() - 0.5) * 26.5;
        if (!insideStore(x, z)) break;
      }
      d.x = x;
      d.z = z;
      d.y = initial ? rr() * 20 : 13 + rr() * 9;
      d.vy = 13 + rr() * 10;
      d.vx = 0.7 + rr() * 0.9;
      d.vz = 0.18 + rr() * 0.45;
      d.len = 0.32 + rr() * 0.72;
    }
    for (let i = 0; i < RAIN_COUNT; i++) {
      const d = {};
      resetDrop(d, true);
      drops.push(d);
    }
    const rainMat = new T.LineBasicMaterial({
      color: 0xb7ccff,
      transparent: true,
      opacity: 0.145,
      blending: T.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
      fog: false,
    });
    const rain = new T.LineSegments(rainGeo, rainMat);
    rain.frustumCulled = false;
    rain.userData.noOutline = true;
    layer.add(rain);
    D.rain = rain;

    // brighter near-field drizzle layer
    const NEAR = 220;
    const nearGeo = new T.BufferGeometry();
    const nearPos = new Float32Array(NEAR * 6);
    nearGeo.setAttribute('position', new T.BufferAttribute(nearPos, 3));
    const nearDrops = [];
    for (let i = 0; i < NEAR; i++) {
      const d = {};
      resetDrop(d, true);
      d.y = rr() * 16;
      d.vy = 17 + rr() * 8;
      d.len = 0.6 + rr() * 0.9;
      nearDrops.push(d);
    }
    const nearMat = new T.LineBasicMaterial({
      color: 0xd8e8ff,
      transparent: true,
      opacity: 0.052,
      blending: T.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
      fog: false,
    });
    const nearRain = new T.LineSegments(nearGeo, nearMat);
    nearRain.frustumCulled = false;
    nearRain.userData.noOutline = true;
    layer.add(nearRain);

    /* Ripples on the wet ground. */
    const ripples = [];
    const rippleGroup = new T.Group();
    rippleGroup.userData.noOutline = true;
    layer.add(rippleGroup);
    const rippleGeo = new T.RingGeometry(0.075, 0.095, 16);
    const rippleRng = D.rng(818);
    for (let i = 0; i < 26; i++) {
      const mat = new T.MeshBasicMaterial({
        color: 0xbcd8ff,
        transparent: true,
        opacity: 0,
        blending: T.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
        side: T.DoubleSide,
        fog: false,
      });
      const m = new T.Mesh(rippleGeo, mat);
      m.rotation.x = -Math.PI / 2;
      m.userData.noOutline = true;
      m.userData.life = 0;
      m.userData.delay = rippleRng() * 2.5;
      m.userData.x = (rippleRng() - 0.5) * 22;
      m.userData.z = (rippleRng() - 0.5) * 22;
      m.position.set(m.userData.x, D.config.Y.ROAD + 0.016, m.userData.z);
      rippleGroup.add(m);
      ripples.push(m);
    }

    function resetRipple(m) {
      m.userData.x = (rippleRng() - 0.5) * 24;
      m.userData.z = (rippleRng() - 0.5) * 24;
      if (m.userData.x > -6.8 && m.userData.x < 1.4 && m.userData.z > -6.2 && m.userData.z < 0.6) {
        m.userData.z = 6.4;
      }
      m.position.x = m.userData.x;
      m.position.z = m.userData.z;
      m.userData.life = 0;
      m.userData.delay = rippleRng() * 1.6;
      m.userData.max = 1.1 + rippleRng() * 1.6;
    }

    /* Low mist/glow sheets drifting in the side road. */
    const mists = [];
    for (let i = 0; i < 5; i++) {
      const col = [0x94b7ff, 0xffbd85, 0x9d8bff, 0x86d7e8, 0xffa4c5][i];
      const s = D.glowSprite(layer, {
        x: (rippleRng() - 0.5) * 18,
        y: 0.7 + rippleRng() * 2.2,
        z: (rippleRng() - 0.5) * 18,
        color: col,
        size: 6 + rippleRng() * 7,
        opacity: 0.035,
      });
      mists.push(s);
    }

    /* ----------------------------- update ----------------------------- */
    let time = 0;
    const tmp = new T.Vector3();
    D.onUpdate((dt, elapsed) => {
      time = elapsed;

      // rain
      let i3 = 0;
      for (let i = 0; i < RAIN_COUNT; i++) {
        const d = drops[i];
        d.y -= d.vy * dt;
        d.x += d.vx * dt;
        d.z += d.vz * dt;
        if (d.y < 0.08) {
          resetDrop(d, false);
        }
        if (d.x > 13.5) d.x -= 27;
        if (d.z > 13.5) d.z -= 27;
        rainPos[i3++] = d.x;
        rainPos[i3++] = d.y;
        rainPos[i3++] = d.z;
        rainPos[i3++] = d.x - d.vx * 0.026 * d.len;
        rainPos[i3++] = d.y + d.len;
        rainPos[i3++] = d.z - d.vz * 0.026 * d.len;
      }
      rainGeo.attributes.position.needsUpdate = true;

      let j3 = 0;
      for (let i = 0; i < NEAR; i++) {
        const d = nearDrops[i];
        d.y -= d.vy * dt;
        d.x += d.vx * 1.3 * dt;
        if (d.y < 0.1) resetDrop(d, false);
        nearPos[j3++] = d.x;
        nearPos[j3++] = d.y;
        nearPos[j3++] = d.z;
        nearPos[j3++] = d.x - d.vx * 0.045;
        nearPos[j3++] = d.y + d.len;
        nearPos[j3++] = d.z - d.vz * 0.045;
      }
      nearGeo.attributes.position.needsUpdate = true;

      // ripples
      for (let i = 0; i < ripples.length; i++) {
        const m = ripples[i];
        const u = m.userData;
        if (u.delay > 0) {
          u.delay -= dt;
          continue;
        }
        u.life += dt * 0.9;
        const t = u.life / u.max;
        if (t >= 1) {
          resetRipple(m);
          continue;
        }
        const s = 0.35 + t * 6.2;
        m.scale.setScalar(s);
        m.material.opacity = (1 - t) * 0.22;
      }

      // streetlamp and neon breathing
      if (D.streetLampLight) {
        D.streetLampLight.intensity = 44 + Math.sin(time * 21) * 1.2 + Math.sin(time * 7.1) * 1.8;
      }
      if (D.vendingLight) D.vendingLight.intensity = 10.5 + Math.sin(time * 2.2) * 0.7;
      if (D.pinkLight) D.pinkLight.intensity = 14.5 + Math.sin(time * 3.1 + 1.7) * 1.2;
      if (D.beamLamp) D.beamLamp.material.opacity = 0.03 + Math.sin(time * 0.8) * 0.006;

      // mist drift
      for (let i = 0; i < mists.length; i++) {
        const m = mists[i];
        m.position.x += Math.sin(time * 0.12 + i) * dt * 0.045;
        m.position.z += Math.cos(time * 0.09 + i * 1.7) * dt * 0.035;
      }
    });
  };
})();
