import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArtiChartProvider,
  Canvas,
  CanvasNode,
  NodeDrawer,
  PropertiesDrawer,
  EdgeLayer,
  ConnectionLine,
  Controls,
  Panel,
  ContextMenu,
  HelperLines,
  NodeToolbar,
  ColorModeProvider,
  getConnectorPositions,
  useKeyboardShortcuts,
  copyToClipboard,
  pasteFromClipboard,
  getSnappedPosition,
  useContextMenu,
  getChildNodes,
} from '../src';
import type {
  CanvasNodeData,
  Selection,
  CanvasProperties,
  EdgeData,
  ConnectionDraft,
  ColorMode,
  EdgeType,
  NodeShape,
  ContextMenuItem,
} from '../src';
import './App.css';

const DEFAULT_SIZE = 60;
const CANVAS_W = 3000;
const CANVAS_H = 2000;
const SNAP_THRESHOLD = 5;

const SHAPES: NodeShape[] = [
  'circle', 'ellipse', 'square', 'rectangle', 'rhombus',
  'parallelogram', 'triangle', 'hexagon', 'diamond', 'star',
];

const EDGE_TYPES: EdgeType[] = ['bezier', 'straight', 'smoothstep', 'step'];

function buildInitialNodes(): CanvasNodeData[] {
  const COLS = 5;
  const GAP_X = 180;
  const GAP_Y = 160;
  const START_X = 200;
  const START_Y = 120;

  const shapeNodes: CanvasNodeData[] = SHAPES.map((shape, i) => {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const w = shape === 'ellipse' ? 90 : 60;
    return {
      id: `demo-${i + 1}`,
      shape,
      x: START_X + col * GAP_X,
      y: START_Y + row * GAP_Y,
      width: w,
      height: 60,
      zIndex: 1,
      connectorCount: 4,
      label: shape,
    };
  });

  // Expand/collapse group: parent with 3 children
  const groupX = 1000;
  const groupY = 400;
  const groupNodes: CanvasNodeData[] = [
    {
      id: 'group-1',
      shape: 'rectangle',
      x: groupX,
      y: groupY,
      width: 220,
      height: 40,
      zIndex: 2,
      connectorCount: 2,
      label: 'Expandable group',
      collapsed: false,
    },
    {
      id: 'group-child-1',
      shape: 'circle',
      x: groupX + 20,
      y: groupY + 50,
      width: 50,
      height: 50,
      zIndex: 1,
      connectorCount: 2,
      label: 'Child 1',
      parentId: 'group-1',
    },
    {
      id: 'group-child-2',
      shape: 'square',
      x: groupX + 90,
      y: groupY + 50,
      width: 50,
      height: 50,
      zIndex: 1,
      connectorCount: 2,
      label: 'Child 2',
      parentId: 'group-1',
    },
    {
      id: 'group-child-3',
      shape: 'diamond',
      x: groupX + 160,
      y: groupY + 50,
      width: 50,
      height: 50,
      zIndex: 1,
      connectorCount: 2,
      label: 'Child 3',
      parentId: 'group-1',
    },
  ];

  return [...shapeNodes, ...groupNodes];
}

function buildInitialEdges(): EdgeData[] {
  return [
    { id: 'demo-e1', source: 'demo-1', target: 'demo-2', sourceConnector: 1, targetConnector: 3, type: 'bezier', markerEnd: 'arrowclosed' as const, label: 'bezier' },
    { id: 'demo-e2', source: 'demo-2', target: 'demo-3', sourceConnector: 1, targetConnector: 3, type: 'straight', markerEnd: 'arrowclosed' as const, label: 'straight' },
    { id: 'demo-e3', source: 'demo-3', target: 'demo-4', sourceConnector: 1, targetConnector: 3, type: 'smoothstep', markerEnd: 'arrowclosed' as const, label: 'smoothstep' },
    { id: 'demo-e4', source: 'demo-4', target: 'demo-5', sourceConnector: 1, targetConnector: 3, type: 'step', markerEnd: 'arrowclosed' as const, label: 'step' },
    { id: 'demo-e5', source: 'demo-6', target: 'demo-7', sourceConnector: 1, targetConnector: 3, type: 'bezier', markerEnd: 'arrow' as const, label: 'arrow' },
    { id: 'demo-e6', source: 'demo-7', target: 'demo-8', sourceConnector: 1, targetConnector: 3, type: 'bezier', markerEnd: 'arrowclosed' as const, animated: true, label: 'animated' },
    { id: 'demo-e7', source: 'demo-1', target: 'demo-6', sourceConnector: 2, targetConnector: 0, type: 'smoothstep', markerEnd: 'arrowclosed' as const },
    { id: 'demo-e8', source: 'demo-5', target: 'demo-10', sourceConnector: 2, targetConnector: 0, type: 'step', markerEnd: 'arrowclosed' as const },
  ];
}

