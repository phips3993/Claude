"""Checks the final video against the BUBA banner rules and basic delivery specs."""
import json, subprocess, sys
from PIL import Image, ImageChops

V = 'out/grandma_buba.mp4'
S = 'out/story.mp4'
cues = json.load(open('public/cues.json'))
bs, be = cues['bannerStart'], cues['bannerEnd']

info = json.loads(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration:stream=codec_type,width,height,r_frame_rate',
                                  '-of', 'json', V], capture_output=True, text=True).stdout)
dur = float(info['format']['duration'])
vs = [s for s in info['streams'] if s['codec_type'] == 'video'][0]
has_audio = any(s['codec_type'] == 'audio' for s in info['streams'])
ok = True


def check(cond, msg):
    global ok
    print(('OK   ' if cond else 'FAIL ') + msg)
    ok &= bool(cond)


check(vs['width'] == 1080 and vs['height'] == 1920, f"resolution {vs['width']}x{vs['height']}")
check(10 <= dur <= 300, f'duration {dur:.2f}s (10..300)')
check(has_audio, 'audio track present')
center = (bs + be) / 2
check(abs(center - dur / 2) <= 1 / 30 + 0.02, f'banner centre {center:.3f}s vs video centre {dur/2:.3f}s')
check(dur < 120, 'under 2:00 -> exactly one banner required')


def frame(path, t):
    out = subprocess.run(['ffmpeg', '-v', 'error', '-ss', f'{t:.3f}', '-i', path, '-frames:v', '1', '-f', 'image2pipe',
                          '-vcodec', 'png', '-'], capture_output=True).stdout
    import io
    return Image.open(io.BytesIO(out)).convert('RGB')


covs = []
for k in range(8):
    t = bs + 0.6 + k * (be - bs - 1.2) / 7
    a, b = frame(V, t), frame(S, t)
    diff = ImageChops.difference(a, b).convert('L').point(lambda v: 255 if v > 18 else 0)
    bbox = diff.getbbox()
    cov = sum(diff.histogram()[255:]) / (1080 * 1920) * 100
    covs.append(cov)
    cx = (bbox[0] + bbox[2]) / 2 if bbox else 0
    cy = (bbox[1] + bbox[3]) / 2 if bbox else 0
    print(f'  t={t:.2f}s banner area {cov:.1f}%  bbox {bbox}  centre ({cx:.0f},{cy:.0f})')
check(min(covs) >= 25.0, f'banner area >= 25% on all sampled frames (min {min(covs):.1f}%)')

# no banner outside its window
for t in (bs - 0.2, be + 0.2):
    a, b = frame(V, t), frame(S, t)
    d = ImageChops.difference(a, b).convert('L').point(lambda v: 255 if v > 30 else 0)
    check(sum(d.histogram()[255:]) < 2000, f'no banner pixels at {t:.2f}s')

# chroma residue: pure key-blue pixels anywhere in banner frames
blue = 0
for k in range(6):
    im = frame(V, bs + 0.4 + k * 0.8)
    px = im.load()
    for y in range(0, 1920, 2):
        for x in range(0, 1080, 2):
            r, g, b = px[x, y]
            if b > 200 and r < 40 and g < 40:
                blue += 1
check(blue == 0, f'no chroma-key blue pixels left ({blue})')

lufs = subprocess.run(['ffmpeg', '-i', V, '-af', 'ebur128=framelog=quiet', '-f', 'null', '-'], capture_output=True, text=True).stderr
I = [l for l in lufs.splitlines() if l.strip().startswith('I:')][-1]
print('     loudness', I.strip())
sys.exit(0 if ok else 1)
