# Stasiun Nusantara 3D

Game simulasi karier perkeretaapian 3D (OB → Ticketing → Kondektur → PPKA → Kepala Stasiun), versi web + APK Android, dengan API di Netlify.

## Struktur

| Folder | Isi |
|---|---|
| `site/` | Situs statis yang dipublikasikan Netlify: game (offline, three.js & font dibundel), `admin.html`, ikon/manifest PWA, `download/*.apk` |
| `netlify/functions/` | API (Netlify Functions + Blobs) |
| `netlify/lib/` | Utilitas bersama API |
| `game/` | Kode sumber game (`src/`), skrip build (`build.py`), proyek Android (`mobile/`) |

## API

| Endpoint | Fungsi |
|---|---|
| `POST /api/event` | Telemetri anonim (open/start/end/quit per level, skor, durasi, fase berhenti). Bisa dimatikan pemain. |
| `POST /api/feedback` | Masukan pemain (bintang 1–5 + komentar). |
| `GET /api/daily` | Tantangan harian (level bergilir 1–4, seed acak yang sama untuk semua pemain, ganti 00.00 WIB) + 10 besar. |
| `POST /api/score` | Kirim skor tantangan harian; skor terbaik per pemain dipakai untuk peringkat. |
| `GET /api/stats` | Statistik untuk `admin.html`. Butuh header `x-admin-key` = env var **`ADMIN_KEY`** (scope: Functions). |

Data disimpan di Netlify Blobs (store `telemetry`, `feedback`, `leaderboard`) dan bisa dilihat di **Data & Storage → Blobs**.

## Mengubah game

```bash
cd game
npm i three@0.128.0 @fontsource/fredoka@5 @fontsource/nunito@5 @fontsource/jetbrains-mono@5   # sekali saja
pip install pillow                                                                          # untuk ikon
python3 build.py                     # membangun netlify-site/ dan mobile/www/
cp -r netlify-site/. ../site/ && rm -f ../site/netlify.toml ../site/_headers
```
Lalu commit & push: Netlify men-deploy otomatis.

APK: lihat `game/mobile/README.md` (butuh aapt, dalvik-exchange, zipalign, apksigner, android-sdk-platform-23, dan keystore yang **tidak** disimpan di repo ini).
