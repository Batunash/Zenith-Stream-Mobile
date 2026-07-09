import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
const api = axios.create({
  baseURL: "", 
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});
api.interceptors.request.use(
  async (config) => {
    const cloudUrl = await AsyncStorage.getItem("cloud-url");
    const localUrl = await AsyncStorage.getItem("server-url");

    const baseUrl = cloudUrl || localUrl;

    if (baseUrl) {
      const cleanUrl = baseUrl.endsWith("/api")
        ? baseUrl
        : `${baseUrl}/api`;

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