let nextId = 20;
let nextEdgeId = 20;

interface HistoryEntry {
  nodes: CanvasNodeData[];
  edges: EdgeData[];
}

const App: React.FC = () => {
  const [selection, setSelection] = useState<Selection>(null);
  const [cvProps, setCvProps] = useState<CanvasProperties>({
    backgroundType: 'dotted',
    backgroundImage: '',
  });
  const [nodes, setNodes] = useState<CanvasNodeData[]>(buildInitialNodes);
  const [edges, setEdges] = useState<EdgeData[]>(buildInitialEdges);
  const [zoom, setZoom] = useState(0.5);
  const [dragPreview, setDragPreview] = useState<{ x: number; y: number } | null>(null);
  const [connectorDraft, setConnectorDraft] = useState<ConnectionDraft | null>(null);
  const [colorMode, setColorMode] = useState<ColorMode>('light');
  const [edgeType, setEdgeType] = useState<EdgeType>('bezier');
  const [movingNodeId, setMovingNodeId] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);

  const isDraggingNode = useRef(false);

  // Undo / Redo
  const [past, setPast] = useState<HistoryEntry[]>([]);
  const [future, setFuture] = useState<HistoryEntry[]>([]);

  const pushHistory = useCallback(() => {
    setPast((p) => [...p, { nodes, edges }].slice(-30));
    setFuture([]);
  }, [nodes, edges]);

  const undo = useCallback(() => {
    setPast((p) => {
      if (p.length === 0) return p;
      const prev = p[p.length - 1];
      setFuture((f) => [{ nodes, edges }, ...f]);
      setNodes(prev.nodes);
      setEdges(prev.edges);
      return p.slice(0, -1);
    });
  }, [nodes, edges]);

  const redo = useCallback(() => {
    setFuture((f) => {
      if (f.length === 0) return f;
      const next = f[0];
      setPast((p) => [...p, { nodes, edges }]);
      setNodes(next.nodes);
      setEdges(next.edges);
      return f.slice(1);
    });
  }, [nodes, edges]);

  // Context menu
  const { menuPosition, onContextMenu, closeMenu } = useContextMenu();

  const contextMenuItems: ContextMenuItem[] = [
    {
      label: 'Undo',
      action: undo,
      disabled: past.length === 0,
    },
    {
      label: 'Redo',
      action: redo,
      disabled: future.length === 0,
    },
    { label: '', action: () => {}, separator: true },
    {
      label: 'Copy',
      action: () => copyToClipboard(selection, nodes, edges),
      disabled: !selection || selection.kind === 'canvas',
    },
    {
      label: 'Paste',
      action: () => {
        const data = pasteFromClipboard();
        if (data) {
          pushHistory();
          setNodes((prev) => [...prev, ...data.nodes]);
          setEdges((prev) => [...prev, ...data.edges]);
        }
      },
    },
    { label: '', action: () => {}, separator: true },
    {
      label: 'Delete',
      action: () => {
        if (!selection) return;
        pushHistory();
        if (selection.kind === 'node') {
          setNodes((prev) => prev.filter((n) => n.id !== selection.id));
          setEdges((prev) => prev.filter((e) => e.source !== selection.id && e.target !== selection.id));
        } else if (selection.kind === 'edge') {
          setEdges((prev) => prev.filter((e) => e.id !== selection.id));
        }
        setSelection(null);
      },
      disabled: !selection || selection.kind === 'canvas',
    },
    { label: '', action: () => {}, separator: true },
    {
      label: colorMode === 'dark' ? 'Light Mode' : 'Dark Mode',
      action: () => setColorMode((m) => (m === 'dark' ? 'light' : 'dark')),
    },
  ];

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onUndo: undo,
    onRedo: redo,
    onCopy: () => copyToClipboard(selection, nodes, edges),
    onPaste: () => {
      const data = pasteFromClipboard();
      if (data) {
        pushHistory();
        setNodes((prev) => [...prev, ...data.nodes]);
        setEdges((prev) => [...prev, ...data.edges]);
      }
    },
    onDelete: () => {
      if (!selection) return;
      pushHistory();
      if (selection.kind === 'node') {
        setNodes((prev) => prev.filter((n) => n.id !== selection.id));
        setEdges((prev) => prev.filter((e) => e.source !== selection.id && e.target !== selection.id));
      } else if (selection.kind === 'edge') {
        setEdges((prev) => prev.filter((e) => e.id !== selection.id));
      } else if (selection.kind === 'multi') {
        const nodeSet = new Set(selection.nodeIds);
        const edgeSet = new Set(selection.edgeIds);
        setNodes((prev) => prev.filter((n) => !nodeSet.has(n.id)));
        setEdges((prev) => prev.filter((e) => !edgeSet.has(e.id) && !nodeSet.has(e.source) && !nodeSet.has(e.target)));
      }
      setSelection(null);
    },
    onSelectAll: () => {
      setSelection({
        kind: 'multi',
        nodeIds: nodes.map((n) => n.id),
        edgeIds: edges.map((e) => e.id),
      });
    },
  });

  const selectedNode =
    selection?.kind === 'node'
      ? nodes.find((n) => n.id === selection.id) ?? null
      : null;

  const visibleNodeIds = useMemo(() => {
    const set = new Set<string>();
    for (const node of nodes) {
      if (!node.parentId) set.add(node.id);
      else {
        const parent = nodes.find((n) => n.id === node.parentId);
        if (!parent?.collapsed) set.add(node.id);
      }
    }
    return set;
  }, [nodes]);

  const visibleEdges = useMemo(
    () => edges.filter((e) => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target)),
    [edges, visibleNodeIds],
  );

  const selectedEdge =
    selection?.kind === 'edge'
      ? edges.find((e) => e.id === selection.id) ?? null
      : null;

  const handleEdgeLabelChange = useCallback(
    (label: string) => {
      if (selection?.kind !== 'edge') return;
      setEdges((prev) =>
        prev.map((e) =>
          e.id === selection.id ? { ...e, label: label || undefined } : e,
        ),
      );
    },
    [selection],
  );

  const handleNodeMove = useCallback(
    (id: string, x: number, y: number) => {
      if (locked) return;
      setMovingNodeId(id);
      setNodes((prev) => {
        const snapped = getSnappedPosition(prev, id, x, y, SNAP_THRESHOLD);
        return prev.map((n) => (n.id === id ? { ...n, x: snapped.x, y: snapped.y } : n));
      });
    },
    [locked],
  );

  const handleNodeMoveEnd = useCallback(() => {
    setMovingNodeId(null);
  }, []);

  useEffect(() => {
    const onUp = () => {
      if (movingNodeId) {
        setMovingNodeId(null);
      }
    };
    window.addEventListener('mouseup', onUp);
    return () => window.removeEventListener('mouseup', onUp);
  }, [movingNodeId]);

  const updateNode = useCallback(
    (id: string, patch: Partial<CanvasNodeData>) => {
      pushHistory();
      setNodes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, ...patch } : n)),
      );
    },
    [pushHistory],
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
      pushHistory();
      const shape = SHAPES[nodes.length % SHAPES.length];
      const newNode: CanvasNodeData = {
        id: `node-${nextId++}`,
        shape,
        x: canvasX - DEFAULT_SIZE / 2,
        y: canvasY - DEFAULT_SIZE / 2,
        width: shape === 'ellipse' ? 90 : DEFAULT_SIZE,
        height: DEFAULT_SIZE,
        zIndex: 1,
        connectorCount: 4,
      };
      setNodes((prev) => [...prev, newNode]);
      setSelection({ kind: 'node', id: newNode.id });
    },
    [nodes.length, pushHistory],
  );

  const handleResize = useCallback(
    (id: string, x: number, y: number, width: number, height: number) => {
      setNodes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, x, y, width, height } : n)),
      );
    },
    [],
  );

  const handleConnectStart = useCallback(
    (id: string, connectorIndex: number) => {
      const source = nodes.find((n) => n.id === id);
      if (!source) return;
      const positions = getConnectorPositions(
        source.connectorCount ?? 1,
        source.width,
        source.height,
        source.shape,
      );
      const pos = positions[connectorIndex] ?? positions[0];
      if (!pos) return;
      setConnectorDraft({
        source: id,
        sourceConnector: connectorIndex,
        x: source.x + pos.x,
        y: source.y + pos.y,
      });
    },
    [nodes],
  );

  const handleConnectEnd = useCallback(
    (targetId: string, connectorIndex: number) => {
      setConnectorDraft((draft) => {
        if (!draft || draft.source === targetId) return null;

        pushHistory();
        setEdges((prev) => {
          const alreadyExists = prev.some(
            (e) =>
              e.source === draft.source &&
              e.target === targetId &&
              (e.sourceConnector ?? 0) === draft.sourceConnector &&
              (e.targetConnector ?? 0) === connectorIndex,
          );
          if (alreadyExists) return prev;
          return [
            ...prev,
            {
              id: `edge-${nextEdgeId++}`,
              source: draft.source,
              target: targetId,
              sourceConnector: draft.sourceConnector,
              targetConnector: connectorIndex,
              type: edgeType,
              markerEnd: 'arrowclosed' as const,
            },
          ];
        });

        return null;
      });
    },
    [edgeType, pushHistory],
  );

  const handleCanvasPointerMove = useCallback(
    (canvasX: number, canvasY: number) => {
      setConnectorDraft((draft) => {
        if (!draft) return draft;
        return { ...draft, x: canvasX, y: canvasY };
      });
    },
    [],
  );

  const connectedToNode = useRef(false);

  const origHandleConnectEnd = handleConnectEnd;
  const wrappedConnectEnd = useCallback(
    (targetId: string, connectorIndex: number) => {
      connectedToNode.current = true;
      origHandleConnectEnd(targetId, connectorIndex);
    },
    [origHandleConnectEnd],
  );

  useEffect(() => {
    const onMouseUp = () => {
      if (connectedToNode.current) {
        connectedToNode.current = false;
        return;
      }
      setConnectorDraft((draft) => {
        if (!draft) return null;

        pushHistory();
        const newNodeId = `node-${nextId++}`;
        const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
        const newNode: CanvasNodeData = {
          id: newNodeId,
          shape,
          x: draft.x - DEFAULT_SIZE / 2,
          y: draft.y - DEFAULT_SIZE / 2,
          width: DEFAULT_SIZE,
          height: DEFAULT_SIZE,
          zIndex: 1,
          connectorCount: 4,
        };

        setNodes((prev) => [...prev, newNode]);
        setEdges((prev) => [
          ...prev,
          {
            id: `edge-${nextEdgeId++}`,
            source: draft.source,
            target: newNodeId,
            sourceConnector: draft.sourceConnector,
            targetConnector: 0,
            type: edgeType,
            markerEnd: 'arrowclosed' as const,
          },
        ]);
        setSelection({ kind: 'node', id: newNodeId });

        return null;
      });
    };
    window.addEventListener('mouseup', onMouseUp);
    return () => window.removeEventListener('mouseup', onMouseUp);
  }, [edgeType, pushHistory]);

  return (
    <ColorModeProvider colorMode={colorMode}>
      <ArtiChartProvider initialNodes={nodes} initialEdges={edges}>
        <div className="app" onContextMenu={onContextMenu}>
          <NodeDrawer
            onDragStart={handleDrawerDragStart}
            onDragEnd={handleDrawerDragEnd}
          />

          <main className="workspace">
            <Canvas
              canvasWidth={CANVAS_W}
              canvasHeight={CANVAS_H}
              initialZoom={0.5}
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
              <EdgeLayer
                nodes={nodes}
                edges={visibleEdges}
                selection={selection}
                onSelectEdge={(id) => setSelection({ kind: 'edge', id })}
                canvasWidth={CANVAS_W}
                canvasHeight={CANVAS_H}
              />

              <HelperLines
                nodes={nodes}
                movingNodeId={movingNodeId}
                snapThreshold={SNAP_THRESHOLD}
                canvasWidth={CANVAS_W}
                canvasHeight={CANVAS_H}
              />

              {connectorDraft && (
                <svg
                  className="artichart-edge-layer"
                  width={CANVAS_W}
                  height={CANVAS_H}
                  viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
                  aria-hidden="true"
                  data-minimap-ignore="true"
                >
                  <ConnectionLine draft={connectorDraft} nodes={nodes} />
                </svg>
              )}

              {dragPreview && (
                <CanvasNode
                  node={{
                    id: '__preview__',
                    shape: SHAPES[nodes.length % SHAPES.length],
                    x: dragPreview.x,
                    y: dragPreview.y,
                    width: DEFAULT_SIZE,
                    height: DEFAULT_SIZE,
                    zIndex: 9999,
                  }}
                  preview
                />
              )}

              {nodes
                .filter((node) => {
                  if (!node.parentId) return true;
                  const parent = nodes.find((n) => n.id === node.parentId);
                  return !parent?.collapsed;
                })
                .map((node) => (
                  <CanvasNode
                    key={node.id}
                    node={node}
                    zoom={zoom}
                    connectable={!locked}
                    selected={
                      (selection?.kind === 'node' && selection.id === node.id) ||
                      (selection?.kind === 'multi' && selection.nodeIds.includes(node.id))
                    }
                    onSelect={(id) => setSelection({ kind: 'node', id })}
                    onMove={handleNodeMove}
                    onConnectStart={handleConnectStart}
                    onConnectEnd={wrappedConnectEnd}
                    onResize={handleResize}
                  />
                ))}

              {selectedNode && (
                <NodeToolbar
                  nodeX={selectedNode.x}
                  nodeY={selectedNode.y}
                  nodeWidth={selectedNode.width}
                  nodeHeight={selectedNode.height}
                  position="top"
                >
                  {getChildNodes(selectedNode.id, nodes).length > 0 && (
                    <button
                      onClick={() => {
                        pushHistory();
                        setNodes((prev) =>
                          prev.map((n) =>
                            n.id === selectedNode.id
                              ? { ...n, collapsed: !n.collapsed }
                              : n,
                          ),
                        );
                      }}
                      title={selectedNode.collapsed ? 'Expand' : 'Collapse'}
                    >
                      {selectedNode.collapsed ? 'Expand' : 'Collapse'}
                    </button>
                  )}
                  <button
                    onClick={() => {
                      pushHistory();
                      setNodes((prev) => prev.filter((n) => n.id !== selectedNode.id));
                      setEdges((prev) =>
                        prev.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id),
                      );
                      setSelection(null);
                    }}
                    title="Delete node"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => {
                      pushHistory();
                      const clone: CanvasNodeData = {
                        ...selectedNode,
                        id: `node-${nextId++}`,
                        x: selectedNode.x + 20,
                        y: selectedNode.y + 20,
                      };
                      setNodes((prev) => [...prev, clone]);
                      setSelection({ kind: 'node', id: clone.id });
                    }}
                    title="Duplicate node"
                  >
                    Duplicate
                  </button>
                </NodeToolbar>
              )}

              <Controls
                zoom={zoom}
                locked={locked}
                onZoomIn={() => setZoom((z) => Math.min(z + 0.2, 3))}
                onZoomOut={() => setZoom((z) => Math.max(z - 0.2, 0.1))}
                onToggleLock={() => setLocked((l) => !l)}
                position="bottom-left"
              />

              <Panel position="top-right">
                <div className="toolbar-panel">
                  <label className="toolbar-panel__label">
                    Edge Type
                    <select
                      className="toolbar-panel__select"
                      value={edgeType}
                      onChange={(e) => setEdgeType(e.target.value as EdgeType)}
                    >
                      {EDGE_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    className="toolbar-panel__btn"
                    onClick={() => setColorMode((m) => (m === 'dark' ? 'light' : 'dark'))}
                  >
                    {colorMode === 'dark' ? 'Light' : 'Dark'}
                  </button>
                  <span className="toolbar-panel__info">
                    {nodes.length} nodes &middot; {edges.length} edges
                  </span>
                </div>
              </Panel>
            </Canvas>
          </main>

          <PropertiesDrawer
            selection={selection}
            canvasProps={cvProps}
            onCanvasChange={(patch) => setCvProps((p) => ({ ...p, ...patch }))}
            selectedNode={selectedNode}
            nodes={nodes}
            onNodeChange={updateNode}
            connectionLabel={selectedEdge?.label}
            onConnectionLabelChange={handleEdgeLabelChange}
          />

          <ContextMenu
            items={contextMenuItems}
            position={menuPosition}
            onClose={closeMenu}
          />
        </div>
      </ArtiChartProvider>
    </ColorModeProvider>
  );
};

export default App;
