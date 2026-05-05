import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import ReactCrop, { type Crop, type PixelCrop, makeAspectCrop, convertToPixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

const BACKEND_URL = "https://dice-mosaic-backend.onrender.com";

const DICE_COLORS: Record<number, { bg: string; label: string; text: string }> = {
  0: { bg: '#111111', label: 'Black',  text: '#ffffff' },
  1: { bg: '#4a1080', label: 'Purple', text: '#ffffff' },
  2: { bg: '#1a3aaa', label: 'Blue',   text: '#ffffff' },
  3: { bg: '#6abf2a', label: 'Green',  text: '#000000' },
  4: { bg: '#f5c518', label: 'Yellow', text: '#000000' },
  5: { bg: '#e07830', label: 'Orange', text: '#000000' },
  6: { bg: '#f5f0e8', label: 'White',  text: '#000000' },
};

// ─── Pure orientation helpers (outside component, no side effects) ────────────

/**
 * Computes a Sobel gradient over one cell's image region and returns the
 * nearest-90° rotation (0 | 90 | 180 | 270) that aligns the die's sloped
 * edge with the light-to-dark direction.
 */
function computeCellGradientAngle(
  data: Uint8ClampedArray,
  imgWidth: number,
  imgHeight: number,
  r: number, c: number,
  cellW: number, cellH: number,
): number {
  // Clamp to valid pixel range (1..n-2 so neighbours always exist)
  const x0 = Math.max(1, Math.floor(c * cellW));
  const y0 = Math.max(1, Math.floor(r * cellH));
  const x1 = Math.min(imgWidth - 2, Math.floor((c + 1) * cellW));
  const y1 = Math.min(imgHeight - 2, Math.floor((r + 1) * cellH));

  const luma = (x: number, y: number) => {
    const i = (y * imgWidth + x) * 4;
    return data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
  };

  let gx = 0, gy = 0;
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      gx += luma(x + 1, y) - luma(x - 1, y);
      gy += luma(x, y + 1) - luma(x, y - 1);
    }
  }

  const angleDeg = Math.atan2(gy, gx) * 180 / Math.PI;
  return ((Math.round(angleDeg / 90) * 90) % 360 + 360) % 360;
}

/**
 * Writes alternating vertical (0°) / horizontal (90°) orientations for 6-cells
 * that appear in runs of length > 1.  Horizontal runs are processed first and
 * their cells are locked so overlapping vertical runs do not override them.
 */
function applyRunOrientations(grid: number[][], result: number[][]): void {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  // Track cells already assigned by a horizontal run
  const horizLocked: boolean[][] = Array.from({ length: rows }, () => new Array(cols).fill(false));

  // Horizontal runs
  for (let r = 0; r < rows; r++) {
    let start = -1;
    for (let c = 0; c <= cols; c++) {
      if (c < cols && grid[r][c] === 6) {
        if (start === -1) start = c;
      } else {
        const len = c - start;
        if (start !== -1 && len > 1) {
          for (let i = 0; i < len; i++) {
            // Even index in run → vertical (0°), odd → horizontal (90°)
            result[r][start + i] = i % 2 === 0 ? 0 : 90;
            horizLocked[r][start + i] = true;
          }
        }
        start = -1;
      }
    }
  }

  // Vertical runs (skip cells already oriented by a horizontal run)
  for (let c = 0; c < cols; c++) {
    let start = -1;
    for (let r = 0; r <= rows; r++) {
      if (r < rows && grid[r][c] === 6) {
        if (start === -1) start = r;
      } else {
        const len = r - start;
        if (start !== -1 && len > 1) {
          for (let i = 0; i < len; i++) {
            if (!horizLocked[start + i][c]) {
              result[start + i][c] = i % 2 === 0 ? 0 : 90;
            }
          }
        }
        start = -1;
      }
    }
  }
}

