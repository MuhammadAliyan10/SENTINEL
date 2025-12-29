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
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import {
  supabase,
  getGuardLoginStatus,
  incrementFailedLogin,
  resetLoginAttempts,
} from "../src/lib/supabase";

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
  // Uses AsyncStorage as UX cache, but actual enforcement is server-side
  useEffect(() => {
    const checkLockout = async () => {
      // First check local cache for instant UI feedback
      const localData = await getRateLimitData();
      if (localData.lockoutUntil && localData.lockoutUntil > Date.now()) {
        setLockoutRemaining(
          Math.ceil((localData.lockoutUntil - Date.now()) / 1000 / 60)
        );
      } else if (localData.lockoutUntil) {
        // Local lockout expired, clear it
        await resetRateLimit();
        setLockoutRemaining(0);
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

    setIsLoading(true);
    setError(null);

    try {
      // Step 0: Check SERVER-SIDE lockout status (cannot be bypassed)
      const serverStatus = await getGuardLoginStatus(email.trim());
      if (serverStatus.isLocked) {
        // Also update local cache for UI consistency
        const lockoutUntil =
          serverStatus.lockedUntil?.getTime() || Date.now() + 15 * 60 * 1000;
        await setRateLimitData({
          attempts: serverStatus.failedAttempts,
          lockoutUntil,
        });
        setLockoutRemaining(serverStatus.remainingMinutes);
        setError(
          `Account locked. Try again in ${serverStatus.remainingMinutes} minutes.`
        );
        setIsLoading(false);
        return;
      }

      // Step 1: Authenticate with Supabase
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password: password.trim(),
        });

      if (authError) {
        // Auth failed - but we need the user ID to increment server-side counter
        // For now, use local tracking as fallback since we don't have the user ID
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
        // Increment server-side counter since we have the user ID
        const result = await incrementFailedLogin(authData.user.id);
        if (result.isNowLocked) {
          const lockoutUntil = Date.now() + 15 * 60 * 1000;
          await setRateLimitData({
            attempts: result.failedAttempts,
            lockoutUntil,
          });
          setLockoutRemaining(15);
          setError("Too many failed attempts. Account locked for 15 minutes.");
        } else {
          setError(
            `Account not found in system. Contact admin. (${result.remainingAttempts} attempts remaining)`
          );
        }
        setIsLoading(false);
        return;
      }

      // Step 3: Verify account is active
      if (!userData.is_active) {
        console.log("[Login] FAILED: Account deactivated");
        await supabase.auth.signOut();
        const result = await incrementFailedLogin(authData.user.id);
        if (result.isNowLocked) {
          const lockoutUntil = Date.now() + 15 * 60 * 1000;
          await setRateLimitData({
            attempts: result.failedAttempts,
            lockoutUntil,
          });
          setLockoutRemaining(15);
          setError("Too many failed attempts. Account locked for 15 minutes.");
        } else {
          setError("Your account has been deactivated");
        }
        setIsLoading(false);
        return;
      }

      // Step 4: Verify role is authorized for Guard app
      if (!AUTHORIZED_ROLES.includes(userData.role)) {
        console.log("[Login] FAILED: Wrong role -", userData.role);
        await supabase.auth.signOut();
        const result = await incrementFailedLogin(authData.user.id);
        if (result.isNowLocked) {
          const lockoutUntil = Date.now() + 15 * 60 * 1000;
          await setRateLimitData({
            attempts: result.failedAttempts,
            lockoutUntil,
          });
          setLockoutRemaining(15);
          setError("Too many failed attempts. Account locked for 15 minutes.");
        } else {
          setError("Access Denied: Guard or Admin privileges required");
        }
        setIsLoading(false);
        return;
      }

      console.log("[Login] SUCCESS: All checks passed");

      // Success! Reset both server and local rate limits
      await resetLoginAttempts(authData.user.id);
      await resetRateLimit();
      setLockoutRemaining(0);
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
  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);

  // Scroll to show email field when keyboard opens
  const handleEmailFocus = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: 100, animated: true });
    }, 300);
  };

  // Scroll to show password field when keyboard opens
  const handlePasswordFocus = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: 300, animated: true });
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
            paddingTop: 60,
            paddingBottom: 40,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          className="px-8"
        >
          {/* Header */}
          <View className="items-center mb-10">
            {/* UOL Logo */}
            <View className="mb-6">
              <Image
                source={require("../assets/uolLogo.png")}
                style={{ width: 300, height: 130 }}
                resizeMode="contain"
              />
            </View>

            {/* App Name */}
            <Text
              className="text-secondary text-3xl mb-1"
              style={{
                fontFamily: "Figtree_800ExtraBold",
                fontWeight: "800",
                letterSpacing: -1,
              }}
            >
              SENTINEL GUARD
            </Text>
          </View>

          {/* Lockout Warning */}
          {isLockedOut && (
            <View className="bg-amber-500/20 border border-amber-500/50 rounded-xl p-4 mb-6">
              <View className="flex-row items-center justify-center">
                <Ionicons name="lock-closed" size={20} color="#F59E0B" />
                <Text
                  className="text-amber-400 text-center font-medium ml-2"
                  style={{ fontFamily: "Figtree_500Medium" }}
                >
                  Account locked for {lockoutRemaining} min
                </Text>
              </View>
            </View>
          )}

          {/* Error Message */}
          {error && !isLockedOut && (
            <View className="bg-rose-500/20 border border-rose-500/50 rounded-xl p-4 mb-6">
              <Text
                className="text-rose-400 text-center font-medium"
                style={{ fontFamily: "Figtree_500Medium" }}
              >
                {error}
              </Text>
            </View>
          )}

          {/* Email Input */}
          <View className="mb-4">
            <Text
              className="text-gray-100 text-sm font-bold mb-2 uppercase tracking-wider"
              style={{ fontFamily: "Figtree_700Bold" }}
            >
              Email
            </Text>
            <TextInput
              ref={emailInputRef}
              style={{ fontFamily: "Figtree_400Regular" }}
              className="bg-black-100 text-white text-lg p-4 rounded-xl border border-black-200"
              placeholder="guard@university.edu"
              placeholderTextColor="#CDCDE0"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              editable={!isLockedOut}
              onFocus={handleEmailFocus}
            />
          </View>

          {/* Password Input */}
          <View className="mb-8">
            <Text
              className="text-gray-100 text-sm font-bold mb-2 uppercase tracking-wider"
              style={{ fontFamily: "Figtree_700Bold" }}
            >
              Password
            </Text>
            <View className="relative">
              <TextInput
                ref={passwordInputRef}
                style={{ fontFamily: "Figtree_400Regular" }}
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
                style={{
                  fontFamily: "Figtree_800ExtraBold",
                  fontWeight: "800",
                  letterSpacing: 0.5,
                }}
              >
                {isLockedOut ? "LOCKED" : "AUTHENTICATE"}
              </Text>
            )}
          </TouchableOpacity>

          {/* Footer */}
          <Text
            className="text-gray-100/50 text-center mt-8 mb-12 text-sm"
            style={{ fontFamily: "Figtree_400Regular" }}
          >
            Authorized Personnel Only
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
