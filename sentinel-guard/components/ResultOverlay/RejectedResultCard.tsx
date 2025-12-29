import React from "react";
import { View, Text } from "react-native";
import { ProfileImage } from "./ProfileImage";
import { ActivityLogList } from "./ActivityLogList";

interface RejectedResultCardProps {
  reason: string;
  name?: string;
  profilePhotoUrl?: string | null;
  recentLogs?: any[];
  theme: {
    photoBorder: string;
    initialsGradient: string;
  };
  onImagePress: () => void;
  verifiedOffline?: boolean;
}

export const RejectedResultCard: React.FC<RejectedResultCardProps> = ({
  reason,
  name,
  profilePhotoUrl,
  recentLogs,
  theme,
  onImagePress,
  verifiedOffline,
}) => {
  return (
    <View className="bg-white/10 rounded-xl p-4 flex-1">
      {/* Profile Photo for Rejected - Still show for identity */}
      {(profilePhotoUrl || name) && (
        <View className="items-center mb-3 w-full">
          <ProfileImage
            profilePhotoUrl={profilePhotoUrl}
            name={name}
            size={80}
            theme={theme}
            onPress={onImagePress}
          />
          {/* Name below photo - Explicitly centered and allowed to wrap */}
          {name && (
            <View className="w-full mt-2 px-2">
              <Text
                className="text-white text-lg font-bold text-center"
                style={{ fontFamily: "Figtree_700Bold" }}
                numberOfLines={2}
              >
                {name.toUpperCase()}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Offline indicator */}
      {verifiedOffline && (
        <View className="flex-row justify-center items-center mb-3">
          <View className="bg-amber-500/20 px-3 py-1 rounded-full flex-row items-center">
            <Text className="text-amber-300 text-xs mr-1">⚠</Text>
            <Text
              className="text-amber-300 text-xs font-bold"
              style={{ fontFamily: "Figtree_600SemiBold" }}
            >
              OFFLINE VERIFICATION
            </Text>
          </View>
        </View>
      )}

      {/* Main Reason - Larger for rejected */}
      <Text
        className="text-white text-xl text-center font-bold mb-3 px-4"
        style={{ fontFamily: "Figtree_800ExtraBold", letterSpacing: 0 }}
      >
        {reason?.replace(/_/g, " ") || "Error"}
      </Text>

      {/* Recent Activity List */}
      {recentLogs && recentLogs.length > 0 && (
        <ActivityLogList
          logs={recentLogs}
          theme={{ accentText: "text-indigo-400" }}
        />
      )}
    </View>
  );
};
