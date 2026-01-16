import { db } from "@/firebaseConfig";
import { getAuth } from "@firebase/auth";
import { addDoc, arrayUnion, collection, doc, getDoc, getDocs, orderBy, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
import { useState } from "react";
import { Alert, Linking, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export const CATEGORIES = [
    "Robotics", "Computer Science", "Physics", "Mathematics",
    "BioTech", "Engineering", "Data Science", "Chemistry"
] as const;

export type Category = (typeof CATEGORIES)[number];

interface TeamData {
    name: string;
    categories: Category[];
    description: string;
    memberLimit: number;
    currentMembers: string[];
    createdBy: string;
    status: "open" | "full" | "archived";
}

interface UserProfile {
  name: string,
  phone: string,
  gender: string,
  rollno: string,
  program: string,
}

type TeamWithId = TeamData & { id: string };

const TeamCard = ({ team }: { team: TeamWithId }) => {
    const isFull = team.currentMembers.length >= team.memberLimit;

    const onJoinTeam = async (teamId: string): Promise<void> => {
  try {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser) {
      Alert.alert("Error", "User not logged in");
      return;
    }

    const currentUid = currentUser.uid;

    // 1️⃣ Get team reference
    const teamRef = doc(db, "teams", teamId);
    const teamSnap = await getDoc(teamRef);

    if (!teamSnap.exists()) {
      Alert.alert("Error", "Team not found");
      return;
    }

    const teamData = teamSnap.data() as TeamData;

    await updateDoc(teamRef, {
      currentMembers: arrayUnion(currentUid),
    });

    const creatorUid = teamData.createdBy;
    const creatorRef = doc(db, "users", creatorUid);
    const creatorSnap = await getDoc(creatorRef);

    if (!creatorSnap.exists()) {
      Alert.alert("Error", "Team creator not found");
      return;
    }

    const creatorData = creatorSnap.data() as UserProfile;

    if (!creatorData.phone) {
      Alert.alert("Error", "Creator phone number not available");
      return;
    }

    const message = encodeURIComponent(
      "Hi! I just joined your team and would like to connect 🙂"
    );

    const phone = creatorData.phone.replace(/\D/g, ""); // sanitize
    const whatsappUrl = `https://wa.me/${phone}?text=${message}`;

    const canOpen = await Linking.canOpenURL(whatsappUrl);

    if (!canOpen) {
      Alert.alert("Error", "WhatsApp not installed");
      return;
    }

    await Linking.openURL(whatsappUrl);
  } catch (error) {
    console.error("Join team error:", error);
    Alert.alert("Error", "Something went wrong while joining the team");
  }
};


    return (
        <View className="bg-white p-4 rounded-lg mb-3 border border-gray-200">
            <View className="flex-row justify-between items-center mb-2">
                <Text className="text-lg font-bold text-gray-800">{team.name}</Text>
                <Text className="text-gray-500 text-xs">
                    {team.currentMembers.length}/{team.memberLimit}
                </Text>
            </View>

            <View className="mb-3">
                <Text className="text-gray-600">
                    {team.description || "No description provided."}
                </Text>
            </View>

            <View className="flex-row flex-wrap gap-2 mb-3">
                {team.categories.map((cat) => (
                    <Text key={cat} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                        {cat}
                    </Text>
                ))}
            </View>

            <TouchableOpacity
                disabled={isFull}
                className={`p-2 rounded items-center ${isFull ? "bg-gray-300" : "bg-black"}`}
                onPress={() => isFull ? null : onJoinTeam(team.id)}
            >
                <Text className="text-white font-medium">
                    {isFull ? "Team Full" : "Join"}
                </Text>
            </TouchableOpacity>
        </View>
    );
};

const TeamFinder = () => {
    const auth = getAuth();
    const userId = auth.currentUser?.uid;

    const [form, setForm] = useState<Omit<TeamData, "createdBy" | "currentMembers" | "status">>({
        name: "",
        categories: [],
        description: "",
        memberLimit: 2,
    });
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedFilter, setSelectedFilter] = useState<Category | "All">("All");
    const [teams, setTeams] = useState<TeamWithId[]>([]);

    const toggleCategory = (cat: Category) => {
        setForm((prev) => {
            const exists = prev.categories.includes(cat);
            if (exists) {
                return { ...prev, categories: prev.categories.filter((c) => c !== cat) };
            } else {
                return { ...prev, categories: [...prev.categories, cat] };
            }
        });
    };

    const handleCreate = async () => {
        if (!userId) return Alert.alert("Error", "You must be logged in");
        if (!form.name || form.categories.length === 0) {
            return Alert.alert("Error", "Please fill in the name and pick at least one category");
        }

        try {
            await addDoc(collection(db, "teams"), {
                ...form,
                createdBy: userId,
                currentMembers: [userId],
                status: "open",
                createdAt: serverTimestamp(),
            });
            Alert.alert("Success", "Team created!");
            fetchTeams(); 
        } catch (e) {
            console.error(e);
        }
    };

    const fetchTeams = async () => {
        try {
            const teamsRef = collection(db, "teams");
            let q = query(teamsRef, orderBy("createdAt", "desc"));

            if (selectedFilter !== "All") {
                q = query(teamsRef, where("categories", "array-contains", selectedFilter));
            }

            const querySnapshot = await getDocs(q);
            const results = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...(doc.data() as TeamData),
            }));

            const filteredResults = results.filter(team =>
                team.name.toLowerCase().includes(searchQuery.toLowerCase())
            );

            setTeams(filteredResults);
        } catch (error) {
            console.error("Error fetching teams: ", error);
        }
    };

    fetchTeams();
    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <ScrollView className="px-4 py-4" showsVerticalScrollIndicator={false}>
                
                <View className="mb-6">
                    <Text className="text-2xl font-bold mb-4">Find a Team</Text>
                    <TextInput
                        className="bg-white p-3 rounded-lg border border-gray-300 mb-4"
                        placeholder="Search team names..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                        {["All", ...CATEGORIES].map((cat) => (
                            <TouchableOpacity
                                key={cat}
                                onPress={() => setSelectedFilter(cat as any)}
                                className={`mr-2 px-4 py-2 rounded-full border ${
                                    selectedFilter === cat 
                                    ? "bg-blue-600 border-blue-600" 
                                    : "bg-white border-gray-300"
                                }`}
                            >
                                <Text className={selectedFilter === cat ? "text-white" : "text-gray-700"}>
                                    {cat}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                <View className="mb-8">
                    {teams.map((team) => (
                        <TeamCard key={team.id} team={team} />
                    ))}
                    {teams.length === 0 && (
                        <Text className="text-center text-gray-500 mt-4">No teams found.</Text>
                    )}
                </View>

                <View className="border-t border-gray-300 pt-6 pb-10">
                    <Text className="text-xl font-bold mb-4">Initialize New Team</Text>

                    <Text className="mb-1 text-gray-600">Team Name</Text>
                    <TextInput
                        className="bg-white p-3 rounded border border-gray-300 mb-4"
                        value={form.name}
                        onChangeText={(text) => setForm({ ...form, name: text })}
                        placeholder="Enter the Team Name"
                    />

                    <Text className="mb-1 text-gray-600">Description</Text>
                    <TextInput
                        className="bg-white p-3 rounded border border-gray-300 mb-4 h-24"
                        value={form.description}
                        onChangeText={(text) => setForm({ ...form, description: text })}
                        placeholder="Describe your team"
                        multiline
                    />

                    <Text className="mb-1 text-gray-600">Member Limit: {form.memberLimit}</Text>
                    <TextInput
                        className="bg-white p-3 rounded border border-gray-300 mb-4"
                        keyboardType="numeric"
                        onChangeText={(text) => setForm({ ...form, memberLimit: parseInt(text) || 2 })}
                        placeholder="Max members"
                    />

                    <Text className="mb-2 text-gray-600">Categories (Select Multiple)</Text>
                    <View className="flex-row flex-wrap gap-2 mb-6">
                        {CATEGORIES.map((cat) => {
                            const isSelected = form.categories.includes(cat);
                            return (
                                <TouchableOpacity
                                    key={cat}
                                    onPress={() => toggleCategory(cat)}
                                    className={`px-3 py-2 rounded border ${
                                        isSelected 
                                        ? "bg-green-100 border-green-500" 
                                        : "bg-gray-100 border-gray-300"
                                    }`}
                                >
                                    <Text className={isSelected ? "text-green-800" : "text-gray-600"}>
                                        {cat}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    <TouchableOpacity
                        onPress={handleCreate}
                        className="bg-green-600 p-4 rounded-lg items-center"
                    >
                        <Text className="text-white font-bold text-lg">Create Team</Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

export default TeamFinder;