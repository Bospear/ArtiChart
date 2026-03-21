import React, { useCallback, useEffect, useRef, useState } from 'react';
import './ContextMenu.css';

export interface ContextMenuItem {
  label: string;
  action: () => void;
  disabled?: boolean;
  separator?: boolean;
}

export interface ContextMenuProps {
  items: ContextMenuItem[];
  position: { x: number; y: number } | null;
  onClose: () => void;
  className?: string;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  items,
  position,
  onClose,
  className,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!position) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('mousedown', handleClick);
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('mousedown', handleClick);
      window.removeEventListener('keydown', handleKey);
    };
  }, [position, onClose]);

  if (!position) return null;

  return (
    <div
      ref={ref}
      className={`artichart-context-menu ${className ?? ''}`.trim()}
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        zIndex: 99999,
      }}
    >
      {items.map((item, i) =>
        item.separator ? (
          <div key={i} className="artichart-context-menu__separator" />
        ) : (
          <button
            key={i}
            className="artichart-context-menu__item"
            onClick={() => {
              item.action();
              onClose();
            }}
            disabled={item.disabled}
          >
            {item.label}
          </button>
        ),
      )}
    </div>
  );
};

export interface UseContextMenuReturn {
  menuPosition: { x: number; y: number } | null;
  onContextMenu: (e: React.MouseEvent) => void;
  closeMenu: () => void;
}

export function useContextMenu(): UseContextMenuReturn {
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null);

  const onContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setMenuPosition({ x: e.clientX, y: e.clientY });
  }, []);

  const closeMenu = useCallback(() => {
    setMenuPosition(null);
  }, []);

  return { menuPosition, onContextMenu, closeMenu };
}
