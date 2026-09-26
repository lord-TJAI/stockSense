import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,

      setAuth: (user, accessToken) => {
        sessionStorage.setItem('access_token', accessToken)
        set({ user, accessToken, isAuthenticated: true })
      },

      updateUser: (updates) =>
        set((state) => ({ user: state.user ? { ...state.user, ...updates } : null })),

      clearAuth: () => {
        sessionStorage.removeItem('access_token')
        set({ user: null, accessToken: null, isAuthenticated: false })
      },

      isManager: () => get().user?.role === 'inventory_manager',
    }),
    {
      name: 'stocksense-auth',
      partialize: (state) => ({ user: state.user }), // persist user, not token
    }
  )
)

export default useAuthStore
