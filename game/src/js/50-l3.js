/* ================= LEVEL 3 · KONDEKTUR & PTP ================= */
const L3_EVENTS = [
  { t: 'Penumpang sesak napas', d: 'Penumpang lansia di kursi 7C tampak pucat dan sesak napas. Keluarganya panik.', o: [
    ['Ambil kotak P3K, umumkan pencarian tenaga medis di kereta, dan minta stasiun berikutnya menyiapkan ambulans.', 1, 'Tepat. Pertolongan pertama berjalan dan ambulans siap saat kereta tiba.'],
    ['Beri minum dan minta penumpang beristirahat, nanti dicek lagi.', 0, 'Kondisi bisa memburuk. Kasus medis harus segera ditangani dan dikoordinasikan.'],
    ['Tarik rem bahaya untuk menghentikan kereta di tengah petak.', .3, 'Kereta berhenti di lokasi tanpa akses ambulans. Lebih baik koordinasi ke stasiun terdekat.']] },
  { t: 'AC gerbong mati', d: 'AC gerbong EKS-1 mati. Suhu naik dan beberapa penumpang mulai protes.', o: [
    ['Lapor teknisi kereta (TKA) untuk perbaikan, tawarkan kursi kosong di gerbong lain, dan catat komplain.', 1, 'Tepat. Teknisi menangani, penumpang yang tidak nyaman bisa pindah.'],
    ['Minta penumpang bersabar sampai tujuan.', 0, 'Komplain meningkat dan viral di media sosial.'],
    ['Buka pintu sambung antargerbong agar ada angin.', 0, 'Berbahaya dan melanggar prosedur keselamatan.']] },
  { t: 'Merokok di toilet', d: 'Alarm asap berbunyi. Seorang penumpang kedapatan merokok di toilet kereta.', o: [
    ['Tegur dengan sopan, ingatkan larangan merokok di kereta, dan koordinasikan dengan Polsuska untuk tindak lanjut sesuai aturan.', 1, 'Tepat. Aturan ditegakkan tanpa memicu keributan.'],
    ['Biarkan saja asal rokoknya sudah dimatikan.', 0, 'Pelanggaran tanpa tindak lanjut membahayakan keselamatan.'],
    ['Marahi di depan penumpang lain dan rampas rokoknya.', .3, 'Pelanggaran ditangani, tapi cara ini memicu konflik.']] },
  { t: 'Anak terpisah', d: 'Seorang anak sekitar 6 tahun menangis di bordes. Ia terpisah dari orang tuanya.', o: [
    ['Tenangkan anak, tetap bersamanya, dan umumkan melalui pengeras suara ke seluruh gerbong.', 1, 'Tepat. Orang tuanya ditemukan di gerbong makan.'],
    ['Titipkan ke penumpang terdekat sementara Anda patroli.', 0, 'Anak tidak boleh dititipkan ke orang asing.'],
    ['Bawa ke kabin kru dan tunggu sampai stasiun berikutnya.', .5, 'Anak aman, tapi orang tua tidak segera tahu.']] },
  { t: 'Sengketa kursi', d: 'Dua penumpang berdebat karena sama-sama mengklaim kursi 11A.', o: [
    ['Periksa kedua tiket secara objektif, arahkan yang keliru ke kursi yang benar dengan sopan.', 1, 'Tepat. Ternyata satu penumpang salah gerbong.'],
    ['Suruh yang datang belakangan mengalah.', 0, 'Tanpa cek tiket, keputusan bisa salah dan memicu komplain.'],
    ['Biarkan mereka menyelesaikan sendiri.', 0, 'Konflik membesar dan mengganggu penumpang lain.']] },
  { t: 'Barang tanpa pemilik', d: 'Ada tas mencurigakan tanpa pemilik di rak bagasi gerbong 2. Penumpang sekitar resah.', o: [
    ['Jangan sentuh atau buka. Umumkan pencarian pemilik; bila tak ada, amankan area dan lapor Polsuska serta Kepala Kereta.', 1, 'Tepat. Prosedur keamanan dijalankan.'],
    ['Buka tas untuk memeriksa isinya.', 0, 'Berisiko. Barang mencurigakan tidak boleh dibuka sendiri.'],
    ['Pindahkan tas ke bordes agar tidak mengganggu.', .2, 'Memindahkan barang mencurigakan tetap berisiko.']] },
  { t: 'Makanan restorasi basi', d: 'Penumpang komplain nasi goreng dari kereta makan terasa basi.', o: [
    ['Minta maaf, catat komplain, koordinasikan penggantian atau pengembalian uang dengan restorasi.', 1, 'Tepat. Komplain selesai di tempat.'],
    ['Bilang itu urusan restorasi, bukan kondektur.', 0, 'Penumpang merasa diabaikan.'],
    ['Beri makanan dari bekal kru.', .3, 'Niat baik, tapi tidak sesuai prosedur.']] },
  { t: 'Ibu hamil kontraksi', d: 'Penumpang hamil 8 bulan di kursi 3B merasakan kontraksi.', o: [
    ['Pindahkan ke tempat yang lebih lega, cari tenaga medis di kereta, dan minta stasiun berikutnya siaga ambulans.', 1, 'Tepat. Penumpang tertangani dan langsung dirujuk.'],
    ['Minta penumpang menahan sampai tujuan akhir.', 0, 'Sangat berisiko bagi ibu dan bayi.'],
    ['Telepon keluarga penumpang.', .2, 'Tidak menyelesaikan kondisi darurat.']] },
  { t: 'Penumpang mabuk', d: 'Penumpang di gerbong 3 berteriak dan mengganggu penumpang lain.', o: [
    ['Tenangkan dengan tegas tapi sopan, panggil Polsuska, dan pisahkan dari penumpang lain bila perlu.', 1, 'Tepat. Situasi terkendali.'],
    ['Abaikan, nanti juga diam sendiri.', 0, 'Penumpang lain merasa tidak aman.'],
    ['Turunkan paksa saat kereta melambat.', 0, 'Berbahaya dan melanggar prosedur.']] },
];
const L3_ITEMS = [
  { id: 'dompet', label: 'Dompet kulit coklat', det: n => `berisi KTP atas nama ${n}`, fake: 'dompet kulit hitam berisi kartu ATM' },
  { id: 'hp', label: 'Ponsel hitam casing biru', det: () => 'layar kunci bergambar kucing oranye', fake: 'ponsel putih casing bening' },
  { id: 'tas', label: 'Tas ransel abu-abu', det: () => 'ada gantungan kunci wayang', fake: 'tas ransel hitam bergambar logo kampus' },
  { id: 'laptop', label: 'Laptop dalam sleeve hijau', det: () => 'ada stiker bertuliskan "Kopi Senja"', fake: 'laptop dalam tas kulit coklat' },
  { id: 'payung', label: 'Payung lipat merah', det: () => 'gagangnya kayu', fake: 'payung panjang biru' },
];
const L3_STATIONS = [['Gambir', '08:00'], ['Cirebon', '10:55'], ['Purwokerto', '12:35'], ['Yogyakarta', '15:10']];

