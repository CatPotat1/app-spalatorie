import { AuthContextProvider, useAuthContext } from "@/providers/auth-context";
import { UserContextProvider, useUserContext } from "@/providers/user-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router";
import { ThemeProvider } from "@/providers/theme-context";
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner";

import { Routes, Route, Navigate } from "react-router";
import type { DashboardRoutes } from "@/types/routes/route";

import NotFoundPage from "./pages/global/not-found";
import ErrorPage from "./pages/global/error";
import LoginPage from "./pages/auth/login-page";
import HomePage from "./pages/home/home-page";

const routes: DashboardRoutes = {
    "error": {element: <ErrorPage />},
    "/not-found": {element: <NotFoundPage />},
    "/login": {element: <LoginPage />},
    "/": {
        roleMap: {
            admin: <HomePage />,
        }
    }
};

const AppRoutes = () => {
    const {context: { token }} = useAuthContext();
    const { user } = useUserContext();

    return (
        <Routes>
            {Object.entries(routes).map(([path, route]) => {
                /* Public Route */
                if("element" in route) {
                    return <Route key={path} path={path} element={route.element} />;
                }

                /* Protected Route */

                // redirect to login
                if(!token || !user) {
                    return <Route key={path} path={path} element={<Navigate to="/login" replace />} />
                }

                // all roles -> same page
                if("*" in route.roleMap) {
                    return <Route key={path} path={path} element={route.roleMap["*"]} />
                }

                // role specific (partial allowed) -> mapped role page OR not found if role not mapped
                return <Route key={path} path={path} element={route.roleMap[user.role] ?? <Navigate to="/not-found" replace />} />
            })}

            <Route path="*" element={<Navigate to="/not-found" replace />} />
        </Routes>
    );
};

export function App() {
    const client = new QueryClient();

    return (
        <BrowserRouter>
        <QueryClientProvider client={client}>
        <AuthContextProvider>
        <UserContextProvider>
        <ThemeProvider>
        <TooltipProvider>
            <AppRoutes />
            <Toaster className="toaster" />
        </TooltipProvider>
        </ThemeProvider>
        </UserContextProvider>
        </AuthContextProvider>
        </QueryClientProvider>
        </BrowserRouter>
    )
}

export default App;