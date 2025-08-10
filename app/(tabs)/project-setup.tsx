// app/project-setup.jsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
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

const primaryColor = "#2C6BED";
const secondaryColor = "#1A56DB";
const accentColor = "#0E9F6E";
const lightBackground = "#F9FAFB";

const ProjectSetupScreen = () => {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const [isLoading, setIsLoading] = useState(false);

  const [projectName, setProjectName] = useState("");
  const [locationInfo, setLocationInfo] = useState({
    village: "",
    sublocation: "",
    location: "",
    ward: "",
    subCounty: "",
    county: "",
  });
  const [surveyData, setSurveyData] = useState({
    surveyType: "",
    arrayType: "Schlumberger",
    operator: "",
  });

  const handleStartSurvey = () => {
    setIsLoading(true);
    
    if (projectName.trim() !== "" && surveyData.surveyType !== "" && surveyData.operator.trim() !== "") {
      router.push({
        pathname: "/data-entry",
        params: {
          projectName,
          ...locationInfo,
          ...surveyData
        },
      });
    } else {
      Alert.alert("Missing Fields", "Please fill required information");
      setIsLoading(false);
    }
  };

  interface LocationInfo {
    village: string;
    sublocation: string;
    location: string;
    ward: string;
    subCounty: string;
    county: string;
  }

  interface SurveyData {
    surveyType: string;
    arrayType: string;
    operator: string;
  }

  const handleLocationChange = (field: keyof LocationInfo, value: string) => {
    setLocationInfo((prev: LocationInfo) => ({ ...prev, [field]: value }));
  };

  interface SurveyChangeField {
    surveyType: string;
    arrayType: string;
    operator: string;
  }

  const handleSurveyChange = <K extends keyof SurveyChangeField>(
    field: K,
    value: SurveyChangeField[K]
  ) => {
    setSurveyData((prev: SurveyData) => ({ ...prev, [field]: value }));
  };

  const renderLocationFields = () => {
    const fields = [
      { label: "Village", field: "village", icon: "location-outline" },
      { label: "Sublocation", field: "sublocation", icon: "map-outline" },
      { label: "Location", field: "location", icon: "navigate-outline" },
      { label: "Ward", field: "ward", icon: "business-outline" },
      { label: "Sub-County", field: "subCounty", icon: "copy-outline" },
      { label: "County", field: "county", icon: "earth-outline" },
    ];

    return (
      <View
        style={[localStyles.paramGrid, !isTablet && localStyles.singleColumn]}
      >
        {fields.map((item, index) => (
          <View
            style={[localStyles.paramItem, isTablet && { width: "48%" }]}
            key={index}
          >
            <View style={localStyles.paramLabelContainer}>
              {/* @ts-ignore */}
              <Ionicons name={item.icon} size={18} color={secondaryColor} />
              <Text style={localStyles.label}>{item.label} </Text>
            </View>
            <TextInput
              style={localStyles.input}
              value={locationInfo[item.field as keyof typeof locationInfo]}
              onChangeText={(t) => handleLocationChange(item.field as keyof typeof locationInfo, t)}
              placeholder={`Enter ${item.label.toLowerCase()}`}
              placeholderTextColor="#94A3B8"
            />
          </View>
        ))}
      </View>
    );
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
        {/* Solid Blue Header */}
        <View style={localStyles.header}>
          <View style={localStyles.headerContent}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={localStyles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text style={localStyles.headerTitle}>Project Setup</Text>
            <View style={{ width: 24 }} />
          </View>
        </View>

        <Animatable.View
          animation="fadeInUp"
          duration={600}
          style={localStyles.card}
        >
          <View style={localStyles.inputGroup}>
            <View style={localStyles.labelContainer}>
              <Ionicons name="folder-outline" size={18} color={secondaryColor} />
              <Text style={localStyles.label}>Project Name *</Text>
            </View>
            <TextInput
              style={localStyles.input}
              value={projectName}
              onChangeText={setProjectName}
              placeholder="Enter project name"
              placeholderTextColor="#94A3B8"
            />
          </View>

          <View style={localStyles.sectionHeader}>
            <View style={localStyles.sectionIcon}>
              <Ionicons name="location" size={20} color="white" />
            </View>
            <Text style={localStyles.sectionTitle}>Project Location</Text>
          </View>
          <Text style={localStyles.optionalText}>(Optional fields)</Text>

          {renderLocationFields()}

          <View style={localStyles.sectionHeader}>
            <View style={localStyles.sectionIcon}>
              <Ionicons name="analytics" size={20} color="white" />
            </View>
            <Text style={localStyles.sectionTitle}>Survey Setup</Text>
          </View>

          <View
            style={[
              localStyles.paramGrid,
              !isTablet && localStyles.singleColumn,
            ]}
          >
            <View style={[localStyles.paramItem, isTablet && { width: "48%" }]}>
              <View style={localStyles.paramLabelContainer}>
                <Ionicons
                  name="analytics-outline"
                  size={18}
                  color={secondaryColor}
                />
                <Text style={localStyles.label}>Survey Type *</Text>
              </View>
              <View style={localStyles.buttonGroup}>
                {["VES", "Profile"].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      localStyles.typeButton,
                      surveyData.surveyType === type && localStyles.selectedButton,
                      type !== "VES" && localStyles.disabledButton
                    ]}
                    onPress={() => type === "VES" && handleSurveyChange("surveyType", type)}
                    disabled={type !== "VES"}
                  >
                    <Text
                      style={[
                        localStyles.buttonTextSmall,
                        surveyData.surveyType === type && { color: "white" },
                        type !== "VES" && { color: "#CBD5E1" }
                      ]}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={[localStyles.paramItem, isTablet && { width: "48%" }]}>
              <View style={localStyles.paramLabelContainer}>
                <Ionicons
                  name="layers-outline"
                  size={18}
                  color={secondaryColor}
                />
                <Text style={localStyles.label}>Array Type</Text>
              </View>
              <View style={localStyles.buttonGroup}>
                {[
                  "Schlumberger",
                  "Wenner",
                  "Pole-Dipole",
                  "Dipole-Dipole",
                  "Pole-Pole",
                  "Gradient",
                  "Square",
                  "Equatorial",
                ].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      localStyles.typeButton,
                      surveyData.arrayType === type && localStyles.selectedButton,
                      type !== "Schlumberger" && localStyles.disabledButton
                    ]}
                    onPress={() => type === "Schlumberger" && handleSurveyChange("arrayType", type)}
                    disabled={type !== "Schlumberger"}
                  >
                    <Text
                      style={[
                        localStyles.buttonTextSmall,
                        surveyData.arrayType === type && { color: "white" },
                        type !== "Schlumberger" && { color: "#CBD5E1" }
                      ]}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={[localStyles.paramItem, isTablet && { width: "48%" }]}>
              <View style={localStyles.paramLabelContainer}>
                <Ionicons
                  name="person-outline"
                  size={18}
                  color={secondaryColor}
                />
                <Text style={localStyles.label}>Operator *</Text>
              </View>
              <TextInput
                style={localStyles.input}
                value={surveyData.operator}
                onChangeText={(t) => handleSurveyChange("operator", t)}
                placeholder="Enter operator's name"
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>

          <TouchableOpacity
            style={[
              localStyles.primaryButton,
              isLoading && localStyles.disabledButton,
            ]}
            onPress={handleStartSurvey}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <>
                <Text style={localStyles.buttonText}>Start Survey</Text>
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
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const localStyles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: lightBackground,
    paddingBottom: 20,
  },
  header: {
    backgroundColor: primaryColor,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 50,
  },
  backButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 10,
    padding: 8,
  },
  headerTitle: {
    fontFamily: "JosefinSans_700Bold",
    fontSize: 24,
    color: "white",
    textAlign: "center",
  },
  card: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 25,
    marginHorizontal: 20,
    marginTop: 10,
    elevation: 12,
    shadowColor: primaryColor,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
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
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: "#F1F5F9",
  },
  optionalText: {
    fontFamily: "JosefinSans_400Regular",
    fontSize: 14,
    color: "#64748B",
    marginLeft: 48,
    marginTop: -15,
    marginBottom: 10,
  },
  sectionIcon: {
    backgroundColor: accentColor,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  sectionTitle: {
    fontFamily: "JosefinSans_700Bold",
    fontSize: 20,
    color: primaryColor,
  },
  paramGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  singleColumn: {
    flexDirection: "column",
  },
  paramItem: {
    marginBottom: 22,
    width: "100%",
  },
  paramLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  primaryButton: {
    backgroundColor: primaryColor,
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    elevation: 4,
    shadowColor: primaryColor,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    fontFamily: "JosefinSans_600SemiBold",
    fontSize: 18,
    color: "white",
  },
  buttonGroup: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 10,
  },
  typeButton: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginRight: 12,
    marginBottom: 12,
  },
  selectedButton: {
    backgroundColor: secondaryColor,
    borderColor: secondaryColor,
  },
  buttonTextSmall: {
    fontFamily: "JosefinSans_500Medium",
    fontSize: 15,
    color: "#475569",
  },
});

export default ProjectSetupScreen;