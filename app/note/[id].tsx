import { useEffect, useState } from "react";
import { Alert, Image, Pressable, SafeAreaView, ScrollView, Share, StyleSheet, Text, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useNotes } from "../hooks/useNotes";
import type { Note } from "../types/note";

export default function EditNoteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { notes, updateNote, deleteNote, attachImage } = useNotes();
  const [note, setNote] = useState<Note | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);

  useEffect(() => {
    const found = notes.find((item) => item.id === id);
    if (found) {
      setNote(found);
      setTitle(found.title);
      setContent(found.content);
      setImageUri(found.imageUri ?? null);
    }
  }, [id, notes]);

  const saveNote = async () => {
    if (!note) return;
    const updated: Note = {
      ...note,
      title: title.trim() || "Untitled note",
      content,
      imageUri: imageUri ?? undefined,
      updatedAt: new Date().toISOString(),
    };

    await updateNote(updated);
    if (imageUri) {
      await attachImage(updated.id, imageUri);
    }
    router.back();
  };

  const confirmDelete = () => {
    if (!note) return;
    Alert.alert("Delete note", "Are you sure you want to delete this note?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteNote(note.id);
          router.push("/");
        },
      },
    ]);
  };

  const shareNote = async () => {
    if (!note) return;

    try {
      await Share.share({
        title: note.title,
        message: `${note.title}\n\n${note.content}`,
      });
    } catch (error) {
      Alert.alert("Unable to share note", String(error));
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
      aspect: [4, 3],
    });

    if (!result.canceled && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  if (!note) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Note not found.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.screenTitle}>Edit Note</Text>
        </View>

        <TextInput
          placeholder="Title"
          placeholderTextColor="#9ca3af"
          value={title}
          onChangeText={setTitle}
          style={styles.titleInput}
        />
        <TextInput
          placeholder="Update your note..."
          placeholderTextColor="#9ca3af"
          value={content}
          onChangeText={setContent}
          style={styles.bodyInput}
          multiline
        />

        {imageUri ? <Image source={{ uri: imageUri }} style={styles.imagePreview} /> : null}

        <Pressable style={styles.imageButton} onPress={pickImage}>
          <Text style={styles.imageButtonText}>{imageUri ? "Change image" : "Attach image"}</Text>
        </Pressable>

        <Pressable style={styles.saveButton} onPress={saveNote}>
          <Text style={styles.saveText}>Save</Text>
        </Pressable>
        <Pressable style={styles.shareButton} onPress={shareNote}>
          <Text style={styles.shareText}>Share</Text>
        </Pressable>
        <Pressable style={styles.deleteButton} onPress={confirmDelete}>
          <Text style={styles.deleteText}>Delete</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    fontSize: 16,
    color: "#6b7280",
  },
  scroll: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111827",
  },
  titleInput: {
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#d1d5db",
    paddingHorizontal: 16,
    fontSize: 18,
    marginBottom: 16,
    color: "#111827",
  },
  bodyInput: {
    minHeight: 180,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#d1d5db",
    padding: 16,
    fontSize: 16,
    textAlignVertical: "top",
    color: "#111827",
    marginBottom: 16,
  },
  imagePreview: {
    width: "100%",
    height: 200,
    borderRadius: 16,
    marginBottom: 16,
  },
  imageButton: {
    height: 50,
    borderRadius: 16,
    backgroundColor: "#e5e7eb",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  imageButtonText: {
    fontSize: 16,
    color: "#111827",
    fontWeight: "600",
  },
  saveButton: {
    height: 52,
    borderRadius: 16,
    backgroundColor: "#2563eb",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  saveText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  shareButton: {
    height: 52,
    borderRadius: 16,
    backgroundColor: "#10b981",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  shareText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  deleteButton: {
    height: 52,
    borderRadius: 16,
    backgroundColor: "#ef4444",
    justifyContent: "center",
    alignItems: "center",
  },
  deleteText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
