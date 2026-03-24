import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/router";
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop, convertToPixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

const BACKEND_URL = "https://dice-mosaic-backend.onrender.com";

const DICE_COLORS: Record<number, { bg: string; label: string; text: string }> = {
  0: { bg: '#111111', label: 'Black',  text: '#ffffff' },
  1: { bg: '#e74c3c', label: 'Red',    text: '#ffffff' },
  2: { bg: '#2980b9', label: 'Blue',   text: '#ffffff' },
  3: { bg: '#e67e22', label: 'Orange', text: '#ffffff' },
  4: { bg: '#27ae60', label: 'Green',  text: '#ffffff' },
  5: { bg: '#f1c40f', label: 'Yellow', text: '#000000' },
  6: { bg: '#ffffff',  label: 'White',  text: '#000000' },
};

// Copied exactly from build.tsx
function DiceCell({ val, size, diceView, border, boxShadow, animation, opacity, onClick, cursor }: {
  val: number; size: number; diceView: boolean;
  border?: string; boxShadow?: string; animation?: string;
  opacity?: number; onClick?: () => void; cursor?: string;
}) {
  const color = DICE_COLORS[val] ?? DICE_COLORS[0];
  const fontSize = Math.max(7, Math.floor(size * 0.52));
  return (
    <div
      onClick={onClick}
      style={{
        width: size, height: size, flexShrink: 0,
        backgroundColor: diceView ? '#1a1a1a' : color.bg,
        border: border ?? 'none',
        boxSizing: 'border-box', position: 'relative',
        zIndex: boxShadow ? 2 : 1,
        boxShadow: boxShadow ?? 'none',
        animation: animation ?? 'none',
        opacity: opacity ?? 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: cursor ?? 'default',
        borderRadius: size <= 14 ? 2 : 4,
      }}
    >
      {size >= 8 && (diceView ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={`/dice/dice_${val}.png`} alt={String(val)}
          style={{ width: '95%', height: '95%', objectFit: 'contain', pointerEvents: 'none', userSelect: 'none' }} />
      ) : (
        <span style={{ fontSize, color: color.text, fontWeight: 'bold', lineHeight: 1, userSelect: 'none', pointerEvents: 'none' }}>
          {val}
        </span>
      ))}
    </div>
  );
}

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
  const imgRef = useRef<HTMLImageElement>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [croppedFile, setCroppedFile] = useState<File | null>(null);
  const [croppedPreview, setCroppedPreview] = useState<string | null>(null);
  const [gridWidth, setGridWidth] = useState(60);
  const [gridHeight, setGridHeight] = useState(60);
  const [smartRotation, setSmartRotation] = useState(false);
  const [diceView, setDiceView] = useState(false);
  const [mosaicStyles, setMosaicStyles] = useState<{ style_id: number; grid: number[][] }[]>([]);
  const [selectedStyleId, setSelectedStyleId] = useState<number | null>(null);
  const [grid, setGrid] = useState<number[][] | null>(null);
  const [rotations, setRotations] = useState<number[][] | null>(null);

  // Re-lock crop aspect ratio whenever grid dimensions change (and image is loaded, crop not yet confirmed)
  useEffect(() => {
    const img = imgRef.current;
    if (!img || !imagePreview || croppedPreview || img.width === 0) return;
    const aspect = gridWidth / gridHeight;
    setCrop(makeAspectCrop({ unit: "%", width: 80 }, aspect, img.width, img.height));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gridWidth, gridHeight]);
  const [status, setStatus] = useState<"idle" | "generating" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [exportStatus, setExportStatus] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [draftResult, setDraftResult] = useState<{ id: string; name: string } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setImageFile(file);
    setGrid(null);
    setRotations(null);
    setCrop(undefined);
    setCroppedFile(null);
    setCroppedPreview(null);
    setImagePreview(file ? URL.createObjectURL(file) : null);
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    const aspect = gridWidth / gridHeight;
    setCrop(makeAspectCrop({ unit: "%", width: 80 }, aspect, width, height));
  };

  const applyCrop = () => {
    const img = imgRef.current;
    if (!img || !crop) return;
    const pixelCrop: PixelCrop = convertToPixelCrop(crop, img.width, img.height);
    const canvas = document.createElement("canvas");
    const scaleX = img.naturalWidth / img.width;
    const scaleY = img.naturalHeight / img.height;
    canvas.width = Math.round(pixelCrop.width * scaleX);
    canvas.height = Math.round(pixelCrop.height * scaleY);
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(
      img,
      pixelCrop.x * scaleX,
      pixelCrop.y * scaleY,
      pixelCrop.width * scaleX,
      pixelCrop.height * scaleY,
      0, 0,
      canvas.width,
      canvas.height,
    );
    canvas.toBlob((blob) => {
      if (!blob) return;
      setCroppedFile(new File([blob], "cropped.png", { type: "image/png" }));
      setCroppedPreview(URL.createObjectURL(blob));
    }, "image/png");
  };

  const resetCrop = () => {
    setCroppedFile(null);
    setCroppedPreview(null);
    setCrop(undefined);
  };

  const handleGenerate = async () => {
    if (!imageFile) return;
    setStatus("generating");
    setErrorMsg("");
    setGrid(null);
    setRotations(null);
    setMosaicStyles([]);
    setSelectedStyleId(null);
    setDraftResult(null);
    setExportStatus("idle");

    try {
      // Step 1: analyze — use cropped version if available
      const fileToSend = croppedFile ?? imageFile;
      const formData = new FormData();
      formData.append("file", fileToSend, "upload.png");
      formData.append("grid_width", gridWidth.toString());
      formData.append("grid_height", gridHeight.toString());

      const analyzeRes = await fetch(`${BACKEND_URL}/analyze`, {
        method: "POST",
        body: formData,
        signal: AbortSignal.timeout(120000),
      });

      if (!analyzeRes.ok) throw new Error(`Analyze failed: ${analyzeRes.status}`);
      const analyzeData = await analyzeRes.json();
      const styles: { style_id: number; grid: number[][]; full_grid?: number[][] }[] = analyzeData.styles;
      setMosaicStyles(styles.map((s) => ({ style_id: s.style_id, grid: s.full_grid ?? s.grid })));
      // Smart rotation runs when the user selects a style (see handleSelectStyle)

      setStatus("idle");
    } catch (err: any) {
      setErrorMsg(err.message ?? "Unknown error");
      setStatus("error");
    }
  };

  const handleSelectStyle = async (styleId: number) => {
    const chosen = mosaicStyles.find((s) => s.style_id === styleId);
    if (!chosen) return;
    setSelectedStyleId(styleId);
    setGrid(chosen.grid);
    setRotations(null);
    setDraftResult(null);
    setExportStatus("idle");

    if (smartRotation) {
      const fileToSend = croppedFile ?? imageFile;
      if (!fileToSend) return;
      try {
        const rotForm = new FormData();
        rotForm.append("file", fileToSend, "upload.png");
        rotForm.append("grid_data", JSON.stringify(chosen.grid));
        const rotRes = await fetch(`${BACKEND_URL}/smart-rotation`, {
          method: "POST",
          body: rotForm,
          signal: AbortSignal.timeout(60000),
        });
        if (rotRes.ok) setRotations((await rotRes.json()).rotations);
      } catch {
        // Non-fatal — grid still loads without rotation
      }
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

      {/* Crop UI */}
      {imagePreview && !croppedPreview && (
        <div style={{ marginBottom: "1rem" }}>
          <div style={{ fontSize: "0.8rem", color: "#aaa", marginBottom: "0.5rem" }}>
            Crop box is locked to <strong style={{ color: "#eee" }}>{gridWidth}:{gridHeight}</strong> ratio (matches grid dimensions).
            Resize or drag, then click <strong style={{ color: "#eee" }}>Crop</strong> to confirm.
          </div>
          <ReactCrop
            crop={crop}
            onChange={(c) => setCrop(c)}
            aspect={gridWidth / gridHeight}
            style={{ maxWidth: 600, display: "block" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={imagePreview}
              alt="upload"
              onLoad={handleImageLoad}
              style={{ maxWidth: 600, maxHeight: 480, display: "block" }}
            />
          </ReactCrop>
          <div style={{ marginTop: "0.6rem", display: "flex", gap: 8 }}>
            <button
              onClick={applyCrop}
              disabled={!crop}
              style={{
                padding: "0.4rem 1rem", backgroundColor: "#27ae60", color: "#fff",
                border: "none", borderRadius: 6, cursor: crop ? "pointer" : "not-allowed",
                opacity: crop ? 1 : 0.5, fontWeight: "bold", fontSize: "0.85rem",
              }}
            >
              Crop
            </button>
          </div>
        </div>
      )}

      {/* Cropped preview */}
      {croppedPreview && (
        <div style={{ marginBottom: "1rem", display: "flex", alignItems: "flex-start", gap: 12 }}>
          <div>
            <div style={{ fontSize: "0.75rem", color: "#aaa", marginBottom: 4 }}>Cropped image (will be sent to backend)</div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={croppedPreview} alt="cropped"
              style={{ maxHeight: 160, maxWidth: 320, objectFit: "contain", borderRadius: 6, border: "1px solid #27ae60", display: "block" }} />
          </div>
          <button
            onClick={resetCrop}
            style={{
              marginTop: 20, padding: "0.35rem 0.85rem", backgroundColor: "#444", color: "#eee",
              border: "1px solid #666", borderRadius: 6, cursor: "pointer", fontSize: "0.8rem",
            }}
          >
            Reset Crop
          </button>
        </div>
      )}

      {/* Error */}
      {status === "error" && (
        <p style={{ color: "#e74c3c", marginBottom: "1rem", fontSize: "0.85rem" }}>Error: {errorMsg}</p>
      )}

      {/* Style picker */}
      {mosaicStyles.length > 0 && (
        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{ fontSize: "0.85rem", color: "#aaa", marginBottom: "0.75rem" }}>
            {mosaicStyles.length} styles generated — click one to load it into the editor
            {smartRotation && <span style={{ color: "#27ae60", marginLeft: 8 }}>(smart rotation will apply on selection)</span>}
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))",
            gap: "1rem",
          }}>
            {mosaicStyles.map((s) => {
              const cols = s.grid[0]?.length ?? 1;
              const rows = s.grid.length;
              const isSelected = selectedStyleId === s.style_id;
              return (
                <div
                  key={s.style_id}
                  onClick={() => handleSelectStyle(s.style_id)}
                  style={{
                    cursor: "pointer",
                    border: isSelected ? "2px solid #e74c3c" : "2px solid #444",
                    borderRadius: 6,
                    padding: 6,
                    backgroundColor: isSelected ? "#2a1a1a" : "#222",
                    transition: "border 0.15s",
                  }}
                >
                  {/* Dice-image preview — fills the card width, preserves aspect ratio */}
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: `repeat(${cols}, 1fr)`,
                    aspectRatio: `${cols} / ${rows}`,
                    width: "100%",
                    lineHeight: 0,
                    overflow: "hidden",
                    borderRadius: 3,
                  }}>
                    {s.grid.map((row, r) =>
                      row.map((val, c) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={`${r}-${c}`}
                          src={`/dice/dice_${val}.png`}
                          alt=""
                          style={{ width: "100%", height: "100%", display: "block", objectFit: "cover" }}
                        />
                      ))
                    )}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: isSelected ? "#e74c3c" : "#888", textAlign: "center", marginTop: 5 }}>
                    Style #{s.style_id}{isSelected ? " ✓ selected" : ""}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Grid */}
      {grid && (
        <>
          {/* Grid toolbar */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: "0.75rem", flexWrap: "wrap" }}>
            <span style={{ fontSize: "0.8rem", color: "#aaa" }}>
              {grid.length} × {grid[0]?.length} — click any cell to cycle (0–6)
              {rotations && <span style={{ color: "#27ae60", marginLeft: 10 }}>✓ smart rotation</span>}
            </span>

            {/* Dice View / Number View toggle — same as build.tsx */}
            <button
              onClick={() => setDiceView((v) => !v)}
              style={{
                padding: "0.35rem 0.85rem",
                backgroundColor: "#6B3FA0",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: "0.8rem",
              }}
            >
              {diceView ? "Switch to Number View" : "🎲 Switch to Dice View"}
            </button>
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
                  const rot = rotations?.[r]?.[c] ?? 0;
                  const needsRotation = (val === 2 || val === 3) && rot !== 0;
                  return (
                    // Rotation wrapper — keeps DiceCell layout intact while applying transform
                    <div
                      key={c}
                      title={`R${r + 1} C${c + 1} = ${val}`}
                      style={{
                        flexShrink: 0,
                        transform: needsRotation ? `rotate(${rot}deg)` : undefined,
                      }}
                    >
                      <DiceCell
                        val={val}
                        size={cellSize}
                        diceView={diceView}
                        onClick={() => cycleCell(r, c)}
                        cursor="pointer"
                        border={(!diceView && val === 6) ? "1px solid #444" : undefined}
                      />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Color legend (number view only) */}
          {!diceView && (
            <div style={{ display: "flex", gap: 12, marginTop: "0.75rem", flexWrap: "wrap" }}>
              {Object.entries(DICE_COLORS).map(([k, v]) => (
                <div key={k} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "0.75rem" }}>
                  <div style={{ width: 14, height: 14, backgroundColor: v.bg, border: "1px solid #555", borderRadius: 2 }} />
                  <span style={{ color: "#aaa" }}>{k} {v.label}</span>
                </div>
              ))}
            </div>
          )}

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
