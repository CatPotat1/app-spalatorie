import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Settings, Save, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { useUserContext } from "@/providers/user-context";
import { useFetch } from "@/utils/fetch-with-auth";
import { apiConfigs } from "@/constants/api";
import type { WasherConfigs } from "@/types/washer/configs";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

const TIME_INTERVAL_OPTIONS=[{value:15,label:"15 minute"},{value:30,label:"30 minute"},{value:45,label:"45 minute"},{value:60,label:"1 oră"},{value:75,label:"1 oră și 15 minute"},{value:90,label:"1 oră și 30 minute"},{value:105,label:"1 oră și 45 minute"},{value:120,label:"2 ore"},{value:135,label:"2 ore și 15 minute"},{value:150,label:"2 ore și 30 minute"},{value:165,label:"2 ore și 45 minute"},{value:180,label:"3 ore"},{value:195,label:"3 ore și 15 minute"},{value:210,label:"3 ore și 30 minute"},];

function generateValidTimes(intervalMinutes: number): { value: string; label: string }[] {
    const times: { value: string; label: string }[] = [];
    for (let totalMinutes = 0; totalMinutes < 24 * 60; totalMinutes += intervalMinutes) {
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        const isoValue = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
        const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
        const period = hours >= 12 ? "PM" : "AM";
        times.push({
            value: isoValue,
            label: `${String(displayHours).padStart(2, "0")}:${String(minutes).padStart(2, "0")} ${period}`,
        });
    }
    return times;
}

function isTimeValidForInterval(time: string, intervalMinutes: number): boolean {
    const [h, m] = time.split(":").map(Number);
    return (h * 60 + m) % intervalMinutes === 0;
}

function getIntervalLabel(minutes: number): string {
    const option = TIME_INTERVAL_OPTIONS.find((o) => o.value === minutes);
    return option?.label ?? `${minutes} minute`;
}

