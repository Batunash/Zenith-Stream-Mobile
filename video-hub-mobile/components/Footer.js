import React from 'react';
import { View, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const Footer = () => {
  const navigation = useNavigation();
  const route = useRoute(); // şu anki aktif route bilgisini verir

  const currentRoute = route.name; // örnek: "Home", "Downloads", "Profile"

  return (
    <View style={styles.container}>
      {/* Home */}
      <TouchableOpacity
        style={styles.iconContainer}
        onPress={() => navigation.navigate('Main')}
      >
        <Ionicons
          name={currentRoute === 'Main' ? 'home' : 'home-outline'}
          size={28}
          color={currentRoute === 'Main' ? '#C6A14A' : '#777777'}
        />
      </TouchableOpacity>

      {/* Downloads */}
      <TouchableOpacity
        style={styles.iconContainer}
        onPress={() => navigation.navigate('DownloadsScreen')}
      >
        <Ionicons
          name={currentRoute === 'DownloadsScreen' ? 'download' : 'download-outline'}
          size={28}
          color={currentRoute === 'DownloadsScreen' ? '#C6A14A' : '#777777'}
        />
      </TouchableOpacity>

      {/* Profile */}
      <TouchableOpacity
        style={styles.iconContainer}
        onPress={() => navigation.navigate('Profile')}
      >
        <Ionicons
          name={currentRoute === 'Profile' ? 'person' : 'person-outline'}
          size={28}
          color={currentRoute === 'Profile' ? '#C6A14A' : '#777777'}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#121212',
    height: 60,
    width: width,
    borderTopWidth: 0.5,
    borderTopColor: '#222',
  },
  iconContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Footer;
