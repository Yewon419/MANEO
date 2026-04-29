from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

NOBG_ROOT = Path(__file__).parent.parent / "nobg" / "stage3"
HEAD_ROOT = Path(__file__).parent.parent / "stage3" / "head"
LEG_ROOT = Path(__file__).parent.parent / "stage3" / "leg"

BLACK_MATERIALS = ["wood", "doll", "metal", "pearl"]

LEG_VALUE_MAX = 55
LEG_SAT_MAX = 0.20
LEG_HALO_DILATE = 3
MIN_LEG_PIXELS = 80
BOTTOM_ZONE_FRAC = 0.30


def detect_leg_mask(arr: np.ndarray) -> np.ndarray:
    r = arr[..., 0].astype(np.int16)
    g = arr[..., 1].astype(np.int16)
    b = arr[..., 2].astype(np.int16)
    a = arr[..., 3]

    opaque = a > 0
    mx = np.maximum(np.maximum(r, g), b)
    mn = np.minimum(np.minimum(r, g), b)
    sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1), 0.0)

    dark = opaque & (mx < LEG_VALUE_MAX) & (sat < LEG_SAT_MAX)
    lbl, n = ndimage.label(dark)
    if n == 0:
        return np.zeros_like(dark, dtype=bool)

    opq_rows, _ = np.where(opaque)
    if opq_rows.size == 0:
        return np.zeros_like(dark, dtype=bool)
    char_top, char_bottom = int(opq_rows.min()), int(opq_rows.max())
    zone_start = char_bottom - int((char_bottom - char_top) * BOTTOM_ZONE_FRAC)

    sizes = ndimage.sum(dark, lbl, index=np.arange(1, n + 1))
    valid_ids = [i + 1 for i in range(n) if sizes[i] >= MIN_LEG_PIXELS]
    if not valid_ids:
        return np.zeros_like(dark, dtype=bool)

    centroids = ndimage.center_of_mass(dark, lbl, valid_ids)
    bottom_ids = [vid for vid, cen in zip(valid_ids, centroids) if cen[0] >= zone_start]
    if not bottom_ids:
        best_i = int(np.argmax([c[0] for c in centroids]))
        bottom_ids = [valid_ids[best_i]]

    core = np.isin(lbl, bottom_ids)

    rows, cols = np.where(core)
    top_y = int(rows.min())
    bot_y = min(opaque.shape[0], int(rows.max()) + 2)
    left_x = max(0, int(cols.min()) - 1)
    right_x = min(opaque.shape[1], int(cols.max()) + 2)

    bbox_mask = np.zeros_like(opaque, dtype=bool)
    bbox_mask[top_y:bot_y, left_x:right_x] = True

    return opaque & bbox_mask


def apply_mask(arr: np.ndarray, mask: np.ndarray) -> np.ndarray:
    out = arr.copy()
    out[..., 3] = np.where(mask, arr[..., 3], np.uint8(0))
    return out


def process(src: Path, head_out: Path, leg_out: Path) -> tuple[int, int]:
    img = Image.open(src).convert("RGBA")
    arr = np.array(img)
    leg_mask = detect_leg_mask(arr)
    head_mask = (arr[..., 3] > 0) & ~leg_mask

    head_out.parent.mkdir(parents=True, exist_ok=True)
    leg_out.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(apply_mask(arr, head_mask)).save(head_out)
    Image.fromarray(apply_mask(arr, leg_mask)).save(leg_out)

    return int(head_mask.sum()), int(leg_mask.sum())


def main() -> None:
    count = 0
    for material in BLACK_MATERIALS:
        mdir = NOBG_ROOT / material
        if not mdir.exists():
            continue
        for png in sorted(mdir.rglob("*.png")):
            rel = png.relative_to(NOBG_ROOT)
            h, l = process(png, HEAD_ROOT / rel, LEG_ROOT / rel)
            count += 1
            flag = "  [!]" if l < MIN_LEG_PIXELS else ""
            print(f"{str(rel):<45} head={h:>6}  leg={l:>5}{flag}")

    print(f"\n총 {count}장 처리 (wood/doll/metal/pearl)")
    print("light / robot: 별도 처리 필요")


if __name__ == "__main__":
    main()
