import { Ionicons } from "@expo/vector-icons";
import * as Application from 'expo-application';
import * as Device from 'expo-device';
import { Link, useRouter } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    useWindowDimensions,
} from "react-native";
import * as Animatable from "react-native-animatable";
import { Defs, LinearGradient, Path, Stop, Svg } from "react-native-svg";

const primaryColor = "#2C6BED";
const secondaryColor = "#1A56DB";
const accentColor = "#0E9F6E";
const lightBackground = "#F9FAFB";

const LoginScreen = () => {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const [isLoading, setIsLoading] = useState(false);

  const [userData, setUserData] = useState({
    email: "",
  });

  const getDeviceInfo = async () => {
    const manufacturer = Device.manufacturer || "Unknown";
    const modelName = Device.modelName || "Unknown";
    const osName = Device.osName || "Unknown";
    const osVersion = Device.osVersion || "Unknown";
    
    // Get Android ID (or empty string if not available)
    let androidId = "";
    try {
      if (Platform.OS === 'android') {
        androidId = await Application.getAndroidId();
      }
    } catch (error) {
      console.error("Error getting Android ID:", error);
    }

    return { manufacturer, modelName, osName, osVersion, androidId };
  };

  const handleLogin = async () => {
    setIsLoading(true);
    
    // Validate required fields
    if (userData.email.trim() === "") {
      Alert.alert("Missing Email", "Please enter your email address");
      setIsLoading(false);
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      Alert.alert("Invalid Email", "Please enter a valid email address");
      setIsLoading(false);
      return;
    }

    // Get device information (hidden from user)
    const deviceInfo = await getDeviceInfo();

    // Prepare data for API
    const loginData = {
      user: {
        email: userData.email,
      },
      device: deviceInfo,
      method: "login"
    };

    try {
      // Make API call
      const response = await fetch('https://geotruth.williamachuchi.com/api/auth/signup-login-controller', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });

      const result = await response.json();

      if (response.ok) {
        router.push({
          pathname: "/verify",
          params: { email: userData.email }
        });
      } else {
        // Handle specific error cases
        if (response.status === 404) {
          Alert.alert(
            "Email Not Found", 
            result.message || "This email is not registered. Would you like to sign up instead?",
            [
              { text: "Cancel", style: "cancel" },
              { text: "Sign Up", onPress: () => router.replace("/") }
            ]
          );
        } else {
          Alert.alert("Login Failed", result.message || "Something went wrong");
        }
      }
    } catch (error) {
      Alert.alert("Error", "Network error. Please try again.");
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof typeof userData, value: string) => {
    setUserData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: lightBackground }}
    >
      <ScrollView
        contentContainerStyle={localStyles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* Animated SVG Background */}
        <View style={localStyles.svgContainer}>
          <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
            <Defs>
              <LinearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor={primaryColor} stopOpacity="0.1" />
                <Stop offset="100%" stopColor={accentColor} stopOpacity="0.1" />
              </LinearGradient>
            </Defs>
            <Path
              d="M0,0 L100,0 L100,70 Q50,100 0,70 Z"
              fill="url(#gradient)"
            />
          </Svg>
        </View>

        <View style={localStyles.header}>
          <Animatable.Text 
            animation="fadeInDown"
            duration={800}
            style={localStyles.headerTitle}
          >
            Welcome Back
          </Animatable.Text>
          <Animatable.Text 
            animation="fadeInDown"
            duration={800}
            delay={100}
            style={localStyles.headerSubtitle}
          >
            Sign in to continue
          </Animatable.Text>
        </View>

        <Animatable.View
          animation="fadeInUp"
          duration={600}
          style={localStyles.card}
        >
          <Animatable.View 
            animation="fadeInRight"
            duration={600}
            delay={200}
            style={localStyles.inputGroup}
          >
            <View style={localStyles.labelContainer}>
              <Ionicons name="mail-outline" size={18} color={secondaryColor} />
              <Text style={localStyles.label}>Email Address *</Text>
            </View>
            <TextInput
              style={localStyles.input}
              value={userData.email}
              onChangeText={(text) => handleInputChange('email', text)}
              placeholder="Enter your email"
              placeholderTextColor="#94A3B8"
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </Animatable.View>

          <Animatable.View 
            animation="fadeInUp"
            duration={600}
            delay={400}
          >
            <TouchableOpacity
              style={[
                localStyles.primaryButton,
                isLoading && localStyles.disabledButton,
              ]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <>
                  <Text style={localStyles.buttonText}>Login</Text>
                  <Ionicons
                    name="arrow-forward"
                    size={20}
                    color="white"
                    style={{ marginLeft: 10 }}
                  />
                </>
              )}
            </TouchableOpacity>
          </Animatable.View>

          <Animatable.View 
            animation="fadeInUp"
            duration={600}
            delay={500}
            style={localStyles.authOptions}
          >
            <View style={localStyles.authRow}>
              <Text style={localStyles.authText}>
                Don't have an account?{" "}
                <Link href="/" style={localStyles.authLink}>
                  Sign Up
                </Link>
              </Text>
            </View>
          </Animatable.View>
        </Animatable.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const localStyles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: lightBackground,
  },
  svgContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '35%',
  },
  header: {
    paddingHorizontal: 25,
    paddingTop: 70,
    paddingBottom: 20,
  },
  headerTitle: {
    fontFamily: "JosefinSans_700Bold",
    fontSize: 32,
    color: primaryColor,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontFamily: "JosefinSans_400Regular",
    fontSize: 16,
    color: "#64748B",
  },
  card: {
    backgroundColor: "white",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 25,
    marginTop: 20,
    flex: 1,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  inputGroup: {
    marginBottom: 25,
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  label: {
    fontFamily: "JosefinSans_600SemiBold",
    fontSize: 16,
    color: "#1E293B",
    marginLeft: 8,
  },
  input: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    padding: 16,
    fontSize: 16,
    fontFamily: "JosefinSans_400Regular",
    color: "#0F172A",
  },
  primaryButton: {
    backgroundColor: primaryColor,
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    shadowColor: primaryColor,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    fontFamily: "JosefinSans_600SemiBold",
    fontSize: 18,
    color: "white",
  },
  authOptions: {
    marginTop: 25,
  },
  authRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  authText: {
    fontFamily: "JosefinSans_400Regular",
    fontSize: 14,
    color: "#64748B",
  },
  authLink: {
    fontFamily: "JosefinSans_600SemiBold",
    color: primaryColor,
  },
});

export default LoginScreen;