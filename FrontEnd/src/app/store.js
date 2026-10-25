import { configureStore, createSlice } from '@reduxjs/toolkit'

const getStoredValue = (key, fallback) => {
  try {
    const storedValue = window.localStorage.getItem(key)
    return storedValue === null ? fallback : JSON.parse(storedValue)
  } catch {
    return fallback
  }
}

const authSlice = createSlice({
  name: 'auth',
  initialState: { user: null, accessToken: null, sessionChecked: false },
  reducers: {
    setCredentials(state, action) {
      state.user = action.payload.user ?? state.user
      state.sessionChecked = true
      if (action.payload.accessToken !== undefined) {
        state.accessToken = action.payload.accessToken
      }
    },
    clearCredentials(state) {
      state.user = null
      state.accessToken = null
      state.sessionChecked = true
    },
    setSessionChecked(state) {
      state.sessionChecked = true
    },
  },
})

const preferencesSlice = createSlice({
  name: 'preferences',
  initialState: {
    theme: getStoredValue('streamline-theme', 'light'),
    sidebarExpanded: getStoredValue('streamline-sidebar-expanded', true),
  },
  reducers: {
    toggleTheme(state) {
      state.theme = state.theme === 'dark' ? 'light' : 'dark'
    },
    toggleSidebar(state) {
      state.sidebarExpanded = !state.sidebarExpanded
    },
  },
})

export const { setCredentials, clearCredentials, setSessionChecked } = authSlice.actions
export const { toggleTheme, toggleSidebar } = preferencesSlice.actions

export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    preferences: preferencesSlice.reducer,
  },
})
