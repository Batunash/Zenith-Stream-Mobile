import React, { useState } from "react";
import { View, Image, StyleSheet,Dimensions,Text,TextInput,TouchableOpacity} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from '@react-navigation/native';
import HeroSection from '../../components/HeroSection';
import HorizontalList from '../../components/HorizontalList';
const { width, height } = Dimensions.get("window");

export default function(){
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();

    return(
        <View style={[styles.container,{ paddingTop: insets.top, paddingBottom: insets.bottom },]}>
            <View style={styles.HeroSection}>
                <HeroSection />
            </View>
            <View style={styles.HorizontalList}>
                <HorizontalList />
            </View>
        </View>
    );

}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffffff",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: height * 0.2, // dikey boşluk da orantılı
  },
  HeroSection:{
    flex: 1,
    width: '100%',
  },
  HorizontalList:{
    flex:1,
    width:'100%'
  }
})