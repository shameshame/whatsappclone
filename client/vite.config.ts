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
    allowedHosts: process.env.NGROK_HOST ? [process.env.NGROK_HOST] : true,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },

      "/socket.io": { target: "http://localhost:3000", ws: true,changeOrigin: true }, // <- proxy WS
    },
    hmr: {
      host: process.env.NGROK_HOST, // e.g. b7c167d6c5eb.ngrok-free.app
      protocol: 'wss',
      clientPort: 443,
    },
  },
  
  plugins: [react(),tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  
})
