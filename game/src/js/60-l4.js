/* ================= LEVEL 4 · PPKA (sinyal & wesel) ================= */
const L4G = (() => {
  const Y1 = 150, Y2 = 230, Y3 = 310;
  const P = {
    1: [[-60, Y2], [150, Y2], [230, Y1], [770, Y1], [850, Y2], [1060, Y2]],
    2: [[-60, Y2], [150, Y2], [190, Y2], [810, Y2], [850, Y2], [1060, Y2]],
    3: [[-60, Y2], [150, Y2], [190, Y2], [270, Y3], [730, Y3], [810, Y2], [850, Y2], [1060, Y2]],
  };
  const SEG = {
    LW: [[-60, Y2], [150, Y2]], SW1: [[150, Y2], [230, Y1]], W12: [[150, Y2], [190, Y2]], SW2: [[190, Y2], [270, Y3]],
    J1: [[230, Y1], [770, Y1]], J2: [[190, Y2], [810, Y2]], J3: [[270, Y3], [730, Y3]],
    SE2: [[730, Y3], [810, Y2]], E21: [[810, Y2], [850, Y2]], SE1: [[770, Y1], [850, Y2]], LE: [[850, Y2], [1060, Y2]],
  };
  const SW = { W1: { x: 150, y: Y2, side: 'W', rTrack: 1 }, W2: { x: 190, y: Y2, side: 'W', rTrack: 3 }, E2: { x: 810, y: Y2, side: 'E', rTrack: 3 }, E1: { x: 850, y: Y2, side: 'E', rTrack: 1 } };
  const build = pts => { const segs = []; let s = 0; for (let i = 0; i < pts.length - 1; i++) { const [x0, y0] = pts[i], [x1, y1] = pts[i + 1]; const l = Math.hypot(x1 - x0, y1 - y0); segs.push({ x0, y0, x1, y1, s0: s, l }); s += l; } return { pts, segs, len: s }; };
  const paths = { 1: {}, '-1': {} };
  [1, 2, 3].forEach(k => { paths[1][k] = build(P[k]); paths[-1][k] = build(P[k].slice().reverse()); });
  const at = (path, s) => { s = clamp(s, 0, path.len); for (const g of path.segs) if (s <= g.s0 + g.l) { const t = (s - g.s0) / g.l; return [g.x0 + (g.x1 - g.x0) * t, g.y0 + (g.y1 - g.y0) * t]; } const g = path.segs[path.segs.length - 1]; return [g.x1, g.y1]; };
  const sAtX = (path, x) => { for (const g of path.segs) { const lo = Math.min(g.x0, g.x1), hi = Math.max(g.x0, g.x1); if (x >= lo && x <= hi && g.x1 !== g.x0) { return g.s0 + Math.abs(x - g.x0) / Math.abs(g.x1 - g.x0) * g.l; } } return null; };
  return { Y1, Y2, Y3, SEG, SW, paths, at, sAtX };
})();

const L4_SIGNALS = () => ([
  { id: 'MA', name: 'Masuk A', dir: 1, kind: 'entry', x: 110, y: L4G.Y2 },
  { id: 'MB', name: 'Masuk B', dir: -1, kind: 'entry', x: 890, y: L4G.Y2 },
  { id: 'K1T', name: 'Keluar J1 →', dir: 1, kind: 'exit', track: 1, x: 755, y: L4G.Y1 },
  { id: 'K2T', name: 'Keluar J2 →', dir: 1, kind: 'exit', track: 2, x: 790, y: L4G.Y2 },
  { id: 'K3T', name: 'Keluar J3 →', dir: 1, kind: 'exit', track: 3, x: 715, y: L4G.Y3 },
  { id: 'K1B', name: '← Keluar J1', dir: -1, kind: 'exit', track: 1, x: 245, y: L4G.Y1 },
  { id: 'K2B', name: '← Keluar J2', dir: -1, kind: 'exit', track: 2, x: 225, y: L4G.Y2 },
  { id: 'K3B', name: '← Keluar J3', dir: -1, kind: 'exit', track: 3, x: 285, y: L4G.Y3 },
].map(s => Object.assign(s, { state: 'red', fault: false, permit: false, route: null })));

const L4_SCEN = [
  [3, 1, 'stop', 'KA 412 Lokal Banyu Biru'], [10, -1, 'pass', 'KA 7 Nusantara Ekspres'],
  [38, -1, 'stop', 'KA 118 Bengawan Senja'], [46, 1, 'pass', 'KA 2501 Barang Semen'],
  [72, 1, 'stop', 'KA 135 Pelangi Selatan'], [80, -1, 'stop', 'KA 122 Lintas Merapi'], [88, 1, 'pass', 'KA 9 Cakrawala Ekspres'],
  [122, -1, 'pass', 'KA 2604 Barang Peti Kemas'], [130, 1, 'stop', 'KA 141 Mutiara Pantura'],
  [158, -1, 'stop', 'KA 126 Rajawali Timur'], [166, 1, 'pass', 'KA 11 Taruna Jaya'], [178, -1, 'pass', 'KA 2702 Barang BBM'],
];

