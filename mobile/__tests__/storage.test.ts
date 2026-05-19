import { buildStoragePath } from '../src/lib/storage';

test('buildStoragePath returns correct path with provided timestamp', () => {
  expect(buildStoragePath('uid1', 1000)).toBe('ideas/uid1/1000.jpg');
});

test('buildStoragePath path starts with ideas/ and ends with .jpg', () => {
  const path = buildStoragePath('abc', 9999);
  expect(path.startsWith('ideas/')).toBe(true);
  expect(path.endsWith('.jpg')).toBe(true);
});

test('buildStoragePath uses a current timestamp when none is provided', () => {
  const before = Date.now();
  const path = buildStoragePath('uid1');
  const after = Date.now();
  const ts = Number(path.split('/')[2].replace('.jpg', ''));
  expect(ts).toBeGreaterThanOrEqual(before);
  expect(ts).toBeLessThanOrEqual(after);
});
