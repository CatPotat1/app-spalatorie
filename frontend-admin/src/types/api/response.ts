export type SuccessResponse<K extends object> = {
    type: "success";
    payload: K;
};
  
export type ErrorResponse = {
    type: "error";
    msg: string;
}; 