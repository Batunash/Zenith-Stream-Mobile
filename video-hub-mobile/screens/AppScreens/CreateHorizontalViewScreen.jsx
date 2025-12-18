import React, { useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Text,
  TextInput,
  Alert
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import VideoCard from "../../components/VideoCard";
import Footer from "../../components/Footer";
import { useLibraryStore } from "../../store/useLibraryStore";
import { useTranslation } from "react-i18next"; 

const { width, height } = Dimensions.get("window");

export default function CreateHorizontalViewScreen() {
  const { t } = useTranslation(); 
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { series, addList } = useLibraryStore();
  const [categoryName, setCategoryName] = useState("");
  const [selectedSeries, setSelectedSeries] = useState([]);

  const handleSelectSerie = (serieId) => {
    setSelectedSeries((current) =>
      current.includes(serieId)
        ? current.filter((id) => id !== serieId)
        : [...current, serieId]
    );
  };

  const handleCreateList = () => {
    if (!categoryName.trim()) {
      Alert.alert(t('common.error'), t('create_list.error_name')); 
      return;
    }
    if (selectedSeries.length === 0) {
      Alert.alert(t('common.error'), t('create_list.error_select')); 
      return;
    }

    addList({ title: categoryName, seriesIds: selectedSeries });
    navigation.goBack();
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Ionicons name="arrow-back-outline" size={32} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('create_list.title')}</Text>
      </View>
      <View style={styles.inputContainer}>
        <Ionicons
          name="create-outline"
          size={20}
          color="#aaa"
          style={styles.icon}
        />
        <TextInput
          style={styles.input}
          placeholder={t('create_list.category_name_placeholder')} 
          placeholderTextColor="#aaa"
          value={categoryName}
          onChangeText={setCategoryName}
          autoCapitalize="none"
        />
      </View>
      <ScrollView>
        <View style={styles.cardContainer}>
          {series.map((item) => (
            <View key={item.id} style={styles.cardWrapper}>
              <VideoCard
                Height={height * 0.3}
                data={item}
                isSelected={selectedSeries.includes(item.id)}
                onPress={() => handleSelectSerie(item.id)}
              />
            </View>
          ))}
        </View>
      </ScrollView>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.createButton} onPress={handleCreateList}>
          <Text style={styles.buttonText}>{t('create_list.create_btn')}</Text>
        </TouchableOpacity>
      </View>

      <Footer />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    height: 50,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 15,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2a2a2a",
    borderRadius: 10,
    margin: 16,
    paddingHorizontal: 10,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    color: "#ffffff",
  },
  cardContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    paddingHorizontal: 8,
  },
  cardWrapper: {
    width: "48%",
    marginBottom: 16,
  },
  buttonContainer: {
    width: "100%",
    alignItems: "center",
    paddingVertical: 10,
  },
  createButton: {
    width: "80%",
    height: 50,
    borderRadius: 10,
    backgroundColor: "#C6A14A",
    justifyContent: "center",
    alignItems: "center",
    shadowOpacity: 0.5,
  },
  buttonText: {
    color: "#121212",
    fontSize: 16,
    fontWeight: "bold",
  },
});