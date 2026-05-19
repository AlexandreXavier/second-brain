import { suggestTitle } from '../src/lib/title';

afterEach(() => {
  jest.restoreAllMocks();
});

test('suggestTitle returns title from API success response', async () => {
  jest.spyOn(global, 'fetch').mockResolvedValue({
    ok: true,
    json: async () => ({ title: 'Titulo sugerido' }),
  } as Response);

  const result = await suggestTitle({ idToken: 'tok', source: 'https://youtube.com/watch?v=abc' });
  expect(result).toBe('Titulo sugerido');
});

test('suggestTitle returns null on network failure', async () => {
  jest.spyOn(global, 'fetch').mockRejectedValue(new Error('sem rede'));

  const result = await suggestTitle({ idToken: 'tok', source: 'https://youtube.com/watch?v=abc' });
  expect(result).toBeNull();
});

test('suggestTitle returns null when API returns blank title', async () => {
  jest.spyOn(global, 'fetch').mockResolvedValue({
    ok: true,
    json: async () => ({ title: '   ' }),
  } as Response);

  const result = await suggestTitle({ idToken: 'tok', source: 'https://example.com' });
  expect(result).toBeNull();
});

test('suggestTitle returns null when API responds with an error status', async () => {
  jest.spyOn(global, 'fetch').mockResolvedValue({
    ok: false,
    status: 500,
  } as Response);

  const result = await suggestTitle({ idToken: 'tok', source: 'https://example.com' });
  expect(result).toBeNull();
});

test('suggestTitle sends Authorization Bearer header', async () => {
  const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
    ok: true,
    json: async () => ({ title: 'Titulo' }),
  } as Response);

  await suggestTitle({ idToken: 'meu-token-secreto', source: 'https://example.com' });

  const [, options] = fetchSpy.mock.calls[0] as [string, RequestInit];
  expect((options.headers as Record<string, string>).Authorization).toBe('Bearer meu-token-secreto');
});
