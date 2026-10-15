import { create } from "zustand";
import {
  createJSONStorage,
  persist,
} from "zustand/middleware";
import { queryClient } from "../api/queryClient";
import type { ID } from "../types/common";
import type { Role as RoleValue, UserStatus } from "../types/enums";
import { Role } from "../types/enums";
import { decodeJwt } from "./jwt";


export interface SessionUser {
    id: ID;
    email: string;
    role: Role;
    status?: UserStatus;
}

interface SessionState {
    token: string | null;
    user: SessionUser | null;
    setSession: (token: string, user?: SessionUser) => void;
    setToken: (token: string) => void;
    clear: (options?: { reason?: "logout" | "expired" }) => void;
}

function isRole(value: unknown): value is RoleValue {
    return (
        typeof value === "string" && 
        Object.values(Role).some((role) => role === value)
    );
}

function getUserFromToken(token: string): SessionUser | null {
    const claims = decodeJwt(token);

    if (
        !claims ||
        typeof claims.sub !== "string" ||
        typeof claims?.email !== "string" ||
        !isRole(claims?.role)
    ) {
        return null;
    }

    return {
        id: claims.sub,
        email: claims.email,
        role: claims.role,
    };
}

export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      token: null,
      user: null,

      setSession: (token, user) => {
        set({
          token,
          user: user ?? getUserFromToken(token),
        });
      },

      setToken: (token) => {
        set({ token });
      },

      clear: (_options?: { reason?: "logout" | "expired" }) => {
        queryClient.clear();
        set({ token: null, user: null });
      },
    }),
    {
      name: "ec.session",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        token: state.token,
        user: state.user,
      }),
    },
  ),
);
