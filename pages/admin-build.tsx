import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/router";

const BACKEND_URL = "https://dice-mosaic-backend.onrender.com";

const DICE_COLORS: Record<number, { bg: string; text: string }> = {
  0: { bg: "#111111", text: "#ffffff" },
  1: { bg: "#e74c3c", text: "#ffffff" },
  2: { bg: "#2980b9", text: "#ffffff" },
  3: { bg: "#e67e22", text: "#ffffff" },
  4: { bg: "#27ae60", text: "#ffffff" },
  5: { bg: "#f1c40f", text: "#000000" },
  6: { bg: "#ffffff",  text: "#000000" },
};

export default function AdminBuildPage() {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);

  // Auth check — wait for router to be ready so query params are available
  useEffect(() => {
    if (!router.isReady) return;
    if (router.query.key === "pipcasso") {
      setAuthed(true);
    } else {
      router.replace("/");
    }
  }, [router.isReady, router.query.key]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [gridWidth, setGridWidth] = useState(60);
  const [gridHeight, setGridHeight] = useState(60);
  const [smartRotation, setSmartRotation] = useState(false);
  const [grid, setGrid] = useState<number[][] | null>(null);
  const [rotations, setRotations] = useState<number[][] | null>(null);
  const [status, setStatus] = useState<"idle" | "generating" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [exportStatus, setExportStatus] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [draftResult, setDraftResult] = useState<{ id: string; name: string } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setImageFile(file);
    setGrid(null);
    setRotations(null);
    if (file) {
      setImagePreview(URL.createObjectURL(file));
    } else {
      setImagePreview(null);
    }
  };

  const handleGenerate = async () => {
    if (!imageFile) return;
    setStatus("generating");
    setErrorMsg("");
    setGrid(null);
    setRotations(null);
    setDraftResult(null);
    setExportStatus("idle");

    try {
      // Step 1: analyze
      const formData = new FormData();
      formData.append("file", imageFile, "upload.png");
      formData.append("grid_width", gridWidth.toString());
      formData.append("grid_height", gridHeight.toString());

      const analyzeRes = await fetch(`${BACKEND_URL}/analyze`, {
        method: "POST",
        body: formData,
        signal: AbortSignal.timeout(120000),
      });

      if (!analyzeRes.ok) throw new Error(`Analyze failed: ${analyzeRes.status}`);
      const analyzeData = await analyzeRes.json();
      const generatedGrid: number[][] = analyzeData.styles[0].full_grid ?? analyzeData.styles[0].grid;
      setGrid(generatedGrid);

      // Step 2: smart rotation (if enabled)
      if (smartRotation) {
        const rotForm = new FormData();
        rotForm.append("file", imageFile, "upload.png");
        rotForm.append("grid_data", JSON.stringify(generatedGrid));

        const rotRes = await fetch(`${BACKEND_URL}/smart-rotation`, {
          method: "POST",
          body: rotForm,
          signal: AbortSignal.timeout(60000),
        });

        if (rotRes.ok) {
          const rotData = await rotRes.json();
          setRotations(rotData.rotations);
        }
        // Non-fatal: if smart rotation fails, just show grid without rotations
      }

      setStatus("idle");
    } catch (err: any) {
      setErrorMsg(err.message ?? "Unknown error");
      setStatus("error");
    }
  };

  const cycleCell = (r: number, c: number) => {
    if (!grid) return;
    setGrid((prev) => {
      if (!prev) return prev;
      const next = prev.map((row) => [...row]);
      next[r][c] = (next[r][c] + 1) % 7;
      return next;
    });
  };

  const handleExport = async () => {
    if (!grid) return;
    setExportStatus("saving");
    setDraftResult(null);
    try {
      const res = await fetch("/api/admin-save-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grid }),
      });
      if (!res.ok) throw new Error("Save failed");
      const data = await res.json();
      setDraftResult({ id: data.id, name: data.name });
      setExportStatus("done");
    } catch {
      setExportStatus("error");
    }
  };

  // Calculate cell size so the grid fits in ~900px wide
  const cellSize = grid
    ? Math.max(6, Math.min(14, Math.floor(900 / (grid[0]?.length ?? 60))))
    : 10;

  if (!authed) return null;

  return (
    <div style={{ fontFamily: "monospace", padding: "1.5rem", backgroundColor: "#1a1a1a", minHeight: "100vh", color: "#eee" }}>
      <h1 style={{ margin: "0 0 1.5rem", fontSize: "1.3rem", color: "#f1c40f" }}>🔧 Admin Build Mode</h1>

      {/* Controls */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "flex-end", marginBottom: "1.5rem" }}>

        {/* Upload */}
        <div>
          <label style={{ display: "block", marginBottom: 4, fontSize: "0.8rem", color: "#aaa" }}>Photo</label>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange}
            style={{ color: "#eee", fontSize: "0.85rem" }} />
        </div>

        {/* Grid size */}
        <div>
          <label style={{ display: "block", marginBottom: 4, fontSize: "0.8rem", color: "#aaa" }}>Width</label>
          <input type="number" value={gridWidth} min={10} max={200}
            onChange={(e) => setGridWidth(Number(e.target.value))}
            style={{ width: 60, padding: "0.35rem", backgroundColor: "#333", color: "#eee", border: "1px solid #555", borderRadius: 4 }} />
        </div>
        <div>
          <label style={{ display: "block", marginBottom: 4, fontSize: "0.8rem", color: "#aaa" }}>Height</label>
          <input type="number" value={gridHeight} min={10} max={200}
            onChange={(e) => setGridHeight(Number(e.target.value))}
            style={{ width: 60, padding: "0.35rem", backgroundColor: "#333", color: "#eee", border: "1px solid #555", borderRadius: 4 }} />
        </div>

        {/* Smart Rotation toggle */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <label style={{ fontSize: "0.8rem", color: "#aaa" }}>Smart Rotation</label>
          <div
            onClick={() => setSmartRotation((v) => !v)}
            style={{
              width: 44, height: 24, borderRadius: 12, cursor: "pointer",
              backgroundColor: smartRotation ? "#27ae60" : "#555",
              position: "relative", transition: "background 0.2s",
            }}
          >
            <div style={{
              position: "absolute", top: 3, left: smartRotation ? 23 : 3,
              width: 18, height: 18, borderRadius: "50%", backgroundColor: "#fff",
              transition: "left 0.2s",
            }} />
          </div>
          <span style={{ fontSize: "0.75rem", color: smartRotation ? "#27ae60" : "#666" }}>
            {smartRotation ? "ON" : "OFF"}
          </span>
        </div>

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={!imageFile || status === "generating"}
          style={{
            padding: "0.5rem 1.25rem", backgroundColor: "#e74c3c", color: "#fff",
            border: "none", borderRadius: 6, cursor: (!imageFile || status === "generating") ? "not-allowed" : "pointer",
            opacity: (!imageFile || status === "generating") ? 0.5 : 1,
            fontWeight: "bold", fontSize: "0.9rem",
          }}
        >
          {status === "generating" ? "Generating..." : "Generate Mosaic"}
        </button>
      </div>

      {/* Image preview */}
      {imagePreview && (
        <img src={imagePreview} alt="preview"
          style={{ height: 100, objectFit: "contain", borderRadius: 6, marginBottom: "1rem", border: "1px solid #444" }} />
      )}

      {/* Error */}
      {status === "error" && (
        <p style={{ color: "#e74c3c", marginBottom: "1rem", fontSize: "0.85rem" }}>Error: {errorMsg}</p>
      )}

      {/* Grid */}
      {grid && (
        <>
          <div style={{ marginBottom: "0.75rem", fontSize: "0.8rem", color: "#aaa" }}>
            {grid.length} × {grid[0]?.length} grid — click any cell to cycle die value (0–6)
            {rotations && <span style={{ color: "#27ae60", marginLeft: 12 }}>✓ Smart rotation applied</span>}
          </div>

          <div style={{
            display: "inline-block",
            border: "1px solid #444",
            lineHeight: 0,
            maxWidth: "100%",
            overflowX: "auto",
          }}>
            {grid.map((row, r) => (
              <div key={r} style={{ display: "flex" }}>
                {row.map((val, c) => {
                  const color = DICE_COLORS[val] ?? DICE_COLORS[0];
                  const rot = rotations?.[r]?.[c] ?? 0;
                  return (
                    <div
                      key={c}
                      onClick={() => cycleCell(r, c)}
                      title={`R${r + 1} C${c + 1} = ${val}`}
                      style={{
                        width: cellSize,
                        height: cellSize,
                        backgroundColor: color.bg,
                        cursor: "pointer",
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transform: (val === 2 || val === 3) && rot ? `rotate(${rot}deg)` : undefined,
                        fontSize: cellSize >= 12 ? cellSize * 0.55 : 0,
                        color: color.text,
                        fontWeight: "bold",
                        userSelect: "none",
                        boxSizing: "border-box",
                        borderRight: c % 10 === 9 ? "1px solid rgba(255,255,255,0.08)" : undefined,
                        borderBottom: r % 10 === 9 ? "1px solid rgba(255,255,255,0.08)" : undefined,
                      }}
                    >
                      {cellSize >= 12 ? val : ""}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Color legend */}
          <div style={{ display: "flex", gap: 12, marginTop: "0.75rem", flexWrap: "wrap" }}>
            {Object.entries(DICE_COLORS).map(([k, v]) => (
              <div key={k} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "0.75rem" }}>
                <div style={{ width: 14, height: 14, backgroundColor: v.bg, border: "1px solid #555", borderRadius: 2 }} />
                <span style={{ color: "#aaa" }}>{k}</span>
              </div>
            ))}
          </div>

          {/* Export */}
          <div style={{ marginTop: "1.5rem" }}>
            <button
              onClick={handleExport}
              disabled={exportStatus === "saving"}
              style={{
                padding: "0.5rem 1.25rem", backgroundColor: "#2980b9", color: "#fff",
                border: "none", borderRadius: 6, cursor: exportStatus === "saving" ? "not-allowed" : "pointer",
                opacity: exportStatus === "saving" ? 0.5 : 1,
                fontWeight: "bold", fontSize: "0.9rem",
              }}
            >
              {exportStatus === "saving" ? "Saving..." : "Export to Builder"}
            </button>

            {exportStatus === "done" && draftResult && (
              <div style={{ marginTop: "0.75rem", padding: "0.75rem 1rem", backgroundColor: "#1e3a1e", border: "1px solid #27ae60", borderRadius: 6, fontSize: "0.85rem" }}>
                <div style={{ color: "#27ae60", fontWeight: "bold", marginBottom: 4 }}>✓ Draft saved</div>
                <div style={{ color: "#aaa" }}>Name: <span style={{ color: "#eee" }}>{draftResult.name}</span></div>
                <div style={{ color: "#aaa" }}>Draft ID: <code style={{ color: "#f1c40f", userSelect: "all" }}>{draftResult.id}</code></div>
              </div>
            )}

            {exportStatus === "error" && (
              <p style={{ marginTop: "0.5rem", color: "#e74c3c", fontSize: "0.85rem" }}>Failed to save draft. Check console.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
