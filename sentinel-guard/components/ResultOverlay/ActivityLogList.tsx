import React from "react";
import { View, Text, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { formatTime, formatDate } from "../../src/utils/date";

interface ActivityLog {
  id: string;
  type: "ENTRY" | "EXIT";
  timestamp: string;
  scanner_name?: string;
}

interface ActivityLogListProps {
  logs: ActivityLog[];
  theme: {
    accentText: string;
  };
}

export const ActivityLogList: React.FC<ActivityLogListProps> = ({
  logs,
  theme,
}) => {
  return (
    <View className="bg-white/10 rounded-xl p-3 mb-3">
      <Text
        className="text-white text-xs uppercase font-bold mb-2"
        style={{ fontFamily: "Figtree_700Bold" }}
      >
        Recent Activity
      </Text>
      <ScrollView className="max-h-60" showsVerticalScrollIndicator={false}>
        {logs.map((log) => {
          const isLogEntry = log.type === "ENTRY";
          const scannerName = log.scanner_name || "Unknown Guard";

          return (
            <View
              key={log.id}
              className="flex-row items-center py-2 border-b border-white/10"
            >
              {/* Icon */}
              <View
                className={`w-8 h-8 rounded-lg items-center justify-center mr-2 ${
                  isLogEntry ? "bg-emerald-500/20" : "bg-indigo-500/20"
                }`}
              >
                <Ionicons
                  name={isLogEntry ? "arrow-down" : "arrow-up"}
                  size={16}
                  color={isLogEntry ? "#10B981" : "#fff"}
                />
              </View>

              {/* Info - Guard Name */}
              <View className="flex-1">
                <Text
                  className="text-white/80 text-[10px] uppercase font-bold"
                  style={{ fontFamily: "Figtree_700Bold" }}
                >
                  Guard
                </Text>
                <Text
                  className="text-white text-sm font-semibold"
                  numberOfLines={1}
                  style={{ fontFamily: "Figtree_600SemiBold" }}
                >
                  {scannerName}
                </Text>
              </View>

              {/* Time */}
              <View className="items-end">
                <View
                  className={`px-2 py-0.5 rounded mb-0.5 ${
                    isLogEntry ? "bg-emerald-500/20" : "bg-indigo-500/20"
                  }`}
                >
                  <Text
                    className={`text-xs font-bold ${
                      isLogEntry ? "text-emerald-400" : "text-white"
                    }`}
                    style={{ fontFamily: "Figtree_700Bold" }}
                  >
                    {isLogEntry ? "IN" : "OUT"}
                  </Text>
                </View>
                <Text
                  className="text-white text-xs"
                  style={{ fontFamily: "Figtree_400Regular" }}
                >
                  {formatTime(log.timestamp)}
                </Text>
                <Text
                  className="text-white/60 text-xs"
                  style={{ fontFamily: "Figtree_400Regular" }}
                >
                  {formatDate(log.timestamp)}
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};
