import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, '.', '');
  
  return {
    plugins: [react()],
    build: {
      outDir: 'dist',
      emptyOutDir: true,
    },
    // Mobil uygulamalarda dosya yollarının (assets) düzgün çalışması için base './' olmalı
    base: './', 
    define: {
      // Android Webview'da "process is not defined" hatasını önler.
      // API Key'i build zamanında kodun içine gömer.
      'process.env.API_KEY': JSON.stringify(env.API_KEY || '')
    }
  };
});