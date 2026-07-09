import React, { useState, useEffect } from "react";
import { View, Image, ImageBackground, StyleSheet, Dimensions, Text, TouchableOpacity, Pressable } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next"; 
const { width, height } = Dimensions.get("window");

import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

export default function HeroSection({data, onComponentPress, onPlayPress}){
    const { t } = useTranslation();
    const logosize = width*0.20;
    const [imageUri, setImageUri] = useState(
        data?.localPoster || data?.backdrop || data?.poster
    );
    
    // Animation for the entire hero banner
    const heroScale = useSharedValue(1);
    const heroAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: heroScale.value }]
    }));

    // Animation for the play button
    const playButtonScale = useSharedValue(1);
    const playButtonAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: playButtonScale.value }]
    }));

    useEffect(() => {
        setImageUri(data?.localPoster || data?.backdrop || data?.poster);
    }, [data]);

    const handleError = () => {
        if (imageUri === data?.localPoster) {
            setImageUri(data?.backdrop || data?.poster);
        } else if (imageUri === data?.backdrop) {
            setImageUri(data?.poster);
        }
    };

    return(
        <Pressable 
            style={[styles.container, { height: height * 0.33 }]} 
            onPress={onComponentPress}
            onPressIn={() => heroScale.value = withSpring(0.97)}
            onPressOut={() => heroScale.value = withSpring(1)}
            testID="hero-container"
        >
            <Animated.View style={[{flex: 1, width: '100%'}, heroAnimatedStyle]}>
                 <ImageBackground 
                      source={{uri: imageUri}} 
                      resizeMode="cover" 
                      style={styles.bgimage}
                      onError={handleError}
                      testID="hero-image"
                  >
                      <View style={styles.overlay} />
                          <Image source={require('../assets/logo.png')} style={[styles.logo,{width: logosize, height: logosize}]} />
                      <View style={styles.content}>
                          <Text style={styles.headerText}>{data?.title || t('main.unknown_title')}</Text>
                          <Pressable 
                              onPress={() => onPlayPress(data.id)} 
                              onPressIn={() => playButtonScale.value = withSpring(0.9)}
                              onPressOut={() => playButtonScale.value = withSpring(1)}
                              testID="hero-play"
                          >
                              <Animated.View style={[styles.buttonPlay, playButtonAnimatedStyle]}>
                                  <Ionicons name="play-circle" size={20} color="#000000ff" />
                                  <Text style={styles.buttonText}>{t('detail.play')}</Text>
                              </Animated.View>
                          </Pressable>
                      </View>
                  </ImageBackground>
            </Animated.View>
        </Pressable>            
    );
}
const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#121212',
  },
  logo: {
    position: 'absolute',
    top:20,
    left:20,
    resizeMode: 'contain',
  },
  bgimage: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems:'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  content:{
    flex :1,
    position: 'absolute',
    left: 30,
    bottom: 30,
    flexDirection: 'column',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
  },
  buttonPlay:{
    flexDirection: 'row',
    width: width * 0.2,
    height: height * 0.04,
    backgroundColor: "#C6A14A",
    borderRadius: width * 0.03,
    alignItems: "center",
    justifyContent: "center",

  },
  buttonText:{
    color: "white",
    fontWeight: "bold",
    marginLeft: 5,
    fontSize: width * 0.04, 
  },
  headerText:{
    color: "white",
    fontWeight: "bold",
    fontSize: width * 0.05
  },
});