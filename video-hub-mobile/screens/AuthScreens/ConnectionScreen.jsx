import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { CameraView, useCameraPermissions } from 'expo-camera';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next"; 

export default function ConnectionScreen({ onConnectionSuccess }) {
  const { t } = useTranslation(); 
  const [url, setUrl] = useState(""); 
  const [permission, requestPermission] = useCameraPermissions();
  const [showCamera, setShowCamera] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkLastConnection = async () => {
      try {
        const savedUrl = await AsyncStorage.getItem("server-url");
        if (savedUrl) {
          setUrl(savedUrl); 
        }
      } catch (e) {
        console.error("Yükleme hatası", e);
      } finally {
        setIsLoading(false);
      }
    };
    checkLastConnection();
  }, []);

  const handleSave = async (scannedUrl = null) => {
    const targetUrl = scannedUrl || url;
      if (!targetUrl || !targetUrl.startsWith("http")) {
      Alert.alert(t('common.error'), t('connection.invalid_url'));
      return;
    }
    
    try {
      await AsyncStorage.setItem("server-url", targetUrl);
      if (onConnectionSuccess) {
          onConnectionSuccess(targetUrl); 
      }
    } catch (e) {
      console.error("Kaydetme hatası:", e);
      Alert.alert(t('common.error'), t('connection.save_error'));
    }
  };

  const handleBarCodeScanned = ({ data }) => {
    setShowCamera(false);
    try {
        const parsed = JSON.parse(data);
        if (parsed.url) {
            const fullUrl = parsed.url.endsWith('/api') ? parsed.url : `${parsed.url}/api`;
            handleSave(fullUrl);
        } else {
            Alert.alert(t('common.error'), t('connection.invalid_qr'));
        }
    } catch (e) {
        if (data.startsWith("http")) {
             const fullUrl = data.endsWith('/api') ? data : `${data}/api`;
             handleSave(fullUrl);
        } else {
             Alert.alert(t('common.error'), t('connection.read_error'));
        }
    }
  };

  const openCamera = async () => {
      if (!permission?.granted) {
          const { granted } = await requestPermission();
          if (!granted) {
            Alert.alert(t('common.error'), t('connection.camera_permission_denied'));
            return;
          }
      }
      setShowCamera(true);
  };

  if (showCamera) {
    return (
      <View style={{ flex: 1, backgroundColor: 'black' }}>
        <CameraView 
            style={{ flex: 1 }} 
            onBarcodeScanned={handleBarCodeScanned}
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        />
        <TouchableOpacity style={styles.closeBtn} onPress={() => setShowCamera(false)}>
            <Text style={{color:'white', fontWeight:'bold'}}>{t('common.cancel')}</Text>
        </TouchableOpacity>
        
        <View style={styles.cameraOverlay}>
            <Text style={styles.cameraText}>{t('connection.camera_overlay_text')}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('connection.title')}</Text>
      <Text style={styles.sub}>
        {t('connection.instruction')}
      </Text>

      <TouchableOpacity style={styles.cameraBtn} onPress={openCamera}>
        <Text style={styles.cameraBtnText}>{t('connection.scan_btn')}</Text>
      </TouchableOpacity>

      <View style={styles.divider}>
        <View style={styles.line} />
        <Text style={{color:'#555', marginHorizontal: 10}}>{t('common.or')}</Text>
        <View style={styles.line} />
      </View>

      <Text style={styles.label}>{t('connection.manual_label')}</Text>
      <TextInput 
        style={styles.input} 
        value={url} 
        onChangeText={setUrl} 
        placeholder="http://192.168.1.x:5000/api"
        placeholderTextColor="#666"
        autoCapitalize="none"
        autoCorrect={false}
      />

      <TouchableOpacity 
        style={[styles.btn, { opacity: url ? 1 : 0.5 }]} 
        onPress={() => handleSave()}
        disabled={!url}
      >
        <Text style={styles.btnText}>{t('common.connect')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", justifyContent: "center", padding: 20 },
  title: { color: "white", fontSize: 28, fontWeight: "bold", textAlign: "center", marginBottom: 10 },
  sub: { color: "#aaa", textAlign: "center", marginBottom: 40, lineHeight: 20 },
  cameraBtn: { backgroundColor: "#333", padding: 20, borderRadius: 12, alignItems: "center", marginBottom: 20, borderWidth: 1, borderColor: '#444' },
  cameraBtnText: { color: "#C6A14A", fontWeight: "bold", fontSize: 18 },
  divider: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  line: { flex: 1, height: 1, backgroundColor: '#333' },
  label: { color: '#ccc', marginBottom: 10, marginLeft: 5 },
  input: { backgroundColor: "#1a1a1a", color: "white", padding: 15, borderRadius: 8, marginBottom: 20, borderWidth: 1, borderColor: '#333' },
  btn: { backgroundColor: "#C6A14A", padding: 15, borderRadius: 8, alignItems: "center", marginBottom: 10 },
  btnText: { fontWeight: "bold", fontSize: 16, color: 'black' },
  closeBtn: { position: 'absolute', bottom: 50, alignSelf: 'center', backgroundColor: '#ef4444', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 20, zIndex: 10 },
  cameraOverlay: { position: 'absolute', top: 100, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.6)', padding: 10, borderRadius: 8 },
  cameraText: { color: 'white' }
});