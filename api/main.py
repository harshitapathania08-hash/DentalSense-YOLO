
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
from PIL import Image
from io import BytesIO
import base64
import os
from huggingface_hub import hf_hub_download



model_path = hf_hub_download(
    repo_id="harshita-pathania/DentalSense-YOLO",
    filename="best.onnx",
    token=os.getenv("HF_TOKEN")
)

model = YOLO(model_path, task="detect")

app = FastAPI(title="DentalSense API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://dentalsense-nine-eight.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)




@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": True}


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    if file.content_type not in ["image/jpeg", "image/png", "image/webp"]:
        raise HTTPException(status_code=400, detail="Please upload a JPG, PNG, or WEBP image.")

    try:
        contents = await file.read()
        image = Image.open(BytesIO(contents)).convert("RGB")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid image file.")

    original_width, original_height = image.size
    image_array = np.array(image)

    scale = min(
        IMG_SIZE / original_width,
        IMG_SIZE / original_height
    )

    new_width = int(original_width * scale)
    new_height = int(original_height * scale)

    resized = cv2.resize(image_array, (new_width, new_height))

    padded = np.full((IMG_SIZE, IMG_SIZE, 3), 114, dtype=np.uint8)

    pad_x = (IMG_SIZE - new_width) // 2
    pad_y = (IMG_SIZE - new_height) // 2

    padded[pad_y:pad_y + new_height, pad_x:pad_x + new_width] = resized

    input_tensor = padded.astype(np.float32) / 255.0
    input_tensor = np.transpose(input_tensor, (2, 0, 1))
    input_tensor = np.expand_dims(input_tensor, axis=0)

    outputs = session.run(None, {input_name: input_tensor})
    predictions = outputs[0]

    if predictions.ndim == 3:
        predictions = predictions[0]

    if predictions.shape[0] < predictions.shape[1]:
        predictions = predictions.T

    boxes = []
    scores = []
    class_ids = []

    for prediction in predictions:
        cx, cy, w, h = prediction[:4]
        class_scores = prediction[4:]

        class_id = int(np.argmax(class_scores))
        confidence = float(class_scores[class_id])

        if confidence < CONF_THRESHOLD:
            continue

        x1 = (cx - w / 2 - pad_x) / scale
        y1 = (cy - h / 2 - pad_y) / scale
        x2 = (cx + w / 2 - pad_x) / scale
        y2 = (cy + h / 2 - pad_y) / scale

        x1 = max(0, min(original_width, x1))
        y1 = max(0, min(original_height, y1))
        x2 = max(0, min(original_width, x2))
        y2 = max(0, min(original_height, y2))

        boxes.append([
            float(x1), float(y1),
            float(x2 - x1), float(y2 - y1)
        ])
        scores.append(confidence)
        class_ids.append(class_id)

    indices = cv2.dnn.NMSBoxes(
        boxes,
        scores,
        CONF_THRESHOLD,
        IOU_THRESHOLD
    )

    detections = []
    annotated = image.copy()
    draw = ImageDraw.Draw(annotated)

    for index in np.array(indices).flatten():
        x, y, w, h = boxes[index]
        x1, y1 = int(x), int(y)
        x2, y2 = int(x + w), int(y + h)

        class_id = class_ids[index]
        confidence = scores[index]
        label = CLASS_NAMES[class_id]

        detections.append({
            "class_id": class_id,
            "label": label,
            "confidence": round(confidence * 100, 2),
            "box": [x1, y1, x2, y2]
        })

        draw.rectangle(
            [x1, y1, x2, y2],
            outline="red",
            width=4
        )

        draw.text(
            (x1, max(0, y1 - 20)),
            f"{label} {confidence * 100:.1f}%",
            fill="red"
        )

    output = BytesIO()
    annotated.save(output, format="JPEG")

    encoded = base64.b64encode(output.getvalue()).decode("utf-8")

    return {
        "filename": file.filename,
        "image_width": original_width,
        "image_height": original_height,
        "total_detections": len(detections),
        "detections": detections,
        "annotated_image": f"data:image/jpeg;base64,{encoded}",
        "disclaimer": "Experimental image screening only. Results are not a dental diagnosis."
    }