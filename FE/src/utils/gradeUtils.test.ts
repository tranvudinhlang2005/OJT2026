import { describe, it, expect } from 'vitest';
import {
  toLetterGrade,
  calculateGpa4,
  calculateAccumulatedCredits,
  getAcademicClassification,
} from './gradeUtils';

describe('gradeUtils', () => {
  describe('toLetterGrade', () => {
    it('returns default placeholder when score is null', () => {
      expect(toLetterGrade(null)).toEqual({ letter: '-', gpa: 0 });
    });

    it('maps scores to letter A and GPA 4.0 for scores at least 8.5', () => {
      expect(toLetterGrade(8.5)).toEqual({ letter: 'A', gpa: 4.0 });
      expect(toLetterGrade(10)).toEqual({ letter: 'A', gpa: 4.0 });
    });

    it('maps scores to letter B and GPA 3.0 for scores between 7.0 and 8.4', () => {
      expect(toLetterGrade(7.0)).toEqual({ letter: 'B', gpa: 3.0 });
      expect(toLetterGrade(8.4)).toEqual({ letter: 'B', gpa: 3.0 });
    });

    it('maps scores to letter C and GPA 2.0 for scores between 5.5 and 6.9', () => {
      expect(toLetterGrade(5.5)).toEqual({ letter: 'C', gpa: 2.0 });
      expect(toLetterGrade(6.9)).toEqual({ letter: 'C', gpa: 2.0 });
    });

    it('maps scores to letter D and GPA 1.0 for scores between 4.0 and 5.4', () => {
      expect(toLetterGrade(4.0)).toEqual({ letter: 'D', gpa: 1.0 });
      expect(toLetterGrade(5.4)).toEqual({ letter: 'D', gpa: 1.0 });
    });

    it('maps scores to letter F and GPA 0.0 for scores below 4.0', () => {
      expect(toLetterGrade(3.9)).toEqual({ letter: 'F', gpa: 0.0 });
      expect(toLetterGrade(0)).toEqual({ letter: 'F', gpa: 0.0 });
    });
  });

  describe('calculateGpa4', () => {
    it('returns zero for empty array', () => {
      expect(calculateGpa4([])).toBe(0);
    });

    it('returns zero when all items have null totalScore', () => {
      expect(calculateGpa4([{ totalScore: null }, { totalScore: null }])).toBe(0);
    });

    it('calculates weighted GPA using explicit credits', () => {
      const items = [
        { totalScore: 9.0, credits: 4 },
        { totalScore: 7.5, credits: 2 },
      ];
      expect(calculateGpa4(items)).toBe(3.67);
    });

    it('uses fallback credit value of 3 when credit is missing or invalid', () => {
      const items = [
        { totalScore: 9.0 },
        { totalScore: 6.0, credits: 0 },
      ];
      expect(calculateGpa4(items)).toBe(3.0);
    });
  });

  describe('calculateAccumulatedCredits', () => {
    it('returns zero for empty array', () => {
      expect(calculateAccumulatedCredits([])).toBe(0);
    });

    it('sums credits only for passed items', () => {
      const items = [
        { finalStatus: 'PASSED', credits: 4 },
        { finalStatus: 'FAILED', credits: 3 },
        { finalStatus: 'PASSED', credits: 2 },
      ];
      expect(calculateAccumulatedCredits(items)).toBe(6);
    });

    it('applies default credit of 3 when omitted on passed items', () => {
      const items = [
        { finalStatus: 'PASSED' },
        { finalStatus: 'FAILED' },
      ];
      expect(calculateAccumulatedCredits(items)).toBe(3);
    });
  });

  describe('getAcademicClassification', () => {
    it('classifies GPA at least 3.6 as Xuat sac', () => {
      expect(getAcademicClassification(3.6)).toBe('Xuất sắc');
      expect(getAcademicClassification(4.0)).toBe('Xuất sắc');
    });

    it('classifies GPA between 3.2 and 3.59 as Gioi', () => {
      expect(getAcademicClassification(3.2)).toBe('Giỏi');
      expect(getAcademicClassification(3.59)).toBe('Giỏi');
    });

    it('classifies GPA between 2.5 and 3.19 as Kha', () => {
      expect(getAcademicClassification(2.5)).toBe('Khá');
      expect(getAcademicClassification(3.19)).toBe('Khá');
    });

    it('classifies GPA between 2.0 and 2.49 as Trung binh', () => {
      expect(getAcademicClassification(2.0)).toBe('Trung bình');
      expect(getAcademicClassification(2.49)).toBe('Trung bình');
    });

    it('classifies GPA below 2.0 as Yeu / Kem', () => {
      expect(getAcademicClassification(1.99)).toBe('Yếu / Kém');
      expect(getAcademicClassification(0)).toBe('Yếu / Kém');
    });
  });
});
