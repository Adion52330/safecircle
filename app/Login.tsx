import { useRouter } from "expo-router";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
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
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const user = userCredential.user;
      await user.reload();
      if (!user.emailVerified) {
        Alert.alert(
          "Verification Required",
          "Please check inbox to complete verification and continue.",
          [
            { text: "OK" },
            {
              text: "Resend Email",
              onPress: () => sendEmailVerification(user),
            },
          ],
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
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const user = userCredential.user;
      await sendEmailVerification(user);
      await signOut(auth);
      Alert.alert("Success!", "Account created. Check inbox for verification.");
    } catch (error: any) {
      Alert.alert("Registration failed!", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
    >
      <View className="flex-1 justify-center">
        <View className="flex-1 bg-gradient-to-br from-slate-50 to-slate-100 justify-center px-6">
          {/* Header section */}
          <View className="mb-10">
            <Text className="text-slate-900 text-4xl font-bold mb-2">
              SafeCircle+
            </Text>
            <Text className="text-slate-600 text-lg">
              {isLoginMode ? "Welcome back" : "Create your account"}
            </Text>
          </View>

          {/* Card container */}
          <View className="bg-white rounded-2xl shadow-lg p-8 mb-6">
            <View className="gap-4 mb-6">
              <View>
                <Text className="text-slate-700 text-sm font-medium mb-2">
                  Email
                </Text>
                <TextInput
                  placeholder="Enter your email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  className="bg-slate-50 text-slate-900 rounded-xl px-4 py-3.5 border border-slate-200 focus:border-blue-500"
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <View>
                <Text className="text-slate-700 text-sm font-medium mb-2">
                  Password
                </Text>
                <TextInput
                  placeholder="Enter your password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  className="bg-slate-50 text-slate-900 rounded-xl px-4 py-3.5 border border-slate-200 focus:border-blue-500"
                  placeholderTextColor="#94a3b8"
                />
              </View>
            </View>

            {/* Action button */}
            {loading ? (
              <View className="bg-blue-600 rounded-xl py-4 items-center justify-center">
                <ActivityIndicator size="small" color="#ffffff" />
              </View>
            ) : (
              <TouchableOpacity
                onPress={isLoginMode ? handleLogin : handleRegister}
                className="bg-blue-600 rounded-xl py-4 items-center active:bg-blue-700 shadow-sm"
              >
                <Text className="text-white text-base font-semibold">
                  {isLoginMode ? "Sign In" : "Create Account"}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Toggle mode */}
          <View className="items-center">
            <TouchableOpacity
              onPress={() => setIsLoginMode(!isLoginMode)}
              className="py-2"
            >
              <Text className="text-slate-600 text-base">
                {isLoginMode ? (
                  <>
                    Don&apos;t have an account?{" "}
                    <Text className="text-blue-600 font-semibold">Sign up</Text>
                  </>
                ) : (
                  <>
                    Already have an account?{" "}
                    <Text className="text-blue-600 font-semibold">Sign in</Text>
                  </>
                )}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default Login;
