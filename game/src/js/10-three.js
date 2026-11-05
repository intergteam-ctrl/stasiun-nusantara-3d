/* ================= 3D ENGINE (three.js r128) ================= */
const GL = {
  ok: false, renderer: null, scene: null, camera: null, view: null, raycaster: null,
  init() {
    try {
      if (!window.THREE) throw new Error('no three');
      const c = $('#gl');
      this.renderer = new THREE.WebGLRenderer({ canvas: c, antialias: !LITE || (window.devicePixelRatio || 1) < 2, powerPreference: 'high-performance' });
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, LITE ? 1.5 : 2));
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = LITE ? THREE.PCFShadowMap : THREE.PCFSoftShadowMap;
      this.raycaster = new THREE.Raycaster();
      this.ok = true;
    } catch (e) { this.ok = false; }
    window.addEventListener('resize', () => this.resize());
  },
  size() { const c = $('#gl'); return [Math.max(1, c.clientWidth), Math.max(1, c.clientHeight)]; },
  use(view) { this.view = view; this.resize(); },
  resize() {
    if (!this.ok) return;
    const [w, h] = this.size();
    this.renderer.setSize(w, h, false);
    const v = this.view; if (!v) return;
    if (v.camera.isPerspectiveCamera) { v.camera.aspect = w / h; v.camera.updateProjectionMatrix(); }
    v.onResize && v.onResize(w, h);
  },
  active: true,
  render() { if (this.ok && this.active && this.view) this.renderer.render(this.view.scene, this.view.camera); },
  ndc(ev) {
    const r = $('#gl').getBoundingClientRect();
    const p = ev.touches ? ev.touches[0] : ev;
    return new THREE.Vector2(((p.clientX - r.left) / r.width) * 2 - 1, -((p.clientY - r.top) / r.height) * 2 + 1);
  },
  pick(ev, objs) { this.raycaster.setFromCamera(this.ndc(ev), this.view.camera); return this.raycaster.intersectObjects(objs, true); },
  ground(ev, y = 0) {
    this.raycaster.setFromCamera(this.ndc(ev), this.view.camera);
    const p = new THREE.Vector3();
    return this.raycaster.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), -y), p) ? p : null;
  },
};

