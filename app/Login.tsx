import { useRouter } from "expo-router";
import { createUserWithEmailAndPassword, onAuthStateChanged, sendEmailVerification, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Text, TextInput, TouchableOpacity, View } from "react-native";
import { auth } from "../firebaseConfig";
import "../global.css";

const Login = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.emailVerified) {
        router.replace("/(tabs)/profile");
      }
    });
    return unsubscribe;
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await user.reload();
      if (!user.emailVerified) {
        Alert.alert("Verification Required", 
          "Please check inbox to complete verification and continue.",
          [
            { text: "OK"},
            { text: "Resend Email", onPress: () => sendEmailVerification(user)}
          ]
        );
        await signOut(auth);
        return;
      }

      Alert.alert("Success!", "Logged in successfully.");

    } catch (error: any) {
      Alert.alert("Login failed!", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await sendEmailVerification(user);
      await signOut(auth);
      
      Alert.alert("Success!", "Accounted created. Check inbox for verification.");

    } catch (error: any) {
      Alert.alert("Registration failed!", error.message);
    } finally {
      setLoading(false);
    }
  };


  return (
    <View className="flex flex-col bg-neutral-950 justify-center h-screen py-20 px-5">
      <View className="bg-gray-700 rounded flex flex-col items-center gap-5 pb-4 h-full">
        <Text className="text-white text-center p-2 text-3xl">
          SafeCircle+
        </Text>

        <View className="flex flex-col w-full items-center gap-3">
          <TextInput
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            className="bg-white text-black rounded w-3/4 p-1"
          />

          <TextInput
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            className="bg-white text-black rounded w-3/4 p-1"
          />
        </View>

        {loading ? (<ActivityIndicator size="large" />) :

          (isLoginMode ?

            (<TouchableOpacity onPress={handleLogin} className="bg-pink-600 rounded p-2">
              <Text className="text-white">Login</Text>
            </TouchableOpacity>) :

            (<TouchableOpacity onPress={handleRegister} className="bg-pink-600 rounded p-2">
              <Text className="text-white">Sign up</Text>
            </TouchableOpacity>))
        }

        <TouchableOpacity onPress={() => setIsLoginMode(!isLoginMode)}>
          <Text className="text-white">
            {isLoginMode ? "Need an account? Sign up" : "Have an account? Login"}
          </Text>
        </TouchableOpacity>

      </View>
    </View>
  )
}

export default Login