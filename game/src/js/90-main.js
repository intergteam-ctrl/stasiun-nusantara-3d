/* ================= GAME SHELL ================= */
const CAREER = [
  { lv: 1, jab: 'OB / Cleaning Service', tugas: 'Menjaga kebersihan peron, toilet, hall utama, dan interior gerbong.', mek: 'Mini-game menyapu, membersihkan noda air, membuang sampah, dan menyiapkan sanitasi gerbong sebelum kereta berangkat (turnaround time).' },
  { lv: 2, jab: 'Petugas Ticketing & Announcer', tugas: 'Melayani cetak tiket, verifikasi identitas (Face Recognition/KTP), dan pengumuman.', mek: 'Management puzzle: memeriksa kesesuaian identitas penumpang, mengatur antrean, dan memberikan pengumuman kedatangan/keberangkatan.' },
  { lv: 3, jab: 'Conductor (Kondektur) & PTP', tugas: 'Mengawal perjalanan kereta dan pelayanan penumpang di dalam gerbong.', mek: 'Boarding check, penanganan Lost & Found, serta merespons komplain atau keadaan darurat penumpang.' },
  { lv: 4, jab: 'PPKA (Pengatur Perjalanan Kereta Api)', tugas: 'Mengatur sinyal, wesel, dan lalu lintas jalur kereta api di area stasiun.', mek: 'Real-time strategy: menggeser tuas sinyal dan wesel agar kereta tidak bentrok (deadlock atau kecelakaan jalur).' },
  { lv: 5, jab: 'Kepala Stasiun (Station Master)', tugas: 'Mengelola anggaran, performa staf, fasilitas stasiun, dan kepuasan penumpang.', mek: 'Management & tycoon: alokasi dana maintenance, rekrut staf, upgrade fasilitas, dan menghadapi inspeksi Daop.' },
];

const PASS_SCORE = 75;

