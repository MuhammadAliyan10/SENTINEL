import {
  View,
  Text,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useState, useEffect, useCallback } from "react";
import { Ionicons } from "@expo/vector-icons";
import { getAccessLogsWithUsers } from "../../src/lib/supabase";

interface LogEntry {
  id: string;
  timestamp: string;
  type: "ENTRY" | "EXIT";
  status: string;
  user_id: string;
  user_name: string;
  user_sap_id: string;
}

export default function HistoryScreen() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async () => {
    try {
      setError(null);
      // Use new efficient joined query (single DB call)
      const enrichedLogs = await getAccessLogsWithUsers(50);
      setLogs(enrichedLogs);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchLogs();
    setRefreshing(false);
  }, []);

  // Ensure timestamp is parsed as UTC (Supabase may omit 'Z' suffix)
  const parseAsUTC = (timestamp: string): Date => {
    // If timestamp doesn't end with Z or timezone offset, treat as UTC
    if (!timestamp.endsWith("Z") && !timestamp.includes("+")) {
      return new Date(timestamp + "Z");
    }
    return new Date(timestamp);
  };

  // Format time - parse as UTC then convert to local device time
  const formatTime = (timestamp: string) => {
    try {
      const date = parseAsUTC(timestamp);
      if (isNaN(date.getTime())) return "--:--";

      let hours = date.getHours(); // Local time (PKT on your device)
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

  const formatDate = (timestamp: string) => {
    try {
      const date = parseAsUTC(timestamp);
      if (isNaN(date.getTime())) return "";

      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);

      // Compare dates in local timezone
      const dateStr = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      const todayStr = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
      const yesterdayStr = `${yesterday.getFullYear()}-${yesterday.getMonth()}-${yesterday.getDate()}`;

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
      return `${months[date.getMonth()]} ${date.getDate()}`;
    } catch {
      return "";
    }
  };

  const renderItem = ({ item }: { item: LogEntry }) => {
    const isEntry = item.type === "ENTRY";

    return (
      <View className="bg-black-100 rounded-xl p-3 mb-2 flex-row items-center border border-black-200">
        {/* Icon */}
        <View
          className={`w-10 h-10 rounded-lg items-center justify-center mr-3 ${
            isEntry ? "bg-emerald-500/20" : "bg-indigo-500/20"
          }`}
        >
          <Ionicons
            name={isEntry ? "arrow-down" : "arrow-up"}
            size={20}
            color={isEntry ? "#10B981" : "#6366F1"}
          />
        </View>

        {/* Info */}
        <View className="flex-1">
          <Text className="text-white text-sm font-semibold" numberOfLines={1}>
            {item.user_name}
          </Text>
          <Text className="text-gray-100 text-xs font-mono">
            {item.user_sap_id}
          </Text>
        </View>

        {/* Time */}
        <View className="items-end">
          <View
            className={`px-2 py-0.5 rounded mb-0.5 ${
              isEntry ? "bg-emerald-500/20" : "bg-indigo-500/20"
            }`}
          >
            <Text
              className={`text-xs font-bold ${
                isEntry ? "text-emerald-400" : "text-indigo-400"
              }`}
            >
              {isEntry ? "IN" : "OUT"}
            </Text>
          </View>
          <Text className="text-gray-100 text-xs">
            {formatTime(item.timestamp)}
          </Text>
          <Text className="text-gray-100/50 text-xs">
            {formatDate(item.timestamp)}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-primary items-center justify-center">
        <StatusBar style="light" />
        <ActivityIndicator size="large" color="#FF9C01" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-primary">
      <StatusBar style="light" />

      <View className="px-4 pt-3 pb-2">
        <Text className="text-white text-xl font-bold">Scan History</Text>
        <Text className="text-gray-100 text-xs">{logs.length} scans</Text>
      </View>

      {error && (
        <View className="mx-4 mb-2 bg-rose-500/20 rounded-lg p-2">
          <Text className="text-rose-400 text-xs text-center">{error}</Text>
        </View>
      )}

      <FlatList
        data={logs}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FF9C01"
          />
        }
        ListEmptyComponent={
          <View className="items-center py-12">
            <Ionicons name="document-text-outline" size={40} color="#CDCDE0" />
            <Text className="text-gray-100 mt-2">No scans yet</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
