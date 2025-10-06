import React, { useState } from "react";
import { View, Image, StyleSheet,Dimensions,Text,TextInput,TouchableOpacity} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from '@react-navigation/native';
const { width, height } = Dimensions.get("window");

export default function(){
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();

    return(
        <View style={[styles.container,{ paddingTop: insets.top, paddingBottom: insets.bottom },]}>
            <Text>Main Screen</Text>
        </View>
    );

}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffffff",
    alignItems: "center",
    justifyContent: "center",
    gap: height * 0.02, // dikey boşluk da orantılı
  },
})