#!/usr/bin/env bash
# Final assembly: story render + BUBA banner (chroma removed, centred, mid-video) + mixed audio.
set -euo pipefail
cd "$(dirname "$0")"
BANNER=/root/.claude/uploads/b167f6b3-b07e-5f31-a637-5d961368183e/d6e1b67f-_______.mp4
BS=$(python3 -c "import json;print(json.load(open('public/cues.json'))['bannerStart'])")
# banner card is 1246 px wide inside a 1374 px frame; at 1360 px the card is ~1233 px wide => ~26% of 1080x1920; shifted up 9 px because the card sits 9 px low inside the asset (rule: >=25%)
BW=1372
python3 mix.py
ffmpeg -v error -y -i out/story.mp4 -i "$BANNER" -i out/mix.wav -filter_complex "\
[1:v]fps=30,format=rgba,chromakey=0x0200F3:0.15:0.02,split[c][a];[a]alphaextract,erosion,erosion,boxblur=1:1[am];\
[c][am]alphamerge,scale=${BW}:-2:flags=lanczos,setpts=PTS+${BS}/TB[ban];\
[0:v][ban]overlay=x=(main_w-overlay_w)/2:y=(main_h-overlay_h)/2-9:eof_action=pass:enable='between(t,${BS},${BS}+5.04)',format=yuv420p[v]" \
  -map "[v]" -map 2:a -c:v libx264 -profile:v high -preset slow -crf 17 -r 30 \
  -c:a aac -b:a 192k -movflags +faststart out/grandma_buba.mp4
ffprobe -v error -show_entries format=duration:stream=codec_type,width,height -of compact out/grandma_buba.mp4
