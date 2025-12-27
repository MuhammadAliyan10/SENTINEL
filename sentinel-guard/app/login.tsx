import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { supabase } from "../src/lib/supabase";

// Valid roles that can use the Guard app
const AUTHORIZED_ROLES = ["GUARD", "SUPER_ADMIN"];

// Rate limiting constants
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_STORAGE_KEY = "sentinel_login_attempts";

interface RateLimitData {
  attempts: number;
  lockoutUntil: number | null;
}

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lockoutRemaining, setLockoutRemaining] = useState<number>(0);

  // Check lockout status on mount and periodically
  useEffect(() => {
    const checkLockout = async () => {
      const data = await getRateLimitData();
      if (data.lockoutUntil) {
        const remaining = data.lockoutUntil - Date.now();
        if (remaining > 0) {
          setLockoutRemaining(Math.ceil(remaining / 1000 / 60));
        } else {
          // Lockout expired, reset
          await resetRateLimit();
          setLockoutRemaining(0);
        }
      }
    };

    checkLockout();
    const interval = setInterval(checkLockout, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  const getRateLimitData = async (): Promise<RateLimitData> => {
    try {
      const stored = await AsyncStorage.getItem(RATE_LIMIT_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      // Ignore storage errors
    }
    return { attempts: 0, lockoutUntil: null };
  };

  const setRateLimitData = async (data: RateLimitData) => {
    try {
      await AsyncStorage.setItem(RATE_LIMIT_STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      // Ignore storage errors
    }
  };

  const resetRateLimit = async () => {
    await setRateLimitData({ attempts: 0, lockoutUntil: null });
  };

  const incrementFailedAttempt = async () => {
    const data = await getRateLimitData();
    const newAttempts = data.attempts + 1;

    if (newAttempts >= MAX_FAILED_ATTEMPTS) {
      // Lockout user
      const lockoutUntil = Date.now() + LOCKOUT_DURATION_MS;
      await setRateLimitData({ attempts: newAttempts, lockoutUntil });
      const mins = Math.ceil(LOCKOUT_DURATION_MS / 1000 / 60);
      setLockoutRemaining(mins);
      setError(`Too many failed attempts. Try again in ${mins} minutes.`);
    } else {
      await setRateLimitData({ attempts: newAttempts, lockoutUntil: null });
      const remaining = MAX_FAILED_ATTEMPTS - newAttempts;
      setError(`Invalid credentials. ${remaining} attempts remaining.`);
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Please enter email and password");
      return;
    }

    // Check if locked out
    const rateData = await getRateLimitData();
    if (rateData.lockoutUntil && rateData.lockoutUntil > Date.now()) {
      const mins = Math.ceil((rateData.lockoutUntil - Date.now()) / 1000 / 60);
      setError(`Account locked. Try again in ${mins} minutes.`);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Authenticate with Supabase
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password: password.trim(),
        });

      if (authError) {
        await incrementFailedAttempt();
        setIsLoading(false);
        return;
      }

      if (!authData.user) {
        await incrementFailedAttempt();
        setIsLoading(false);
        return;
      }

      // Step 2: Verify role from database
      console.log("[Login] Checking user profile for ID:", authData.user.id);
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("role, is_active")
        .eq("id", authData.user.id)
        .single();

      console.log("[Login] Profile result:", {
        userData,
        userError: userError?.message,
      });

      if (userError || !userData) {
        console.log("[Login] FAILED: User not found in database");
        await supabase.auth.signOut();
        setError("Account not found in system. Contact admin.");
        setIsLoading(false);
        return;
      }

      // Step 3: Verify account is active
      if (!userData.is_active) {
        console.log("[Login] FAILED: Account deactivated");
        await supabase.auth.signOut();
        setError("Your account has been deactivated");
        setIsLoading(false);
        return;
      }

      // Step 4: Verify role is authorized for Guard app
      if (!AUTHORIZED_ROLES.includes(userData.role)) {
        console.log("[Login] FAILED: Wrong role -", userData.role);
        await supabase.auth.signOut();
        setError("Access Denied: Guard or Admin privileges required");
        setIsLoading(false);
        return;
      }

      console.log("[Login] SUCCESS: All checks passed");

      // Success! Reset rate limit and navigate explicitly
      await resetRateLimit();
      setIsLoading(false);

      // EXPLICIT NAVIGATION - Don't rely on _layout.tsx state changes
      router.replace("/(tabs)");
    } catch (e: any) {
      setError(e.message || "An unexpected error occurred");
      setIsLoading(false);
    }
  };

  const isLockedOut = lockoutRemaining > 0;
  const scrollViewRef = useRef<ScrollView>(null);

  // Scroll to show password field when keyboard opens
  const handlePasswordFocus = () => {
    // Wait for keyboard to fully open before scrolling
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: 150, animated: true });
    }, 300);
  };

  return (
    <SafeAreaView className="flex-1 bg-primary">
      <StatusBar style="light" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 25}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            paddingVertical: 40,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          className="px-8"
        >
          {/* Header */}
          <View className="items-center mb-12">
            <View className="w-20 h-20 rounded-2xl bg-secondary items-center justify-center mb-6">
              <Ionicons name="shield-checkmark" size={40} color="#161622" />
            </View>
            <Text
              className="text-white text-3xl tracking-tight"
              style={{ fontWeight: "800", letterSpacing: -1 }}
            >
              SENTINEL GUARD
            </Text>
            <Text className="text-gray-100 text-base mt-2">
              Security Portal
            </Text>
          </View>

          {/* Lockout Warning */}
          {isLockedOut && (
            <View className="bg-amber-500/20 border border-amber-500/50 rounded-xl p-4 mb-6">
              <View className="flex-row items-center justify-center">
                <Ionicons name="lock-closed" size={20} color="#F59E0B" />
                <Text className="text-amber-400 text-center font-medium ml-2">
                  Account locked for {lockoutRemaining} min
                </Text>
              </View>
            </View>
          )}

          {/* Error Message */}
          {error && !isLockedOut && (
            <View className="bg-rose-500/20 border border-rose-500/50 rounded-xl p-4 mb-6">
              <Text className="text-rose-400 text-center font-medium">
                {error}
              </Text>
            </View>
          )}

          {/* Email Input */}
          <View className="mb-4">
            <Text className="text-gray-100 text-sm font-bold mb-2 uppercase tracking-wider">
              Email
            </Text>
            <TextInput
              className="bg-black-100 text-white text-lg p-4 rounded-xl border border-black-200"
              placeholder="guard@university.edu"
              placeholderTextColor="#CDCDE0"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              editable={!isLockedOut}
            />
          </View>

          {/* Password Input */}
          <View className="mb-8">
            <Text className="text-gray-100 text-sm font-bold mb-2 uppercase tracking-wider">
              Password
            </Text>
            <View className="relative">
              <TextInput
                className="bg-black-100 text-white text-lg p-4 pr-14 rounded-xl border border-black-200"
                placeholder="••••••••"
                placeholderTextColor="#CDCDE0"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoComplete="password"
                editable={!isLockedOut}
                onFocus={handlePasswordFocus}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-4"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={24}
                  color="#CDCDE0"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Login Button */}
          <TouchableOpacity
            onPress={handleLogin}
            disabled={isLoading || isLockedOut}
            className={`py-5 rounded-xl items-center ${
              isLoading || isLockedOut ? "bg-secondary/50" : "bg-secondary"
            }`}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#161622" />
            ) : (
              <Text
                className="text-primary text-lg"
                style={{ fontWeight: "800", letterSpacing: 0.5 }}
              >
                {isLockedOut ? "LOCKED" : "AUTHENTICATE"}
              </Text>
            )}
          </TouchableOpacity>

          {/* Footer */}
          <Text className="text-gray-100/50 text-center mt-8 mb-12 text-sm">
            Authorized Personnel Only
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
