'use strict';
/* ---------- platform ---------- */
const IS_APP = !!window.AndroidBridge;
const LITE = IS_APP || (window.matchMedia && matchMedia('(pointer:coarse)').matches);
const SHORT = () => window.innerHeight < 520 && window.innerWidth > window.innerHeight;
/* ================= UTIL ================= */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a, b) => a + Math.random() * (b - a);
const randi = (a, b) => Math.floor(rand(a, b + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const chance = p => Math.random() < p;
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const rp = n => (n < 0 ? '−' : '') + 'Rp ' + Math.round(Math.abs(n)).toLocaleString('id-ID');
const rpShort = n => {
  const a = Math.abs(n), s = n < 0 ? '−' : '';
  if (a >= 1e9) return s + 'Rp ' + (a / 1e9).toLocaleString('id-ID', { maximumFractionDigits: 2 }) + ' M';
  if (a >= 1e6) return s + 'Rp ' + (a / 1e6).toLocaleString('id-ID', { maximumFractionDigits: 1 }) + ' jt';
  if (a >= 1e3) return s + 'Rp ' + Math.round(a / 1e3) + ' rb';
  return s + 'Rp ' + Math.round(a);
};
const pad2 = n => String(Math.floor(n)).padStart(2, '0');
const clock = mins => { mins = ((mins % 1440) + 1440) % 1440; return pad2(mins / 60) + ':' + pad2(mins % 60); };
const mmss = s => { s = Math.max(0, Math.ceil(s)); return pad2(s / 60) + ':' + pad2(s % 60); };
const pct = v => Math.round(v) + '%';
const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const tglIndo = d => `${HARI[d.getDay()]}, ${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`;
const tglShort = d => `${pad2(d.getDate())}-${pad2(d.getMonth() + 1)}-${d.getFullYear()}`;
const terbilangAngka = n => ['nol', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh'][n] || String(n);

const Levels = {};
/* ================= GRADE (Bab 5.2) ================= */
const GRADES = {
  A: { min: 90, label: 'Grade A', reward: 'Bonus Kas Daop +20%, Insentif Staf 1.5x Gaji Pokok, Kenaikan Akselerasi Kelas Stasiun.' },
  B: { min: 75, label: 'Grade B', reward: 'Pencairan bonus operasional normal (100%), Sertifikat Performa Memuaskan.' },
  C: { min: 60, label: 'Grade C', reward: 'Surat Peringatan Pertama (SP 1), Wajib Action Plan 3 hari, Pemotongan insentif 25%.' },
  D: { min: 0, label: 'Grade D', reward: 'Audit Khusus Direksi, Pencopotan Jabatan / Demosi, Penundaan Pangkat.' },
};
const gradeOf = s => s >= 90 ? 'A' : s >= 75 ? 'B' : s >= 60 ? 'C' : 'D';
const gradeBadge = g => `<span class="grade ${g || 'none'}">${g || '–'}</span>`;

/* ================= SAVE ================= */
const Save = {
  key: 'stasiun-nusantara-3d-v1',
  data: null,
  fresh() { return { name: '', unlocked: 1, best: {}, runs: 0, settings: { sound: true, voice: true }, l5: null }; },
  load() {
    let d = null;
    try { d = JSON.parse(localStorage.getItem(this.key) || 'null'); } catch (e) { d = null; }
    this.data = Object.assign(this.fresh(), d || {});
    this.data.settings = Object.assign({ sound: true, voice: true }, this.data.settings || {});
    return this.data;
  },
  write() { try { localStorage.setItem(this.key, JSON.stringify(this.data)); } catch (e) { /* storage unavailable */ } },
  reset() { this.data = this.fresh(); this.write(); },
};

/* ================= AUDIO (WebAudio synth) ================= */
const Sfx = {
  ctx: null,
  ensure() {
    if (!Save.data.settings.sound) return null;
    try {
      if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (this.ctx.state === 'suspended') this.ctx.resume();
    } catch (e) { this.ctx = null; }
    return this.ctx;
  },
  tone(f, d = .12, type = 'sine', v = .12, when = 0, slide = 0) {
    const c = this.ensure(); if (!c) return;
    const t = c.currentTime + when, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), t + d);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + .01); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g).connect(c.destination); o.start(t); o.stop(t + d + .02);
  },
  noise(d = .3, v = .2, when = 0, hp = 400) {
    const c = this.ensure(); if (!c) return;
    const len = Math.floor(c.sampleRate * d), b = c.createBuffer(1, len, c.sampleRate), ch = b.getChannelData(0);
    for (let i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const s = c.createBufferSource(), g = c.createGain(), f = c.createBiquadFilter();
    f.type = 'highpass'; f.frequency.value = hp; s.buffer = b; g.gain.value = v;
    s.connect(f).connect(g).connect(c.destination); s.start(c.currentTime + when);
  },
  click() { this.tone(900, .04, 'square', .04); },
  ok() { this.tone(660, .1, 'sine', .1); this.tone(990, .14, 'sine', .1, .08); },
  bad() { this.tone(220, .2, 'sawtooth', .07); this.tone(180, .25, 'sawtooth', .06, .1); },
  chime() { [784, 659, 523, 659].forEach((f, i) => this.tone(f, .5, 'sine', .09, i * .28)); },
  horn() { this.tone(311, .9, 'sawtooth', .05); this.tone(392, .9, 'sawtooth', .04); },
  crash() { this.noise(1.2, .5, 0, 80); this.tone(80, .8, 'square', .1, 0, -40); },
  alarm() { for (let i = 0; i < 4; i++) { this.tone(880, .18, 'square', .06, i * .4); this.tone(660, .18, 'square', .06, i * .4 + .2); } },
  sweep() { this.noise(.18, .08, 0, 1800); },
  cash() { this.tone(1320, .06, 'square', .05); this.tone(1760, .1, 'square', .05, .06); },
  promo() { [523, 659, 784, 1047].forEach((f, i) => this.tone(f, .3, 'triangle', .1, i * .12)); },
};
const Voice = {
  say(text) {
    if (!Save.data.settings.voice) return;
    try { if (window.AndroidBridge && AndroidBridge.speak) { AndroidBridge.speak(text); return; } } catch (e) { }
    try {
      const s = window.speechSynthesis; if (!s) return;
      s.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'id-ID'; u.rate = 1.0; u.pitch = 1.05;
      const v = s.getVoices().find(v => /id[-_]ID/i.test(v.lang)); if (v) u.voice = v;
      s.speak(u);
    } catch (e) { /* speech unavailable */ }
  },
  stop() { try { window.AndroidBridge && AndroidBridge.stop && AndroidBridge.stop(); } catch (e) { } try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch (e) { } },
};

