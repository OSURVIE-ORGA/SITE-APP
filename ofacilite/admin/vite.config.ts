import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// build : servi sous /admin par Caddy. dev : racine, l'API est appelée en
// cross-origin same-site (localhost) avec credentials -> le cookie passe.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/admin/' : '/',
  plugins: [react(), tailwindcss()],
  server: { port: 5173 },
}));
