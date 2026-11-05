import glob, os, shutil
head=open('src/head.html').read(); body=open('src/body.html').read()
js='\n'.join(open(f).read() for f in sorted(glob.glob('src/js/*.js')))
CDN='https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'
out=head+'\n'+body+'\n<script src="'+CDN+'"></script>\n<script>\n'+js+'\n</script>\n'
open('stasiun-nusantara-3d.html','w').write(out)
open('test.html','w').write('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body style="margin:0">'+out.replace(CDN,'node_modules/three/build/three.min.js')+'</body></html>')
# ---- mobile / APK bundle (offline) ----
www='mobile/www'; os.makedirs(www+'/fonts', exist_ok=True)
fonts=[('Fredoka','fredoka',[500,600,700]),('Nunito','nunito',[500,600,700,800,900]),('JetBrains Mono','jetbrains-mono',[500,700])]
css=[]
for fam,slug,ws in fonts:
    for w in ws:
        fn=f'{slug}-latin-{w}-normal.woff2'
        shutil.copy(f'node_modules/@fontsource/{slug}/files/{fn}', f'{www}/fonts/{fn}')
        css.append(f"@font-face{{font-family:'{fam}';font-style:normal;font-weight:{w};font-display:swap;src:url(fonts/{fn}) format('woff2');}}")
open(www+'/fonts.css','w').write('\n'.join(css))
shutil.copy('node_modules/three/build/three.min.js', www+'/three.min.js')
mhead=head
a=mhead.index('<link rel="preconnect"'); b=mhead.index('<style>')
mhead=mhead[:a]+'<link rel="stylesheet" href="fonts.css">\n'+mhead[b:]
doc=('<!doctype html><html lang="id"><head><meta charset="utf-8">'
     '<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">'
     '<meta name="theme-color" content="#6cc4ff">'
     '<style>html,body{margin:0;padding:0}:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}[hidden]{display:none!important}</style>'
     + mhead + '<script>window.SN_API = window.SN_API ?? "https://lively-pudding-8d6c8b.netlify.app";</script></head><body>' + body + '<script src="three.min.js"></script>\n<script>\n' + js + '\n</script></body></html>')
open(www+'/index.html','w').write(doc)
print(len(out), len(doc))

# ---- Netlify site (web offline bundle + APK download + PWA manifest) ----
site=os.environ.get('SN_SITE_DIR','netlify-site')
if os.path.isdir(site): shutil.rmtree(site)
shutil.copytree(www, site)
apk=sorted(glob.glob('mobile/StasiunNusantara3D-v*.apk'))
os.makedirs(site+'/download', exist_ok=True)
apkname=None
if apk:
    apkname=os.path.basename(apk[-1]); shutil.copy(apk[-1], f'{site}/download/{apkname}')
os.makedirs(site+'/icons', exist_ok=True)
from PIL import Image
im=Image.open('mobile/icon-512.png'); im.save(site+'/icons/icon-512.png'); im.resize((192,192), Image.LANCZOS).save(site+'/icons/icon-192.png'); im.resize((180,180), Image.LANCZOS).save(site+'/icons/apple-touch-icon.png')
import json
json.dump({"name":"Stasiun Nusantara 3D","short_name":"Stasiun Nusantara","start_url":"/","display":"fullscreen","orientation":"landscape","background_color":"#6cc4ff","theme_color":"#6cc4ff","lang":"id",
  "icons":[{"src":"/icons/icon-192.png","sizes":"192x192","type":"image/png"},{"src":"/icons/icon-512.png","sizes":"512x512","type":"image/png","purpose":"any maskable"}]}, open(site+'/manifest.webmanifest','w'), indent=1)
idx=open(site+'/index.html').read()
extra='<script>window.SN_API = "";</script><link rel="manifest" href="/manifest.webmanifest"><link rel="apple-touch-icon" href="/icons/apple-touch-icon.png"><link rel="icon" type="image/png" href="/icons/icon-192.png"><meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="description" content="Simulasi karier kereta api 3D: dari OB sampai Kepala Stasiun.">'
if apkname: extra+=f'<script>window.SN_APK_URL="/download/{apkname}";</script>'
idx=idx.replace('<meta name="theme-color" content="#6cc4ff">','<meta name="theme-color" content="#6cc4ff">'+extra,1)
open(site+'/index.html','w').write(idx)
open(site+'/netlify.toml','w').write("""[build]
  publish = "."

[[headers]]
  for = "/download/*"
  [headers.values]
    Content-Type = "application/vnd.android.package-archive"
    Content-Disposition = "attachment"

[[headers]]
  for = "/fonts/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/three.min.js"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
""")
print('netlify-site ready', apkname)
open(site+'/_headers','w').write("""/download/*
  Content-Type: application/vnd.android.package-archive
  Content-Disposition: attachment
/fonts/*
  Cache-Control: public, max-age=31536000, immutable
/three.min.js
  Cache-Control: public, max-age=31536000, immutable
""")
shutil.copy('game-admin.html', site+'/admin.html')
