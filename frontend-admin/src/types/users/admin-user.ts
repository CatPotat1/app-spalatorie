export type AdminUserRoles = "admin"

export type AdminUser = {
    role: "admin";
    username: string;
    washer: {
        id: string;
        name: string;
    };
};