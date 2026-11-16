/**
 * Renders the FLIP IT! app icon, adaptive icon foreground and splash logo as PNGs
 * using only Node built-ins. Run with: node scripts/generate-icons.js
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const OUT = path.join(__dirname, '..', 'src', 'assets', 'images');

const hex = (value) => [1, 3, 5].map((i) => parseInt(value.slice(i, i + 2), 16));
const NAVY = hex('#101426');
const PURPLE = hex('#8B5CF6');
const BLUE = hex('#38BDF8');
const CORAL = hex('#FB7185');

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf) {
  let crc = 0xffffffff;
  for (const byte of buf) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function encodePng(size, pixels) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8; // bit depth
  header[9] = 6; // RGBA
  const stride = size * 4 + 1;
  const raw = Buffer.alloc(stride * size);
  for (let y = 0; y < size; y += 1) {
    pixels.copy(raw, y * stride + 1, y * size * 4, (y + 1) * size * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/** Signed distance from a point to a rounded rectangle (negative inside). */
function roundedRectDistance(px, py, x, y, w, h, r) {
  const qx = Math.abs(px - (x + w / 2)) - (w / 2 - r);
  const qy = Math.abs(py - (y + h / 2)) - (h / 2 - r);
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
}

function render(size, { background, scale }) {
  const pixels = Buffer.alloc(size * size * 4);
  const paint = (x, y, color, alpha) => {
    const i = (y * size + x) * 4;
    const dstA = pixels[i + 3] / 255;
    const outA = alpha + dstA * (1 - alpha);
    for (let c = 0; c < 3; c += 1) {
      pixels[i + c] = Math.round((color[c] * alpha + pixels[i + c] * dstA * (1 - alpha)) / outA);
    }
    pixels[i + 3] = Math.round(outA * 255);
  };

  const shapes = [];
  if (background) shapes.push({ x: 0, y: 0, w: size, h: size, r: 0, color: NAVY });

  const grid = size * scale;
  const gap = grid * 0.08;
  const tile = (grid - gap) / 2;
  const origin = (size - grid) / 2;
  const depth = tile * 0.07;
  [PURPLE, BLUE, BLUE, CORAL].forEach((color, i) => {
    const x = origin + (i % 2) * (tile + gap);
    const y = origin + Math.floor(i / 2) * (tile + gap);
    const r = tile * 0.24;
    shapes.push({ x, y: y + depth, w: tile, h: tile - depth, r, color: color.map((c) => Math.round(c * 0.65)) });
    shapes.push({ x, y, w: tile, h: tile - depth, r, color });
    shapes.push({ x, y, w: tile, h: (tile - depth) * 0.5, r, color: [255, 255, 255], alpha: 0.16 });
  });

  for (const shape of shapes) {
    const x0 = Math.max(0, Math.floor(shape.x - 1));
    const x1 = Math.min(size - 1, Math.ceil(shape.x + shape.w + 1));
    const y0 = Math.max(0, Math.floor(shape.y - 1));
    const y1 = Math.min(size - 1, Math.ceil(shape.y + shape.h + 1));
    for (let y = y0; y <= y1; y += 1) {
      for (let x = x0; x <= x1; x += 1) {
        const d = roundedRectDistance(x + 0.5, y + 0.5, shape.x, shape.y, shape.w, shape.h, shape.r);
        const coverage = Math.max(0, Math.min(1, 0.5 - d));
        if (coverage > 0) paint(x, y, shape.color, coverage * (shape.alpha ?? 1));
      }
    }
  }
  return encodePng(size, pixels);
}

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'icon.png'), render(1024, { background: true, scale: 0.62 }));
fs.writeFileSync(path.join(OUT, 'adaptive-icon.png'), render(1024, { background: false, scale: 0.5 }));
fs.writeFileSync(path.join(OUT, 'splash-icon.png'), render(512, { background: false, scale: 0.9 }));
console.log('Icons written to', OUT);
