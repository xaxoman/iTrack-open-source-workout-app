import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'FitTrack - Workout Tracker',
        short_name: 'FitTrack',
        description: 'Track and monitor your workout progress with FitTrack',
        theme_color: '#4f46e5',
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      }
    })
  ],
  // Configurazione per il server di sviluppo
  // se non funziona il live reload (SOPRATTUTTO PER CHI USA WSL)
  server: {
    watch: {
      usePolling: true
    }
  },
  
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
