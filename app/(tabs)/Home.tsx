import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import { auth } from "../../firebaseConfig";

const Home = () => {

    const user = auth.currentUser;
    const router = useRouter();

    const handleLogout = async () => {
        try {
            await signOut(auth);
            router.replace("/Login");
        } catch (error: any) {
            Alert.alert("Logout failed!", error.message);
        }
    };

    return (
        <View>
            <Text>
                Welcome! Logged in as {user?.email}
            </Text>

            <TouchableOpacity onPress={handleLogout}>
                <Text>
                    Log Out
                </Text>
            </TouchableOpacity>
        </View>
    )
}

export default Home