export function buildStoragePath(uid: string, now?: number): string {
  return `ideas/${uid}/${now ?? Date.now()}.jpg`;
}
