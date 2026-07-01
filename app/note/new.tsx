import { useState } from "react";
import { Image, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useNotes } from "../hooks/useNotes";

export default function NewNoteScreen() {
  const router = useRouter();
  const { createNote } = useNotes();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);

  const handleSave = async () => {
    const id = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const now = new Date().toISOString();

    await createNote({
      id,
      title: title.trim() || "Untitled note",
      content,
      createdAt: now,
      updatedAt: now,
      favorite: false,
      imageUri: imageUri ?? undefined,
    });

    router.back();
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.screenTitle}>Create Note</Text>
        </View>

        <TextInput
          placeholder="Title"
          placeholderTextColor="#9ca3af"
          value={title}
          onChangeText={setTitle}
          style={styles.titleInput}
        />
        <TextInput
          placeholder="Start writing your note..."
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

        <Pressable style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveText}>Save</Text>
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
  },
  saveText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
