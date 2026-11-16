#!/bin/bash
# Usage: assemble.sh <dir with generated shotNN.mp4> <output.mp4>
# Fits each generated shot to the exact duration of the original cut, stacks them
# in order and puts the original audio back. Output: 1080x1920, 30fps, for TikTok.
set -e
G=$1; OUT=$2; HERE=$(cd "$(dirname "$0")" && pwd)
CUTS=(56.30 57.30 57.70 59.53 59.90 62.37 63.90 64.77 65.53 66.17 67.33)
T=$(mktemp -d); LIST=$T/list.txt; : > $LIST
for i in $(seq 1 10); do
  n=$(printf %02d $i); a=${CUTS[$((i-1))]}; b=${CUTS[$i]}
  dur=$(echo "$b - $a" | bc -l)
  src=$(ffprobe -v error -show_entries format=duration -of csv=p=0 $G/shot$n.mp4)
  k=$(echo "$dur / $src" | bc -l)
  ffmpeg -v error -i $G/shot$n.mp4 -filter_complex "
    [0]setpts=$k*PTS,fps=30,scale=1080:-2:flags=lanczos,split[f][b];
    [b]scale=-2:1920,crop=1080:1920,boxblur=30:3,eq=brightness=-0.08[bg];
    [bg][f]overlay=(W-w)/2:(H-h)/2,setsar=1,format=yuv420p" \
    -t $dur -an -c:v libx264 -crf 17 -preset slow -y $T/s$n.mp4
  echo "file '$T/s$n.mp4'" >> $LIST
done
ffmpeg -v error -f concat -safe 0 -i $LIST -i $HERE/source_moment.mp4 -map 0:v -map 1:a \
  -c:v libx264 -crf 17 -preset slow -pix_fmt yuv420p -c:a aac -b:a 192k -shortest -movflags +faststart -y "$OUT"
rm -rf $T
echo "$OUT"
