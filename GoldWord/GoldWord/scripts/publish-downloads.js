const fs=require('fs');
const path=require('path');

const ROOT=path.resolve(__dirname,'..');
const WWW=path.join(ROOT,'www');
const OUT_DIR=path.join(WWW,'downloads');

function ensureDir(p){ if(!fs.existsSync(p)) fs.mkdirSync(p,{recursive:true}) }
function latestByMtime(files){ return files.sort((a,b)=>fs.statSync(b).mtimeMs-fs.statSync(a).mtimeMs)[0] }

function collectArtifacts(){
  const pkg=require(path.join(ROOT,'package.json'))
  const version=pkg.version||'latest'
  const entries=[]

  // Android phone/pad 优先取 flavor 输出；否则回退通用 release
  try{
    const phoneDir = path.join(ROOT,'android','app','build','outputs','apk','phone','release')
    const padDir   = path.join(ROOT,'android','app','build','outputs','apk','pad','release')
    const phoneMeta= path.join(phoneDir,'output-metadata.json')
    const padMeta  = path.join(padDir,'output-metadata.json')
    const fallback = path.join(ROOT,'android','app','build','outputs','apk','release','app-release.apk')
    if (fs.existsSync(phoneMeta)) {
      const m = JSON.parse(fs.readFileSync(phoneMeta,'utf8'))
      const f = path.join(phoneDir, (m.elements&&m.elements[0]&&m.elements[0].outputFile) || 'app-phone-release.apk')
      if (fs.existsSync(f)) entries.push({type:'android-phone',file:f,name:`GoldWord-Android-Phone-${version}.apk`})
    }
    if (fs.existsSync(padMeta)) {
      const m = JSON.parse(fs.readFileSync(padMeta,'utf8'))
      const f = path.join(padDir, (m.elements&&m.elements[0]&&m.elements[0].outputFile) || 'app-pad-release.apk')
      if (fs.existsSync(f)) entries.push({type:'android-pad',file:f,name:`GoldWord-Android-Pad-${version}.apk`})
    }
    if (!entries.find(e=>e.type==='android-phone') || !entries.find(e=>e.type==='android-pad')) {
      if (fs.existsSync(fallback)) {
        if (!entries.find(e=>e.type==='android-phone')) entries.push({type:'android-phone',file:fallback,name:`GoldWord-Android-Phone-${version}.apk`})
        if (!entries.find(e=>e.type==='android-pad'))   entries.push({type:'android-pad',file:fallback,name:`GoldWord-Android-Pad-${version}.apk`})
      }
    }
  }catch{}

  // Desktop packages
  try{
    const desk=path.join(ROOT,'desktop','dist')
    if (fs.existsSync(desk)) {
      const dmgs=fs.readdirSync(desk).filter(f=>/GoldWord-.*\.dmg$/.test(f)).map(f=>path.join(desk,f))
      const zips=fs.readdirSync(desk).filter(f=>/GoldWord-.*\.zip$/.test(f)).map(f=>path.join(desk,f))
      const winSetup=fs.readdirSync(desk).filter(f=>/GoldWord---win-setup\.exe$/.test(f)).map(f=>path.join(desk,f))
      if (dmgs.length) entries.push({type:'mac',file:latestByMtime(dmgs),name:`GoldWord-mac-${version}.dmg`})
      if (zips.length) entries.push({type:'mac',file:latestByMtime(zips),name:`GoldWord-mac-${version}.zip`})
      if (winSetup.length) entries.push({type:'win',file:latestByMtime(winSetup),name:`GoldWord-win-setup-${version}.exe`})
    }
  }catch{}

  // iPad .ipa 捕获（若存在）
  try{
    const iosRoot=path.join(ROOT,'ios')
    const ipas=[]
    const scan=(dir)=>{
      if(!fs.existsSync(dir)) return
      fs.readdirSync(dir,{withFileTypes:true}).forEach(d=>{
        const p=path.join(dir,d.name)
        if(d.isDirectory()) scan(p)
        else if(/\.ipa$/.test(d.name)) ipas.push(p)
      })
    }
    scan(iosRoot)
    if (ipas.length) entries.push({type:'ipad',file:latestByMtime(ipas),name:`GoldWord-iPad-${version}.ipa`})
  }catch{}

  return { version, entries }
}

function publish(){
  const { version, entries } = collectArtifacts()
  ensureDir(OUT_DIR)
  const verDir = path.join(OUT_DIR, version)
  ensureDir(verDir)
  const items=[]
  for(const e of entries){
    const dest=path.join(verDir, e.name)
    fs.copyFileSync(e.file, dest)
    if (e.type==='ipad') {
      let cfg={}
      try { cfg = JSON.parse(fs.readFileSync(path.join(OUT_DIR,'config.json'),'utf8')) } catch {}
      const bundleId = cfg.bundle_id || cfg.bundleId || 'com.goldword.app'
      const icon192 = 'https://goldword2.netlify.app/icons/icon-192x192.png'
      const icon512 = 'https://goldword2.netlify.app/icons/icon-512x512.png'
      const manifestPath = path.join(verDir,'manifest.plist')
      const plist = `<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n<plist version="1.0"><dict><key>items</key><array><dict><key>assets</key><array><dict><key>kind</key><string>software-package</string><key>url</key><string>https://goldword2.netlify.app/downloads/${version}/${e.name}</string></dict><dict><key>kind</key><string>display-image</string><key>url</key><string>${icon192}</string></dict><dict><key>kind</key><string>full-size-image</string><key>url</key><string>${icon512}</string></dict></array><key>metadata</key><dict><key>bundle-identifier</key><string>${bundleId}</string><key>bundle-version</key><string>${version}</string><key>kind</key><string>software</string><key>title</key><string>GoldWord</string></dict></dict></array></dict></plist>`
      fs.writeFileSync(manifestPath, plist)
      items.push({ type:'ipad', name:e.name, url:`itms-services://?action=download-manifest&url=https://goldword2.netlify.app/downloads/${version}/manifest.plist` })
    } else {
      items.push({ type:e.type, name:e.name, url:`downloads/${version}/${e.name}` })
    }
    console.log(`[downloads] ${path.basename(e.file)} → ${path.relative(WWW,dest)}`)
  }
  fs.writeFileSync(path.join(verDir,'index.json'), JSON.stringify({ version, date:new Date().toISOString(), items }))
  fs.writeFileSync(path.join(OUT_DIR,'latest.json'), JSON.stringify({ latest:version }))
}

publish()
