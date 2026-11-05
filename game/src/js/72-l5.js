/* ================= LEVEL 5 · KEPALA STASIUN (controller & UI) ================= */
const DAY_LEN = 5; // detik nyata per hari pada kecepatan 1x
const L5 = {
  id: 5,
  brief: {
    intro: 'Anda kini Kepala Stasiun Nusantara (Kelas III). Kelola kas, staf, fasilitas, dan kepuasan penumpang. Setiap akhir bulan auditor Daop menilai kinerja Anda. Masa jabatan: 12 bulan.',
    sop: [
      '<b>Arus pendapatan:</b> komisi per penumpang (pass-through fee), sewa tenant, parkir & drop-off, serta subsidi/bonus Daop bila OTP ≥ 95% dan kebersihan ≥ 90%.',
      '<b>Upgrade:</b> naik kelas ke Stasiun Kelas II (kapasitas 3.000/hari), lalu Stasiun Utama (&gt; 15.000/hari). Syarat: evaluasi terakhir minimal Grade B dan semua fasilitas tier saat ini sudah dibangun. Grade A memberi akselerasi (diskon 30%).',
      '<b>Krisis:</b> banjir rel (Rp 15 jt, OB &amp; PPKA, SLA 5 menit), blackout (Rp 8 jt, Teknisi &amp; Polsuska, SLA 1 menit), mudik Lebaran (Rp 25 jt, seluruh staf, peak season di bulan ke-3).',
      '<b>Evaluasi Daop:</b> Operasional &amp; Keselamatan 35%, Kebersihan &amp; Fasilitas 25%, Keuangan &amp; Komersial 20%, Kepuasan Penumpang 20%.',
      '<b>Grade D</b> berarti audit khusus dan demosi. Grade C memberi SP 1 dan wajib action plan 3 hari.',
    ],
    controls: ['Atur kecepatan waktu di bilah atas (jeda, 1×, 2×, 4×). Satu hari = 5 detik pada 1×.', 'Panel kanan: Ringkasan, Fasilitas, Staf, Keuangan, Laporan.', 'Saat krisis, waktu berjalan 1× dan jam SLA berjalan 6× lebih cepat dari waktu nyata.'],
    kpi: [['Operasional & Keselamatan', '35%'], ['Kebersihan & Fasilitas', '25%'], ['Keuangan & Komersial', '20%'], ['Kepuasan Penumpang', '20%']],
  },
  start() {
    Game.setCanvas(GL.ok ? 'gl' : 'none');
    this.v = null;
    if (GL.ok) { this.v = makeTycoonScene(); GL.use(this.v); }
    const snap = Save.data.l5;
    if (snap && snap.S && !snap.S.ended) {
      this.modalPause = true;
      UI.modal({ title: 'Masa jabatan tersimpan', html: `<p>Anda punya masa jabatan yang belum selesai: <b>Bulan ${snap.S.month}</b>, ${L5_TIER[snap.S.tier].name}, kas ${rpShort(snap.S.cash)}.</p>`, buttons: [
        { label: `Lanjutkan bulan ${snap.S.month}`, cls: 'primary', onClick: () => this.begin(JSON.parse(JSON.stringify(snap.S))) },
        { label: 'Mulai masa jabatan baru', onClick: () => this.begin(null) }] });
    } else this.begin(null);
  },
  begin(S) {
    this.modalPause = false;
    if (!S) { S = L5Sim.fresh(); L5Sim.newMonth(S); S.log = []; }
    this.S = S; this.speed = 1; this.acc = 0; this.tab = this.tab || 'sum'; this.crisis = null; this.fault = null; this.minimized = false;
    this.snapshot();
    if (this.v) { this.v.rebuild(S); this.v.setPeople(S.demand / 60); }
    this.renderHud();
    if (S.month === 1 && S.day === 1) this.addLog('Hari pertama sebagai Kepala Stasiun. Tinjau staf dan anggaran perawatan.', 'good');
  },
  snapshot() { const c = JSON.parse(JSON.stringify(this.S)); Save.data.l5 = { S: c }; Save.write(); },
  cleanup() { this.v = null; },
  addLog(m, k = '') {
    const S = this.S; S.log.unshift({ m, k, d: `B${S.month}·H${S.day}` }); S.log = S.log.slice(0, 40);
    if (this.tab === 'sum') this.renderTab();
  },
  /* ---------- HUD ---------- */
  renderHud() {
    UI.setHud(`<div class="topbar" id="top5"></div>
      <div class="l5side" id="side5"><div class="panel" style="display:flex;flex-direction:column;gap:8px;flex:1;min-height:0">
        <div class="btnrow" style="justify-content:space-between;align-items:center"><div class="tabs" id="tabs5"></div><button class="btn sm mobile-toggle" id="b-min">${this.minimized ? 'Buka panel' : 'Kecilkan'}</button></div>
        <div class="body" id="tab5"></div></div></div>`);
    $('#b-min').onclick = () => { this.minimized = !this.minimized; $('#side5').classList.toggle('min', this.minimized); $('#b-min').textContent = this.minimized ? 'Buka panel' : 'Kecilkan'; };
    $('#side5').classList.toggle('min', this.minimized);
    const tabs = [['sum', 'Ringkasan'], ['fac', 'Fasilitas'], ['staff', 'Staf'], ['fin', 'Keuangan'], ['rep', 'Laporan']];
    $('#tabs5').innerHTML = tabs.map(([k, l]) => `<button class="tab ${this.tab === k ? 'on' : ''}" data-tab="${k}">${l}</button>`).join('');
    $$('[data-tab]').forEach(b => b.onclick = () => { this.tab = b.dataset.tab; $$('[data-tab]').forEach(x => x.classList.toggle('on', x === b)); this.renderTab(); });
    this.renderTop(); this.renderTab();
  },
  renderTop() {
    const S = this.S, el = $('#top5'); if (!el) return;
    const chipC = (v, good, warn) => v >= good ? 'good' : v >= warn ? 'warn' : 'bad';
    if (!el.dataset.built) {
      el.dataset.built = 1;
      el.innerHTML = `<span class="chip title">Level 5 · Kepala Stasiun</span><span class="chip">Kas <b id="t5-cash"></b></span><span class="chip"><b id="t5-date"></b></span><span class="chip" id="t5-tier"></span>
        <span class="chip">Penumpang <b id="t5-pax"></b></span><span class="chip" id="t5-otp-c">OTP <b id="t5-otp"></b></span><span class="chip" id="t5-cl-c">Bersih <b id="t5-cl"></b></span><span class="chip" id="t5-cs-c">CSAT <b id="t5-cs"></b></span>
        <span id="t5-alert"></span><span class="spacer"></span>
        <span class="btnrow speed" style="gap:4px">${[0, 1, 2, 4].map(s => `<button class="btn sm" data-sp="${s}">${s ? s + '×' : '❚❚'}</button>`).join('')}</span><button class="btn sm" id="b-pause">Menu</button>`;
      $$('[data-sp]').forEach(b => b.onclick = () => { if (this.crisis && +b.dataset.sp !== 1) { UI.toast('Saat krisis, waktu berjalan normal (1×).', 'warn'); return; } this.speed = +b.dataset.sp; this.renderTop(); });
      $('#b-pause').onclick = () => Game.pauseMenu();
    }
    $('#t5-cash').textContent = rpShort(S.cash); $('#t5-cash').style.color = S.cash < 0 ? 'var(--stop-ink)' : '';
    $('#t5-date').textContent = `Bulan ${S.month} · Hari ${S.day}/30`;
    $('#t5-tier').textContent = L5_TIER[S.tier].name;
    $('#t5-pax').textContent = (S.pax || Math.round(S.demand)).toLocaleString('id-ID') + '/hari';
    $('#t5-otp').textContent = S.otp.toFixed(1) + '%'; $('#t5-otp-c').className = 'chip ' + chipC(S.otp, 95, 90);
    $('#t5-cl').textContent = Math.round(S.clean) + '%'; $('#t5-cl-c').className = 'chip ' + chipC(S.clean, 90, 80);
    $('#t5-cs').textContent = S.csat.toFixed(2); $('#t5-cs-c').className = 'chip ' + chipC(S.csat, 4.2, 3.8);
    $$('[data-sp]').forEach(b => b.classList.toggle('on', +b.dataset.sp === this.speed));
    const al = $('#t5-alert');
    if (this.fault) {
      if (!al.dataset.f) { al.dataset.f = 1; al.innerHTML = `<button class="btn sm stop" id="b-fault">Gangguan sinyal · kirim teknisi <b class="mono" id="f-left"></b></button>`; $('#b-fault').onclick = () => this.fixFault(); }
      $('#f-left').textContent = Math.ceil(this.fault.left) + 's';
    } else if (al.dataset.f) { al.dataset.f = ''; al.innerHTML = ''; }
  },
  renderTab() {
    const el = $('#tab5'); if (!el) return;
    const S = this.S, T = L5_TIER[S.tier], m = S.m, avg = L5Sim.avg;
    if (this.tab === 'sum') {
      const live = S.m.otp.length ? L5Sim.evaluate(S) : null;
      const mud = S.mudik;
      let alert = '';
      if (S.month === mud.month && S.day >= 13 && !mud.prepared && !mud.failed && S.day < 20) {
        const rec = T.rec, ok = Object.keys(rec).every(k => S.staff[k] >= rec[k]);
        alert = `<div class="panel" style="border-color:var(--stop);padding:10px"><div class="eyebrow" style="color:var(--stop-ink)">Krisis terjadwal · ${L5_CRISIS.mudik.name}</div><p style="font-size:12.5px;margin:4px 0 8px">Peak season mulai Hari 20 (H-${20 - S.day}). Siapkan Posko Angkutan Lebaran: biaya Rp 25.000.000 dan seluruh staf minimal sesuai rekomendasi. Jika gagal: <b>${L5_CRISIS.mudik.fail}</b>.</p>
          <div style="font-size:12px;margin-bottom:8px">${Object.keys(rec).map(k => `<span class="tag ${S.staff[k] >= rec[k] ? 'go' : 'stop'}" style="margin:2px">${L5_STAFF[k].name} ${S.staff[k]}/${rec[k]}</span>`).join('')}</div>
          <button class="btn sm primary" id="b-mudik" ${ok && S.cash >= 25e6 ? '' : 'disabled'}>Siapkan Posko (Rp 25 jt)</button></div>`;
      } else if (mud.prepared && S.month === mud.month) alert = `<div class="panel" style="border-color:var(--go);padding:10px;font-size:12.5px"><b>Posko Angkutan Lebaran siap.</b> ${mud.active ? 'Peak season sedang berlangsung.' : ''}</div>`;
      const row = (lbl, val, tgt, ok) => `<div class="kpi-row"><span>${lbl}<br><span class="muted" style="font-size:11px">target ${tgt}</span></span><span class="tag ${ok ? 'go' : 'stop'} mono" style="text-align:center">${val}</span></div>`;
      el.innerHTML = `${alert}<div class="eyebrow" style="margin-top:6px">KPI bulan berjalan (rata-rata)</div>
        <div style="display:grid;gap:8px;margin-top:8px">
        ${row('OTP (ketepatan waktu)', m.otp.length ? avg(m.otp).toFixed(1) + '%' : '–', '≥ 95%', !m.otp.length || avg(m.otp) >= 95)}
        ${row('Insiden keselamatan', m.acc, '0', m.acc === 0)}
        ${row('Kebersihan', m.clean.length ? Math.round(avg(m.clean)) + '%' : '–', '≥ 90%', !m.clean.length || avg(m.clean) >= 90)}
        ${row('Kondisi fasilitas', Math.round(S.cond) + '%', '≥ 70%', S.cond >= 70)}
        ${row('CSAT', m.csat.length ? avg(m.csat).toFixed(2) : '–', '≥ 4,2', !m.csat.length || avg(m.csat) >= 4.2)}
        ${row('Pendapatan vs target', live ? pct(live.finR) : '–', '≥ 100% di akhir bulan', !live || live.finR >= S.day / 30 * 100 * .95)}
        ${row('Moral staf', Math.round(S.morale), '≥ 65', S.morale >= 65)}
        </div>
        ${live ? `<p class="muted" style="font-size:12px;margin-top:8px">Proyeksi skor: <b class="mono">${Math.round(live.score)}</b> ${gradeBadge(live.grade)}</p>` : ''}
        ${this.hints()}
        <div class="eyebrow" style="margin-top:10px">Log stasiun</div><div class="log" style="margin-top:6px">${S.log.slice(0, 12).map(l => `<div class="${l.k}"><span class="mono muted">${l.d}</span> ${l.m}</div>`).join('')}</div>`;
      const bm = $('#b-mudik'); if (bm) bm.onclick = () => this.prepMudik();
    }
    if (this.tab === 'fac') {
      const next = L5_TIER[S.tier + 1];
      const curAll = L5_FAC.filter(f => f.tier === S.tier).every(f => S.owned.includes(f.id));
      const gradeOK = S.monthsAtTier >= 1 && (S.lastGrade === 'A' || S.lastGrade === 'B');
      const upCost = next ? next.upCost * (S.accel ? .7 : 1) : 0;
      el.innerHTML = `<div class="eyebrow">Kelas stasiun saat ini</div><p style="margin:4px 0 10px"><b>${T.name}</b> · kapasitas ${T.cap.toLocaleString('id-ID')} penumpang/hari</p>
        ${next ? `<div class="fac"><div><b>Naik kelas: ${next.name}</b></div><button class="btn sm primary" id="b-up" data-cost="${upCost}" ${curAll && gradeOK && S.cash >= upCost ? '' : 'disabled'}>${rpShort(upCost)}</button>
          <small>Kapasitas ${next.cap.toLocaleString('id-ID')}/hari. Syarat: ${S.tier === 1 ? '' : `semua fasilitas Tier ${S.tier} (${curAll ? '✓' : '✗'}), `}evaluasi terakhir Grade A/B di kelas ini (${gradeOK ? '✓' : '✗'})${S.accel ? ' · akselerasi Grade A: diskon 30%' : ''}.</small></div>` : '<p class="tag go">Kelas tertinggi tercapai.</p>'}
        <div class="eyebrow" style="margin-top:12px">Fasilitas Tier 1 (sudah tersedia)</div><p class="muted" style="font-size:12.5px;margin-top:4px">Bangunan ${S.tier === 1 ? 'kayu sederhana' : 'baru'}, peron, kursi ${S.tier === 1 ? 'kayu' : 'tunggu'}, loket manual, toilet dasar.</p>
        ${[2, 3].map(t => `<div class="eyebrow" style="margin-top:12px">Fasilitas Tier ${t} ${S.tier < t ? '· terkunci' : ''}</div><div style="display:grid;gap:8px;margin-top:6px">${L5_FAC.filter(f => f.tier === t).map(f => {
          const owned = S.owned.includes(f.id), lockR = f.req && !S.owned.includes(f.req), can = S.tier >= t && !owned && !lockR && S.cash >= f.cost;
          return `<div class="fac ${owned ? 'owned' : ''}"><b>${f.name}</b>${owned ? '<span class="tag go">Dibangun</span>' : `<button class="btn sm" data-buy="${f.id}" data-cost="${f.cost}" ${can ? '' : 'disabled'}>${rpShort(f.cost)}</button>`}<small>${f.desc}${lockR ? ' Butuh Gate E-Ticket.' : ''}</small></div>`;
        }).join('')}</div>`).join('')}`;
      const up = $('#b-up'); if (up) up.onclick = () => this.upgrade();
      $$('[data-buy]').forEach(b => b.onclick = () => this.buy(b.dataset.buy));
    }
    if (this.tab === 'staff') {
      const rec = T.rec;
      el.innerHTML = `<p class="muted" style="font-size:12.5px">Rekrut: biaya sekali 50% gaji. Pemutusan: pesangon 1× gaji dan moral turun. Kekurangan staf menurunkan moral dan KPI.</p>
        <div class="staff" style="font-size:11px;color:var(--muted)"><span>Peran</span><span>Jumlah</span><span></span><span>Rek.</span></div>
        ${Object.entries(L5_STAFF).map(([k, s]) => `<div class="staff"><div><b>${s.name}</b><div class="muted" style="font-size:11.5px">${s.peran} · ${rpShort(s.gaji)}/bln</div></div>
          <span class="btnrow" style="gap:4px"><button class="btn sm" data-fire="${k}" ${S.staff[k] ? '' : 'disabled'}>−</button><span class="n" id="sn-${k}">${S.staff[k]}</span><button class="btn sm" data-hire="${k}">+</button></span><span></span><span class="tag ${S.staff[k] >= rec[k] ? 'go' : 'warn'} mono">${rec[k]}</span></div>`).join('')}
        <p style="margin-top:10px;font-size:13px">Total gaji: <b class="mono">${rpShort(L5Sim.salary(S))}</b>/bulan · Moral staf <b class="mono">${Math.round(S.morale)}</b></p>`;
      $$('[data-hire]').forEach(b => b.onclick = () => this.hire(b.dataset.hire, 1));
      $$('[data-fire]').forEach(b => b.onclick = () => this.hire(b.dataset.fire, -1));
    }
    if (this.tab === 'fin') {
      const rec = L5Sim.recMaint(S), rev = m.rev, ex = m.exp;
      const opt = (id, val, lbl) => `<div class="field"><label for="${id}">${lbl}</label><select id="${id}" class="inp">${['rendah', 'normal', 'tinggi'].map(o => `<option value="${o}" ${val === o ? 'selected' : ''}>${o[0].toUpperCase() + o.slice(1)}</option>`).join('')}</select></div>`;
      const totR = rev.pax + rev.tenant + rev.parkir + rev.lounge + rev.daop, totE = ex.gaji + ex.maint + ex.krisis + ex.investasi + ex.rekrut + ex.lain;
      el.innerHTML = `<div class="field"><label for="mt">Anggaran perawatan: <span id="mtv">${S.maint}%</span> dari rekomendasi (${rpShort(rec)}/bln)</label><input type="range" id="mt" min="0" max="150" step="10" value="${S.maint}"></div>
        <div class="grid2" style="margin-top:8px">${opt('rent', S.rent, 'Tarif sewa tenant')}${opt('park', S.parkir, 'Tarif parkir')}</div>
        <p class="muted" style="font-size:12px;margin-top:6px">Okupansi tenant: <b>${Math.round(S.occ * 100)}%</b> dari ${L5Sim.slots(S)} slot · sewa tinggi menurunkan okupansi, parkir mahal menurunkan CSAT.</p>
        <div class="eyebrow" style="margin-top:12px">Laba rugi bulan ${S.month} (berjalan)</div>
        <div class="tbl-wrap"><table class="t" style="min-width:0;margin-top:6px">
        <tr><td>Passenger pass-through fee</td><td class="num">${rpShort(rev.pax)}</td></tr><tr><td>Sewa tenant & retail</td><td class="num">${rpShort(rev.tenant)}</td></tr><tr><td>Parkir & drop-off</td><td class="num">${rpShort(rev.parkir)}</td></tr>${rev.lounge ? `<tr><td>VIP lounge</td><td class="num">${rpShort(rev.lounge)}</td></tr>` : ''}
        <tr><th>Total pendapatan</th><th class="num">${rpShort(totR)}</th></tr>
        <tr><td>Gaji staf</td><td class="num">${rpShort(-ex.gaji)}</td></tr><tr><td>Perawatan</td><td class="num">${rpShort(-ex.maint)}</td></tr><tr><td>Penanganan krisis</td><td class="num">${rpShort(-ex.krisis)}</td></tr><tr><td>Rekrutmen & lain-lain</td><td class="num">${rpShort(-(ex.rekrut + ex.lain))}</td></tr><tr><td>Investasi fasilitas</td><td class="num">${rpShort(-ex.investasi)}</td></tr>
        <tr><th>Arus kas bersih</th><th class="num">${rpShort(totR - totE)}</th></tr></table></div>
        <p class="muted" style="font-size:12px;margin-top:6px">Target pendapatan Daop bulan ini: <b>${rpShort(T.target * (S.monthsAtTier === 0 && S.tier > 1 ? .6 : 1))}</b>${S.monthsAtTier === 0 && S.tier > 1 ? ' (masa transisi 60%)' : ''}.</p>`;
      $('#mt').oninput = e => { S.maint = +e.target.value; $('#mtv').textContent = S.maint + '%'; };
      $('#rent').onchange = e => { S.rent = e.target.value; L5Sim.updOcc(S); this.renderTab(); };
      $('#park').onchange = e => { S.parkir = e.target.value; };
    }
    if (this.tab === 'rep') {
      el.innerHTML = S.history.length ? `<div class="tbl-wrap"><table class="t" style="min-width:0"><tr><th>Bulan</th><th>Kelas</th><th>Skor</th><th>Grade</th><th>Pendapatan</th></tr>${S.history.map(h => `<tr><td>${h.month}</td><td>${h.tier}</td><td class="num">${h.score}</td><td>${gradeBadge(h.grade)}</td><td class="num">${rpShort(h.rev)}</td></tr>`).join('')}</table></div>
        <div style="margin-top:12px;display:flex;align-items:flex-end;gap:6px;height:120px">${S.history.map(h => `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px"><span class="mono" style="font-size:10px">${h.score}</span><i style="display:block;width:100%;height:${h.score}px;border-radius:3px 3px 0 0;background:${h.grade === 'A' ? 'var(--go)' : h.grade === 'B' ? 'var(--info)' : h.grade === 'C' ? 'var(--warn)' : 'var(--stop)'}"></i><span class="mono muted" style="font-size:10px">B${h.month}</span></div>`).join('')}</div>`
        : '<p class="muted">Belum ada evaluasi bulanan. Laporan pertama terbit di akhir Bulan 1.</p>';
    }
  },
  refreshButtons() {
    const S = this.S;
    $$('[data-buy]').forEach(b => { const f = L5_FAC.find(x => x.id === b.dataset.buy); b.disabled = !(S.tier >= f.tier && !(f.req && !S.owned.includes(f.req)) && S.cash >= f.cost); });
  },
  hints() {
    const S = this.S, rec = L5_TIER[S.tier].rec, h = [];
    const low = Object.keys(rec).filter(k => S.staff[k] < rec[k]);
    if (low.length) h.push(`Kekurangan staf: ${low.map(k => L5_STAFF[k].name).join(', ')}.`);
    if (S.cond < 65) h.push('Kondisi fasilitas menurun. Naikkan anggaran perawatan atau tambah teknisi.');
    if (L5Sim.thr(S) < S.demand) h.push('Antrean loket melebihi kapasitas layanan. Tambah petugas ticketing atau bangun Gate E-Ticket.');
    if (S.cash < 20e6) h.push('Kas menipis. Krisis butuh dana Rp 8–25 juta.');
    return h.length ? `<div class="panel" style="margin-top:10px;padding:10px;font-size:12.5px;border-color:#f7d98a"><div class="eyebrow" style="color:var(--warn)">Saran staf ahli</div><ul class="sop" style="margin-top:4px;gap:4px">${h.map(x => `<li>${x}</li>`).join('')}</ul></div>` : '';
  },
  /* ---------- actions ---------- */
  spend(amount, cat) { this.S.cash -= amount; this.S.m.exp[cat] += amount; },
  buy(id) {
    const S = this.S, f = L5_FAC.find(x => x.id === id);
    if (S.cash < f.cost) return;
    this.spend(f.cost, 'investasi'); S.owned.push(id); Sfx.cash();
    this.addLog(`Fasilitas dibangun: ${f.name}.`, 'good'); UI.toast(`${f.name} selesai dibangun.`, 'good');
    if (id === 'food' || id === 'vip') L5Sim.updOcc(S);
    if (this.v) this.v.rebuild(S);
    this.renderTab(); this.renderTop();
  },
  upgrade() {
    const S = this.S, next = L5_TIER[S.tier + 1]; if (!next) return;
    const cost = next.upCost * (S.accel ? .7 : 1);
    if (S.cash < cost) return;
    this.spend(cost, 'investasi'); S.tier++; S.monthsAtTier = 0; S.accel = false; S.demand = Math.max(S.demand, next.cap * .4);
    Sfx.promo(); this.addLog(`Stasiun naik kelas menjadi ${next.name}!`, 'good');
    UI.modal({ title: `Selamat! ${next.name}`, html: `<p>Kapasitas naik menjadi ${next.cap.toLocaleString('id-ID')} penumpang/hari. Rekomendasi staf dan target pendapatan Daop ikut naik; bulan pertama di kelas baru adalah masa transisi (target 60%).</p><p class="muted" style="margin-top:8px">Rekrut staf sesuai rekomendasi agar KPI tetap terjaga.</p>`, buttons: [{ label: 'Lihat staf', cls: 'primary', onClick: () => { this.tab = 'staff'; this.renderHud(); } }, { label: 'Tutup' }] });
    if (this.v) this.v.rebuild(S);
    this.renderTab(); this.renderTop();
  },
  hire(k, d) {
    const S = this.S, g = L5_STAFF[k].gaji;
    if (d > 0) { this.spend(g * .5, 'rekrut'); S.staff[k]++; Sfx.click(); }
    else { if (!S.staff[k]) return; this.spend(g, 'lain'); S.staff[k]--; S.moraleMod -= 3; Sfx.click(); }
    if (this.tab === 'staff') this.renderTab();
    if (this.crisis) this.renderCrisis();
    this.renderTop();
  },
  prepMudik() {
    const S = this.S; if (S.cash < 25e6) return;
    this.spend(25e6, 'krisis'); S.mudik.prepared = true; Sfx.ok();
    this.addLog('Posko Angkutan Lebaran siap. Seluruh staf disiagakan.', 'good'); UI.toast('Posko Angkutan Lebaran siap.', 'good'); this.renderTab();
  },
  fixFault() {
    const S = this.S, f = this.fault; if (!f) return;
    if (!S.staff.teknisi) { UI.toast('Tidak ada teknisi. Rekrut teknisi di tab Staf.', 'bad'); return; }
    S.m.faults.push(f.t); this.fault = null; Sfx.ok(); this.addLog(`Gangguan sinyal ditangani dalam ${f.t.toFixed(1)} detik.`, f.t <= 3 ? 'good' : 'warn'); this.renderTop();
  },
  /* ---------- crises ---------- */
  startCrisis(k) {
    if (this.crisis) return;
    const C = L5_CRISIS[k];
    this.crisis = { k, left: C.sla / 6, total: C.sla / 6 };
    this.speed = 1; Sfx.alarm(); if (this.v) this.v.crisis(k);
    this.addLog(`KRISIS: ${C.name}!`, 'bad');
    this.renderCrisis(); this.renderTop();
  },
  renderCrisis() {
    const c = this.crisis, S = this.S; if (!c) return;
    const C = L5_CRISIS[c.k], needOK = C.need.every(r => S.staff[r] > 0), cashOK = S.cash >= C.cost;
    const box = UI.modal({
      cls: 'crisis', title: C.name,
      html: `<div class="btnrow" style="justify-content:space-between;align-items:center"><p style="flex:1;min-width:200px">${C.desc}</p><div style="text-align:right"><div class="eyebrow" style="color:var(--stop-ink)">SLA tersisa</div><div class="sla" id="sla5">${mmss(c.left * 6)}</div></div></div>
        <dl class="kv" style="margin-top:10px"><dt>Biaya penanganan</dt><dd>${rp(C.cost)} ${cashOK ? '✓' : '<span class="tag stop">kas kurang</span>'}</dd><dt>Personel kunci</dt><dd>${C.need.map(r => `<span class="tag ${S.staff[r] ? 'go' : 'stop'}" style="margin:2px">${L5_STAFF[r].name}: ${S.staff[r]}</span>`).join('')}</dd><dt>Dampak jika gagal</dt><dd style="color:var(--stop-ink)">${C.fail}</dd></dl>
        ${needOK ? '' : `<div class="btnrow" style="margin-top:10px">${C.need.filter(r => !S.staff[r]).map(r => `<button class="btn sm" data-qh="${r}">Rekrut darurat ${L5_STAFF[r].name} (${rpShort(L5_STAFF[r].gaji * .5)})</button>`).join('')}</div>`}`,
      buttons: [{ label: `Tangani sekarang (${rpShort(C.cost)})`, cls: 'stop', disabled: !(needOK && cashOK), onClick: () => this.resolveCrisis(true) }],
      onOpen: b => $$('[data-qh]', b).forEach(x => x.onclick = () => this.hire(x.dataset.qh, 1)),
    });
  },
  resolveCrisis(ok) {
    const c = this.crisis, S = this.S, C = L5_CRISIS[c.k];
    this.crisis = null; UI.closeModal(); if (this.v) this.v.crisis(null);
    if (ok) {
      this.spend(C.cost, 'krisis'); Sfx.ok();
      const t = (c.total - c.left) * 6;
      this.addLog(`${C.name} tertangani dalam ${mmss(t)} (SLA ${mmss(C.sla)}).`, 'good');
      UI.toast(`Krisis tertangani dalam ${mmss(t)}.`, 'good');
      if (c.k === 'banjir') S.otp = Math.max(85, S.otp - 4);
    } else {
      Sfx.crash();
      this.addLog(`GAGAL menangani ${C.name}: ${C.fail}.`, 'bad');
      if (c.k === 'banjir') { S.m.acc++; S.fx.otpCut = 3; S.fx.paxCut = 2; S.csat = clamp(S.csat - .35, 1, 5); }
      if (c.k === 'blackout') { S.m.acc++; S.fx.csatCut = 2; S.fx.paxCut = 1; S.cond = Math.max(0, S.cond - 6); }
      UI.modal({ title: `SLA terlewati: ${C.name}`, cls: 'crisis', html: `<p><b>${C.fail}.</b> Insiden dicatat pada KPI Operasional &amp; Keselamatan, OTP dan kepuasan penumpang terdampak beberapa hari.</p>`, buttons: [{ label: 'Mengerti', cls: 'primary' }] });
    }
    this.renderTop(); this.renderTab();
  },
  /* ---------- small events ---------- */
  smallEvent() {
    const S = this.S;
    const pool = L5_EVENTS.filter((e, i) => !S.evDone.includes(i));
    if (!pool.length) return;
    const e = pick(pool); S.evDone.push(L5_EVENTS.indexOf(e));
    this.modalPause = true;
    UI.modal({ title: e.t, html: `<p>${e.d}</p>`, buttons: e.o.map(o => ({ label: o[0], onClick: () => { o[1](S); this.modalPause = false; UI.toast(o[2]); this.addLog(`${e.t}: ${o[0]}.`); L5Sim.updOcc(S); this.renderTop(); } })) });
  },
  /* ---------- loop ---------- */
  update(dt) {
    if (this.v) this.v.update(dt);
    if (!this.S || this.S.ended) return;
    if (this.crisis) {
      this.crisis.left -= dt; const e = $('#sla5'); if (e) e.textContent = mmss(this.crisis.left * 6);
      if (this.crisis.left <= 0) this.resolveCrisis(false);
    }
    if (this.fault) { this.fault.t += dt; this.fault.left -= dt; if (this.fault.left <= 0) { this.S.m.faults.push(null); this.S.cond = Math.max(0, this.S.cond - 2); this.fault = null; Sfx.bad(); this.addLog('Gangguan sinyal tidak ditangani: perjalanan kereta tertahan.', 'bad'); } this.renderTop(); }
    if (!this.speed) return;
    this.acc += dt * this.speed;
    if (this.acc >= DAY_LEN) { this.acc = 0; this.nextDay(); }
  },
  idle(dt) { if (this.v) this.v.update(dt * .3); },
  nextDay() {
    const S = this.S;
    // jadwal krisis & kejadian sebelum hari berjalan
    const mud = S.mudik;
    if (S.month === mud.month) {
      if (S.day === 13 && !mud.warned[13]) { mud.warned[13] = 1; Sfx.alarm(); this.addLog('Daop: masa angkutan Lebaran dimulai Hari 20. Siapkan posko (H-7).', 'warn'); if (UI.modalOpen) UI.toast('Daop: peak season mudik mulai Hari 20. Siapkan Posko Angkutan Lebaran di tab Ringkasan.', 'bad', 6000); else UI.modal({ title: 'Persiapan Angkutan Lebaran (H-7)', cls: 'crisis', html: `<p>Daop mengumumkan peak season mudik Lebaran mulai Hari 20 selama 8 hari. Permintaan diperkirakan naik lebih dari dua kali lipat.</p><p style="margin-top:8px">Siapkan <b>Posko Angkutan Lebaran</b> (Rp 25.000.000) dengan <b>seluruh staf</b> minimal sesuai rekomendasi sebelum Hari 20. Jika tidak: <b style="color:var(--stop-ink)">${L5_CRISIS.mudik.fail}</b>.</p>`, buttons: [{ label: 'Buka Ringkasan', cls: 'primary', onClick: () => { this.tab = 'sum'; this.renderHud(); } }, { label: 'Tutup' }] }); }
      if ((S.day === 17 || S.day === 19) && !mud.prepared) UI.toast(`Peringatan: posko Lebaran belum siap (H-${20 - S.day}).`, 'bad', 4000);
      if (S.day === 20) {
        mud.active = true; if (this.v) this.v.setPeople(140);
        if (!mud.prepared) { mud.failed = true; Sfx.crash(); S.csat = clamp(S.csat - .6, 1, 5); this.addLog('Peak season tanpa posko: stasiun kewalahan. Rating anjlok ke Grade D.', 'bad'); if (UI.modalOpen) UI.toast('Lonjakan mudik tidak tertangani: rating bulan ini anjlok ke Grade D.', 'bad', 6000); else UI.modal({ title: 'Lonjakan mudik tidak tertangani', cls: 'crisis', html: `<p>Hall dan peron penuh sesak, antrean mengular, jadwal kacau. Sesuai ketentuan, rating stasiun bulan ini <b>anjlok ke Grade D</b>.</p>`, buttons: [{ label: 'Mengerti', cls: 'primary' }] }); }
        else this.addLog('Peak season mudik dimulai. Posko berjalan.', 'good');
      }
      if (S.day === 28 && mud.active) { mud.active = false; this.addLog('Masa angkutan Lebaran selesai.', mud.failed ? 'bad' : 'good'); }
    }
    if (S.day === S.banjirDay && !this.crisis) this.startCrisis('banjir');
    else if (!this.crisis && S.day > 2 && chance(.018 + (S.cond < 55 ? .04 : 0))) this.startCrisis('blackout');
    if (S.day === S.inspectDay) {
      const ok = S.clean >= 90 && S.cond >= 70; S.m.inspect = ok;
      ok ? Sfx.ok() : Sfx.bad();
      this.addLog(ok ? 'Inspeksi mendadak Daop: lulus. Toilet, peron, dan fasilitas memenuhi standar.' : `Inspeksi mendadak Daop: ada temuan (kebersihan ${Math.round(S.clean)}%, kondisi ${Math.round(S.cond)}%). Pilar Kebersihan −10.`, ok ? 'good' : 'bad');
      UI.toast(ok ? 'Inspeksi Daop lulus.' : 'Inspeksi Daop menemukan masalah.', ok ? 'good' : 'bad', 3500);
    }
    const out = L5Sim.day(S);
    S.csat = clamp(S.csat, 1, 5);
    out.forEach(o => {
      if (o.k === 'acc') { Sfx.bad(); this.addLog(`Insiden: ${o.msg}.`, 'bad'); UI.toast(`Insiden keselamatan: ${o.msg}.`, 'bad', 4000); }
      if (o.k === 'fault' && !this.fault) { this.fault = { t: 0, left: 10 }; Sfx.alarm(); UI.toast('Gangguan sinyal di emplasemen! Kirim teknisi segera.', 'warn'); }
    });
    if (!this.crisis && !UI.modalOpen && S.day > 3 && S.day < 29 && chance(.075)) this.smallEvent();
    if (this.v) this.v.setPeople(S.pax / (S.tier === 1 ? 12 : S.tier === 2 ? 30 : 130));
    S.day++;
    if (S.day > 30) { S.day = 30; this.monthEnd(); }
    this.renderTop();
    if (this.tab === 'sum' || this.tab === 'fin') this.renderTab(); else this.refreshButtons();
  },
  /* ---------- evaluasi bulanan Daop ---------- */
  monthEnd() {
    const S = this.S, ev = L5Sim.evaluate(S), g = ev.grade;
    this.speed = 0; this.modalPause = true; this.fault = null;
    if (this.crisis) { this.crisis = null; UI.closeModal(); if (this.v) this.v.crisis(null); }
    const bonus = g === 'A' ? ev.rev * .2 : g === 'B' ? ev.rev * .1 : 0;
    const subsidi = ev.otp >= 95 && ev.clean >= 90 ? 15e6 * S.tier : 0;
    const consequences = [];
    if (g === 'A') consequences.push(`Bonus Kas Daop +20%: <b>${rp(bonus)}</b>`, 'Insentif staf 1,5× gaji pokok (dibayar Daop): moral staf naik', 'Akselerasi kelas stasiun: diskon 30% untuk naik kelas berikutnya');
    if (g === 'B') consequences.push(`Bonus operasional normal (10% pendapatan): <b>${rp(bonus)}</b>`, 'Sertifikat Performa Memuaskan');
    if (g === 'C') consequences.push('Surat Peringatan Pertama (SP 1)', 'Wajib action plan 3 hari', 'Pemotongan insentif 25%: moral staf turun');
    if (g === 'D') consequences.push('Audit khusus direksi', 'Pencopotan jabatan / demosi Kepala Stasiun', 'Penundaan pangkat');
    if (subsidi) consequences.push(`Subsidi & bonus performa Daop (OTP ≥ 95% dan kebersihan ≥ 90%): <b>${rp(subsidi)}</b>`);
    const rowsT = [
      ['Operasional & Keselamatan', 35, `OTP ${ev.otp.toFixed(1)}% · ${S.m.acc} insiden · sinyal ${S.m.faults.length ? (ev.fr >= 30 ? 'tidak tertangani' : ev.fr.toFixed(1) + ' dtk') : '–'}`, 'OTP ≥ 95%, 0 insiden', ev.p1],
      ['Kebersihan & Fasilitas', 25, `Kebersihan ${Math.round(ev.clean)}% · kondisi ${Math.round(ev.cond)}%${S.m.inspect === false ? ' · temuan inspeksi' : ''}`, 'Kebersihan ≥ 90%', ev.p2],
      ['Keuangan & Komersial', 20, `${pct(ev.finR)} target · okupansi ${Math.round(S.occ * 100)}% · beban ${Math.round(ev.effR * 100)}%`, 'Target ≥ 100%', ev.p3],
      ['Kepuasan Penumpang', 20, `CSAT ${ev.csat.toFixed(2)}`, 'CSAT ≥ 4,2', ev.p4],
    ];
    const score = Math.round(ev.score);
    Online.ev('end', { lv: 5, score, dur: Online.dur() });
    S.history.push({ month: S.month, tier: L5_TIER[S.tier].short, score, grade: g, rev: ev.rev });
    const best = Save.data.best[5]; if (!best || score > best.score) { Save.data.best[5] = { score, grade: g }; Save.write(); }
    Sfx[g === 'A' || g === 'B' ? 'promo' : 'bad']();
    UI.modal({
      cls: 'wide', title: `Evaluasi Bulanan PT KAI Daop · Bulan ${S.month}`,
      html: `<div class="evgrid"><div style="display:flex;gap:14px;align-items:center"><div class="score-big mono">${score}</div>${gradeBadge(g)}</div><div><b>${GRADES[g].label}</b>${ev.capped ? ' — dibatasi ke Grade D karena lonjakan mudik tidak tertangani.' : ''}<p class="muted" style="font-size:13px;margin-top:4px">${L5_TIER[S.tier].name} · pendapatan ${rp(ev.rev)} dari target ${rp(ev.target)}</p></div></div>
        <div class="tbl-wrap" style="margin-top:12px"><table class="t"><tr><th>Pilar KPI</th><th>Bobot</th><th>Realisasi</th><th>Target minimum</th><th>Skor</th></tr>${rowsT.map(r => `<tr><td>${r[0]}</td><td class="num">${r[1]}%</td><td>${r[2]}</td><td>${r[3]}</td><td class="num">${Math.round(r[4])}</td></tr>`).join('')}</table></div>
        <div class="grid2" style="margin-top:12px"><div class="panel"><div class="eyebrow">Keputusan Daop</div><ul class="sop" style="margin-top:6px">${consequences.map(c => `<li>${c}</li>`).join('')}</ul></div>
        <div class="panel"><div class="eyebrow">Arus kas bulan ini</div><dl class="kv" style="margin-top:6px"><dt>Pendapatan</dt><dd>${rp(ev.rev)}</dd><dt>Beban operasional</dt><dd>${rp(ev.expOps)}</dd><dt>Investasi</dt><dd>${rp(S.m.exp.investasi)}</dd><dt>Kas akhir</dt><dd>${rp(S.cash + bonus + subsidi)}</dd></dl></div></div>`,
      buttons: [{ label: g === 'D' ? 'Terima keputusan' : (S.month >= 12 ? 'Lihat akhir masa jabatan' : `Lanjut ke Bulan ${S.month + 1}`), cls: 'primary', onClick: () => this.applyEval(ev, bonus, subsidi) }],
    });
  },
  applyEval(ev, bonus, subsidi) {
    const S = this.S, g = ev.grade;
    S.cash += bonus + subsidi; S.m.rev.daop += bonus + subsidi;
    S.lastGrade = g;
    if (g === 'A') { S.moraleMod += 15; S.accel = true; S.cConsec = 0; }
    if (g === 'B') { S.moraleMod += 4; S.cConsec = 0; }
    if (g === 'C') { S.moraleMod -= 12; S.cConsec++; }
    if (g === 'D' || S.cConsec >= 3) return this.demoted(g === 'D' ? 'Grade D pada evaluasi bulanan.' : 'Tiga kali berturut-turut mendapat Grade C (SP 1, SP 2, SP 3).');
    if (S.month >= 12) return this.ending();
    S.month++; S.day = 1; S.monthsAtTier++; L5Sim.newMonth(S);
    this.snapshot();
    this.addLog(`Bulan ${S.month} dimulai.`);
    if (g === 'C') return this.actionPlan();
    this.modalPause = false; this.speed = 1; this.renderTop(); this.renderTab();
  },
  actionPlan() {
    const S = this.S;
    UI.modal({ title: `SP ${S.cConsec}: Wajib Action Plan 3 hari`, cls: 'crisis', html: `<p>Pilih satu program perbaikan yang berjalan 3 hari pertama bulan ini.${S.cConsec >= 2 ? ' <b style="color:var(--stop-ink)">Satu kali lagi Grade C berarti demosi.</b>' : ''}</p>`,
      buttons: L5_PLANS.map(p => ({ label: `${p.name} — ${p.desc}`, cls: 'opt', onClick: () => { this.spend(p.cost, 'lain'); S.plan = p.id; S.planDays = 3; this.addLog(`Action plan: ${p.name}.`, 'warn'); this.modalPause = false; this.speed = 1; this.renderTop(); this.renderTab(); } })) });
  },
  demoted(reason) {
    const S = this.S; S.ended = true; Save.data.l5 = null; Save.write(); this.modalPause = true;
    UI.modal({ title: 'Audit Khusus Direksi', cls: 'crisis', html: `<p>${reason} Direksi memutuskan <b>pencopotan jabatan</b>. Anda didemosi kembali menjadi PPKA dan kenaikan pangkat ditunda.</p><p class="muted" style="margin-top:8px">Masa jabatan berakhir di Bulan ${S.month}. Nilai terbaik bulanan tetap tercatat di kartu karier.</p>`,
      buttons: [{ label: 'Mulai masa jabatan baru', cls: 'primary', onClick: () => Game.start(5) }, { label: 'Kembali ke kartu karier', onClick: () => Game.career() }] });
  },
  ending() {
    const S = this.S; S.ended = true; Save.data.l5 = null; Save.write(); this.modalPause = true;
    const avg = Math.round(L5Sim.avg(S.history.map(h => h.score))), g = gradeOf(avg);
    const best = S.tier === 3 && S.owned.length === L5_FAC.length && S.lastGrade === 'A';
    Sfx.promo();
    UI.modal({ cls: 'wide', title: best ? 'Stasiun Utama Teladan' : 'Akhir Masa Jabatan', html: `<div class="evgrid"><div style="display:flex;gap:14px;align-items:center"><div class="score-big mono">${avg}</div>${gradeBadge(g)}</div><div><p>${best ? 'Dari stasiun kayu Kelas III, Anda membangun Stasiun Utama dengan seluruh fasilitas Tier 3 dan menutup tahun dengan Grade A. Daop menobatkan Anda sebagai Kepala Stasiun Teladan.' : `Masa jabatan 12 bulan selesai di ${L5_TIER[S.tier].name} dengan rata-rata skor ${avg}.`}</p><p class="muted" style="margin-top:6px">Kas akhir ${rp(S.cash)} · ${S.owned.length}/${L5_FAC.length} fasilitas · ${S.history.filter(h => h.grade === 'A').length} kali Grade A.</p></div></div>`,
      buttons: [{ label: 'Kembali ke kartu karier', cls: 'primary', onClick: () => Game.career() }, { label: 'Main lagi', onClick: () => Game.start(5) }] });
  },
};
Levels[5] = L5;
