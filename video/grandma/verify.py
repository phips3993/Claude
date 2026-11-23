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


# banner area: composite the exact same keyed/scaled banner over a flat magenta frame and count covered pixels
BANNER = '/root/.claude/uploads/b167f6b3-b07e-5f31-a637-5d961368183e/d6e1b67f-_______.mp4'
key = open('build.sh').read().split('[1:v]')[1].split('setpts')[0]
key = key.replace('${BW}', '1372').replace('\\\n', '')
covs = []
for k in range(9):
    tt = 1.0 + k * (5.03 - 1.6) / 8  # skip the banner's own grow-in intro
    out = subprocess.run(['ffmpeg', '-v', 'error', '-f', 'lavfi', '-i', 'color=c=0xFF00FF:s=1080x1920:r=30:d=5.1', '-i', BANNER,
                          '-filter_complex', f'[1:v]{key}null[b];[0:v][b]overlay=x=(main_w-overlay_w)/2:y=(main_h-overlay_h)/2,format=rgb24',
                          '-ss', f'{tt:.3f}', '-frames:v', '1', '-f', 'image2pipe', '-vcodec', 'png', '-'], capture_output=True).stdout
    import io
    im = Image.open(io.BytesIO(out)).convert('RGB')
    px = im.load(); n = 0
    for y in range(0, 1920, 2):
        for x in range(0, 1080, 2):
            r, g, b = px[x, y]
            if not (r > 235 and g < 25 and b > 235):
                n += 1
    cov = n * 4 / (1080 * 1920) * 100
    covs.append(cov)
    print(f'  banner t+{tt:.2f}s area {cov:.1f}%')
check(min(covs) >= 25.0, f'banner area >= 25% while fully shown (min {min(covs):.1f}%)')

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
