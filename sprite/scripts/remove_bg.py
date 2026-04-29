from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

SPRITE_ROOT = Path(__file__).parent.parent / "stage3" / "body"
OUT_ROOT = Path(__file__).parent.parent / "nobg" / "stage3"

MATERIALS = ["wood", "doll", "metal", "light", "pearl", "robot"]

SEED_TOLERANCE = 40
CORNER_AGREE_TOLERANCE = 25
STEP_TOLERANCE = 25
MAX_ITERS = 80
EDGE_DILATE_ITERS = 1


def detect_bg_color(arr: np.ndarray) -> np.ndarray:
    corners = np.stack([arr[0, 0, :3], arr[0, -1, :3], arr[-1, 0, :3], arr[-1, -1, :3]]).astype(np.int16)
    mean = corners.mean(axis=0)
    if np.max(np.abs(corners - mean)) < CORNER_AGREE_TOLERANCE:
        return mean.astype(np.int16)
    return corners[0]


def seed_bg_mask(arr: np.ndarray, bg: np.ndarray) -> np.ndarray:
    h, w = arr.shape[:2]
    r = arr[..., 0].astype(np.int16)
    g = arr[..., 1].astype(np.int16)
    b = arr[..., 2].astype(np.int16)
    color_diff = np.abs(r - bg[0]) + np.abs(g - bg[1]) + np.abs(b - bg[2])
    bg_candidate = color_diff < SEED_TOLERANCE

    lbl, n = ndimage.label(bg_candidate)
    bg_labels: set[int] = set()
    for cy, cx in [(0, 0), (0, w - 1), (h - 1, 0), (h - 1, w - 1)]:
        label_id = int(lbl[cy, cx])
        if label_id > 0:
            bg_labels.add(label_id)
    return np.isin(lbl, list(bg_labels)) if bg_labels else np.zeros_like(bg_candidate)


def gradient_flood(rgb: np.ndarray, seed: np.ndarray, step_tol: int, max_iters: int) -> np.ndarray:
    """Iteratively grow seed; include a neighbor if its color is within step_tol of an already-in-mask neighbor."""
    mask = seed.copy()
    for _ in range(max_iters):
        grew = False
        for dy, dx in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            shifted_mask = np.roll(mask, shift=(dy, dx), axis=(0, 1))
            shifted_rgb = np.roll(rgb, shift=(dy, dx), axis=(0, 1))
            diff = np.abs(rgb - shifted_rgb).sum(axis=-1)
            candidate = shifted_mask & (diff < step_tol) & ~mask
            if candidate.any():
                mask |= candidate
                grew = True
        if not grew:
            break
    return mask


def remove_background(arr: np.ndarray) -> np.ndarray:
    bg = detect_bg_color(arr)
    seed = seed_bg_mask(arr, bg)
    rgb = arr[..., :3].astype(np.int16)
    bg_mask = gradient_flood(rgb, seed, STEP_TOLERANCE, MAX_ITERS)

    if EDGE_DILATE_ITERS > 0:
        bg_mask = ndimage.binary_dilation(bg_mask, iterations=EDGE_DILATE_ITERS)

    out = arr.copy()
    out[..., 3] = np.where(bg_mask, np.uint8(0), np.uint8(255))
    return out


def process(src: Path, dst: Path) -> tuple[int, int]:
    img = Image.open(src).convert("RGBA")
    arr = np.array(img)
    result = remove_background(arr)

    dst.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(result).save(dst)

    opaque = int((result[..., 3] == 255).sum())
    transparent = int((result[..., 3] == 0).sum())
    return opaque, transparent


def main() -> None:
    count = 0
    for material in MATERIALS:
        mdir = SPRITE_ROOT / material
        if not mdir.exists():
            continue
        for png in sorted(mdir.rglob("*.png")):
            rel = png.relative_to(SPRITE_ROOT)
            dst = OUT_ROOT / rel
            opaque, transparent = process(png, dst)
            count += 1
            char_pct = opaque / (opaque + transparent) * 100
            flag = "  [!]" if char_pct < 3 or char_pct > 60 else ""
            print(f"{str(rel):<45} opaque={opaque:>6} ({char_pct:5.2f}%){flag}")

    print(f"\n총 {count}장 처리")
    print(f"출력 → {OUT_ROOT}")


if __name__ == "__main__":
    main()
