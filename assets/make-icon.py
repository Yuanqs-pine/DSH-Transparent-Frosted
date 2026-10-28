"""Render the 180x180 storefront icon (raster twin of icon.svg)."""

from PIL import Image, ImageDraw, ImageFilter

S = 6                      # supersample: 180 * 6 = 1080 px canvas
N = 180 * S
U = N / 64.0               # icon.svg viewBox is 64 units wide


def col(hex_str, alpha=255):
    hex_str = hex_str.lstrip('#')
    return (
        int(hex_str[0:2], 16),
        int(hex_str[2:4], 16),
        int(hex_str[4:6], 16),
        alpha,
    )


# ---- background: dark rounded square ------------------------------------
img = Image.new('RGBA', (N, N), (0, 0, 0, 0))
bg = Image.new('RGBA', (N, N), (0, 0, 0, 0))
ImageDraw.Draw(bg).rounded_rectangle(
    [0, 0, N - 1, N - 1], radius=int(N * 0.22), fill=col('#14151c')
)
img = Image.alpha_composite(img, bg)

# brand glow, clipped to the rounded square
glow = Image.new('RGBA', (N, N), (0, 0, 0, 0))
gd = ImageDraw.Draw(glow)
gd.ellipse([-N * 0.30, -N * 0.50, N * 0.90, N * 0.50], fill=col('#6d82ff', 120))
gd.ellipse([N * 0.20, N * 0.40, N * 1.30, N * 1.25], fill=col('#2ac0b2', 80))
glow = glow.filter(ImageFilter.GaussianBlur(N * 0.13))
clip = Image.new('L', (N, N), 0)
ImageDraw.Draw(clip).rounded_rectangle(
    [0, 0, N - 1, N - 1], radius=int(N * 0.22), fill=255
)
img.paste(Image.alpha_composite(img, glow), (0, 0), clip)

# ---- the mark: two overlapping panes + frost ticks ----------------------
layer = Image.new('RGBA', (N, N), (0, 0, 0, 0))
d = ImageDraw.Draw(layer)
K = 0.84                       # mark scale inside the 64-unit viewBox
CX, CY = 32.0, 34.0            # mark centre
w = int(2.0 * U * K)


def px(x):
    return ((x - CX) * K + CX) * U


def py(y):
    return ((y - CY) * K + CY) * U


def rect(x, y, wd, ht, r, alpha):
    d.rounded_rectangle(
        [px(x), py(y), px(x + wd), py(y + ht)],
        radius=r * K * U,
        outline=col('#8ea2ff', alpha),
        width=w,
    )


def line(x1, y1, x2, y2, alpha):
    d.line([px(x1), py(y1), px(x2), py(y2)], fill=col('#8ea2ff', alpha), width=w)


rect(8, 14, 26, 26, 7, 160)
rect(22, 20, 33, 32, 8, 255)
line(38, 31, 50, 31, 180)
line(38, 38, 47, 38, 120)
line(38, 45, 43, 45, 80)

halo = layer.filter(ImageFilter.GaussianBlur(N * 0.010))
img = Image.alpha_composite(img, halo)
img = Image.alpha_composite(img, layer)

out = img.resize((180, 180), Image.LANCZOS)
out.save('assets/icon-180.png')
print('wrote assets/icon-180.png', out.size)
