import type { Idea } from './types';

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
