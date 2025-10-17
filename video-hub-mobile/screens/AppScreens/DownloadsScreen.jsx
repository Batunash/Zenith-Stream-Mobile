import React from "react";
import { useRoute } from "@react-navigation/native";
import BaseListScreen from "./BaseListScreen";

export default function DownloadsScreen() {
  const route = useRoute();
  const { headerTitle, listData } = route.params || {};
  const downloadedSeries = listData || [
    { id: "1", name: "Breaking Bad", year: 2008, genre: "Crime" },
    { id: "2", name: "Naruto", year: 2002, genre: "Action" },
    { id: "3", name: "Peaky Blinders", year: 2013, genre: "Drama" },
  ];

  return (
    <BaseListScreen
      headerTitle={headerTitle || "Downloads"}
      listData={downloadedSeries}
    />
  );
}
