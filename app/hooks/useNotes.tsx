import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { createNote as createNoteRequest, deleteNote as deleteNoteRequest, getNotes, updateNote as updateNoteRequest, subscribeToNotesStream } from "../services/api";
import type { Note } from "../types/note";

const NOTES_KEY = "@nare:notes";

type SyncStatus = "Idle" | "Syncing" | "Synced" | "Failed";

interface NotesContextValue {
  notes: Note[];
  isLoaded: boolean;
  syncStatus: SyncStatus;
  lastSyncedAt: string | null;
  createNote: (note: Note) => Promise<void>;
  updateNote: (note: Note) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  attachImage: (id: string, imageUri: string) => Promise<void>;
  syncNotes: () => Promise<void>;
}

const NotesContext = createContext<NotesContextValue | null>(null);

interface NoteProviderProps {
  children: ReactNode;
}

export function NoteProvider({ children }: NoteProviderProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("Idle");
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  useEffect(() => {
    async function loadNotes() {
      try {
        const stored = await AsyncStorage.getItem(NOTES_KEY);
        const cachedNotes = stored ? (JSON.parse(stored) as Note[]) : [];
        setNotes(cachedNotes);

        const serverNotes = await getNotes();
        setNotes(serverNotes);
        await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(serverNotes));
      } catch (error) {
        console.warn("Failed to load notes", error);
      } finally {
        setIsLoaded(true);
      }
    }

    loadNotes();
  }, []);

  useEffect(() => {
    if (!isLoaded) return;

    AsyncStorage.setItem(NOTES_KEY, JSON.stringify(notes)).catch((error) => {
      console.warn("Unable to persist notes", error);
    });
  }, [notes, isLoaded]);

  const createNote = async (note: Note) => {
    try {
      const created = await createNoteRequest({ title: note.title, content: note.content });
      const normalized = {
        ...note,
        id: created.id,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      } as Note;
      setNotes((current) => [normalized, ...current.filter((item) => item.id !== note.id)]);
    } catch (error) {
      console.warn("Failed to create note", error);
      throw error;
    }
  };

  const updateNote = async (note: Note) => {
    try {
      const updated = await updateNoteRequest(note.id, { title: note.title, content: note.content });
      const normalized = { ...note, createdAt: updated.createdAt, updatedAt: updated.updatedAt } as Note;
      setNotes((current) => current.map((item) => (item.id === note.id ? normalized : item)));
    } catch (error) {
      console.warn("Failed to update note", error);
      throw error;
    }
  };

  const deleteNote = async (id: string) => {
    try {
      await deleteNoteRequest(id);
      setNotes((current) => current.filter((note) => note.id !== id));
    } catch (error) {
      console.warn("Failed to delete note", error);
      throw error;
    }
  };

  const toggleFavorite = async (id: string) => {
    setNotes((current) =>
      current.map((note) =>
        note.id === id
          ? { ...note, favorite: !note.favorite, updatedAt: new Date().toISOString() }
          : note
      )
    );
  };

  const attachImage = async (id: string, imageUri: string) => {
    setNotes((current) =>
      current.map((note) => (note.id === id ? { ...note, imageUri, updatedAt: new Date().toISOString() } : note))
    );
  };

  useEffect(() => {
    const unsubscribe = subscribeToNotesStream((event) => {
      if (event.type === "created" && event.note) {
        setNotes((current) => {
          if (current.some((note) => note.id === event.note!.id)) {
            return current;
          }
          return [event.note!, ...current];
        });
      }

      if (event.type === "updated" && event.note) {
        setNotes((current) => current.map((note) => (note.id === event.note!.id ? event.note! : note)));
      }

      if (event.type === "deleted" && event.id) {
        setNotes((current) => current.filter((note) => note.id !== event.id));
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const syncNotes = async () => {
    setSyncStatus("Syncing");
    try {
      const serverNotes = await getNotes();
      setNotes(serverNotes);
      await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(serverNotes));
      setLastSyncedAt(new Date().toISOString());
      setSyncStatus("Synced");
    } catch (error) {
      console.warn("Cloud sync failed", error);
      setSyncStatus("Failed");
    }
  };

  const value = useMemo(
    () => ({
      notes,
      isLoaded,
      syncStatus,
      lastSyncedAt,
      createNote,
      updateNote,
      deleteNote,
      toggleFavorite,
      attachImage,
      syncNotes,
    }),
    [notes, isLoaded, syncStatus, lastSyncedAt]
  );

  return <NotesContext.Provider value={value}>{children}</NotesContext.Provider>;
}

export function useNotes() {
  const context = useContext(NotesContext);
  if (!context) {
    throw new Error("useNotes must be used within a NoteProvider");
  }
  return context;
}
