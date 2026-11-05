/* ================= LEVEL 5 DATA & SIMULATION (Bab 3–5) ================= */
const L5_TIER = {
  1: { name: 'Stasiun Kelas III', short: 'Kelas III', cap: 500, target: 50e6, slots: 2, rent: 2.5e6, maintBase: 5e6, upCost: 0, rec: { ob: 2, tiket: 1, ppka: 1, teknisi: 1, polsuska: 1, cs: 1 } },
  2: { name: 'Stasiun Kelas II', short: 'Kelas II', cap: 3000, target: 270e6, slots: 3, rent: 6e6, maintBase: 18e6, upCost: 250e6, rec: { ob: 6, tiket: 3, ppka: 2, teknisi: 2, polsuska: 3, cs: 2 } },
  3: { name: 'Stasiun Utama (Interchange Hub)', short: 'Utama', cap: 18000, target: 1.9e9, slots: 6, rent: 15e6, maintBase: 140e6, upCost: 800e6, rec: { ob: 24, tiket: 10, ppka: 3, teknisi: 6, polsuska: 10, cs: 6 } },
};
const L5_FAC = [
  { id: 'gate', tier: 2, name: 'Gate E-Ticket Automatic', cost: 90e6, desc: 'Kapasitas layanan +1.500 penumpang/hari. CSAT naik, antrean loket berkurang.' },
  { id: 'face', tier: 2, name: 'Face Recognition Scanner', cost: 70e6, req: 'gate', desc: 'Boarding tanpa tiket kertas: kapasitas layanan +1.000/hari, keamanan identitas meningkat.' },
  { id: 'canopy', tier: 2, name: 'Canopy Roof Peron', cost: 60e6, desc: 'Peron terlindung hujan. CSAT naik, risiko krisis banjir di peron berkurang, fasilitas lebih awet.' },
  { id: 'food', tier: 2, name: 'Tenant Food Court', cost: 85e6, desc: '+4 slot tenant (kopi, minimarket, UMKM). Menambah sampah: butuh OB lebih banyak.' },
  { id: 'pos', tier: 2, name: 'Pos Kesehatan', cost: 45e6, desc: 'Penanganan penumpang sakit di stasiun. CSAT naik, dampak insiden berkurang.' },
  { id: 'vip', tier: 3, name: 'Executive VIP Lounge', cost: 320e6, desc: 'Pendapatan lounge harian dan +2 slot tenant premium.' },
  { id: 'sky', tier: 3, name: 'Skybridge & Garbarata Kereta', cost: 550e6, desc: 'Penumpang tidak menyeberang rel: risiko kecelakaan turun 50%, CSAT naik, kapasitas +10%.' },
  { id: 'ctc', tier: 3, name: 'CTC Centralized Traffic Control', cost: 700e6, desc: 'OTP naik, kebutuhan PPKA berkurang 1, gangguan sinyal turun 60%.' },
  { id: 'parkir', tier: 3, name: 'Parkir Bertingkat', cost: 420e6, desc: 'Pendapatan parkir ×2,2 dan kenyamanan jemput-antar.' },
];
const L5_FAC_CSAT = { gate: .12, face: .08, canopy: .1, food: .1, pos: .06, vip: .08, sky: .14, ctc: .04, parkir: .06 };
const L5_STAFF = {
  ob: { name: 'OB / Cleaning Service', gaji: 3.6e6, peran: 'Kebersihan hall, peron, toilet' },
  tiket: { name: 'Petugas Ticketing', gaji: 4.4e6, peran: 'Layanan loket & antrean' },
  ppka: { name: 'PPKA', gaji: 6.5e6, peran: 'Sinyal, wesel, OTP' },
  teknisi: { name: 'Teknisi', gaji: 5.4e6, peran: 'Listrik, sinyal, perawatan' },
  polsuska: { name: 'Polsuska', gaji: 4.9e6, peran: 'Keamanan & ketertiban' },
  cs: { name: 'Customer Service', gaji: 4.2e6, peran: 'Komplain & Lost and Found' },
};
const L5_CRISIS = {
  banjir: { name: 'Cuaca Ekstrem & Banjir Rel', cost: 15e6, need: ['ob', 'ppka'], needTxt: 'OB & PPKA', sla: 300, fail: 'Kereta anjlok / cancel jadwal massal', desc: 'Hujan deras membuat air menggenangi emplasemen dan rel di ujung timur. Air harus dipompa dan perjalanan kereta diatur ulang.' },
  blackout: { name: 'Blackout Listrik Stasiun', cost: 8e6, need: ['teknisi', 'polsuska'], needTxt: 'Teknisi & Polsuska', sla: 60, fail: 'Antrean gate mati & kerusuhan hall', desc: 'Listrik PLN padam dan genset tidak menyala otomatis. Gate dan papan informasi mati, penumpang mulai berdesakan di hall.' },
  mudik: { name: 'Lonjakan Mudik Lebaran', cost: 25e6, need: ['ob', 'tiket', 'ppka', 'teknisi', 'polsuska', 'cs'], needTxt: 'Seluruh staf', sla: 0, fail: 'Rating stasiun anjlok ke Grade D', desc: 'Masa angkutan Lebaran: permintaan melonjak lebih dari dua kali lipat selama 8 hari.' },
};
const L5_EVENTS = [
  { t: 'Tenant UMKM minta keringanan', d: 'Pengelola gerai UMKM meminta keringanan sewa 50% bulan ini karena penjualan sepi.', o: [
    ['Setujui keringanan', S => { S.tenantRelief = 1; S.csat += .04; }, 'Pendapatan tenant bulan ini turun, hubungan dengan UMKM membaik.'],
    ['Tolak, sewa tetap', S => { S.tenantLeave = 1; }, 'Satu tenant memutuskan tidak memperpanjang sewa.']] },
  { t: 'Keluhan viral: toilet kotor', d: 'Foto toilet stasiun yang kotor viral di media sosial.', o: [
    ['Tambah shift lembur OB (Rp 3 jt)', S => { S.cash -= 3e6; S.m.exp.lain += 3e6; S.clean = Math.min(100, S.clean + 8); }, 'Toilet langsung dibersihkan, warganet mengapresiasi.'],
    ['Cukup klarifikasi di media sosial', S => { S.csat -= .15; }, 'Klarifikasi tanpa tindakan memperburuk citra stasiun.']] },
  { t: 'Akses difabel', d: 'Penumpang kursi roda kesulitan naik ke peron. Komunitas difabel meminta ramp dan guiding block.', o: [
    ['Bangun ramp & guiding block (Rp 12 jt)', S => { S.cash -= 12e6; S.m.exp.lain += 12e6; S.bonusCsat += .05; }, 'Fasilitas inklusif terpasang. CSAT naik permanen.'],
    ['Tunda ke tahun depan', S => { S.csat -= .08; }, 'Keluhan berlanjut.']] },
  { t: 'Tuntutan uang lembur', d: 'Perwakilan staf meminta uang lembur yang tertunda dibayarkan.', o: [
    ['Bayarkan (Rp 6 jt)', S => { S.cash -= 6e6; S.m.exp.gaji += 6e6; S.moraleMod += 8; }, 'Moral staf naik.'],
    ['Tolak dengan alasan anggaran', S => { S.moraleMod -= 12; }, 'Moral staf turun.']] },
  { t: 'Barang berharga tertinggal', d: 'Penumpang menyerahkan tas berisi laptop yang tertinggal di ruang tunggu.', o: [
    ['Proses melalui Lost & Found (CS) sesuai SOP', S => { if (S.staff.cs > 0) S.csat += .06; else S.csat -= .05; }, 'Ditangani CS dan dikembalikan ke pemilik (jika ada staf CS).'],
    ['Simpan di ruang Kepala Stasiun', S => { S.csat -= .04; }, 'Tidak tercatat di sistem Lost & Found; pemilik kesulitan melacak.']] },
  { t: 'Tawaran CCTV analitik', d: 'Vendor menawarkan CCTV analitik untuk memantau kepadatan dan keamanan hall.', o: [
    ['Pasang (Rp 20 jt)', S => { S.cash -= 20e6; S.m.exp.lain += 20e6; S.cctv = 1; }, 'Keamanan meningkat, risiko insiden turun.'],
    ['Lewati', S => { }, 'Tidak ada perubahan.']] },
];
const L5_PLANS = [
  { id: 'clean', name: 'Kerja bakti kebersihan total', desc: 'Kebersihan +8 selama 3 hari. Biaya Rp 3 jt.', cost: 3e6 },
  { id: 'otp', name: 'Briefing keselamatan & evaluasi jadwal PPKA', desc: 'OTP +2 poin selama 3 hari. Biaya Rp 2 jt.', cost: 2e6 },
  { id: 'csat', name: 'Program layanan prima', desc: 'CSAT +0,2 selama 3 hari. Biaya Rp 2,5 jt.', cost: 2.5e6 },
];

