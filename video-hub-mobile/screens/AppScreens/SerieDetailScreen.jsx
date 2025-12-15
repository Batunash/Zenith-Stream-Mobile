import React, { useMemo, useState, useEffect } from "react";
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
  const { series, downloadEpisode, removeDownload, downloads } = useLibraryStore();
  const serie = series.find((s) => s.id === serieId);

  const [detailImage, setDetailImage] = useState(null);

  useEffect(() => {
    if (serie) {
        setDetailImage(serie.localPoster || serie.backdrop || serie.poster);
    }
  }, [serie]);

  const movieData = useMemo(() => {
    if (!serie || !serie.seasons) return null;
    if (serie.seasons.length === 1 && serie.seasons[0].episodes.length === 1) {
        return {
            seasonId: serie.seasons[0].id,
            episode: serie.seasons[0].episodes[0]
        };
    }
    return null;
  }, [serie]);

  const isMovie = !!movieData;

  const handleDownload = async (serieId, episodeId) => {
    const isAlreadyDownloaded = downloads.some(
        d => d.serieId == serieId && d.episodeId == episodeId
    );

    if (isAlreadyDownloaded) {
        Alert.alert(t('detail.download_exists_title') || "Bilgi", t('detail.download_exists_msg') || "Zaten indirilmiş.");
        return;
    }

    try {
      await downloadEpisode(serieId, episodeId);
      Alert.alert(t('detail.download_success_title') || "Başarılı", t('detail.download_success_msg') || "İndirme tamamlandı.");
    } catch (e) {
      Alert.alert(t('detail.download_fail_title') || "Hata", e.message || t('detail.download_fail_msg') || "İndirme başarısız.");
    }
  };

  const handleDelete = (episodeId, title) => {
      Alert.alert(
          t('common.warning') || "Silme İşlemi",
          `"${title || 'Bu bölümü'}" silmek istediğinize emin misiniz?`,
          [
              { text: t('common.cancel') || "Vazgeç", style: "cancel" },
              { 
                  text: t('common.delete') || "Sil", 
                  style: "destructive", 
                  onPress: async () => {
                      await removeDownload(episodeId);
                  }
              }
          ]
      );
  };

  const handleEpisodePlay = (serieId, episode) => {
    navigation.navigate("VideoPlayer", {
      serieId,
      seasonId: episode.seasonId || movieData?.seasonId,
      episodeId: episode.id,
      title: episode.title,
    });
  };

  const handlePlayMain = () => {
    if (!serie) return;
    if (isMovie) {
        handleEpisodePlay(serie.id, movieData.episode);
        return;
    }
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
          {t('detail.not_found') || "İçerik bulunamadı."}
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
          source={{ uri: detailImage }}
          resizeMode="cover"
          style={styles.bgimage}
          onError={() => {
              if (detailImage !== serie?.poster) {
                  setDetailImage(serie?.poster);
              }
          }}
        />
        <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
        >
            <Ionicons name="arrow-back" size={28} color="white" />
        </TouchableOpacity>
      </View>

      <View style={[styles.infoContainer, { width: width }]}>
        <Text style={styles.title}>{serie?.title}</Text>
        <Text style={styles.description} numberOfLines={4}>
          {serie?.description || t('detail.description_missing') || "Açıklama yok."}
        </Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.buttonPlay} 
            onPress={handlePlayMain}
          >
            <Ionicons name="play-circle" size={22} color="#000" />
            <Text style={styles.buttonText}>{t('detail.play') || "Oynat"}</Text>
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
              onDelete={handleDelete}
              onPlay={handleEpisodePlay}
          />
          </ScrollView>
      </View>

      <Footer />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212" },
  imageContainer: { flex: 1, position: 'relative' },
  backButton: {
      position: 'absolute',
      top: 10,
      left: 10,
      backgroundColor: 'rgba(0,0,0,0.5)',
      borderRadius: 20,
      padding: 8,
      zIndex: 10
  },
  bgimage: { height: "100%", width: "100%" },
  infoContainer: {
    width: "100%",
    backgroundColor: "#1A1A1A",
    paddingHorizontal: 20,
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "flex-start",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 10
  },
  title: {
    color: "white",
    fontWeight: "bold",
    fontSize: 24,
    textAlign: "center",
    marginBottom: 8
  },
  description: {
    color: "#ccc",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "center", 
    width: "100%",
    marginBottom: 10,
  },
  buttonPlay: {
    flexDirection: "row",
    width: "100%", 
    height: 50,
    backgroundColor: "#C6A14A",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontWeight: "bold",
    marginLeft: 8,
    fontSize: 16,
  },
  bottomContainer: {
    flex: 1,
    backgroundColor: "#121212",
    paddingHorizontal: 10,
    paddingTop: 10,
  },
});