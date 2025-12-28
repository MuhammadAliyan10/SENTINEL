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

      <View className="flex-1">
        {/* Header Section with Gradient Effect */}
        <View className="px-4 pt-6 pb-8 bg-black-100 border-b border-black-200">
          <Text
            className="text-white text-2xl font-bold mb-1"
            style={{ fontFamily: "Figtree_800ExtraBold" }}
          >
            Profile
          </Text>
          <Text
            className="text-gray-100 text-sm"
            style={{ fontFamily: "Figtree_400Regular" }}
          >
            Manage your account settings
          </Text>
        </View>

        <View className="flex-1 px-4 pt-4">
          {/* Profile Card */}
          <View className="bg-black-100 rounded-2xl p-5 mb-4 border border-black-200">
            <View className="flex-row items-center">
              {/* Avatar */}
              <View className="w-20 h-20 rounded-full bg-secondary items-center justify-center mr-4">
                <Ionicons name="shield-checkmark" size={36} color="#161622" />
              </View>

              {/* User Info */}
              <View className="flex-1">
                <Text
                  className="text-white text-xl font-bold mb-0.5"
                  style={{ fontFamily: "Figtree_700Bold" }}
                >
                  {profile?.fullName || "Security Guard"}
                </Text>
                <Text
                  className="text-gray-100 text-sm mb-2"
                  style={{ fontFamily: "Figtree_400Regular" }}
                >
                  {profile?.email || "Loading..."}
                </Text>

                {/* Role Badge */}
                <View className="self-start bg-secondary/20 px-3 py-1 rounded-full border border-secondary/40">
                  <Text
                    className="text-secondary text-xs font-bold"
                    style={{ fontFamily: "Figtree_600SemiBold" }}
                  >
                    {formatRole(profile?.role || "GUARD")}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Account Details */}
          <View className="bg-black-100 rounded-2xl border border-black-200 mb-4 overflow-hidden">
            {/* Section Header */}
            <View className="px-4 py-3 bg-black-200/50 border-b border-black-200">
              <Text
                className="text-white text-sm font-bold uppercase tracking-wider"
                style={{ fontFamily: "Figtree_700Bold" }}
              >
                Account Details
              </Text>
            </View>

            {/* App Version */}
            <View className="flex-row justify-between items-center px-4 py-4 border-b border-black-200">
              <View className="flex-row items-center">
                <View className="w-9 h-9 rounded-lg bg-blue-500/20 items-center justify-center mr-3">
                  <Ionicons
                    name="information-circle-outline"
                    size={20}
                    color="#3B82F6"
                  />
                </View>
                <Text
                  className="text-gray-100 text-sm"
                  style={{ fontFamily: "Figtree_400Regular" }}
                >
                  App Version
                </Text>
              </View>
              <Text
                className="text-white text-sm font-semibold"
                style={{ fontFamily: "Figtree_600SemiBold" }}
              >
                {appVersion}
              </Text>
            </View>

            {/* Status */}
            <View className="flex-row justify-between items-center px-4 py-4 border-b border-black-200">
              <View className="flex-row items-center">
                <View
                  className={`w-9 h-9 rounded-lg items-center justify-center mr-3 ${
                    profile?.isActive ? "bg-emerald-500/20" : "bg-rose-500/20"
                  }`}
                >
                  <Ionicons
                    name={
                      profile?.isActive
                        ? "checkmark-circle-outline"
                        : "close-circle-outline"
                    }
                    size={20}
                    color={profile?.isActive ? "#10B981" : "#EF4444"}
                  />
                </View>
                <Text
                  className="text-gray-100 text-sm"
                  style={{ fontFamily: "Figtree_400Regular" }}
                >
                  Account Status
                </Text>
              </View>
              <View
                className={`px-3 py-1 rounded-full ${
                  profile?.isActive ? "bg-emerald-500/20" : "bg-rose-500/20"
                }`}
              >
                <Text
                  className={`text-sm font-semibold ${
                    profile?.isActive ? "text-emerald-400" : "text-rose-400"
                  }`}
                  style={{ fontFamily: "Figtree_600SemiBold" }}
                >
                  {profile?.isActive ? "Active" : "Inactive"}
                </Text>
              </View>
            </View>

            {/* Role */}
            <View className="flex-row justify-between items-center px-4 py-4">
              <View className="flex-row items-center">
                <View className="w-9 h-9 rounded-lg bg-secondary/20 items-center justify-center mr-3">
                  <Ionicons name="shield-outline" size={20} color="#FF9C01" />
                </View>
                <Text
                  className="text-gray-100 text-sm"
                  style={{ fontFamily: "Figtree_400Regular" }}
                >
                  Access Role
                </Text>
              </View>
              <Text
                className="text-secondary text-sm font-semibold"
                style={{ fontFamily: "Figtree_600SemiBold" }}
              >
                {formatRole(profile?.role || "GUARD")}
              </Text>
            </View>
          </View>

          <View className="flex-1" />

          {/* Logout Button */}
          <TouchableOpacity
            onPress={handleLogout}
            className="bg-rose-600 py-4 rounded-2xl flex-row items-center justify-center mb-4 shadow-lg"
            activeOpacity={0.8}
          >
            <Ionicons name="log-out-outline" size={22} color="#fff" />
            <Text
              className="text-white font-bold text-base ml-2"
              style={{ fontFamily: "Figtree_700Bold" }}
            >
              Sign Out
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
