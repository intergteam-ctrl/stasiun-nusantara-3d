import type { Config, Context } from "@netlify/functions";
import { getStore } from "@netlify/blobs";
import { cleanName, cleanSid, dailyFor, int, jktDate, json, rankBoard, readJson } from "../lib/util.mts";

// Kirim skor tantangan harian. Skor terbaik per pemain dipakai untuk peringkat.
export default async (req: Request, context: Context) => {
  let b: any;
  try { b = await readJson(req, 4000); } catch { return json({ error: "Body harus JSON" }, 400); }
  const sid = cleanSid(b?.sid), score = int(b?.score, 0, 100);
  if (!sid || score === null) return json({ error: "Data skor tidak valid" }, 400);
  // Hanya tantangan hari ini, atau kemarin (pemain yang mulai sebelum tengah malam WIB).
  const allowed = [jktDate(), jktDate(-1)];
  if (!allowed.includes(b.date)) return json({ error: "Tantangan untuk tanggal ini sudah ditutup" }, 409);
  const d = dailyFor(b.date);
  if (int(b.level, 1, 5) !== d.level) return json({ error: "Level tidak sesuai tantangan hari ini" }, 400);
  const name = cleanName(b.name);
  const store = getStore("leaderboard");
  try {
    await store.set(`lb/${d.date}/${String(score).padStart(3, "0")}/${sid}/${encodeURIComponent(name)}/${Date.now()}`, "1");
    const { blobs } = await store.list({ prefix: `lb/${d.date}/` });
    const ranked = rankBoard(blobs.map(x => x.key));
    const idx = ranked.findIndex(e => e.sid === sid);
    return json({
      ok: true, date: d.date, rank: idx + 1, players: ranked.length, best: ranked[idx]?.score ?? score,
      top: ranked.slice(0, 10).map((e, i) => ({ rank: i + 1, name: e.name, score: e.score, me: e.sid === sid })),
    });
  } catch (err) { console.error("score write failed", err); return json({ error: "Gagal menyimpan skor" }, 500); }
};

export const config: Config = { path: "/api/score", method: ["POST"] };
