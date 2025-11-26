import React, { useEffect, useState, useCallback } from "react";
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

export default function VideoScreen() {
  const insets = useSafeAreaInsets();
  const route = useRoute();
  const navigation = useNavigation();
  const { serieId, seasonId = "s1", episodeId } = route.params || {};
  const { downloads, markProgress, markRecentlyWatched, series } = useLibraryStore();
  const [serverUrl, setServerUrl] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [didSeek, setDidSeek] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0); // Hız takibi için state
  const [showControls, setShowControls] = useState(true); // Kontrolleri gizleyip açmak için
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
        p.play();
    }
  });

  const cyclePlaybackSpeed = () => {
    const speeds = [1.0, 1.25, 1.5, 2.0];
    const currentIndex = speeds.indexOf(playbackSpeed);
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
    if (player) {
      player.playbackRate = nextSpeed;
      player.preservesPitch = true; 
      setPlaybackSpeed(nextSpeed);
    }
  };
  useEffect(() => {
    if (!player || !videoUri) return;

    const sub = player.addListener("timeUpdate", async ({ currentTime, duration }) => {
      if (!duration) return;
      const progress = currentTime / duration;
      markProgress(serieId, episodeId, progress);
      if (!didSeek && resumeProgress > 0.01 && resumeProgress < 0.98 && duration > 0) {
        const seekTime = duration * resumeProgress;
        console.log(`⏩ Resume to ${Math.floor(resumeProgress * 100)}% (${seekTime.toFixed(1)}s)`);
        setDidSeek(true); 
        player.seekTo(seekTime);
      }
      if (!downloadedItem && Math.floor(currentTime) % 5 === 0) {
        try {
          await api.put(`/episode/${episodeId}/progress`, { progress });
        } catch (err) {}
      }
    });

    const endSub = player.addListener("ended", () => {
      markProgress(serieId, episodeId, 1);
      markRecentlyWatched({ serieId, episodeId });
    });

    return () => {
      sub.remove();
      endSub.remove();
    };
  }, [player, resumeProgress, videoUri, didSeek]);
  useEffect(() => {
    let timeout;
    
    (async () => {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
      if (Platform.OS === "android") {
        await NavigationBar.setVisibilityAsync("hidden");
      }
    })();
    const resetControlTimeout = () => {
        setShowControls(true);
        clearTimeout(timeout);
        timeout = setTimeout(() => setShowControls(false), 4000); // 4 saniye sonra gizle
    };
    resetControlTimeout();

    return () => {
      clearTimeout(timeout);
      (async () => {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
        if (Platform.OS === "android") {
          await NavigationBar.setVisibilityAsync("visible");
        }
      })();
    };
  }, []);

  if (!isReady || (!videoUri && !downloadedItem && !serverUrl)) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#C6A14A" />
        <Text style={{color: 'white', marginTop: 10}}>Video hazırlanıyor...</Text>
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
        fullscreenOptions={{ enabled: true }}
        contentFit="contain" 
        nativeControls={true} 
      />
      <View style={styles.overlayContainer} pointerEvents="box-none">
        <TouchableOpacity 
            style={styles.speedButton} 
            onPress={cyclePlaybackSpeed}
            activeOpacity={0.7}
        >
            <Ionicons name="speedometer-outline" size={20} color="black" />
            <Text style={styles.speedText}>{playbackSpeed}x</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => navigation.goBack()}
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
    alignSelf: "center",
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject, 
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    padding: 20,
    zIndex: 10,
  },
  speedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(198, 161, 74, 0.9)', 
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginTop: 10,
    marginRight: 10, 
  },
  speedText: {
    color: 'black',
    fontWeight: 'bold',
    marginLeft: 5,
    fontSize: 16
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
    zIndex: 20
  }
});