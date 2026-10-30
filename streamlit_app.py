import streamlit as st
from ultralytics import YOLO
from PIL import Image
import os

st.set_page_config(
    page_title="DentalSense",
    page_icon="🦷",
    layout="centered"
)

st.title("🦷 DentalSense")
st.subheader("AI-Based Dental X-ray Screening")

st.warning(
    "Experimental image screening only. "
    "Results are not a dental diagnosis."
)

@st.cache_resource
def load_model():
    model_path = "api/best.onnx"

    if not os.path.exists(model_path):
        model_path = "api/best.pt"

    return YOLO(model_path)

uploaded_file = st.file_uploader(
    "Upload a dental X-ray image",
    type=["jpg", "jpeg", "png", "webp"]
)

if uploaded_file is not None:
    image = Image.open(uploaded_file).convert("RGB")

    st.image(image, caption="Uploaded X-ray", use_container_width=True)

    if st.button("Analyze Image"):
        with st.spinner("Analyzing X-ray..."):
            model = load_model()

            results = model.predict(
                image,
                imgsz=320,
                conf=0.25,
                device="cpu",
                verbose=False
            )

            result = results[0]

            st.subheader("Screening Results")

            st.write(
                "Total detections:",
                len(result.boxes)
            )

            if len(result.boxes) > 0:
                for box in result.boxes:
                    class_id = int(box.cls[0].item())
                    confidence = float(box.conf[0].item()) * 100

                    st.write(
                        f"{result.names[class_id]} — "
                        f"{confidence:.2f}% confidence"
                    )

                annotated_image = result.plot()[:, :, ::-1]

                st.image(
                    annotated_image,
                    caption="Detected regions",
                    use_container_width=True
                )

            else:
                st.info("No suspicious regions detected.")

            st.caption(
                "This AI screening tool is experimental and "
                "does not replace professional dental evaluation."
            )