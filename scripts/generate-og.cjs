// Genera /public/og-image.png — 1200x630, fondo #0F172A con glow naranja
// Ejecutar: node scripts/generate-og.js
const zlib = require('zlib')
const fs   = require('fs')
const path = require('path')

const W = 1200, H = 630
const BG     = [15, 23, 42]    // #0F172A
const ACCENT = [249, 115, 22]  // #F97316
const SKY    = [56, 189, 248]  // #38BDF8

// CRC32 para chunks PNG
const crcTable = new Uint32Array(256)
for (let n = 0; n < 256; n++) {
  let c = n
  for (let k = 0; k < 8; k++) c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  crcTable[n] = c
}
function crc32(buf) {
  let crc = 0xffffffff
  for (const b of buf) crc = crcTable[(crc ^ b) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}
function chunk(type, data) {
  const lenB  = Buffer.alloc(4); lenB.writeUInt32BE(data.length)
  const typeB = Buffer.from(type, 'ascii')
  const crcB  = Buffer.alloc(4); crcB.writeUInt32BE(crc32(Buffer.concat([typeB, data])))
  return Buffer.concat([lenB, typeB, data, crcB])
}

// Píxeles: fondo oscuro con glow naranja top-center y borde sky en horizontal center
const rows = []
for (let y = 0; y < H; y++) {
  const row = Buffer.alloc(1 + W * 3)
  row[0] = 0
  for (let x = 0; x < W; x++) {
    const nx = x / W - 0.5  // -0.5..0.5
    const ny = y / H         // 0..1

    // Glow naranja arriba-centro (radio ~0.55)
    const d = Math.sqrt(nx * nx + (ny * 0.7) * (ny * 0.7))
    const glow = Math.max(0, 1 - d / 0.55) ** 2 * 0.22

    // Línea horizontal tenue a 2/3 de altura
    const lineGlow = Math.abs(ny - 0.66) < 0.002 ? 0.08 : 0

    const t = glow + lineGlow
    row[1 + x * 3] = Math.min(255, Math.round(BG[0] + (ACCENT[0] - BG[0]) * t))
    row[2 + x * 3] = Math.min(255, Math.round(BG[1] + (ACCENT[1] - BG[1]) * t))
    row[3 + x * 3] = Math.min(255, Math.round(BG[2] + (SKY[2]    - BG[2]) * t * 0.3))
  }
  rows.push(row)
}

// Franja naranja de 6px en la base
for (let y = H - 6; y < H; y++) {
  const row = rows[y]
  for (let x = 0; x < W; x++) {
    row[1 + x * 3] = ACCENT[0]
    row[2 + x * 3] = ACCENT[1]
    row[3 + x * 3] = ACCENT[2]
  }
}

const raw  = Buffer.concat(rows)
const idat = zlib.deflateSync(raw, { level: 6 })

const ihdr = Buffer.alloc(13)
ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4)
ihdr[8] = 8; ihdr[9] = 2  // 8-bit RGB

const png = Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  chunk('IHDR', ihdr),
  chunk('IDAT', idat),
  chunk('IEND', Buffer.alloc(0)),
])

const out = path.resolve(__dirname, '../public/og-image.png')
fs.writeFileSync(out, png)
console.log(`✓ og-image.png (${W}x${H}) → ${out}`)