/**
 * Writes parity-based orientations for all 6-cells.
 * Indexing is 0-based:
 *   odd rows  (r % 2 === 1)                    → vertical  (0°)
 *   even rows (r % 2 === 0) + even col          → horizontal (90°)
 *   even rows + odd col                         → vertical  (0°)
 */
function applyParityOrientations(grid: number[][], result: number[][]): void {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] !== 6) continue;
      result[r][c] = (r % 2 === 0 && c % 2 === 0) ? 90 : 0;
    }
  }
}

// ─── DiceCell (copied from build.tsx) ────────────────────────────────────────

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

// ─── Toggle component (shared style) ─────────────────────────────────────────

function Toggle({ label, value, onChange, disabled }: {
  label: string; value: boolean; onChange: () => void; disabled?: boolean;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, opacity: disabled ? 0.45 : 1 }}>
      <label style={{ fontSize: "0.8rem", color: "#aaa" }}>{label}</label>
      <div
        onClick={disabled ? undefined : onChange}
        style={{
          width: 44, height: 24, borderRadius: 12,
          cursor: disabled ? "not-allowed" : "pointer",
          backgroundColor: value ? "#27ae60" : "#555",
          position: "relative", transition: "background 0.2s",
        }}
      >
        <div style={{
          position: "absolute", top: 3, left: value ? 23 : 3,
          width: 18, height: 18, borderRadius: "50%", backgroundColor: "#fff",
          transition: "left 0.2s",
        }} />
      </div>
      <span style={{ fontSize: "0.75rem", color: value ? "#27ae60" : "#666" }}>
        {value ? "ON" : "OFF"}
      </span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const ADMIN_PASSWORD = "Pipcasso!321";
const SESSION_KEY = "admin_build_authed";

