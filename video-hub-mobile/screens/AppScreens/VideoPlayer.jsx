import React, { useEffect, useState, useRef } from "react";
import { StyleSheet, View, Platform, ActivityIndicator, Text, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { VideoView, useVideoPlayer } from "expo-video";
import * as ScreenOrientation from "expo-screen-orientation";
import * as NavigationBar from "expo-navigation-bar";
import { StatusBar } from "expo-status-bar";
import { useRoute, useNavigation } from "@react-navigation/native";
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
  const serie = series.find((s) => s.id === serieId);
  const episode = serie?.seasons?.flatMap((sea) => sea.episodes)?.find((ep) => ep.id === episodeId);
  const resumeProgress = episode?.progress || 0;
  const downloadedItem = downloads.find(d => d.episodeId === episodeId);

  useEffect(() => {
    const loadServerUrl = async () => {
      if (downloadedItem) {
        setIsReady(true);
        return;
      }
      try {
        const url = await AsyncStorage.getItem("server-url");
        if (url) setServerUrl(url);
        else console.warn("Sunucu URL bulunamadı");
      } catch (e) {
        console.error("URL okuma hatası", e);
        setError(t('player.connection_error'));
      } finally {
        setIsReady(true);
      }
    };
    loadServerUrl();
  }, [downloadedItem]);

  const videoUri = downloadedItem 
    ? downloadedItem.localPath 
    : (serverUrl ? `${serverUrl}/stream/${episodeId}` : null);

  const player = useVideoPlayer(videoUri, (p) => {
    if (videoUri) {
        p.loop = false;
        p.timeUpdateEventInterval = 1;
        p.preservesPitch = true;
        p.playsInSilentModeIOS = true; 
        p.play();
    }
  });

  useEffect(() => {
    if (!player || !videoUri) return;
    const sub = player.addListener("timeUpdate", async ({ currentTime, duration = 0 }) => { 
      const safeDuration = duration || 0;
      if (safeDuration <= 0) return;
      const progress = currentTime / safeDuration;
      markProgress(serieId, episodeId, progress);
      if (!didSeekRef.current && resumeProgress > 0.02 && resumeProgress < 0.95) {
        const seekTime = safeDuration * resumeProgress;
        console.log(`⏩ Resume tetiklendi: ${seekTime.toFixed(1)}sn`);
        
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
      markProgress(serieId, episodeId, 1);
      markRecentlyWatched({ serieId, episodeId });
      navigation.goBack();
    });

    return () => {
      sub.remove();
      endSub.remove();
    };
  }, [player, resumeProgress, videoUri]); 

  useEffect(() => {
    (async () => {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
      if (Platform.OS === "android") {
        await NavigationBar.setVisibilityAsync("hidden");
        await NavigationBar.setBehaviorAsync('overlay-swipe');
      }
    })();

    return () => {
      (async () => {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
        if (Platform.OS === "android") {
          await NavigationBar.setVisibilityAsync("visible");
        }
      })();
    };
  }, []);

  if (error) {
     return (
      <View style={[styles.container, styles.center]}>
        <Text style={{color: 'white', marginBottom: 20}}>{t('player.playback_error', {error})}</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{padding: 10, backgroundColor: '#333', borderRadius: 5}}>
            <Text style={{color: 'white'}}>{t('common.back')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!isReady || (!videoUri && !downloadedItem && !serverUrl)) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#C6A14A" />
        <Text style={{color: 'white', marginTop: 10}}>{t('player.video_preparing')}</Text>
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
        onPress={() => navigation.goBack()}
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