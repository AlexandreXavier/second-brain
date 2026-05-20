import { test, expect } from 'vitest';
import { detectMacArch } from './detect-mac-arch';

test('detectMacArch returns arm64 when UA Client Hints report architecture arm', async () => {
  const nav = {
    userAgentData: {
      getHighEntropyValues: async () => ({ architecture: 'arm' }),
    },
  };
  expect(await detectMacArch(nav)).toBe('arm64');
});

test('detectMacArch returns x64 when UA Client Hints report architecture x86', async () => {
  const nav = {
    userAgentData: {
      getHighEntropyValues: async () => ({ architecture: 'x86' }),
    },
  };
  expect(await detectMacArch(nav)).toBe('x64');
});

test('detectMacArch defaults to arm64 when userAgentData is unavailable', async () => {
  expect(await detectMacArch({})).toBe('arm64');
});
