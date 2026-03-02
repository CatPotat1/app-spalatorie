import type { StudentUser } from "../users/student-user";

export type WasherReservation = {
    owner: StudentUser;
    startTime: string;
    endTime: string;
};