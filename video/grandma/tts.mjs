// Generates per-line voiceover with word timings via ElevenLabs.
// The API key is injected by the network proxy; the header value here is a placeholder.
import fs from 'node:fs';

const script = JSON.parse(fs.readFileSync('script.json', 'utf8'));
const MODEL = process.env.MODEL || 'eleven_v3';
const only = process.argv.slice(2);
fs.mkdirSync('public/vo', { recursive: true });

const settings = {
  grandma: { stability: 0.5, similarity_boost: 0.8, style: 0.45, use_speaker_boost: true },
  grandson: { stability: 0.5, similarity_boost: 0.8, style: 0.35, use_speaker_boost: true },
};

for (const line of script.lines) {
  if (only.length && !only.includes(line.id)) continue;
  const text = MODEL === 'eleven_v3' && line.tags ? `${line.tags} ${line.text}` : line.text;
  const body = {
    text,
    model_id: MODEL,
    language_code: 'ru',
    voice_settings: MODEL === 'eleven_v3' ? { stability: 0.5 } : settings[line.who],
  };
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${script.voices[line.who]}/with-timestamps?output_format=mp3_44100_128`,
    { method: 'POST', headers: { 'Content-Type': 'application/json', 'xi-api-key': 'proxy-injected' }, body: JSON.stringify(body) },
  );
  if (!res.ok) {
    console.error(line.id, res.status, (await res.text()).slice(0, 400));
    process.exit(1);
  }
  const data = await res.json();
  fs.writeFileSync(`public/vo/${line.id}.mp3`, Buffer.from(data.audio_base64, 'base64'));
  fs.writeFileSync(`public/vo/${line.id}.json`, JSON.stringify(data.normalized_alignment || data.alignment));
  console.log(line.id, 'ok');
}
