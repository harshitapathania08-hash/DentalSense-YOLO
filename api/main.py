
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
    filename="best.pt",
    token=os.getenv("HF_TOKEN")
)

model = YOLO(model_path)

app = FastAPI(title="DentalSense API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model_path = hf_hub_download(
    repo_id="harshita-pathania/DentalSense-YOLO",
    filename="best.pt",
    repo_type="model"
)

model = YOLO(model_path)


@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": True}


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    if file.content_type not in ["image/jpeg", "image/png", "image/webp"]:
        raise HTTPException(
            status_code=400,
            detail="Please upload a JPG, PNG, or WEBP image."
        )

    try:
        contents = await file.read()
        image = Image.open(BytesIO(contents)).convert("RGB")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid image file.")

    results = model.predict(image, imgsz=640, conf=0.25, device="cpu", verbose=False)
    result = results[0]

    detections = []

    for box in result.boxes:
        class_id = int(box.cls[0].item())
        confidence = float(box.conf[0].item())
        x1, y1, x2, y2 = [
            round(float(value), 2)
            for value in box.xyxy[0].tolist()
        ]

        detections.append({
            "class_id": class_id,
            "label": result.names[class_id],
            "confidence": round(confidence * 100, 2),
            "box": [x1, y1, x2, y2]
        })

    annotated = result.plot()[:, :, ::-1]
    output = BytesIO()
    Image.fromarray(annotated).save(output, format="JPEG")
    encoded = base64.b64encode(output.getvalue()).decode("utf-8")

    return {
        "filename": file.filename,
        "image_width": image.width,
        "image_height": image.height,
        "total_detections": len(detections),
        "detections": detections,
        "annotated_image": f"data:image/jpeg;base64,{encoded}",
        "disclaimer": (
            "Experimental image screening only. "
            "Results are not a dental diagnosis."
        )
    }
