// Minimale Config - nur das React-Plugin (notwendig für JSX)
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5173
  }
  // Keine weiteren Einstellungen, die Probleme verursachen könnten
});
