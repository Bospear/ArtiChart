import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from 'react';
import type {
  ArtiChartAction,
  ArtiChartInstance,
  ArtiChartProviderProps,
  ArtiChartState,
  Viewport,
} from './types';
import {
  getConnectedEdges,
  getIncomers,
  getOutgoers,
} from '../utils/graph';

const DEFAULT_VIEWPORT: Viewport = { x: 0, y: 0, zoom: 0.5 };
const MAX_HISTORY = 50;

function createInitialState(
  props: ArtiChartProviderProps,
): ArtiChartState {
  return {
    nodes: props.initialNodes ?? [],
    edges: props.initialEdges ?? [],
    viewport: { ...DEFAULT_VIEWPORT, ...props.initialViewport },
    selection: null,
    connectionDraft: null,
    past: [],
    future: [],
  };
}

function reducer(
  state: ArtiChartState,
  action: ArtiChartAction,
): ArtiChartState {
  switch (action.type) {
    case 'SET_NODES':
      return { ...state, nodes: action.nodes };
    case 'ADD_NODE':
      return { ...state, nodes: [...state.nodes, action.node] };
    case 'UPDATE_NODE':
      return {
        ...state,
        nodes: state.nodes.map((n) =>
          n.id === action.id ? { ...n, ...action.patch } : n,
        ),
      };
    case 'REMOVE_NODE':
      return {
        ...state,
        nodes: state.nodes.filter((n) => n.id !== action.id),
        edges: state.edges.filter(
          (e) => e.source !== action.id && e.target !== action.id,
        ),
      };
    case 'SET_EDGES':
      return { ...state, edges: action.edges };
    case 'ADD_EDGE':
      return { ...state, edges: [...state.edges, action.edge] };
    case 'UPDATE_EDGE':
      return {
        ...state,
        edges: state.edges.map((e) =>
          e.id === action.id ? { ...e, ...action.patch } : e,
        ),
      };
    case 'REMOVE_EDGE':
      return {
        ...state,
        edges: state.edges.filter((e) => e.id !== action.id),
      };
    case 'SET_VIEWPORT':
      return {
        ...state,
        viewport: { ...state.viewport, ...action.viewport },
      };
    case 'SET_SELECTION':
      return { ...state, selection: action.selection };
    case 'SET_CONNECTION_DRAFT':
      return { ...state, connectionDraft: action.draft };
    case 'UPDATE_DRAFT_POSITION':
      if (!state.connectionDraft) return state;
      return {
        ...state,
        connectionDraft: {
          ...state.connectionDraft,
          x: action.x,
          y: action.y,
        },
      };
    case 'PUSH_HISTORY': {
      const entry = {
        nodes: state.nodes.map((n) => ({ ...n })),
        edges: state.edges.map((e) => ({ ...e })),
      };
      const past = [...state.past, entry].slice(-MAX_HISTORY);
      return { ...state, past, future: [] };
    }
    case 'UNDO': {
      if (state.past.length === 0) return state;
      const prev = state.past[state.past.length - 1];
      const current = {
        nodes: state.nodes.map((n) => ({ ...n })),
        edges: state.edges.map((e) => ({ ...e })),
      };
      return {
        ...state,
        nodes: prev.nodes,
        edges: prev.edges,
        past: state.past.slice(0, -1),
        future: [current, ...state.future],
      };
    }
    case 'REDO': {
      if (state.future.length === 0) return state;
      const next = state.future[0];
      const current = {
        nodes: state.nodes.map((n) => ({ ...n })),
        edges: state.edges.map((e) => ({ ...e })),
      };
      return {
        ...state,
        nodes: next.nodes,
        edges: next.edges,
        past: [...state.past, current],
        future: state.future.slice(1),
      };
    }
    case 'BATCH': {
      let s = state;
      for (const a of action.actions) s = reducer(s, a);
      return s;
    }
    case 'FROM_JSON':
      return {
        ...state,
        nodes: action.state.nodes,
        edges: action.state.edges,
        viewport: action.state.viewport,
        selection: null,
        connectionDraft: null,
      };
    case 'DELETE_SELECTED': {
      const { selection } = state;
      if (!selection) return state;

      if (selection.kind === 'node') {
        return reducer(state, { type: 'REMOVE_NODE', id: selection.id });
      }
      if (selection.kind === 'edge') {
        return reducer(state, { type: 'REMOVE_EDGE', id: selection.id });
      }
      if (selection.kind === 'multi') {
        const nodeSet = new Set(selection.nodeIds);
        const edgeSet = new Set(selection.edgeIds);
        return {
          ...state,
          nodes: state.nodes.filter((n) => !nodeSet.has(n.id)),
          edges: state.edges.filter(
            (e) =>
              !edgeSet.has(e.id) &&
              !nodeSet.has(e.source) &&
              !nodeSet.has(e.target),
          ),
          selection: null,
        };
      }
      return state;
    }
    default:
      return state;
  }
}

