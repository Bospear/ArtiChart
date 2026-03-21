import React from 'react';
import './Panel.css';

export type PanelPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

export interface PanelProps {
  position?: PanelPosition;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

const POSITION_MAP: Record<PanelPosition, React.CSSProperties> = {
  'top-left': { top: 10, left: 10 },
  'top-center': { top: 10, left: '50%', transform: 'translateX(-50%)' },
  'top-right': { top: 10, right: 10 },
  'bottom-left': { bottom: 10, left: 10 },
  'bottom-center': { bottom: 10, left: '50%', transform: 'translateX(-50%)' },
  'bottom-right': { bottom: 10, right: 10 },
};

export const Panel: React.FC<PanelProps> = ({
  position = 'top-left',
  className,
  style,
  children,
}) => {
  return (
    <div
      className={`artichart-panel ${className ?? ''}`.trim()}
      style={{
        position: 'absolute',
        zIndex: 10001,
        ...POSITION_MAP[position],
        ...style,
      }}
      data-minimap-ignore="true"
    >
      {children}
    </div>
  );
};
