import React, { useState } from "react";
import { View, FlatList, StyleSheet, Dimensions,TouchableOpacity,Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from '@react-navigation/native';
import Serie from "../../components/Serie";
import Footer from "../../components/Footer";


const { height ,width} = Dimensions.get("window");
const data =[1,2,3,4,5]
const sampleSerie = { 
  id: '1',
  name: 'The Witcher: Blood Origin',
  year: 2022,
  genre: 'Fantasy',
  imageUrl: "../../assets/logo.png"
};
export default function SeeAllScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const handleGoBack = () => {
    navigation.goBack();
    console.log("Geri butonuna basıldı!");
  };
    return(
        <View
              style={[
                styles.container,
                { paddingTop: insets.top, paddingBottom: insets.bottom },
              ]}
            >
            <View style={styles.top}>
                <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
                    <Ionicons name="arrow-back-outline" size={32} color="#ffffff" />
                </TouchableOpacity>
                <Text style={styles.header}>Header</Text>
             </View>
            <View style={{ flex: 1, justifyContent: "center" }}>
                <FlatList
                        data={data}
                        row
                        keyExtractor={(item) => item.toString()}
                        renderItem={() => (
                            <Serie serie={sampleSerie}/>
                        )}
                        showsHorizontalScrollIndicator={false}
                        />
            </View>
            <Footer />
        </View>
    )

}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  top: {
    flexDirection: "row",
    alignItems: "center", 
    paddingHorizontal: 16, 
    paddingVertical: 10,
  },
  header: {
    color: "white",
    fontSize: width * 0.07, 
    fontWeight: "bold",
    marginLeft: 16, 
  },
  backButton: {
    padding: 5, 
  },
  
});
