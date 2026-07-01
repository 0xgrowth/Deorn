import { Platform } from "react-native";
import type { Note } from "../types/note";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  (Platform.OS === "android" ? "http://10.0.2.2:8080" : "http://localhost:8080");

export interface NoteStreamEvent {
  type: "created" | "updated" | "deleted";
  note?: Note;
  id?: string;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(errorBody || `Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export async function getNotes(): Promise<Note[]> {
  return request<Note[]>("/notes");
}

export async function getNote(id: string): Promise<Note> {
  return request<Note>(`/notes/${id}`);
}

export async function createNote(input: { title: string; content: string }): Promise<Note> {
  return request<Note>("/notes", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateNote(id: string, input: { title: string; content: string }): Promise<Note> {
  return request<Note>(`/notes/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function deleteNote(id: string): Promise<void> {
  await request<void>(`/notes/${id}`, { method: "DELETE" });
}

export function subscribeToNotesStream(onEvent: (event: NoteStreamEvent) => void): () => void {
  const controller = new AbortController();

  const run = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/notes/stream`, {
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Stream request failed with status ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Streaming is not supported in this environment");
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (!controller.signal.aborted) {
        const { value, done } = await reader.read();
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split("\n\n");
        buffer = chunks.pop() ?? "";

        for (const chunk of chunks) {
          const dataLine = chunk
            .split("\n")
            .find((line) => line.startsWith("data:"));
          if (!dataLine) {
            continue;
          }

          const payload = dataLine.slice(5).trim();
          if (!payload) {
            continue;
          }

          try {
            const parsed = JSON.parse(payload) as NoteStreamEvent;
            onEvent(parsed);
          } catch (error) {
            console.warn("Failed to parse note stream event", error);
          }
        }
      }
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        console.warn("Note stream disconnected", error);
      }
    }
  };

  void run();

  return () => {
    controller.abort();
  };
}
