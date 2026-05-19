const fmt = new Intl.DateTimeFormat('pt-PT', { day: 'numeric', month: 'short', year: 'numeric' });

export function formatDate(ts: { toDate(): Date } | null | undefined): string {
  if (!ts) return '';
  return fmt.format(ts.toDate());
}
