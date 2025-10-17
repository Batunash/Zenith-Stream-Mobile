import React, { useState } from "react";
import { View, Image,ImageBackground, StyleSheet,Dimensions,Text,TouchableOpacity} from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from '@react-navigation/native';
const { width, height } = Dimensions.get("window");


export default function SerieDetailScreen(){
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    
    return(
        <View
              style={[
                styles.container,
                { paddingTop: insets.top, paddingBottom: insets.bottom },
              ]}
        >


        </View>
    )

}
const styles=StyleSheet.create({
    container: {
    flex: 1,
    backgroundColor: "#121212",
  },
}
)