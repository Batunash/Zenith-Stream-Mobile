import axios from "axios";
import { API_URL } from "@env";
import AsyncStorage from "@react-native-async-storage/async-storage";
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});
api.interceptors.request.use(
  async (config) => {
    const serverUrl = await AsyncStorage.getItem("server-url");
    if (serverUrl) {
      config.baseURL = serverUrl; 
    }
    const jsonValue = await AsyncStorage.getItem("auth-storage");
    if (jsonValue) {
      const { state } = JSON.parse(jsonValue); 
      const token = state?.token;
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;