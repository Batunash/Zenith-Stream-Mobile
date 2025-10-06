import React, { useState } from "react";
import { View, Image,ImageBackground, StyleSheet,Dimensions,Text,TouchableOpacity} from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import VideoCard from './VideoCard';
const { width, height } = Dimensions.get("window");

export default function (){
    const HorizontalListHeight = height*0.33;
    return(
        <View style={[styles.container,{height:HorizontalListHeight}]}>
            <Text>HorizontalListHeight</Text>
            <VideoCard HorizontalListHeight={HorizontalListHeight} />
        </View>
    )
}
const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#352c2cff',
  },
})