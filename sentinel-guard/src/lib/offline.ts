import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "./supabase";

const OFFLINE_QUEUE_KEY = "sentinel_offline_queue";

export interface OfflineLog {
  id: string;
  user_id: string;
  scanner_id: string | undefined;
  type: "ENTRY" | "EXIT";
  status: "GRANTED" | "REJECTED" | "DUPLICATE";
  event_id?: string;
  timestamp: string; // ISO string
}

/**
 * Save a log locally when offline
 */
export const saveOfflineLog = async (log: OfflineLog) => {
  try {
    const existing = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    const queue: OfflineLog[] = existing ? JSON.parse(existing) : [];
    queue.push(log);
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    console.log(`[Offline] Saved log locally: ${log.id}`);
  } catch (error) {
    console.error(`[Offline] Failed to save log:`, error);
  }
};

/**
 * Get all queued logs
 */
export const getOfflineLogs = async (): Promise<OfflineLog[]> => {
  try {
    const existing = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    return existing ? JSON.parse(existing) : [];
  } catch (error) {
    return [];
  }
};

/**
 * Sync offline logs to Supabase in batches
 */
export const syncOfflineLogs = async () => {
  const queue = await getOfflineLogs();
  if (queue.length === 0) return;

  console.log(`[Offline] Syncing ${queue.length} logs...`);

  // Batch in chunks of 20
  const BATCH_SIZE = 20;

  // Process as many batches as needed
  while (queue.length > 0) {
    const batch = queue.slice(0, BATCH_SIZE);

    // Prepare data for Supabase
    // We Map timestamp -> created_at if needed, but 'access_logs' typically has a default 'created_at'.
    // However, we want to preserve the ACTUAL scan time.
    // Ensure your table schema allows inserting 'timestamp' or check if it uses 'created_at'.
    // Based on previous file, the table has 'timestamp'.

    const { error } = await supabase.from("access_logs").insert(
      batch.map((log) => ({
        id: log.id,
        user_id: log.user_id,
        scanner_id: log.scanner_id,
        type: log.type,
        status: log.status,
        event_id: log.event_id,
        timestamp: log.timestamp, // key: preserve original scan time
      }))
    );

    if (error) {
      console.error("[Offline] Sync failed for batch:", error.message);
      // Stop syncing if a batch fails (likely still offline or server issue)
      // We do NOT remove them from the queue so we can try again later.
      return;
    }

    // If success, remove this batch from the queue
    // We do this by slicing the original array reference we got?
    // No, we must update AsyncStorage with the *remaining* items.

    // Actually, safer to re-read or just filter out the IDs we successfully sent.
    const successIds = new Set(batch.map((l) => l.id));

    // Lock/Read-Modify-Write pattern is tricky in async, but for simple queue:
    // We'll read the CURRENT storage again in case new logs came in while we were syncing?
    // For simplicity, we just assume single-threaded event loop nature of JS prevents basic race here
    // unless 'saveOfflineLog' happened *during* the await.

    await removeLogsFromQueue(Array.from(successIds));

    // Remove from our local 'queue' variable loop to proceed
    queue.splice(0, BATCH_SIZE);

    console.log(`[Offline] Batch synced successfully.`);
  }
};

const removeLogsFromQueue = async (idsToRemove: string[]) => {
  try {
    const existing = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    if (!existing) return;

    let queue: OfflineLog[] = JSON.parse(existing);
    queue = queue.filter((log) => !idsToRemove.includes(log.id));

    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error("[Offline] Failed to update queue:", error);
  }
};
