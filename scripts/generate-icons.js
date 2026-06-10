import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(__dirname, '../public/icons');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const sizes = [
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'icon-512-maskable.png', size: 512, maskable: true }
];

async function generateIcon(size, name, maskable = false) {
  const padding = maskable ? Math.floor(size * 0.1) : 0;
  const circleSize = size - padding * 2;
  const r = Math.floor(circleSize / 2);
  const cx = size / 2;
  const cy = size / 2;
  const fontSize = Math.floor(circleSize * 0.5);

  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="#0F172A"/>
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="#F97316"/>
      <text x="${cx}" y="${cy}"
        font-family="Arial Black, sans-serif"
        font-size="${fontSize}"
        font-weight="900"
        fill="white"
        text-anchor="middle"
        dominant-baseline="central">M</text>
    </svg>`;

  await sharp(Buffer.from(svg)).png().toFile(path.join(dir, name));
  console.log(`✓ ${name}`);
}

for (const { name, size, maskable } of sizes) {
  await generateIcon(size, name, maskable);
}
console.log('Íconos PWA generados en public/icons/');
