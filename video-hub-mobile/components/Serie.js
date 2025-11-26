import React from "react";
import {
  View,
  Image,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLibraryStore } from "../store/useLibraryStore";

const { width } = Dimensions.get("window");

export default function Serie({ serie, onSeriePress, onPlayPress, showDownloadedEpisodes }) {
  const { toggleDownload } = useLibraryStore();

  const handleDeleteEpisode = (episodeId) => {
    toggleDownload(serie.id, episodeId);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => onSeriePress?.(serie.id)}>
        <Image source={{ uri: serie.poster }} style={styles.image} />
      </TouchableOpacity>

      <View style={styles.info}>
        <Text style={styles.title}>{serie.title}</Text>
        <Text style={styles.desc} numberOfLines={2}>
          {serie.description || "No description"}
        </Text>
      </View>
      {showDownloadedEpisodes && serie.downloadedEpisodes && (
        <FlatList
          data={serie.downloadedEpisodes}
          keyExtractor={(ep) => ep.id}
          renderItem={({ item }) => (
            <View style={styles.episodeRow}>
              <Text style={styles.episodeTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <View style={styles.episodeActions}>
                <TouchableOpacity
                  onPress={() => onPlayPress?.(serie.id, item)}
                >
                  <Ionicons name="play" size={20} color="#C6A14A" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDeleteEpisode(item.id)}
                  style={{ marginLeft: 12 }}
                >
                  <Ionicons name="trash-outline" size={20} color="red" />
                </TouchableOpacity>
              </View>
            </View>
          )}
          style={styles.episodeList}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#1A1A1A",
    borderRadius: 10,
    marginVertical: 10,
    overflow: "hidden",
    width: width * 0.9,
    alignSelf: "center",
  },
  image: {
    width: "100%",
    height: width * 0.5,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  info: {
    padding: 10,
  },
  title: {
    color: "white",
    fontSize: width * 0.045,
    fontWeight: "bold",
  },
  desc: {
    color: "#ccc",
    fontSize: width * 0.035,
    marginTop: 4,
  },
  episodeList: {
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  episodeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 6,
  },
  episodeTitle: {
    color: "white",
    fontSize: width * 0.035,
    flexShrink: 1,
  },
  episodeActions: {
    flexDirection: "row",
    alignItems: "center",
  },
});
