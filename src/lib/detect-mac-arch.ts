type NavigatorLike = {
  userAgentData?: {
    getHighEntropyValues: (hints: string[]) => Promise<{ architecture?: string }>;
  };
  userAgent?: string;
};

export async function detectMacArch(nav: NavigatorLike): Promise<'arm64' | 'x64'> {
  if (nav.userAgentData) {
    const { architecture } = await nav.userAgentData.getHighEntropyValues(['architecture']);
    if (architecture === 'x86') return 'x64';
  }
  return 'arm64';
}
