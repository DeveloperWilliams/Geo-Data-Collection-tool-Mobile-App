// app/projects-list.jsx
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import * as Animatable from "react-native-animatable";
import Svg, { Path, Rect } from "react-native-svg";

const primaryColor = "#2C6BED";
const secondaryColor = "#1A56DB";
const accentColor = "#0E9F6E";
const lightBackground = "#F9FAFB";

const ProjectsListScreen = () => {
  const router = useRouter();
  interface LocationInfo {
    village?: string;
    county?: string;
  }

  interface Project {
    id: string;
    name: string;
    locationInfo: LocationInfo;
    vesPoints: any[]; // Replace 'any' with a more specific type if available
  }

  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Key for AsyncStorage
  const PROJECTS_STORAGE_KEY = "VES_PROJECTS";

  // Load projects
  const loadProjects = async () => {
    try {
      const existingProjects = await AsyncStorage.getItem(PROJECTS_STORAGE_KEY);
      const projectsData = existingProjects ? JSON.parse(existingProjects) : [];
      
      // Sort by creation date (newest first)
    interface LocationInfo {
      village?: string;
      county?: string;
    }

    interface Project {
      id: string;
      name: string;
      locationInfo: LocationInfo;
      vesPoints: any[]; // Replace 'any' with a more specific type if available
    }

    const sortedProjects = (projectsData as Project[]).sort((a, b) => 
      new Date(b.id).getTime() - new Date(a.id).getTime()
    );
      
      setProjects(sortedProjects);
    } catch (error) {
      console.error("Failed to load projects:", error);
      Alert.alert("Error", "Failed to load projects");
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadProjects();
  }, []);

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    loadProjects();
  };

  // Format date
interface FormatDate {
    (timestamp: string): string;
}

const formatDate: FormatDate = (timestamp) => {
    const date = new Date(parseInt(timestamp));
    return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
};

  // Navigate to project details
interface ViewProjectFn {
    (projectId: string): void;
}

const viewProject: ViewProjectFn = (projectId) => {
    router.push(`/view-data?projectId=${projectId}`);
};

  // Render project item
  const renderProjectItem = ({
    item,
    index,
  }: {
    item: Project;
    index: number;
  }) => (
    <Animatable.View
      animation="fadeInUp"
      delay={index * 100}
      style={localStyles.projectCard}
    >
      <TouchableOpacity onPress={() => viewProject(item.id)}>
        <View style={localStyles.projectHeader}>
          <Svg width={24} height={24} viewBox="0 0 24 24">
            <Rect width="18" height="18" x="3" y="3" fill="#4F46E5" rx="2" />
            <Path fill="#fff" d="M9 7h6v3H9zm0 5h6v3H9zm0 5h4v3H9z" />
          </Svg>
          <Text style={localStyles.projectName}>{item.name}</Text>
          <Ionicons 
            name="chevron-forward" 
            size={20} 
            color="#94A3B8" 
          />
        </View>

        <View style={localStyles.projectDetails}>
          <View style={localStyles.detailRow}>
            <Ionicons name="location-outline" size={16} color="#64748B" />
            <Text style={localStyles.detailText}>
              {item.locationInfo.village || "No location"}, {item.locationInfo.county || "No county"}
            </Text>
          </View>

          <View style={localStyles.detailRow}>
            <Ionicons name="time-outline" size={16} color="#64748B" />
            <Text style={localStyles.detailText}>
              Created: {formatDate(item.id)}
            </Text>
          </View>

          <View style={localStyles.detailRow}>
            <Ionicons name="layers-outline" size={16} color="#64748B" />
            <Text style={localStyles.detailText}>
              {item.vesPoints.length} VES point{item.vesPoints.length !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animatable.View>
  );

  // Render empty state
  const renderEmptyList = () => (
    <View style={localStyles.emptyContainer}>
      <Svg width={120} height={120} viewBox="0 0 24 24">
        <Path 
          fill="#CBD5E1" 
          d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"
        />
      </Svg>
      <Text style={localStyles.emptyTitle}>No Projects Found</Text>
      <Text style={localStyles.emptyText}>
        Create your first VES project to get started
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={localStyles.loadingContainer}>
        <ActivityIndicator size="large" color={primaryColor} />
        <Text style={localStyles.loadingText}>Loading Projects...</Text>
      </View>
    );
  }

  return (
    <View style={localStyles.container}>
      {/* Header */}
      <View style={localStyles.header}>
        <Text style={localStyles.headerTitle}>My VES Projects</Text>
        <Text style={localStyles.headerSubtitle}>
          {projects.length} project{projects.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Projects List */}
      <FlatList
        data={projects}
        renderItem={renderProjectItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={localStyles.listContainer}
        ListEmptyComponent={renderEmptyList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[primaryColor]}
            tintColor={primaryColor}
          />
        }
      />

      {/* Create New Button */}
      <TouchableOpacity
        style={localStyles.createButton}
        onPress={() => router.push("/")}
      >
        <Ionicons name="add" size={24} color="white" />
        <Text style={localStyles.createButtonText}>CREATE NEW PROJECT</Text>
      </TouchableOpacity>
    </View>
  );
};

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: lightBackground,
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
  header: {
    padding: 20,
    paddingTop: 50,
    backgroundColor: primaryColor,
  },
  headerTitle: {
    fontFamily: "JosefinSans_700Bold",
    fontSize: 24,
    color: "white",
  },
  headerSubtitle: {
    fontFamily: "JosefinSans_400Regular",
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginTop: 4,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  projectCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  projectHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  projectName: {
    fontFamily: "JosefinSans_700Bold",
    fontSize: 18,
    color: secondaryColor,
    marginLeft: 12,
    flex: 1,
  },
  projectDetails: {
    marginLeft: 36, // Align with icon
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  detailText: {
    fontFamily: "JosefinSans_400Regular",
    fontSize: 14,
    color: "#64748B",
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontFamily: "JosefinSans_700Bold",
    fontSize: 20,
    color: "#334155",
    marginTop: 20,
  },
  emptyText: {
    fontFamily: "JosefinSans_400Regular",
    fontSize: 16,
    color: "#64748B",
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 24,
  },
  createButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    left: 20,
    backgroundColor: primaryColor,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  createButtonText: {
    fontFamily: "JosefinSans_600SemiBold",
    fontSize: 16,
    color: "white",
    marginLeft: 8,
  },
});

export default ProjectsListScreen;