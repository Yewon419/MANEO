from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image

NOBG_ROOT = Path(__file__).parent.parent / "nobg" / "stage3"
HEAD_ROOT = Path(__file__).parent.parent / "stage3" / "head"
LEG_ROOT = Path(__file__).parent.parent / "stage3" / "leg"

LIGHT_DIR = NOBG_ROOT / "light"

NECK_ZONE_TOP_FRAC = 0.40
NECK_ZONE_BOTTOM_FRAC = 0.78


def find_neck_y(opaque: np.ndarray) -> int:
    rows = np.where(opaque.any(axis=1))[0]
    if rows.size == 0:
        return 0
    top, bottom = int(rows.min()), int(rows.max())
    height = bottom - top
    zone_lo = top + int(height * NECK_ZONE_TOP_FRAC)
    zone_hi = top + int(height * NECK_ZONE_BOTTOM_FRAC)

    widths = opaque.sum(axis=1).astype(np.int32)
    search = widths[zone_lo : zone_hi + 1].copy()
    search[search == 0] = 10**6
    neck_local = int(np.argmin(search))
    return zone_lo + neck_local


def apply_mask(arr: np.ndarray, mask: np.ndarray) -> np.ndarray:
    out = arr.copy()
    out[..., 3] = np.where(mask, arr[..., 3], np.uint8(0))
    return out


def process(src: Path, head_out: Path, leg_out: Path) -> tuple[int, int, int]:
    img = Image.open(src).convert("RGBA")
    arr = np.array(img)
    opaque = arr[..., 3] > 0

    neck_y = find_neck_y(opaque)
    h = arr.shape[0]
    head_mask = np.zeros_like(opaque, dtype=bool)
    leg_mask = np.zeros_like(opaque, dtype=bool)
    head_mask[: neck_y + 1, :] = opaque[: neck_y + 1, :]
    leg_mask[neck_y + 1 :, :] = opaque[neck_y + 1 :, :]

    head_out.parent.mkdir(parents=True, exist_ok=True)
    leg_out.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(apply_mask(arr, head_mask)).save(head_out)
    Image.fromarray(apply_mask(arr, leg_mask)).save(leg_out)

    return int(head_mask.sum()), int(leg_mask.sum()), neck_y


def main() -> None:
    count = 0
    for png in sorted(LIGHT_DIR.rglob("*.png")):
        rel = png.relative_to(NOBG_ROOT)
        h, l, ny = process(png, HEAD_ROOT / rel, LEG_ROOT / rel)
        count += 1
        flag = "  [!]" if l < 100 or h < 1000 else ""
        print(f"{str(rel):<45} neck_y={ny:>3}  head={h:>6}  leg={l:>5}{flag}")

    print(f"\n총 {count}장 처리 (light)")


if __name__ == "__main__":
    main()
