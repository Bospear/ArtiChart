import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Canvas,
  CanvasNode,
  NodeDrawer,
  PropertiesDrawer,
  getConnectorPositions,
} from '../src';
import type {
  CanvasNodeData,
  Selection,
  CanvasProperties,
} from '../src';
import './App.css';

const DEFAULT_SIZE = 60;

let nextId = 1;

interface DragPreview {
  x: number;
  y: number;
}

interface NodeConnection {
  id: string;
  from: string;
  to: string;
  fromConnector: number;
  toConnector: number;
  label?: string;
}

interface ConnectorDraft {
  from: string;
  fromConnector: number;
  x: number;
  y: number;
}

function getAnchor(node: CanvasNodeData, connectorIndex: number) {
  const positions = getConnectorPositions(
    node.connectorCount ?? 1,
    node.width,
    node.height,
    node.shape,
  );
  const pos = positions[connectorIndex] ?? positions[0] ?? { x: node.width, y: node.height / 2 };
  return {
    x: node.x + pos.x,
    y: node.y + pos.y,
  };
}

function buildConnectorPath(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number
) {
  const distance = Math.max(40, Math.abs(toX - fromX) * 0.5);
  return `M ${fromX} ${fromY} C ${fromX + distance} ${fromY}, ${toX - distance} ${toY}, ${toX} ${toY}`;
}

