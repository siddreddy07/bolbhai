import { create } from "zustand"

export type User = { id: string; name: string | null; email: string }

type UserState = {
  /** null = nobody is logged in (or we have not asked the server yet) */
  user: User | null
  setUser: (user: User | null) => void
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}))
