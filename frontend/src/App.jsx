
import { useState } from "react";
import "./App.css";

const API_URL = "https://w0kiy.aiccloud.online";

const CLASS_ORDER = [
  "Cavity",
  "Fillings",
  "Impacted Tooth",
  "Implant",
];

export default function App() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function chooseImage(selected) {
    if (!selected) return;

    if (!selected.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }

    if (selected.size > 10 * 1024 * 1024) {
      setError("Please choose an image smaller than 10 MB.");
      return;
    }

    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setResult(null);
    setError("");
  }

  async function analyzeImage() {
    if (!file) {
      setError("Please upload a dental X-ray first.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${API_URL}/predict`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Image analysis failed.");
      }

      setResult(data);
    } catch (err) {
      setError(
        err.message || "Could not connect to the DentalSense API."
      );
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setFile(null);
    setPreview("");
    setResult(null);
    setError("");
  }

  const detections = result?.detections || [];

  const detectionCounts = detections.reduce((counts, item) => {
    const label = item.label;
    counts[label] = (counts[label] || 0) + 1;
    return counts;
  }, {});

  const totalDetections =
    result?.total_detections ?? detections.length;

  const classNames = [
    ...CLASS_ORDER.filter((label => detectionCounts[label])),
    ...Object.keys(detectionCounts).filter(
      (label) => !CLASS_ORDER.includes(label)
    ),
  ];

  return (
    <main className="app">
      <header className="header">
        <div className="logo">
          Dental<span>Sense</span>
        </div>

        <span className="tag">Dental X-ray analysis</span>
      </header>

      <section className="intro">
        <p className="eyebrow">
          AI-BASED DENTAL X-RAY SCREENING
        </p>

        <h1>Dental Analysis</h1>

        <p>
          Upload a dental X-ray to view model-detected objects.
        </p>
      </section>

      <section className="workspace">
        <div className="panel">
          <h2>Upload X-ray</h2>

          <label className="upload">
            {preview ? (
              <img
                src={preview}
                alt="Uploaded dental X-ray"
              />
            ) : (
              <>
                <span className="upload-icon">＋</span>
                <strong>Choose an image</strong>
                <span>JPG, PNG or WEBP · Max 10 MB</span>
              </>
            )}

            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) =>
                chooseImage(e.target.files?.[0])
              }
            />
          </label>

          {file && <p className="filename">{file.name}</p>}

          <button
            className="button primary"
            onClick={analyzeImage}
            disabled={!file || loading}
          >
            {loading ? "Analyzing..." : "Analyze X-ray"}
          </button>

          {file && (
            <button
              className="button secondary"
              onClick={reset}
              disabled={loading}
            >
              Clear image
            </button>
          )}

          {error && <p className="error">{error}</p>}
        </div>

        <div className="panel">
          <h2>Analysis results</h2>

          {loading ? (
            <p className="message">
              The image is being analyzed...
            </p>
          ) : result ? (
            <>
              {result.annotated_image && (
                <img
                  className="result-image"
                  src={result.annotated_image}
                  alt="X-ray with model detections"
                />
              )}

              <p className="result-count">
                Total detected objects:{" "}
                <strong>{totalDetections}</strong>
              </p>

              {detections.length > 0 ? (
                <div className="detection-summary">
                  {classNames.map((label) => (
                    <div className="detection-card" key={label}>
                      <span className="detection-label">
                        {label}
                      </span>

                      <strong className="detection-number">
                        {detectionCounts[label]}
                      </strong>

                      <span className="detection-caption">
                        Detected objects
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="message">
                  No objects detected.
                </p>
              )}
            </>
          ) : (
            <p className="message">
              Upload an X-ray to see its results here.
            </p>
          )}
        </div>
      </section>

     
    </main>
  );
}
