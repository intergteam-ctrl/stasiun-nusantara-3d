/* ================= LEVEL 5 · ISOMETRIC 3D STATION ================= */
function makeTycoonScene() {
  const scene = new THREE.Scene(); MK.sky(scene, { fog: null });
  const camera = new THREE.OrthographicCamera(-10, 10, 10, -10, -200, 400);
  const L = MK.lights(scene, { intensity: 1.05, shadowSize: 50 });
  const ground = MK.box(120, .4, 90, 0x5d9a4a, 0, -.2, 0); ground.castShadow = false; scene.add(ground);
  const road = MK.box(120, .05, 6, 0x3b4048, 0, .02, 19); road.castShadow = false; scene.add(road);
  for (let x = -56; x < 60; x += 6) scene.add(MK.box(2.4, .06, .25, 0xf3f5f2, x, .05, 19));
  for (let i = 0; i < 40; i++) { const x = rand(-58, 58), z = chance(.5) ? rand(-40, -26) : rand(24, 40); scene.add(chance(.5) ? MK.palm(x, z, rand(1, 1.6)) : MK.tree(x, z, rand(1.1, 1.9))); }
  // dekorasi taman di sekitar stasiun (di luar area bangunan semua tier)
  for (let i = 0; i < 14; i++) { const sd = i % 2 ? 1 : -1, x = sd * rand(31, 44), z = rand(-16, 16); scene.add(chance(.3) ? MK.palm(x, z, rand(1.1, 1.5)) : chance(.7) ? MK.tree(x, z, rand(1.2, 1.8)) : MK.bush(x, z, 1.6)); }
  for (let x = -40; x <= 40; x += rand(6, 9)) { scene.add(chance(.5) ? MK.bush(x, rand(23.5, 25.5), 1.3) : MK.tree(x, rand(24, 27), rand(1.1, 1.5))); }
  for (let x = -44; x <= 44; x += rand(7, 11)) scene.add(MK.tree(x, rand(-31, -27), rand(1.3, 2)));
  MK.clouds(scene, 10, { y: [26, 34], z: [-60, 20], x: [-90, 90] });
  const station = new THREE.Group(); scene.add(station);
  const dyn = new THREE.Group(); scene.add(dyn);
  // people (instanced)
  const MAXP = 140;
  const bodyGeo = new THREE.LatheGeometry([[0, 0], [.17, 0], [.22, .07], [.23, .26], [.18, .44], [.1, .52], [0, .54]].map(p => new THREE.Vector2(p[0], p[1])), 14);
  const ppl = new THREE.InstancedMesh(bodyGeo, MK.mat(0xffffff), MAXP);
  const heads = new THREE.InstancedMesh(new THREE.SphereGeometry(.2, 14, 10), MK.mat(0xffffff), MAXP);
  ppl.castShadow = true; heads.castShadow = true; scene.add(ppl, heads);
  const pcol = new THREE.Color();
  const agents = [];
  for (let i = 0; i < MAXP; i++) { pcol.setHex(pick([0xe25d4f, 0x3f8fd8, 0xf2c14e, 0x6bbf72, 0xffffff, 0x8e5bd6, 0x333c4a])); ppl.setColorAt(i, pcol); pcol.set(pick(['#e9c39b', '#d9a877', '#c68c5a', '#a8713f', '#8d5a34'])); heads.setColorAt(i, pcol); agents.push({ ph: rand(0, 6),  x: 0, z: 0, tx: 0, tz: 0, sp: rand(1.2, 2.2) }); }
  const water = new THREE.Mesh(new THREE.BoxGeometry(80, 1, 22), new THREE.MeshLambertMaterial({ color: 0x3a7bd5, transparent: true, opacity: .55 }));
  water.position.set(0, -1, -9); water.visible = false; scene.add(water);
  const trains = [];
  const m4 = new THREE.Matrix4();
  const v = {
    scene, camera, tier: 0, tracks: [], zones: [], size: 30, nPeople: 10, offset: { x: 0, y: 0 },
    onResize(w, h) {
      const wide = w > 900 || (h < 520 && w > 640), side = wide ? (w > 900 ? 390 : 330) : 0, bottom = wide ? 0 : h * .5;
      const W = w + side, H = h + bottom, a = W / H, hh = v.size / 2 * (a < 1 ? .62 / a : 1);
      camera.left = -hh * a; camera.right = hh * a; camera.top = hh; camera.bottom = -hh;
      camera.setViewOffset(W, H, side, bottom, w, h);
      camera.updateProjectionMatrix();
    },
    rebuild(S) {
      while (station.children.length) station.remove(station.children[0]);
      const T = S.tier, own = k => S.owned.includes(k);
      v.size = T === 1 ? 34 : T === 2 ? 44 : 60;
      camera.position.set(40, 40, 40); camera.lookAt(0, 0, -2);
      GL.resize();
      const nTr = T === 1 ? 1 : T === 2 ? 3 : 5;
      v.tracks = [];
      for (let i = 0; i < nTr; i++) { const z = -5 - i * 4.4; const r = MK.rails(90, z); station.add(r); v.tracks.push(z); }
      // platforms between tracks
      v.zones = [];
      const platLen = T === 1 ? 22 : T === 2 ? 36 : 52;
      const pz = [-2.6];
      for (let i = 0; i < nTr - 1; i += 2) pz.push(-5 - i * 4.4 - 2.2);
      pz.forEach((z, i) => { const p = MK.box(platLen, .7, i === 0 ? 2.2 : 2.6, 0xb8b4aa, 0, .35, z); station.add(p); station.add(MK.box(platLen, .02, .2, 0xf5c518, 0, .71, z + (i === 0 ? -.9 : 1.1))); v.zones.push({ x0: -platLen / 2 + 1, x1: platLen / 2 - 1, z0: z - .6, z1: z + .6, y: .7 }); });
      // building
      if (T === 1) {
        station.add(MK.box(10, 3.2, 5, 0xb58552, 0, 1.6, 2.6));
        const roof = MK.mesh(new THREE.ConeGeometry(7.6, 2.6, 4), 0xa33b2c); roof.rotation.y = Math.PI / 4; roof.scale.set(1, 1, .62); roof.position.set(0, 4.5, 2.6); station.add(roof);
        station.add(MK.box(1.6, 2, .1, 0x5a3a20, 0, 1, 5.12));
        for (let x = -6; x <= 6; x += 4) station.add(MK.bench(x, -2.2, Math.PI));
      } else if (T === 2) {
        station.add(MK.box(20, 5, 8, 0xeceae4, 0, 2.5, 3.2));
        const r1 = MK.box(21, .5, 4.6, 0x1f4f8a, 0, 5.7, 1.2); r1.rotation.x = .35; station.add(r1);
        const r2 = MK.box(21, .5, 4.6, 0x1f4f8a, 0, 5.7, 5.2); r2.rotation.x = -.35; station.add(r2);
        for (let x = -8; x <= 8; x += 2.6) station.add(MK.box(1.6, 2, .1, 0x2d4a6a, x, 2.4, 7.22));
      } else {
        const glass = MK.box(32, 9, 11, 0x8fc3e8, 0, 4.5, 4); glass.material = MK.mat(0x8fc3e8, { transparent: true, opacity: .9 }); station.add(glass);
        const arch = MK.mesh(new THREE.CylinderGeometry(6, 6, 34, 16, 1, false, 0, Math.PI), 0xdfe6ee); arch.rotation.z = Math.PI / 2; arch.rotation.x = Math.PI / 2; arch.scale.set(1, 1, .5); arch.position.set(0, 9, 4); station.add(arch);
        for (let x = -14; x <= 14; x += 4) station.add(MK.box(.3, 9, .3, 0x34495e, x, 4.5, 9.55));
      }
      const signW = T === 1 ? 6 : T === 2 ? 10 : 16, signY = T === 1 ? 2.8 : T === 2 ? 4.4 : 7.8, signZ = T === 1 ? 5.15 : T === 2 ? 7.25 : 9.6;
      const sg = MK.sign('NUSANTARA', signW, signW * .18, { w: 640, h: 116 }); sg.position.set(0, signY, signZ); station.add(sg);
      // plaza & parking lot
      const plaza = MK.box(T === 3 ? 40 : 26, .06, 7, 0xa59f92, 0, .03, T === 3 ? 13 : 11); plaza.castShadow = false; station.add(plaza);
      const lot = MK.box(14, .06, 9, 0x4a4f57, 22, .03, 9); lot.castShadow = false; station.add(lot);
      for (let i = 0; i < 6; i++) station.add(MK.box(.1, .07, 3, 0xf3f5f2, 16 + i * 2.4, .05, 9));
      // facilities
      if (own('gate')) for (let i = 0; i < 6; i++) { station.add(MK.box(.5, 1.1, .9, 0x7f8c99, -5 + i * 2, .55, T === 3 ? 10.4 : 8.4)); station.add(MK.box(.3, .1, .3, 0x2fbf71, -5 + i * 2, 1.15, T === 3 ? 10.4 : 8.4, { emissive: 0x2fbf71 })); }
      if (own('face')) [-7.4, 7.4].forEach(x => { station.add(MK.box(.6, 2.2, .6, 0x2b3542, x, 1.1, T === 3 ? 10.4 : 8.4)); station.add(MK.box(.5, .6, .05, 0x4aa3ff, x, 1.7, (T === 3 ? 10.4 : 8.4) + .32, { emissive: 0x4aa3ff, emissiveIntensity: .8 })); });
      if (own('canopy')) pz.forEach(z => { const c = MK.box(platLen, .2, 3, 0x38c6c9, 0, 3.6, z); c.material = MK.mat(0x38c6c9, { transparent: true, opacity: .8 }); station.add(c); for (let x = -platLen / 2 + 2; x < platLen / 2; x += 6) station.add(MK.cyl(.1, .1, 3.5, 0x2b3542, x, 1.9, z, 6)); });
      if (own('food')) [0xe25d4f, 0xf2c14e, 0x6bbf72, 0x3f8fd8].forEach((c, i) => { const x = -17 - (i % 2) * 3.4, z = 4 + Math.floor(i / 2) * 3.4; station.add(MK.box(2.6, 2, 2.4, 0xf3f5f2, x, 1, z)); station.add(MK.box(3, .3, 2.8, c, x, 2.15, z + .2)); });
      if (own('pos')) { station.add(MK.box(3, 2.2, 3, 0xffffff, 13, 1.1, 3.5)); station.add(MK.box(1.2, .35, .05, 0xe5484d, 13, 1.6, 5.03)); station.add(MK.box(.35, 1.2, .05, 0xe5484d, 13, 1.6, 5.04)); }
      if (own('vip')) { station.add(MK.box(7, 3.4, 5, 0x1e2a38, -22, 1.7, 3)); station.add(MK.box(7.2, .3, 5.2, 0xd4a83a, -22, 3.55, 3)); }
      if (own('sky')) { const sk = MK.box(3, 2.2, 26, 0xdfe6ee, -9, 7, -8); station.add(sk); for (const z of pz) station.add(MK.box(2, 6.4, 2, 0x9aa6b2, -9, 3.2, z)); }
      if (own('ctc')) { station.add(MK.box(3.4, 12, 3.4, 0xd7dde3, 21, 6, -1)); station.add(MK.box(3.6, 1.6, 3.6, 0x1b2b3d, 21, 10.4, -1)); }
      if (own('parkir')) for (let l = 0; l < 3; l++) { station.add(MK.box(13, .4, 9, 0x9aa3ad, 22, 1 + l * 2.6, 9)); for (let i = 0; i < 4; i++) station.add(MK.box(1.6, .8, 1, pick([0xe5484d, 0x3f8fd8, 0xffffff, 0x2b3542]), 17 + i * 3.3, 1.6 + l * 2.6, 8)); }
      if (S.tier < 3) station.add(MK.lamp(-12, 9), MK.lamp(12, 9));
      v.tier = T; v.S = S;
      agents.forEach(a => v.place(a, true));
    },
    place(a, init) {
      const zones = v.zones.concat([{ x0: -12, x1: 12, z0: 9, z1: 14, y: .06 }]);
      const z = pick(zones); a.tx = rand(z.x0, z.x1); a.tz = rand(z.z0, z.z1); a.y = z.y;
      if (init) { a.x = a.tx; a.z = a.tz; }
    },
    setPeople(n) { v.nPeople = clamp(Math.round(n), 4, MAXP); },
    crisis(k) { water.visible = k === 'banjir'; L.hemi.intensity = k === 'blackout' ? .16 : .48; L.sun.intensity = k === 'blackout' ? .22 : .63; v.cr = k; },
    update(dt) {
      // people
      for (let i = 0; i < MAXP; i++) {
        const a = agents[i];
        if (i >= v.nPeople) { m4.makeScale(0, 0, 0); ppl.setMatrixAt(i, m4); heads.setMatrixAt(i, m4); continue; }
        const dx = a.tx - a.x, dz = a.tz - a.z, d = Math.hypot(dx, dz);
        const mv = d >= .2;
        if (!mv) { if (chance(.01)) v.place(a); } else { a.x += dx / d * a.sp * dt; a.z += dz / d * a.sp * dt; }
        a.ph += dt * (mv ? 11 : 2.5);
        const hop = mv ? Math.abs(Math.sin(a.ph)) * .12 : 0, sq = mv ? 1 - Math.abs(Math.sin(a.ph)) * .05 : 1 + Math.sin(a.ph) * .02;
        const y0 = (a.y || .06) + hop;
        m4.makeScale(1.25, 1.25 * sq, 1.25); m4.setPosition(a.x, y0, a.z); ppl.setMatrixAt(i, m4);
        m4.makeScale(1.25, 1.25, 1.25); m4.setPosition(a.x, y0 + .86 * sq, a.z); heads.setMatrixAt(i, m4);
      }
      ppl.instanceMatrix.needsUpdate = true; heads.instanceMatrix.needsUpdate = true;
      // trains
      if (trains.length < Math.min(2, v.tracks.length) && chance(dt * .25)) {
        const z = pick(v.tracks); if (!trains.some(t => t.z === z)) {
          const g = MK.train(v.tier === 3 ? 6 : 4, { body: pick([0xf2f4f6, 0xe8ecef]), stripe: pick([0xf28a1e, 0x1f6fd1]) });
          const dir = chance(.5) ? 1 : -1; g.rotation.y = dir > 0 ? 0 : Math.PI; g.position.set(dir > 0 ? -90 : 90, 0, z); scene.add(g);
          trains.push({ g, z, dir, ph: 'in', w: 4 });
        }
      }
      for (const t of trains) {
        const x = t.g.position.x, stopX = t.dir * 20;
        if (t.ph === 'in') { const dist = (stopX - x) * t.dir; t.g.position.x += t.dir * Math.max(1.2, Math.min(24, dist * .8)) * dt; if (dist < .1) t.ph = 'dwell'; }
        else if (t.ph === 'dwell') { t.w -= dt; if (t.w < 0) t.ph = 'out'; }
        else { t.g.position.x += t.dir * Math.min(26, Math.abs(x - stopX) * .6 + 1) * dt; if (Math.abs(t.g.position.x) > 140) { scene.remove(t.g); t.dead = true; } }
      }
      for (let i = trains.length - 1; i >= 0; i--) if (trains[i].dead) trains.splice(i, 1);
      if (water.visible) water.position.y = lerp(water.position.y, .25, dt * .5); else water.position.y = -1;
    },
  };
  return v;
}
