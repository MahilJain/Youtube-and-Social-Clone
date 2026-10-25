import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        const statusCode = error.response?.status
        if (statusCode && statusCode < 500) return false
        return failureCount < 1
      },
      staleTime: 30_000,
    },
  },
})
