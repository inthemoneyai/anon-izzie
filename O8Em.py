#!/usr/bin/env python3
"""
Simple script to create PNG icons for the Chrome extension
"""

from PIL import Image, ImageDraw
import os

def create_icon(size):
    # Create a new image with transparent background
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Calculate dimensions based on size
    center = size // 2
    radius = int(size * 0.4)
    
    # Draw background circle with gradient effect (simplified)
    draw.ellipse([center - radius, center - radius, center + radius, center + radius], 
                 fill=(102, 126, 234, 255), outline=(255, 255, 255, 255), width=2)
    
    # Draw shield shape
    shield_size = int(size * 0.3)
    shield_points = [
        (center, center - shield_size//2),
        (center - shield_size//2, center - shield_size//4),
        (center - shield_size//2, center + shield_size//4),
        (center, center + shield_size//2),
        (center + shield_size//2, center + shield_size//4),
        (center + shield_size//2, center - shield_size//4)
    ]
    draw.polygon(shield_points, fill=(255, 255, 255, 255), outline=(102, 126, 234, 255))
    
    # Draw lock
    lock_width = int(size * 0.15)
    lock_height = int(size * 0.12)
    lock_x = center - lock_width//2
    lock_y = center - lock_height//4
    
    # Lock body
    draw.rectangle([lock_x, lock_y, lock_x + lock_width, lock_y + lock_height], 
                   fill=(102, 126, 234, 255))
    
    # Lock shackle
    shackle_y = lock_y - int(size * 0.05)
    draw.arc([lock_x - 2, shackle_y, lock_x + lock_width + 2, lock_y + 2], 
             0, 180, fill=(102, 126, 234, 255), width=3)
    
    return img

def main():
    sizes = [16, 32, 48, 128]
    
    for size in sizes:
        icon = create_icon(size)
        filename = f"icons/icon{size}.png"
        icon.save(filename, "PNG")
        print(f"Created {filename}")

if __name__ == "__main__":
    main()
