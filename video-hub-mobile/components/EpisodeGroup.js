import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, LayoutAnimation, Platform, UIManager } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import VideoCard from "./VideoCard"; // senin mevcut kart
import { Dimensions } from "react-native";

const { height, width } = Dimensions.get("window");

// Android için animasyon aktif et
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function EpisodeGroup({ title, isExpanded, onToggle }) {
  // Şimdilik test için 3 tane sahte bölüm
  const fakeEpisodes = [
    { id: "1" },
    { id: "2" },
    { id: "3" },
    { id: "4" },
  ];

  const handlePress = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onToggle();
  };

  return (
    <View style={styles.container}>
      {/* Başlık kısmı */}
      <TouchableOpacity style={styles.header} onPress={handlePress}>
        <Text style={styles.title}>{title}</Text>
        <Ionicons
          name={isExpanded ? "chevron-up" : "chevron-down"}
          size={22}
          color="#C6A14A"
        />
      </TouchableOpacity>

      {/* Bölümler */}
      {isExpanded && (
        <View style={styles.episodeGrid}>
          {fakeEpisodes.map((ep) => (
            <View key={ep.id} style={styles.cardWrapper}>
              <VideoCard
                Height={height * 0.2}
                isSelected={false}
                onPress={() => console.log("Episode", ep.id)}
              />
              <Text style={styles.epTitle}>Episode {ep.id}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1A1A1A",
    padding: 10,
    borderRadius: 8,
  },
  title: {
    color: "#C6A14A",
    fontWeight: "bold",
    fontSize: width * 0.04,
  },
  episodeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 10,
  },
  cardWrapper: {
    width: "48%",
    marginBottom: 12,
  },
  epTitle: {
    color: "#ccc",
    textAlign: "center",
    fontSize: width * 0.035,
    marginTop: 5,
  },
});
