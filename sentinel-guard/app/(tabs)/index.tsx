import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";
import ResultOverlay from "../../components/ResultOverlay";
import { verifyQrHybrid, VerifyResponse } from "../../src/lib/api";
import {
  getUserBySapId,
  getRecentAccessLog,
  getStudentActivityLogs,
  insertAccessLog,
  DatabaseError,
} from "../../src/lib/supabase";
import { verifyQrSignature, parseQrData } from "../../src/utils/security";
import { syncOfflineLogs } from "../../src/lib/offline";

const { width } = Dimensions.get("window");
const FRAME_SIZE = width * 0.75; // Larger scanning area

type ScanMode = "ENTRY" | "EXIT";
type ScanResult = {
  status: "APPROVED" | "REJECTED";
  isReturning?: boolean;
  name?: string;
  sapId?: string;
  semester?: string;
  section?: string;
  profilePhotoUrl?: string | null;
  reason?: string;
  recentLogs?: any[]; // Full history
  verifiedOffline?: boolean;
};

export default function ScannerScreen() {
  // Sync offline logs on mount
  useState(() => {
    syncOfflineLogs();
  });
  const [permission, requestPermission] = useCameraPermissions();
  const [mode, setMode] = useState<ScanMode>("ENTRY");
  const [isScanning, setIsScanning] = useState(true);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);

  // Ref for synchronous scan lock (prevents race conditions)
  const scanLockRef = useRef(false);

  // Offline verification logic (fallback)
  const offlineVerify = async (
    qrData: string
  ): Promise<VerifyResponse | null> => {
    try {
      const payload = parseQrData(qrData);
      if (!payload) return null;

      const user = await getUserBySapId(payload.sap);

      // Map database errors/status to VerifyResponse
      if (!user) {
        return { success: false, status: "REJECTED", reason: "ID Not Found" };
      }
      if (!user.is_paid) {
        return {
          success: false,
          status: "REJECTED",
          reason: "Payment Pending",
          student: {
            id: user.id,
            sapId: user.sap_id,
            fullName: user.full_name,
            section: user.section,
            semester: user.semester,
            profilePhotoUrl: user.profile_photo_url,
          },
        };
      }
      if (!user.is_active) {
        return {
          success: false,
          status: "REJECTED",
          reason: "Pass Deactivated",
        };
      }

      // HMAC Verification (Offline)
      if (
        !user.activation_token ||
        !verifyQrSignature(payload, user.activation_token)
      ) {
        return {
          success: false,
          status: "REJECTED",
          reason: "Invalid Signature",
        };
      }

      // Duplicate Check (Offline)
      const lastLog = await getRecentAccessLog(user.id);
      if (mode === "ENTRY" && lastLog?.type === "ENTRY") {
        return {
          success: false,
          status: "DUPLICATE",
          reason: "Already Inside",
          student: {
            id: user.id,
            sapId: user.sap_id,
            fullName: user.full_name,
            section: user.section,
            semester: user.semester,
            profilePhotoUrl: user.profile_photo_url,
          },
        };
      }
      if (mode === "EXIT" && (!lastLog || lastLog.type === "EXIT")) {
        return {
          success: false,
          status: "DUPLICATE",
          reason: "Not Inside",
          student: {
            id: user.id,
            sapId: user.sap_id,
            fullName: user.full_name,
            section: user.section,
            semester: user.semester,
            profilePhotoUrl: user.profile_photo_url,
          },
        };
      }

      // Log locally
      await insertAccessLog(user.id, mode, "GRANTED");

      return {
        success: true,
        status: "GRANTED",
        isReturning: lastLog?.type === "EXIT",
        student: {
          id: user.id,
          sapId: user.sap_id,
          fullName: user.full_name,
          section: user.section,
          semester: user.semester,
          profilePhotoUrl: user.profile_photo_url,
        },
      };
    } catch (e) {
      console.error("[Offline] Verification failed:", e);
      return null;
    }
  };

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanLockRef.current || !isScanning) return;
    scanLockRef.current = true;
    setIsScanning(false);

    // INSTANT FEEDBACK: Haptics
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // HYBRID VERIFICATION: Try online, fallback to offline
      const result = await verifyQrHybrid(data, mode, offlineVerify);

      if (!result.success) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

        // Handle duplicates with history - filter by type
        let recentLogs = undefined;
        if (result.status === "DUPLICATE" && result.student?.id) {
          // Already Inside = show all ENTRY logs, Already Outside = show all EXIT logs
          const filterType =
            result.reason === "Already Inside" ? "ENTRY" : "EXIT";
          recentLogs = await getStudentActivityLogs(
            result.student.id,
            10,
            filterType
          );
        }

        setScanResult({
          status: "REJECTED",
          reason: result.reason || "Access Denied",
          name: result.student?.fullName || undefined,
          profilePhotoUrl: result.student?.profilePhotoUrl,
          recentLogs,
          verifiedOffline: result.verifiedOffline,
        });
        setShowResult(true);
        return;
      }

      // Success
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setScanResult({
        status: "APPROVED",
        isReturning: result.isReturning,
        name: result.student?.fullName || undefined,
        sapId: result.student?.sapId,
        semester: result.student?.semester,
        section: result.student?.section,
        profilePhotoUrl: result.student?.profilePhotoUrl,
        verifiedOffline: result.verifiedOffline,
      });
      setShowResult(true);
    } catch (error: any) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      let reason = error.message || "Unknown Error";
      setScanResult({ status: "REJECTED", reason });
      setShowResult(true);
    }
  };

  const handleDismiss = () => {
    setShowResult(false);
    setScanResult(null);
    setTimeout(() => {
      scanLockRef.current = false; // Reset lock for next scan
      setIsScanning(true);
    }, 200);
  };

  // Corner component with rounded edges and heartbeat animation - Expo style
  const Corner = ({ position }: { position: "tl" | "tr" | "bl" | "br" }) => {
    const color = mode === "ENTRY" ? "#FFFFFF" : "#DC2626"; // White for ENTRY, Red for EXIT

    // Heartbeat animation
    const scale = useSharedValue(1);

    useEffect(() => {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 300, easing: Easing.ease }),
          withTiming(1, { duration: 300, easing: Easing.ease }),
          withTiming(1.08, { duration: 300, easing: Easing.ease }),
          withTiming(1, { duration: 500, easing: Easing.ease })
        ),
        -1, // infinite
        false
      );
    }, []);

    const animatedStyle = useAnimatedStyle(() => {
      return {
        transform: [{ scale: scale.value }],
      };
    });

    // Dynamic styles for the corner
    const getCornerStyle = () => {
      const baseStyle: any = {
        position: "absolute",
        width: 60, // Wider to match image
        height: 60,
        borderColor: color,
        borderWidth: 8, // Thicker stroke
        borderRadius: 30, // Very rounded
      };

      // Hide borders that shouldn't be visible for this corner to create the L-shape
      if (position === "tl") {
        return {
          ...baseStyle,
          top: 0,
          left: 0,
          borderRightWidth: 0,
          borderBottomWidth: 0,
          borderTopRightRadius: 0,
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
        };
      }
      if (position === "tr") {
        return {
          ...baseStyle,
          top: 0,
          right: 0,
          borderLeftWidth: 0,
          borderBottomWidth: 0,
          borderTopLeftRadius: 0,
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
        };
      }
      if (position === "bl") {
        return {
          ...baseStyle,
          bottom: 0,
          left: 0,
          borderRightWidth: 0,
          borderTopWidth: 0,
          borderTopRightRadius: 0,
          borderTopLeftRadius: 0,
          borderBottomRightRadius: 0,
        };
      }
      if (position === "br") {
        return {
          ...baseStyle,
          bottom: 0,
          right: 0,
          borderLeftWidth: 0,
          borderTopWidth: 0,
          borderTopRightRadius: 0,
          borderTopLeftRadius: 0,
          borderBottomLeftRadius: 0,
        };
      }
      return baseStyle;
    };

    return <Animated.View style={[getCornerStyle(), animatedStyle]} />;
  };

  if (!permission) {
    return (
      <View className="flex-1 bg-primary items-center justify-center">
        <Text
          className="text-white"
          style={{ fontFamily: "Figtree_400Regular" }}
        >
          Loading...
        </Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView className="flex-1 bg-primary items-center justify-center px-8">
        <StatusBar style="light" />
        <Ionicons name="camera-outline" size={64} color="#FF9C01" />
        <Text
          className="text-white text-lg font-bold mt-4 mb-2"
          style={{ fontFamily: "Figtree_700Bold" }}
        >
          Camera Access
        </Text>
        <Text
          className="text-gray-100 text-center mb-6"
          style={{ fontFamily: "Figtree_400Regular" }}
        >
          Required to scan QR codes
        </Text>
        <TouchableOpacity
          onPress={requestPermission}
          className="bg-secondary px-6 py-3 rounded-xl"
        >
          <Text
            className="text-primary font-bold"
            style={{ fontFamily: "Figtree_700Bold" }}
          >
            Grant Access
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <StatusBar style="light" />

      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        enableTorch={flashEnabled}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={isScanning ? handleBarCodeScanned : undefined}
      />

      <SafeAreaView style={StyleSheet.absoluteFill} pointerEvents="box-none">
        {/* Top Controls */}
        <View className="flex-row items-center justify-between px-4 pt-2">
          {/* Flash */}
          <TouchableOpacity
            onPress={() => setFlashEnabled(!flashEnabled)}
            className={`w-11 h-11 rounded-full items-center justify-center ${
              flashEnabled ? "bg-secondary" : "bg-black/50"
            }`}
          >
            <Ionicons
              name={flashEnabled ? "flash" : "flash-outline"}
              size={22}
              color={flashEnabled ? "#161622" : "#fff"}
            />
          </TouchableOpacity>

          {/* Mode Toggle */}
          <View className="flex-row bg-black/50 rounded-xl p-1">
            <TouchableOpacity
              onPress={() => setMode("ENTRY")}
              className={`px-5 py-2 rounded-lg ${
                mode === "ENTRY" ? "bg-emerald-600" : ""
              }`}
            >
              <Text
                className={`font-semibold ${
                  mode === "ENTRY" ? "text-white" : "text-gray-100"
                }`}
                style={{ fontFamily: "Figtree_600SemiBold" }}
              >
                ENTRY
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setMode("EXIT")}
              className={`px-5 py-2 rounded-lg ${
                mode === "EXIT" ? "bg-rose-600" : ""
              }`}
            >
              <Text
                className={`font-semibold ${
                  mode === "EXIT" ? "text-white" : "text-gray-100"
                }`}
                style={{ fontFamily: "Figtree_600SemiBold" }}
              >
                EXIT
              </Text>
            </TouchableOpacity>
          </View>

          {/* Placeholder for balance */}
          <View className="w-11" />
        </View>

        {/* Center Frame - Corner Borders Only */}
        <View
          className="flex-1 items-center justify-center"
          pointerEvents="none"
        >
          <View style={{ width: FRAME_SIZE, height: FRAME_SIZE }}>
            <Corner position="tl" />
            <Corner position="tr" />
            <Corner position="bl" />
            <Corner position="br" />
          </View>
          <Text
            className="text-white/60 text-sm mt-4"
            style={{ fontFamily: "Figtree_400Regular" }}
          >
            Point at QR Code
          </Text>
        </View>
      </SafeAreaView>

      {/* Result */}
      {showResult && scanResult && (
        <ResultOverlay
          status={scanResult.status}
          scanType={mode}
          isReturning={scanResult.isReturning}
          name={scanResult.name}
          sapId={scanResult.sapId}
          semester={scanResult.semester}
          section={scanResult.section}
          profilePhotoUrl={scanResult.profilePhotoUrl}
          reason={scanResult.reason}
          recentLogs={scanResult.recentLogs}
          onDismiss={handleDismiss}
        />
      )}
    </View>
  );
}
