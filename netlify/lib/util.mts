// Utilitas bersama untuk API Stasiun Nusantara 3D
export const LEVEL_NAMES = ['', 'OB / Cleaning Service', 'Ticketing & Announcer', 'Kondektur & PTP', 'PPKA', 'Kepala Stasiun'];
export const DAILY_LEVELS = [1, 2, 3, 4];

/** Tanggal (YYYY-MM-DD) di zona waktu Asia/Jakarta (UTC+7). offsetDays boleh negatif. */
export function jktDate(offsetDays = 0): string {
  return new Date(Date.now() + 7 * 3600e3 + offsetDays * 86400e3).toISOString().slice(0, 10);
}

/** Tantangan harian: level bergilir 1–4, seed deterministik dari tanggal. */
export function dailyFor(date: string) {
  const dayNum = Math.floor(Date.parse(date + 'T00:00:00Z') / 86400e3);
  const level = DAILY_LEVELS[((dayNum % DAILY_LEVELS.length) + DAILY_LEVELS.length) % DAILY_LEVELS.length];
  let h = 2166136261;
  for (const c of 'stasiun-nusantara:' + date) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
  return { date, level, seed: h >>> 0, job: LEVEL_NAMES[level] };
}

// Respons JSON. CORS terbuka hanya karena APK Android memanggil API dari origin file:// ("null").
export function json(data: unknown, status = 200, extra: Record<string, string> = {}): Response {
  return new Response(status === 204 ? null : JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*', 'cache-control': 'no-store', ...extra },
  });
}

export function cleanSid(v: unknown): string | null {
  return typeof v === 'string' && /^[a-z0-9]{8,32}$/.test(v) ? v : null;
}

export function cleanName(v: unknown): string {
  const s = String(v ?? '').normalize('NFKC').replace(/[^\p{L}\p{N} .'-]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 20);
  return s || 'Pegawai';
}

export const int = (v: unknown, lo: number, hi: number): number | null => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) && n >= lo && n <= hi ? n : null;
};

/** Body bisa dikirim sebagai text/plain (sendBeacon) agar tidak memicu preflight CORS. */
export async function readJson(req: Request, maxBytes = 20000): Promise<any> {
  const t = await req.text();
  if (t.length > maxBytes) throw new Error('payload terlalu besar');
  return JSON.parse(t);
}

export interface LbEntry { score: number; sid: string; name: string; ts: number }

/** Kunci papan peringkat: lb/<tanggal>/<skor 3 digit>/<sid>/<nama>/<ts> — bisa dibaca dari listing saja. */
export function parseLbKey(key: string): LbEntry | null {
  const p = key.split('/');
  if (p.length < 6) return null;
  try { return { score: +p[2], sid: p[3], name: decodeURIComponent(p[4]), ts: +p[5] }; } catch { return null; }
}

/** Peringkat terbaik per pemain (skor tertinggi; seri → yang lebih dulu). */
export function rankBoard(keys: string[]): LbEntry[] {
  const best = new Map<string, LbEntry>();
  for (const k of keys) {
    const e = parseLbKey(k); if (!e) continue;
    const b = best.get(e.sid);
    if (!b || e.score > b.score || (e.score === b.score && e.ts < b.ts)) best.set(e.sid, e);
  }
  return [...best.values()].sort((a, b) => b.score - a.score || a.ts - b.ts);
}
