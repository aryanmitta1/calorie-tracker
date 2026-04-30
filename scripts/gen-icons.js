// Generates icon-192.png, icon-512.png, and apple-touch-icon.png
// Run: node scripts/gen-icons.js
// Requires: npm install canvas (only for icon generation, not production)
const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

function makeIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background gradient
  const bg = ctx.createLinearGradient(0, 0, size, size);
  bg.addColorStop(0, '#1a0533');
  bg.addColorStop(1, '#06030f');
  ctx.fillStyle = bg;
  roundRect(ctx, 0, 0, size, size, size * 0.22);
  ctx.fill();

  // Amber arc (calories)
  const cx = size / 2, cy = size / 2, r = size * 0.3;
  ctx.beginPath();
  ctx.arc(cx, cy, r, Math.PI * 0.75, Math.PI * 0.25);
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = size * 0.07;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Emerald arc (protein)
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.6, Math.PI * 0.75, Math.PI * 0.25);
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = size * 0.06;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Center dot
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.06, 0, Math.PI * 2);
  ctx.fillStyle = '#a78bfa';
  ctx.fill();

  return canvas.toBuffer('image/png');
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

const publicDir = path.join(__dirname, '..', 'public');

fs.writeFileSync(path.join(publicDir, 'icon-192.png'), makeIcon(192));
fs.writeFileSync(path.join(publicDir, 'icon-512.png'), makeIcon(512));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), makeIcon(180));

console.log('Icons generated: icon-192.png, icon-512.png, apple-touch-icon.png');
