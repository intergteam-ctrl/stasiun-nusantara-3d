/* ================= ONLINE: telemetri anonim, masukan, tantangan harian =================
   Aktif hanya jika halaman menetapkan window.SN_API (situs Netlify: "" = origin sama;
   APK Android: URL absolut situs). Di artifact/preview tidak ada server, jadi semua fitur ini diam. */
const Online = {
  base: typeof window.SN_API === 'string' ? window.SN_API : null,
  get enabled() { return this.base !== null; },
  q: [], lv: 0, lvT: 0, daily: false, _rand: null,
  allowed() { return this.enabled && Save.data.settings.telemetry !== false; },
  sid() {
    let s = Save.data.sid;
    if (!s) {
      try { s = Array.from(crypto.getRandomValues(new Uint8Array(14)), b => (b % 36).toString(36)).join(''); }
      catch (e) { s = (Date.now().toString(36) + Math.random().toString(36).slice(2)).slice(0, 14); }
      Save.data.sid = s; Save.write();
    }
    return s;
  },
  ev(t, o = {}) { if (!this.allowed()) return; this.q.push(Object.assign({ t }, o)); if (this.q.length >= 20) this.flush(); },
  flush() {
    if (!this.allowed() || !this.q.length) return;
    const body = JSON.stringify({ sid: this.sid(), events: this.q.splice(0, 40) }), url = this.base + '/api/event';
    try { if (navigator.sendBeacon && navigator.sendBeacon(url, new Blob([body], { type: 'text/plain' }))) return; } catch (e) { }
    try { fetch(url, { method: 'POST', body, headers: { 'content-type': 'text/plain' }, keepalive: true }).catch(() => { }); } catch (e) { }
  },
  async req(path, data) {
    const opt = data ? { method: 'POST', headers: { 'content-type': 'text/plain' }, body: JSON.stringify(Object.assign({ sid: this.sid(), app: IS_APP }, data)) } : {};
    const r = await fetch(this.base + path, opt);
    let j = {}; try { j = await r.json(); } catch (e) { }
    if (!r.ok) throw new Error(j.error || 'Server tidak merespons (' + r.status + ')');
    return j;
  },
  levelStart(lv, daily) { this.lv = lv; this.lvT = performance.now(); this.daily = !!daily; this.ev('start', { lv, daily: this.daily }); },
  dur() { return Math.round((performance.now() - this.lvT) / 1000); },
  levelEnd(lv, score) { this.ev('end', { lv, score, dur: this.dur(), daily: this.daily }); this.lv = 0; this.flush(); },
  levelQuit(L) { if (!this.lv) return; this.ev('quit', { lv: this.lv, dur: this.dur(), ph: (L && (L.phase || L.mode)) || '', daily: this.daily }); this.lv = 0; this.flush(); },
  // RNG deterministik untuk tantangan harian (mulberry32), dipasang sementara menggantikan Math.random
  seed(seed) {
    if (!this._rand) this._rand = Math.random;
    let a = seed >>> 0;
    Math.random = function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  },
  unseed() { if (this._rand) { Math.random = this._rand; this._rand = null; } },
  init() {
    if (!this.enabled) return;
    setInterval(() => this.flush(), 15000);
    addEventListener('pagehide', () => this.flush());
    document.addEventListener('visibilitychange', () => { if (document.hidden) this.flush(); });
    this.ev('open', {});
  },
};