function makeJourneyScene() {
  const scene = new THREE.Scene(); MK.sky(scene, { fog: [70, 200] });
  const camera = new THREE.PerspectiveCamera(38, 1, .1, 400);
  MK.lights(scene, { intensity: 1.0, shadowSize: 40 });
  const ground = MK.box(400, .2, 200, 0x6aa84f, 0, -.1, 0); ground.castShadow = false; scene.add(ground);
  scene.add(MK.rails(400, 0));
  const world = new THREE.Group(); scene.add(world);
  const props = [];
  for (let i = 0; i < 70; i++) {
    const x = rand(-200, 200), z = chance(.5) ? rand(-60, -6) : rand(8, 40);
    const o = chance(.4) ? MK.palm(x, z, rand(1, 1.6)) : MK.tree(x, z, rand(1, 2));
    world.add(o); props.push(o);
  }
  // sawah petak
  for (let i = 0; i < 16; i++) { const s = MK.box(rand(14, 24), .05, rand(8, 14), pick([0x9cc95a, 0x7fb04a, 0xb8d36a, 0x5e9a3c]), rand(-200, 200), .03, rand(-40, -8)); s.castShadow = false; world.add(s); props.push(s); }
  // tiang listrik
  for (let x = -200; x < 200; x += 25) { const p = MK.cyl(.12, .12, 6, 0x6d6a66, x, 3, -3, 5); world.add(p); props.push(p); }
  MK.hills(scene, 10, -120, 420); MK.clouds(scene, 12, { y: [24, 38], z: [-110, -40] });
  const tr = MK.train(5, { labels: ['EKS-1', 'EKS-2', 'EKS-3', 'MAKAN'] }); tr.position.set(30, 0, 0); scene.add(tr);
  // platform (dipakai saat berhenti)
  const plat = new THREE.Group(); plat.add(MK.box(80, .9, 6, 0xb8b4aa, 0, .45, 4.6), MK.box(80, .02, .3, 0xf5c518, 0, .91, 1.9), MK.box(78, .2, 5, 0x24456e, 0, 5, 5));
  for (let x = -36; x <= 36; x += 9) plat.add(MK.cyl(.14, .14, 4.2, 0x2b3542, x, 2.9, 6, 6));
  const pb = MK.box(20, 5, 6, 0xe9e1cf, 8, 2.5, -11); plat.add(pb); plat.add(MK.box(78, .6, 4, 0xb8b4aa, 0, .3, -4.4));
  scene.add(plat); plat.visible = false;
  let signMesh = null;
  const v = {
    scene, camera, speed: 0, target: 'stop', plat, dist: 0, t: 0,
    setStation(name) {
      if (signMesh) plat.remove(signMesh);
      signMesh = MK.sign(name.toUpperCase(), 7, 1.3, { w: 640, h: 120 }); signMesh.position.set(-6, 3.2, 7.4); plat.add(signMesh);
    },
    update(dt) {
      v.t += dt;
      if (v.target === 'run') v.speed = Math.min(26, v.speed + dt * 5);
      if (v.target === 'arrive') { v.dist = Math.max(0, v.dist - v.speed * dt); v.speed = Math.max(0, Math.sqrt(2 * 3.4 * v.dist)); plat.position.x = v.dist; }
      if (v.target === 'stop') v.speed = 0;
      if (v.target === 'run' && plat.visible) { plat.position.x -= v.speed * dt; if (plat.position.x < -160) plat.visible = false; }
      props.forEach(p => { p.position.x -= v.speed * dt; if (p.position.x < -200) p.position.x += 400; });
      camera.position.set(-14 + Math.sin(v.t * .1) * 5, 15, 48); camera.lookAt(4, 1, 0);
    },
    arrive(name) { v.setStation(name); plat.visible = true; v.dist = Math.max(30, v.speed * v.speed / (2 * 3.4)); plat.position.x = v.dist; v.target = 'arrive'; },
  };
  return v;
}

