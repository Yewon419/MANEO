"""composite_stage3.py — stage3/head + stage3/leg/basic.png 를 합성해
sprite/nobg/stage3/{material}/{color}/{shape}.png 79장 생성.

동기:
- 디자인 의도는 BodyLayer(=head) + LegLayer(=leg) 별도 렌더링이지만 v0.1은 단일 img.
- 따라서 두 sprite를 미리 합성한 정적 PNG로 stage 3 표시.
- LegLayer 별도 애니메이션은 v0.2 (걷기/앉기 등)에서 다시 분리.

위치 정렬:
- head 콘텐츠 bbox: y 139~301 (상반부)
- leg  콘텐츠 bbox: y 310~383 (하반부 가운데)
- 두 영역 비-겹침 → 단순 alpha_composite로 OK.

robot:
- stage3/head/robot/default/default.png가 존재하면 robot/default/default.png 합성도 시도.
- 미존재 시 skip (PROJECT_STATUS §3.7 결정 #3 'robot v2 deferred').

idempotent — 재실행 가능. 출력 폴더 비우기 안 함 (기존 파일 덮어쓰기).
"""
from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent  # sprite/
HEAD_DIR = ROOT / "stage3" / "head"
LEG_PATH = ROOT / "stage3" / "leg" / "basic.png"
ROBOT_LEG_PATH = ROOT / "stage3" / "leg" / "robot" / "default.png"
OUT_DIR = ROOT / "nobg" / "stage3"


def composite_one(head_path: Path, leg_img: Image.Image) -> Image.Image:
    head = Image.open(head_path).convert("RGBA")
    if head.size != leg_img.size:
        # leg 캔버스 크기에 head 맞춤 (현재 데이터는 둘 다 512×512이라 통과)
        head = head.resize(leg_img.size, Image.NEAREST)
    return Image.alpha_composite(leg_img, head)


def main() -> None:
    if not LEG_PATH.exists():
        raise SystemExit(f"leg sprite missing: {LEG_PATH}")
    leg_basic = Image.open(LEG_PATH).convert("RGBA")
    robot_leg = (
        Image.open(ROBOT_LEG_PATH).convert("RGBA")
        if ROBOT_LEG_PATH.exists()
        else None
    )

    written = 0
    skipped_robot = 0

    for head_path in sorted(HEAD_DIR.rglob("*.png")):
        rel = head_path.relative_to(HEAD_DIR)  # {material}/{color}/{shape}.png
        material = rel.parts[0]

        # robot은 다리 sprite/dimensions가 다르므로 별도 처리
        leg_img: Image.Image
        if material == "robot":
            if robot_leg is None:
                skipped_robot += 1
                continue
            leg_img = robot_leg
            if leg_img.size != Image.open(head_path).size:
                # robot leg는 비표준 크기 (PROJECT_STATUS §9.1 stage3.leg_static.robot_default note)
                # head 캔버스에 맞춰 paste
                head = Image.open(head_path).convert("RGBA")
                canvas = Image.new("RGBA", head.size, (0, 0, 0, 0))
                # leg를 캔버스 하단 중앙에 paste
                lx = (canvas.size[0] - leg_img.size[0]) // 2
                ly = canvas.size[1] - leg_img.size[1]
                canvas.paste(leg_img, (lx, ly), leg_img)
                result = Image.alpha_composite(canvas, head)
            else:
                result = composite_one(head_path, leg_img)
        else:
            result = composite_one(head_path, leg_basic)

        out_path = OUT_DIR / rel
        out_path.parent.mkdir(parents=True, exist_ok=True)
        result.save(out_path, optimize=True)
        written += 1

    print(f"composite_stage3: wrote {written} files to {OUT_DIR}")
    if skipped_robot:
        print(f"  (skipped {skipped_robot} robot heads — no robot leg)")


if __name__ == "__main__":
    main()
