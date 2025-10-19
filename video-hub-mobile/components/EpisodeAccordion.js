import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import EpisodeGroup from "./EpisodeGroup";

export default function EpisodeAccordion() {
  const [expandedId, setExpandedId] = useState(null);

  // Şimdilik sahte data — sadece başlıklar
  const groups = [
    { id: 1, title: "Season 1" },
    { id: 2, title: "Season 2" },
    { id: 3, title: "Season 3" },
  ];

  const handleToggle = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Episodes</Text>
      {groups.map((group) => (
        <EpisodeGroup
          key={group.id}
          title={group.title}
          isExpanded={expandedId === group.id}
          onToggle={() => handleToggle(group.id)}
        />
      ))}
    </View>
  );
}

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