const L5Sim = {
  fresh() {
    return {
      month: 1, day: 1, cash: 260e6, tier: 1, owned: [], staff: { ob: 1, tiket: 1, ppka: 1, teknisi: 1, polsuska: 1, cs: 0 },
      morale: 64, moraleMod: 0, maint: 40, rent: 'normal', parkir: 'normal', cond: 68, clean: 78, csat: 3.5, otp: 96, demand: 420, pax: 0,
      bonusCsat: 0, cctv: 0, tenantRelief: 0, tenantLeave: 0, occ: .8, monthsAtTier: 0, accel: false, lastGrade: null, cConsec: 0,
      plan: null, planDays: 0, fx: { otpCut: 0, paxCut: 0, csatCut: 0 }, mudik: { month: 3, prepared: false, active: false, failed: false, warned: {} },
      history: [], m: null, log: [], evDone: [], inspectDay: randi(8, 22), banjirDay: randi(6, 24), ended: false,
    };
  },
  newMonth(S) {
    S.m = { rev: { pax: 0, tenant: 0, parkir: 0, lounge: 0, daop: 0 }, exp: { gaji: 0, maint: 0, krisis: 0, investasi: 0, rekrut: 0, lain: 0 }, otp: [], clean: [], csat: [], cond: [], pax: [], acc: 0, faults: [], inspect: null, capD: false, cash0: S.cash };
    S.inspectDay = randi(8, 22); S.banjirDay = S.month === 2 ? randi(6, 22) : (chance(.35) ? randi(4, 26) : 0);
    S.tenantRelief = 0; S.tenantLeave = 0;
    this.updOcc(S);
  },
  own(S, k) { return S.owned.includes(k); },
  cap(S) { return L5_TIER[S.tier].cap * (this.own(S, 'sky') ? 1.1 : 1); },
  slots(S) { return L5_TIER[S.tier].slots + (this.own(S, 'food') ? 4 : 0) + (this.own(S, 'vip') ? 2 : 0); },
  rentMult(S) { return { rendah: .75, normal: 1, tinggi: 1.35 }[S.rent]; },
  updOcc(S) {
    const r = { rendah: .12, normal: 0, tinggi: -.25 }[S.rent];
    S.occ = clamp(.55 + (S.demand / this.cap(S)) * .3 + (S.clean - 85) / 100 + r - (S.tenantLeave ? .15 : 0), .2, 1);
  },
  tenantMonthly(S) {
    const T = L5_TIER[S.tier], sl = this.slots(S), occ = Math.round(sl * S.occ);
    let base = occ * T.rent * this.rentMult(S);
    if (this.own(S, 'vip')) base += Math.min(2, occ) * 10e6 * this.rentMult(S);
    return base * (S.tenantRelief ? .7 : 1);
  },
  salary(S) { return Object.entries(S.staff).reduce((a, [k, n]) => a + n * L5_STAFF[k].gaji, 0); },
  recMaint(S) { return L5_TIER[S.tier].maintBase + S.owned.reduce((a, k) => a + L5_FAC.find(f => f.id === k).cost * .008, 0); },
  thr(S) { return S.staff.tiket * 450 + (this.own(S, 'gate') ? 1500 : 0) + (this.own(S, 'face') ? 1000 : 0) + (S.tier === 3 ? 8000 : 0); },
  needPPKA(S) { return Math.max(1, S.tier - (this.own(S, 'ctc') ? 1 : 0)); },
  understaff(S) {
    const rec = L5_TIER[S.tier].rec; let miss = 0, tot = 0;
    for (const k in rec) { tot += rec[k]; miss += Math.max(0, rec[k] - S.staff[k]); }
    return miss / tot;
  },
  facCsat(S) { return S.owned.reduce((a, k) => a + (L5_FAC_CSAT[k] || 0), 0); },
  /* one simulated day; returns array of events */
  day(S) {
    const T = L5_TIER[S.tier], cap = this.cap(S), out = [];
    const peak = S.mudik.active;
    // demand
    const tgt = cap * clamp(.55 + .15 * (S.csat - 3), .35, 1.05);
    S.demand += (tgt - S.demand) * .07;
    const dow = (S.day + 2) % 7, weekend = dow === 5 || dow === 6;
    let mult = weekend ? 1.15 : 1; if (peak) mult *= S.mudik.prepared ? 2.1 : 2.3; if (S.fx.paxCut > 0) mult *= .4;
    const demand = S.demand * mult;
    const pax = Math.round(Math.min(demand, cap * (peak && S.mudik.prepared ? 1.6 : 1.1)));
    S.pax = pax;
    const thr = this.thr(S) * (peak && S.mudik.prepared ? 1.6 : 1);
    // condition
    S.cond = clamp(S.cond - 1.35 * (this.own(S, 'canopy') ? .85 : 1) + (S.maint / 100) * 1.15 + Math.min(S.staff.teknisi, T.rec.teknisi) / T.rec.teknisi * .45 - (peak ? .6 : 0), 0, 100);
    // clean
    const obCap = [0, 290, 560, 800][S.tier] * S.staff.ob * (.85 + S.morale / 500) * (this.own(S, 'food') ? .9 : 1) * (peak && S.mudik.prepared ? 1.5 : 1);
    const cleanT = 48 + 52 * Math.pow(Math.min(1, obCap / Math.max(1, pax)), 1.3) - Math.max(0, 60 - S.cond) * .4 + (S.plan === 'clean' ? 8 : 0);
    S.clean = clamp(S.clean + (cleanT - S.clean) * .3, 0, 100);
    // OTP
    const needP = this.needPPKA(S);
    let otpT = 98.4 - 5.5 * Math.max(0, needP - S.staff.ppka) - Math.max(0, 70 - S.cond) * .12 + (this.own(S, 'ctc') ? 1.4 : 0) + (S.morale - 70) * .02 + (S.plan === 'otp' ? 2 : 0) - Math.max(0, demand / thr - 1) * 2.5 - (peak && !S.mudik.prepared ? 6 : 0);
    let otp = clamp(otpT + rand(-1.4, 1.0), 30, 100);
    if (S.fx.otpCut > 0) { otp = Math.min(otp, 60); S.fx.otpCut--; }
    S.otp = otp;
    // CSAT
    const rec = T.rec;
    let csT = 3.3 + this.facCsat(S) + S.bonusCsat + (S.clean - 85) * .022 + (Math.min(1, thr / Math.max(1, demand)) - 1) * 1.8
      + Math.min(S.staff.cs, rec.cs) / rec.cs * .22 + Math.min(S.staff.polsuska, rec.polsuska) / rec.polsuska * .12 + (otp - 95) * .03
      - (demand > cap * 1.05 ? .25 : 0) + ({ rendah: .05, normal: 0, tinggi: -.15 }[S.parkir]) + (S.morale - 70) * .004 + (S.plan === 'csat' ? .2 : 0) - (S.tier === 1 ? .05 : 0);
    if (S.fx.csatCut > 0) { csT -= .7; S.fx.csatCut--; }
    S.csat = clamp(S.csat + (csT - S.csat) * .22, 1, 5);
    // morale
    const moT = 72 - 30 * this.understaff(S) + S.moraleMod - (peak && !S.mudik.prepared ? 10 : 0);
    S.morale = clamp(S.morale + (moT - S.morale) * .15, 10, 100);
    S.moraleMod *= .97;
    // accidents
    let p = .0012 + Math.max(0, 55 - S.cond) * .0018 + Math.max(0, needP - S.staff.ppka) * .02;
    if (this.own(S, 'sky')) p *= .5; if (S.cctv) p *= .85;
    if (Math.random() < p) { S.m.acc++; S.csat -= this.own(S, 'pos') ? .08 : .18; out.push({ k: 'acc', msg: pick(['Penumpang tertemper kereta saat menyeberang rel', 'Gangguan wesel menyebabkan kereta anjlok ringan di emplasemen', 'Penumpang jatuh di celah peron']) }); }
    // signal fault event
    let pf = .045 * (this.own(S, 'ctc') ? .4 : 1) * (S.cond < 60 ? 1.6 : 1);
    if (Math.random() < pf) out.push({ k: 'fault' });
    // money
    const revPax = pax * 2500;
    const pr = { rendah: [3000, 1.2], normal: [5000, 1], tinggi: [8000, .7] }[S.parkir];
    const revPark = pax * .14 * pr[0] * pr[1] * (this.own(S, 'parkir') ? 2.2 : 1);
    const revLounge = this.own(S, 'vip') ? pax * .006 * 50000 : 0;
    const revTen = this.tenantMonthly(S) / 30;
    const gaji = this.salary(S) / 30, maint = this.recMaint(S) * S.maint / 100 / 30;
    S.cash += revPax + revPark + revLounge + revTen - gaji - maint;
    const m = S.m;
    m.rev.pax += revPax; m.rev.parkir += revPark; m.rev.lounge += revLounge; m.rev.tenant += revTen; m.exp.gaji += gaji; m.exp.maint += maint;
    m.otp.push(otp); m.clean.push(S.clean); m.csat.push(S.csat); m.cond.push(S.cond); m.pax.push(pax);
    if (S.plan) { S.planDays--; if (S.planDays <= 0) S.plan = null; }
    if (S.fx.paxCut > 0) S.fx.paxCut--;
    return out;
  },
  avg(a) { return a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0; },
  evaluate(S) {
    const m = S.m, T = L5_TIER[S.tier];
    const otp = this.avg(m.otp), clean = this.avg(m.clean), csat = this.avg(m.csat), cond = this.avg(m.cond);
    const rev = Object.values(m.rev).reduce((a, b) => a + b, 0) - m.rev.daop;
    const expOps = m.exp.gaji + m.exp.maint + m.exp.krisis + m.exp.lain + m.exp.rekrut;
    const target = T.target * (S.monthsAtTier === 0 && S.tier > 1 ? .6 : 1);
    // pilar 1: operasional & keselamatan
    const otpS = otp >= 95 ? 100 : clamp(100 - (95 - otp) * 9, 0, 100);
    const accS = m.acc === 0 ? 100 : Math.max(0, 100 - 60 * m.acc);
    const fr = m.faults.length ? this.avg(m.faults.map(f => f == null ? 30 : f)) : 0;
    const sigS = m.faults.length ? clamp(100 - Math.max(0, fr - 3) * 7, 0, 100) : 100;
    const p1 = otpS * .55 + accS * .30 + sigS * .15;
    // pilar 2: kebersihan & fasilitas
    const clS = clean >= 90 ? 100 : clamp(100 - (90 - clean) * 4, 0, 100);
    const p2 = clamp(clS * .7 + cond * .3 - (m.inspect === false ? 10 : 0), 0, 100);
    // pilar 3: keuangan & komersial
    const finR = rev / target * 100;
    const effR = rev > 0 ? expOps / rev : 2;
    const effS = clamp(100 - Math.max(0, effR - .7) * 160, 0, 100);
    const p3 = clamp(Math.min(100, finR) * .6 + S.occ * 100 * .2 + effS * .2, 0, 100);
    // pilar 4: kepuasan
    const p4 = csat >= 4.2 ? 100 : clamp(100 - (4.2 - csat) * 70, 0, 100);
    let score = p1 * .35 + p2 * .25 + p3 * .20 + p4 * .20;
    let capped = false;
    if (S.mudik.failed && S.mudik.month === S.month) { score = Math.min(score, 59); capped = true; }
    return { otp, clean, csat, cond, rev, expOps, target, finR, effR, fr, p1, p2, p3, p4, score, grade: gradeOf(score), capped, otpS, accS, sigS, clS };
  },
};