/* ---------- cartoon model kit ---------- */
// Palet cerah: warna lama dipetakan ke versi pastel/ceria agar seluruh dunia konsisten
const PAL = {
  0x3b5a3a: 0x93d66e, 0x5d9a4a: 0x93d66e, 0x6aa84f: 0x93d66e, 0x2e4e3a: 0x6cc76a, 0x4b4a46: 0xa89a88, 0x6d6a66: 0xbdb3a6,
  0x5b4a3c: 0xa97c55, 0xb8b4aa: 0xf3dfbd, 0xb4afa3: 0xf3dfbd, 0x9a958a: 0xf1d9b2, 0x2b3542: 0x5f86c4, 0x24456e: 0x38c6c9,
  0x1f4f8a: 0x3a9bff, 0xe9e1cf: 0xfff1dc, 0x9b3b2c: 0xff6f5e, 0xa33b2c: 0xff6f5e, 0x9a6a3c: 0xe0954f, 0x5c7a99: 0x5fb2ff,
  0x333: 0x5f86c4, 0x5f7896: 0x86c8ff, 0x1f3d7a: 0x3a8ef6, 0x22303f: 0x4a7fc4, 0xd7e3ea: 0xbdf0dc, 0xc9d2c6: 0xdcd0ff,
  0x45617e: 0x4fa7d8, 0x6b4a2b: 0xe08a52, 0x2f7d4a: 0x5cc06a, 0x3a4c66: 0x5f86c4, 0x5a6470: 0xd3dbe6, 0x2c3a52: 0xb0c0d6,
  0xe8ecef: 0xffffff, 0x4c7a6a: 0x9cc3ea, 0x2c4a5e: 0x9cc3ea, 0x3b4048: 0x7f8aa3, 0x4a4f57: 0x9ca6ba, 0xa59f92: 0xf6e4c3,
  0xcfc9bb: 0xf6e4c3, 0xb58552: 0xf4b27c, 0x5a3a20: 0xb8643a, 0xeceae4: 0xfffaf0, 0x2d4a6a: 0x5aa7e0, 0x8fc3e8: 0xa3dcff,
  0xdfe6ee: 0xffffff, 0x34495e: 0x5f86c4, 0x7f8c99: 0xbac7d8, 0x9aa6b2: 0xcbd5e2, 0x1e2a38: 0x4a4f8c, 0xd7dde3: 0xf3f6fa,
  0x1b2b3d: 0x35558f, 0x1c232c: 0x4c5570, 0x8a96a3: 0xdfe7f0, 0x9fb3c6: 0xc7e3f7, 0x2c394a: 0x8193aa,
};
const MK = {
  mats: {}, swayers: [], drifters: [], time: 0,
  mat(color, opts = {}) {
    if (PAL[color] !== undefined) color = PAL[color];
    const k = color + JSON.stringify(opts);
    if (!this.mats[k]) this.mats[k] = new THREE.MeshToonMaterial(Object.assign({ color, gradientMap: this.grad() }, opts));
    return this.mats[k];
  },
  mesh(geo, color, opts) { const m = new THREE.Mesh(geo, typeof color === 'object' ? color : this.mat(color, opts)); m.castShadow = true; m.receiveShadow = true; return m; },
  _rb: {},
  rgeo(w, h, d, r) {
    r = Math.min(r, w / 2 * .96, h / 2 * .96, d / 2 * .96);
    const key = [w, h, d, r].map(v => v.toFixed(3)).join('|');
    if (this._rb[key]) return this._rb[key];
    const S = LITE ? 3 : 5, P = H => LITE ? [-H, -H + r, H - r, H] : [-H, -H + r * .3, -H + r, H - r, H - r * .3, H];
    const g = new THREE.BoxGeometry(w, h, d, S, S, S), pos = g.attributes.position, nor = g.attributes.normal;
    const ext = [w / 2, h / 2, d / 2], v = new THREE.Vector3(), inner = new THREE.Vector3(), n = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      const a = [v.x, v.y, v.z].map((c, ax) => { const H = ext[ax], k = Math.round((c + H) / (2 * H) * S); return P(H)[k]; });
      v.set(a[0], a[1], a[2]);
      inner.set(clamp(v.x, -ext[0] + r, ext[0] - r), clamp(v.y, -ext[1] + r, ext[1] - r), clamp(v.z, -ext[2] + r, ext[2] - r));
      n.subVectors(v, inner);
      if (n.lengthSq() > 1e-9) { n.normalize(); v.copy(inner).addScaledVector(n, r); nor.setXYZ(i, n.x, n.y, n.z); }
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    return (this._rb[key] = g);
  },
  box(w, h, d, color, x = 0, y = 0, z = 0, opts) {
    let r = null;
    if (opts && 'r' in opts) { r = opts.r; opts = Object.assign({}, opts); delete opts.r; if (!Object.keys(opts).length) opts = undefined; }
    const mn = Math.min(w, h, d);
    if (r == null) r = mn < .05 || Math.max(w, h, d) > 60 ? 0 : Math.min(.35, mn * .22);
    const geo = r > 0 ? this.rgeo(w, h, d, r) : new THREE.BoxGeometry(w, h, d);
    const m = this.mesh(geo, color, opts); m.position.set(x, y, z); return m;
  },
  cyl(rt, rb, h, color, x = 0, y = 0, z = 0, seg = 14, opts) { const m = this.mesh(new THREE.CylinderGeometry(rt, rb, h, Math.max(seg, 12)), color, opts); m.position.set(x, y, z); return m; },
  ball(r, color, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1, opts) { const m = this.mesh(this.sphereGeo(), color, opts); m.scale.set(r * sx, r * sy, r * sz); m.position.set(x, y, z); return m; },
  sphereGeo() { return this._sg || (this._sg = new THREE.SphereGeometry(1, LITE ? 12 : 18, LITE ? 9 : 14)); },
  // batang/dahan melengkung: silinder meruncing dari a ke b
  limb(a, b, r0, r1, color) {
    const dir = new THREE.Vector3().subVectors(b, a), len = dir.length();
    const m = this.mesh(new THREE.CylinderGeometry(r1, r0, len, 10), color);
    m.position.copy(a).addScaledVector(dir, .5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    return m;
  },
  sway(obj, amp = .05, speed = 1) { obj.userData.sw = { amp, speed, ph: Math.random() * 6, rx: obj.rotation.x, rz: obj.rotation.z }; this.swayers.push(obj); },
  tick(dt) {
    this.time += dt; const t = this.time;
    const cur = GL.view && GL.view.scene, root = o => { let r = o; while (r.parent) r = r.parent; return r; };
    for (let i = this.swayers.length - 1; i >= 0; i--) {
      const o = this.swayers[i]; if (!o.parent) { this.swayers.splice(i, 1); continue; }
      if (!o.userData.root || o.userData.root.parent === undefined) o.userData.root = root(o);
      if (o.userData.root !== cur) continue;
      const s = o.userData.sw; o.rotation.z = s.rz + Math.sin(t * s.speed + s.ph) * s.amp; o.rotation.x = s.rx + Math.cos(t * s.speed * .8 + s.ph) * s.amp * .6;
    }
    for (let i = this.drifters.length - 1; i >= 0; i--) {
      const o = this.drifters[i]; if (!o.parent) { this.drifters.splice(i, 1); continue; }
      if (o.parent !== cur) continue;
      const d = o.userData.drift; o.position.x += d.v * dt; if (o.position.x > d.max) o.position.x = d.min; o.position.y = d.y + Math.sin(t * .4 + d.ph) * .4;
    }
  },
  textTex(lines, { w = 512, h = 128, bg = '#ffffff', fg = '#1d3f73', font = '700 70px "Fredoka", "Baloo 2", system-ui, sans-serif', sub = null, subFont = '700 30px "JetBrains Mono", monospace', border = '#1d3f73' } = {}) {
    const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
    const rr = (x, y, ww, hh, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + ww, y, x + ww, y + hh, r); g.arcTo(x + ww, y + hh, x, y + hh, r); g.arcTo(x, y + hh, x, y, r); g.arcTo(x, y, x + ww, y, r); g.closePath(); };
    g.clearRect(0, 0, w, h);
    g.fillStyle = border; rr(0, 0, w, h, h * .28); g.fill(); g.fillStyle = bg; rr(8, 8, w - 16, h - 16, h * .22); g.fill();
    g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = font;
    g.fillText(lines, w / 2, sub ? h * .44 : h / 2 + 3);
    if (sub) { g.font = subFont; g.fillText(sub, w / 2, h * .8); }
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t;
  },
  sign(text, w, h, opts) {
    const t = this.textTex(text, opts);
    return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, transparent: true }));
  },
  skyTex: null,
  sky(scene, { fog = [70, 220] } = {}) {
    if (!this.skyTex) {
      const c = document.createElement('canvas'); c.width = 4; c.height = 256; const g = c.getContext('2d');
      const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, '#6cc4ff'); gr.addColorStop(.55, '#bfe7ff'); gr.addColorStop(1, '#fff1d6');
      g.fillStyle = gr; g.fillRect(0, 0, 4, 256); this.skyTex = new THREE.CanvasTexture(c);
    }
    scene.background = this.skyTex;
    if (fog) scene.fog = new THREE.Fog(0xd4efff, fog[0], fog[1]);
  },
  cloud(x, y, z, s = 1) {
    const g = new THREE.Group(), m = this.mat(0xffffff, { emissive: 0x9ab4cc });
    [[0, 0, 0, 1.6], [1.6, -.3, .2, 1.2], [-1.6, -.35, -.1, 1.1], [.6, .7, 0, 1.15], [-.7, .5, .3, 1]].forEach(([a, b, c, r]) => { const p = new THREE.Mesh(this.sphereGeo(), m); p.position.set(a, b, c); p.scale.set(r, r * .85, r); g.add(p); });
    g.scale.setScalar(s); g.position.set(x, y, z); g.userData.drift = { v: rand(.6, 1.6), min: -160, max: 160, y, ph: Math.random() * 6 }; this.drifters.push(g);
    return g;
  },
  clouds(scene, n = 10, { y = [22, 34], z = [-90, -30], x = [-150, 150] } = {}) { if (LITE) n = Math.ceil(n / 2); for (let i = 0; i < n; i++) scene.add(this.cloud(rand(...x), rand(...y), rand(...z), rand(1.4, 2.8))); },
  hills(scene, n = 8, z = -95, spread = 300) {
    for (let i = 0; i < n; i++) {
      const far = i % 2 === 0, r = rand(22, 38);
      const h = this.mesh(this.sphereGeo(), far ? 0xa8d4f2 : 0x86cf73); h.castShadow = false;
      h.scale.set(r * 1.3, r * (far ? .5 : .38), r * .8); h.position.set(-spread / 2 + i * spread / (n - 1) + rand(-10, 10), -2, z - (far ? 30 : 0)); scene.add(h);
    }
  },
  person({ shirt = 0x2d6cdf, pants = 0x1d2733, skin = 0xc68c5a, hair = 0x1b1b1b, hijab = null, hat = null, vest = null, scale = 1, style = null } = {}) {
    // Karakter kartun chibi: kepala besar, badan bulat, toon shading + outline lembut
    const G = this.geos(), sk = this.toon(skin), ol = this.olMat;
    const part = (geo, mat, x, y, z, sx = 1, sy = 1, sz = 1, outline = false, shadow = false) => {
      const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.scale.set(sx, sy, sz); m.castShadow = shadow;
      if (outline) { const o = new THREE.Mesh(geo, ol); o.scale.setScalar(1.08); m.add(o); }
      return m;
    };
    const g = new THREE.Group(), inner = new THREE.Group(); g.add(inner);
    const shoe = this.toon(0x2a2433), pm = this.toon(pants), sm = this.toon(shirt);
    // kaki
    const legL = new THREE.Group(), legR = new THREE.Group();
    [legL, legR].forEach((L, i) => {
      L.add(part(G.limb, pm, 0, -.11, 0, 1.25, 1, 1.25));
      L.add(part(G.ball, shoe, 0, -.25, .04, 1.15, .7, 1.5, true));
      L.position.set(i ? .11 : -.11, .3, 0); inner.add(L);
    });
    // badan
    const hip = part(G.ball, pm, 0, .36, 0, 2.3, 1.3, 1.9, true, true); inner.add(hip);
    const torso = part(G.ball, sm, 0, .56, 0, 2.55, 2.75, 2.05, true, true); inner.add(torso);
    if (vest) { const v = part(G.band, this.toon(vest), 0, .56, 0, 2.62, 2.8, 2.12); inner.add(v); const st = part(G.band2, this.toon(0xf3f5f2, { emissive: 0x666666 }), 0, .56, 0, 2.64, 2.8, 2.14); inner.add(st); }
    // lengan
    const armL = new THREE.Group(), armR = new THREE.Group();
    [armL, armR].forEach((A, i) => {
      A.add(part(G.limb, sm, 0, -.1, 0, 1, 1.05, 1));
      A.add(part(G.ball, sk, 0, -.23, 0, .85, .85, .85, true));
      A.position.set(i ? .25 : -.25, .72, 0); A.rotation.z = i ? .22 : -.22; inner.add(A);
    });
    // kepala
    const head = new THREE.Group(); head.position.set(0, 1.04, 0); inner.add(head);
    head.add(part(G.head, sk, 0, 0, 0, 1, .94, .95, true, true));
    const eyeM = this.toon(0x1b1626), white = this.flat(0xffffff);
    const eyes = [];
    [-1, 1].forEach(k => {
      const e = part(G.ball, eyeM, k * .115, .02, .29, .62, .82, .4); head.add(e); eyes.push(e);
      e.add(part(G.ball, white, -.03, .035, .085, .32, .28, .3));
      head.add(part(G.ball, this.flat(0xff8fa3, { transparent: true, opacity: .55 }), k * (hijab ? .16 : .19), -.08, hijab ? .28 : .26, .7, .4, .2));
      // alis lembut
      const br = part(G.ball, this.toon(hijab ? 0x2a1d14 : hair), k * .115, .14, .3, .55, .14, .2); br.rotation.z = -k * .12; head.add(br);
    });
    const mouth = new THREE.Mesh(G.smile, this.flat(0x6b2b2b)); mouth.position.set(0, -.1, .315); mouth.rotation.z = Math.PI; head.add(mouth);
    head.add(part(G.ball, this.toon(skin), 0, -.03, .33, .32, .26, .26));
    // rambut / hijab / topi
    const st = style || pick(['cap', 'tuft', 'bun', 'long']);
    if (hijab) {
      const hm = this.toon(hijab);
      head.add(part(G.head, hm, 0, .01, -.062, 1.09, 1.07, 1.09, true));
      const drape = part(G.drape, this.toon(hijab, { side: THREE.DoubleSide }), 0, -.27, -.02, 1, 1, .9); head.add(drape);
    } else {
      const hm = this.toon(hair);
      const cap = part(G.cap, hm, 0, .02, -.03, 1.06, 1.03, 1.07, true); cap.rotation.x = -.55; head.add(cap);
      if (st === 'tuft' && !hat) { const t = part(G.ball, hm, .06, .33, .08, .9, .7, .9); t.rotation.z = -.4; head.add(t); }
      if (st === 'bun' && !hat) head.add(part(G.ball, hm, 0, .26, -.24, 1.2, 1.2, 1.2, true));
      if (st === 'long') head.add(part(G.ball, hm, 0, -.12, -.17, 3.1, 3.3, 1.9, true));
    }
    if (hat) { const hm2 = this.toon(hat); const hc = part(G.cap, hm2, 0, .05, -.02, 1.1, 1.0, 1.1, true); hc.rotation.x = -.5; head.add(hc); const brim = part(G.brim, hm2, 0, .12, .2, 1, 1, 1); brim.rotation.x = .12; head.add(brim); }
    g.scale.setScalar(scale * 1.08);
    const u = { legL, legR, armL, armR, head, torso, inner, eyes, phase: Math.random() * 6, t: Math.random() * 9, blink: rand(1, 4) };
    g.userData = u;
    u.walk = (dt, moving) => {
      u.t += dt; u.phase += dt * (moving ? 10 : 0);
      const s = Math.sin(u.phase), a = moving ? s * .7 : 0;
      legL.rotation.x = a; legR.rotation.x = -a; armL.rotation.x = -a * .9; armR.rotation.x = a * .9;
      if (moving) { inner.position.y = Math.abs(Math.cos(u.phase)) * .07; inner.scale.set(1 + Math.abs(s) * .03, 1 - Math.abs(s) * .03, 1); head.rotation.z = s * .06; }
      else { inner.position.y = 0; const br = Math.sin(u.t * 2.4); inner.scale.set(1 - br * .012, 1 + br * .02, 1); head.rotation.z = Math.sin(u.t * .9) * .05; armL.rotation.x = br * .05; armR.rotation.x = -br * .05; }
      u.blink -= dt; const sh = u.blink < 0 ? .12 : 1; eyes.forEach(e => e.scale.y = .82 * sh);
      if (u.blink < -.13) u.blink = rand(1.8, 4.5);
    };
    return g;
  },
  _geos: null,
  geos() {
    if (this._geos) return this._geos;
    const drapePts = [new THREE.Vector2(.2, .16), new THREE.Vector2(.3, .08), new THREE.Vector2(.36, -.06), new THREE.Vector2(.38, -.16), new THREE.Vector2(.3, -.2), new THREE.Vector2(.0, -.2)];
    this._geos = {
      ball: new THREE.SphereGeometry(.1, 16, 12),
      head: new THREE.SphereGeometry(.34, LITE ? 18 : 28, LITE ? 13 : 20),
      cap: new THREE.SphereGeometry(.34, LITE ? 18 : 28, LITE ? 9 : 14, 0, Math.PI * 2, 0, Math.PI * .52),
      limb: new THREE.CylinderGeometry(.07, .065, .26, 12),
      band: new THREE.SphereGeometry(.1, 20, 12, 0, Math.PI * 2, Math.PI * .3, Math.PI * .42),
      band2: new THREE.SphereGeometry(.1, 20, 4, 0, Math.PI * 2, Math.PI * .52, Math.PI * .06),
      smile: new THREE.TorusGeometry(.055, .014, 6, 14, Math.PI),
      brim: new THREE.CylinderGeometry(.22, .22, .03, 16, 1, false, -Math.PI / 2, Math.PI),
      drape: new THREE.LatheGeometry(drapePts, 20),
    };
    return this._geos;
  },
  _grad: null,
  grad() {
    if (this._grad) return this._grad;
    const px = [158, 212, 255], d = new Uint8Array(12); px.forEach((v, i) => { d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = v; d[i * 4 + 3] = 255; });
    const t = new THREE.DataTexture(d, 3, 1, THREE.RGBAFormat);
    t.minFilter = t.magFilter = THREE.NearestFilter; t.generateMipmaps = false; t.needsUpdate = true;
    return (this._grad = t);
  },
  toon(color, opts = {}) { return this.mat(color, opts); },
  flat(color, opts = {}) { const k = 'f' + color + JSON.stringify(opts); if (!this.mats[k]) this.mats[k] = new THREE.MeshBasicMaterial(Object.assign({ color }, opts)); return this.mats[k]; },
  get olMat() { return this._ol || (this._ol = new THREE.MeshBasicMaterial({ color: 0x241a2e, side: THREE.BackSide })); },
  trainCar(len = 12, { body = 0xffffff, stripe = 0xff8a2a, stripe2 = 0x2fb8d6, loco = false, tail = false, label = '' } = {}) {
    const g = new THREE.Group();
    // badan membulat + atap
    g.add(this.box(len, 2.5, 2.8, body, 0, 2.15, 0, { r: .55 }));
    g.add(this.box(len - .8, .55, 2.3, 0xe9eff6, 0, 3.42, 0, { r: .26 }));
    g.add(this.box(len - .3, .34, 2.86, stripe, 0, 1.56, 0, { r: .15 }));
    g.add(this.box(len - .3, .16, 2.86, stripe2, 0, 1.28, 0, { r: .07 }));
    // rok bawah & bogie
    g.add(this.box(len - 1.4, .5, 2.4, 0x6f7fa3, 0, .98, 0, { r: .2 }));
    const wheelGeo = this._wg || (this._wg = new THREE.CylinderGeometry(.42, .42, .25, 16)), hubGeo = this._hg || (this._hg = new THREE.CylinderGeometry(.18, .18, .27, 12));
    [-len / 2 + 1.8, -len / 2 + 3, len / 2 - 3, len / 2 - 1.8].forEach(x => [-1.15, 1.15].forEach(z => {
      const w = this.mesh(wheelGeo, 0x3e4a6b); w.rotation.x = Math.PI / 2; w.position.set(x, .62, z); g.add(w);
      const h = this.mesh(hubGeo, 0xffc94d); h.rotation.x = Math.PI / 2; h.position.set(x, .62, z); g.add(h);
    }));
    // jendela bulat-bulat dengan kilau
    const winStart = loco ? -len / 2 + 1.4 : -len / 2 + 1.6, winEnd = loco ? len / 2 - 3.2 : len / 2 - 1.6;
    for (let x = winStart; x <= winEnd; x += 1.55) {
      g.add(this.box(1.05, .78, 2.88, 0x5aa9f0, x, 2.6, 0, { r: .3 }));
      g.add(this.box(.3, .18, 2.9, 0xe9f7ff, x - .22, 2.82, 0, { r: .08 }));
    }
    // pintu
    [loco ? null : -len / 2 + .75, len / 2 - .75].forEach(x => { if (x == null) return; g.add(this.box(.7, 1.7, 2.87, 0xffd36b, x, 2.05, 0, { r: .22 })); });
    if (loco) {
      // hidung lokomotif membulat + kaca depan + lampu
      const nose = this.ball(1, body, len / 2 - .2, 2.05, 0, 1.25, 1.2, 1.4); g.add(nose);
      const ns = this.ball(1, stripe, len / 2 - .15, 1.5, 0, 1.18, .34, 1.43); g.add(ns);
      const ws = this.box(.25, .95, 2.1, 0x3b78c9, len / 2 + .62, 2.62, 0, { r: .12 }); ws.rotation.z = -.45; g.add(ws);
      g.add(this.box(.12, .22, .6, 0xe9f7ff, len / 2 + .72, 2.85, -.4, { r: .05 }));
      [-.75, .75].forEach(z => { g.add(this.ball(.16, 0xfff6c2, len / 2 + .95, 1.82, z, 1, 1, 1, { emissive: 0xffe680 })); });
      g.add(this.box(.4, .26, 1.6, 0xff6f5e, len / 2 + 1.05, 1.05, 0, { r: .12 }));
    }
    if (tail) [-.75, .75].forEach(z => g.add(this.ball(.13, 0xff5a64, -len / 2 - .05, 1.7, z, 1, 1, 1, { emissive: 0xaa2030 })));
    if (label) { const s = this.sign(label, 2.6, .55, { w: 512, h: 108, font: '700 64px "Fredoka", sans-serif' }); s.position.set(0, 3.25, 1.47); g.add(s); }
    return g;
  },
  train(cars = 4, opts = {}) {
    const g = new THREE.Group(); const L = 12, gap = .6;
    for (let i = 0; i < cars; i++) {
      const c = this.trainCar(L, Object.assign({}, opts, { loco: i === 0, tail: i === cars - 1, label: i === 0 ? '' : (opts.labels ? opts.labels[i - 1] : '') }));
      c.position.x = -i * (L + gap); g.add(c);
      if (i) g.add(this.box(.9, 2, 2, 0x55607a, -i * (L + gap) + L / 2 + gap / 2, 2.2, 0, { r: .2 }));
    }
    g.userData.length = cars * (L + gap);
    return g;
  },
  rails(len, z = 0, x0 = 0) {
    const g = new THREE.Group();
    g.add(this.box(len, .14, .14, 0xb8c2cf, x0, .22, z - .72, { r: 0 }), this.box(len, .14, .14, 0xb8c2cf, x0, .22, z + .72, { r: 0 }));
    const n = Math.floor(len / .9);
    const sl = new THREE.InstancedMesh(this.rgeo(.32, .14, 2.1, .06), this.mat(0x5b4a3c), n);
    const m4 = new THREE.Matrix4();
    for (let i = 0; i < n; i++) { m4.makeTranslation(x0 - len / 2 + i * .9 + .45, .1, z); sl.setMatrixAt(i, m4); }
    sl.receiveShadow = true; g.add(sl);
    g.add(this.box(len, .06, 2.9, 0x6d6a66, x0, .02, z));
    return g;
  },
  // pohon bulat yang meliuk dan bergoyang
  tree(x, z, s = 1, c = null) {
    const g = new THREE.Group();
    const bend = rand(-.45, .45), lean = rand(-.25, .25);
    const p0 = new THREE.Vector3(0, 0, 0), p1 = new THREE.Vector3(bend * .35 * s, 1 * s, lean * .3 * s), p2 = new THREE.Vector3(bend * s * .7, 1.9 * s, lean * .5 * s);
    const bark = 0xb5774a;
    g.add(this.limb(p0, p1, .24 * s, .18 * s, bark), this.limb(p1, p2, .18 * s, .13 * s, bark), this.ball(.19 * s, bark, p1.x, p1.y, p1.z));
    g.add(this.ball(.34 * s, bark, 0, .02, 0, 1, .35, 1));
    if (chance(.6)) { const br = new THREE.Vector3(p1.x + (bend > 0 ? -.6 : .6) * s, 1.55 * s, p1.z); g.add(this.limb(p1, br, .1 * s, .06 * s, bark)); }
    const canopy = new THREE.Group(); canopy.position.copy(p2);
    const greens = c ? [c] : pick([[0x7fd35b, 0x63c25a, 0x98e06a], [0x5cc06a, 0x77d07a, 0x4fb362], [0xa6dd5c, 0x86cf54, 0xc0e86e]]);
    const n = LITE ? 3 : randi(4, 6);
    for (let i = 0; i < n; i++) {
      const a = i / n * Math.PI * 2, rr = i === 0 ? 0 : .75 * s;
      const r = (i === 0 ? 1.15 : rand(.7, .95)) * s;
      canopy.add(this.ball(r, greens[i % greens.length], Math.cos(a) * rr, (i === 0 ? .55 : rand(-.05, .45)) * s, Math.sin(a) * rr));
    }
    if (chance(.35)) for (let i = 0; i < 4; i++) { const a = rand(0, 6.28); canopy.add(this.ball(.13 * s, pick([0xff7a8a, 0xffd65a, 0xff9f43]), Math.cos(a) * 1.1 * s, rand(.1, .9) * s, Math.sin(a) * 1.1 * s)); }
    g.add(canopy); this.sway(canopy, .05, rand(.8, 1.4));
    g.position.set(x, 0, z); return g;
  },
  _leaf: null,
  leafGeo() {
    if (this._leaf) return this._leaf;
    const L = 2.2, geo = new THREE.PlaneGeometry(L, .7, 10, 2); geo.rotateX(-Math.PI / 2); geo.translate(L / 2, 0, 0);
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), t = x / L; p.setZ(i, p.getZ(i) * (Math.sin(Math.PI * Math.min(1, t * 1.05)) * .95 + .05)); p.setY(i, -.55 * t * t * L + Math.abs(p.getZ(i)) * .25); }
    geo.computeVertexNormals();
    return (this._leaf = geo);
  },
  palm(x, z, s = 1) {
    const g = new THREE.Group();
    const bend = rand(.3, .8) * (chance(.5) ? 1 : -1);
    let prev = new THREE.Vector3(0, 0, 0); const segs = 6, H = 3.4 * s;
    for (let i = 1; i <= segs; i++) {
      const t = i / segs, p = new THREE.Vector3(Math.sin(t * 1.4) * bend * s, t * H, 0);
      g.add(this.limb(prev, p, (.2 - t * .07) * s, (.19 - t * .07) * s, i % 2 ? 0xc48a55 : 0xb07a48)); prev = p;
    }
    const top = new THREE.Group(); top.position.copy(prev); g.add(top);
    for (let i = 0; i < 3; i++) top.add(this.ball(.16 * s, 0x8a5a32, Math.cos(i * 2.1) * .2 * s, -.15 * s, Math.sin(i * 2.1) * .2 * s));
    const lm = this.mat(0x6cc95a, { side: THREE.DoubleSide }), lm2 = this.mat(0x52b84f, { side: THREE.DoubleSide });
    for (let i = 0, nl = LITE ? 6 : 8; i < nl; i++) { const l = new THREE.Mesh(this.leafGeo(), i % 2 ? lm : lm2); l.castShadow = true; l.scale.setScalar(s * rand(.85, 1.1)); l.rotation.y = i / (LITE ? 6 : 8) * Math.PI * 2 + rand(-.2, .2); l.rotation.z = rand(.05, .3); top.add(l); }
    this.sway(top, .07, rand(.9, 1.5));
    g.position.set(x, 0, z); return g;
  },
  bush(x, z, s = 1) {
    const g = new THREE.Group(); const c = pick([0x6cc76a, 0x85d36a, 0x5cbf74]);
    [[0, .4, 0, .6], [.5, .3, .1, .45], [-.45, .3, -.05, .45]].forEach(([a, b, d, r]) => g.add(this.ball(r * s, c, a * s, b * s, d * s)));
    if (chance(.6)) for (let i = 0; i < 4; i++) g.add(this.ball(.09 * s, pick([0xff7a8a, 0xffd65a, 0xffffff, 0xc58cff]), rand(-.6, .6) * s, rand(.45, .8) * s, rand(-.3, .4) * s));
    g.position.set(x, 0, z); return g;
  },
  bench(x, z, rot = 0, wood = true) {
    const g = new THREE.Group(); const c = wood ? 0xe0954f : 0x5fb2ff;
    g.add(this.box(1.7, .14, .5, c, 0, .48, 0), this.box(1.7, .5, .12, c, 0, .78, -.22), this.box(.12, .48, .42, 0x5f86c4, -.7, .24, 0), this.box(.12, .48, .42, 0x5f86c4, .7, .24, 0));
    g.position.set(x, 0, z); g.rotation.y = rot; return g;
  },
  lamp(x, z, h = 3.4) {
    const g = new THREE.Group();
    g.add(this.cyl(.07, .1, h, 0x5f86c4, 0, h / 2, 0), this.ball(.2, 0x5f86c4, 0, .05, 0, 1.4, .4, 1.4), this.ball(.26, 0xfff3c4, 0, h + .1, 0, 1, .85, 1, { emissive: 0xffe08a }), this.cyl(.32, .2, .14, 0x5f86c4, 0, h + .32, 0));
    g.position.set(x, 0, z); return g;
  },
  lights(scene, { sky = 0xdff2ff, ground = 0xd9eab0, sun = 0xfff3dc, intensity = 1, shadowSize = 30 } = {}) {
    const hemi = new THREE.HemisphereLight(sky, ground, .46 * intensity); scene.add(hemi);
    const d = new THREE.DirectionalLight(sun, .6 * intensity); d.position.set(14, 26, 12); d.castShadow = true;
    d.shadow.mapSize.set(LITE ? 512 : 1024, LITE ? 512 : 1024); const s = shadowSize; Object.assign(d.shadow.camera, { left: -s, right: s, top: s, bottom: -s, near: 1, far: 90 });
    d.shadow.bias = -0.0008; scene.add(d);
    return { hemi, sun: d };
  },
};

