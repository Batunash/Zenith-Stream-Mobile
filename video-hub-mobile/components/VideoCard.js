import React from "react";
import { View, Image, StyleSheet, Dimensions, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
const { width } = Dimensions.get("window");

export default function VideoCard({ Height,isSelected,onPress }) {
  const cardHeight = Height * 0.66;
  const cardWidth = width * 0.35; // orantılı genişlik

  return (
    <TouchableOpacity style={[styles.container, { height: cardHeight, width: cardWidth }]} onPress={onPress}>
      <Image
        source={require("../assets/logo.png")}
        resizeMode="cover"
        style={styles.image}
      />
      {isSelected && (
        <>
          {/* Seçildiğinde kartın üzerine hafif bir karartma efekti ekleyelim */}
          <View style={styles.overlay} />
          
          {/* Tik ikonu ve konumlandırması */}
          <View style={styles.tickContainer}>
            <Ionicons name="checkmark-circle" size={32} color="#4CAF50" />
          </View>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#000",
    borderRadius: 10,
    overflow: "hidden",
    marginHorizontal: 8,
  },
  image: {
    width: "100%",
    height: "100%",
  },tickContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  // Seçildiğinde kartı karartmak için kullanılan stil
  overlay: {
    ...StyleSheet.absoluteFillObject, // View'ın tüm alanı kaplamasını sağlar
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 10,
  },
});
