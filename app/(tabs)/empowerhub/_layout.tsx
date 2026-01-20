import { Stack } from "expo-router";

export default function EmpowerHubLayour() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Empower Hub" }} />
    </Stack>
  );
}
