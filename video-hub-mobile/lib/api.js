import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// 1. BaseURL'i BOŞ bırakıyoruz. (Sabit IP yok, her şey dinamik)
const api = axios.create({
  baseURL: "", 
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

// Request Interceptor (Her istekten önce burası çalışır)
api.interceptors.request.use(
  async (config) => {
    // ---------------------------------------------------------
    // A) DİNAMİK URL AYARI
    // ---------------------------------------------------------
    const serverUrl = await AsyncStorage.getItem("server-url");
    
    if (serverUrl) {
      // Kullanıcının girdiği URL'in sonuna /api ekle (yoksa)
      const cleanUrl = serverUrl.endsWith("/api") 
        ? serverUrl 
        : `${serverUrl}/api`;
        
      config.baseURL = cleanUrl;
    } else {
      // Eğer URL yoksa (henüz login olmadıysa) isteği iptal et veya logla
      console.log("⚠️ Uyarı: Henüz server-url ayarlanmamış.");
    }

    // ---------------------------------------------------------
    // B) TOKEN AYARI (useAuthStore KULLANMADAN - DÖNGÜSÜZ)
    // ---------------------------------------------------------
    // Token'ı 'useAuthStore' dosyasını import etmeden, direkt depodan okuyoruz.
    // Böylece "useAuthStore -> api -> useAuthStore" kilidi oluşmuyor.
    const jsonValue = await AsyncStorage.getItem("auth-storage");
    
    if (jsonValue) {
      const parsed = JSON.parse(jsonValue);
      // Zustand veriyi { state: { token: "..." } } şeklinde saklar
      const token = parsed?.state?.token;
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default api;