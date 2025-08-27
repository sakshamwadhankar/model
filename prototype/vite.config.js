import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => {
    return {
        build: {
            // ✅ Vercel को "dist" चाहिए, इसलिए यहाँ बदल दिया
            outDir: 'dist',
        },
        server: {
            open: true,
            port: 3000,
        },
        plugins: [react()],
    };
});
