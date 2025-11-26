import { File, Paths } from 'expo-file-system'; 
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";

export const downloadEpisodeService = async (serieId, episodeId) => {
  try {
    const serverUrl = await AsyncStorage.getItem("server-url");
    if (!serverUrl) {
        Alert.alert("Debug Hatası", "Sunucu URL yok!");
        throw new Error("URL Yok");
    }
    const authJson = await AsyncStorage.getItem("auth-storage");
    const token = authJson ? JSON.parse(authJson).state?.token : null;
    if (!token) {
        Alert.alert("Debug Hatası", "Token yok!");
        throw new Error("Token Yok");
    }
    const baseUrl = serverUrl.endsWith('/') ? serverUrl.slice(0, -1) : serverUrl;
    const downloadUrl = `${baseUrl}/download/${episodeId}`;
    const fileName = `video_${serieId}_${episodeId}.mp4`;
    const destinationFile = new File(Paths.document, fileName);
    Alert.alert("İndirme Başlıyor", `Hedef: ${fileName}\nURL: ${downloadUrl}`);
    console.log("Hedef Dosya URI:", destinationFile.uri);
    const resultFile = await File.downloadFileAsync(downloadUrl, destinationFile, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    if (resultFile.exists) {
        Alert.alert("Başarılı", "Dosya başarıyla indi ve kaydedildi.");
        console.log("✅ İndirme Tamam:", resultFile.uri);        
        return resultFile.uri; 
    } else {
        throw new Error("Dosya oluşturulamadı (Exists: false)");
    }

  } catch (err) {
    console.error("Servis Hatası:", err);
    Alert.alert("İndirme Başarısız", err.message);
    throw err; 
  }
};