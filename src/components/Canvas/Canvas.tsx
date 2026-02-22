import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { CanvasProps } from './Canvas.types';
import type { BackgroundType } from './Canvas.types';
import './Canvas.css';

const DEFAULT_CANVAS_WIDTH = 3000;
const DEFAULT_CANVAS_HEIGHT = 2000;
const DEFAULT_MIN_ZOOM = 0.1;
const DEFAULT_MAX_ZOOM = 3;
const DEFAULT_INITIAL_ZOOM = 0.5;
const MINIMAP_PADDING = 10;

interface NodeRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

const DOT_SVG = `data:image/svg+xml,${encodeURIComponent(
  '<svg width="20" height="20" xmlns="http://www.w3.org/2000/svg"><circle cx="10" cy="10" r="1" fill="#94a3b8"/></svg>'
)}`;

const CROSS_SVG = `data:image/svg+xml,${encodeURIComponent(
  '<svg width="20" height="20" xmlns="http://www.w3.org/2000/svg"><line x1="8" y1="10" x2="12" y2="10" stroke="#94a3b8" stroke-width="1"/><line x1="10" y1="8" x2="10" y2="12" stroke="#94a3b8" stroke-width="1"/></svg>'
)}`;

const PATTERN_TILE = 20;

function getPatternSvg(type: BackgroundType): string | null {
  if (type === 'dotted') return DOT_SVG;
  if (type === 'cross') return CROSS_SVG;
  return null;
}