/* ---------- Title scene: peron dengan kereta datang/pergi ---------- */
function makeTitleScene() {
  const scene = new THREE.Scene();
  MK.sky(scene, { fog: [60, 200] });
  const camera = new THREE.PerspectiveCamera(42, 1, .1, 400);
  MK.lights(scene, { intensity: 1.05 });
  const ground = MK.box(260, .2, 160, 0x3b5a3a, 0, -.1, 0); ground.castShadow = false; scene.add(ground);
  scene.add(MK.rails(260, 0)); scene.add(MK.rails(260, -5.5));
  const peron = MK.box(70, .9, 6, 0xb8b4aa, 0, .45, 6, { r: .3 }); scene.add(peron);
  scene.add(MK.box(70, .03, .3, 0xf5c518, 0, .92, 3.5));
  for (let i = -30; i <= 30; i += 7.5) { scene.add(MK.cyl(.16, .2, 4.2, 0x2b3542, i, 3, 7.5)); }
  scene.add(MK.box(68, .35, 5, 0x24456e, 0, 5.2, 6.6, { r: .17 }));
  scene.add(MK.box(68.4, .12, .4, 0xffd36b, 0, 5.05, 4.2, { r: .06 }));
  for (let i = -26; i <= 26; i += 10) scene.add(MK.bench(i + 3, 7.8, Math.PI));
  const s2 = MK.sign('NUSANTARA', 7, 1.4, { w: 640, h: 128 }); s2.position.set(-6, 3.2, 8.78); scene.add(s2);
  [[-6 - 3, 8.8], [-6 + 3, 8.8]].forEach(([x, z]) => scene.add(MK.cyl(.1, .1, 3, 0x3a4c66, x, 1.4, z)));
  for (let i = -30; i <= 30; i += 15) scene.add(MK.bush(i + 7, 9.2, 1));
  const bld = MK.box(30, 6, 8, 0xe9e1cf, 4, 3, -15, { r: .5 }); scene.add(bld);
  for (let x = -8; x <= 16; x += 4) scene.add(MK.box(2, 2.6, .3, 0x5aa9f0, x, 3.2, -10.95, { r: .3 }));
  const roof = MK.mesh(new THREE.CylinderGeometry(0, 6.2, 3, 4), 0x9b3b2c); roof.scale.set(3.2, 1, 1.05); roof.rotation.y = Math.PI / 4; roof.position.set(4, 7.5, -15); scene.add(roof);
  for (let i = 0; i < 34; i++) { const x = rand(-120, 120), z = rand(-50, -22); scene.add(Math.random() < .4 ? MK.palm(x, z, rand(1, 1.5)) : MK.tree(x, z, rand(1.1, 1.9))); }
  for (let i = 0; i < 14; i++) { const x = rand(-120, 120), z = rand(24, 50); scene.add(chance(.7) ? MK.tree(x, z, rand(1, 1.6)) : MK.bush(x, z, 1.5)); }
  MK.hills(scene, 9, -95, 320); MK.clouds(scene, 12);
  const people = [];
  for (let i = 0; i < 9; i++) { const p = MK.person({ shirt: pick([0xe25d4f, 0x3f8fd8, 0xf2c14e, 0x6bbf72, 0xffffff, 0x8e5bd6]), hijab: chance(.35) ? pick([0xeeeeee, 0x2b3a67, 0xc9566e]) : null }); p.position.set(rand(-25, 25), .9, rand(5, 8)); p.rotation.y = Math.PI + rand(-.6, .6); scene.add(p); people.push(p); }
  const tr = MK.train(5, { labels: ['EKS-1', 'EKS-2', 'BIS-1', 'MAKAN'] }); tr.position.set(-160, 0, 0); tr.rotation.y = 0; scene.add(tr);
  const tr2 = MK.train(6, { body: 0xffffff, stripe: 0x3a8ef6, stripe2: 0xff8a2a }); tr2.position.set(200, 0, -5.5); tr2.rotation.y = Math.PI; scene.add(tr2);
  let t = 0, phase = 0, wait = 0;
  return {
    scene, camera,
    update(dt) {
      t += dt;
      camera.position.set(Math.sin(t * .05) * 30 + 6, 13 + Math.sin(t * .1) * 2, 34);
      camera.lookAt(0, 2, 0);
      if (phase === 0) { tr.position.x += Math.max(2, (20 - tr.position.x) * .5) * dt * (tr.position.x > 0 ? .6 : 1); if (tr.position.x > 18) { phase = 1; wait = 6; } }
      else if (phase === 1) { wait -= dt; if (wait < 0) phase = 2; }
      else { tr.position.x += Math.min(30, (tr.position.x - 16) * .6 + 1) * dt; if (tr.position.x > 220) { tr.position.x = -160; phase = 0; } }
      tr2.position.x -= 22 * dt; if (tr2.position.x < -240) tr2.position.x = 240;
      people.forEach(p => p.userData.walk(dt, false));
    },
  };
}
