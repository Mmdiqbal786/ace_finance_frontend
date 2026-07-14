from PIL import Image

src = r"c:\Users\IqbalAhamedM_lj49su7\ace\project\ace_finance\ace_finance_frontend\public\Ace_logo.png"
out = r"c:\Users\IqbalAhamedM_lj49su7\ace\project\ace_finance\ace_finance_frontend\public\Ace_logo_light.png"

img = Image.open(src).convert("RGBA")
pixels = img.load()
w, h = img.size

for y in range(h):
    for x in range(w):
        r, g, b, a = pixels[x, y]
        # Near-black background -> transparent
        if r < 35 and g < 35 and b < 35:
            pixels[x, y] = (0, 0, 0, 0)
            continue
        # Near-white text -> dark slate for light headers
        if r > 220 and g > 220 and b > 220:
            pixels[x, y] = (15, 23, 42, a)

img.save(out, "PNG")
print("Wrote", out, img.size)

# Also make small logo transparent for icon uses
src2 = r"c:\Users\IqbalAhamedM_lj49su7\ace\project\ace_finance\ace_finance_frontend\public\Ace_logo_small.png"
out2 = r"c:\Users\IqbalAhamedM_lj49su7\ace\project\ace_finance\ace_finance_frontend\public\Ace_logo_small_light.png"
img2 = Image.open(src2).convert("RGBA")
pix2 = img2.load()
w2, h2 = img2.size
for y in range(h2):
    for x in range(w2):
        r, g, b, a = pix2[x, y]
        if r < 35 and g < 35 and b < 35:
            pix2[x, y] = (0, 0, 0, 0)
img2.save(out2, "PNG")
print("Wrote", out2, img2.size)