export default function ConfigPage() {
    const { user } = useUserContext();
    const { fetchWithAuth } = useFetch();
    const queryClient = useQueryClient();

    const washerID = user?.washer.id ?? "";
    const washerName = user?.washer.name ?? "";

    const {data: configs, isLoading, isError, error, refetch,} = useQuery<WasherConfigs>({
        queryKey: ["washer-configs", washerID],
        queryFn: async () => {
            const result = await fetchWithAuth<WasherConfigs>(apiConfigs.get(washerID));
            if(result.type === "error") {
                throw new Error(result.msg);
            }
            return result.payload;
        },
        enabled: !!washerID,
    });

    const [slotsPerTimeInterval, setSlotsPerTimeInterval] = useState(1);
    const [timeIntervalInMinutes, setTimeIntervalInMinutes] = useState(60);
    const [startTime, setStartTime] = useState("08:00");
    const [endTime, setEndTime] = useState("17:00");

    useEffect(() => {
        if(!configs) {
            return;
        }
        setSlotsPerTimeInterval(configs.slotsPerTimeInterval);
        setTimeIntervalInMinutes(configs.timeIntervalInMinutes);
        setStartTime(configs.startTime);
        setEndTime(configs.endTime);
    }, [configs]);

    const validTimes = useMemo(
        () => generateValidTimes(timeIntervalInMinutes),
        [timeIntervalInMinutes]
    );

    const startTimeValid = isTimeValidForInterval(startTime, timeIntervalInMinutes);
    const endTimeValid = isTimeValidForInterval(endTime, timeIntervalInMinutes);

    const endBeforeStart = (() => {
        const [sh, sm] = startTime.split(":").map(Number);
        const [eh, em] = endTime.split(":").map(Number);
        return eh * 60 + em <= sh * 60 + sm;
    })();

    const slotsValid =
        slotsPerTimeInterval >= 1 &&
        slotsPerTimeInterval <= 50 &&
        Number.isInteger(slotsPerTimeInterval);

    const hasErrors = !startTimeValid || !endTimeValid || endBeforeStart || !slotsValid;

    const hasChanges = configs && (slotsPerTimeInterval !== configs.slotsPerTimeInterval || timeIntervalInMinutes !== configs.timeIntervalInMinutes || startTime !== configs.startTime || endTime !== configs.endTime);

    const mutation = useMutation({
        mutationFn: async (data: WasherConfigs) => {
            const result = await fetchWithAuth<WasherConfigs>(
                apiConfigs.set(washerID),
                {
                    method: "PUT",
                    body: JSON.stringify(data),
                }
            );
            if (result.type === "error") throw new Error(result.msg);
            return result.payload;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["washer-configs", washerID] });
            toast.success("Configurările au fost salvate cu succes!");
        },
        onError: (err: Error) => {
            toast.error(`Eroare la salvare: ${err.message}`);
        },
    });

    if(!user) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <p className="text-muted-foreground">Nu sunteți autentificat.</p>
            </div>
        );
    }

    return (
        <main className="mx-auto max-w-3xl">
            <div className="mb-8 flex items-center gap-3">
                <div className="flex items-center justify-center size-10 rounded-lg bg-primary text-primary-foreground">
                    <Settings className="size-5" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        {washerName}
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        Configurare spălătorie
                    </p>
                </div>
            </div>

            {isLoading && (
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-72 mt-1" />
                    </CardHeader>
                    <CardContent className="flex flex-col gap-6">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="flex flex-col gap-2">
                                <Skeleton className="h-4 w-40" />
                                <Skeleton className="h-9 w-48" />
                                <Skeleton className="h-3 w-56" />
                            </div>
                        ))}
                        <Skeleton className="h-9 w-52 mt-2" />
                    </CardContent>
                </Card>
            )}

            {isError && (
                <Card>
                    <CardContent className="flex flex-col items-center gap-4 py-10">
                        <AlertCircle className="size-10 text-destructive" />
                        <div className="text-center">
                            <p className="font-medium">
                                Eroare la încărcarea configurărilor
                            </p>
                            <p className="text-muted-foreground text-sm mt-1">
                                {(error as Error)?.message ?? "Eroare necunoscută."}
                            </p>
                        </div>
                        <Button variant="outline" onClick={() => refetch()}>
                            <RefreshCw className="size-4" />
                            Încearcă din nou
                        </Button>
                    </CardContent>
                </Card>
            )}

            {configs && !isLoading && !isError && (
                <Card>
                    <CardHeader>
                        <CardTitle>Configurare Program</CardTitle>
                        <CardDescription>
                            Modificați setările de program și disponibilitate ale spălătoriei.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-6">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="slots">Sloturi per interval</Label>
                            <Input
                                id="slots"
                                type="number"
                                min={1}
                                max={50}
                                step={1}
                                value={slotsPerTimeInterval}
                                onChange={(e) =>
                                    setSlotsPerTimeInterval(parseInt(e.target.value, 10) || 1)
                                }
                                className="max-w-48"
                            />
                        </div>

                        <Separator />

                        <div className="flex flex-col gap-2">
                            <Label>Intervalul de timp</Label>
                            <Select
                                value={String(timeIntervalInMinutes)}
                                onValueChange={(v) =>
                                    setTimeIntervalInMinutes(parseInt(v, 10))
                                }
                            >
                                <SelectTrigger className="max-w-64">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {TIME_INTERVAL_OPTIONS.map((opt) => (
                                        <SelectItem
                                            key={opt.value}
                                            value={String(opt.value)}
                                        >
                                            {opt.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <Separator />

                        <div className="flex gap-6">
                            <div className="flex flex-col gap-2">
                                <Label>Ora început</Label>
                                <Select
                                    value={startTime}
                                    onValueChange={setStartTime}
                                >
                                    <SelectTrigger className="max-w-48">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {validTimes.map((t) => (
                                            <SelectItem
                                                key={t.value}
                                                value={t.value}
                                            >
                                                {t.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex flex-col gap-2">
                                <Label>Ora sfârșit</Label>
                                <Select
                                    value={endTime}
                                    onValueChange={setEndTime}
                                >
                                    <SelectTrigger className="max-w-48">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {validTimes
                                            .filter((t) => {
                                                const [sh, sm] = startTime.split(":").map(Number);
                                                const [th, tm] = t.value.split(":").map(Number);
                                                return th * 60 + tm > sh * 60 + sm;
                                            })
                                            .map((t) => (
                                                <SelectItem
                                                    key={t.value}
                                                    value={t.value}
                                                >
                                                    {t.label}
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <Separator />

                        <Button
                            onClick={() =>
                                mutation.mutate({
                                    slotsPerTimeInterval,
                                    timeIntervalInMinutes,
                                    startTime,
                                    endTime,
                                })
                            }
                            disabled={hasErrors || mutation.isPending || !hasChanges}
                        >
                            {mutation.isPending ? (
                                <Loader2 className="size-4 animate-spin" />
                            ) : (
                                <Save className="size-4" />
                            )}
                            {mutation.isPending
                                ? "Se salvează..."
                                : "Salvează configurările"}
                        </Button>
                    </CardContent>
                </Card>
            )}
        </main>
    );
}