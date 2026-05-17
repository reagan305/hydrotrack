import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { loginUser, resetUserPassword } from "../firebase/config";

export default function LoginScreen() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill all fields.");
      return;
    }

    try {
      setLoading(true);
      await loginUser(email, password);
      router.replace("/main");
    } catch (err) {
      Alert.alert("Login Failed", "Incorrect email or password.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert("Enter Email", "Enter your email first.");
      return;
    }

    try {
      setResetLoading(true);
      await resetUserPassword(email);
      Alert.alert("Success", "Password reset email sent.");
    } catch (err) {
      Alert.alert("Error", "Could not send reset email.");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>💧</Text>
      <Text style={styles.title}>HydroTrack</Text>
      <Text style={styles.subtitle}>Smart Water Tank Monitoring System</Text>

      <TextInput
        placeholder="Email Address"
        placeholderTextColor="#94a3b8"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={styles.input}
      />

      <TextInput
        placeholder="Password"
        placeholderTextColor="#94a3b8"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />

      <TouchableOpacity onPress={handleForgotPassword}>
        <Text style={styles.forgot}>
          {resetLoading ? "Sending..." : "Forgot Password?"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>
          {loading ? "Logging in..." : "Login"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/signup")}>
        <Text style={styles.footer}>
          Don’t have an account? <Text style={styles.link}>Sign Up</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
    justifyContent: "center",
    padding: 24,
  },
  logo: {
    fontSize: 55,
    textAlign: "center",
    marginBottom: 10,
  },
  title: {
    color: "#ffffff",
    fontSize: 34,
    fontWeight: "900",
    textAlign: "center",
  },
  subtitle: {
    color: "#94a3b8",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 40,
  },
  input: {
    backgroundColor: "#1e293b",
    color: "#ffffff",
    padding: 16,
    borderRadius: 14,
    marginBottom: 16,
    fontSize: 15,
  },
  forgot: {
    color: "#38bdf8",
    textAlign: "right",
    marginBottom: 24,
    fontWeight: "700",
  },
  button: {
    backgroundColor: "#0ea5e9",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "900",
    fontSize: 16,
  },
  footer: {
    color: "#cbd5e1",
    textAlign: "center",
    marginTop: 28,
  },
  link: {
    color: "#38bdf8",
    fontWeight: "900",
  },
});