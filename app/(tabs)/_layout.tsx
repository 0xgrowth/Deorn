import { Stack } from "expo-router";
import { NoteProvider } from "../hooks/useNotes";

export default function RootLayout() {
  return (
    <NoteProvider>
      <Stack />
    </NoteProvider>
  );
}
