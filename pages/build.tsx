import { useEffect, useState, useCallback, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

const DICE_COLORS: Record<number, { bg: string; label: string; text: string }> = {
  0: { bg: '#111111', label: 'Black',  text: '#ffffff' },
  1: { bg: '#e74c3c', label: 'Red',    text: '#ffffff' },
  2: { bg: '#2980b9', label: 'Blue',   text: '#ffffff' },
  3: { bg: '#e67e22', label: 'Orange', text: '#ffffff' },
  4: { bg: '#27ae60', label: 'Green',  text: '#ffffff' },
  5: { bg: '#f1c40f', label: 'Yellow', text: '#000000' },
  6: { bg: '#ffffff', label: 'White',  text: '#000000' },
};

interface ProjectData {
  projectName: string;
  rows: number;
  cols: number;
  grid: number[][];
}

const BG      = '#F5EFE6';
const PANEL   = '#FFFFFF';
const TOPBAR  = '#0a0a0a';
const ACCENT  = '#E8412A';
const ACCENT2 = '#F5A623';
const ACCENT3 = '#2A7F7F';
const TEXT    = '#1a1a1a';
const MUTED   = '#666666';
const BORDER  = '#E0D8CE';
const PURPLE  = '#6B3FA0';

// Shared cell renderer used in both layouts
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

const WINDOW_SIZE = 20;

export default function BuildPage() {
  const router = useRouter();
  const [screen, setScreen]             = useState<'login' | 'build'>('login');
  const [code, setCode]                 = useState('');
  const [error, setError]               = useState('');
  const [loading, setLoading]           = useState(false);
  const [project, setProject]           = useState<ProjectData | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cellSize, setCellSize]         = useState(8);
  const [jumpRow, setJumpRow]           = useState('');
  const [diceView, setDiceView]         = useState(false);
  const [isMobile, setIsMobile]         = useState(false);
  const gridWrapperRef = useRef<HTMLDivElement>(null);
  const miniMapRef     = useRef<HTMLCanvasElement>(null);

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Load / save dice view preference
  useEffect(() => {
    const saved = localStorage.getItem('buildMode_diceView');
    if (saved === 'true') setDiceView(true);
  }, []);
  const toggleDiceView = () => {
    setDiceView(v => {
      localStorage.setItem('buildMode_diceView', String(!v));
      return !v;
    });
  };

  // Pre-fill code from ?code= query param
  useEffect(() => {
    if (router.isReady && router.query.code) {
      setCode(String(router.query.code).toUpperCase());
    }
  }, [router.isReady, router.query.code]);

  const totalCells = project ? project.rows * project.cols : 0;
  const currentRow = project ? Math.floor(currentIndex / project.cols) : 0;
  const currentCol = project ? currentIndex % project.cols : 0;
  const currentVal = project ? (project.grid[currentRow]?.[currentCol] ?? 0) : 0;

  const handleLogin = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/get-grid?code=${code.trim().toUpperCase()}`);
      if (res.status === 403) {
        setError('__403__');
        return;
      }
      if (!res.ok) { setError('Access code not found. Please check and try again.'); return; }
      const data = await res.json();
      setProject(data);
      setCurrentIndex(0);
      setScreen('build');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const advance = useCallback(() => {
    setCurrentIndex(i => Math.min(i + 1, totalCells - 1));
  }, [totalCells]);

  const goBack = useCallback(() => {
    setCurrentIndex(i => Math.max(i - 1, 0));
  }, []);

  useEffect(() => {
    if (screen !== 'build') return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'ArrowRight') { e.preventDefault(); advance(); }
      if (e.key === 'ArrowLeft')                    { e.preventDefault(); goBack(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [screen, advance, goBack]);

  // Resize observer: on mobile fit window cols; on desktop fit both dimensions
  useEffect(() => {
    if (!project) return;
    const el = gridWrapperRef.current;
    if (!el) return;
    const compute = () => {
      if (isMobile) {
        const wc = Math.min(WINDOW_SIZE, project.cols);
        setCellSize(Math.max(3, Math.floor(el.clientWidth / wc)));
      } else {
        const byW = Math.floor(el.clientWidth / project.cols);
        const byH = Math.floor(el.clientHeight / project.rows);
        setCellSize(Math.max(10, Math.min(byW, byH)));
      }
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, [project, isMobile]);

  // ── Window bounds (mobile zoomed view) ─────────────────────────────────
  const windowCols = project ? Math.min(WINDOW_SIZE, project.cols) : WINDOW_SIZE;
  const windowRows = project ? Math.min(WINDOW_SIZE, project.rows) : WINDOW_SIZE;
  const startCol = project ? Math.max(0, Math.min(currentCol - Math.floor(windowCols / 2), project.cols - windowCols)) : 0;
  const startRow = project ? Math.max(0, Math.min(currentRow - Math.floor(windowRows / 2), project.rows - windowRows)) : 0;
  const endCol = startCol + windowCols - 1;
  const endRow = startRow + windowRows - 1;

  // Draw mini-map whenever window position or project changes
  useEffect(() => {
    if (!project || !isMobile) return;
    const canvas = miniMapRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const maxSize = 80;
    const W = project.cols >= project.rows ? maxSize : Math.round(maxSize * project.cols / project.rows);
    const H = project.rows >= project.cols ? maxSize : Math.round(maxSize * project.rows / project.cols);
    canvas.width = W;
    canvas.height = H;
    const cellW = W / project.cols;
    const cellH = H / project.rows;
    for (let r = 0; r < project.rows; r++) {
      for (let c = 0; c < project.cols; c++) {
        const val = project.grid[r]?.[c] ?? 0;
        const hex = DICE_COLORS[val]?.bg ?? '#111111';
        // Convert hex color to greyscale using luminance weights
        const rv = parseInt(hex.slice(1, 3), 16);
        const gv = parseInt(hex.slice(3, 5), 16);
        const bv = parseInt(hex.slice(5, 7), 16);
        const luma = Math.round(0.299 * rv + 0.587 * gv + 0.114 * bv);
        ctx.fillStyle = `rgb(${luma},${luma},${luma})`;
        ctx.fillRect(c * cellW, r * cellH, cellW, cellH);
      }
    }
    // Viewport rectangle — bright orange so it stands out
    ctx.strokeStyle = ACCENT;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(startCol * cellW, startRow * cellH, windowCols * cellW, windowRows * cellH);
  }, [project, isMobile, startRow, startCol, windowCols, windowRows]);

  // ── Login screen ───────────────────────────────────────────────────────
  if (screen === 'login') {
    return (
      <>
        <Head><title>Build Mode — Pipcasso</title></Head>
        <div style={{ minHeight: '100vh', backgroundColor: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
          <div style={{ backgroundColor: PANEL, borderRadius: 16, padding: '3rem', maxWidth: 420, width: '100%', margin: '1rem', boxShadow: '0 4px 24px rgba(0,0,0,0.10)', border: `1px solid ${BORDER}` }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{ fontSize: 48, marginBottom: 8 }}>🎲</div>
              <h1 style={{ color: ACCENT, fontSize: '1.8rem', margin: 0, fontWeight: 'bold' }}>Build Mode</h1>
              <p style={{ color: MUTED, marginTop: 8, fontSize: '0.9rem' }}>Enter your access code to load your dice map</p>
            </div>
            <input
              type="text" placeholder="Access code (e.g. ABC123)"
              value={code} onChange={e => setCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              style={{ width: '100%', padding: '0.8rem', borderRadius: 8, border: `1px solid ${BORDER}`, backgroundColor: BG, color: TEXT, fontSize: '1.1rem', textAlign: 'center', letterSpacing: 4, marginBottom: '1rem', boxSizing: 'border-box', fontFamily: 'monospace' }}
            />
            {error === '__403__' ? (
              <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#FFF8F0', border: `1px solid ${BORDER}`, borderRadius: 8, borderLeft: `4px solid ${ACCENT}` }}>
                <p style={{ color: TEXT, fontWeight: 700, fontSize: '0.9rem', margin: '0 0 0.4rem' }}>Build Mode not available for this purchase</p>
                <p style={{ color: MUTED, fontSize: '0.82rem', margin: 0, lineHeight: 1.5 }}>
                  Build Mode is only available for DIY Dice Map purchases. Print orders and image downloads don&apos;t include Build Mode access.
                </p>
              </div>
            ) : error ? (
              <p style={{ color: ACCENT, marginBottom: '1rem', fontSize: '0.85rem', textAlign: 'center' }}>{error}</p>
            ) : null}
            <button onClick={handleLogin} disabled={loading}
              style={{ width: '100%', padding: '0.8rem', backgroundColor: ACCENT, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 'bold', fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Loading...' : 'Start Building 🎲'}
            </button>
          </div>
        </div>
      </>
    );
  }

  if (!project) return null;

  const progress = totalCells > 0 ? (currentIndex / totalCells) * 100 : 0;

  // Next 8 cells
  const nextUp = Array.from({ length: 8 }, (_, i) => {
    const idx = currentIndex + 1 + i;
    if (idx >= totalCells) return null;
    const r   = Math.floor(idx / project.cols);
    const col = idx % project.cols;
    return { val: project.grid[r]?.[col] ?? 0, r, col };
  }).filter(Boolean) as { val: number; r: number; col: number }[];

  // Shared: Jump to row action
  const doJump = () => {
    const row = Math.max(1, Math.min(project.rows, parseInt(jumpRow) || 1));
    setCurrentIndex((row - 1) * project.cols);
    setJumpRow('');
  };

  // Shared: grid renderer
  const gridEl = (
    <div ref={gridWrapperRef} style={{ flex: 1, overflow: 'auto', minHeight: 0, width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
      <div style={{ lineHeight: 0, display: 'block' }}>
        {project.grid.map((row, r) => {
          const isCurrentRow = r === currentRow;
          return (
            <div key={r} style={{
              display: 'flex',
              backgroundColor: isCurrentRow ? 'rgba(232,65,42,0.07)' : 'transparent',
              borderTop: isCurrentRow && currentRow > 0 ? '1px solid rgba(196,103,58,0.6)' : 'none',
            }}>
              {row.map((val, col) => {
                const flatIdx       = r * project.cols + col;
                const isCurrentCell = isCurrentRow && col === currentCol;
                const isDoneCell    = flatIdx < currentIndex;
                return (
                  <DiceCell
                    key={col}
                    val={val} size={cellSize} diceView={diceView}
                    opacity={isDoneCell ? 0.45 : 1}
                    border={isCurrentCell ? `2px solid ${ACCENT}` : (!diceView && val === 6) ? `1px solid ${BORDER}` : undefined}
                    boxShadow={undefined}
                    animation={isCurrentCell ? 'cellPulse 1.2s ease-in-out infinite' : undefined}
                    onClick={() => setCurrentIndex(flatIdx)}
                    cursor="pointer"
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );

  // ── MOBILE LAYOUT ───────────────────────────────────────────────────────
  if (isMobile) {
    const BOTTOM_BAR_H = 64;
    const TOGGLE_H     = 48;
    return (
      <>
        <Head><title>Build Mode — {project.projectName}</title></Head>
        <style>{`
          @keyframes cellPulse {
            0%, 100% { box-shadow: 0 0 0 2px ${ACCENT}, 0 0 8px 2px ${ACCENT}; }
            50%       { box-shadow: 0 0 0 4px ${ACCENT}, 0 0 16px 4px ${ACCENT}; }
          }
        `}</style>

        <div style={{ height: '100dvh', backgroundColor: BG, fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Top bar — compact */}
          <div style={{ backgroundColor: TOPBAR, padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
            <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '0.9rem', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>🎲 Build Mode</span>
            <div style={{ flex: 1, height: 5, backgroundColor: '#333', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress}%`, backgroundColor: ACCENT, borderRadius: 3, transition: 'width 0.1s ease' }} />
            </div>
            <span style={{ color: ACCENT2, fontSize: '0.8rem', fontWeight: 'bold', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>{progress.toFixed(1)}%</span>
          </div>

          {/* Current dice — compact row */}
          <div style={{ backgroundColor: PANEL, padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', gap: 12, borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
            <DiceCell val={currentVal} size={56} diceView={diceView}
              border={`2px solid ${ACCENT}`}
              boxShadow={`0 0 0 2px ${ACCENT}, 0 0 10px 2px ${ACCENT}`}
              animation="cellPulse 1.2s ease-in-out infinite"
            />
            <div style={{ flex: 1 }}>
              <div style={{ color: TEXT, fontSize: '0.85rem', fontWeight: 700 }}>Row {currentRow + 1}, Col {currentCol + 1}</div>
              <div style={{ color: MUTED, fontSize: '0.7rem', marginTop: 2 }}>#{currentIndex + 1} of {totalCells}</div>
            </div>
          </div>

          {/* Next Up — horizontal scroll */}
          <div style={{ backgroundColor: BG, padding: '0.5rem 1rem', flexShrink: 0, borderBottom: `1px solid ${BORDER}` }}>
            <div style={{ color: MUTED, fontSize: '0.58rem', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 5, fontWeight: 600 }}>Next Up</div>
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 2 } as React.CSSProperties}>
              {nextUp.map(({ val, r, col }, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, flexShrink: 0 }}>
                  <DiceCell val={val} size={36} diceView={diceView}
                    border={(!diceView && val === 6) ? `1px solid ${BORDER}` : undefined}
                  />
                  <span style={{ color: MUTED, fontSize: '0.55rem', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>R{r + 1} C{col + 1}</span>
                </div>
              ))}
              {nextUp.length === 0 && <span style={{ color: MUTED, fontSize: '0.8rem', alignSelf: 'center' }}>Last cell!</span>}
            </div>
          </div>

          {/* Zoomed window — fills remaining space */}
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', paddingBottom: BOTTOM_BAR_H + TOGGLE_H, width: '100%', position: 'relative' }}>
            {/* Range label + mini-map row */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '0.3rem 1rem', flexShrink: 0, gap: 8 }}>
              <span style={{ color: MUTED, fontSize: '0.6rem', fontFamily: 'monospace', fontWeight: 600, flex: 1 }}>
                Rows {startRow + 1}–{endRow + 1}, Cols {startCol + 1}–{endCol + 1}
              </span>
            </div>
            {/* Mini-map — top-right */}
            <canvas ref={miniMapRef}
              style={{ position: 'absolute', top: 36, right: 12, maxWidth: 80, maxHeight: 80, border: `1px solid ${BORDER}`, borderRadius: 4, zIndex: 5 }}
            />
            {/* Zoomed grid */}
            <div ref={gridWrapperRef} style={{ flex: 1, width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', overflow: 'hidden' }}>
              <div style={{ lineHeight: 0, display: 'block' }}>
                {Array.from({ length: windowRows }, (_, wi) => {
                  const r = startRow + wi;
                  const isCurrentRow = r === currentRow;
                  return (
                    <div key={r} style={{
                      display: 'flex',
                      backgroundColor: isCurrentRow ? 'rgba(232,65,42,0.07)' : 'transparent',
                      borderTop: isCurrentRow && wi > 0 ? '1px solid rgba(196,103,58,0.6)' : 'none',
                    }}>
                      {Array.from({ length: windowCols }, (_, wc) => {
                        const col = startCol + wc;
                        const flatIdx = r * project.cols + col;
                        const isCurrentCell = r === currentRow && col === currentCol;
                        const isDoneCell = flatIdx < currentIndex;
                        const val = project.grid[r]?.[col] ?? 0;
                        return (
                          <DiceCell
                            key={col}
                            val={val} size={cellSize} diceView={diceView}
                            opacity={isDoneCell ? 0.45 : 1}
                            border={isCurrentCell ? `2px solid ${ACCENT}` : (!diceView && val === 6) ? `1px solid ${BORDER}` : undefined}
                            animation={isCurrentCell ? 'cellPulse 1.2s ease-in-out infinite' : undefined}
                            onClick={() => setCurrentIndex(flatIdx)}
                            cursor="pointer"
                          />
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Toggle button — just above bottom bar */}
          <div style={{ position: 'fixed', bottom: BOTTOM_BAR_H, left: 0, right: 0, zIndex: 10, backgroundColor: BG, borderTop: `1px solid ${BORDER}`, padding: '0.4rem 0.75rem' }}>
            <button onClick={toggleDiceView}
              style={{ width: '100%', padding: '0.5rem', backgroundColor: PURPLE, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}>
              {diceView ? 'Switch to Number View' : '🎲 Switch to Dice View'}
            </button>
          </div>

          {/* Sticky bottom bar */}
          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 11, backgroundColor: PANEL, borderTop: `1px solid ${BORDER}`, padding: '0.5rem 0.75rem', display: 'flex', gap: 8, alignItems: 'center', height: BOTTOM_BAR_H, boxSizing: 'border-box' }}>
            <button onClick={goBack} disabled={currentIndex === 0}
              style={{ flex: 1, height: 44, backgroundColor: ACCENT3, color: '#fff', border: 'none', borderRadius: 10, cursor: currentIndex === 0 ? 'not-allowed' : 'pointer', opacity: currentIndex === 0 ? 0.4 : 1, fontWeight: 'bold', fontSize: '1rem', touchAction: 'manipulation' }}>
              ← Back
            </button>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <input type="number" min={1} max={project.rows} value={jumpRow}
                onChange={e => setJumpRow(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && doJump()}
                placeholder={`Row 1–${project.rows}`}
                style={{ width: 90, padding: '0.3rem 0.4rem', borderRadius: 6, border: `1px solid ${BORDER}`, backgroundColor: BG, color: TEXT, fontSize: '0.75rem', fontFamily: 'monospace' }}
              />
              <button onClick={doJump}
                style={{ padding: '0.3rem 0.5rem', backgroundColor: BG, color: TEXT, border: `1px solid ${BORDER}`, borderRadius: 6, cursor: 'pointer', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                Go
              </button>
            </div>
            <button onClick={advance} disabled={currentIndex >= totalCells - 1}
              style={{ flex: 1, height: 44, backgroundColor: ACCENT, color: '#fff', border: 'none', borderRadius: 10, cursor: currentIndex >= totalCells - 1 ? 'not-allowed' : 'pointer', opacity: currentIndex >= totalCells - 1 ? 0.5 : 1, fontWeight: 'bold', fontSize: '1rem', touchAction: 'manipulation' }}>
              Next →
            </button>
          </div>
        </div>
      </>
    );
  }

  // ── DESKTOP LAYOUT ──────────────────────────────────────────────────────
  return (
    <>
      <Head><title>Build Mode — {project.projectName}</title></Head>
      <style>{`
        @keyframes cellPulse {
          0%, 100% { border-color: ${ACCENT}; }
          50%       { border-color: ${ACCENT2}; }
        }
      `}</style>
      <div style={{ height: '100vh', backgroundColor: BG, fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Top bar */}
        <div style={{ backgroundColor: TOPBAR, padding: '0.6rem 1.2rem', display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
          <span style={{ color: '#ffffff', fontWeight: 'bold', fontSize: '0.95rem', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>🎲 Build Mode</span>
          <span style={{ color: '#aaaaaa', fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160 }}>{project.projectName}</span>
          <div style={{ flex: 1, height: 6, backgroundColor: '#333', borderRadius: 3, overflow: 'hidden', minWidth: 60 }}>
            <div style={{ height: '100%', width: `${progress}%`, backgroundColor: ACCENT, borderRadius: 3, transition: 'width 0.1s ease' }} />
          </div>
          <span style={{ color: '#cccccc', fontSize: '0.8rem', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>{currentIndex} / {totalCells}</span>
          <span style={{ color: ACCENT2, fontSize: '0.8rem', fontWeight: 'bold', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>{progress.toFixed(1)}%</span>
        </div>

        {/* Main panels */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

          {/* Left panel */}
          <div style={{ width: 220, backgroundColor: PANEL, padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', borderRight: `1px solid ${BORDER}`, overflowY: 'auto', flexShrink: 0 }}>

            {/* Current dice */}
            <div>
              <div style={{ color: MUTED, fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 6, fontWeight: 600 }}>Current</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <DiceCell val={currentVal} size={68} diceView={diceView}
                  border={`2px solid ${ACCENT}`}
                  boxShadow={undefined}
                  animation="cellPulse 1.2s ease-in-out infinite"
                />
                <div>
                  <div style={{ color: TEXT, fontSize: '0.8rem', fontWeight: 600 }}>Row {currentRow + 1}, Col {currentCol + 1}</div>
                  <div style={{ color: MUTED, fontSize: '0.7rem', marginTop: 2 }}>#{currentIndex + 1} of {totalCells}</div>
                </div>
              </div>
            </div>

            {/* Next up */}
            <div>
              <div style={{ color: MUTED, fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 6, fontWeight: 600 }}>Next Up</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {nextUp.map(({ val, r, col }, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <DiceCell val={val} size={22} diceView={diceView}
                      border={(!diceView && val === 6) ? `1px solid ${BORDER}` : undefined}
                    />
                    <span style={{ color: MUTED, fontSize: '0.72rem', fontFamily: 'monospace' }}>R{r + 1} C{col + 1}</span>
                  </div>
                ))}
                {nextUp.length === 0 && <span style={{ color: MUTED, fontSize: '0.8rem' }}>Last cell!</span>}
              </div>
            </div>

            {/* View toggle */}
            <button onClick={toggleDiceView}
              style={{ width: '100%', padding: '0.65rem', backgroundColor: PURPLE, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem', textAlign: 'center' }}>
              {diceView ? 'Switch to Number View' : '🎲 Switch to Dice View'}
            </button>

            {/* Jump to row */}
            <div style={{ marginTop: 'auto' }}>
              <div style={{ color: MUTED, fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 6, fontWeight: 600 }}>Jump to row</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <input type="number" min={1} max={project.rows} value={jumpRow}
                  onChange={e => setJumpRow(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && doJump()}
                  placeholder={`1–${project.rows}`}
                  style={{ flex: 1, padding: '0.4rem 0.5rem', borderRadius: 6, border: `1px solid ${BORDER}`, backgroundColor: BG, color: TEXT, fontSize: '0.85rem', fontFamily: 'monospace', minWidth: 0 }}
                />
                <button onClick={doJump}
                  style={{ padding: '0.4rem 0.6rem', backgroundColor: BG, color: TEXT, border: `1px solid ${BORDER}`, borderRadius: 6, cursor: 'pointer', fontSize: '0.85rem', fontFamily: 'monospace' }}>
                  Go
                </button>
              </div>
            </div>

            {/* Navigation */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={goBack} disabled={currentIndex === 0}
                  style={{ flex: 1, padding: '0.55rem', backgroundColor: ACCENT3, color: '#fff', border: 'none', borderRadius: 8, cursor: currentIndex === 0 ? 'not-allowed' : 'pointer', opacity: currentIndex === 0 ? 0.4 : 1, fontWeight: 'bold', fontSize: '0.9rem' }}>
                  ← Back
                </button>
                <button onClick={advance} disabled={currentIndex >= totalCells - 1}
                  style={{ flex: 1, padding: '0.55rem', backgroundColor: ACCENT, color: '#fff', border: 'none', borderRadius: 8, cursor: currentIndex >= totalCells - 1 ? 'not-allowed' : 'pointer', opacity: currentIndex >= totalCells - 1 ? 0.5 : 1, fontWeight: 'bold', fontSize: '0.9rem' }}>
                  Next →
                </button>
              </div>
              <div style={{ color: MUTED, fontSize: '0.65rem', textAlign: 'center', fontFamily: 'monospace' }}>Space / ← → arrow keys</div>
            </div>
          </div>

          {/* Right panel — grid */}
          <div style={{ flex: 1, padding: '1.2rem', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 10, backgroundColor: BG }}>
            <div style={{ color: MUTED, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: 2, flexShrink: 0, fontWeight: 600 }}>
              Full Grid — {project.cols}W × {project.rows}H
            </div>
            {gridEl}
          </div>
        </div>
      </div>
    </>
  );
}
