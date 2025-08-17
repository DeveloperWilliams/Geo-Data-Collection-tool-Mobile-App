import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Sharing from 'expo-sharing';
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as Animatable from "react-native-animatable";
import Svg, { G, Line, Path, Rect, Text as SvgText } from "react-native-svg";
import * as XLSX from 'xlsx';

const primaryColor = "#2C6BED";
const secondaryColor = "#1A56DB";
const accentColor = "#0E9F6E";
const lightBackground = "#F9FAFB";
const { height, width } = Dimensions.get("window");

// Graph component with improved subdivisions
type VESGraphDataPoint = { x: number; y: number };
type VESGraphProps = {
  data: VESGraphDataPoint[];
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

  // For Y-axis, ensure we capture full range
  let yMin = Math.max(0.1, Math.min(...yValues));
  let yMax = Math.max(...yValues);
  
  // If all values are the same, create range
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

  // Generate X-axis labels with sub-dividers
  const generateAxisLabels = (min: number, max: number, isXAxis: boolean) => {
    const minExponent = Math.floor(Math.log10(min));
    const maxExponent = Math.ceil(Math.log10(max));
    const labels = [];
    
    // Add decade marks
    for (let exponent = minExponent; exponent <= maxExponent; exponent++) {
      const decade = Math.pow(10, exponent);
      if (decade >= min && decade <= max) {
        labels.push({
          value: decade,
          position: isXAxis ? scaleX(decade) : scaleY(decade),
          isMajor: true
        });
      }
    }
    
    // Add intermediate sub-dividers
    for (let exponent = minExponent; exponent <= maxExponent; exponent++) {
      const base = Math.pow(10, exponent);
      for (let multiplier of [2, 3, 4, 5, 6, 7, 8, 9]) {
        const value = base * multiplier;
        if (value > min && value < max) {
          labels.push({
            value,
            position: isXAxis ? scaleX(value) : scaleY(value),
            isMajor: false
          });
        }
      }
    }
    
    return labels;
  };

  const xAxisLabels = generateAxisLabels(xMin, xMax, true);
  const yAxisLabels = generateAxisLabels(yMin, yMax, false);

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
              strokeWidth={label.isMajor ? 0.5 : 0.2}
              strokeDasharray={label.isMajor ? "4,4" : "2,2"}
            />
            {label.isMajor && (
              <SvgText
                x={label.position}
                y={padding + chartHeight + 15}
                textAnchor="middle"
                fontSize="10"
                fill="#000"
              >
                {label.value}
              </SvgText>
            )}
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
              strokeWidth={label.isMajor ? 0.5 : 0.2}
              strokeDasharray={label.isMajor ? "4,4" : "2,2"}
            />
            {label.isMajor && (
              <SvgText
                x={padding - 10}
                y={label.position + 4}
                textAnchor="end"
                fontSize="10"
                fill="#000"
              >
                {label.value >= 1000 ? `${(label.value/1000).toFixed(label.value % 1000 === 0 ? 0 : 1)}k` : label.value}
              </SvgText>
            )}
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
          {title.includes("Resistivity") ? "Resistivity (Ω·m)" : "TD/IP"}
        </SvgText>
      </Svg>
    </View>
  );
};

type VESReading = {
  ab2: number;
  mn2: number;
  k: number;
  resistivity?: number | string;
  tdip?: number | string;
};

type VESPoint = {
  id: number;
  date: string;
  location?: { latitude: number; longitude: number };
  azimuth?: string;
  description?: string;
  readings: VESReading[];
};

type ProjectData = {
  id: string;
  name: string;
  locationInfo: {
    village: string;
    sublocation: string;
    location: string;
    ward: string;
    subCounty: string;
    county: string;
  };
  surveyData: {
    surveyType: string;
    arrayType: string;
    operator: string;
  };
  vesPoints: VESPoint[];
};

const ViewProjectScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [projectData, setProjectData] = useState<ProjectData | null>(null);
  const [currentVESIndex, setCurrentVESIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [graphWidth, setGraphWidth] = useState(width - 40);
  const [graphHeight, setGraphHeight] = useState(300);
  const [activeGraph, setActiveGraph] = useState<'resistivity' | 'tdip'>('resistivity');

  // Key for AsyncStorage
  const PROJECTS_STORAGE_KEY = "VES_PROJECTS";

  // Load project data
  useEffect(() => {
    const loadProject = async () => {
      try {
        const existingProjects = await AsyncStorage.getItem(PROJECTS_STORAGE_KEY);
        const projects = existingProjects ? JSON.parse(existingProjects) : [];
        const project = (projects as ProjectData[]).find((p: ProjectData) => p.id === params.projectId);
        
        if (project) {
          setProjectData(project);
          
          // Set to last VES if specified
          if (params.showLastVES === "true") {
            setCurrentVESIndex(project.vesPoints.length - 1);
          }
        } else {
          Alert.alert("Project Not Found", "The requested project could not be found");
          router.back();
        }
      } catch (error) {
        console.error("Failed to load project:", error);
        Alert.alert("Error", "Failed to load project data");
      } finally {
        setIsLoading(false);
      }
    };
    
    loadProject();
  }, [params.projectId]);

  // Update graph dimensions on orientation change
  useEffect(() => {
    const updateDimensions = () => {
      const { width, height } = Dimensions.get("window");
      const isLandscape = width > height;
      
      if (isLandscape && width > 768) {
        // Tablet landscape
        setGraphWidth(width - 40);
        setGraphHeight(300);
      } else {
        // Phone or portrait
        setGraphWidth(width - 40);
        setGraphHeight(300);
      }
    };

    const subscription = Dimensions.addEventListener('change', updateDimensions);
    updateDimensions();
    
    return () => {
      subscription?.remove();
    };
  }, []);

  // Navigate to next/previous VES
  const handleNextVES = () => {
    if (projectData && currentVESIndex < projectData.vesPoints.length - 1) {
      setCurrentVESIndex(currentVESIndex + 1);
    }
  };

  const handlePrevVES = () => {
    if (currentVESIndex > 0) {
      setCurrentVESIndex(currentVESIndex - 1);
    }
  };

  // Continue project - go to data entry for next VES
  const continueProject = () => {
    if (!projectData) return;
    
    const nextVESId = projectData.vesPoints.length > 0 
      ? Math.max(...projectData.vesPoints.map(v => v.id)) + 1 
      : 1;
    
    router.push({
      pathname: "/data-entry",
      params: { 
        projectId: projectData.id,
        existingProject: "true",
        nextVES: nextVESId.toString()
      }
    });
  };

  // Prepare graph data
  const getGraphData = (ves: VESPoint | undefined) => {
    if (!ves) return { resistivityData: [], tdipData: [] };

    const resistivityData: { x: number; y: number }[] = [];
    const tdipData = [];

    ves.readings.forEach((reading) => {
      if (reading.resistivity) {
        resistivityData.push({
          x: reading.ab2,
          y: parseFloat(reading.resistivity as string) || 0
        });
      }

      if (reading.tdip) {
        tdipData.push({
          x: reading.ab2,
          y: parseFloat(reading.tdip as string) || 0
        });
      }
    });

    return { resistivityData, tdipData };
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Format time for display
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Format location coordinates
  const formatLocation = (location: { latitude: number; longitude: number } | undefined) => {
    if (!location) return "Not captured";
    return `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
  };

  // Export project to Excel with improved quality
  const exportToExcel = async () => {
    if (!projectData) return;
    
    setIsExporting(true);
    
    try {
      // Create workbook
      const workbook = XLSX.utils.book_new();
      
      // Add project info sheet with formatting
      const projectInfo = [
        [{ v: "Project Details", s: { font: { bold: true, sz: 16 } } }],
        [],
        ["Project Name", projectData.name],
        ["Created", new Date(projectData.id).toLocaleString()],
        ["Village", projectData.locationInfo.village],
        ["Sublocation", projectData.locationInfo.sublocation],
        ["Location", projectData.locationInfo.location],
        ["Ward", projectData.locationInfo.ward],
        ["Sub-County", projectData.locationInfo.subCounty],
        ["County", projectData.locationInfo.county],
        ["Survey Type", projectData.surveyData.surveyType],
        ["Array Type", projectData.surveyData.arrayType],
        ["Operator", projectData.surveyData.operator],
      ];
      
      const projectSheet = XLSX.utils.aoa_to_sheet(projectInfo);
      XLSX.utils.book_append_sheet(workbook, projectSheet, "Project Info");
      
      // Add VES sheets with formatting
      projectData.vesPoints.forEach((ves, index) => {
        const vesData = [
          [{ v: `VES Point: VES${ves.id}`, s: { font: { bold: true, sz: 14 } } }],
          ["Date", formatDate(ves.date)],
          ["Time", formatTime(ves.date)],
          ["Location", formatLocation(ves.location)],
          ["Azimuth (Degree)", ves.azimuth || "Not specified"],
          ["Description", ves.description || "Not specified"],
          [],
          [{ v: "AB/2 (m)", s: { font: { bold: true } } }, 
           { v: "MN/2 (m)", s: { font: { bold: true } } }, 
           { v: "K", s: { font: { bold: true } } }, 
           { v: "Resistivity (Ω·m)", s: { font: { bold: true } } }, 
           { v: "TDIP", s: { font: { bold: true } } }]
        ];

        ves.readings.forEach((reading) => {
            vesData.push([
            reading.ab2?.toString() ?? "",
            reading.mn2 !== undefined ? reading.mn2.toString() : "",
            reading.k?.toString() ?? "",
            reading.resistivity?.toString() ?? "",
            reading.tdip?.toString() ?? ""
            ]);
        });
        
        const vesSheet = XLSX.utils.aoa_to_sheet(vesData);
        vesSheet['!autofilter'] = { ref: "A1:E1" };
        vesSheet['!cols'] = [
          { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 15 }, { wch: 10 }
        ];
        XLSX.utils.book_append_sheet(workbook, vesSheet, `VES${ves.id}`);
      });
      
      // Write file to base64
      const wbout = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });
      
      // Create filename using project name only
      const filename = `${projectData.name.replace(/\s+/g, '_')}_VES_Data.xlsx`;
      
      // Get document directory path
      const directory = FileSystem.documentDirectory;
      const fileUri = directory + filename;
      
      // Check if file exists and delete it
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(fileUri);
      }
      
      // Write file to document directory
      await FileSystem.writeAsStringAsync(fileUri, wbout, {
        encoding: FileSystem.EncodingType.Base64
      });
      
      // Share the file
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        dialogTitle: `Share ${projectData.name} VES Data`,
        UTI: 'com.microsoft.excel.xlsx'
      });
      
    } catch (error) {
      console.error("Export error:", error);
      Alert.alert(
        "Export Failed", 
        "Could not export project data to Excel",
        [
          {
            text: 'Try Again',
            onPress: () => exportToExcel()
          },
          {
            text: 'Cancel',
            style: 'cancel'
          }
        ]
      );
    } finally {
      setIsExporting(false);
    }
  };

  // Check if device is tablet and in landscape
  const isTablet = width >= 768;
  const isLandscape = width > height;
  const responsiveLayout = isTablet && isLandscape;

  if (isLoading) {
    return (
      <View style={localStyles.loadingContainer}>
        <ActivityIndicator size="large" color={primaryColor} />
        <Text style={localStyles.loadingText}>Loading Project Data...</Text>
      </View>
    );
  }

  if (!projectData) {
    return (
      <View style={localStyles.container}>
        <Text style={localStyles.errorText}>Project not found</Text>
      </View>
    );
  }

  const currentVES = projectData.vesPoints[currentVESIndex] || {};
  const { resistivityData, tdipData } = getGraphData(currentVES);
  const vesCount = projectData.vesPoints.length;

  return (
    <ScrollView 
      contentContainerStyle={localStyles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={localStyles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={localStyles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={localStyles.headerTitle}>Project Data</Text>
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
            <Ionicons name="layers-outline" size={20} color={secondaryColor} />
            <Text style={localStyles.infoLabel}>VES Points:</Text>
            <Text style={localStyles.infoValue}>
              {vesCount} point{vesCount !== 1 ? 's' : ''}
            </Text>
          </View>

          <View style={localStyles.infoItem}>
            <Ionicons name="person-outline" size={20} color={secondaryColor} />
            <Text style={localStyles.infoLabel}>Operator:</Text>
            <Text style={localStyles.infoValue}>
              {projectData.surveyData.operator || "Not specified"}
            </Text>
          </View>

          <View style={localStyles.infoItem}>
            <Ionicons name="location-outline" size={20} color={secondaryColor} />
            <Text style={localStyles.infoLabel}>Survey Type:</Text>
            <Text style={localStyles.infoValue}>
              {projectData.surveyData.surveyType || "Not specified"}
            </Text>
          </View>

          <View style={localStyles.infoItem}>
            <Ionicons name="grid-outline" size={20} color={secondaryColor} />
            <Text style={localStyles.infoLabel}>Array Type:</Text>
            <Text style={localStyles.infoValue}>
              {projectData.surveyData.arrayType || "Not specified"}
            </Text>
          </View>
        </View>
      </Animatable.View>

      {/* VES Navigation */}
      <Animatable.View
        animation="fadeInUp"
        delay={300}
        style={localStyles.vesNavigation}
      >
        <TouchableOpacity
          onPress={handlePrevVES}
          disabled={currentVESIndex === 0}
          style={[
            localStyles.navButton,
            currentVESIndex === 0 && { opacity: 0.5 }
          ]}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>

        <View style={localStyles.vesInfo}>
          <Text style={localStyles.vesTitle}>VES{currentVES.id}</Text>
          <Text style={localStyles.vesDate}>
            {formatDate(currentVES.date)} at {formatTime(currentVES.date)}
          </Text>
          <View style={localStyles.vesDetailRow}>
            <Ionicons name="location-outline" size={16} color="#64748B" />
            <Text style={localStyles.vesLocation}>
              Location: {formatLocation(currentVES.location)}
            </Text>
          </View>
          <View style={localStyles.vesDetailRow}>
            <Ionicons name="compass-outline" size={16} color="#64748B" />
            <Text style={localStyles.vesAzimuth}>
              Azimuth: {currentVES.azimuth || "Not specified"}
            </Text>
          </View>
          <View style={localStyles.vesDetailRow}>
            <Ionicons name="document-text-outline" size={16} color="#64748B" />
            <Text style={localStyles.vesDescription}>
              Description: {currentVES.description || "Not specified"}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleNextVES}
          disabled={currentVESIndex === vesCount - 1}
          style={[
            localStyles.navButton,
            currentVESIndex === vesCount - 1 && { opacity: 0.5 }
          ]}
        >
          <Ionicons name="arrow-forward" size={24} color="white" />
        </TouchableOpacity>
      </Animatable.View>

      {/* Data Table */}
      <Animatable.View
        animation="fadeInUp"
        delay={500}
        style={localStyles.dataCard}
      >
        <View style={localStyles.sectionHeader}>
          <Ionicons name="grid-outline" size={24} color={accentColor} />
          <Text style={localStyles.sectionTitle}>Survey Measurements</Text>
        </View>

        <View style={localStyles.tableContainer}>
          {/* Table Header */}
          <View style={localStyles.tableRow}>
            <Text style={[localStyles.tableHeader, { flex: 0.7 }]}>AB/2 (m)</Text>
            <Text style={[localStyles.tableHeader, { flex: 0.7 }]}>MN/2 (m)</Text>
            <Text style={[localStyles.tableHeader, { flex: 1 }]}>K</Text>
            <Text style={[localStyles.tableHeader, { flex: 1.2 }]}>
              Resistivity (Ω·m)
            </Text>
            <Text style={[localStyles.tableHeader, { flex: 1.2 }]}>TDIP</Text>
          </View>

          {/* Table Body */}
          {currentVES.readings?.map(
            (reading, index) => (
              <View key={index} style={localStyles.tableRow}>
                <Text style={[localStyles.tableCell, { flex: 0.7 }]}>
                  {reading.ab2}
                </Text>
                <Text style={[localStyles.tableCell, { flex: 0.7 }]}>
                  {reading.mn2}
                </Text>
                <Text style={[localStyles.tableCell, { flex: 1 }]}>
                  {reading.k}
                </Text>
                <Text style={[localStyles.tableCell, { flex: 1.2 }]}>
                  {reading.resistivity || "-"}
                </Text>
                <Text style={[localStyles.tableCell, { flex: 1.2 }]}>
                  {reading.tdip || "-"}
                </Text>
              </View>
            )
          )}
        </View>
      </Animatable.View>

      {/* Graph Section with Toggle */}
      <Animatable.View
        animation="fadeInUp"
        delay={700}
        style={localStyles.graphCard}
      >
        <View style={localStyles.sectionHeader}>
          <Ionicons name="analytics-outline" size={24} color={accentColor} />
          <Text style={localStyles.sectionTitle}>Survey Visualization</Text>
        </View>

        {/* Graph Toggle Buttons */}
        <View style={localStyles.toggleContainer}>
          <TouchableOpacity
            style={[
              localStyles.toggleButton,
              activeGraph === 'resistivity' && localStyles.activeToggle
            ]}
            onPress={() => setActiveGraph('resistivity')}
          >
            <Text style={[
              localStyles.toggleText,
              activeGraph === 'resistivity' && localStyles.activeToggleText
            ]}>
              Resistivity
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              localStyles.toggleButton,
              activeGraph === 'tdip' && localStyles.activeToggle
            ]}
            onPress={() => setActiveGraph('tdip')}
          >
            <Text style={[
              localStyles.toggleText,
              activeGraph === 'tdip' && localStyles.activeToggleText
            ]}>
              TD/IP
            </Text>
          </TouchableOpacity>
        </View>

        {/* Graph Container */}
        <View style={localStyles.graphContainer}>
          {activeGraph === 'resistivity' && (
            <VESGraph
              data={resistivityData}
              title={`Resistivity - VES${currentVES.id}`}
              color={primaryColor}
              width={graphWidth}
              height={graphHeight}
            />
          )}
          
          {activeGraph === 'tdip' && (
            <VESGraph
              data={tdipData}
              title={`TD/IP - VES${currentVES.id}`}
              color={accentColor}
              width={graphWidth}
              height={graphHeight}
            />
          )}
        </View>
      </Animatable.View>

      {/* Action Buttons */}
      <View style={localStyles.actionContainer}>
        <TouchableOpacity
          style={[localStyles.actionButton, { backgroundColor: "#0E9F6E" }]}
          onPress={continueProject}
        >
          <Ionicons name="add-circle-outline" size={20} color="white" />
          <Text style={localStyles.actionButtonText}>CONTINUE PROJECT</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[localStyles.actionButton, { backgroundColor: "#2C6BED" }]}
          onPress={exportToExcel}
          disabled={isExporting}
        >
          {isExporting ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <>
              <Ionicons name="download-outline" size={20} color="white" />
              <Text style={localStyles.actionButtonText}>EXPORT TO EXCEL</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Bottom padding for all data */}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const localStyles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: lightBackground,
    paddingBottom: 40,  // Increased bottom padding
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: lightBackground,
  },
  loadingText: {
    fontFamily: "JosefinSans_600SemiBold",
    fontSize: 18,
    color: primaryColor,
    marginTop: 20,
  },
  errorText: {
    fontFamily: "JosefinSans_700Bold",
    fontSize: 22,
    color: "#EF4444",
    textAlign: 'center',
    marginTop: 50,
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
  vesNavigation: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 16,
    padding: 15,
    marginHorizontal: 20,
    marginBottom: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  navButton: {
    backgroundColor: primaryColor,
    borderRadius: 50,
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  vesInfo: {
    alignItems: "flex-start",
    flex: 1,
    paddingHorizontal: 10,
  },
  vesTitle: {
    fontFamily: "JosefinSans_700Bold",
    fontSize: 22,
    color: primaryColor,
  },
  vesDate: {
    fontFamily: "JosefinSans_500Medium",
    fontSize: 14,
    color: "#64748B",
  },
  vesDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },
  vesLocation: {
    fontFamily: "JosefinSans_400Regular",
    fontSize: 12,
    color: "#94A3B8",
    marginLeft: 5,
  },
  vesAzimuth: {
    fontFamily: "JosefinSans_400Regular",
    fontSize: 12,
    color: "#94A3B8",
    marginLeft: 5,
  },
  vesDescription: {
    fontFamily: "JosefinSans_400Regular",
    fontSize: 12,
    color: "#94A3B8",
    marginLeft: 5,
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
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    minHeight: 50,
    alignItems: "center",
    paddingHorizontal: 5,
  },
  tableHeader: {
    fontFamily: "JosefinSans_700Bold",
    fontSize: 12,
    color: "#1E293B",
    paddingVertical: 12,
    paddingHorizontal: 5,
    backgroundColor: "#F1F5F9",
    textAlign: "center",
  },
  tableCell: {
    fontFamily: "JosefinSans_400Regular",
    fontSize: 12,
    color: "#334155",
    paddingVertical: 12,
    paddingHorizontal: 5,
    textAlign: "center",
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 15,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 5,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeToggle: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleText: {
    fontFamily: "JosefinSans_600SemiBold",
    fontSize: 15,
    color: "#64748B",
  },
  activeToggleText: {
    color: primaryColor,
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

export default ViewProjectScreen;