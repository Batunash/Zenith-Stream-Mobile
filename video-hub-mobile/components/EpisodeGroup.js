import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function EpisodeGroup({ 
  title, 
  episodes, 
  isExpanded, 
  onToggle, 
  onDownload, 
  onPlay, 
  serieId,
  downloadedIds = [] 
}) {
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onToggle} style={styles.headerRow}>
        <Text style={styles.title}>{title}</Text>
        <Ionicons 
          name={isExpanded ? "chevron-up" : "chevron-down"} 
          size={20} 
          color="white" 
        />
      </TouchableOpacity>
      {isExpanded &&
        episodes.map((episode) => {
          const isDownloaded = downloadedIds.includes(episode.id);

          return (
            <View key={episode.id} style={styles.episodeRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.episodeTitle}>{episode.title}</Text>
                <Text style={styles.duration}>{episode.duration}</Text>
              </View>
              
              <TouchableOpacity onPress={() => onPlay(serieId, episode)}>
                <Ionicons name="play-circle" size={24} color="#C6A14A" />
              </TouchableOpacity>
              
              <TouchableOpacity onPress={() => onDownload(serieId, episode.id)}>
                <Ionicons
                  name={isDownloaded ? "checkmark-circle" : "download-outline"}
                  size={24}
                  color={isDownloaded ? "#4CAF50" : "#C6A14A"}
                />
              </TouchableOpacity>
            </View>
          );
        })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#1A1A1A",
    marginBottom: 10,
    borderRadius: 10,
    padding: 10,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  episodeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 0.5,
    borderBottomColor: "#333",
    paddingVertical: 8,
  },
  episodeTitle: {
    color: "#fff",
    fontSize: 14,
  },
  duration: {
    color: "#999",
    fontSize: 12,
  },
});