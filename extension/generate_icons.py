#!/usr/bin/env python3
"""Generate MusicBox extension icons — purple circle with white music note."""
import struct, zlib, os, math

def chunk(ctype, data):
    c = ctype + data
    return struct.pack('>I', len(data)) + c + struct.pack('>I', zlib.crc32(c) & 0xFFFFFFFF)

def create_icon(size):
    center = size / 2
    radius = size / 2 - 0.5
    bg = (124, 58, 237)
    fg = (255, 255, 255)

    raw = b''
    for y in range(size):
        raw += b'\x00'
        for x in range(size):
            dx, dy = x - center + 0.5, y - center + 0.5
            dist = math.sqrt(dx * dx + dy * dy)

            if dist > radius + 0.5:
                raw += bytes([0, 0, 0, 0])
                continue

            alpha = min(255, max(0, int(255 * (radius + 0.5 - dist))))
            nx, ny = (x + 0.5) / size, (y + 0.5) / size
            in_note = False

            # Note head (tilted ellipse)
            hx, hy, hrx, hry = 0.42, 0.63, 0.11, 0.07
            if ((nx - hx) / hrx) ** 2 + ((ny - hy) / hry) ** 2 <= 1:
                in_note = True
            # Stem
            if 0.51 <= nx <= 0.55 and 0.24 <= ny <= 0.63:
                in_note = True
            # Flag
            if 0.51 <= nx <= 0.64 and 0.24 <= ny <= 0.40:
                fx = (nx - 0.51) / 0.13
                fy = (ny - 0.24) / 0.16
                if fy <= fx * 1.3 and fx <= 1:
                    in_note = True

            color = fg if in_note else bg
            raw += bytes([color[0], color[1], color[2], alpha])

    ihdr = chunk(b'IHDR', struct.pack('>IIBBBBB', size, size, 8, 6, 0, 0, 0))
    idat = chunk(b'IDAT', zlib.compress(raw, 9))
    iend = chunk(b'IEND', b'')
    return b'\x89PNG\r\n\x1a\n' + ihdr + idat + iend

os.makedirs('icons', exist_ok=True)
for sz in [16, 48, 128]:
    png = create_icon(sz)
    path = f'icons/icon{sz}.png'
    with open(path, 'wb') as f:
        f.write(png)
    print(f'  {path} ({len(png)} bytes)')
