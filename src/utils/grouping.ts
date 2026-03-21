import type { CanvasNodeData } from '../components/CanvasNode/CanvasNode.types';
import { getNodesBounds } from './graph';

const GROUP_PADDING = 20;

export function createGroupFromSelection(
  nodeIds: string[],
  nodes: CanvasNodeData[],
  groupId: string,
): { groupNode: CanvasNodeData; updatedNodes: CanvasNodeData[] } {
  const selectedNodes = nodes.filter((n) => nodeIds.includes(n.id));
  if (selectedNodes.length === 0) {
    throw new Error('No nodes selected for grouping');
  }

  const bounds = getNodesBounds(selectedNodes);

  const groupNode: CanvasNodeData = {
    id: groupId,
    shape: 'rectangle',
    x: bounds.x - GROUP_PADDING,
    y: bounds.y - GROUP_PADDING,
    width: bounds.width + GROUP_PADDING * 2,
    height: bounds.height + GROUP_PADDING * 2,
    zIndex: 0,
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
    label: 'Group',
  };

  const updatedNodes = nodes.map((n) =>
    nodeIds.includes(n.id) ? { ...n, parentId: groupId } : n,
  );

  return { groupNode, updatedNodes };
}

export function ungroupNodes(
  groupId: string,
  nodes: CanvasNodeData[],
): CanvasNodeData[] {
  return nodes
    .filter((n) => n.id !== groupId)
    .map((n) => (n.parentId === groupId ? { ...n, parentId: undefined } : n));
}

export function getChildNodes(
  parentId: string,
  nodes: CanvasNodeData[],
): CanvasNodeData[] {
  return nodes.filter((n) => n.parentId === parentId);
}

export function moveGroup(
  parentId: string,
  dx: number,
  dy: number,
  nodes: CanvasNodeData[],
): CanvasNodeData[] {
  return nodes.map((n) => {
    if (n.id === parentId || n.parentId === parentId) {
      return { ...n, x: n.x + dx, y: n.y + dy };
    }
    return n;
  });
}

export function attachToParent(
  childId: string,
  parentId: string,
  nodes: CanvasNodeData[],
): CanvasNodeData[] {
  return nodes.map((n) =>
    n.id === childId ? { ...n, parentId } : n,
  );
}

export function detachFromParent(
  childId: string,
  nodes: CanvasNodeData[],
): CanvasNodeData[] {
  return nodes.map((n) =>
    n.id === childId ? { ...n, parentId: undefined } : n,
  );
}
