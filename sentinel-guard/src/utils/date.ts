/**
 * Parses a timestamp string into a Date object, handling UTC/Timezone nuances.
 * Supabase sometimes returns ISO strings without 'Z', which JS treats as local.
 * We force UTC interpretation if no timezone info is present.
 */
export const parseAsUTC = (timestamp: string): Date => {
    if (!timestamp) return new Date();
    // If timestamp doesn't end with Z or timezone offset, treat as UTC
    if (!timestamp.endsWith("Z") && !timestamp.includes("+")) {
        return new Date(timestamp + "Z");
    }
    return new Date(timestamp);
};

/**
 * Formats a timestamp to "HH:MM AM/PM" in the device's local timezone.
 */
export const formatTime = (timestamp: string): string => {
    try {
        const date = parseAsUTC(timestamp);
        if (isNaN(date.getTime())) return "--:--";

        let hours = date.getHours();
        const minutes = date.getMinutes();
        const ampm = hours >= 12 ? "PM" : "AM";
        hours = hours % 12;
        hours = hours ? hours : 12; // 0 becomes 12

        const hoursStr = hours.toString().padStart(2, "0");
        const minutesStr = minutes.toString().padStart(2, "0");

        return `${hoursStr}:${minutesStr} ${ampm}`;
    } catch {
        return "--:--";
    }
};

/**
 * Formats a timestamp to "Today", "Yesterday", or "MMM DD"
 */
export const formatDate = (timestamp: string): string => {
    try {
        const date = parseAsUTC(timestamp);
        if (isNaN(date.getTime())) return "";

        const now = new Date();
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);

        // Compare simple date strings
        const toDateString = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

        const dateStr = toDateString(date);
        const todayStr = toDateString(now);
        const yesterdayStr = toDateString(yesterday);

        if (dateStr === todayStr) return "Today";
        if (dateStr === yesterdayStr) return "Yesterday";

        const months = [
            "Jan", "Feb", "Mar", "Apr", "May", "Jun",
            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
        ];
        return `${months[date.getMonth()]} ${date.getDate()}`;
    } catch {
        return "";
    }
};
