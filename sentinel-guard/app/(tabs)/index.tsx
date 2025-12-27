import { useState, useRef } from "react";
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
import ResultOverlay from "../../components/ResultOverlay";
import {
  getUserBySapId,
  getRecentAccessLog,
  getStudentActivityLogs,
  insertAccessLog,
  DatabaseError,
  AccessLogEntry,
} from "../../src/lib/supabase";
import { verifyQrSignature, parseQrData } from "../../src/utils/security";
import { syncOfflineLogs } from "../../src/lib/offline";

const { width } = Dimensions.get("window");
const FRAME_SIZE = width * 0.65;
const CORNER_SIZE = 40;
const CORNER_WIDTH = 4;

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
  // Duplicate details
  recentLogs?: any[]; // Full history
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

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    // Synchronous check (useRef is immediate, useState is async)
    if (scanLockRef.current || !isScanning) return;
    scanLockRef.current = true;
    setIsScanning(false);

    try {
      // Parse QR
      const payload = parseQrData(data);
      if (!payload) throw new Error("Invalid QR Code");

      // Fetch User
      const user = await getUserBySapId(payload.sap);

      // Validate
      if (!user.is_paid) throw new Error("Payment Pending");
      if (!user.is_active) throw new Error("Pass Deactivated");
      if (!user.activation_token) throw new Error("No Token");

      // Verify Signature
      const isValid = verifyQrSignature(payload, user.activation_token);
      if (!isValid) throw new Error("Invalid Signature");

      // Check Double Entry
      const lastLog = await getRecentAccessLog(user.id);
      let isReturning = false;
      let duplicateError: string | null = null;

      if (mode === "ENTRY") {
        if (lastLog?.type === "ENTRY") {
          duplicateError = "Already Inside";
        }
        if (lastLog?.type === "EXIT") isReturning = true;
      } else {
        if (!lastLog || lastLog.type === "EXIT") {
          duplicateError = "Not Inside"; // Or "Already Outside"
        }
      }

      if (duplicateError) {
        // Show detailed duplicate error (with history)
        // If "Already Inside", show previous ENTRY logs
        // If "Not Inside", show previous EXIT logs
        const filterType = duplicateError === "Already Inside" ? "ENTRY" : "EXIT";
        const recentLogs = await getStudentActivityLogs(user.id, 100, filterType);

        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setScanResult({
          status: "REJECTED",
          reason: duplicateError,
          name: user.full_name,
          profilePhotoUrl: user.profile_photo_url,
          // Pass duplicate details
          recentLogs: recentLogs
        });
        setShowResult(true);
        return;
      }

      // Log
      const logged = await insertAccessLog(user.id, mode, "GRANTED");
      if (!logged) throw new Error("Log Failed");

      // Success
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setScanResult({
        status: "APPROVED",
        isReturning,
        name: user.full_name,
        sapId: user.sap_id,
        semester: user.semester,
        section: user.section,
        profilePhotoUrl: user.profile_photo_url,
      });
      setShowResult(true);
    } catch (error: any) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      let reason = error.message || "Unknown Error";
      if (error instanceof DatabaseError) {
        const map: Record<string, string> = {
          NO_SESSION: "Not Logged In",
          NETWORK: "Network Error",
          PERMISSION: "DB Permission Error",
          NOT_FOUND: "ID Not Found",
        };
        reason = map[error.code] || reason;
      }
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

  // Corner component
  const Corner = ({ position }: { position: "tl" | "tr" | "bl" | "br" }) => {
    const color = mode === "ENTRY" ? "#10B981" : "#6366F1";
    const styles: any = {
      position: "absolute",
      width: CORNER_SIZE,
      height: CORNER_SIZE,
    };
    if (position.includes("t")) styles.top = 0;
    if (position.includes("b")) styles.bottom = 0;
    if (position.includes("l")) styles.left = 0;
    if (position.includes("r")) styles.right = 0;

    return (
      <View style={styles}>
        {/* Horizontal bar */}
        <View
          style={{
            position: "absolute",
            height: CORNER_WIDTH,
            width: CORNER_SIZE,
            backgroundColor: color,
            borderRadius: 2,
            ...(position.includes("t") ? { top: 0 } : { bottom: 0 }),
            ...(position.includes("l") ? { left: 0 } : { right: 0 }),
          }}
        />
        {/* Vertical bar */}
        <View
          style={{
            position: "absolute",
            width: CORNER_WIDTH,
            height: CORNER_SIZE,
            backgroundColor: color,
            borderRadius: 2,
            ...(position.includes("t") ? { top: 0 } : { bottom: 0 }),
            ...(position.includes("l") ? { left: 0 } : { right: 0 }),
          }}
        />
      </View>
    );
  };

  if (!permission) {
    return (
      <View className="flex-1 bg-primary items-center justify-center">
        <Text className="text-white">Loading...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView className="flex-1 bg-primary items-center justify-center px-8">
        <StatusBar style="light" />
        <Ionicons name="camera-outline" size={64} color="#FF9C01" />
        <Text className="text-white text-lg font-bold mt-4 mb-2">
          Camera Access
        </Text>
        <Text className="text-gray-100 text-center mb-6">
          Required to scan QR codes
        </Text>
        <TouchableOpacity
          onPress={requestPermission}
          className="bg-secondary px-6 py-3 rounded-xl"
        >
          <Text className="text-primary font-bold">Grant Access</Text>
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
            className={`w-11 h-11 rounded-full items-center justify-center ${flashEnabled ? "bg-secondary" : "bg-black/50"
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
              className={`px-5 py-2 rounded-lg ${mode === "ENTRY" ? "bg-emerald-600" : ""
                }`}
            >
              <Text
                className={`font-semibold ${mode === "ENTRY" ? "text-white" : "text-gray-100"
                  }`}
              >
                ENTRY
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setMode("EXIT")}
              className={`px-5 py-2 rounded-lg ${mode === "EXIT" ? "bg-indigo-600" : ""
                }`}
            >
              <Text
                className={`font-semibold ${mode === "EXIT" ? "text-white" : "text-gray-100"
                  }`}
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
          <Text className="text-white/60 text-sm mt-4">Point at QR Code</Text>
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
