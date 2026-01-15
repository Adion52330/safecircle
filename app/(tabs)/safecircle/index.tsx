import { db } from "@/firebaseConfig";
import { getAuth } from "@firebase/auth";
import * as Location from "expo-location";
import { router } from "expo-router";
import * as SMS from "expo-sms";
import { collection, doc, DocumentData, getDoc, getDocs, QueryDocumentSnapshot } from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import { Alert, Button, Pressable, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const HOLD_DURATION = 3000; // 3 seconds
const TAP_WINDOW = 600; // ms

interface TrustCircleContact {
  phoneno: string;
}

interface UserProfile {
  name:string;
}

export default function SafeCircle() {
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tapCount = useRef<number>(0);

  const getCurrentUserName = async (): Promise<string | null> => {
  const auth = getAuth();
  const uid = auth.currentUser?.uid;

  if (!uid) return null;

  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) return null;

  const data = userSnap.data() as UserProfile;
  return data.name;
};

const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    const loadName = async () => {
      const userName = await getCurrentUserName();
      setName(userName);
    };

    loadName();
  }, []);

  const triggerSOS = async (): Promise<void> => {
    try {
      // 1️⃣ Location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== Location.PermissionStatus.GRANTED) {
        Alert.alert("Permission required", "Location access is needed");
        return;
      }

      // 2️⃣ Get location
      const location: Location.LocationObject =
        await Location.getCurrentPositionAsync({});

      const { latitude, longitude } = location.coords;
      const locationUrl = `https://maps.google.com/?q=${latitude},${longitude}`;

      // 3️⃣ Fetch phone numbers from Firestore
      const snapshot = await getDocs(collection(db, "trustcircle"));

      const phoneNumbers: string[] = snapshot.docs
        .map(
          (doc: QueryDocumentSnapshot<DocumentData>) =>
            (doc.data() as TrustCircleContact).phoneno
        )
        .filter((phone): phone is string => Boolean(phone));

      if (phoneNumbers.length === 0) {
        Alert.alert("No contacts found in Trust Circle");
        return;
      }

      // 4️⃣ SMS message
      const message: string = `
🚨 EMERGENCY ALERT 🚨
${name} needs help immediately.

📍 Location:
${locationUrl}

Please contact me ASAP.
      `.trim();

      // 5️⃣ Send SMS
      const isAvailable: boolean = await SMS.isAvailableAsync();
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

  const onPressIn = (): void => {
    holdTimer.current = setTimeout(triggerSOS, HOLD_DURATION);
  };

  const onPressOut = (): void => {
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

    tapTimer.current = setTimeout((): void => {
      tapCount.current = 0;
    }, TAP_WINDOW);
  };

  return (
    <SafeAreaView>
      <Pressable
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onPress={onTap}
        className="w-48 h-48 rounded-full bg-red-600 justify-center items-center"
      >
        <Text className="text-white text-xl font-bold text-center">
          HOLD 3s{"\n"}OR TAP 3x{"\n"}SOS
        </Text>
      </Pressable>

      <Button
        title="Go to Trust Circle"
        onPress={() => router.push("/(tabs)/safecircle/Trustcircle")}
      />
      <Button
        title="Go to Incident Reporting"
        onPress={() => router.push("/(tabs)/safecircle/IncidentReporting")}
      />
    </SafeAreaView>
  );
}
