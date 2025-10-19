import React, { useState } from "react";
import { View, Image,ScrollView, StyleSheet,Dimensions,Text,TouchableOpacity} from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from '@react-navigation/native';
import Footer from '../../components/Footer';
import EpisodeAccordion from '../../components/EpisodeAccordion';
const { width, height } = Dimensions.get("window");
export default function SerieDetailScreen(){
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    
    return(
        <View
              style={[
                styles.container,
                { paddingTop: insets.top, paddingBottom: insets.bottom },
              ]}
        >
          <View style={[styles.imageContainer,{width:width}]} >
            <Image source={require('../../assets/image.jpg')} resizeMode="cover" style={styles.bgimage}/>
          </View>
          <View style={[styles.infoContainer,{width:width}]}>
            <Text style={styles.title}>Deamon Slayer</Text>
             <Text style={styles.description}>
              A young boy joins the Demon Slayer Corps to avenge his family and save his sister.
             </Text>
              <View style={styles.buttonContainer}> 
                <TouchableOpacity style={styles.buttonPlay}>
                  <Ionicons name="play-circle" size={20} color="#000000ff" />
                  <Text style={styles.buttonText}>Play</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.buttonDownload}>
                  <Ionicons name="download" size={20} color="#000000ff" />
                  <Text style={styles.buttonText}>Download</Text>
                </TouchableOpacity>
              </View>
          </View>
         <View style={styles.bottomContainer}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 80 }} // footer'ın üstü boş kalsın
          >
            <EpisodeAccordion />
          </ScrollView>
        </View>
        <Footer />
      </View>
    )

}
const styles=StyleSheet.create({
    container: {
    flex: 1,
    backgroundColor: "#121212",

  },
  imageContainer:{
    flex:1,
  },
  bottomContainer:{
    flex:1,
  },
  bgimage:{
    height:"100%",
    width:"100%",
  },
  bottomContainer: {
  flex: 1,
  backgroundColor: "#121212",
  paddingHorizontal: 10,
  paddingTop: 10,
},
  infoContainer: {
    width: "100%",
    backgroundColor: "#1A1A1A",
    paddingHorizontal: 10,
    paddingVertical: 10,
    alignItems: "center",        
    justifyContent: "flex-start", 
    gap: 10,                      
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    marginTop: -20,               
  },
  title: {
  color: "white",
  fontWeight: "bold",
  fontSize: width * 0.05,
  textAlign: "center",   // ekledik
},

  description: {
  color: "#ccc",
  fontSize: width * 0.035,
  textAlign: "center",
  marginTop: 5,
  marginBottom: 10, 
  lineHeight: 18,
  width: width * 0.9,
},
  buttonContainer: {
  flexDirection: "row",
  justifyContent: "space-between", 
  width: width * 0.9, 
  marginTop: 10,
},
buttonPlay: {
  flexDirection: "row",
  width: "48%", 
  height: height * 0.05,
  backgroundColor: "#C6A14A",
  borderRadius: width * 0.03,
  alignItems: "center",
  justifyContent: "center",
},
buttonDownload: {
  flexDirection: "row",
  width: "48%", 
  height: height * 0.05,
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
}
)