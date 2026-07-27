"""Build Lumi's checked-in PixiJS atlases from transparent 3x2 source sheets."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from PIL import Image, ImageDraw


FRAME_SIZE = 256
GRID_COLUMNS = 3
GRID_ROWS = 2

ANIMATIONS: dict[str, dict[str, object]] = {
    "idle": {
        "frame_rate": 8,
        "loop": True,
        "sequence": [0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 2, 3, 4, 5, 0, 0, 0, 0, 0, 0],
    },
    "thinking": {
        "frame_rate": 6,
        "loop": True,
        "sequence": [0, 1, 2, 3, 4, 5],
    },
    "typing": {
        "frame_rate": 12,
        "loop": True,
        "sequence": [0, 1, 2, 3, 4, 5],
    },
    "tooling": {
        "frame_rate": 8,
        "loop": True,
        "sequence": [0, 1, 2, 3, 4, 5],
    },
    "celebrate": {
        "frame_rate": 8,
        "loop": False,
        "sequence": [0, 1, 2, 3, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
    },
    "error": {
        "frame_rate": 8,
        "loop": True,
        "sequence": [0, 1, 2, 3, 4, 5],
    },
}

SOURCE_NAMES = {
    "celebrate": "success",
    "error": "error",
    "idle": "idle",
    "thinking": "thinking",
    "tooling": "tooling",
    "typing": "coding",
}

BITMAP_GLYPHS: dict[str, tuple[str, ...]] = {
    "!": ("1", "1", "1", "1", "0", "1"),
    "A": ("01110", "10001", "10001", "11111", "10001", "10001"),
    "E": ("11111", "10000", "10000", "11110", "10000", "11111"),
    "H": ("10001", "10001", "10001", "11111", "10001", "10001"),
    "O": ("01110", "10001", "10001", "10001", "10001", "01110"),
    "R": ("11110", "10001", "10001", "11110", "10100", "10010"),
    "Y": ("10001", "01010", "00100", "00100", "00100", "00100"),
    "a": ("00000", "01110", "00001", "01111", "10001", "01111"),
    "e": ("00000", "01110", "10001", "11111", "10000", "01110"),
    "h": ("10000", "10000", "11110", "10001", "10001", "10001"),
    "y": ("10001", "10001", "01111", "00001", "11110", "00000"),
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--source-dir",
        type=Path,
        default=Path("pets/lumi/source"),
        help="Directory containing *-transparent.png source sheets.",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path("pets/public/lumi"),
        help="Destination directory for the runtime pet package.",
    )
    return parser.parse_args()


def load_source(source_dir: Path, action: str) -> Image.Image:
    source_name = SOURCE_NAMES[action]
    source_path = source_dir / f"{source_name}-transparent.png"
    image = Image.open(source_path).convert("RGBA")

    if image.width % GRID_COLUMNS != 0 or image.height % GRID_ROWS != 0:
        raise ValueError(f"{source_path} dimensions must be divisible by 3x2.")

    return image


def build_atlas(source: Image.Image) -> Image.Image:
    cell_width = source.width // GRID_COLUMNS
    cell_height = source.height // GRID_ROWS
    atlas = Image.new(
        "RGBA",
        (FRAME_SIZE * GRID_COLUMNS, FRAME_SIZE * GRID_ROWS),
        (0, 0, 0, 0),
    )

    for frame_index in range(GRID_COLUMNS * GRID_ROWS):
        column = frame_index % GRID_COLUMNS
        row = frame_index // GRID_COLUMNS
        cell = source.crop(
            (
                column * cell_width,
                row * cell_height,
                (column + 1) * cell_width,
                (row + 1) * cell_height,
            )
        )
        cell.thumbnail((FRAME_SIZE, FRAME_SIZE), Image.Resampling.LANCZOS)
        destination = (
            column * FRAME_SIZE + (FRAME_SIZE - cell.width) // 2,
            row * FRAME_SIZE + (FRAME_SIZE - cell.height) // 2,
        )
        atlas.alpha_composite(cell, destination)

    return atlas


def draw_bitmap_text(
    image: Image.Image,
    text: str,
    origin: tuple[int, int],
    scale: int,
    fill: tuple[int, int, int, int],
) -> None:
    draw = ImageDraw.Draw(image)
    cursor_x, cursor_y = origin

    for character in text:
        glyph = BITMAP_GLYPHS[character]
        glyph_width = len(glyph[0])

        for row, pixels in enumerate(glyph):
            for column, pixel in enumerate(pixels):
                if pixel != "1":
                    continue

                left = cursor_x + column * scale
                top = cursor_y + row * scale
                draw.rectangle(
                    (left, top, left + scale - 1, top + scale - 1),
                    fill=fill,
                )

        cursor_x += (glyph_width + 1) * scale


def add_deterministic_text(atlas: Image.Image, action: str) -> None:
    if action == "celebrate":
        for offset_x, offset_y in ((-1, 0), (1, 0), (0, -1), (0, 1)):
            draw_bitmap_text(
                atlas,
                "yeah!",
                (FRAME_SIZE * 2 + 76 + offset_x, FRAME_SIZE + 22 + offset_y),
                4,
                (38, 43, 60, 255),
            )

        draw_bitmap_text(
            atlas,
            "yeah!",
            (FRAME_SIZE * 2 + 76, FRAME_SIZE + 22),
            4,
            (126, 225, 207, 255),
        )

    if action == "error":
        label_origins = (
            (82, 173),
            (99, 173),
            (105, 173),
            (96, 124),
            (75, 124),
            (88, 124),
        )

        for frame_index, label_origin in enumerate(label_origins):
            column = frame_index % GRID_COLUMNS
            row = frame_index // GRID_COLUMNS
            draw_bitmap_text(
                atlas,
                "ERROR",
                (
                    column * FRAME_SIZE + label_origin[0],
                    row * FRAME_SIZE + label_origin[1],
                ),
                2,
                (245, 238, 225, 255),
            )


def create_atlas_document(action: str, atlas_name: str) -> dict[str, object]:
    frames: dict[str, object] = {}

    for frame_index in range(GRID_COLUMNS * GRID_ROWS):
        column = frame_index % GRID_COLUMNS
        row = frame_index // GRID_COLUMNS
        frame_name = f"{action}-{frame_index}"
        frames[frame_name] = {
            "frame": {
                "h": FRAME_SIZE,
                "w": FRAME_SIZE,
                "x": column * FRAME_SIZE,
                "y": row * FRAME_SIZE,
            },
            "rotated": False,
            "sourceSize": {"h": FRAME_SIZE, "w": FRAME_SIZE},
            "spriteSourceSize": {
                "h": FRAME_SIZE,
                "w": FRAME_SIZE,
                "x": 0,
                "y": 0,
            },
            "trimmed": False,
        }

    sequence = ANIMATIONS[action]["sequence"]

    return {
        "animations": {
            action: [f"{action}-{frame_index}" for frame_index in sequence]
        },
        "frames": frames,
        "meta": {
            "app": "Asteria Lumi asset builder",
            "format": "RGBA8888",
            "image": atlas_name,
            "scale": "1",
            "size": {
                "h": FRAME_SIZE * GRID_ROWS,
                "w": FRAME_SIZE * GRID_COLUMNS,
            },
            "version": "1.0",
        },
    }


def create_manifest() -> dict[str, object]:
    animations = {
        action: {
            "frameRate": settings["frame_rate"],
            "loop": settings["loop"],
            "source": f"animations/{action}.json",
        }
        for action, settings in ANIMATIONS.items()
    }

    return {
        "animations": animations,
        "id": "lumi",
        "name": "Lumi",
        "protocolVersion": "1.1",
        "renderer": "pixijs",
        "states": {
            "coding": "typing",
            "error": "error",
            "happy": "celebrate",
            "idle": "idle",
            "thinking": "thinking",
            "tooling": "tooling",
        },
        "version": "1.0.0",
    }


def write_json(path: Path, document: dict[str, object]) -> None:
    path.write_text(
        json.dumps(document, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def main() -> None:
    args = parse_args()
    animation_dir = args.output_dir / "animations"
    animation_dir.mkdir(parents=True, exist_ok=True)

    for action in ANIMATIONS:
        atlas_name = f"{action}.png"
        atlas = build_atlas(load_source(args.source_dir, action))
        add_deterministic_text(atlas, action)
        atlas.save(animation_dir / atlas_name, optimize=True)
        write_json(
            animation_dir / f"{action}.json",
            create_atlas_document(action, atlas_name),
        )

    write_json(args.output_dir / "pet.json", create_manifest())


if __name__ == "__main__":
    main()
