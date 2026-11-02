
import { useState } from "react";
import {
  Activity,
  BarChart3,
  CheckCircle2,
  FileText,
  Gauge,
  ImagePlus,
  LoaderCircle,
  ScanSearch,
  ShieldCheck,
  Upload,
  X,
  BookOpen,
  GitCompareArrows,
  CircleHelp,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import "./App.css";

const API_URL = "/api";

const navigation = [
  { id: "main", label: "Dental Screening", icon: ScanSearch },
  { id: "analysis", label: "Image Analysis", icon: GitCompareArrows },
  { id: "summary", label: "Dental Summary", icon: FileText },


  { id: "graphs", label: "Finding Distribution", icon: BarChart3 },
];

const classMetrics = [
  { name: "Fillings", map: 91.0 },
  { name: "Impacted tooth", map: 92.1 },
  { name: "Implant", map: 98.9 },
  { name: "Cavity", map: 53.9 },
];

const testMetrics = [
  { label: "Precision", value: "76.0%" },
  { label: "Recall", value: "84.8%" },
  { label: "mAP@50", value: "84.0%" },
  { label: "mAP@50–95", value: "49.5%" },
];

const dentalGuide = [
  {
    title: "Fillings",
    symbol: "F",
    tone: "blue",
    description:
      "Dental restorations used to repair teeth affected by damage or decay. A filling detection does not mean that active decay is present.",
    note: "What to know: restorations may appear differently across X-rays.",
  },
  {
    title: "Impacted teeth",
    symbol: "I",
    tone: "mint",
    description:
      "Teeth that have not fully erupted into their expected position. Wisdom teeth are a common example.",
    note: "What to know: a dentist assesses position and surrounding structures.",
  },
  {
    title: "Dental implants",
    symbol: "D",
    tone: "blue",
    description:
      "Artificial tooth roots used to support replacement teeth. Implant structures can be visible on dental radiographs.",
    note: "What to know: detection alone does not assess implant health.",
  },
  {
    title: "Possible cavities",
    symbol: "C",
    tone: "mint",
    description:
      "Regions that the model labels as cavity-related. The prediction may be incorrect or may miss an area of concern.",
    note: "What to know: a dental professional must assess suspected decay.",
  },
];

function App() {
  const [page, setPage] = useState("main");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleFile(selectedFile) {
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("Please choose an image smaller than 10 MB.");
      return;
    }

    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
    setResult(null);
    setError("");
  }

  async function analyzeImage() {
    if (!file) {
      setError("Choose a panoramic dental X-ray first.");
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

  function clearImage() {
    setFile(null);
    setPreview("");
    setResult(null);
    setError("");
  }

  const detections = result?.detections ?? [];

  const counts = detections.reduce((acc, item) => {
    acc[item.label] = (acc[item.label] || 0) + 1;
    return acc;
  }, {});

  const distributionData = Object.entries(counts).map(([name, count]) => ({
    name,
    count,
  }));

  const cavityCount = Object.entries(counts).reduce(
    (total, [label, count]) =>
      label.toLowerCase().includes("cavit") ? total + count : total,
    0
  );

  function PageHeader({ eyebrow, title, description }) {
    return (
      <div className="page-heading">
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
    );
  }

  function MetricCard({ label, value, detail }) {
    return (
      <div className="metric-card">
        <span>{label}</span>
        <strong>{value}</strong>
        {detail && <small>{detail}</small>}
      </div>
    );
  }

  function SectionTitle({ icon: Icon, title, description, tone = "blue" }) {
    return (
      <div className="section-title">
        <span className={`section-icon ${tone}`}>
          <Icon size={20} />
        </span>
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </div>
    );
  }

  function ClassChart() {
    return (
      <div className="chart-area">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={classMetrics}
            margin={{ top: 12, right: 10, left: -15, bottom: 8 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#E6ECEC"
            />
            <XAxis
              dataKey="name"
              tick={{ fill: "#647A80", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: "#647A80", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip formatter={(value) => [`${value}%`, "mAP@50"]} />
            <Bar
              dataKey="map"
              fill="#52AB98"
              radius={[7, 7, 0, 0]}
              maxBarSize={58}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  function FindingChart() {
    if (!result) {
      return (
        <div className="result-placeholder">
          <div className="placeholder-tooth">
            <BarChart3 size={28} />
          </div>
          <strong>Your dental findings will appear here</strong>
          <p>Analyze an X-ray first to see its detected categories.</p>
          <button className="primary-button" onClick={() => setPage("main")}>
            <ScanSearch size={17} /> Go to screening
          </button>
        </div>
      );
    }

    if (!distributionData.length) {
      return (
        <div className="result-placeholder">
          <CircleHelp size={30} />
          <strong>No objects were detected</strong>
          <p>This does not rule out a dental condition.</p>
        </div>
      );
    }

    return (
      <>
        <div className="chart-area">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={distributionData}
              margin={{ top: 12, right: 10, left: -15, bottom: 8 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#E6ECEC"
              />
              <XAxis
                dataKey="name"
                tick={{ fill: "#647A80", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: "#647A80", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip />
              <Bar
                dataKey="count"
                name="Detections"
                fill="#52AB98"
                radius={[7, 7, 0, 0]}
                maxBarSize={58}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="chart-note">
          Counts represent this image only, not the number of affected teeth or
          a measure of disease severity.
        </p>
      </>
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
       
<button className="brand" onClick={() => setPage("main")}>
  <span className="brand-mark">
    <svg
      viewBox="0 0 64 64"
      className="brand-tooth"
      role="img"
      aria-label="DentalSense tooth logo"
    >
      <defs>
        <linearGradient id="toothGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#DCE8FF" />
        </linearGradient>
      </defs>

      <path
        d="M18 9 C10 12 8 22 12 32 L21 51
           C23 57 28 57 30 49 L33 38
           C34 34 38 34 39 39 L42 50
           C44 58 49 57 52 49 L59 29
           C63 17 55 8 45 10
           C40 11 37 14 32 13
           C27 12 23 7 18 9 Z"
        fill="url(#toothGradient)"
        stroke="#2868E8"
        strokeWidth="2.8"
        strokeLinejoin="round"
      />

      <path
        d="M17 22 C21 18 25 20 28 23"
        fill="none"
        stroke="#FF7A36"
        strokeWidth="3.5"
        strokeLinecap="round"
      />

      <circle cx="47" cy="17" r="4" fill="#FF7A36" />
    </svg>
  </span>

  <span className="brand-copy">
    <strong>Dental<span>Sense</span></strong>
    <small>Dental X-ray screening</small>
  </span>
</button>


        <span className="nav-heading">DENTAL WORKSPACE</span>

        <nav className="navigation">
          {navigation.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`nav-item ${page === id ? "active" : ""}`}
              onClick={() => setPage(id)}
            >
              <Icon size={19} strokeWidth={1.8} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-note">
          <span className="tooth-symbol">🦷</span>
          <strong>Care starts with a closer look</strong>
          <p>Explore dental images and model-generated findings.</p>
        </div>

        <div className="sidebar-footer">
          <ShieldCheck size={16} />
          <span>For research use only</span>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <span className="topbar-label">
            DENTALSENSE /{" "}
            {navigation
              .find((item) => item.id === page)
              ?.label.toUpperCase()}
          </span>
          <span className="model-status">
            <span /> Dental image workspace
          </span>
        </header>

        {page === "main" && (
          <>
            <section className="welcome-banner">
              <div>
                <span className="eyebrow">YOUR DENTAL IMAGE WORKSPACE</span>
                <h1>A closer look at every smile.</h1>
                <p>
                  Upload a panoramic dental X-ray to explore detected dental
                  structures and possible findings.
                </p>
              </div>
              <div className="banner-tooth" aria-hidden="true">
                🦷
              </div>
            </section>

            <div className="main-grid">
              <section className="panel upload-panel">
                <SectionTitle
                  icon={ImagePlus}
                  title="Your dental X-ray"
                  description="Choose a panoramic image"
                />

                {file && (
                  <button className="clear-button" onClick={clearImage}>
                    <X size={16} />
                  </button>
                )}

                <label className={`drop-zone ${preview ? "has-preview" : ""}`}>
                  {preview ? (
                    <img src={preview} alt="Selected dental X-ray" />
                  ) : (
                    <>
                      <span className="upload-icon">
                        <Upload size={26} />
                      </span>
                      <strong>Choose your dental X-ray</strong>
                      <span>Click below to browse your files</span>
                      <span className="browse-button">Browse images</span>
                      <small>JPG, PNG or WEBP · Max 10 MB</small>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    hidden
                    onChange={(event) =>
                      handleFile(event.target.files?.[0])
                    }
                  />
                </label>

                {file && <p className="selected-file">{file.name}</p>}

                <button
                  className="primary-button"
                  disabled={!file || loading}
                  onClick={analyzeImage}
                >
                  {loading ? (
                    <>
                      <LoaderCircle className="spin" size={18} />
                      Examining image...
                    </>
                  ) : (
                    <>
                      <ScanSearch size={18} />
                      Explore dental findings
                    </>
                  )}
                </button>

                {error && <p className="error-message">{error}</p>}
              </section>

              <section className="panel result-panel">
                <SectionTitle
                  icon={ScanSearch}
                  tone="mint"
                  title="Dental findings"
                  description={
                    result
                      ? "Predictions for this image"
                      : "Your results will appear here"
                  }
                />

                {loading ? (
                  <div className="result-placeholder">
                    <LoaderCircle className="spin" size={32} />
                    <strong>Taking a closer look</strong>
                    <p>Please wait while the image is processed.</p>
                  </div>
                ) : result ? (
                  <>
                    <div className="annotated-image">
                      <img
                        src={result.annotated_image}
                        alt="Dental X-ray with predicted findings"
                      />
                    </div>

                    <div className="result-status">
                      <CheckCircle2 size={17} />
                      Image analysis completed
                    </div>

                    <div className="detection-summary">
                      <div>
                        <span>Detected objects</span>
                        <strong>{result.total_detections}</strong>
                      </div>
                      <div>
                        <span>Possible cavities flagged</span>
                        <strong>{cavityCount}</strong>
                      </div>
                    </div>

                    {detections.length > 0 ? (
                      <div className="detection-list">
                        {detections.map((item, index) => (
                          <div
                            className="detection-row"
                            key={`${item.label}-${index}`}
                          >
                            <span className="detection-dot" />
                            <span className="detection-label">
                              {item.label}
                            </span>
                            <span className="detection-confidence">
                              {Number(item.confidence).toFixed(1)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="empty-note">
                        No objects were detected at this confidence setting.
                        This does not rule out a dental condition.
                      </p>
                    )}

                    <button
                      className="primary-button"
                      onClick={() => setPage("analysis")}
                    >
                      <GitCompareArrows size={17} />
                      Compare images
                    </button>
                  </>
                ) : (
                  <div className="result-placeholder">
                    <div className="placeholder-tooth">
                    <ScanSearch size={30} />
                    </div>
                    <strong>Ready for your X-ray</strong>
                    <p>
                      Upload an image to explore the model's detected findings.
                    </p>
                  </div>
                )}
              </section>
            </div>

        
          </>
        )}

        {page === "analysis" && (
          <section className="page-section">
            <PageHeader
              eyebrow="YOUR DENTAL IMAGE"
              title="Image Analysis"
              description="Compare the uploaded X-ray with the model's annotated output."
            />

            {!result ? (
              <div className="panel result-placeholder">
                <div className="placeholder-tooth">
                  <ImagePlus size={29} />
                </div>
                <strong>No image has been analyzed yet</strong>
                <p>Start by uploading a panoramic X-ray on the screening page.</p>
                <button
                  className="primary-button"
                  onClick={() => setPage("main")}
                >
                  <Upload size={17} /> Go to dental screening
                </button>
              </div>
            ) : (
              <>
                <div className="main-grid">
                  <section className="panel">
                    <SectionTitle
                      icon={ImagePlus}
                      title="Original image"
                      description={file?.name || "Uploaded X-ray"}
                    />
                    <div className="annotated-image">
                      <img src={preview} alt="Original uploaded dental X-ray" />
                    </div>
                  </section>

                  <section className="panel">
                    <SectionTitle
                      icon={ScanSearch}
                      tone="mint"
                      title="Annotated image"
                      description="Model-predicted bounding boxes"
                    />
                    <div className="annotated-image">
                      <img
                        src={result.annotated_image}
                        alt="Dental X-ray with predicted bounding boxes"
                      />
                    </div>
                  </section>
                </div>

                <section className="panel" style={{ marginTop: 18 }}>
                  <SectionTitle
                    icon={Activity}
                    title="Findings in this image"
                    description="Predicted categories and confidence scores"
                  />
                  {detections.length ? (
                    <div className="detection-list">
                      {detections.map((item, index) => (
                        <div
                          className="detection-row"
                          key={`${item.label}-${index}`}
                        >
                          <span className="detection-dot" />
                          <span className="detection-label">
                            {item.label}
                          </span>
                          <span className="detection-confidence">
                            {Number(item.confidence).toFixed(1)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="empty-note">
                      No objects were detected at this confidence setting.
                    </p>
                  )}
                </section>
              </>
            )}

         
          </section>
        )}

        {page === "guide" && (
          <section className="page-section">
            <PageHeader
              eyebrow="UNDERSTANDING DENTAL X-RAYS"
              title="Dental Image Guide"
              description="Learn what the four categories detected by DentalSense generally refer to."
            />

            <div className="summary-grid">
              {dentalGuide.map((item) => (
                <article className="panel" key={item.title}>
                  <div className="section-title">
                    <span className={`section-icon ${item.tone}`}>
                      <span style={{ fontWeight: 800 }}>{item.symbol}</span>
                    </span>
                    <div>
                      <h2>{item.title}</h2>
                      <p>Dental image reference</p>
                    </div>
                  </div>
                  <p className="empty-note">{item.description}</p>
               
                </article>
              ))}
            </div>

            
          </section>
        )}

{page === "summary" && (
  <section className="page-section">
    <PageHeader
      eyebrow="IMAGE REPORT"
      title="Dental Summary"
      description="A concise overview of the analyzed X-ray."
    />

    {!result ? (
      <div className="panel result-placeholder">
        <div className="placeholder-tooth">
          <FileText size={28} />
        </div>
        <strong>Your summary is waiting</strong>
        <p>Upload and analyze a dental X-ray to view its results.</p>
        <button
          className="primary-button"
          onClick={() => setPage("main")}
        >
          <ScanSearch size={17} />
          Analyze an X-ray
        </button>
      </div>
    ) : (
      <>
        <div className="summary-grid">
          <MetricCard
            label="Categories detected"
            value={Object.keys(counts).length}
            detail="Distinct predicted labels"
          />

          <MetricCard
            label="Possible cavities"
            value={cavityCount}
            detail="Requires professional review"
          />
        </div>

        <section className="panel">
          <SectionTitle
            icon={FileText}
            title="Findings"
            description="Predicted labels and their counts"
          />

          {distributionData.length ? (
            <div className="detection-list">
              {distributionData.map((item) => (
                <div className="detection-row" key={item.name}>
                  <span className="detection-dot" />
                  <span className="detection-label">
                    {item.name}
                  </span>
                  <span className="detection-confidence">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-note">
              No objects were detected at the current confidence setting.
              This does not rule out a dental condition.
            </p>
          )}
        </section>

        <section className="panel" style={{ marginTop: 18 }}>
          <SectionTitle
            icon={BookOpen}
            title="Understanding the labels"
            description="Brief reference for the detected categories"
          />

          <div className="summary-grid">
            {dentalGuide.map((item) => (
              <article className="reference-card" key={item.title}>
                <div className="section-title">
                  <span className={`section-icon ${item.tone}`}>
                    <span style={{ fontWeight: 800 }}>
                      {item.symbol}
                    </span>
                  </span>

                  <div>
                    <h2>{item.title}</h2>
                  </div>
                </div>

                <p className="empty-note">
                  {item.description}
                </p>
              </article>
            ))}
          </div>
        </section>

     
      </>
    )}
  </section>
)}

        {page === "graphs" && (
          <section className="page-section">
            <PageHeader
              eyebrow="DENTAL FINDINGS"
              title="Finding Distribution"
              description="Explore the categories detected in your current X-ray."
            />

            <div className="panel">
              <SectionTitle
                icon={BarChart3}
                tone="mint"
                title="Findings by category"
                description={
                  result
                    ? "Counts for the current uploaded image"
                    : "Upload and analyze an image to populate the chart"
                }
              />
              <FindingChart />
            </div>

            {result && (
              <div className="summary-grid" style={{ marginTop: 18 }}>
                <MetricCard
                  label="Total detections"
                  value={result.total_detections ?? detections.length}
                  detail="Predicted objects"
                />
                <MetricCard
                  label="Categories found"
                  value={Object.keys(counts).length}
                  detail="Distinct predicted labels"
                />
                <MetricCard
                  label="Cavity-labelled"
                  value={cavityCount}
                  detail="Not a confirmed diagnosis"
                />
              </div>
            )}
          </section>
        )}

      </main>
    </div>
  );
}

export default App;
