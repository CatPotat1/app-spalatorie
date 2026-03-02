import {createContext, type ReactNode, useContext, useEffect, useReducer} from "react";
  
import type { AdminUser } from "@/types/users/admin-user"

type UserContext = {
    user: AdminUser | null;
    updateUser: (data: Partial<AdminUser>) => void;
    clearUser: () => void;
};
  
type Props = {
    children: ReactNode | ReactNode[];
};
  
type UserAction = { type: "UPDATE"; payload: Partial<AdminUser> } | { type: "CLEAR" };
type UserReducer = (state: AdminUser | null, action: UserAction) => AdminUser | null;
const UserContext = createContext<UserContext>({} as UserContext);
  
const userReducer: UserReducer = (state, action) => {
    switch (action.type) {
      case "UPDATE": {
        const payload = action.payload;
        if (!payload) return state;

        if (!state && payload.role) {
          return payload as AdminUser;
        }

        if (!state) return null;

        // If the payload contains a role, use it; otherwise preserve the existing role
        const newRole = payload.role || state.role;
        
        if (newRole === "admin") {
          return {
            ...state,
            ...payload,
            role: newRole,
          } as AdminUser;
        }
        return state;
      }
      case "CLEAR":
        return null;
      default:
        return state;
    }
};
  
  
export const UserContextProvider = ({ children }: Props) => {
    const existingUser = localStorage.getItem("user");
  
    const [user, setUser] = useReducer(
      userReducer,
      existingUser ? JSON.parse(existingUser) : null
    );
  
    const updateUser = (payload: Partial<AdminUser>) =>
    {
        setUser({ type: "UPDATE", payload });
    }
  
    const clearUser = () => setUser({ type: "CLEAR" });
  
    useEffect(() => {
      if (user) {
        localStorage.setItem("user", JSON.stringify(user));
      } else {
        localStorage.removeItem("user");
      }
    }, [user]);
  
    return (
      <UserContext.Provider
        value={{
          user,
          updateUser,
          clearUser,
        }}
      >
        {children}
      </UserContext.Provider>
    );
};
  
export const useUserContext = () => {
    const ctx = useContext(UserContext);
  
    if (!ctx)
      throw new Error(
        "useUserContext should be used within a UserContext provider."
      );
  
    return ctx;
};
  