import { db } from "@/firebaseConfig";
import { getAuth } from "@firebase/auth";
import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export const CATEGORIES = [
  "Robotics",
  "Computer Science",
  "Physics",
  "Mathematics",
  "BioTech",
  "Engineering",
  "Data Science",
  "Chemistry",
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
  name: string;
  phone: string;
  gender: string;
  rollno: string;
  program: string;
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
        `Hi! I just joined your team ${team.name} and would like to connect.\n\n_Sent from SafeCircle App_`,
      );

      const phone = creatorData.phone.replace(/\D/g, "");
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
    <View style={styles.teamCard}>
      <View style={styles.teamHeader}>
        <Text style={styles.teamName}>{team.name}</Text>
        <View style={styles.memberBadge}>
          <Text style={styles.memberCount}>
            {team.currentMembers.length}/{team.memberLimit}
          </Text>
        </View>
      </View>

      <Text style={styles.teamDescription}>
        {team.description || "No description provided."}
      </Text>

      <View style={styles.categoryContainer}>
        {team.categories.map((cat) => (
          <View key={cat} style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{cat}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        disabled={isFull}
        style={[styles.joinButton, isFull && styles.joinButtonDisabled]}
        onPress={() => (isFull ? null : onJoinTeam(team.id))}
      >
        <Text style={styles.joinButtonText}>
          {isFull ? "Team Full" : "Join Team"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const TeamFinder = () => {
  const auth = getAuth();
  const userId = auth.currentUser?.uid;

  const [form, setForm] = useState<
    Omit<TeamData, "createdBy" | "currentMembers" | "status">
  >({
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
        return {
          ...prev,
          categories: prev.categories.filter((c) => c !== cat),
        };
      } else {
        return { ...prev, categories: [...prev.categories, cat] };
      }
    });
  };

  const handleCreate = async () => {
    if (!userId) return Alert.alert("Error", "You must be logged in");
    if (!form.name || form.categories.length === 0) {
      return Alert.alert(
        "Error",
        "Please fill in the name and pick at least one category",
      );
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
      setForm({
        name: "",
        categories: [],
        description: "",
        memberLimit: 2,
      });
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
        q = query(
          teamsRef,
          where("categories", "array-contains", selectedFilter),
        );
      }

      const querySnapshot = await getDocs(q);
      const results = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as TeamData),
      }));

      const filteredResults = results.filter((team) =>
        team.name.toLowerCase().includes(searchQuery.toLowerCase()),
      );

      setTeams(filteredResults);
    } catch (error) {
      console.error("Error fetching teams: ", error);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, [searchQuery, selectedFilter]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Team Finder</Text>
        <Text style={styles.headerSubtitle}>
          Collaborate and build amazing projects
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.searchSection}>
          <Text style={styles.sectionTitle}>Find Teams</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search team names..."
            placeholderTextColor="#ADB5BD"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterScroll}
          >
            {["All", ...CATEGORIES].map((cat) => (
              <TouchableOpacity
                key={cat}
                onPress={() => setSelectedFilter(cat as any)}
                style={[
                  styles.filterChip,
                  selectedFilter === cat && styles.filterChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedFilter === cat && styles.filterChipTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.teamsSection}>
          {teams.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyTitle}>No teams found</Text>
              <Text style={styles.emptySubtitle}>
                Try adjusting your search or create a new team
              </Text>
            </View>
          ) : (
            teams.map((team) => <TeamCard key={team.id} team={team} />)
          )}
        </View>

        <View style={styles.createSection}>
          <Text style={styles.createTitle}>Create New Team</Text>
          <Text style={styles.createSubtitle}>
            Start your own team and invite collaborators
          </Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Team Name</Text>
            <TextInput
              style={styles.input}
              value={form.name}
              onChangeText={(text) => setForm({ ...form, name: text })}
              placeholder="Enter team name"
              placeholderTextColor="#ADB5BD"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={form.description}
              onChangeText={(text) => setForm({ ...form, description: text })}
              placeholder="Describe your team's goals and requirements"
              placeholderTextColor="#ADB5BD"
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Member Limit: {form.memberLimit}</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={form.memberLimit.toString()}
              onChangeText={(text) =>
                setForm({ ...form, memberLimit: parseInt(text) || 2 })
              }
              placeholder="Maximum members"
              placeholderTextColor="#ADB5BD"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>
              Categories ({form.categories.length} selected)
            </Text>
            <View style={styles.categoriesGrid}>
              {CATEGORIES.map((cat) => {
                const isSelected = form.categories.includes(cat);
                return (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => toggleCategory(cat)}
                    style={[
                      styles.categoryOption,
                      isSelected && styles.categoryOptionSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryOptionText,
                        isSelected && styles.categoryOptionTextSelected,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <TouchableOpacity onPress={handleCreate} style={styles.createButton}>
            <Text style={styles.createButtonText}>Create Team</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 20,
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
    fontSize: 14,
    color: "#6C757D",
  },
  scrollView: {
    flex: 1,
  },
  searchSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#212529",
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#DEE2E6",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#212529",
    marginBottom: 16,
  },
  filterScroll: {
    marginHorizontal: -4,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#DEE2E6",
    marginHorizontal: 4,
  },
  filterChipActive: {
    backgroundColor: "#0D6EFD",
    borderColor: "#0D6EFD",
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#495057",
  },
  filterChipTextActive: {
    color: "#FFFFFF",
  },
  teamsSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#495057",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#6C757D",
    textAlign: "center",
  },
  teamCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F1F3F5",
  },
  teamHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  teamName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#212529",
    flex: 1,
  },
  memberBadge: {
    backgroundColor: "#E7F1FF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  memberCount: {
    fontSize: 12,
    fontWeight: "600",
    color: "#0D6EFD",
  },
  teamDescription: {
    fontSize: 14,
    color: "#6C757D",
    lineHeight: 20,
    marginBottom: 12,
  },
  categoryContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 16,
  },
  categoryBadge: {
    backgroundColor: "#E7F1FF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#0D6EFD",
  },
  joinButton: {
    backgroundColor: "#212529",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  joinButtonDisabled: {
    backgroundColor: "#DEE2E6",
  },
  joinButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  createSection: {
    backgroundColor: "#FFFFFF",
    marginTop: 8,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#E9ECEF",
  },
  createTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#212529",
    marginBottom: 4,
  },
  createSubtitle: {
    fontSize: 14,
    color: "#6C757D",
    marginBottom: 24,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#495057",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#DEE2E6",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#212529",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryOption: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#F8F9FA",
    borderWidth: 1.5,
    borderColor: "#DEE2E6",
  },
  categoryOptionSelected: {
    backgroundColor: "#D1F4E0",
    borderColor: "#28A745",
  },
  categoryOptionText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#495057",
  },
  categoryOptionTextSelected: {
    color: "#155724",
  },
  createButton: {
    backgroundColor: "#28A745",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
    shadowColor: "#28A745",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  createButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },
});

export default TeamFinder;
