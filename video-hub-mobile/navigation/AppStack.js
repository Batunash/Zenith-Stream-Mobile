import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// App ekranlarını içe aktar
import Main from '../screens/AppScreens/MainScreen'
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
    </Stack.Navigator>
  );
}
