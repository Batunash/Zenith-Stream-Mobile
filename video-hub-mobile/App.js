import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './navigation/RootNavigator';
import './services/i18n';
import { registerBackgroundFetchAsync } from './services/backgroundService';

export default function App() {
  useEffect(() => {
    registerBackgroundFetchAsync();
  }, []);

  return (
    <SafeAreaProvider>
      <RootNavigator />
    </SafeAreaProvider>
  );
}
