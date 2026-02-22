import React, { useCallback } from 'react';
import type { NodeDrawerProps } from './NodeDrawer.types';
import './NodeDrawer.css';

const NodeDrawer: React.FC<NodeDrawerProps> = ({
  onDragStart,
  onDragEnd,
  className = '',
}) => {
  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      e.dataTransfer.setData('application/artichart-node', 'base');
      e.dataTransfer.effectAllowed = 'copy';

      const ghost = document.createElement('div');
      ghost.style.width = '1px';
      ghost.style.height = '1px';
      ghost.style.opacity = '0';
      document.body.appendChild(ghost);
      e.dataTransfer.setDragImage(ghost, 0, 0);
      requestAnimationFrame(() => ghost.remove());

      onDragStart?.(e);
    },
    [onDragStart]
  );

  return (
    <aside className={`artichart-drawer artichart-drawer--left ${className}`.trim()}>
      <h2 className="artichart-drawer__title">Nodes</h2>
      <div className="artichart-drawer__list">
        <div
          className="artichart-drawer__item"
          draggable
          onDragStart={handleDragStart}
          onDragEnd={onDragEnd}
        >
          <span className="artichart-drawer__shape-preview artichart-drawer__shape-preview--base" />
          <span className="artichart-drawer__item-label">Base Node</span>
        </div>
      </div>
    </aside>
  );
};

export default NodeDrawer;
