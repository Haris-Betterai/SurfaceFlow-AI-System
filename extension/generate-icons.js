// Run this script to generate PNG icons from the canvas
// node generate-icons.js

const fs = require('fs');
const path = require('path');

// Simple 1x1 pixel PNG in different colors (purple/indigo for SurfaceFlow branding)
// These are placeholder icons - replace with actual branded icons later

// Purple colored PNG icons (base64 encoded)
const icons = {
  16: 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAOklEQVQ4T2NkYGD4z0ABYBzVMIoMwOYCRkZGBgYWKGZkIAswYVNArAKKNZDiZZw2jPoCmBeg2ACaagAA5t8GAZMQNqwAAAAASUVORK5CYII=',
  48: 'iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAAdklEQVRoQ+2YQQ4AIAgD5f+P9uxJD0a3OghJL8ZQaZex0RyeGR7/bwJsIewCbCbsAmwi7AZsIuwCbCLsBmwi7AJsIuwGbCLsAmwi7AZsIuwCbCLsBmwi7AJsIuwGbCLsAmwi7AZsIuwCbCLsBgwJ8N8D2wQIu7kXoLoQMWVMG8QAAAAASUVORK5CYII=',
  128: 'iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAA00lEQVR4nO3TQQ0AQAgEQPb+O8cX8Ii6IJP0X7NvdzfDwf0IIMF9CCABfQggAX0IIAF9CCABfQggAX0IIAF9CCABfQggAX0IIAF9CCABfQggAX0IIAF9CCABfQggAX0IIAF9CCABfQggAX0IIAF9CCABfQggAX0IIAF9CCABfQggAX0IIAF9CCABfQggAX0IIAF9CCABfQggAX0IIAF9CCABfQggAX0IIAF9CCABfQggAX0IIAF9CCABfQggAX0IIAF9CCABfQggAX0IIIEfBsB+D/wZwAGHCOoBB3LnTAAAAABJRU5ErkJggg=='
};

const iconsDir = path.join(__dirname, 'assets', 'icons');

// Ensure directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Write PNG files
Object.entries(icons).forEach(([size, base64]) => {
  const buffer = Buffer.from(base64, 'base64');
  const filePath = path.join(iconsDir, `icon-${size}.png`);
  fs.writeFileSync(filePath, buffer);
  console.log(`Created: ${filePath}`);
});

console.log('Icons generated successfully!');
