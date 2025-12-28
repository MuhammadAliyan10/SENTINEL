import { useEffect, useState } from "react";
import NetInfo from "@react-native-community/netinfo";

/**
 * Hook to monitor network connectivity state
 * Automatically syncs offline logs when connection is restored
 */
export function useNetworkState(onOnline?: () => void) {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isInternetReachable, setIsInternetReachable] = useState<
    boolean | null
  >(null);

  useEffect(() => {
    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener((state) => {
      const wasOffline = isConnected === false;
      const isNowOnline =
        state.isConnected === true && state.isInternetReachable === true;

      setIsConnected(state.isConnected);
      setIsInternetReachable(state.isInternetReachable);

      // Call callback when connection is restored
      if (wasOffline && isNowOnline && onOnline) {
        console.log("[Network] Connection restored, triggering sync");
        onOnline();
      }
    });

    return () => unsubscribe();
  }, [isConnected, onOnline]);

  return {
    isConnected,
    isOnline: isConnected === true && isInternetReachable === true,
    isOffline: isConnected === false || isInternetReachable === false,
  };
}
