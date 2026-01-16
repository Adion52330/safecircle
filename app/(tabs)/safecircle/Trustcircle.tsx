import { db } from "@/firebaseConfig";
import { getAuth } from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface TrustcircleProps {
  id: string;
  name: string;
  phoneno: string;
}

const Trustcircle = () => {
  const auth = getAuth();
  const user = auth.currentUser;

  const [trust, setTrust] = useState<TrustcircleProps[]>([]);
  const [visible, setVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(300)).current;

  const [name, setName] = useState("");
  const [phoneno, setPhoneno] = useState("");

  /* ---------------- FETCH TRUST CIRCLE (USER-SPECIFIC) ---------------- */
  useEffect(() => {
    if (!user) return;

    const unsubscribe = onSnapshot(
      collection(db, "users", user.uid, "trustcircle"),
      (snapshot) => {
        const fetched: TrustcircleProps[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<TrustcircleProps, "id">),
        }));
        setTrust(fetched);
      }
    );

    return () => unsubscribe();
  }, [user]);

  /* ---------------- BOTTOM SHEET ---------------- */
  const openSheet = () => {
    setVisible(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeSheet = () => {
    Animated.timing(slideAnim, {
      toValue: 300,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setVisible(false));
  };

  /* ---------------- ADD TRUST MEMBER ---------------- */
  const submitForm = async () => {
    if (!user) {
      Alert.alert("Error", "User not logged in");
      return;
    }

    if (!name || !phoneno) {
      Alert.alert("Error", "All fields are required");
      return;
    }

    try {
      await addDoc(
        collection(db, "users", user.uid, "trustcircle"),
        {
          name,
          phoneno,
          createdAt: Timestamp.now(),
        }
      );

      Alert.alert("Success", "Added to Trust Circle");
      setName("");
      setPhoneno("");
      closeSheet();
    } catch (error) {
      Alert.alert("Error", "Failed to add entry");
      console.error(error);
    }
  };

  /* ---------------- WHATSAPP CHAT ---------------- */
  const openWhatsApp = async (phone: string) => {
    const url = `https://wa.me/${phone}`;
    const supported = await Linking.canOpenURL(url);

    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert("Error", "WhatsApp not supported");
    }
  };

  /* ---------------- DELETE TRUST MEMBER ---------------- */
  const deleteTrustMember = async (docId: string) => {
    if (!user) return;

    Alert.alert(
      "Remove from Trust Circle",
      "Are you sure you want to delete this contact?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(
                doc(db, "users", user.uid, "trustcircle", docId)
              );
            } catch (error) {
              Alert.alert("Error", "Failed to delete contact");
              console.error(error);
            }
          },
        },
      ]
    );
  };

  /* ---------------- UI ---------------- */
  return (
    <SafeAreaView className="flex-1">
      {/* Add Contact Modal */}
      <Modal transparent visible={visible} animationType="none">
        <Pressable className="flex-1 bg-black/40" onPress={closeSheet} />

        <Animated.View
          style={{ transform: [{ translateY: slideAnim }] }}
          className="absolute bottom-0 w-full bg-white rounded-t-3xl p-6"
        >
          <Text className="text-xl font-bold mb-4">
            Add to Trust Circle
          </Text>

          <TextInput
            placeholder="Name"
            value={name}
            onChangeText={setName}
            className="border p-3 rounded-lg mb-3"
          />

          <TextInput
            placeholder="Phone Number"
            value={phoneno}
            onChangeText={setPhoneno}
            keyboardType="phone-pad"
            className="border p-3 rounded-lg mb-4"
          />

          <Pressable
            onPress={submitForm}
            className="bg-blue-600 py-3 rounded-lg"
          >
            <Text className="text-white text-center font-semibold">
              Submit
            </Text>
          </Pressable>
        </Animated.View>
      </Modal>

      {/* Add Button */}
      <Pressable
        onPress={openSheet}
        className="px-5 py-3 rounded-full mt-4 self-start"
      >
        <Text className="font-bold text-lg">+ Add</Text>
      </Pressable>

      {/* Trust Circle List */}
      <ScrollView>
        {trust.map((userItem) => (
          <View
            key={userItem.id}
            className="p-4 m-2 border rounded-lg bg-white shadow"
          >
            <View className="flex-row justify-between items-center">
              <Text className="text-xl font-bold">
                {userItem.name}
              </Text>

              <View className="flex-row gap-2">
                <Pressable
                  onPress={() => deleteTrustMember(userItem.id)}
                  className="bg-red-600 px-3 py-1 rounded-full"
                >
                  <Text className="text-white font-bold">Del</Text>
                </Pressable>

                <Pressable
                  onPress={() => openWhatsApp(userItem.phoneno)}
                  className="bg-green-600 px-3 py-1 rounded-full"
                >
                  <Text className="text-white font-bold">Chat</Text>
                </Pressable>
              </View>
            </View>

            <Text className="text-sm text-gray-900 mt-1">
              {userItem.phoneno}
            </Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

export default Trustcircle;
