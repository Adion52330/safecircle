import { db } from "@/firebaseConfig";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import {
  addDoc,
  collection,
  FieldValue,
  serverTimestamp,
} from "firebase/firestore";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, {
  MapPressEvent,
  Marker,
  PROVIDER_GOOGLE,
  Region,
} from "react-native-maps";

interface Coordinates {
  lat: string;
  lng: string;
}

interface SelectedLatLng {
  latitude: number;
  longitude: number;
}

interface MediaItem {
  id: string | FieldValue;
  name: string;
  url: string;
}

interface UserLocation {
  lat: string;
  lng: string;
  name: string;
}

interface IncidentData {
  title: string;
  locationType: string;
  locationName: string;
  coordinates: Coordinates;
  media: MediaItem[];
  anonymous: boolean;
  timestamp: FieldValue;
}

const IncidentLog: React.FC = () => {
  const [title, setTitle] = useState<string>("");
  const [locationType, setLocationType] = useState<"user" | "map">("user");
  const [locationName, setLocationName] = useState<string>("");
  const [coordinates, setCoordinates] = useState<Coordinates>({
    lat: "",
    lng: "",
  });
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [anonymous, setAnonymous] = useState<boolean>(false);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [showMapModal, setShowMapModal] = useState<boolean>(false);
  const [selectedLocation, setSelectedLocation] =
    useState<SelectedLatLng | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const mapRef = useRef<MapView>(null);

  // IIT Kanpur campus bounds
  const IIT_KANPUR_BOUNDS = {
    center: {
      latitude: 26.5123,
      longitude: 80.2329,
    },
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  };

  const MIN_ZOOM = {
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  };

  const [mapRegion, setMapRegion] = useState<Region>({
    ...IIT_KANPUR_BOUNDS.center,
    ...IIT_KANPUR_BOUNDS,
  });

  useEffect(() => {
    getUserLocation();
  }, []);

  const getUserLocation = async () => {
    try {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Location permission is required. Using default location.",
        );
        const defaultLocation: UserLocation = {
          lat: IIT_KANPUR_BOUNDS.center.latitude.toFixed(6),
          lng: IIT_KANPUR_BOUNDS.center.longitude.toFixed(6),
          name: "IIT Kanpur Campus",
        };
        setUserLocation(defaultLocation);
        setCoordinates({ lat: defaultLocation.lat, lng: defaultLocation.lng });
        setLocationName(defaultLocation.name);
        setSelectedLocation({
          latitude: parseFloat(defaultLocation.lat),
          longitude: parseFloat(defaultLocation.lng),
        });
        setLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const userLoc: UserLocation = {
        lat: location.coords.latitude.toFixed(6),
        lng: location.coords.longitude.toFixed(6),
        name: "Current Location",
      };

      setUserLocation(userLoc);
      setCoordinates({ lat: userLoc.lat, lng: userLoc.lng });
      setLocationName(userLoc.name);
      setSelectedLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      setLoading(false);
    } catch (error) {
      console.error("Error getting location:", error);
      setLoading(false);
    }
  };

  const handleLocationTypeChange = async (type: "user" | "map") => {
    setLocationType(type);
    if (type === "user") {
      if (userLocation) {
        setCoordinates({ lat: userLocation.lat, lng: userLocation.lng });
        setLocationName(userLocation.name);
        setSelectedLocation({
          latitude: parseFloat(userLocation.lat),
          longitude: parseFloat(userLocation.lng),
        });
      } else {
        await getUserLocation();
      }
    }
  };

  const handleOpenMap = () => {
    setShowMapModal(true);
    if (selectedLocation) {
      setMapRegion({
        ...selectedLocation,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      });
    } else if (userLocation) {
      setMapRegion({
        latitude: parseFloat(userLocation.lat),
        longitude: parseFloat(userLocation.lng),
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      });
    }
  };

  const handleMapPress = (event: MapPressEvent) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setSelectedLocation({ latitude, longitude });
  };

  const handleRegionChange = (region: Region) => {
    if (
      region.latitudeDelta > MIN_ZOOM.latitudeDelta ||
      region.longitudeDelta > MIN_ZOOM.longitudeDelta
    ) {
      return;
    }
    setMapRegion(region);
  };

  const handleConfirmLocation = () => {
    if (selectedLocation) {
      setCoordinates({
        lat: selectedLocation.latitude.toFixed(6),
        lng: selectedLocation.longitude.toFixed(6),
      });
      setLocationName("Selected from Map");
      setShowMapModal(false);
      Alert.alert("Success", "Location selected successfully");
    } else {
      Alert.alert("Error", "Please select a location on the map");
    }
  };

  const centerMapOnUser = async () => {
    if (userLocation && mapRef.current) {
      const region = {
        latitude: parseFloat(userLocation.lat),
        longitude: parseFloat(userLocation.lng),
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      };
      mapRef.current.animateToRegion(region, 1000);
      setSelectedLocation({
        latitude: region.latitude,
        longitude: region.longitude,
      });
    }
  };

  const handleMediaUpload = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert(
        "Permission required",
        "Permission to access the media library is required.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      const file = result.assets[0];
      const fileName = file.uri.split("/").pop() || "upload.jpg";

      try {
        const storage = getStorage();
        const storageRef = ref(storage, `incidents/${Date.now()}_${fileName}`);

        const response = await fetch(file.uri);
        const blob = await response.blob();

        const snapshot = await uploadBytes(storageRef, blob);
        const downloadURL = await getDownloadURL(snapshot.ref);

        const newMedia: MediaItem = {
          id: serverTimestamp(),
          name: fileName,
          url: downloadURL,
        };
        setMedia([...media, newMedia]);
      } catch (error) {
        console.error("Upload failed:", error);
        Alert.alert("Upload Error", "Could not upload media.");
      }
    }
  };

  const removeMedia = (id: string | FieldValue) => {
    setMedia(media.filter((item) => item.id !== id));
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      Alert.alert("Error", "Please enter an incident title");
      return;
    }
    if (!coordinates.lat || !coordinates.lng) {
      Alert.alert("Error", "Please select a location");
      return;
    }

    const incidentData: IncidentData = {
      title,
      locationType,
      locationName,
      coordinates,
      media,
      anonymous,
      timestamp: serverTimestamp(),
    };

    Alert.alert("Success", "Incident logged successfully!", [
      {
        text: "OK",
        onPress: async () => {
          await addDoc(collection(db, "incidents"), incidentData);
          setTitle("");
          setLocationName("");
          setMedia([]);
          setAnonymous(false);
          setLocationType("user");
          if (userLocation) {
            setCoordinates({ lat: userLocation.lat, lng: userLocation.lng });
            setLocationName(userLocation.name);
            setSelectedLocation({
              latitude: parseFloat(userLocation.lat),
              longitude: parseFloat(userLocation.lng),
            });
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Getting your location...</Text>
          <Text style={styles.loadingSubtext}>
            This will only take a moment
          </Text>
        </View>
      </View>
    );
  }

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerIcon}>🚨</Text>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Report Incident</Text>
              <Text style={styles.headerSubtitle}>Help keep campus safe</Text>
            </View>
          </View>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.section}>
            <View style={styles.labelContainer}>
              <Text style={styles.label}>Incident Title</Text>
              <View style={styles.requiredBadge}>
                <Text style={styles.requiredText}>Required</Text>
              </View>
            </View>
            <TextInput
              style={styles.input}
              placeholder="What happened? (e.g., Suspicious activity)"
              value={title}
              onChangeText={setTitle}
              placeholderTextColor="#94a3b8"
            />
          </View>

          <View style={styles.section}>
            <View style={styles.labelContainer}>
              <Text style={styles.label}>Location Type</Text>
              <View style={styles.requiredBadge}>
                <Text style={styles.requiredText}>Required</Text>
              </View>
            </View>
            <View style={styles.dropdownContainer}>
              <TouchableOpacity
                style={[
                  styles.dropdownOption,
                  locationType === "user" && styles.dropdownOptionActive,
                ]}
                onPress={() => handleLocationTypeChange("user")}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.iconCircle,
                    locationType === "user" && styles.iconCircleActive,
                  ]}
                >
                  <Text style={styles.iconText}>📍</Text>
                </View>
                <View style={styles.optionTextContainer}>
                  <Text
                    style={[
                      styles.dropdownText,
                      locationType === "user" && styles.dropdownTextActive,
                    ]}
                  >
                    Current Location
                  </Text>
                  <Text style={styles.dropdownSubtext}>
                    Use my GPS location
                  </Text>
                </View>
                {locationType === "user" && (
                  <View style={styles.checkCircle}>
                    <Text style={styles.checkMark}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.dropdownOption,
                  locationType === "map" && styles.dropdownOptionActive,
                ]}
                onPress={() => handleLocationTypeChange("map")}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.iconCircle,
                    locationType === "map" && styles.iconCircleActive,
                  ]}
                >
                  <Text style={styles.iconText}>🗺️</Text>
                </View>
                <View style={styles.optionTextContainer}>
                  <Text
                    style={[
                      styles.dropdownText,
                      locationType === "map" && styles.dropdownTextActive,
                    ]}
                  >
                    Choose from Map
                  </Text>
                  <Text style={styles.dropdownSubtext}>Pin exact location</Text>
                </View>
                {locationType === "map" && (
                  <View style={styles.checkCircle}>
                    <Text style={styles.checkMark}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {locationType === "map" && (
            <View style={styles.section}>
              <TouchableOpacity
                style={styles.mapButton}
                onPress={handleOpenMap}
                activeOpacity={0.8}
              >
                <View style={styles.mapButtonIcon}>
                  <Text style={styles.mapButtonIconText}>🗺️</Text>
                </View>
                <Text style={styles.mapButtonText}>
                  {coordinates.lat
                    ? "Change Location on Map"
                    : "Select Location on Map"}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.label}>Location Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Main Library, Hall 3 Entrance"
              value={locationName}
              onChangeText={setLocationName}
              placeholderTextColor="#94a3b8"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Coordinates</Text>
            <View style={styles.coordinatesContainer}>
              <View style={styles.coordinateBox}>
                <Text style={styles.coordinateLabel}>📍 Latitude</Text>
                <Text style={styles.coordinateValue}>
                  {coordinates.lat || "N/A"}
                </Text>
              </View>
              <View style={styles.coordinateBox}>
                <Text style={styles.coordinateLabel}>📍 Longitude</Text>
                <Text style={styles.coordinateValue}>
                  {coordinates.lng || "N/A"}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Evidence (Optional)</Text>
            <Text style={styles.sectionDescription}>
              Add photos or videos to support your report
            </Text>
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={handleMediaUpload}
              activeOpacity={0.7}
            >
              <View style={styles.uploadContent}>
                <Text style={styles.uploadIcon}>📷</Text>
                <View style={styles.uploadTextContainer}>
                  <Text style={styles.uploadText}>Upload Photo/Video</Text>
                  <Text style={styles.uploadSubtext}>Max 10MB per file</Text>
                </View>
              </View>
            </TouchableOpacity>

            {media.length > 0 && (
              <View style={styles.mediaList}>
                <Text style={styles.mediaListTitle}>
                  Uploaded Files ({media.length})
                </Text>
                {media.map((item, index) => (
                  <View key={index} style={styles.mediaItem}>
                    <View style={styles.mediaIconContainer}>
                      <Text style={styles.mediaIcon}>📎</Text>
                    </View>
                    <Text style={styles.mediaName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <TouchableOpacity
                      onPress={() => removeMedia(item.id)}
                      style={styles.removeButton}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.removeIcon}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={styles.section}>
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setAnonymous(!anonymous)}
              activeOpacity={0.7}
            >
              <View
                style={[styles.checkbox, anonymous && styles.checkboxActive]}
              >
                {anonymous && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <View style={styles.checkboxTextContainer}>
                <Text style={styles.checkboxLabel}>Submit anonymously</Text>
                <Text style={styles.checkboxSubtext}>
                  Your identity will be kept private
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.submitSection}>
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
              activeOpacity={0.8}
            >
              <Text style={styles.submitButtonText}>Submit Report</Text>
              <Text style={styles.submitButtonIcon}>→</Text>
            </TouchableOpacity>
            <Text style={styles.submitDisclaimer}>
              All reports are reviewed by campus security
            </Text>
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={showMapModal}
        animationType="slide"
        onRequestClose={() => setShowMapModal(false)}
      >
        <View style={styles.modalContainer}>
          <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setShowMapModal(false)}
              style={styles.modalHeaderButton}
            >
              <Text style={styles.cancelButton}>✕ Cancel</Text>
            </TouchableOpacity>
            <View style={styles.modalTitleContainer}>
              <Text style={styles.modalTitle}>Select Location</Text>
              <Text style={styles.modalSubtitle}>Tap or drag pin</Text>
            </View>
            <TouchableOpacity
              onPress={handleConfirmLocation}
              style={styles.modalHeaderButton}
            >
              <Text style={styles.confirmButton}>Confirm ✓</Text>
            </TouchableOpacity>
          </View>

          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            initialRegion={mapRegion}
            onPress={handleMapPress}
            onRegionChangeComplete={handleRegionChange}
            minZoomLevel={14}
            maxZoomLevel={20}
            showsUserLocation={true}
          >
            {selectedLocation && (
              <Marker
                coordinate={selectedLocation}
                title="Incident Location"
                pinColor="#3b82f6"
                draggable
                onDragEnd={(e) => setSelectedLocation(e.nativeEvent.coordinate)}
              />
            )}
          </MapView>

          <TouchableOpacity
            style={styles.myLocationButton}
            onPress={centerMapOnUser}
            activeOpacity={0.8}
          >
            <Text style={styles.myLocationIcon}>📍</Text>
          </TouchableOpacity>

          <View style={styles.mapInfoContainer}>
            <View style={styles.mapInfo}>
              <Text style={styles.mapInfoIcon}>💡</Text>
              <Text style={styles.mapInfoText}>
                Tap anywhere or drag the pin to set the incident location
              </Text>
            </View>
            {selectedLocation && (
              <View style={styles.selectedCoordsContainer}>
                <Text style={styles.selectedCoordsLabel}>
                  Selected Location
                </Text>
                <View style={styles.selectedCoords}>
                  <Text style={styles.selectedCoordsText}>
                    📍 {selectedLocation.latitude.toFixed(6)},{" "}
                    {selectedLocation.longitude.toFixed(6)}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    padding: 20,
  },
  loadingCard: {
    backgroundColor: "#ffffff",
    padding: 32,
    borderRadius: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    minWidth: 280,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
    textAlign: "center",
  },
  loadingSubtext: {
    marginTop: 6,
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
  },
  header: {
    backgroundColor: "#ffffff",
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  headerIcon: {
    fontSize: 36,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: "#0f172a",
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 15,
    color: "#64748b",
    marginTop: 4,
    fontWeight: "500",
  },
  formContainer: {
    padding: 16,
  },
  section: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
    flex: 1,
  },
  requiredBadge: {
    backgroundColor: "#fee2e2",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  requiredText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#dc2626",
    textTransform: "uppercase",
  },
  sectionDescription: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 12,
    lineHeight: 20,
  },
  input: {
    borderWidth: 2,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: "#f8fafc",
    color: "#0f172a",
    fontWeight: "500",
  },
  dropdownContainer: {
    gap: 12,
  },
  dropdownOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderWidth: 2,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    backgroundColor: "#f8fafc",
  },
  dropdownOptionActive: {
    borderColor: "#3b82f6",
    backgroundColor: "#eff6ff",
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  iconCircleActive: {
    backgroundColor: "#dbeafe",
  },
  iconText: {
    fontSize: 22,
  },
  optionTextContainer: {
    flex: 1,
  },
  dropdownText: {
    fontSize: 16,
    color: "#475569",
    fontWeight: "600",
    marginBottom: 2,
  },
  dropdownTextActive: {
    color: "#3b82f6",
    fontWeight: "700",
  },
  dropdownSubtext: {
    fontSize: 13,
    color: "#94a3b8",
    fontWeight: "500",
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#3b82f6",
    alignItems: "center",
    justifyContent: "center",
  },
  checkMark: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
  mapButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3b82f6",
    padding: 16,
    borderRadius: 12,
    gap: 12,
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  mapButtonIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  mapButtonIconText: {
    fontSize: 18,
  },
  mapButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  coordinatesContainer: {
    flexDirection: "row",
    gap: 12,
  },
  coordinateBox: {
    flex: 1,
    backgroundColor: "#f8fafc",
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#e2e8f0",
  },
  coordinateLabel: {
    fontSize: 13,
    color: "#64748b",
    marginBottom: 8,
    fontWeight: "600",
  },
  coordinateValue: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
    fontFamily: "monospace",
  },
  uploadButton: {
    backgroundColor: "#f8fafc",
    padding: 18,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#cbd5e1",
    borderStyle: "dashed",
  },
  uploadContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  uploadIcon: {
    fontSize: 32,
  },
  uploadTextContainer: {
    alignItems: "center",
  },
  uploadText: {
    fontSize: 16,
    color: "#475569",
    fontWeight: "600",
  },
  uploadSubtext: {
    fontSize: 13,
    color: "#94a3b8",
    marginTop: 2,
  },
  mediaList: {
    marginTop: 16,
    gap: 8,
  },
  mediaListTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 8,
  },
  mediaItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  mediaIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#e0e7ff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  mediaIcon: {
    fontSize: 18,
  },
  mediaName: {
    flex: 1,
    fontSize: 15,
    color: "#0f172a",
    fontWeight: "500",
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#fee2e2",
    alignItems: "center",
    justifyContent: "center",
  },
  removeIcon: {
    fontSize: 18,
    color: "#dc2626",
    fontWeight: "700",
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 28,
    height: 28,
    borderWidth: 2,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    marginRight: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8fafc",
  },
  checkboxActive: {
    borderColor: "#3b82f6",
    backgroundColor: "#eff6ff",
  },
  checkmark: {
    fontSize: 18,
    color: "#3b82f6",
    fontWeight: "700",
  },
  checkboxTextContainer: {
    flex: 1,
  },
  checkboxLabel: {
    fontSize: 16,
    color: "#0f172a",
    fontWeight: "600",
    marginBottom: 2,
  },
  checkboxSubtext: {
    fontSize: 13,
    color: "#64748b",
  },
  submitSection: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  submitButton: {
    backgroundColor: "#3b82f6",
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  submitButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  submitButtonIcon: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "700",
  },
  submitDisclaimer: {
    fontSize: 13,
    color: "#64748b",
    textAlign: "center",
    marginTop: 12,
    fontWeight: "500",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  modalHeaderButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  cancelButton: {
    fontSize: 16,
    color: "#64748b",
    fontWeight: "600",
  },
  modalTitleContainer: {
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
  },
  modalSubtitle: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 2,
    fontWeight: "500",
  },
  confirmButton: {
    fontSize: 16,
    color: "#3b82f6",
    fontWeight: "700",
  },
  map: {
    flex: 1,
  },
  myLocationButton: {
    position: "absolute",
    right: 20,
    bottom: 160,
    backgroundColor: "#ffffff",
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  myLocationIcon: {
    fontSize: 26,
  },
  mapInfoContainer: {
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 16,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  mapInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eff6ff",
    padding: 14,
    borderRadius: 12,
    gap: 10,
  },
  mapInfoIcon: {
    fontSize: 20,
  },
  mapInfoText: {
    fontSize: 14,
    color: "#475569",
    flex: 1,
    lineHeight: 20,
    fontWeight: "500",
  },
  selectedCoordsContainer: {
    marginTop: 12,
  },
  selectedCoordsLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 8,
  },
  selectedCoords: {
    backgroundColor: "#f0f9ff",
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#bae6fd",
  },
  selectedCoordsText: {
    fontSize: 14,
    color: "#0369a1",
    textAlign: "center",
    fontWeight: "700",
    fontFamily: "monospace",
  },
});
export default IncidentLog;
