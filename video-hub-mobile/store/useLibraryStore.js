import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { downloadEpisodeService } from "../services/downloadService";
import api from "../lib/api";
import i18n from "../i18n";

export const useLibraryStore = create(
  persist(
    (set, get) => ({
      series: [],
      lists: [],
      downloads: [],
      recentlyWatched: [],
      isLoading: false,
      error: null,
      isDownloading: false,
      progress: 0,

      fetchSeries: async () => {
        set({ isLoading: true });
        try {
          const res = await api.get("/series");
          set({ series: res.data.series, isLoading: false });
        } catch (err) {
          set({ isLoading: false, error: i18n.t("player.connection_error") });
        }
      },
      addList: ({ title, seriesIds }) => {
        set((state) => ({
          lists: [
            ...state.lists,
            {
              id: Date.now().toString(), 
              title,
              seriesIds,
            },
          ],
        }));
      },

      downloadEpisode: async (serieId, episodeId) => {
        const { downloads } = get();
        const alreadyDownloaded = downloads.find(
            d => d.serieId === serieId && d.episodeId === episodeId
        );
        if (alreadyDownloaded) {
            console.log("Zaten indirilmiş.");
            return;
        }
        try {
          set({ isDownloading: true, progress: 0 });
          console.log(`İndirme Başlıyor: Serie ${serieId}, Episode ${episodeId}`);
          const localPath = await downloadEpisodeService(serieId, episodeId);
          console.log("İndirme Bitti, State Güncelleniyor...", localPath);
          set((state) => ({
            downloads: [
              ...state.downloads,
              { serieId, episodeId, localPath },
            ],
            isDownloading: false,
            progress: 1,
          }));

          return localPath;
        } catch (err) {
          console.error("Store Download Hatası:", err);
          set({ isDownloading: false, error: i18n.t("detail.download_fail_msg") });
          throw err;
        }
      },
      markProgress: (serieId, episodeId, progress) =>
        set((state) => ({
          series: state.series.map((s) =>
            s.id === serieId
              ? {
                  ...s,
                  seasons: s.seasons.map((sea) => ({
                    ...sea,
                    episodes: sea.episodes.map((ep) =>
                      ep.id === episodeId ? { ...ep, progress } : ep
                    ),
                  })),
                }
              : s
          ),
        })),

      markRecentlyWatched: ({ serieId, episodeId }) =>
        set((state) => ({
          recentlyWatched: [
            { serieId, episodeId, watchedAt: Date.now() },
            ...state.recentlyWatched.filter((x) => x.episodeId !== episodeId),
          ].slice(0, 25),
        })),

      clearAll: () =>
        set({
          lists: [],
          downloads: [],
          recentlyWatched: [],
        }),
    }),
    {
      name: "video-hub-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        series: state.series,
        lists: state.lists,
        downloads: state.downloads,
        recentlyWatched: state.recentlyWatched,
      }),
    }
  )
);
