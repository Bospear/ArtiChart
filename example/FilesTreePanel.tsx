import React, { useMemo } from 'react';
import { collectChildPathsFromNested, parseCanvasFileDoc } from './canvasFileStore';
import './FilesTreePanel.css';

export interface FileTreeNode {
  path: string;
  label: string;
  linkedNodeId?: string;
  children: FileTreeNode[];
  broken?: boolean;
}

function basename(path: string): string {
  const i = path.lastIndexOf('/');
  return i >= 0 ? path.slice(i + 1) : path;
}

function buildNodes(
  path: string,
  files: Record<string, string>,
  visiting: Set<string>,
): FileTreeNode {
  const raw = files[path];
  if (!raw) {
    return {
      path,
      label: basename(path),
      children: [],
      broken: true,
    };
  }
  const doc = parseCanvasFileDoc(raw);
  if (!doc) {
    return {
      path,
      label: basename(path),
      children: [],
      broken: true,
    };
  }

  const childPaths = [...new Set(collectChildPathsFromNested(doc.graph.nodes))];
  const children: FileTreeNode[] = [];

  for (const cp of childPaths) {
    if (visiting.has(cp)) {
      children.push({
        path: cp,
        label: basename(cp),
        children: [],
        broken: true,
      });
      continue;
    }
    visiting.add(cp);
    children.push(buildNodes(cp, files, visiting));
    visiting.delete(cp);
  }

  return {
    path,
    label: basename(path),
    linkedNodeId: doc.linkedNodeId,
    children,
  };
}

function FileTreeRow({
  node,
  depth,
  activePath,
  onSelect,
}: {
  node: FileTreeNode;
  depth: number;
  activePath: string | null;
  onSelect?: (path: string) => void;
}) {
  const isActive = activePath === node.path;
  return (
    <li className="files-tree__item">
      <button
        type="button"
        className={`files-tree__row${isActive ? ' files-tree__row--active' : ''}${node.broken ? ' files-tree__row--broken' : ''}`}
        style={{ paddingLeft: 12 + depth * 14 }}
        onClick={() => onSelect?.(node.path)}
      >
        <span className="files-tree__chevron" aria-hidden>
          {node.children.length > 0 ? '▾' : '·'}
        </span>
        <span className="files-tree__name">{node.label}</span>
        {node.linkedNodeId ? (
          <span className="files-tree__meta">via {node.linkedNodeId}</span>
        ) : null}
      </button>
      {node.children.length > 0 && (
        <ul className="files-tree__nested">
          {node.children.map((c) => (
            <FileTreeRow
              key={c.path}
              node={c}
              depth={depth + 1}
              activePath={activePath}
              onSelect={onSelect}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export interface FilesTreePanelProps {
  files: Record<string, string>;
  rootPath: string;
  activeFilePath: string | null;
  onSelectFile?: (path: string) => void;
}

const FilesTreePanel: React.FC<FilesTreePanelProps> = ({
  files,
  rootPath,
  activeFilePath,
  onSelectFile,
}) => {
  const tree = useMemo(() => {
    if (!rootPath) return null;
    return buildNodes(rootPath, files, new Set());
  }, [files, rootPath]);

  return (
    <div className="files-tree files-tree--panel">
      <p className="files-tree__hint">
        Each sub-canvas is a JSON file. Parent nodes store{' '}
        <code>data.artichartChildCanvas</code> and link geometry in{' '}
        <code>artichartLinkRect</code>.
      </p>
      {!tree || tree.broken ? (
        <p className="files-tree__empty">No file graph yet (save to generate).</p>
      ) : (
        <ul className="files-tree__root">
          <FileTreeRow
            node={tree}
            depth={0}
            activePath={activeFilePath}
            onSelect={onSelectFile}
          />
        </ul>
      )}
    </div>
  );
};

export default FilesTreePanel;
