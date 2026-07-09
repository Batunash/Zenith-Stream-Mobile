import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuthStore } from "../../store/useAuthStore";
import { useLibraryStore } from "../../store/useLibraryStore";
import { useThemeStore } from "../../store/useThemeStore";
import { getThemeColors } from "../../utils/theme";
import Footer from "../../components/Footer";
import Constants from 'expo-constants';
import * as Updates from 'expo-updates';
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native"; 

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { user, logout } = useAuthStore();
  const { clearAll, downloads } = useLibraryStore();
  const { theme, setTheme, getActiveTheme } = useThemeStore();
  const [serverUrl, setServerUrl] = useState("");
  const [cloudUrl, setCloudUrl] = useState("");
  
  const colors = getThemeColors(getActiveTheme());

  useEffect(() => {
    AsyncStorage.getItem("server-url").then((url) => setServerUrl(url || t('common.unknown')));
    AsyncStorage.getItem("cloud-url").then((url) => setCloudUrl(url || ""));
  }, []);

  const handleLogout = () => {
    Alert.alert(t('settings.logout'), t('settings.logout_confirm_msg'), [
      { text: t('common.cancel'), style: "cancel" },
      { 
          text: t('settings.logout'), 
          style: "destructive", 
          onPress: async () => {
              logout(); 
          } 
      },
    ]);
  };

  const handleDisconnectServer = async () => {
    Alert.alert(t('settings.disconnect_title'), t('settings.disconnect_msg'), [
      { text: t('common.cancel'), style: "cancel" },
      { 
        text: t('settings.disconnect_btn'), 
        style: "destructive", 
        onPress: async () => {
            try {
                await AsyncStorage.removeItem("server-url");
                await Updates.reloadAsync();
            } catch (error) {
                Alert.alert(t('common.error'), t('common.restart_error'));
            }
        }
      },
    ]);
  };

  const handleClearCache = () => {
    Alert.alert(t('settings.clear_cache_title'), t('settings.clear_cache_msg'), [
      { text: t('common.cancel'), style: "cancel" },
      { 
        text: t('common.delete'), 
        style: "destructive", 
        onPress: () => {
            clearAll();
            Alert.alert(t('common.success'), t('settings.library_cleared'));
        }
      },
    ]);
  };

  const SettingItem = ({ icon, title, subtitle, onPress, color = "white", danger = false, testID }) => (
    <TouchableOpacity testID={testID} style={[styles.item, { borderBottomColor: colors.border }]} onPress={onPress} disabled={!onPress}>
      <View style={[styles.iconBox, { backgroundColor: danger ? colors.dangerBg : colors.border }]}>
        <Ionicons name={icon} size={22} color={danger ? colors.danger : colors.primary} />
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.itemTitle, { color: danger ? colors.danger : colors.text }]}>{title}</Text>
        {subtitle && <Text style={[styles.itemSub, { color: colors.subText }]} numberOfLines={1}>{subtitle}</Text>}
      </View>
      {onPress && <Ionicons name="chevron-forward" size={20} color={colors.subText} />}
    </TouchableOpacity>
  );

  const handleLanguageChange = () => {
    const langs = [
      { code: 'en', label: 'English' },
      { code: 'tr', label: 'Türkçe' },
      { code: 'es', label: 'Español' },
      { code: 'de', label: 'Deutsch' },
    ];
    
    Alert.alert(t('settings.language'), '', langs.map(l => ({
      text: l.label,
      onPress: () => i18n.changeLanguage(l.code)
    })).concat([{ text: t('common.cancel'), style: 'cancel' }]));
  };

  const handleThemeChange = () => {
    const themes = [
      { code: 'light', label: t('settings.theme_light') },
      { code: 'dark', label: t('settings.theme_dark') },
      { code: 'system', label: t('settings.theme_system') },
    ];
    
    Alert.alert(t('settings.theme'), '', themes.map(th => ({
      text: th.label,
      onPress: () => setTheme(th.code)
    })).concat([{ text: t('common.cancel'), style: 'cancel' }]));
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('settings.title')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <View style={[styles.profileCard, { backgroundColor: colors.cardBackground }]}>
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                <Text style={styles.avatarText}>{user?.username?.charAt(0).toUpperCase() || "U"}</Text>
            </View>
            <View>
                <Text style={[styles.username, { color: colors.text }]}>{user?.username || t('common.unknown')}</Text>
            </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.subText }]}>{t('settings.section_server')}</Text>
        <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
            <SettingItem
                icon="server-outline"
                title={t('settings.server_address')}
                subtitle={serverUrl}
                /* istanbul ignore next */
                onPress={() => {}}
            />
            <SettingItem
                icon="qr-code-outline"
                title={t('settings.change_server')}
                subtitle={t('settings.change_server_sub')}
                onPress={handleDisconnectServer}
                danger
            />
        </View>

        <Text style={[styles.sectionTitle, { color: colors.subText }]}>Cloud Sync</Text>
        <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
            <SettingItem
                icon="cloud-outline"
                title="Cloud Connection"
                subtitle={cloudUrl ? "Connected" : "Not connected"}
                onPress={() => navigation.navigate('CloudConnection')}
            />
        </View>

        <Text style={[styles.sectionTitle, { color: colors.subText }]}>{t('settings.section_storage')}</Text>
        <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
            <SettingItem 
                icon="trash-bin-outline" 
                title={t('settings.clear_downloads')} 
                subtitle={t('settings.videos_downloaded', { count: downloads.length })}
                onPress={handleClearCache}
            />
        </View>

        <Text style={[styles.sectionTitle, { color: colors.subText }]}>{t('settings.section_app')}</Text>
        <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
            <SettingItem 
                testID="settings-language"
                icon="language-outline" 
                title={t('settings.language')}
                subtitle={i18n.language?.toUpperCase() || 'EN'}
                onPress={handleLanguageChange}
            />
            <SettingItem 
                testID="settings-theme"
                icon="color-palette-outline" 
                title={t('settings.theme')}
                subtitle={t(`settings.theme_${theme}`)}
                onPress={handleThemeChange}
            />
            <SettingItem 
                icon="log-out-outline" 
                title={t('settings.logout')} 
                onPress={handleLogout}
            />
        </View>

        <Text style={[styles.version, { color: colors.subText }]}>Video Hub Mobile v{Constants.expoConfig?.version || "1.0.0"}</Text>

      </ScrollView>

      <Footer />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1 },
  headerTitle: { fontSize: 28, fontWeight: "bold" },
  scrollContent: { padding: 20, paddingBottom: 100 },
  
  profileCard: { flexDirection: "row", alignItems: "center", padding: 20, borderRadius: 16, marginBottom: 30 },
  avatar: { width: 60, height: 60, borderRadius: 30, alignItems: "center", justifyContent: "center", marginRight: 15 },
  avatarText: { color: "black", fontSize: 24, fontWeight: "bold" },
  username: { fontSize: 20, fontWeight: "bold" },
  role: { fontSize: 14, marginTop: 4 },

  sectionTitle: { fontSize: 14, fontWeight: "bold", marginBottom: 10, marginLeft: 5, textTransform: "uppercase" },
  section: { borderRadius: 12, marginBottom: 25, overflow: "hidden" },
  
  item: { flexDirection: "row", alignItems: "center", padding: 15, borderBottomWidth: 1 },
  iconBox: { width: 36, height: 36, borderRadius: 8, alignItems: "center", justifyContent: "center", marginRight: 15 },
  textContainer: { flex: 1 },
  itemTitle: { fontSize: 16, fontWeight: "500" },
  itemSub: { fontSize: 12, marginTop: 2 },
  
  version: { textAlign: "center", fontSize: 12, marginTop: 20 }
});