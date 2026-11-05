/* ================= LEVEL 1 · OB / CLEANING SERVICE (Bab 2) ================= */
const L1_TOOLS = {
  sapu: { name: 'Sapu & plastik', ic: '🧹', key: '1' },
  wiper: { name: 'Wiper air', ic: '🪣', key: '2' },
  lap: { name: 'Lap + cairan', ic: '🧽', key: '3' },
  tisu: { name: 'Tisu', ic: '🧻', key: '4' },
  rambu: { name: 'Rambu lantai basah', ic: '⚠️', key: '5' },
  tangan: { name: 'Tangan', ic: '✋', key: '6' },
};
const L1_DIRT = {
  sampah: { label: 'Sampah berserakan', tool: 'sapu', t: 1.0, w: 3, color: 0xf28a1e },
  air: { label: 'Genangan air', tool: 'wiper', t: 1.4, w: 5, color: 0x4aa3ff },
  noda: { label: 'Noda lantai', tool: 'lap', t: 1.8, w: 4, color: 0x8a5a2b },
  toilet: { label: 'Toilet stasiun kotor', tool: 'lap', t: 3.0, w: 10, color: 0xb36bff },
  tisu: { label: 'Tisu toilet habis', tool: 'tisu', t: 1.0, w: 6, color: 0xffffff },
  // turnaround gerbong
  kantong: { label: 'Sampah di kantong kursi', tool: 'tangan', t: .8, color: 0xf28a1e },
  lorong: { label: 'Lorong gerbong kotor', tool: 'sapu', t: 1.1, color: 0xc49a6c },
  tumpah: { label: 'Tumpahan minuman', tool: 'wiper', t: 1.3, color: 0x4aa3ff },
  toiletk: { label: 'Toilet kereta kotor', tool: 'lap', t: 2.6, color: 0xb36bff },
  tisuk: { label: 'Tisu toilet kereta habis', tool: 'tisu', t: .8, color: 0xffffff },
  sandaran: { label: 'Sandaran kursi belum rapi', tool: 'tangan', t: .6, color: 0x2fbf71 },
};
const L1_STOCK = [
  { id: 'apd', name: 'APD: sarung tangan & masker', max: 1, unit: '', toggle: true },
  { id: 'sapu', name: 'Sapu', max: 1, unit: '', toggle: true },
  { id: 'wiper', name: 'Pendorong air (wiper)', max: 1, unit: '', toggle: true },
  { id: 'cairan', name: 'Cairan pembersih lantai', max: 5, unit: 'L', step: 1 },
  { id: 'kain', name: 'Kain mikrofiber', max: 8, unit: 'pcs', step: 2 },
  { id: 'plastik', name: 'Plastik sampah', max: 12, unit: 'pcs', step: 3 },
  { id: 'tisu', name: 'Tisu toilet', max: 8, unit: 'roll', step: 2 },
];

