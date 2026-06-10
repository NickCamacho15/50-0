#!/usr/bin/env python3
"""
50-0 — "BUILD THE UNDEFEATED" social ad generator (v3)
===================================================
Self-contained: renders every frame procedurally with Pillow + NumPy,
synthesizes the full soundtrack with NumPy, and muxes with FFmpeg.

v3: same flow, script and soundtrack as v2 — visuals restyled to the
current product UI (layered slate surfaces, ambient gold glow, rounded
cards, pill chips, gradient-gold buttons).

Output: 1080x1920 (9:16) · 30 fps · ~18.5 s · H.264 + AAC

Usage:  python3 make_ad.py [output.mp4]
Needs:  ffmpeg on PATH, Pillow, numpy
"""

import math
import os
import random
import shutil
import struct
import subprocess
import sys
import tempfile
import wave

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

# ----------------------------------------------------------------- config --
W, H = 1080, 1920
FPS = 30
DUR = 18.5
N_FRAMES = int(DUR * FPS)
SR = 44100

# palette (matches the site design system)
BG = (13, 16, 23)            # --bg
BG_TOP = (19, 24, 38)        # --bg-top
GOLD = (231, 180, 60)        # --gold
GOLD_HI = (244, 201, 94)     # --gold-bright
GOLD_LO = (194, 146, 42)
GOLD_SOFT = (242, 212, 138)  # --gold-soft
GOLD_INK = (34, 25, 3)       # --gold-ink
RED = (238, 85, 102)         # --red
WHITE = (238, 241, 247)      # --text
MUTED = (163, 174, 196)      # --text-2
MUTED_2 = (113, 125, 151)    # --text-3
GREEN = (69, 212, 131)       # --green
PANEL = (28, 36, 51)         # --surface-2
PANEL_DEEP = (16, 20, 29)    # reel wells
LINE = (58, 66, 86)          # --line on surface
LINE_STRONG = (82, 93, 120)  # --line-strong

# scene boundaries (seconds)
S1, S2, S3, S4, S5, S6 = (0.0, 2.6), (2.6, 6.4), (6.4, 10.2), (10.2, 13.3), (13.3, 16.6), (16.6, 18.5)

# moments that hit (camera shake + audio boom)
IMPACTS = [0.04, 0.88, 1.72, 5.55, 6.75, 7.85, 8.95, 13.34, 16.64]

URL_TEXT = "50-0.app"

# ------------------------------------------------------------------ fonts --
def find_font(names):
    dirs = [
        "/System/Library/Fonts/Supplemental", "/System/Library/Fonts",
        "/Library/Fonts", os.path.expanduser("~/Library/Fonts"),
        "/usr/share/fonts/truetype", "/usr/share/fonts",
    ]
    for n in names:
        for d in dirs:
            p = os.path.join(d, n)
            if os.path.exists(p):
                return p
    return None

DISPLAY_FONT = find_font(["Impact.ttf", "Arial Black.ttf", "HelveticaNeue.ttc"])
BODY_FONT = find_font(["Arial Bold.ttf", "Arial.ttf", "Helvetica.ttc"])
if not DISPLAY_FONT or not BODY_FONT:
    sys.exit("No usable system fonts found (need Impact/Arial Black + Arial Bold).")

_font_cache = {}
def font(path, size):
    key = (path, size)
    if key not in _font_cache:
        _font_cache[key] = ImageFont.truetype(path, size)
    return _font_cache[key]

# ----------------------------------------------------------------- easing --
def clamp01(x): return max(0.0, min(1.0, x))
def ease_out(p): p = clamp01(p); return 1 - (1 - p) ** 3
def ease_in(p): p = clamp01(p); return p ** 3
def ease_out_back(p):
    p = clamp01(p); c1, c3 = 1.70158, 2.70158
    return 1 + c3 * (p - 1) ** 3 + c1 * (p - 1) ** 2

# ------------------------------------------------------------- text cache --
_text_cache = {}

