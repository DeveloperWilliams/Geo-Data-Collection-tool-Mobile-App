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
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import * as Animatable from "react-native-animatable";
import Svg, { G, Line, Path, Rect, Text as SvgText } from "react-native-svg";
import { captureRef } from "react-native-view-shot";

const primaryColor = "#2C6BED";
const secondaryColor = "#1A56DB";
const accentColor = "#0E9F6E";
const lightBackground = "#F9FAFB";
const { height, width } = Dimensions.get("window");

// To this:
const READINGS_GROUPS = [
  {
    mn2: 0.5,
    ab2Values: [1.6, 2.0, 2.5, 3.2, 4.0, 5.0, 6.3, 8.0, 10.0, 13.0, 16.0]
  },
  {
    mn2: 5,
    ab2Values: [16.0, 20.0, 25.0, 32.0]
  },
  {
    mn2: 10,
    ab2Values: [32.0, 40.0, 50.0, 63.0, 80.0]
  },
  {
    mn2: 25,
    ab2Values: [80.0, 100.0, 130.0, 160.0, 200.0, 250.0, 320.0]
  }
];

// Key for AsyncStorage
const PROJECTS_STORAGE_KEY = "VES_PROJECTS";

// Graph component
type VESGraphProps = {
  data: { x: number; y: number }[];
  title: string;
  color: string;
  width: number;
  height: number;
};

