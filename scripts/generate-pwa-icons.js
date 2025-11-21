#!/usr/bin/env node

/**
 * Generate placeholder PWA icons
 * These are simple solid color PNG files that should be replaced with actual app icons
 */

const fs = require('fs');
const path = require('path');

// Simple 1x1 pixel PNG in base64, will be scaled
// This is a black pixel PNG
const minimalPNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, '../public/icons');

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// For each size, create a placeholder file
sizes.forEach(size => {
  const filename = `icon-${size}x${size}.png`;
  const filepath = path.join(iconsDir, filename);

  // Create a simple SVG and note that proper icons should be generated
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#000000"/>
  <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#ffffff" font-family="Arial, sans-serif" font-size="${size * 0.3}">N</text>
</svg>`;

  // Save as SVG for now (can be converted to PNG later with proper tools)
  const svgPath = filepath.replace('.png', '.svg');
  fs.writeFileSync(svgPath, svg);

  console.log(`Created placeholder: ${filename.replace('.png', '.svg')}`);
});

console.log('\n⚠️  Note: SVG placeholders created. For production:');
console.log('1. Generate proper PNG icons from your app logo');
console.log('2. Use tools like https://realfavicongenerator.net/');
console.log('3. Replace the SVG files with PNG files in the same sizes\n');
