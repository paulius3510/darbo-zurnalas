#!/usr/bin/env python3
from PIL import Image, ImageDraw
import os

# Create icons directory if not exists
icons_dir = "/Users/pauliusgrigaliunas/Projects/Darbo Zurnalas/public/icons"
os.makedirs(icons_dir, exist_ok=True)

def hex_to_rgb(hex_color):
    """Convert hex color to RGB tuple"""
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

def create_icon(size, filename):
    # Create image with blue background
    img = Image.new('RGB', (size, size), color=hex_to_rgb('#2563eb'))
    draw = ImageDraw.Draw(img)

    # Draw white rounded rectangle (calendar)
    padding = int(size * 0.15)
    rect_coords = [
        padding,
        padding + int(size * 0.05),
        size - padding,
        size - padding
    ]
    draw.rounded_rectangle(rect_coords, radius=int(size * 0.05), outline='white', width=int(size * 0.04))

    # Draw horizontal line (calendar header)
    line_y = padding + int(size * 0.15)
    draw.line([(padding, line_y), (size - padding, line_y)], fill='white', width=int(size * 0.04))

    # Draw two vertical lines at top (calendar tabs)
    tab1_x = padding + int(size * 0.25)
    tab2_x = padding + int(size * 0.55)
    tab_top = padding
    tab_bottom = padding + int(size * 0.08)
    draw.line([(tab1_x, tab_top), (tab1_x, tab_bottom)], fill='white', width=int(size * 0.04))
    draw.line([(tab2_x, tab_top), (tab2_x, tab_bottom)], fill='white', width=int(size * 0.04))

    # Save
    img.save(filename, 'PNG')
    print(f"Created {filename}")

# Create both icons
create_icon(192, f"{icons_dir}/icon-192.png")
create_icon(512, f"{icons_dir}/icon-512.png")

print("✅ Icons created successfully!")
