from __future__ import annotations

from pathlib import Path
import numpy as np
from PIL import Image

# ── 경로 설정 ──────────────────────────────────────────────
SAMPLE_DIR = Path(__file__).parent.parent / "_archive" / "sample"
BODY_DIR   = Path(__file__).parent.parent / "stage3" / "body"
REF_DIR    = Path(__file__).parent.parent / "reference"

# ── 파일 → (재질, 색상변형) 매핑 ───────────────────────────
GRID_FILES: dict[str, tuple[str, str]] = {
    "IMG_3595.PNG": ("wood",   "brown_light"),
    "IMG_3596.PNG": ("wood",   "gray"),
    "IMG_3597.PNG": ("wood",   "brown_medium"),
    "IMG_3603.PNG": ("doll",   "brown"),
    "IMG_3604.PNG": ("doll",   "pink"),
    "IMG_3605.PNG": ("doll",   "beige"),
    "IMG_3606.PNG": ("doll",   "navy"),
    "IMG_9783.PNG": ("metal",  "platinum"),
    "IMG_9784.PNG": ("metal",  "gold_warm"),
    "IMG_3608.PNG": ("metal",  "gold"),
    "IMG_9785.PNG": ("light",  "white"),
    "IMG_9786.PNG": ("light",  "blue_neon"),
    "IMG_9787.PNG": ("light",  "cream"),
    "IMG_9788.PNG": ("pearl",  "pink"),
    "IMG_9789.PNG": ("pearl",  "white"),
}

SINGLE_FILES: dict[str, tuple[str, str]] = {
    "IMG_3592.PNG": ("robot", "default.png"),
}

REFERENCE_FILES: dict[str, str] = {
    "IMG_3591.PNG": "sketch_materials.png",
    "IMG_3593.PNG": "silhouette_shapes.png",
}

SHAPE_NAMES: list[str | None] = [
    "cat_ear",   None,        "lantern",
    "dog",       None,        "notch",
    "rectangle", "teardrop",  "bear",
]

# 특정 재질에서만 허용되는 형태 (다른 재질에선 스킵)
SHAPE_MATERIAL_ONLY: dict[str, set[str]] = {
    "lantern": {"light"},
}

# 특정 재질에서 허용되는 형태 목록 (명시된 재질은 목록 외 형태 스킵)
MATERIAL_SHAPE_ONLY: dict[str, set[str]] = {
    "doll":  {"cat_ear", "dog", "bear"},
    "pearl": {"cat_ear", "dog", "notch", "teardrop", "bear"},
}

GRID        = 3
CROP_PAD    = 0
CANVAS_SIZE = 512   # 중앙 정렬용 고정 캔버스 (px, 정사각형)


def _content_projection(img: Image.Image) -> tuple[np.ndarray, np.ndarray]:
    """흰 배경 편차 기준으로 행/열별 콘텐츠 양 반환."""
    arr = np.array(img.convert("RGB")).astype(np.float32)
    dev = (255.0 - arr).sum(axis=2)          # 흰색과의 편차 (클수록 콘텐츠)
    col_proj = dev.sum(axis=0)               # 열별 합산
    row_proj = dev.sum(axis=1)              # 행별 합산
    return col_proj, row_proj


