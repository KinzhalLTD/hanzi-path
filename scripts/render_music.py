import sys,asyncio,base64
from playwright.async_api import async_playwright
P,O=sys.argv[1],sys.argv[2]; tracks=sys.argv[3].split(',')
JS="""async ([key,secs,INTV])=>{
  AC=new OfflineAudioContext(2,44100*secs,44100); MUS.master=null; MUS.loading=null; MUS.buf={}; musInit(); await loadSamples();
  const tr=TRACKS[key]; MUS.node=AC.createGain(); MUS.node.gain.value=tr.vol; MUS.node.connect(MUS.master); MUS.master.gain.value=.6*.85;
  MUS.L={}; ['lead','acc','bass','perc','drive'].forEach(l=>{ const g=AC.createGain(); g.gain.value=(INT_GAIN[l]||[1,1,1])[INTV]; g.connect(MUS.node); MUS.L[l]=g; });
  const spb=60/tr.bpm; let base=0, lap=0; outer: while(true){ const a=arrange(tr,lap); for(const e of a.ev){ const tt=.2+(base+e.t)*spb; if(tt>secs-1) break outer; if(e.l==='drive'&&INTV===0) continue; note(e.i,e.p,Math.max(0,tt+(Math.random()-.5)*.014),e.v,e.d*spb,null,MUS.L[e.l]);} base+=a.len; lap++; }
  const buf=await AC.startRendering(); const L=buf.getChannelData(0),R=buf.getChannelData(1),n=L.length;
  const dv=new DataView(new ArrayBuffer(44+n*4)); const w=(o,s)=>{for(let i=0;i<s.length;i++)dv.setUint8(o+i,s.charCodeAt(i));};
  w(0,'RIFF');dv.setUint32(4,36+n*4,true);w(8,'WAVE');w(12,'fmt ');dv.setUint32(16,16,true);dv.setUint16(20,1,true);dv.setUint16(22,2,true);dv.setUint32(24,44100,true);dv.setUint32(28,44100*4,true);dv.setUint16(32,4,true);dv.setUint16(34,16,true);w(36,'data');dv.setUint32(40,n*4,true);
  let pk=0; for(let i=0;i<n;i++){ pk=Math.max(pk,Math.abs(L[i]),Math.abs(R[i])); dv.setInt16(44+i*4,Math.max(-1,Math.min(1,L[i]))*32767,true); dv.setInt16(46+i*4,Math.max(-1,Math.min(1,R[i]))*32767,true); }
  const u=new Uint8Array(dv.buffer); let s=''; for(let i=0;i<u.length;i+=32768) s+=String.fromCharCode.apply(null,u.subarray(i,i+32768)); return [btoa(s),pk]; }"""
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path='/usr/bin/google-chrome'); pg=await b.new_page()
    errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
    await pg.goto('file://'+P); await pg.wait_for_timeout(300)
    for k in tracks:
      d,pk=await pg.evaluate(JS,[k.split(':')[0],int(sys.argv[4]) if len(sys.argv)>4 else 40,int(k.split(':')[1]) if ':' in k else 0])
      open(f'{O}/{k.replace(":","_i")}.wav','wb').write(base64.b64decode(d)); print(k,'peak',round(pk,3))
    print('errors',errs); await b.close()
asyncio.run(main())
