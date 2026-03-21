import React from 'react';
import './Controls.css';

export interface ControlsProps {
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onFitView?: () => void;
  onToggleLock?: () => void;
  locked?: boolean;
  showZoom?: boolean;
  showFitView?: boolean;
  showLock?: boolean;
  zoom?: number;
  className?: string;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  children?: React.ReactNode;
}

const POSITION_STYLES: Record<string, React.CSSProperties> = {
  'top-left': { top: 10, left: 10 },
  'top-right': { top: 10, right: 10 },
  'bottom-left': { bottom: 10, left: 10 },
  'bottom-right': { bottom: 10, right: 10 },
};

export const Controls: React.FC<ControlsProps> = ({
  onZoomIn,
  onZoomOut,
  onFitView,
  onToggleLock,
  locked = false,
  showZoom = true,
  showFitView = true,
  showLock = true,
  zoom,
  className,
  position = 'bottom-left',
  children,
}) => {
  return (
    <div
      className={`artichart-controls ${className ?? ''}`.trim()}
      style={{
        position: 'absolute',
        ...POSITION_STYLES[position],
        zIndex: 10001,
      }}
      data-minimap-ignore="true"
      role="toolbar"
      aria-label="Canvas controls"
    >
      {showZoom && (
        <>
          <button
            className="artichart-controls__btn"
            onClick={onZoomIn}
            title="Zoom in"
            aria-label="Zoom in"
          >
            +
          </button>
          <button
            className="artichart-controls__btn"
            onClick={onZoomOut}
            title="Zoom out"
            aria-label="Zoom out"
          >
            &minus;
          </button>
        </>
      )}
      {showFitView && (
        <button
          className="artichart-controls__btn"
          onClick={onFitView}
          title="Fit view"
          aria-label="Fit view"
        >
          &#x26F6;
        </button>
      )}
      {showLock && (
        <button
          className={`artichart-controls__btn ${locked ? 'artichart-controls__btn--active' : ''}`.trim()}
          onClick={onToggleLock}
          title={locked ? 'Unlock' : 'Lock'}
          aria-label={locked ? 'Unlock canvas' : 'Lock canvas'}
          aria-pressed={locked}
        >
          {locked ? '\u{1F512}' : '\u{1F513}'}
        </button>
      )}
      {zoom !== undefined && (
        <span className="artichart-controls__zoom-label" aria-live="polite">
          {Math.round(zoom * 100)}%
        </span>
      )}
      {children}
    </div>
  );
};