interface StoreContextValue {
  state: ArtiChartState;
  dispatch: React.Dispatch<ArtiChartAction>;
  instance: ArtiChartInstance;
  callbacks: Pick<
    ArtiChartProviderProps,
    'onConnect' | 'onConnectStart' | 'onConnectEnd' | 'isValidConnection'
  >;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function useStoreContext(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error('useStoreContext must be used within <ArtiChartProvider>');
  }
  return ctx;
}

export const ArtiChartProvider: React.FC<ArtiChartProviderProps> = (props) => {
  const {
    children,
    onConnect,
    onConnectStart,
    onConnectEnd,
    isValidConnection,
    onNodesChange,
    onEdgesChange,
    onSelectionChange,
  } = props;

  const [state, dispatch] = useReducer(reducer, props, createInitialState);
  const stateRef = useRef(state);
  stateRef.current = state;

  const callbacksRef = useRef({ onConnect, onConnectStart, onConnectEnd, isValidConnection });
  callbacksRef.current = { onConnect, onConnectStart, onConnectEnd, isValidConnection };

  useEffect(() => { onNodesChange?.(state.nodes); }, [state.nodes, onNodesChange]);
  useEffect(() => { onEdgesChange?.(state.edges); }, [state.edges, onEdgesChange]);
  useEffect(() => { onSelectionChange?.(state.selection); }, [state.selection, onSelectionChange]);

  const instance = useMemo<ArtiChartInstance>(() => {
    const getState = () => stateRef.current;

    return {
      getNodes: () => getState().nodes,
      getEdges: () => getState().edges,
      getViewport: () => getState().viewport,
      getSelection: () => getState().selection,

      setNodes: (nodesOrFn) => {
        const nodes =
          typeof nodesOrFn === 'function'
            ? nodesOrFn(getState().nodes)
            : nodesOrFn;
        dispatch({ type: 'SET_NODES', nodes });
      },
      setEdges: (edgesOrFn) => {
        const edges =
          typeof edgesOrFn === 'function'
            ? edgesOrFn(getState().edges)
            : edgesOrFn;
        dispatch({ type: 'SET_EDGES', edges });
      },
      addNode: (node) => dispatch({ type: 'ADD_NODE', node }),
      updateNode: (id, patch) => dispatch({ type: 'UPDATE_NODE', id, patch }),
      removeNode: (id) => dispatch({ type: 'REMOVE_NODE', id }),
      addEdge: (edge) => dispatch({ type: 'ADD_EDGE', edge }),
      updateEdge: (id, patch) => dispatch({ type: 'UPDATE_EDGE', id, patch }),
      removeEdge: (id) => dispatch({ type: 'REMOVE_EDGE', id }),
      setViewport: (v) => dispatch({ type: 'SET_VIEWPORT', viewport: v }),
      setSelection: (s) => dispatch({ type: 'SET_SELECTION', selection: s }),

      fitView: () => {
        /* implemented at Canvas level via DOM measurement */
      },
      zoomIn: () => {
        const v = getState().viewport;
        dispatch({ type: 'SET_VIEWPORT', viewport: { zoom: Math.min(v.zoom + 0.2, 3) } });
      },
      zoomOut: () => {
        const v = getState().viewport;
        dispatch({ type: 'SET_VIEWPORT', viewport: { zoom: Math.max(v.zoom - 0.2, 0.1) } });
      },

      toJSON: () => {
        const s = getState();
        return { nodes: s.nodes, edges: s.edges, viewport: s.viewport };
      },
      fromJSON: (data) => {
        dispatch({
          type: 'FROM_JSON',
          state: {
            nodes: data.nodes,
            edges: data.edges,
            viewport: data.viewport ?? DEFAULT_VIEWPORT,
          },
        });
      },

      pushHistory: () => dispatch({ type: 'PUSH_HISTORY' }),
      undo: () => dispatch({ type: 'UNDO' }),
      redo: () => dispatch({ type: 'REDO' }),
      deleteSelectedElements: () => dispatch({ type: 'DELETE_SELECTED' }),

      getIncomers: (nodeId) =>
        getIncomers(nodeId, getState().nodes, getState().edges),
      getOutgoers: (nodeId) =>
        getOutgoers(nodeId, getState().nodes, getState().edges),
      getConnectedEdges: (nodeId) =>
        getConnectedEdges(nodeId, getState().edges),
    };
  }, [dispatch]);

  const callbacks = useMemo(
    () => ({ onConnect, onConnectStart, onConnectEnd, isValidConnection }),
    [onConnect, onConnectStart, onConnectEnd, isValidConnection],
  );

  const value = useMemo<StoreContextValue>(
    () => ({ state, dispatch, instance, callbacks }),
    [state, dispatch, instance, callbacks],
  );

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
};