def _find_gutter_splits(proj: np.ndarray, n: int) -> list[int]:
    """n-1개의 가터(최솟값) 위치를 찾아 n+1개 경계 인덱스 반환."""
    total = len(proj)
    # 노이즈 제거용 스무딩
    k = max(total // (n * 15), 3)
    smoothed = np.convolve(proj, np.ones(k) / k, mode="same")

    splits = [0]
    for i in range(1, n):
        center = i * total // n
        half_w = total // (n * 2)          # 탐색 윈도우 = 1/6 구간
        lo = max(0, center - half_w)
        hi = min(total, center + half_w)
        local_min = int(np.argmin(smoothed[lo:hi])) + lo
        splits.append(local_min)
    splits.append(total)
    return splits


def split_grid(img: Image.Image) -> list[Image.Image]:
    """흰 배경 편차 투영으로 실제 가터를 감지해 3×3 분할."""
    col_proj, row_proj = _content_projection(img)
    col_splits = _find_gutter_splits(col_proj, GRID)
    row_splits = _find_gutter_splits(row_proj, GRID)

    cells: list[Image.Image] = []
    for r in range(GRID):
        for c in range(GRID):
            cell = img.crop((
                col_splits[c], row_splits[r],
                col_splits[c + 1], row_splits[r + 1],
            ))
            cells.append(cell)
    return cells


def autocrop(img: Image.Image) -> Image.Image:
    """흰 배경 기준으로 콘텐츠 영역만 크롭.
    좌/우/하단 2px는 보더 아티팩트 무시, 상단은 글로우 보존을 위해 제외 없음."""
    arr = np.array(img.convert("RGB")).astype(np.float32)
    dev = (255.0 - arr).sum(axis=2)
    h, w = arr.shape[:2]
    B = 2
    inner = dev.copy()
    inner[-B:, :] = 0   # 하단
    inner[:,  :B] = 0   # 좌
    inner[:, -B:] = 0   # 우  (이미지 우측 보더 제거)
    mask = inner > 40
    rows = np.any(mask, axis=1)
    cols = np.any(mask, axis=0)
    if not rows.any():
        return img
    rmin = int(np.where(rows)[0][0])
    rmax = int(np.where(rows)[0][-1])
    cmin = int(np.where(cols)[0][0])
    cmax = int(np.where(cols)[0][-1])
    return img.crop((cmin, rmin, cmax + 1, rmax + 1))


def remove_small_blobs(img: Image.Image) -> Image.Image:
    """연결된 작은 픽셀 클러스터 제거 (stray 픽셀, 텍스트 레이블 등).
    제거 시 흰색이 아닌 주변 픽셀 평균색으로 인페인팅."""
    from scipy import ndimage
    arr = np.array(img.convert("RGB")).astype(np.float32)
    dev = (255.0 - arr).sum(axis=2)
    mask = (dev > 40).astype(np.uint8)
    labeled, num = ndimage.label(mask)
    if num == 0:
        return img
    sizes = ndimage.sum(mask, labeled, range(1, num + 1))
    max_size = float(max(sizes))

    # 제거 대상 블롭 마스크 합산
    remove_mask = np.zeros(arr.shape[:2], dtype=bool)
    for i, size in enumerate(sizes):
        if size < max_size * 0.1 and size < 3000:
            remove_mask[labeled == i + 1] = True

    if not remove_mask.any():
        return img

    result = arr.copy()
    # 인페인팅: 제거 영역을 주변 21px 평균색으로 채움
    keep = ~remove_mask
    for c in range(3):
        ch = arr[:, :, c] * keep.astype(np.float32)
        s = ndimage.uniform_filter(ch,          size=21) * (21 * 21)
        n = ndimage.uniform_filter(keep.astype(np.float32), size=21) * (21 * 21)
        fill = np.where(n > 0, s / n, 255.0)
        result[:, :, c][remove_mask] = fill[remove_mask]

    return Image.fromarray(result.astype(np.uint8))


def to_canvas(img: Image.Image) -> Image.Image:
    """스프라이트를 CANVAS_SIZE 정사각형 흰 캔버스 중앙에 배치."""
    if img.width > CANVAS_SIZE or img.height > CANVAS_SIZE:
        img.thumbnail((CANVAS_SIZE, CANVAS_SIZE), Image.NEAREST)
    canvas = Image.new("RGBA", (CANVAS_SIZE, CANVAS_SIZE), (255, 255, 255, 255))
    x = (CANVAS_SIZE - img.width)  // 2
    y = (CANVAS_SIZE - img.height) // 2
    canvas.paste(img.convert("RGBA"), (x, y))
    return canvas


def process_grid(src: Path, material: str, variant: str) -> None:
    img   = Image.open(src)
    cells = split_grid(img)
    out   = BODY_DIR / material / variant
    out.mkdir(parents=True, exist_ok=True)
    for cell, shape in zip(cells, SHAPE_NAMES):
        if shape is None:
            continue
        if shape in SHAPE_MATERIAL_ONLY and material not in SHAPE_MATERIAL_ONLY[shape]:
            continue
        if material in MATERIAL_SHAPE_ONLY and shape not in MATERIAL_SHAPE_ONLY[material]:
            continue
        cropped  = autocrop(cell)
        cleaned  = remove_small_blobs(cropped)
        canvas   = to_canvas(cleaned)
        out_path = out / f"{shape}.png"
        canvas.save(out_path, "PNG")
        print(f"  {material}/{variant}/{shape}.png  {cropped.size} → {canvas.size}")


def process_single(src: Path, material: str, filename: str) -> None:
    out = BODY_DIR / material
    out.mkdir(parents=True, exist_ok=True)
    img     = Image.open(src)
    cropped = autocrop(img)
    cleaned = remove_small_blobs(cropped)
    canvas  = to_canvas(cleaned)
    canvas.save(out / filename, "PNG")
    print(f"  {material}/{filename}  {cropped.size} → {canvas.size}")


def copy_reference(src: Path, name: str) -> None:
    REF_DIR.mkdir(parents=True, exist_ok=True)
    dst = REF_DIR / name
    dst.write_bytes(src.read_bytes())
    print(f"  reference/{name}")


def main() -> None:
    print("=== 레퍼런스 복사 ===")
    for filename, new_name in REFERENCE_FILES.items():
        copy_reference(SAMPLE_DIR / filename, new_name)

    print("\n=== 단일 스프라이트 ===")
    for filename, (material, new_name) in SINGLE_FILES.items():
        process_single(SAMPLE_DIR / filename, material, new_name)

    print("\n=== 그리드 분리 ===")
    for filename, (material, variant) in GRID_FILES.items():
        src = SAMPLE_DIR / filename
        if not src.exists():
            print(f"  WARNING: {filename} 없음, 스킵")
            continue
        print(f"\n{filename} → {material}/{variant}/")
        process_grid(src, material, variant)

    print("\n완료.")


if __name__ == "__main__":
    main()
