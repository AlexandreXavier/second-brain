import type { Idea, IdeaType } from './types';

type MetaInput = Pick<Idea, 'source' | 'sourceName' | 'type'>;

const TYPE_LABELS: Record<IdeaType, string> = {
  youtube: 'YouTube',
  tweet: 'X',
  instagram: 'Instagram',
  article: 'Artigo',
  screenshot: 'Captura',
  idea: 'Nota',
};

export function ideaMetaLabel(idea: MetaInput): string {
  if (idea.sourceName) return idea.sourceName;
  if (idea.source) return idea.source;
  return TYPE_LABELS[idea.type];
}
