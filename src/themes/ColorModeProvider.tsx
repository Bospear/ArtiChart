import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type ColorMode = 'light' | 'dark' | 'system';

interface ColorModeContextValue {
  colorMode: ColorMode;
  resolvedMode: 'light' | 'dark';
  setColorMode: (mode: ColorMode) => void;
}

const ColorModeContext = createContext<ColorModeContextValue>({
  colorMode: 'light',
  resolvedMode: 'light',
  setColorMode: () => {},
});

export function useColorMode(): ColorModeContextValue {
  return useContext(ColorModeContext);
}

export interface ColorModeProviderProps {
  colorMode?: ColorMode;
  children: React.ReactNode;
}

export const ColorModeProvider: React.FC<ColorModeProviderProps> = ({
  colorMode: controlledMode,
  children,
}) => {
  const [mode, setMode] = useState<ColorMode>(controlledMode ?? 'light');
  const [systemDark, setSystemDark] = useState(false);

  useEffect(() => {
    if (controlledMode !== undefined) setMode(controlledMode);
  }, [controlledMode]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemDark(mq.matches);
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const resolvedMode = mode === 'system' ? (systemDark ? 'dark' : 'light') : mode;

  const value = useMemo(
    () => ({ colorMode: mode, resolvedMode, setColorMode: setMode }),
    [mode, resolvedMode],
  );

  return (
    <ColorModeContext.Provider value={value}>
      <div data-artichart-color-mode={mode} style={{ width: '100%', height: '100%' }}>
        {children}
      </div>
    </ColorModeContext.Provider>
  );
};
