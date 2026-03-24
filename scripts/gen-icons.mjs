/**
 * Pukari PWA アイコン生成スクリプト
 * Node.js 内蔵モジュールのみ使用（追加パッケージ不要）
 * 実行: node scripts/gen-icons.mjs
 */
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── CRC32 実装 ──
function crc32(buf) {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    table[n] = c;
  }
  let crc = 0xffffffff;
  for (const b of buf) crc = table[(crc ^ b) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

// ── PNG チャンク作成 ──
function pngChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.allocUnsafe(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.allocUnsafe(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

// ── アイコン生成（シャボン玉: 水色の円 + 白ハイライト） ──
function generateIcon(size) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.42;

  // ハイライト（左上の光の反射）
  const hlX = cx - r * 0.22;
  const hlY = cy - r * 0.22;
  const hlR = r * 0.28;

  // 生のスキャンライン: 各行に filterByte(0) + RGB × width
  const raw = Buffer.allocUnsafe(size * (1 + size * 3));
  let offset = 0;

  for (let y = 0; y < size; y++) {
    raw[offset++] = 0; // filter: None
    for (let x = 0; x < size; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      let red, green, blue;

      if (dist <= r) {
        // シャボン玉の内側
        const hdx = x - hlX;
        const hdy = y - hlY;
        const hdist = Math.sqrt(hdx * hdx + hdy * hdy);

        if (hdist <= hlR) {
          // ハイライト部分: 白から水色へのグラデーション
          const t = hdist / hlR;
          red   = Math.round(255 - (255 - 100) * t * 0.6);
          green = Math.round(255 - (255 - 181) * t * 0.6);
          blue  = 255;
        } else {
          // 泡本体: #64B5F6 (100, 181, 246)
          red = 100; green = 181; blue = 246;
        }
      } else if (dist <= r + Math.max(1, size * 0.005)) {
        // エッジのアンチエイリアス
        const t = (dist - r) / Math.max(1, size * 0.005);
        red   = Math.round(100  + (227 - 100)  * t);
        green = Math.round(181  + (242 - 181)  * t);
        blue  = Math.round(246  + (253 - 246)  * t);
      } else {
        // 背景: #E3F2FD (227, 242, 253)
        red = 227; green = 242; blue = 253;
      }

      raw[offset++] = red;
      raw[offset++] = green;
      raw[offset++] = blue;
    }
  }

  // 圧縮
  const compressed = deflateSync(raw, { level: 9 });

  // IHDR チャンク
  const ihdr = Buffer.allocUnsafe(13);
  ihdr.writeUInt32BE(size, 0);    // width
  ihdr.writeUInt32BE(size, 4);    // height
  ihdr[8]  = 8;  // bit depth
  ihdr[9]  = 2;  // color type: RGB (no alpha)
  ihdr[10] = 0;  // compression
  ihdr[11] = 0;  // filter
  ihdr[12] = 0;  // interlace

  // PNG 組み立て
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), // PNG signature
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', compressed),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

// ── 出力 ──
const publicDir = join(__dirname, '..', 'public');

writeFileSync(join(publicDir, 'icon-192.png'), generateIcon(192));
writeFileSync(join(publicDir, 'icon-512.png'), generateIcon(512));

console.log('✓ public/icon-192.png を生成しました');
console.log('✓ public/icon-512.png を生成しました');
