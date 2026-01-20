import { db } from "@/firebaseConfig";
import { router } from "expo-router";
import { collection, DocumentData, getDocs } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import MapView, {
  Callout,
  LatLng,
  Marker,
  Polygon,
  PROVIDER_GOOGLE,
} from "react-native-maps";

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
    fillColor: "rgba(59, 130, 246, 0.25)",
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
    fillColor: "rgba(16, 185, 129, 0.25)",
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
    fillColor: "rgba(239, 68, 68, 0.25)",
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
    fillColor: "rgba(168, 85, 247, 0.25)",
    strokeColor: "#a855f7",
  },
];

export default function IITKanpurMap() {
  const [expandedRegions, setExpandedRegions] = useState<
    Record<string, boolean>
  >({});
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
        const incident_loc: IncidentLocation[] = incidentSnapshot.docs.map(
          (doc) => {
            const data = doc.data() as DocumentData;
            return {
              id: doc.id,
              lat: parseFloat(data.coordinates.lat),
              lng: parseFloat(data.coordinates.lng),
              title: data.title,
              color: "#FF0000",
              content: "ADD_CONTENT_HERE",
            };
          },
        );
        setLocations(incident_loc);
      } catch (e) {
        console.error("Firebase Error: ", e);
      }
    };
    fetchIncidents();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Enhanced Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>🗺️ IIT Kanpur Campus</Text>
          <Text style={styles.headerSubtitle}>
            Explore zones and report incidents
          </Text>
        </View>
        <View style={styles.headerStats}>
          <View style={styles.statBadge}>
            <Text style={styles.statNumber}>{locations.length}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
        </View>
      </View>

      {/* Map Container with Shadow */}
      <View style={styles.mapWrapper}>
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
                strokeWidth={2.5}
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
                    <View style={styles.calloutHeader}>
                      <Text style={styles.calloutTitle}>
                        ⚠️ {location.title}
                      </Text>
                      <View style={styles.urgentBadge}>
                        <Text style={styles.urgentText}>Urgent</Text>
                      </View>
                    </View>
                    <Text style={styles.calloutContent}>
                      {location.content}
                    </Text>
                    <View style={styles.calloutFooter}>
                      <Text style={styles.calloutCoords}>
                        📍 {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                      </Text>
                    </View>
                  </View>
                </Callout>
              </Marker>
            ))}
          </MapView>
        </View>
      </View>

      {/* Enhanced Report Button */}
      <View style={styles.reportButtonContainer}>
        <TouchableOpacity
          style={styles.reportButton}
          onPress={() => router.push("/(tabs)/safecircle/incidentLog")}
          activeOpacity={0.8}
        >
          <Text style={styles.reportButtonIcon}>🚨</Text>
          <Text style={styles.reportButtonText}>Report Incident</Text>
        </TouchableOpacity>
      </View>

      {/* Enhanced Region List */}
      <View style={styles.bottomPanelWrapper}>
        <View style={styles.bottomPanelHeader}>
          <Text style={styles.bottomPanelTitle}>Campus Zones</Text>
          <Text style={styles.bottomPanelSubtitle}>
            {Regions.length} regions
          </Text>
        </View>
        <ScrollView
          style={styles.bottomPanel}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {Regions.map((region, index) => (
            <View
              key={region.id}
              style={[
                styles.regionItem,
                index === Regions.length - 1 && styles.regionItemLast,
              ]}
            >
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
                <View style={styles.regionBadge}>
                  <View
                    style={[
                      styles.regionDot,
                      { backgroundColor: region.strokeColor },
                    ]}
                  />
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    backgroundColor: "#ffffff",
    paddingTop: 16,
    paddingBottom: 20,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
  },
  headerStats: {
    flexDirection: "row",
    gap: 8,
  },
  statBadge: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: "center",
    minWidth: 60,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
  },
  statLabel: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: "600",
    marginTop: 2,
  },
  mapWrapper: {
    flex: 1,
    padding: 16,
  },
  mapContainer: {
    flex: 1,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    backgroundColor: "#fff",
  },
  map: {
    width: "100%",
    height: "100%",
  },
  callout: {
    padding: 14,
    width: 220,
    backgroundColor: "white",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  calloutHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  calloutTitle: {
    fontWeight: "700",
    fontSize: 16,
    color: "#0f172a",
    flex: 1,
    marginRight: 8,
  },
  urgentBadge: {
    backgroundColor: "#fee2e2",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  urgentText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#dc2626",
    textTransform: "uppercase",
  },
  calloutContent: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 10,
    lineHeight: 20,
  },
  calloutFooter: {
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingTop: 8,
  },
  calloutCoords: {
    fontSize: 12,
    color: "#94a3b8",
    fontFamily: "monospace",
    fontWeight: "500",
  },
  reportButtonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  reportButton: {
    backgroundColor: "#3b82f6",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  reportButtonIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  reportButtonText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  bottomPanelWrapper: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  bottomPanelHeader: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  bottomPanelTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 2,
  },
  bottomPanelSubtitle: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "500",
  },
  bottomPanel: {
    maxHeight: 200,
  },
  scrollContent: {
    paddingBottom: 8,
  },
  regionItem: {
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  regionItemLast: {
    borderBottomWidth: 0,
  },
  regionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  regionInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    flex: 1,
  },
  regionColor: {
    width: 20,
    height: 20,
    borderRadius: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  regionName: {
    fontWeight: "600",
    color: "#0f172a",
    fontSize: 16,
    letterSpacing: -0.2,
  },
  regionBadge: {
    backgroundColor: "#f8fafc",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  regionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
