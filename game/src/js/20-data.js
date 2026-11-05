/* ================= SHARED DATA & PEOPLE ================= */
const NAMES = {
  L: ['Budi', 'Agus', 'Rudi', 'Dimas', 'Fajar', 'Hendra', 'Joko', 'Bayu', 'Rizky', 'Andi', 'Yusuf', 'Teguh', 'Wahyu', 'Arief', 'Bambang', 'Iqbal', 'Gilang', 'Taufik', 'Imam', 'Raka'],
  P: ['Siti', 'Dewi', 'Ayu', 'Rina', 'Lestari', 'Putri', 'Nurul', 'Fitri', 'Indah', 'Sri', 'Wulan', 'Ratna', 'Anisa', 'Maya', 'Kartika', 'Intan', 'Yuni', 'Laras', 'Dian', 'Nadia'],
  last: ['Santoso', 'Wijaya', 'Pratama', 'Saputra', 'Hidayat', 'Kurniawan', 'Setiawan', 'Rahmawati', 'Lestari', 'Nugroho', 'Hasibuan', 'Siregar', 'Simanjuntak', 'Wibowo', 'Purnomo', 'Syahputra', 'Maharani', 'Utami', 'Permana', 'Susanti', 'Halim', 'Manurung', 'Tanjung', 'Ramadhan'],
};
const REGIONS = [['317101', 'Jakarta Pusat'], ['327301', 'Kota Bandung'], ['337401', 'Kota Semarang'], ['347101', 'Kota Yogyakarta'], ['357801', 'Kota Surabaya'], ['337201', 'Kota Surakarta'], ['320901', 'Cirebon'], ['330201', 'Banyumas'], ['357301', 'Kota Malang']];
const SKIN = ['#e9c39b', '#d9a877', '#c68c5a', '#a8713f', '#8d5a34'];
const HAIR = ['#151515', '#2a1d14', '#3b2a1e', '#5a4632', '#777'];
const HIJAB = ['#f1f1f1', '#2b3a67', '#c9566e', '#6b4a2b', '#3f7f6d', '#9a7bc0', '#d9a441'];
const SHIRT = ['#e25d4f', '#3f8fd8', '#f2c14e', '#6bbf72', '#ffffff', '#8e5bd6', '#333c4a', '#c97b3a', '#1d6f8a'];

