import { useEffect, useState, useRef, useCallback } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, ActivityIndicator } from "react-native";
import { supabase } from "../src/lib/supabase";
import { Session } from "@supabase/supabase-js";
import ErrorBoundary from "../components/ErrorBoundary";
import * as SplashScreen from "expo-splash-screen";
import {
  useFonts,
  Figtree_400Regular,
  Figtree_500Medium,
  Figtree_600SemiBold,
  Figtree_700Bold,
} from "@expo-google-fonts/figtree";
import "../global.css";

/**
 * Root Layout Navigation
 *
 * SIMPLIFIED AUTH FLOW:
 * - On mount: Check if session exists (for app restart scenarios)
 * - On SIGNED_OUT: Redirect to login
 * - On SIGNED_IN: Do NOT navigate - let login.tsx handle it with explicit router.replace
 *
 * This prevents race conditions between _layout.tsx and login.tsx
 */
function RootLayoutNav() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();
  const hasNavigatedRef = useRef(false);

  // Auth initialization - runs ONCE on mount
  useEffect(() => {
    let isMounted = true;

    // Get initial session (for app restart scenarios)
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (isMounted) {
        setSession(initialSession);
        setIsLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (__DEV__) {
        console.log("[Auth] Event:", event, "Session:", !!newSession);
      }

      if (isMounted) {
        // Only handle SIGNED_OUT - redirect to login
        if (event === "SIGNED_OUT") {
          setSession(null);
          hasNavigatedRef.current = false;
          router.replace("/login");
        }
        // SIGNED_IN is handled by login.tsx with explicit navigation
        // TOKEN_REFRESHED should not trigger any navigation
        else if (event === "TOKEN_REFRESHED") {
          setSession(newSession);
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  // Handle initial routing on app load ONLY
  useEffect(() => {
    if (isLoading) return;
    if (hasNavigatedRef.current) return;

    const inAuthGroup = segments[0] === "(tabs)";

    // No session on initial load -> go to login
    if (!session && !inAuthGroup && segments[0] !== "login") {
      hasNavigatedRef.current = true;
      router.replace("/login");
    }
    // Session exists on initial load (app restart) -> go to tabs
    // This handles the case where user was already logged in
    else if (session && !inAuthGroup && segments[0] !== "login") {
      hasNavigatedRef.current = true;
      router.replace("/(tabs)");
    }
  }, [session, segments, isLoading, router]);

  // Loading state
  if (isLoading) {
    return (
      <View className="flex-1 bg-slate-950 items-center justify-center">
        <StatusBar style="light" />
        <ActivityIndicator size="large" color="#4F39F6" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="profile-error" />
      </Stack>
    </>
  );
}

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Figtree_400Regular,
    Figtree_500Medium,
    Figtree_600SemiBold,
    Figtree_700Bold,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <ErrorBoundary>
        <RootLayoutNav />
      </ErrorBoundary>
    </View>
  );
}
