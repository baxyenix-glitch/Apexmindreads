const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Read input PNG
const logoBuf = fs.readFileSync(path.join(__dirname, '../public/logo.png'));

let pos = 8;
let width, height;
let idatChunks = [];

while (pos < logoBuf.length) {
  const len = logoBuf.readUInt32BE(pos);
  const type = logoBuf.slice(pos + 4, pos + 8).toString('ascii');
  const data = logoBuf.slice(pos + 8, pos + 8 + len);
  if (type === 'IHDR') {
    width = data.readUInt32BE(0);
    height = data.readUInt32BE(4);
  } else if (type === 'IDAT') {
    idatChunks.push(data);
  }
  pos += 12 + len;
}

const compressed = Buffer.concat(idatChunks);
const raw = zlib.inflateSync(compressed);

const bpp = 4; // RGBA
const stride = 1 + width * bpp;

// Correct PNG reconstruction (un-filtering)
const uncompressed = Buffer.alloc(width * height * bpp);

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

for (let y = 0; y < height; y++) {
  const filterType = raw[y * stride];
  const rowStart = y * stride + 1;
  const prevRowDest = (y - 1) * width * bpp;
  const currRowDest = y * width * bpp;

  for (let x = 0; x < width * bpp; x++) {
    const rawVal = raw[rowStart + x];
    const a = x >= bpp ? uncompressed[currRowDest + x - bpp] : 0;
    const b = y > 0 ? uncompressed[prevRowDest + x] : 0;
    const c = (y > 0 && x >= bpp) ? uncompressed[prevRowDest + x - bpp] : 0;

    let val = 0;
    if (filterType === 0) {
      val = rawVal;
    } else if (filterType === 1) {
      val = (rawVal + a) & 0xff;
    } else if (filterType === 2) {
      val = (rawVal + b) & 0xff;
    } else if (filterType === 3) {
      val = (rawVal + Math.floor((a + b) / 2)) & 0xff;
    } else if (filterType === 4) {
      val = (rawVal + paeth(a, b, c)) & 0xff;
    }
    uncompressed[currRowDest + x] = val;
  }
}

// Find tight bounding box of visible logo pixels (non-white, non-transparent)
let minX = width, maxX = 0, minY = height, maxY = 0;

for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const idx = (y * width + x) * bpp;
    const r = uncompressed[idx];
    const g = uncompressed[idx + 1];
    const b = uncompressed[idx + 2];
    const a = uncompressed[idx + 3];

    // Check if pixel is visible (not transparent, and not pure white canvas background)
    if (a > 30 && (r < 245 || g < 245 || b < 245)) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
}

console.log('Original dimensions:', { width, height });
console.log('Tight Bounding Box:', { minX, maxX, minY, maxY, w: maxX - minX + 1, h: maxY - minY + 1 });

const cropW = maxX - minX + 1;
const cropH = maxY - minY + 1;

// Function to generate crisp, high-res scaled PNGs
function generateOutputPng(targetSize, mode) {
  // mode: 'color' (vibrant orange & navy), 'badge' (high-contrast orange & solid white for status bar)
  const padding = Math.round(targetSize * 0.04); // 4% padding for maximum size and boldness!
  const availW = targetSize - padding * 2;
  const availH = targetSize - padding * 2;

  const scale = Math.min(availW / cropW, availH / cropH);
  const renderW = Math.round(cropW * scale);
  const renderH = Math.round(cropH * scale);
  const offsetX = Math.round((targetSize - renderW) / 2);
  const offsetY = Math.round((targetSize - renderH) / 2);

  const outStride = 1 + targetSize * bpp;
  const outRaw = Buffer.alloc(targetSize * outStride, 0);

  for (let dy = 0; dy < renderH; dy++) {
    const targetY = offsetY + dy;
    outRaw[targetY * outStride] = 0; // None filter

    for (let dx = 0; dx < renderW; dx++) {
      const targetX = offsetX + dx;

      const srcX = Math.min(Math.floor(minX + dx / scale), maxX);
      const srcY = Math.min(Math.floor(minY + dy / scale), maxY);

      const srcIdx = (srcY * width + srcX) * bpp;
      const destIdx = targetY * outStride + 1 + targetX * bpp;

      let r = uncompressed[srcIdx];
      let g = uncompressed[srcIdx + 1];
      let b = uncompressed[srcIdx + 2];
      let a = uncompressed[srcIdx + 3];

      // If background white or transparent
      if (a < 30 || (r > 245 && g > 245 && b > 245)) {
        outRaw[destIdx] = 0;
        outRaw[destIdx + 1] = 0;
        outRaw[destIdx + 2] = 0;
        outRaw[destIdx + 3] = 0;
      } else {
        if (mode === 'badge') {
          // In status bar badge mode:
          // If it's orange (r > 180, g < 150), make it vivid solid orange #FF5500
          // If it's dark navy (r < 60, g < 60, b < 80), make it bright solid white/orange for status bar contrast
          if (r > 150 && g < 140 && b < 60) {
            outRaw[destIdx] = 255;
            outRaw[destIdx + 1] = 85;
            outRaw[destIdx + 2] = 0;
            outRaw[destIdx + 3] = 255;
          } else {
            // High-contrast outer triangle and ribbon
            outRaw[destIdx] = 240;
            outRaw[destIdx + 1] = 240;
            outRaw[destIdx + 2] = 245;
            outRaw[destIdx + 3] = 255;
          }
        } else {
          // Color mode
          outRaw[destIdx] = r;
          outRaw[destIdx + 1] = g;
          outRaw[destIdx + 2] = b;
          outRaw[destIdx + 3] = 255;
        }
      }
    }
  }

  function crc32(buf) {
    let table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let k = 0; k < 8; k++) c = ((c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1));
      table[i] = c;
    }
    let crc = 0 ^ (-1);
    for (let i = 0; i < buf.length; i++) {
      crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
    }
    return (crc ^ (-1)) >>> 0;
  }

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    const toCrc = Buffer.concat([typeBuf, data]);
    crcBuf.writeUInt32BE(crc32(toCrc), 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(targetSize, 0);
  ihdrData.writeUInt32BE(targetSize, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;

  const ihdrChunk = makeChunk('IHDR', ihdrData);
  const idatChunk = makeChunk('IDAT', zlib.deflateSync(outRaw));
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    ihdrChunk,
    idatChunk,
    iendChunk
  ]);
}

// 1. Generate full-color 512x512 & 192x192 notification icon
const notif512 = generateOutputPng(512, 'color');
fs.writeFileSync(path.join(__dirname, '../public/notification-icon.png'), notif512);

// 2. Generate high-contrast bold 192x192 & 96x96 status bar badge
const badge192 = generateOutputPng(192, 'badge');
fs.writeFileSync(path.join(__dirname, '../public/status-bar-badge.png'), badge192);
fs.writeFileSync(path.join(__dirname, '../public/badge-96.png'), generateOutputPng(96, 'badge'));

console.log('✅ Generated bold, crisp status-bar-badge.png & notification-icon.png with full scanline reconstruction!');
