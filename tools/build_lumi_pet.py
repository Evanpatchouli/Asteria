"""Build and validate Lumi's checked-in PixiJS atlases."""

from __future__ import annotations

import argparse
import json
import math
from collections import deque
from dataclasses import dataclass
from pathlib import Path
from typing import Final

from PIL import Image, ImageChops, ImageDraw


FRAME_SIZE: Final = 256
GRID_COLUMNS: Final = 3
GRID_ROWS: Final = 2
SAFE_PADDING: Final = 3
ALPHA_THRESHOLD: Final = 16
ROOT_BAND_HEIGHT: Final = 32
ROOT_ALPHA_THRESHOLD: Final = 192
IDLE_TAIL_POLYGON: Final = (
    (190, 101),
    (225, 101),
    (231, 132),
    (220, 158),
    (188, 158),
    (193, 139),
)
IDLE_TAIL_PIVOT: Final = (191, 146)
IDLE_TAIL_ANGLES: Final = (-28, 0, 28)
IDLE_TAIL_CONNECTOR_BOUNDS: Final = (178, 116, 216, 166)
SUCCESS_TRANSITION_COUNT: Final = 7
SUCCESS_TRANSITION_SCALE: Final = 0.72

# Runtime frame rates express key-pose timing. The Renderer interpolates those
# poses at 60 Hz; slower key-pose rates leave enough refresh samples per blend.
ANIMATIONS: dict[str, dict[str, object]] = {
    "idle": {
        "frame_rate": 20,
        "loop": True,
        # Rest for 2.15 seconds, then make three fast +/-28 degree tail swings.
        "sequence": [1] * 43 + [0, 2, 0, 2, 0, 2, 1],
        "minimum_distinct_frames": 3,
        "maximum_adjacent_repeat_ratio": 0.90,
    },
    "thinking": {
        "frame_rate": 10,
        "loop": True,
        "sequence": [0, 1, 2, 1, 0, 3, 4, 5, 4, 3],
        "minimum_distinct_frames": 6,
        "maximum_adjacent_repeat_ratio": 0.05,
    },
    "typing": {
        "frame_rate": 12,
        "loop": True,
        "sequence": [0, 1, 2, 3, 4, 5, 4, 3, 2, 1],
        "minimum_distinct_frames": 6,
        "maximum_adjacent_repeat_ratio": 0.05,
    },
    "tooling": {
        "frame_rate": 10,
        "loop": True,
        "sequence": [0, 1, 2, 3, 4, 5, 4, 3, 2, 1],
        "minimum_distinct_frames": 6,
        "maximum_adjacent_repeat_ratio": 0.05,
    },
    "celebrate": {
        "frame_rate": 10,
        "loop": False,
        # 8 run-up + 8 airborne + 4 landing + 4 "yeah!" = 24 slots.
        "sequence": list(range(24)),
        "minimum_distinct_frames": 24,
        "maximum_adjacent_repeat_ratio": 0.05,
    },
    "error": {
        "frame_rate": 10,
        "loop": True,
        "sequence": [0, 1, 2, 3, 4, 5, 4, 3, 2, 1],
        "minimum_distinct_frames": 6,
        "maximum_adjacent_repeat_ratio": 0.05,
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

# Desired root displacement relative to the fixed stage root. Static actions use
# zero displacement. Celebrate removes the source-sheet row jump and restores a
# deliberate jump arc in atlas-anchor space.
CELEBRATE_ROOT_OFFSETS_Y: Final = (
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    -12,
    -30,
    -48,
    -60,
    -58,
    -45,
    -28,
    -12,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
)

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


@dataclass(frozen=True)
class PreparedFrame:
    image: Image.Image
    anchor_x: float
    anchor_y: float


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


def extract_source_frames(source: Image.Image) -> list[Image.Image]:
    cell_width = source.width // GRID_COLUMNS
    cell_height = source.height // GRID_ROWS
    frames: list[Image.Image] = []

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
        frames.append(
            cell.resize(
                (FRAME_SIZE, FRAME_SIZE),
                Image.Resampling.LANCZOS,
            )
        )

    return frames


def alpha_bounds(image: Image.Image) -> tuple[int, int, int, int]:
    alpha = image.getchannel("A").point(
        lambda value: 255 if value >= ALPHA_THRESHOLD else 0
    )
    bounds = alpha.getbbox()

    if bounds is None:
        raise ValueError("Lumi source frame must contain visible pixels.")

    return bounds


def semantic_root(image: Image.Image) -> tuple[float, float]:
    """Return the support-center of the largest high-opacity subject."""
    component = largest_alpha_component(image)
    central_left = FRAME_SIZE * 0.3
    central_right = FRAME_SIZE * 0.7
    central_component = [
        index
        for index in component
        if central_left <= index % FRAME_SIZE <= central_right
    ]
    bottom = max(index // FRAME_SIZE for index in central_component) + 1
    support_pixels = [
        index
        for index in central_component
        if index // FRAME_SIZE >= bottom - ROOT_BAND_HEIGHT
    ]
    support_x = [index % FRAME_SIZE for index in support_pixels]
    return ((min(support_x) + max(support_x) + 1) / 2, float(bottom - 1))


def largest_alpha_component(image: Image.Image) -> list[int]:
    alpha = image.getchannel("A")
    visible = bytearray(
        value >= ROOT_ALPHA_THRESHOLD for value in alpha.get_flattened_data()
    )
    visited = bytearray(FRAME_SIZE * FRAME_SIZE)
    largest: list[int] = []

    for start, is_visible in enumerate(visible):
        if not is_visible or visited[start]:
            continue

        component: list[int] = []
        queue = deque([start])
        visited[start] = 1

        while queue:
            index = queue.popleft()
            component.append(index)
            x = index % FRAME_SIZE
            y = index // FRAME_SIZE

            for neighbor_x, neighbor_y in (
                (x - 1, y),
                (x + 1, y),
                (x, y - 1),
                (x, y + 1),
            ):
                if not (
                    0 <= neighbor_x < FRAME_SIZE
                    and 0 <= neighbor_y < FRAME_SIZE
                ):
                    continue

                neighbor = neighbor_y * FRAME_SIZE + neighbor_x
                if visible[neighbor] and not visited[neighbor]:
                    visited[neighbor] = 1
                    queue.append(neighbor)

        if len(component) > len(largest):
            largest = component

    if not largest:
        raise ValueError("Lumi frame has no high-opacity subject component.")

    return largest


def prepare_frame(
    image: Image.Image,
    action: str,
    frame_index: int,
    root_offset_y: int = 0,
) -> PreparedFrame:
    # Only the lowest support band determines horizontal anchoring. This keeps
    # question marks, yarn, tails, tools and the bell from dragging Lumi sideways.
    translated = Image.new("RGBA", image.size, (0, 0, 0, 0))
    bounds = alpha_bounds(image)
    delta_x = padding_translation(bounds[0], bounds[2])
    delta_y = padding_translation(bounds[1], bounds[3])
    translated.alpha_composite(image, (delta_x, delta_y))
    root_x, root_y = semantic_root(translated)

    return PreparedFrame(
        image=translated,
        anchor_x=root_x / FRAME_SIZE,
        anchor_y=(root_y - root_offset_y) / FRAME_SIZE,
    )


def padding_translation(start: int, end: int) -> int:
    if start < SAFE_PADDING:
        return SAFE_PADDING - start

    maximum_end = FRAME_SIZE - SAFE_PADDING
    if end > maximum_end:
        return maximum_end - end

    return 0


def build_frames(
    source: Image.Image,
    action: str,
    source_dir: Path,
) -> list[PreparedFrame]:
    if action == "idle":
        return build_idle_frames(source)

    if action == "celebrate":
        return build_celebrate_frames(source, source_dir)

    frames = [
        prepare_frame(image, action, frame_index)
        for frame_index, image in enumerate(extract_source_frames(source))
    ]

    if action == "error":
        frames = [
            PreparedFrame(
                image=add_error_text(frame.image.copy(), frame_index),
                anchor_x=frame.anchor_x,
                anchor_y=frame.anchor_y,
            )
            for frame_index, frame in enumerate(frames)
        ]

    return frames


def build_idle_frames(source: Image.Image) -> list[PreparedFrame]:
    base = extract_source_frames(source)[4]
    tail_mask = Image.new("L", base.size, 0)
    ImageDraw.Draw(tail_mask).polygon(IDLE_TAIL_POLYGON, fill=255)
    tail = Image.new("RGBA", base.size, (0, 0, 0, 0))
    tail.paste(base, (0, 0), ImageChops.multiply(base.getchannel("A"), tail_mask))
    body = base.copy()
    body.paste((0, 0, 0, 0), (0, 0, FRAME_SIZE, FRAME_SIZE), tail_mask)
    connector_mask = Image.new("L", base.size, 0)
    ImageDraw.Draw(connector_mask).ellipse(IDLE_TAIL_CONNECTOR_BOUNDS, fill=255)
    body.paste(base, (0, 0), connector_mask)
    frames: list[PreparedFrame] = []

    for frame_index, angle in enumerate(IDLE_TAIL_ANGLES):
        rotated_tail = tail.rotate(
            angle,
            center=IDLE_TAIL_PIVOT,
            resample=Image.Resampling.BICUBIC,
        )
        composed = Image.new("RGBA", base.size, (0, 0, 0, 0))
        composed.alpha_composite(rotated_tail)
        composed.alpha_composite(body)
        frames.append(prepare_frame(composed, "idle", frame_index))

    return frames


def build_celebrate_frames(
    source: Image.Image,
    source_dir: Path,
) -> list[PreparedFrame]:
    original = extract_source_frames(source)
    transitions = extract_transition_frames(
        Image.open(
            source_dir / "success-transitions-transparent.png"
        ).convert("RGBA")
    )
    run = [
        original[0],
        transitions[0],
        original[1],
        transitions[1],
        original[0],
        transitions[0],
        original[1],
        transitions[2],
    ]
    spin = [
        original[2],
        transitions[3],
        original[3],
        transitions[4],
        transitions[4],
        transitions[5],
        original[4],
        original[4],
    ]
    landing = [transitions[6], transitions[2], original[5], original[5]]
    timeline_images = run + spin + landing + [original[5]] * 4
    frames: list[PreparedFrame] = []

    for frame_index, image in enumerate(timeline_images):
        prepared = prepare_frame(
            image,
            "celebrate",
            frame_index,
            CELEBRATE_ROOT_OFFSETS_Y[frame_index],
        )
        if frame_index >= 20:
            text_frame = prepared.image.copy()
            add_yeah_text(text_frame)
            prepared = PreparedFrame(
                image=text_frame,
                anchor_x=prepared.anchor_x,
                anchor_y=prepared.anchor_y,
            )
        frames.append(prepared)

    return frames


def extract_transition_frames(source: Image.Image) -> list[Image.Image]:
    alpha = source.getchannel("A")
    occupied_columns = [
        x
        for x in range(source.width)
        if alpha.crop((x, 0, x + 1, source.height)).getbbox() is not None
    ]
    column_runs: list[list[int]] = []

    for x in occupied_columns:
        if not column_runs or x > column_runs[-1][-1] + 1:
            column_runs.append([x])
        else:
            column_runs[-1].append(x)

    if len(column_runs) != SUCCESS_TRANSITION_COUNT:
        raise ValueError(
            "success-transitions-transparent.png must contain seven separated poses."
        )

    frames: list[Image.Image] = []
    for run in column_runs:
        subject = source.crop((run[0], 0, run[-1] + 1, source.height))
        bounds = alpha_bounds_unscaled(subject)
        subject = subject.crop(bounds)
        resized = subject.resize(
            (
                round(subject.width * SUCCESS_TRANSITION_SCALE),
                round(subject.height * SUCCESS_TRANSITION_SCALE),
            ),
            Image.Resampling.LANCZOS,
        )
        frame = Image.new("RGBA", (FRAME_SIZE, FRAME_SIZE), (0, 0, 0, 0))
        frame.alpha_composite(
            resized,
            (
                (FRAME_SIZE - resized.width) // 2,
                224 - resized.height,
            ),
        )
        frames.append(frame)

    return frames


def alpha_bounds_unscaled(image: Image.Image) -> tuple[int, int, int, int]:
    alpha = image.getchannel("A").point(
        lambda value: 255 if value >= ALPHA_THRESHOLD else 0
    )
    bounds = alpha.getbbox()
    if bounds is None:
        raise ValueError("Transition pose must contain visible pixels.")
    return bounds


def atlas_layout(
    action: str,
    frame_index: int,
) -> tuple[int, int, int, int]:
    columns = 6 if action == "celebrate" else GRID_COLUMNS
    return (
        (frame_index % columns) * FRAME_SIZE,
        (frame_index // columns) * FRAME_SIZE,
        FRAME_SIZE,
        FRAME_SIZE,
    )


def build_atlas(
    frames: list[PreparedFrame],
    action: str,
) -> Image.Image:
    atlas_columns = 6 if action == "celebrate" else GRID_COLUMNS
    atlas_rows = math.ceil(len(frames) / atlas_columns)
    atlas = Image.new(
        "RGBA",
        (FRAME_SIZE * atlas_columns, FRAME_SIZE * atlas_rows),
        (0, 0, 0, 0),
    )

    for frame_index, prepared in enumerate(frames):
        x, y, _, _ = atlas_layout(action, frame_index)
        atlas.alpha_composite(prepared.image, (x, y))

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


def add_yeah_text(image: Image.Image) -> None:
    for offset_x, offset_y in ((-1, 0), (1, 0), (0, -1), (0, 1)):
        draw_bitmap_text(
            image,
            "yeah!",
            (76 + offset_x, 22 + offset_y),
            4,
            (38, 43, 60, 255),
        )

    draw_bitmap_text(
        image,
        "yeah!",
        (76, 22),
        4,
        (126, 225, 207, 255),
    )


def add_error_text(image: Image.Image, frame_index: int) -> Image.Image:
    label_origins = (
        (82, 173),
        (99, 173),
        (105, 173),
        (96, 124),
        (75, 124),
        (88, 124),
    )
    draw_bitmap_text(
        image,
        "ERROR",
        label_origins[frame_index],
        2,
        (245, 238, 225, 255),
    )
    return image


def create_atlas_document(
    action: str,
    atlas_name: str,
    frames: list[PreparedFrame],
) -> dict[str, object]:
    frame_documents: dict[str, object] = {}

    for frame_index, prepared in enumerate(frames):
        x, y, width, height = atlas_layout(action, frame_index)
        frame_name = f"{action}-{frame_index}"
        frame_documents[frame_name] = {
            "anchor": {
                "x": round(prepared.anchor_x, 6),
                "y": round(prepared.anchor_y, 6),
            },
            "frame": {"h": height, "w": width, "x": x, "y": y},
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
    atlas_columns = 6 if action == "celebrate" else GRID_COLUMNS
    atlas_rows = math.ceil(len(frames) / atlas_columns)

    return {
        "animations": {
            action: [f"{action}-{frame_index}" for frame_index in sequence]
        },
        "frames": frame_documents,
        "meta": {
            "app": "Asteria Lumi asset builder",
            "format": "RGBA8888",
            "image": atlas_name,
            "scale": "1",
            "size": {
                "h": FRAME_SIZE * atlas_rows,
                "w": FRAME_SIZE * atlas_columns,
            },
            "version": "1.1",
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
    with path.open("w", encoding="utf-8", newline="\n") as output:
        output.write(json.dumps(document, ensure_ascii=False, indent=2) + "\n")


def adjacent_repeat_ratio(sequence: list[int]) -> float:
    if len(sequence) < 2:
        return 0

    repeated = sum(
        current == previous
        for previous, current in zip(sequence, sequence[1:], strict=False)
    )
    return repeated / (len(sequence) - 1)


def validate_animation_definition(action: str) -> None:
    settings = ANIMATIONS[action]
    sequence = settings["sequence"]
    frame_rate = settings["frame_rate"]

    if not isinstance(sequence, list) or not sequence:
        raise ValueError(f"{action} must have a non-empty frame sequence.")

    if not isinstance(frame_rate, int) or frame_rate <= 0:
        raise ValueError(f"{action} frame rate must be a positive integer.")

    if len(set(sequence)) < settings["minimum_distinct_frames"]:
        raise ValueError(f"{action} does not use enough distinct key poses.")

    repeat_ratio = adjacent_repeat_ratio(sequence)
    if repeat_ratio > settings["maximum_adjacent_repeat_ratio"]:
        raise ValueError(
            f"{action} adjacent repeat ratio {repeat_ratio:.3f} exceeds its limit."
        )

    if action == "idle":
        if len(sequence) / frame_rate != 2.5:
            raise ValueError("Idle loop must be exactly 2.5 seconds.")
        if sequence[:43] != [1] * 43 or sequence[43:] != [
            0,
            2,
            0,
            2,
            0,
            2,
            1,
        ]:
            raise ValueError("Idle must rest before three fast tail swings.")

    if action == "celebrate":
        if not math.isclose(len(sequence) / frame_rate, 2.4):
            raise ValueError("Celebrate animation must be exactly 2.4 seconds.")
        if sequence != list(range(24)):
            raise ValueError("Celebrate phase allocation is invalid.")


def validate_prepared_frames(action: str, frames: list[PreparedFrame]) -> None:
    if action == "celebrate":
        expected_count = 24
    elif action == "idle":
        expected_count = 3
    else:
        expected_count = 6
    if len(frames) != expected_count:
        raise ValueError(f"{action} must contain {expected_count} atlas frames.")

    for frame_index, prepared in enumerate(frames):
        bounds = alpha_bounds(prepared.image)
        if (
            bounds[0] < SAFE_PADDING
            or bounds[1] < SAFE_PADDING
            or bounds[2] > FRAME_SIZE - SAFE_PADDING
            or bounds[3] > FRAME_SIZE - SAFE_PADDING
        ):
            raise ValueError(f"{action}-{frame_index} is clipped at its frame edge.")

        if not (
            math.isfinite(prepared.anchor_x)
            and math.isfinite(prepared.anchor_y)
            and 0 <= prepared.anchor_x <= 1
            and 0 <= prepared.anchor_y <= 1.5
        ):
            raise ValueError(f"{action}-{frame_index} has an invalid atlas anchor.")

    valid_indices = set(range(expected_count))
    if not set(ANIMATIONS[action]["sequence"]).issubset(valid_indices):
        raise ValueError(f"{action} sequence references an unknown frame.")


def build_package(source_dir: Path, output_dir: Path) -> None:
    animation_dir = output_dir / "animations"
    animation_dir.mkdir(parents=True, exist_ok=True)

    for action in ANIMATIONS:
        validate_animation_definition(action)
        frames = build_frames(load_source(source_dir, action), action, source_dir)
        validate_prepared_frames(action, frames)
        atlas_name = f"{action}.png"
        atlas = build_atlas(frames, action)
        atlas.save(animation_dir / atlas_name, optimize=True)
        write_json(
            animation_dir / f"{action}.json",
            create_atlas_document(action, atlas_name, frames),
        )

    write_json(output_dir / "pet.json", create_manifest())


def main() -> None:
    args = parse_args()
    build_package(args.source_dir, args.output_dir)
    print(f"Built and validated Lumi package at {args.output_dir}.")


if __name__ == "__main__":
    main()
