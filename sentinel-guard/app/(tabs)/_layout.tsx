import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  // Calculate proper tab bar height based on safe area
  const tabBarHeight = 60 + insets.bottom;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#1E1E2D", // black-100
          borderTopColor: "#232533", // black-200
          borderTopWidth: 1,
          height: tabBarHeight,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 10,
          paddingTop: 10,
        },
        tabBarActiveTintColor: "#FF9C01", // secondary
        tabBarInactiveTintColor: "#CDCDE0", // gray-100
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Scanner",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="scan-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-circle-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
