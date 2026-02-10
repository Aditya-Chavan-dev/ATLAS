import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';


// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],

    build: {
        // Security: Disable source maps in production
        sourcemap: process.env.NODE_ENV !== 'production',

        rollupOptions: {
            input: process.env.NODE_ENV === 'production'
                // Production: ONLY index.html
                ? { main: path.resolve(__dirname, 'index.html') }
                // Development: Include demo.html
                : {
                    main: path.resolve(__dirname, 'index.html'),
                    demo: path.resolve(__dirname, 'demo.html')
                }
        }
    },

    server: {
        headers: {
            // Security: Prevent iframe embedding (clickjacking protection)
            'X-Frame-Options': 'DENY',
            'X-Content-Type-Options': 'nosniff',

            // Security: Fixed CORS policy (Gap #5 fix)
            // Changed from 'unsafe-none' to 'require-corp'
            'Cross-Origin-Embedder-Policy': 'require-corp',
            'Cross-Origin-Opener-Policy': 'same-origin'
        }
    },

    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src')
        }
    }
});
