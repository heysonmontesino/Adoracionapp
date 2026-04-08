import { create } from 'zustand'
import { AppUser } from './types'

interface AuthState {
  user: AppUser | null
  isLoading: boolean
  isAuthenticated: boolean
  setUser: (user: AppUser | null) => void
  setLoading: (isLoading: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: user !== null, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
}))
