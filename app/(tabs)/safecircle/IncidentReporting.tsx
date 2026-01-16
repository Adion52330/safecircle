import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Button,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import MapView, { Callout, Marker, Polygon, PROVIDER_GOOGLE } from 'react-native-maps';

const { width, height } = Dimensions.get('window');

// Sample data for locations within IIT Kanpur campus
const locations = [
  { id: 1, lat: 26.5123, lng: 80.2329, color: '#ef4444', title: 'Main Gate', content: 'Campus entrance' },
  { id: 2, lat: 26.5145, lng: 80.2335, color: '#3b82f6', title: 'Library', content: 'P.K. Kelkar Library' },
  { id: 3, lat: 26.5156, lng: 80.2315, color: '#10b981', title: 'Lecture Hall Complex', content: 'Main academic building' },
  { id: 4, lat: 26.5135, lng: 80.2310, color: '#f59e0b', title: 'Student Activity Center', content: 'SAC' },
  { id: 5, lat: 26.5120, lng: 80.2345, color: '#8b5cf6', title: 'Hall 1', content: 'Residential Hall' },
  { id: 6, lat: 26.5165, lng: 80.2328, color: '#ec4899', title: 'Computer Center', content: 'CC Building' },
  { id: 7, lat: 26.5142, lng: 80.2322, color: '#06b6d4', title: 'New Core', content: 'Academic complex' },
];

// Custom regions within IIT Kanpur campus (different zones)
const customRegions = [
  {
    id: 'region1',
    name: 'Academic Zone',
    coordinates: [
      { latitude: 26.5105, longitude: 80.2307 },
      { latitude: 26.5105, longitude: 80.2353 },
      { latitude: 26.5150, longitude: 80.2353 },
      { latitude: 26.5166, longitude: 80.2340 },
      { latitude: 26.5180, longitude: 80.2306 },
    ],
    fillColor: 'rgba(59, 130, 246, 0.3)',
    strokeColor: '#3b82f6',
  },
  {
    id: 'region2',
    name: 'Residential Zone',
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
      { latitude: 26.5057, longitude: 80.2340 },
      { latitude: 26.5046, longitude: 80.2340 },
      { latitude: 26.5046, longitude: 80.2352 },
      { latitude: 26.5055, longitude: 80.2350 },
      { latitude: 26.5056, longitude: 80.2344 },
      { latitude: 26.5062, longitude: 80.2340 },
      { latitude: 26.5081, longitude: 80.2339 },
      { latitude: 26.5081, longitude: 80.2307 },
      { latitude: 26.5074, longitude: 80.2307 },
      { latitude: 26.5074, longitude: 80.2290 },
      { latitude: 26.5042, longitude: 80.2290 },
      { latitude: 26.5042, longitude: 80.2257 },
      { latitude: 26.5110, longitude: 80.2257 },
      { latitude: 26.5118, longitude: 80.2252 },
      { latitude: 26.5118, longitude: 80.2241 },
      { latitude: 26.5125, longitude: 80.2241 },
      { latitude: 26.5125, longitude: 80.2253 },
      { latitude: 26.5117, longitude: 80.2253 },
      { latitude: 26.5111, longitude: 80.2257 },
      { latitude: 26.5114, longitude: 80.2268 },
    ],
    fillColor: 'rgba(16, 185, 129, 0.3)',
    strokeColor: '#10b981',
  },
  {
    id: 'region3',
    name: 'Sports Complex',
    coordinates: [
      { latitude: 26.5087, longitude: 80.2307 },
      { latitude: 26.5087, longitude: 80.2327 },
      { latitude: 26.5105, longitude: 80.2327 },
      { latitude: 26.5105, longitude: 80.2343 },
      { latitude: 26.5081, longitude: 80.2343 },
      { latitude: 26.5081, longitude: 80.2307 },
    ],
    fillColor: 'rgba(239, 68, 68, 0.3)',
    strokeColor: '#ef4444',
  },
];

const ChevronDown = () => (
  <View style={styles.chevron}>
    <Text style={styles.chevronText}>▼</Text>
  </View>
);

const ChevronUp = () => (
  <View style={[styles.chevron, styles.chevronUp]}>
    <Text style={styles.chevronText}>▲</Text>
  </View>
);

export default function IITKanpurMap() {
  const [expandedRegions, setExpandedRegions] = useState<{ [key: string]: boolean }>({});

  const toggleRegion = (regionId: string) => {
    setExpandedRegions(prev => ({
      ...prev,
      [regionId]: !prev[regionId],
    }));
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>IIT Kanpur Campus Map</Text>
        <Text style={styles.headerSubtitle}>Tap pins to view location details</Text>
      </View>

      {/* Map */}
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
          {/* Custom Regions (Polygons) */}
          {customRegions.map(region => (
            <Polygon
              key={region.id}
              coordinates={region.coordinates}
              fillColor={region.fillColor}
              strokeColor={region.strokeColor}
              strokeWidth={2}
            />
          ))}

          {/* Location Markers */}
          {locations.map(location => (
            <Marker
              key={location.id}
              coordinate={{
                latitude: location.lat,
                longitude: location.lng,
              }}
              pinColor={location.color}
            >
              <Callout>
                <View style={styles.callout}>
                  <Text style={styles.calloutTitle}>{location.title}</Text>
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

      {/* Bottom Panel - Region Info */}
      <Button
              title="Report incident"
              onPress={() => router.push("/(tabs)/safecircle/incidentLog")}
            />
      <ScrollView style={styles.bottomPanel}>
        {customRegions.map(region => (
          <View key={region.id} style={styles.regionItem}>
            <TouchableOpacity
              style={styles.regionHeader}
              onPress={() => toggleRegion(region.id)}
            >
              <View style={styles.regionInfo}>
                <View
                  style={[
                    styles.regionColor,
                    { backgroundColor: region.strokeColor },
                  ]}
                />
                <Text style={styles.regionName}>{region.name}</Text>
              </View>
              {expandedRegions[region.id] ? <ChevronUp /> : <ChevronDown />}
            </TouchableOpacity>

            {expandedRegions[region.id] && (
              <View style={styles.regionContent}>
                <Text style={styles.regionContentText}>Region coordinates:</Text>
                <View style={styles.coordList}>
                  {region.coordinates.map((coord, idx) => (
                    <Text key={idx} style={styles.coordItem}>
                      Point {idx + 1}: {coord.latitude}, {coord.longitude}
                    </Text>
                  ))}
                </View>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: 'white',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    zIndex: 1000,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  mapContainer: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    margin: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  callout: {
    padding: 8,
    minWidth: 150,
  },
  calloutTitle: {
    fontWeight: '600',
    fontSize: 16,
    color: '#1f2937',
    marginBottom: 4,
  },
  calloutContent: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  calloutCoords: {
    fontSize: 11,
    color: '#9ca3af',
    fontFamily: 'monospace',
  },
  bottomPanel: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    maxHeight: 240,
  },
  regionItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  regionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  regionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  regionColor: {
    width: 16,
    height: 16,
    borderRadius: 4,
  },
  regionName: {
    fontWeight: '500',
    color: '#1f2937',
    fontSize: 16,
  },
  chevron: {
    padding: 4,
  },
  chevronUp: {
    transform: [{ rotate: '180deg' }],
  },
  chevronText: {
    fontSize: 12,
    color: '#6b7280',
  },
  regionContent: {
    padding: 16,
    paddingTop: 0,
    backgroundColor: '#f9fafb',
  },
  regionContentText: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
  },
  coordList: {
    gap: 2,
  },
  coordItem: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#6b7280',
    paddingVertical: 2,
  },
});
