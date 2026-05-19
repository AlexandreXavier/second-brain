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

export function patchDraftWithImage(prev: IdeaDraft | null, fileName: string | undefined): IdeaDraft {
  const base = prev ?? { categories: [] };
  const title = prev?.title || (fileName ? fileName.replace(/\.[^.]+$/, '') : '') || 'Captura';
  return { ...base, type: 'screenshot', title };
}
