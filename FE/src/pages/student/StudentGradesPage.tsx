import { useState, useMemo, useEffect } from 'react';
import {
  Award,
  GraduationCap,
  BookCheck,
  TrendingUp,
  Filter,
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { studentService, type StudentResult, type StudentProfile } from '../../services/studentService';
import { courseService } from '../../services/courseService';
import type { CourseItem } from '../../types/course';
import { toLetterGrade, calculateGpa4, calculateAccumulatedCredits, getAcademicClassification } from '../../utils/gradeUtils';
import { DEFAULT_COURSE_CREDITS } from '../../constants/academic';

export default function StudentGradesPage() {
  const { toast } = useToast();
  const [selectedSemester, setSelectedSemester] = useState('ALL');
  const [results, setResults] = useState<StudentResult[]>([]);
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const [resList, prof, courseList] = await Promise.all([
          studentService.getMyResults(),
          studentService.getMyProfile().catch(() => null),
          courseService.getCourses().catch(() => []),
        ]);
        if (isMounted) {
          setResults(resList);
          setProfile(prof);
          setCourses(courseList);
        }
      } catch {
        if (isMounted) {
          toast.error('Không thể tải dữ liệu điểm học tập. Vui lòng thử lại sau.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, [toast]);

  const courseCreditsMap = useMemo(() => {
    return new Map<string, number>(courses.map((c) => [c.code, c.credits]));
  }, [courses]);

  const resultsWithCredits = useMemo(() => {
    return results.map((r) => ({
      ...r,
      credits: courseCreditsMap.get(r.courseCode) || DEFAULT_COURSE_CREDITS,
    }));
  }, [results, courseCreditsMap]);

  const semesters = useMemo(() => {
    const set = new Set(results.map((g) => g.semester));
    return Array.from(set);
  }, [results]);

  const filteredGrades = useMemo(() => {
    if (selectedSemester === 'ALL') return resultsWithCredits;
    return resultsWithCredits.filter((g) => g.semester === selectedSemester);
  }, [resultsWithCredits, selectedSemester]);

  const semesterGpa = useMemo(() => {
    return calculateGpa4(filteredGrades).toFixed(2);
  }, [filteredGrades]);

  const accumulatedCredits = useMemo(() => {
    return calculateAccumulatedCredits(resultsWithCredits);
  }, [resultsWithCredits]);

  const totalGpa4 = useMemo(() => {
    return calculateGpa4(resultsWithCredits);
  }, [resultsWithCredits]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
              Kết quả học tập cá nhân
            </span>
            {profile?.studentCode && (
              <span className="text-xs text-slate-500 font-mono">
                MSSV: {profile.studentCode}
              </span>
            )}
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Bảng điểm & Kết quả học tập
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">GPA Tích lũy (Hệ 4)</span>
            <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
              <Award className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-blue-600">{totalGpa4.toFixed(2)}</span>
            <span className="text-xs text-slate-400">/ 4.00</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Tương đương {(totalGpa4 * 2.5).toFixed(1)} (Hệ 10)
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Tín chỉ tích lũy</span>
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
              <BookCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-600">{accumulatedCredits}</span>
            <span className="text-xs text-slate-400">/ 140 Tín chỉ</span>
          </div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500"
              style={{
                width: `${Math.min(100, (accumulatedCredits / 140) * 100)}%`,
              }}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Xếp loại học tập</span>
            <div className="rounded-lg bg-purple-50 p-2 text-purple-600">
              <GraduationCap className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-purple-700">
              {getAcademicClassification(totalGpa4)}
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500">Trạng thái: Đạt chuẩn tiến độ</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              {selectedSemester === 'ALL' ? 'GPA Toàn khóa' : 'GPA Học kỳ chọn'}
            </span>
            <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{semesterGpa}</span>
            <span className="text-xs text-slate-400">({filteredGrades.length} học phần)</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {selectedSemester === 'ALL' ? 'Tất cả các học kỳ' : selectedSemester}
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-600">Chọn học kỳ:</span>
          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
            className="rounded-lg border border-slate-200 py-1.5 px-3 text-xs font-medium text-slate-800 focus:border-blue-500 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
          >
            <option value="ALL">Tất cả các học kỳ</option>
            {semesters.map((sem) => (
              <option key={sem} value={sem}>
                {sem}
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-slate-500">
          Hiển thị <strong>{filteredGrades.length}</strong> học phần
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3.5">Mã HP</th>
                <th className="px-4 py-3.5">Tên học phần</th>
                <th className="px-3 py-3.5 text-center">Tỷ lệ CC</th>
                <th className="px-3 py-3.5 text-center">Giữa kỳ</th>
                <th className="px-3 py-3.5 text-center">Cuối kỳ</th>
                <th className="px-3 py-3.5 text-center">Tổng kết (Hệ 10)</th>
                <th className="px-3 py-3.5 text-center">Điểm chữ</th>
                <th className="px-3 py-3.5 text-center">Hệ 4</th>
                <th className="px-3 py-3.5 text-center">Kết quả</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Đang tải bảng điểm từ hệ thống...
                  </td>
                </tr>
              ) : filteredGrades.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Chưa có học phần nào được duyệt điểm trong học kỳ này.
                  </td>
                </tr>
              ) : (
                filteredGrades.map((item) => {
                  const letter = toLetterGrade(item.totalScore);
                  return (
                    <tr key={item.classId} className="hover:bg-slate-50/70 transition">
                      <td className="px-4 py-3.5 font-mono text-xs font-semibold text-slate-700">
                        {item.courseCode}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-900">{item.courseName}</div>
                        <div className="text-[11px] text-slate-400">
                          Mã lớp: {item.classCode} • {item.semester}
                        </div>
                      </td>
                      <td className="px-3 py-3.5 text-center text-slate-700 font-mono">
                        {item.attendanceRate !== null ? `${item.attendanceRate}%` : '-'}
                      </td>
                      <td className="px-3 py-3.5 text-center text-slate-700 font-mono">
                        {item.midtermScore !== null ? item.midtermScore.toFixed(1) : '-'}
                      </td>
                      <td className="px-3 py-3.5 text-center text-slate-700 font-mono">
                        {item.finalScore !== null ? item.finalScore.toFixed(1) : '-'}
                      </td>
                      <td className="px-3 py-3.5 text-center font-bold text-slate-900 font-mono">
                        {item.totalScore !== null ? item.totalScore.toFixed(1) : '-'}
                      </td>
                      <td className="px-3 py-3.5 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                            letter.letter === 'A'
                              ? 'bg-emerald-100 text-emerald-800'
                              : letter.letter.startsWith('B')
                              ? 'bg-blue-100 text-blue-800'
                              : letter.letter.startsWith('C')
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {letter.letter}
                        </span>
                      </td>
                      <td className="px-3 py-3.5 text-center font-bold text-blue-700 font-mono">
                        {letter.gpa.toFixed(1)}
                      </td>
                      <td className="px-3 py-3.5 text-center">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            item.finalStatus === 'PASSED'
                              ? 'bg-emerald-50 text-emerald-700'
                              : item.finalStatus === 'FAILED'
                              ? 'bg-rose-50 text-rose-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {item.finalStatus === 'PASSED' ? 'Đạt' : item.finalStatus === 'FAILED' ? 'Không đạt' : 'Đang xử lý'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
