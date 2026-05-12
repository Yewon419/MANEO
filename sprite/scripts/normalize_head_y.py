"""normalize_head_y.py — stage3/head sprite의 "시각 머리 끝"을 단일 값으로 정렬.

배경:
- shape별 head y_max 평균이 301~313으로 12px 차이
- bbox y_max는 alpha=1~127 anti-alias 잔재까지 포함 → 시각 인지 끝과 어긋남
  (예: wood/gray/rectangle bbox y_max=308이지만 박스 본체 끝은 y=302, 짧은 검정 목은
   row당 148px이라 박스(218px) 대비 가늘어 시각에 안 띔)

해결 (하이브리드):
- 박스 형태 (rectangle, lantern): visual_y_max (가장 wide row의 70% 이상 opaque인 마지막 y)
  → 짧은 검정 목은 시각 끝에서 제외, 박스 끝이 308에 맞음
- 그 외 (bear, cat_ear, dog, notch, teardrop, default(robot)): bbox y_max
  → 발광체/둥근 형태는 외곽 fade-out이 시각 끝과 일치, 다리가 외곽 안쪽에 박히지 않음
- TARGET_Y_VISUAL = 308 통일 (leg basic.png y_min=310보다 2px 위)
- alpha mask 자체는 그대로 (보정 X)

idempotent 주의:
- 재실행 전 `git restore sprite/stage3/head/`로 원본 복원 권장
- normalize 알고리즘 변경 후 재실행 시 누적 shift 발생 가능
"""
from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
HEAD_DIR = ROOT / "stage3" / "head"

# leg basic.png y_min = 310. 2px 위에서 머리 시각상 끝나도록.
TARGET_Y_VISUAL = 308

# row의 opaque 픽셀 수가 이 비율(가장 wide row 대비) 이상인 마지막 y를 "시각 머리 끝"으로 본다.
VISUAL_THRESHOLD_RATIO = 0.7

# shape (sprite filename stem) → 알고리즘
# 박스 형태는 visual (짧은 검정 목 제외), 둥근 형태는 bbox (외곽 fade-out이 시각 끝)
SHAPE_ALGORITHM = {
    "rectangle": "visual",
    "lantern":   "visual",
    "bear":      "bbox",
    "cat_ear":   "bbox",
    "dog":       "bbox",
    "notch":     "bbox",
    "teardrop":  "bbox",
    "default":   "bbox",  # robot/default.png
}


def visual_y_max(im: Image.Image) -> int | None:
    """sprite의 시각 인지 머리 끝 y. 가장 wide한 row의 70% 이상 opaque인 마지막 y."""
    a = np.asarray(im.split()[-1])
    counts = (a > 128).sum(axis=1)
    if counts.max() == 0:
        return None
    threshold = counts.max() * VISUAL_THRESHOLD_RATIO
    ys = np.where(counts >= threshold)[0]
    return int(ys.max()) if len(ys) else None


def measure_y_max(im: Image.Image, shape: str) -> tuple[int | None, str]:
    algo = SHAPE_ALGORITHM.get(shape, "bbox")
    if algo == "visual":
        return (visual_y_max(im), algo)
    bb = im.getbbox()
    return (bb[3] if bb else None, algo)


def shift_head(p: Path) -> tuple[int, int, str]:
    im = Image.open(p).convert("RGBA")
    shape = p.stem  # filename without .png
    current, algo = measure_y_max(im, shape)
    if current is None:
        return (0, 0, algo)
    delta_y = TARGET_Y_VISUAL - current
    if delta_y == 0:
        return (current, 0, algo)

    canvas = Image.new("RGBA", im.size, (0, 0, 0, 0))
    canvas.paste(im, (0, delta_y), im)

    new_bbox = canvas.getbbox()
    if new_bbox is None:
        raise RuntimeError(f"empty after shift: {p}")
    if new_bbox[1] < 0 or new_bbox[3] > im.size[1]:
        raise RuntimeError(f"clipped after shift: {p} new_bbox={new_bbox}")

    canvas.save(p, optimize=True)
    return (current, delta_y, algo)


def main() -> None:
    files = sorted(HEAD_DIR.rglob("*.png"))
    shifted = 0
    for p in files:
        old, delta, algo = shift_head(p)
        if delta != 0:
            shifted += 1
            print(f"{p.relative_to(HEAD_DIR)}  [{algo}] {old} -> {TARGET_Y_VISUAL} (delta={delta:+d})")
    print(f"\n{shifted}/{len(files)} sprites shifted (target y={TARGET_Y_VISUAL})")


if __name__ == "__main__":
    main()
