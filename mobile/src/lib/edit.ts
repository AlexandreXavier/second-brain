import { parseCategories } from './metadata';
import type { Idea, IdeaDraft } from './types';

type EditUpdates = { title: string; categoryText: string; notes: string };

export function buildEditPayload(original: Idea, updates: EditUpdates): Partial<IdeaDraft> {
  const title = updates.title.trim() || original.title;
  const categories = updates.categoryText.trim()
    ? parseCategories(updates.categoryText)
    : original.categories;
  return { title, categories, notes: updates.notes.trim() || original.notes };
}