const L3 = {
  id: 3,
  brief: {
    intro: 'Anda bertugas sebagai kondektur di gerbong EKS-1 KA Nusantara Ekspres, relasi Gambir–Yogyakarta. Periksa tiket di setiap stasiun, tangani barang hilang, dan respons komplain serta keadaan darurat.',
    sop: [
      '<b>Boarding check:</b> cocokkan nama tiket dengan KTP, tanggal dan kereta, gerbong, serta nomor kursi. Pilih tindakan yang sesuai untuk tiap penumpang sebelum kereta berangkat lagi.',
      '<b>Lost &amp; Found:</b> barang temuan dicatat dan disimpan di kabin kondektur. Serahkan hanya kepada pemilik yang ciri-cirinya cocok. Barang yang tak diklaim diserahkan ke Lost &amp; Found stasiun tujuan dengan berita acara.',
      '<b>Komplain &amp; darurat:</b> utamakan keselamatan, koordinasi dengan kru (teknisi kereta, Polsuska, Kepala Kereta) dan stasiun berikutnya.',
      '<b>SLA respons:</b> setiap kejadian harus ditanggapi dalam 25 detik.',
    ],
    controls: ['Klik tombol tindakan pada kartu penumpang.', 'Kejadian muncul selama perjalanan; pilih respons terbaik.', 'Esc untuk jeda.'],
    kpi: [['Akurasi boarding check', '35%'], ['Respons komplain & darurat', '35%'], ['Penanganan Lost & Found', '20%'], ['Kecepatan respons (SLA)', '10%']],
  },
  start() {
    Game.setCanvas(GL.ok ? 'gl' : 'none');
    if (GL.ok) { this.v = makeJourneyScene(); this.v.onResize = () => { }; GL.use(this.v); this.v.setStation('Gambir'); this.v.plat.visible = true; this.v.plat.position.x = 0; }
    this.date = new Date();
    this.st = { bOK: 0, bN: 0, eScore: 0, eN: 0, eTime: [], eMiss: 0, lf: 0, lfN: 0 };
    this.events = shuffle(L3_EVENTS.slice()).slice(0, 6);
    this.items = shuffle(L3_ITEMS.slice()).slice(0, 3).map(it => ({ ...it, owner: makePerson(), found: false, stored: false, claimed: false }));
    this.stage = 0; this.handed = false; this.done = false; // index stasiun
    this.legs = [
      { evs: ['event', 'found'], dur: 46 },
      { evs: ['event', 'found', 'event'], dur: 55 },
      { evs: ['found', 'event', 'claim', 'event', 'claim', 'claim'], dur: 75 },
    ];
    this.renderShell();
    this.startBoarding();
  },
  cleanup() { this.v = null; },
  renderShell() {
    UI.setHud(`<div class="topbar"><span class="chip title">Level 3 · Kondektur</span><span class="chip">KA Nusantara Ekspres · EKS-1</span><span class="chip" id="h3-status">–</span><span class="chip">Jam <b id="h3-clock">08:00</b></span><span class="spacer"></span><button class="btn sm" id="b-pause">Jeda</button></div>
      <div class="l3"><div class="route" id="route"></div><div class="work"><div class="panel" id="work3"></div></div></div>`);
    $('#b-pause').onclick = () => Game.pauseMenu();
    this.renderRoute(0);
  },
  renderRoute(prog) {
    const r = $('#route'); if (!r) return;
    r.innerHTML = L3_STATIONS.map((s, i) => `<div class="st ${i <= this.stage ? 'done' : ''}"><i></i>${s[0]}<span class="muted mono" style="font-weight:500">${s[1]}</span></div>` + (i < 3 ? `<div class="seg"><i style="width:${i < this.stage ? 100 : i === this.stage ? prog * 100 : 0}%"></i></div>` : '')).join('');
  },
  status(s, cls = '') { const e = $('#h3-status'); if (e) { e.textContent = s; e.className = 'chip ' + cls; } },
  /* ---------- boarding check ---------- */
  startBoarding() {
    this.mode = 'board'; this.bT = this.stage === 0 ? 70 : 55;
    const n = this.stage === 0 ? 8 : 6;
    this.pax = [];
    for (let i = 0; i < n; i++) {
      const p = makePerson(); const issue = chance(.45) ? pick(['kursi', 'gerbong', 'invalid', 'invalid']) : 'ok';
      const seat = randi(1, 13) + pick(['A', 'B', 'C', 'D']);
      const x = { p, issue, sit: 'EKS-1 / ' + seat, tix: { name: p.name, train: 'KA Nusantara Ekspres', date: new Date(this.date), car: 'EKS-1', seat, from: L3_STATIONS[this.stage][0] }, ans: null, why: '' };
      if (issue === 'kursi') { let s2; do { s2 = randi(1, 13) + pick(['A', 'B', 'C', 'D']); } while (s2 === seat); x.tix.seat = s2; x.why = `Tiket kursi ${s2}, duduk di ${seat}.`; }
      if (issue === 'gerbong') { x.tix.car = pick(['EKS-2', 'EKS-3']); x.why = `Tiket untuk gerbong ${x.tix.car}.`; }
      if (issue === 'invalid') {
        const k = pick(['date', 'name', 'train']);
        if (k === 'date') { const d = new Date(this.date); d.setDate(d.getDate() + pick([-1, 1, 2])); x.tix.date = d; x.why = 'Tanggal tiket bukan hari ini.'; }
        if (k === 'name') { x.tix.name = pick(NAMES[p.sex]) + ' ' + pick(NAMES.last); x.why = 'Nama tiket berbeda dengan KTP.'; }
        if (k === 'train') { x.tix.train = 'KA ' + pick(['Bengawan Senja', 'Lintas Merapi', 'Cakrawala']); x.why = 'Tiket untuk kereta lain.'; }
      }
      this.pax.push(x);
    }
    this.status(`Berhenti di ${L3_STATIONS[this.stage][0]}`, 'warn');
    this.renderBoarding();
    if (this.stage > 0) { Sfx.chime(); UI.toast(`Kereta tiba di Stasiun ${L3_STATIONS[this.stage][0]}. Penumpang baru naik ke EKS-1.`); }
  },
  renderBoarding() {
    const w = $('#work3'); if (!w) return;
    const left = this.pax.filter(x => !x.ans).length;
    w.innerHTML = `<div class="btnrow" style="justify-content:space-between;align-items:center"><div><div class="eyebrow">Boarding check · Stasiun ${L3_STATIONS[this.stage][0]}</div><h3 class="disp">Periksa ${this.pax.length} penumpang baru</h3></div>
      <span class="chip warn">Berangkat dalam <b id="b3t">${Math.ceil(this.bT)}</b> dtk · sisa ${left}</span></div>
      <p class="muted" style="font-size:12.5px;margin:6px 0 10px">Hari ini ${tglShort(this.date)} · Anda memeriksa gerbong EKS-1.</p>
      <div class="pcards">${this.pax.map((x, i) => `<div class="pcard ${x.ans ? 'done' : ''}"><div style="display:flex;gap:8px;align-items:center"><span id="pf${i}"></span><div style="min-width:0"><b>${esc(x.p.name)}</b><div class="muted" style="font-size:11.5px">KTP · NIK ${x.p.nik.slice(0, 6)}••••</div><div style="font-size:11.5px">Duduk di <b>${x.sit}</b></div></div></div>
        <dl class="kv" style="font-size:12px;background:#fff;padding:6px 8px;border-radius:6px"><dt>Nama tiket</dt><dd>${esc(x.tix.name)}</dd><dt>Kereta</dt><dd>${x.tix.train}</dd><dt>Tanggal</dt><dd>${tglShort(x.tix.date)}</dd><dt>Gerbong/kursi</dt><dd>${x.tix.car} / ${x.tix.seat}</dd></dl>
        ${x.ans ? `<span class="tag ${x.ok ? 'go' : 'stop'}">${x.ok ? 'Tepat' : 'Keliru'} · ${x.ans}</span>` : `<div class="acts"><button class="btn go" data-b="${i}:ok">Sesuai</button><button class="btn" data-b="${i}:kursi">Salah kursi</button><button class="btn" data-b="${i}:gerbong">Salah gerbong</button><button class="btn stop" data-b="${i}:invalid">Tiket tidak berlaku</button></div>`}</div>`).join('')}</div>`;
    this.pax.forEach((x, i) => { const s = $('#pf' + i); if (s) s.appendChild(faceCanvas(x.p.face, 40, 40, 'var(--sunk)')); });
    $$('[data-b]').forEach(b => b.onclick = () => { const [i, a] = b.dataset.b.split(':'); this.judge(+i, a); });
  },
  judge(i, a) {
    const x = this.pax[i]; if (x.ans) return;
    const lbl = { ok: 'Sesuai', kursi: 'Arahkan ke kursi sesuai tiket', gerbong: 'Arahkan ke gerbong sesuai tiket', invalid: 'Tiket tidak berlaku' };
    x.ans = lbl[a]; x.ok = a === x.issue; this.st.bN++; if (x.ok) this.st.bOK++;
    if (x.ok) Sfx.ok(); else { Sfx.bad(); UI.toast(`Keliru. ${x.issue === 'ok' ? 'Tiket penumpang ini sesuai.' : x.why}`, 'bad', 3200); }
    this.renderBoarding();
    if (this.pax.every(p => p.ans)) setTimeout(() => Game.level === this && this.mode === 'board' && this.depart(), 700);
  },
  depart() {
    this.pax.filter(x => !x.ans).forEach(() => { this.st.bN++; });
    if (this.pax.some(x => !x.ans)) UI.toast('Sebagian penumpang belum diperiksa saat kereta berangkat.', 'warn');
    Sfx.horn();
    this.mode = 'travel'; this.legT = 0; const leg = this.legs[this.stage];
    this.legEvs = leg.evs.map((k, i) => ({ k, at: (i + 1) * leg.dur / (leg.evs.length + 1) }));
    this.ev = null;
    if (this.v) this.v.target = 'run';
    this.status(`Perjalanan ${L3_STATIONS[this.stage][0]} → ${L3_STATIONS[this.stage + 1][0]}`, 'good');
    this.renderTravel();
  },
  /* ---------- travel events ---------- */
  renderTravel() {
    const w = $('#work3'); if (!w) return;
    const e = this.ev;
    const inv = this.items.filter(it => it.stored && !it.claimed);
    const invHTML = `<div style="margin-top:12px"><div class="eyebrow">Kabin kondektur · Buku Lost &amp; Found</div>${inv.length ? `<ul class="sop" style="margin-top:6px">${inv.map(it => `<li>${it.label} — ${it.det(it.owner.name)}</li>`).join('')}</ul>` : '<p class="muted" style="font-size:12.5px;margin-top:4px">Belum ada barang temuan.</p>'}</div>`;
    if (!e) { w.innerHTML = `<div class="eyebrow">Patroli gerbong</div><h3 class="disp">Perjalanan aman</h3><p class="muted" style="margin-top:6px">Anda berpatroli di EKS-1 sambil memantau penumpang. Tetap siaga untuk kejadian berikutnya.</p>${invHTML}`; return; }
    w.innerHTML = `<div class="btnrow" style="justify-content:space-between;align-items:center"><div><div class="eyebrow">${e.kind === 'event' ? 'Komplain / darurat' : 'Lost & Found'}</div><h3 class="disp">${e.title}</h3></div><span class="chip bad">SLA <b id="sla3">${Math.ceil(e.left)}</b> dtk</span></div>
      <p style="margin:8px 0 12px">${e.text}</p><div style="display:flex;flex-direction:column;gap:8px">${e.opts.map((o, i) => `<button class="btn opt" data-o="${i}">${o[0]}</button>`).join('')}</div>${invHTML}`;
    $$('[data-o]').forEach(b => b.onclick = () => this.answer(+b.dataset.o));
  },
  makeEvent(k) {
    if (k === 'event') {
      const ev = this.events.shift(); if (!ev) return null;
      return { kind: 'event', title: ev.t, text: ev.d, opts: shuffle(ev.o.slice()), left: 25, t0: 0 };
    }
    if (k === 'found') {
      const it = this.items.find(i => !i.found); if (!it) return null; it.found = true;
      const seat = randi(1, 13) + pick(['A', 'B', 'C', 'D']);
      return { kind: 'found', it, title: 'Barang tertinggal ditemukan', text: `Saat patroli, Anda menemukan <b>${it.label}</b> (${it.det(it.owner.name)}) di kursi ${seat} yang sudah kosong.`, left: 25, opts: shuffle([
        ['Catat di buku Lost & Found (waktu, lokasi, ciri barang) lalu simpan di kabin kondektur.', 1, 'Tepat. Barang tercatat dan aman.'],
        ['Titipkan ke penumpang di kursi sebelahnya.', 0, 'Barang temuan tidak boleh dititipkan ke penumpang lain.'],
        ['Biarkan di kursi, nanti pemiliknya kembali.', 0, 'Barang berisiko hilang atau diambil orang lain.']]) };
    }
    if (k === 'claim') {
      const stored = this.items.filter(i => i.stored && !i.claimed && !i.claimTried);
      if (!stored.length) return null;
      const it = stored[0]; it.claimTried = true;
      const fake = this.items.filter(i => i.stored).length >= 3 && it === this.items.filter(i => i.stored)[2];
      const claimant = fake ? makePerson() : it.owner;
      const desc = fake ? it.fake : `${it.label.toLowerCase()}, ${it.det(it.owner.name)}`;
      return { kind: 'claim', it, fake, title: 'Klaim barang hilang', text: `${esc(claimant.name)} mendatangi Anda: “Pak/Bu, barang saya hilang. Ciri-cirinya: <b>${desc}</b>.”`, left: 25, opts: [
        ...this.items.filter(i => i.stored && !i.claimed).map(i => [`Serahkan ${i.label} setelah cek identitas dan tanda tangan berita acara`, (!fake && i === it) ? 1 : 0, (!fake && i === it) ? 'Tepat. Barang kembali ke pemiliknya.' : 'Ciri barang tidak cocok dengan keterangan penumpang.', i]),
        ['Ciri tidak cocok dengan barang temuan. Catat laporan kehilangan dan teruskan ke stasiun tujuan.', fake ? 1 : 0, fake ? 'Tepat. Klaim tidak cocok tidak boleh dilayani.' : 'Barang yang dicari sebenarnya ada di kabin Anda.'],
      ] };
    }
    return null;
  },
  answer(i) {
    const e = this.ev; if (!e) return;
    const o = e.opts[i];
    const resp = 25 - e.left;
    if (e.kind === 'event') { this.st.eN++; this.st.eScore += o[1]; this.st.eTime.push(resp); }
    else { this.st.lfN++; this.st.lf += o[1]; this.st.eTime.push(resp); }
    if (e.kind === 'found' && o[1] === 1) e.it.stored = true;
    if (e.kind === 'found' && o[1] !== 1) e.it.lost = true;
    if (e.kind === 'claim' && o[1] === 1 && !e.fake) e.it.claimed = true;
    o[1] >= 1 ? Sfx.ok() : Sfx.bad();
    UI.toast(o[2], o[1] >= 1 ? 'good' : o[1] > 0 ? 'warn' : 'bad', 3800);
    this.ev = null; this.renderTravel();
  },
  arrive() {
    this.stage++;
    if (this.v) this.v.arrive(L3_STATIONS[this.stage][0]);
    this.renderRoute(0);
    if (this.stage >= 3) { this.mode = 'final'; setTimeout(() => Game.level === this && this.handover(), 2500); this.status('Tiba di Yogyakarta', 'good'); return; }
    this.mode = 'wait'; this.status('Kereta melambat masuk stasiun', 'warn'); setTimeout(() => Game.level === this && this.startBoarding(), 3800);
  },
  handover() {
    const left = this.items.filter(i => i.stored && !i.claimed);
    const w = $('#work3');
    if (!left.length) { this.finish(); return; }
    w.innerHTML = `<div class="eyebrow">Tiba di Stasiun Yogyakarta</div><h3 class="disp">Barang temuan yang belum diklaim</h3><ul class="sop" style="margin:8px 0 12px">${left.map(it => `<li>${it.label} — ${it.det(it.owner.name)}</li>`).join('')}</ul>
      <div style="display:flex;flex-direction:column;gap:8px">${shuffle([['Serahkan ke petugas Lost & Found stasiun dengan berita acara serah terima.', 1], ['Simpan sendiri dulu, siapa tahu pemiliknya menghubungi.', 0], ['Tinggalkan di kabin kondektur untuk perjalanan berikutnya.', 0]]).map((o, i) => `<button class="btn opt" data-h="${o[1]}">${o[0]}</button>`).join('')}</div>`;
    $$('[data-h]').forEach(b => b.onclick = () => { if (this.handed) return; this.handed = true; const v = +b.dataset.h; this.st.lfN++; this.st.lf += v; v ? Sfx.ok() : Sfx.bad(); UI.toast(v ? 'Barang diserahkan sesuai prosedur.' : 'Barang temuan wajib diserahkan ke Lost & Found stasiun.', v ? 'good' : 'bad'); setTimeout(() => Game.level === this && this.finish(), 800); });
  },
  update(dt) {
    if (this.v) this.v.update(dt);
    const ck = $('#h3-clock');
    if (this.mode === 'board') {
      this.bT -= dt; const e = $('#b3t'); if (e) e.textContent = Math.ceil(Math.max(0, this.bT));
      if (this.bT <= 0) this.depart();
    }
    if (this.mode === 'travel') {
      const leg = this.legs[this.stage];
      this.legT += dt; this.renderRoute(this.legT / leg.dur);
      const [h0, m0] = L3_STATIONS[this.stage][1].split(':').map(Number), [h1, m1] = L3_STATIONS[this.stage + 1][1].split(':').map(Number);
      if (ck) ck.textContent = clock(lerp(h0 * 60 + m0, h1 * 60 + m1, clamp(this.legT / leg.dur, 0, 1)));
      if (!this.ev && this.legEvs.length && this.legT >= this.legEvs[0].at) {
        const k = this.legEvs.shift().k; this.ev = this.makeEvent(k);
        if (this.ev) { this.ev.kind === 'event' ? Sfx.alarm() : Sfx.chime(); this.renderTravel(); }
      }
      if (this.ev) {
        this.ev.left -= dt; const s = $('#sla3'); if (s) s.textContent = Math.ceil(Math.max(0, this.ev.left));
        if (this.ev.left <= 0) {
          const e = this.ev; this.st.eMiss++; this.st.eTime.push(25);
          if (e.kind === 'event') this.st.eN++; else this.st.lfN++;
          if (e.kind === 'found') e.it.lost = true;
          Sfx.bad(); UI.toast('SLA terlewati. Kejadian tidak tertangani tepat waktu.', 'bad'); this.ev = null; this.renderTravel();
        }
      }
      if (this.legT >= leg.dur && !this.ev) {
        // pastikan event yang belum sempat muncul tetap dihitung
        while (!this.ev && this.legEvs.length) this.ev = this.makeEvent(this.legEvs.shift().k);
        if (this.ev) { this.renderTravel(); return; }
        this.mode = 'arriving'; this.arrive();
      }
    }
  },
  finish() {
    if (this.done) return; this.done = true;
    const s = this.st;
    const b = s.bN ? s.bOK / s.bN * 100 : 0;
    const e = s.eN ? s.eScore / s.eN * 100 : 0;
    const lf = s.lfN ? s.lf / s.lfN * 100 : 0;
    const avgT = s.eTime.length ? s.eTime.reduce((a, c) => a + c, 0) / s.eTime.length : 25;
    const sp = clamp(100 - Math.max(0, avgT - 8) * 5 - s.eMiss * 15, 0, 100);
    const total = b * .35 + e * .35 + lf * .20 + sp * .10;
    const notes = [];
    if (b < 90) notes.push('Cocokkan nama tiket dengan KTP, tanggal, kereta, gerbong, lalu kursi — urut dari yang membuat tiket tidak berlaku.');
    if (e < 90) notes.push('Dalam kejadian darurat, pilih respons yang mengutamakan keselamatan dan koordinasi dengan kru serta stasiun berikutnya.');
    if (lf < 90) notes.push('Barang temuan wajib dicatat, disimpan, diserahkan hanya ke pemilik yang ciri-cirinya cocok, dan sisanya ke Lost & Found stasiun.');
    if (s.eMiss) notes.push(`${s.eMiss} kejadian melewati SLA 25 detik.`);
    Game.finish(3, {
      score: total, notes,
      rows: [
        ['Akurasi boarding check', 35, `${s.bOK}/${s.bN}`, '100%', b],
        ['Respons komplain & darurat', 35, `${pct(e)} (${s.eN} kejadian)`, 'respons terbaik', e],
        ['Lost & Found', 20, `${pct(lf)}`, 'sesuai prosedur', lf],
        ['Kecepatan respons', 10, `${avgT.toFixed(1)} dtk rata-rata`, '≤ 8 dtk, 0 terlewat', sp],
      ],
    });
  },
};
Levels[3] = L3;
