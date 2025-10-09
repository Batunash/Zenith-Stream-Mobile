import React from "react";
import { View, Image, StyleSheet, Dimensions } from "react-native";

const { width } = Dimensions.get("window");

export default function VideoCard({ HorizontalListHeight }) {
  const cardHeight = HorizontalListHeight * 0.66;
  const cardWidth = width * 0.35; // orantılı genişlik

  return (
    <View style={[styles.container, { height: cardHeight, width: cardWidth }]}>
      <Image
        source={require("../assets/logo.png")}
        resizeMode="cover"
        style={styles.image}
      />
    </View>
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
  },
});
