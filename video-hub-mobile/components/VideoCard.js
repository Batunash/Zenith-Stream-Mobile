import React, { useState } from "react";
import { View, Image,ImageBackground, StyleSheet,Dimensions,Text,TouchableOpacity} from 'react-native';
import { Ionicons } from "@expo/vector-icons";
const { width, height } = Dimensions.get("window");

export default function VideoCard(HorizontalListHeight){
    const cardHeight=HorizontalListHeight*0.66;

    return(
        <View style={[styles.container,{height:cardHeight}]}>
            <Image source={require('../assets/logo.png')} resizeMode="cover"/> 
        </View>
    )
}
const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000ff',
  },
})