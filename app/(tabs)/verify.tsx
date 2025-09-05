import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
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

const VerificationScreen = () => {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { email } = useLocalSearchParams();
  const isTablet = width >= 768;
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(180); // 3 minutes in seconds
  const [showEditEmail, setShowEditEmail] = useState(false);
  const [editedEmail, setEditedEmail] = useState(email || "");

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) return;

    const timerId = setInterval(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);

    return () => clearInterval(timerId);
  }, [timeLeft]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleResend = async () => {
    if (timeLeft > 0) return;
    
    setIsResending(true);
    
    // Simulate API call to resend verification
    setTimeout(() => {
      setTimeLeft(180); // Reset timer to 3 minutes
      setIsResending(false);
      Alert.alert("Email Sent", "A new verification link has been sent to your email.");
    }, 1500);
  };

  const handleChangeEmail = () => {
    setShowEditEmail(true);
  };

  const handleConfirmEmailChange = () => {
    if (!editedEmail.trim()) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editedEmail)) {
      Alert.alert("Invalid Email", "Please enter a valid email address");
      return;
    }

    setShowEditEmail(false);
    // In a real app, you would update the email in your backend here
    Alert.alert("Email Updated", "Your email has been updated successfully.");
  };

  const handleCancelEmailChange = () => {
    setEditedEmail(email || "");
    setShowEditEmail(false);
  };

  const handleActivation = () => {
    setIsLoading(true);
    // Simulate activation process
    setTimeout(() => {
      setIsLoading(false);
      Alert.alert("Success", "Your account has been activated successfully!");
      router.replace("/home"); // Navigate to home screen after activation
    }, 2000);
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
            Verify Your Email
          </Animatable.Text>
          <Animatable.Text 
            animation="fadeInDown"
            duration={800}
            delay={100}
            style={localStyles.headerSubtitle}
          >
            Check your inbox for the verification link
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
            style={localStyles.iconContainer}
          >
            <View style={localStyles.circle}>
              <Ionicons name="mail-open-outline" size={40} color={primaryColor} />
            </View>
          </Animatable.View>

          <Animatable.Text 
            animation="fadeInUp"
            duration={600}
            delay={300}
            style={localStyles.instructionText}
          >
            We've sent a verification link to
          </Animatable.Text>

          <Animatable.View 
            animation="fadeInUp"
            duration={600}
            delay={350}
            style={localStyles.emailContainer}
          >
            {showEditEmail ? (
              <TextInput
                style={localStyles.emailInput}
                value={editedEmail}
                onChangeText={setEditedEmail}
                placeholder="Enter your email"
                placeholderTextColor="#94A3B8"
                autoCapitalize="none"
                keyboardType="email-address"
                autoFocus={true}
              />
            ) : (
              <Text style={localStyles.emailText}>{email}</Text>
            )}
            
            {!showEditEmail && (
              <TouchableOpacity 
                style={localStyles.editButton}
                onPress={handleChangeEmail}
              >
                <Ionicons name="pencil-outline" size={18} color={primaryColor} />
              </TouchableOpacity>
            )}
          </Animatable.View>

          <Animatable.Text 
            animation="fadeInUp"
            duration={600}
            delay={400}
            style={localStyles.instructionText}
          >
            Please click the link in the email to activate your account.
          </Animatable.Text>

          {showEditEmail ? (
            <Animatable.View 
              animation="fadeInUp"
              duration={600}
              delay={450}
              style={localStyles.editActions}
            >
              <TouchableOpacity
                style={[localStyles.button, localStyles.cancelButton]}
                onPress={handleCancelEmailChange}
              >
                <Text style={[localStyles.buttonText, {color: "#64748B"}]}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[localStyles.button, localStyles.confirmButton]}
                onPress={handleConfirmEmailChange}
              >
                <Text style={[localStyles.buttonText, {color: "white"}]}>Confirm</Text>
              </TouchableOpacity>
            </Animatable.View>
          ) : (
            <>
              <Animatable.View 
                animation="fadeInUp"
                duration={600}
                delay={450}
                style={localStyles.timerContainer}
              >
                <Text style={localStyles.timerText}>
                  {timeLeft > 0 
                    ? `Resend link in ${formatTime(timeLeft)}` 
                    : "Didn't receive the email?"
                  }
                </Text>
              </Animatable.View>

              <Animatable.View 
                animation="fadeInUp"
                duration={600}
                delay={500}
              >
                <TouchableOpacity
                  style={[
                    localStyles.resendButton,
                    timeLeft > 0 && localStyles.disabledButton,
                    isResending && localStyles.loadingButton,
                  ]}
                  onPress={handleResend}
                  disabled={timeLeft > 0 || isResending}
                >
                  {isResending ? (
                    <ActivityIndicator color={primaryColor} size="small" />
                  ) : (
                    <>
                      <Ionicons
                        name="refresh-outline"
                        size={20}
                        color={timeLeft > 0 ? "#94A3B8" : primaryColor}
                        style={{ marginRight: 8 }}
                      />
                      <Text style={[
                        localStyles.resendButtonText,
                        timeLeft > 0 && { color: "#94A3B8" }
                      ]}>
                        Resend Verification Email
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </Animatable.View>

              <Animatable.View 
                animation="fadeInUp"
                duration={600}
                delay={550}
                style={localStyles.activationContainer}
              >
                <Text style={localStyles.activationText}>
                  Already clicked the link?
                </Text>
                
                <TouchableOpacity
                  style={[
                    localStyles.activationButton,
                    isLoading && localStyles.disabledButton,
                  ]}
                  onPress={handleActivation}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <>
                      <Text style={localStyles.activationButtonText}>I've Activated My Account</Text>
                      <Ionicons
                        name="checkmark-circle-outline"
                        size={20}
                        color="white"
                        style={{ marginLeft: 10 }}
                      />
                    </>
                  )}
                </TouchableOpacity>
              </Animatable.View>
            </>
          )}
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
    textAlign: "center",
  },
  headerSubtitle: {
    fontFamily: "JosefinSans_400Regular",
    fontSize: 16,
    color: "#64748B",
    textAlign: "center",
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
    alignItems: "center",
  },
  iconContainer: {
    marginBottom: 20,
  },
  circle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#DBEAFE",
  },
  instructionText: {
    fontFamily: "JosefinSans_400Regular",
    fontSize: 16,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 10,
  },
  emailContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  emailText: {
    fontFamily: "JosefinSans_600SemiBold",
    fontSize: 18,
    color: primaryColor,
    textAlign: "center",
  },
  emailInput: {
    fontFamily: "JosefinSans_600SemiBold",
    fontSize: 18,
    color: primaryColor,
    textAlign: "center",
    borderBottomWidth: 1,
    borderBottomColor: primaryColor,
    paddingVertical: 5,
    minWidth: 200,
  },
  editButton: {
    padding: 5,
    marginLeft: 10,
  },
  editActions: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
    gap: 12,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    minWidth: 100,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#F1F5F9",
  },
  confirmButton: {
    backgroundColor: primaryColor,
  },
  timerContainer: {
    marginTop: 20,
    marginBottom: 10,
  },
  timerText: {
    fontFamily: "JosefinSans_400Regular",
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
  },
  resendButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
    marginBottom: 20,
  },
  resendButtonText: {
    fontFamily: "JosefinSans_600SemiBold",
    fontSize: 16,
    color: primaryColor,
  },
  activationContainer: {
    alignItems: "center",
    marginTop: 10,
  },
  activationText: {
    fontFamily: "JosefinSans_400Regular",
    fontSize: 14,
    color: "#64748B",
    marginBottom: 12,
  },
  activationButton: {
    backgroundColor: accentColor,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: accentColor,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
    minWidth: 220,
  },
  activationButtonText: {
    fontFamily: "JosefinSans_600SemiBold",
    fontSize: 16,
    color: "white",
  },
  disabledButton: {
    opacity: 0.6,
  },
  loadingButton: {
    opacity: 0.8,
  },
  buttonText: {
    fontFamily: "JosefinSans_600SemiBold",
    fontSize: 16,
  },
});

export default VerificationScreen;