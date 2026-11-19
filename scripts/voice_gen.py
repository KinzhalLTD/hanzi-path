"""Record the studio voice for Hanzi Path with Google Cloud Text-to-Speech (Chirp 3 HD Mandarin voices) and pack it
for the iPhone app. Runs in Google Cloud Shell (python3 standard library + gcloud + ffmpeg); see scripts/voice_cloudshell.sh.

  input   content/voice/corpus.json (scripts/voice_corpus.py): id, voice f/m, text, pack, numbered pinyin for words
  cache   ~/.hanzi-voice/<voice name>/<id>.mp3   (resumable: a re-run only records new or failed lines)
  output  mobile/assets/voice/<pack>.bin (MP3 clips back to back), mobile/assets/voice/index.json
          {packs:[…], e:{id:[pack, offset, length]}, voices:{f,m}}, and mobile/src/voicePacks.js (requires the packs)

Words carry their pinyin as a custom pronunciation (PHONETIC_ENCODING_PINYIN, tone numbers) so polyphonic characters
are read the way the app teaches them; if the API refuses a pronunciation the line is recorded without it.
Clips are trimmed of leading/trailing silence and stored as mono 24 kHz MP3 (32 kbit/s) when ffmpeg is available.
Voices: 'n' narrator and 'p' conversation partner. The owner's reference (a translation app reading
这里的画外音非常完美，完全符合要求，我们也必须做到同样完美) is a calm male voice, median pitch ~125 Hz, ~4.6 characters/s with
~0.3 s pauses at commas. --audition records that sentence with every Mandarin Chirp 3 HD voice, measures pitch and speed,
ranks the voices by closeness to the reference, writes a listening page (~/voice-audition.zip) and saves the closest male
voice and the speed that matches its pace to ~/.hanzi-voice/choice.json, which the full run then uses.
Usage: python3 scripts/voice_gen.py [--audition] [--project ID] [--yes] [--narrator NAME] [--partner NAME] [--rate R] [--limit N]"""
import argparse, base64, json, os, subprocess, sys, threading, time, urllib.request, urllib.error, shutil, tempfile
from concurrent.futures import ThreadPoolExecutor, as_completed
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
API = os.environ.get('VOICE_API', 'https://texttospeech.googleapis.com/v1')   # VOICE_API / VOICE_TOKEN: test overrides
PACK_ORDER = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'gram', 'talk', 'sec', 'misc']
FEMALE_PREF = ['Kore', 'Aoede', 'Leda', 'Zephyr', 'Despina', 'Erinome', 'Callirrhoe', 'Autonoe']
MALE_PREF = ['Charon', 'Iapetus', 'Schedar', 'Orus', 'Rasalgethi', 'Algieba', 'Umbriel', 'Alnilam', 'Puck', 'Fenrir']
REF_TEXT = '这里的画外音非常完美，完全符合要求，我们也必须做到同样完美。'
REF_F0, REF_CPS = 125.0, 4.6           # measured from the owner's reference recording (27 characters in ~5.9 s, pitch ~123-130 Hz)
CHOICE = os.path.expanduser('~/.hanzi-voice/choice.json')

class Auth:
    def __init__(self, project): self.project, self.tok, self.at, self.lock = project, None, 0, threading.Lock()
    def token(self):
        with self.lock:
            if not self.tok or time.time() - self.at > 1800:
                self.tok = os.environ.get('VOICE_TOKEN') or subprocess.check_output(['gcloud', 'auth', 'print-access-token'], text=True).strip(); self.at = time.time()
            return self.tok
    def call(self, method, path, body=None, timeout=90):
        req = urllib.request.Request(API + path, method=method, data=json.dumps(body).encode() if body is not None else None,
                                     headers={'Authorization': 'Bearer ' + self.token(), 'x-goog-user-project': self.project, 'Content-Type': 'application/json; charset=utf-8'})
        with urllib.request.urlopen(req, timeout=timeout) as r: return json.loads(r.read())

