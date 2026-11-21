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

export function calculateGpa4(items: Array<{ totalScore: number | null }>): number {
  const valid = items.filter((it) => it.totalScore !== null);
  if (valid.length === 0) return 0;
  const sumGpa = valid.reduce((acc, curr) => acc + toLetterGrade(curr.totalScore).gpa, 0);
  return Number((sumGpa / valid.length).toFixed(2));
}

export function getAcademicClassification(gpa4: number): string {
  if (gpa4 >= 3.6) return 'Xuất sắc';
  if (gpa4 >= 3.2) return 'Giỏi';
  if (gpa4 >= 2.5) return 'Khá';
  if (gpa4 >= 2.0) return 'Trung bình';
  return 'Yếu / Kém';
}
