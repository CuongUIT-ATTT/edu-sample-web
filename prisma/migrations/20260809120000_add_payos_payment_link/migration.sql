-- PayOS / Thanh toán tự động (VietQR)
-- 1. Enum PaymentLinkStatus
CREATE TYPE "PaymentLinkStatus" AS ENUM ('PENDING', 'PAID', 'CANCELLED');

-- 2. Bảng PaymentLink
CREATE TABLE "PaymentLink" (
  "id" TEXT NOT NULL,
  "orderCode" INTEGER NOT NULL,
  "amount" INTEGER NOT NULL,
  "description" TEXT NOT NULL,
  "status" "PaymentLinkStatus" NOT NULL DEFAULT 'PENDING',
  "checkoutUrl" TEXT NOT NULL,
  "qrCode" TEXT,
  "studentId" TEXT NOT NULL,
  "classId" TEXT,
  "tuitionId" TEXT,
  "month" INTEGER NOT NULL,
  "year" INTEGER NOT NULL,
  "paidAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "PaymentLink_pkey" PRIMARY KEY ("id")
);

-- 3. Indexes
CREATE UNIQUE INDEX "PaymentLink_orderCode_key" ON "PaymentLink"("orderCode");
CREATE INDEX "PaymentLink_studentId_idx" ON "PaymentLink"("studentId");

-- 4. FK cho PaymentLink
ALTER TABLE "PaymentLink" ADD CONSTRAINT "PaymentLink_studentId_fkey"
  FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PaymentLink" ADD CONSTRAINT "PaymentLink_classId_fkey"
  FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PaymentLink" ADD CONSTRAINT "PaymentLink_tuitionId_fkey"
  FOREIGN KEY ("tuitionId") REFERENCES "Tuition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 5. TuitionPayment: cột payosReference (chống webhook trùng lặp)
ALTER TABLE "TuitionPayment" ADD COLUMN "payosReference" TEXT;
CREATE UNIQUE INDEX "TuitionPayment_payosReference_key" ON "TuitionPayment"("payosReference");
