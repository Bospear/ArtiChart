// Theming
export { ColorModeProvider, useColorMode } from './themes';
export type { ColorMode, ColorModeProviderProps } from './themes';

// Components
export { Canvas } from './components/Canvas';
export type { CanvasProps, BackgroundType } from './components/Canvas';

export { CanvasNode, getConnectorPositions } from './components/CanvasNode';
export type { CanvasNodeProps, CanvasNodeData, NodeShape, NodeTypes } from './components/CanvasNode';

export { NodeDrawer } from './components/NodeDrawer';
export type { NodeDrawerProps } from './components/NodeDrawer';

export { PropertiesDrawer } from './components/PropertiesDrawer';
export type {
  PropertiesDrawerProps,
  Selection,
  CanvasProperties,
} from './components/PropertiesDrawer';

// Edge components
export { EdgeLayer, ConnectionLine, EdgeLabelRenderer, EditableEdge } from './components/Edge';
export type {
  EdgeLayerProps,
  ConnectionLineProps,
  EdgeLabelRendererProps,
  EditableEdgeProps,
  ControlPoint,
} from './components/Edge';

// Edge path utilities
export {
  getBezierPath,
  getStraightPath,
  getSmoothStepPath,
  getStepPath,
  getClosestPointOnNodeBorder,
  getFloatingEdgeAnchors,
} from './components/Edge';
export type { PathParams } from './components/Edge';

// EdgeToolbar
export { EdgeToolbar } from './components/EdgeToolbar';
export type { EdgeToolbarProps, EdgeToolbarPosition } from './components/EdgeToolbar';

// Store & Provider
export { ArtiChartProvider } from './store/ArtiChartContext';
export type {
  EdgeData,
  EdgeType,
  MarkerType,
  EdgeMarkerConfig,
  Connection,
  ConnectionDraft,
  Viewport,
  ArtiChartState,
  ArtiChartProviderProps,
  ArtiChartInstance,
  OnConnect,
  OnConnectStart,
  OnConnectEnd,
  IsValidConnection,
} from './store/types';

// Hooks
export {
  useArtiChart,
  useNodes,
  useEdges,
  useViewport,
  useSelection,
  useConnectionDraft,
  useNodesState,
  useEdgesState,
  useOnSelectionChange,
  useNodeConnections,
  useHandleConnections,
  useNodesData,
  useKeyPress,
  useConnection,
  useIntersectingNodes,
  useKeyboardShortcuts,
  copyToClipboard,
  pasteFromClipboard,
  hasClipboard,
  useDagreLayout,
  useElkLayout,
  useForceLayout,
  useAutoLayout,
  resolveCollisions,
} from './hooks';
export type {
  KeyboardShortcutCallbacks,
  ClipboardData,
  LayoutDirection,
  LayoutOptions,
  LayoutResult,
  LayoutEngine,
  AutoLayoutOptions,
  ForceSimulationConfig,
  DagreInstance,
  ElkInstance,
} from './hooks';

// NodeToolbar
export { NodeToolbar } from './components/NodeToolbar';
export type { NodeToolbarProps, ToolbarPosition } from './components/NodeToolbar';

// NodeResizer
export { NodeResizer } from './components/NodeResizer';
export type { NodeResizerProps } from './components/NodeResizer';

// Controls
export { Controls } from './components/Controls';
export type { ControlsProps } from './components/Controls';

// Panel
export { Panel } from './components/Panel';
export type { PanelProps, PanelPosition } from './components/Panel';

// ViewportPortal
export { ViewportPortal } from './components/ViewportPortal';
export type { ViewportPortalProps } from './components/ViewportPortal';

// Image utilities
export { toImage, downloadImage, toSvgString } from './utils/image';
export type { ToImageOptions } from './utils/image';

// Whiteboard
export { WhiteboardLayer, useToolMode } from './components/Whiteboard';
export type {
  ToolMode,
  FreehandPath,
  DrawnRectangle,
  WhiteboardLayerProps,
} from './components/Whiteboard';

// Selection components
export { SelectionBox } from './components/SelectionBox';
export type { SelectionBoxProps } from './components/SelectionBox';

export { LassoSelection } from './components/LassoSelection';
export type { LassoSelectionProps } from './components/LassoSelection';

// ContextMenu
export { ContextMenu, useContextMenu } from './components/ContextMenu';
export type { ContextMenuProps, ContextMenuItem, UseContextMenuReturn } from './components/ContextMenu';

// HelperLines
export { HelperLines, getSnapLines, getSnappedPosition } from './components/HelperLines';
export type { HelperLinesProps } from './components/HelperLines';

// Graph utilities
export {
  getIncomers,
  getOutgoers,
  getConnectedEdges,
  isNode,
  isEdge,
  hasCycle,
  getNodesBounds,
  deleteNodeAndReconnect,
} from './utils';

// Grouping utilities
export {
  createGroupFromSelection,
  ungroupNodes,
  getChildNodes,
  moveGroup,
  attachToParent,
  detachFromParent,
} from './utils/grouping';
