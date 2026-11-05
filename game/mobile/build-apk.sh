#!/usr/bin/env bash
# Membangun APK tanpa Gradle: javac -> dx -> aapt -> zipalign -> apksigner
set -euo pipefail
cd "$(dirname "$0")"
SDK_JAR=/usr/lib/android-sdk/platforms/android-23/android.jar
OUT=build; rm -rf $OUT; mkdir -p $OUT/classes $OUT/gen $OUT/assets
cp -r www $OUT/assets/www
# R.java + resources
aapt package -f -m -J $OUT/gen -M android/AndroidManifest.xml -S android/res -I $SDK_JAR
javac -nowarn -source 8 -target 8 -bootclasspath $SDK_JAR -classpath $SDK_JAR -d $OUT/classes \
  $(find android/src -name '*.java') $(find $OUT/gen -name '*.java') 2>&1 | grep -v "warning" || true
dalvik-exchange --dex --min-sdk-version=21 --output=$OUT/classes.dex $OUT/classes
aapt package -f -0 arsc -M android/AndroidManifest.xml -S android/res -A $OUT/assets -I $SDK_JAR -F $OUT/unsigned.apk
( cd $OUT && aapt add unsigned.apk classes.dex >/dev/null )
zipalign -p -f 4 $OUT/unsigned.apk $OUT/aligned.apk
KS=keystore/stasiun-nusantara.jks
if [ ! -f $KS ]; then mkdir -p keystore; keytool -genkeypair -keystore $KS -storepass stasiun123 -keypass stasiun123 -alias stasiun \
  -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=Stasiun Nusantara 3D, O=TerarcTR, C=ID" >/dev/null 2>&1; fi
apksigner sign --ks $KS --ks-pass pass:stasiun123 --key-pass pass:stasiun123 --ks-key-alias stasiun \
  --min-sdk-version 21 --v1-signing-enabled true --v2-signing-enabled true --v3-signing-enabled true \
  --out StasiunNusantara3D-v1.2.0.apk $OUT/aligned.apk
apksigner verify --verbose StasiunNusantara3D-v1.2.0.apk | head -6
ls -la StasiunNusantara3D-v1.2.0.apk
