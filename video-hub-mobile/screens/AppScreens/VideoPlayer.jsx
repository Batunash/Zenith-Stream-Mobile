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
import api from "../../lib/api";
import { useKeepAwake } from 'expo-keep-awake'; 
import { useTranslation } from "react-i18next"; 

export default function VideoScreen() {
  const { t } = useTranslation(); 
  useKeepAwake();
  const insets = useSafeAreaInsets();
  const route = useRoute();
  const navigation = useNavigation();
  const { serieId, episodeId } = route.params || {};
  const { downloads, markProgress, markRecentlyWatched, series } = useLibraryStore();
  
  const [serverUrl, setServerUrl] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null); 
  const didSeekRef = useRef(false); 
  
  // Timeout kontrolü için ref
  const lastProgressRef = useRef(Date.now());
  const timeoutRef = useRef(null);

  const serie = series.find((s) => s.id === serieId);
  const episode = serie?.seasons?.flatMap((sea) => sea.episodes)?.find((ep) => ep.id === episodeId);
  const resumeProgress = episode?.progress || 0;
  const downloadedItem = downloads.find(d => d.episodeId === episodeId);

  // --- GÜVENLİ ÇIKIŞ FONKSİYONU ---
  const handleBack = useCallback(async () => {
    try {
      // 1. Önce player'ı durdur (arka planda ses devam etmesin)
      if (player) {
        player.pause();
      }

      // 2. Ekranı Dikey Moda Zorla
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
      
      // 3. Android Navigasyon Barı ve Status Barı Geri Getir
      if (Platform.OS === "android") {
        await NavigationBar.setVisibilityAsync("visible");
      }
      
      // 4. Kısa bir gecikme ile sayfadan çık. 
      // Bu gecikme, ekranın dikey moda dönmesi için UI'a zaman tanır.
      setTimeout(() => {
        navigation.goBack();
      }, 100);

    } catch (error) {
      console.warn("Çıkış hatası:", error);
      // Hata olsa bile çıkmayı dene
      navigation.goBack();
    }
  }, [navigation, player]);
  // --------------------------------

  // 1. GÜVENLİ SUNUCU KONTROLÜ
  useEffect(() => {
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
          const id = setTimeout(() => controller.abort(), 2000); 
          await fetch(url, { method: 'HEAD', signal: controller.signal });
          clearTimeout(id);
          setServerUrl(url);
        } catch (pingErr) {
          console.warn("Sunucuya erişilemedi:", pingErr);
          setError(t('player.connection_error') || "Sunucuya bağlanılamadı.");
        }
      } catch (e) {
        console.error("Kritik hata", e);
        setError(t('player.playback_error') || "Beklenmedik bir hata oluştu.");
      } finally {
        setIsReady(true);
      }
    };
    loadServerUrl();
  }, [downloadedItem, t]);

  const videoUri = downloadedItem 
    ? downloadedItem.localPath 
    : (serverUrl ? `${serverUrl}/stream/${episodeId}` : null);

  useEffect(() => {
    if (isReady && !videoUri && !error) {
      setError(t('player.video_not_found') || "Video kaynağı oluşturulamadı.");
    }
  }, [isReady, videoUri, error, t]);

  const player = useVideoPlayer(videoUri, (p) => {
    if (videoUri) {
        p.loop = false;
        p.timeUpdateEventInterval = 1;
        p.preservesPitch = true;
        p.playsInSilentModeIOS = true; 
        p.play();
    }
  });

  // 2. PLAYER EVENTLERİ
  useEffect(() => {
    if (!player || !videoUri) return;

    const startWatchdog = () => {
      if(timeoutRef.current) clearInterval(timeoutRef.current);
      lastProgressRef.current = Date.now();
      
      timeoutRef.current = setInterval(() => {
        if (Date.now() - lastProgressRef.current > 15000 && player.playing) {
           console.warn("Video timeout");
           setError(t('player.timeout') || "Video yüklenirken zaman aşımı oluştu.");
           if(timeoutRef.current) clearInterval(timeoutRef.current);
        }
      }, 5000);
    };

    startWatchdog();

    const sub = player.addListener("timeUpdate", async ({ currentTime, duration = 0 }) => { 
      lastProgressRef.current = Date.now();
      const safeDuration = duration || 0;
      if (safeDuration <= 0) return;
      const progress = currentTime / safeDuration;
      
      // Store güncellemelerini try-catch'e alalım ki player durmasın
      try {
        markProgress(serieId, episodeId, progress);
      } catch(e) {}

      if (!didSeekRef.current && resumeProgress > 0.02 && resumeProgress < 0.95) {
        const seekTime = safeDuration * resumeProgress;
        player.seekTo(seekTime);
        didSeekRef.current = true; 
      }
      if (!downloadedItem && Math.floor(currentTime) % 5 === 0) {
        try {
          api.put(`/episode/${episodeId}/progress`, { progress }).catch(() => {});
        } catch (err) {}
      }
    });

    const endSub = player.addListener("playToEnd", () => {
      try {
        markProgress(serieId, episodeId, 1);
        markRecentlyWatched({ serieId, episodeId });
      } catch(e) { console.warn(e) }
      
      // Video bittiğinde de güvenli çıkış fonksiyonunu kullan
      handleBack();
    });

    return () => {
      sub.remove();
      endSub.remove();
      if(timeoutRef.current) clearInterval(timeoutRef.current);
    };
  }, [player, resumeProgress, videoUri, serieId, episodeId, downloadedItem, markProgress, markRecentlyWatched, handleBack]); 

  // ROTASYON YÖNETİMİ (Giriş için)
  // useFocusEffect içinde sadece girişte landscape yapıyoruz.
  // Çıkış işlemini handleBack ile manuel yönetiyoruz artık.
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
      
      // Swipe ile geri gelme (Gesture) durumu için fallback cleanup
      return () => {
         ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
         if (Platform.OS === "android") {
            NavigationBar.setVisibilityAsync("visible");
         }
      };
    }, [])
  );

  // --- RENDER ---

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

  if (!isReady || (!videoUri && !downloadedItem)) {
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