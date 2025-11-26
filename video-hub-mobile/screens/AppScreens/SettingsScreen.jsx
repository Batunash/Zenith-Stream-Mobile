import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuthStore } from "../../store/useAuthStore";
import { useLibraryStore } from "../../store/useLibraryStore";
import Footer from "../../components/Footer";
import Constants from 'expo-constants';
import * as Updates from 'expo-updates'; 

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuthStore();
  const { clearAll, downloads } = useLibraryStore();
  const [serverUrl, setServerUrl] = useState("");

  useEffect(() => {
    AsyncStorage.getItem("server-url").then((url) => setServerUrl(url || "Bilinmiyor"));
  }, []);
  const handleLogout = () => {
    Alert.alert("Çıkış Yap", "Hesabınızdan çıkış yapmak istiyor musunuz?", [
      { text: "İptal", style: "cancel" },
      { 
          text: "Çıkış Yap", 
          style: "destructive", 
          onPress: async () => {
              logout(); 
          } 
      },
    ]);
  };
  const handleDisconnectServer = async () => {
    Alert.alert("Sunucu Bağlantısını Kes", "Sunucu adresi silinecek ve QR tarama ekranına dönülecek. Oturumunuz açık kalacaktır.", [
      { text: "İptal", style: "cancel" },
      { 
        text: "Bağlantıyı Kes", 
        style: "destructive", 
        onPress: async () => {
            try {
                await AsyncStorage.removeItem("server-url");
                await Updates.reloadAsync();
            } catch (error) {
                Alert.alert("Hata", "Yeniden başlatılamadı, lütfen uygulamayı kapatıp açın.");
            }
        }
      },
    ]);
  };

  const handleClearCache = () => {
    Alert.alert("İndirilenleri Sil", "Cihazdaki tüm indirilen videolar silinecek. Emin misiniz?", [
      { text: "İptal", style: "cancel" },
      { 
        text: "Sil", 
        style: "destructive", 
        onPress: () => {
            clearAll();
            Alert.alert("Başarılı", "Kütüphane temizlendi.");
        }
      },
    ]);
  };

  const SettingItem = ({ icon, title, subtitle, onPress, color = "white", danger = false }) => (
    <TouchableOpacity style={styles.item} onPress={onPress}>
      <View style={[styles.iconBox, { backgroundColor: danger ? "rgba(239,68,68,0.2)" : "#222" }]}>
        <Ionicons name={icon} size={22} color={danger ? "#ef4444" : "#C6A14A"} />
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.itemTitle, danger && { color: "#ef4444" }]}>{title}</Text>
        {subtitle && <Text style={styles.itemSub} numberOfLines={1}>{subtitle}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={20} color="#555" />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ayarlar</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.profileCard}>
            <View style={styles.avatar}>
                <Text style={styles.avatarText}>{user?.username?.charAt(0).toUpperCase() || "U"}</Text>
            </View>
            <View>
                <Text style={styles.username}>{user?.username || "Kullanıcı"}</Text>
            </View>
        </View>

        <Text style={styles.sectionTitle}>Sunucu & Bağlantı</Text>
        <View style={styles.section}>
            <SettingItem 
                icon="server-outline" 
                title="Sunucu Adresi" 
                subtitle={serverUrl}
                onPress={() => {}} 
            />
            <SettingItem 
                icon="qr-code-outline" 
                title="Sunucu Değiştir (QR Tara)" 
                subtitle="Oturumu kapatmadan sunucu değiştirir"
                onPress={handleDisconnectServer}
                danger
            />
        </View>

        <Text style={styles.sectionTitle}>Depolama</Text>
        <View style={styles.section}>
            <SettingItem 
                icon="trash-bin-outline" 
                title="İndirilenleri Temizle" 
                subtitle={`${downloads.length} video indirildi`}
                onPress={handleClearCache}
            />
        </View>

        <Text style={styles.sectionTitle}>Uygulama</Text>
        <View style={styles.section}>
            <SettingItem 
                icon="log-out-outline" 
                title="Çıkış Yap" 
                onPress={handleLogout}
            />
        </View>

        <Text style={styles.version}>Video Hub Mobile v{Constants.expoConfig?.version || "1.0.0"}</Text>

      </ScrollView>

      <Footer />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212" },
  header: { paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: "#222" },
  headerTitle: { color: "white", fontSize: 28, fontWeight: "bold" },
  scrollContent: { padding: 20, paddingBottom: 100 },
  
  profileCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#1A1A1A", padding: 20, borderRadius: 16, marginBottom: 30 },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: "#C6A14A", alignItems: "center", justifyContent: "center", marginRight: 15 },
  avatarText: { color: "black", fontSize: 24, fontWeight: "bold" },
  username: { color: "white", fontSize: 20, fontWeight: "bold" },
  role: { color: "#888", fontSize: 14, marginTop: 4 },

  sectionTitle: { color: "#666", fontSize: 14, fontWeight: "bold", marginBottom: 10, marginLeft: 5, textTransform: "uppercase" },
  section: { backgroundColor: "#1A1A1A", borderRadius: 12, marginBottom: 25, overflow: "hidden" },
  
  item: { flexDirection: "row", alignItems: "center", padding: 15, borderBottomWidth: 1, borderBottomColor: "#222" },
  iconBox: { width: 36, height: 36, borderRadius: 8, alignItems: "center", justifyContent: "center", marginRight: 15 },
  textContainer: { flex: 1 },
  itemTitle: { color: "white", fontSize: 16, fontWeight: "500" },
  itemSub: { color: "#666", fontSize: 12, marginTop: 2 },
  
  version: { textAlign: "center", color: "#444", fontSize: 12, marginTop: 20 }
});