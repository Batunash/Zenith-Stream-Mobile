import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLibraryStore } from "../store/useLibraryStore"; 
export default function EpisodeGroup({ 
  title, 
  episodes, 
  isExpanded, 
  onToggle, 
  onDownload, 
  onDelete, 
  onPlay, 
  serieId
}) {
  
  const { downloads } = useLibraryStore();

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
          const isDownloaded = downloads.some(d => 
            String(d.serieId) === String(serieId) && 
            String(d.episodeId) === String(episode.id)
          );

          return (
            <View key={episode.id} style={styles.episodeRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.episodeTitle}>{episode.title}</Text>
                <Text style={styles.duration}>{episode.duration}</Text>
              </View>
              
              <TouchableOpacity testID={`play-btn-${episode.id}`} onPress={() => onPlay(serieId, episode)} style={{marginRight: 15}}>
                <Ionicons name="play-circle" size={28} color="#C6A14A" />
              </TouchableOpacity>              
              <TouchableOpacity 
                testID={`action-btn-${episode.id}`}
                onPress={() => isDownloaded 
                    ? onDelete(episode.id, episode.title) 
                    : onDownload(serieId, episode.id)
                }
                style={{ padding: 5 }}
              >
                <Ionicons
                  name={isDownloaded ? "trash-outline" : "download-outline"}
                  size={24}
                  color={isDownloaded ? "#ef4444" : "#C6A14A"}
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
    paddingVertical: 12,
  },
  episodeTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500"
  },
  duration: {
    color: "#999",
    fontSize: 12,
    marginTop: 2
  },
});