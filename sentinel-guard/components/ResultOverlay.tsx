import { useState } from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeIn, ZoomIn } from "react-native-reanimated";

interface ResultOverlayProps {
  status: "APPROVED" | "REJECTED";
  scanType?: "ENTRY" | "EXIT";
  isReturning?: boolean;
  name?: string;
  sapId?: string;
  semester?: string;
  section?: string;
  profilePhotoUrl?: string | null;
  reason?: string;
  onDismiss: () => void;
}

/**
 * Extracts initials from a full name
 * e.g., "Muhammad Ali" -> "MA", "John" -> "J"
 */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return (parts[0]?.[0] || "?").toUpperCase();
}

export default function ResultOverlay({
  status,
  scanType = "ENTRY",
  isReturning = false,
  name,
  sapId,
  semester,
  section,
  profilePhotoUrl,
  reason,
  onDismiss,
}: ResultOverlayProps) {
  const [imageError, setImageError] = useState(false);

  const currentTime = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const isApproved = status === "APPROVED";
  const isEntry = scanType === "ENTRY";

  const getTheme = () => {
    if (!isApproved) {
      return {
        bg: "bg-rose-600",
        icon: "⛔",
        title: "DENIED",
        badge: "DENIED",
        badgeBg: "bg-rose-100",
        badgeText: "text-rose-700",
        accentBg: "bg-rose-50",
        accentText: "text-rose-600",
        photoBorder: "#f43f5e", // rose-500
        initialsGradient: "#be123c", // rose-700
      };
    }
    if (isEntry && isReturning) {
      return {
        bg: "bg-amber-500",
        icon: "🔄",
        title: "WELCOME BACK",
        badge: "RETURNING",
        badgeBg: "bg-amber-100",
        badgeText: "text-amber-700",
        accentBg: "bg-amber-50",
        accentText: "text-amber-600",
        photoBorder: "#f59e0b", // amber-500
        initialsGradient: "#d97706", // amber-600
      };
    }
    if (isEntry) {
      return {
        bg: "bg-emerald-600",
        icon: "✓",
        title: "WELCOME",
        badge: "IN",
        badgeBg: "bg-emerald-100",
        badgeText: "text-emerald-700",
        accentBg: "bg-emerald-50",
        accentText: "text-emerald-600",
        photoBorder: "#10b981", // emerald-500
        initialsGradient: "#059669", // emerald-600
      };
    }
    return {
      bg: "bg-indigo-600",
      icon: "👋",
      title: "GOODBYE",
      badge: "OUT",
      badgeBg: "bg-indigo-100",
      badgeText: "text-indigo-700",
      accentBg: "bg-indigo-50",
      accentText: "text-indigo-600",
      photoBorder: "#6366f1", // indigo-500
      initialsGradient: "#4f46e5", // indigo-600
    };
  };

  const theme = getTheme();
  const showImage = profilePhotoUrl && !imageError;
  const initials = name ? getInitials(name) : "?";

  // Render the profile photo or initials fallback
  const renderProfileImage = () => {
    const imageContainerStyle = [
      styles.photoContainer,
      {
        borderColor: theme.photoBorder,
        shadowColor: theme.photoBorder,
      },
    ];

    if (showImage) {
      return (
        <Animated.View
          entering={ZoomIn.duration(300)}
          style={imageContainerStyle}
        >
          <Image
            source={{ uri: profilePhotoUrl }}
            style={[
              styles.photo,
              // Apply grayscale-like opacity for rejected scans
              !isApproved && styles.photoRejected,
            ]}
            onError={() => setImageError(true)}
            resizeMode="cover"
          />
          {/* Red overlay for rejected scans */}
          {!isApproved && <View style={styles.rejectedOverlay} />}
        </Animated.View>
      );
    }

    // Fallback: Initials placeholder
    return (
      <Animated.View
        entering={ZoomIn.duration(300)}
        style={[
          imageContainerStyle,
          { backgroundColor: theme.initialsGradient },
        ]}
      >
        <Text style={styles.initialsText}>{initials}</Text>
      </Animated.View>
    );
  };

  return (
    <Animated.View
      entering={FadeIn.duration(150)}
      className={`absolute inset-0 ${theme.bg}`}
    >
      <SafeAreaView className="flex-1 justify-between">
        {/* Top: Icon + Title */}
        <Animated.View
          entering={ZoomIn.duration(250)}
          className="items-center pt-3"
        >
          <View className="w-14 h-14 rounded-full bg-white/20 items-center justify-center mb-2">
            <Text className="text-3xl">{theme.icon}</Text>
          </View>
          <Text className="text-white text-xl font-bold">{theme.title}</Text>
        </Animated.View>

        {/* Middle: Card */}
        <View className="px-4 flex-1 justify-center">
          {isApproved && name ? (
            <View className="bg-white rounded-xl p-3">
              {/* Profile Photo - Top Center */}
              <View className="items-center mb-3">{renderProfileImage()}</View>

              {/* Badge */}
              <View className="self-center mb-2">
                <View className={`px-3 py-1 rounded-full ${theme.badgeBg}`}>
                  <Text className={`text-xs font-bold ${theme.badgeText}`}>
                    {theme.badge}
                  </Text>
                </View>
              </View>

              {/* Name */}
              <Text
                className="text-gray-900 text-lg font-bold text-center"
                numberOfLines={1}
              >
                {(name || "Unknown").toUpperCase()}
              </Text>

              {/* SAP */}
              <Text className="text-gray-500 text-xs text-center font-mono mb-2">
                {sapId || "N/A"}
              </Text>

              {/* Time */}
              <View className={`${theme.accentBg} rounded-lg p-2 mb-2`}>
                <Text className="text-center">
                  <Text className="text-lg">🕐 </Text>
                  <Text className="text-gray-900 text-lg font-bold">
                    {currentTime}
                  </Text>
                </Text>
              </View>

              {/* Sem/Sec Row */}
              <View className="flex-row gap-2">
                <View
                  className={`flex-1 p-2 rounded-lg items-center ${theme.accentBg}`}
                >
                  <Text className={`text-xs ${theme.accentText}`}>SEM</Text>
                  <Text className="text-gray-900 text-lg font-bold">
                    {semester || "-"}
                  </Text>
                </View>
                <View
                  className={`flex-1 p-2 rounded-lg items-center ${theme.accentBg}`}
                >
                  <Text className={`text-xs ${theme.accentText}`}>SEC</Text>
                  <Text className="text-gray-900 text-lg font-bold">
                    {section || "-"}
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            <View className="bg-white/10 rounded-xl p-4">
              {/* Profile Photo for Rejected - Still show for identity */}
              {(profilePhotoUrl || name) && (
                <View className="items-center mb-4">
                  {renderProfileImage()}
                  {name && (
                    <Text className="text-white/80 text-sm font-medium mt-2">
                      {name.toUpperCase()}
                    </Text>
                  )}
                </View>
              )}
              <Text className="text-white text-lg text-center font-bold">
                {reason || "Error"}
              </Text>
            </View>
          )}
        </View>

        {/* Bottom: Button */}
        <View className="px-4 pb-3">
          <TouchableOpacity
            onPress={onDismiss}
            className={`py-3 rounded-xl items-center ${
              isApproved ? "bg-white" : "bg-white/20"
            }`}
            activeOpacity={0.85}
          >
            <Text
              className={`text-sm font-bold ${
                isApproved ? theme.accentText : "text-white"
              }`}
            >
              {isApproved ? "NEXT →" : "DISMISS"}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  photoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    // Shadow for elevation effect
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    backgroundColor: "#fff",
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  photoRejected: {
    opacity: 0.6,
  },
  rejectedOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(244, 63, 94, 0.25)", // rose-500 with opacity
  },
  initialsText: {
    fontSize: 42,
    fontWeight: "bold",
    color: "#ffffff",
    letterSpacing: 2,
  },
});
