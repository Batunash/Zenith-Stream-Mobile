import React, { useEffect, useState, createContext } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import AppStack from './AppStack';
import AuthStack from './AuthStack';
import SplashScreen from '../screens/splashScreen';

export const AuthContext = createContext();

export default function RootNavigator() {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);

  const checkLoginStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      setTimeout(() => {
        setUserToken(token);
        setIsLoading(false);
      }, 2000);
      
    } catch (e) {
      console.log('Token okuma hatası:', e);
      
      setTimeout(() => {
        setIsLoading(false);
      }, 2000);
    }
  };

  useEffect(() => {
    checkLoginStatus();
  }, []);

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <AuthContext.Provider value={{ userToken, setUserToken }}>
      <NavigationContainer>
        {userToken ? <AuthStack /> : <AppStack />} 
      </NavigationContainer>
    </AuthContext.Provider>
  );
}