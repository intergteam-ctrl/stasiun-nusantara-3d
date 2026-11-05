import type { Config, Context } from "@netlify/functions";
import { getStore } from "@netlify/blobs";
import { dailyFor, jktDate, json, rankBoard } from "../lib/util.mts";

// Tantangan harian: level & seed hari ini (WIB) + 10 besar papan peringkat.
export default async (req: Request, context: Context) => {
  const d = dailyFor(jktDate());
  let top: any[] = [], players = 0;
  try {
    const { blobs } = await getStore("leaderboard").list({ prefix: `lb/${d.date}/` });
    const ranked = rankBoard(blobs.map(b => b.key));
    players = ranked.length;
    top = ranked.slice(0, 10).map((e, i) => ({ rank: i + 1, name: e.name, score: e.score }));
  } catch (err) { console.error("leaderboard list failed", err); }
  return json({ ...d, players, top });
};

export const config: Config = { path: "/api/daily", method: ["GET"] };
