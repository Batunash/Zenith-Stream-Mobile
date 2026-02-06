
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
import { useTranslation } from "react-i18next";

const { width, height } = Dimensions.get("window");

export default function HorizontalList({ title, data = [], onSeeAll, onCardPress, onEdit, onDelete }) {
  const { t } = useTranslation();
  const HorizontalListHeight = height * 0.33;

  if (!Array.isArray(data) || data.length === 0) return null;

  const handleSeeAll = useCallback(
    (e) => {
      e?.stopPropagation?.();
      onSeeAll?.();
    },
    [onSeeAll]
  );

  const handleEdit = useCallback(() => {
    onEdit?.();
  }, [onEdit]);

  const handleDelete = useCallback(() => {
    onDelete?.();
  }, [onDelete]);

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
        <View style={styles.headerActions}>
          {(onEdit || onDelete) && (
            <View style={styles.editActions}>
              {onEdit && (
                <TouchableOpacity onPress={handleEdit} style={styles.actionBtn}>
                  <Text style={{ color: '#C6A14A', fontSize: 18 }}>✎</Text>
                </TouchableOpacity>
              )}
              {onDelete && (
                <TouchableOpacity onPress={handleDelete} style={styles.actionBtn}>
                  <Text style={{ color: '#ef4444', fontSize: 18 }}>🗑</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          <TouchableOpacity
            onPress={handleSeeAll}
            activeOpacity={0.7}
            accessibilityLabel="See all"
            accessibilityRole="button"
          >
            <Text style={styles.seeAll}>{t('common.see_all')}</Text>
          </TouchableOpacity>
        </View>
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15
  },
  editActions: {
    flexDirection: 'row',
    gap: 15,
    marginRight: 10,
    borderRightWidth: 1,
    borderRightColor: '#333',
    paddingRight: 15
  },
  actionBtn: {
    padding: 4
  }
});
