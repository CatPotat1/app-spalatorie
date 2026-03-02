import type { AdminUser } from "../users/admin-user";

export type LoginResponse = {
    access_token: string;
    refresh_token: string;
    user: AdminUser;
};

export type RefreshResponse = {
    access_token: string;
};

export type LoginReturns = {
    username: string;
    password: string;
};