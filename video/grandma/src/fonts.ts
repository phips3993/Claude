import { continueRender, delayRender, staticFile } from 'remotion';

const CYR = 'U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116';
const LAT =
  'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD';

const faces: [string, string, string, string][] = [
  ['Montserrat', '900', 'montserrat-cyrillic-900-normal.woff2', CYR],
  ['Montserrat', '900', 'montserrat-latin-900-normal.woff2', LAT],
  ['Montserrat', '700', 'montserrat-cyrillic-700-normal.woff2', CYR],
  ['Montserrat', '700', 'montserrat-latin-700-normal.woff2', LAT],
  ['Unbounded', '800', 'unbounded-cyrillic-800-normal.woff2', CYR],
  ['Unbounded', '800', 'unbounded-latin-800-normal.woff2', LAT],
];

let loaded = false;
export const loadFonts = () => {
  if (loaded || typeof document === 'undefined') return;
  loaded = true;
  const handle = delayRender('fonts');
  Promise.all(
    faces.map(([family, weight, file, range]) => {
      const f = new FontFace(family, `url(${staticFile(`fonts/${file}`)}) format('woff2')`, {
        weight,
        unicodeRange: range,
      });
      document.fonts.add(f);
      return f.load();
    }),
  )
    .then(() => continueRender(handle))
    .catch((e) => {
      console.error(e);
      continueRender(handle);
    });
};
