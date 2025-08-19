import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import * as fs from 'fs'
import path from "path"

// https://vite.dev/config/
export default defineConfig({
  server: {
    host: true,  // listen on 0.0.0.0 so other devices can connect
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },

      "/socket.io": { target: "http://localhost:3000", ws: true,changeOrigin: true }, // <- proxy WS
    }
  },
  
  plugins: [react(),tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  
})
