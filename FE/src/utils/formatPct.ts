export function formatPct(val: number | null | undefined): string | null {
  if (val === null || val === undefined) return null;
  return (val <= 1 ? val * 100 : val).toFixed(1);
}
