export interface GradeScale {
  letter: string;
  gpa: number;
}

export function toLetterGrade(score: number | null): GradeScale {
  if (score === null) return { letter: '-', gpa: 0 };
  if (score >= 8.5) return { letter: 'A', gpa: 4.0 };
  if (score >= 7.0) return { letter: 'B', gpa: 3.0 };
  if (score >= 5.5) return { letter: 'C', gpa: 2.0 };
  if (score >= 4.0) return { letter: 'D', gpa: 1.0 };
  return { letter: 'F', gpa: 0.0 };
}

export interface GpaItem {
  totalScore: number | null;
  credits?: number;
}

export function calculateGpa4(items: GpaItem[]): number {
  const valid = items.filter((it) => it.totalScore !== null);
  if (valid.length === 0) return 0;

  let totalWeightedGpa = 0;
  let totalCredits = 0;

  for (const it of valid) {
    const credits = typeof it.credits === 'number' && it.credits > 0 ? it.credits : 3;
    const gpa = toLetterGrade(it.totalScore).gpa;
    totalWeightedGpa += gpa * credits;
    totalCredits += credits;
  }

  if (totalCredits === 0) return 0;
  return Number((totalWeightedGpa / totalCredits).toFixed(2));
}

export interface CreditItem {
  finalStatus: string;
  credits?: number;
}

export function calculateAccumulatedCredits(items: CreditItem[]): number {
  return items
    .filter((item) => item.finalStatus === 'PASSED')
    .reduce((sum, item) => sum + (typeof item.credits === 'number' && item.credits > 0 ? item.credits : 3), 0);
}

export function getAcademicClassification(gpa4: number): string {
  if (gpa4 >= 3.6) return 'Xuất sắc';
  if (gpa4 >= 3.2) return 'Giỏi';
  if (gpa4 >= 2.5) return 'Khá';
  if (gpa4 >= 2.0) return 'Trung bình';
  return 'Yếu / Kém';
}

export function calculateAverageScore10(items: { totalScore: number | null }[]): number {
  const scored = items.filter((it) => it.totalScore !== null && it.totalScore !== undefined);
  if (scored.length === 0) return 0;
  const sum = scored.reduce((acc, it) => acc + (it.totalScore ?? 0), 0);
  return Number((sum / scored.length).toFixed(2));
}
