import {
  View,
  Text,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useState, useEffect, useCallback } from "react";
import { Ionicons } from "@expo/vector-icons";
import { supabase, getCachedSession } from "../../src/lib/supabase";
import { formatTime, formatDate } from "../../src/utils/date";

interface LogEntry {
  id: string;
  timestamp: string;
  type: "ENTRY" | "EXIT";
  status: string;
  user_id: string;
  user_name: string;
  user_sap_id: string;
}

type FilterType = "ALL" | "ENTRY" | "EXIT";

const ITEMS_PER_PAGE = 20;
const MAX_LOGS = 500; // Prevent memory issues with large datasets

export default function HistoryScreen() {
  const [allLogs, setAllLogs] = useState<LogEntry[]>([]); // All logs from DB
  const [displayLogs, setDisplayLogs] = useState<LogEntry[]>([]); // Filtered logs to display
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>("ALL");
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Apply filter client-side
  const applyFilter = useCallback(
    (logs: LogEntry[], filterType: FilterType, query: string) => {
      let filtered = logs;

      // 1. Filter by Type
      if (filterType !== "ALL") {
        filtered = filtered.filter((log) => log.type === filterType);
      }

      // 2. Filter by Search Query
      if (query.trim()) {
        const lowerQuery = query.toLowerCase().trim();
        filtered = filtered.filter(
          (log) =>
            log.user_name.toLowerCase().includes(lowerQuery) ||
            log.user_sap_id.toLowerCase().includes(lowerQuery)
        );
      }

      return filtered;
    },
    []
  );

  const fetchLogs = async (pageNum: number = 0, append: boolean = false) => {
    try {
      if (pageNum === 0) {
        setError(null);
      }

      const session = await getCachedSession();
      if (!session?.userId) {
        setError("Not authenticated");
        return;
      }

      // Load data WITHOUT filter (filter client-side)
      const { data, error: fetchError } = await supabase
        .from("access_logs")
        .select(
          `
          id,
          timestamp,
          type,
          status,
          user_id,
          scanner_id,
          users:user_id (full_name, sap_id)
        `
        )
        .eq("scanner_id", session.userId)
        .order("timestamp", { ascending: false })
        .range(pageNum * ITEMS_PER_PAGE, (pageNum + 1) * ITEMS_PER_PAGE - 1);

      if (fetchError) {
        throw fetchError;
      }

      // Transform data
      const transformedLogs = (data || []).map((log: any) => ({
        id: log.id,
        timestamp: log.timestamp,
        type: log.type,
        status: log.status,
        user_id: log.user_id,
        user_name: log.users?.full_name || "Unknown",
        user_sap_id: log.users?.sap_id || "N/A",
      }));

      // Update allLogs
      let updatedAllLogs: LogEntry[];
      if (append) {
        updatedAllLogs = [...allLogs, ...transformedLogs];
        setAllLogs(updatedAllLogs);
      } else {
        updatedAllLogs = transformedLogs;
        setAllLogs(transformedLogs);
      }

      // Apply current filter to display
      setDisplayLogs(applyFilter(updatedAllLogs, filter, searchQuery));

      // Check if there are more items
      setHasMore((data || []).length === ITEMS_PER_PAGE);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchLogs(0, false);
  }, []);

  // Apply filter client-side when filter changes
  useEffect(() => {
    setDisplayLogs(applyFilter(allLogs, filter, searchQuery));
  }, [filter, searchQuery, allLogs, applyFilter]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setPage(0);
    await fetchLogs(0, false);
    setRefreshing(false);
  }, []);

  const loadMore = () => {
    if (!loadingMore && hasMore && !loading) {
      setLoadingMore(true);
      const nextPage = page + 1;
      setPage(nextPage);
      fetchLogs(nextPage, true);
    }
  };

  const renderItem = ({ item }: { item: LogEntry }) => {
    const isEntry = item.type === "ENTRY";

    return (
      <View className="bg-black-100 rounded-xl p-3 mb-2 flex-row items-center border border-black-200">
        {/* Icon */}
        <View
          className={`w-10 h-10 rounded-lg items-center justify-center mr-3 ${isEntry ? "bg-emerald-500/20" : "bg-rose-500/20"
            }`}
        >
          <Ionicons
            name={isEntry ? "arrow-down" : "arrow-up"}
            size={20}
            color={isEntry ? "#10B981" : "#EF4444"}
          />
        </View>

        {/* Info */}
        <View className="flex-1">
          <Text
            className="text-white text-sm font-semibold"
            numberOfLines={1}
            style={{ fontFamily: "Figtree_600SemiBold" }}
          >
            {item.user_name}
          </Text>
          <Text
            className="text-gray-100 text-xs font-mono"
            style={{ fontFamily: "Figtree_400Regular" }}
          >
            {item.user_sap_id}
          </Text>
        </View>

        {/* Time */}
        <View className="items-end">
          <View
            className={`px-2 py-0.5 rounded mb-0.5 ${isEntry ? "bg-emerald-500/20" : "bg-rose-500/20"
              }`}
          >
            <Text
              className={`text-xs font-bold ${isEntry ? "text-emerald-400" : "text-rose-400"
                }`}
              style={{ fontFamily: "Figtree_700Bold" }}
            >
              {isEntry ? "IN" : "OUT"}
            </Text>
          </View>
          <Text
            className="text-gray-100 text-xs"
            style={{ fontFamily: "Figtree_400Regular" }}
          >
            {formatTime(item.timestamp)}
          </Text>
          <Text
            className="text-gray-100/50 text-xs"
            style={{ fontFamily: "Figtree_400Regular" }}
          >
            {formatDate(item.timestamp)}
          </Text>
        </View>
      </View>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View className="py-4">
        <ActivityIndicator size="small" color="#FF9C01" />
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

      {/* Header with Search & Refresh */}
      <View className="px-4 py-4 bg-black-100 border-b border-black-200">
        <View className="flex-row justify-between items-center mb-2">
          <View>
            <Text
              className="text-white text-2xl font-bold"
              style={{ fontFamily: "Figtree_800ExtraBold" }}
            >
              Scan History
            </Text>
            <Text
              className="text-gray-100 text-sm"
              style={{ fontFamily: "Figtree_400Regular" }}
            >
              {allLogs.length} scans logged
            </Text>
          </View>

          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => setShowSearch(!showSearch)}
              className={`p-2 rounded-xl ${showSearch ? "bg-white" : "bg-black-200"
                }`}
              activeOpacity={0.7}
            >
              <Ionicons
                name="search"
                size={20}
                color={showSearch ? "#000" : "#fff"}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleRefresh}
              disabled={refreshing}
              className="bg-secondary p-2 rounded-xl"
              activeOpacity={0.7}
            >
              <Ionicons name="refresh" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Collapsible Search Bar */}
        {showSearch && (
          <View className="flex-row items-center bg-black-200 rounded-xl px-3 py-2 mb-2 animate-in fade-in slide-in-from-top-1">
            <Ionicons name="search" size={16} color="#9CA3AF" />
            <TextInput
              className="flex-1 ml-2 text-white font-medium"
              placeholder="Search by name or ID..."
              placeholderTextColor="#6B7280"
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={{ fontFamily: "Figtree_500Medium" }}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={16} color="#6B7280" />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Filter Buttons */}
      <View className="px-4 pb-4 bg-black-100 border-b border-black-200">
        <View className="flex-row gap-2">
          <TouchableOpacity
            onPress={() => setFilter("ALL")}
            className={`flex-1 py-2.5 rounded-lg ${filter === "ALL" ? "bg-secondary" : "bg-black-200"
              }`}
          >
            <Text
              className={`text-center text-sm font-bold ${filter === "ALL" ? "text-primary" : "text-gray-100"
                }`}
              style={{ fontFamily: "Figtree_600SemiBold" }}
            >
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setFilter("ENTRY")}
            className={`flex-1 py-2.5 rounded-lg ${filter === "ENTRY" ? "bg-emerald-600" : "bg-black-200"
              }`}
          >
            <Text
              className={`text-center text-sm font-bold ${filter === "ENTRY" ? "text-white" : "text-gray-100"
                }`}
              style={{ fontFamily: "Figtree_600SemiBold" }}
            >
              Entries
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setFilter("EXIT")}
            className={`flex-1 py-2.5 rounded-lg ${filter === "EXIT" ? "bg-rose-600" : "bg-black-200"
              }`}
          >
            <Text
              className={`text-center text-sm font-bold ${filter === "EXIT" ? "text-white" : "text-gray-100"
                }`}
              style={{ fontFamily: "Figtree_600SemiBold" }}
            >
              Exits
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {error && (
        <View className="mx-4 mt-2 bg-rose-500/20 rounded-lg p-2">
          <Text
            className="text-rose-400 text-xs text-center"
            style={{ fontFamily: "Figtree_500Medium" }}
          >
            {error}
          </Text>
        </View>
      )}

      <FlatList
        data={displayLogs}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 16,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#FF9C01"
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          <View className="items-center py-12">
            <Ionicons name="document-text-outline" size={40} color="#CDCDE0" />
            <Text
              className="text-gray-100 mt-2"
              style={{ fontFamily: "Figtree_400Regular" }}
            >
              No scans yet
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
