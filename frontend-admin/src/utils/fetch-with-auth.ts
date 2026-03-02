import { useCallback } from "react";

import type { ErrorResponse, SuccessResponse } from "@/types/api/response";
import { jwtDecode } from "jwt-decode";
import { useAuthContext } from "@/providers/auth-context";

type Options = RequestInit;

type Token = {
  exp: number;
};

export const isTokenExpired = (token: string): boolean => {
  try {
    const payload = jwtDecode<Token>(token);
    return payload.exp * 1000 < Date.now();
  } catch (error) {
    console.error("Invalid token format", error);
    return true;
  }
};

export const useFetch = () => {
  const {
    refresh,
    context: { token },
    setToken,
  } = useAuthContext();

  // For JSON requests (default)
  const fetchWithAuth = useCallback(
    async <T extends object>(
      url: string,
      options?: Options
    ): Promise<SuccessResponse<T> | ErrorResponse> => {
      let currentToken = token;

      if (!currentToken || isTokenExpired(currentToken)) {
        const newToken = await refresh();
        if (newToken.type === "error") {
          return { type: "error", msg: "Nu s-a putut re-valida sesiunea." };
        }
        
        setToken(newToken.payload.access_token);
        currentToken = newToken.payload.access_token;
      }

      const headers = {
        "Content-Type": "application/json",
        ...options?.headers,
        Authorization: `Bearer ${currentToken}`,
      };

      const response = await fetch(url, { ...options, headers });
      const data = await response.json();

      if (!response.ok) {
        return { type: "error", ...data };
      }

      return {
        type: "success",
        payload: data as T,
      } as SuccessResponse<T>;
    },
    [refresh, setToken, token]
  );

  // For FormData requests (file uploads, etc)
  const fetchWithAuthForm = useCallback(
    async <T extends object>(
      url: string,
      options?: Options
    ): Promise<SuccessResponse<T> | ErrorResponse> => {
      let currentToken = token;
  
      if (!currentToken || isTokenExpired(currentToken)) {
        const newToken = await refresh();
        if (newToken.type === "error") {
          return { type: "error", msg: "Nu s-a putut re-valida sesiunea." };
        }

        setToken(newToken.payload.access_token);
        currentToken = newToken.payload.access_token;
      }
  
      // Only add Authorization, do NOT set Content-Type for FormData
      const headers: Record<string, string> = {
        Authorization: `Bearer ${currentToken}`,
      };
      
      const response = await fetch(url, { ...options, headers });
      const data = await response.json();

      if (!response.ok) {
        return { type: "error", ...data };
      }
  
      return {
        type: "success",
        payload: data as T,
      } as SuccessResponse<T>;
    },
    [refresh, setToken, token]
  );

  return { fetchWithAuth, fetchWithAuthForm };
};