const L1 = {
  id: 1,
  brief: {
    intro: 'Shift pagi dimulai pukul 05.00. Anda bertanggung jawab atas kebersihan hall, peron, dan toilet, lalu menyiapkan gerbong kereta dalam waktu turnaround yang terbatas.',
    sop: [
      '<b>Persiapan alat:</b> ambil troli di Ruang Janitor. Kenakan APD, lalu isi penuh cairan pembersih, kain mikrofiber, plastik sampah, tisu, serta pastikan sapu dan wiper ada di troli.',
      '<b>Siklus kebersihan (05.00–09.00):</b> sapu sampah di hall/peron, keringkan genangan air sebelum penumpang terpeleset, bersihkan noda, toilet, dan ganti tisu.',
      '<b>Keselamatan:</b> pasang rambu lantai basah pada genangan bila belum sempat dikeringkan. Penumpang yang terpeleset dicatat sebagai insiden.',
      '<b>Stok habis?</b> Klik Ruang Janitor (pojok kiri depan) untuk mengisi ulang. Perjalanan bolak-balik memakan waktu.',
      '<b>Poin kinerja & rekan OB:</b> setiap kotoran yang Anda bersihkan memberi poin ⭐ (bonus +1 jika dibersihkan dalam 8 detik). Saat kereta datang dan stasiun makin padat, tukar poin untuk memanggil hingga 3 rekan OB (25/40/55 ⭐) yang membersihkan otomatis dan ikut membantu turnaround.',
      '<b>Turnaround gerbong:</b> 12 menit (waktu permainan) untuk mengambil sampah kantong kursi, menyapu lorong, mengeringkan tumpahan, membersihkan toilet kereta, mengisi tisu, dan merapikan sandaran kursi.',
    ],
    controls: ['Pilih alat dengan tombol di bawah atau angka 1–6.', 'Klik/ketuk kotoran untuk berjalan ke sana dan membersihkannya. Alat yang salah dihitung sebagai kesalahan.', 'Tombol <b>Panggil rekan OB</b> (atau tombol H) menukar poin ⭐ dengan rekan kerja.', 'Klik lantai untuk berjalan. Roda mouse atau tombol ＋/－ untuk zoom kamera. Esc untuk jeda.'],
    kpi: [['Persiapan alat', '10%'], ['Kebersihan area (target ≥ 90%)', '30%'], ['Keselamatan (0 penumpang terpeleset)', '20%'], ['Turnaround gerbong selesai', '25%'], ['Kontribusi pribadi (≥ 35% pekerjaan tim)', '10%'], ['Ketepatan alat', '5%']],
  },
  start() {
    Game.setCanvas('gl');
    this.stats = { prepTime: 0, prepScore: 0, cleanSum: 0, cleanN: 0, slips: 0, wrong: 0, cleaned: 0, turnDone: 0, turnTotal: 0, turnLeft: 0, restocks: 0, coinsEarned: 0, helperCleaned: 0, helpersCalled: 0 };
    this.coins = 0; this.helpers = []; this.hintT = 8;
    this.stock = { apd: 0, sapu: chance(.5) ? 1 : 0, wiper: chance(.5) ? 1 : 0, cairan: randi(1, 2), kain: randi(2, 4), plastik: randi(3, 6), tisu: randi(1, 4) };
    this.kainUse = 0; this.tool = 'sapu'; this.rambuLeft = 3;
    this.buildStation();
    this.phase = 'prep'; this.prepT = 0;
    this.prepUI();
    this._click = e => this.onClick(e);
    $('#gl').addEventListener('pointerdown', this._click);
    this.zoom = .72; this._wheel = e => { e.preventDefault(); this.setZoom(this.zoom + e.deltaY * .0008); };
    $('#gl').addEventListener('wheel', this._wheel, { passive: false });
  },
  cleanup() {
    $('#gl').removeEventListener('pointerdown', this._click);
    $('#gl').removeEventListener('wheel', this._wheel);
    this.v = null;
  },
  /* ---------- scene ---------- */
  buildStation() {
    const scene = new THREE.Scene(); MK.sky(scene, { fog: [60, 160] });
    const camera = new THREE.PerspectiveCamera(40, 1, .1, 200);
    MK.lights(scene, { intensity: 1.1, shadowSize: 26 });
    // hall floor (tiles)
    const tileC = document.createElement('canvas'); tileC.width = tileC.height = 128; const g = tileC.getContext('2d');
    g.fillStyle = '#fbf0dc'; g.fillRect(0, 0, 128, 128); g.strokeStyle = '#ead6b2'; g.lineWidth = 3; g.strokeRect(0, 0, 64, 64); g.strokeRect(64, 64, 64, 64); g.strokeRect(64, 0, 64, 64); g.strokeRect(0, 64, 64, 64);
    const tt = new THREE.CanvasTexture(tileC); tt.wrapS = tt.wrapT = THREE.RepeatWrapping; tt.repeat.set(18, 5);
    const hall = new THREE.Mesh(new THREE.BoxGeometry(38, .4, 11), new THREE.MeshToonMaterial({ map: tt, gradientMap: MK.grad() })); hall.position.set(0, -.2, 6.5); hall.receiveShadow = true; scene.add(hall);
    const peron = MK.box(38, .4, 9.2, 0x9a958a, 0, -.2, -3.6); peron.castShadow = false; scene.add(peron);
    scene.add(MK.box(38, .02, .35, 0xf5c518, 0, .01, -7.4));
    scene.add(MK.box(38, .02, .12, 0xffffff, 0, .011, -7.1));
    const trench = MK.box(40, .4, 6, 0x4b4a46, 0, -1.4, -11.2); trench.castShadow = false; scene.add(trench);
    [[18.5, 53], [-31, 33]].forEach(([z, d]) => { const grass = MK.box(140, .2, d, 0x93d66e, 0, -.45, z); grass.castShadow = false; scene.add(grass); }); scene.add(MK.box(140, .2, 2, 0x93d66e, 0, -.45, -7.6));
    for (let i = 0; i < 16; i++) { const sd = i % 2 ? 1 : -1, x = sd * rand(21, 34), z = rand(-14, 16); scene.add(chance(.35) ? MK.palm(x, z, rand(1, 1.4)) : chance(.6) ? MK.tree(x, z, rand(1.1, 1.6)) : MK.bush(x, z, 1.4)); }
    for (let i = 0; i < 10; i++) scene.add(MK.tree(rand(-30, 30), rand(16, 26), rand(1, 1.5)));
    MK.clouds(scene, 8, { y: [16, 24], z: [-60, -30], x: [-60, 60] });
    const rails = MK.rails(60, -10.9); rails.position.y = -1.2; scene.add(rails);
    // back wall/greenery behind tracks
    scene.add(MK.box(60, 3, .5, 0x2e4e3a, 0, .2, -14.5));
    for (let i = -24; i <= 24; i += 4) scene.add(MK.tree(i + rand(-1, 1), -16, rand(1.1, 1.6)));
    // gate line between hall & peron
    for (const [x0, x1] of [[-19, -10], [-6.5, -1.5], [1.5, 6.5], [10, 19]]) scene.add(MK.box(x1 - x0, .9, .2, 0x5f7896, (x0 + x1) / 2, .45, 1));
    for (const x of [-8.25, 0, 8.25]) { scene.add(MK.box(.25, 1.1, .6, 0x2b3542, x - 1.5, .55, 1)); scene.add(MK.box(.25, 1.1, .6, 0x2b3542, x + 1.5, .55, 1)); }
    // canopy pillars & roof on peron
    for (let x = -16; x <= 16; x += 8) scene.add(MK.cyl(.18, .18, 4.4, 0x2b3542, x, 2.2, -4.6, 6));
    const canopy = MK.box(38, .18, 5.4, 0x24456e, 0, 4.5, -4.4); canopy.material = MK.mat(0x24456e, { transparent: true, opacity: .35 }); canopy.castShadow = false; scene.add(canopy);
    // benches
    for (let x = -12; x <= 12; x += 6) { scene.add(MK.bench(x + 3, -2.6, Math.PI)); scene.add(MK.bench(x, 5.2, 0, false)); }
    // station name sign
    const s = MK.sign('NUSANTARA', 5, 1, { w: 640, h: 128, sub: null }); s.position.set(-4, 2.6, -5.8); scene.add(s);
    scene.add(MK.cyl(.06, .06, 2.4, 0x3a4c66, -6.2, 1.2, -5.8, 5), MK.cyl(.06, .06, 2.4, 0x3a4c66, -1.8, 1.2, -5.8, 5));
    const el = MK.sign('+7 m', 1.2, .4, { w: 256, h: 84, font: '700 54px "JetBrains Mono", monospace' }); el.position.set(-4, 1.85, -5.79); scene.add(el);
    // loket
    const lok = new THREE.Group(); lok.add(MK.box(6, 3, 2.4, 0xe9e1cf, 0, 1.5, 0), MK.box(5, 1, .1, 0x22303f, 0, 1.9, 1.21), MK.box(6.6, .4, 3, 0xff8a6a, 0, 3.1, 0));
    const ls = MK.sign('LOKET', 2.6, .6, { w: 384, h: 96 }); ls.position.set(0, 2.7, 1.22); lok.add(ls); const lr = MK.sign('LOKET', 3.2, .8, { w: 384, h: 96 }); lr.rotation.x = -Math.PI / 2; lr.position.set(0, 3.34, 0); lok.add(lr); lok.position.set(-8, 0, 10.6); scene.add(lok);
    // toilet block
    const wc = new THREE.Group(); wc.add(MK.box(6, 3, 3.4, 0xd7e3ea, 0, 1.5, 0), MK.box(1.2, 2.2, .1, 0x45617e, -1.4, 1.1, -1.71), MK.box(1.2, 2.2, .1, 0x45617e, 1.4, 1.1, -1.71));
    const ws = MK.sign('TOILET', 2.4, .55, { w: 384, h: 90 }); ws.position.set(0, 2.6, -1.72); ws.rotation.y = Math.PI; wc.add(ws); const wr = MK.sign('TOILET', 3.2, .8, { w: 384, h: 96 }); wr.rotation.x = -Math.PI / 2; wr.position.set(0, 3.02, 0); wc.add(wr); wc.position.set(14.5, 0, 9.6); scene.add(wc);
    // janitor room
    const jr = new THREE.Group(); jr.add(MK.box(4, 2.3, 3, 0xc9d2c6, 0, 1.15, 0), MK.box(1.3, 1.8, .14, 0xf28a1e, .8, .9, -1.51));
    const js = MK.sign('RUANG JANITOR', 2.6, .5, { w: 512, h: 96, font: '700 54px "Fredoka", sans-serif' }); js.position.set(-.3, 2.45, -1.52); js.rotation.y = Math.PI; jr.add(js);
    const jrr = MK.sign('JANITOR', 3.2, .8, { w: 384, h: 96 }); jrr.rotation.x = -Math.PI / 2; jrr.position.set(0, 2.82, 0); jr.add(jrr); jr.position.set(-16.5, 0, 9.6); scene.add(jr);
    const jHit = new THREE.Mesh(new THREE.BoxGeometry(5, 3, 4.5), new THREE.MeshBasicMaterial({ visible: false })); jHit.position.set(-16.5, 1.5, 9); scene.add(jHit);
    this.jPos = new THREE.Vector3(-15.4, 0, 6.6); this.jHit = jHit;
    // plants & bins
    [[-18, 3], [18, 3], [-18, -1], [18, -1]].forEach(([x, z]) => { scene.add(MK.cyl(.45, .34, .6, 0xe08a52, x, .3, z)); const p = MK.bush(x, z, .9); p.position.y = .5; scene.add(p); });
    for (const [x, z] of [[-3, 3], [10, -1.5], [-10, -1.5]]) scene.add(MK.cyl(.25, .22, .7, 0x2fbf71, x, .35, z, 8));
    scene.add(MK.lamp(-14, 2), MK.lamp(14, 2), MK.lamp(-6, -6.6), MK.lamp(6, -6.6));
    // ground plane for clicks
    const gp = new THREE.Mesh(new THREE.PlaneGeometry(40, 20), new THREE.MeshBasicMaterial({ visible: false })); gp.rotation.x = -Math.PI / 2; gp.position.set(0, 0, 2); scene.add(gp); this.groundMesh = gp;
    // player + trolley
    const pl = MK.person({ shirt: 0x2a5fa8, pants: 0x1d2733, skin: 0xb07a4f, hat: 0x2a5fa8, vest: 0xf28a1e, scale: 1.3 });
    pl.position.copy(this.jPos); scene.add(pl);
    const tro = new THREE.Group(); tro.add(MK.box(.9, .7, .6, 0xf5c518, 0, .55, 0), MK.box(.3, .4, .3, 0x4aa3ff, -.2, 1.05, 0), MK.box(.3, .3, .3, 0x2fbf71, .2, 1, 0), MK.cyl(.08, .08, .9, 0x333, .5, .9, 0, 5));
    tro.position.copy(this.jPos).add(new THREE.Vector3(1, 0, 0)); scene.add(tro);
    // train
    const tr = MK.train(4, { labels: ['EKS-1', 'EKS-2', 'EKS-3'] }); tr.position.set(-90, -1.2, -10.9); scene.add(tr);
    this.v = {
      scene, camera,
      onResize: (w, h) => this.fitCam(w / h),
    };
    this.player = pl; this.trolley = tro; this.train = tr; this.trainState = { phase: 'away', t: 12 };
    this.dirts = []; this.npcs = []; this.target = null; this.action = null;
    this.camFocus = new THREE.Vector3(-14, 0, 8); this.camDist = 14;
    GL.use(this.v);
  },
  fitCam(aspect) {
    this.aspect = aspect;
  },
  updateCam(dt) {
    const cam = this.v.camera, a = this.aspect || 1.6;
    let fx = this.camFocus.x, fz = this.camFocus.z, dist = this.camDist;
    const z = this.zoom, follow = clamp((1 - z) / .45, 0, 1), px = this.player.position;
    if (this.phase === 'clean' || this.phase === 'done1') {
      dist = (a < 1.1 ? 34 : clamp(22 / (Math.tan(20 * Math.PI / 180) * a) * .62, 36, 64)) * z;
      fz = lerp(1.5, clamp(px.z, -4, 6), follow); fx = a < 1.1 ? clamp(px.x, -12, 12) : lerp(0, clamp(px.x, -10, 10), follow);
    }
    if (this.phase === 'turn') {
      dist = (a < 1.1 ? 20 : clamp(13 / (Math.tan(20 * Math.PI / 180) * a) * .6, 14, 40)) * Math.max(.92, z);
      fx = a < 1.1 ? clamp(px.x, -7, 7) : lerp(0, clamp(px.x, -5, 5), follow); fz = 0;
    }
    const tgt = new THREE.Vector3(fx, 0, fz);
    this._camT = this._camT || tgt.clone(); this._camT.lerp(tgt, 1 - Math.exp(-dt * 4));
    this._camD = lerp(this._camD || dist, dist, 1 - Math.exp(-dt * 3));
    cam.position.set(this._camT.x, this._camD * .7, this._camT.z + this._camD * .72);
    cam.lookAt(this._camT.x, 0, this._camT.z - 1);
  },
  /* ---------- HUD ---------- */
  toolbar(list) {
    return `<div class="bottombar" id="tools">${list.map(k => {
      const t = L1_TOOLS[k];
      return `<button class="tool ${this.tool === k ? 'on' : ''}" data-tool="${k}"><span class="ic">${t.ic}</span>${t.name}<span class="k">[${t.key}]</span><span class="st" id="st-${k}"></span></button>`;
    }).join('')}</div>`;
  },
  bindTools() { $$('[data-tool]').forEach(b => b.onclick = () => this.setTool(b.dataset.tool)); this.refreshStock(); },
  setTool(k) {
    if (!$(`[data-tool="${k}"]`)) return;
    this.tool = k; Sfx.click();
    $$('[data-tool]').forEach(b => b.classList.toggle('on', b.dataset.tool === k));
  },
  setZoom(z) { this.zoom = clamp(z, .5, 1); },
  key(e) { if (e.key === 'h' || e.key === 'H') return this.callHelper(); if (e.key === '+' || e.key === '=') return this.setZoom(this.zoom - .1); if (e.key === '-') return this.setZoom(this.zoom + .1); const k = Object.keys(L1_TOOLS).find(k => L1_TOOLS[k].key === e.key); if (k) this.setTool(k); },
  refreshStock() {
    const s = this.stock, set = (k, v) => { const e = $('#st-' + k); if (e) e.textContent = v; };
    set('sapu', s.sapu ? `plastik ${Math.ceil(s.plastik)}` : 'tidak dibawa');
    set('wiper', s.wiper ? 'siap' : 'tidak dibawa');
    set('lap', `${s.cairan.toFixed(1)} L · kain ${s.kain}`);
    set('tisu', `${s.tisu} roll`);
    set('rambu', `${this.rambuLeft} tersisa`);
    set('tangan', s.apd ? 'APD ✓' : 'tanpa APD');
  },
  hudTop(extra) {
    return `<div class="topbar"><span class="chip title">Level 1 · OB</span>${extra}<span class="spacer"></span><button class="btn sm" onclick="Levels[1].setZoom(Levels[1].zoom - .12)" aria-label="Perbesar">＋</button><button class="btn sm" onclick="Levels[1].setZoom(Levels[1].zoom + .12)" aria-label="Perkecil">－</button><button class="btn sm" id="b-pause">Jeda</button></div>`;
  },
  /* ---------- phase 1: persiapan ---------- */
  prepUI() {
    this.camFocus.set(-21, 0, 6); this.camDist = 17;
    const rows = L1_STOCK.map(it => {
      const v = this.stock[it.id];
      return `<div class="staff" style="grid-template-columns:1fr 110px auto">
        <div><b>${it.name}</b><div class="muted mono" style="font-size:12px" id="pv-${it.id}">${it.toggle ? (v ? 'Siap di troli' : (it.id === 'apd' ? 'Belum dipakai' : 'Tidak ada di troli')) : `${v} / ${it.max} ${it.unit}`}</div></div>
        <div class="bar"><i id="pb-${it.id}" style="width:${v / it.max * 100}%;background:${v >= it.max ? 'var(--go)' : 'var(--warn)'}"></i></div>
        <button class="btn sm" data-fill="${it.id}">${it.toggle ? (it.id === 'apd' ? 'Kenakan' : 'Ambil dari rak') : 'Isi'}</button></div>`;
    }).join('');
    UI.setHud(this.hudTop(`<span class="chip">Persiapan alat · Shift pagi</span><span class="chip">Waktu <b id="prep-t">0 dtk</b></span>`) +
      `<div class="panel prep">
        <div class="prep-scroll">
          <div class="eyebrow">Ruang Janitor</div><h3 class="disp" style="margin:4px 0 6px">Cek troli kebersihan</h3>
          <p class="muted prep-help" style="font-size:13px">Isi semua bahan sampai penuh. Persiapan cepat dan lengkap menambah nilai; stok yang kurang membuat Anda harus kembali ke sini saat bertugas.</p>
          <div class="prep-rows">${rows}</div>
        </div>
        <div class="prep-foot"><span class="muted" id="prep-prog"></span><button class="btn primary" id="b-depart">Mulai bertugas</button></div></div>`);
    this.prepProg();
    $('#b-pause').onclick = () => Game.pauseMenu();
    $$('[data-fill]').forEach(b => b.onclick = () => {
      const it = L1_STOCK.find(x => x.id === b.dataset.fill);
      if (this.stock[it.id] >= it.max) { UI.toast(`${it.name} sudah penuh.`); return; }
      this.stock[it.id] = it.toggle ? 1 : Math.min(it.max, this.stock[it.id] + it.step);
      it.id === 'apd' ? Sfx.ok() : Sfx.sweep();
      const v = this.stock[it.id];
      $('#pv-' + it.id).textContent = it.toggle ? (it.id === 'apd' ? 'Sudah dipakai' : 'Siap di troli') : `${v} / ${it.max} ${it.unit}`;
      const bar = $('#pb-' + it.id); bar.style.width = (v / it.max * 100) + '%'; bar.style.background = v >= it.max ? 'var(--go)' : 'var(--warn)';
      this.prepProg();
    });
    $('#b-depart').onclick = () => this.beginClean();
  },
  prepProg() { const e = $('#prep-prog'); if (!e) return; const n = L1_STOCK.filter(it => this.stock[it.id] >= it.max).length; e.innerHTML = `<b class="mono">${n}/${L1_STOCK.length}</b> lengkap`; },
  prepCompleteness() { return L1_STOCK.reduce((a, it) => a + this.stock[it.id] / it.max, 0) / L1_STOCK.length; },
  beginClean() {
    const comp = this.prepCompleteness(), t = this.prepT;
    this.stats.prepTime = t;
    this.stats.prepScore = clamp(comp * 100 - Math.max(0, t - 25) * 1.2, 0, 100);
    if (!this.stock.apd) UI.toast('Anda bertugas tanpa APD. Supervisor mencatat pelanggaran K3.', 'warn', 3500);
    this.phase = 'clean'; this.time = 0; this.dur = 150; this.spawnT = 2; this.toiletT = 18; this.tisuT = 26; this.npcT = 1;
    // initial dirt
    for (let i = 0; i < 5; i++) this.spawnDirt(pick(['sampah', 'sampah', 'air', 'noda']));
    UI.setHud(this.hudTop(`<span class="chip">Jam <b id="h-clock">05:00</b></span><span class="chip">Kebersihan <span class="meter"><i id="h-cm"></i></span> <b id="h-clean">100%</b></span><span class="chip" id="h-slip-c">Terpeleset <b id="h-slip">0</b></span><span class="chip">Salah alat <b id="h-wrong">0</b></span><span class="chip good" id="h-crowd">Kepadatan <b>Sepi</b></span>${this.helperChip()}`) +
      this.toolbar(['sapu', 'wiper', 'lap', 'tisu', 'rambu']) + '<div id="floatlbl" class="chip" style="position:absolute;pointer-events:none;display:none"></div>');
    $('#b-pause').onclick = () => Game.pauseMenu();
    this.bindTools(); this.bindHelper();
    UI.toast('Shift dimulai. Jaga hall, peron, dan toilet tetap bersih sampai pukul 09.00.', 'good', 3500);
  },
  /* ---------- dirt ---------- */
  dirtPos(type) {
    if (type === 'toilet') return new THREE.Vector3(13.1, 0, 7.4);
    if (type === 'tisu') return new THREE.Vector3(15.9, 0, 7.4);
    for (let k = 0; k < 20; k++) {
      const p = chance(.5) ? new THREE.Vector3(rand(-17, 17), 0, rand(2.2, 8.4)) : new THREE.Vector3(rand(-17, 17), 0, rand(-6.6, -.4));
      if (p.distanceTo(this.jPos) < 3) continue;
      if (this.dirts.some(d => !d.done && d.pos.distanceTo(p) < 1.4)) continue;
      return p;
    }
    return new THREE.Vector3(rand(-10, 10), 0, rand(2.5, 8));
  },
  spawnDirt(type, pos) {
    const scene = this.v.scene;
    if ((type === 'toilet' || type === 'tisu') && this.dirts.some(d => d.type === type && !d.done)) return;
    pos = pos || this.dirtPos(type);
    const D = L1_DIRT[type], g = new THREE.Group();
    if (type === 'sampah') { for (let i = 0; i < 3; i++) { const m = MK.box(rand(.15, .3), rand(.06, .2), rand(.15, .3), pick([0xf2f2f2, 0xe25d4f, 0x3f8fd8, 0xf2c14e]), rand(-.3, .3), .06, rand(-.3, .3)); m.rotation.y = rand(0, 3); g.add(m); } }
    else if (type === 'air' || type === 'tumpah') { const m = new THREE.Mesh(new THREE.CircleGeometry(rand(.6, .9), 14), new THREE.MeshLambertMaterial({ color: 0x6fb8ff, transparent: true, opacity: .7 })); m.rotation.x = -Math.PI / 2; m.position.y = .02; m.scale.x = rand(.8, 1.4); g.add(m); }
    else if (type === 'noda' || type === 'lorong') { const m = new THREE.Mesh(new THREE.CircleGeometry(rand(.4, .6), 7), MK.mat(type === 'noda' ? 0x6b4a2b : 0x9a7a55)); m.rotation.x = -Math.PI / 2; m.position.y = .021; g.add(m); if (type === 'lorong') for (let i = 0; i < 4; i++) g.add(MK.box(.08, .04, .08, 0x5a4632, rand(-.4, .4), .03, rand(-.3, .3))); }
    const mk = MK.mesh(new THREE.ConeGeometry(.22, .45, 4), D.color, { emissive: D.color, emissiveIntensity: .35 }); mk.rotation.x = Math.PI; mk.position.y = 1.4; g.add(mk);
    const hr = ['kantong', 'sandaran'].includes(type) ? .3 : .9;
    const hit = new THREE.Mesh(new THREE.CylinderGeometry(hr, hr, 1.6, 8), new THREE.MeshBasicMaterial({ visible: false })); hit.position.y = .8; g.add(hit);
    g.position.copy(pos); scene.add(g);
    const d = { type, born: performance.now(), claim: null, pos: pos.clone(), g, mk, hit, done: false, sign: null, slipped: new Set(), progress: 0 };
    hit.userData.dirt = d;
    this.dirts.push(d);
    return d;
  },
  removeDirt(d) { d.done = true; this.v.scene.remove(d.g); if (d.sign) { this.v.scene.remove(d.sign); this.rambuLeft++; } },
  cleanliness() {
    const w = this.dirts.filter(d => !d.done).reduce((a, d) => a + (L1_DIRT[d.type].w || 0), 0);
    return clamp(100 - w * .8, 0, 100);
  },
  /* ---------- input ---------- */
  onClick(e) {
    if (Game.paused || UI.modalOpen || !this.v) return;
    if (this.phase !== 'clean' && this.phase !== 'turn') return;
    const hits = GL.pick(e, this.dirts.filter(d => !d.done).map(d => d.hit).concat(this.phase === 'clean' ? [this.jHit] : []));
    if (hits.length) {
      const o = hits[0].object;
      if (o === this.jHit) { this.goTo(this.jPos.clone(), { kind: 'restock' }); return; }
      const d = o.userData.dirt; this.tryClean(d); return;
    }
    const p = GL.ground(e, 0);
    if (p) {
      if (this.phase === 'turn') { p.z = 0; p.x = clamp(p.x, -9.4, 8.6); }
      else { p.x = clamp(p.x, -18, 18); p.z = clamp(p.z, -6.8, 9.5); }
      this.goTo(p, null);
    }
  },
  tryClean(d) {
    const D = L1_DIRT[d.type];
    if (this.tool === 'rambu') {
      if (d.type !== 'air') { this.wrongTool('Rambu lantai basah hanya untuk genangan air.'); return; }
      if (d.sign) { UI.toast('Rambu sudah terpasang di genangan ini.'); return; }
      if (this.rambuLeft <= 0) { UI.toast('Semua rambu sudah terpasang. Keringkan genangan untuk mengambilnya kembali.', 'warn'); return; }
      this.goTo(d.pos.clone(), { kind: 'sign', d }); return;
    }
    if (this.tool !== D.tool) { this.wrongTool(`${D.label}: gunakan ${L1_TOOLS[D.tool].name}.`); return; }
    const need = this.needStock(d.type);
    if (need) { UI.toast(need, 'warn', 3200); return; }
    const tp = d.pos.clone(); if (this.phase === 'turn') tp.z = 0;
    this.goTo(tp, { kind: 'clean', d });
  },
  wrongTool(msg) { this.stats.wrong++; Sfx.bad(); UI.toast('Alat salah. ' + msg, 'bad'); const w = $('#h-wrong'); if (w) w.textContent = this.stats.wrong; },
  needStock(type) {
    const s = this.stock;
    if (['sampah', 'lorong'].includes(type)) { if (!s.sapu) return 'Sapu tidak ada di troli. Ambil di Ruang Janitor.'; if (s.plastik < .5) return 'Plastik sampah habis. Isi ulang di Ruang Janitor.'; }
    if (['air', 'tumpah'].includes(type) && !s.wiper) return 'Wiper tidak ada di troli. Ambil di Ruang Janitor.';
    if (['noda', 'toilet', 'toiletk'].includes(type)) { if (s.cairan < .25) return 'Cairan pembersih habis. Isi ulang di Ruang Janitor.'; if (s.kain <= 0) return 'Kain mikrofiber bersih habis. Ambil di Ruang Janitor.'; }
    if (['tisu', 'tisuk'].includes(type) && s.tisu <= 0) return 'Tisu habis. Ambil di Ruang Janitor.';
    if (type === 'kantong' && s.plastik < .25) return 'Plastik sampah habis.';
    return null;
  },
  useStock(type) {
    const s = this.stock;
    if (['sampah', 'lorong'].includes(type)) s.plastik = Math.max(0, s.plastik - .5);
    if (type === 'kantong') s.plastik = Math.max(0, s.plastik - .25);
    if (['noda', 'toilet', 'toiletk'].includes(type)) { s.cairan = Math.max(0, s.cairan - (type === 'noda' ? .25 : .5)); this.kainUse++; if (this.kainUse >= 3) { this.kainUse = 0; s.kain--; } }
    if (['tisu', 'tisuk'].includes(type)) s.tisu--;
    this.refreshStock();
  },
  goTo(p, job) {
    if (this.action) { this.action = null; this.hideFloat(); }
    this.target = p; this.job = job;
  },
  /* ---------- update ---------- */
  update(dt) {
    if (!this.v) return;
    this.updateCam(dt);
    if (this.phase === 'prep') {
      this.prepT += dt; const e = $('#prep-t'); if (e) e.textContent = Math.floor(this.prepT) + ' dtk';
      this.player.userData.walk(dt, false); return;
    }
    if (this.phase === 'clean') this.updateClean(dt);
    if (this.phase === 'turn') this.updateTurn(dt);
    this.updatePlayer(dt);
    this.dirts.forEach(d => { if (!d.done) { d.mk.position.y = 1.4 + Math.sin(performance.now() / 300 + d.pos.x) * .12; d.mk.rotation.y += dt * 2; } });
  },
  updatePlayer(dt) {
    const pl = this.player;
    let moving = false;
    if (this.target) {
      const to = this.target.clone().sub(pl.position); to.y = 0;
      const dist = to.length(), stopAt = this.job && this.job.kind !== 'walk' ? .85 : .05;
      if (dist > stopAt) {
        const sp = 5.6 * dt; pl.position.add(to.normalize().multiplyScalar(Math.min(sp, dist - stopAt + .001)));
        pl.rotation.y = Math.atan2(to.x, to.z); moving = true;
      } else {
        const job = this.job; this.target = null; this.job = null;
        if (job) this.startJob(job);
      }
    }
    pl.userData.walk(dt, moving);
    // trolley follows
    if (this.phase === 'clean') {
      const back = new THREE.Vector3(Math.sin(pl.rotation.y), 0, Math.cos(pl.rotation.y)).multiplyScalar(-1.1).add(pl.position);
      this.trolley.position.lerp(back, 1 - Math.exp(-dt * 6)); this.trolley.rotation.y = pl.rotation.y;
    }
    if (this.action) {
      const a = this.action; a.t += dt;
      const f = clamp(a.t / a.dur, 0, 1);
      pl.userData.armR.rotation.x = Math.sin(a.t * 14) * .8 - .6;
      this.showFloat(pl.position, `${a.label} ${Math.round(f * 100)}%`);
      if (a.t >= a.dur) { this.action = null; this.hideFloat(); a.done(); }
    }
  },
  startJob(job) {
    if (job.kind === 'restock') {
      this.action = { t: 0, dur: 2.5, label: 'Mengisi ulang troli', done: () => {
        const sapuMiss = !this.stock.sapu, wiperMiss = !this.stock.wiper;
        L1_STOCK.forEach(it => this.stock[it.id] = it.max); this.kainUse = 0; this.stats.restocks++;
        this.refreshStock(); Sfx.ok(); UI.toast(`Troli terisi penuh${sapuMiss || wiperMiss ? ' (alat yang tertinggal sudah diambil)' : ''}.`, 'good');
      } };
      return;
    }
    if (job.kind === 'sign') {
      const d = job.d; if (d.done || d.sign) return;
      this.rambuLeft--; const s = new THREE.Group();
      const tri = MK.mesh(new THREE.ConeGeometry(.35, .9, 4), 0xf5c518); tri.position.y = .45; s.add(tri);
      s.position.copy(d.pos).add(new THREE.Vector3(.5, 0, .5)); this.v.scene.add(s); d.sign = s;
      Sfx.click(); this.refreshStock(); UI.toast('Rambu lantai basah terpasang. Penumpang akan berhati-hati.', 'good');
      return;
    }
    if (job.kind === 'clean') {
      const d = job.d; if (d.done) return;
      const D = L1_DIRT[d.type];
      const need = this.needStock(d.type); if (need) { UI.toast(need, 'warn'); return; }
      const apdSlow = this.stock.apd ? 1 : 1.15;
      this.action = { t: 0, dur: D.t * apdSlow, label: D.label.split(' ')[0] + '…', done: () => {
        if (d.done) return;
        this.useStock(d.type); this.stats.cleaned++; this.addCoins(this.coinFor(d), d.pos);
        if (d.type === 'sandaran') { d.seat && (d.seat.rotation.x = 0); d.done = true; this.v.scene.remove(d.g); }
        else this.removeDirt(d);
        Sfx.sweep(); Sfx.ok();
        if (this.phase === 'turn') this.turnProgress();
      } };
      Sfx.sweep();
    }
  },
  showFloat(pos, txt) {
    const el = $('#floatlbl'); if (!el) return;
    const v = pos.clone(); v.y = 2.4; v.project(this.v.camera);
    const r = $('#gl').getBoundingClientRect();
    el.style.display = 'inline-flex'; el.textContent = txt;
    el.style.left = ((v.x + 1) / 2 * r.width - el.offsetWidth / 2) + 'px'; el.style.top = ((1 - v.y) / 2 * r.height - 30) + 'px';
  },
  hideFloat() { const el = $('#floatlbl'); if (el) el.style.display = 'none'; },
  /* ---------- poin kinerja & rekan OB ---------- */
  coinFor(d) {
    const base = { sampah: 2, noda: 3, air: 4, toilet: 6, tisu: 3, kantong: 1, lorong: 2, tumpah: 3, toiletk: 5, tisuk: 2, sandaran: 1 }[d.type] || 1;
    return base + ((performance.now() - d.born) / 1000 < 8 ? 1 : 0);
  },
  addCoins(n, at) {
    this.coins += n; this.stats.coinsEarned += n; Sfx.cash();
    this.coinPop('+' + n + ' ⭐', at);
    this.refreshHelperUI();
  },
  coinPop(txt, at) {
    const hud = $('#hud'); if (!hud || !this.v) return;
    const v = at.clone(); v.y = 3; v.project(this.v.camera);
    const r = $('#gl').getBoundingClientRect();
    const el = document.createElement('div'); el.className = 'coinpop'; el.textContent = txt;
    el.style.left = ((v.x + 1) / 2 * r.width) + 'px'; el.style.top = ((1 - v.y) / 2 * r.height) + 'px';
    hud.appendChild(el); setTimeout(() => el.remove(), 1100);
  },
  helperCost() { return [25, 40, 55][this.helpers.length] || Infinity; },
  helperChip() {
    return `<span class="chip coin">⭐ <b id="h-coin">${this.coins}</b></span><button class="btn sm go" id="b-helper">Panggil rekan OB</button><span class="chip" id="h-helpers">Rekan ${this.helpers.length}/3</span>`;
  },
  bindHelper() { const b = $('#b-helper'); if (b) b.onclick = () => this.callHelper(); this.refreshHelperUI(); },
  refreshHelperUI() {
    const c = $('#h-coin'); if (c) { c.textContent = this.coins; c.parentElement.classList.remove('bump'); void c.parentElement.offsetWidth; c.parentElement.classList.add('bump'); }
    const b = $('#b-helper'), cost = this.helperCost();
    if (b) { b.disabled = !(this.coins >= cost); b.innerHTML = this.helpers.length >= 3 ? 'Tim lengkap' : `Panggil rekan OB · ${cost} ⭐`; }
    const h = $('#h-helpers'); if (h) h.innerHTML = `Rekan <b>${this.helpers.length}/3</b>`;
  },
  callHelper() {
    if (!(this.phase === 'clean' || this.phase === 'turn')) return;
    const cost = this.helperCost();
    if (this.helpers.length >= 3) { UI.toast('Tim sudah lengkap: 3 rekan OB membantu Anda.'); return; }
    if (this.coins < cost) { UI.toast(`Poin belum cukup. Butuh ${cost} ⭐, Anda punya ${this.coins} ⭐. Bersihkan kotoran untuk menambah poin.`, 'warn', 3500); return; }
    this.coins -= cost; this.stats.helpersCalled++;
    const name = ['Pak Joko', 'Mbak Sari', 'Mas Dedi'][this.helpers.length];
    const g = MK.person({ shirt: 0x2a5fa8, pants: 0x1d2733, skin: pick([0xc68c5a, 0xa8713f, 0xe0b48a]), hat: 0x2fc3c6, vest: 0x7ad957, scale: this.phase === 'turn' ? 1.02 : 1.25 });
    const start = this.phase === 'turn' ? new THREE.Vector3(-9.6, 0, 0) : this.jPos.clone();
    g.position.copy(start); this.v.scene.add(g);
    this.helpers.push({ g, name, job: null, t: 0, speed: 4.2 });
    Sfx.promo(); UI.toast(`${name} bergabung sebagai rekan OB. Ia akan membersihkan otomatis, mendahulukan genangan air.`, 'good', 3800);
    this.refreshHelperUI();
  },
  updateHelpers(dt) {
    const PRIO = { air: 2.6, tumpah: 2, toilet: 1.7, toiletk: 1.5, tisu: 1.4, tisuk: 1.3, noda: 1.1, lorong: 1.1, sampah: 1, kantong: 1, sandaran: 1 };
    for (const h of this.helpers) {
      const g = h.g; let moving = false;
      if (h.job && h.job.done) { h.job = null; h.t = 0; }
      if (!h.job) {
        let best = null, bs = Infinity;
        for (const d of this.dirts) {
          if (d.done || (d.claim && d.claim !== h)) continue;
          const tp = this.phase === 'turn' ? new THREE.Vector3(d.pos.x, 0, 0) : d.pos;
          const sc = tp.distanceTo(g.position) / (PRIO[d.type] || 1);
          if (sc < bs) { bs = sc; best = d; }
        }
        if (best) { h.job = best; best.claim = h; h.t = 0; }
      }
      if (h.job) {
        const d = h.job, tp = this.phase === 'turn' ? new THREE.Vector3(d.pos.x, 0, 0) : d.pos.clone();
        const to = tp.sub(g.position); to.y = 0; const dist = to.length();
        if (dist > .85) { g.position.add(to.normalize().multiplyScalar(Math.min(h.speed * dt, dist - .84))); g.rotation.y = Math.atan2(to.x, to.z); moving = true; }
        else {
          h.t += dt; g.userData.armR.rotation.x = Math.sin(h.t * 12) * .8 - .6;
          if (h.t >= (L1_DIRT[d.type].t || 1) * 1.3) {
            if (!d.done) {
              this.stats.helperCleaned++;
              if (d.type === 'sandaran') { d.seat && (d.seat.rotation.x = 0); d.done = true; this.v.scene.remove(d.g); } else this.removeDirt(d);
              if (this.phase === 'turn') this.turnProgress();
            }
            h.job = null; d.claim = null; h.t = 0;
          }
        }
      }
      g.userData.walk(dt, moving);
    }
  },
  crowdLevel() { const n = this.npcs.length; return n >= 18 ? 2 : n >= 10 ? 1 : 0; },
  updateCrowdUI(dt) {
    const lv = this.crowdLevel(), el = $('#h-crowd');
    if (el) { el.className = 'chip ' + ['good', 'warn', 'bad'][lv]; el.innerHTML = `Kepadatan <b>${['Sepi', 'Ramai', 'Padat'][lv]}</b> · ${this.npcs.length} org`; }
    this.hintT = (this.hintT || 0) - dt;
    if (lv === 2 && this.helpers.length < 3 && this.hintT <= 0) {
      this.hintT = 25;
      const cost = this.helperCost();
      UI.toast(this.coins >= cost ? `Stasiun padat! Tukar ${cost} ⭐ untuk memanggil rekan OB.` : `Stasiun padat! Kumpulkan ${cost - this.coins} ⭐ lagi untuk memanggil rekan OB.`, 'warn', 3800);
    }
  },
  /* ---------- clean phase sim ---------- */
  updateClean(dt) {
    this.time += dt;
    const gm = 300 + this.time / this.dur * 240;
    const ck = $('#h-clock'); if (ck) ck.textContent = clock(gm);
    // spawn dirt (rush hours 06:30–08:00 lebih padat)
    const rush = gm > 390 && gm < 480 ? .65 : 1;
    this.spawnT -= dt; if (this.spawnT <= 0) { this.spawnT = rand(4.2, 6.2) * rush; if (this.dirts.filter(d => !d.done).length < 18) this.spawnDirt(pick(['sampah', 'sampah', 'sampah', 'air', 'air', 'noda', 'noda'])); }
    this.toiletT -= dt; if (this.toiletT <= 0) { this.toiletT = rand(22, 32); this.spawnDirt('toilet'); UI.toast('Laporan: toilet stasiun kotor.', 'warn'); }
    this.tisuT -= dt; if (this.tisuT <= 0) { this.tisuT = rand(26, 36); this.spawnDirt('tisu'); UI.toast('Laporan: tisu toilet habis.', 'warn'); }
    this.updateTrain(dt); this.updateNpcs(dt); this.updateHelpers(dt); this.updateCrowdUI(dt);
    // metrics
    const c = this.cleanliness(); this.stats.cleanSum += c * dt; this.stats.cleanN += dt;
    const cl = $('#h-clean'); if (cl) { cl.textContent = pct(c); const m = $('#h-cm'); m.style.width = c + '%'; m.style.background = c >= 90 ? 'var(--go)' : c >= 70 ? 'var(--warn)' : 'var(--stop)'; }
    if (this.time >= this.dur) this.endClean();
  },
  updateTrain(dt) {
    const tr = this.train, st = this.trainState;
    st.t -= dt;
    if (st.phase === 'away' && st.t <= 0) { st.phase = 'arrive'; tr.position.x = -95; Sfx.chime(); UI.toast('Kereta akan tiba di jalur 1. Perhatikan penumpang di peron.'); }
    if (st.phase === 'arrive') { const tx = 22; tr.position.x += Math.max(1.5, (tx - tr.position.x) * .9) * dt; if (tr.position.x >= tx - .05) { st.phase = 'dwell'; st.t = 9; this.trainArrived(); } }
    if (st.phase === 'dwell' && st.t <= 0) { st.phase = 'leave'; Sfx.horn(); this.npcs.forEach(n => { if (n.state === 'wait') { n.state = 'board'; n.target = new THREE.Vector3(n.g.position.x, 0, -7.6); } }); }
    if (st.phase === 'leave') { tr.position.x += Math.min(28, (tr.position.x - 21) * .7 + 1) * dt; if (tr.position.x > 110) { st.phase = 'away'; st.t = rand(24, 32); } }
  },
  trainArrived() {
    const prog = this.time / this.dur, gm = 300 + prog * 240, rush = gm > 390 && gm < 480;
    const n = Math.min(LITE ? 10 : 14, randi(4, 6) + Math.floor(prog * 5) + (rush ? 3 : 0));
    if (n >= 9) UI.toast(`Kereta penuh: ${n} penumpang turun sekaligus. Sampah di peron akan bertambah.`, 'warn', 3200);
    for (let i = 0; i < n; i++) this.addNpc('out', new THREE.Vector3(rand(-14, 14), 0, -7));
    // penumpang turun meninggalkan sampah
    for (let i = 0; i < 1 + Math.floor(n / 5); i++) this.spawnDirt('sampah', new THREE.Vector3(rand(-15, 15), 0, rand(-6.4, -4)));
  },
  addNpc(kind, pos) {
    const g = MK.person({ shirt: pick([0xe25d4f, 0x3f8fd8, 0xf2c14e, 0x6bbf72, 0xffffff, 0x8e5bd6, 0x333c4a]), pants: pick([0x1d2733, 0x3b3b3b, 0x4a5a7a]), skin: pick([0xc68c5a, 0xa8713f, 0xe0b48a, 0x8d5a34]), hijab: chance(.35) ? pick([0xeeeeee, 0x2b3a67, 0xc9566e, 0x6b4a2b]) : null, scale: 1.2 });
    g.position.copy(pos); this.v.scene.add(g);
    const gate = pick([-8.25, 0, 8.25]);
    const n = { g, kind, state: 'walk', fallen: 0, path: [], speed: rand(1.6, 2.3), trashT: rand(4, 14) };
    if (kind === 'in') n.path = [new THREE.Vector3(gate + rand(-.8, .8), 0, 1.4), new THREE.Vector3(gate + rand(-.8, .8), 0, .4), new THREE.Vector3(rand(-15, 15), 0, rand(-6.2, -1.8))];
    else n.path = [new THREE.Vector3(pos.x, 0, -3), new THREE.Vector3(gate + rand(-.8, .8), 0, .4), new THREE.Vector3(gate + rand(-.8, .8), 0, 1.6), new THREE.Vector3(rand(-6, 6), 0, 12.5)];
    this.npcs.push(n);
  },
  updateNpcs(dt) {
    this.npcT -= dt;
    if (this.npcT <= 0) { const gm = 300 + this.time / this.dur * 240; this.npcT = rand(2.2, 4) * (gm > 390 && gm < 480 ? .55 : 1); if (this.npcs.length < (LITE ? 24 : 30)) this.addNpc('in', new THREE.Vector3(rand(-6, 6), 0, 12.5)); }
    for (const n of this.npcs) {
      if (n.fallen > 0) { n.fallen -= dt; n.g.rotation.x = -Math.PI / 2 * clamp(n.fallen, 0, 1) * (n.fallen > 1.5 ? 1 : n.fallen / 1.5); n.g.position.y = .15; if (n.fallen <= 0) { n.g.rotation.x = 0; n.g.position.y = 0; } continue; }
      let tgt = n.state === 'board' ? n.target : n.path[0];
      if (!tgt) { if (n.kind === 'in') { n.state = 'wait'; n.g.userData.walk(dt, false); n.g.rotation.y = Math.PI; } else n.dead = true; continue; }
      const to = tgt.clone().sub(n.g.position); to.y = 0; const d = to.length();
      if (d < .15) { if (n.state === 'board') { n.dead = true; continue; } n.path.shift(); continue; }
      n.g.position.add(to.normalize().multiplyScalar(Math.min(d, n.speed * dt))); n.g.rotation.y = Math.atan2(to.x, to.z); n.g.userData.walk(dt, true);
      n.trashT -= dt; if (n.trashT <= 0 && chance(.2)) { n.trashT = 99; const p = n.g.position.clone(); if (p.z > -6.8 && p.z < 9.5 && Math.abs(p.z - 1) > .8) this.spawnDirt('sampah', p); }
      // slip check
      for (const dd of this.dirts) {
        if (dd.done || dd.type !== 'air' || dd.sign || dd.slipped.has(n)) continue;
        if (dd.pos.distanceTo(n.g.position) < .75) {
          dd.slipped.add(n);
          if (chance(.55)) { n.fallen = 2.6; this.stats.slips++; Sfx.bad(); UI.toast('Penumpang terpeleset di genangan air! Insiden dicatat.', 'bad', 3200); const s = $('#h-slip'); if (s) { s.textContent = this.stats.slips; $('#h-slip-c').className = 'chip bad'; } }
        }
      }
    }
    this.npcs = this.npcs.filter(n => { if (n.dead) { this.v.scene.remove(n.g); return false; } return true; });
  },
  endClean() {
    this.phase = 'done1'; this.target = null; this.action = null; this.hideFloat();
    const avg = this.stats.cleanSum / Math.max(1, this.stats.cleanN);
    Game.level.modalPause = true;
    UI.modal({ title: 'Pukul 09.00 · Siklus kebersihan selesai', html: `<p>Rata-rata kebersihan area: <b class="mono">${pct(avg)}</b> (target ≥ 90%). Penumpang terpeleset: <b class="mono">${this.stats.slips}</b>.</p><p class="muted" style="margin-top:8px">KA Nusantara Ekspres masuk dipo untuk turnaround. Anda punya 12 menit sebelum kereta diberangkatkan kembali.</p>`, buttons: [{ label: 'Masuk ke gerbong', cls: 'primary', onClick: () => { Game.level.modalPause = false; this.beginTurn(); } }] });
  },
  /* ---------- phase 3: turnaround gerbong ---------- */
  beginTurn() {
    const scene = new THREE.Scene(); MK.sky(scene, { fog: null });
    const depot = MK.box(90, .2, 50, 0xb9cbe3, 0, -.4, 0); depot.castShadow = false; scene.add(depot);
    [-3.2, 3.2].forEach(z => scene.add(MK.box(70, .03, .25, 0xf5c518, 0, -.29, z, { r: 0 })));
    const camera = new THREE.PerspectiveCamera(40, 1, .1, 120);
    MK.lights(scene, { intensity: 1.15, shadowSize: 14 });
    scene.add(MK.box(21, .2, 3.6, 0x5a6470, 0, -.1, 0));
    scene.add(MK.box(21, .02, .9, 0x2c3a52, -.5, .01, 0));
    scene.add(MK.box(21, 1.2, .12, 0xe8ecef, 0, .6, -1.85), MK.box(21, .25, .14, 0xf28a1e, 0, 1.15, -1.86));
    scene.add(MK.box(.12, 1.6, 3.6, 0xe8ecef, -10.5, .8, 0), MK.box(.12, 1.6, 3.6, 0xe8ecef, 10.5, .8, 0));
    // toilet
    const wc = new THREE.Group(); wc.add(MK.box(1.6, 1.6, 1.4, 0xd7e3ea, 0, .8, -1.1), MK.box(.12, 1.6, 1.4, 0x9fb3c6, -.8, .8, -1.1));
    const ws = MK.sign('TOILET', 1.2, .3, { w: 256, h: 64, font: '700 42px "Fredoka", sans-serif' }); ws.rotation.x = -Math.PI / 2; ws.position.set(0, 1.62, -1.1); wc.add(ws); wc.position.set(9.6, 0, 0); scene.add(wc);
    const gp = new THREE.Mesh(new THREE.PlaneGeometry(24, 8), new THREE.MeshBasicMaterial({ visible: false })); gp.rotation.x = -Math.PI / 2; scene.add(gp);
    this.seats = [];
    for (let r = 0; r < 12; r++) {
      const x = -9.4 + r * 1.45;
      for (const z of [-1.3, -.72, .72, 1.3]) {
        const s = new THREE.Group(); s.add(MK.box(.5, .12, .5, 0x1f3d7a, 0, .45, 0));
        const back = new THREE.Group(); back.add(MK.box(.12, .7, .5, 0x1f3d7a, 0, .35, 0), MK.box(.06, .16, .5, 0xf3f5f2, -.02, .62, 0)); back.position.set(-.25, .5, 0); s.add(back);
        s.add(MK.box(.12, .4, .12, 0x333, 0, .2, 0)); s.position.set(x, 0, z); scene.add(s);
        this.seats.push({ s, back, x, z });
      }
    }
    this.v.scene.remove(this.player); scene.add(this.player);
    this.helpers.forEach((h, i) => { this.v.scene.remove(h.g); scene.add(h.g); h.g.position.set(-9.2 + i * .7, 0, 0); h.g.scale.setScalar(1); h.job = null; });
    this.player.position.set(-10, 0, 0); this.player.rotation.y = Math.PI / 2; this.player.scale.setScalar(1.02);
    this.v = { scene, camera, onResize: (w, h) => this.fitCam(w / h) };
    GL.use(this.v);
    this.dirts = []; this.npcs = []; this.phase = 'turn';
    const seatsSh = shuffle(this.seats.slice());
    const mk = (type, x, z) => this.spawnDirt(type, new THREE.Vector3(x, 0, z));
    seatsSh.slice(0, 8).forEach(s => { const d = mk('kantong', s.x, s.z); d.g.add(MK.box(.05, .12, .2, 0xffffff, -.33, .55, 0)); });
    seatsSh.slice(8, 14).forEach(s => { s.back.rotation.z = -.55; const d = mk('sandaran', s.x, s.z); d.seat = { rotation: { set x(v) { s.back.rotation.z = 0; } } }; });
    for (let i = 0; i < 5; i++) mk('lorong', -8.6 + i * 3.6 + rand(-.6, .6), 0);
    mk('tumpah', -4.2, 0); mk('tumpah', 4.9, 0);
    mk('toiletk', 9.6, -.6); mk('tisuk', 10.1, .4);
    this.stats.turnTotal = this.dirts.length; this.stats.turnDone = 0;
    this.phase = 'turn'; this.turnT = 90; this.tool = 'tangan';
    UI.setHud(this.hudTop(`<span class="chip">Turnaround gerbong EKS-1</span><span class="chip warn">Sisa waktu <b id="h-turn">12:00</b></span><span class="chip">Tugas <b id="h-task">0/${this.stats.turnTotal}</b></span>${this.helperChip()}`) +
      this.toolbar(['tangan', 'sapu', 'wiper', 'lap', 'tisu']) + '<div id="floatlbl" class="chip" style="position:absolute;pointer-events:none;display:none"></div>');
    $('#b-pause').onclick = () => Game.pauseMenu();
    this.bindTools(); this.bindHelper();
    UI.toast('Ambil sampah kantong kursi dan rapikan sandaran dengan Tangan. Sapu lorong, keringkan tumpahan, bersihkan toilet.', '', 5000);
  },
  turnProgress() {
    this.stats.turnDone = this.dirts.filter(d => d.done).length;
    const e = $('#h-task'); if (e) e.textContent = `${this.stats.turnDone}/${this.stats.turnTotal}`;
    if (this.stats.turnDone >= this.stats.turnTotal) { this.stats.turnLeft = this.turnT; UI.toast('Gerbong siap! Laporkan ke kondektur.', 'good'); setTimeout(() => Game.level === this && this.finish(), 900); this.phase = 'finished'; }
  },
  updateTurn(dt) {
    this.turnT -= dt; this.updateHelpers(dt);
    const e = $('#h-turn'); if (e) e.textContent = mmss(this.turnT * 8);
    if (this.turnT <= 0) { this.phase = 'finished'; this.stats.turnLeft = 0; UI.toast('Waktu turnaround habis. Kereta diberangkatkan.', 'warn'); setTimeout(() => Game.level === this && this.finish(), 900); }
  },
  finish() {
    const s = this.stats;
    const avg = s.cleanSum / Math.max(1, s.cleanN);
    const cleanScore = clamp((avg - 40) / 50 * 100, 0, 100);
    const safety = Math.max(0, 100 - s.slips * 35);
    const turn = clamp(s.turnDone / s.turnTotal * 100 + (s.turnDone === s.turnTotal ? s.turnLeft / 90 * 15 : 0), 0, 100);
    const tool = Math.max(0, 100 - s.wrong * 10);
    const prep = s.prepScore - (this.stock.apd ? 0 : 0);
    const team = s.cleaned + s.helperCleaned, share = team ? s.cleaned / team : 1;
    const contrib = clamp(share / .35 * 100, 0, 100);
    const total = prep * .10 + cleanScore * .30 + safety * .20 + turn * .25 + contrib * .10 + tool * .05;
    const notes = [];
    if (s.prepScore < 80) notes.push('Persiapan troli belum lengkap atau terlalu lama. Cek semua bahan sebelum shift.');
    if (avg < 90) notes.push(`Kebersihan rata-rata ${pct(avg)} masih di bawah target 90%. Prioritaskan genangan dan toilet karena bobotnya paling berat.`);
    if (s.slips) notes.push(`${s.slips} penumpang terpeleset. Pasang rambu lantai basah lebih dulu bila genangan jauh dari posisi Anda.`);
    if (s.turnDone < s.turnTotal) notes.push(`Turnaround hanya ${s.turnDone} dari ${s.turnTotal} tugas. Kelompokkan tugas per alat agar tidak sering berganti.`);
    if (s.wrong) notes.push(`${s.wrong} kali memakai alat yang salah.`);
    if (s.helpersCalled) notes.push(`Anda memanggil ${s.helpersCalled} rekan OB; tim membersihkan ${s.helperCleaned} kotoran, Anda sendiri ${s.cleaned}.${share < .35 ? ' Kontribusi pribadi di bawah 35%: tetap ikut bekerja, jangan hanya mengandalkan rekan.' : ''}`);
    else if (avg < 90) notes.push('Saat stasiun padat, tukarkan poin ⭐ untuk memanggil rekan OB agar kebersihan terkejar.');
    if (s.restocks) notes.push(`Kembali ke Ruang Janitor ${s.restocks} kali untuk isi ulang.`);
    Game.finish(1, {
      score: total, notes,
      rows: [
        ['Persiapan alat', 10, `${Math.round(s.prepTime)} dtk`, 'lengkap ≤ 25 dtk', prep],
        ['Kebersihan area (tim)', 30, pct(avg), '≥ 90%', cleanScore],
        ['Keselamatan penumpang', 20, `${s.slips} terpeleset`, '0 insiden', safety],
        ['Turnaround gerbong', 25, `${s.turnDone}/${s.turnTotal} tugas`, '100%', turn],
        ['Kontribusi pribadi', 10, `${Math.round(share * 100)}% · ${s.coinsEarned} ⭐`, '≥ 35%', contrib],
        ['Ketepatan alat', 5, `${s.wrong} salah`, '0', tool],
      ],
    });
  },
};
Levels[1] = L1;
