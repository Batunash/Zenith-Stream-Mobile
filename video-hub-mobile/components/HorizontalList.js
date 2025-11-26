import React, { useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import VideoCard from "./VideoCard";

const { width, height } = Dimensions.get("window");

export default function HorizontalList({ title, data = [], onSeeAll, onCardPress }) {
  const HorizontalListHeight = height * 0.33;

  if (!Array.isArray(data) || data.length === 0) return null;

  const handleSeeAll = useCallback(
    (e) => {
      e?.stopPropagation?.();
      onSeeAll?.();
    },
    [onSeeAll]
  );

  const renderItem = useCallback(
    ({ item }) => (
      <VideoCard
        Height={HorizontalListHeight}
        data={item}
        onPress={() => onCardPress?.(item)}
      />
    ),
    [onCardPress, HorizontalListHeight]
  );

  return (
    <View
      style={[
        styles.container,
        { height: HorizontalListHeight, minHeight: 150 },
      ]}
    >
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <TouchableOpacity
          onPress={handleSeeAll}
          activeOpacity={0.7}
          accessibilityLabel={`See all series in ${title}`}
          accessibilityRole="button"
        >
          <Text style={styles.seeAll}>See All</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={data}
        horizontal
        keyExtractor={(item, index) => String(item?.id ?? index)}
        renderItem={renderItem}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    backgroundColor: "#1A1A1A",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  title: {
    color: "white",
    fontSize: width * 0.045,
    fontWeight: "bold",
    flexShrink: 1,
  },
  seeAll: {
    color: "#C6A14A",
    fontSize: width * 0.04,
    textDecorationLine: "underline",
  },
  listContent: {
    paddingRight: 10,
  },
});
