import { router } from "expo-router";
import { Button, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SafeCircle() {
  return (
    <SafeAreaView>
      <Text>SafeCircle Home</Text>
      <Button
        title="Go to Trust Circle"
        onPress={() => router.push("/(tabs)/safecircle/Trustcircle")}
      />
      <Button
        title="Go to Incident Reporting"
        onPress={() => router.push("/(tabs)/safecircle/IncidentReporting")}
      />
    </SafeAreaView>
  );
}
