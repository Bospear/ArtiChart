import React from 'react';
import './NodeToolbar.css';

export type ToolbarPosition = 'top' | 'bottom' | 'left' | 'right';

export interface NodeToolbarProps {
  nodeX: number;
  nodeY: number;
  nodeWidth: number;
  nodeHeight: number;
  visible?: boolean;
  position?: ToolbarPosition;
  offset?: number;
  className?: string;
  children: React.ReactNode;
}

function getToolbarStyle(
  props: NodeToolbarProps,
): React.CSSProperties {
  const { nodeX, nodeY, nodeWidth, nodeHeight, position = 'top', offset = 8 } = props;

  const base: React.CSSProperties = {
    position: 'absolute',
    pointerEvents: 'all',
    zIndex: 10000,
  };

  switch (position) {
    case 'top':
      return {
        ...base,
        left: nodeX + nodeWidth / 2,
        top: nodeY - offset,
        transform: 'translate(-50%, -100%)',
      };
    case 'bottom':
      return {
        ...base,
        left: nodeX + nodeWidth / 2,
        top: nodeY + nodeHeight + offset,
        transform: 'translate(-50%, 0)',
      };
    case 'left':
      return {
        ...base,
        left: nodeX - offset,
        top: nodeY + nodeHeight / 2,
        transform: 'translate(-100%, -50%)',
      };
    case 'right':
      return {
        ...base,
        left: nodeX + nodeWidth + offset,
        top: nodeY + nodeHeight / 2,
        transform: 'translate(0, -50%)',
      };
  }
}

export const NodeToolbar: React.FC<NodeToolbarProps> = (props) => {
  const { visible = true, className, children } = props;

  if (!visible) return null;

  return (
    <div
      className={`artichart-node-toolbar ${className ?? ''}`.trim()}
      style={getToolbarStyle(props)}
      data-minimap-ignore="true"
    >
      {children}
    </div>
  );
};
