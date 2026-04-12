from PIL import Image, ImageDraw, ImageFilter
import math
import numpy as np

W, H = 1024, 1024

def make_logo():
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    cx, cy = W // 2, H // 2

    # === BACKGROUND: dark purple radial gradient (numpy for speed) ===
    y_arr, x_arr = np.ogrid[:H, :W]
    dist = np.sqrt((x_arr - cx)**2 + (y_arr - cy)**2).astype(np.float32)
    max_r = math.sqrt(cx**2 + cy**2)
    t = np.clip(dist / max_r, 0, 1)
    # center: #2d1b69 (45,27,105), edges: #0a0015 (10,0,21)
    r_ch = (10 + (45 - 10) * (1 - t)).astype(np.uint8)
    g_ch = (0 + (27 - 0) * (1 - t)).astype(np.uint8)
    b_ch = (21 + (105 - 21) * (1 - t)).astype(np.uint8)
    a_ch = np.full((H, W), 255, dtype=np.uint8)
    bg_arr = np.stack([r_ch, g_ch, b_ch, a_ch], axis=2)
    bg = Image.fromarray(bg_arr, 'RGBA')
    img = Image.alpha_composite(img, bg)

    # === GLOW behind cube (numpy) ===
    glow_r = 320
    glow_dist = np.sqrt((x_arr - cx)**2 + (y_arr - cy - 20)**2).astype(np.float32)
    glow_t = np.clip(glow_dist / glow_r, 0, 1)
    glow_alpha = (120 * (1 - glow_t)**1.8).astype(np.uint8)
    glow_alpha[glow_dist > glow_r] = 0
    glow_arr = np.zeros((H, W, 4), dtype=np.uint8)
    glow_arr[:,:,0] = 140
    glow_arr[:,:,1] = 60
    glow_arr[:,:,2] = 255
    glow_arr[:,:,3] = glow_alpha
    glow_img = Image.fromarray(glow_arr, 'RGBA')
    img = Image.alpha_composite(img, glow_img)

    # === 3D ISOMETRIC CUBE ===
    ox, oy = cx, cy + 10

    def iso_project(x3, y3, z3):
        px = (x3 - z3) * math.cos(math.radians(30))
        py = -y3 + (x3 + z3) * math.sin(math.radians(30))
        return (ox + int(px), oy + int(py))

    e2 = 185

    v = {}
    for name, (x, y, z) in [
        ('FBL', (-1, -1, -1)), ('FBR', (1, -1, -1)),
        ('FTL', (-1, 1, -1)),  ('FTR', (1, 1, -1)),
        ('BBL', (-1, -1, 1)),  ('BBR', (1, -1, 1)),
        ('BTL', (-1, 1, 1)),   ('BTR', (1, 1, 1)),
    ]:
        v[name] = iso_project(x * e2, y * e2, z * e2)

    top_poly = [v['FTL'], v['FTR'], v['BTR'], v['BTL']]
    left_poly = [v['FTL'], v['BTL'], v['BBL'], v['FBL']]
    front_poly = [v['FTL'], v['FTR'], v['FBR'], v['FBL']]

    # Draw cube faces
    cube_layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    cd = ImageDraw.Draw(cube_layer)

    # Left face (darkest)
    cd.polygon(left_poly, fill=(45, 18, 110, 220))
    # Front face (medium)
    cd.polygon(front_poly, fill=(75, 30, 160, 230))
    # Top face (lightest)
    cd.polygon(top_poly, fill=(110, 55, 210, 200))

    # Glass highlight on top face
    highlight = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    hd = ImageDraw.Draw(highlight)
    hd.polygon(top_poly, fill=(255, 255, 255, 30))
    cube_layer = Image.alpha_composite(cube_layer, highlight)

    # Edge highlights
    cd2 = ImageDraw.Draw(cube_layer)
    edges = [
        ([v['FTL'], v['FTR']], 3, (200, 160, 255, 100)),
        ([v['FTR'], v['BTR']], 2, (180, 140, 255, 70)),
        ([v['BTR'], v['BTL']], 2, (180, 140, 255, 60)),
        ([v['BTL'], v['FTL']], 2, (180, 140, 255, 70)),
        ([v['FTL'], v['FBL']], 3, (200, 160, 255, 90)),
        ([v['FTR'], v['FBR']], 3, (180, 140, 255, 80)),
        ([v['FBL'], v['FBR']], 2, (160, 120, 255, 70)),
        ([v['BTL'], v['BBL']], 2, (160, 120, 255, 50)),
        ([v['FBL'], v['BBL']], 2, (150, 110, 255, 60)),
    ]
    for pts, w, col in edges:
        cd2.line(pts, fill=col, width=w)

    img = Image.alpha_composite(img, cube_layer)

    # === MUSIC NOTE (♪) on front face ===
    note_layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    nd = ImageDraw.Draw(note_layer)

    # Center of front face
    fcx = sum(p[0] for p in front_poly) // 4
    fcy = sum(p[1] for p in front_poly) // 4

    # Note head (tilted ellipse)
    nh_w, nh_h = 44, 34
    nh_cx, nh_cy = fcx - 12, fcy + 55

    note_head_img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    nhd = ImageDraw.Draw(note_head_img)
    nhd.ellipse([nh_cx - nh_w, nh_cy - nh_h, nh_cx + nh_w, nh_cy + nh_h],
                fill=(255, 255, 255, 245))
    note_head_img = note_head_img.rotate(-25, center=(nh_cx, nh_cy), resample=Image.BICUBIC)
    note_layer = Image.alpha_composite(note_layer, note_head_img)

    nd = ImageDraw.Draw(note_layer)

    # Stem
    stem_x = nh_cx + nh_w - 6
    stem_bottom = nh_cy - 8
    stem_top = fcy - 90
    nd.line([(stem_x, stem_bottom), (stem_x, stem_top)], fill=(255, 255, 255, 245), width=9)

    # Flag (elegant curve)
    flag_pts = []
    for i in range(40):
        t = i / 39
        fx = stem_x + int(55 * math.sin(t * math.pi * 0.65) * (1 - 0.3*t))
        fy = stem_top + int(80 * t)
        flag_pts.append((fx, fy))
    for i in range(39, -1, -1):
        t = i / 39
        fx = stem_x + int(35 * math.sin(t * math.pi * 0.5) * (1 - 0.3*t))
        fy = stem_top + int(70 * t) + 10
        flag_pts.append((fx, fy))
    nd.polygon(flag_pts, fill=(255, 255, 255, 235))

    img = Image.alpha_composite(img, note_layer)

    # === Note glow (purple tint, using numpy) ===
    note_glow = note_layer.filter(ImageFilter.GaussianBlur(18))
    ng_arr = np.array(note_glow)
    # Tint purple and reduce alpha
    ng_arr[:,:,0] = np.minimum(ng_arr[:,:,0], 200)
    ng_arr[:,:,1] = np.minimum(ng_arr[:,:,1], 130)
    ng_arr[:,:,2] = np.maximum(ng_arr[:,:,2], 220)
    ng_arr[:,:,3] = (ng_arr[:,:,3].astype(np.float32) * 0.35).astype(np.uint8)
    note_glow_tinted = Image.fromarray(ng_arr, 'RGBA')
    # Composite glow BEHIND notes - so composite glow first, then img on top
    final = Image.alpha_composite(note_glow_tinted, img)

    # === Specular highlights ===
    spec = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    sd = ImageDraw.Draw(spec)
    # Top-right corner of top face
    sp = top_poly[1]
    for r in range(50, 0, -1):
        alpha = int(30 * (1 - r / 50))
        sd.ellipse([sp[0] - r - 30, sp[1] - r + 15, sp[0] + r - 30, sp[1] + r + 15],
                   fill=(255, 255, 255, alpha))
    # Front face highlight
    sp2 = front_poly[1]
    for r in range(35, 0, -1):
        alpha = int(20 * (1 - r / 35))
        sd.ellipse([sp2[0] - r - 40, sp2[1] - r + 30, sp2[0] + r - 40, sp2[1] + r + 30],
                   fill=(255, 255, 255, alpha))
    final = Image.alpha_composite(final, spec)

    return final

logo = make_logo()
logo.save('/opt/musicbox/logo-original.png', 'PNG')

# Crop to content with padding
bbox = logo.getbbox()
if bbox:
    pad = 30
    cropped = logo.crop((max(0, bbox[0]-pad), max(0, bbox[1]-pad),
                         min(W, bbox[2]+pad), min(H, bbox[3]+pad)))
    cropped.save('/opt/musicbox/logo-cropped.png', 'PNG')

print(f"Logo saved: {logo.size}")
print("Done!")
