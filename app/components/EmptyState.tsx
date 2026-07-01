import { StyleSheet, Text, View } from "react-native";

interface EmptyStateProps {
  query: string;
}

export default function EmptyState({ query }: EmptyStateProps) {
  const title = query.length ? "No matches yet" : "No notes found";
  const message = query.length
    ? "Try another keyword or clear the search."
    : "Tap + to create your first note.";

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 64,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: "#6b7280",
    textAlign: "center",
  },
});
