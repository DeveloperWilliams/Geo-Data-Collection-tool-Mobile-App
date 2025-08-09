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
import Svg, { Circle, G, Path, Rect } from "react-native-svg";

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
    arrayType: "",
    operator: "",
  });

  const handleStartSurvey = () => {
    setIsLoading(true);
    
    const allLocationFields = Object.values(locationInfo).every(
      (v) => v.trim() !== ""
    );
    const allSurveyFields =
      surveyData.surveyType !== "" && surveyData.operator !== "";

    if (projectName.trim() !== "" && allLocationFields && allSurveyFields) {
      router.push({
        pathname: "/data-entry",
        params: {
          projectName,
          ...locationInfo,
          ...surveyData
        },
      });
    } else {
      Alert.alert("Missing Fields", "Please fill all required information");
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
              <Text style={localStyles.label}>{item.label} *</Text>
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

  const ProjectSetupIllustration = () => (
    <Svg width={80} height={80} viewBox="0 0 64 64">
      <G fill={primaryColor}>
        <Rect x="10" y="10" width="44" height="44" rx="4" fill="#A4CAFE" />
        <Rect x="14" y="14" width="36" height="36" rx="2" fill="white" />
        <Circle cx="32" cy="28" r="6" fill={accentColor} />
        <Rect x="24" y="38" width="16" height="4" rx="2" fill={secondaryColor} />
        <Rect x="20" y="46" width="24" height="4" rx="2" fill={secondaryColor} />
      </G>
      <G fill={primaryColor}>
        <Path
          d="M54,10 L54,6 L58,6 L58,10 L54,10 Z M50,14 L50,10 L54,10 L54,14 L50,14 Z"
          fill={accentColor}
        />
        <Path d="M58,14 L54,14 L54,18 L58,18 L58,14 Z" fill="#0E9F6E" />
      </G>
    </Svg>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: lightBackground }}
    >
      <ScrollView
        contentContainerStyle={localStyles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={localStyles.header}>
          <Svg
            height="100%"
            width="100%"
            viewBox="0 0 1440 320"
            style={localStyles.headerWave}
          >
            <Path
              fill={primaryColor}
              fillOpacity="1"
              d="M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,267,576,261.3C672,256,768,224,864,218.7C960,213,1056,235,1152,234.7C1248,235,1344,213,1392,202.7L1440,192L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"
            ></Path>
          </Svg>
          
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
          <View style={localStyles.cardHeader}>
            <ProjectSetupIllustration />
            <View style={localStyles.cardTextContainer}>
              <Text style={localStyles.cardTitle}>Configure New Project</Text>
              <Text style={localStyles.cardSubtitle}>
                Enter project details to begin geophysical data collection
              </Text>
            </View>
          </View>

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
            <Text style={localStyles.sectionTitle}>Project Area Location</Text>
          </View>

          {renderLocationFields()}

          <View style={localStyles.sectionHeader}>
            <View style={localStyles.sectionIcon}>
              <Ionicons name="analytics" size={20} color="white" />
            </View>
            <Text style={localStyles.sectionTitle}>Survey Data</Text>
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
                {["VES", "Array"].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      localStyles.typeButton,
                      surveyData.surveyType === type &&
                        localStyles.selectedButton,
                    ]}
                    onPress={() => handleSurveyChange("surveyType", type)}
                  >
                    <Text
                      style={[
                        localStyles.buttonTextSmall,
                        surveyData.surveyType === type && { color: "white" },
                      ]}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {surveyData.surveyType === "Array" && (
              <View
                style={[localStyles.paramItem, isTablet && { width: "48%" }]}
              >
                <View style={localStyles.paramLabelContainer}>
                  <Ionicons
                    name="layers-outline"
                    size={18}
                    color={secondaryColor}
                  />
                  <Text style={localStyles.label}>Array Type *</Text>
                </View>
                <View style={localStyles.buttonGroup}>
                  {["Schlumberger", "Wenner", "Pole-Dipole"].map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        localStyles.typeButton,
                        surveyData.arrayType === type &&
                          localStyles.selectedButton,
                      ]}
                      onPress={() => handleSurveyChange("arrayType", type)}
                    >
                      <Text
                        style={[
                          localStyles.buttonTextSmall,
                          surveyData.arrayType === type && { color: "white" },
                        ]}
                      >
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

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

        <Svg
          width="100%"
          height={80}
          viewBox="0 0 1440 140"
          style={localStyles.wave}
        >
          <Path
            fill={primaryColor}
            fillOpacity="0.1"
            d="M0,64L80,74.7C160,85,320,107,480,101.3C640,96,800,64,960,53.3C1120,43,1280,53,1360,58.7L1440,64L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z"
          ></Path>
        </Svg>
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
    height: 180,
    marginBottom: 20,
  },
  headerWave: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
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
    textShadowColor: "rgba(0,0,0,0.1)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 25,
    marginHorizontal: 20,
    marginTop: -40,
    elevation: 12,
    shadowColor: primaryColor,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    zIndex: 10,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 25,
  },
  cardTextContainer: {
    flex: 1,
    marginLeft: 15,
  },
  cardTitle: {
    fontFamily: "JosefinSans_700Bold",
    fontSize: 24,
    color: primaryColor,
    marginBottom: 5,
  },
  cardSubtitle: {
    fontFamily: "JosefinSans_400Regular",
    fontSize: 16,
    color: "#64748B",
    lineHeight: 22,
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
    opacity: 0.8,
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
  wave: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 0,
  },
});

export default ProjectSetupScreen;