const App: React.FC = () => {
  const [selection, setSelection] = useState<Selection>(null);
  const [cvProps, setCvProps] = useState<CanvasProperties>({
    backgroundType: 'blank',
    backgroundImage: '',
  });
  const [nodes, setNodes] = useState<CanvasNodeData[]>([]);
  const [connectors, setConnectors] = useState<NodeConnection[]>([]);
  const [zoom, setZoom] = useState(0.4);
  const [dragPreview, setDragPreview] = useState<DragPreview | null>(null);
  const [connectorDraft, setConnectorDraft] = useState<ConnectorDraft | null>(null);
  const isDraggingNode = useRef(false);

  const selectedNode =
    selection?.kind === 'node'
      ? nodes.find((n) => n.id === selection.id) ?? null
      : null;

  const selectedConnection =
    selection?.kind === 'connection'
      ? connectors.find((c) => c.id === selection.id) ?? null
      : null;

  const handleConnectionLabelChange = useCallback(
    (label: string) => {
      if (selection?.kind !== 'connection') return;
      setConnectors((prev) =>
        prev.map((c) =>
          c.id === selection.id ? { ...c, label: label || undefined } : c
        )
      );
    },
    [selection]
  );

  const handleNodeMove = useCallback(
    (id: string, x: number, y: number) => {
      setNodes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, x, y } : n))
      );
    },
    []
  );

  const updateNode = useCallback(
    (id: string, patch: Partial<CanvasNodeData>) => {
      setNodes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, ...patch } : n))
      );
    },
    []
  );

  const handleDrawerDragStart = useCallback(() => {
    isDraggingNode.current = true;
  }, []);

  const handleDrawerDragEnd = useCallback(() => {
    isDraggingNode.current = false;
    setDragPreview(null);
  }, []);

  const handleDragMove = useCallback((canvasX: number, canvasY: number) => {
    if (!isDraggingNode.current) return;
    setDragPreview({
      x: canvasX - DEFAULT_SIZE / 2,
      y: canvasY - DEFAULT_SIZE / 2,
    });
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragPreview(null);
  }, []);

  const handleDrop = useCallback(
    (canvasX: number, canvasY: number, e: React.DragEvent) => {
      const data = e.dataTransfer.getData('application/artichart-node');
      if (!data) return;
      setDragPreview(null);
      isDraggingNode.current = false;
      const newNode: CanvasNodeData = {
        id: `node-${nextId++}`,
        shape: 'circle',
        x: canvasX - DEFAULT_SIZE / 2,
        y: canvasY - DEFAULT_SIZE / 2,
        width: DEFAULT_SIZE,
        height: DEFAULT_SIZE,
        zIndex: 1,
      };
      setNodes((prev) => [...prev, newNode]);
      setSelection({ kind: 'node', id: newNode.id });
    },
    []
  );

  const handleResize = useCallback(
    (id: string, x: number, y: number, width: number, height: number) => {
      setNodes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, x, y, width, height } : n))
      );
    },
    []
  );

  const handleConnectStart = useCallback(
    (id: string, connectorIndex: number) => {
      const source = nodes.find((n) => n.id === id);
      if (!source) return;
      const anchor = getAnchor(source, connectorIndex);
      setConnectorDraft({
        from: id,
        fromConnector: connectorIndex,
        x: anchor.x,
        y: anchor.y,
      });
    },
    [nodes]
  );

  const handleConnectEnd = useCallback(
    (targetId: string, connectorIndex: number) => {
      setConnectorDraft((draft) => {
        if (!draft || draft.from === targetId) return null;

        setConnectors((prev) => {
          const alreadyExists = prev.some(
            (c) =>
              c.from === draft.from &&
              c.to === targetId &&
              c.fromConnector === draft.fromConnector &&
              c.toConnector === connectorIndex
          );
          if (alreadyExists) return prev;
          return [
            ...prev,
            {
              id: `conn-${draft.from}-${targetId}-${Date.now()}`,
              from: draft.from,
              to: targetId,
              fromConnector: draft.fromConnector,
              toConnector: connectorIndex,
            },
          ];
        });

        return null;
      });
    },
    []
  );

  const handleCanvasPointerMove = useCallback((canvasX: number, canvasY: number) => {
    setConnectorDraft((draft) => {
      if (!draft) return draft;
      return { ...draft, x: canvasX, y: canvasY };
    });
  }, []);

  useEffect(() => {
    const clearDraft = () => setConnectorDraft(null);
    window.addEventListener('mouseup', clearDraft);
    return () => window.removeEventListener('mouseup', clearDraft);
  }, []);

  const connectorPaths = connectors
    .map((connector) => {
      const fromNode = nodes.find((n) => n.id === connector.from);
      const toNode = nodes.find((n) => n.id === connector.to);
      if (!fromNode || !toNode) return null;

      const start = getAnchor(fromNode, connector.fromConnector);
      const end = getAnchor(toNode, connector.toConnector);
      return {
        id: connector.id,
        d: buildConnectorPath(start.x, start.y, end.x, end.y),
        midX: (start.x + end.x) / 2,
        midY: (start.y + end.y) / 2,
        label: connector.label,
      };
    })
    .filter(Boolean) as Array<{ id: string; d: string; midX: number; midY: number; label?: string }>;

  const draftPath = connectorDraft
    ? (() => {
        const fromNode = nodes.find((n) => n.id === connectorDraft.from);
        if (!fromNode) return null;
        const start = getAnchor(fromNode, connectorDraft.fromConnector);
        return buildConnectorPath(start.x, start.y, connectorDraft.x, connectorDraft.y);
      })()
    : null;

  return (
    <div className="app">
      <NodeDrawer
        onDragStart={handleDrawerDragStart}
        onDragEnd={handleDrawerDragEnd}
      />

      <main className="workspace">
        <Canvas
          canvasWidth={3000}
          canvasHeight={2000}
          initialZoom={0.4}
          showMinimap
          minimapWidth={160}
          minimapHeight={100}
          backgroundType={cvProps.backgroundType}
          backgroundImage={cvProps.backgroundImage}
          onBackgroundClick={() => setSelection({ kind: 'canvas' })}
          onDrop={handleDrop}
          onDragMove={handleDragMove}
          onPointerMove={handleCanvasPointerMove}
          onDragLeave={handleDragLeave}
          onZoomChange={setZoom}
        >
          <svg
            className="connector-layer"
            width={3000}
            height={2000}
            viewBox="0 0 3000 2000"
            aria-hidden="true"
            data-minimap-ignore="true"
          >
            {connectorPaths.map((path) => (
              <g key={path.id}>
                <path
                  d={path.d}
                  className="connector-layer__hit-area"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelection({ kind: 'connection', id: path.id });
                  }}
                />
                <path
                  d={path.d}
                  className={`connector-layer__path${
                    selection?.kind === 'connection' && selection.id === path.id
                      ? ' connector-layer__path--selected'
                      : ''
                  }`}
                />
              </g>
            ))}
            {connectorPaths.map((path) =>
              path.label ? (
                <text
                  key={`label-${path.id}`}
                  x={path.midX}
                  y={path.midY - 10}
                  className="connector-layer__label"
                >
                  {path.label}
                </text>
              ) : null
            )}
            {draftPath && <path d={draftPath} className="connector-layer__draft" />}
          </svg>

          {dragPreview && (
            <CanvasNode
              node={{
                id: '__preview__',
                shape: 'circle',
                x: dragPreview.x,
                y: dragPreview.y,
                width: DEFAULT_SIZE,
                height: DEFAULT_SIZE,
                zIndex: 9999,
              }}
              preview
            />
          )}
          {nodes.map((node) => (
            <CanvasNode
              key={node.id}
              node={node}
              zoom={zoom}
              connectable
              selected={selection?.kind === 'node' && selection.id === node.id}
              onSelect={(id) => setSelection({ kind: 'node', id })}
              onMove={handleNodeMove}
              onConnectStart={handleConnectStart}
              onConnectEnd={handleConnectEnd}
              onResize={handleResize}
            />
          ))}
        </Canvas>
      </main>

      <PropertiesDrawer
        selection={selection}
        canvasProps={cvProps}
        onCanvasChange={(patch) => setCvProps((p) => ({ ...p, ...patch }))}
        selectedNode={selectedNode}
        onNodeChange={updateNode}
        connectionLabel={selectedConnection?.label}
        onConnectionLabelChange={handleConnectionLabelChange}
      />
    </div>
  );
};

export default App;
