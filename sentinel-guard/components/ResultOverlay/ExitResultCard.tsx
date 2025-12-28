import React from "react";
import { View, Text } from "react-native";
import { ProfileImage } from "./ProfileImage";

interface ExitResultCardProps {
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
}

export const ExitResultCard: React.FC<ExitResultCardProps> = ({
  name,
  sapId,
  semester,
  section,
  profilePhotoUrl,
  theme,
  onImagePress,
}) => {
  return (
    <View className="flex-1">
      {/* Header with Goodbye text - higher position */}
      <View className="bg-white/10 pt-8 pb-14 items-center">
        <Text
          className="text-white text-3xl font-bold"
          style={{ fontFamily: "Figtree_700Bold" }}
        >
          Goodbye
        </Text>
      </View>

      {/* White card section - no rounded corners */}
      <View className="bg-white flex-1 px-6 pt-2">
        {/* Profile Photo - overlapping, border only */}
        <View className="items-center -mt-16 mb-3">
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
          className="text-gray-900 text-2xl font-bold text-center mb-1"
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

        {/* Badge Row - EXIT */}
        <View className="flex-row justify-center mb-4">
          <View className="bg-indigo-100 px-4 py-2 rounded-lg">
            <Text
              className="text-indigo-600 text-sm font-bold"
              style={{ fontFamily: "Figtree_600SemiBold" }}
            >
              EXIT
            </Text>
          </View>
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

        {/* Checked Out Time with Clock Icon */}
        <View className="bg-indigo-50 p-3 rounded-xl mb-3">
          <Text
            className="text-indigo-600 text-xs uppercase mb-1"
            style={{ fontFamily: "Figtree_600SemiBold" }}
          >
            CHECKED OUT AT
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
