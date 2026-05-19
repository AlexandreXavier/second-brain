import { createPreviewFromUrl } from './metadata';
import { suggestTitle } from './title';
import type { IdeaDraft } from './types';

export async function buildCaptureDraft(source: string, idToken: string | null): Promise<IdeaDraft> {
  const draft = await createPreviewFromUrl(source);

  if (idToken) {
    const aiTitle = await suggestTitle({
      idToken,
      source,
      title: draft.title,
      description: draft.description,
      previewText: draft.previewText,
      author: draft.author,
    });
    if (aiTitle) return { ...draft, title: aiTitle };
  }

  return draft;
}
