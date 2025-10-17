import React from "react";
import { useRoute } from '@react-navigation/native';
import BaseListScreen from "./BaseListScreen";

export default function SeeAllScreen() {
  const route = useRoute();
  const { headerTitle, listData } = route.params || {};

  const mySeries = listData || [
    { id: "1", name: "The Witcher", year: 2022, genre: "Fantasy" },
    { id: "2", name: "Arcane", year: 2021, genre: "Animation" },
    { id: "3", name: "Cyberpunk: Edgerunners", year: 2022, genre: "Sci-Fi" },
  ];

  return (
    <BaseListScreen
      headerTitle={headerTitle || "My List"}
      listData={mySeries}
    />
  );
}
