import React from 'react';
import { View, Image, StyleSheet,Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get("window");

export default function SplashScreen() {
  const insets = useSafeAreaInsets(); // top, bottom, left, right boşluk değerleri

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
       <Image source={require('../assets/logo.png')}style={styles.Image}/>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000ff',
    alignItems:"center",
    justifyContent: "center",
  },
  Image:{
    width: width * 0.6,  
    height: width * 0.6, 
  }
});
