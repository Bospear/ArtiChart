import React from 'react';

export interface EdgeLabelRendererProps {
  children: React.ReactNode;
}

export const EdgeLabelRenderer: React.FC<EdgeLabelRendererProps> = ({ children }) => {
  return (
    <div className="artichart-edge-label-renderer" data-minimap-ignore="true">
      {children}
    </div>
  );
};
