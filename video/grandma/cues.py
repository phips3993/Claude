"""Shared cue points (seconds) derived from word timings -> public/cues.json.
Used by the Remotion scene (visual inserts) and by mix.py (sound effects)."""
import json

tl = json.load(open('public/timeline.json'))
L = {l['id']: l for l in tl['lines']}
FPS = tl['fps']


def word_t(lid, needle, which='s'):
    l = L[lid]
    for w in l['words']:
        if needle.lower() in w['w'].lower():
            return round(l['start'] + w[which], 3)
    raise KeyError((lid, needle))


bs = tl['bannerStart'] / FPS
be = (tl['bannerStart'] + tl['bannerFrames']) / FPS
cues = {
    'hook': 0.0,
    'pies': word_t('l01', 'пирожками'),
    'hat': word_t('l03', 'шапку'),
    'five': word_t('l05', 'пять'),
    'ads': word_t('l07', 'рекламу'),
    'hot': word_t('l07', 'грел'),
    'appsOut': L['l08']['start'],
    'zina': word_t('l09', 'Зины'),
    'money': word_t('l09', 'деньги'),
    'thing': word_t('l09', 'вещь'),
    'freeze': round(L['l09']['start'] + L['l09']['dur'], 3),
    'bannerStart': round(bs, 3),
    'bannerEnd': round(be, 3),
    'cheese': word_t('l10', 'сыр'),
    'button': word_t('l10', 'кнопка'),
    'buttonOut': L['l11']['start'],
    'neighbors': word_t('l12', 'Валентине'),
    'choir': word_t('l12', 'хору'),
    'neighborsOut': L['l12b']['start'],
    'cabbage': word_t('l12c', 'капустой'),
    'meat': word_t('l12c', 'мясом'),
    'pricesOut': L['l14']['start'],
    'doorbell': round(L['l15']['start'] - 0.95, 3),
    'petrovich': L['l15']['start'],
    'meatEnd': word_t('l15', 'мясом', 'e'),
    'end': round(tl['total'] / FPS, 3),
}
json.dump(cues, open('public/cues.json', 'w'), indent=1)
print(json.dumps(cues, indent=1))
