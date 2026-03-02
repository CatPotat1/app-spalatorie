const Domain = "localhost:5000/admin";

const apiPrefix = "auth";
const apiAuth = {
    login: `${Domain}/${apiPrefix}/login`,
    refresh: `${Domain}/${apiPrefix}/refresh`,
    logout: `${Domain}/${apiPrefix}/logout`,
    changePassword: `${Domain}/${apiPrefix}/change-password`,
}; 

const apiConfigsPrefix = "config";
const apiConfigs = {
    get: (washerID: string) => `${Domain}/${apiConfigsPrefix}/${washerID}`,
    set: (washerID: string) => `${Domain}/${apiConfigsPrefix}/${washerID}`,
}; 

const apiReservationsPrefix = "reservations";
const apiReservations = {
    get: (washerID: string, date: string) => `${Domain}/${apiReservationsPrefix}/${washerID}/${date}`,
}; 

export {
    Domain, 
    apiPrefix, apiAuth,
    apiConfigsPrefix, apiConfigs,
    apiReservationsPrefix, apiReservations
};