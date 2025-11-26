import React from "react";
import { useNavigation } from "@react-navigation/native";
import BaseListScreen from "./BaseListScreen";
import { useLibraryStore } from "../../store/useLibraryStore";

export default function DownloadsScreen() {
  const navigation = useNavigation();
  const { downloads, series } = useLibraryStore();
  const grouped = downloads.reduce((acc, d) => {
    if (!acc[d.serieId]) acc[d.serieId] = [];
    acc[d.serieId].push(d.episodeId);
    return acc;
  }, {});
  const downloadedSeries = Object.keys(grouped)
    .map((serieId) => {
      const serie = series.find((s) => String(s.id) === String(serieId));
      if (!serie) return null;
      const episodes = serie.seasons
        .flatMap((s) => s.episodes)
        .filter((ep) => grouped[serieId].includes(String(ep.id)))
      return { ...serie, downloadedEpisodes: episodes };
    })
    .filter(Boolean);
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
      headerTitle="Downloads"
      listData={downloadedSeries}
      onSeriePress={handleSeriePress}
      onPlayPress={handlePlay}
      showDownloadedEpisodes
    />
  );
}
