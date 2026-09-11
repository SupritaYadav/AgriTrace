import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
//
// The dev server is pinned to port 5174 to match the backend CORS origin
// (FRONTEND_URL=http://localhost:5174 in backend/.env) and the QR trace URL
// base (PUBLIC_TRACE_BASE_URL).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    strictPort: true,
  },
})
