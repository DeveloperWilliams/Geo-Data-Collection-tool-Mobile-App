// app/index.jsx
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Link, useLocalSearchParams } from "expo-router";
import React from "react";
import {
  Dimensions,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const primaryColor = "#4A6FA5"; // Professional blue
const secondaryColor = "#166088"; // Darker blue
const accentColor = "#4FC3F7"; // Light blue for accents
const { width } = Dimensions.get("window");

export default function HomeScreen() {
  const params = useLocalSearchParams();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Image
          source={require("../../assets/images/icon.png")} 
          style={styles.logo}
          resizeMode="contain"
        />
        {/* Displaying the app name and subtitle */
          /*
           Logo on the left, beside it GeoTruth Consult under GeoTruth Consult catch phrase Groundwater is our metier on the right hand side 
           RES-IP Datalog
          */
        }
        <Text style={styles.appTitle}>GeoTruth Consult</Text>
        <Text style={styles.appSubtitle}>
          Professional Geotechnical Data Collection
        </Text>
      </View>

      <View style={styles.cardContainer}>
        <Link href="/project-setup" asChild>
          <TouchableOpacity style={styles.card}>
            <LinearGradient
              colors={[primaryColor, secondaryColor]}
              style={styles.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.cardIconContainer}>
                <MaterialCommunityIcons
                  name="earth-plus"
                  size={36}
                  color="white"
                />
              </View>
              <Text style={styles.cardTitle}>New Survey</Text>
              <Text style={styles.cardDescription}>
                Start a new survey project
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </Link>

        <Link href="/list-project" asChild>
          <TouchableOpacity style={styles.card}>
            <LinearGradient
              colors={[secondaryColor, primaryColor]}
              style={styles.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.cardIconContainer}>
                <MaterialCommunityIcons
                  name="database-eye"
                  size={36}
                  color="white"
                />
              </View>
              <Text style={styles.cardTitle}>Project Data</Text>
              <Text style={styles.cardDescription}>
                View and analyze collected data
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </Link>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          GeoTruth Consult © 2025 |{" "}
          <Text>| All rights reserved</Text> 
        </Text>
        <Text style={styles.footerText}>
          {/*  Link to geotruthconsult.org */}
          <Text style={{ color: primaryColor }}>geotruthconsult.org</Text>
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    alignItems: "center",
    paddingVertical: 30,
    paddingHorizontal: 20,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#E9ECEF",
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 15,
  },
  appTitle: {
    fontFamily: "JosefinSans_700Bold",
    fontSize: 28,
    color: primaryColor,
    marginBottom: 5,
  },
  appSubtitle: {
    fontFamily: "JosefinSans_400Regular",
    fontSize: 16,
    color: "#6C757D",
    textAlign: "center",
  },
  cardContainer: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  card: {
    marginBottom: 20,
    borderRadius: 12,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    overflow: "hidden",
  },
  gradient: {
    padding: 25,
    borderRadius: 12,
  },
  cardIconContainer: {
    backgroundColor: "rgba(255,255,255,0.2)",
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
    alignSelf: "center",
  },
  cardTitle: {
    fontFamily: "JosefinSans_600SemiBold",
    fontSize: 22,
    color: "white",
    textAlign: "center",
    marginBottom: 8,
  },
  cardDescription: {
    fontFamily: "JosefinSans_400Regular",
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
  },
  footer: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: "#E9ECEF",
    backgroundColor: "white",
  },
  footerText: {
    fontFamily: "JosefinSans_400Regular",
    fontSize: 12,
    color: "#6C757D",
    textAlign: "center",
  },
});
