import { NoteProvider } from "../hooks/useNotes";
import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <NoteProvider>
      <Stack />
    </NoteProvider>
  );
}
