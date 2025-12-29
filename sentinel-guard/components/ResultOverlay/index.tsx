import React, { useState, useMemo } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeIn, ZoomIn } from "react-native-reanimated";
import ImageView from "react-native-image-viewing";
// ApprovedResultCard import removed as we unified UI
// import { ApprovedResultCard } from "./ApprovedResultCard";
import { RejectedResultCard } from "./RejectedResultCard";
import { ReturningResultCard } from "./ReturningResultCard";
import { ExitResultCard } from "./ExitResultCard";

interface ResultOverlayProps {
  status: "APPROVED" | "REJECTED" | "LOADING";
  scanType?: "ENTRY" | "EXIT";
  isReturning?: boolean;
  name?: string;
  sapId?: string;
  semester?: string;
  section?: string;
  profilePhotoUrl?: string | null;
  reason?: string;
  recentLogs?: any[];
  verifiedOffline?: boolean;
  onDismiss: () => void;
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
  recentLogs,
  verifiedOffline = false,
  onDismiss,
}: ResultOverlayProps) {
  const [isGalleryVisible, setIsGalleryVisible] = useState(false);

  const isApproved = status === "APPROVED";
  const isLoading = status === "LOADING";
  const isEntry = scanType === "ENTRY";

  // Theme configuration based on state
  const getTheme = () => {
    if (isLoading) {
      return {
        bg: "bg-black/80", // Semi-transparent black for loading
        icon: "⏳",
        title: "VERIFYING...",
        photoBorder: "#FF9C01",
        initialsGradient: "#FFD580",
      };
    }

    if (!isApproved) {
      return {
        bg: "bg-rose-600",
        icon: "❌",
        title: "ACCESS DENIED",
        photoBorder: "#EF4444",
        initialsGradient: "#FCA5A5",
      };
    }

    if (isEntry) {
      return {
        bg: "bg-emerald-600",
        icon: "✅",
        title: isReturning ? "WELCOME BACK" : "CHECKED IN",
        badge: isReturning ? "RETURNING" : "ENTRY",
        badgeBg: "bg-emerald-100",
        badgeText: "text-emerald-700",
        accentBg: "bg-emerald-50",
        accentText: "text-emerald-600",
        photoBorder: "#10B981",
        initialsGradient: "#A7F3D0",
      };
    }

    // EXIT
    return {
      bg: "bg-indigo-600",
      icon: "👋",
      title: "GOODBYE",
      badge: "EXIT",
      badgeBg: "bg-indigo-100",
      badgeText: "text-indigo-700",
      accentBg: "bg-indigo-50",
      accentText: "text-indigo-600",
      photoBorder: "#6366F1",
      initialsGradient: "#C7D2FE",
    };
  };

  // Memoize theme to prevent recalculation on every render
  const theme = useMemo(() => getTheme(), [status, scanType, isReturning]);

  return (
    <Animated.View
      entering={FadeIn.duration(150)}
      className={`absolute inset-0 ${theme.bg} justify-center`}
    >
      <SafeAreaView className="flex-1 justify-between">
        {/* Top: Title - Only show for regular ENTRY (not RETURNING or EXIT) - Actually we are unifying UI so maybe remove this title as ReturningCard has its own header?
            The ReturningResultCard has "Welcome Back" or "Welcome" header.
            The snippet at lines 108-120 shows a title. If I now use ReturningResultCard for all entries, I should probably HIDE this title because the card has it inside.
         */}
        {/* Top: Title - Only show for regular ENTRY (not RETURNING or EXIT) */}
        {isApproved && !isReturning && isEntry && false && ( // Disabled as card handles it
          <Animated.View
            entering={ZoomIn.duration(250)}
            className="items-center pt-6"
          >
            <Text
              className="text-white text-xl font-bold"
              style={{ fontFamily: "Figtree_700Bold" }}
            >
              {theme.title}
            </Text>
          </Animated.View>
        )}

        {/* Middle: Card */}
        <View
          className={
            isApproved && (isReturning || !isEntry)
              ? "flex-1"
              : "px-4 flex-1 justify-center my-4"
          }
        >
          {isLoading ? (
            <View className="items-center justify-center flex-1">
              <View className="w-24 h-24 bg-black/40 rounded-full items-center justify-center backdrop-blur-md">
                <ActivityIndicator size="large" color="#FFFFFF" />
              </View>
            </View>
          ) : isApproved && name ? (
            isReturning ? (
              // RETURNING student - Profile-style layout
              <ReturningResultCard
                name={name}
                sapId={sapId || "N/A"}
                semester={semester || "-"}
                section={section || "-"}
                profilePhotoUrl={profilePhotoUrl}
                theme={theme}
                onImagePress={() => setIsGalleryVisible(true)}
              />
            ) : !isEntry ? (
              // EXIT - Profile-style layout with indigo theme
              <ExitResultCard
                name={name}
                sapId={sapId || "N/A"}
                semester={semester || "-"}
                section={section || "-"}
                profilePhotoUrl={profilePhotoUrl}
                theme={theme}
                onImagePress={() => setIsGalleryVisible(true)}
              />
            ) : (
              // Regular ENTRY - Card layout
              // Regular ENTRY - Use SAME wrapper as Returning for consistency
              <ReturningResultCard
                name={name}
                sapId={sapId || "N/A"}
                semester={semester || "-"}
                section={section || "-"}
                profilePhotoUrl={profilePhotoUrl}
                theme={theme}
                onImagePress={() => setIsGalleryVisible(true)}
                isReturning={false}
              />
            )
          ) : (
            <RejectedResultCard
              reason={reason || "Unknown Error"}
              name={name}
              profilePhotoUrl={profilePhotoUrl}
              recentLogs={recentLogs}
              theme={theme}
              onImagePress={() => setIsGalleryVisible(true)}
              verifiedOffline={verifiedOffline}
            />
          )}
        </View>

        {/* Bottom: Button */}
        <View className="px-4 mt-5 pb-3">
          <TouchableOpacity
            onPress={onDismiss}
            className={`py-4 rounded-xl items-center ${isApproved ? "bg-white" : "bg-white/90"
              }`}
            activeOpacity={0.85}
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
            }}
          >
            <Text
              className={`text-base font-bold ${isApproved ? theme.accentText : "text-rose-600"
                }`}
              style={{ fontFamily: "Figtree_700Bold", letterSpacing: 1 }}
            >
              {isApproved ? "NEXT" : "DISMISS"}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Image Gallery */}
      {profilePhotoUrl && (
        <ImageView
          images={[{ uri: profilePhotoUrl }]}
          imageIndex={0}
          visible={isGalleryVisible}
          onRequestClose={() => setIsGalleryVisible(false)}
        />
      )}
    </Animated.View>
  );
}
