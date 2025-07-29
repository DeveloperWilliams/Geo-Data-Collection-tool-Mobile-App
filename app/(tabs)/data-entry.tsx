// app/data-entry.jsx
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from "expo-location";
import * as MediaLibrary from "expo-media-library";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as Animatable from "react-native-animatable";
import Svg, { Path, Rect } from "react-native-svg";
import { captureRef } from "react-native-view-shot";

const primaryColor = "#2C6BED";
const secondaryColor = "#1A56DB";
const accentColor = "#0E9F6E";
const lightBackground = "#F9FAFB";
const { height } = Dimensions.get("window");

// Predefined AB/2 and M.N values
const AB2_VALUES = [
  1.6, 2.0, 2.5, 3.2, 4.0, 5.0, 6.3, 8.0, 10.0, 13.0, 16.0, 16.0, 20.0, 25.0,
  32.0, 32.0, 40.0, 50.0, 63.0, 80.0, 100.0, 130.0, 160.0, 200.0, 250.0, 320.0,
];
const MN_VALUES = [
  0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 5.0, 5.0, 5.0, 5.0,
  10.0, 10.0, 10.0, 10.0, 10.0, 25.0, 25.0, 25.0, 25.0, 25.0, 25.0, 25.0,
];

// Key for AsyncStorage
const PROJECTS_STORAGE_KEY = "VES_PROJECTS";

const DataEntryScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const viewRef = useRef();
  const scrollRef = useRef();
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [currentVES, setCurrentVES] = useState(1);
  const [readings, setReadings] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [projectData, setProjectData] = useState({
    id: Date.now().toString(),
    name: params.projectName || "New Project",
    locationInfo: {
      village: params.village || "",
      sublocation: params.sublocation || "",
      location: params.location || "",
      ward: params.ward || "",
      subCounty: params.subCounty || "",
      county: params.county || "",
    },
    surveyData: {
      surveyType: params.surveyType || "",
      arrayType: params.arrayType || "",
      operator: params.operator || "",
    },
    vesPoints: [],
  });

  // Initialize readings
  useEffect(() => {
    const initialReadings = AB2_VALUES.map((ab2, index) => ({
      id: index,
      ab2,
      mn: MN_VALUES[index] || 0.5,
      resistivity: "",
      tdip: "",
      resistivityRef: React.createRef(),
      tdipRef: React.createRef(),
    }));
    setReadings(initialReadings);

    // Set up date/time updater
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 60000);

    // Load existing project if editing
    const loadProject = async () => {
      if (params.projectId) {
        try {
          const existingProjects = await AsyncStorage.getItem(PROJECTS_STORAGE_KEY);
          const projects = existingProjects ? JSON.parse(existingProjects) : [];
          const project = projects.find(p => p.id === params.projectId);
          
          if (project) {
            setProjectData(project);
            if (project.vesPoints.length > 0) {
              const maxId = Math.max(...project.vesPoints.map(v => v.id));
              setCurrentVES(maxId + 1);
            }
          }
        } catch (error) {
          console.error("Failed to load project:", error);
        }
      }
    };
    
    loadProject();

    return () => clearInterval(timer);
  }, []);

  // Format date for display
  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Format time for display
  const formatTime = (date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Handle input change
  const handleInputChange = (index, field, value) => {
    setReadings((prev) => {
      const newReadings = [...prev];
      newReadings[index][field] = value;
      return newReadings;
    });
  };

  // Save project data to AsyncStorage
  const saveProjectToStorage = async (project) => {
    try {
      const existingProjects = await AsyncStorage.getItem(PROJECTS_STORAGE_KEY);
      let projects = existingProjects ? JSON.parse(existingProjects) : [];
      
      // Check if project already exists
      const existingIndex = projects.findIndex(p => p.id === project.id);
      
      if (existingIndex !== -1) {
        projects[existingIndex] = project;
      } else {
        projects.push(project);
      }
      
      await AsyncStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
      return true;
    } catch (error) {
      console.error("Failed to save project:", error);
      return false;
    }
  };

  // Save current VES data
  const saveCurrentVES = async () => {
    setIsSaving(true);

    try {
      // Get current location for this VES
      let location = null;
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const position = await Location.getCurrentPositionAsync({});
        location = position.coords;
      }

      const now = new Date();
      const newVESPoint = {
        id: currentVES,
        date: now.toISOString(),
        location,
        readings: readings.map((r) => ({
          ab2: r.ab2,
          mn: r.mn,
          resistivity: r.resistivity,
          tdip: r.tdip,
        })),
      };

      // Update project data
      const updatedProject = {
        ...projectData,
        vesPoints: [...projectData.vesPoints, newVESPoint],
      };
      
      // Save to AsyncStorage
      const saveResult = await saveProjectToStorage(updatedProject);
      
      if (!saveResult) {
        throw new Error("Failed to save project data");
      }
      
      setProjectData(updatedProject);

      // Move to next VES
      setCurrentVES((prev) => prev + 1);

      // Reset readings for next VES
      setReadings((prev) =>
        prev.map((r) => ({ ...r, resistivity: "", tdip: "" }))
      );

      Alert.alert("Success", `VES${currentVES} saved successfully!`);
    } catch (error) {
      Alert.alert("Save Error", error.message || "Could not save VES data");
      console.error("Save error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Confirm save current VES
  const confirmSaveVES = () => {
    const hasData = readings.some(r => r.resistivity || r.tdip);
    
    if (!hasData) {
      Alert.alert("No Data", "Please enter some measurements before saving");
      return;
    }
    
    Alert.alert(
      "Save VES Point",
      `Are you sure you want to save VES${currentVES}?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Save", onPress: saveCurrentVES }
      ]
    );
  };

  // End project and go to home
  const endProject = async () => {
    setIsSaving(true);

    try {
      // Save current VES if data exists
      const hasData = readings.some((r) => r.resistivity || r.tdip);
      if (hasData) {
        await saveCurrentVES();
      }

      Alert.alert("Project Completed", "All data has been saved successfully!");
      router.push("/");
    } catch (error) {
      Alert.alert("Save Error", "Failed to save project data");
      console.error("End project error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Confirm end project
  const confirmEndProject = () => {
    const hasCurrentData = readings.some(r => r.resistivity || r.tdip);
    const vesCount = projectData.vesPoints.length;
    
    let message = "Are you sure you want to end this project?";
    if (hasCurrentData) {
      message += "\n\nUnsaved measurements for the current VES will be saved.";
    }
    if (vesCount > 0) {
      message += `\n\n${vesCount} VES point${vesCount === 1 ? "" : "s"} will be saved.`;
    }
    
    Alert.alert(
      "End Project",
      message,
      [
        { text: "Cancel", style: "cancel" },
        { text: "End Project", onPress: endProject }
      ]
    );
  };

  // Capture screenshot of entire screen
  const captureScreen = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission required",
          "Please allow access to save screenshots"
        );
        return;
      }

      const uri = await captureRef(viewRef, {
        format: "png",
        quality: 1.0,
        height: height * 2, // Capture full height
      });

      const asset = await MediaLibrary.createAssetAsync(uri);
      await MediaLibrary.createAlbumAsync("VES Surveys", asset, false);

      Alert.alert(
        "Screenshot Saved",
        "The screen capture has been saved to your gallery"
      );
    } catch (error) {
      console.error("Capture error:", error);
      Alert.alert("Error", "Failed to capture screen");
    }
  };

  // Render data table with scrollable body
  const renderDataTable = () => (
    <View style={localStyles.tableContainer}>
      {/* Fixed Table Header */}
      <View style={localStyles.tableRow}>
        <Text style={[localStyles.tableHeader, { flex: 0.8 }]}>AB/2 (m)</Text>
        <Text style={[localStyles.tableHeader, { flex: 0.8 }]}>M.N (m)</Text>
        <Text style={[localStyles.tableHeader, { flex: 1.2 }]}>
          Resistivity (Ω·m)
        </Text>
        <Text style={[localStyles.tableHeader, { flex: 1.2 }]}>TDIP</Text>
      </View>

      {/* Scrollable Table Body */}
      <ScrollView
        style={localStyles.tableBody}
        contentContainerStyle={{ paddingBottom: 20 }}
        ref={scrollRef}
      >
        {readings.map((row, rowIndex) => (
          <View key={row.id} style={localStyles.tableRow}>
            <Text
              style={[localStyles.tableCell, { flex: 0.8, fontWeight: "bold" }]}
            >
              {row.ab2}
            </Text>
            <Text
              style={[localStyles.tableCell, { flex: 0.8, fontWeight: "bold" }]}
            >
              {row.mn}
            </Text>

            <TextInput
              ref={row.resistivityRef}
              style={[localStyles.tableInput, { flex: 1.2 }]}
              value={row.resistivity}
              onChangeText={(value) =>
                handleInputChange(rowIndex, "resistivity", value)
              }
              keyboardType="decimal-pad"
              placeholder="0.0"
              placeholderTextColor="#94A3B8"
              returnKeyType="next"
              onSubmitEditing={() => {
                // Move to TDIP in same row
                row.tdipRef.current?.focus();
              }}
            />

            <TextInput
              ref={row.tdipRef}
              style={[localStyles.tableInput, { flex: 1.2 }]}
              value={row.tdip}
              onChangeText={(value) =>
                handleInputChange(rowIndex, "tdip", value)
              }
              keyboardType="decimal-pad"
              placeholder="0.0"
              placeholderTextColor="#94A3B8"
              returnKeyType={rowIndex === readings.length - 1 ? "done" : "next"}
              onSubmitEditing={() => {
                if (rowIndex < readings.length - 1) {
                  // Move to next row's resistivity
                  readings[rowIndex + 1].resistivityRef.current?.focus();
                  // Scroll to next row
                  scrollRef.current?.scrollTo({
                    y: (rowIndex + 1) * 60,
                    animated: true,
                  });
                } else {
                  Keyboard.dismiss();
                }
              }}
            />
          </View>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <ScrollView contentContainerStyle={localStyles.container} ref={viewRef}>
      {/* Header */}
      <View style={localStyles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={localStyles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={localStyles.headerTitle}>Data Collection</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Project Info Card */}
      <Animatable.View
        animation="fadeIn"
        duration={600}
        style={localStyles.infoCard}
      >
        <View style={localStyles.infoHeader}>
          <Svg width={40} height={40} viewBox="0 0 48 48">
            <Rect width="36" height="36" x="6" y="6" fill="#4F46E5" rx="4" />
            <Path fill="#fff" d="M18 14h12v4H18zm0 8h12v4H18zm0 8h8v4h-8z" />
          </Svg>
          <View>
            <Text style={localStyles.projectName}>{projectData.name}</Text>
            <Text style={localStyles.projectLocation}>
              {projectData.locationInfo.village},{" "}
              {projectData.locationInfo.county}
            </Text>
          </View>
        </View>

        <View style={localStyles.infoGrid}>
          <View style={localStyles.infoItem}>
            <Ionicons name="time-outline" size={20} color={secondaryColor} />
            <Text style={localStyles.infoLabel}>Date/Time:</Text>
            <Text style={localStyles.infoValue}>
              {formatDate(currentDateTime)} | {formatTime(currentDateTime)}
            </Text>
          </View>

          <View style={localStyles.infoItem}>
            <Ionicons name="layers-outline" size={20} color={secondaryColor} />
            <Text style={localStyles.infoLabel}>Current VES:</Text>
            <Text
              style={[
                localStyles.infoValue,
                { color: primaryColor, fontWeight: "bold" },
              ]}
            >
              VES{currentVES}
            </Text>
          </View>
        </View>

        <Text style={localStyles.locationNote}>
          Location will be captured automatically when saving VES
        </Text>
      </Animatable.View>

      {/* Data Table */}
      <Animatable.View
        animation="fadeInUp"
        delay={300}
        style={localStyles.dataCard}
      >
        <View style={localStyles.sectionHeader}>
          <Ionicons name="grid-outline" size={24} color={accentColor} />
          <Text style={localStyles.sectionTitle}>Survey Measurements</Text>
        </View>

        {renderDataTable()}

        <Text style={localStyles.tableNote}>
          Press "Next" after entering TDIP to automatically move to the next row
        </Text>
      </Animatable.View>

      {/* Action Buttons */}
      <View style={localStyles.actionContainer}>
        <TouchableOpacity
          style={[localStyles.actionButton, { backgroundColor: "#0E9F6E" }]}
          onPress={confirmSaveVES}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <>
              <Ionicons name="save-outline" size={20} color="white" />
              <Text style={localStyles.actionButtonText}>SAVE VES</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[localStyles.actionButton, { backgroundColor: "#2C6BED" }]}
          onPress={captureScreen}
        >
          <Ionicons name="camera-outline" size={20} color="white" />
          <Text style={localStyles.actionButtonText}>CAPTURE</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[localStyles.actionButton, { backgroundColor: "#EF4444" }]}
          onPress={confirmEndProject}
          disabled={isSaving}
        >
          <Ionicons name="checkmark-done-outline" size={20} color="white" />
          <Text style={localStyles.actionButtonText}>END PROJECT</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const localStyles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: lightBackground,
    paddingBottom: 30,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 50,
    backgroundColor: primaryColor,
  },
  backButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 10,
    padding: 5,
  },
  headerTitle: {
    fontFamily: "JosefinSans_700Bold",
    fontSize: 22,
    color: "white",
  },
  infoCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    margin: 20,
    marginTop: -10,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    paddingBottom: 15,
  },
  projectName: {
    fontFamily: "JosefinSans_700Bold",
    fontSize: 20,
    color: secondaryColor,
    marginLeft: 10,
  },
  projectLocation: {
    fontFamily: "JosefinSans_400Regular",
    fontSize: 14,
    color: "#64748B",
    marginLeft: 10,
    marginTop: 2,
  },
  infoGrid: {
    marginTop: 10,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  infoLabel: {
    fontFamily: "JosefinSans_600SemiBold",
    fontSize: 14,
    color: "#334155",
    marginLeft: 8,
    width: 100,
  },
  infoValue: {
    fontFamily: "JosefinSans_400Regular",
    fontSize: 14,
    color: "#475569",
    marginLeft: 5,
    flex: 1,
  },
  locationNote: {
    fontFamily: "JosefinSans_400Regular",
    fontSize: 12,
    color: "#64748B",
    marginTop: 10,
    fontStyle: "italic",
  },
  dataCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    fontFamily: "JosefinSans_700Bold",
    fontSize: 18,
    color: primaryColor,
    marginLeft: 10,
  },
  tableContainer: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 10,
    maxHeight: height * 0.5,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    minHeight: 60,
    alignItems: "center",
    paddingHorizontal: 5,
  },
  tableHeader: {
    fontFamily: "JosefinSans_700Bold",
    fontSize: 14,
    color: "#1E293B",
    paddingVertical: 12,
    paddingHorizontal: 5,
    backgroundColor: "#F1F5F9",
    textAlign: "center",
  },
  tableBody: {
    flexGrow: 1,
  },
  tableCell: {
    fontFamily: "JosefinSans_400Regular",
    fontSize: 14,
    color: "#334155",
    paddingVertical: 12,
    paddingHorizontal: 5,
    textAlign: "center",
  },
  tableInput: {
    fontFamily: "JosefinSans_500Medium",
    fontSize: 16,
    color: primaryColor,
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    padding: 10,
    textAlign: "center",
    marginHorizontal: 2,
    minWidth: 0,
  },
  tableNote: {
    fontFamily: "JosefinSans_400Regular",
    fontSize: 12,
    color: "#64748B",
    marginTop: 10,
    textAlign: "center",
  },
  actionContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 20,
    flexWrap: "wrap",
    gap: 10,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    minWidth: 150,
    justifyContent: "center",
    flex: 1,
  },
  actionButtonText: {
    fontFamily: "JosefinSans_600SemiBold",
    fontSize: 15,
    color: "white",
    marginLeft: 8,
  },
});

export default DataEntryScreen;