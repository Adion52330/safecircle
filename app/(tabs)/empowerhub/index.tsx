import { router } from "expo-router";
import { Button, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Empowerhub() {
  return (
    <SafeAreaView>
      <Text>Empower Hub</Text>
            <Button
              title="Go to Opportinity Feed"
              onPress={() => router.push("/(tabs)/empowerhub/Opportunityfeed")}
            />
            <Button
              title="Go to Team Finder"
              onPress={() => router.push("/(tabs)/empowerhub/Teamfinder")}
            />
    </SafeAreaView>
  );
}
