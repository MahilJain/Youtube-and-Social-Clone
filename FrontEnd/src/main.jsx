import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { queryClient } from './app/queryClient.js'
import { store } from './app/store.js'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <App />
        <Toaster position="bottom-right" />
      </QueryClientProvider>
    </Provider>
  </StrictMode>,
)
