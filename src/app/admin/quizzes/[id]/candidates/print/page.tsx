import { getQuizCandidates } from "@/actions/quizzes";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminPrintQuizCandidatesPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") redirect("/login");

  const { id } = await params;
  const result = await getQuizCandidates(id);
  if (!result.success || !result.data || !result.quiz) {
    return <main className="p-10 text-red-600">{result.error || "Không thể tải danh sách mã dự thi."}</main>;
  }

  return (
    <main className="mx-auto max-w-4xl bg-white p-8 text-slate-900 print:max-w-none print:p-0">
      <style>{"@media print { .no-print { display: none !important; } }"}</style>
      <p className="no-print mb-6 text-sm text-slate-600">Chỉ in/phát danh sách này cho thí sinh được phép dự thi. Dùng Ctrl/Cmd + P để in.</p>
      <h1 className="text-2xl font-bold">Danh sách mã dự thi</h1>
      <h2 className="mt-1 text-base text-slate-600">{result.quiz.title}</h2>
      <p className="mt-2 text-sm">Giới hạn mặc định của đề: {result.quiz.maxSubmissions} lượt nộp bài. Mỗi mã có thể có giới hạn riêng.</p>
      <table className="mt-6 w-full border-collapse text-sm">
        <thead><tr className="bg-slate-100 text-left"><th className="border border-slate-300 p-2">STT</th><th className="border border-slate-300 p-2">Họ và tên</th><th className="border border-slate-300 p-2">Mã dự thi</th><th className="border border-slate-300 p-2">Lượt được nộp</th></tr></thead>
        <tbody>{result.data.filter((candidate) => !candidate.isRevoked).map((candidate, index) => <tr key={candidate.id}><td className="border border-slate-300 p-2">{index + 1}</td><td className="border border-slate-300 p-2">{candidate.name}</td><td className="border border-slate-300 p-2 font-mono font-bold tracking-wider">{candidate.code}</td><td className="border border-slate-300 p-2">{candidate.effectiveMaxSubmissions}</td></tr>)}</tbody>
      </table>
    </main>
  );
}
