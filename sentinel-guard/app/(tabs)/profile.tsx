import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useState, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../src/lib/supabase";
import Constants from "expo-constants";

interface UserProfile {
  email: string;
  fullName: string;
  role: string;
  isActive: boolean;
}

export default function ProfileScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // Get auth user
        const { data: authData } = await supabase.auth.getUser();
        if (!authData?.user) {
          setLoading(false);
          return;
        }

        // Get profile from database
        const { data: userData, error } = await supabase
          .from("users")
          .select("full_name, role, is_active")
          .eq("id", authData.user.id)
          .single();

        if (error && __DEV__) {
          console.error("Profile fetch error:", error);
        }

        setProfile({
          email: authData.user.email || "Unknown",
          fullName: userData?.full_name || "Security Guard",
          role: userData?.role || "GUARD",
          isActive: userData?.is_active ?? true,
        });
      } catch (e) {
        if (__DEV__) {
          console.error("Profile error:", e);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleLogout = () => {
    Alert.alert("Logout", "End your session?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: () => supabase.auth.signOut(),
      },
    ]);
  };

  // Get app version from expo config
  const appVersion = Constants.expoConfig?.version || "1.0.0";

  // Format role for display
  const formatRole = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "Super Admin";
      case "GUARD":
        return "Security Guard";
      default:
        return role;
    }
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

      <View className="flex-1 px-4 pt-3">
        <Text className="text-white text-xl font-bold mb-4">Profile</Text>

        {/* Profile Card */}
        <View className="bg-black-100 rounded-xl p-4 mb-3 border border-black-200 items-center">
          <View className="w-16 h-16 rounded-full bg-secondary items-center justify-center mb-3">
            <Ionicons name="shield-checkmark" size={32} color="#161622" />
          </View>
          <Text className="text-white text-lg font-bold">
            {profile?.fullName || "Security Guard"}
          </Text>
          <Text className="text-gray-100 text-sm">
            {profile?.email || "Loading..."}
          </Text>
        </View>

        {/* Info */}
        <View className="bg-black-100 rounded-xl border border-black-200">
          <View className="flex-row justify-between p-3 border-b border-black-200">
            <Text className="text-gray-100 text-sm">App Version</Text>
            <Text className="text-white text-sm font-semibold">
              {appVersion}
            </Text>
          </View>
          <View className="flex-row justify-between p-3 border-b border-black-200">
            <Text className="text-gray-100 text-sm">Status</Text>
            <Text
              className={`text-sm font-semibold ${
                profile?.isActive ? "text-emerald-500" : "text-rose-500"
              }`}
            >
              {profile?.isActive ? "Active" : "Inactive"}
            </Text>
          </View>
          <View className="flex-row justify-between p-3">
            <Text className="text-gray-100 text-sm">Role</Text>
            <Text className="text-secondary text-sm font-semibold">
              {formatRole(profile?.role || "GUARD")}
            </Text>
          </View>
        </View>

        <View className="flex-1" />

        {/* Logout */}
        <TouchableOpacity
          onPress={handleLogout}
          className="bg-rose-600 py-3 rounded-xl flex-row items-center justify-center mb-4"
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={20} color="#fff" />
          <Text className="text-white font-bold ml-2">LOGOUT</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
