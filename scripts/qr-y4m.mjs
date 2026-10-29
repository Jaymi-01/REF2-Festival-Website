/**
 * Renders a QR payload into a Y4M video file.
 *
 * Chromium's `--use-file-for-fake-video-capture` plays this as the webcam, so
 * a test can put a real QR in front of a real camera pipeline. Canvas capture
 * streams come out 2x2 in headless, which is why this exists.
 */
import QRCode from "qrcode";
import { writeFileSync } from "node:fs";

const SIZE = 480; // frame is SIZE x SIZE, must be even for 4:2:0

/** Draws one QR into a Y plane. `box` is {x, y, w} in pixels. */
function drawQr(y, size, text, box, quiet = 4) {
  const modules = QRCode.create(text, { errorCorrectionLevel: "H" }).modules;
  const count = modules.size;
  const total = count + quiet * 2;
  const scale = Math.max(1, Math.floor(box.w / total));
  const drawn = total * scale;
  const ox = Math.round(box.x + (box.w - drawn) / 2);
  const oy = Math.round(box.y + (box.w - drawn) / 2);

  // white quiet-zone card behind the code
  for (let r = 0; r < drawn; r++) {
    const base = (oy + r) * size + ox;
    y.fill(255, base, base + drawn);
  }
  for (let row = 0; row < count; row++) {
    for (let col = 0; col < count; col++) {
      if (!modules.get(row, col)) continue;
      const x0 = ox + (col + quiet) * scale;
      const y0 = oy + (row + quiet) * scale;
      for (let dy = 0; dy < scale; dy++) {
        const base = (y0 + dy) * size + x0;
        y.fill(0, base, base + scale);
      }
    }
  }
}

/**
 * `text` is a single payload, or an array of {text, x, y, w} placements in
 * pixels — which is how a sheet of several tickets in one camera frame is
 * simulated.
 */
export function writeQrY4m(path, text, { size = SIZE, quiet = 6 } = {}) {
  const y = new Uint8Array(size * size).fill(200); // grey "paper" around the codes

  if (Array.isArray(text)) {
    for (const p of text) drawQr(y, size, p.text, { x: p.x, y: p.y, w: p.w }, 3);
  } else {
    y.fill(255);
    // 55% of the frame — about what a ticket on a phone screen looks like at
    // arm's length, and comfortably inside the scanner's guide.
    const w = Math.round(size * 0.55);
    drawQr(y, size, text, { x: (size - w) / 2, y: (size - w) / 2, w }, quiet);
  }

  // 4:2:0 chroma, neutral (greyscale image)
  const chroma = new Uint8Array((size / 2) * (size / 2)).fill(128);

  const header = Buffer.from(`YUV4MPEG2 W${size} H${size} F10:1 Ip A1:1 C420\n`, "ascii");
  const frameTag = Buffer.from("FRAME\n", "ascii");
  const frame = Buffer.concat([frameTag, Buffer.from(y), Buffer.from(chroma), Buffer.from(chroma)]);

  // A few identical frames so the capture has something to loop over.
  writeFileSync(path, Buffer.concat([header, ...Array.from({ length: 8 }, () => frame)]));
  return path;
}
