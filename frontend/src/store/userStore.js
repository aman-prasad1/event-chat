import { create } from 'zustand';

const userStore = create((set) => ({
  user: null,
  isLoading: false,
  setUser: (userData) => set({ user: userData }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  clearUser: () => set({ user: null }),
}));

export { userStore };