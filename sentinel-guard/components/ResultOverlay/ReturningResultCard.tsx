import React from "react";
import { View, Text } from "react-native";
import { ProfileImage } from "./ProfileImage";

interface ReturningResultCardProps {
  name: string;
  sapId: string;
  semester: string;
  section: string;
  profilePhotoUrl?: string | null;
  theme: {
    photoBorder: string;
    initialsGradient: string;
  };
  onImagePress: () => void;
  isReturning?: boolean;
}

export const ReturningResultCard: React.FC<ReturningResultCardProps> = ({
  name,
  sapId,
  semester,
  section,
  profilePhotoUrl,
  theme,
  onImagePress,
  isReturning = true,
}) => {
  return (
    <View className="flex-1">
      {/* Header with Welcome Back text - Flexible spacing with room for overlap */}
      <View className="pt-8 pb-16 items-center justify-center shrink-0 z-20">
        <Text
          className="text-white text-2xl font-bold tracking-wider text-center px-4"
          style={{ fontFamily: "Figtree_700Bold" }}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {isReturning ? "Welcome Back" : "Entry"}
        </Text>
      </View>

      {/* White card section - Flex 1 to take remaining space */}
      <View className="bg-white flex-1 px-6 pt-20 relative rounded-t-3xl">
        {/* Profile Photo - Absolute positioned to overlap perfectly */}
        <View className="absolute top-[-55px] left-0 right-0 items-center z-10">
          <ProfileImage
            profilePhotoUrl={profilePhotoUrl}
            name={name}
            size={110}
            theme={theme}
            onPress={onImagePress}
          />
        </View>

        {/* Name */}
        <Text
          className="text-gray-900 text-2xl font-bold text-center mb-1 mt-2"
          style={{ fontFamily: "Figtree_700Bold" }}
        >
          {name}
        </Text>

        {/* SAP ID */}
        <Text
          className="text-gray-500 text-base text-center mb-3 font-mono"
          style={{ fontFamily: "Figtree_500Medium" }}
        >
          {sapId}
        </Text>

        {/* Badges Row */}
        <View className="flex-row justify-center gap-3 mb-4">
          <View className="bg-emerald-100 px-4 py-2 rounded-lg">
            <Text
              className="text-emerald-600 text-sm font-bold"
              style={{ fontFamily: "Figtree_600SemiBold" }}
            >
              ENTRY
            </Text>
          </View>
          {isReturning && (
            <View className="bg-emerald-100 px-4 py-2 rounded-lg">
              <Text
                className="text-emerald-600 text-sm font-bold"
                style={{ fontFamily: "Figtree_600SemiBold" }}
              >
                ✓ RETURNING
              </Text>
            </View>
          )}
        </View>

        {/* Info Grid */}
        <View className="flex-row gap-3 mb-3 mt-3">
          {/* Section */}
          <View className="flex-1 bg-gray-50 p-3 rounded-xl">
            <Text
              className="text-gray-400 text-xs uppercase mb-1"
              style={{ fontFamily: "Figtree_600SemiBold" }}
            >
              SECTION
            </Text>
            <Text
              className="text-gray-900 text-xl font-bold"
              style={{ fontFamily: "Figtree_700Bold" }}
            >
              {section}
            </Text>
          </View>

          {/* Semester */}
          <View className="flex-1 bg-gray-50 p-3 rounded-xl">
            <Text
              className="text-gray-400 text-xs uppercase mb-1"
              style={{ fontFamily: "Figtree_600SemiBold" }}
            >
              SEMESTER
            </Text>
            <Text
              className="text-gray-900 text-xl font-bold"
              style={{ fontFamily: "Figtree_700Bold" }}
            >
              {semester}
            </Text>
          </View>
        </View>

        {/* Checked In Time with Clock Icon */}
        <View className="bg-emerald-50 p-3 rounded-xl mb-3">
          <Text
            className="text-emerald-600 text-xs uppercase mb-1"
            style={{ fontFamily: "Figtree_600SemiBold" }}
          >
            CHECKED IN AT
          </Text>
          <View className="flex-row items-center">
            <Text className="text-lg mr-2">🕐</Text>
            <Text
              className="text-gray-900 text-lg font-bold"
              style={{ fontFamily: "Figtree_700Bold" }}
            >
              {new Date().toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};
