import { useEffect, useState } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, ActivityIndicator } from "react-native";
import { supabase } from "../src/lib/supabase";
import { Session } from "@supabase/supabase-js";
import ErrorBoundary from "../components/ErrorBoundary";
import "../global.css";

function RootLayoutNav() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(tabs)";

    if (session && !inAuthGroup) {
      // Logged in, redirect to tabs
      router.replace("/(tabs)");
    } else if (!session && inAuthGroup) {
      // Not logged in, redirect to login
      router.replace("/login");
    } else if (!session && segments[0] !== "login") {
      // Not logged in and not on login page
      router.replace("/login");
    }
  }, [session, segments, isLoading]);

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
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <RootLayoutNav />
    </ErrorBoundary>
  );
}
