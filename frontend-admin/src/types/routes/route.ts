import type { ReactNode } from "react";
import type { AdminUserRoles } from "../users/admin-user";

export type ProtectedRoute = {
    roleMap: (Partial<Record<AdminUserRoles, ReactNode>> & { "*"? : never }) | ({ "*": ReactNode } & { [K in AdminUserRoles]?: never });
};

export type PublicRoute = {
    element: ReactNode;
}

export type DashboardRoutes = Record<string, ProtectedRoute | PublicRoute>;