const Game = {
  level: null, paused: false, last: 0, titleView: null,
  boot() {
    Save.load(); UI.init(); GL.init();
    const mkTitle = () => { if (GL.ok && !this.titleView) { this.titleView = makeTitleScene(); if (!this.level) GL.use(this.titleView); } };
    let fontsP = Promise.resolve();
    try { if (document.fonts && document.fonts.load) fontsP = Promise.all(['700 64px "Fredoka"', '600 20px "Nunito"'].map(f => document.fonts.load(f))); } catch (e) { }
    Promise.race([fontsP, new Promise(r => setTimeout(r, 1800))]).catch(() => { }).then(mkTitle);
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && this.level && !UI.modalOpen) this.pauseMenu();
      this.level && this.level.key && !this.paused && !UI.modalOpen && this.level.key(e);
    });
    document.addEventListener('pointerdown', () => Sfx.ensure(), { once: true });
    Online.init();
    const start = () => { this.title(); requestAnimationFrame(t => this.loop(t)); };
    window.claude?.hot?.ready ? window.claude.hot.ready(start) : start();
  },
  loop(t) {
    const dt = Math.min(.05, (t - (this.last || t)) / 1000); this.last = t;
    try {
      if (this.level) { if (!this.paused && !this.level.modalPause) this.level.update(dt); else if (this.level.idle) this.level.idle(dt); }
      else if (this.titleView && GL.view === this.titleView) this.titleView.update(dt);
      if (GL.ok) MK.tick(dt);
      GL.render();
    } catch (e) { console.error(e); }
    requestAnimationFrame(t2 => this.loop(t2));
  },
  setCanvas(mode) { // 'gl' | 'ppka' | 'none'
    GL.active = mode === 'gl';
    $('#gl').classList.toggle('hide', mode !== 'gl');
    $('#ppka').classList.toggle('hide', mode !== 'ppka');
  },
  toTitleView() { this.setCanvas('gl'); if (GL.ok && this.titleView) GL.use(this.titleView); },
  exitLevel() {
    if (this.level) { Online.levelQuit(this.level); try { this.level.cleanup && this.level.cleanup(); } catch (e) { console.error(e); } }
    Online.unseed(); this.daily = null;
    this.level = null; this.paused = false; UI.setHud(''); UI.closeModal(); Voice.stop(); this.toTitleView();
  },

  /* ---------- screens ---------- */
  title() {
    this.exitLevel();
    const d = Save.data;
    UI.screen(`<div class="screen center"><div class="title-wrap">
      <div class="board"><span class="km">KM 0+000</span><span class="elev">+7 m</span>
        <div class="sub">Simulasi Karier &amp; Manajemen Kereta Api Indonesia</div>
        <h1>Stasiun <span>Nusantara</span></h1>
        <div class="badge3d">3D</div>
        <div class="legs" style="left:22%"></div><div class="legs" style="right:22%"></div>
      </div>
      <div class="menu panel">
        <div class="field"><label for="pname">Nama pegawai</label><input id="pname" maxlength="28" placeholder="Tulis nama Anda" value="${esc(d.name)}"></div>
        <button class="btn primary" id="b-start">${d.runs ? 'Lanjutkan Karier' : 'Mulai Karier dari OB'}</button>
        ${Online.enabled ? '<button class="btn daily" id="b-daily">Tantangan Harian 🏆</button>' : ''}
        <button class="btn" id="b-guide">Buku Panduan (GDD)</button>
        ${window.SN_APK_URL && !IS_APP ? `<a class="btn" href="${window.SN_APK_URL}" download style="text-decoration:none">Unduh APK Android</a>` : ''}
        <div class="btnrow">
          <button class="btn sm ghost" id="b-snd">Suara: ${d.settings.sound ? 'Aktif' : 'Mati'}</button>
          <button class="btn sm ghost" id="b-voice">Suara pengumuman: ${d.settings.voice ? 'Aktif' : 'Mati'}</button>
          <button class="btn sm ghost" id="b-reset">Reset progres</button>
          ${Online.enabled ? `<button class="btn sm ghost" id="b-fb">Beri masukan</button><button class="btn sm ghost" id="b-tel">Data anonim: ${d.settings.telemetry === false ? 'Mati' : 'Aktif'}</button>` : ''}
        </div>
        ${Online.enabled ? '<p class="muted" style="font-size:11.5px">Game mengirim data permainan anonim (level, skor, durasi; tanpa nama atau email) untuk perbaikan. Bisa dimatikan lewat tombol Data anonim.</p>' : ''}
        ${GL.ok ? '' : '<p class="muted" style="font-size:12px">Perangkat ini tidak mendukung WebGL. Level 1 membutuhkan grafis 3D; level lain tetap bisa dimainkan.</p>'}
      </div></div></div>`);
    const nm = $('#pname');
    const saveName = () => { d.name = nm.value.trim(); Save.write(); };
    nm.addEventListener('change', saveName);
    $('#b-start').onclick = () => { Sfx.click(); saveName(); if (!d.name) { d.name = 'Pegawai Baru'; } d.runs++; Save.write(); this.career(); };
    $('#b-guide').onclick = () => { Sfx.click(); this.guide(); };
    const bd = $('#b-daily'); if (bd) bd.onclick = () => { Sfx.click(); saveName(); this.dailyScreen(); };
    const bf = $('#b-fb'); if (bf) bf.onclick = () => this.feedback('menu', 0);
    const bt = $('#b-tel'); if (bt) bt.onclick = () => { d.settings.telemetry = d.settings.telemetry === false; if (d.settings.telemetry === false) Online.q = []; Save.write(); this.title(); };
    $('#b-snd').onclick = () => { d.settings.sound = !d.settings.sound; Save.write(); this.title(); };
    $('#b-voice').onclick = () => { d.settings.voice = !d.settings.voice; Save.write(); this.title(); };
    $('#b-reset').onclick = () => UI.modal({ title: 'Reset progres karier?', html: '<p>Semua level kembali terkunci dan nilai terbaik dihapus.</p>', buttons: [{ label: 'Batal' }, { label: 'Reset', cls: 'stop', onClick: () => { Save.reset(); this.title(); } }] });
  },
  nipp() { let h = 0; for (const c of (Save.data.name || 'x')) h = (h * 31 + c.charCodeAt(0)) >>> 0; return String(h % 900000 + 100000) + '3'; },
  career() {
    this.exitLevel();
    const d = Save.data;
    const rows = CAREER.map(c => {
      const open = c.lv <= d.unlocked, best = d.best[c.lv];
      return `<div class="rung ${open ? '' : 'locked'}">
        <div class="lv">${c.lv}</div>
        <div class="meta"><b>${c.jab}</b><span class="muted">${c.tugas}</span><span style="font-size:12.5px">${c.mek}</span></div>
        <div class="act btnrow" style="align-items:center">${gradeBadge(best ? best.grade : null)}
          <button class="btn ${open ? 'primary' : ''}" data-lv="${c.lv}" ${open ? '' : 'disabled'}>${open ? (best ? 'Main lagi' : 'Mulai') : 'Terkunci'}</button></div>
      </div>`;
    }).reverse().join('');
    UI.screen(`<div class="screen"><div class="sheet">
      <div class="btnrow" style="justify-content:space-between;align-items:center">
        <div><div class="eyebrow">Jenjang karier staf · Bab 1.1</div><h2 class="disp">Kartu Karier ${esc(d.name || 'Pegawai')}</h2>
        <p class="muted mono" style="font-size:12px">NIPP ${this.nipp()} · Daop Nusantara · Lulus level jika skor ≥ ${PASS_SCORE} (Grade B)</p></div>
        <div class="btnrow"><button class="btn" id="b-guide">Panduan</button><button class="btn ghost" id="b-back">Menu utama</button></div>
      </div>
      <div class="ladder">${rows}</div>
    </div></div>`);
    $$('[data-lv]').forEach(b => b.onclick = () => { Sfx.click(); this.brief(+b.dataset.lv); });
    $('#b-back').onclick = () => this.title();
    $('#b-guide').onclick = () => this.guide('career');
  },
  guide(back = 'title', tab = 0) {
    const tabs = ['Bab 1 · Karier', 'Bab 2 · Kebersihan', 'Bab 3 · Ekonomi', 'Bab 4 · Krisis', 'Bab 5 · KPI Daop'];
    const body = [
      `<p>Stasiun Nusantara 3D adalah simulasi manajemen dan alur karier staf perkeretaapian Indonesia bergaya 3D low-poly. Pemain merintis karier dari staf operasional paling bawah hingga Kepala Stasiun.</p>
       <div class="tbl-wrap"><table class="t"><tr><th>Level &amp; Jabatan</th><th>Tugas utama</th><th>Mekanik</th></tr>${CAREER.map(c => `<tr><td><b>Level ${c.lv}</b><br>${c.jab}</td><td>${c.tugas}</td><td>${c.mek}</td></tr>`).join('')}</table></div>`,
      `<p>OB adalah fondasi kenyamanan stasiun. Kebersihan yang buruk menurunkan rating kepuasan penumpang secara drastis.</p>
       <ul class="sop"><li><b>Persiapan alat (shift pagi):</b> ambil troli di Ruang Janitor. Pastikan cairan pembersih, kain mikrofiber, sapu, pendorong air (wiper), dan plastik sampah terisi penuh.</li>
       <li><b>Siklus kebersihan area:</b> bersihkan toilet, ganti tisu, sapu sampah di hall/peron, keringkan tumpahan air sebelum penumpang terpeleset.</li>
       <li><b>Turnaround gerbong:</b> waktu terbatas 10–15 menit untuk mengambil sampah di kantong kursi, menyapu lorong, membersihkan toilet kereta, dan merapikan sandaran kursi.</li></ul>`,
      `<p>Sebagai Kepala Stasiun, sudut pandang berubah menjadi isometric tycoon: arus kas, anggaran operasional, SDM, dan fasilitas.</p>
       <h3 class="disp" style="margin-top:12px">Arus pendapatan</h3>
       <ul class="sop"><li><b>Passenger pass-through fee:</b> komisi harian per penumpang yang boarding atau transit.</li><li><b>Sewa tenant &amp; retail:</b> sewa bulanan gerai UMKM, minimarket, kopi, ATM center.</li><li><b>Parkir &amp; drop-off zone:</b> retribusi kendaraan menginap atau jemput-antar.</li><li><b>Subsidi &amp; bonus performa Daop:</b> insentif bila OTP dan kebersihan mencapai target.</li></ul>
       <h3 class="disp" style="margin-top:12px">Pohon upgrade</h3>
       <div class="tbl-wrap"><table class="t"><tr><th>Tier</th><th>Fasilitas</th><th>Kapasitas</th></tr>
       <tr><td>Tier 1 · Stasiun Kelas III</td><td>Bangunan kayu, 1 peron jalur, kursi kayu, loket manual, toilet dasar</td><td class="num">500/hari</td></tr>
       <tr><td>Tier 2 · Stasiun Kelas II</td><td>Gate e-ticket otomatis, face recognition scanner, canopy roof peron, tenant food court, pos kesehatan</td><td class="num">3.000/hari</td></tr>
       <tr><td>Tier 3 · Stasiun Utama</td><td>Executive VIP lounge, skybridge &amp; garbarata, CTC centralized traffic control, parkir bertingkat</td><td class="num">&gt; 15.000/hari</td></tr></table></div>`,
      `<p>Kepala Stasiun wajib merespons krisis real-time dengan SLA waktu terbatas.</p>
       <div class="tbl-wrap"><table class="t"><tr><th>Krisis</th><th>Biaya</th><th>Personel kunci</th><th>SLA</th><th>Dampak gagal</th></tr>
       <tr><td>Cuaca ekstrem &amp; banjir rel</td><td class="num">Rp 15.000.000</td><td>OB &amp; PPKA</td><td>5 menit</td><td>Kereta anjlok / cancel jadwal massal</td></tr>
       <tr><td>Blackout listrik stasiun</td><td class="num">Rp 8.000.000</td><td>Teknisi &amp; Polsuska</td><td>1 menit</td><td>Antrean gate mati &amp; kerusuhan hall</td></tr>
       <tr><td>Lonjakan mudik Lebaran</td><td class="num">Rp 25.000.000</td><td>Seluruh staf</td><td>Peak season</td><td>Rating stasiun anjlok ke Grade D</td></tr></table></div>
       <p class="muted" style="margin-top:8px">Dalam game, jam krisis berjalan 6× lebih cepat: SLA 5 menit = 50 detik nyata, 1 menit = 10 detik nyata.</p>`,
      `<p>Setiap akhir bulan, auditor Daop menilai Kepala Stasiun berdasarkan 4 pilar KPI (skala 100).</p>
       <div class="tbl-wrap"><table class="t"><tr><th>Kategori</th><th>Bobot</th><th>Indikator</th><th>Target minimum</th></tr>
       <tr><td>Operasional &amp; Keselamatan</td><td class="num">35%</td><td>OTP, zero accident, kecepatan penanganan gangguan sinyal</td><td>OTP ≥ 95%, 0 insiden</td></tr>
       <tr><td>Kebersihan &amp; Fasilitas</td><td class="num">25%</td><td>Audit toilet/peron, air/listrik, higienitas tenant</td><td>Kebersihan ≥ 90%</td></tr>
       <tr><td>Keuangan &amp; Komersial</td><td class="num">20%</td><td>Target tiket/parkir, okupansi tenant, efisiensi anggaran</td><td>Target finansial ≥ 100%</td></tr>
       <tr><td>Kepuasan Penumpang</td><td class="num">20%</td><td>CSAT aplikasi, penyelesaian komplain, Lost &amp; Found</td><td>CSAT ≥ 4,2 / 5,0</td></tr></table></div>
       <div class="grid2" style="margin-top:12px">${Object.entries(GRADES).map(([g, v]) => `<div class="panel" style="display:flex;gap:10px;align-items:flex-start">${gradeBadge(g)}<div><b>${g === 'A' ? '90–100' : g === 'B' ? '75–89' : g === 'C' ? '60–74' : '&lt; 60'}</b><p class="muted" style="font-size:13px">${v.reward}</p></div></div>`).join('')}</div>`,
    ];
    UI.screen(`<div class="screen"><div class="sheet">
      <div class="btnrow" style="justify-content:space-between;align-items:center"><div><div class="eyebrow">Game Design Document &amp; Guideline Operasional</div><h2 class="disp">Buku Panduan</h2></div><button class="btn" id="b-back">Kembali</button></div>
      <div class="tabs">${tabs.map((t, i) => `<button class="tab ${i === tab ? 'on' : ''}" data-t="${i}">${t}</button>`).join('')}</div>
      <div class="panel" style="display:flex;flex-direction:column;gap:10px">${body[tab]}</div></div></div>`);
    $$('[data-t]').forEach(b => b.onclick = () => this.guide(back, +b.dataset.t));
    $('#b-back').onclick = () => back === 'career' ? this.career() : this.title();
  },
  brief(lv, daily = null) {
    const L = Levels[lv], c = CAREER[lv - 1];
    if (lv === 1 && !GL.ok) { UI.toast('Level 1 membutuhkan WebGL (grafis 3D).', 'bad'); return; }
    UI.screen(`<div class="screen"><div class="sheet">
      <div><div class="eyebrow">${daily ? 'Tantangan harian · ' : ''}Level ${lv} · Briefing shift</div><h2 class="disp">${c.jab}</h2><p class="muted" style="margin-top:6px;max-width:70ch">${L.brief.intro}</p></div>
      <div class="grid2">
        <div class="panel"><h3 class="disp">Prosedur (SOP)</h3><ul class="sop" style="margin-top:10px">${L.brief.sop.map(s => `<li>${s}</li>`).join('')}</ul></div>
        <div class="panel"><h3 class="disp">Kontrol</h3><ul class="sop" style="margin-top:10px">${L.brief.controls.map(s => `<li>${s}</li>`).join('')}</ul>
          <h3 class="disp" style="margin-top:16px">Penilaian</h3><div class="tbl-wrap"><table class="t" style="min-width:0;margin-top:6px">${L.brief.kpi.map(k => `<tr><td>${k[0]}</td><td class="num">${k[1]}</td></tr>`).join('')}</table></div></div>
      </div>
      <div class="btnrow"><button class="btn primary" id="b-go">Mulai shift</button><button class="btn ghost" id="b-back">Kembali ke kartu karier</button></div>
    </div></div>`);
    $('#b-go').onclick = () => { Sfx.click(); this.start(lv, daily); };
    $('#b-back').onclick = () => daily ? this.dailyScreen() : this.career();
  },
  start(lv, daily = null) {
    this.exitLevel(); UI.clearScreen();
    this.daily = daily; if (daily) Online.seed(daily.seed);
    this.level = Levels[lv]; this.paused = false;
    Online.levelStart(lv, daily);
    this.level.start();
  },
  pauseMenu() {
    if (!this.level) return;
    this.paused = true;
    UI.modal({
      title: 'Jeda', html: '<p class="muted">Permainan dihentikan sementara.</p>',
      buttons: [{ label: 'Lanjutkan', cls: 'primary', onClick: () => this.paused = false },
      { label: 'Ulangi level', onClick: () => this.start(this.level.id, this.daily) },
      { label: 'Keluar ke kartu karier', cls: 'ghost', onClick: () => this.career() }],
    });
  },
  /* result: {score, rows:[[label, bobot, realisasi, target, nilai]], notes:[] } */
  finish(lv, res) {
    const score = Math.round(clamp(res.score, 0, 100)), g = gradeOf(score), d = Save.data;
    const daily = this.daily; this.daily = null; Online.unseed(); Online.levelEnd(lv, score);
    const prev = d.best[lv];
    if (!daily && (!prev || score > prev.score)) d.best[lv] = { score, grade: g };
    const passed = score >= PASS_SCORE;
    let promo = '';
    if (!daily && passed && lv < 5 && d.unlocked <= lv) { d.unlocked = lv + 1; promo = `<p class="tag go" style="font-size:13px;padding:6px 10px">Promosi! Jabatan baru terbuka: Level ${lv + 1} · ${CAREER[lv].jab}</p>`; }
    Save.write();
    this.level && this.level.cleanup && this.level.cleanup(); this.level = null; UI.setHud(''); Voice.stop();
    this.toTitleView();
    passed ? Sfx.promo() : Sfx.bad();
    UI.screen(`<div class="screen"><div class="sheet">
      <div><div class="eyebrow">${daily ? 'Tantangan harian · ' : ''}Evaluasi kinerja · Level ${lv}</div><h2 class="disp">${CAREER[lv - 1].jab}</h2></div>
      <div class="panel evgrid"><div style="display:flex;gap:16px;align-items:center"><div class="score-big mono">${score}</div>${gradeBadge(g)}</div>
        <div><b>${GRADES[g].label}</b> — ${passed ? (lv < 5 ? 'Lulus evaluasi. Anda layak promosi.' : 'Lulus.') : `Belum memenuhi standar (minimal ${PASS_SCORE}). Ulangi shift untuk promosi.`}${promo ? '<div style="margin-top:8px">' + promo + '</div>' : ''}</div></div>
      <div class="panel tbl-wrap"><table class="t"><tr><th>Indikator</th><th>Bobot</th><th>Realisasi</th><th>Target</th><th>Nilai</th></tr>
        ${res.rows.map(r => `<tr><td>${r[0]}</td><td class="num">${r[1]}%</td><td class="num">${r[2]}</td><td class="num">${r[3]}</td><td class="num">${Math.round(r[4])}</td></tr>`).join('')}</table></div>
      ${res.notes && res.notes.length ? `<div class="panel"><h3 class="disp">Catatan supervisor</h3><ul class="sop" style="margin-top:8px">${res.notes.map(n => `<li>${n}</li>`).join('')}</ul></div>` : ''}
      ${daily ? '<div class="panel" id="daily-res"><p class="muted">Mengirim skor ke papan peringkat…</p></div>' : ''}
      <div class="btnrow">${daily ? `<button class="btn primary" id="b-dretry">Coba lagi tantangan</button><button class="btn" id="b-dboard">Papan peringkat</button>` : `<button class="btn ${passed && lv < 5 ? '' : 'primary'}" id="b-retry">Ulangi level</button>
      ${passed && lv < 5 ? `<button class="btn primary" id="b-next">Lanjut ke Level ${lv + 1}</button>` : ''}`}
      <button class="btn" id="b-cert">Sertifikat</button>${Online.enabled ? '<button class="btn ghost" id="b-fb2">Beri masukan</button>' : ''}
      <button class="btn ghost" id="b-career">${daily ? 'Menu utama' : 'Kartu karier'}</button></div>
    </div></div>`);
    const on = (id, f) => { const e = $('#' + id); if (e) e.onclick = f; };
    on('b-retry', () => this.brief(lv));
    on('b-next', () => this.brief(lv + 1));
    on('b-dretry', () => this.brief(lv, daily));
    on('b-dboard', () => this.dailyScreen());
    on('b-cert', () => this.certificate(lv, score, g, daily));
    on('b-fb2', () => this.feedback('evaluasi', lv));
    $('#b-career').onclick = () => daily ? this.title() : this.career();
    if (daily) this.dailySubmit(lv, score, g, daily);
  },
};
/* scoring helper: value vs target → 0..100 */
const scoreRatio = (v, target) => clamp(v / target * 100, 0, 100);

window.addEventListener('DOMContentLoaded', () => Game.boot());
window.__SN = { Game, Save, Levels, UI };
/* tombol Back Android: jeda / kembali ke menu; false = biarkan aplikasi keluar */
window.__onBack = () => {
  try {
    if (UI.modalOpen) { if (Game.level && Game.paused) { UI.closeModal(); Game.paused = false; } return true; }
    if (Game.level) { Game.pauseMenu(); return true; }
    if ($('#b-start')) return false;
    Game.title(); return true;
  } catch (e) { return false; }
};
document.addEventListener('visibilitychange', () => { if (document.hidden && Game.level && !Game.paused && !UI.modalOpen) Game.pauseMenu(); });
