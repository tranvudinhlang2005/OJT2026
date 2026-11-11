export const ROUTES = {
  HOME: '/',
  AUTH: {
    LOGIN: '/login',
    FORGOT_PASSWORD: '/forgot-password',
  },
  ADMIN: {
    ROOT: '/admin',
    DASHBOARD: '/admin',
    USERS: '/admin/users',
    COURSES_ROOMS: '/admin/courses-rooms',
    CLASSES: '/admin/classes',
    APPROVALS: '/admin/approvals',
  },
  EDUCATOR: {
    ROOT: '/educator',
  },
  TEACHER: {
    ROOT: '/teacher',
    SCHEDULE: '/teacher/schedule',
    CLASSES: '/teacher/classes',
    GRADES: '/teacher/grades',
  },
  STUDENT: {
    ROOT: '/student',
    SCHEDULE: '/student/schedule',
    REGISTRATION: '/student/registration',
    GRADES: '/student/grades',
    PROFILE: '/student/profile',
  },
  UNAUTHORIZED: '/unauthorized',
} as const;