def text_img(text, size, color, fpath=None, tracking=0, glow=0, glow_color=None, gradient=None):
    """Render text to a cached RGBA image. gradient=(top_rgb, bottom_rgb) overrides color."""
    fpath = fpath or DISPLAY_FONT
    key = (text, size, color, fpath, tracking, glow, glow_color, gradient)
    if key in _text_cache:
        return _text_cache[key]
    f = font(fpath, size)
    # measure with tracking
    widths, heights = [], []
    for ch in text:
        bb = f.getbbox(ch)
        widths.append(f.getlength(ch))
        heights.append(bb[3])
    tw = int(sum(widths) + tracking * max(0, len(text) - 1))
    th = int(max(heights) if heights else size) + int(size * 0.25)
    pad = max(8, glow * 3)
    img = Image.new("RGBA", (tw + pad * 2, th + pad * 2), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    x = pad
    for ch, wch in zip(text, widths):
        d.text((x, pad), ch, font=f, fill=(color if color else WHITE) + (255,))
        x += wch + tracking
    if gradient:
        # repaint glyph alpha with a vertical gradient
        alpha = np.array(img.split()[3], dtype=np.float32) / 255.0
        top, bot = np.array(gradient[0], np.float32), np.array(gradient[1], np.float32)
        ramp = np.linspace(0, 1, img.height, dtype=np.float32)[:, None]
        grad = top[None, None, :] * (1 - ramp[..., None]) + bot[None, None, :] * ramp[..., None]
        rgba = np.zeros((img.height, img.width, 4), np.uint8)
        rgba[..., :3] = grad.astype(np.uint8)
        rgba[..., 3] = (alpha * 255).astype(np.uint8)
        img = Image.fromarray(rgba)
    if glow:
        gc = glow_color or (color if color else GOLD)
        halo = Image.new("RGBA", img.size, (0, 0, 0, 0))
        halo.paste(Image.new("RGBA", img.size, gc + (255,)), mask=img.split()[3])
        halo = halo.filter(ImageFilter.GaussianBlur(glow))
        out = Image.new("RGBA", img.size, (0, 0, 0, 0))
        out.alpha_composite(halo)
        out.alpha_composite(halo)  # double for intensity
        out.alpha_composite(img)
        img = out
    _text_cache[key] = img
    return img

def paste_center(canvas, img, cx, cy, scale=1.0, alpha=1.0):
    if scale <= 0 or alpha <= 0:
        return
    if scale != 1.0:
        nw, nh = max(1, int(img.width * scale)), max(1, int(img.height * scale))
        img = img.resize((nw, nh), Image.LANCZOS)
    if alpha < 1.0:
        img = img.copy()
        a = img.split()[3].point(lambda v: int(v * alpha))
        img.putalpha(a)
    canvas.alpha_composite(img, (int(cx - img.width / 2), int(cy - img.height / 2)))

# -------------------------------------------------------------- background --
def build_background():
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    # vertical slate fade, like the site canvas
    ramp = np.clip(yy / (H * 0.55), 0, 1)[..., None] ** 1.1
    top, bot = np.array(BG_TOP, np.float32), np.array(BG, np.float32)
    arr = top[None, None] * (1 - ramp) + bot[None, None] * ramp
    # ambient gold glow at top center (mirrors the app's radial accent)
    d = np.sqrt((xx - W / 2) ** 2 + (yy + 160) ** 2)
    glow = np.clip(1 - d / 1500.0, 0, 1) ** 2
    arr += np.array(GOLD, np.float32)[None, None] * glow[..., None] * 0.10
    # vignette
    vd = np.sqrt(((xx - W / 2) / (W / 2)) ** 2 + ((yy - H / 2) / (H / 2)) ** 2)
    vig = 1.0 - 0.30 * np.clip(vd - 0.55, 0, 1) ** 1.6
    arr *= vig[..., None]
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8)).convert("RGBA")

# ------------------------------------------------------------ ui primitives --
_pill_cache = {}
def gold_button(w, h, radius=30):
    """Rounded rect filled with the site's vertical gold gradient."""
    key = (w, h, radius)
    if key in _pill_cache:
        return _pill_cache[key]
    mask = Image.new("L", (w, h), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, w - 1, h - 1], radius=radius, fill=255)
    hi, lo = np.array(GOLD_HI, np.float32), np.array(GOLD, np.float32)
    ramp = np.linspace(0, 1, h, dtype=np.float32)[:, None, None]
    grad = (hi[None, None] * (1 - ramp) + lo[None, None] * ramp).astype(np.uint8)
    img = Image.fromarray(np.repeat(grad, w, axis=1)).convert("RGBA")
    img.putalpha(mask)
    _pill_cache[key] = img
    return img

