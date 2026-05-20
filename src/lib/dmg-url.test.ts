import { test, expect } from 'vitest';
import { buildDmgUrl } from './dmg-url';

test('buildDmgUrl returns the arm64 DMG URL for arm64 arch', () => {
  expect(buildDmgUrl('arm64', '0.1.0')).toBe(
    'https://github.com/AlexandreXavier/second-brain/releases/download/v0.1.0/Segundo%20Cerebro-0.1.0-arm64.dmg'
  );
});

test('buildDmgUrl returns the no-suffix DMG URL for x64 arch', () => {
  expect(buildDmgUrl('x64', '0.1.0')).toBe(
    'https://github.com/AlexandreXavier/second-brain/releases/download/v0.1.0/Segundo%20Cerebro-0.1.0.dmg'
  );
});
