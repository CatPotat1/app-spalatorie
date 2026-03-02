import { useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {CalendarDays, ChevronLeft, ChevronRight, Clock, User, Mail, AlertCircle, RefreshCw} from "lucide-react";

import { useUserContext } from "@/providers/user-context";
import { useFetch } from "@/utils/fetch-with-auth";
import { apiReservations } from "@/constants/api";
import type { WasherReservation } from "@/types/washer/reservation";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

const DAYS_RO=["Duminică","Luni","Marți","Miercuri","Joi","Vineri","Sâmbătă",]
const MONTHS_RO=["ianuarie","februarie","martie","aprilie","mai","iunie","iulie","august","septembrie","octombrie","noiembrie","decembrie",]

function toISODateString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function isSameDay(a: Date, b: Date): boolean {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}

function formatDateRo(date: Date): string {
    const dayName = DAYS_RO[date.getDay()];
    const day = date.getDate();
    const month = MONTHS_RO[date.getMonth()];
    const year = date.getFullYear();
    return `${dayName}, ${day} ${month} ${year}`;
}

function formatTime(isoTime: string): string {
    const [hoursStr, minutesStr] = isoTime.split(":");
    const hours = parseInt(hoursStr, 10);
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${String(displayHours).padStart(2, "0")}:${minutesStr} ${period}`;
}

function timeToMinutes(isoTime: string): number {
    const [h, m] = isoTime.split(":").map(Number);
    return h * 60 + m;
}

type TimeSlot = {
    startMinutes: number;
    endMinutes: number;
    startTime: string;
    endTime: string;
    reservations: WasherReservation[];
};

function groupReservationsIntoSlots(reservations: WasherReservation[]): TimeSlot[] {
    if (reservations.length === 0) return [];

    const slotMap = new Map<string, TimeSlot>();

    for (const r of reservations) {
        const key = `${r.startTime}-${r.endTime}`;
        const existing = slotMap.get(key);
        if (existing) {
            existing.reservations.push(r);
            continue;
        }
        slotMap.set(key, {
            startMinutes: timeToMinutes(r.startTime),
            endMinutes: timeToMinutes(r.endTime),
            startTime: r.startTime,
            endTime: r.endTime,
            reservations: [r],
        });
    }

    return Array.from(slotMap.values()).sort((a, b) => a.startMinutes - b.startMinutes);
}

export default function Reservations() {
    const { user } = useUserContext();
    const { fetchWithAuth } = useFetch();

    const [currentDate, setCurrentDate] = useState<Date>(() => new Date());

    const washerID = user?.washer.id ?? "";
    const washerName = user?.washer.name ?? "";
    const dateString = toISODateString(currentDate);

    const {
        data: reservations,
        isLoading,
        isError,
        error,
        refetch,
    } = useQuery<WasherReservation[]>({
        queryKey: ["washer-reservations", washerID, dateString],
        queryFn: async () => {
            const result = await fetchWithAuth<WasherReservation[]>(
                apiReservations.get(washerID, dateString)
            );
            if (result.type === "error") throw new Error(result.msg);
            return result.payload;
        },
        enabled: !!washerID,
    });

    const handlePrevious = useCallback(() => {
        setCurrentDate((prev) => {
            const next = new Date(prev);
            next.setDate(next.getDate() - 1);
            return next;
        });
    }, []);

    const handleNext = useCallback(() => {
        setCurrentDate((prev) => {
            const next = new Date(prev);
            const today = new Date();
            next.setDate(next.getDate() + 1);
            if (next > today && !isSameDay(next, today)) return prev;
            return next;
        });
    }, []);

    const handleToday = useCallback(() => {
        setCurrentDate(new Date());
    }, []);

    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <p className="text-muted-foreground">Nu sunteți autentificat.</p>
            </div>
        );
    }

    const reservationCount = reservations?.length ?? 0;
    const today = new Date();
    const isToday = isSameDay(currentDate, today);

    const slots = useMemo(() => {
        return groupReservationsIntoSlots(reservations ?? []);
    }, [reservations]);

    return (
        <main className="mx-auto max-w-2xl px-4 py-8 md:py-12">
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="flex items-center justify-center size-10 rounded-lg bg-primary text-primary-foreground">
                        <CalendarDays className="size-5" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                            {washerName}
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            Rezervări spălătorie
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={handlePrevious}
                        aria-label="Ziua anterioară"
                    >
                        <ChevronLeft className="size-4" />
                    </Button>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground md:text-base">
                            {formatDateRo(currentDate)}
                        </span>
                        {isToday && <Badge variant="secondary">Astăzi</Badge>}
                    </div>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={handleNext}
                        disabled={isToday}
                        aria-label="Ziua următoare"
                    >
                        <ChevronRight className="size-4" />
                    </Button>
                </div>
                {!isToday && (
                    <Button variant="ghost" size="sm" onClick={handleToday}>
                        Înapoi la azi
                    </Button>
                )}
            </div>

            <Separator className="my-6" />

            {!isLoading && !isError && reservations && (
                <div className="flex items-center gap-2 mb-6">
                    <Badge variant="secondary">
                        {reservationCount === 0
                            ? "Nicio rezervare"
                            : reservationCount === 1
                              ? "1 rezervare"
                              : `${reservationCount} rezervări`}
                    </Badge>
                </div>
            )}

            {isLoading && (
                <div className="flex flex-col gap-0">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="relative flex">
                            <div className="flex flex-col items-end pr-4 pt-4 w-24 shrink-0 md:w-28">
                                <Skeleton className="h-4 w-16" />
                                <Skeleton className="h-3 w-14 mt-1" />
                            </div>

                            <div className="relative flex flex-col items-center shrink-0 w-8">
                                <div className="mt-5 size-3 rounded-full bg-muted" />
                                {i < 3 && <div className="flex-1 w-px bg-border" />}
                            </div>

                            <div className="flex-1 pb-6 pt-2">
                                <Skeleton className="h-16 w-full rounded-lg" />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isError && (
                <Card className="border-destructive/50">
                    <CardContent className="flex flex-col items-center gap-4 py-8 text-center">
                        <div className="flex items-center justify-center size-12 rounded-full bg-destructive/10">
                            <AlertCircle className="size-6 text-destructive" />
                        </div>
                        <div>
                            <p className="font-medium text-foreground">
                                Eroare la încărcarea rezervărilor
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                                {(error as Error)?.message ?? "Eroare necunoscută."}
                            </p>
                        </div>
                        <Button variant="outline" onClick={() => refetch()}>
                            <RefreshCw className="size-4" />
                            Reîncearcă
                        </Button>
                    </CardContent>
                </Card>
            )}

            {reservations && !isLoading && !isError && (
                <>
                    {reservations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="flex items-center justify-center size-12 rounded-full bg-muted mb-4">
                                <Clock className="size-6 text-muted-foreground" />
                            </div>
                            <p className="text-muted-foreground font-medium">
                                Nu există rezervări pentru această zi.
                            </p>
                            <p className="text-muted-foreground text-sm mt-1">
                                Rezervările vor apărea aici odată ce sunt create.
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-0">
                            {slots.map((slot, slotIndex) => (
                                <div
                                    key={`${slot.startTime}-${slot.endTime}`}
                                    className="relative flex"
                                >
                                    <div className="flex flex-col items-end pr-4 pt-4 w-24 shrink-0 md:w-28">
                                        <span className="text-xs font-medium text-foreground">
                                            {formatTime(slot.startTime)}
                                        </span>
                                        <span className="text-xs text-muted-foreground mt-0.5">
                                            {formatTime(slot.endTime)}
                                        </span>
                                    </div>

                                    <div className="relative flex flex-col items-center shrink-0 w-8">
                                        <div className="mt-5 size-3 rounded-full bg-primary border-2 border-background ring-2 ring-primary/20 z-10" />
                                        {slotIndex < slots.length - 1 && (
                                            <div className="flex-1 w-px bg-border" />
                                        )}
                                    </div>

                                    <div className="flex-1 pb-6 pt-2">
                                        <div className="flex flex-col gap-2">
                                            {slot.reservations.map((reservation, idx) => {
                                                const durationMinutes =
                                                    timeToMinutes(reservation.endTime) -
                                                    timeToMinutes(reservation.startTime);

                                                const durationLabel =
                                                    durationMinutes >= 60
                                                        ? `${Math.floor(durationMinutes / 60)}h${
                                                              durationMinutes % 60 > 0
                                                                  ? ` ${durationMinutes % 60}m`
                                                                  : ""
                                                          }`
                                                        : `${durationMinutes}m`;

                                                return (
                                                    <Tooltip
                                                        key={`${reservation.owner.email}-${idx}`}
                                                    >
                                                        <TooltipTrigger asChild>
                                                            <Card className="transition-colors hover:bg-accent/50 cursor-default py-0">
                                                                <CardContent className="flex items-center gap-3 px-4 py-3">
                                                                    <div className="flex items-center justify-center size-9 rounded-full bg-primary/10 text-primary shrink-0">
                                                                        <User className="size-4" />
                                                                    </div>

                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="text-sm font-medium text-foreground truncate">
                                                                            {reservation.owner.name}
                                                                        </p>
                                                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                                            <Mail className="size-3 shrink-0" />
                                                                            <span className="truncate">
                                                                                {reservation.owner.email}
                                                                            </span>
                                                                        </div>
                                                                    </div>

                                                                    <Badge
                                                                        variant="outline"
                                                                        className="shrink-0"
                                                                    >
                                                                        {durationLabel}
                                                                    </Badge>
                                                                </CardContent>
                                                            </Card>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>
                                                                {reservation.owner.name}{" "}
                                                                &mdash;{" "}
                                                                {formatTime(reservation.startTime)}{" "}
                                                                &rarr;{" "}
                                                                {formatTime(reservation.endTime)}
                                                            </p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </main>
    );
}