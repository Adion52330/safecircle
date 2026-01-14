import { Stack } from "expo-router";

export default function SafeCircleLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{ title: "Safe Circle" }}
      />
      <Stack.Screen
        name="Trustcircle"
        options={{ title: "Trust Circle" }}
      />
    </Stack>
  );
}
