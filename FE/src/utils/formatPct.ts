export function formatRatioPct(ratio: number | null | undefined): string | null {
  if (ratio === null || ratio === undefined) return null;
  return (ratio * 100).toFixed(1);
}

export function formatPercentage(pct: number | null | undefined): string | null {
  if (pct === null || pct === undefined) return null;
  return pct.toFixed(1);
}

export function formatPct(val: number | null | undefined): string | null {
  if (val === null || val === undefined) return null;
  return (val <= 1 ? val * 100 : val).toFixed(1);
}
