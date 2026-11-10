import type {
  ClassOffering,
  ClassSession,
  ClassFilter,
  CreateClassPayload,
  UpdateClassPayload,
  CreateSessionPayload,
  UpdateSessionPayload,
  CourseSummary,
  InstructorSummary,
  RoomSummary,
  ConflictCheckResult,
} from '../types/classOffering';
import {
  INITIAL_MOCK_CLASSES,
  INITIAL_MOCK_SESSIONS,
  MOCK_COURSES,
  MOCK_INSTRUCTORS,
  MOCK_ROOMS,
} from './classMockData';

// In-memory runtime state for frontend operations
let mockClasses: ClassOffering[] = [...INITIAL_MOCK_CLASSES];
let mockSessions: ClassSession[] = [...INITIAL_MOCK_SESSIONS];

const delay = (ms: number = 200) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Helper to check time overlap between two intervals [startA, endA) and [startB, endB)
 */
function isTimeOverlapping(startA: string, endA: string, startB: string, endB: string): boolean {
  return startA < endB && startB < endA;
}

export const classService = {
  /**
   * Lấy danh sách lớp học theo bộ lọc
   */
  async getClasses(filter: ClassFilter = {}): Promise<ClassOffering[]> {
    await delay();
    return mockClasses.filter((cls) => {
      if (filter.semester && filter.semester !== 'ALL' && cls.semester !== filter.semester) {
        return false;
      }
      if (filter.courseId && filter.courseId !== 'ALL' && cls.courseId !== filter.courseId) {
        return false;
      }
      if (filter.status && filter.status !== 'ALL' && cls.status !== filter.status) {
        return false;
      }
      if (filter.instructorId && filter.instructorId !== 'ALL' && cls.instructorId !== filter.instructorId) {
        return false;
      }
      if (filter.keyword && filter.keyword.trim() !== '') {
        const kw = filter.keyword.trim().toLowerCase();
        const matchCode = cls.classCode.toLowerCase().includes(kw);
        const matchCourse = cls.course.name.toLowerCase().includes(kw) || cls.course.code.toLowerCase().includes(kw);
        const matchInstructor = cls.instructor?.fullName.toLowerCase().includes(kw) ?? false;
        if (!matchCode && !matchCourse && !matchInstructor) {
          return false;
        }
      }
      return true;
    });
  },

  /**
   * Lấy chi tiết lớp học theo ID
   */
  async getClassById(id: string): Promise<ClassOffering | null> {
    await delay();
    const cls = mockClasses.find((c) => c.id === id);
    if (!cls) return null;
    const count = mockSessions.filter((s) => s.classId === id).length;
    return { ...cls, sessionsCount: count };
  },

  /**
   * Lấy danh mục môn học
   */
  async getCourses(): Promise<CourseSummary[]> {
    await delay(100);
    return [...MOCK_COURSES];
  },

  /**
   * Lấy danh mục phòng học
   */
  async getRooms(): Promise<RoomSummary[]> {
    await delay(100);
    return [...MOCK_ROOMS];
  },

  /**
   * Lấy danh sách giảng viên
   */
  async getInstructors(): Promise<InstructorSummary[]> {
    await delay(100);
    return [...MOCK_INSTRUCTORS];
  },

  /**
   * Lấy danh sách giảng viên đủ chuyên môn cho môn học cụ thể
   */
  async getQualifiedInstructors(courseId: string): Promise<InstructorSummary[]> {
    await delay(100);
    return MOCK_INSTRUCTORS.filter(
      (inst) => inst.teachingActive && inst.teachableCourses.includes(courseId)
    );
  },

  /**
   * Tạo mới lớp học phần (Khởi tạo ở trạng thái DRAFT)
   */
  async createClass(payload: CreateClassPayload): Promise<ClassOffering> {
    await delay();

    // 1. Kiểm tra mã lớp trùng lặp
    const exists = mockClasses.some(
      (c) => c.classCode.trim().toLowerCase() === payload.classCode.trim().toLowerCase()
    );
    if (exists) {
      throw new Error(`Mã lớp "${payload.classCode}" đã tồn tại trên hệ thống (CLASS_CODE_DUPLICATE).`);
    }

    // 2. Kiểm tra logic thời gian
    if (new Date(payload.endDate) <= new Date(payload.startDate)) {
      throw new Error('Ngày kết thúc phải lớn hơn ngày bắt đầu khóa học.');
    }

    const course = MOCK_COURSES.find((c) => c.id === payload.courseId);
    if (!course) {
      throw new Error('Không tìm thấy thông tin môn học đã chọn.');
    }

    let instructor: InstructorSummary | null = null;
    if (payload.instructorId) {
      const found = MOCK_INSTRUCTORS.find((i) => i.id === payload.instructorId);
      if (found) {
        if (!found.teachingActive) {
          throw new Error(`Giảng viên ${found.fullName} đang tạm ngừng nhận lớp.`);
        }
        instructor = found;
      }
    }

    const newClass: ClassOffering = {
      id: `c-${Date.now()}`,
      classCode: payload.classCode.trim().toUpperCase(),
      courseId: course.id,
      course,
      semester: payload.semester,
      startDate: payload.startDate,
      endDate: payload.endDate,
      instructorId: instructor?.id || null,
      instructor,
      maxCapacity: Number(payload.maxCapacity) || 40,
      enrolledCount: 0,
      status: 'DRAFT',
      cancelDeadline: payload.cancelDeadline,
      minAttendancePct: payload.minAttendancePct ?? course.defaultMinAttendancePct ?? 80.0,
      passScore: payload.passScore ?? course.defaultPassScore ?? 5.0,
      midtermWeight: payload.midtermWeight ?? 0.3,
      finalWeight: payload.finalWeight ?? 0.7,
      gradingStatus: 'DRAFT',
      sessionsCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockClasses.unshift(newClass);
    return newClass;
  },

  /**
   * Cập nhật thông tin lớp học
   */
  async updateClass(id: string, payload: UpdateClassPayload): Promise<ClassOffering> {
    await delay();
    const index = mockClasses.findIndex((c) => c.id === id);
    if (index === -1) {
      throw new Error('Không tìm thấy lớp học phần để cập nhật.');
    }

    const current = mockClasses[index];

    if (payload.classCode && payload.classCode.trim().toLowerCase() !== current.classCode.toLowerCase()) {
      const exists = mockClasses.some(
        (c) => c.id !== id && c.classCode.trim().toLowerCase() === payload.classCode!.trim().toLowerCase()
      );
      if (exists) {
        throw new Error(`Mã lớp "${payload.classCode}" đã tồn tại trên hệ thống.`);
      }
    }

    let instructor = current.instructor;
    if (payload.instructorId !== undefined) {
      if (payload.instructorId) {
        const found = MOCK_INSTRUCTORS.find((i) => i.id === payload.instructorId);
        if (found) instructor = found;
      } else {
        instructor = null;
      }
    }

    const updated: ClassOffering = {
      ...current,
      ...payload,
      classCode: payload.classCode ? payload.classCode.trim().toUpperCase() : current.classCode,
      instructorId: payload.instructorId !== undefined ? payload.instructorId : current.instructorId,
      instructor,
      updatedAt: new Date().toISOString(),
    };

    mockClasses[index] = updated;
    return updated;
  },

  /**
   * Phân công giảng viên cho lớp
   */
  async assignInstructor(classId: string, instructorId: string | null): Promise<ClassOffering> {
    await delay();
    const cls = mockClasses.find((c) => c.id === classId);
    if (!cls) throw new Error('Không tìm thấy lớp học phần.');

    if (!instructorId) {
      cls.instructorId = null;
      cls.instructor = null;
      cls.updatedAt = new Date().toISOString();
      return { ...cls };
    }

    const instructor = MOCK_INSTRUCTORS.find((i) => i.id === instructorId);
    if (!instructor) throw new Error('Không tìm thấy giảng viên.');
    if (!instructor.teachingActive) {
      throw new Error(`Giảng viên ${instructor.fullName} đang tạm ngừng nhận lớp.`);
    }

    cls.instructorId = instructor.id;
    cls.instructor = instructor;
    cls.updatedAt = new Date().toISOString();
    return { ...cls };
  },

  /**
   * Công bố mở lớp (DRAFT -> OPEN)
   */
  async publishClass(id: string): Promise<ClassOffering> {
    await delay();
    const cls = mockClasses.find((c) => c.id === id);
    if (!cls) throw new Error('Không tìm thấy lớp học phần.');

    if (cls.status !== 'DRAFT') {
      throw new Error(`Lớp đang ở trạng thái "${cls.status}", không thể thực hiện công bố mở lớp.`);
    }

    // Kiểm tra điều kiện bắt buộc theo spec TR05
    if (!cls.instructorId || !cls.instructor) {
      throw new Error('Không thể công bố mở lớp: Chưa phân công giảng viên phụ trách.');
    }

    const classSessions = mockSessions.filter((s) => s.classId === id);
    if (classSessions.length === 0) {
      throw new Error('Không thể công bố mở lớp: Lớp học chưa có buổi học nào được xếp lịch.');
    }

    cls.status = 'OPEN';
    cls.updatedAt = new Date().toISOString();
    return { ...cls };
  },

  /**
   * Bắt đầu giảng dạy (OPEN -> IN_PROGRESS)
   */
  async startClass(id: string): Promise<ClassOffering> {
    await delay();
    const cls = mockClasses.find((c) => c.id === id);
    if (!cls) throw new Error('Không tìm thấy lớp học phần.');

    if (cls.status !== 'OPEN') {
      throw new Error('Chỉ có thể chuyển sang "Đang diễn ra" đối với các lớp đang ở trạng thái Mở đăng ký (OPEN).');
    }

    cls.status = 'IN_PROGRESS';
    cls.updatedAt = new Date().toISOString();
    return { ...cls };
  },

  /**
   * Đóng lớp học (IN_PROGRESS -> CLOSED)
   */
  async closeClass(id: string): Promise<ClassOffering> {
    await delay();
    const cls = mockClasses.find((c) => c.id === id);
    if (!cls) throw new Error('Không tìm thấy lớp học phần.');

    if (cls.status !== 'IN_PROGRESS') {
      throw new Error('Chỉ có thể đóng lớp đối với các lớp đang diễn ra (IN_PROGRESS).');
    }

    cls.status = 'CLOSED';
    cls.updatedAt = new Date().toISOString();
    return { ...cls };
  },

  /**
   * Hủy lớp học phần kèm lý do
   */
  async cancelClass(id: string, reason: string): Promise<ClassOffering> {
    await delay();
    const cls = mockClasses.find((c) => c.id === id);
    if (!cls) throw new Error('Không tìm thấy lớp học phần.');

    if (!reason || reason.trim() === '') {
      throw new Error('Bắt buộc phải nhập lý do khi thực hiện hủy lớp học phần.');
    }

    cls.status = 'CANCELLED';
    cls.cancelReason = reason.trim();
    cls.updatedAt = new Date().toISOString();
    return { ...cls };
  },

  /**
   * Xóa vật lý lớp học (Chỉ áp dụng cho DRAFT và chưa từng có học viên đăng ký)
   */
  async deleteClass(id: string): Promise<void> {
    await delay();
    const cls = mockClasses.find((c) => c.id === id);
    if (!cls) throw new Error('Không tìm thấy lớp học phần cần xóa.');

    if (cls.status !== 'DRAFT') {
      throw new Error('Chỉ được phép xóa lớp học đang ở trạng thái Bản nháp (DRAFT).');
    }

    if (cls.enrolledCount > 0) {
      throw new Error('Không thể xóa lớp đã có sinh viên đăng ký.');
    }

    // Xóa tất cả sessions thuộc lớp
    mockSessions = mockSessions.filter((s) => s.classId !== id);
    // Xóa lớp
    mockClasses = mockClasses.filter((c) => c.id !== id);
  },

  // ==========================================
  // QUẢN LÝ LỊCH HỌC & BUỔI HỌC (SESSIONS)
  // ==========================================

  /**
   * Lấy danh sách các buổi học của một lớp, sắp xếp theo ngày và giờ tăng dần
   */
  async getSessions(classId: string): Promise<ClassSession[]> {
    await delay(150);
    return mockSessions
      .filter((s) => s.classId === classId)
      .sort((a, b) => {
        if (a.sessionDate !== b.sessionDate) {
          return a.sessionDate.localeCompare(b.sessionDate);
        }
        return a.startTime.localeCompare(b.startTime);
      });
  },

  /**
   * Kiểm tra xung đột lịch học (TR08)
   */
  async checkSessionConflict(
    session: {
      classId: string;
      sessionDate: string;
      startTime: string;
      endTime: string;
      roomId: string;
    },
    excludeSessionId?: string
  ): Promise<ConflictCheckResult> {
    const parentClass = mockClasses.find((c) => c.id === session.classId);

    // 1. Kiểm tra trùng lịch nội bộ trong cùng lớp (hai ca trùng nhau cùng ngày)
    const internalConflict = mockSessions.find(
      (s) =>
        s.classId === session.classId &&
        s.id !== excludeSessionId &&
        s.sessionDate === session.sessionDate &&
        isTimeOverlapping(s.startTime, s.endTime, session.startTime, session.endTime)
    );
    if (internalConflict) {
      return {
        hasConflict: true,
        conflictType: 'INTERNAL',
        message: `Trùng lặp với ca học khác của chính lớp này (${internalConflict.startTime} - ${internalConflict.endTime}) vào ngày ${session.sessionDate}.`,
      };
    }

    // 2. Kiểm tra xung đột phòng học (Room Conflict) với tất cả các lớp đang mở/học
    const activeClassIds = new Set(
      mockClasses
        .filter((c) => ['DRAFT', 'OPEN', 'IN_PROGRESS'].includes(c.status))
        .map((c) => c.id)
    );

    const roomConflict = mockSessions.find((s) => {
      if (s.id === excludeSessionId) return false;
      if (s.roomId !== session.roomId || s.sessionDate !== session.sessionDate) return false;
      if (!activeClassIds.has(s.classId)) return false;
      return isTimeOverlapping(s.startTime, s.endTime, session.startTime, session.endTime);
    });

    if (roomConflict) {
      const otherClass = mockClasses.find((c) => c.id === roomConflict.classId);
      const room = MOCK_ROOMS.find((r) => r.id === session.roomId);
      return {
        hasConflict: true,
        conflictType: 'ROOM',
        message: `Phòng ${room?.code || session.roomId} đã được xếp cho lớp "${otherClass?.classCode}" (${roomConflict.startTime} - ${roomConflict.endTime}) vào ngày ${session.sessionDate}.`,
      };
    }

    // 3. Kiểm tra xung đột giảng viên (Instructor Conflict)
    if (parentClass?.instructorId) {
      const instructorClassIds = new Set(
        mockClasses
          .filter(
            (c) =>
              c.instructorId === parentClass.instructorId &&
              c.id !== session.classId &&
              ['DRAFT', 'OPEN', 'IN_PROGRESS'].includes(c.status)
          )
          .map((c) => c.id)
      );

      const instructorConflict = mockSessions.find((s) => {
        if (!instructorClassIds.has(s.classId)) return false;
        if (s.sessionDate !== session.sessionDate) return false;
        return isTimeOverlapping(s.startTime, s.endTime, session.startTime, session.endTime);
      });

      if (instructorConflict) {
        const otherClass = mockClasses.find((c) => c.id === instructorConflict.classId);
        return {
          hasConflict: true,
          conflictType: 'INSTRUCTOR',
          message: `Giảng viên ${parentClass.instructor?.fullName} đang có lịch dạy lớp "${otherClass?.classCode}" (${instructorConflict.startTime} - ${instructorConflict.endTime}) vào ngày ${session.sessionDate}.`,
        };
      }
    }

    return { hasConflict: false };
  },

  /**
   * Thêm buổi học mới vào lớp
   */
  async createSession(payload: CreateSessionPayload): Promise<ClassSession> {
    await delay();

    if (payload.startTime >= payload.endTime) {
      throw new Error('Giờ bắt đầu phải trước giờ kết thúc buổi học.');
    }

    // Kiểm tra xung đột lịch
    const conflict = await this.checkSessionConflict(payload);
    if (conflict.hasConflict) {
      throw new Error(`Xung đột lịch học: ${conflict.message}`);
    }

    const room = MOCK_ROOMS.find((r) => r.id === payload.roomId);
    if (!room) {
      throw new Error('Phòng học được chọn không hợp lệ.');
    }

    const newSession: ClassSession = {
      id: `s-${Date.now()}`,
      classId: payload.classId,
      sessionDate: payload.sessionDate,
      startTime: payload.startTime,
      endTime: payload.endTime,
      roomId: room.id,
      roomCode: room.code,
      topic: payload.topic?.trim() || undefined,
      attendanceLocked: false,
    };

    mockSessions.push(newSession);

    // Cập nhật số buổi trong lớp
    const cls = mockClasses.find((c) => c.id === payload.classId);
    if (cls) {
      cls.sessionsCount = mockSessions.filter((s) => s.classId === payload.classId).length;
    }

    return newSession;
  },

  /**
   * Cập nhật thông tin buổi học
   */
  async updateSession(sessionId: string, payload: UpdateSessionPayload): Promise<ClassSession> {
    await delay();
    const index = mockSessions.findIndex((s) => s.id === sessionId);
    if (index === -1) {
      throw new Error('Không tìm thấy buổi học.');
    }

    const current = mockSessions[index];
    const sessionDate = payload.sessionDate || current.sessionDate;
    const startTime = payload.startTime || current.startTime;
    const endTime = payload.endTime || current.endTime;
    const roomId = payload.roomId || current.roomId;

    if (startTime >= endTime) {
      throw new Error('Giờ bắt đầu phải trước giờ kết thúc buổi học.');
    }

    // Kiểm tra xung đột
    const conflict = await this.checkSessionConflict(
      {
        classId: current.classId,
        sessionDate,
        startTime,
        endTime,
        roomId,
      },
      sessionId
    );

    if (conflict.hasConflict) {
      throw new Error(`Xung đột lịch học: ${conflict.message}`);
    }

    const room = MOCK_ROOMS.find((r) => r.id === roomId);

    const updated: ClassSession = {
      ...current,
      sessionDate,
      startTime,
      endTime,
      roomId,
      roomCode: room ? room.code : current.roomCode,
      topic: payload.topic !== undefined ? payload.topic.trim() : current.topic,
    };

    mockSessions[index] = updated;
    return updated;
  },

  /**
   * Xóa một buổi học
   */
  async deleteSession(sessionId: string): Promise<void> {
    await delay();
    const session = mockSessions.find((s) => s.id === sessionId);
    if (!session) throw new Error('Không tìm thấy buổi học.');

    const classId = session.classId;
    mockSessions = mockSessions.filter((s) => s.id !== sessionId);

    // Cập nhật lại số buổi
    const cls = mockClasses.find((c) => c.id === classId);
    if (cls) {
      cls.sessionsCount = mockSessions.filter((s) => s.classId === classId).length;
    }
  },
};

