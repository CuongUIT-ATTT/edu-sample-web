-- Tài khoản root bất khả xâm phạm: cờ isRoot trên User.
-- Chặn tự xoá và chặn admin thường xoá root / xoá lẫn nhau.
ALTER TABLE "User" ADD COLUMN "isRoot" BOOLEAN NOT NULL DEFAULT false;
