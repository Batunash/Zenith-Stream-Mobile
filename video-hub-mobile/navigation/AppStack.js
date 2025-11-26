import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import Main from '../screens/AppScreens/MainScreen'
import SeeAllScreen from '../screens/AppScreens/SeeAllScreen'
import DownloadsScreen from '../screens/AppScreens/DownloadsScreen';
import SerieDetailScreen from '../screens/AppScreens/SerieDetailScreen';
import CreateHorizontalViewScreen from '../screens/AppScreens/CreateHorizontalViewScreen'
import VideoPlayer from '../screens/AppScreens/VideoPlayer';
import SettingsScreen from '../screens/AppScreens/SettingsScreen';

const Stack = createNativeStackNavigator();

export default function AppStack() {
  return (
    <Stack.Navigator
      initialRouteName="Main"
      screenOptions={{
        headerShown: false, 
        animation: 'slide_from_right',
      }}
    >
       <Stack.Screen name="Main" component={Main} />
       <Stack.Screen name="SeeAllScreen" component={SeeAllScreen} />
       <Stack.Screen name="DownloadsScreen" component={DownloadsScreen} />
       <Stack.Screen name="CreateHorizontalViewScreen" component={CreateHorizontalViewScreen} />
       <Stack.Screen name="SerieDetailScreen" component={SerieDetailScreen} />
       <Stack.Screen name="VideoPlayer" component={VideoPlayer} />
       <Stack.Screen name="Profile" component={SettingsScreen} />
    </Stack.Navigator>
  );
}