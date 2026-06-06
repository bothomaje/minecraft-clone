import { defineConfig } from 'vite';

export default defineConfig(({ command }) => ({
    base: command === 'build' ? '/minecraft-clone/' : '/',
    build: {
        sourcemap: true,
    },
}));