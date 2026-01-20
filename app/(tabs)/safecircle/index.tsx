import { db } from "@/firebaseConfig";
import * as Location from "expo-location";
import { router } from "expo-router";
import * as SMS from "expo-sms";
import { getAuth } from "firebase/auth";
import {
  collection,
  doc,
  DocumentData,
  getDoc,
  getDocs,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const HOLD_DURATION = 3000; // 3 seconds
const TAP_WINDOW = 600; // ms
const { width } = Dimensions.get("window");

interface TrustCircleContact {
  phoneno: string;
}

interface UserProfile {
  name: string;
}

export default function SafeCircle() {
  const auth = getAuth();
  const user = auth.currentUser;

  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tapCount = useRef<number>(0);

  const [name, setName] = useState<string | null>(null);
  const [isPressed, setIsPressed] = useState(false);

  /* ---------------- GET CURRENT USER NAME ---------------- */
  const getCurrentUserName = async (): Promise<string | null> => {
    if (!user) return null;

    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) return null;

    const data = userSnap.data() as UserProfile;
    return data.name;
  };

  useEffect(() => {
    if (!user) return;

    const loadName = async () => {
      const userName = await getCurrentUserName();
      setName(userName);
    };

    loadName();
  }, [user]);

  /* ---------------- TRIGGER SOS ---------------- */
  const triggerSOS = async (): Promise<void> => {
    try {
      if (!user) {
        Alert.alert("Error", "User not logged in");
        return;
      }

      // 1️⃣ Location permission
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== Location.PermissionStatus.GRANTED) {
        Alert.alert("Permission required", "Location access is needed");
        return;
      }

      // 2️⃣ Get current location
      const location = await Location.getCurrentPositionAsync({});

      const { latitude, longitude } = location.coords;
      const locationUrl = `https://maps.google.com/?q=${latitude},${longitude}`;

      // 3️⃣ Fetch TRUST CIRCLE for THIS USER ONLY
      const snapshot = await getDocs(
        collection(db, "users", user.uid, "trustcircle"),
      );

      const phoneNumbers: string[] = snapshot.docs
        .map(
          (doc: QueryDocumentSnapshot<DocumentData>) =>
            (doc.data() as TrustCircleContact).phoneno,
        )
        .filter((phone): phone is string => Boolean(phone));

      if (phoneNumbers.length === 0) {
        Alert.alert("No contacts found", "Your Trust Circle is empty");
        return;
      }

      // 4️⃣ SOS Message
      const message = `
🚨 EMERGENCY ALERT 🚨

${name ?? "Someone"} needs help immediately.

📍 Location:
${locationUrl}

Please contact ASAP.
      `.trim();

      // 5️⃣ Send SMS
      const isAvailable = await SMS.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert("SMS not supported on this device");
        return;
      }

      await SMS.sendSMSAsync(phoneNumbers, message);
    } catch (error) {
      console.error("SOS Error:", error);
      Alert.alert("Error", "Failed to send SOS alert");
    }
  };

  /* ---------------- PRESS LOGIC ---------------- */
  const onPressIn = (): void => {
    setIsPressed(true);
    holdTimer.current = setTimeout(triggerSOS, HOLD_DURATION);
  };

  const onPressOut = (): void => {
    setIsPressed(false);
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
  };

  const onTap = (): void => {
    tapCount.current += 1;

    if (tapCount.current === 3) {
      triggerSOS();
      tapCount.current = 0;
      return;
    }

    if (tapTimer.current) clearTimeout(tapTimer.current);

    tapTimer.current = setTimeout(() => {
      tapCount.current = 0;
    }, TAP_WINDOW);
  };

  /* ---------------- UI ---------------- */
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>SafeCircle</Text>
        <Text style={styles.headerSubtitle}>
          {name ? `Welcome, ${name}` : "Emergency Alert System"}
        </Text>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Emergency Button */}
        <View style={styles.emergencySection}>
          <Text style={styles.instructionText}>In case of emergency</Text>

          <Pressable
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            onPress={onTap}
            style={[styles.sosButton, isPressed && styles.sosButtonPressed]}
          >
            <View style={styles.sosButtonInner}>
              <Text style={styles.sosText}>SOS</Text>
              <View style={styles.divider} />
              <Text style={styles.sosInstructions}>
                Hold 3s or{"\n"}Tap 3 times
              </Text>
            </View>
          </Pressable>

          <Text style={styles.warningText}>
            This will send your location to your trusted contacts
          </Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <Pressable
            style={styles.actionCard}
            onPress={() => router.push("/(tabs)/safecircle/Trustcircle")}
          >
            <View style={styles.iconCircle}>
              <Text style={styles.iconText}>👥</Text>
            </View>
            <Text style={styles.actionTitle}>Trust Circle</Text>
            <Text style={styles.actionDescription}>
              Manage your emergency contacts
            </Text>
          </Pressable>

          <Pressable
            style={styles.actionCard}
            onPress={() => router.push("/(tabs)/safecircle/IncidentReporting")}
          >
            <View style={styles.iconCircle}>
              <Text style={styles.iconText}>📝</Text>
            </View>
            <Text style={styles.actionTitle}>Report Incident</Text>
            <Text style={styles.actionDescription}>
              Document safety concerns
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Footer Info */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Your safety is our priority</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E9ECEF",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#212529",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 15,
    color: "#6C757D",
    fontWeight: "400",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  emergencySection: {
    alignItems: "center",
    marginBottom: 40,
  },
  instructionText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#495057",
    marginBottom: 24,
  },
  sosButton: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#DC3545",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 6,
    borderColor: "#DC3545",
    marginBottom: 20,
  },
  sosButtonPressed: {
    transform: [{ scale: 0.95 }],
    shadowOpacity: 0.3,
  },
  sosButtonInner: {
    alignItems: "center",
  },
  sosText: {
    fontSize: 48,
    fontWeight: "800",
    color: "#DC3545",
    letterSpacing: 2,
  },
  divider: {
    width: 60,
    height: 2,
    backgroundColor: "#DC354520",
    marginVertical: 12,
  },
  sosInstructions: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6C757D",
    textAlign: "center",
    lineHeight: 20,
  },
  warningText: {
    fontSize: 13,
    color: "#6C757D",
    textAlign: "center",
    fontStyle: "italic",
    paddingHorizontal: 20,
  },
  actionsContainer: {
    flexDirection: "row",
    gap: 16,
  },
  actionCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#F1F3F5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  iconText: {
    fontSize: 28,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#212529",
    marginBottom: 6,
    textAlign: "center",
  },
  actionDescription: {
    fontSize: 12,
    color: "#6C757D",
    textAlign: "center",
    lineHeight: 16,
  },
  footer: {
    paddingVertical: 20,
    alignItems: "center",
  },
  footerText: {
    fontSize: 13,
    color: "#ADB5BD",
    fontWeight: "500",
  },
});
