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

const BG      = '#F5EFE6';   // warm cream
const PANEL   = '#FFFFFF';   // white cards
const TOPBAR  = '#0a0a0a';   // black header
const ACCENT  = '#E8412A';   // orange-red
const ACCENT2 = '#F5A623';   // warm yellow
const ACCENT3 = '#2A7F7F';   // teal
const TEXT    = '#1a1a1a';   // near black
const MUTED   = '#666666';   // muted text
const BORDER  = '#E0D8CE';   // subtle warm grey

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
  const gridWrapperRef = useRef<HTMLDivElement>(null);

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
      if (!res.ok) {
        setError('Access code not found. Please check and try again.');
        return;
      }
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

  // Dynamically size grid cells to fill the available wrapper area
  useEffect(() => {
    if (!project) return;
    const el = gridWrapperRef.current;
    if (!el) return;
    const compute = () => {
      const byW = Math.floor(el.clientWidth  / project.cols);
      const byH = Math.floor(el.clientHeight / project.rows);
      setCellSize(Math.max(10, Math.min(byW, byH)));
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, [project]);

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
              type="text"
              placeholder="Access code (e.g. ABC123)"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              style={{ width: '100%', padding: '0.8rem', borderRadius: 8, border: `1px solid ${BORDER}`, backgroundColor: BG, color: TEXT, fontSize: '1.1rem', textAlign: 'center', letterSpacing: 4, marginBottom: '1rem', boxSizing: 'border-box', fontFamily: 'monospace' }}
            />
            {error && <p style={{ color: ACCENT, marginBottom: '1rem', fontSize: '0.85rem', textAlign: 'center' }}>{error}</p>}
            <button
              onClick={handleLogin}
              disabled={loading}
              style={{ width: '100%', padding: '0.8rem', backgroundColor: ACCENT, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 'bold', fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
            >
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

  // ── Build screen ───────────────────────────────────────────────────────
  return (
    <>
      <Head><title>Build Mode — {project.projectName}</title></Head>
      <style>{`
        @keyframes cellPulse {
          0%, 100% { box-shadow: 0 0 0 2px ${ACCENT}, 0 0 8px 2px ${ACCENT}; }
          50%       { box-shadow: 0 0 0 4px ${ACCENT}, 0 0 16px 4px ${ACCENT}; }
        }
      `}</style>
      <div style={{ height: '100vh', backgroundColor: BG, fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Top bar — black, matching site header */}
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

          {/* Left panel — white card */}
          <div style={{ width: 220, backgroundColor: PANEL, padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', borderRight: `1px solid ${BORDER}`, overflowY: 'auto', flexShrink: 0 }}>

            {/* Current dice */}
            <div>
              <div style={{ color: MUTED, fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 6, fontWeight: 600 }}>Current</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 68, height: 68, borderRadius: 12,
                  backgroundColor: diceView ? '#1a1a1a' : DICE_COLORS[currentVal]?.bg,
                  border: `2px solid ${ACCENT}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 28, fontWeight: 'bold', color: DICE_COLORS[currentVal]?.text,
                  flexShrink: 0, overflow: 'hidden',
                }}>
                  {diceView ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`/dice/dice_${currentVal}.png`} alt={String(currentVal)}
                      style={{ width: '95%', height: '95%', objectFit: 'contain', pointerEvents: 'none' }} />
                  ) : currentVal}
                </div>
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
                    <div style={{ width: 22, height: 22, borderRadius: 4, backgroundColor: diceView ? '#1a1a1a' : DICE_COLORS[val]?.bg, border: (!diceView && val === 6) ? `1px solid ${BORDER}` : 'none', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: DICE_COLORS[val]?.text, fontWeight: 'bold', overflow: 'hidden' }}>
                      {diceView ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={`/dice/dice_${val}.png`} alt={String(val)}
                          style={{ width: '95%', height: '95%', objectFit: 'contain', pointerEvents: 'none' }} />
                      ) : val}
                    </div>
                    <span style={{ color: MUTED, fontSize: '0.72rem', fontFamily: 'monospace' }}>R{r + 1} C{col + 1}</span>
                  </div>
                ))}
                {nextUp.length === 0 && <span style={{ color: MUTED, fontSize: '0.8rem' }}>Last cell!</span>}
              </div>
            </div>

            {/* View toggle */}
            <button
              onClick={toggleDiceView}
              style={{ width: '100%', padding: '0.65rem', backgroundColor: ACCENT3, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem', textAlign: 'center' }}
            >
              {diceView ? '🔢 Switch to Number View' : '🎲 Switch to Dice View'}
            </button>

            {/* Jump to row */}
            <div style={{ marginTop: 'auto' }}>
              <div style={{ color: MUTED, fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 6, fontWeight: 600 }}>Jump to row</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  type="number"
                  min={1}
                  max={project.rows}
                  value={jumpRow}
                  onChange={e => setJumpRow(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      const row = Math.max(1, Math.min(project.rows, parseInt(jumpRow) || 1));
                      setCurrentIndex((row - 1) * project.cols);
                      setJumpRow('');
                    }
                  }}
                  placeholder={`1–${project.rows}`}
                  style={{ flex: 1, padding: '0.4rem 0.5rem', borderRadius: 6, border: `1px solid ${BORDER}`, backgroundColor: BG, color: TEXT, fontSize: '0.85rem', fontFamily: 'monospace', minWidth: 0 }}
                />
                <button
                  onClick={() => {
                    const row = Math.max(1, Math.min(project.rows, parseInt(jumpRow) || 1));
                    setCurrentIndex((row - 1) * project.cols);
                    setJumpRow('');
                  }}
                  style={{ padding: '0.4rem 0.6rem', backgroundColor: BG, color: TEXT, border: `1px solid ${BORDER}`, borderRadius: 6, cursor: 'pointer', fontSize: '0.85rem', fontFamily: 'monospace' }}
                >
                  Go
                </button>
              </div>
            </div>

            {/* Navigation */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={goBack}
                  disabled={currentIndex === 0}
                  style={{ flex: 1, padding: '0.55rem', backgroundColor: ACCENT3, color: '#fff', border: 'none', borderRadius: 8, cursor: currentIndex === 0 ? 'not-allowed' : 'pointer', opacity: currentIndex === 0 ? 0.4 : 1, fontWeight: 'bold', fontSize: '0.9rem' }}
                >
                  ← Back
                </button>
                <button
                  onClick={advance}
                  disabled={currentIndex >= totalCells - 1}
                  style={{ flex: 1, padding: '0.55rem', backgroundColor: ACCENT, color: '#fff', border: 'none', borderRadius: 8, cursor: currentIndex >= totalCells - 1 ? 'not-allowed' : 'pointer', opacity: currentIndex >= totalCells - 1 ? 0.5 : 1, fontWeight: 'bold', fontSize: '0.9rem' }}
                >
                  Next →
                </button>
              </div>
              <div style={{ color: MUTED, fontSize: '0.65rem', textAlign: 'center', fontFamily: 'monospace' }}>Space / ← → arrow keys</div>
            </div>
          </div>

          {/* Right panel — cream background, full colour grid */}
          <div style={{ flex: 1, padding: '1.2rem', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 10, backgroundColor: BG }}>
            <div style={{ color: MUTED, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: 2, flexShrink: 0, fontWeight: 600 }}>
              Full Grid — {project.cols}W × {project.rows}H
            </div>
            {/* Grid wrapper: fills remaining height, scrollable if grid exceeds it */}
            <div ref={gridWrapperRef} style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
              <div style={{ lineHeight: 0, display: 'inline-block' }}>
                {project.grid.map((row, r) => {
                  const isCurrentRow = r === currentRow;
                  return (
                    <div
                      key={r}
                      style={{
                        display: 'flex',
                        backgroundColor: isCurrentRow ? 'rgba(232,65,42,0.07)' : 'transparent',
                        borderTop: isCurrentRow && currentRow > 0 ? `2px solid ${ACCENT}` : 'none',
                      }}
                    >
                      {row.map((val, col) => {
                        const flatIdx       = r * project.cols + col;
                        const isCurrentCell = isCurrentRow && col === currentCol;
                        const isDoneCell    = flatIdx < currentIndex;
                        const color         = DICE_COLORS[val] ?? DICE_COLORS[0];
                        const fontSize      = Math.max(8, Math.floor(cellSize * 0.52));
                        return (
                          <div
                            key={col}
                            onClick={() => setCurrentIndex(flatIdx)}
                            style={{
                              width:           cellSize,
                              height:          cellSize,
                              backgroundColor: diceView ? '#1a1a1a' : color.bg,
                              opacity:         isDoneCell ? 0.45 : 1,
                              border:          isCurrentCell
                                ? `3px solid ${ACCENT}`
                                : (!diceView && val === 6) ? `1px solid ${BORDER}` : 'none',
                              boxSizing:       'border-box',
                              position:        'relative',
                              zIndex:          isCurrentCell ? 2 : 1,
                              boxShadow:       isCurrentCell ? `0 0 0 2px ${ACCENT}, 0 0 10px 2px ${ACCENT}` : 'none',
                              animation:       isCurrentCell ? 'cellPulse 1.2s ease-in-out infinite' : 'none',
                              display:         'flex',
                              alignItems:      'center',
                              justifyContent:  'center',
                              flexShrink:      0,
                              cursor:          'pointer',
                            }}
                          >
                            {cellSize >= 8 && (diceView ? (
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
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
