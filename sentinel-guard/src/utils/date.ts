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
 * Formats a timestamp to "HH:MM AM/PM" in Pakistan timezone.
 */
export const formatTime = (timestamp: string): string => {
  try {
    const date = parseAsUTC(timestamp);
    if (isNaN(date.getTime())) return "--:--";

    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Karachi",
    });
  } catch {
    return "--:--";
  }
};

/**
 * Formats a timestamp to "Today", "Yesterday", or "MMM DD" in Pakistan timezone
 */
export const formatDate = (timestamp: string): string => {
  try {
    const date = parseAsUTC(timestamp);
    if (isNaN(date.getTime())) return "";

    // Get dates in Pakistan timezone for comparison
    const pktDateStr = date.toLocaleString("en-US", {
      timeZone: "Asia/Karachi",
    });
    const pktDate = new Date(pktDateStr);

    const nowStr = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Karachi",
    });
    const now = new Date(nowStr);

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    // Compare simple date strings
    const toDateString = (d: Date) =>
      `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

    const dateStr = toDateString(pktDate);
    const todayStr = toDateString(now);
    const yesterdayStr = toDateString(yesterday);

    if (dateStr === todayStr) return "Today";
    if (dateStr === yesterdayStr) return "Yesterday";

    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return `${months[pktDate.getMonth()]} ${pktDate.getDate()}`;
  } catch {
    return "";
  }
};
