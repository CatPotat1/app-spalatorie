import {type ReactNode, createContext, useContext, useEffect, useState} from "react";
 
import type { LoginResponse, RefreshResponse, LoginReturns } from "@/types/api/auth";

import type { SuccessResponse, ErrorResponse } from "@/types/api/response";
import { apiAuth } from "@/constants/api";

type Context = {
    token: string;
    refreshToken: string;
};

type AuthContext = {
    login: (
      data: LoginReturns
    ) => Promise<SuccessResponse<LoginResponse> | ErrorResponse>;
    refresh: () => Promise<ErrorResponse | SuccessResponse<RefreshResponse>>;
    logout: () => Promise<SuccessResponse<{ msg: string }> | ErrorResponse>;
    setToken: (token: string) => void;
    context: Context;
};
    
type Props = {
    children: ReactNode | ReactNode[];
};
  
const AuthContext = createContext<AuthContext>({} as AuthContext);
  export const AuthContextProvider = ({ children }: Props) => {
    const [context, setContext] = useState<Context>({
      refreshToken: localStorage.getItem("refreshToken") ?? "",
      token: localStorage.getItem("token") ?? "",
    });
  
    useEffect(() => {
      const { refreshToken, token } = context;
      localStorage.setItem("token", token);
      localStorage.setItem("refreshToken", refreshToken);
    }, [context]);
  
    const login = async ({ username, password }: LoginReturns) => {
      const response = await fetch(apiAuth.login, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok)
        return {
          type: "error",
          ...data,
        } as ErrorResponse;

      const { access_token, refresh_token, user } = data as LoginResponse;

      setContext({
        refreshToken: refresh_token ?? "",
        token: access_token ?? "",
      });

      return {
        payload: { access_token, refresh_token, user },
      } as SuccessResponse<LoginResponse>;
    };
  
    const refresh = async () => {
      const response = await fetch(apiAuth.refresh, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${context.refreshToken}`,
        },
      });
  
      if (response.status === 403) {
        return {
          type: "error",
          ...(await response.json()),
        } as ErrorResponse;
      }
  
      const { access_token } = (await response.json()) as RefreshResponse;
  
      setContext((prev) => ({
        ...prev,
        token: access_token,
      }));
  
      return { payload: { access_token } } as SuccessResponse<RefreshResponse>;
    };
  
    const logout = async () => {
      try {
        const response = await fetch(apiAuth.logout, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${context.token}`,
          },
        });

        if (response.status === 200) {
          setContext({
            refreshToken: "",
            token: "",
          });
          localStorage.removeItem("token");
          localStorage.removeItem("refreshToken");
          return {
            payload: { msg: "Logged out successfully" },
          } as SuccessResponse<{ msg: string }>;
        }
        const data = await response.json().catch(() => ({}));
        return {
          type: "error",
          ...data,
        } as ErrorResponse;
      } catch {
        setContext({
          refreshToken: "",
          token: "",
        });
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        return {
          payload: { msg: "Logged out successfully" },
        } as SuccessResponse<{ msg: string }>;
      }
    };
  
    const setToken = (token: string) =>
      setContext((prev) => ({
        ...prev,
        token,
      }));
  
    return (
      <AuthContext.Provider
        value={{ context, login, refresh, logout, setToken }}
      >
        {children}
      </AuthContext.Provider>
    );
  };
  
  // eslint-disable-next-line react-refresh/only-export-components
  export const useAuthContext = () => {
    const ctx = useContext(AuthContext);
  
    if (!ctx)
      throw new Error(
        "useAuthContext should be used within an AuthContext provider."
      );
  
    return ctx;
  };
  