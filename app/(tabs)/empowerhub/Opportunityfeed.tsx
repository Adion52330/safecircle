import { db } from "@/firebaseConfig";
import { getAuth } from "@firebase/auth";
import { collection, getDocs, Timestamp } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface Opportunity {
  title: string;
  description: string;
  date: Timestamp;
  link: string;
  category: string;
}

type CategoryFilter = "All" | "Hackathon" | "Scholarship";

const OpportunityFeed = () => {
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

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Hackathon":
        return { bg: "#E7F1FF", text: "#0D6EFD", border: "#0D6EFD" };
      case "Scholarship":
        return { bg: "#FFF3CD", text: "#856404", border: "#FFC107" };
      default:
        return { bg: "#F8F9FA", text: "#495057", border: "#DEE2E6" };
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Opportunity Feed</Text>
        <Text style={styles.headerSubtitle}>
          {filteredOpportunities.length}{" "}
          {filteredOpportunities.length === 1 ? "opportunity" : "opportunities"}{" "}
          available
        </Text>
      </View>

      {/* Category Filters */}
      <View style={styles.filterContainer}>
        {categories.map((cat) => (
          <Pressable
            key={cat}
            onPress={() => setSelectedCategory(cat)}
            style={[
              styles.filterButton,
              selectedCategory === cat && styles.filterButtonActive,
            ]}
          >
            <Text
              style={[
                styles.filterButtonText,
                selectedCategory === cat && styles.filterButtonTextActive,
              ]}
            >
              {cat}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Opportunities List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredOpportunities.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyTitle}>No opportunities found</Text>
            <Text style={styles.emptySubtitle}>
              Check back later for new opportunities
            </Text>
          </View>
        ) : (
          filteredOpportunities.map((opportunity, index) => {
            const categoryColors = getCategoryColor(opportunity.category);
            return (
              <View key={index} style={styles.opportunityCard}>
                <View style={styles.cardHeader}>
                  <View
                    style={[
                      styles.categoryBadge,
                      { backgroundColor: categoryColors.bg },
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryBadgeText,
                        { color: categoryColors.text },
                      ]}
                    >
                      {opportunity.category}
                    </Text>
                  </View>
                  <Text style={styles.dateText}>
                    {opportunity.date.toDate().toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </Text>
                </View>

                <Text style={styles.opportunityTitle}>{opportunity.title}</Text>
                <Text style={styles.opportunityDescription}>
                  {opportunity.description}
                </Text>

                <Pressable
                  onPress={() => openLink(opportunity.link)}
                  style={styles.viewButton}
                >
                  <Text style={styles.viewButtonText}>View Details</Text>
                  <Text style={styles.viewButtonArrow}>→</Text>
                </Pressable>
              </View>
            );
          })
        )}
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
    fontWeight: "500",
  },
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E9ECEF",
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#F8F9FA",
    borderWidth: 1.5,
    borderColor: "#DEE2E6",
  },
  filterButtonActive: {
    backgroundColor: "#0D6EFD",
    borderColor: "#0D6EFD",
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#495057",
  },
  filterButtonTextActive: {
    color: "#FFFFFF",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#495057",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: "#6C757D",
    textAlign: "center",
  },
  opportunityCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F1F3F5",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  dateText: {
    fontSize: 13,
    color: "#6C757D",
    fontWeight: "500",
  },
  opportunityTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#212529",
    marginBottom: 10,
    lineHeight: 26,
  },
  opportunityDescription: {
    fontSize: 15,
    color: "#495057",
    lineHeight: 22,
    marginBottom: 16,
  },
  viewButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#212529",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    gap: 8,
  },
  viewButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  viewButtonArrow: {
    fontSize: 18,
    color: "#FFFFFF",
    fontWeight: "300",
  },
});

export default OpportunityFeed;
