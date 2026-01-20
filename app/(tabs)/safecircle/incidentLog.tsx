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
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Getting your location...</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerText}>Report Incident</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Incident Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter incident title"
            value={title}
            onChangeText={setTitle}
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Location Type *</Text>
          <View style={styles.dropdownContainer}>
            <TouchableOpacity
              style={[
                styles.dropdownOption,
                locationType === "user" && styles.dropdownOptionActive,
              ]}
              onPress={() => handleLocationTypeChange("user")}
            >
              <View style={styles.iconCircle}>
                <Text style={styles.iconText}>📍</Text>
              </View>
              <Text
                style={[
                  styles.dropdownText,
                  locationType === "user" && styles.dropdownTextActive,
                ]}
              >
                Current Location
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.dropdownOption,
                locationType === "map" && styles.dropdownOptionActive,
              ]}
              onPress={() => handleLocationTypeChange("map")}
            >
              <View style={styles.iconCircle}>
                <Text style={styles.iconText}>🗺️</Text>
              </View>
              <Text
                style={[
                  styles.dropdownText,
                  locationType === "map" && styles.dropdownTextActive,
                ]}
              >
                Choose from Map
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {locationType === "map" && (
          <View style={styles.section}>
            <TouchableOpacity style={styles.mapButton} onPress={handleOpenMap}>
              <Text style={styles.mapButtonIcon}>🗺️</Text>
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
            placeholder="Enter location name"
            value={locationName}
            onChangeText={setLocationName}
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Coordinates</Text>
          <View style={styles.coordinatesContainer}>
            <View style={styles.coordinateBox}>
              <Text style={styles.coordinateLabel}>Latitude</Text>
              <Text style={styles.coordinateValue}>
                {coordinates.lat || "N/A"}
              </Text>
            </View>
            <View style={styles.coordinateBox}>
              <Text style={styles.coordinateLabel}>Longitude</Text>
              <Text style={styles.coordinateValue}>
                {coordinates.lng || "N/A"}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Incident Multimedia</Text>
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={handleMediaUpload}
          >
            <Text style={styles.uploadIcon}>📷</Text>
            <Text style={styles.uploadText}>Upload Photo/Video</Text>
          </TouchableOpacity>

          {media.length > 0 && (
            <View style={styles.mediaList}>
              {media.map((item, index) => (
                <View key={index} style={styles.mediaItem}>
                  <Text style={styles.mediaIcon}>📎</Text>
                  <Text style={styles.mediaName}>{item.name}</Text>
                  <TouchableOpacity onPress={() => removeMedia(item.id)}>
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
          >
            <View style={styles.checkbox}>
              {anonymous && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>Submit anonymously</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Submit Incident Report</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        visible={showMapModal}
        animationType="slide"
        onRequestClose={() => setShowMapModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowMapModal(false)}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Location</Text>
            <TouchableOpacity onPress={handleConfirmLocation}>
              <Text style={styles.confirmButton}>Confirm</Text>
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
                pinColor="#007AFF"
                draggable
                onDragEnd={(e) => setSelectedLocation(e.nativeEvent.coordinate)}
              />
            )}
          </MapView>

          <TouchableOpacity
            style={styles.myLocationButton}
            onPress={centerMapOnUser}
          >
            <Text style={styles.myLocationIcon}>📍</Text>
          </TouchableOpacity>

          <View style={styles.mapInfo}>
            <Text style={styles.mapInfoText}>
              Tap or drag the pin to select location
            </Text>
            {selectedLocation && (
              <View style={styles.selectedCoords}>
                <Text style={styles.selectedCoordsText}>
                  📍 {selectedLocation.latitude.toFixed(6)},{" "}
                  {selectedLocation.longitude.toFixed(6)}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: { marginTop: 16, fontSize: 16, color: "#666" },
  header: { backgroundColor: "#007AFF", padding: 20, paddingTop: 60 },
  headerText: { fontSize: 24, fontWeight: "bold", color: "#fff" },
  section: { padding: 16, backgroundColor: "#fff", marginBottom: 8 },
  label: { fontSize: 16, fontWeight: "600", color: "#333", marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  dropdownContainer: { flexDirection: "row", gap: 12 },
  dropdownOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderWidth: 2,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  dropdownOptionActive: { borderColor: "#007AFF", backgroundColor: "#f0f8ff" },
  iconCircle: { marginRight: 8 },
  iconText: { fontSize: 20 },
  dropdownText: { fontSize: 14, color: "#666", flex: 1 },
  dropdownTextActive: { color: "#007AFF", fontWeight: "600" },
  mapButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#007AFF",
    padding: 14,
    borderRadius: 8,
    gap: 8,
  },
  mapButtonIcon: { fontSize: 20 },
  mapButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  coordinatesContainer: { flexDirection: "row", gap: 12 },
  coordinateBox: {
    flex: 1,
    backgroundColor: "#f9f9f9",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  coordinateLabel: { fontSize: 12, color: "#666", marginBottom: 4 },
  coordinateValue: { fontSize: 16, fontWeight: "600", color: "#333" },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f0f0f0",
    padding: 14,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#ddd",
    borderStyle: "dashed",
    gap: 8,
  },
  uploadIcon: { fontSize: 24 },
  uploadText: { fontSize: 16, color: "#666" },
  mediaList: { marginTop: 12 },
  mediaItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    padding: 10,
    borderRadius: 6,
    marginBottom: 8,
  },
  mediaIcon: { fontSize: 18, marginRight: 8 },
  mediaName: { flex: 1, fontSize: 14, color: "#333" },
  removeIcon: { fontSize: 20, color: "#ff3b30", paddingHorizontal: 8 },
  checkboxContainer: { flexDirection: "row", alignItems: "center" },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: "#007AFF",
    borderRadius: 4,
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  checkmark: { fontSize: 16, color: "#007AFF", fontWeight: "bold" },
  checkboxLabel: { fontSize: 16, color: "#333" },
  submitButton: {
    backgroundColor: "#007AFF",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  submitButtonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  modalContainer: { flex: 1, backgroundColor: "#fff" },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingTop: 60,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  cancelButton: { fontSize: 16, color: "#ff3b30" },
  modalTitle: { fontSize: 18, fontWeight: "bold", color: "#333" },
  confirmButton: { fontSize: 16, color: "#007AFF", fontWeight: "600" },
  map: { flex: 1 },
  myLocationButton: {
    position: "absolute",
    right: 16,
    bottom: 120,
    backgroundColor: "#fff",
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },
  myLocationIcon: { fontSize: 24 },
  mapInfo: {
    backgroundColor: "#fff",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
  },
  mapInfoText: { fontSize: 14, color: "#666", textAlign: "center" },
  selectedCoords: {
    marginTop: 8,
    backgroundColor: "#f0f8ff",
    padding: 8,
    borderRadius: 6,
  },
  selectedCoordsText: {
    fontSize: 14,
    color: "#007AFF",
    textAlign: "center",
    fontWeight: "600",
  },
});

export default IncidentLog;
