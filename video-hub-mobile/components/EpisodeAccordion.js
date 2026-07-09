import React, { useState, memo } from "react";
import { View, Text, StyleSheet } from "react-native";
import EpisodeGroup from "./EpisodeGroup";
import { useTranslation } from "react-i18next";
const EpisodeAccordion = memo(function EpisodeAccordion({ seasons, serieId, onDownload, onDelete, onPlay }) {
  const [expandedId, setExpandedId] = useState(null);
  const { t } = useTranslation();
  const handleToggle = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{t('detail.episodes_header')}</Text>
      {seasons.map((season) => (
        <EpisodeGroup
          key={season.id}
          serieId={serieId}
          title={season.title}
          episodes={season.episodes}
          isExpanded={expandedId === season.id}
          onToggle={() => handleToggle(season.id)}
          onDownload={onDownload} 
          onDelete={onDelete} 
          onPlay={onPlay} 
        />
      ))}
    </View>
  );
});

export default EpisodeAccordion;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  header: {
    color: "white",
    fontWeight: "bold",
    fontSize: 18,
    marginBottom: 10,
  },
});