const VESGraph: React.FC<VESGraphProps> = ({ data, title, color, width, height }) => {
  if (!data || data.length === 0) {
    return (
      <View style={[localStyles.graphContainer, { width, height }]}>
        <Text style={localStyles.graphTitle}>{title}</Text>
        <Text style={localStyles.noDataText}>No data available</Text>
      </View>
    );
  }

  const padding = 40;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  // Get min/max values from actual data
  const xValues = data.map(d => d.x);
  const yValues = data.map(d => d.y);
  
  // Calculate min/max with padding
  const xMin = Math.max(0.1, Math.min(...xValues) * 0.9);
  const xMax = Math.max(...xValues) * 1.1;

  // For Y-axis, we need to ensure we capture the full range properly
  let yMin = Math.max(0.1, Math.min(...yValues));
  let yMax = Math.max(...yValues);
  
  // If all values are the same, create some range
  if (yMin === yMax) {
    yMin = yMax * 0.5;
    yMax = yMax * 1.5;
  } else {
    // Add 20% padding
    yMin = yMin * 0.8;
    yMax = yMax * 1.2;
  }

  // Ensure we have at least one order of magnitude range
  const logRange = Math.log10(yMax) - Math.log10(yMin);
  if (logRange < 1) {
    const mid = Math.sqrt(yMin * yMax); // Geometric mean
    yMin = mid / 2;
    yMax = mid * 2;
  }

  // Scale functions for logarithmic axes
  const scaleX = (x: number) => padding + ((Math.log10(x) - Math.log10(xMin)) / (Math.log10(xMax) - Math.log10(xMin))) * chartWidth;
  const scaleY = (y: number) => padding + chartHeight - ((Math.log10(y) - Math.log10(yMin)) / (Math.log10(yMax) - Math.log10(yMin))) * chartHeight;

  // Generate X-axis labels
  const xAxisLabels = [];
  for (let exponent = Math.floor(Math.log10(xMin)); exponent <= Math.ceil(Math.log10(xMax)); exponent++) {
    const value = Math.pow(10, exponent);
    if (value >= xMin && value <= xMax) {
      xAxisLabels.push({
        value,
        position: scaleX(value)
      });
    }
  }

  // Y-axis label generation
  let yAxisLabels = [];
  const minExponent = Math.floor(Math.log10(yMin));
  const maxExponent = Math.ceil(Math.log10(yMax));

  // First add the decade marks
  for (let exponent = minExponent; exponent <= maxExponent; exponent++) {
    const decade = Math.pow(10, exponent);
    if (decade >= yMin && decade <= yMax) {
      yAxisLabels.push({
        value: decade,
        position: scaleY(decade)
      });
    }
  }

  // Then add intermediate values if the range is small
  if ((maxExponent - minExponent) <= 2) {
    for (let exponent = minExponent; exponent <= maxExponent; exponent++) {
      const base = Math.pow(10, exponent);
      for (let multiplier of [2, 3, 4, 5, 6, 7, 8, 9]) {
        const value = base * multiplier;
        if (value > yMin && value < yMax) {
          yAxisLabels.push({
            value,
            position: scaleY(value)
          });
        }
      }
    }
  }

  // Sort the labels by value
  yAxisLabels.sort((a, b) => a.value - b.value);

  // Limit the number of labels to prevent overcrowding
  const MAX_LABELS = 8;
  if (yAxisLabels.length > MAX_LABELS) {
    const step = Math.ceil(yAxisLabels.length / MAX_LABELS);
    yAxisLabels = yAxisLabels.filter((_, i) => i % step === 0);
  }

  return (
    <View style={[localStyles.graphContainer, { width, height }]}>
      <Text style={localStyles.graphTitle}>{title}</Text>
      <Svg width={width} height={height}>
        {/* Axes */}
        <Line
          x1={padding}
          y1={padding + chartHeight}
          x2={padding + chartWidth}
          y2={padding + chartHeight}
          stroke="#000"
          strokeWidth={1}
        />
        <Line
          x1={padding}
          y1={padding}
          x2={padding}
          y2={padding + chartHeight}
          stroke="#000"
          strokeWidth={1}
        />

        {/* Grid lines */}
        {xAxisLabels.map((label, index) => (
          <G key={`x-${index}`}>
            <Line
              x1={label.position}
              y1={padding}
              x2={label.position}
              y2={padding + chartHeight}
              stroke="#000"
              strokeWidth={0.5}
              strokeDasharray="4,4"
            />
            <SvgText
              x={label.position}
              y={padding + chartHeight + 15}
              textAnchor="middle"
              fontSize="10"
              fill="#000"
            >
              {label.value}
            </SvgText>
          </G>
        ))}

        {yAxisLabels.map((label, index) => (
          <G key={`y-${index}`}>
            <Line
              x1={padding}
              y1={label.position}
              x2={padding + chartWidth}
              y2={label.position}
              stroke="#000"
              strokeWidth={0.5}
              strokeDasharray="4,4"
            />
            <SvgText
              x={padding - 10}
              y={label.position + 4}
              textAnchor="end"
              fontSize="10"
              fill="#000"
            >
              {label.value >= 1000 ? `${(label.value/1000).toFixed(label.value % 1000 === 0 ? 0 : 1)}k` : label.value}
            </SvgText>
          </G>
        ))}

        {/* Data points and line */}
        {data.map((point, index) => {
          if (index === 0) return null;
          
          return (
            <G key={`point-${index}`}>
              <Line
                x1={scaleX(data[index - 1].x)}
                y1={scaleY(data[index - 1].y)}
                x2={scaleX(point.x)}
                y2={scaleY(point.y)}
                stroke={color}
                strokeWidth={2}
              />
              <Rect
                x={scaleX(point.x) - 3}
                y={scaleY(point.y) - 3}
                width={3}
                height={3}
                fill="#FF0000"
                stroke="#FF0000" 
                strokeWidth={2}
              />
            </G>
          );
        })}

        {/* Axis titles */}
        <SvgText
          x={width / 2}
          y={height - 5}
          textAnchor="middle"
          fontSize="12"
          fontWeight="bold"
          fill="#000"
        >
          AB/2 (m)
        </SvgText>
        <SvgText
          x={10}
          y={height / 2}
          textAnchor="middle"
          fontSize="12"
          fontWeight="bold"
          fill="#000"
          transform={`rotate(-90, 10, ${height / 2})`}
        >
          {title.includes("Resistivity") ? "Resistivity (Ω·m)" : "TDIP"}
        </SvgText>
      </Svg>
    </View>
  );
};

const DataEntryScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const viewRef = useRef<ScrollView>(null);
  const graphRef = useRef<View>(null);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [currentVES, setCurrentVES] = useState(1);
  const [readings, setReadings] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("Resistivity");
  const [azimuth, setAzimuth] = useState("");
  const [description, setDescription] = useState("");
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

  // Calculate K factor
  const calculateK = (ab2: number, mn2: number) => {
    const numerator = Math.pow(ab2, 2) - Math.pow(mn2, 2);
    if (numerator <= 0) return "";
    const k = (Math.PI * numerator) / (2 * mn2);
    return k.toFixed(2);
  };

  // Initialize readings grouped by MN/2
  useEffect(() => {
    const loadProject = async () => {
      try {
        // Set VES number if coming from "Continue Project"
        if (params.nextVES) {
          setCurrentVES(parseInt(params.nextVES.toString()));
        }

        // Load existing project data if provided
        if (params.projectId && params.existingProject === "true") {
          const existingProjects = await AsyncStorage.getItem(PROJECTS_STORAGE_KEY);
          const projects = existingProjects ? JSON.parse(existingProjects) : [];
          const project = projects.find((p: any) => p.id === params.projectId);
          
          if (project) {
            setProjectData(project);
          }
        }
      } catch (error) {
        console.error("Failed to load project:", error);
      }
    };
    
    loadProject();

    // Initialize readings
    const initialReadings: any[] = [];
    let idCounter = 0;
    
    READINGS_GROUPS.forEach(group => {
      group.ab2Values.forEach(ab2 => {
        initialReadings.push({
          id: idCounter++,
          ab2,
          mn2: group.mn2,
          k: calculateK(ab2, group.mn2),
          resistivity: "",
          tdip: "",
          resistivityRef: React.createRef(),
          tdipRef: React.createRef(),
        });
      });
    });
    
    setReadings(initialReadings);

    // Set up date/time updater
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, [params.projectId, params.existingProject, params.nextVES]);

  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Format time for display
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Handle input change
  const handleInputChange = (index: number, field: string, value: string) => {
    setReadings((prev: any[]) => {
      const newReadings = [...prev];
      newReadings[index][field] = value;

      // Recalculate K when AB/2 or MN/2 changes
      if (field === "ab2" || field === "mn2") {
        const ab2Val = field === "ab2" ? parseFloat(value) : newReadings[index].ab2;
        const mn2Val = field === "mn2" ? parseFloat(value) : newReadings[index].mn2;
        
        if (!isNaN(ab2Val) && !isNaN(mn2Val)) {
          newReadings[index].k = calculateK(ab2Val, mn2Val);
        }
      }

      return newReadings;
    });
  };

  // Prepare graph data
  const getGraphData = () => {
    const resistivityData: any[] = [];
    const tdipData: any[] = [];
    
    readings.forEach((reading) => {
      if (reading.resistivity) {
        resistivityData.push({
          x: reading.ab2,
          y: parseFloat(reading.resistivity) || 0
        });
      }
      
      if (reading.tdip) {
        tdipData.push({
          x: reading.ab2,
          y: parseFloat(reading.tdip) || 0
        });
      }
    });
    
    return { resistivityData, tdipData };
  };

  // Save project data to AsyncStorage
  const saveProjectToStorage = async (project: any) => {
    try {
      const existingProjects = await AsyncStorage.getItem(PROJECTS_STORAGE_KEY);
      let projects: any[] = existingProjects ? JSON.parse(existingProjects) : [];
      
      // Check if project already exists
      const existingIndex = projects.findIndex((p: any) => p.id === project.id);
      
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
      // Validate mandatory fields
      if (!azimuth.trim() || !description.trim()) {
        Alert.alert("Missing Information", "Azimuth and Description are required fields");
        setIsSaving(false);
        return;
      }

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
        azimuth,
        description,
        readings: readings.map((r) => ({
          ab2: r.ab2,
          mn2: r.mn2,
          k: r.k,
          resistivity: r.resistivity,
          tdip: r.tdip,
        })),
      };

      // Update project data
      let updatedProject;
      
      if (params.existingProject === "true") {
        // For existing project, add to existing VES points
        updatedProject = {
          ...projectData,
          vesPoints: [...projectData.vesPoints, newVESPoint],
        };
      } else {
        // For new project, create new array with this VES point
        updatedProject = {
          ...projectData,
          vesPoints: [newVESPoint],
        };
      }
      
      // Save to AsyncStorage
      const saveResult = await saveProjectToStorage(updatedProject);
      
      if (!saveResult) {
        throw new Error("Failed to save project data");
      }

      // @ts-ignore
      setProjectData(updatedProject);

      // Reset form for next VES
      setReadings((prev) =>
        prev.map((r) => ({ ...r, resistivity: "", tdip: "" }))
      );
      setAzimuth("");
      setDescription("");
      
      if (params.existingProject === "true") {
        // For existing project, increment VES number
        setCurrentVES((prev) => prev + 1);
        Alert.alert("Success", `VES${currentVES} saved successfully!`);
      } else {
        // For new project, go to home screen
        Alert.alert("Success", "Project created successfully!");
        router.push("/");
      }
    } catch (error: any) {
      Alert.alert("Save Error", error.message || "Could not save VES data");
      console.error("Save error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Confirm save current VES
  const confirmSaveVES = () => {
    // Check if mandatory fields are filled
    if (!azimuth.trim() || !description.trim()) {
      Alert.alert("Missing Information", "Azimuth and Description are required fields");
      return;
    }

    // Check if there's any data to save
    const hasData = readings.some((r: any) => r.resistivity || r.tdip);
    
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
      // Save current VES if data exists and mandatory fields are filled
      const hasData = readings.some((r: any) => r.resistivity || r.tdip);
      if (hasData && azimuth.trim() && description.trim()) {
        await saveCurrentVES();
      }

      Alert.alert(
        "Project Completed", 
        params.existingProject === "true" 
          ? "All data has been saved successfully!" 
          : "Project has been created successfully!"
      );
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
    const hasCurrentData = readings.some((r: any) => r.resistivity || r.tdip);
    const vesCount = projectData.vesPoints.length;
    
    let message = params.existingProject === "true" 
      ? "Are you sure you want to end this project?" 
      : "Are you sure you want to create this project?";
      
    if (hasCurrentData) {
      message += "\n\nUnsaved measurements for the current VES will be saved.";
    }
    if (vesCount > 0) {
      message += `\n\n${vesCount} VES point${vesCount === 1 ? "" : "s"} will be saved.`;
    }
    
    Alert.alert(
      params.existingProject === "true" ? "End Project" : "Create Project",
      message,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Confirm", onPress: endProject }
      ]
    );
  };

  // Capture screenshot of graph
  const captureGraph = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission required",
          "Please allow access to save graphs"
        );
        return;
      }

      const uri = await captureRef(graphRef, {
        format: "png",
        quality: 1.0,
      });

      const asset = await MediaLibrary.createAssetAsync(uri);
      await MediaLibrary.createAlbumAsync("VES Graphs", asset, false);

      Alert.alert(
        "Graph Saved",
        `The ${activeTab} graph for VES${currentVES} has been saved to your gallery`
      );
    } catch (error) {
      console.error("Capture error:", error);
      Alert.alert("Error", "Failed to save graph");
    }
  };

  // Render data table grouped by MN/2
  const renderDataTable = () => {
    // Group readings by MN/2
    const groups: Record<number, any[]> = {};
    
    readings.forEach((reading: any) => {
      if (!groups[reading.mn2]) {
        groups[reading.mn2] = [];
      }
      groups[reading.mn2].push(reading);
    });

    // Sort the groups by MN/2 in the order we want
    const sortedGroups = Object.entries(groups).sort((a, b) => {
      const order = [0.5, 5, 10, 25];
      return order.indexOf(parseFloat(a[0])) - order.indexOf(parseFloat(b[0]));
    });

    return (
      <View style={localStyles.tableContainer}>
        {/* Fixed Table Header */}
        <View style={localStyles.tableRow}>
          <Text style={[localStyles.tableHeader, { flex: 0.7 }]}>AB/2 (m)</Text>
          <Text style={[localStyles.tableHeader, { flex: 0.7 }]}>MN/2 (m)</Text>
          <Text style={[localStyles.tableHeader, { flex: 1 }]}>K</Text>
          <Text style={[localStyles.tableHeader, { flex: 1.2 }]}>
            Resistivity (Ω·m)
          </Text>
          <Text style={[localStyles.tableHeader, { flex: 1.2 }]}>TDIP</Text>
        </View>

        {/* Table Body - Grouped by MN/2 */}
        {sortedGroups.map(([mn2, groupReadings]) => (
          <View key={mn2}>
            <View style={localStyles.groupHeader}>
              <Text style={localStyles.groupHeaderText}>MN/2: {mn2}m</Text>
            </View>
            
            {groupReadings.map((row, rowIndex) => (
              <View key={row.id} style={localStyles.tableRow}>
                <Text style={[localStyles.tableCell, { flex: 0.7 }]}>
                  {row.ab2}
                </Text>
                <Text style={[localStyles.tableCell, { flex: 0.7 }]}>
                  {row.mn2}
                </Text>
                <Text style={[localStyles.tableCell, { flex: 1 }]}>
                  {row.k}
                </Text>
                <TextInput
                  style={[localStyles.tableInput, { flex: 1.2 }]}
                  value={row.resistivity}
                  onChangeText={(value) =>
                    handleInputChange(
                      readings.findIndex((r) => r.id === row.id),
                      "resistivity",
                      value
                    )
                  }
                  placeholder="Ω·m"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  ref={row.resistivityRef}
                  returnKeyType="next"
                  blurOnSubmit={false}
                  onSubmitEditing={() => {
                    row.tdipRef?.current?.focus();
                  }}
                />
                <TextInput
                  style={[localStyles.tableInput, { flex: 1.2 }]}
                  value={row.tdip}
                  onChangeText={(value) =>
                    handleInputChange(
                      readings.findIndex((r) => r.id === row.id),
                      "tdip",
                      value
                    )
                  }
                  placeholder="TDIP"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  ref={row.tdipRef}
                  returnKeyType="done"
                />
              </View>
            ))}
          </View>
        ))}
      </View>
    );
  };

  const { resistivityData, tdipData } = getGraphData();
  const graphWidth = width - 40;
  const graphHeight = 300;

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
              {projectData.locationInfo.village || "No location"}, 
              {projectData.locationInfo.county ? ` ${projectData.locationInfo.county}` : ""}
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
        
        {/* Azimuth and Description Fields */}
        <View style={localStyles.mandatoryFieldsContainer}>
          <View style={localStyles.fieldRow}>
            <Ionicons name="compass-outline" size={20} color={secondaryColor} />
            <Text style={localStyles.fieldLabel}>Azimuth (Degree) *</Text>
            <TextInput
              style={localStyles.fieldInput}
              value={azimuth}
              onChangeText={setAzimuth}
              placeholder="Enter azimuth"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              returnKeyType="next"
              onSubmitEditing={() => {
                // Focus description field when done
                viewRef.current?.scrollToEnd();
              }}
            />
          </View>
          
          <View style={localStyles.fieldRow}>
            <Ionicons name="document-text-outline" size={20} color={secondaryColor} />
            <Text style={localStyles.fieldLabel}>Description *</Text>
            <TextInput
              style={[localStyles.fieldInput, { height: 70 }]}
              value={description}
              onChangeText={setDescription}
              placeholder="Enter site description"
              placeholderTextColor="#94A3B8"
              multiline
              returnKeyType="done"
            />
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
          <Text style={localStyles.sectionTitle}>Resistivity/IP Data</Text>
        </View>

        {renderDataTable()}
      </Animatable.View>

      {/* Graph Section */}
      <Animatable.View
        animation="fadeInUp"
        delay={500}
        style={localStyles.graphCard}
      >
        <View style={localStyles.sectionHeader}>
          <Ionicons name="analytics-outline" size={24} color={accentColor} />
          <Text style={localStyles.sectionTitle}>RES-IP Curve</Text>
        </View>
        
        {/* Graph Tabs */}
        <View style={localStyles.tabContainer}>
          <TouchableOpacity
            style={[
              localStyles.tabButton,
              activeTab === "Resistivity" && localStyles.activeTab
            ]}
            onPress={() => setActiveTab("Resistivity")}
          >
            <Text style={[
              localStyles.tabText,
              activeTab === "Resistivity" && localStyles.activeTabText
            ]}>
              Resistivity
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              localStyles.tabButton,
              activeTab === "TDIP" && localStyles.activeTab
            ]}
            onPress={() => setActiveTab("TDIP")}
          >
            <Text style={[
              localStyles.tabText,
              activeTab === "TDIP" && localStyles.activeTabText
            ]}>
              TD/IP
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Graph Container */}
        <View ref={graphRef} style={localStyles.graphWrapper}>
          {activeTab === "Resistivity" ? (
            <VESGraph
              data={resistivityData}
              title={`Resistivity - VES${currentVES}`}
              color={primaryColor}
              width={graphWidth}
              height={graphHeight}
            />
          ) : (
            <VESGraph
              data={tdipData}
              title={`TD/IP - VES${currentVES}`}
              color={accentColor}
              width={graphWidth}
              height={graphHeight}
            />
          )}
        </View>
        
        {/* Graph Actions */}
        <TouchableOpacity
          style={localStyles.downloadButton}
          onPress={captureGraph}
        >
          <Ionicons name="download-outline" size={20} color="white" />
          <Text style={localStyles.downloadButtonText}>
            DOWNLOAD {activeTab.toUpperCase()} GRAPH
          </Text>
        </TouchableOpacity>
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
          style={[localStyles.actionButton, { backgroundColor: "#EF4444" }]}
          onPress={confirmEndProject}
          disabled={isSaving}
        >
          <Ionicons name="checkmark-done-outline" size={20} color="white" />
          <Text style={localStyles.actionButtonText}>
            {params.existingProject === "true" ? "END PROJECT" : "CREATE PROJECT"}
          </Text>
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
  mandatoryFieldsContainer: {
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 15,
  },
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  fieldLabel: {
    fontFamily: "JosefinSans_600SemiBold",
    fontSize: 14,
    color: "#334155",
    marginLeft: 8,
    width: 140,
  },
  fieldInput: {
    flex: 1,
    fontFamily: "JosefinSans_400Regular",
    fontSize: 14,
    color: "#0F172A",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    padding: 12,
    minHeight: 45,
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
  graphCard: {
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
  },
  groupHeader: {
    backgroundColor: "#E2E8F0",
    paddingVertical: 8,
    paddingHorizontal: 15,
  },
  groupHeaderText: {
    fontFamily: "JosefinSans_700Bold",
    fontSize: 16,
    color: secondaryColor,
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
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    borderRadius: 10,
    padding: 5,
    marginBottom: 15,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  activeTab: {
    backgroundColor: "white",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tabText: {
    fontFamily: "JosefinSans_600SemiBold",
    fontSize: 14,
    color: "#64748B",
  },
  activeTabText: {
    color: primaryColor,
  },
  graphWrapper: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 10,
    alignItems: "center",
  },
  graphContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  graphTitle: {
    fontFamily: "JosefinSans_700Bold",
    fontSize: 16,
    color: secondaryColor,
    marginBottom: 10,
    textAlign: "center",
  },
  noDataText: {
    fontFamily: "JosefinSans_400Regular",
    fontSize: 14,
    color: "#94A3B8",
    textAlign: "center",
    marginTop: 20,
  },
  downloadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: primaryColor,
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 15,
  },
  downloadButtonText: {
    fontFamily: "JosefinSans_600SemiBold",
    fontSize: 14,
    color: "white",
    marginLeft: 8,
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