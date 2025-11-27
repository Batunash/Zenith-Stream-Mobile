import React from "react";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useLibraryStore } from "../../store/useLibraryStore";
import BaseListScreen from "./BaseListScreen";
import { useTranslation } from "react-i18next"; 
export default function SeeAllScreen() {
  const { t } = useTranslation(); 
  const route = useRoute();
  const navigation = useNavigation();
  const { listId } = route.params || {};

  const { lists, series } = useLibraryStore();
  const list = lists.find((l) => l.id === listId);
  const mySeries =
    list?.seriesIds
      .map((id) => series.find((s) => s.id === id))
      .filter(Boolean) || [];
      
  const handleSeriePress = (serieId) => {
    navigation.navigate("SerieDetailScreen", { serieId });
  };

 const handlePlay = (serieId, episode) => {
    navigation.navigate("VideoPlayer", {
      serieId,
      seasonId: episode.seasonId, 
      episodeId: episode.id,
      title: episode.title,
    });
  };

  return (
    <BaseListScreen
      headerTitle={list?.title || t('main.my_list')} 
      listData={mySeries}
      onSeriePress={handleSeriePress}
      onPlayPress={handlePlay}
    />
  );
}