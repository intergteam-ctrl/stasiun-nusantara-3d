import type { Config, Context } from "@netlify/functions";
import { getStore } from "@netlify/blobs";
import { cleanSid, int, jktDate, json, readJson } from "../lib/util.mts";

// Masukan pemain: rating 1–5 + komentar opsional.
export default async (req: Request, context: Context) => {
  let b: any;
  try { b = await readJson(req, 4000); } catch { return json({ error: "Body harus JSON" }, 400); }
  const sid = cleanSid(b?.sid), rating = int(b?.rating, 1, 5);
  if (!sid || rating === null) return json({ error: "Rating 1–5 wajib diisi" }, 400);
  const text = String(b.text ?? "").replace(/[\u0000-\u001f]/g, " ").trim().slice(0, 600);
  const entry = { rating, text, lv: int(b.lv, 0, 5) ?? 0, where: String(b.where ?? "").slice(0, 20), platform: b.app ? "android" : "web", country: context.geo?.country?.code ?? "", ts: Date.now() };
  try {
    await getStore("feedback").setJSON(`fb/${jktDate()}/${entry.ts}-${sid}`, entry);
  } catch (err) { console.error("feedback write failed", err); return json({ error: "Gagal menyimpan" }, 500); }
  return json({ ok: true });
};

export const config: Config = { path: "/api/feedback", method: ["POST"] };
