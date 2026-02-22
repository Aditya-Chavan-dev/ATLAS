import type { Config } from 'tailwindcss';

export default {
    content: [
        '../../apps/web/index.html',
        '../../apps/web/src/**/*.{js,ts,jsx,tsx}',
        '../../packages/shared/src/**/*.{js,ts,jsx,tsx}',
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    light: '#6366f1',
                    DEFAULT: '#4f46e5',
                    dark: '#4338ca',
                },
            },
        },
    },
    plugins: [],
} satisfies Config;
