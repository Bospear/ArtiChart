import React, { useCallback, useRef, useState } from 'react';
import {
  Canvas,
  CanvasNode,
  NodeDrawer,
  PropertiesDrawer,
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

const App: React.FC = () => {
  const [selection, setSelection] = useState<Selection>(null);
  const [cvProps, setCvProps] = useState<CanvasProperties>({
    backgroundType: 'blank',
    backgroundImage: '',
  });
  const [nodes, setNodes] = useState<CanvasNodeData[]>([]);
  const [zoom, setZoom] = useState(0.4);
  const [dragPreview, setDragPreview] = useState<DragPreview | null>(null);
  const isDraggingNode = useRef(false);

  const selectedNode =
    selection?.kind === 'node'
      ? nodes.find((n) => n.id === selection.id) ?? null
      : null;

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
          onDragLeave={handleDragLeave}
          onZoomChange={setZoom}
        >
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
              selected={selection?.kind === 'node' && selection.id === node.id}
              onSelect={(id) => setSelection({ kind: 'node', id })}
              onMove={handleNodeMove}
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
      />
    </div>
  );
};

export default App;
