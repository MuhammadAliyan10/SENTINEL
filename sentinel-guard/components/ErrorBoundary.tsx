import React, { Component, ReactNode } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree
 * and displays a fallback UI instead of crashing the whole app.
 */
export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console in dev
    if (__DEV__) {
      console.error("ErrorBoundary caught an error:", error, errorInfo);
    }
    // In production, you could send this to a crash reporting service like Sentry
    // Sentry.captureException(error, { extra: errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView className="flex-1 bg-primary">
          <View className="flex-1 items-center justify-center px-8">
            {/* Error Icon */}
            <View className="w-24 h-24 rounded-full bg-rose-500/20 items-center justify-center mb-6">
              <Ionicons name="alert-circle" size={48} color="#F87171" />
            </View>

            {/* Error Title */}
            <Text
              className="text-white text-2xl font-bold text-center mb-2"
              style={{ fontFamily: "Figtree_700Bold" }}
            >
              Something Went Wrong
            </Text>

            {/* Error Description */}
            <Text
              className="text-gray-100 text-center mb-6"
              style={{ fontFamily: "Figtree_400Regular" }}
            >
              The app encountered an unexpected error.{"\n"}
              Please try again.
            </Text>

            {/* Error Details (DEV only) */}
            {__DEV__ && this.state.error && (
              <View className="bg-black-100 rounded-xl p-4 mb-6 w-full border border-black-200">
                <Text
                  className="text-rose-400 text-xs font-mono"
                  style={{ fontFamily: "Figtree_400Regular" }}
                >
                  {this.state.error.message}
                </Text>
              </View>
            )}

            {/* Retry Button */}
            <TouchableOpacity
              onPress={this.handleRetry}
              className="bg-secondary py-4 px-8 rounded-xl"
              activeOpacity={0.8}
            >
              <Text
                className="text-primary font-bold text-lg"
                style={{ fontFamily: "Figtree_700Bold" }}
              >
                Try Again
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}
