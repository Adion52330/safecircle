import { db } from "@/firebaseConfig";
import { router } from "expo-router";
import { collection, DocumentData, getDocs } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { Button, Dimensions, ScrollView, StyleSheet, Text, View } from "react-native";
import MapView, { Callout, LatLng, Marker, Polygon, PROVIDER_GOOGLE } from "react-native-maps";

const { width, height } = Dimensions.get("window");

interface Region {
  id: string;
  name: string;
  coordinates: LatLng[];
  fillColor: string;
  strokeColor: string;
}

interface IncidentLocation {
  id: string;
  lat: number;
  lng: number;
  title: string;
  color: string;
  content: string;
}

const Regions: Region[] = [
  {
    id: "region1",
    name: "Academic Zone",
    coordinates: [
      { latitude: 26.5105, longitude: 80.2307 },
      { latitude: 26.5105, longitude: 80.2353 },
      { latitude: 26.515, longitude: 80.2353 },
      { latitude: 26.5166, longitude: 80.234 },
      { latitude: 26.518, longitude: 80.2306 },
    ],
    fillColor: "rgba(59, 130, 246, 0.3)",
    strokeColor: "#3b82f6",
  },
  {
    id: "region2",
    name: "Residential Zone",
    coordinates: [
      { latitude: 26.5117, longitude: 80.2268 },
      { latitude: 26.5118, longitude: 80.2289 },
      { latitude: 26.5113, longitude: 80.2307 },
      { latitude: 26.5099, longitude: 80.2307 },
      { latitude: 26.5099, longitude: 80.2307 },
      { latitude: 26.5099, longitude: 80.2307 },
      { latitude: 26.5099, longitude: 80.2291 },
      { latitude: 26.5093, longitude: 80.2291 },
      { latitude: 26.5093, longitude: 80.2307 },
      { latitude: 26.5105, longitude: 80.2307 },
      { latitude: 26.5105, longitude: 80.2327 },
      { latitude: 26.5087, longitude: 80.2327 },
      { latitude: 26.5087, longitude: 80.2307 },
      { latitude: 26.5074, longitude: 80.2307 },
      { latitude: 26.5063, longitude: 80.2308 },
      { latitude: 26.5063, longitude: 80.2329 },
      { latitude: 26.5058, longitude: 80.2334 },
      { latitude: 26.5057, longitude: 80.234 },
      { latitude: 26.5046, longitude: 80.234 },
      { latitude: 26.5046, longitude: 80.2352 },
      { latitude: 26.5055, longitude: 80.235 },
      { latitude: 26.5056, longitude: 80.2344 },
      { latitude: 26.5062, longitude: 80.234 },
      { latitude: 26.5081, longitude: 80.2339 },
      { latitude: 26.5081, longitude: 80.2307 },
      { latitude: 26.5074, longitude: 80.2307 },
      { latitude: 26.5074, longitude: 80.229 },
      { latitude: 26.5042, longitude: 80.229 },
      { latitude: 26.5042, longitude: 80.2257 },
      { latitude: 26.511, longitude: 80.2257 },
      { latitude: 26.5118, longitude: 80.2252 },
      { latitude: 26.5118, longitude: 80.2241 },
      { latitude: 26.5125, longitude: 80.2241 },
      { latitude: 26.5125, longitude: 80.2253 },
      { latitude: 26.5117, longitude: 80.2253 },
      { latitude: 26.5111, longitude: 80.2257 },
      { latitude: 26.5114, longitude: 80.2268 },
    ],
    fillColor: "rgba(16, 185, 129, 0.3)",
    strokeColor: "#10b981",
  },
  {
    id: "region3",
    name: "Sports Complex",
    coordinates: [
      { latitude: 26.5087, longitude: 80.2307 },
      { latitude: 26.5087, longitude: 80.2327 },
      { latitude: 26.5105, longitude: 80.2327 },
      { latitude: 26.5105, longitude: 80.2343 },
      { latitude: 26.5081, longitude: 80.2343 },
      { latitude: 26.5081, longitude: 80.2307 },
    ],
    fillColor: "rgba(239, 68, 68, 0.3)",
    strokeColor: "#ef4444",
  },
  {
    id: "region4",
    name: "OAT and Pronite Ground",
    coordinates: [
      { latitude: 26.5053, longitude: 80.229 },
      { latitude: 26.5053, longitude: 80.2308 },
      { latitude: 26.5033, longitude: 80.2309 },
      { latitude: 26.5035, longitude: 80.2281 },
      { latitude: 26.5042, longitude: 80.2281 },
      { latitude: 26.5042, longitude: 80.229 },
    ],
    fillColor: "rgba(239, 68, 225, 0.3)",
    strokeColor: "#ef44e1ff",
  },
];

