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
  StyleSheet,
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
  const slideAnim = useRef(new Animated.Value(600)).current;

  const [name, setName] = useState("");
  const [phoneno, setPhoneno] = useState("");

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
      },
    );

    return () => unsubscribe();
  }, [user]);

  const openSheet = () => {
    setVisible(true);
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  };

  const closeSheet = () => {
    Animated.timing(slideAnim, {
      toValue: 600,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setVisible(false);
      setName("");
      setPhoneno("");
    });
  };

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
      await addDoc(collection(db, "users", user.uid, "trustcircle"), {
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
      console.error(error);
    }
  };

  const openWhatsApp = async (phone: string) => {
    const url = `https://wa.me/${phone}`;
    const supported = await Linking.canOpenURL(url);

    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert("Error", "WhatsApp not supported");
    }
  };

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
              await deleteDoc(doc(db, "users", user.uid, "trustcircle", docId));
            } catch (error) {
              Alert.alert("Error", "Failed to delete contact");
              console.error(error);
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Trust Circle</Text>
          <Text style={styles.headerSubtitle}>
            {trust.length} {trust.length === 1 ? "contact" : "contacts"}
          </Text>
        </View>

        <Pressable onPress={openSheet} style={styles.addButton}>
          <Text style={styles.addButtonText}>+ Add Contact</Text>
        </Pressable>
      </View>

      <Modal transparent visible={visible} animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={closeSheet} />

        <Animated.View
          style={[
            styles.bottomSheet,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={styles.sheetHandle} />

          <Text style={styles.sheetTitle}>Add to Trust Circle</Text>
          <Text style={styles.sheetSubtitle}>
            This contact will receive emergency alerts
          </Text>

          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                placeholder="Enter contact name"
                placeholderTextColor="#ADB5BD"
                value={name}
                onChangeText={setName}
                style={styles.input}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <TextInput
                placeholder="Enter phone number with country code"
                placeholderTextColor="#ADB5BD"
                value={phoneno}
                onChangeText={setPhoneno}
                keyboardType="phone-pad"
                style={styles.input}
              />
            </View>

            <View style={styles.buttonGroup}>
              <Pressable onPress={closeSheet} style={styles.cancelButton}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>

              <Pressable onPress={submitForm} style={styles.submitButton}>
                <Text style={styles.submitButtonText}>Add Contact</Text>
              </Pressable>
            </View>
          </View>
        </Animated.View>
      </Modal>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {trust.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyTitle}>No contacts yet</Text>
            <Text style={styles.emptySubtitle}>
              Add trusted contacts who will receive your emergency alerts
            </Text>
          </View>
        ) : (
          trust.map((userItem, index) => (
            <View
              key={userItem.id}
              style={[
                styles.contactCard,
                index === trust.length - 1 && styles.lastCard,
              ]}
            >
              <View style={styles.contactInfo}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>
                    {userItem.name.charAt(0).toUpperCase()}
                  </Text>
                </View>

                <View style={styles.contactDetails}>
                  <Text style={styles.contactName}>{userItem.name}</Text>
                  <Text style={styles.contactPhone}>{userItem.phoneno}</Text>
                </View>
              </View>

              <View style={styles.actionButtons}>
                <Pressable
                  onPress={() => openWhatsApp(userItem.phoneno)}
                  style={styles.chatButton}
                >
                  <Text style={styles.chatButtonText}>💬 Chat</Text>
                </Pressable>

                <Pressable
                  onPress={() => deleteTrustMember(userItem.id)}
                  style={styles.deleteButton}
                >
                  <Text style={styles.deleteButtonText}>🗑️</Text>
                </Pressable>
              </View>
            </View>
          ))
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  addButton: {
    backgroundColor: "#0D6EFD",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: "#0D6EFD",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  bottomSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#DEE2E6",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#212529",
    marginBottom: 6,
  },
  sheetSubtitle: {
    fontSize: 14,
    color: "#6C757D",
    marginBottom: 24,
  },
  formContainer: {
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#495057",
    marginBottom: 4,
  },
  input: {
    borderWidth: 1.5,
    borderColor: "#DEE2E6",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#212529",
    backgroundColor: "#FFFFFF",
  },
  buttonGroup: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#F8F9FA",
    borderWidth: 1.5,
    borderColor: "#DEE2E6",
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#495057",
  },
  submitButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#0D6EFD",
    alignItems: "center",
    shadowColor: "#0D6EFD",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600",
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
    paddingHorizontal: 40,
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
    lineHeight: 22,
  },
  contactCard: {
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
  lastCard: {
    marginBottom: 0,
  },
  contactInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#E7F1FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0D6EFD",
  },
  contactDetails: {
    flex: 1,
  },
  contactName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#212529",
    marginBottom: 4,
  },
  contactPhone: {
    fontSize: 14,
    color: "#6C757D",
    fontWeight: "500",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
  },
  chatButton: {
    flex: 1,
    backgroundColor: "#D1F4E0",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#28A745",
  },
  chatButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#155724",
  },
  deleteButton: {
    backgroundColor: "#FFE5E5",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#DC3545",
  },
  deleteButtonText: {
    fontSize: 18,
  },
});

export default Trustcircle;