function getCanvasBgStyle(
  type: BackgroundType,
  imageUrl?: string,
): React.CSSProperties {
  if (type === 'image' && imageUrl) {
    return {
      backgroundImage: `url(${imageUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    };
  }
  return {};
}

function getViewportPatternStyle(
  type: BackgroundType,
  panX: number,
  panY: number,
  zoom: number,
): React.CSSProperties {
  const svg = getPatternSvg(type);
  if (!svg) return {};
  const tileSize = PATTERN_TILE * zoom;
  return {
    backgroundImage: `url("${svg}")`,
    backgroundRepeat: 'repeat',
    backgroundSize: `${tileSize}px ${tileSize}px`,
    backgroundPosition: `${panX}px ${panY}px`,
  };
}

const Canvas: React.FC<CanvasProps> = ({
  children,
  canvasWidth = DEFAULT_CANVAS_WIDTH,
  canvasHeight = DEFAULT_CANVAS_HEIGHT,
  minZoom = DEFAULT_MIN_ZOOM,
  maxZoom = DEFAULT_MAX_ZOOM,
  initialZoom = DEFAULT_INITIAL_ZOOM,
  showMinimap = true,
  minimapWidth = 160,
  minimapHeight = 100,
  className = '',
  backgroundType = 'blank',
  backgroundImage,
  onBackgroundClick,
  onDrop,
  onDragMove,
  onDragLeave,
  onZoomChange,
}) => {
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(initialZoom);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [isMinimapDragging, setIsMinimapDragging] = useState(false);
  const [nodeRects, setNodeRects] = useState<NodeRect[]>([]);

  const panStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const didDrag = useRef(false);
  const backgroundClicked = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const minimapStart = useRef({
    x: 0, y: 0, panX: 0, panY: 0,
    mmScale: 1, worldMinX: 0, worldMinY: 0, frozenZoom: 1,
  });

  // Auto-size to fill container
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width: w, height: h } = entry.contentRect;
      setSize({ width: w, height: h });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const width = size.width;
  const height = size.height;

  // Measure child positions inside the canvas for the minimap
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const measure = () => {
      const rects: NodeRect[] = [];
      for (const child of Array.from(canvas.children)) {
        const el = child as HTMLElement;
        rects.push({
          x: el.offsetLeft,
          y: el.offsetTop,
          w: el.offsetWidth,
          h: el.offsetHeight,
        });
      }
      setNodeRects(rects);
    };

    measure();
    const mo = new MutationObserver(measure);
    mo.observe(canvas, { childList: true, subtree: true, attributes: true, attributeFilter: ['style'] });
    return () => mo.disconnect();
  }, [children]);

  // Left-click drag on canvas or viewport background to pan
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const isBackground =
        e.target === canvasRef.current || e.target === viewportRef.current;
      if (e.button === 0 && isBackground) {
        setIsPanning(true);
        didDrag.current = false;
        backgroundClicked.current = true;
        panStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
      }
    },
    [pan.x, pan.y]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isPanning) {
        const dx = e.clientX - panStart.current.x;
        const dy = e.clientY - panStart.current.y;
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) didDrag.current = true;
        setPan({
          x: panStart.current.panX + dx,
          y: panStart.current.panY + dy,
        });
      }
    },
    [isPanning]
  );

  const handleMouseUp = useCallback(() => {
    if (backgroundClicked.current && !didDrag.current) {
      onBackgroundClick?.();
    }
    backgroundClicked.current = false;
    setIsPanning(false);
    setIsMinimapDragging(false);
  }, [onBackgroundClick]);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // Wheel zoom toward cursor
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      const newZoom = Math.min(maxZoom, Math.max(minZoom, zoom + delta));
      if (newZoom === zoom) return;

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) { setZoom(newZoom); onZoomChange?.(newZoom); return; }
      const cursorX = e.clientX - rect.left;
      const cursorY = e.clientY - rect.top;
      const contentX = (cursorX - pan.x) / zoom;
      const contentY = (cursorY - pan.y) / zoom;
      setPan({ x: cursorX - contentX * newZoom, y: cursorY - contentY * newZoom });
      setZoom(newZoom);
      onZoomChange?.(newZoom);
    },
    [zoom, minZoom, maxZoom, pan.x, pan.y, onZoomChange]
  );

  // --- Minimap: dynamic world bounds ---
  const viewportInContent = {
    x: -pan.x / zoom,
    y: -pan.y / zoom,
    w: width / zoom,
    h: height / zoom,
  };

  let worldMinX = viewportInContent.x;
  let worldMinY = viewportInContent.y;
  let worldMaxX = viewportInContent.x + viewportInContent.w;
  let worldMaxY = viewportInContent.y + viewportInContent.h;

  for (const r of nodeRects) {
    worldMinX = Math.min(worldMinX, r.x);
    worldMinY = Math.min(worldMinY, r.y);
    worldMaxX = Math.max(worldMaxX, r.x + r.w);
    worldMaxY = Math.max(worldMaxY, r.y + r.h);
  }

  const worldW = worldMaxX - worldMinX || 1;
  const worldH = worldMaxY - worldMinY || 1;

  const mmScale = Math.min(
    (minimapWidth - MINIMAP_PADDING * 2) / worldW,
    (minimapHeight - MINIMAP_PADDING * 2) / worldH,
  );

  const toMmX = (x: number) => MINIMAP_PADDING + (x - worldMinX) * mmScale;
  const toMmY = (y: number) => MINIMAP_PADDING + (y - worldMinY) * mmScale;
  const fromMmX = (mx: number) => (mx - MINIMAP_PADDING) / mmScale + worldMinX;
  const fromMmY = (my: number) => (my - MINIMAP_PADDING) / mmScale + worldMinY;

  const canvasBgStyle = useMemo(
    () => getCanvasBgStyle(backgroundType, backgroundImage),
    [backgroundType, backgroundImage],
  );

  const viewportPatternStyle = useMemo(
    () => getViewportPatternStyle(backgroundType, pan.x, pan.y, zoom),
    [backgroundType, pan.x, pan.y, zoom],
  );

  const handleMinimapMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    setIsMinimapDragging(true);
    const rect = e.currentTarget.getBoundingClientRect();
    const contentX = fromMmX(e.clientX - rect.left);
    const contentY = fromMmY(e.clientY - rect.top);
    const newPanX = width / 2 - contentX * zoom;
    const newPanY = height / 2 - contentY * zoom;
    setPan({ x: newPanX, y: newPanY });
    minimapStart.current = {
      x: e.clientX, y: e.clientY,
      panX: newPanX, panY: newPanY,
      mmScale, worldMinX, worldMinY, frozenZoom: zoom,
    };
  };

  useEffect(() => {
    if (!isMinimapDragging) return;
    const onMove = (e: MouseEvent) => {
      const { x, y, panX, panY, mmScale: s, frozenZoom: z } = minimapStart.current;
      const dx = (e.clientX - x) / s;
      const dy = (e.clientY - y) / s;
      setPan({ x: panX - dx * z, y: panY - dy * z });
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, [isMinimapDragging]);

  const screenToCanvas = useCallback(
    (clientX: number, clientY: number) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return null;
      return {
        x: (clientX - rect.left - pan.x) / zoom,
        y: (clientY - rect.top - pan.y) / zoom,
      };
    },
    [pan.x, pan.y, zoom]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      if (onDragMove) {
        const pos = screenToCanvas(e.clientX, e.clientY);
        if (pos) onDragMove(pos.x, pos.y);
      }
    },
    [onDragMove, screenToCanvas]
  );

  const handleDragLeaveContainer = useCallback(
    (e: React.DragEvent) => {
      if (e.currentTarget === containerRef.current && !e.currentTarget.contains(e.relatedTarget as Node)) {
        onDragLeave?.();
      }
    },
    [onDragLeave]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      onDragLeave?.();
      if (!onDrop) return;
      const pos = screenToCanvas(e.clientX, e.clientY);
      if (pos) onDrop(pos.x, pos.y, e);
    },
    [onDrop, onDragLeave, screenToCanvas]
  );

  return (
    <div
      ref={containerRef}
      className={`artichart-canvas ${className}`.trim()}
      onMouseDown={handleMouseDown}
      onWheel={handleWheel}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeaveContainer}
      onDrop={handleDrop}
      data-no-select
    >
      <div
        ref={viewportRef}
        className="artichart-canvas__viewport"
        style={viewportPatternStyle}
      >
        <div
          ref={canvasRef}
          className="artichart-canvas__surface"
          style={{
            width: canvasWidth,
            height: canvasHeight,
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
            ...canvasBgStyle,
          }}
        >
          {children}
        </div>
      </div>

      {showMinimap && (
        <div
          className="artichart-canvas__minimap"
          style={{ width: minimapWidth, height: minimapHeight }}
          onMouseDown={handleMinimapMouseDown}
          role="presentation"
        >
          {nodeRects.map((r, i) => (
            <div
              key={i}
              className="artichart-canvas__minimap-node"
              style={{
                left: toMmX(r.x),
                top: toMmY(r.y),
                width: r.w * mmScale,
                height: r.h * mmScale,
              }}
            />
          ))}
          <div
            className="artichart-canvas__minimap-viewport"
            style={{
              left: toMmX(viewportInContent.x),
              top: toMmY(viewportInContent.y),
              width: viewportInContent.w * mmScale,
              height: viewportInContent.h * mmScale,
            }}
          />
        </div>
      )}
    </div>
  );
};

export default Canvas;
