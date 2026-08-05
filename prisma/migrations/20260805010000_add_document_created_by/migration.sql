-- Thêm createdById vào Document (ai tạo — TeacherProfile.id). Nullable, không phá data.
ALTER TABLE "Document" ADD COLUMN "createdById" TEXT;
ALTER TABLE "Document" ADD CONSTRAINT "Document_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "TeacherProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
