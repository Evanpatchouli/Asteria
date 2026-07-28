"""Perform deterministic static validation of the generated Lumi pet package."""

from __future__ import annotations

import argparse
import hashlib
import json
import math
from collections import deque
from pathlib import Path

from PIL import Image

from build_lumi_pet import (
    ALPHA_THRESHOLD,
    ANIMATIONS,
    FRAME_SIZE,
    SAFE_PADDING,
    validate_animation_definition,
)


VALIDATION_ROOT_ALPHA_THRESHOLD = 192
VALIDATION_ROOT_BAND_HEIGHT = 32
EXPECTED_CELEBRATE_OFFSETS_Y = (
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
IDLE_STABLE_BODY_BOXES = (
    (0, 0, 165, FRAME_SIZE),
    (165, 0, FRAME_SIZE, 75),
    (165, 190, FRAME_SIZE, FRAME_SIZE),
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--package-dir",
        type=Path,
        default=Path("pets/public/lumi"),
        help="Generated Lumi package directory.",
    )
    return parser.parse_args()


def read_json(path: Path) -> dict[str, object]:
    document = json.loads(path.read_text(encoding="utf-8"))

    if not isinstance(document, dict):
        raise TypeError(f"{path} must contain a JSON object.")

    return document


def validate_package(package_dir: Path) -> None:
    manifest = read_json(package_dir / "pet.json")
    manifest_animations = manifest.get("animations")

    if not isinstance(manifest_animations, dict):
        raise TypeError("Lumi manifest animations must be an object.")

    for action, settings in ANIMATIONS.items():
        validate_animation_definition(action)
        manifest_animation = manifest_animations.get(action)

        if not isinstance(manifest_animation, dict):
            raise TypeError(f"Manifest animation {action} is missing.")

        if manifest_animation.get("frameRate") != settings["frame_rate"]:
            raise ValueError(f"Manifest animation {action} has the wrong frame rate.")

        atlas_path = package_dir / "animations" / f"{action}.json"
        atlas = read_json(atlas_path)
        image_path = package_dir / "animations" / f"{action}.png"
        image = Image.open(image_path).convert("RGBA")
        validate_atlas(action, atlas, image)


def validate_atlas(
    action: str,
    atlas: dict[str, object],
    image: Image.Image,
) -> None:
    frames = atlas.get("frames")
    animations = atlas.get("animations")
    meta = atlas.get("meta")

    if not isinstance(frames, dict) or not isinstance(animations, dict):
        raise TypeError(f"{action} atlas frames and animations must be objects.")

    if not isinstance(meta, dict) or meta.get("size") != {
        "h": image.height,
        "w": image.width,
    }:
        raise ValueError(f"{action} atlas metadata does not match its texture.")

    sequence = animations.get(action)
    expected_sequence = [
        f"{action}-{frame_index}" for frame_index in ANIMATIONS[action]["sequence"]
    ]
    if sequence != expected_sequence:
        raise ValueError(f"{action} atlas sequence differs from its build definition.")

    semantic_root_offsets: list[tuple[float, float]] = []

    for frame_name, frame_document in frames.items():
        if not isinstance(frame_name, str) or not isinstance(frame_document, dict):
            raise TypeError(f"{action} has an invalid frame document.")

        frame = frame_document.get("frame")
        anchor = frame_document.get("anchor")
        if not isinstance(frame, dict) or not isinstance(anchor, dict):
            raise TypeError(f"{frame_name} must declare frame and anchor objects.")

        x = frame.get("x")
        y = frame.get("y")
        width = frame.get("w")
        height = frame.get("h")
        anchor_x = anchor.get("x")
        anchor_y = anchor.get("y")

        if not all(isinstance(value, int) for value in (x, y, width, height)):
            raise TypeError(f"{frame_name} has non-integer atlas bounds.")

        if (
            x < 0
            or y < 0
            or width != FRAME_SIZE
            or height != FRAME_SIZE
            or x + width > image.width
            or y + height > image.height
        ):
            raise ValueError(f"{frame_name} is outside its atlas texture.")

        if not (
            isinstance(anchor_x, (int, float))
            and isinstance(anchor_y, (int, float))
            and math.isfinite(anchor_x)
            and math.isfinite(anchor_y)
            and 0 <= anchor_x <= 1
            and 0 <= anchor_y <= 1.5
        ):
            raise ValueError(f"{frame_name} has an invalid semantic anchor.")

        bounds = (
            image.crop((x, y, x + width, y + height))
            .getchannel("A")
            .point(lambda value: 255 if value >= ALPHA_THRESHOLD else 0)
            .getbbox()
        )
        if (
            bounds is None
            or bounds[0] < SAFE_PADDING
            or bounds[1] < SAFE_PADDING
            or bounds[2] > FRAME_SIZE - SAFE_PADDING
            or bounds[3] > FRAME_SIZE - SAFE_PADDING
        ):
            raise ValueError(f"{frame_name} is empty or clipped.")

        frame_index = int(frame_name.rsplit("-", maxsplit=1)[1])
        frame_image = image.crop((x, y, x + width, y + height))
        root_x, root_y = validation_semantic_root(frame_image)
        desired_offset_y = (
            EXPECTED_CELEBRATE_OFFSETS_Y[frame_index]
            if action == "celebrate"
            else 0
        )
        root_offset_x = root_x - float(anchor_x) * FRAME_SIZE
        root_offset_y = root_y - float(anchor_y) * FRAME_SIZE
        if abs(root_offset_x) > 1 or abs(root_offset_y - desired_offset_y) > 1:
            raise ValueError(
                f"{frame_name} anchor does not preserve its semantic body root."
            )

        semantic_root_offsets.append((root_offset_x, root_offset_y))

    if action != "celebrate":
        horizontal_spread = max(root[0] for root in semantic_root_offsets) - min(
            root[0] for root in semantic_root_offsets
        )
        vertical_spread = max(root[1] for root in semantic_root_offsets) - min(
            root[1] for root in semantic_root_offsets
        )
        if horizontal_spread > 1 or vertical_spread > 1:
            raise ValueError(f"{action} semantic body root drifts between frames.")

    if action == "celebrate":
        if len(sequence) / ANIMATIONS[action]["frame_rate"] != 2.4:
            raise ValueError("Celebrate atlas duration must be exactly 2.4 seconds.")

        if len(frames) != 24 or sequence != [
            f"celebrate-{frame_index}" for frame_index in range(24)
        ]:
            raise ValueError("Celebrate atlas must expose all 24 timeline slots.")

        clean_landing = crop_frame(image, frames["celebrate-19"])
        yeah_landing = crop_frame(image, frames["celebrate-20"])
        if clean_landing.tobytes() == yeah_landing.tobytes():
            raise ValueError("Celebrate landing and yeah textures must be distinct.")

        fingerprints = {
            frame_fingerprint(image, frame_document)
            for frame_document in frames.values()
        }
        if len(fingerprints) < 13:
            raise ValueError("Celebrate atlas repeats too many identical key poses.")

    if action == "idle":
        validate_idle_body_is_constant(image, frames)


def validation_semantic_root(image: Image.Image) -> tuple[float, float]:
    alpha = image.getchannel("A")
    visible = bytearray(
        value >= VALIDATION_ROOT_ALPHA_THRESHOLD
        for value in alpha.get_flattened_data()
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
        raise ValueError("Frame has no high-opacity subject component.")

    central_left = FRAME_SIZE * 0.3
    central_right = FRAME_SIZE * 0.7
    central_component = [
        index
        for index in largest
        if central_left <= index % FRAME_SIZE <= central_right
    ]
    bottom = max(index // FRAME_SIZE for index in central_component) + 1
    support = [
        index
        for index in central_component
        if index // FRAME_SIZE >= bottom - VALIDATION_ROOT_BAND_HEIGHT
    ]
    support_x = [index % FRAME_SIZE for index in support]
    return ((min(support_x) + max(support_x) + 1) / 2, float(bottom - 1))


def frame_fingerprint(image: Image.Image, frame_document: object) -> str:
    frame = crop_frame(image, frame_document)
    if not isinstance(frame_document, dict):
        raise TypeError("Frame document must be an object.")

    anchor = frame_document.get("anchor")
    if not isinstance(anchor, dict):
        raise TypeError("Frame anchor must be an object.")

    digest = hashlib.sha256()
    digest.update(frame.tobytes())
    digest.update(
        f"{float(anchor['x']):.6f},{float(anchor['y']):.6f}".encode("ascii")
    )
    return digest.hexdigest()


def validate_idle_body_is_constant(
    image: Image.Image,
    frames: dict[str, object],
) -> None:
    if set(frames) != {"idle-0", "idle-1", "idle-2"}:
        raise ValueError("Idle atlas must contain three tail-angle frames.")

    idle_frames = [
        crop_frame(image, frames[f"idle-{frame_index}"])
        for frame_index in range(3)
    ]

    for bounds in IDLE_STABLE_BODY_BOXES:
        reference = idle_frames[0].crop(bounds).tobytes()
        if any(frame.crop(bounds).tobytes() != reference for frame in idle_frames[1:]):
            raise ValueError("Idle body pixels change outside the tail region.")

    if len({frame.tobytes() for frame in idle_frames}) != 3:
        raise ValueError("Idle tail angles must produce three distinct frames.")

    anchors = []
    for frame_index in range(3):
        frame_document = frames[f"idle-{frame_index}"]
        if not isinstance(frame_document, dict):
            raise TypeError("Idle frame document must be an object.")
        anchors.append(frame_document["anchor"])

    if anchors[0] != anchors[1] or anchors[1] != anchors[2]:
        raise ValueError("Idle tail movement must not move the body anchor.")


def crop_frame(image: Image.Image, frame_document: object) -> Image.Image:
    if not isinstance(frame_document, dict):
        raise TypeError("Frame document must be an object.")

    frame = frame_document["frame"]
    if not isinstance(frame, dict):
        raise TypeError("Frame bounds must be an object.")

    x = int(frame["x"])
    y = int(frame["y"])
    return image.crop((x, y, x + FRAME_SIZE, y + FRAME_SIZE))


def main() -> None:
    args = parse_args()
    validate_package(args.package_dir)
    print(f"Validated Lumi package at {args.package_dir}.")


if __name__ == "__main__":
    main()
