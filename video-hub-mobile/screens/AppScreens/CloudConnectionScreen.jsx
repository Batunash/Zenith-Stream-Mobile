import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";
import api from "../../lib/api";

export default function CloudConnectionScreen({ onCloudConnected }) {
  const { t } = useTranslation();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [cloudUrl, setCloudUrl] = useState("");

  useEffect(() => {
    checkCloudConnection();
  }, []);

  const checkCloudConnection = async () => {
    try {
      const url = await AsyncStorage.getItem("cloud-url");
      if (url) {
        setCloudUrl(url);
        setIsConnected(true);
      }
    } catch (error) {
      console.error("Cloud check error:", error);
    }
  };

  const handleConnect = async () => {
    if (!cloudUrl || !cloudUrl.startsWith("http")) {
      Alert.alert(t('common.error'), "Invalid URL. Must start with http:// or https://");
      return;
    }

    setIsLoading(true);
    try {
      await api.get("/health");

      await AsyncStorage.setItem("cloud-url", cloudUrl);
      setIsConnected(true);

      if (onCloudConnected) {
        onCloudConnected(cloudUrl);
      }

      Alert.alert("Success", "Connected to cloud server");
    } catch (error) {
      Alert.alert("Error", "Failed to connect to cloud server");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = () => {
    Alert.alert(
      "Disconnect Cloud",
      "Are you sure you want to disconnect from the cloud server?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Disconnect",
          style: "destructive",
          onPress: async () => {
            await AsyncStorage.removeItem("cloud-url");
            setIsConnected(false);
            setCloudUrl("");
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cloud Connection</Text>
      <Text style={styles.subtitle}>Connect to your cloud server to access your media from anywhere</Text>

      {isConnected ? (
        <View style={styles.connectedContainer}>
          <View style={styles.statusBox}>
            <Text style={styles.statusIcon}>✓</Text>
            <Text style={styles.statusText}>Connected</Text>
          </View>
          <Text style={styles.urlText}>{cloudUrl}</Text>

          <TouchableOpacity
            style={[styles.button, styles.disconnectButton]}
            testID="disconnect-btn"
            onPress={handleDisconnect}
          >
            <Text style={styles.buttonText}>Disconnect</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.formContainer}>
          <Text style={styles.label}>Cloud Server URL</Text>
          <TextInput
            style={styles.input}
            value={cloudUrl}
            onChangeText={setCloudUrl}
            placeholder="https://your-server.com"
            placeholderTextColor="#666"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            testID="connect-btn"
            onPress={handleConnect}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="black" />
            ) : (
              <Text style={styles.buttonText}>Connect</Text>
            )}
          </TouchableOpacity>

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              Enter your cloud server URL to access your media library from anywhere.
              Make sure your server is running and accessible.
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", padding: 20 },
  title: { color: "white", fontSize: 28, fontWeight: "bold", textAlign: "center", marginBottom: 10 },
  subtitle: { color: "#aaa", textAlign: "center", marginBottom: 40, lineHeight: 20 },
  connectedContainer: { alignItems: "center" },
  statusBox: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  statusIcon: { fontSize: 40, color: "#4ade80", marginRight: 10 },
  statusText: { color: "#4ade80", fontSize: 20, fontWeight: "bold" },
  urlText: { color: "#888", marginBottom: 30 },
  formContainer: {},
  label: { color: "#ccc", marginBottom: 10, marginLeft: 5 },
  input: { backgroundColor: "#1a1a1a", color: "white", padding: 15, borderRadius: 8, marginBottom: 20, borderWidth: 1, borderColor: "#333" },
  button: { backgroundColor: "#C6A14A", padding: 15, borderRadius: 8, alignItems: "center", marginBottom: 10 },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { fontWeight: "bold", fontSize: 16, color: "black" },
  disconnectButton: { backgroundColor: "#ef4444" },
  infoBox: { backgroundColor: "#1a1a1a", padding: 15, borderRadius: 8, borderWidth: 1, borderColor: "#333" },
  infoText: { color: "#888", fontSize: 12, lineHeight: 18 }
});