const L4 = {
  id: 4,
  brief: {
    intro: 'Anda PPKA di Stasiun Nusantara, stasiun persilangan di jalur tunggal dengan tiga sepur (J1–J3). Kereta datang dari dua arah. Atur wesel dan sinyal agar kereta bersilang dan menyusul dengan aman, tanpa terlambat.',
    sop: [
      '<b>Jalur tunggal:</b> petak jalan di barat dan timur stasiun hanya satu sepur. Jangan izinkan kereta berangkat ke petak yang sedang dimasuki kereta dari arah berlawanan.',
      '<b>Wesel:</b> W1/E1 posisi R (reverse) mengarah ke J1, W2/E2 posisi R mengarah ke J3. Keduanya N (normal) mengarah ke J2 (sepur lurus).',
      '<b>Sinyal masuk:</b> saat sinyal masuk dibuka, rute ditetapkan sesuai posisi wesel dan wesel terkunci sampai kereta lewat. Pastikan sepur tujuan kosong.',
      '<b>Sinyal keluar:</b> hanya bisa dibuka jika wesel di sisi keluar sudah mengarah ke sepur tersebut.',
      '<b>Kereta penumpang</b> (oranye) berhenti di peron untuk naik-turun penumpang. <b>Kereta langsung/barang</b> (biru/abu) tidak berhenti bila sinyal keluar sudah aman.',
      '<b>Gangguan sinyal:</b> tangani secepatnya, panggil teknisi atau terbitkan izin melewati sinyal.',
    ],
    controls: ['Klik tuas di panel bawah, atau klik langsung wesel/sinyal di layar.', 'Garis hijau = rute ditetapkan, merah = sepur terisi kereta.', 'Esc untuk jeda.'],
    kpi: [['On-Time Performance (OTP ≥ 95%)', '40%'], ['Zero accident', '35%'], ['Kecepatan penanganan gangguan sinyal', '15%'], ['Efisiensi (waktu tunggu di sinyal masuk)', '10%']],
  },
  start() {
    Game.setCanvas('ppka');
    this.cv = $('#ppka'); this.ctx = this.cv.getContext('2d');
    this.t = 0; this.finished = false; this.doneList = []; this._tick = -1; this.sw = { W1: 'N', W2: 'N', E1: 'N', E2: 'N' }; this.lock = { W1: 0, W2: 0, E1: 0, E2: 0 };
    this.sig = L4_SIGNALS(); this.trains = []; this.spawnList = L4_SCEN.map((s, i) => ({ at: s[0], dir: s[1], type: s[2], name: s[3], id: i }));
    this.st = { acc: 0, done: 0, onTime: 0, delays: [], wait: 0, fault: null, faultResp: null };
    this.fx = []; this.log = [];
    this.faultAt = 96;
    this.pan = null; this._panHint = 0;
    this.renderHud();
    this._resize = () => this.resize(); window.addEventListener('resize', this._resize); this.resize();
    this._click = e => { this._down = { x: e.clientX, pan: this.pan || 0, moved: false }; };
    this._move = e => { const d = this._down; if (!d || !this.panMax) return; const dx = e.clientX - d.x; if (Math.abs(dx) > 6) d.moved = true; if (d.moved) { this.pan = clamp(d.pan - dx, 0, this.panMax); this.resize(); } };
    this._up = e => { const d = this._down; this._down = null; if (d && !d.moved) this.onClick(e); };
    this.cv.addEventListener('pointerdown', this._click); this.cv.addEventListener('pointermove', this._move); window.addEventListener('pointerup', this._up);
    this.addLog('Shift PPKA dimulai. Semua sinyal tidak aman (merah), wesel normal.');
  },
  cleanup() { window.removeEventListener('resize', this._resize); this.cv.removeEventListener('pointerdown', this._click); this.cv.removeEventListener('pointermove', this._move); window.removeEventListener('pointerup', this._up); },
  resize() {
    const r = this.cv.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
    this.cv.width = r.width * dpr; this.cv.height = r.height * dpr; this.dpr = dpr;
    const side = window.innerWidth > 900 ? 345 : 0, top = 56, bottom = ($('.l4panel') ? $('.l4panel').offsetHeight : 120) + 8;
    const aw = r.width - side - 20, ah = r.height - top - bottom;
    this.sc = Math.min(aw / 1140, ah / 340); this.ox = 10 + (aw - 1140 * this.sc) / 2 + 70 * this.sc; this.oy = top + (ah - 340 * this.sc) / 2 - 60 * this.sc;
    this.panMax = 0; this.fs = 1;
    if (this.sc < .62) { // layar sempit: perbesar dan izinkan geser horizontal
      this.sc = Math.min(aw / 820, ah / 340); this.panMax = Math.max(0, 1140 * this.sc - aw);
      this.pan = clamp(this.pan == null ? 570 * this.sc - aw / 2 : this.pan, 0, this.panMax);
      this.fs = clamp(.7 / this.sc, 1, 1.9);
      this.ox = 10 + 70 * this.sc - this.pan; this.oy = top + (ah - 340 * this.sc) / 2 - 60 * this.sc;
      if (!this._panHint) { this._panHint = 1; UI.toast('Geser panel ke kiri/kanan untuk melihat seluruh emplasemen. Mode lanskap lebih nyaman.', '', 4500); }
    }
  },
  gameClock() { return 6 * 60 + this.t / 6; }, // 1 dtk nyata = 10 dtk permainan
  addLog(m, k = '') { this.log.unshift({ m, k, t: this.gameClock() }); this.log = this.log.slice(0, 30); this.renderSide(); },
  /* ---------- HUD ---------- */
  renderHud() {
    UI.setHud(`<div class="topbar"><span class="chip title">Level 4 · PPKA</span><span class="chip">Jam <b id="h4-clock">06:00</b></span><span class="chip">OTP <b id="h4-otp">–</b></span><span class="chip" id="h4-acc-c">Insiden <b id="h4-acc">0</b></span><span class="chip">Kereta <b id="h4-done">0/${L4_SCEN.length}</b></span><span class="spacer"></span><button class="btn sm" id="b-pause">Jeda</button></div>
      <div class="l4side panel" id="side4"></div><div id="fault4"></div>
      <div class="l4panel" id="levers"></div>`);
    $('#b-pause').onclick = () => Game.pauseMenu();
    this.renderLevers(); this.renderSide();
  },
  renderLevers() {
    const el = $('#levers'); if (!el) return;
    if (el.dataset.built) {
      $$('[data-sw]', el).forEach(b => { const k = b.dataset.sw; b.className = 'lever ' + (this.sw[k] === 'R' ? 'r' : ''); b.querySelector('.s').textContent = this.sw[k] + (this.lock[k] ? ' 🔒' : ''); });
      $$('[data-sg]', el).forEach(b => { const s = this.sig.find(x => x.id === b.dataset.sg); b.className = 'lever ' + (s.fault ? 'f' : s.state === 'green' ? 'g' : ''); b.querySelector('.s').textContent = s.fault ? 'GANGGUAN' : s.permit ? 'IZIN' : s.state === 'green' ? 'AMAN' : 'TDK AMAN'; });
      return;
    }
    el.dataset.built = '1';
    const swb = k => `<button class="lever ${this.sw[k] === 'R' ? 'r' : ''}" data-sw="${k}" title="Wesel ${k}">${k}<span class="s">${this.sw[k]}${this.lock[k] ? ' 🔒' : ''}</span></button>`;
    const sgb = s => `<button class="lever ${s.fault ? 'f' : s.state === 'green' ? 'g' : ''}" data-sg="${s.id}" title="${s.name}">${s.id}<span class="s">${s.fault ? 'GANGGUAN' : s.state === 'green' ? 'AMAN' : 'TDK AMAN'}</span></button>`;
    el.innerHTML = `<div class="lv-group"><span class="lbl">Wesel barat</span>${swb('W1')}${swb('W2')}</div>
      <div class="lv-group"><span class="lbl">Sinyal →</span>${['MA', 'K1T', 'K2T', 'K3T'].map(id => sgb(this.sig.find(s => s.id === id))).join('')}</div>
      <div class="lv-group"><span class="lbl">Sinyal ←</span>${['MB', 'K1B', 'K2B', 'K3B'].map(id => sgb(this.sig.find(s => s.id === id))).join('')}</div>
      <div class="lv-group"><span class="lbl">Wesel timur</span>${swb('E2')}${swb('E1')}</div>`;
    $$('[data-sw]').forEach(b => b.onclick = () => this.toggleSw(b.dataset.sw));
    $$('[data-sg]').forEach(b => b.onclick = () => this.toggleSig(this.sig.find(s => s.id === b.dataset.sg)));
    if (this._levH !== el.offsetHeight) { this._levH = el.offsetHeight; this.resize(); }
  },
  renderSide() {
    const el = $('#side4'); if (!el) return;
    const rows = this.spawnList.concat(this.trains).concat(this.doneList || []).sort((a, b) => a.id - b.id).map(tr => {
      const sched = tr.sched != null ? tr.sched : this.schedFor(tr);
      let stt = 'Belum masuk';
      if (tr.phase === 'gone') stt = tr.crashed ? '<span class="tag stop">KLB</span>' : tr.late > 3 ? `<span class="tag stop">+${Math.round(tr.late)} mnt</span>` : '<span class="tag go">Tepat waktu</span>';
      else if (tr.phase) stt = tr.track ? `J${tr.track}${tr.phase === 'dwell' ? ' · naik/turun' : ''}` : (tr.waiting ? '<span class="tag warn">Tertahan di sinyal masuk</span>' : 'Mendekat');
      return `<tr><td>${tr.dir > 0 ? '→' : '←'}</td><td>${tr.name}<br><span class="muted" style="font-size:11px">${tr.type === 'stop' ? 'Berhenti' : 'Langsung'} · ${tr.type === 'stop' ? 'brkt' : 'lewat'} ${clock(sched)}</span></td><td>${stt}</td></tr>`;
    }).join('');
    el.innerHTML = `<div class="eyebrow">Grafik perjalanan kereta</div><div class="tbl-wrap"><table class="t" style="min-width:0;font-size:12px">${rows}</table></div>
      <div class="eyebrow" style="margin-top:10px">Log PPKA</div><div class="log" style="margin-top:6px">${this.log.slice(0, 8).map(l => `<div class="${l.k}"><span class="mono muted">${clock(l.t)}</span> ${l.m}</div>`).join('')}</div>`;
  },
  schedFor(tr) { // jadwal (menit permainan) keberangkatan/lewat
    const travel = tr.type === 'stop' ? 26 : 16;
    return 6 * 60 + (tr.at + travel + 6) / 6;
  },
  /* ---------- controls ---------- */
  toggleSw(k) {
    if (this.lock[k]) { Sfx.bad(); UI.toast(`Wesel ${k} terkunci oleh rute yang sudah ditetapkan atau kereta di atasnya.`, 'warn'); return; }
    if (this.trainOnSwitch(k)) { Sfx.bad(); UI.toast(`Ada kereta di atas wesel ${k}.`, 'bad'); return; }
    this.sw[k] = this.sw[k] === 'N' ? 'R' : 'N'; Sfx.tone(300, .15, 'square', .06); Sfx.tone(200, .2, 'square', .05, .12);
    this.renderLevers();
  },
  entryTrack(dir) { const a = dir > 0 ? ['W1', 'W2'] : ['E1', 'E2']; return this.sw[a[0]] === 'R' ? 1 : this.sw[a[1]] === 'R' ? 3 : 2; },
  throatSw(dir, track, side) { // switches crossed at a throat
    const W = side === 'W' ? ['W1', 'W2'] : ['E1', 'E2'];
    return track === 1 ? [W[0]] : [W[0], W[1]];
  },
  alignedFor(side, track) { const W = side === 'W' ? ['W1', 'W2'] : ['E1', 'E2']; return track === 1 ? this.sw[W[0]] === 'R' : track === 3 ? this.sw[W[0]] === 'N' && this.sw[W[1]] === 'R' : this.sw[W[0]] === 'N' && this.sw[W[1]] === 'N'; },
  toggleSig(s) {
    if (s.fault) { this.showFault(); return; }
    if (s.state === 'green') {
      s.state = 'red'; if (s.route) { s.route.sw.forEach(k => this.lock[k] = Math.max(0, this.lock[k] - 1)); s.route = null; }
      Sfx.click(); this.renderLevers(); return;
    }
    if (s.kind === 'entry') {
      const tr = this.entryTrack(s.dir), side = s.dir > 0 ? 'W' : 'E';
      const sw = this.throatSw(s.dir, tr, side);
      s.route = { track: tr, sw }; sw.forEach(k => this.lock[k]++);
      s.state = 'green';
      const occ = this.trains.some(t => t.phase !== 'gone' && t.track === tr);
      if (occ) UI.toast(`Peringatan: sepur J${tr} sedang terisi kereta!`, 'bad', 3500);
      this.addLog(`Sinyal ${s.name} aman, rute ke J${tr}.`);
    } else {
      const side = s.dir > 0 ? 'E' : 'W';
      if (!this.alignedFor(side, s.track)) { Sfx.bad(); UI.toast(`Wesel ${side === 'E' ? 'timur' : 'barat'} belum mengarah ke J${s.track}. Atur wesel dulu.`, 'warn', 3200); return; }
      const sw = this.throatSw(s.dir, s.track, side); s.route = { track: s.track, sw }; sw.forEach(k => this.lock[k]++);
      s.state = 'green';
      const opp = this.trains.some(t => t.phase !== 'gone' && t.dir !== s.dir && !t.track && (s.dir > 0 ? t.headX() > 850 : t.headX() < 150));
      if (opp) UI.toast('Peringatan: ada kereta dari arah berlawanan di petak jalan!', 'bad', 3500);
      this.addLog(`Sinyal ${s.name} aman.`);
    }
    Sfx.tone(520, .1, 'square', .05); this.renderLevers();
  },
  trainOnSwitch(k) { const p = L4G.SW[k]; return this.trains.some(t => t.phase !== 'gone' && t.points().some(([x, y]) => Math.hypot(x - p.x, y - p.y) < 14)); },
  onClick(e) {
    if (Game.paused || UI.modalOpen) return;
    const r = this.cv.getBoundingClientRect(), x = (e.clientX - r.left - this.ox) / this.sc, y = (e.clientY - r.top - this.oy) / this.sc;
    for (const k in L4G.SW) { const p = L4G.SW[k]; if (Math.hypot(x - p.x, y - p.y) < 18) { this.toggleSw(k); return; } }
    for (const s of this.sig) { const [sx, sy] = this.sigPos(s); if (Math.hypot(x - sx, y - sy) < 16) { this.toggleSig(s); return; } }
  },
  sigPos(s) { return [s.x, s.y + (s.dir > 0 ? -22 : 22)]; },
  /* ---------- trains ---------- */
  spawn(d) {
    const tr = Object.assign({}, d, { L: d.type === 'pass' && /Barang/.test(d.name) ? 120 : 80, s: 0, v: 55, phase: 'approach', track: null, dwell: d.type === 'stop' ? 10 : 0, dwelled: false, waiting: false, late: 0 });
    tr.path = L4G.paths[d.dir][2]; tr.sched = this.schedFor(d);
    const self = this;
    tr.points = function () { const pts = []; for (let k = 0; k <= this.L; k += 10) pts.push(L4G.at(this.path, this.s - k)); return pts; };
    tr.headX = function () { return L4G.at(this.path, this.s)[0]; };
    this.trains.push(tr); Sfx.horn();
    this.addLog(`${tr.name} mendekat dari ${d.dir > 0 ? 'barat (Stasiun A)' : 'timur (Stasiun B)'}.`);
  },
  sigS(tr, s) { return L4G.sAtX(tr.path, s.x); },
  update(dt) {
    this.t += dt;
    const ck = $('#h4-clock'); if (ck) ck.textContent = clock(this.gameClock());
    while (this.spawnList.length && this.t >= this.spawnList[0].at) this.spawn(this.spawnList.shift());
    if (this.faultAt && this.t >= this.faultAt) this.triggerFault();
    if (this.st.fault && this.st.fault.repairAt && this.t >= this.st.fault.repairAt) { const s = this.st.fault.sig; s.fault = false; s.permit = false; this.addLog(`Sinyal ${s.name} selesai diperbaiki teknisi.`, 'good'); UI.toast(`Sinyal ${s.name} normal kembali.`, 'good'); this.st.fault.repairAt = 0; this.renderLevers(); }
    for (const tr of this.trains) this.moveTrain(tr, dt);
    this.checkCollisions();
    this.trains = this.trains.filter(tr => { if (tr.phase === 'gone') { (this.doneList = this.doneList || []).push(tr); return false; } return true; });
    this.fx = this.fx.filter(f => (f.t -= dt) > 0);
    if (Math.floor(this.t * 2) !== this._tick) { this._tick = Math.floor(this.t * 2); this.renderSide(); this.renderLevers(); }
    if (this.t >= 300 && !this.finished) {
      this.trains.filter(t => !t.crashed).forEach(t => { this.st.delays.push(30); this.st.done++; });
      this.addLog('Shift berakhir. Kereta yang masih tertahan dicatat terlambat.', 'bad');
      this.finished = true; setTimeout(() => Game.level === this && this.finish(), 600);
    }
    if (!this.spawnList.length && !this.trains.length && !this.finished) { this.finished = true; setTimeout(() => Game.level === this && this.finish(), 1200); }
    this.draw();
  },
  moveTrain(tr, dt) {
    if (tr.crashed) { tr.crashT -= dt; if (tr.crashT <= 0) tr.phase = 'gone'; return; }
    const entrySig = this.sig.find(s => s.kind === 'entry' && s.dir === tr.dir);
    let stopS = Infinity, vmax = 60;
    if (!tr.track) {
      const sS = this.sigS(tr, entrySig);
      if (entrySig.state === 'green' || entrySig.permit) {
        if (tr.s >= sS - 60 || tr.v < 1) {
          // commit route
          const route = entrySig.route || { track: this.entryTrack(tr.dir), sw: [] };
          tr.track = route.track; tr.path = L4G.paths[tr.dir][tr.track];
          tr.locks = route.sw.slice(); entrySig.route = null; entrySig.state = 'red';
          if (entrySig.permit) { entrySig.permit = false; tr.restricted = true; tr.locks = this.throatSw(tr.dir, tr.track, tr.dir > 0 ? 'W' : 'E'); tr.locks.forEach(k => this.lock[k]++); }
          tr.waiting = false; this.addLog(`${tr.name} masuk J${tr.track}.`);
          this.renderLevers();
        }
      } else { stopS = sS - 8; }
      for (const o of this.trains) if (o !== tr && o.dir === tr.dir && o.phase !== 'gone' && o.s > tr.s) stopS = Math.min(stopS, o.s - o.L - 24);
      if (!tr.track && tr.s >= sS - 30 && tr.v < 2) { if (!tr.waiting) { tr.waiting = true; this.addLog(`${tr.name} tertahan di sinyal ${entrySig.name}.`, 'warn'); } this.st.wait += dt; }
    }
    if (tr.track) {
      const ex = this.sig.find(s => s.kind === 'exit' && s.dir === tr.dir && s.track === tr.track);
      const exS = this.sigS(tr, ex);
      if (tr.s < exS) {
        vmax = tr.track === 2 ? 50 : 38;
        const markS = L4G.sAtX(tr.path, tr.dir > 0 ? 655 : 345);
        if (tr.type === 'stop' && !tr.dwelled) stopS = markS;
        else if (!tr.exitCommitted && !(ex.state === 'green' || ex.permit)) stopS = exS - 10;
        if (tr.type === 'stop' && !tr.dwelled && tr.s >= markS - 4 && tr.v < 1) { tr.phase = 'dwell'; tr.dwell -= dt; if (tr.dwell <= 0) { tr.dwelled = true; tr.phase = 'in'; this.addLog(`${tr.name} siap berangkat dari J${tr.track}.`); } }
        if ((ex.state === 'green' || ex.permit) && (tr.type !== 'stop' || tr.dwelled) && tr.s >= exS - 60) {
          if (!tr.exitCommitted) { tr.exitCommitted = true; tr.exitLocks = ex.route ? ex.route.sw.slice() : []; ex.route = null; if (ex.permit) { ex.permit = false; tr.restricted = true; } ex.state = 'red'; this.renderLevers(); }
        }
      } else if (!tr.departed) { tr.departed = true; tr.depT = this.gameClock(); }
      if (tr.restricted) vmax = Math.min(vmax, 18);
      // release entry locks once tail passed throat
      const tailX = L4G.at(tr.path, tr.s - tr.L)[0];
      if (tr.locks && tr.locks.length && (tr.dir > 0 ? tailX > 280 : tailX < 720)) { tr.locks.forEach(k => this.lock[k] = Math.max(0, this.lock[k] - 1)); tr.locks = []; this.renderLevers(); }
      if (tr.exitLocks && tr.exitLocks.length && (tr.dir > 0 ? tailX > 860 : tailX < 140)) { tr.exitLocks.forEach(k => this.lock[k] = Math.max(0, this.lock[k] - 1)); tr.exitLocks = []; this.renderLevers(); }
    }
    // kinematics
    const dec = 22, acc = 12;
    const vt = Math.min(vmax, Math.sqrt(2 * dec * Math.max(0, stopS - tr.s)));
    tr.v = tr.v < vt ? Math.min(vt, tr.v + acc * dt) : Math.max(vt, tr.v - dec * 1.6 * dt);
    tr.s += tr.v * dt;
    if (tr.s - tr.L > tr.path.len) {
      tr.phase = 'gone'; this.st.done++;
      const actual = tr.depT || this.gameClock();
      tr.late = Math.max(0, actual - tr.sched);
      this.st.delays.push(tr.late); if (tr.late <= 3) this.st.onTime++;
      this.addLog(`${tr.name} ${tr.type === 'stop' ? 'berangkat' : 'lewat langsung'} ${tr.late <= 3 ? 'tepat waktu' : `terlambat ${Math.round(tr.late)} menit`}.`, tr.late <= 3 ? 'good' : 'bad');
      this.updStats();
    }
  },
  updStats() {
    const n = this.st.done + this.st.acc * 0; const otp = this.st.delays.length ? this.st.onTime / this.st.delays.length * 100 : null;
    const o = $('#h4-otp'); if (o) o.textContent = otp == null ? '–' : pct(otp);
    const d = $('#h4-done'); if (d) d.textContent = `${this.st.done}/${L4_SCEN.length}`;
  },
  checkCollisions() {
    const live = this.trains.filter(t => t.phase !== 'gone' && !t.crashed);
    for (let i = 0; i < live.length; i++) for (let j = i + 1; j < live.length; j++) {
      const a = live[i], b = live[j], pa = a.points(), pb = b.points();
      let hit = null;
      for (const p of pa) { for (const q of pb) if (Math.hypot(p[0] - q[0], p[1] - q[1]) < 9) { hit = p; break; } if (hit) break; }
      if (hit) {
        [a, b].forEach(t => { t.crashed = true; t.crashT = 6; t.v = 0; t.locks && t.locks.forEach(k => this.lock[k] = Math.max(0, this.lock[k] - 1)); t.locks = []; t.exitLocks && t.exitLocks.forEach(k => this.lock[k] = Math.max(0, this.lock[k] - 1)); t.exitLocks = []; });
        this.st.acc += 1; this.st.delays.push(60, 60); this.st.done += 2;
        this.fx.push({ x: hit[0], y: hit[1], t: 6 });
        Sfx.crash(); UI.toast(`KECELAKAAN: ${a.name} bertabrakan dengan ${b.name}! Kejadian Luar Biasa dicatat.`, 'bad', 5000);
        this.addLog(`KLB: ${a.name} × ${b.name}.`, 'bad');
        const c = $('#h4-acc'); if (c) { c.textContent = this.st.acc; $('#h4-acc-c').className = 'chip bad'; }
        this.updStats();
      }
    }
    // tandai gone untuk kereta KLB (tidak dihitung ulang)
    this.trains.forEach(t => { if (t.crashed && t.crashT <= 0) { t.phase = 'gone'; } });
  },
  /* ---------- gangguan sinyal ---------- */
  triggerFault() {
    this.faultAt = 0;
    const cands = this.sig.filter(s => s.state !== 'green' && !s.route);
    const s = cands.find(s => s.kind === 'entry') || pick(cands); if (!s) return;
    s.fault = true; s.state = 'red'; this.st.fault = { sig: s, t0: this.t, repairAt: 0 };
    Sfx.alarm(); this.addLog(`GANGGUAN: sinyal ${s.name} tidak dapat dioperasikan.`, 'bad');
    this.renderLevers(); this.showFault();
  },
  showFault() {
    const f = this.st.fault; if (!f || !f.sig.fault) return;
    const s = f.sig;
    Game.level.modalPause = false;
    UI.modal({
      title: `Gangguan sinyal ${s.name}`, cls: 'crisis',
      html: `<p>Lampu sinyal ${s.name} padam dan tuasnya tidak merespons. Kereta yang menuju sinyal ini akan tertahan. Kecepatan penanganan gangguan sinyal adalah indikator KPI Operasional &amp; Keselamatan.</p>`,
      buttons: [
        { label: 'Panggil teknisi sinyal (perbaikan ± 2,5 menit)', cls: 'primary', onClick: () => this.faultAct('repair') },
        { label: 'Terbitkan izin melewati sinyal (kecepatan terbatas) + panggil teknisi', onClick: () => this.faultAct('permit') },
        ...(f.resp == null ? [{ label: 'Nanti saja', cls: 'ghost' }] : [{ label: 'Tutup', cls: 'ghost' }]),
      ],
    });
  },
  faultAct(k) {
    const f = this.st.fault;
    if (f.resp == null) { f.resp = this.t - f.t0; }
    if (!f.repairAt) f.repairAt = this.t + (k === 'repair' ? 15 : 24);
    if (k === 'permit') { f.sig.permit = true; this.addLog(`Izin melewati sinyal ${f.sig.name} diterbitkan untuk satu kereta.`, 'warn'); }
    else this.addLog(`Teknisi sinyal dipanggil untuk ${f.sig.name}.`);
    Sfx.ok(); this.renderLevers();
  },
  /* ---------- draw ---------- */
  draw() {
    const g = this.ctx, d = this.dpr, W = this.cv.width, H = this.cv.height;
    g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#dff1ff'; g.fillRect(0, 0, W, H);
    g.setTransform(d * this.sc, 0, 0, d * this.sc, d * this.ox, d * this.oy);
    const Y1 = L4G.Y1, Y2 = L4G.Y2, Y3 = L4G.Y3;
    // grid
    g.strokeStyle = '#cbe4f8'; g.lineWidth = 1; for (let x = -60; x <= 1060; x += 40) { g.beginPath(); g.moveTo(x, 60); g.lineTo(x, 380); g.stroke(); }
    // labels
    g.fillStyle = '#5a7aa6'; g.font = '600 ' + Math.round(14 * this.fs) + 'px "Fredoka", sans-serif'; g.textAlign = 'left';
    g.fillText('← KE STASIUN A (BARAT)', -60, Y2 + 70); g.fillText('PETAK JALAN · JALUR TUNGGAL', -60, Y2 + 88);
    g.textAlign = 'right'; g.fillText('KE STASIUN B (TIMUR) →', 1060, Y2 + 70); g.fillText('PETAK JALAN · JALUR TUNGGAL', 1060, Y2 + 88);
    g.textAlign = 'center'; g.fillStyle = '#1d3f73'; g.font = '700 ' + Math.round(22 * this.fs) + 'px "Fredoka", sans-serif'; g.fillText('Stasiun Nusantara · Panel PPKA', 500, 84);
    // platforms
    g.fillStyle = '#ffe2b8'; [[Y1, Y2], [Y2, Y3]].forEach(([a, b]) => { g.beginPath(); if (g.roundRect) g.roundRect(330, a + 18, 340, b - a - 36, 10); else g.rect(330, a + 18, 340, b - a - 36); g.fill(); });
    g.fillStyle = '#b0703a'; g.font = '600 ' + Math.round(13 * this.fs) + 'px "Fredoka", sans-serif'; g.fillText('PERON 1', 500, (Y1 + Y2) / 2 + 5); g.fillText('PERON 2', 500, (Y2 + Y3) / 2 + 5);
    // occupancy & routes
    const occ = {}, res = {};
    const live = this.trains.filter(t => t.phase !== 'gone');
    for (const k in L4G.SEG) { const [[x0, y0], [x1, y1]] = L4G.SEG[k]; occ[k] = live.some(t => t.points().some(([x, y]) => distSeg(x, y, x0, y0, x1, y1) < 4)); }
    this.sig.forEach(s => { if (s.state === 'green' && s.route) this.routeSegs(s).forEach(k => res[k] = true); });
    for (const k in L4G.SEG) {
      const [[x0, y0], [x1, y1]] = L4G.SEG[k];
      const active = this.segActive(k);
      g.strokeStyle = occ[k] ? '#f0505a' : res[k] ? '#22b573' : active ? '#5f7ea8' : '#c3d0e0'; g.lineWidth = active || occ[k] ? 7 : 5; g.lineCap = 'round';
      g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
    }
    g.fillStyle = '#5a7aa6'; g.font = '700 ' + Math.round(14 * this.fs) + 'px "JetBrains Mono", monospace'; g.textAlign = 'left';
    g.fillText('J1', 236, Y1 - 10); g.fillText('J2', 236, Y2 - 10); g.fillText('J3', 300, Y3 - 10);
    // switches
    for (const k in L4G.SW) {
      const p = L4G.SW[k];
      g.fillStyle = this.lock[k] ? '#f5b41a' : '#1d3f73'; g.beginPath(); g.arc(p.x, p.y, 7, 0, Math.PI * 2); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 2; g.stroke();
      g.fillStyle = '#1d3f73'; g.font = '700 ' + Math.round(13 * this.fs) + 'px "JetBrains Mono", monospace'; g.textAlign = 'center';
      const lp = { W1: [138, 26], W2: [184, 46], E2: [816, 46], E1: [862, 26] }[k];
      g.fillText(`${k}:${this.sw[k]}`, lp[0], p.y + lp[1]);
    }
    // signals
    for (const s of this.sig) {
      const [x, y] = this.sigPos(s);
      g.strokeStyle = '#5a7aa6'; g.lineWidth = 3; g.beginPath(); g.moveTo(s.x, s.y + (s.dir > 0 ? -5 : 5)); g.lineTo(x, y); g.stroke();
      const blink = s.fault && Math.floor(this.t * 2) % 2;
      g.fillStyle = s.fault ? (blink ? '#ffc2c6' : '#f0505a') : s.state === 'green' ? (s.permit ? '#f5b41a' : '#22b573') : s.permit ? '#f5b41a' : '#f0505a';
      g.beginPath(); g.arc(x, y, 7, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#ffffff'; g.lineWidth = 3; g.stroke();
      // arah
      g.fillStyle = '#5a7aa6'; g.font = '700 ' + Math.round(11 * this.fs) + 'px "JetBrains Mono", monospace'; g.textAlign = 'center'; g.fillText(s.id, x, y + (s.dir > 0 ? -12 : 20));
    }
    // trains
    for (const t of live) {
      const pts = t.points().reverse();
      const path = () => { g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); };
      g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = '#ffffff'; g.lineWidth = 17; path(); g.stroke();
      g.strokeStyle = t.crashed ? '#ff2d55' : t.type === 'stop' ? '#ff8a2a' : /Barang/.test(t.name) ? '#8a97ad' : '#3a8ef6';
      g.lineWidth = 12; path(); g.stroke();
      const [hx, hy] = L4G.at(t.path, t.s); const [bx, by] = L4G.at(t.path, t.s - 8);
      g.fillStyle = '#fff'; g.beginPath(); const ang = Math.atan2(hy - by, hx - bx); g.moveTo(hx + Math.cos(ang) * 7, hy + Math.sin(ang) * 7); g.lineTo(hx + Math.cos(ang + 2.4) * 7, hy + Math.sin(ang + 2.4) * 7); g.lineTo(hx + Math.cos(ang - 2.4) * 7, hy + Math.sin(ang - 2.4) * 7); g.fill();
      g.fillStyle = '#1d3f73'; g.font = '700 ' + Math.round(12 * this.fs) + 'px "JetBrains Mono", monospace'; g.textAlign = 'center';
      const lbl = t.name.split(' ').slice(0, 2).join(' ') + (t.phase === 'dwell' ? ` ⏱${Math.ceil(t.dwell)}` : '') + (t.waiting ? ' ⛔' : '');
      g.fillText(lbl, hx - (t.dir * t.L / 2), hy + (t.dir > 0 ? -14 : 24));
    }
    for (const f of this.fx) { g.strokeStyle = '#ff2d55'; g.lineWidth = 4; const r = 14 + (6 - f.t) * 6; g.globalAlpha = clamp(f.t / 6, 0, 1); g.beginPath(); g.arc(f.x, f.y, r, 0, Math.PI * 2); g.stroke(); g.globalAlpha = 1; }
  },
  segActive(k) {
    const s = this.sw;
    switch (k) {
      case 'SW1': return s.W1 === 'R'; case 'W12': return s.W1 === 'N'; case 'SW2': return s.W1 === 'N' && s.W2 === 'R';
      case 'SE1': return s.E1 === 'R'; case 'E21': return s.E1 === 'N'; case 'SE2': return s.E1 === 'N' && s.E2 === 'R';
      default: return true;
    }
  },
  routeSegs(sg) {
    const tr = sg.route.track, west = sg.kind === 'entry' ? sg.dir > 0 : sg.dir < 0;
    const th = west ? (tr === 1 ? ['SW1'] : tr === 2 ? ['W12'] : ['W12', 'SW2']) : (tr === 1 ? ['SE1'] : tr === 2 ? ['E21'] : ['E21', 'SE2']);
    return th.concat([sg.kind === 'entry' ? 'J' + tr : (west ? 'LW' : 'LE')]);
  },
  finish() {
    const s = this.st, n = s.delays.length;
    const otp = n ? s.onTime / n * 100 : 0;
    const otpScore = clamp(otp / 95 * 100, 0, 100);
    const safety = s.acc ? Math.max(0, 40 - (s.acc - 1) * 40) : 100;
    const fr = s.fault ? (s.fault.resp == null ? 999 : s.fault.resp) : 0;
    const faultScore = s.fault ? clamp(100 - Math.max(0, fr - 5) * 5, 0, 100) : 100;
    const eff = clamp(100 - s.wait * 1.2, 0, 100);
    const total = otpScore * .40 + safety * .35 + faultScore * .15 + eff * .10;
    const notes = [];
    if (s.acc) notes.push(`${s.acc} kecelakaan (KLB). Sebelum membuka sinyal, pastikan sepur tujuan kosong dan petak jalan tidak sedang dimasuki kereta dari arah berlawanan.`);
    if (otp < 95) notes.push('Siapkan rute lebih awal: arahkan kereta yang berhenti ke J1/J3 dan sisakan J2 untuk kereta langsung.');
    if (fr > 5 && s.fault) notes.push(`Gangguan sinyal ditanggapi setelah ${fr === 999 ? 'tidak ditanggapi' : Math.round(fr) + ' detik'}. Target: segera (≤ 5 detik).`);
    if (s.wait > 20) notes.push(`Total waktu kereta tertahan di sinyal masuk ${Math.round(s.wait)} detik.`);
    Game.finish(4, {
      score: total, notes,
      rows: [
        ['On-Time Performance', 40, `${pct(otp)} (${s.onTime}/${n})`, '≥ 95%', otpScore],
        ['Zero accident', 35, `${s.acc} KLB`, '0 insiden', safety],
        ['Penanganan gangguan sinyal', 15, s.fault ? (fr === 999 ? 'tidak ditangani' : `${Math.round(fr)} dtk`) : '–', '≤ 5 dtk', faultScore],
        ['Efisiensi (tertahan di sinyal masuk)', 10, `${Math.round(s.wait)} dtk`, 'minimal', eff],
      ],
    });
  },
};
function distSeg(px, py, x0, y0, x1, y1) { const dx = x1 - x0, dy = y1 - y0, l = dx * dx + dy * dy; let t = l ? ((px - x0) * dx + (py - y0) * dy) / l : 0; t = clamp(t, 0, 1); return Math.hypot(px - x0 - t * dx, py - y0 - t * dy); }
Levels[4] = L4;
