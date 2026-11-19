import { QueryClient } from '@tanstack/react-query'
import { ApiError } from './http'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
          return false
        }
        return failureCount < 1
      },
      staleTime: 60 * 1000, // 60 segundos por defecto
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false, // Las mutaciones nunca se reintentan automáticamente
    },
  },
})
