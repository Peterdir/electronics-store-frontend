import type { ReactNode } from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import { useSession } from "./session.store";
import { Role } from "../types/enums";
import type { Role as RoleType } from "../types/enums";
import { isExpired } from "./jwt";


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
  const token = useSession((state) => state.token);
  const role = useSession((state) => state.user?.role);
  const location = useLocation();

  if (!token || isExpired(token)) {
    return children ?? <Outlet />;
  }

  const state = location.state as
    | { from?: { pathname?: string } }
    | null;
  const destination =
    state?.from?.pathname ??
    (role === Role.CUSTOMER ? "/" : "/admin");

  return <Navigate to={destination} replace />;
}