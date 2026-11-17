import { axiosClient } from './axiosClient';

export interface ScheduleItem {
  id: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  roomCode: string;
  classCode: string;
  courseName: string;
  topic?: string;
}

interface BackendScheduleResponse {
  sessionDate: string;
  startTime: string;
  endTime: string;
  roomCode: string;
  classCode: string;
  courseName: string;
  topic: string | null;
}

export const scheduleService = {
  async getMySchedule(from?: string, to?: string): Promise<ScheduleItem[]> {
    const params: Record<string, string> = {};
    if (from) params.from = from;
    if (to) params.to = to;

    const res = await axiosClient.get<BackendScheduleResponse[]>('/me/schedule', { params });
    const items = Array.isArray(res.data) ? res.data : [];

    return items.map((it, idx) => ({
      id: `sched-${idx}-${it.sessionDate}-${it.startTime}`,
      sessionDate: it.sessionDate,
      startTime: it.startTime.substring(0, 5),
      endTime: it.endTime.substring(0, 5),
      roomCode: it.roomCode,
      classCode: it.classCode,
      courseName: it.courseName,
      topic: it.topic || undefined,
    }));
  },
};

