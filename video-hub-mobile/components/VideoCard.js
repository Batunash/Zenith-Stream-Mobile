import React from "react";
import { View, Image, StyleSheet, Dimensions, TouchableOpacity, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

export default function VideoCard({ Height, isSelected, onPress, data }) {
  const cardHeight = Height * 0.66;
  const cardWidth = width * 0.35;

  return (
    <TouchableOpacity
      style={[styles.container, { height: cardHeight, width: cardWidth }]}
      onPress={onPress}
    >
      <Image
        source={{ uri: data?.poster }}
        resizeMode="cover"
        style={styles.image}
      />
      {isSelected && (
        <>
          <View style={styles.overlay} />
          <View style={styles.tickContainer}>
            <Ionicons name="checkmark-circle" size={28} color="#C6A14A" />
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
    height: "85%",
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  tickContainer: {
    position: "absolute",
    top: 8,
    right: 8,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 10,
  },
});
