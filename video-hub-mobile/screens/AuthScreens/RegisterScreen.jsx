import React, { useState } from "react";
import {
  View,
  Image,
  StyleSheet,
  Dimensions,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useAuthStore } from "../../store/useAuthStore";
import { useTranslation } from "react-i18next"; 
const { width, height } = Dimensions.get("window");

export default function RegisterScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const { register, isLoading, error } = useAuthStore();

  const handleSigninButton = () => {
    navigation.navigate("Login");
  };

  const handleRegister = async () => {
    if (!email || !password) {
      alert(t('auth.empty_fields_error')); 
      return;
    }
    await register(email, password);
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <Image
        source={require("../../assets/logo.png")}
        style={styles.Image}
        resizeMode="contain"
      />

      <Text style={styles.text}>{t('auth.register_title')}</Text>

      <View style={styles.inputContainer}>
        <Ionicons
          name="mail-outline"
          size={20}
          color="#aaa"
          style={styles.icon}
        />
        <TextInput
          style={styles.input}
          placeholder={t('auth.email_placeholder')} 
          placeholderTextColor="#aaa"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.inputContainer}>
        <Ionicons
          name="lock-closed-outline"
          size={20}
          color="#aaa"
          style={styles.icon}
        />
        <TextInput
          style={styles.input}
          placeholder={t('auth.password_placeholder')} 
          placeholderTextColor="#aaa"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Ionicons
            name={showPassword ? "eye-outline" : "eye-off-outline"}
            size={20}
            color="#888"
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={handleRegister}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.buttonText}>{t('auth.register_button')}</Text>
        )}
      </TouchableOpacity>

      {error && <Text style={styles.errorText}>{error}</Text>}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginTop: height * 0.015,
        }}
      >
        <Text style={styles.text}>{t('auth.login_prompt')} </Text>
        <TouchableOpacity onPress={handleSigninButton}>
          <Text
            style={[
              styles.text,
              { color: "#C6A14A", fontWeight: "bold" },
            ]}
          >
            {t('auth.login_link')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    gap: height * 0.02,
  },
  Image: {
    width: width * 0.5,
    height: width * 0.5,
  },
  text: {
    color: "white",
    fontSize: width * 0.04,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderColor: "#333",
    borderWidth: 1,
    borderRadius: width * 0.03,
    paddingHorizontal: width * 0.03,
    width: width * 0.8,
    height: height * 0.065,
    backgroundColor: "#111",
  },
  icon: {
    marginRight: width * 0.02,
  },
  input: {
    flex: 1,
    color: "white",
    fontSize: width * 0.04,
  },
  button: {
    marginTop: height * 0.015,
    width: width * 0.8,
    height: height * 0.065,
    backgroundColor: "#C6A14A",
    borderRadius: width * 0.03,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: width * 0.045,
  },
  errorText: {
    color: "red",
    marginTop: 8,
    fontSize: width * 0.035,
  },
});