def chirp_voices(auth):
    vs = auth.call('GET', '/voices?languageCode=cmn-CN').get('voices', [])
    return [v for v in vs if 'Chirp3-HD' in v['name'] and any(l.lower().startswith('cmn') for l in v.get('languageCodes', []))], vs

def pick_voices(auth, partner, narrator):
    choice = json.load(open(CHOICE)) if os.path.exists(CHOICE) else {}
    narrator = narrator or choice.get('narrator'); partner = partner or choice.get('partner')
    chirp, vs = chirp_voices(auth)
    if not chirp: sys.exit('No Chirp 3 HD voices for cmn-CN were listed for this project. Available: ' + ', '.join(v['name'] for v in vs[:20]))
    def choose(pref, gender, forced):
        if forced: return next((v['name'] for v in chirp if v['name'].endswith(forced) or v['name'] == forced), None) or sys.exit(f'voice {forced} not found')
        for p in pref:
            n = next((v['name'] for v in chirp if v['name'].endswith('-' + p)), None)
            if n: return n
        return next((v['name'] for v in chirp if v.get('ssmlGender') == gender), chirp[0]['name'])
    return {'n': choose(MALE_PREF, 'MALE', narrator), 'p': choose(FEMALE_PREF, 'FEMALE', partner)}

# ---------- audition: compare every voice with the reference ----------
def wav_pcm(b):
    import struct
    i = 12
    while i < len(b) - 8:
        cid, n = b[i:i + 4], struct.unpack('<I', b[i + 4:i + 8])[0]
        if cid == b'fmt ': sr = struct.unpack('<I', b[i + 12:i + 16])[0]
        if cid == b'data': return sr, struct.unpack('<%dh' % ((min(n, len(b) - i - 8)) // 2), b[i + 8:i + 8 + (min(n, len(b) - i - 8)) // 2 * 2])
        i += 8 + n + (n & 1)
    raise ValueError('not a WAV')
def measure(b):
    """(speech seconds without leading/trailing silence, median F0 Hz) from LINEAR16 WAV bytes; numpy when present."""
    sr, x = wav_pcm(b); step = max(1, sr // 8000); x = [sum(x[i:i + step]) / step for i in range(0, len(x) - step, step)]; sr = sr // step
    hop = sr // 100; en = [sum(abs(v) for v in x[i:i + hop]) / hop for i in range(0, len(x) - hop, hop)]
    thr = max(en) * 0.06; voiced = [k for k, e in enumerate(en) if e > thr]
    dur = (voiced[-1] - voiced[0] + 1) / 100 if voiced else 0
    fr, f0s = sr // 20, []
    try:
        import numpy as np; xa = np.array(x, dtype=float)
        for k in voiced[::2]:
            f = xa[k * hop:k * hop + fr]
            if len(f) < fr: continue
            f = f - f.mean(); ac = np.correlate(f, f, 'full')[fr - 1:]; lo, hi = sr // 400, sr // 70
            j = lo + int(np.argmax(ac[lo:hi]))
            if ac[0] > 0 and ac[j] > 0.4 * ac[0]: f0s.append(sr / j)
    except ImportError:
        for k in voiced[::6]:
            f = x[k * hop:k * hop + fr]
            if len(f) < fr: continue
            m = sum(f) / fr; f = [v - m for v in f]; e0 = sum(v * v for v in f) or 1
            best, bj = 0, 0
            for j in range(sr // 400, sr // 70):
                c = sum(f[t] * f[t + j] for t in range(fr - j))
                if c > best: best, bj = c, j
            if bj and best > 0.4 * e0: f0s.append(sr / bj)
    f0s.sort(); return dur, (f0s[len(f0s) // 2] if f0s else 0)

def audition(auth, rate):
    import math, zipfile
    chirp, _ = chirp_voices(auth)
    if not chirp: sys.exit('No Chirp 3 HD voices for cmn-CN on this project')
    out = os.path.expanduser('~/voice-audition'); os.makedirs(out, exist_ok=True); rows = []
    print(f'Recording the reference sentence with {len(chirp)} voices…')
    for v in chirp:
        body = {'input': {'text': REF_TEXT}, 'voice': {'languageCode': 'cmn-CN', 'name': v['name']}, 'audioConfig': {'audioEncoding': 'LINEAR16', 'sampleRateHertz': 24000, 'speakingRate': rate}}
        try: wav = base64.b64decode(auth.call('POST', '/text:synthesize', body)['audioContent'])
        except Exception as err: print('  skip', v['name'], err); continue
        dur, f0 = measure(wav); cps = len([c for c in REF_TEXT if '\u4e00' <= c <= '\u9fff']) / dur if dur else 0
        short = v['name'].split('-')[-1]; open(os.path.join(out, short + '.wav'), 'wb').write(wav)
        dist = (abs(math.log(f0 / REF_F0)) if f0 else 9) + abs(cps - REF_CPS) / REF_CPS
        rows.append({'name': short, 'full': v['name'], 'gender': v.get('ssmlGender', ''), 'f0': round(f0), 'cps': round(cps, 2), 'dist': round(dist, 3)})
        print(f"  {short:14} {v.get('ssmlGender',''):7} pitch {f0:5.0f} Hz  speed {cps:4.2f} chars/s  distance {dist:.3f}")
    rows.sort(key=lambda r: r['dist'])
    best_m = next((r for r in rows if r['gender'] == 'MALE'), rows[0]); best_f = next((r for r in rows if r['gender'] == 'FEMALE'), rows[-1])
    new_rate = round(max(0.7, min(1.2, rate * REF_CPS / best_m['cps'])), 2) if best_m['cps'] else rate
    os.makedirs(os.path.dirname(CHOICE), exist_ok=True)
    json.dump({'narrator': best_m['name'], 'partner': best_f['name'], 'rate': new_rate, 'measured': rows}, open(CHOICE, 'w'), indent=1)
    page = ['<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Hanzi Path voice audition</title>',
            '<style>body{font:15px system-ui;margin:16px;background:#141010;color:#f5ead8}td,th{padding:6px 8px;border-bottom:1px solid #3a2c22;text-align:left}audio{width:220px}.b{color:#e8b65c;font-weight:700}</style>',
            f'<h2>Voice audition</h2><p>{REF_TEXT}</p><p>Reference: male, pitch {REF_F0:.0f} Hz, {REF_CPS} chars/s. Closest first.</p><table><tr><th>Voice</th><th></th><th>Pitch</th><th>Speed</th><th>Distance</th><th>Listen</th></tr>']
    for r in rows:
        tag = ' class="b"' if r['name'] in (best_m['name'], best_f['name']) else ''
        page.append(f"<tr><td{tag}>{r['name']}</td><td>{r['gender'].lower()}</td><td>{r['f0']} Hz</td><td>{r['cps']}</td><td>{r['dist']}</td><td><audio controls preload=none src=\"{r['name']}.wav\"></audio></td></tr>")
    page.append('</table>'); open(os.path.join(out, 'index.html'), 'w', encoding='utf-8').write('\n'.join(page))
    zp = out + '.zip'
    with zipfile.ZipFile(zp, 'w', zipfile.ZIP_DEFLATED) as z:
        for f in os.listdir(out): z.write(os.path.join(out, f), f)
    print(f"\nClosest to your reference: narrator {best_m['name']} (pitch {best_m['f0']} Hz, {best_m['cps']} chars/s), partner {best_f['name']}.")
    print(f"Recording speed set to {new_rate} so sentences read at about {REF_CPS} characters per second.")
    print(f"Listen: cloudshell download {zp}   (unzip, open index.html)")
    print('Then record everything with these voices: bash scripts/voice_cloudshell.sh   (or pick others: --narrator NAME --partner NAME)')

def have_ffmpeg(): return shutil.which('ffmpeg') is not None

def synth(auth, e, voice, out, ffmpeg, rate=0.92):
    body = {'input': {'text': e['t']}, 'voice': {'languageCode': 'cmn-CN', 'name': voice},
            'audioConfig': {'audioEncoding': 'LINEAR16' if ffmpeg else 'MP3', 'sampleRateHertz': 24000, 'speakingRate': round(rate if len(e['t']) > 4 else rate * 0.97, 3)}}
    if e.get('py'):
        body['input']['customPronunciations'] = {'pronunciations': [{'phrase': e['t'], 'phoneticEncoding': 'PHONETIC_ENCODING_PINYIN', 'pronunciation': e['py']}]}
    used_py = bool(e.get('py'))
    for attempt in range(7):
        try:
            audio = base64.b64decode(auth.call('POST', '/text:synthesize', body)['audioContent']); break
        except urllib.error.HTTPError as err:
            msg = err.read().decode('utf-8', 'replace')[:400]
            if err.code == 400 and 'customPronunciations' in body['input']:
                body['input'].pop('customPronunciations'); used_py = False; continue          # pronunciation refused: plain text
            if err.code == 403 and ('billing' in msg.lower() or 'BILLING' in msg): raise SystemExit('BILLING: ' + msg)
            if err.code in (429, 500, 502, 503, 504): time.sleep(min(60, 2 ** attempt + attempt)); continue
            raise RuntimeError(f'{err.code} {msg}')
        except (urllib.error.URLError, TimeoutError, ConnectionError):
            time.sleep(2 ** attempt); continue
    else:
        raise RuntimeError('gave up after retries')
    if ffmpeg:
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as f: f.write(audio); wav = f.name
        trim = 'silenceremove=start_periods=1:start_threshold=-48dB:start_silence=0.04,areverse,silenceremove=start_periods=1:start_threshold=-48dB:start_silence=0.08,areverse'
        r = subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', wav, '-af', trim, '-ac', '1', '-ar', '24000', '-codec:a', 'libmp3lame', '-b:a', '32k', out + '.tmp.mp3'])
        os.unlink(wav)
        if r.returncode != 0: raise RuntimeError('ffmpeg failed')
        os.replace(out + '.tmp.mp3', out)
    else:
        with open(out + '.tmp', 'wb') as f: f.write(audio)
        os.replace(out + '.tmp', out)
    return used_py

def pack(corpus, voices, src):   # src: voice -> cache folder
    vdir = os.path.join(ROOT, 'mobile', 'assets', 'voice'); os.makedirs(vdir, exist_ok=True)
    for f in os.listdir(vdir):
        if f.endswith('.bin'): os.unlink(os.path.join(vdir, f))
    packs = [p for p in PACK_ORDER if any(e['pk'] == p for e in corpus)] + sorted({e['pk'] for e in corpus} - set(PACK_ORDER))
    index, sizes, missing = {}, {}, 0
    for pi, p in enumerate(packs):
        off = 0
        with open(os.path.join(vdir, p + '.bin'), 'wb') as out:
            for e in corpus:
                if e['pk'] != p: continue
                fn = os.path.join(src[e['v']], e['id'] + '.mp3')
                if not os.path.exists(fn): missing += 1; continue
                b = open(fn, 'rb').read(); out.write(b); index[e['id']] = [pi, off, len(b)]; off += len(b)
        sizes[p] = off
    json.dump({'packs': packs, 'e': index, 'voices': voices, 'rate': os.path.basename(src['n']).split('@')[-1], 'made': time.strftime('%Y-%m-%d')}, open(os.path.join(vdir, 'index.json'), 'w'), separators=(',', ':'))
    js = ['// Studio voice packs (Google Chirp 3 HD). Generated by scripts/voice_gen.py in Cloud Shell — do not edit by hand.',
          "export const INDEX = require('../assets/voice/index.json');", 'export const PACKS = {']
    js += [f"  {p}: require('../assets/voice/{p}.bin')," for p in packs if sizes[p]] + ['};', '']
    open(os.path.join(ROOT, 'mobile', 'src', 'voicePacks.js'), 'w').write('\n'.join(js))
    return sizes, len(index), missing

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--project', default=os.environ.get('GOOGLE_CLOUD_PROJECT') or os.environ.get('DEVSHELL_PROJECT_ID'))
    ap.add_argument('--yes', action='store_true'); ap.add_argument('--workers', type=int, default=8); ap.add_argument('--limit', type=int, default=0)
    ap.add_argument('--narrator'); ap.add_argument('--partner'); ap.add_argument('--pack-only', action='store_true')
    ap.add_argument('--audition', action='store_true'); ap.add_argument('--rate', type=float)
    a = ap.parse_args()
    if not a.project: a.project = subprocess.run(['gcloud', 'config', 'get-value', 'project'], capture_output=True, text=True).stdout.strip()
    if not a.project: sys.exit('No Google Cloud project. Run: gcloud config set project YOUR_PROJECT_ID')
    if a.audition: return audition(Auth(a.project), a.rate or 0.92)
    choice = json.load(open(CHOICE)) if os.path.exists(CHOICE) else {}
    rate = a.rate or choice.get('rate') or 0.92
    corpus = json.load(open(os.path.join(ROOT, 'content', 'voice', 'corpus.json'), encoding='utf-8'))
    if a.limit: corpus = [e for p in PACK_ORDER for e in [x for x in corpus if x['pk'] == p][:a.limit]]
    auth = Auth(a.project); voices = pick_voices(auth, a.partner, a.narrator)
    cache = os.environ.get('VOICE_CACHE') or os.path.expanduser('~/.hanzi-voice')
    vdir = {k: os.path.join(cache, f'{v}@{rate}') for k, v in voices.items()}   # cache per voice and speed
    for d in vdir.values(): os.makedirs(d, exist_ok=True)
    todo = [e for e in corpus if not os.path.exists(os.path.join(vdir[e['v']], e['id'] + '.mp3'))]
    chars = sum(len(e['t']) for e in todo)
    print(f"project {a.project} | voices {voices['n']} (narrator) and {voices['p']} (conversation partner) | speed {rate}")
    print(f"{len(corpus)} lines, {len(todo)} still to record, {chars:,} characters (Chirp 3 HD: first 1,000,000 characters each month are free)")
    ffmpeg = have_ffmpeg(); print('ffmpeg', 'found: clips will be trimmed and compressed' if ffmpeg else 'missing: storing the API MP3 as is')
    if todo and not a.pack_only:
        if not a.yes and input('Start recording? [y/N] ').strip().lower() != 'y': return
        done = fails = nopy = 0; t0 = time.time(); errs = []
        with ThreadPoolExecutor(a.workers) as ex:
            futs = {ex.submit(synth, auth, e, voices[e['v']], os.path.join(vdir[e['v']], e['id'] + '.mp3'), ffmpeg, rate): e for e in todo}
            for f in as_completed(futs):
                e = futs[f]
                try:
                    if e.get('py') and not f.result(): nopy += 1
                except SystemExit as s:
                    ex.shutdown(cancel_futures=True)
                    sys.exit(f"{s}\n\nText-to-Speech needs billing enabled on project {a.project}: https://console.cloud.google.com/billing/linkedaccount?project={a.project}")
                except Exception as err:
                    fails += 1; errs.append(f"{e['id']} {e['t'][:20]}: {err}")
                done += 1
                if done % 200 == 0 or done == len(todo):
                    rate = done / max(1, time.time() - t0); print(f'  {done}/{len(todo)} recorded · {fails} failed · {rate:.1f}/s · about {int((len(todo) - done) / max(rate, .01) / 60)} min left', flush=True)
        if errs: print('failed lines (re-run the script to retry):', *errs[:10], sep='\n  ')
        if nopy: print(f'{nopy} words were recorded without their pinyin hint (the API refused it)')
    sizes, n, missing = pack(corpus, voices, vdir)
    print('packs:', ', '.join(f'{p} {s / 1048576:.1f} MB' for p, s in sizes.items()), f'| total {sum(sizes.values()) / 1048576:.1f} MB, {n} clips, {missing} missing')

if __name__ == '__main__': main()