_chip_cache = {}
def chip_img(text, size=42):
    """Gold pill chip with leading dot — matches the app's combo tag."""
    if text in _chip_cache:
        return _chip_cache[text]
    label = text_img(text, size, GOLD, tracking=10)
    pad_x, pad_y, dot = 38, 22, 12
    w = label.width + pad_x * 2 + dot + 16
    h = label.height + pad_y * 2
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([0, 0, w - 1, h - 1], radius=h // 2,
                        fill=(57, 50, 28, 235), outline=(136, 110, 47, 255), width=3)
    d.ellipse([pad_x, h // 2 - dot // 2, pad_x + dot, h // 2 + dot // 2], fill=GOLD + (255,))
    img.alpha_composite(label, (pad_x + dot + 16, pad_y))
    _chip_cache[text] = img
    return img

# ------------------------------------------------------------------ shake --
def shake_offset(t, frame):
    dx = dy = 0.0
    rng = random.Random(frame * 7919)
    for imp in IMPACTS:
        dt = t - imp
        if 0 <= dt < 0.35:
            amp = 16 * (1 - dt / 0.35) ** 2
            dx += rng.uniform(-amp, amp)
            dy += rng.uniform(-amp, amp)
    return int(dx), int(dy)

# ------------------------------------------------------------ scene assets --
DIVISIONS = ["HEAVYWEIGHT", "WELTERWEIGHT", "MIDDLEWEIGHT", "FLYWEIGHT",
             "LIGHTWEIGHT", "FEATHERWEIGHT", "BANTAMWEIGHT", "LIGHT HEAVY"]
ERAS = ["1993-2000", "2001-2007", "2010-2015", "2016-2021", "2022-2026", "2007-2013"]
REEL_TARGET = ("LIGHTWEIGHT", "2016-2021")

CARDS = [
    ("WRESTLING", 99, "FROM KHABIB NURMAGOMEDOV"),
    ("KO POWER", 96, "FROM CONOR McGREGOR"),
    ("CARDIO", 98, "FROM MAX HOLLOWAY"),
]

def build_fight_rows():
    rng = random.Random(50)
    first = ["VASQUEZ", "OKAFOR", "PETROV", "TANAKA", "CRANE", "MADDOX", "REYES",
             "STONE", "DRAGO", "HALE", "BISHOP", "KANE", "MOREAU", "SOKOLOV",
             "FERREIRA", "WATTS", "BRIGGS", "ORTIZ", "NAKAMURA", "CALLOWAY"]
    rows = []
    for i in range(50):
        meth = rng.choice(["KO", "KO", "TKO", "SUB (RNC)", "SUB (GUILLOTINE)", "DEC", "KO", "SUB (ARMBAR)"])
        rnd = 5 if meth == "DEC" else rng.choice([1, 1, 2, 2, 3])
        tm = "5:00" if meth == "DEC" else f"{rng.randint(0,4)}:{rng.randint(0,59):02d}"
        rows.append((i + 1, rng.choice(first), meth, rnd, tm))
    return rows

FIGHT_ROWS = build_fight_rows()

_row_cache = {}
def fight_row_img(i):
    if i in _row_cache:
        return _row_cache[i]
    n, name, meth, rnd, tm = FIGHT_ROWS[i]
    img = Image.new("RGBA", (880, 78), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([0, 0, 879, 77], radius=20, fill=PANEL + (235,),
                        outline=LINE + (255,), width=2)
    d.text((28, 20), f"{n:02d}", font=font(DISPLAY_FONT, 36), fill=MUTED_2 + (255,))
    d.text((110, 24), f"vs. {name}", font=font(BODY_FONT, 28), fill=WHITE + (255,))
    res = f"W · {meth} · R{rnd} {tm}"
    f2 = font(DISPLAY_FONT, 32)
    d.text((872 - f2.getlength(res), 22), res, font=f2, fill=GREEN + (255,))
    _row_cache[i] = img
    return img

def build_confetti():
    rng = random.Random(7)
    cols = [GOLD_HI, GOLD, RED, WHITE, GREEN]
    return [{
        "x": rng.uniform(0, W), "y": rng.uniform(-H, 0),
        "vy": rng.uniform(260, 540), "vx": rng.uniform(-60, 60),
        "w": rng.uniform(8, 18), "h": rng.uniform(12, 26),
        "rot": rng.uniform(0, math.pi), "vr": rng.uniform(-4, 4),
        "c": cols[rng.randrange(len(cols))],
    } for _ in range(220)]

CONFETTI = build_confetti()

# ------------------------------------------------------------------ scenes --
def reel_box(d, cx, cy, w, h, label, landed, flash):
    box = [cx - w // 2, cy - h // 2, cx + w // 2, cy + h // 2]
    d.rounded_rectangle(box, radius=28,
                        fill=((45, 42, 30, 255) if landed else PANEL_DEEP + (255,)),
                        outline=(GOLD + (255,)) if landed else LINE + (255,),
                        width=4 if landed else 2)
    return box

def draw_scene1(c, t):
    lines = [("ONE FIGHTER.", 0.0, WHITE, 0), ("SEVEN TRAITS.", 0.84, WHITE, 0), ("ZERO LOSSES?", 1.68, RED, 18)]
    for i, (txt, t0, col, glow) in enumerate(lines):
        if t < t0:
            continue
        p = ease_out((t - t0) / 0.30)
        scale = 2.6 - 1.6 * p
        a = clamp01((t - t0) / 0.12)
        img = text_img(txt, 150, col, tracking=4, glow=glow, glow_color=RED)
        paste_center(c, img, W / 2, 640 + i * 290, scale=scale, alpha=a)

def draw_scene2(c, t):
    hdr = text_img("SPIN THE WHEEL", 86, WHITE, tracking=10)
    paste_center(c, hdr, W / 2, 360, alpha=ease_out(t / 0.3))
    d = ImageDraw.Draw(c)

    spin_t0, land_t = 0.3, 2.95          # local times
    landed = t >= land_t
    if t < spin_t0:
        div, era = "READY", "READY"
    elif not landed:
        p = clamp01((t - spin_t0) / (land_t - spin_t0))
        swaps = int(30 * (1 - (1 - p) ** 2.4))
        rngd = random.Random(swaps * 13)
        div = DIVISIONS[rngd.randrange(len(DIVISIONS))]
        era = ERAS[rngd.randrange(len(ERAS))]
    else:
        div, era = REEL_TARGET

    flash = landed and (t - land_t) < 0.25
    cap_a = ease_out(t / 0.3)
    for cy, txt, cap in ((760, div, "DIVISION"), (1010, era, "ERA")):
        paste_center(c, text_img(cap, 26, MUTED_2, tracking=12), W / 2, cy - 138, alpha=cap_a)
        reel_box(d, W // 2, cy, 760, 200, txt, landed, flash)
        col = GOLD_SOFT if landed else WHITE
        img = text_img(txt, 96, col, tracking=4, glow=14 if flash else 0, glow_color=GOLD)
        paste_center(c, img, W / 2, cy, alpha=1.0)
    if landed:
        a = ease_out((t - land_t) / 0.3)
        paste_center(c, chip_img("THE KHABIB ERA"), W / 2, 1216, alpha=a)
    # pulsing SPIN button
    pulse = 1 + 0.04 * math.sin(t * 7)
    bw, bh = int(440 * pulse), int(150 * pulse)
    bx, by = W // 2, 1520
    c.alpha_composite(gold_button(bw, bh, radius=34), (bx - bw // 2, by - bh // 2))
    sp = text_img("SPIN", 92, GOLD_INK, tracking=10)
    paste_center(c, sp, bx, by - 4, scale=pulse)

def draw_scene3(c, t):
    hdr = text_img("STEAL ONE TRAIT PER SPIN", 72, WHITE, tracking=8)
    paste_center(c, hdr, W / 2, 360, alpha=ease_out(t / 0.3))
    d = ImageDraw.Draw(c)
    for i, (trait, val, src) in enumerate(CARDS):
        t0 = 0.2 + i * 1.1
        if t < t0:
            continue
        p = ease_out_back((t - t0) / 0.45)
        x = W / 2 + (1 - p) * 900
        cy = 720 + i * 330
        card = Image.new("RGBA", (920, 270), (0, 0, 0, 0))
        cd = ImageDraw.Draw(card)
        cd.rounded_rectangle([0, 0, 919, 269], radius=28, fill=PANEL + (242,),
                             outline=LINE_STRONG + (255,), width=3)
        cd.text((48, 46), trait, font=font(DISPLAY_FONT, 74), fill=WHITE + (255,))
        cd.text((50, 160), src, font=font(BODY_FONT, 30), fill=MUTED + (255,))
        # count-up rating
        shown = int(val * ease_out((t - t0) / 0.7))
        col = GREEN if shown >= 88 else GOLD
        nf = font(DISPLAY_FONT, 130)
        ns = str(shown)
        cd.text((872 - nf.getlength(ns), 60), ns, font=nf, fill=col + (255,))
        paste_center(c, card, x, cy)

def draw_scene4(c, t):
    # accelerating intervals for 50 rows
    times, acc = [], 0.25
    for i in range(50):
        acc += 0.095 - (0.095 - 0.022) * (i / 49)
        times.append(acc)
    shown = sum(1 for x in times if t >= x)
    hdr = text_img("THEN... 50 FIGHTS.", 84, WHITE, tracking=8)
    paste_center(c, hdr, W / 2, 300, alpha=ease_out(t / 0.25))
    if shown:
        cnt = text_img(f"FIGHT {min(shown,50)}", 120, GOLD_HI, glow=16, glow_color=GOLD)
        paste_center(c, cnt, W / 2, 500)
    # stack of latest rows, newest at bottom
    visible = 11
    base_y = 1700
    for k in range(min(shown, visible)):
        idx = shown - 1 - k
        img = fight_row_img(idx)
        a = 1.0 if k < visible - 2 else (visible - k) / 3
        pop = ease_out((t - times[idx]) / 0.12) if k == 0 else 1.0
        paste_center(c, img, W / 2, base_y - k * 92, scale=0.96 + 0.04 * pop, alpha=a)

def draw_scene5(c, t):
    # white flash in
    if t < 0.12:
        ImageDraw.Draw(c).rectangle([0, 0, W, H], fill=(255, 255, 255, int(255 * (1 - t / 0.12))))
    # confetti
    d = ImageDraw.Draw(c)
    for p in CONFETTI:
        x = (p["x"] + p["vx"] * t) % (W + 40) - 20
        y = (p["y"] + p["vy"] * (t + 0.4)) % (H + 60) - 30
        rot = p["rot"] + p["vr"] * t
        wd, ht = p["w"], p["h"]
        cosr, sinr = math.cos(rot), math.sin(rot)
        pts = [(x + cosr * dx - sinr * dy, y + sinr * dx + cosr * dy)
               for dx, dy in ((-wd/2, -ht/2), (wd/2, -ht/2), (wd/2, ht/2), (-wd/2, ht/2))]
        d.polygon(pts, fill=p["c"] + (210,))
    # the record
    p = ease_out(t / 0.5)
    pulse = 1 + 0.025 * math.sin(t * 6)
    rec = text_img("50-0", 430, None, glow=34, glow_color=GOLD, gradient=(GOLD_HI, GOLD_LO))
    paste_center(c, rec, W / 2, 850, scale=(1.7 - 0.7 * p) * pulse, alpha=clamp01(t / 0.15))
    if t > 0.7:
        a = ease_out((t - 0.7) / 0.3)
        v1 = text_img("UNDEFEATED.", 110, WHITE, tracking=8)
        v2 = text_img("IMMORTAL.", 110, RED, tracking=8, glow=14, glow_color=RED)
        paste_center(c, v1, W / 2, 1240, alpha=a)
        paste_center(c, v2, W / 2, 1390, alpha=a)

def draw_scene6(c, t):
    a = ease_out(t / 0.3)
    logo = text_img("50-0", 260, None, glow=24, glow_color=GOLD, gradient=(GOLD_HI, GOLD_LO))
    paste_center(c, logo, W / 2, 620, alpha=a)
    sub = text_img("BUILD THE UNDEFEATED", 64, WHITE, tracking=18)
    paste_center(c, sub, W / 2, 830, alpha=a)
    line = text_img("SPIN · STEAL · RUN THE TABLE", 38, MUTED, fpath=BODY_FONT, tracking=6)
    paste_center(c, line, W / 2, 930, alpha=a)
    # button
    pulse = 1 + 0.05 * math.sin(t * 8)
    bw, bh = int(560 * pulse), int(160 * pulse)
    paste_center(c, gold_button(bw, bh, radius=36), W / 2, 1180, alpha=a)
    btn = text_img("PLAY FREE", 84, GOLD_INK, tracking=8)
    paste_center(c, btn, W / 2, 1176, scale=pulse, alpha=a)
    url = text_img(URL_TEXT, 92, WHITE, glow=10, glow_color=(113, 125, 151))
    paste_center(c, url, W / 2, 1430, alpha=a)

SCENES = [(S1, draw_scene1), (S2, draw_scene2), (S3, draw_scene3),
          (S4, draw_scene4), (S5, draw_scene5), (S6, draw_scene6)]

# ------------------------------------------------------------------ audio --
def synth_audio():
    n = int(DUR * SR)
    mix = np.zeros(n, np.float32)
    tt = np.arange(n) / SR

    def add(t0, sig, gain=1.0):
        i = int(t0 * SR)
        if i >= n: return
        seg = sig[: n - i]
        mix[i:i + len(seg)] += seg.astype(np.float32) * gain

    def env_exp(dur, k=18.0):
        t = np.arange(int(dur * SR)) / SR
        return np.exp(-k * t)

    def kick(dur=0.28):
        t = np.arange(int(dur * SR)) / SR
        f = 140 * np.exp(-22 * t) + 42
        return np.sin(2 * np.pi * np.cumsum(f) / SR) * env_exp(dur, 16)

    def boom(dur=0.7):
        t = np.arange(int(dur * SR)) / SR
        f = 120 * np.exp(-9 * t) + 34
        body = np.sin(2 * np.pi * np.cumsum(f) / SR)
        rumble = np.convolve(np.random.default_rng(3).standard_normal(len(t)),
                             np.ones(220) / 220, "same")
        return (body * 0.9 + rumble * 0.5) * env_exp(dur, 6)

    def tick():
        dur = 0.025
        t = np.arange(int(dur * SR)) / SR
        return np.sign(np.sin(2 * np.pi * 2100 * t)) * env_exp(dur, 160)

    def hat(gain=1.0):
        dur = 0.05
        rng = np.random.default_rng(11)
        return rng.standard_normal(int(dur * SR)) * env_exp(dur, 90) * gain

    def bell():
        dur = 1.6
        t = np.arange(int(dur * SR)) / SR
        s = sum(np.sin(2 * np.pi * f * t) * a for f, a in
                ((660, 1.0), (880, 0.8), (1320, 0.6), (1980, 0.25)))
        return s * np.exp(-2.2 * t) * 0.35

    def riser(dur=1.0):
        t = np.arange(int(dur * SR)) / SR
        p = t / dur
        noise = np.random.default_rng(5).standard_normal(len(t))
        sweep = np.sin(2 * np.pi * np.cumsum(200 + 1400 * p ** 2) / SR)
        return (noise * 0.35 + sweep * 0.4) * (p ** 2.2)

    # --- arrangement ---
    for imp in IMPACTS:
        add(imp, boom(), 0.9)

    # groove from the spin onward
    bpm, beat = 132, 60 / 132
    t0 = S2[0]
    b = t0
    while b < S5[0] + 1.2:
        add(b, kick(), 0.75)
        add(b + beat / 2, hat(), 0.30)
        b += beat
    # sub-bass eighth pulse
    sub_t = np.arange(int((S5[0] - t0 + 1.2) * SR)) / SR
    gate = (np.sin(2 * np.pi * sub_t / (beat / 2)) > 0).astype(np.float32)
    add(t0, np.sin(2 * np.pi * 55 * sub_t) * gate, 0.22)

    # slot-machine ticks (decelerating)
    p_acc, k = 0.0, 0
    while True:
        frac = k / 46
        if frac >= 1: break
        p_acc += 0.035 + 0.10 * frac ** 2.2
        if S2[0] + 0.3 + p_acc > S2[0] + 2.95: break
        add(S2[0] + 0.3 + p_acc, tick(), 0.5)
        k += 1

    # card count-up shimmer (fast ticks after each card lands)
    for i in range(3):
        base = S3[0] + 0.2 + i * 1.1
        for j in range(8):
            add(base + 0.08 * j, tick(), 0.22)

    # fight-feed hats accelerating
    acc = 0.25
    for i in range(50):
        acc += 0.095 - (0.095 - 0.022) * (i / 49)
        add(S4[0] + acc, hat(), 0.45)

    add(S5[0] - 1.0, riser(1.0), 0.8)
    add(S5[0] + 0.05, bell(), 1.0)
    add(S5[0] + 0.75, boom(0.9), 0.6)
    add(S6[0] + 0.05, kick(), 0.7)
    add(S6[0] + 0.5, bell(), 0.5)

    # master: soft clip, fades
    out = np.tanh(mix * 1.25) * 0.88
    fade_in = int(0.05 * SR)
    out[:fade_in] *= np.linspace(0, 1, fade_in)
    fade_out = int(0.45 * SR)
    out[-fade_out:] *= np.linspace(1, 0, fade_out)
    return out

def write_wav(path, sig):
    pcm = (np.clip(sig, -1, 1) * 32767).astype("<i2")
    stereo = np.column_stack([pcm, pcm]).ravel().tobytes()
    with wave.open(path, "wb") as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(SR)
        wf.writeframes(stereo)

# ------------------------------------------------------------------- main --
def main():
    out_path = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__) or ".", "50-0-ad-v3.mp4")
    ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg:
        sys.exit("ffmpeg not found on PATH — install it (brew install ffmpeg) and retry.")

    print("» synthesizing soundtrack…")
    wav_path = os.path.join(tempfile.gettempdir(), "fifty_oh_ad_audio.wav")
    write_wav(wav_path, synth_audio())

    print("» pre-rendering background…")
    bg = build_background()

    cmd = [
        ffmpeg, "-y",
        "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
        "-i", wav_path,
        "-c:v", "libx264", "-preset", "medium", "-crf", "21", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "192k",
        "-shortest", "-movflags", "+faststart",
        out_path,
    ]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE,
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    print(f"» rendering {N_FRAMES} frames @ {FPS}fps…")
    grain_rng = np.random.default_rng(42)
    for fr in range(N_FRAMES):
        t = fr / FPS
        content = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        for (a, b), fn in SCENES:
            if a <= t < b:
                fn(content, t - a)
                break
        frame = bg.copy()
        frame.alpha_composite(content, shake_offset(t, fr))

        # end fade to black
        if t > DUR - 0.35:
            k = (t - (DUR - 0.35)) / 0.35
            ImageDraw.Draw(frame).rectangle([0, 0, W, H], fill=(0, 0, 0, int(255 * k)))

        arr = np.asarray(frame.convert("RGB"), dtype=np.int16)
        grain = grain_rng.integers(-2, 3, size=(H, W, 1), dtype=np.int16)
        arr = np.clip(arr + grain, 0, 255).astype(np.uint8)
        proc.stdin.write(arr.tobytes())
        if fr % 60 == 0:
            print(f"   frame {fr}/{N_FRAMES}  ({t:.1f}s)")

    proc.stdin.close()
    proc.wait()
    if proc.returncode != 0:
        sys.exit("ffmpeg failed.")
    size_mb = os.path.getsize(out_path) / 1e6
    print(f"✓ done → {out_path}  ({size_mb:.1f} MB, {DUR}s, {W}x{H}@{FPS}fps)")

if __name__ == "__main__":
    main()