/* ================= UI ================= */
const UI = {
  screens: null, hud: null,
  init() { this.screens = $('#screens'); this.hud = $('#hud'); },
  screen(html) { this.screens.innerHTML = html; this.screens.scrollTop = 0; },
  clearScreen() { this.screens.innerHTML = ''; },
  setHud(html) { this.hud.innerHTML = html; },
  toast(msg, kind = '', ms = 2600) {
    const t = document.createElement('div'); t.className = 'toast ' + kind; t.innerHTML = msg;
    const box = $('#toasts'); box.prepend(t);
    while (box.children.length > 4) box.lastChild.remove();
    setTimeout(() => t.remove(), ms);
  },
  modalOpen: false,
  modal({ title = '', html = '', buttons = [{ label: 'Tutup', cls: 'primary' }], cls = '', onOpen = null }) {
    const m = $('#modal'), box = m.querySelector('.box');
    box.className = 'box ' + cls;
    box.innerHTML = (title ? `<h3 class="disp">${title}</h3>` : '') + `<div class="mbody">${html}</div><div class="btnrow mbtns"></div>`;
    const row = box.querySelector('.mbtns');
    buttons.forEach(b => {
      const el = document.createElement('button'); el.className = 'btn ' + (b.cls || ''); el.innerHTML = b.label;
      if (b.disabled) el.disabled = true;
      if (b.id) el.id = b.id;
      el.onclick = () => { Sfx.click(); if (b.close !== false) UI.closeModal(); b.onClick && b.onClick(); };
      row.appendChild(el);
    });
    m.classList.remove('hide'); this.modalOpen = true;
    onOpen && onOpen(box);
    const f = row.querySelector('.btn:not([disabled])'); f && f.focus({ preventScroll: true });
    return box;
  },
  closeModal() { $('#modal').classList.add('hide'); this.modalOpen = false; },
};
