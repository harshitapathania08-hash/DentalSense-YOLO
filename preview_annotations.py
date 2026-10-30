from pathlib import Path
from PIL import Image, ImageDraw
import matplotlib.pyplot as plt

root = Path("dataset/Dental OPG (Object Detection)/Original Dataset")
output = Path("annotation_previews")
output.mkdir(exist_ok=True)

class_counts = {}

for label in root.glob("*.txt"):
    for line in label.read_text().splitlines():
        parts = line.split()
        if len(parts) == 5:
            class_id = int(parts[0])
            class_counts[class_id] = class_counts.get(class_id, 0) + 1

print("Bounding-box counts by class ID:")
for class_id, count in sorted(class_counts.items()):
    print(f"Class {class_id}: {count} boxes")

# Select images that contain each class.
selected = {}
for label in sorted(root.glob("*.txt")):
    lines = [
        line.split()
        for line in label.read_text().splitlines()
        if len(line.split()) == 5
    ]
    for parts in lines:
        class_id = int(parts[0])
        if class_id not in selected:
            selected[class_id] = (label, lines)

for class_id, (label, lines) in sorted(selected.items()):
    image_path = label.with_suffix(".jpg")
    if not image_path.exists():
        continue

    image = Image.open(image_path).convert("RGB")
    draw = ImageDraw.Draw(image)
    width, height = image.size

    for parts in lines:
        cid = int(parts[0])
        x, y, w, h = map(float, parts[1:])
        x1 = (x - w / 2) * width
        y1 = (y - h / 2) * height
        x2 = (x + w / 2) * width
        y2 = (y + h / 2) * height

        draw.rectangle((x1, y1, x2, y2), outline="red", width=3)
        draw.text((x1, max(0, y1 - 15)), f"Class {cid}", fill="yellow")

    destination = output / f"class_{class_id}_{image_path.name}"
    image.save(destination)
    print(f"Saved: {destination}")

print("\nOpen the annotation_previews folder on your Desktop/DentalSense-YOLO.")
