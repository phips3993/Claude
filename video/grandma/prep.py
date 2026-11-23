"""Builds public/timeline.json from script.json + ElevenLabs alignments.

- trims each voice clip to its spoken text (tags stripped)
- word timings for karaoke captions
- per-frame loudness (0..1) for mouth animation
- places lines with gaps; inserts the banner pause after part A and pads so that
  part A and part B have the same length => the banner sits exactly mid-video.
"""
import json, re, subprocess, array

FPS = 30
BANNER_FRAMES = 151  # 5.0333 s banner at 30 fps
GAP = 0.13           # default pause between lines, seconds
SPEED = 1.1          # voice tempo (atempo) -> files in public/vo_fast
LEAD = 0.04
TAIL = 0.18

s = json.load(open('script.json'))
lines_out = []


def loudness(path, start, end):
    raw = subprocess.run(
        ['ffmpeg', '-v', 'error', '-ss', str(start), '-to', str(end), '-i', path,
         '-ac', '1', '-ar', '16000', '-f', 's16le', '-'], capture_output=True).stdout
    a = array.array('h'); a.frombytes(raw[: len(raw) // 2 * 2])
    per = 16000 // FPS
    vals = []
    for i in range(0, len(a), per):
        chunk = a[i:i + per]
        if not chunk:
            break
        rms = (sum(x * x for x in chunk) / len(chunk)) ** 0.5
        vals.append(rms)
    peak = max(vals) or 1
    return [round(min(1, (v / peak) ** 0.8 * 1.1), 3) for v in vals]


for l in s['lines']:
    al = json.load(open(f"public/vo/{l['id']}.json"))
    chars = al['characters']
    st = [x / SPEED for x in al['character_start_times_seconds']]
    en = [x / SPEED for x in al['character_end_times_seconds']]
    full = ''.join(chars)
    m = re.match(r'^(\s*\[[^\]]*\]\s*)*', full)
    off = m.end() if m else 0
    # words of the actual text
    words = []
    for wm in re.finditer(r'\S+', full[off:]):
        a, b = wm.start() + off, wm.end() + off - 1
        w = wm.group()
        if w in ('—', '-'):
            continue
        words.append({'w': w, 's': st[a], 'e': en[b]})
    t0 = max(0, words[0]['s'] - LEAD)
    # cut trailing silence that the alignment smears into the last word
    sd = subprocess.run(['ffmpeg', '-i', f"public/vo_fast/{l['id']}.mp3", '-af', 'silencedetect=n=-38dB:d=0.15',
                         '-f', 'null', '-'], capture_output=True, text=True).stderr
    starts = [float(x) for x in re.findall(r'silence_start: ([\d.]+)', sd)]
    ends = [float(x) for x in re.findall(r'silence_end: ([\d.]+)', sd)]
    last_end = words[-1]['e']
    if len(starts) > len(ends) or (starts and ends and ends[-1] >= last_end - 0.05):
        cut = starts[-1]
        if cut > words[-1]['s'] + 0.1:
            last_end = min(last_end, cut)
    words[-1]['e'] = min(words[-1]['e'], last_end)
    t1 = last_end + TAIL
    for w in words:
        w['s'] = round(w['s'] - t0, 3); w['e'] = round(w['e'] - t0, 3)
    lines_out.append({**l, 'clipStart': round(t0, 3), 'clipEnd': round(t1, 3),
                      'dur': round(t1 - t0, 3), 'words': words,
                      'amp': loudness(f"public/vo_fast/{l['id']}.mp3", t0, t1)})

# extra pauses (seconds) BEFORE a given line, for comedic timing / sfx
pre = {'l04': 0.3, 'l06': 0.05, 'l08': 0.1, 'l09': 0.15, 'l10': 0.3, 'l12b': 0.2, 'l15': 0.85}

def place(part, t):
    for l in lines_out:
        if l['part'] != part:
            continue
        t += pre.get(l['id'], 0)
        l['start'] = round(t, 3)
        t += l['dur'] + GAP
    return t

def halves():
    a = place('A', 0.0) - GAP + 0.5      # hold on the cliffhanger freeze
    b = place('B', 0.0) - GAP + 0.7      # hold on the final gag (wink)
    return a, b

a_end, b_len = halves()
diff = b_len - a_end
if diff > 0:   # spread extra breathing room through part A at comedic beats
    for k, share in (('l08', 0.35), ('l09', 0.25), ('l05', 0.15)):
        pre[k] = pre.get(k, 0) + diff * share
elif diff < 0:
    for k, share in (('l12b', 0.4), ('l15', 0.3)):
        pre[k] = pre.get(k, 0) - diff * share
a_end, b_len = halves()
A = round(a_end * FPS)
B = round(b_len * FPS)
padA = max(0, B - A); padB = max(0, A - B)
A += padA; B += padB
banner_start = A
for l in lines_out:
    if l['part'] == 'B':
        l['start'] = round(l['start'] + (A + BANNER_FRAMES) / FPS, 3)
    l['startFrame'] = round(l['start'] * FPS)
    l['durFrames'] = round(l['dur'] * FPS)

total = A + BANNER_FRAMES + B
out = {'fps': FPS, 'total': total, 'bannerStart': banner_start, 'bannerFrames': BANNER_FRAMES,
       'partAFrames': A, 'partBFrames': B, 'padA': padA, 'padB': padB, 'lines': lines_out}
json.dump(out, open('public/timeline.json', 'w'), ensure_ascii=False)
print(f"total {total/FPS:.2f}s  A {A/FPS:.2f}s  banner {banner_start/FPS:.2f}-{(banner_start+BANNER_FRAMES)/FPS:.2f}s  B {B/FPS:.2f}s  padA {padA/FPS:.2f} padB {padB/FPS:.2f}")
print(f"banner center {(banner_start+BANNER_FRAMES/2)/FPS:.3f}s, video center {total/FPS/2:.3f}s")
for l in lines_out:
    print(l['id'], l['start'], l['dur'])
