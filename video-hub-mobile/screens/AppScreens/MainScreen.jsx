import React, { useEffect, useCallback, useMemo } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  ActivityIndicator,
  Text,
  RefreshControl,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import HeroSection from "../../components/HeroSection";
import HorizontalList from "../../components/HorizontalList";
import Footer from "../../components/Footer";
import { useNavigation } from "@react-navigation/native";
import { useLibraryStore } from "../../store/useLibraryStore";
import { useThemeStore } from "../../store/useThemeStore";
import { getThemeColors } from "../../utils/theme";
import { useTranslation } from "react-i18next";

export default function MainScreen() {
  const { t } = useTranslation();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { lists, series, fetchSeries, isLoading, error, removeList, watchProgress, hasHydrated } = useLibraryStore();
  const { getActiveTheme } = useThemeStore();
  const colors = getThemeColors(getActiveTheme());
  
  const firstSerie = series?.[0];
  const isOffline = !!error;

  const continueWatching = useMemo(() => {
    if (!watchProgress || !series?.length) return [];
    return Object.entries(watchProgress)
      .map(([episodeId, p]) => {
        const serie = series.find((s) =>
          s.seasons?.some((sea) =>
            sea.episodes?.some((ep) => String(ep.id) === String(episodeId))
          )
        );
        if (!serie) return null;
        const season = serie.seasons.find((sea) =>
          sea.episodes?.some((ep) => String(ep.id) === String(episodeId))
        );
        const episode = season?.episodes.find(
          (ep) => String(ep.id) === String(episodeId)
        );
        const ratio = p.durationSec > 0 ? p.positionSec / p.durationSec : 0;
        if (ratio >= 0.95) return null;
        return { serie, season, episode, ...p };
      })
      .filter(Boolean)
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, 10);
  }, [watchProgress, series]);

  const handleContinueWatchingPress = useCallback(
    (item) => {
      navigation.navigate("VideoPlayer", {
        serieId: item.serie.id,
        seasonId: item.season.id,
        episodeId: item.episode.id,
        title: item.episode.title,
      });
    },
    [navigation]
  );

  useEffect(() => {
    if (!hasHydrated) return;
    fetchSeries();
  }, [hasHydrated, fetchSeries]);

  const onRefresh = useCallback(() => {
    fetchSeries();
  }, [fetchSeries]);

  const handleSeeAll = (listId) =>
    navigation.navigate("SeeAllScreen", { listId });

  const handleEditList = (list) => {
    navigation.navigate("CreateHorizontalViewScreen", {
      editMode: true,
      listId: list.id,
      initialTitle: list.title,
      initialSeriesIds: list.seriesIds,
    });
  };

  const handleDeleteList = (listId) => {
    const list = lists.find(l => l.id === listId);
    Alert.alert(
      t('common.delete'),
      t('main.delete_list_confirm', { title: list?.title }),
      [
        { text: t('common.cancel'), style: "cancel" },
        {
          text: t('common.delete'),
          style: "destructive",
          onPress: () => removeList(listId)
        }
      ]
    );
  };

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
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {isOffline && (
        <View style={[styles.offlineBanner, { paddingTop: insets.top + 10, backgroundColor: colors.danger }]}>
          <Ionicons name="cloud-offline" size={20} color="white" />
          <Text style={styles.offlineText}>{t('main.offline_mode')}</Text>
          <TouchableOpacity testID="offline-banner" onPress={fetchSeries}>
            <Ionicons name="refresh" size={16} color="white" />
          </TouchableOpacity>
        </View>
      )}

      {(!hasHydrated || (isLoading && !series.length)) && (
        <View style={[styles.center, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.text, marginTop: 10 }}>{t('main.library_loading')}</Text>
        </View>
      )}

      {hasHydrated && !isLoading && !series.length && !isOffline && (
        <View style={[styles.center, { backgroundColor: colors.background }]}>
          <Text style={{ color: colors.subText, marginBottom: 20 }}>{t('main.no_series')}</Text>
          <TouchableOpacity testID="main-refresh-btn" onPress={fetchSeries} style={[styles.reloadBtn, { backgroundColor: colors.border }]}>
            <Ionicons name="refresh" size={24} color={colors.primary} />
            <Text style={{ color: colors.primary, marginLeft: 6, fontWeight: 'bold' }}>{t('main.refresh')}</Text>
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
              tintColor={colors.primary}
              colors={[colors.primary]}
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
          {continueWatching.length > 0 && (
            <HorizontalList
              title={t('main.continue_watching')}
              data={continueWatching.map((item) => item.serie)}
              onCardPress={(serie) => {
                const item = continueWatching.find(
                  (c) => c.serie.id === serie.id
                );
                if (item) handleContinueWatchingPress(item);
              }}
            />
          )}
          {Array.isArray(lists) &&
            lists.length > 0 &&
            lists.map((list) => {
              const listSeries = list.seriesIds
                .map((id) => series.find((s) => s.id === id))
                .filter(Boolean);

              /* istanbul ignore next */
              if (listSeries.length === 0) return null;

              return (
                <HorizontalList
                  key={list.id}
                  title={list.title}
                  data={listSeries}
                  onSeeAll={() => handleSeeAll(list.id)}
                  onCardPress={(serie) => handleSerieDetail(serie.id)}
                  onEdit={() => handleEditList(list)}
                  onDelete={() => handleDeleteList(list.id)}
                />
              );
            })}
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
            testID="add-list-btn"
            onPress={handleAdd}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={40} color={colors.background === '#121212' || colors.background === '#000000' ? 'black' : 'white'} />
          </TouchableOpacity>

          <View style={{ height: 20 }} />
        </ScrollView>
      )}

      <Footer onDownloadsPress={handleDownloads} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 20, gap: 20, alignItems: "center" },
  addButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
    marginTop: 10
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  reloadBtn: {
    flexDirection: "row",
    alignItems: "center",
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