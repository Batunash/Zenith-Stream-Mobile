import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// App ekranlarını içe aktar
import Main from '../screens/AppScreens/MainScreen'
import SeeAllScreen from '../screens/AppScreens/SeeAllScreen'
import DownloadsScreen from '../screens/AppScreens/DownloadsScreen';
import SerieDetailScreen from '../screens/AppScreens/SerieDetailScreen';
import CreateHorizontalViewScreen from '../screens/AppScreens/CreateHorizontalViewScreen'
const Stack = createNativeStackNavigator();

export default function AuthStack() {
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
       <Stack.Screen name="SerieDetailScreen"component={SerieDetailScreen} />
      
    </Stack.Navigator>
  );
}
