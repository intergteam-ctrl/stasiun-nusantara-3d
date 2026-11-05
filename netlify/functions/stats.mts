import type { Config, Context } from "@netlify/functions";
import { getStore } from "@netlify/blobs";
import { dailyFor, int, jktDate, json, rankBoard } from "../lib/util.mts";

// Statistik untuk halaman admin. Dilindungi kunci ADMIN_KEY (env var, scope Functions).
type Lv = { starts: number; ends: number; pass: number; scoreSum: number; durSum: number; durN: number; quits: number; quitPh: Record<string, number> };

export default async (req: Request, context: Context) => {
  const key = Netlify.env.get("ADMIN_KEY");
  if (!key) return json({ error: "ADMIN_KEY belum diatur di Netlify" }, 503);
  if (req.headers.get("x-admin-key") !== key) return json({ error: "Kunci admin salah" }, 401);
  const days = int(new URL(req.url).searchParams.get("days"), 1, 30) ?? 7;
  const tel = getStore("telemetry");
  const lv: Lv[] = Array.from({ length: 6 }, () => ({ starts: 0, ends: 0, pass: 0, scoreSum: 0, durSum: 0, durN: 0, quits: 0, quitPh: {} }));
  const perDay: { date: string; sessions: number; plays: number; dailyPlays: number }[] = [];
  const allSessions = new Set<string>();
  try {
    for (let i = days - 1; i >= 0; i--) {
      const date = jktDate(-i);
      const { blobs } = await tel.list({ prefix: `ev/${date}/` });
      const sessions = new Set<string>(); let plays = 0, dailyPlays = 0;
      for (const { key: k } of blobs) {
        const [, , t, l, s, du, ph, daily, sid] = k.split("/");
        const L = lv[+l] ?? lv[0]; sessions.add(sid); allSessions.add(sid);
        if (t === "start") { L.starts++; plays++; if (daily === "1") dailyPlays++; }
        if (t === "end") { L.ends++; const sc = +s; if (sc >= 0) { L.scoreSum += sc; if (sc >= 75) L.pass++; } if (+du >= 0) { L.durSum += +du; L.durN++; } }
        if (t === "quit") { L.quits++; L.quitPh[ph] = (L.quitPh[ph] ?? 0) + 1; }
      }
      perDay.push({ date, sessions: sessions.size, plays, dailyPlays });
    }
    // Masukan terbaru (maks. 40) dalam rentang hari yang sama
    const fbStore = getStore("feedback");
    const fbKeys: string[] = [];
    for (let i = 0; i < days; i++) { const { blobs } = await fbStore.list({ prefix: `fb/${jktDate(-i)}/` }); fbKeys.push(...blobs.map(b => b.key)); }
    fbKeys.sort().reverse();
    const feedback = (await Promise.all(fbKeys.slice(0, 40).map(k => fbStore.get(k, { type: "json" })))).filter(Boolean);
    const ratingAll = fbKeys.length;
    // Papan peringkat hari ini
    const today = dailyFor(jktDate());
    const { blobs: lbBlobs } = await getStore("leaderboard").list({ prefix: `lb/${today.date}/` });
    const board = rankBoard(lbBlobs.map(b => b.key)).slice(0, 20).map((e, i) => ({ rank: i + 1, name: e.name, score: e.score }));
    return json({
      days, generatedAt: new Date().toISOString(), uniqueSessions: allSessions.size, perDay, feedbackCount: ratingAll,
      levels: lv.slice(1).map((L, i) => ({
        level: i + 1, starts: L.starts, ends: L.ends, quits: L.quits, pass: L.pass,
        avgScore: L.ends ? Math.round(L.scoreSum / L.ends) : null, avgDur: L.durN ? Math.round(L.durSum / L.durN) : null,
        topQuitPhase: Object.entries(L.quitPh).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null,
      })),
      feedback, today: { ...today, board },
    });
  } catch (err) {
    console.error("stats failed", err);
    return json({ error: "Gagal membaca data" }, 500);
  }
};

export const config: Config = { path: "/api/stats", method: ["GET"] };
