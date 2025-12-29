import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../src/lib/supabase";

interface ProfileErrorProps {
  errorMessage?: string;
}

/**
 * Profile Error Screen
 *
 * Shown when:
 * - Auth session exists but user profile missing from database
 * - User account is deactivated
 * - User doesn't have GUARD/SUPER_ADMIN role
 *
 * This prevents the "Login → Home → Login" loop by NOT redirecting.
 */
export default function ProfileErrorScreen({
  errorMessage = "Your profile data is missing or invalid.",
}: ProfileErrorProps) {
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <StatusBar style="light" />

      <View className="flex-1 items-center justify-center px-8">
        {/* Error Icon */}
        <View className="w-24 h-24 rounded-full bg-rose-500/20 items-center justify-center mb-6">
          <Ionicons name="alert-circle" size={48} color="#F87171" />
        </View>

        {/* Title */}
        <Text
          className="text-white text-2xl font-bold text-center mb-2"
          style={{ fontFamily: "Figtree_700Bold" }}
        >
          Account Error
        </Text>

        {/* Description */}
        <Text
          className="text-gray-400 text-center mb-4"
          style={{ fontFamily: "Figtree_400Regular" }}
        >
          Your login is valid, but there's a problem with your account.
        </Text>

        {/* Error Message Box */}
        <View className="bg-rose-900/30 border border-rose-500/50 rounded-xl p-4 mb-8 w-full">
          <Text
            className="text-rose-300 text-center"
            style={{ fontFamily: "Figtree_500Medium" }}
          >
            {errorMessage}
          </Text>
        </View>

        {/* Help Text */}
        <Text
          className="text-gray-500 text-center text-sm mb-8"
          style={{ fontFamily: "Figtree_400Regular" }}
        >
          This can happen if your account was removed or your permissions were
          changed. Please contact your system administrator.
        </Text>

        {/* Logout Button */}
        <TouchableOpacity
          onPress={handleLogout}
          className="bg-rose-600 py-4 px-8 rounded-xl flex-row items-center"
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={20} color="#fff" />
          <Text
            className="text-white font-bold text-lg ml-2"
            style={{ fontFamily: "Figtree_700Bold" }}
          >
            Sign Out
          </Text>
        </TouchableOpacity>

        {/* Footer */}
        <Text
          className="text-gray-600 text-xs mt-8 text-center"
          style={{ fontFamily: "Figtree_400Regular" }}
        >
          After signing out, you can try logging in again{"\n"}
          or use a different account.
        </Text>
      </View>
    </SafeAreaView>
  );
}
