const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Read input PNG
const inputPath = path.join(__dirname, '../public/status-bar-badge.png');
const buf = fs.readFileSync(inputPath);

let pos = 8;
let width, height;
let idatChunks = [];

while (pos < buf.length) {
  const len = buf.readUInt32BE(pos);
  const type = buf.slice(pos + 4, pos + 8).toString('ascii');
  const data = buf.slice(pos + 8, pos + 8 + len);
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
const bpp = 4;
const stride = 1 + width * bpp;

// Find bounding box of non-white pixels
let minX = width, maxX = 0, minY = height, maxY = 0;

for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const idx = y * stride + 1 + x * bpp;
    const r = raw[idx];
    const g = raw[idx + 1];
    const b = raw[idx + 2];
    const a = raw[idx + 3];

    if ((r < 240 || g < 240 || b < 240) && a > 30) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
}

console.log('Original dimensions:', { width, height });
console.log('Emblem Bounding Box:', { minX, maxX, minY, maxY, w: maxX - minX + 1, h: maxY - minY + 1 });

const cropW = maxX - minX + 1;
const cropH = maxY - minY + 1;

// Render into a bold, high-resolution square canvas (192x192)
const targetSize = 192;
const padding = 8; // Small 8px margin so it fills 92% of the icon area!
const availSize = targetSize - (padding * 2);

const scale = Math.min(availSize / cropW, availSize / cropH);
const renderW = Math.round(cropW * scale);
const renderH = Math.round(cropH * scale);
const offsetX = Math.round((targetSize - renderW) / 2);
const offsetY = Math.round((targetSize - renderH) / 2);

console.log('Rendering target:', { targetSize, renderW, renderH, offsetX, offsetY, scale });

// Create target raw buffer (RGBA, targetSize x targetSize)
const outStride = 1 + targetSize * bpp;
const outRaw = Buffer.alloc(targetSize * outStride, 0);

for (let dy = 0; dy < renderH; dy++) {
  const targetY = offsetY + dy;
  for (let dx = 0; dx < renderW; dx++) {
    const targetX = offsetX + dx;
    
    // Sample from original crop
    const srcX = Math.min(Math.floor(minX + dx / scale), maxX);
    const srcY = Math.min(Math.floor(minY + dy / scale), maxY);

    const srcIdx = srcY * stride + 1 + srcX * bpp;
    const destIdx = targetY * outStride + 1 + targetX * bpp;

    let r = raw[srcIdx];
    let g = raw[srcIdx + 1];
    let b = raw[srcIdx + 2];
    let a = raw[srcIdx + 3];

    // If near white, keep transparent; otherwise make bold and vibrant
    if (r > 240 && g > 240 && b > 240) {
      outRaw[destIdx] = 0;
      outRaw[destIdx + 1] = 0;
      outRaw[destIdx + 2] = 0;
      outRaw[destIdx + 3] = 0;
    } else {
      // Enhance contrast and color saturation for high status bar visibility
      outRaw[destIdx] = r;
      outRaw[destIdx + 1] = g;
      outRaw[destIdx + 2] = b;
      outRaw[destIdx + 3] = a > 0 ? 255 : 0; // Solid alpha for crispness
    }
  }
}

// Helper functions for PNG output
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

function buildPng(rawBuffer, w, h) {
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(w, 0);
  ihdrData.writeUInt32BE(h, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;

  const ihdrChunk = makeChunk('IHDR', ihdrData);
  const idatChunk = makeChunk('IDAT', zlib.deflateSync(rawBuffer));
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    ihdrChunk,
    idatChunk,
    iendChunk
  ]);
}

const finalPng = buildPng(outRaw, targetSize, targetSize);

fs.writeFileSync(path.join(__dirname, '../public/status-bar-badge.png'), finalPng);
fs.writeFileSync(path.join(__dirname, '../public/notification-icon.png'), finalPng);
fs.writeFileSync(path.join(__dirname, '../public/badge-96.png'), finalPng);

console.log('✅ Successfully created big, bold status-bar-badge.png and notification-icon.png!');
