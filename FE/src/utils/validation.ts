export interface ClassDateRange {
  startDate: string;
  endDate: string;
  cancelDeadline?: string;
}

export function validateClassDates({
  startDate,
  endDate,
  cancelDeadline,
}: ClassDateRange): string | null {
  const startDay = startDate.slice(0, 10);
  const endDay = endDate.slice(0, 10);

  if (endDay <= startDay) {
    return 'Ngày kết thúc phải sau ngày bắt đầu.';
  }

  if (cancelDeadline) {
    const cancelDay = cancelDeadline.slice(0, 10);
    if (cancelDay > startDay) {
      return 'Hạn chót hủy đăng ký phải trước hoặc cùng ngày bắt đầu khóa học.';
    }
  }

  return null;
}

export function validateGradeWeights(
  midtermWeight: number,
  finalWeight: number
): string | null {
  if (Math.abs(Number(midtermWeight) + Number(finalWeight) - 1.0) > 0.001) {
    return 'Tổng trọng số giữa kỳ và cuối kỳ phải bằng 100% (1.0).';
  }
  return null;
}

export interface CreateUserInput {
  username: string;
  email: string;
  password: string;
  fullName: string;
  role: string;
  studentCode?: string;
  instructorCode?: string;
  dateOfBirth?: string;
}

export function validateCreateUserInput(input: CreateUserInput): Record<string, string> {
  const errors: Record<string, string> = {};

  const trimmedUsername = input.username.trim();
  if (!trimmedUsername) {
    errors.username = 'Tên đăng nhập không được để trống. VD hợp lệ: nam.nguyen, namnguyen99';
  } else if (trimmedUsername.length < 4 || trimmedUsername.length > 50) {
    errors.username = 'Tên đăng nhập phải từ 4 đến 50 ký tự. VD hợp lệ: nam.nguyen, namnguyen99';
  } else if (!/^[a-z0-9._]+$/.test(trimmedUsername)) {
    errors.username = 'Tên đăng nhập chỉ gồm chữ thường (4–50 ký tự), số, dấu (.) và (_), không dùng chữ in hoa hay dấu cách. VD hợp lệ: nam.nguyen, namnguyen99';
  }

  const trimmedEmail = input.email.trim();
  if (!trimmedEmail) {
    errors.email = 'Địa chỉ email không được để trống. VD hợp lệ: nam.nguyen@edu.vn';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    errors.email = 'Email không đúng định dạng. VD hợp lệ: nam.nguyen@edu.vn, student@school.com';
  }

  if (!input.password) {
    errors.password = 'Mật khẩu không được để trống. VD hợp lệ: Student@2026, Password123';
  } else if (
    input.password.length < 8 ||
    !/[A-Z]/.test(input.password) ||
    !/[a-z]/.test(input.password) ||
    !/[0-9]/.test(input.password)
  ) {
    errors.password = 'Mật khẩu cần tối thiểu 8 ký tự, bao gồm cả chữ hoa, chữ thường và chữ số. VD hợp lệ: Student@2026, Password123';
  }

  if (!input.fullName.trim()) {
    errors.fullName = 'Họ và tên không được để trống. VD hợp lệ: Nguyễn Văn Nam';
  }

  if (input.role === 'STUDENT') {
    const code = input.studentCode?.trim();
    if (!code) {
      errors.studentCode = 'Mã học viên (MSSV) không được để trống hoặc chứa toàn khoảng trắng. VD hợp lệ: SE170123, HE180001';
    } else if (code.length > 30) {
      errors.studentCode = 'Mã học viên tối đa 30 ký tự. VD hợp lệ: SE170123';
    }
  }

  if (input.role === 'INSTRUCTOR') {
    const code = input.instructorCode?.trim();
    if (!code) {
      errors.instructorCode = 'Mã giảng viên không được để trống hoặc chứa toàn khoảng trắng. VD hợp lệ: GV001, GV_IT02';
    } else if (code.length > 30) {
      errors.instructorCode = 'Mã giảng viên tối đa 30 ký tự. VD hợp lệ: GV001, GV_IT02';
    }
  }

  if (input.dateOfBirth) {
    const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' });
    if (input.dateOfBirth >= today) {
      errors.dateOfBirth = 'Ngày sinh phải trước ngày hôm nay. VD hợp lệ: 15/08/2003';
    }
  }

  return errors;
}
