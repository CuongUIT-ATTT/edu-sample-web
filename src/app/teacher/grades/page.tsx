"use client";

import React, { useState, useEffect, useTransition } from "react";
import { TrendingUp, RefreshCw, Check, CheckSquare } from "lucide-react";
import { submitGrade } from "@/actions/grades";

interface Student {
  id: string;
  name: string;
  email: string;
}

interface GradeRecord {
  studentId: string;
  score: number;
  weight: number;
  remarks: string;
}

export default function TeacherGradesPage() {
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [subjects, setSubjects] = useState<{ id: string; name: string; code: string }[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [selectedType, setSelectedType] = useState("QUIZ");
  const [weight, setWeight] = useState(0.1);

  const [students, setStudents] = useState<Student[]>([]);
  const [grades, setGrades] = useState<Record<string, { score: string; remarks: string }>>({});
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [submitResult, setSubmitResult] = useState<{ success: boolean; message: string } | null>(null);

  // Update default weight depending on type
  useEffect(() => {
    if (selectedType === "QUIZ") setWeight(0.1);
    else if (selectedType === "MIDTERM") setWeight(0.3);
    else if (selectedType === "FINAL") setWeight(0.6);
  }, [selectedType]);

  // Load classes and subjects
  useEffect(() => {
    Promise.all([
      fetch("/api/teacher/classes").then((r) => r.json()),
      fetch("/api/teacher/subjects").then((r) => r.json())
    ])
      .then(([classesData, subjectsData]) => {
        setClasses(classesData.classes || []);
        setSubjects(subjectsData.subjects || []);
        if (classesData.classes?.length > 0) setSelectedClassId(classesData.classes[0].id);
        if (subjectsData.subjects?.length > 0) setSelectedSubjectId(subjectsData.subjects[0].id);
      })
      .catch(() => {});
  }, []);

  // Fetch students and existing grades
  useEffect(() => {
    if (!selectedClassId || !selectedSubjectId || !selectedType) return;
    setLoadingStudents(true);
    setSubmitResult(null);

    Promise.all([
      fetch(`/api/teacher/classes/${selectedClassId}/students`).then((r) => r.json()),
      fetch(`/api/teacher/grades?classId=${selectedClassId}&subjectId=${selectedSubjectId}&type=${selectedType}`).then((r) => r.json())
    ])
      .then(([studentsData, gradesData]) => {
        const studentList = studentsData.students || [];
        setStudents(studentList);

        const existingGrades = gradesData.grades || [];
        const gradeMap: Record<string, { score: string; remarks: string }> = {};

        // Default all to empty
        studentList.forEach((s: Student) => {
          gradeMap[s.id] = { score: "", remarks: "" };
        });

        // Fill in existing ones
        existingGrades.forEach((g: { studentId: string; score: number; remarks?: string }) => {
          gradeMap[g.studentId] = {
            score: g.score.toString(),
            remarks: g.remarks || "",
          };
        });

        setGrades(gradeMap);
      })
      .catch(() => {})
      .finally(() => setLoadingStudents(false));
  }, [selectedClassId, selectedSubjectId, selectedType]);

  const handleScoreChange = (studentId: string, value: string) => {
    setGrades((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], score: value }
    }));
  };

  const handleRemarksChange = (studentId: string, value: string) => {
    setGrades((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], remarks: value }
    }));
  };

  const handleSubmit = () => {
    setSubmitResult(null);
    startTransition(async () => {
      let successCount = 0;
      let errorCount = 0;

      for (const student of students) {
        const record = grades[student.id];
        if (!record || record.score === "") continue;

        const scoreNum = parseFloat(record.score);
        if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 10) {
          errorCount++;
          continue;
        }

        const result = await submitGrade({
          studentId: student.id,
          subjectId: selectedSubjectId,
          type: selectedType,
          score: scoreNum,
          weight,
          remarks: record.remarks,
        });

        if (result.success) successCount++;
        else errorCount++;
      }

      setSubmitResult({
        success: errorCount === 0,
        message:
          errorCount === 0
            ? `✅ Đã lưu điểm cho ${successCount} học sinh.`
            : `⚠️ Lưu thành công ${successCount}, thất bại ${errorCount} học sinh (kiểm tra lại định dạng điểm từ 0 đến 10).`,
      });
    });
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-tagline text-2xl font-semibold text-ink">Sổ điểm lớp học</h1>
        <p className="font-caption text-ink-muted-80 mt-1">Nhập điểm số định kỳ cho học sinh theo môn và lớp</p>
      </div>

      {/* Controls */}
      <div className="bg-canvas border border-hairline rounded-lg p-6 shadow-sm flex flex-wrap gap-4 items-end">
        <div className="flex flex-col gap-1.5 flex-1 min-w-[150px]">
          <label className="text-xs font-caption-strong text-ink-muted-80">Lớp học</label>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="bg-canvas border border-hairline rounded-pill px-4 py-2.5 h-10 text-sm text-ink outline-none focus:border-primary-focus"
          >
            {classes.length === 0 && <option value="">— Chọn lớp —</option>}
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5 flex-1 min-w-[150px]">
          <label className="text-xs font-caption-strong text-ink-muted-80">Môn học</label>
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="bg-canvas border border-hairline rounded-pill px-4 py-2.5 h-10 text-sm text-ink outline-none focus:border-primary-focus"
          >
            {subjects.length === 0 && <option value="">— Chọn môn —</option>}
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5 flex-1 min-w-[150px]">
          <label className="text-xs font-caption-strong text-ink-muted-80">Cột điểm</label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-canvas border border-hairline rounded-pill px-4 py-2.5 h-10 text-sm text-ink outline-none focus:border-primary-focus"
          >
            <option value="QUIZ">Kiểm tra 15' (Hệ số 1)</option>
            <option value="MIDTERM">Giữa kỳ (Hệ số 3)</option>
            <option value="FINAL">Cuối kỳ (Hệ số 6)</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5 w-24">
          <label className="text-xs font-caption-strong text-ink-muted-80">Trọng số</label>
          <input
            type="number"
            step="0.05"
            min="0.05"
            max="1"
            value={weight}
            onChange={(e) => setWeight(parseFloat(e.target.value) || 0.1)}
            className="bg-canvas border border-hairline rounded-pill px-4 py-2.5 h-10 text-sm text-ink outline-none focus:border-primary-focus"
          />
        </div>
      </div>

      {/* Result Banner */}
      {submitResult && (
        <div className={`px-4 py-3 rounded-lg text-sm font-caption border ${submitResult.success ? "bg-green-50 border-green-200 text-green-700" : "bg-yellow-50 border-yellow-200 text-yellow-700"}`}>
          {submitResult.message}
        </div>
      )}

      {/* Student List */}
      <div className="bg-canvas border border-hairline rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-hairline bg-surface-pearl flex items-center justify-between">
          <h2 className="font-body-strong text-sm text-ink flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Nhập điểm học sinh ({students.length} học sinh)
          </h2>
          {students.length > 0 && (
            <button
              onClick={handleSubmit}
              disabled={isPending || students.length === 0}
              className="flex items-center gap-2 bg-primary hover:bg-primary-focus text-white px-4 py-2 rounded-pill text-xs font-body-strong transition-colors disabled:opacity-50"
            >
              {isPending ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <CheckSquare className="h-3.5 w-3.5" />}
              Lưu bảng điểm
            </button>
          )}
        </div>

        {loadingStudents ? (
          <div className="p-12 text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
            <p className="text-sm text-ink-muted-80">Đang tải danh sách học sinh...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="p-16 text-center">
            <TrendingUp className="h-12 w-12 text-ink-muted-48 mx-auto mb-4" />
            <p className="font-body text-ink-muted-80">Chọn lớp và môn học để bắt đầu nhập điểm.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-hairline bg-surface-pearl">
                <th className="text-left px-6 py-3 text-[11px] font-caption-strong text-ink-muted-48 uppercase tracking-wider">Học sinh</th>
                <th className="text-left px-6 py-3 text-[11px] font-caption-strong text-ink-muted-48 uppercase tracking-wider w-36">Điểm số (0 - 10)</th>
                <th className="text-left px-6 py-3 text-[11px] font-caption-strong text-ink-muted-48 uppercase tracking-wider">Nhận xét của giáo viên</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id} className="border-b border-hairline last:border-0 hover:bg-surface-pearl transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-body-strong text-ink">{student.name}</p>
                    <p className="text-xs font-caption text-ink-muted-48">{student.email}</p>
                  </td>
                  <td className="px-6 py-4">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="10"
                      placeholder="Chưa nhập"
                      value={grades[student.id]?.score || ""}
                      onChange={(e) => handleScoreChange(student.id, e.target.value)}
                      className="bg-canvas border border-hairline rounded-pill px-4 py-1.5 h-9 text-sm text-ink outline-none focus:border-primary-focus w-28 text-center"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <input
                      type="text"
                      placeholder="Thêm nhận xét..."
                      value={grades[student.id]?.remarks || ""}
                      onChange={(e) => handleRemarksChange(student.id, e.target.value)}
                      className="bg-canvas border border-hairline rounded-pill px-4 py-1.5 h-9 text-sm text-ink outline-none focus:border-primary-focus w-full"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
