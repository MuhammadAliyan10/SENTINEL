import { useState, useEffect, useCallback } from "react";
import { supabase, getCachedSession } from "../src/lib/supabase";

export function useGuardStatus() {
    const [isActive, setIsActive] = useState<boolean>(true);
    const [isLoading, setIsLoading] = useState(true);

    const checkStatus = useCallback(async () => {
        try {
            const session = await getCachedSession();
            if (session?.userId) {
                const { data } = await supabase
                    .from("users")
                    .select("is_active")
                    .eq("id", session.userId)
                    .single();

                if (data) {
                    setIsActive(data.is_active);
                }
            }
        } catch (error) {
            console.error("Error checking guard status:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        let channel: any;

        const setupRealtime = async () => {
            await checkStatus();

            const session = await getCachedSession();
            if (!session?.userId) return;

            channel = supabase
                .channel(`guard_status_${session.userId}`)
                .on(
                    "postgres_changes",
                    {
                        event: "UPDATE",
                        schema: "public",
                        table: "users",
                        filter: `id=eq.${session.userId}`,
                    },
                    (payload: any) => {
                        if (payload.new && typeof payload.new.is_active === "boolean") {
                            setIsActive(payload.new.is_active);
                        }
                    }
                )
                .subscribe();
        };

        setupRealtime();

        const interval = setInterval(checkStatus, 3000);

        return () => {
            clearInterval(interval);
            if (channel) supabase.removeChannel(channel);
        };
    }, [checkStatus]);

    return { isActive, isLoading, checkStatus };
}