export default function AdminBuildPage() {
  const router = useRouter();
  const [keyOk, setKeyOk] = useState(false);
  const [passwordOk, setPasswordOk] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState(false);

  const authed = keyOk && passwordOk;

  // URL key check
  useEffect(() => {
    if (!router.isReady) return;
    if (router.query.key === "pipcasso") {
      setKeyOk(true);
    } else {
      router.replace("/");
    }
  }, [router.isReady, router.query.key]);

  // Restore password auth from sessionStorage
  useEffect(() => {
    if (typeof sessionStorage !== "undefined" && sessionStorage.getItem(SESSION_KEY) === "1") {
      setPasswordOk(true);
    }
  }, []);

  const handlePasswordSubmit = () => {
    if (passwordInput === ADMIN_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, "1");
      setPasswordOk(true);
      setPasswordError(false);
    } else {
      setPasswordError(true);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [croppedFile, setCroppedFile] = useState<File | null>(null);
  const [croppedPreview, setCroppedPreview] = useState<string | null>(null);
  const [gridWidth, setGridWidth] = useState(60);
  const [gridHeight, setGridHeight] = useState(60);

  // ── Rotation toggles ───────────────────────────────────────────────────────
  // smartRotation: calls the backend /smart-rotation endpoint for val 2/3 cells
  const [smartRotation, setSmartRotation] = useState(false);
  // slopeGradient: client-side Sobel gradient rotation for val 2/3 cells
  const [slopeGradient, setSlopeGradient] = useState(false);
  // alternateSixes: alternates vertical/horizontal orientation in runs of 6s
  const [alternateSixes, setAlternateSixes] = useState(false);
  // paritySixes: row/column parity orientation for all 6-cells (overrides alternateSixes)
  const [paritySixes, setParitySixes] = useState(false);

  const [diceView, setDiceView] = useState(false);
  const [mosaicStyles, setMosaicStyles] = useState<{ style_id: number; grid: number[][] }[]>([]);
  const [selectedStyleId, setSelectedStyleId] = useState<number | null>(null);
  const [grid, setGrid] = useState<number[][] | null>(null);
  // rotations: rotation array returned by the backend smart-rotation endpoint (val 2/3)
  const [rotations, setRotations] = useState<number[][] | null>(null);
  // slopeRotations: client-computed gradient rotations (val 2/3, used when slopeGradient ON)
  const [slopeRotations, setSlopeRotations] = useState<number[][] | null>(null);
  const [gradientBusy, setGradientBusy] = useState(false);

  // Re-lock crop aspect ratio whenever grid dimensions change
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

  // ── Merged display orientations (used for rendering and export) ────────────
  // Priority for val 2/3: slopeGradient > smartRotation > 0
  // Priority for val 6:   paritySixes   > alternateSixes > 0
  const displayOrientations = useMemo<number[][] | null>(() => {
    if (!grid) return null;
    const rows = grid.length;
    const cols = grid[0]?.length ?? 0;
    if (!rows || !cols) return null;

    const result: number[][] = Array.from({ length: rows }, () => new Array(cols).fill(0));

    // Backend smart rotation for val 2/3
    if (smartRotation && rotations) {
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (grid[r][c] === 2 || grid[r][c] === 3) {
            result[r][c] = rotations[r]?.[c] ?? 0;
          }
        }
      }
    }

    // Client gradient rotation for val 2/3 (overrides smartRotation when both ON)
    if (slopeGradient && slopeRotations) {
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (grid[r][c] === 2 || grid[r][c] === 3) {
            result[r][c] = slopeRotations[r]?.[c] ?? 0;
          }
        }
      }
    }

    // Alternating-run orientation for val 6
    if (alternateSixes) {
      applyRunOrientations(grid, result);
    }

    // Parity orientation for val 6 (overrides alternateSixes when both ON)
    if (paritySixes) {
      applyParityOrientations(grid, result);
    }

    return result;
  }, [grid, smartRotation, rotations, slopeGradient, slopeRotations, alternateSixes, paritySixes]);

  // ── Gradient computation (Toggle 1) ───────────────────────────────────────
  const computeGradientRotations = async (currentGrid: number[][], previewUrl: string) => {
    setGradientBusy(true);
    try {
      const imgEl = new Image();
      await new Promise<void>((resolve, reject) => {
        imgEl.onload = () => resolve();
        imgEl.onerror = reject;
        imgEl.src = previewUrl;
      });

      const canvas = document.createElement("canvas");
      canvas.width = imgEl.naturalWidth;
      canvas.height = imgEl.naturalHeight;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(imgEl, 0, 0);
      const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);

      const rows = currentGrid.length;
      const cols = currentGrid[0]?.length ?? 0;
      const cellW = canvas.width / cols;
      const cellH = canvas.height / rows;

      const result = currentGrid.map((row, r) =>
        row.map((_val, c) =>
          computeCellGradientAngle(data, canvas.width, canvas.height, r, c, cellW, cellH)
        )
      );

      setSlopeRotations(result);
    } catch {
      // Non-fatal — orientation falls back to 0
    } finally {
      setGradientBusy(false);
    }
  };

  // Re-run gradient computation whenever Toggle 1 is enabled (or turned off)
  useEffect(() => {
    if (!slopeGradient) {
      setSlopeRotations(null);
      return;
    }
    if (grid && croppedPreview) {
      computeGradientRotations(grid, croppedPreview);
    }
  // Only re-trigger when the toggle itself changes — image/grid changes are
  // handled via handleSelectStyle so we don't recompute on every cell edit.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slopeGradient]);

  // ── File / crop handlers ──────────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setImageFile(file);
    setGrid(null);
    setRotations(null);
    setSlopeRotations(null);
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

  // ── Generate ──────────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!imageFile) return;
    setStatus("generating");
    setErrorMsg("");
    setGrid(null);
    setRotations(null);
    setSlopeRotations(null);
    setMosaicStyles([]);
    setSelectedStyleId(null);
    setDraftResult(null);
    setExportStatus("idle");

    try {
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
      setStatus("idle");
    } catch (err: any) {
      setErrorMsg(err.message ?? "Unknown error");
      setStatus("error");
    }
  };

  // ── Style selection ───────────────────────────────────────────────────────
  const handleSelectStyle = async (styleId: number) => {
    const chosen = mosaicStyles.find((s) => s.style_id === styleId);
    if (!chosen) return;
    setSelectedStyleId(styleId);
    setGrid(chosen.grid);
    setRotations(null);
    setSlopeRotations(null);
    setDraftResult(null);
    setExportStatus("idle");

    // Backend smart rotation
    if (smartRotation) {
      const fileToSend = croppedFile ?? imageFile;
      if (fileToSend) {
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
          // Non-fatal
        }
      }
    }

    // Client-side gradient rotation (Toggle 1)
    if (slopeGradient) {
      const previewUrl = croppedPreview ?? imagePreview;
      if (previewUrl) {
        computeGradientRotations(chosen.grid, previewUrl);
      }
    }
  };

  // ── Cell editing ──────────────────────────────────────────────────────────
  const cycleCell = (r: number, c: number) => {
    if (!grid) return;
    setGrid((prev) => {
      if (!prev) return prev;
      const next = prev.map((row) => [...row]);
      next[r][c] = (next[r][c] + 1) % 7;
      return next;
    });
  };

  // ── Export ────────────────────────────────────────────────────────────────
  const handleExport = async () => {
    if (!grid) return;
    setExportStatus("saving");
    setDraftResult(null);
    try {
      // Include the merged orientation data so /build can apply rotations
      const payload = { grid, rotations: displayOrientations };
      console.log("[admin-build] export payload: grid dimensions", grid.length, "x", grid[0]?.length, "| JSON size", JSON.stringify(payload).length, "bytes");
      const res = await fetch("/api/admin-save-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      console.log("[admin-build] export response status:", res.status, "| body:", data);
      if (!res.ok) throw new Error(data?.detail ?? data?.error ?? `HTTP ${res.status}`);
      setDraftResult({ id: data.id, name: data.name });
      setExportStatus("done");
    } catch (err: any) {
      console.error("[admin-build] export failed:", err);
      setExportStatus("error");
      setErrorMsg(err.message ?? "Unknown error");
    }
  };

  const cellSize = grid
    ? Math.max(6, Math.min(14, Math.floor(900 / (grid[0]?.length ?? 60))))
    : 10;

  if (!keyOk) return null;

  if (!passwordOk) {
    return (
      <div style={{
        minHeight: "100vh", backgroundColor: "#1a1a1a", display: "flex",
        alignItems: "center", justifyContent: "center", fontFamily: "monospace",
      }}>
        <div style={{
          backgroundColor: "#222", border: "1px solid #444", borderRadius: 8,
          padding: "2rem 2.5rem", width: 320, textAlign: "center",
        }}>
          <div style={{ fontSize: "1.1rem", color: "#f1c40f", fontWeight: "bold", marginBottom: "1.5rem" }}>
            🔒 Admin Build Mode
          </div>
          <input
            type="password"
            value={passwordInput}
            onChange={(e) => { setPasswordInput(e.target.value); setPasswordError(false); }}
            onKeyDown={(e) => e.key === "Enter" && handlePasswordSubmit()}
            placeholder="Password"
            autoFocus
            style={{
              width: "100%", padding: "0.6rem 0.75rem", borderRadius: 6,
              border: passwordError ? "1px solid #e74c3c" : "1px solid #555",
              backgroundColor: "#333", color: "#eee", fontSize: "1rem",
              boxSizing: "border-box", marginBottom: "0.75rem",
            }}
          />
          {passwordError && (
            <div style={{ color: "#e74c3c", fontSize: "0.82rem", marginBottom: "0.75rem" }}>
              Incorrect password
            </div>
          )}
          <button
            onClick={handlePasswordSubmit}
            style={{
              width: "100%", padding: "0.6rem", backgroundColor: "#e74c3c", color: "#fff",
              border: "none", borderRadius: 6, fontWeight: "bold", fontSize: "0.95rem",
              cursor: "pointer",
            }}
          >
            Enter
          </button>
        </div>
      </div>
    );
  }

  // Suppress unused var warning — authed is the combined gate used above
  void authed;

  return (
    <div style={{ fontFamily: "monospace", padding: "1.5rem", backgroundColor: "#1a1a1a", minHeight: "100vh", color: "#eee" }}>
      <h1 style={{ margin: "0 0 1.5rem", fontSize: "1.3rem", color: "#f1c40f" }}>🔧 Admin Build Mode</h1>

      {/* Controls */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "flex-end", marginBottom: "1rem" }}>

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

      {/* Rotation / Orientation toggles — all grouped together */}
      <div style={{
        display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center",
        marginBottom: "1.5rem", padding: "0.75rem 1rem",
        backgroundColor: "#222", border: "1px solid #444", borderRadius: 8,
      }}>
        <span style={{ fontSize: "0.75rem", color: "#666", marginRight: 4, letterSpacing: 1, textTransform: "uppercase" }}>
          Orientation
        </span>

        <Toggle
          label="Smart Rotation"
          value={smartRotation}
          onChange={() => setSmartRotation((v) => !v)}
        />

        <div style={{ width: 1, height: 24, backgroundColor: "#444" }} />

        <Toggle
          label="Slope 2s & 3s by gradient"
          value={slopeGradient}
          onChange={() => setSlopeGradient((v) => !v)}
        />
        {gradientBusy && (
          <span style={{ fontSize: "0.72rem", color: "#f1c40f" }}>computing gradients…</span>
        )}

        <div style={{ width: 1, height: 24, backgroundColor: "#444" }} />

        <Toggle
          label="Alternate 6s in runs"
          value={alternateSixes}
          onChange={() => setAlternateSixes((v) => !v)}
        />

        <Toggle
          label="6s by row parity"
          value={paritySixes}
          onChange={() => setParitySixes((v) => !v)}
        />
        {paritySixes && alternateSixes && (
          <span style={{ fontSize: "0.72rem", color: "#e07830" }}>parity overrides runs</span>
        )}
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
            {slopeGradient && <span style={{ color: "#3498db", marginLeft: 8 }}>(gradient rotation will apply on selection)</span>}
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
              {rotations && smartRotation && <span style={{ color: "#27ae60", marginLeft: 10 }}>✓ smart rotation</span>}
              {slopeRotations && slopeGradient && <span style={{ color: "#3498db", marginLeft: 10 }}>✓ gradient rotation</span>}
              {alternateSixes && !paritySixes && <span style={{ color: "#9b59b6", marginLeft: 10 }}>✓ alternate 6s</span>}
              {paritySixes && <span style={{ color: "#e07830", marginLeft: 10 }}>✓ parity 6s</span>}
            </span>

            {/* Dice View / Number View toggle */}
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
                  const orient = displayOrientations?.[r]?.[c] ?? 0;
                  return (
                    <div
                      key={c}
                      title={`R${r + 1} C${c + 1} = ${val}${orient ? ` rot${orient}°` : ""}`}
                      style={{
                        flexShrink: 0,
                        transform: orient !== 0 ? `rotate(${orient}deg)` : undefined,
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
                <div style={{ color: "#27ae60", fontWeight: "bold", marginBottom: 6 }}>✓ Draft saved to build mode</div>
                <div style={{ color: "#aaa", marginBottom: 4 }}>Name: <span style={{ color: "#eee" }}>{draftResult.name}</span></div>
                <div style={{ color: "#aaa", marginBottom: 8 }}>
                  Build mode code: <code style={{ color: "#f1c40f", fontSize: "1.1rem", userSelect: "all", letterSpacing: 2 }}>{draftResult.id}</code>
                </div>
                <div style={{ color: "#555", fontSize: "0.75rem" }}>
                  Load at: <span style={{ color: "#888" }}>/build?code={draftResult.id}</span>
                </div>
              </div>
            )}

            {exportStatus === "error" && (
              <p style={{ marginTop: "0.5rem", color: "#e74c3c", fontSize: "0.85rem" }}>
                Failed to save draft: {errorMsg || "check console for details"}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
