"""Record the studio voice for Hanzi Path with Google Cloud Text-to-Speech (Chirp 3 HD Mandarin voices) and pack it
for the iPhone app. Runs in Google Cloud Shell (python3 standard library + gcloud + ffmpeg); see scripts/voice_cloudshell.sh.

  input   content/voice/corpus.json (scripts/voice_corpus.py): id, voice f/m, text, pack, numbered pinyin for words
  cache   ~/.hanzi-voice/<voice name>/<id>.mp3   (resumable: a re-run only records new or failed lines)
  output  mobile/assets/voice/<pack>.bin (MP3 clips back to back), mobile/assets/voice/index.json
          {packs:[…], e:{id:[pack, offset, length]}, voices:{f,m}}, and mobile/src/voicePacks.js (requires the packs)

Words carry their pinyin as a custom pronunciation (PHONETIC_ENCODING_PINYIN, tone numbers) so polyphonic characters
are read the way the app teaches them; if the API refuses a pronunciation the line is recorded without it.
Clips are trimmed of leading/trailing silence and stored as mono 24 kHz MP3 (32 kbit/s) when ffmpeg is available.
Usage: python3 scripts/voice_gen.py [--project ID] [--yes] [--workers 8] [--limit N] [--female NAME] [--male NAME]"""
import argparse, base64, json, os, subprocess, sys, threading, time, urllib.request, urllib.error, shutil, tempfile
from concurrent.futures import ThreadPoolExecutor, as_completed
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
API = os.environ.get('VOICE_API', 'https://texttospeech.googleapis.com/v1')   # VOICE_API / VOICE_TOKEN: test overrides
PACK_ORDER = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'gram', 'talk', 'sec', 'misc']
FEMALE_PREF = ['Kore', 'Aoede', 'Leda', 'Zephyr', 'Despina', 'Erinome', 'Callirrhoe', 'Autonoe']
MALE_PREF = ['Charon', 'Orus', 'Puck', 'Fenrir', 'Iapetus', 'Umbriel', 'Alnilam', 'Algieba']

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

def pick_voices(auth, female, male):
    vs = auth.call('GET', '/voices?languageCode=cmn-CN').get('voices', [])
    chirp = [v for v in vs if 'Chirp3-HD' in v['name'] and any(l.lower().startswith('cmn') for l in v.get('languageCodes', []))]
    if not chirp: sys.exit('No Chirp 3 HD voices for cmn-CN were listed for this project. Available: ' + ', '.join(v['name'] for v in vs[:20]))
    def choose(pref, gender, forced):
        if forced: return next((v['name'] for v in chirp if v['name'].endswith(forced) or v['name'] == forced), None) or sys.exit(f'voice {forced} not found')
        for p in pref:
            n = next((v['name'] for v in chirp if v['name'].endswith('-' + p)), None)
            if n: return n
        return next((v['name'] for v in chirp if v.get('ssmlGender') == gender), chirp[0]['name'])
    return {'f': choose(FEMALE_PREF, 'FEMALE', female), 'm': choose(MALE_PREF, 'MALE', male)}

def have_ffmpeg(): return shutil.which('ffmpeg') is not None

def synth(auth, e, voice, out, ffmpeg):
    body = {'input': {'text': e['t']}, 'voice': {'languageCode': 'cmn-CN', 'name': voice},
            'audioConfig': {'audioEncoding': 'LINEAR16' if ffmpeg else 'MP3', 'sampleRateHertz': 24000, 'speakingRate': 0.92 if len(e['t']) > 4 else 0.9}}
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

def pack(corpus, voices, cache):
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
                fn = os.path.join(cache, voices[e['v']], e['id'] + '.mp3')
                if not os.path.exists(fn): missing += 1; continue
                b = open(fn, 'rb').read(); out.write(b); index[e['id']] = [pi, off, len(b)]; off += len(b)
        sizes[p] = off
    json.dump({'packs': packs, 'e': index, 'voices': voices, 'made': time.strftime('%Y-%m-%d')}, open(os.path.join(vdir, 'index.json'), 'w'), separators=(',', ':'))
    js = ['// Studio voice packs (Google Chirp 3 HD). Generated by scripts/voice_gen.py in Cloud Shell — do not edit by hand.',
          "export const INDEX = require('../assets/voice/index.json');", 'export const PACKS = {']
    js += [f"  {p}: require('../assets/voice/{p}.bin')," for p in packs if sizes[p]] + ['};', '']
    open(os.path.join(ROOT, 'mobile', 'src', 'voicePacks.js'), 'w').write('\n'.join(js))
    return sizes, len(index), missing

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--project', default=os.environ.get('GOOGLE_CLOUD_PROJECT') or os.environ.get('DEVSHELL_PROJECT_ID'))
    ap.add_argument('--yes', action='store_true'); ap.add_argument('--workers', type=int, default=8); ap.add_argument('--limit', type=int, default=0)
    ap.add_argument('--female'); ap.add_argument('--male'); ap.add_argument('--pack-only', action='store_true')
    a = ap.parse_args()
    if not a.project: a.project = subprocess.run(['gcloud', 'config', 'get-value', 'project'], capture_output=True, text=True).stdout.strip()
    if not a.project: sys.exit('No Google Cloud project. Run: gcloud config set project YOUR_PROJECT_ID')
    corpus = json.load(open(os.path.join(ROOT, 'content', 'voice', 'corpus.json'), encoding='utf-8'))
    if a.limit: corpus = [e for p in PACK_ORDER for e in [x for x in corpus if x['pk'] == p][:a.limit]]
    auth = Auth(a.project); voices = pick_voices(auth, a.female, a.male)
    cache = os.environ.get('VOICE_CACHE') or os.path.expanduser('~/.hanzi-voice')
    for v in voices.values(): os.makedirs(os.path.join(cache, v), exist_ok=True)
    todo = [e for e in corpus if not os.path.exists(os.path.join(cache, voices[e['v']], e['id'] + '.mp3'))]
    chars = sum(len(e['t']) for e in todo)
    print(f"project {a.project} | voices {voices['f']} (narrator) and {voices['m']} (conversation partner)")
    print(f"{len(corpus)} lines, {len(todo)} still to record, {chars:,} characters (Chirp 3 HD: first 1,000,000 characters each month are free)")
    ffmpeg = have_ffmpeg(); print('ffmpeg', 'found: clips will be trimmed and compressed' if ffmpeg else 'missing: storing the API MP3 as is')
    if todo and not a.pack_only:
        if not a.yes and input('Start recording? [y/N] ').strip().lower() != 'y': return
        done = fails = nopy = 0; t0 = time.time(); errs = []
        with ThreadPoolExecutor(a.workers) as ex:
            futs = {ex.submit(synth, auth, e, voices[e['v']], os.path.join(cache, voices[e['v']], e['id'] + '.mp3'), ffmpeg): e for e in todo}
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
    sizes, n, missing = pack(corpus, voices, cache)
    print('packs:', ', '.join(f'{p} {s / 1048576:.1f} MB' for p, s in sizes.items()), f'| total {sum(sizes.values()) / 1048576:.1f} MB, {n} clips, {missing} missing')

if __name__ == '__main__': main()
