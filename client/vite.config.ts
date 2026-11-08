import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  if (mode === 'production' && !env.VITE_API_URL) {
    throw new Error('VITE_API_URL must point to the deployed API, for example https://kanbot-api.onrender.com/api')
  }

  return {
    plugins: [tailwindcss(), react()],
    build: {
      rolldownOptions: {
        output: {
          codeSplitting: {
            groups: [
              {
                name: 'vendor',
                test: /node_modules[\\/]/,
                entriesAware: true,
                minSize: 30 * 1024,
                entriesAwareMergeThreshold: 30 * 1024,
              },
            ],
          },
        },
      },
    },
    resolve: {
      alias: {
        '@shared': fileURLToPath(new URL('./src/shared', import.meta.url)),
        '@features': fileURLToPath(new URL('./src/features', import.meta.url)),
      },
    },
  }
})
