export function buildDmgUrl(arch: 'arm64' | 'x64', version: string): string {
  const suffix = arch === 'arm64' ? '-arm64' : '';
  return `https://github.com/AlexandreXavier/second-brain/releases/download/v${version}/Segundo%20Cerebro-${version}${suffix}.dmg`;
}
