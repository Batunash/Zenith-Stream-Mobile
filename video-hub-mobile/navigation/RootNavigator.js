import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuthStore } from "../store/useAuthStore";
import AppStack from "./AppStack";
import AuthStack from "./AuthStack";
import ConnectionScreen from "../screens/AuthScreens/ConnectionScreen";
import SplashScreen from "../screens/splashScreen";

export default function RootNavigator() {
  const token = useAuthStore((state) => state.token);
  const [loading, setLoading] = useState(true);
  const [serverUrl, setServerUrl] = useState(null);
  const [isSetupDone, setIsSetupDone] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const url = await AsyncStorage.getItem("server-url");
        if (url) {
            setServerUrl(url);
            setIsSetupDone(true);
        }
      } catch (e) {
        console.log("Init error:", e);
      } finally {
        setTimeout(() => setLoading(false), 1000);
      }
    };
    init();
  }, []);

  if (loading) return <SplashScreen />;
  return (
    <NavigationContainer>
      {!isSetupDone ? (
        <ConnectionScreen
          onConnectionSuccess={async (newUrl) => {
            await AsyncStorage.setItem("server-url", newUrl);
            setServerUrl(newUrl);
            setIsSetupDone(true); 
          }}
        />
      ) : (
        token ? <AppStack /> : <AuthStack />
      )}
    </NavigationContainer>
  );
}