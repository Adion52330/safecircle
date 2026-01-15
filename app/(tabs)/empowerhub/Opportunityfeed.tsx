import { db } from "@/firebaseConfig";
import { getAuth } from "@firebase/auth";
import { collection, getDocs, Timestamp } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Linking, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const OpportunityFeed = () => {

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

export default OpportunityFeed
