import React from "react";
import { View, Text } from "react-native";
import { ProfileImage } from "./ProfileImage";

interface ApprovedResultCardProps {
  scanType: "ENTRY" | "EXIT";
  isReturning?: boolean;
  name: string;
  sapId: string;
  semester: string;
  section: string;
  profilePhotoUrl?: string | null;
  theme: {
    badge?: string;
    badgeBg?: string;
    badgeText?: string;
    accentBg?: string;
    accentText?: string;
    photoBorder: string;
    initialsGradient: string;
  };
  onImagePress: () => void;
}

export const ApprovedResultCard: React.FC<ApprovedResultCardProps> = ({
  scanType,
  isReturning,
  name,
  sapId,
  semester,
  section,
  profilePhotoUrl,
  theme,
  onImagePress,
}) => {
  const isEntry = scanType === "ENTRY";
  const imageSize = isEntry ? 80 : 120; // Larger for EXIT

  // Get current time
  const currentTime = new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <View className="bg-white rounded-2xl p-5 mx-2">
      {/* Profile Photo - Top Center */}
      <View className="items-center mb-4">
        <ProfileImage
          profilePhotoUrl={profilePhotoUrl}
          name={name}
          size={imageSize}
          theme={theme}
          onPress={onImagePress}
        />
      </View>

      {/* Badge */}
      {theme.badge && (
        <View className="self-center mb-2">
          <View className={`px-3 py-1 rounded-full ${theme.badgeBg}`}>
            <Text
              className={`text-xs font-bold ${theme.badgeText}`}
              style={{ fontFamily: "Figtree_700Bold" }}
            >
              {theme.badge}
            </Text>
          </View>
        </View>
      )}

      {/* Name - Bigger for EXIT */}
      <Text
        className={`text-gray-900 font-bold text-center ${isEntry ? "text-lg" : "text-2xl"
          }`}
        style={{ fontFamily: "Figtree_700Bold" }}
      >
        {name.toUpperCase()}
      </Text>

      {/* SAP */}
      <Text
        className="text-gray-500 text-sm text-center font-mono mb-3"
        style={{ fontFamily: "Figtree_500Medium" }}
      >
        {sapId}
      </Text>

      {/* Time - Bigger for EXIT */}
      <View className={`${theme.accentBg} rounded-xl p-3 mb-3`}>
        <Text className="text-center">
          <Text className={isEntry ? "text-lg" : "text-2xl"}>🕐 </Text>
          <Text
            className={`text-gray-900 font-bold ${isEntry ? "text-lg" : "text-2xl"
              }`}
            style={{ fontFamily: "Figtree_700Bold" }}
          >
            {currentTime}
          </Text>
        </Text>
      </View>

      {/* Sem/Sec Row - Bigger for EXIT */}
      <View className="flex-row gap-3">
        <View
          className={`flex-1 p-3 rounded-xl items-center ${theme.accentBg}`}
        >
          <Text
            className={`text-xs ${theme.accentText}`}
            style={{ fontFamily: "Figtree_600SemiBold" }}
          >
            SEM
          </Text>
          <Text
            className={`text-gray-900 font-bold ${isEntry ? "text-lg" : "text-2xl"
              }`}
            style={{ fontFamily: "Figtree_700Bold" }}
          >
            {semester || "-"}
          </Text>
        </View>
        <View
          className={`flex-1 p-3 rounded-xl items-center ${theme.accentBg}`}
        >
          <Text
            className={`text-xs ${theme.accentText}`}
            style={{ fontFamily: "Figtree_600SemiBold" }}
          >
            SEC
          </Text>
          <Text
            className={`text-gray-900 font-bold ${isEntry ? "text-lg" : "text-2xl"
              }`}
            style={{ fontFamily: "Figtree_700Bold" }}
          >
            {section || "-"}
          </Text>
        </View>
      </View>
    </View>
  );
};
