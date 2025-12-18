import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
const api = axios.create({
  baseURL: "", 
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});
api.interceptors.request.use(
  async (config) => {
    const serverUrl = await AsyncStorage.getItem("server-url");    
    if (serverUrl) {
      const cleanUrl = serverUrl.endsWith("/api") 
        ? serverUrl 
        : `${serverUrl}/api`;
        
      config.baseURL = cleanUrl;
    } else {
      console.log("⚠️ Uyarı: Henüz server-url ayarlanmamış.");
    }
    const jsonValue = await AsyncStorage.getItem("auth-storage");
    
    if (jsonValue) {
      const parsed = JSON.parse(jsonValue);
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