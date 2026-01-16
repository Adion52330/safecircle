import { db } from "@/firebaseConfig";
import { addDoc, collection, deleteDoc, doc, onSnapshot, Timestamp } from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput, View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";


interface TrustcircleProps {
    id:string;
  name: string;
  phoneno: number;
  email: string;
}

const Trustcircle = () => {
  const [trust, setTrust] = useState<TrustcircleProps[]>([]);

  useEffect(() => {
  const unsubscribe = onSnapshot(
    collection(db, "trustcircle"),
    (snapshot) => {
      const fetched: TrustcircleProps[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<TrustcircleProps, "id">),
      }));
      setTrust(fetched);
    }
  );

  return () => unsubscribe();
}, []);



  const [visible, setVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(300)).current;

  const [name, setName] = useState("");
  const [phoneno, setPhoneno] = useState("");

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

  const submitForm = async () => {
  if (!name || !phoneno) {
    Alert.alert("Error", "All fields are required");
    return;
  }

  try {
    await addDoc(collection(db, "trustcircle"), {
      name,
      phoneno,
      createdAt: Timestamp.now(),
    });

    Alert.alert("Success", "Added to Trust Circle");

    setName("");
    setPhoneno("");
    closeSheet();
  } catch (error) {
    Alert.alert("Error", "Failed to add entry");
    console.error("Error adding document:", error);
  }
};

const makeCall = async (phone: string) => {
  const url = `https://wa.me/${phone}`;

  const supported = await Linking.canOpenURL(url);
  if (supported) {
    await Linking.openURL(url);
  } else {
    Alert.alert("Error", "Calling not supported on this device");
  }
};

const deleteTrustMember = async (docId: string) => {
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
            await deleteDoc(doc(db, "trustcircle", docId));
          } catch (error) {
            Alert.alert("Error", "Failed to delete contact");
            console.error(error);
          }
        },
      },
    ]
  );
};




  return (
    <SafeAreaView>
      <Modal transparent visible={visible} animationType="none">
        <Pressable className="flex-1 bg-black/40" onPress={closeSheet} />

        <Animated.View
          style={{
            transform: [{ translateY: slideAnim }],
          }}
          className="absolute bottom-0 w-full bg-white rounded-t-3xl p-6"
        >
          <Text className="text-xl font-bold mb-4">Add to Trust Circle</Text>

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
            <Text className="text-white text-center font-semibold">Submit</Text>
          </Pressable>
        </Animated.View>
      </Modal>

      <Pressable
        onPress={openSheet}
        className="px-5 py-3 rounded-full mt-4"
      >
        <Text className="font-bold">+Add</Text>
      </Pressable>
          <ScrollView>
  {trust.map((user) => (
    <View
      key={user.id}
      className="p-4 m-2 border rounded-lg bg-white shadow"
    >
      <View className="flex-row justify-between items-center">
        <Text className="text-xl font-bold">
          {user.name}
        </Text>
        <View className="flex flex-row">
        <Pressable
          onPress={() => deleteTrustMember(user.id)}
          className="bg-red-600 p-2 rounded-full"
        >
          <Text className="text-white font-bold">Del</Text>
        </Pressable>
        <Pressable
          onPress={() => makeCall(user.phoneno.toString())}
          className="bg-green-600 p-2 rounded-full"
        >
          <Text className="text-white font-bold">Chat</Text>
        </Pressable>
        </View>
      </View>

      <Text className="text-sm text-gray-900 mt-1">
        {user.phoneno}
      </Text>
    </View>
  ))}
</ScrollView>

    </SafeAreaView>
  );
};

export default Trustcircle;
