#!/usr/bin/env node

/**
 * Generate Chrome extension icons from the original logo
 * Run with: node generate-icons.js
 */

const fs = require('fs');
const path = require('path');

// Chrome extension required icon sizes
const requiredSizes = [16, 32, 48, 128];

console.log('🎨 Chrome Extension Icon Generator');
console.log('==================================');

// Check if original logo exists
const originalLogoPath = path.join(__dirname, 'icons', 'logo-original.png');
if (!fs.existsSync(originalLogoPath)) {
    console.error('❌ Original logo not found at:', originalLogoPath);
    console.log('Please make sure "In the Money AI Logo.png" is in the icons/ folder');
    process.exit(1);
}

console.log('✅ Found original logo:', originalLogoPath);

// For now, let's just copy the existing icons and rename them
// In a real implementation, you'd use a library like 'sharp' to resize images
console.log('\n📋 Required icon sizes for Chrome extension:');
requiredSizes.forEach(size => {
    const filename = `icon${size}.png`;
    const filepath = path.join(__dirname, 'icons', filename);
    
    if (fs.existsSync(filepath)) {
        console.log(`✅ ${filename} - exists`);
    } else {
        console.log(`❌ ${filename} - missing`);
    }
});

console.log('\n💡 Next steps:');
console.log('1. Install image processing library: npm install sharp');
console.log('2. Run the icon generator to resize your logo');
console.log('3. Or manually resize your logo to the required sizes');

console.log('\n🔧 Manual approach:');
console.log('1. Open your logo in an image editor (Photoshop, GIMP, etc.)');
console.log('2. Resize to each required size: 16x16, 32x32, 48x48, 128x128');
console.log('3. Save as icon16.png, icon32.png, icon48.png, icon128.png in the icons/ folder');

console.log('\n📁 Current icons folder contents:');
const iconsDir = path.join(__dirname, 'icons');
if (fs.existsSync(iconsDir)) {
    const files = fs.readdirSync(iconsDir);
    files.forEach(file => {
        console.log(`  - ${file}`);
    });
}
