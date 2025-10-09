import React, { useState } from "react";
import { View, ScrollView, StyleSheet, Dimensions,TouchableOpacity,Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import HeroSection from "../../components/HeroSection";
import HorizontalList from "../../components/HorizontalList";
import Footer from "../../components/Footer";
const { height } = Dimensions.get("window");

export default function MainScreen() {
  const insets = useSafeAreaInsets();

  // 🔹 Kullanıcının oluşturduğu kategoriler
  const [categories, setCategories] = useState([
    "Popular Now",
    "New Releases",
    "Recommended",
  ]);

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <HeroSection />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {categories.map((category, index) => (
          <HorizontalList key={index} title={category} />
        ))}
        <TouchableOpacity style={styles.addButton} >
            <Ionicons name="add-circle" size={50} color="#000000ff" />
        </TouchableOpacity>
        
      </ScrollView>
      <Footer  />
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
