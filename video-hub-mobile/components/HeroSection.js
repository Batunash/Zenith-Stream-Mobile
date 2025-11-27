import React from "react";
import { View, Image, ImageBackground, StyleSheet, Dimensions, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next"; 
const { width, height } = Dimensions.get("window");

export default function HeroSection({data, onComponentPress, onPlayPress}){
    const { t } = useTranslation();
    const logosize = width*0.20;
    return(
        <TouchableOpacity style={[styles.container, { height: height * 0.33 }]} onPress={onComponentPress}>
              <ImageBackground source={{uri: data?.poster}} resizeMode="cover" style={styles.bgimage}>
                  <View style={styles.overlay} />
                      <Image source={require('../assets/logo.png')} style={[styles.logo,{width: logosize, height: logosize}]} />
                  <View style={styles.content}>
                      <Text style={styles.headerText}>{data?.title || t('main.unknown_title')}</Text>
                      <TouchableOpacity style={styles.buttonPlay} onPress={() => onPlayPress(data.id)}>
                          <Ionicons name="play-circle" size={20} color="#000000ff" />
                          <Text style={styles.buttonText}>{t('detail.play')}</Text>
                      </TouchableOpacity>
                  </View>
              </ImageBackground>
        </TouchableOpacity>            
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
    fontSize: width * 0.04, // orantılı yazı boyutu
  },
  headerText:{
    color: "white",
    fontWeight: "bold",
    fontSize: width * 0.05
  },

});