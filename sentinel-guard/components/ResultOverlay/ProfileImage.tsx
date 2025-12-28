import React, { useState } from "react";
import { View, Image, Text, TouchableOpacity } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

interface ProfileImageProps {
  profilePhotoUrl?: string | null;
  name?: string;
  size: number;
  theme: {
    photoBorder: string;
    initialsGradient: string;
  };
  onPress: () => void;
}

export const ProfileImage: React.FC<ProfileImageProps> = ({
  profilePhotoUrl,
  name,
  size,
  theme,
  onPress,
}) => {
  const [imageError, setImageError] = useState(false);

  // Generate initials from name
  const getInitials = (fullName: string): string => {
    const parts = fullName.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return fullName.substring(0, 2).toUpperCase();
  };

  const imageContainerStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    borderWidth: size > 100 ? 4 : 3,
    borderColor: theme.photoBorder,
    shadowColor: theme.photoBorder,
    overflow: "hidden" as const,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    backgroundColor: "#fff",
  };

  // Show initials if no photo or error
  if (!profilePhotoUrl || imageError) {
    const initials = name ? getInitials(name) : "??";
    return (
      <Animated.View
        entering={FadeIn.delay(100)}
        style={[
          imageContainerStyle,
          { backgroundColor: theme.initialsGradient },
        ]}
      >
        <Text
          style={{
            fontSize: size / 2.5,
            fontWeight: "700",
            color: "#161622",
            fontFamily: "Figtree_700Bold",
          }}
        >
          {initials}
        </Text>
      </Animated.View>
    );
  }

  // Show photo
  return (
    <Animated.View entering={FadeIn.delay(100)} style={imageContainerStyle}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={onPress}
        style={{ width: "100%", height: "100%" }}
      >
        <Image
          source={{ uri: profilePhotoUrl }}
          style={{ width: "100%", height: "100%" }}
          onError={() => setImageError(true)}
          resizeMode="cover"
        />
      </TouchableOpacity>
    </Animated.View>
  );
};
