"""Mixes voice, sfx, music and the BUBA banner jingle into out/mix.wav."""
import json, subprocess, os

BANNER = '/root/.claude/uploads/b167f6b3-b07e-5f31-a637-5d961368183e/d6e1b67f-_______.mp4'
tl = json.load(open('public/timeline.json'))
cues = json.load(open('public/cues.json'))
FPS = tl['fps']
total = tl['total'] / FPS
bs, be = cues['bannerStart'], cues['bannerEnd']
os.makedirs('out', exist_ok=True)

inputs, filters, labels = [], [], []


def add_input(path):
    inputs.extend(['-i', path])
    return len(inputs) // 2 - 1


def place(idx, t, vol=1.0, trim=None, extra=''):
    lab = f'a{len(labels)}'
    tr = f'atrim={trim[0]}:{trim[1]},asetpts=PTS-STARTPTS,' if trim else ''
    ms = int(round(t * 1000))
    filters.append(f'[{idx}:a]{tr}aresample=48000,aformat=channel_layouts=stereo,{extra}volume={vol},adelay={ms}|{ms}[{lab}]')
    labels.append(lab)


# voices
voice_labels = []
for l in tl['lines']:
    i = add_input(f"public/vo_fast/{l['id']}.mp3")
    place(i, l['start'], 1.0, (l['clipStart'], l['clipEnd']),
          extra='afade=t=out:st=%.3f:d=0.06,' % max(0, l['dur'] - 0.06))
    voice_labels.append(labels[-1])

# sound effects
sfx = [
    ('ding', cues['hook'] + 0.02, 0.45), ('pop', cues['pies'], 0.5), ('pop', cues['hat'], 0.5),
    ('pop', cues['five'], 0.55), ('pop', cues['hot'], 0.5), ('cash', cues['money'] + 0.35, 0.35),
    ('tension', cues['thing'] - 0.8, 0.45), ('whoosh', be - 0.05, 0.5), ('pop', cues['cheese'], 0.5),
    ('ding', cues['button'] + 0.1, 0.4), ('pop', cues['neighbors'], 0.5), ('pop', cues['cabbage'], 0.45),
    ('pop', cues['meat'], 0.45), ('doorbell', cues['doorbell'], 0.7),
]
for name, t, v in sfx:
    place(add_input(f'public/sfx/{name}.mp3'), t, v)

# music: part A, silent during banner, part B continues from where it stopped
m = add_input('public/music.mp3')
filters.append(f'[{m}:a]asplit=2[mA][mB]')
filters.append(f'[mA]atrim=0:{bs:.3f},asetpts=PTS-STARTPTS,aresample=48000,aformat=channel_layouts=stereo,'
               f'afade=t=out:st={bs - 0.6:.3f}:d=0.6,volume=0.16[musA]')
filters.append(f'[mB]atrim={bs:.3f}:{bs + (total - be):.3f},asetpts=PTS-STARTPTS,aresample=48000,'
               f'aformat=channel_layouts=stereo,afade=t=in:st=0:d=0.5,'
               f'afade=t=out:st={total - be - 1.5:.3f}:d=1.5,volume=0.16,adelay={int(be*1000)}|{int(be*1000)}[musB]')
labels += ['musA', 'musB']

# banner jingle, untouched speed, starts exactly at banner start
b = add_input(BANNER)
place(b, bs, 0.75)

# voice bus normalised, everything else under it
filters.append(''.join(f'[{x}]' for x in voice_labels) + f'amix=inputs={len(voice_labels)}:normalize=0,'
               'loudnorm=I=-15:TP=-1.5:LRA=9[vox]')
others = [x for x in labels if x not in voice_labels]
filters.append(''.join(f'[{x}]' for x in others) + f'amix=inputs={len(others)}:normalize=0[bed]')
filters.append(f'[vox][bed]amix=inputs=2:normalize=0,atrim=0:{total:.3f},alimiter=limit=0.89[out]')

cmd = ['ffmpeg', '-v', 'error', '-y', *inputs, '-filter_complex', ';'.join(filters), '-map', '[out]',
       '-ar', '48000', '-c:a', 'pcm_s16le', 'out/mix.wav']
subprocess.run(cmd, check=True)
print('mix ok', total)