export default function IITKanpurMap() {
  const [expandedRegions, setExpandedRegions] = useState<Record<string, boolean>>({});
  const [locations, setLocations] = useState<IncidentLocation[]>([]);

  const toggleRegion = (regionId: string) => {
    setExpandedRegions((prev) => ({
      ...prev,
      [regionId]: !prev[regionId],
    }));
  };

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const incidentSnapshot = await getDocs(collection(db, "incidents"));
        const incident_loc: IncidentLocation[] = incidentSnapshot.docs.map((doc) => {
          const data = doc.data() as DocumentData;
          return {
            id: doc.id,
            lat: parseFloat(data.coordinates.lat),
            lng: parseFloat(data.coordinates.lng),
            title: data.title,
            color: "#FF0000",
            content: "ADD_CONTENT_HERE",
          };
        });
        setLocations(incident_loc);
      } catch (e) {
        console.error("Firebase Error: ", e);
      }
    };
    fetchIncidents();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>IIT Kanpur Campus Map</Text>
        <Text style={styles.headerSubtitle}>Tap pins to view location details</Text>
      </View>

      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={{
            latitude: 26.5123,
            longitude: 80.2329,
            latitudeDelta: 0.015,
            longitudeDelta: 0.015,
          }}
          minZoomLevel={15}
          maxZoomLevel={19}
        >
          {Regions.map((region) => (
            <Polygon
              key={region.id}
              coordinates={region.coordinates}
              fillColor={region.fillColor}
              strokeColor={region.strokeColor}
              strokeWidth={2}
            />
          ))}
          {locations.map((location) => (
            <Marker
              key={location.id}
              coordinate={{
                latitude: location.lat,
                longitude: location.lng,
              }}
              pinColor={location.color}
              title={location.title}
            >
              <Callout tooltip={false}>
                <View style={styles.callout}>
                  <Text style={styles.calloutTitle}>{location.title} need help</Text>
                  <Text style={styles.calloutContent}>{location.content}</Text>
                  <Text style={styles.calloutCoords}>
                    {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                  </Text>
                </View>
              </Callout>
            </Marker>
          ))}
        </MapView>
      </View>

      <Button
        title="Report incident"
        onPress={() => router.push("/(tabs)/safecircle/incidentLog")}
      />

      <ScrollView style={styles.bottomPanel}>
        {Regions.map((region) => (
          <View key={region.id} style={styles.regionItem}>
            <View style={styles.regionHeader}>
              <View style={styles.regionInfo}>
                <View
                  style={[
                    styles.regionColor,
                    { backgroundColor: region.strokeColor },
                  ]}
                />
                <Text style={styles.regionName}>{region.name}</Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  header: {
    backgroundColor: "white",
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    zIndex: 1000,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#6b7280",
  },
  mapContainer: {
    flex: 1,
    borderWidth: 2,
    borderColor: "#e5e7eb",
    margin: 8,
    borderRadius: 12,
    overflow: "hidden",
  },
  map: {
    width: "100%",
    height: "100%",
  },
  callout: {
    padding: 8,
    width: 200,
    backgroundColor: "white",
    borderRadius: 8,
  },
  calloutTitle: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#1f2937",
    marginBottom: 4,
  },
  calloutContent: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 8,
  },
  calloutCoords: {
    fontSize: 11,
    color: "#9ca3af",
    fontFamily: "monospace",
  },
  bottomPanel: {
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    maxHeight: 240,
  },
  regionItem: {
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  regionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  regionInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  regionColor: {
    width: 16,
    height: 16,
    borderRadius: 4,
  },
  regionName: {
    fontWeight: "500",
    color: "#1f2937",
    fontSize: 16,
  },
});