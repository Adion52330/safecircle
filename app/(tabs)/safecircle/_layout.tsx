import { Stack } from "expo-router";

export default function SafeCircleLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="Trustcircle"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="IncidentReporting"
        options={{ title: "Incident Reporting" }}
      />
      <Stack.Screen name="incidentLog" options={{ headerShown: false }} />
    </Stack>
  );
}
