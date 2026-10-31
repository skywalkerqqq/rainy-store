/* =========================================================
   星降マート — renderer, camera, orbit interaction, assembly
   ========================================================= */
(function () {
  'use strict';
  const D = window.DIORAMA;
  const T = THREE;

  function boot() {
    const container = document.body;
    const renderer = new T.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
      stencil: false,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputColorSpace = T.SRGBColorSpace;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFSoftShadowMap;
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    D.renderer = renderer;
    D.maxAniso = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);

    const scene = new T.Scene();
    scene.fog = new T.FogExp2(0x0b0e1a, 0.0095);
    scene.environment = D.makeEnvironment(renderer);
    scene.environmentIntensity = 0.72;
    D.scene = scene;

    const camera = new T.PerspectiveCamera(31, window.innerWidth / window.innerHeight, 0.1, 160);
    D.camera = camera;

    const root = new T.Group();
    root.name = 'diorama';
    scene.add(root);
    D.root = root;

    // Layers let every builder work independently but compose in one model.
    D.groups = {
      base: D.layer('base'),
      street: D.layer('street'),
      store: D.layer('store'),
      props: D.layer('props'),
      background: D.layer('background'),
      ambient: D.layer('ambient'),
    };

    // Build order: base/street -> background -> store -> props -> weather.
    if (D.buildStreet) D.buildStreet(D.groups.street, D.groups.base);
    if (D.buildBackground) D.buildBackground(D.groups.background);
    if (D.buildStore) D.buildStore(D.groups.store);
    if (D.buildProps) D.buildProps(D.groups.props);
    if (D.buildAmbient) D.buildAmbient(D.groups.ambient);

    // Collapse static opaque details by material. This keeps the diorama's
    // tiny hand-built detail while keeping the draw-call count sane.
    D.batchStats = {};
    try {
      for (const layerName of ['base', 'street', 'store', 'props']) {
        const g = D.groups[layerName];
        if (g && D.staticBatch) D.batchStats[layerName] = D.staticBatch(g);
      }
    } catch (err) {
      D.batchError = String(err && (err.stack || err));
      console.error('static batch failed', err);
    }

    if (D.autoOutline) {
      const n = D.autoOutline(root, { minRadius: 0.2, thickness: 0.00172 });
      D.outlineCount = n;
    }

    /* -------------------------------------------------------
       Backdrop + light bloom post pass
       ------------------------------------------------------- */
    const sky = D.skyGradientTexture();
    scene.background = sky;
    scene.backgroundIntensity = 0.98;
    scene.fog.color.setHex(0x0c0e18);

    const post = {
      enabled: true,
      strength: 0.5,
      threshold: 0.64,
      knee: 0.2,
    };
    D.post = post;

    const postScene = new T.Scene();
    const postCam = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const postQuad = new T.Mesh(new T.PlaneGeometry(2, 2), null);
    postQuad.frustumCulled = false;
    postScene.add(postQuad);

    function makeRT(w, h, samples) {
      const opts = {
        type: T.HalfFloatType,
        depthBuffer: true,
        stencilBuffer: false,
        minFilter: T.LinearFilter,
        magFilter: T.LinearFilter,
      };
      if (samples) opts.samples = samples;
      return new T.WebGLRenderTarget(Math.max(2, Math.floor(w)), Math.max(2, Math.floor(h)), opts);
    }

    let rtScene = makeRT(window.innerWidth, window.innerHeight, 4);
    let rtBright = makeRT(window.innerWidth / 2, window.innerHeight / 2, 0);
    let rtBlurA = makeRT(window.innerWidth / 2, window.innerHeight / 2, 0);
    let rtBlurB = makeRT(window.innerWidth / 2, window.innerHeight / 2, 0);

    const brightMat = new T.ShaderMaterial({
      uniforms: {
        tSrc: { value: null },
        uThreshold: { value: post.threshold },
        uKnee: { value: post.knee },
      },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
      fragmentShader: [
        'uniform sampler2D tSrc;',
        'uniform float uThreshold;',
        'uniform float uKnee;',
        'varying vec2 vUv;',
        'void main(){',
        '  vec3 c = texture2D(tSrc, vUv).rgb;',
        '  float l = max(c.r, max(c.g, c.b));',
        '  float k = smoothstep(uThreshold, uThreshold + uKnee, l);',
        '  gl_FragColor = vec4(c * k, 1.0);',
        '}',
      ].join('\n'),
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
    });

    const blurMat = new T.ShaderMaterial({
      uniforms: {
        tSrc: { value: null },
        uDir: { value: new T.Vector2(1, 0) },
      },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
      fragmentShader: [
        'uniform sampler2D tSrc;',
        'uniform vec2 uDir;',
        'varying vec2 vUv;',
        'void main(){',
        '  vec3 c = texture2D(tSrc, vUv).rgb * 0.204;',
        '  c += texture2D(tSrc, vUv + uDir * 1.0).rgb * 0.180;',
        '  c += texture2D(tSrc, vUv - uDir * 1.0).rgb * 0.180;',
        '  c += texture2D(tSrc, vUv + uDir * 2.0).rgb * 0.124;',
        '  c += texture2D(tSrc, vUv - uDir * 2.0).rgb * 0.124;',
        '  c += texture2D(tSrc, vUv + uDir * 3.0).rgb * 0.066;',
        '  c += texture2D(tSrc, vUv - uDir * 3.0).rgb * 0.066;',
        '  c += texture2D(tSrc, vUv + uDir * 4.0).rgb * 0.028;',
        '  c += texture2D(tSrc, vUv - uDir * 4.0).rgb * 0.028;',
        '  gl_FragColor = vec4(c, 1.0);',
        '}',
      ].join('\n'),
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
    });

    const compositeMat = new T.ShaderMaterial({
      uniforms: {
        tScene: { value: null },
        tBloom: { value: null },
        uStrength: { value: post.strength },
        uAspect: { value: 1 },
      },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
      fragmentShader: [
        'uniform sampler2D tScene;',
        'uniform sampler2D tBloom;',
        'uniform float uStrength;',
        'varying vec2 vUv;',
        'void main(){',
        '  vec3 c = texture2D(tScene, vUv).rgb;',
        '  vec3 b = texture2D(tBloom, vUv).rgb;',
        '  c += b * uStrength;',
        '  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));',
        '  c = mix(vec3(l), c, 1.08);',
        '  vec3 shadowTint = vec3(0.86, 0.92, 1.07);',
        '  vec3 highTint = vec3(1.045, 1.0, 0.955);',
        '  c *= mix(shadowTint, highTint, smoothstep(0.03, 0.72, l));',
        '  c = max(c, vec3(0.0));',
        '  c = c / (1.0 + max(vec3(0.0), c - 1.18) * 0.3);',
        '  gl_FragColor = vec4(c, 1.0);',
        '  #include <colorspace_fragment>',
        '}',
      ].join('\n'),
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
    });

    function sizePost() {
      const w = window.innerWidth * renderer.getPixelRatio();
      const h = window.innerHeight * renderer.getPixelRatio();
      rtScene.setSize(Math.floor(w), Math.floor(h));
      const bw = Math.max(2, Math.floor(w / 2));
      const bh = Math.max(2, Math.floor(h / 2));
      rtBright.setSize(bw, bh);
      rtBlurA.setSize(bw, bh);
      rtBlurB.setSize(bw, bh);
    }
    sizePost();

    function renderFrame() {
      if (!post.enabled) {
        renderer.setRenderTarget(null);
        renderer.render(scene, camera);
        return;
      }
      renderer.setRenderTarget(rtScene);
      renderer.clear();
      renderer.render(scene, camera);

      postQuad.material = brightMat;
      brightMat.uniforms.tSrc.value = rtScene.texture;
      brightMat.uniforms.uThreshold.value = post.threshold;
      brightMat.uniforms.uKnee.value = post.knee;
      renderer.setRenderTarget(rtBright);
      renderer.render(postScene, postCam);

      postQuad.material = blurMat;
      blurMat.uniforms.tSrc.value = rtBright.texture;
      blurMat.uniforms.uDir.value.set(1.2 / rtBright.width, 0);
      renderer.setRenderTarget(rtBlurA);
      renderer.render(postScene, postCam);

      blurMat.uniforms.tSrc.value = rtBlurA.texture;
      blurMat.uniforms.uDir.value.set(0, 1.2 / rtBright.height);
      renderer.setRenderTarget(rtBlurB);
      renderer.render(postScene, postCam);

      compositeMat.uniforms.tScene.value = rtScene.texture;
      compositeMat.uniforms.tBloom.value = rtBlurB.texture;
      compositeMat.uniforms.uStrength.value = post.strength;
      postQuad.material = compositeMat;
      renderer.setRenderTarget(null);
      renderer.render(postScene, postCam);
    }

    /* -------------------------------------------------------
       Camera orbit
       ------------------------------------------------------- */
    const target = new T.Vector3(0.05, 0.4, 0.85);
    const cam = {
      theta: 0.555,
      phi: 1.16,
      radius: 53,
      goalTheta: 0.555,
      goalPhi: 1.16,
      goalRadius: 49.0,
      minRadius: 15.5,
      maxRadius: 64,
      minPhi: 0.34,
      maxPhi: 1.42,
      dragging: false,
      lastX: 0,
      lastY: 0,
      idle: 0,
      pointers: new Map(),
      pinchDist: 0,
      intro: true,
    };
    D.cam = cam;
    D.cameraTarget = target;

    function applyCamera() {
      const sinPhi = Math.sin(cam.phi);
      camera.position.set(
        target.x + cam.radius * sinPhi * Math.sin(cam.theta),
        target.y + cam.radius * Math.cos(cam.phi),
        target.z + cam.radius * sinPhi * Math.cos(cam.theta)
      );
      camera.lookAt(target);
    }
    applyCamera();

    const el = renderer.domElement;
    el.addEventListener('pointerdown', (e) => {
      el.setPointerCapture(e.pointerId);
      cam.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      cam.dragging = true;
      cam.idle = 0;
      cam.intro = false;
      cam.lastX = e.clientX;
      cam.lastY = e.clientY;
      if (cam.pointers.size === 2) {
        const pts = [...cam.pointers.values()];
        cam.pinchDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      }
    });

    el.addEventListener('pointermove', (e) => {
      if (!cam.pointers.has(e.pointerId)) return;
      cam.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      cam.idle = 0;
      cam.intro = false;
      if (cam.pointers.size >= 2) {
        const pts = [...cam.pointers.values()];
        const d = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        if (cam.pinchDist > 0) {
          cam.goalRadius = D.clamp(cam.goalRadius * (cam.pinchDist / d), cam.minRadius, cam.maxRadius);
        }
        cam.pinchDist = d;
        return;
      }
      if (!cam.dragging) return;
      const dx = e.clientX - cam.lastX;
      const dy = e.clientY - cam.lastY;
      cam.lastX = e.clientX;
      cam.lastY = e.clientY;
      cam.goalTheta -= dx * 0.0052;
      cam.goalPhi = D.clamp(cam.goalPhi - dy * 0.0042, cam.minPhi, cam.maxPhi);
    });

    function endPointer(e) {
      cam.pointers.delete(e.pointerId);
      if (cam.pointers.size === 0) {
        cam.dragging = false;
        cam.idle = 0;
      }
      if (cam.pointers.size < 2) cam.pinchDist = 0;
    }
    el.addEventListener('pointerup', endPointer);
    el.addEventListener('pointercancel', endPointer);
    el.addEventListener('pointerleave', (e) => {
      if (e.buttons === 0) endPointer(e);
    });

    el.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        cam.idle = 0;
        cam.intro = false;
        const scale = Math.exp(D.clamp(e.deltaY, -120, 120) * 0.00105);
        cam.goalRadius = D.clamp(cam.goalRadius * scale, cam.minRadius, cam.maxRadius);
      },
      { passive: false }
    );

    D.setView = function (opts) {
      opts = opts || {};
      cam.intro = false;
      if (opts.theta !== undefined) cam.theta = cam.goalTheta = opts.theta;
      if (opts.phi !== undefined) cam.phi = cam.goalPhi = D.clamp(opts.phi, cam.minPhi, cam.maxPhi);
      if (opts.radius !== undefined) cam.radius = cam.goalRadius = D.clamp(opts.radius, cam.minRadius, cam.maxRadius);
      if (opts.target) target.copy(opts.target);
      if (opts.targetY !== undefined) target.y = opts.targetY;
      applyCamera();
      return { theta: cam.theta, phi: cam.phi, radius: cam.radius, target: target.toArray() };
    };

    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      sizePost();
    });

    /* Static scene: bake the shadow maps once after the first render.
       Only the camera and rain animate, so this saves a full shadow pass. */
    renderer.shadowMap.autoUpdate = false;
    renderer.shadowMap.needsUpdate = true;

    /* -------------------------------------------------------
       Clock / render loop
       ------------------------------------------------------- */
    const clock = new T.Clock();
    let elapsed = 0;
    function tick() {
      const dt = Math.min(clock.getDelta(), 0.05);
      elapsed += dt;

      // cinematic settle at start, free orbit afterwards
      if (cam.intro) {
        cam.goalRadius += (49.0 - cam.goalRadius) * (1 - Math.exp(-dt * 1.5));
      }
      cam.theta += (cam.goalTheta - cam.theta) * (1 - Math.exp(-dt * 8.5));
      cam.phi += (cam.goalPhi - cam.phi) * (1 - Math.exp(-dt * 8.5));
      cam.radius += (cam.goalRadius - cam.radius) * (1 - Math.exp(-dt * 7.0));

      // The model stays still when untouched: it is a viewable collectible,
      // not an attract-mode turntable. Dragging and zooming are the only
      // camera inputs.
      if (!cam.dragging && cam.pointers.size === 0) cam.idle += dt;
      applyCamera();

      for (const fn of D.updaters) fn(dt, elapsed);
      renderFrame();
    }
    renderer.setAnimationLoop(tick);

    // Expose just enough for still captures / diagnostics; no UI is drawn.
    window.__DIORAMA_READY__ = true;
    D.clock = clock;
    D.tick = tick;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
