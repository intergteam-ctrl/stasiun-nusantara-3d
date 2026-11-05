# Stasiun Nusantara 3D — Android

Isi paket:
- `www/` — game versi offline (three.js & font sudah dibundel, tanpa internet).
- `android/` — proyek WebView minimal (MainActivity.java, AndroidManifest.xml, ikon).
- `build-apk.sh` — membangun & menandatangani APK tanpa Gradle (butuh: openjdk, aapt, dalvik-exchange, zipalign, apksigner, android-sdk-platform-23).
- `keystore/stasiun-nusantara.jks` — kunci tanda tangan (password: stasiun123). Simpan baik-baik: update APK harus ditandatangani dengan kunci yang sama. Ganti password sebelum rilis publik.

Build ulang setelah mengubah game:
1. Di folder proyek game: `python3 build.py` (memperbarui `mobile/www`).
2. `./mobile/build-apk.sh` → `StasiunNusantara3D-v1.2.0.apk`.

Spesifikasi: package `id.stasiunnusantara.game`, minSdk 21 (Android 5.0), targetSdk 34, orientasi lanskap, layar penuh, tombol Back = jeda/kembali ke menu, pengumuman stasiun memakai TTS bahasa Indonesia bawaan Android.
