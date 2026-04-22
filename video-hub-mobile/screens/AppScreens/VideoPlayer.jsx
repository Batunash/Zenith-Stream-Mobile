import React, { useEffect, useState, useRef, useCallback } from "react";
import { StyleSheet, View, Platform, ActivityIndicator, Text, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { VideoView, useVideoPlayer } from "expo-video";
import * as ScreenOrientation from "expo-screen-orientation";
import * as NavigationBar from "expo-navigation-bar";
import { StatusBar } from "expo-status-bar";
import { useRoute, useNavigation, useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons"; 
import { useLibraryStore } from "../../store/useLibraryStore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useKeepAwake } from 'expo-keep-awake';
import { useTranslation } from "react-i18next"; 

export default function VideoScreen() {
  const { t } = useTranslation(); 
  useKeepAwake();
  const insets = useSafeAreaInsets();
  const route = useRoute();
  const navigation = useNavigation();
  const { serieId, episodeId } = route.params || {};
  const {
    downloads,
    markProgress,
    markRecentlyWatched,
    setWatchProgress,
    clearWatchProgress,
    watchProgress,
    series,
    hasHydrated,
  } = useLibraryStore();

  const [serverUrl, setServerUrl] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);
  const didSeekRef = useRef(false);
  const didStartRef = useRef(false);
  const savedPositionSecRef = useRef(null);

  // handleBack runs during teardown where native player methods throw
  // NativeSharedObjectNotFoundException — mirror time/duration into JS refs.
  const currentTimeRef = useRef(0);
  const durationRef = useRef(0);

  const lastProgressRef = useRef(Date.now());
  const timeoutRef = useRef(null);

  const serie = series.find((s) => s.id === serieId);
  const episode = serie?.seasons?.flatMap((sea) => sea.episodes)?.find((ep) => ep.id === episodeId);
  const downloadedItem = downloads.find(d => d.episodeId === episodeId);

  if (savedPositionSecRef.current === null && hasHydrated) {
    const saved = watchProgress?.[String(episodeId)];
    savedPositionSecRef.current = saved?.positionSec || 0;
  }

  const handleBack = useCallback(async () => {
    try {
      if (episodeId) {
        const pos = currentTimeRef.current || 0;
        const dur = durationRef.current || 0;
        if (dur > 0 && pos > 2 && pos < dur - 1) {
          try {
            setWatchProgress(episodeId, pos, dur);
          } catch (saveErr) {
            console.warn("[VideoPlayer] handleBack save progress error", saveErr);
          }
        }
      }

      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);

      if (Platform.OS === "android") {
        await NavigationBar.setVisibilityAsync("visible");
      }

      setTimeout(() => {
        navigation.goBack();
      }, 100);
    } catch (err) {
      navigation.goBack();
    }
  }, [navigation, episodeId, setWatchProgress]);

  useEffect(() => {
    if (!episodeId) {
      setError(t('player.video_not_found') || "Geçersiz video.");
      setIsReady(true);
    }
  }, [episodeId, t]);

  useEffect(() => {
    if (!episodeId) return;
    const loadServerUrl = async () => {
      if (downloadedItem) {
        setIsReady(true);
        return;
      }
      try {
        const url = await AsyncStorage.getItem("server-url");
        if (!url) {
          setError(t('player.connection_error') || "Sunucu adresi bulunamadı.");
          setIsReady(true);
          return;
        }

        try {
          const controller = new AbortController();
          const id = setTimeout(() => controller.abort(), 4000);
          const streamUrl = `${url}/stream/${episodeId}`;
          const resp = await fetch(streamUrl, { method: 'HEAD', signal: controller.signal });
          clearTimeout(id);
          if (!resp.ok) {
            setError(t('player.video_not_found') || "Video kaynağı bulunamadı.");
            return;
          }
          const lenHeader = resp.headers.get('content-length');
          const len = lenHeader ? parseInt(lenHeader, 10) : NaN;
          if (!Number.isFinite(len) || len <= 0) {
            setError(t('player.video_not_found') || "Video kaynağı bulunamadı.");
            return;
          }
          setServerUrl(url);
        } catch (pingErr) {
          setError(t('player.connection_error') || "Sunucuya bağlanılamadı.");
        }
      } catch (e) {
        setError(t('player.playback_error') || "Beklenmedik bir hata oluştu.");
      } finally {
        setIsReady(true);
      }
    };
    loadServerUrl();
  }, [downloadedItem, t, episodeId]);

  const videoUri = downloadedItem 
    ? downloadedItem.localPath 
    : (serverUrl ? `${serverUrl}/stream/${episodeId}` : null);

  useEffect(() => {
    if (isReady && !videoUri && !error) {
      setError(t('player.video_not_found') || "Video kaynağı oluşturulamadı.");
    }
  }, [isReady, videoUri, error, t]);

  // iOS AVPlayer crashes if play() is called before the asset is validated —
  // gated on statusChange 'readyToPlay' below instead of the setup callback.
  const player = useVideoPlayer(videoUri, (p) => {
    if (!videoUri) return;
    try {
      p.loop = false;
      p.timeUpdateEventInterval = 1;
      p.preservesPitch = true;
      p.playsInSilentModeIOS = true;
    } catch (err) {
      setError(t('player.playback_error') || "Video başlatılamadı.");
    }
  });

  useEffect(() => {
    if (!player || !videoUri || !hasHydrated) return;

    const startWatchdog = () => {
      if (timeoutRef.current) clearInterval(timeoutRef.current);
      lastProgressRef.current = Date.now();

      timeoutRef.current = setInterval(() => {
        if (Date.now() - lastProgressRef.current > 15000 && player.playing) {
          setError(t('player.timeout') || "Video yüklenirken zaman aşımı oluştu.");
          if (timeoutRef.current) clearInterval(timeoutRef.current);
        }
      }, 5000);
    };

    startWatchdog();

    const sub = player.addListener("timeUpdate", ({ currentTime }) => {
      try {
        lastProgressRef.current = Date.now();
        // expo-video 3.x timeUpdate payload doesn't include duration — read from player.
        const safeDuration = Number(player.duration) || 0;
        const nextTime = Number(currentTime);
        if (Number.isFinite(nextTime) && nextTime >= 0) {
          currentTimeRef.current = nextTime;
        }
        if (safeDuration > 0) {
          durationRef.current = safeDuration;
        }
        if (safeDuration <= 0) return;

        // Fallback seek in case timeUpdate fires before statusChange readyToPlay.
        if (!didSeekRef.current) {
          const target = savedPositionSecRef.current || 0;
          if (target > 2 && target < safeDuration - 5) {
            try { player.currentTime = target; } catch (seekErr) {}
          }
          didSeekRef.current = true;
          return;
        }

        if (Math.floor(currentTime) % 5 !== 0) return;

        const progress = currentTime / safeDuration;
        try {
          setWatchProgress(episodeId, currentTime, safeDuration);
          markProgress(serieId, episodeId, progress);
        } catch (e) {}
      } catch (err) {}
    });

    const endSub = player.addListener("playToEnd", () => {
      try {
        markProgress(serieId, episodeId, 1);
        markRecentlyWatched({ serieId, episodeId });
        clearWatchProgress(episodeId);
      } catch (e) {}
      handleBack();
    });

    const statusSub = player.addListener("statusChange", (ev) => {
      try {
        const status = ev?.status;
        const playerError = ev?.error;

        if (status === "error" || playerError) {
          setError(
            playerError?.message ||
            t('player.playback_error') ||
            "Video oynatılamadı."
          );
          return;
        }
        if (status === "readyToPlay" && !didStartRef.current) {
          didStartRef.current = true;

          // Seek before play() to avoid a 0-flash before jumping to resume point.
          try {
            const target = savedPositionSecRef.current || 0;
            const dur = Number(player.duration) || 0;
            if (target > 2 && (dur <= 0 || target < dur - 5)) {
              player.currentTime = target;
            }
            didSeekRef.current = true;
          } catch (seekErr) {
            didSeekRef.current = true;
          }

          try {
            player.play();
          } catch (playErr) {
            setError(t('player.playback_error') || "Video oynatılamadı.");
          }
        }
      } catch (err) {}
    });

    return () => {
      // Covers gesture-back where handleBack doesn't fire.
      try {
        const pos = currentTimeRef.current || 0;
        const dur = durationRef.current || 0;
        if (episodeId && dur > 0 && pos > 2 && pos < dur - 1) {
          setWatchProgress(episodeId, pos, dur);
        }
      } catch (e) {}
      sub.remove();
      endSub.remove();
      statusSub.remove();
      if (timeoutRef.current) clearInterval(timeoutRef.current);
    };
  }, [
    player,
    videoUri,
    serieId,
    episodeId,
    downloadedItem,
    markProgress,
    markRecentlyWatched,
    setWatchProgress,
    clearWatchProgress,
    handleBack,
    hasHydrated,
    t,
  ]);

  useFocusEffect(
    useCallback(() => {
      const lockLandscape = async () => {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
        if (Platform.OS === "android") {
          await NavigationBar.setVisibilityAsync("hidden");
          await NavigationBar.setBehaviorAsync('overlay-swipe');
        }
      };
      lockLandscape();

      return () => {
         ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
         if (Platform.OS === "android") {
            NavigationBar.setVisibilityAsync("visible");
         }
      };
    }, [])
  );

  if (error) {
     return (
      <View style={[styles.container, styles.center, { zIndex: 9999 }]}>
        <StatusBar hidden={false} style="light" />
        <Ionicons name="alert-circle-outline" size={64} color="#ef4444" style={{ marginBottom: 16 }} />
        <Text style={{color: 'white', fontSize: 16, marginBottom: 24, textAlign: 'center', paddingHorizontal: 32}}>
          {error}
        </Text>
        <TouchableOpacity 
          onPress={handleBack} 
          style={{paddingVertical: 12, paddingHorizontal: 24, backgroundColor: '#333', borderRadius: 8}}
        >
            <Text style={{color: 'white', fontWeight: 'bold'}}>{t('common.back') || "Geri Dön"}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!hasHydrated || !isReady || (!videoUri && !downloadedItem)) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#C6A14A" />
        <Text style={{color: 'white', marginTop: 10}}>{t('player.video_preparing') || "Video hazırlanıyor..."}</Text>
        <TouchableOpacity onPress={handleBack} style={{marginTop: 30}}>
           <Text style={{color: '#888', textDecorationLine: 'underline'}}>{t('common.cancel') || "İptal"}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <StatusBar hidden />
      
      <VideoView
        style={styles.video}
        player={player}
        contentFit="contain" 
        nativeControls={true} 
        allowsFullscreen={true}
        startsPictureInPictureAutomatically={false}
      />
      
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={handleBack}
        hitSlop={{top: 20, bottom: 20, left: 20, right: 20}}
      >
        <Ionicons name="arrow-back" size={28} color="white" />
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "black" },
  center: { justifyContent: 'center', alignItems: 'center' },
  video: {
    flex: 1,
    width: "100%", 
    height: "100%",
  },
  backButton: {
    position: 'absolute',
    top: 30,
    left: 30,
    backgroundColor: 'rgba(0,0,0,0.5)', 
    borderRadius: 20,
    padding: 8,
    zIndex: 999, 
  }
});