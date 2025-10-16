import React from "react";
import { View, Text, FlatList, StyleSheet, Dimensions, TouchableOpacity } from "react-native";
import VideoCard from "./VideoCard";

const { width, height } = Dimensions.get("window");

export default function HorizontalList({onSeeAll}) {
  const HorizontalListHeight = height * 0.33;
  const data = [1, 2, 3, 4, 5];
  const handleSeeAll = (e)=>{
    e.stopPropagation();
    if (onSeeAll) {
      onSeeAll();
    }
  };
  return (
    <View style={[styles.container, { height: HorizontalListHeight }]}>
      <View style={{flexDirection:"row",justifyContent:"space-between"}}>
        <Text style={styles.title}>Popular Now</Text> 
        <TouchableOpacity onPress={handleSeeAll}>
          <Text style={styles.text}>See All</Text>
        </TouchableOpacity>
        </View>
      <View style={{ flex: 1, justifyContent: "center" }}>
        <FlatList
          data={data}
          horizontal
          keyExtractor={(item) => item.toString()}
          renderItem={() => (
            <VideoCard Height={HorizontalListHeight} />
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
  text: {
    color: "green",
    fontSize: width * 0.045,
    textDecorationLine:"underline",
    textDecorationColor: "green",
    marginBottom: 5,
  }
});
