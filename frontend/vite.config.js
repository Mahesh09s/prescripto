import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // Determine backend URL for dev proxy
  // Strip trailing /api if present in VITE_API_URL (proxy reattaches it)
  const backendTarget = env.VITE_API_URL
    ? env.VITE_API_URL.replace(/\/api$/, '')
    : 'http://localhost:5000'

  return {
    plugins: [react()],

    server: {
      port: 5173,
      // Dev proxy: /api → backend (avoids CORS in development)
      proxy: {
        '/api': {
          target: backendTarget,
          changeOrigin: true,
          secure: false,
          // Do NOT rewrite — backend expects /api prefix
        },
      },
    },

    build: {
      // Warn when individual chunks exceed 700 kB
      chunkSizeWarningLimit: 700,
      // Enable minification (default: esbuild — very fast)
      minify: 'esbuild',
      // Source maps in production for error tracking (optional — remove if bundle size matters)
      sourcemap: false,
      rollupOptions: {
        output: {
          // Split vendor chunks for better long-term caching
          manualChunks: {
            // Routing
            'vendor-router': ['react-router-dom'],
            // HTTP client
            'vendor-axios': ['axios'],
            // Markdown rendering (used only in chat)
            'vendor-markdown': ['react-markdown', 'remark-gfm'],
            // Google OAuth
            'vendor-google': ['@react-oauth/google'],
          },
        },
      },
    },

    // Improve dev server startup speed
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        'axios',
        '@react-oauth/google',
      ],
    },
  }
})
