import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    root: '.', // Project root
    publicDir: path.resolve(__dirname, 'config/public'), // Public assets directory
    build: {
        outDir: 'dist', // Output directory for build
    },
    server: {
        headers: {
            'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
            'Cross-Origin-Embedder-Policy': 'unsafe-none',
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    // Point to index.html in config folder
    // Vite will use this as the entry point
})
