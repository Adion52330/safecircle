import { Stack } from "expo-router";

export default function EmpowerHubLayour() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="Opportunityfeed" options={{ headerShown: false }} />
      <Stack.Screen name="Teamfinder" options={{ headerShown: false }} />
    </Stack>
  );
}
