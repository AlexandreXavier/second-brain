import type { Idea } from './types';

type SortOrder = 'newest' | 'oldest' | 'alpha';

function tsMs(idea: Idea): number {
  return idea.createdAt ? idea.createdAt.toDate().getTime() : -Infinity;
}

export function sortIdeas(ideas: Idea[], order: SortOrder): Idea[] {
  const copy = [...ideas];
  if (order === 'alpha') return copy.sort((a, b) => a.title.localeCompare(b.title));
  if (order === 'oldest') return copy.sort((a, b) => tsMs(a) - tsMs(b));
  return copy.sort((a, b) => tsMs(b) - tsMs(a));
}

export function scopeIdeas(ideas: Idea[], scope: 'mine' | 'all', userId: string): Idea[] {
  if (scope === 'all') return ideas;
  return ideas.filter(idea => idea.createdBy?.uid === userId);
}

export function extractCategories(ideas: Idea[]): string[] {
  const set = new Set<string>();
  ideas.forEach(idea => idea.categories?.forEach(c => set.add(c)));
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

export function searchIdeas(ideas: Idea[], query: string, category: string): Idea[] {
  const needle = query.trim().toLowerCase();
  return ideas.filter(idea => {
    const categoryMatch = !category || idea.categories?.includes(category);
    if (!needle) return categoryMatch;
    const haystack = [idea.title, idea.source, idea.description, idea.previewText, idea.notes]
      .filter(Boolean).join(' ').toLowerCase();
    return categoryMatch && haystack.includes(needle);
  });
}
