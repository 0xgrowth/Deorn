import type { Note } from "../types/note";

export const initialNotes: Note[] = [
  {
    id: "1",
    title: "Grocery list",
    content: "Milk, eggs, bread, coffee, and fresh basil for dinner tonight.",
    createdAt: "2026-06-29",
    updatedAt: "2026-06-29",
    favorite: false,
  },
  {
    id: "2",
    title: "Trip ideas",
    content: "Explore nearby hikes, plan a lakeside picnic, and book a weekend cabin stay.",
    createdAt: "2026-06-28",
    updatedAt: "2026-06-28",
    favorite: true,
  },
  {
    id: "3",
    title: "Meeting notes",
    content: "Review quarterly goals, update the roadmap, and follow up on design feedback.",
    createdAt: "2026-06-25",
    updatedAt: "2026-06-25",
    favorite: false,
  },
];
