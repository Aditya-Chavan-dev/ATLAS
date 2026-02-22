import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
    plugins: [react()],
    css: {
        postcss: path.resolve(__dirname, './postcss.config.js'),
    },
    root: path.resolve(__dirname, '../../apps/web'),
    base: './',
    publicDir: 'public',
    build: {
        outDir: path.resolve(__dirname, '../dist/web'),
        emptyOutDir: true,
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, '../../apps/web/src'),
            '@atlas/shared': path.resolve(__dirname, '../../packages/shared/src'),
            // Bridge the isolated node_modules
            'react': path.resolve(__dirname, '../node_modules/react'),
            'react-dom': path.resolve(__dirname, '../node_modules/react-dom'),
        },
    },
    server: {
        port: 3000,
        fs: {
            allow: [
                path.resolve(__dirname, '../../'),
                path.resolve(__dirname, '../node_modules'),
            ],
        },
    },
});
