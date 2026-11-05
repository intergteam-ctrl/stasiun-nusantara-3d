/* ================= LEVEL 2 · TICKETING & ANNOUNCER ================= */
const L2_REASONS = {
  nama: 'Nama tiket ≠ KTP', nik: 'NIK tiket ≠ KTP', tanggal: 'Tanggal tiket bukan hari ini', berangkat: 'Kereta sudah berangkat', wajah: 'Wajah tidak cocok (face recognition)',
};
const L2_DEST = ['Bandung', 'Yogyakarta', 'Semarang Tawang', 'Surabaya Pasarturi', 'Solo Balapan', 'Cirebon', 'Purwokerto', 'Malang'];
const L2_TRAIN_NAMES = ['Nusantara Ekspres', 'Bengawan Senja', 'Pelangi Selatan', 'Lintas Merapi', 'Mutiara Pantura', 'Cakrawala', 'Rajawali Timur', 'Taruna Jaya', 'Sembrani Muda', 'Parahyangan Pagi'];
const L2_PRICE = { Eksekutif: [320000, 520000], Bisnis: [180000, 300000], Ekonomi: [90000, 190000] };

const L2 = {
  id: 2,
  brief: {
    intro: 'Anda bertugas di Loket 1 dan menjadi announcer stasiun, pukul 06.00–09.30. Penumpang datang untuk mencetak boarding pass, membeli tiket go-show, atau memakai e-boarding.',
    sop: [
      '<b>Verifikasi identitas:</b> nama dan NIK di tiket harus sama persis dengan KTP. Tanggal tiket harus hari ini dan kereta belum berangkat.',
      '<b>Face recognition:</b> pindai wajah penumpang. Kecocokan di bawah 80% berarti identitas tidak sah.',
      '<b>Atur antrean:</b> penumpang dengan e-boarding pass (QR) yang wajahnya sudah terdaftar cukup diarahkan ke Gate Face Recognition, tanpa dicetak ulang.',
      '<b>Go-show:</b> pilih kereta paling awal ke tujuan dan kelas yang diminta, yang masih punya kursi, dan berangkat paling cepat 10 menit lagi.',
      '<b>Pengumuman:</b> saat PPKA mengirim info, susun pengumuman (jenis, kereta, jalur, tujuan) sebelum batas waktu habis.',
    ],
    controls: ['Klik <b>Panggil antrean</b> untuk melayani penumpang berikutnya.', 'Gunakan tombol keputusan di bawah dokumen. Untuk go-show, klik baris kereta di papan jadwal.', 'Panel kanan: susun dan kirim pengumuman. Esc untuk jeda.'],
    kpi: [['Akurasi verifikasi identitas', '40%'], ['Pengumuman tepat & tepat waktu', '25%'], ['Kecepatan layanan & antrean', '20%'], ['Penjualan go-show tepat', '15%']],
  },
  start() {
    Game.setCanvas('none');
    this.today = new Date(); this.min = 360; this.end = 570; this.done = false; this.pickT = null; this.scanning = false;
    this.buildTimetable();
    this.queue = []; this.cur = null; this.arriveT = 0; this.served = [];
    this.st = { vOK: 0, vN: 0, gOK: 0, gN: 0, aOK: 0, aN: 0, svc: [], waits: [], late: 0, partial: 0 };
    this.ann = null; this.annQueue = []; this.buildAnnSchedule();
    for (let i = 0; i < 3; i++) this.queue.push(this.newCustomer());
    this.render();
  },
  cleanup() { Voice.stop(); },
  buildTimetable() {
    const names = shuffle(L2_TRAIN_NAMES.slice());
    const dests = shuffle(L2_DEST.slice());
    this.trains = [];
    let t = 375;
    for (let i = 0; i < 10; i++) {
      t += randi(16, 26);
      const dest = i < 8 ? dests[i] : pick(dests.slice(0, 5));
      const kelas = shuffle(['Eksekutif', 'Bisnis', 'Ekonomi']).slice(0, randi(1, 3));
      const seats = {}; kelas.forEach(k => seats[k] = chance(.22) ? 0 : randi(2, 40));
      const price = {}; kelas.forEach(k => price[k] = Math.round(rand(...L2_PRICE[k]) / 5000) * 5000);
      this.trains.push({ no: 'KA ' + (100 + i * 7 + randi(0, 6)), name: names[i], dest, dep: t, jalur: randi(1, 4), kelas, seats, price, delay: 0 });
    }
    // ensure duplicates of some destinations to make go-show decisions meaningful
    this.trains[8].dest = this.trains[2].dest; this.trains[9].dest = this.trains[4].dest;
  },
  buildAnnSchedule() {
    const list = this.trains.filter(t => t.dep - 8 > this.min + 6 && t.dep - 8 < this.end - 4).slice(0, 6);
    this.annSched = list.map(t => ({ at: t.dep - 8, train: t, jenis: 'Kedatangan' }));
    const d = pick(list.slice(1, 4)); if (d) this.annSched.push({ at: d.dep - 20, train: d, jenis: 'Keterlambatan', delay: 15 });
    this.annSched.sort((a, b) => a.at - b.at);
  },
  /* ---------- customers ---------- */
  newCustomer() {
    const roll = Math.random();
    const type = roll < .58 ? 'verif' : roll < .76 ? 'eticket' : 'goshow';
    const p = makePerson(); const c = { type, p, live: p.face, arrived: this.min, err: null, scanned: null };
    const future = this.trains.filter(t => t.dep > this.min + 12);
    if (type === 'goshow') {
      // pick a request that has an answer
      for (let k = 0; k < 30; k++) {
        const t = pick(future.length ? future : this.trains), kelas = pick(t.kelas);
        const after = chance(.35) ? Math.ceil((this.min + randi(15, 50)) / 30) * 30 : null;
        const ans = this.goshowAnswer(t.dest, kelas, after);
        if (ans) { c.req = { dest: t.dest, kelas, after }; break; }
      }
      if (!c.req) c.type = 'verif';
    }
    if (c.type !== 'goshow') {
      const t = pick(future.length ? future : this.trains), kelas = pick(t.kelas);
      c.tix = { code: Array.from({ length: 6 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[randi(0, 31)]).join(''), name: p.name, nik: p.nik, train: t, date: new Date(this.today), kelas, car: kelas.slice(0, 3).toUpperCase() + '-' + randi(1, 4), seat: randi(1, 16) + pick(['A', 'B', 'C', 'D']) };
      if (c.type === 'verif' && chance(.45)) {
        const opts = ['nama', 'nik', 'tanggal', 'wajah', 'berangkat'];
        const past = this.trains.filter(t => t.dep < this.min - 3);
        let e = pick(opts); if (e === 'berangkat' && !past.length) e = 'tanggal';
        c.err = e;
        if (e === 'nama') { const parts = p.name.split(' '); c.tix.name = parts.length > 1 ? parts[0] + ' ' + pick(NAMES.last.filter(l => l !== parts[1])) : pick(NAMES[p.sex].filter(n => n !== parts[0])); }
        if (e === 'nik') { const a = p.nik.split(''); const i = randi(8, 15); a[i] = String((+a[i] + randi(1, 8)) % 10); c.tix.nik = a.join(''); }
        if (e === 'tanggal') { const d = new Date(this.today); d.setDate(d.getDate() + (chance(.5) ? 1 : -1)); c.tix.date = d; }
        if (e === 'berangkat') c.tix.train = pick(past);
        if (e === 'wajah') { const f = makeFace(p.sex); if (!!p.face.hijab !== !!f.hijab) f.hijab = p.face.hijab ? pick(HIJAB) : null; c.live = f; }
      }
      if (c.type === 'eticket' && c.tix.train.dep <= this.min) c.tix.train = pick(future.length ? future : this.trains);
    }
    return c;
  },
  goshowAnswer(dest, kelas, after) {
    const ok = this.trains.filter(t => t.dest === dest && t.kelas.includes(kelas) && t.seats[kelas] > 0 && t.dep + t.delay >= this.min + 10 && (!after || t.dep >= after)).sort((a, b) => a.dep - b.dep);
    return ok[0] || null;
  },
  /* ---------- render ---------- */
  render() {
    UI.setHud(`<div class="topbar"><span class="chip title">Level 2 · Ticketing</span><span class="chip">Jam <b id="h2-clock">${clock(this.min)}</b></span><span class="chip" id="h2-q">Antrean <b>${this.queue.length}</b></span><span class="chip">Akurasi <b id="h2-acc">–</b></span><span class="spacer"></span><span class="chip mono">${tglIndo(this.today)}</span><button class="btn sm" id="b-pause">Jeda</button></div>
      <div class="l2">
        <div class="col"><div class="panel" style="padding:10px"><div class="eyebrow">Antrean loket</div><div class="queue" id="q2"></div></div>
          <div class="panel" style="padding:10px"><div class="eyebrow">Papan jadwal keberangkatan</div><div class="board-mini" id="tt2" style="margin-top:6px"></div></div></div>
        <div class="col"><div class="panel" id="desk" style="display:flex;flex-direction:column;gap:12px"></div></div>
        <div class="col"><div class="panel" id="annp"></div>
          <div class="panel" style="font-size:12.5px"><div class="eyebrow">Aturan verifikasi</div><ul class="sop" style="margin-top:6px;gap:4px">
          <li>Nama &amp; NIK tiket = KTP</li><li>Tanggal tiket = hari ini</li><li>Kereta belum berangkat</li><li>Face recognition ≥ 80%</li><li>E-boarding (QR) → Gate Face Recognition</li><li>Go-show: kereta paling awal, kursi tersedia, ≥ 10 menit sebelum berangkat</li></ul></div></div>
      </div>`);
    $('#b-pause').onclick = () => Game.pauseMenu();
    this.renderQueue(); this.renderTT(); this.renderDesk(); this.renderAnn();
  },
  renderQueue() {
    const q = $('#q2'); if (!q) return;
    q.innerHTML = this.queue.length ? '' : '<span class="muted" style="font-size:12px">Belum ada penumpang.</span>';
    this.queue.slice(0, 8).forEach((c, i) => {
      const d = document.createElement('div'); d.className = 'qp';
      d.appendChild(faceCanvas(c.live, 34, 34, '#e9f1f9'));
      const w = Math.floor(this.min - c.arrived);
      d.insertAdjacentHTML('beforeend', `<div style="min-width:0"><b>${i + 1}. ${c.type === 'goshow' ? 'Beli tiket' : c.type === 'eticket' ? 'Bawa QR' : 'Cetak tiket'}</b><div class="${w > 8 ? 'tag stop' : 'muted'}" style="font-size:11px">menunggu ${w} mnt</div></div>`);
      q.appendChild(d);
    });
    if (this.queue.length > 8) q.insertAdjacentHTML('beforeend', `<span class="muted" style="font-size:12px">+${this.queue.length - 8} lainnya</span>`);
    const hq = $('#h2-q'); if (hq) { hq.innerHTML = `Antrean <b>${this.queue.length}</b>`; hq.className = 'chip ' + (this.queue.length > 7 ? 'bad' : this.queue.length > 4 ? 'warn' : ''); }
  },
  renderTT() {
    const el = $('#tt2'); if (!el) return;
    const gs = this.cur && this.cur.type === 'goshow';
    el.innerHTML = `<div class="r" style="color:#bcd3f0"><span>JAM</span><span>KERETA · TUJUAN</span><span>JLR</span></div>` + this.trains.map((t, i) => {
      const gone = t.dep + t.delay <= this.min;
      const seats = t.kelas.map(k => `${k.slice(0, 3)} ${t.seats[k] ? t.seats[k] : 'HABIS'}${gs ? ' ' + rpShort(t.price[k]) : ''}`).join(' · ');
      return `<div class="r ${gone ? 'gone' : ''} ${gs && !gone ? 'pick' : ''} ${this.pickT === i ? 'sel' : ''}" data-ti="${i}"><span>${clock(t.dep)}${t.delay ? `<br><span style="color:#ffc2c6">+${t.delay}</span>` : ''}</span><span>${t.no} ${t.name}<br><span style="color:#e6edf5">${t.dest}</span><br><span style="color:#bcd3f0;font-size:10.5px">${seats}</span></span><span>${t.jalur}</span></div>`;
    }).join('');
    if (gs) $$('#tt2 [data-ti]').forEach(r => r.onclick = () => { const i = +r.dataset.ti; if (this.trains[i].dep + this.trains[i].delay <= this.min) return; this.pickT = i; Sfx.click(); this.renderTT(); this.renderDesk(); });
  },
  renderDesk() {
    const desk = $('#desk'); if (!desk) return;
    const c = this.cur;
    if (!c) {
      desk.innerHTML = `<div class="eyebrow">Loket 1</div><h3 class="disp">Loket siap melayani</h3><p class="muted">Panggil penumpang berikutnya. Antrean yang lama menurunkan kepuasan penumpang.</p><div class="btnrow"><button class="btn primary" id="b-next" ${this.queue.length ? '' : 'disabled'}>Panggil antrean berikutnya</button></div>`;
      $('#b-next').onclick = () => this.callNext();
      return;
    }
    const p = c.p;
    const ktp = `<div class="ktp"><h4>PROVINSI · ${esc(p.city.toUpperCase())}<br>KARTU TANDA PENDUDUK</h4><div class="rows">
      <div class="row"><span>NIK</span><span>:</span><b class="mono">${p.nik}</b></div>
      <div class="row"><span>Nama</span><span>:</span><b>${esc(p.name.toUpperCase())}</b></div>
      <div class="row"><span>Tgl Lahir</span><span>:</span><span>${tglShort(p.dob)}</span></div>
      <div class="row"><span>Jenis Kelamin</span><span>:</span><span>${p.sex === 'L' ? 'LAKI-LAKI' : 'PEREMPUAN'}</span></div>
      <div class="row"><span>Berlaku</span><span>:</span><span>SEUMUR HIDUP</span></div></div><span class="ph" id="ktp-ph"></span></div>`;
    let docs = '', speech = '', acts = '';
    if (c.type === 'goshow') {
      const r = c.req;
      speech = `“Pagi, Pak/Bu. Saya mau beli tiket ke <b>${r.dest}</b>, kelas <b>${r.kelas}</b>${r.after ? `, yang berangkat jam <b>${clock(r.after)}</b> atau sesudahnya` : ', yang paling cepat berangkat'}. Ini KTP saya.”`;
      const t = this.pickT != null ? this.trains[this.pickT] : null;
      docs = ktp + `<div class="tix"><div class="eyebrow" style="color:#b05a00">Penjualan go-show</div>${t ? `<dl class="kv" style="margin-top:6px"><dt>Kereta</dt><dd>${t.no} ${t.name}</dd><dt>Tujuan</dt><dd>${t.dest}</dd><dt>Berangkat</dt><dd>${clock(t.dep)} · Jalur ${t.jalur}</dd><dt>Kelas</dt><dd>${t.kelas.includes(r.kelas) ? r.kelas : `<span style="color:#c0262c">${r.kelas} tidak tersedia</span>`}</dd><dt>Harga</dt><dd>${t.kelas.includes(r.kelas) ? rp(t.price[r.kelas]) : '–'}</dd></dl>` : '<p style="margin-top:6px">Klik baris kereta di papan jadwal untuk memilih.</p>'}</div>`;
      acts = `<button class="btn primary" id="a-sell" ${t ? '' : 'disabled'}>Cetak tiket</button><button class="btn ghost" id="a-none">Tidak ada kereta yang memenuhi</button>`;
    } else if (c.type === 'eticket') {
      speech = '“Saya sudah check-in di aplikasi. Ini e-boarding pass saya, wajah sudah terdaftar.”';
      docs = ktp + this.ticketHTML(c, true);
      acts = `<button class="btn go" id="a-gate">Arahkan ke Gate Face Recognition</button><button class="btn" id="a-ok">Cetak ulang boarding pass</button><button class="btn stop" id="a-no">Tolak…</button>`;
    } else {
      speech = pick(['“Mau cetak boarding pass, Pak/Bu.”', '“Tolong cetak tiket saya, ya.”', '“Saya mau cetak tiket, ini kode booking dan KTP saya.”']);
      docs = ktp + this.ticketHTML(c, false);
      acts = `<button class="btn go" id="a-ok">Setujui &amp; cetak</button><button class="btn stop" id="a-no">Tolak…</button><button class="btn ghost" id="a-gate">Arahkan ke gate</button>`;
    }
    desk.innerHTML = `<div class="btnrow" style="justify-content:space-between;align-items:center"><div class="eyebrow">Loket 1 · melayani</div><span class="muted mono" style="font-size:12px">tiba ${clock(c.arrived)}</span></div>
      <div class="speech">${speech}</div>
      <div class="facecmp"><div id="livecam"></div><div style="display:flex;flex-direction:column;gap:6px"><span class="muted" style="font-size:12px">Kamera loket (wajah langsung)</span>
        ${c.type !== 'goshow' ? `<button class="btn sm" id="a-scan">${c.scanned != null ? 'Pindai ulang' : 'Pindai wajah'}</button><div class="match" id="match">${c.scanned != null ? this.matchHTML(c.scanned) : '<span class="muted" style="font-size:13px">Belum dipindai</span>'}</div>` : '<span class="tag">Go-show: verifikasi KTP manual</span>'}</div></div>
      <div class="docs">${docs}</div>
      <div class="btnrow">${acts}</div><div id="reasons" class="btnrow hide"></div>`;
    $('#livecam').appendChild(faceCanvas(c.live, 120, 120, '#cfe6f7'));
    const ph = $('#ktp-ph'); ph.appendChild(faceCanvas(p.face, 70, 86, '#d23b3b'));
    const on = (id, f) => { const e = $('#' + id); if (e) e.onclick = f; };
    on('a-scan', () => this.scan());
    on('a-ok', () => this.decide('ok'));
    on('a-gate', () => this.decide('gate'));
    on('a-no', () => this.showReasons());
    on('a-sell', () => this.sell());
    on('a-none', () => this.sell(true));
  },
  ticketHTML(c, e) {
    const t = c.tix;
    return `<div class="tix"><div class="btnrow" style="justify-content:space-between"><span class="eyebrow" style="color:#b05a00">${e ? 'E-boarding pass' : 'Kode booking'}</span><span class="bk">${t.code}</span></div>
      <dl class="kv" style="margin-top:6px"><dt>Nama</dt><dd>${esc(t.name.toUpperCase())}</dd><dt>NIK</dt><dd class="mono">${t.nik}</dd><dt>Kereta</dt><dd>${t.train.no} ${t.train.name}</dd><dt>Tujuan</dt><dd>${t.train.dest}</dd>
      <dt>Tanggal</dt><dd>${tglShort(t.date)}</dd><dt>Berangkat</dt><dd>${clock(t.train.dep)}</dd><dt>Kelas/Kursi</dt><dd>${t.kelas} · ${t.car} / ${t.seat}</dd></dl>
      ${e ? '<div style="margin-top:6px;display:grid;grid-template-columns:repeat(9,6px);gap:1px">' + Array.from({ length: 81 }, () => `<i style="width:6px;height:6px;background:${chance(.5) ? '#10233d' : 'transparent'}"></i>`).join('') + '</div>' : ''}</div>`;
  },
  matchHTML(v) { return `<span style="color:${v >= 80 ? 'var(--go)' : 'var(--stop)'}">${v}%</span> <span style="font-size:12px" class="muted">${v >= 80 ? 'COCOK' : 'TIDAK COCOK'}</span>`; },
  scan() {
    const c = this.cur; if (!c || this.scanning) return;
    this.scanning = true; $('#match').innerHTML = '<span class="muted" style="font-size:13px">Memindai…</span>'; Sfx.tone(1200, .5, 'sine', .04);
    setTimeout(() => {
      this.scanning = false; if (this.cur !== c) return;
      c.scanned = c.live === c.p.face ? randi(86, 99) : randi(28, 58);
      const m = $('#match'); if (m) m.innerHTML = this.matchHTML(c.scanned);
      const b = $('#a-scan'); if (b) b.textContent = 'Pindai ulang';
    }, 1100);
    this.min += 0.3;
  },
  showReasons() {
    const r = $('#reasons'); r.classList.remove('hide');
    r.innerHTML = '<span class="muted" style="width:100%;font-size:12px">Pilih alasan penolakan:</span>' + Object.entries(L2_REASONS).map(([k, v]) => `<button class="btn sm stop" data-r="${k}">${v}</button>`).join('');
    $$('[data-r]').forEach(b => b.onclick = () => this.decide('no', b.dataset.r));
  },
  callNext() {
    if (!this.queue.length) return;
    this.cur = this.queue.shift(); this.cur.start = this.min; this.pickT = null;
    this.st.waits.push(this.min - this.cur.arrived);
    Sfx.chime(); this.renderQueue(); this.renderTT(); this.renderDesk();
  },
  closeCur() { this.st.svc.push(this.min - this.cur.start); this.cur = null; this.pickT = null; this.renderTT(); this.renderDesk(); this.renderQueue(); this.updAcc(); },
  decide(action, reason) {
    const c = this.cur; if (!c) return;
    let ok = false, msg = '';
    if (c.type === 'eticket') {
      if (action === 'gate') { ok = true; msg = 'Tepat. Penumpang e-boarding langsung ke gate, antrean loket berkurang.'; }
      else if (action === 'ok') { ok = true; this.st.partial++; msg = 'Boarding pass dicetak ulang. Sah, tapi seharusnya cukup diarahkan ke gate.'; }
      else { msg = 'Penumpang e-boarding ini sah. Penolakan keliru memicu komplain.'; }
      this.st.vN++; if (ok) this.st.vOK += action === 'gate' ? 1 : .6;
    } else {
      this.st.vN++;
      if (action === 'gate') { msg = 'Penumpang ini belum punya e-boarding. Ia kembali mengantre dengan kesal.'; }
      else if (!c.err && action === 'ok') { ok = true; msg = 'Data sesuai. Boarding pass dicetak.'; this.st.vOK++; }
      else if (!c.err && action === 'no') { msg = 'Penolakan keliru: semua data penumpang ini sesuai.'; }
      else if (c.err && action === 'ok') { msg = `Lolos padahal bermasalah: ${L2_REASONS[c.err]}.`; }
      else if (c.err && action === 'no') {
        if (reason === c.err) { ok = true; this.st.vOK++; msg = `Penolakan tepat: ${L2_REASONS[c.err]}.`; }
        else { this.st.vOK += .5; msg = `Benar ditolak, tapi alasannya: ${L2_REASONS[c.err]}.`; }
      }
    }
    ok ? Sfx.ok() : Sfx.bad();
    UI.toast(msg, ok ? 'good' : 'bad', 3200);
    this.closeCur();
  },
  sell(none) {
    const c = this.cur, t = none ? null : this.trains[this.pickT], r = c.req;
    const ans = this.goshowAnswer(r.dest, r.kelas, r.after);
    this.st.gN++;
    if (!ans || !t) {
      if (!ans && !t) { this.st.gOK++; Sfx.ok(); UI.toast('Tepat. Tidak ada kereta yang memenuhi; penumpang ditawari alternatif jadwal.', 'good', 3200); }
      else if (!ans) { Sfx.bad(); UI.toast('Tidak ada kereta yang memenuhi permintaan ini. Seharusnya tawarkan alternatif, bukan menjual tiket.', 'bad', 4000); }
      else { Sfx.bad(); UI.toast(`Masih ada kereta yang memenuhi: ${ans.no} ${ans.name} pukul ${clock(ans.dep)}.`, 'bad', 4000); }
      this.closeCur(); return;
    }
    if (t === ans) { this.st.gOK++; t.seats[r.kelas]--; Sfx.cash(); UI.toast(`Tiket terjual: ${t.no} ${t.name} · ${r.kelas} · ${rp(t.price[r.kelas])}.`, 'good', 3200); }
    else {
      Sfx.bad();
      let why = 'bukan pilihan paling tepat';
      if (t.dest !== r.dest) why = 'tujuannya salah'; else if (!t.kelas.includes(r.kelas)) why = `tidak ada kelas ${r.kelas}`; else if (!t.seats[r.kelas]) why = 'kursi kelas itu sudah habis'; else if (t.dep + t.delay < this.min + 10) why = 'penjualan sudah ditutup (< 10 menit)'; else if (r.after && t.dep < r.after) why = 'berangkat sebelum jam yang diminta';
      UI.toast(`Kurang tepat: ${why}. Seharusnya ${ans.no} ${ans.name} pukul ${clock(ans.dep)}.`, 'bad', 4200);
    }
    this.closeCur();
  },
  updAcc() {
    const n = this.st.vN + this.st.gN, ok = this.st.vOK + this.st.gOK;
    const e = $('#h2-acc'); if (e) e.textContent = n ? pct(ok / n * 100) : '–';
  },
  /* ---------- announcements ---------- */
  renderAnn() {
    const el = $('#annp'); if (!el) return;
    const a = this.ann;
    if (!a) { el.innerHTML = `<div class="eyebrow">Ruang announcer</div><p class="muted" style="font-size:13px;margin-top:6px">Menunggu informasi dari PPKA. ${this.annSched.length ? `Info berikutnya ± pukul ${clock(this.annSched[0].at)}.` : 'Tidak ada lagi jadwal pengumuman.'}</p>`; return; }
    const t = a.train;
    const opt = (id, arr, lbl) => `<div class="field"><label for="${id}">${lbl}</label><select id="${id}" class="inp"><option value="">— pilih —</option>${arr.map(v => `<option>${v}</option>`).join('')}</select></div>`;
    el.innerHTML = `<div class="btnrow" style="justify-content:space-between;align-items:center"><div class="eyebrow">Radio PPKA</div><span class="tag warn mono" id="ann-t">${Math.ceil(a.left)} dtk</span></div>
      <div class="speech" style="margin:8px 0">${a.jenis === 'Keterlambatan' ? `“Info: <b>${t.no} ${t.name}</b> tujuan ${t.dest} terlambat <b>${a.delay} menit</b> karena gangguan di petak jalan sebelumnya.”` : `“Info: <b>${t.no} ${t.name}</b> tujuan <b>${t.dest}</b> akan masuk <b>jalur ${t.jalur}</b>, berangkat ${clock(t.dep + t.delay)}.”`}</div>
      <div style="display:grid;gap:8px">${opt('an-j', ['Kedatangan', 'Keberangkatan', 'Keterlambatan'], 'Jenis pengumuman')}${opt('an-k', this.trains.map(x => x.name), 'Kereta')}${opt('an-l', ['1', '2', '3', '4'], 'Jalur')}${opt('an-d', L2_DEST, 'Tujuan')}
      <button class="btn primary" id="an-go">Umumkan</button></div>`;
    $('#an-go').onclick = () => this.announce();
  },
  announce() {
    const a = this.ann; if (!a) return;
    const j = $('#an-j').value, k = $('#an-k').value, l = $('#an-l').value, d = $('#an-d').value, t = a.train;
    let errs = [];
    if (j !== a.jenis) errs.push('jenis');
    if (k !== t.name) errs.push('kereta');
    if (d !== t.dest) errs.push('tujuan');
    if (a.jenis !== 'Keterlambatan' && l !== String(t.jalur)) errs.push('jalur');
    const kname = k || '…', dname = d || '…';
    let text;
    if (j === 'Keterlambatan') text = `Perhatian, perhatian. Kepada para penumpang kereta api ${kname} tujuan ${dname}, kami informasikan kereta mengalami keterlambatan sekitar ${a.delay || 15} menit. Kami mohon maaf atas ketidaknyamanan ini.`;
    else if (j === 'Keberangkatan') text = `Perhatian, perhatian. Kereta api ${kname} tujuan ${dname} di jalur ${l ? terbilangAngka(+l) : '…'} akan segera diberangkatkan. Penumpang dimohon segera naik ke kereta.`;
    else text = `Perhatian, perhatian. Dari arah barat akan masuk di jalur ${l ? terbilangAngka(+l) : '…'}, kereta api ${kname} tujuan ${dname}. Para penumpang dimohon berdiri di belakang garis aman peron.`;
    Sfx.chime(); setTimeout(() => Voice.say(text), 1300);
    this.st.aN++;
    if (!errs.length) { this.st.aOK++; UI.toast('Pengumuman tepat dan tepat waktu.', 'good'); }
    else { this.st.aOK += errs.length === 1 ? .4 : 0; UI.toast(`Pengumuman keliru pada: ${errs.join(', ')}. Penumpang bingung di peron.`, 'bad', 3500); }
    this.ann = null; this.renderAnn();
  },
  /* ---------- loop ---------- */
  update(dt) {
    this.min += dt; // 1 detik nyata = 1 menit permainan
    const ck = $('#h2-clock'); if (ck) ck.textContent = clock(this.min);
    // arrivals: lebih padat 07.00–08.15
    const peak = this.min > 420 && this.min < 495;
    this.arriveT -= dt;
    if (this.arriveT <= 0) { this.arriveT = peak ? rand(5, 9) : rand(9, 15); if (this.queue.length < 14) { this.queue.push(this.newCustomer()); this.renderQueue(); } }
    if (Math.floor(this.min) !== this._lastMin) { this._lastMin = Math.floor(this.min); this.renderQueue(); if (this._lastMin % 5 === 0) this.renderTT(); }
    // announcements
    if (!this.ann && this.annSched.length && this.min >= this.annSched[0].at) {
      this.ann = this.annSched.shift(); this.ann.left = 30;
      if (this.ann.jenis === 'Keterlambatan') { this.ann.train.delay = this.ann.delay; this.renderTT(); }
      Sfx.alarm(); UI.toast('Radio PPKA: ada informasi untuk diumumkan.', 'warn'); this.renderAnn();
    }
    if (this.ann) {
      this.ann.left -= dt; const e = $('#ann-t'); if (e) e.textContent = Math.ceil(this.ann.left) + ' dtk';
      if (this.ann.left <= 0) { this.st.aN++; this.st.late++; UI.toast('Pengumuman terlambat! Penumpang tidak mendapat informasi.', 'bad'); this.ann = null; this.renderAnn(); }
    }
    if (this.min >= this.end) this.finish();
  },
  finish() {
    if (this.done) return; this.done = true;
    const s = this.st;
    const leftQ = this.queue.length + (this.cur ? 1 : 0);
    const verN = s.vN, verAcc = verN ? s.vOK / verN * 100 : 0;
    const annAcc = s.aN ? s.aOK / s.aN * 100 : 100;
    const gsAcc = s.gN ? s.gOK / s.gN * 100 : 50;
    const avgSvc = s.svc.length ? s.svc.reduce((a, b) => a + b, 0) / s.svc.length : 10;
    const allWaits = s.waits.concat(this.queue.map(c => this.min - c.arrived));
    const avgWait = allWaits.length ? allWaits.reduce((a, b) => a + b, 0) / allWaits.length : 0;
    const speed = clamp(100 - Math.max(0, avgSvc - 3) * 12 - Math.max(0, avgWait - 8) * 4 - leftQ * 3, 0, 100);
    const volume = clamp((verN + s.gN) / 18, 0, 1);
    const verScore = verAcc * (.6 + .4 * volume);
    const total = verScore * .40 + annAcc * .25 + speed * .20 + gsAcc * .15;
    const notes = [];
    if (verAcc < 90) notes.push('Bandingkan nama dan NIK karakter demi karakter, cek tanggal di tiket, dan pindai wajah sebelum memutuskan.');
    if (s.partial) notes.push(`${s.partial} penumpang e-boarding dicetak ulang. Arahkan mereka ke Gate Face Recognition agar antrean cepat terurai.`);
    if (s.late) notes.push(`${s.late} pengumuman tidak sempat disiarkan.`);
    if (avgWait > 8) notes.push(`Rata-rata menunggu ${avgWait.toFixed(1)} menit. Layani lebih cepat saat jam sibuk 07.00–08.15.`);
    if (verN + s.gN < 12) notes.push(`Hanya ${verN + s.gN} penumpang terlayani selama shift.`);
    Game.finish(2, {
      score: total, notes,
      rows: [
        ['Akurasi verifikasi identitas', 40, `${pct(verAcc)} dari ${verN} penumpang`, '≥ 95%', verScore],
        ['Pengumuman', 25, `${s.aOK.toFixed(1).replace('.0', '')}/${s.aN} tepat`, '100%', annAcc],
        ['Kecepatan layanan & antrean', 20, `layanan ${avgSvc.toFixed(1)} mnt · tunggu ${avgWait.toFixed(1)} mnt`, '≤ 3 · ≤ 8 mnt', speed],
        ['Penjualan go-show', 15, `${s.gOK}/${s.gN} tepat`, '100%', gsAcc],
      ],
    });
  },
};
Levels[2] = L2;
