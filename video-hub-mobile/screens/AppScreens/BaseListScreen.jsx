import React, { useCallback } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Text,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import Serie from "../../components/Serie";
import Footer from "../../components/Footer";
import { useTranslation } from "react-i18next"; 
const { width } = Dimensions.get("window");

export default function BaseListScreen({
  headerTitle,
  listData = [],
  onSeriePress,
  onPlayPress,
  showDownloadedEpisodes = false,
}) {
  const { t } = useTranslation(); 
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const renderEmpty = useCallback(() => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>{t('list.empty_title')}</Text>
      <Text style={styles.emptySub}>{t('list.empty_sub')}</Text>
    </View>
  ), []);

  const renderItem = useCallback(
    ({ item }) => (
      <Serie
        serie={item}
        onSeriePress={() => onSeriePress?.(item.id)}
        onPlayPress={onPlayPress}
        showDownloadedEpisodes={showDownloadedEpisodes}
      />
    ),
    [onSeriePress, onPlayPress, showDownloadedEpisodes]
  );

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <View style={styles.top}>
        <TouchableOpacity
          onPress={handleGoBack}
          style={styles.backButton}
          accessibilityLabel="Go back to previous screen"
          accessibilityRole="button"
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back-outline" size={32} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.header} numberOfLines={1}>
          {headerTitle || t('main.my_list')} 
        </Text>
      </View>
      <FlatList
        data={listData}
        keyExtractor={(item, index) => String(item?.id ?? index)}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={
          listData.length === 0 && { flexGrow: 1, justifyContent: "center" }
        }
      />

      <Footer />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  top: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  header: {
    color: "white",
    fontSize: width * 0.07,
    fontWeight: "bold",
    marginLeft: 16,
    flexShrink: 1,
  },
  backButton: {
    padding: 5,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    color: "#aaa",
    fontSize: width * 0.045,
    fontWeight: "bold",
  },
  emptySub: {
    color: "#777",
    fontSize: width * 0.04,
    marginTop: 6,
  },
});