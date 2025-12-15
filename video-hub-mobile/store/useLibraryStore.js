import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { downloadEpisodeService ,removeEpisodeService,downloadImageService} from "../services/downloadService";
import { File } from 'expo-file-system';
import api from "../lib/api";
import i18n from "../services/i18n";

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
        set({ isLoading: true, error: null });
        try {
          const res = await api.get("/series");
          let seriesData = res.data.series;
          const { series: currentSeries } = get();          
          const mergedSeries = await Promise.all(seriesData.map(async (newS) => {
              const existing = currentSeries.find(oldS => String(oldS.id) === String(newS.id));
              
              if (existing && existing.localPoster) {
                  try {
                      const fileCheck = new File(existing.localPoster);
                      if (fileCheck.exists) {
                           return { ...newS, localPoster: existing.localPoster };
                      }
                  } catch (e) {
                      console.log("Dosya kontrol hatası, yerel kayıt siliniyor:", existing.localPoster);
                  }
              }
              return newS;
          }));

          set({ series: mergedSeries, isLoading: false, error: null });
          mergedSeries.forEach(async (serie) => {
              if (serie.poster && !serie.localPoster) {
                  const localPath = await downloadImageService(serie.poster, serie.id);
                  
                  if (localPath) {
                      set(state => ({
                          series: state.series.map(s => 
                              String(s.id) === String(serie.id) 
                                  ? { ...s, localPoster: localPath } 
                                  : s
                          )
                      }));
                  }
              }
          });

        } catch (err) {
          console.log("Fetch hatası:", err);
          set({ isLoading: false, error: i18n.t("player.connection_error") });
        }
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
      removeDownload: async (episodeId) => {
        const { downloads } = get();
        const target = downloads.find(d => String(d.episodeId) === String(episodeId));        
        if (target && target.localPath) {
            await removeEpisodeService(target.localPath);
        }        
        set((state) => ({
            downloads: state.downloads.filter((d) => String(d.episodeId) !== String(episodeId)),
        }));
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
        addList: (list) => set((state) => ({
        lists: [
          ...state.lists, 
          { ...list, id: Date.now().toString(), seriesIds: list.seriesIds || [] }
        ]
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
