import React, { useState } from "react";
import { View, ScrollView, StyleSheet, Dimensions,TouchableOpacity,Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import HeroSection from "../../components/HeroSection";
import HorizontalList from "../../components/HorizontalList";
import Footer from "../../components/Footer";
import { useNavigation } from '@react-navigation/native';
const { height } = Dimensions.get("window");

export default function MainScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const [categories, setCategories] = useState([
    "Popular Now",
    "New Releases",
    "Recommended",
  ]);

 const handleSeeAll = (category) => {
  const mockData = [
    { id: "1", name: "The Witcher", year: 2022, genre: "Fantasy" },
    { id: "2", name: "Arcane", year: 2021, genre: "Animation" },
  ];

  navigation.navigate("SeeAllScreen", {
    headerTitle: category,
    listData: mockData,
  });
};
  const handleAdd =()=>{
    navigation.navigate('CreateHorizontalViewScreen');
  }
  const handleHero=()=>{
    navigation.navigate('SerieDetailScreen');
  }
  const handleDownloads = () => {
  const downloadedSeries = [
    { id: "1", name: "Naruto", year: 2002, genre: "Action" },
    { id: "2", name: "Breaking Bad", year: 2008, genre: "Crime" },
  ];

  navigation.navigate("DownloadsScreen", {
    headerTitle: "Downloads",
    listData: downloadedSeries,
  });
};


  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <HeroSection onComponentPress={handleHero} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {categories.map((category, index) => (
          <HorizontalList key={index} title={category} onSeeAll={() => handleSeeAll(category)} />
        ))}
        <TouchableOpacity style={styles.addButton} >
            <Ionicons name="add-circle" size={50} color="#000000ff" onPress={handleAdd} />
        </TouchableOpacity>
        
      </ScrollView>
      <Footer onDownloadsPress={handleDownloads}/>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  scrollContent: {
    paddingBottom: 20,
    gap: height * 0.03,
    alignItems: "center",
  },
  addButton:{
    width:60,
    height:60,
    borderRadius:30,
    backgroundColor: '#C6A14A',
    justifyContent: 'center',
    alignItems: 'center',
    shadowOpacity: 0.5
    
  },
});
