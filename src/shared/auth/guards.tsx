import type { ReactNode } from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import { useSession } from "./session.store";
import type { Role as RoleType } from "../types/enums";
import { isExpired } from "./jwt";
import { getLoginDestination } from "./redirect"


interface GuardProps {
    children?: ReactNode;
}

interface RequireRoleProps extends GuardProps {
  roles: readonly RoleType[];
}

export function RequireAuth({ children }: GuardProps) {

    const token = useSession((state) => state.token);
    const location = useLocation();

    if (!token || isExpired(token)) {
        return ( 
            <Navigate 
                to="/login" 
                replace 
                state={{ from : location }} 
            /> 
        );
    }

    return children ?? <Outlet />
}

export function RequireRole({ roles, children }: RequireRoleProps) {
  const token = useSession((state) => state.token);
  const role = useSession((state) => state.user?.role);
  const location = useLocation();

  if (!token || isExpired(token)) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  if (!role || !roles.includes(role)) {
    return <Navigate to="/forbidden" replace />;
  }

  return children ?? <Outlet />;
}

export function GuestOnly({ children }: GuardProps) {
  const token = useSession((state) => state.token)
  const role = useSession((state) => state.user?.role)
  const location = useLocation()

  if (!token || isExpired(token)) {
    return children ?? <Outlet />
  }

  const state = location.state as {
    from?: {
      pathname?: string
      search?: string
      hash?: string
    }
  } | null

  const from = state?.from
  let savedPath: string | undefined

  if (typeof from?.pathname === "string") {
    const search = typeof from.search === "string" ? from.search : ""

    const hash = typeof from.hash === "string" ? from.hash : ""

    savedPath = `${from.pathname}${search}${hash}`
  }

  const redirect = new URLSearchParams(location.search).get("redirect")

  const destination = getLoginDestination(
    role,
    redirect,
    savedPath,
  )

  return <Navigate to={destination} replace />
}