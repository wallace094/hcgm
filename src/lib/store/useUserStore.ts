"use client";

import { create } from "zustand";
import { type UserType } from "../types";

interface UserState {
  user: UserType | null;
  setUser: (data: UserType) => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));
