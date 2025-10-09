import React from "react";
import { View, Text, FlatList, StyleSheet, Dimensions } from "react-native";
import VideoCard from "./VideoCard";

const { width, height } = Dimensions.get("window");

export default function HorizontalList() {
  const HorizontalListHeight = height * 0.33;
  const data = [1, 2, 3, 4, 5];

  return (
    <View style={[styles.container, { height: HorizontalListHeight }]}>
      <Text style={styles.title}>Popular Now</Text>
      <View style={{ flex: 1, justifyContent: "center" }}>
        <FlatList
          data={data}
          horizontal
          keyExtractor={(item) => item.toString()}
          renderItem={() => (
            <VideoCard HorizontalListHeight={HorizontalListHeight} />
          )}
          showsHorizontalScrollIndicator={false}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    backgroundColor: "#1A1A1A",
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  title: {
    color: "white",
    fontSize: width * 0.045,
    fontWeight: "bold",
    marginBottom: 5,
  },
});
