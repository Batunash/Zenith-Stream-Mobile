import React from "react";
import {
  View,
  Image,
  ScrollView,
  StyleSheet,
  Dimensions,
  Text,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import Footer from "../../components/Footer";
import EpisodeAccordion from "../../components/EpisodeAccordion";
import { useLibraryStore } from "../../store/useLibraryStore";
import { useTranslation } from "react-i18next";
const { width, height } = Dimensions.get("window");

export default function SerieDetailScreen() {
  const { t } = useTranslation(); 
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const { serieId } = route.params;
  const { series, downloadEpisode, downloads } = useLibraryStore();
  const serie = series.find((s) => s.id === serieId);
  const downloadedIds = downloads
    .filter((d) => d.serieId === serieId)
    .map((d) => d.episodeId);

  const handleDownload = async (serieId, episodeId) => {
    if (downloadedIds.includes(episodeId)) {
        Alert.alert(t('detail.download_exists_title'), t('detail.download_exists_msg'));
        return;
    }

    try {
      await downloadEpisode(serieId, episodeId);
      Alert.alert(t('detail.download_success_title'), t('detail.download_success_msg'));
    } catch (e) {
      Alert.alert(t('detail.download_fail_title'), e.message || t('detail.download_fail_msg'));
    }
  };

  const handleEpisodePlay = (serieId, episode) => {
    navigation.navigate("VideoPlayer", {
      serieId,
      seasonId: episode.seasonId,
      episodeId: episode.id,
      title: episode.title,
    });
  };

  const handlePlay = () => {
    if (!serie) return;

    const allEpisodes = serie.seasons
      .sort((a, b) => a.order - b.order)
      .flatMap((sea) =>
        sea.episodes
          .sort((a, b) => a.order - b.order)
          .map((ep) => ({ ...ep, seasonId: sea.id }))
      );
    const lastWatched = allEpisodes.find(
      (ep) => ep.progress > 0 && ep.progress < 1
    );
    const nextUnwatched = allEpisodes.find((ep) => ep.progress === 0);
    const target = lastWatched || nextUnwatched || allEpisodes[0];

    navigation.navigate("VideoPlayer", {
      serieId: serie.id,
      seasonId: target.seasonId,
      episodeId: target.id,
      title: target.title,
    });
  };

  if (!serie)
    return (
      <View style={styles.container}>
        <Text style={{ color: "#fff", textAlign: "center", marginTop: 40 }}>
          {t('detail.not_found')}
        </Text>
      </View>
    );

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <View style={[styles.imageContainer, { width: width }]}>
        <Image
          source={{ uri: serie?.poster }}
          resizeMode="cover"
          style={styles.bgimage}
        />
      </View>

      <View style={[styles.infoContainer, { width: width }]}>
        <Text style={styles.title}>{serie?.title}</Text>
        <Text style={styles.description}>
          {serie?.description || t('detail.description_missing')}
        </Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.buttonPlay} onPress={handlePlay}>
            <Ionicons name="play-circle" size={20} color="#000000ff" />
            <Text style={styles.buttonText}>{t('detail.play')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.bottomContainer}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 80 }}
        >
          <EpisodeAccordion
            seasons={serie?.seasons || []}
            serieId={serie.id}
            onDownload={handleDownload}
            onPlay={handleEpisodePlay}
            downloadedIds={downloadedIds} 
          />
        </ScrollView>
      </View>

      <Footer />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212" },
  imageContainer: { flex: 1 },
  bgimage: { height: "100%", width: "100%" },
  infoContainer: {
    width: "100%",
    backgroundColor: "#1A1A1A",
    paddingHorizontal: 10,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 10,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    marginTop: -20,
  },
  title: {
    color: "white",
    fontWeight: "bold",
    fontSize: width * 0.05,
    textAlign: "center",
  },
  description: {
    color: "#ccc",
    fontSize: width * 0.035,
    textAlign: "center",
    marginTop: 5,
    marginBottom: 10,
    lineHeight: 18,
    width: width * 0.9,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "center",
    width: width * 0.9,
    marginTop: 10,
  },
  buttonPlay: {
    flexDirection: "row",
    width: "48%",
    height: height * 0.05,
    backgroundColor: "#C6A14A",
    borderRadius: width * 0.03,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    marginLeft: 5,
    fontSize: width * 0.04,
  },
  bottomContainer: {
    flex: 1,
    backgroundColor: "#121212",
    paddingHorizontal: 10,
    paddingTop: 10,
  },
});