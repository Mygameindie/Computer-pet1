# Cut the boy's whole-body picture (images/base.png) into the ragdoll part files
# in images/parts/. Run from the project folder after changing base.png:
#     pip install pillow numpy scipy
#     python scripts/cut_parts.py images/base.png images/parts
# The cut lines are fitted to his current drawing; a redrawn pose with arms,
# legs or head in other places needs the numbers below (and the joints in
# ragdoll_config.js) moved to match.
import sys
from PIL import Image, ImageDraw
import numpy as np
src, out = sys.argv[1], sys.argv[2]
im = np.array(Image.open(src).convert('RGBA'))
H, W = im.shape[:2]
a = im[..., 3] > 2
r, g, b = im[..., 0].astype(int), im[..., 1].astype(int), im[..., 2].astype(int)
dark = a & (r < 60) & (g < 60) & (b < 60)
K = dark & (im[..., 3] > 128)            # black: hair, wings, tail
yy, xx = np.mgrid[0:H, 0:W]
FILL = (254, 80, 19, 255)

tail = dark & (yy >= 850)
wings = dark & (yy >= 470) & (yy < 850) & ((xx < 372) | (xx > 480))
rest = a & ~tail & ~wings
NECK_Y = 606
head = rest & (yy < NECK_Y)
side = (yy >= 690) & (xx >= 360) & (xx <= 492)      # torso sides below the armpits (antialiased edge)
body = rest & (yy >= NECK_Y) & (yy < 868) & (((xx >= 370) & (xx <= 482)) | side)
from scipy import ndimage
def biggest(m):
    lab, n = ndimage.label(m)
    if n == 0: return m
    sizes = ndimage.sum(m, lab, range(1, n + 1))
    return lab == (1 + int(np.argmax(sizes)))
arm_L = biggest(rest & (yy >= NECK_Y) & (yy < 868) & (xx < 370) & ~side)
arm_R = biggest(rest & (yy >= NECK_Y) & (yy < 868) & (xx > 482) & ~side)
leg = rest & (yy >= 868)
leg_L = leg & (xx < 426)
leg_R = leg & (xx >= 426)

def save(mask, name, extra=None, under=None):
    o = np.zeros_like(im); o[mask] = im[mask]
    img = Image.fromarray(o)
    if under is not None:            # hidden fill drawn underneath the part
        base = Image.new('RGBA', (W, H)); d = ImageDraw.Draw(base); under(d)
        base.alpha_composite(img); img = base
    if extra is not None:
        d = ImageDraw.Draw(img); extra(d)
    img.save(f'{out}/{name}.png')

# Body: a neck stub under the head so a turned head never shows a gap.
def body_extra(d):
    # Round skin shoulders over each arm root: invisible at rest (inside the
    # arm), they keep a raised arm joined to the body instead of a white gap.
    for cx in (390, 462):
        d.ellipse([cx - 26, 634 - 26, cx + 26, 634 + 26], fill=FILL)
def body_under(d):
    d.rounded_rectangle([398, 586, 454, 616], 10, fill=FILL)      # neck stub under the head
def both(d):
    body_under(d); body_extra(d)
save(body, 'body', under=both)
save(head, 'head')
# Arms: the root carries on under the body, filled, so a raised arm stays joined.
save(arm_L, 'arm_L', under=lambda d: d.polygon([(360, 612), (408, 612), (408, 668), (360, 668)], fill=FILL))
save(arm_R, 'arm_R', under=lambda d: d.polygon([(492, 612), (444, 612), (444, 668), (492, 668)], fill=FILL))
# Legs: the tops carry on up under the hips.
save(leg_L, 'leg_L', under=lambda d: (d.rectangle([380, 828, 408, 864], fill=FILL), d.ellipse([376, 848, 412, 884], fill=FILL)))
save(leg_R, 'leg_R', under=lambda d: (d.rectangle([444, 828, 472, 864], fill=FILL), d.ellipse([440, 848, 476, 884], fill=FILL)))
# Tail: carries on into the body toward the pelvis (hidden behind it).
save(tail, 'back_tail', extra=lambda d: d.line([(366, 864), (400, 852)], fill=(0, 0, 0, 255), width=7))

# Wings: the part behind each arm is hidden in the picture; fill it in black
# (inside the wing's outline hull) so a moving arm doesn't uncover a hole.
from PIL import ImageDraw as D
wimg = np.zeros_like(im); wimg[wings] = im[wings]
for side in (xx < 426, xx >= 426):
    m = wings & side & K
    ys, xs = np.nonzero(m)
    pts = np.stack([xs, ys], 1)
    # convex hull (monotone chain)
    P = sorted(set(map(tuple, pts)))
    def cross(o, a_, b_): return (a_[0]-o[0])*(b_[1]-o[1]) - (a_[1]-o[1])*(b_[0]-o[0])
    lo = []; up = []
    for p in P:
        while len(lo) >= 2 and cross(lo[-2], lo[-1], p) <= 0: lo.pop()
        lo.append(p)
    for p in reversed(P):
        while len(up) >= 2 and cross(up[-2], up[-1], p) <= 0: up.pop()
        up.append(p)
    hull = lo[:-1] + up[:-1]
    hm = Image.new('L', (W, H)); D.Draw(hm).polygon(hull, fill=255)
    hm = np.array(hm) > 0
    near = ndimage.binary_dilation(m, iterations=22)
    fillm = hm & near & (arm_L | arm_R)
    wimg[fillm] = (0, 0, 0, 255)
Image.fromarray(wimg).save(f'{out}/back_wings.png')
print('ok')
