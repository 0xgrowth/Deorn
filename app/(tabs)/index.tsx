import { useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import SearchBar from "../components/SearchBar";
import NoteCard from "../components/NoteCard";
import EmptyState from "../components/EmptyState";
import { useNotes } from "../hooks/useNotes";
import type { Note } from "../types/note";

export default function HomeScreen() {
  const router = useRouter();
  const { notes, syncStatus, lastSyncedAt, syncNotes, toggleFavorite } = useNotes();
  const [query, setQuery] = useState("");
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);

  useEffect(() => {
    const search = query.trim().toLowerCase();
    setFilteredNotes(
      notes.filter((note) => {
        return (
          note.title.toLowerCase().includes(search) ||
          note.content.toLowerCase().includes(search)
        );
      })
    );
  }, [notes, query]);

  const data = useMemo(() => (query.length > 0 ? filteredNotes : notes), [notes, query, filteredNotes]);
  const syncLabel = lastSyncedAt ? `Last sync ${new Date(lastSyncedAt).toLocaleTimeString()}` : "Never synced";

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.header}>
          <Text style={styles.title}>Notes</Text>
          <Text style={styles.subtitle}>Search your notes or open one to edit.</Text>
        </View>
        <Pressable style={styles.syncButton} onPress={syncNotes}>
          <Text style={styles.syncButtonText}>{syncStatus === "Syncing" ? "Syncing…" : "Sync"}</Text>
        </Pressable>
      </View>
      <Text style={styles.syncStatus}>{syncLabel}</Text>

      <SearchBar value={query} onChangeText={setQuery} />

      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <NoteCard
            note={item}
            onPress={() => router.push(`/note/${item.id}`)}
            onToggleFavorite={() => toggleFavorite(item.id)}
          />
        )}
        contentContainerStyle={styles.listContainer}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={<EmptyState query={query} />}
      />

      <Pressable style={styles.addButton} onPress={() => router.push("/note/new")}> 
        <Text style={styles.addButtonText}>+</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  header: {
    flex: 1,
    paddingRight: 12,
    paddingBottom: 12,
  },
  title: {
    fontSize: 34,
    fontWeight: "800",
    color: "#111",
  },
  subtitle: {
    marginTop: 4,
    fontSize: 15,
    color: "#666",
  },
  syncButton: {
    minWidth: 80,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#111827",
    justifyContent: "center",
    alignItems: "center",
  },
  syncButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  syncStatus: {
    marginHorizontal: 20,
    marginBottom: 12,
    color: "#6b7280",
    fontSize: 13,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 140,
  },
  separator: {
    height: 12,
  },
  addButton: {
    position: "absolute",
    right: 20,
    bottom: 30,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#3b82f6",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.16,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 12,
    elevation: 4,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 34,
    fontWeight: "700",
    lineHeight: 34,
  },
});
