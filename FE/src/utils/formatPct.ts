export function formatRatioPct(ratio: number | null | undefined): string | null {
  if (ratio === null || ratio === undefined) return null;
  return (ratio * 100).toFixed(1);
}

export function formatPercentage(pct: number | null | undefined): string | null {
  if (pct === null || pct === undefined) return null;
  return pct.toFixed(1);
}

export function formatPct(val: number | null | undefined, isRatio?: boolean): string | null {
  if (val === null || val === undefined) return null;
  if (isRatio !== undefined) {
    return isRatio ? (val * 100).toFixed(1) : val.toFixed(1);
  }
  return (val <= 1 ? val * 100 : val).toFixed(1);
}
