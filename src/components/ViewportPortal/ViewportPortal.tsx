import React from 'react';

export interface ViewportPortalProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const ViewportPortal: React.FC<ViewportPortalProps> = ({
  children,
  className,
  style,
}) => {
  return (
    <div
      className={`artichart-viewport-portal ${className ?? ''}`.trim()}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 10002,
        ...style,
      }}
      data-minimap-ignore="true"
    >
      {children}
    </div>
  );
};
