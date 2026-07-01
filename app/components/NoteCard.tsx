import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import type { Note } from "../types/note";

interface NoteCardProps {
  note: Note;
  onPress: () => void;
  onToggleFavorite?: () => void;
}

export default function NoteCard({ note, onPress, onToggleFavorite }: NoteCardProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={onPress}
    >
      <View style={styles.row}>
        <Text style={styles.title}>{note.title}</Text>
        <Pressable onPress={onToggleFavorite} style={styles.starButton}>
          <Text style={[styles.star, note.favorite && styles.favorited]}>{note.favorite ? "★" : "☆"}</Text>
        </Pressable>
      </View>
      {note.imageUri ? <Image source={{ uri: note.imageUri }} style={styles.thumbnail} /> : null}
      <Text style={styles.preview} numberOfLines={2}>
        {note.content}
      </Text>
      <Text style={styles.date}>{new Date(note.updatedAt).toLocaleDateString()}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 18,
    borderRadius: 18,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  pressed: {
    opacity: 0.85,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
    flex: 1,
    marginRight: 8,
  },
  starButton: {
    padding: 6,
  },
  star: {
    fontSize: 18,
    color: "#d1d5db",
  },
  favorited: {
    color: "#f59e0b",
  },
  thumbnail: {
    width: "100%",
    height: 140,
    borderRadius: 14,
    marginBottom: 12,
  },
  preview: {
    fontSize: 14,
    color: "#4b5563",
    lineHeight: 20,
    marginBottom: 10,
  },
  date: {
    fontSize: 12,
    color: "#6b7280",
    alignSelf: "flex-end",
  },
});
