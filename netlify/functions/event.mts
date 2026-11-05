import type { Config, Context } from "@netlify/functions";
import { getStore } from "@netlify/blobs";
import { cleanSid, int, jktDate, json, readJson } from "../lib/util.mts";

// Telemetri anonim. Setiap event disimpan sebagai satu kunci yang berisi ringkasannya,
// sehingga statistik bisa dihitung dari listing kunci tanpa membaca isi blob.
// ev/<tanggal>/<tipe>/<level>/<skor>/<durasi>/<fase>/<daily>/<sid>/<ts>-<i>
const TYPES = new Set(["open", "start", "end", "quit"]);

export default async (req: Request, context: Context) => {
  let body: any;
  try { body = await readJson(req); } catch { return json({ error: "Body harus JSON" }, 400); }
  const sid = cleanSid(body?.sid);
  if (!sid || !Array.isArray(body.events)) return json({ error: "sid/events tidak valid" }, 400);
  const store = getStore("telemetry");
  const date = jktDate(), now = Date.now();
  const writes = body.events.slice(0, 40).map((e: any, i: number) => {
    if (!e || !TYPES.has(e.t)) return null;
    const lv = int(e.lv, 0, 5) ?? 0;
    const score = int(e.score, 0, 100) ?? -1;
    const dur = int(e.dur, 0, 7200) ?? -1;
    const ph = String(e.ph ?? "-").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 12) || "-";
    const daily = e.daily ? 1 : 0;
    return store.set(`ev/${date}/${e.t}/${lv}/${score}/${dur}/${ph}/${daily}/${sid}/${now}-${i}`, "1");
  }).filter(Boolean);
  try { await Promise.all(writes); } catch (err) { console.error("telemetry write failed", err); return json({ error: "Gagal menyimpan" }, 500); }
  return json(null, 204);
};

export const config: Config = { path: "/api/event", method: ["POST"] };