function makePerson(opts = {}) {
  const sex = opts.sex || (chance(.5) ? 'L' : 'P');
  const first = pick(NAMES[sex]), last = pick(NAMES.last);
  const name = chance(.15) ? first : `${first} ${last}`;
  const year = randi(1958, 2006), month = randi(1, 12), day = randi(1, 28);
  const reg = pick(REGIONS);
  const dd = sex === 'P' ? day + 40 : day;
  const nik = reg[0] + pad2(dd) + pad2(month) + String(year).slice(2) + String(randi(1, 9999)).padStart(4, '0');
  return { sex, name, nik, dob: new Date(year, month - 1, day), city: reg[1], face: makeFace(sex) };
}
function makeFace(sex) {
  return {
    sex, skin: pick(SKIN), hair: pick(HAIR), hijab: sex === 'P' && chance(.55) ? pick(HIJAB) : null,
    style: sex === 'L' ? pick(['short', 'side', 'buzz', 'curly', 'bald']) : pick(['long', 'bob', 'bun', 'long']),
    glasses: chance(.25), beard: sex === 'L' && chance(.2), mus: sex === 'L' && chance(.25), shirt: pick(SHIRT), w: rand(.9, 1.06), brow: rand(-.15, .15), eye: rand(.88, 1.12),
  };
}
function drawFace(cv, f, bg = '#cfd8e3') {
  // potret kartun: kepala bulat, mata besar berkilau, pipi merona, garis tepi lembut
  const g = cv.getContext('2d'), W = cv.width, H = cv.height, cx = W / 2, s = W / 100;
  const OL = '#3a2a35';
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  g.lineJoin = 'round'; g.lineCap = 'round';
  const blob = (fn, fill, line = 2.2) => { g.beginPath(); fn(); g.fillStyle = fill; g.fill(); g.lineWidth = line * s; g.strokeStyle = OL; g.stroke(); };
  // bahu
  blob(() => g.ellipse(cx, H + 10 * s, 40 * s, 32 * s, 0, Math.PI, 0), f.shirt);
  const hw = 30 * s * f.w, hh = 31 * s, hy = H * .45;
  if (f.hijab) {
    blob(() => { g.ellipse(cx, hy + 3 * s, hw + 9 * s, hh + 10 * s, 0, 0, Math.PI * 2); }, f.hijab);
    blob(() => { g.moveTo(cx - hw - 8 * s, hy + 12 * s); g.quadraticCurveTo(cx - 40 * s, H, cx - 30 * s, H + 4 * s); g.lineTo(cx + 30 * s, H + 4 * s); g.quadraticCurveTo(cx + 40 * s, H, cx + hw + 8 * s, hy + 12 * s); g.closePath(); }, f.hijab);
  } else if (f.style === 'long' || f.style === 'bob') {
    blob(() => g.ellipse(cx, hy + (f.style === 'long' ? 12 : 4) * s, hw + 6 * s, hh + (f.style === 'long' ? 18 : 8) * s, 0, 0, Math.PI * 2), f.hair);
  }
  // kepala
  blob(() => g.ellipse(cx, hy, hw, hh, 0, 0, Math.PI * 2), f.skin);
  if (f.hijab) { g.lineWidth = 2 * s; g.strokeStyle = OL; g.beginPath(); g.ellipse(cx, hy + 1 * s, hw - 1 * s, hh - 1 * s, 0, Math.PI * 1.08, Math.PI * 1.92); g.stroke(); }
  // rambut
  if (!f.hijab && f.style !== 'bald') {
    const top = () => { g.ellipse(cx, hy - hh * .42, hw * 1.04, hh * .64, 0, Math.PI * 1.02, Math.PI * 1.98); };
    if (f.style === 'buzz') { g.globalAlpha = .75; blob(top, f.hair, 1.6); g.globalAlpha = 1; }
    else if (f.style === 'curly') { for (let i = -3; i <= 3; i++) blob(() => g.arc(cx + i * 8 * s, hy - hh * .78 + Math.abs(i) * 3.2 * s, 8.5 * s, 0, Math.PI * 2), f.hair, 1.6); }
    else {
      blob(() => { top(); g.quadraticCurveTo(cx + 6 * s, hy - hh * .3, cx - hw * .2, hy - hh * .55); g.closePath(); }, f.hair, 1.8);
      if (f.style === 'side') blob(() => g.ellipse(cx + 12 * s, hy - hh * .62, 12 * s, 6 * s, -.4, 0, Math.PI * 2), f.hair, 1.6);
      if (f.style === 'bun') blob(() => g.arc(cx, hy - hh - 5 * s, 9 * s, 0, Math.PI * 2), f.hair, 1.8);
    }
  }
  // pipi merona
  g.fillStyle = 'rgba(255,120,140,.38)'; [-1, 1].forEach(k => { g.beginPath(); g.ellipse(cx + k * 17 * s, hy + 9 * s, 6 * s, 3.6 * s, 0, 0, Math.PI * 2); g.fill(); });
  // mata besar
  const ey = hy + 1 * s, ex = 11.5 * s, er = 5.6 * s * f.eye;
  [-1, 1].forEach(k => {
    g.fillStyle = '#2a1d2e'; g.beginPath(); g.ellipse(cx + k * ex, ey, er * .82, er, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#5a3a2a'; g.beginPath(); g.ellipse(cx + k * ex, ey + er * .35, er * .55, er * .45, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.arc(cx + k * ex - er * .28, ey - er * .38, er * .32, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(cx + k * ex + er * .3, ey + er * .3, er * .14, 0, Math.PI * 2); g.fill();
  });
  // alis
  g.strokeStyle = f.hijab ? '#2a1d14' : f.hair; g.lineWidth = 2.6 * s;
  [-1, 1].forEach(k => { g.beginPath(); g.moveTo(cx + k * (ex - 5 * s), ey - 10 * s + f.brow * 6 * s * k); g.quadraticCurveTo(cx + k * ex, ey - 12.5 * s, cx + k * (ex + 5 * s), ey - 10.5 * s); g.stroke(); });
  if (f.glasses) { g.strokeStyle = '#2a2a3a'; g.lineWidth = 1.8 * s; [-1, 1].forEach(k => { g.beginPath(); g.ellipse(cx + k * ex, ey, 9 * s, 8 * s, 0, 0, Math.PI * 2); g.stroke(); }); g.beginPath(); g.moveTo(cx - 3 * s, ey - 1 * s); g.quadraticCurveTo(cx, ey - 3 * s, cx + 3 * s, ey - 1 * s); g.stroke(); }
  // hidung & senyum
  g.fillStyle = 'rgba(120,60,40,.35)'; g.beginPath(); g.ellipse(cx, ey + 8 * s, 2.4 * s, 1.6 * s, 0, 0, Math.PI * 2); g.fill();
  if (f.mus) { g.fillStyle = f.hair; g.beginPath(); g.ellipse(cx - 4 * s, ey + 12.5 * s, 4.5 * s, 1.8 * s, .2, 0, Math.PI * 2); g.ellipse(cx + 4 * s, ey + 12.5 * s, 4.5 * s, 1.8 * s, -.2, 0, Math.PI * 2); g.fill(); }
  g.strokeStyle = '#7a2e3a'; g.lineWidth = 2.2 * s; g.beginPath(); g.arc(cx, ey + 12 * s, 5.5 * s, .18 * Math.PI, .82 * Math.PI); g.stroke();
  if (f.beard) { g.fillStyle = f.hair; g.globalAlpha = .55; g.beginPath(); g.ellipse(cx, hy + hh * .72, hw * .55, hh * .26, 0, 0, Math.PI); g.fill(); g.globalAlpha = 1; }
}
const faceCanvas = (f, w, h, bg) => { const c = document.createElement('canvas'); c.width = w; c.height = h; drawFace(c, f, bg); return c; };
const faceSimilar = (a, b) => a === b;
