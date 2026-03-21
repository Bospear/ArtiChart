import React from 'react';
import './EdgeToolbar.css';

export type EdgeToolbarPosition = 'top' | 'bottom' | 'center';

export interface EdgeToolbarProps {
  labelX: number;
  labelY: number;
  visible?: boolean;
  position?: EdgeToolbarPosition;
  offset?: number;
  className?: string;
  children: React.ReactNode;
}

export const EdgeToolbar: React.FC<EdgeToolbarProps> = ({
  labelX,
  labelY,
  visible = true,
  position = 'top',
  offset = 20,
  className,
  children,
}) => {
  if (!visible) return null;

  let top = labelY;
  let transformY = '-50%';

  switch (position) {
    case 'top':
      top = labelY - offset;
      transformY = '-100%';
      break;
    case 'bottom':
      top = labelY + offset;
      transformY = '0';
      break;
    case 'center':
      transformY = '-50%';
      break;
  }

  return (
    <div
      className={`artichart-edge-toolbar ${className ?? ''}`.trim()}
      style={{
        position: 'absolute',
        left: labelX,
        top,
        transform: `translate(-50%, ${transformY})`,
        pointerEvents: 'all',
        zIndex: 10000,
      }}
      data-minimap-ignore="true"
    >
      {children}
    </div>
  );
};
