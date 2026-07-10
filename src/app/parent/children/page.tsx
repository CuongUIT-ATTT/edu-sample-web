import React from "react";
import { Users, GraduationCap, Calendar, Mail, Phone, Book } from "lucide-react";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";


export default async function ParentChildrenPage() {
  const session = await getSession();

  let childInfo: {
    name: string;
    email: string;
    className: string;
    formTeacherName: string;
    formTeacherPhone: string;
    subjects: { name: string; code: string }[];
  } | null = null;

  try {
    if (session) {
      const parentProfile = await db.parentProfile.findUnique({
        where: { userId: session.userId },
        include: {
          students: {
            include: {
              user: true,
              class: {
                include: {
                  formTeacher: {
                    include: { user: true },
                  },
                },
              },
            },
          },
        },
      });

      const child = parentProfile?.students[0];
      if (child) {
        // Fetch child subjects
        const schedules = await db.schedule.findMany({
          where: { classId: child.classId || "" },
          include: { subject: true },
        });

        // Unique subjects
        const subjectMap = new Map<string, { name: string; code: string }>();
        schedules.forEach((s) => {
          subjectMap.set(s.subject.id, { name: s.subject.name, code: s.subject.code });
        });

        childInfo = {
          name: child.user.name,
          email: child.user.email,
          className: child.class?.name || "ChÆ°a phÃ¢n lá»›p",
          formTeacherName: child.class?.formTeacher?.user.name || "ChÆ°a phÃ¢n cÃ´ng",
          formTeacherPhone: "0912 345 678", // Mock phone for UI completeness
          subjects: Array.from(subjectMap.values()),
        };
      }
    }
  } catch (error) {
    console.error("Error fetching child info:", error);
  }

  return (
    <div className="flex flex-col gap-8 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="font-tagline text-2xl font-semibold text-ink">Há»“ sÆ¡ há»c táº­p cá»§a con</h1>
        <p className="font-caption text-ink-muted-80 mt-1">ThÃ´ng tin chi tiáº¿t lá»›p há»c vÃ  giÃ¡o viÃªn chá»§ nhiá»‡m</p>
      </div>

      {!childInfo ? (
        <div className="bg-canvas border border-hairline rounded-lg p-16 text-center shadow-sm">
          <GraduationCap className="h-12 w-12 text-ink-muted-48 mx-auto mb-4" />
          <p className="font-body text-ink-muted-80">ChÆ°a liÃªn káº¿t há»“ sÆ¡ há»c sinh.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Student Info Card */}
          <div className="bg-canvas border border-hairline rounded-lg p-6 shadow-sm flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xl font-bold">
                {childInfo.name.charAt(0)}
              </div>
              <div>
                <h2 className="font-body-strong text-lg text-ink">{childInfo.name}</h2>
                <p className="text-xs font-caption text-purple-600 font-semibold">{childInfo.className}</p>
              </div>
            </div>

            <div className="border-t border-divider-soft pt-4 flex flex-col gap-3">
              <div className="flex items-center gap-3 text-sm text-ink-muted-80 font-caption">
                <Mail className="h-4 w-4 text-ink-muted-48" />
                <span>{childInfo.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-ink-muted-80 font-caption">
                <GraduationCap className="h-4 w-4 text-ink-muted-48" />
                <span>TrÆ°á»ng THPT EduWeb</span>
              </div>
            </div>
          </div>

          {/* Form Teacher Card */}
          <div className="bg-canvas border border-hairline rounded-lg p-6 shadow-sm flex flex-col gap-6">
            <div>
              <h3 className="text-xs font-caption-strong text-ink-muted-48 uppercase tracking-wider">GiÃ¡o viÃªn chá»§ nhiá»‡m</h3>
              <p className="font-body-strong text-base text-ink mt-2">{childInfo.formTeacherName}</p>
            </div>

            <div className="border-t border-divider-soft pt-4 flex flex-col gap-3">
              <div className="flex items-center gap-3 text-sm text-ink-muted-80 font-caption">
                <Phone className="h-4 w-4 text-ink-muted-48" />
                <span>{childInfo.formTeacherPhone}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-ink-muted-80 font-caption">
                <Calendar className="h-4 w-4 text-ink-muted-48" />
                <span>Giá» tiáº¿p phá»¥ huynh: Thá»© SÃ¡u (15:00 - 17:00)</span>
              </div>
            </div>
          </div>

          {/* Subject List Card */}
          <div className="bg-canvas border border-hairline rounded-lg p-6 shadow-sm col-span-1 md:col-span-2">
            <h3 className="text-xs font-caption-strong text-ink-muted-48 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Book className="h-4 w-4 text-purple-600" />
              CÃ¡c mÃ´n há»c ká»³ nÃ y ({childInfo.subjects.length} mÃ´n)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {childInfo.subjects.map((sub) => (
                <div key={sub.code} className="flex items-center gap-3 bg-surface-pearl border border-divider-soft p-3 rounded-lg">
                  <span className="text-[10px] font-bold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full uppercase">
                    {sub.code}
                  </span>
                  <span className="text-sm font-body-strong text-ink">{sub.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
