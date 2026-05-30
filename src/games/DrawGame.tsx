import { useEffect, useRef, useState } from 'react';
import { playClick, playCorrect } from '../utils/sounds';
import {
  PALETTE, nextRainbowHue, hueToHex,
  STICKER_DEFS, evaluateStickers, type DrawStats,
} from './drawHelpers';
import { COLORING_PAGES, buildSvgMarkup, type ColoringPage } from './coloringPages';
import './DrawGame.css';

interface DrawGameProps {
  onBack: () => void;
}

type Tool = 'brush' | 'eraser' | 'rainbow' | 'stamp' | 'text';

const SIZES = [4, 8, 16];
const STAMPS = ['🐱', '🐶', '🐰', '🦋', '🌸', '⭐', '❤️', '🌈', '🚗', '🐟'];

export function DrawGame({ onBack }: DrawGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const hue = useRef(0);
  const undoStack = useRef<string[]>([]);
  const activePageIsColoring = useRef(false);
  const stats = useRef<DrawStats>({
    strokes: 0, rainbowUsed: false, colorsUsed: [],
    stampsPlaced: 0, drawingsSaved: 0, coloringPagesSaved: 0,
  });

  const [tool, setTool] = useState<Tool>('brush');
  const [color, setColor] = useState('#000000');
  const [size, setSize] = useState(8);
  const [stamp, setStamp] = useState(STAMPS[0]);
  const [confirmClear, setConfirmClear] = useState(false);
  const [showPages, setShowPages] = useState(false);
  const [earned, setEarned] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('drawStickers') || '[]'); }
    catch { return []; }
  });
  const [newSticker, setNewSticker] = useState<{ emoji: string; name: string } | null>(null);

  // Canvas opzetten op container-formaat met devicePixelRatio.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const wrap = canvas.parentElement!;
    const dpr = window.devicePixelRatio || 1;
    const rect = wrap.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, rect.height);
    ctxRef.current = ctx;
  }, []);

  // Escape = terug.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onBack(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onBack]);

  const pos = (e: React.PointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const snapshot = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (undoStack.current.length >= 10) undoStack.current.shift();
    undoStack.current.push(canvas.toDataURL());
  };

  const checkStickers = () => {
    const all = evaluateStickers(stats.current);
    const fresh = all.filter(id => !earned.includes(id));
    if (fresh.length === 0) return;
    const updated = [...earned, ...fresh];
    setEarned(updated);
    localStorage.setItem('drawStickers', JSON.stringify(updated));
    const def = STICKER_DEFS.find(s => s.id === fresh[0])!;
    setNewSticker({ emoji: def.emoji, name: def.name });
    playCorrect();
    setTimeout(() => setNewSticker(null), 2500);
  };

  const start = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture(e.pointerId);

    if (tool === 'stamp') {
      snapshot();
      const ctx = ctxRef.current;
      if (ctx) {
        const p = pos(e);
        ctx.font = `${size * 6}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(stamp, p.x, p.y);
      }
      stats.current.stampsPlaced += 1;
      checkStickers();
      return;
    }

    if (tool === 'text') {
      const ctx = ctxRef.current;
      const txt = window.prompt('Wat wil je schrijven?');
      if (ctx && txt) {
        snapshot();
        const p = pos(e);
        ctx.font = `${size * 4}px 'Comic Sans MS', 'Trebuchet MS', Arial, sans-serif`;
        ctx.fillStyle = color;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(txt, p.x, p.y);
        stats.current.strokes += 1;
        if (!stats.current.colorsUsed.includes(color)) stats.current.colorsUsed.push(color);
        checkStickers();
      }
      return;
    }

    snapshot();
    drawing.current = true;
    last.current = pos(e);
    stats.current.strokes += 1;
    if (tool === 'rainbow') stats.current.rainbowUsed = true;
    if (tool === 'brush' && !stats.current.colorsUsed.includes(color)) {
      stats.current.colorsUsed.push(color);
    }
  };

  const move = (e: React.PointerEvent) => {
    if (!drawing.current || !ctxRef.current || !last.current) return;
    const ctx = ctxRef.current;
    const p = pos(e);
    if (tool === 'eraser') {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = size * 2.5;
    } else if (tool === 'rainbow') {
      hue.current = nextRainbowHue(hue.current, 8);
      ctx.strokeStyle = hueToHex(hue.current);
      ctx.lineWidth = size;
    } else {
      ctx.strokeStyle = color;
      ctx.lineWidth = size;
    }
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
  };

  const end = () => {
    if (drawing.current) checkStickers();
    drawing.current = false;
    last.current = null;
  };

  const undo = () => {
    const ctx = ctxRef.current, canvas = canvasRef.current;
    if (!ctx || !canvas) return;
    const prev = undoStack.current.pop();
    const rect = canvas.parentElement!.getBoundingClientRect();
    if (!prev) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, rect.width, rect.height);
      return;
    }
    const img = new Image();
    img.onload = () => { ctx.clearRect(0, 0, rect.width, rect.height); ctx.drawImage(img, 0, 0, rect.width, rect.height); };
    img.src = prev;
    playClick();
  };

  const doClear = () => {
    const ctx = ctxRef.current, canvas = canvasRef.current;
    if (!ctx || !canvas) return;
    snapshot();
    const rect = canvas.parentElement!.getBoundingClientRect();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, rect.height);
    activePageIsColoring.current = false;
    setConfirmClear(false);
  };

  const save = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement('a');
    a.download = 'melina-tekening.png';
    a.href = canvas.toDataURL('image/png');
    a.click();
    stats.current.drawingsSaved += 1;
    if (activePageIsColoring.current) {
      stats.current.coloringPagesSaved += 1;
      activePageIsColoring.current = false;
    }
    playClick();
    checkStickers();
  };

  const loadColoringPage = (page: ColoringPage) => {
    const ctx = ctxRef.current, canvas = canvasRef.current;
    if (!ctx || !canvas) return;
    snapshot();
    const rect = canvas.parentElement!.getBoundingClientRect();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, rect.height);
    const svg = buildSvgMarkup(page, '#bbbbbb');
    const img = new Image();
    img.onload = () => {
      const s = Math.min(rect.width, rect.height) * 0.98;
      const x = (rect.width - s) / 2;
      const y = (rect.height - s) / 2;
      ctx.drawImage(img, x, y, s, s);
    };
    img.src = 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
    activePageIsColoring.current = true;
    setShowPages(false);
    playClick();
  };

  // Eigen plaatje van het apparaat laden om in te kleuren (vult het hele blad).
  const onUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const ctx = ctxRef.current, canvas = canvasRef.current;
      if (!ctx || !canvas) return;
      snapshot();
      const rect = canvas.parentElement!.getBoundingClientRect();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, rect.width, rect.height);
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(rect.width / img.width, rect.height / img.height) * 0.98;
        const w = img.width * scale;
        const h = img.height * scale;
        ctx.drawImage(img, (rect.width - w) / 2, (rect.height - h) / 2, w, h);
      };
      img.src = reader.result as string;
      activePageIsColoring.current = true;
    };
    reader.readAsDataURL(file);
    playClick();
  };

  return (
    <div className="draw-screen">
      <div className="draw-topbar">
        <button className="draw-back-btn" onClick={() => { playClick(); onBack(); }}>🏠</button>
        <h1 className="draw-title">🎨 Tekenen</h1>
      </div>

      <div className="draw-canvas-wrap">
        <canvas
          ref={canvasRef}
          className="draw-canvas"
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerCancel={end}
        />
      </div>

      <div className="draw-toolbar">
        <div className="draw-picker-row">
          {PALETTE.map(c => (
            <button
              key={c}
              className={`draw-swatch ${tool === 'brush' && color === c ? 'active' : ''}`}
              style={{ background: c }}
              onClick={() => { setColor(c); setTool('brush'); playClick(); }}
              aria-label={`kleur ${c}`}
            />
          ))}
          <input
            type="color"
            className="draw-swatch"
            value={color}
            onChange={e => { setColor(e.target.value); setTool('brush'); }}
            aria-label="eigen kleur"
          />
        </div>

        <div className="draw-picker-row">
          {SIZES.map(s => (
            <button
              key={s}
              className={`draw-tool-btn ${size === s ? 'active' : ''}`}
              onClick={() => { setSize(s); playClick(); }}
              aria-label={`dikte ${s}`}
            >
              <span className="draw-size-dot" style={{ width: s + 4, height: s + 4, display: 'inline-block' }} />
            </button>
          ))}
          <button
            className={`draw-tool-btn ${tool === 'eraser' ? 'active' : ''}`}
            onClick={() => { setTool('eraser'); playClick(); }}
          >🩹</button>
          <button
            className={`draw-tool-btn ${tool === 'rainbow' ? 'active' : ''}`}
            onClick={() => { setTool('rainbow'); playClick(); }}
          >🌈</button>
          <button
            className={`draw-tool-btn ${tool === 'text' ? 'active' : ''}`}
            onClick={() => { setTool('text'); playClick(); }}
            aria-label="schrijven"
          >🔤</button>
        </div>

        <div className="draw-picker-row">
          {STAMPS.map(s => (
            <button
              key={s}
              className={`draw-tool-btn ${tool === 'stamp' && stamp === s ? 'active' : ''}`}
              onClick={() => { setStamp(s); setTool('stamp'); playClick(); }}
            >{s}</button>
          ))}
        </div>

        <div className="draw-picker-row">
          <button className="draw-tool-btn" onClick={() => { setShowPages(true); playClick(); }}>📄</button>
          <button className="draw-tool-btn" onClick={() => fileRef.current?.click()} aria-label="eigen plaatje">📷</button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={onUpload}
          />
          <button className="draw-tool-btn" onClick={undo}>↩️</button>
          <button className="draw-tool-btn" onClick={() => { setConfirmClear(true); playClick(); }}>🗑️</button>
          <button className="draw-tool-btn" onClick={save}>💾</button>
        </div>
      </div>

      {confirmClear && (
        <div className="draw-confirm-overlay" onClick={() => setConfirmClear(false)}>
          <div className="draw-confirm-box" onClick={e => e.stopPropagation()}>
            <p>Weet je het zeker? Alles wordt gewist.</p>
            <button className="draw-confirm-yes" onClick={doClear}>Ja, wissen</button>
            <button className="draw-confirm-no" onClick={() => setConfirmClear(false)}>Nee</button>
          </div>
        </div>
      )}

      {showPages && (
        <div className="draw-confirm-overlay" onClick={() => setShowPages(false)}>
          <div className="draw-confirm-box" onClick={e => e.stopPropagation()}>
            <p>Kies een kleurplaat</p>
            <div className="draw-picker-row" style={{ justifyContent: 'center' }}>
              {COLORING_PAGES.map(p => (
                <button key={p.id} className="draw-tool-btn" onClick={() => loadColoringPage(p)}>
                  {p.emoji}
                </button>
              ))}
            </div>
            <button className="draw-confirm-no" onClick={() => setShowPages(false)}>Sluiten</button>
          </div>
        </div>
      )}

      {newSticker && (
        <div className="draw-sticker-popup">
          <span className="emoji">{newSticker.emoji}</span>
          Nieuwe sticker!<br />{newSticker.name}
        </div>
      )}
    </div>
  );
}
