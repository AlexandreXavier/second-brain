const SUGGEST_TITLE_URL =
  'https://us-central1-my-brain-9d788.cloudfunctions.net/suggestTitle';

type SuggestTitleParams = {
  idToken: string;
  source?: string;
  title?: string;
  description?: string;
  previewText?: string;
  author?: string;
};

export async function suggestTitle(params: SuggestTitleParams): Promise<string | null> {
  const { idToken, ...body } = params;
  try {
    const response = await fetch(SUGGEST_TITLE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) return null;
    const { title } = (await response.json()) as { title?: string };
    return typeof title === 'string' && title.trim() ? title.trim() : null;
  } catch {
    return null;
  }
}
