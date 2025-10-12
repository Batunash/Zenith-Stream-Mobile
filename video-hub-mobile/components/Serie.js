import React from "react";
import { View, Image, StyleSheet, Dimensions, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const { width ,height} = Dimensions.get("window");

export default function Serie({ serie }) {
  const cardHeight = width * 0.4; 
  const cardWidth = width - 32; // (16 soldan, 16 sağdan boşluk)

  return (

    <View style={[styles.container, { height: cardHeight, width: cardWidth }]}>
      <Image
        // Dışarıdan gelen resim bilgisini kullanıyoruz.
        source={{ uri: serie.imageUrl }} 
        resizeMode="cover"
        style={styles.image}
      />
      <View style={styles.infoContainer}>
        <View>
          <Text style={styles.name} numberOfLines={2}>{serie.name}</Text>
          <Text style={styles.metadata}>{`${serie.year} | ${serie.genre}`}</Text>
        </View>
        <TouchableOpacity style={styles.buttonPlay}>
          <Ionicons name="play" size={18} color="black" />
          <Text style={styles.buttonText}>Play</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#1A1A1A", 
    borderRadius: 12, 
    flexDirection: "row",
    overflow: "hidden",
    marginHorizontal: 16, 
    marginVertical: 8,
  },
  image: {
    width: "35%", 
    height: "100%",
  },
  infoContainer: {
    flex: 1, 
    padding: 12,
    justifyContent: 'space-between', 
  },
  name: {
    color: "white",
    fontSize: width * 0.045,
    fontWeight: "bold",
  },
  metadata: {
    color: "#B3B3B3",
    fontSize: width * 0.035,
    marginTop: 4,
  },
  buttonPlay:{
    flexDirection: 'row',
    width: width * 0.2,
    height: height * 0.04,
    backgroundColor: "#C6A14A",
    borderRadius: width * 0.03,
    alignItems: "center",
    justifyContent: "center",

  },
  buttonText:{
    color: "white",
    fontWeight: "bold",
    marginLeft: 5,
    fontSize: width * 0.04, 
  },
});