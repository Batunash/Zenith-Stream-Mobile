import React, { useEffect, useCallback } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  ActivityIndicator,
  Text,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import HeroSection from "../../components/HeroSection";
import HorizontalList from "../../components/HorizontalList";
import Footer from "../../components/Footer";
import { useNavigation } from "@react-navigation/native";
import { useLibraryStore } from "../../store/useLibraryStore";
import { useTranslation } from "react-i18next";

export default function MainScreen() {
  const { t } = useTranslation();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { lists, series, fetchSeries, isLoading, error } = useLibraryStore();
  const firstSerie = series?.[0];
  const isOffline = !!error;

  useEffect(() => {
    fetchSeries();
  }, []);

  const onRefresh = useCallback(() => {
    fetchSeries();
  }, [fetchSeries]);

  const handleSeeAll = (listId) =>
    navigation.navigate("SeeAllScreen", { listId });

  const handlePlay = (serie) => {
    const firstSeason = serie.seasons?.[0];
    const firstEpisode = firstSeason?.episodes?.[0];

    if (!firstSeason || !firstEpisode) {
      console.warn("No season/episode found for", serie.id);
      return;
    }

    navigation.navigate("VideoPlayer", {
      serieId: serie.id,
      seasonId: firstSeason.id,
      episodeId: firstEpisode.id,
      title: firstEpisode.title
    });
  };

  const handleAdd = () => navigation.navigate("CreateHorizontalViewScreen");

  const handleSerieDetail = (serieId) =>
    navigation.navigate("SerieDetailScreen", { serieId });

  const handleDownloads = () =>
    navigation.navigate("DownloadsScreen", { headerTitle: t('main.downloads') });

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      {isOffline && (
        <TouchableOpacity
          style={styles.offlineBanner}
          onPress={() => navigation.navigate("Profile")}
          activeOpacity={0.8}
        >
          <Ionicons name="cloud-offline" size={20} color="white" />
          <Text style={styles.offlineText}>
            {series.length > 0
              ? t('main.offline_list')
              : t('main.offline_downloads')}
          </Text>
          <Ionicons name="chevron-forward" size={16} color="white" />
        </TouchableOpacity>
      )}

      {isLoading && !series.length && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#C6A14A" />
          <Text style={{ color: "#fff", marginTop: 10 }}>{t('main.library_loading')}</Text>
        </View>
      )}

      {!isLoading && !series.length && !isOffline && (
        <View style={styles.center}>
          <Text style={{ color: "#aaa", marginBottom: 20 }}>{t('main.no_series')}</Text>
          <TouchableOpacity onPress={fetchSeries} style={styles.reloadBtn}>
            <Ionicons name="refresh" size={24} color="#C6A14A" />
            <Text style={{ color: "#C6A14A", marginLeft: 6, fontWeight: 'bold' }}>{t('main.refresh')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {series.length > 0 && (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={onRefresh}
              tintColor="#C6A14A"
              colors={["#C6A14A"]}
            />
          }
        >
          {!!firstSerie && (
            <HeroSection
              data={firstSerie}
              onComponentPress={() => handleSerieDetail(firstSerie.id)}
              onPlayPress={() => handlePlay(firstSerie)}
            />
          )}
          {Array.isArray(lists) &&
            lists.length > 0 &&
            lists.map((list) => {
              const listSeries = list.seriesIds
                .map((id) => series.find((s) => s.id === id))
                .filter(Boolean);

              if (listSeries.length === 0) return null;

              return (
                <HorizontalList
                  key={list.id}
                  title={list.title}
                  data={listSeries}
                  onSeeAll={() => handleSeeAll(list.id)}
                  onCardPress={(serie) => handleSerieDetail(serie.id)}
                />
              );
            })}
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAdd}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={40} color="black" />
          </TouchableOpacity>

          <View style={{ height: 20 }} />
        </ScrollView>
      )}

      <Footer onDownloadsPress={handleDownloads} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212" },
  scrollContent: { paddingBottom: 20, gap: 20, alignItems: "center" },
  addButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#C6A14A",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#C6A14A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
    marginTop: 10
  },
  center: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },
  reloadBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: '#222',
    padding: 10,
    paddingHorizontal: 20,
    borderRadius: 8
  },
  offlineBanner: {
    backgroundColor: '#ef4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    paddingHorizontal: 16,
    zIndex: 100,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  offlineText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 13,
    flex: 1,
    marginLeft: 10
  }
});