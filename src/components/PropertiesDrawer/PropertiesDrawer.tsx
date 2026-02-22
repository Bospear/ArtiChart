import React from 'react';
import type { PropertiesDrawerProps } from './PropertiesDrawer.types';
import type { BackgroundType } from '../Canvas/Canvas.types';
import type { NodeShape } from '../CanvasNode/CanvasNode.types';
import DebouncedNumberInput from './DebouncedNumberInput';
import './PropertiesDrawer.css';

const PropertiesDrawer: React.FC<PropertiesDrawerProps> = ({
  selection,
  canvasProps,
  onCanvasChange,
  selectedNode,
  onNodeChange,
  children,
  className = '',
}) => {
  return (
    <aside className={`artichart-drawer artichart-drawer--right ${className}`.trim()}>
      <h2 className="artichart-drawer__title">Properties</h2>

      {!selection && (
        <p className="artichart-props__placeholder">
          Click the canvas or a node to edit properties
        </p>
      )}

      {selection?.kind === 'canvas' && (
        <div className="artichart-props">
          <div className="artichart-props__section">
            <span className="artichart-props__section-title">Canvas</span>
          </div>

          <label className="artichart-props__field">
            <span className="artichart-props__label">Background Type</span>
            <select
              className="artichart-props__select"
              value={canvasProps.backgroundType}
              onChange={(e) =>
                onCanvasChange({ backgroundType: e.target.value as BackgroundType })
              }
            >
              <option value="blank">Blank</option>
              <option value="dotted">Dotted</option>
              <option value="cross">Cross</option>
              <option value="image">Image</option>
            </select>
          </label>

          {canvasProps.backgroundType === 'image' && (
            <>
              <label className="artichart-props__field">
                <span className="artichart-props__label">Background Image</span>
                <input
                  className="artichart-props__input"
                  type="text"
                  placeholder="Paste image URL…"
                  value={canvasProps.backgroundImage}
                  onChange={(e) =>
                    onCanvasChange({ backgroundImage: e.target.value })
                  }
                />
              </label>

              {canvasProps.backgroundImage && (
                <div className="artichart-props__preview">
                  <img
                    src={canvasProps.backgroundImage}
                    alt="Background preview"
                    className="artichart-props__preview-img"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <button
                    className="artichart-props__clear-btn"
                    onClick={() => onCanvasChange({ backgroundImage: '' })}
                  >
                    Remove
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {selection?.kind === 'node' && selectedNode && (
        <div className="artichart-props">
          <div className="artichart-props__section">
            <span className="artichart-props__section-title">Base Node</span>
          </div>

          <label className="artichart-props__field">
            <span className="artichart-props__label">Type</span>
            <select
              className="artichart-props__select"
              value={selectedNode.shape}
              onChange={(e) =>
                onNodeChange(selectedNode.id, { shape: e.target.value as NodeShape })
              }
            >
              <option value="circle">Circle</option>
              <option value="square">Square</option>
              <option value="rhombus">Rhombus</option>
              <option value="parallelogram">Parallelogram</option>
            </select>
          </label>

          <div className="artichart-props__row">
            <label className="artichart-props__field">
              <span className="artichart-props__label">Width</span>
              <DebouncedNumberInput
                className="artichart-props__input"
                min={1}
                value={selectedNode.width}
                onChange={(v) => onNodeChange(selectedNode.id, { width: v })}
              />
            </label>
            <label className="artichart-props__field">
              <span className="artichart-props__label">Height</span>
              <DebouncedNumberInput
                className="artichart-props__input"
                min={1}
                value={selectedNode.height}
                onChange={(v) => onNodeChange(selectedNode.id, { height: v })}
              />
            </label>
          </div>

          <label className="artichart-props__field">
            <span className="artichart-props__label">Z-Index</span>
            <DebouncedNumberInput
              className="artichart-props__input"
              min={0}
              value={selectedNode.zIndex}
              onChange={(v) => onNodeChange(selectedNode.id, { zIndex: v })}
            />
          </label>

          <label className="artichart-props__field">
            <span className="artichart-props__label">Background Color</span>
            <input
              className="artichart-props__color"
              type="color"
              value={selectedNode.backgroundColor || '#ffffff'}
              onChange={(e) =>
                onNodeChange(selectedNode.id, { backgroundColor: e.target.value })
              }
            />
          </label>

          <label className="artichart-props__field">
            <span className="artichart-props__label">Background Image</span>
            <input
              className="artichart-props__input"
              type="text"
              placeholder="Paste image URL…"
              value={selectedNode.backgroundImage || ''}
              onChange={(e) =>
                onNodeChange(selectedNode.id, { backgroundImage: e.target.value || undefined })
              }
            />
          </label>

          <label className="artichart-props__checkbox">
            <input
              type="checkbox"
              checked={!!selectedNode.tooltip}
              onChange={(e) =>
                onNodeChange(selectedNode.id, { tooltip: e.target.checked })
              }
            />
            <span className="artichart-props__label">Tooltip</span>
          </label>

          {selectedNode.tooltip && (
            <>
              <label className="artichart-props__field">
                <span className="artichart-props__label">Title</span>
                <input
                  className="artichart-props__input"
                  type="text"
                  placeholder="Tooltip title…"
                  value={selectedNode.tooltipTitle || ''}
                  onChange={(e) =>
                    onNodeChange(selectedNode.id, { tooltipTitle: e.target.value || undefined })
                  }
                />
              </label>

              <label className="artichart-props__field">
                <span className="artichart-props__label">Description</span>
                <textarea
                  className="artichart-props__textarea"
                  placeholder="Tooltip description…"
                  rows={3}
                  value={selectedNode.tooltipDescription || ''}
                  onChange={(e) =>
                    onNodeChange(selectedNode.id, { tooltipDescription: e.target.value || undefined })
                  }
                />
              </label>
            </>
          )}
        </div>
      )}

      {children}
    </aside>
  );
};

export default PropertiesDrawer;
