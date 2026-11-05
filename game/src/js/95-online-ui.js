/* ================= ONLINE UI: masukan, tantangan harian, sertifikat ================= */
Object.assign(Game, {
  daily: null,
  /* ---------- masukan ---------- */
  feedback(where = 'menu', lv = 0) {
    if (!Online.enabled) return;
    let rating = 0;
    UI.modal({
      title: 'Beri masukan',
      html: `<p class="muted" style="font-size:13px">Seberapa seru game ini? Masukan Anda dibaca langsung oleh tim pengembang.</p>
        <div class="stars" role="radiogroup" aria-label="Rating">${[1, 2, 3, 4, 5].map(i => `<button class="star" data-star="${i}" aria-label="${i} bintang">★</button>`).join('')}</div>
        <div class="field" style="margin-top:10px"><label for="fb-text">Komentar (opsional)</label><textarea id="fb-text" maxlength="600" rows="3" placeholder="Apa yang paling Anda suka, atau apa yang membingungkan?"></textarea></div>
        <p class="muted" style="font-size:11.5px;margin-top:6px">Tanpa nama atau email. Dikirim bersama level yang sedang dimainkan.</p>`,
      buttons: [{ label: 'Kirim masukan', cls: 'primary', id: 'fb-send', close: false, onClick: async () => {
        if (!rating) { UI.toast('Pilih jumlah bintang dulu.', 'warn'); return; }
        const b = $('#fb-send'); b.disabled = true; b.textContent = 'Mengirim…';
        try { await Online.req('/api/feedback', { rating, text: $('#fb-text').value, lv, where }); UI.closeModal(); UI.toast('Terima kasih! Masukan Anda sudah terkirim.', 'good'); Sfx.ok(); }
        catch (e) { b.disabled = false; b.textContent = 'Kirim masukan'; UI.toast('Gagal mengirim: ' + e.message + '. Cek koneksi internet.', 'bad', 4000); }
      } }, { label: 'Batal', cls: 'ghost' }],
      onOpen: box => $$('[data-star]', box).forEach(s => s.onclick = () => { rating = +s.dataset.star; Sfx.click(); $$('[data-star]', box).forEach(x => x.classList.toggle('on', +x.dataset.star <= rating)); }),
    });
  },
  /* ---------- tantangan harian ---------- */
  boardHTML(top, players, empty = 'Belum ada skor hari ini. Jadilah yang pertama!') {
    if (!top || !top.length) return `<p class="muted" style="font-size:13px">${empty}</p>`;
    return `<table class="t lb" style="min-width:0"><tr><th>#</th><th>Nama</th><th style="text-align:right">Skor</th></tr>${top.map(r => `<tr class="${r.me ? 'me' : ''}"><td class="num" style="text-align:left">${r.rank <= 3 ? ['🥇', '🥈', '🥉'][r.rank - 1] : r.rank}</td><td>${esc(r.name)}${r.me ? ' <span class="tag go">Anda</span>' : ''}</td><td class="num">${r.score}</td></tr>`).join('')}</table>
      <p class="muted" style="font-size:12px;margin-top:6px">${players} pemain hari ini</p>`;
  },
  async dailyScreen() {
    this.exitLevel();
    UI.screen(`<div class="screen"><div class="sheet"><div><div class="eyebrow">Tantangan harian</div><h2 class="disp">Memuat tantangan…</h2></div></div></div>`);
    let d;
    try { d = await Online.req('/api/daily'); }
    catch (e) {
      UI.screen(`<div class="screen"><div class="sheet"><div><div class="eyebrow">Tantangan harian</div><h2 class="disp">Tidak bisa terhubung</h2></div>
        <div class="panel"><p>${esc(e.message)}. Tantangan harian butuh koneksi internet.</p><div class="btnrow" style="margin-top:12px"><button class="btn primary" id="b-retry">Coba lagi</button><button class="btn ghost" id="b-back">Menu utama</button></div></div></div></div>`);
      $('#b-retry').onclick = () => this.dailyScreen(); $('#b-back').onclick = () => this.title(); return;
    }
    const me = (Save.data.daily || {})[d.date];
    const dt = new Date(d.date + 'T00:00:00');
    UI.screen(`<div class="screen"><div class="sheet">
      <div class="btnrow" style="justify-content:space-between;align-items:flex-end"><div><div class="eyebrow">Tantangan harian · ${tglIndo(dt)}</div><h2 class="disp">Level ${d.level} · ${esc(d.job)}</h2></div><button class="btn ghost" id="b-back">Menu utama</button></div>
      <div class="grid2">
        <div class="panel" style="display:flex;flex-direction:column;gap:12px">
          <p>Semua pemain mendapat <b>skenario acak yang sama</b> hari ini: stok awal, jadwal, penumpang, dan kejadiannya. Skor terbaik Anda masuk papan peringkat. Tantangan berganti setiap pukul 00.00 WIB.</p>
          <p class="muted" style="font-size:12.5px">Tantangan harian tidak mengubah kartu karier Anda. Level yang belum terbuka di karier tetap bisa dicoba di sini.</p>
          ${me ? `<p class="tag go" style="align-self:flex-start;font-size:12.5px;padding:5px 10px">Skor terbaik Anda hari ini: <b>${me.score}</b>${me.rank ? ` · peringkat ${me.rank}` : ''}</p>` : ''}
          <div class="field"><label for="dname">Nama di papan peringkat</label><input id="dname" maxlength="20" value="${esc(Save.data.name || '')}" placeholder="Nama Anda"></div>
          <div class="btnrow"><button class="btn primary" id="b-play">${me ? 'Coba lagi' : 'Mulai tantangan'}</button></div>
        </div>
        <div class="panel"><h3 class="disp">Papan peringkat</h3><div style="margin-top:8px">${this.boardHTML(d.top, d.players)}</div></div>
      </div></div></div>`);
    $('#b-back').onclick = () => this.title();
    $('#b-play').onclick = () => {
      const n = $('#dname').value.trim(); if (n) { Save.data.name = n; Save.write(); }
      if (d.level === 1 && !GL.ok) { UI.toast('Level 1 membutuhkan WebGL (grafis 3D).', 'bad'); return; }
      Sfx.click(); this.brief(d.level, { date: d.date, level: d.level, seed: d.seed });
    };
  },
  async dailySubmit(lv, score, g, daily) {
    const el = $('#daily-res'); if (!el) return;
    try {
      const r = await Online.req('/api/score', { date: daily.date, level: lv, score, name: Save.data.name || 'Pegawai' });
      const all = Save.data.daily || (Save.data.daily = {});
      const prev = all[daily.date];
      if (!prev || r.best >= prev.score) all[daily.date] = { score: r.best, rank: r.rank };
      Save.write();
      el.innerHTML = `<div class="btnrow" style="justify-content:space-between;align-items:center"><h3 class="disp">Peringkat hari ini: #${r.rank} dari ${r.players}</h3><span class="tag go">Skor terbaik Anda: ${r.best}</span></div><div style="margin-top:8px">${this.boardHTML(r.top, r.players)}</div>`;
    } catch (e) {
      el.innerHTML = `<p class="tag stop" style="font-size:12.5px;padding:5px 10px">Skor belum terkirim: ${esc(e.message)}</p><div class="btnrow" style="margin-top:8px"><button class="btn sm" id="b-resend">Kirim ulang</button></div>`;
      $('#b-resend').onclick = () => { el.innerHTML = '<p class="muted">Mengirim skor…</p>'; this.dailySubmit(lv, score, g, daily); };
    }
  },
  /* ---------- sertifikat ---------- */
  certificate(lv, score, g, daily) {
    const W = 1200, H = 675, c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
    const rr = (a, b, w, h, r) => { x.beginPath(); x.moveTo(a + r, b); x.arcTo(a + w, b, a + w, b + h, r); x.arcTo(a + w, b + h, a, b + h, r); x.arcTo(a, b + h, a, b, r); x.arcTo(a, b, a + w, b, r); x.closePath(); };
    const gr = x.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#6cc4ff'); gr.addColorStop(.6, '#bfe7ff'); gr.addColorStop(1, '#fff1d6'); x.fillStyle = gr; x.fillRect(0, 0, W, H);
    x.fillStyle = '#93d66e'; x.beginPath(); x.ellipse(220, H + 60, 420, 170, 0, 0, Math.PI * 2); x.fill(); x.fillStyle = '#86cf73'; x.beginPath(); x.ellipse(980, H + 80, 460, 190, 0, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#1d3f73'; rr(70, 60, W - 140, H - 120, 34); x.fill(); x.fillStyle = '#ffd36b'; rr(80, 70, W - 160, H - 140, 28); x.fill(); x.fillStyle = '#fff'; rr(92, 82, W - 184, H - 164, 22); x.fill();
    x.textAlign = 'center'; x.fillStyle = '#e86f0c'; x.font = '600 26px "Fredoka", sans-serif'; x.fillText(daily ? 'SERTIFIKAT TANTANGAN HARIAN' : 'SERTIFIKAT KINERJA', W / 2, 150);
    x.fillStyle = '#6b7f9e'; x.font = '600 24px "Nunito", sans-serif'; x.fillText('Diberikan kepada', W / 2, 200);
    x.fillStyle = '#1d3f73'; x.font = '700 64px "Fredoka", sans-serif'; x.fillText(Save.data.name || 'Pegawai', W / 2, 272, W - 260);
    x.fillStyle = '#1f3557'; x.font = '600 26px "Nunito", sans-serif'; x.fillText(`atas kinerja sebagai ${CAREER[lv - 1].jab} (Level ${lv})`, W / 2, 322, W - 260);
    const gc = { A: '#22b573', B: '#3a8ef6', C: '#f5b41a', D: '#f0505a' }[g];
    x.fillStyle = gc; rr(W / 2 - 170, 360, 140, 140, 28); x.fill(); x.fillStyle = '#fff'; x.font = '700 96px "Fredoka", sans-serif'; x.fillText(g, W / 2 - 100, 465);
    x.textAlign = 'left'; x.fillStyle = '#1d3f73'; x.font = '700 110px "Fredoka", sans-serif'; x.fillText(String(score), W / 2 - 4, 470);
    x.fillStyle = '#6b7f9e'; x.font = '600 22px "Nunito", sans-serif'; x.fillText('skor dari 100', W / 2 + 2, 500);
    x.textAlign = 'center'; x.fillStyle = '#6b7f9e'; x.font = '600 22px "Nunito", sans-serif';
    x.fillText(`${tglIndo(daily ? new Date(daily.date + 'T00:00:00') : new Date())}${location.host ? ' · ' + location.host : ''}`, W / 2, 538);
    x.fillStyle = '#1d3f73'; x.font = '700 30px "Fredoka", sans-serif'; x.fillText('Stasiun Nusantara 3D', W / 2, 576);
    const url = c.toDataURL('image/png');
    const canShare = !IS_APP && navigator.canShare;
    UI.modal({
      cls: 'wide', title: 'Sertifikat Anda',
      html: `<img src="${url}" alt="Sertifikat ${esc(Save.data.name || 'Pegawai')}: Level ${lv}, skor ${score}, ${g}" style="width:100%;border-radius:14px;display:block">
        ${IS_APP ? '<p class="muted" style="font-size:12.5px">Ambil tangkapan layar untuk menyimpan atau membagikan sertifikat ini.</p>' : ''}`,
      buttons: [
        ...(canShare ? [{ label: 'Bagikan', cls: 'primary', close: false, onClick: async () => {
          try { const blob = await (await fetch(url)).blob(); const file = new File([blob], 'sertifikat-stasiun-nusantara.png', { type: 'image/png' });
            if (navigator.canShare({ files: [file] })) await navigator.share({ files: [file], title: 'Sertifikat Stasiun Nusantara 3D', text: `Saya meraih skor ${score} (${g}) sebagai ${CAREER[lv - 1].jab} di Stasiun Nusantara 3D!` });
            else UI.toast('Perangkat ini tidak mendukung berbagi gambar. Gunakan Unduh gambar.', 'warn'); } catch (e) { /* dibatalkan */ }
        } }] : []),
        ...(!IS_APP ? [{ label: 'Unduh gambar', close: false, onClick: () => { const a = document.createElement('a'); a.href = url; a.download = `sertifikat-level${lv}-${score}.png`; document.body.appendChild(a); a.click(); a.remove(); } }] : []),
        { label: 'Tutup', cls: 'ghost' },
      ],
    });
  },
});
