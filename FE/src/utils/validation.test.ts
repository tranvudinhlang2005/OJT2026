import { describe, it, expect } from 'vitest';
import { validateClassDates, validateGradeWeights, validateCreateUserInput } from './validation';

describe('validateClassDates', () => {
  it('returns null when end date is strictly after start date', () => {
    const error = validateClassDates({
      startDate: '2026-10-01',
      endDate: '2026-12-01',
    });
    expect(error).toBeNull();
  });

  it('returns error when end date is equal to start date', () => {
    const error = validateClassDates({
      startDate: '2026-10-01',
      endDate: '2026-10-01',
    });
    expect(error).toBe('Ngày kết thúc phải sau ngày bắt đầu.');
  });

  it('returns error when end date is before start date', () => {
    const error = validateClassDates({
      startDate: '2026-10-05',
      endDate: '2026-10-01',
    });
    expect(error).toBe('Ngày kết thúc phải sau ngày bắt đầu.');
  });

  it('accepts same-day cancel deadline', () => {
    const error = validateClassDates({
      startDate: '2026-10-15',
      endDate: '2026-12-15',
      cancelDeadline: '2026-10-15T23:59:59+07:00',
    });
    expect(error).toBeNull();
  });

  it('returns error when cancel deadline is after start date', () => {
    const error = validateClassDates({
      startDate: '2026-10-15',
      endDate: '2026-12-15',
      cancelDeadline: '2026-10-16T08:00:00+07:00',
    });
    expect(error).toBe('Hạn chót hủy đăng ký phải trước hoặc cùng ngày bắt đầu khóa học.');
  });
});

describe('validateGradeWeights', () => {
  it('accepts weights summing to 1.0', () => {
    expect(validateGradeWeights(0.4, 0.6)).toBeNull();
    expect(validateGradeWeights(0.3, 0.7)).toBeNull();
    expect(validateGradeWeights(0.5, 0.5)).toBeNull();
  });

  it('rejects weights summing to more than 1.0', () => {
    expect(validateGradeWeights(0.5, 0.6)).toBe('Tổng trọng số giữa kỳ và cuối kỳ phải bằng 100% (1.0).');
  });

  it('rejects weights summing to less than 1.0', () => {
    expect(validateGradeWeights(0.3, 0.5)).toBe('Tổng trọng số giữa kỳ và cuối kỳ phải bằng 100% (1.0).');
  });
});

describe('validateCreateUserInput', () => {
  const validInput = {
    username: 'nam.nguyen',
    email: 'nam.nguyen@edu.vn',
    password: 'Password123',
    fullName: 'Nguyễn Văn Nam',
    role: 'STUDENT',
    studentCode: 'SE170123',
    dateOfBirth: '2003-08-15',
  };

  it('accepts valid student input with no errors', () => {
    const errors = validateCreateUserInput(validInput);
    expect(Object.keys(errors)).toHaveLength(0);
  });

  it('rejects username with uppercase letters and provides example', () => {
    const errors = validateCreateUserInput({
      ...validInput,
      username: 'NamNgueyn',
    });
    expect(errors.username).toBeDefined();
    expect(errors.username).toContain('chữ thường');
    expect(errors.username).toContain('nam.nguyen');
  });

  it('rejects username shorter than 4 characters', () => {
    const errors = validateCreateUserInput({
      ...validInput,
      username: 'nam',
    });
    expect(errors.username).toBeDefined();
    expect(errors.username).toContain('4 đến 50 ký tự');
    expect(errors.username).toContain('nam.nguyen');
  });

  it('rejects invalid email and provides example', () => {
    const errors = validateCreateUserInput({
      ...validInput,
      email: 'nam@invalid',
    });
    expect(errors.email).toBeDefined();
    expect(errors.email).toContain('Email không đúng định dạng');
    expect(errors.email).toContain('nam.nguyen@edu.vn');
  });

  it('rejects password without required complexity and provides example', () => {
    const errors = validateCreateUserInput({
      ...validInput,
      password: 'password',
    });
    expect(errors.password).toBeDefined();
    expect(errors.password).toContain('Mật khẩu');
    expect(errors.password).toContain('Student@2026');
  });

  it('rejects empty studentCode for student and provides example', () => {
    const errors = validateCreateUserInput({
      ...validInput,
      studentCode: '   ',
    });
    expect(errors.studentCode).toBeDefined();
    expect(errors.studentCode).toContain('SE170123');
  });

  it('rejects empty instructorCode for instructor and provides example', () => {
    const errors = validateCreateUserInput({
      ...validInput,
      role: 'INSTRUCTOR',
      studentCode: undefined,
      instructorCode: '  ',
    });
    expect(errors.instructorCode).toBeDefined();
    expect(errors.instructorCode).toContain('GV001');
  });

  it('rejects dateOfBirth equal to today in Vietnam timezone and provides example', () => {
    const todayVietnam = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' });
    const errors = validateCreateUserInput({
      ...validInput,
      dateOfBirth: todayVietnam,
    });
    expect(errors.dateOfBirth).toBeDefined();
    expect(errors.dateOfBirth).toContain('Ngày sinh phải trước ngày hôm nay');
    expect(errors.dateOfBirth).toContain('15/08/2003');
  });

  it('rejects future dateOfBirth and provides example', () => {
    const errors = validateCreateUserInput({
      ...validInput,
      dateOfBirth: '2099-01-01',
    });
    expect(errors.dateOfBirth).toBeDefined();
    expect(errors.dateOfBirth).toContain('Ngày sinh phải trước ngày hôm nay');
    expect(errors.dateOfBirth).toContain('15/08/2003');
  });
});
