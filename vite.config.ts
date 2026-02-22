import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig(({ command }) => {
  // Development mode - serve example app
  if (command === 'serve') {
    return {
      plugins: [react()],
      root: 'example',
    };
  }

  // Build mode - build library
  return {
    plugins: [
      react(),
      dts({
        insertTypesEntry: true,
        include: ['src/**/*'],
      }),
    ],
    build: {
      lib: {
        entry: resolve(__dirname, 'src/index.ts'),
        name: 'ArtiChart',
        formats: ['es', 'umd'],
        fileName: (format) => `artichart.${format}.js`,
      },
      rollupOptions: {
        external: ['react', 'react-dom'],
        output: {
          globals: {
            react: 'React',
            'react-dom': 'ReactDOM',
          },
          assetFileNames: (assetInfo) => {
            if (assetInfo.name === 'style.css') return 'style.css';
            return assetInfo.name || 'asset';
          },
        },
      },
      cssCodeSplit: false,
    },
  };
});
