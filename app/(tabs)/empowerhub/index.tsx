import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Empowerhub() {
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Empower Hub</Text>
        <Text style={styles.headerSubtitle}>
          Discover opportunities and build teams
        </Text>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Opportunity Feed Card */}
        <Pressable
          style={styles.card}
          onPress={() => router.push("/(tabs)/empowerhub/Opportunityfeed")}
        >
          <View style={styles.iconContainer}>
            <Text style={styles.cardIcon}>🎯</Text>
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Opportunity Feed</Text>
            <Text style={styles.cardDescription}>
              Browse hackathons, scholarships, and exciting opportunities
            </Text>
          </View>
          <Text style={styles.arrow}>→</Text>
        </Pressable>

        {/* Team Finder Card */}
        <Pressable
          style={styles.card}
          onPress={() => router.push("/(tabs)/empowerhub/Teamfinder")}
        >
          <View style={styles.iconContainer}>
            <Text style={styles.cardIcon}>👥</Text>
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Team Finder</Text>
            <Text style={styles.cardDescription}>
              Find teammates and collaborate on amazing projects
            </Text>
          </View>
          <Text style={styles.arrow}>→</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
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
    fontSize: 15,
    color: "#6C757D",
    fontWeight: "400",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#E7F1FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  cardIcon: {
    fontSize: 28,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#212529",
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: "#6C757D",
    lineHeight: 20,
  },
  arrow: {
    fontSize: 24,
    color: "#0D6EFD",
    fontWeight: "300",
  },
  infoSection: {
    marginTop: 24,
    padding: 20,
    backgroundColor: "#E7F1FF",
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#0D6EFD",
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#212529",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#495057",
    lineHeight: 22,
  },
});
