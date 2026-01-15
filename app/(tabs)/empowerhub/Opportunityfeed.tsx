import { db } from "@/firebaseConfig";
import { getAuth } from "@firebase/auth";
import { collection, getDocs, Timestamp } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Linking, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface Opportunity {
  title: string;
  description: string;
  date: Timestamp;
  link: string;
  category: string;
}

type CategoryFilter = "All" | "Hackathon" | "Scholarship";

const IncidentReporting = () => {
  // fetch opportunity feed data from firestore and display it using ScrollView
  const auth = getAuth();
  const userId = auth.currentUser?.uid;
  const [selectedCategory, setSelectedCategory] =
    useState<CategoryFilter>("All");

  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);

  const filteredOpportunities =
    selectedCategory === "All"
      ? opportunities
      : opportunities.filter((op) => op.category === selectedCategory);

  const categories: CategoryFilter[] = ["All", "Hackathon", "Scholarship"];
  useEffect(() => {
    const fetchOpportunities = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "opportunityfeed"));

        const fetched: Opportunity[] = querySnapshot.docs.map((doc) => ({
          ...(doc.data() as Opportunity),
        }));

        setOpportunities(fetched);
      } catch (error) {
        console.error("Firestore error:", error);
      }
    };

    fetchOpportunities();
  }, []);

  const openLink = async (url: string) => {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      console.warn("Cannot open URL:", url);
    }
  };

  return (
    <SafeAreaView>
      <View className="flex-row justify-around my-3">
        {categories.map((cat) => (
          <Pressable
            key={cat}
            onPress={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-full ${
              selectedCategory === cat ? "bg-blue-600" : "bg-gray-200"
            }`}
          >
            <Text
              className={`font-semibold ${
                selectedCategory === cat ? "text-white" : "text-gray-700"
              }`}
            >
              {cat}
            </Text>
          </Pressable>
        ))}
      </View>

      {filteredOpportunities.map((opportunity, index) => (
        <ScrollView
          key={index}
          className="p-4 m-2 border rounded-lg bg-white shadow"
        >
          <Text className="text-xl font-bold">{opportunity.title}</Text>
          <Text className="text-gray-600">
            {opportunity.date.toDate().toDateString()} | {opportunity.category}
          </Text>
          <Text className="mt-2">{opportunity.description}</Text>
          <Text
            className="mt-2 text-blue-600 font-semibold"
            onPress={() => openLink(opportunity.link)}
          >
            View Opportunity →
          </Text>
        </ScrollView>
      ))}
    </SafeAreaView>
  );
};

export default IncidentReporting;
