import { defineConfig } from 'vite';

export default defineConfig({
    build: {
        lib: {
            entry: 'src/ansi.js',
            name: 'Ansi',
            formats: ['iife'],
            fileName: () => 'ansi.js',
        },
    },
});
