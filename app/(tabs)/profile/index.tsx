import { db } from "@/firebaseConfig";
import { getAuth, signOut } from "@firebase/auth";
import { router } from "expo-router";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { Dropdown } from "react-native-element-dropdown";
import { SafeAreaView } from "react-native-safe-area-context";

const genderData = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
  { label: "Other", value: "other" },
];

const programData = [
  { label: "B.Tech - Aerospace Engineering", value: "BT_AE" },
  { label: "B.Tech - Biological Sciences & Bio-Eng", value: "BT_BSBE" },
  { label: "B.Tech - Chemical Engineering", value: "BT_CHE" },
  { label: "B.Tech - Civil Engineering", value: "BT_CE" },
  { label: "B.Tech - Computer Science & Eng", value: "BT_CSE" },
  { label: "B.Tech - Electrical Engineering", value: "BT_EE" },
  { label: "B.Tech - Materials Science & Eng", value: "BT_MSE" },
  { label: "B.Tech - Mechanical Engineering", value: "BT_ME" },

  { label: "B.S. - Chemistry", value: "BS_CHM" },
  { label: "B.S. - Earth Sciences", value: "BS_ES" },
  { label: "B.S. - Economics", value: "BS_ECO" },
  { label: "B.S. - Mathematics & Scientific Comp", value: "BS_MTH" },
  { label: "B.S. - Physics", value: "BS_PHY" },
  { label: "B.S. - Statistics & Data Science", value: "BS_SDS" },
];

interface UserProfile {
  name: string;
  phone: string;
  gender: string;
  rollno: string;
  program: string;
}

const updateProfile = async (userId: string, userData: UserProfile) => {
  try {
    const userRef = doc(db, "users", userId);
    await setDoc(userRef, userData, { merge: true });
    Alert.alert("Success", "Profile updated successfully!");
  } catch (e) {
    Alert.alert("Error", "Failed to update profile. Please try again.");
    console.log(e);
  }
};

export default function Profile() {
  const auth = getAuth();
  const userId = auth.currentUser?.uid;

  const [form, setForm] = useState<UserProfile>({
    name: "",
    phone: "",
    gender: "",
    rollno: "",
    program: "",
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) {
        setLoading(false);
        router.replace("/Login");
        return;
      }

      try {
        const docRef = doc(db, "users", userId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setForm(docSnap.data() as UserProfile);
        }
      } catch (e) {
        console.log(e);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  const updateField = (key: keyof UserProfile, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut(auth);
            router.replace("/Login");
          } catch (error) {
            Alert.alert("Error", "Failed to log out.");
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#2563eb" />
          <Text className="mt-4 text-gray-600 text-base">
            Loading profile...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50 pb-28">
      {/* Header */}
      <View className="bg-white px-6 py-4 border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-900">My Profile</Text>
        <Text className="text-sm text-gray-500 mt-1">
          Manage your personal information
        </Text>
      </View>

      <View className="flex-1 px-6 py-6">
        <View className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          {/* Full Name */}
          <View className="mb-5">
            <Text className="text-sm font-semibold text-gray-700 mb-2">
              Full Name
            </Text>
            <TextInput
              value={form.name}
              onChangeText={(text) => updateField("name", text)}
              placeholder="Enter your full name"
              placeholderTextColor="#9ca3af"
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-gray-900 text-base"
            />
          </View>

          {/* Roll Number */}
          <View className="mb-5">
            <Text className="text-sm font-semibold text-gray-700 mb-2">
              Roll Number
            </Text>
            <TextInput
              value={form.rollno}
              onChangeText={(text) => updateField("rollno", text)}
              placeholder="Enter your roll number"
              placeholderTextColor="#9ca3af"
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-gray-900 text-base"
            />
          </View>

          {/* Gender */}
          <View className="mb-5">
            <Text className="text-sm font-semibold text-gray-700 mb-2">
              Gender
            </Text>
            <Dropdown
              data={genderData}
              labelField="label"
              valueField="value"
              value={form.gender}
              onChange={(item: any) =>
                setForm((prev) => ({ ...prev, gender: item.value }))
              }
              placeholder="Select gender"
              placeholderStyle={{ color: "#9ca3af", fontSize: 16 }}
              selectedTextStyle={{ color: "#111827", fontSize: 16 }}
              style={{
                backgroundColor: "#f9fafb",
                borderWidth: 1,
                borderColor: "#e5e7eb",
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 14,
              }}
            />
          </View>

          {/* Phone */}
          <View className="mb-5">
            <Text className="text-sm font-semibold text-gray-700 mb-2">
              Phone Number
            </Text>
            <TextInput
              value={form.phone}
              onChangeText={(text) => updateField("phone", text)}
              placeholder="Enter your phone number"
              keyboardType="phone-pad"
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-gray-900 text-base"
            />
          </View>

          {/* Program */}
          <View>
            <Text className="text-sm font-semibold text-gray-700 mb-2">
              Department & Program
            </Text>
            <Dropdown
              data={programData}
              search
              labelField="label"
              valueField="value"
              value={form.program}
              placeholder="Search and select your program"
              searchPlaceholder="Search programs..."
              onChange={(item: any) =>
                setForm((prev) => ({ ...prev, program: item.value }))
              }
              style={{
                backgroundColor: "#f9fafb",
                borderWidth: 1,
                borderColor: "#e5e7eb",
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 14,
              }}
            />
          </View>
        </View>

        {/* Update Button */}
        <TouchableOpacity
          className="bg-blue-600 rounded-xl py-4 shadow-sm mb-4"
          onPress={() => userId && updateProfile(userId, form)}
        >
          <Text className="text-white text-center font-semibold text-base">
            Update Profile
          </Text>
        </TouchableOpacity>

        {/* Logout Button */}
        <TouchableOpacity
          className="bg-red-500 rounded-xl py-4 shadow-sm mb-10"
          onPress={handleLogout}
        >
          <Text className="text-white text-center font-semibold text-base">
            Logout
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
