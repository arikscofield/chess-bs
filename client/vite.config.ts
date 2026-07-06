import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())

  const port = parseInt(env.VITE_FRONTEND_PORT) || 5173;

  return {
    plugins: [
      react(),
      tailwindcss(),
    ],
    server: {
      port: port,
    }
  }
})
