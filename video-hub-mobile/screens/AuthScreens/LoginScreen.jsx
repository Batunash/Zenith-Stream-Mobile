import React, { useState } from "react";
import { View, Image, StyleSheet,Dimensions,Text,TextInput,TouchableOpacity} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from '@react-navigation/native';
const { width, height } = Dimensions.get("window");

export default function LoginScreen() {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const handleSignupButton=()=>{
        navigation.navigate('Register');
        
    };
    return(
    <View style={[styles.container,{ paddingTop: insets.top, paddingBottom: insets.bottom },]}>
        <Image source={require('../../assets/logo.png')}style={styles.Image}/>
        <Text style={styles.text}>Login to Your Account</Text>
        <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="#aaa" style={styles.icon} />
            <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#aaa" value={email} onChangeText={setEmail} 
                keyboardType="email-address"
                autoCapitalize="none"/> 
        </View>
        <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#aaa" style={styles.icon} />
            <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#aaa" value={password} onChangeText={setPassword} secureTextEntry={!showPassword}/> 
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Ionicons
                name={showPassword ? "eye-outline" : "eye-off-outline"}
                size={20}
                color="#888"
            />
            </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>Log in</Text>
        </TouchableOpacity>
        <View style={{ flexDirection: "row", alignItems: "center", marginTop: height * 0.015 }}>
            <Text style={styles.text}>Don't have an account? </Text>
            <TouchableOpacity onPress={(handleSignupButton)}>
                <Text style={[styles.text, { color: "#e50914", fontWeight: "bold" }]}>Sign up</Text>
            </TouchableOpacity>
        </View>

    </View>
    
    )
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    gap: height * 0.02, // dikey boşluk da orantılı
  },
  Image: {
    width: width * 0.5, // daha orantılı logo boyutu
    height: width * 0.5,
  },
  text:{
    color: "white",
    fontSize: width * 0.04,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderColor: "#333",
    borderWidth: 1,
    borderRadius: width * 0.03, // orantılı radius
    paddingHorizontal: width * 0.03,
    width: width * 0.8,
    height: height * 0.065, // orantılı yükseklik
    backgroundColor: "#111",
  },
  icon: {
    marginRight: width * 0.02,
  },
  input: {
    flex: 1,
    color: "white",
    fontSize: width * 0.04, // orantılı font boyutu
  },
  button: {
    marginTop: height * 0.015,
    width: width * 0.8,
    height: height * 0.065,
    backgroundColor: "#e50914",
    borderRadius: width * 0.03,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: width * 0.045, // orantılı yazı boyutu
  },
  buttonSignUp:{
    height: width * 0.05,
    alignItems:"center",
    justifyContent:"center",
    paddingLeft: 5,
  },
});