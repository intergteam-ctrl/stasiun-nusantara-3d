import sys
from PIL import Image, ImageDraw, ImageFilter
S = 1024
def rr(d, box, r, fill, outline=None, width=0): d.rounded_rectangle(box, r, fill=fill, outline=outline, width=width)
img = Image.new('RGBA', (S, S), (0, 0, 0, 0))
# background: rounded square with sky gradient
bg = Image.new('RGBA', (S, S))
for y in range(S):
    t = y / S
    c = tuple(int(a + (b - a) * t) for a, b in zip((108, 196, 255), (255, 236, 200)))
    ImageDraw.Draw(bg).line([(0, y), (S, y)], fill=c + (255,))
mask = Image.new('L', (S, S), 0); ImageDraw.Draw(mask).rounded_rectangle((0, 0, S - 1, S - 1), 220, fill=255)
img.paste(bg, (0, 0), mask)
d = ImageDraw.Draw(img)
# hills
d.ellipse((-200, 720, 620, 1200), fill=(134, 207, 115)); d.ellipse((420, 760, 1260, 1240), fill=(147, 214, 110))
# rails
d.rectangle((0, 900, S, 930), fill=(169, 124, 85))
NAVY = (29, 63, 115)
# train front (cartoon)
rr(d, (232, 250, 792, 880), 150, (255, 255, 255), NAVY, 22)
rr(d, (300, 320, 724, 560), 70, (90, 169, 240), NAVY, 18)        # windshield
d.rounded_rectangle((330, 345, 470, 400), 25, fill=(233, 247, 255))  # glint
rr(d, (250, 610, 774, 690), 30, (255, 138, 42))                  # orange stripe
rr(d, (250, 700, 774, 735), 16, (47, 184, 214))                  # teal stripe
for cx in (360, 664):
    d.ellipse((cx - 52, 760 - 52, cx + 52, 760 + 52), fill=(255, 246, 194), outline=NAVY, width=14)
rr(d, (440, 770, 584, 840), 30, (255, 111, 94), NAVY, 12)          # bumper
rr(d, (420, 200, 604, 262), 30, (255, 211, 107), NAVY, 14)         # top lamp/sign
for size, name in [(48, 'mdpi'), (72, 'hdpi'), (96, 'xhdpi'), (144, 'xxhdpi'), (192, 'xxxhdpi')]:
    import os; os.makedirs(f'{sys.argv[1]}/mipmap-{name}', exist_ok=True)
    img.resize((size, size), Image.LANCZOS).save(f'{sys.argv[1]}/mipmap-{name}/ic_launcher.png')
img.resize((512, 512), Image.LANCZOS).save(f'{sys.argv[2]}')
