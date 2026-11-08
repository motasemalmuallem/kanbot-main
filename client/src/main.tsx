import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import { RouterProvider } from 'react-router'
import { AuthProvider } from './features/auth'
import { registerQueryCacheClear } from '@shared/api/client'
import { router } from './router'
import { LanguageProvider } from './shared/i18n/LanguageProvider'
import { ThemeProvider } from './shared/theme/ThemeProvider'

document.documentElement.dataset.theme = localStorage.getItem('kanbot-theme') === 'light' ? 'light' : 'dark'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: { retry: 0 },
  },
})
registerQueryCacheClear(() => queryClient.clear())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <ThemeProvider>
          <AuthProvider>
            <RouterProvider router={router} />
          </AuthProvider>
        </ThemeProvider>
      </LanguageProvider>
    </QueryClientProvider>
  </StrictMode>,
)
