// Imperivm offline cache. Bump VERSION whenever you upload a new index.html.
const VERSION='imperivm-v22';
const CORE=['./','./index.html','./manifest.webmanifest','./icon-180.png','./icon-192.png','./icon-512.png'];
const FONT_CSS='https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700;900&family=EB+Garamond:ital,wght@0,400;0,600;1,400&display=swap';
const THREE_JS='https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js';
async function cacheThree(c){try{const r=await fetch(THREE_JS,{mode:'cors'});if(r.ok)await c.put(THREE_JS,r);}catch(e){}}
async function cacheFonts(c){
  try{
    const res=await fetch(FONT_CSS,{mode:'cors'});if(!res.ok)return;
    const css=await res.clone().text();await c.put(FONT_CSS,res);
    const urls=[...css.matchAll(/url\((https:[^)]+)\)/g)].map(m=>m[1]);
    await Promise.all(urls.map(u=>fetch(u,{mode:'cors'}).then(r=>r.ok&&c.put(u,r)).catch(()=>{})));
  }catch(e){}
}
self.addEventListener('install',e=>{e.waitUntil(caches.open(VERSION).then(async c=>{await c.addAll(CORE);await cacheFonts(c);await cacheThree(c);}).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  const req=e.request;if(req.method!=='GET')return;
  e.respondWith((async()=>{
    const c=await caches.open(VERSION);
    const hit=await c.match(req,{ignoreVary:true});
    const net=fetch(req).then(res=>{if(res&&(res.ok||res.type==='opaque'))c.put(req,res.clone());return res;}).catch(()=>null);
    if(hit){e.waitUntil(net);return hit;}
    const res=await net;if(res)return res;
    if(req.mode==='navigate')return (await c.match('./index.html'))||Response.error();
    return Response.error();
  })());
});
