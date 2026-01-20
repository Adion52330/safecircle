import { db } from "@/firebaseConfig";
import { getAuth } from "@firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
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
    Alert.alert("Success! Profile updated.");
  } catch (e) {
    Alert.alert("Error", "Failed to update profile. Please try again.");
    console.log(e);
  }
};

export default function Profile() {
  const auth = getAuth();
  const userId = auth.currentUser?.uid;

  const [form, setForm] = useState({
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
        return;
      }

      try {
        const docRef = doc(db, "users", userId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data() as UserProfile;
          setForm(data);
        }
      } catch (e) {
        console.log(e);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [userId]);

  const updateField = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <SafeAreaView className="flex justify-center items-center">
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView>
      <Text>Profile Home</Text>

      <ScrollView>
        <Text> Full Name</Text>
        <TextInput
          value={form.name}
          onChangeText={(text) => updateField("name", text)}
          placeholder="Enter your name"
        />

        <Text>Gender</Text>
        <Dropdown
          data={genderData}
          labelField="label"
          valueField="value"
          value={form.gender}
          onChange={(item: any) => {
            setForm((prev) => ({ ...prev, gender: item.value }));
          }}
        />

        <Text>Roll Number</Text>
        <TextInput
          value={form.rollno}
          onChangeText={(text) => updateField("rollno", text)}
          placeholder="Enter your roll number"
        />

        <Text>Phone Number</Text>
        <TextInput
          value={form.phone}
          onChangeText={(text) => updateField("phone", text)}
          placeholder="Enter your phone number"
        />

        <Text>Department & Program</Text>
        <Dropdown
          data={programData}
          search
          maxHeight={300}
          labelField="label"
          valueField="value"
          placeholder="Search program..."
          value={form.program}
          onChange={(item: any) => {
            setForm((prev) => ({ ...prev, program: item.value }));
          }}
        />

        <TouchableOpacity
          className="bg-black rounded w-[30vw]"
          onPress={() => userId && updateProfile(userId, form)}
        >
          <Text className="text-white">Update Profile</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
