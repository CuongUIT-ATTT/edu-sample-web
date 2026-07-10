import { describe, it, expect } from "vitest";

interface AdmissionData {
  name: string;
  dob: string;
  grade: string;
  parentName: string;
  phone: string;
  email: string;
  targetScore?: string;
  targetSubject?: string;
  currentLevel?: string;
}

function validateAdmissionForm(data: AdmissionData) {
  const errors: string[] = [];
  if (!data.name || data.name.trim() === "") errors.push("Họ tên học viên là bắt buộc");
  if (!data.grade || !["10", "11", "12"].includes(data.grade)) errors.push("Khối lớp không hợp lệ");
  if (!data.phone || !/^\d{9,11}$/.test(data.phone)) errors.push("Số điện thoại không hợp lệ");
  
  return {
    valid: errors.length === 0,
    errors
  };
}

describe("Admission Form Validation rules", () => {
  it("should pass validation when all fields are correct, including target score & level", () => {
    const data: AdmissionData = {
      name: "Nguyễn Văn Đăng Ký",
      dob: "2010-05-15",
      grade: "10",
      parentName: "Nguyễn Văn Phụ Huynh",
      phone: "0987654321",
      email: "phuhuynh@eduweb.vn",
      targetScore: "9+",
      targetSubject: "Toán học",
      currentLevel: "Khá"
    };

    const res = validateAdmissionForm(data);
    expect(res.valid).toBe(true);
    expect(res.errors.length).toBe(0);
  });

  it("should fail validation when phone number or grade is invalid", () => {
    const data: AdmissionData = {
      name: "Nguyễn Văn Đăng Ký",
      dob: "2010-05-15",
      grade: "9", // invalid grade (only 10, 11, 12 allowed)
      parentName: "Nguyễn Văn Phụ Huynh",
      phone: "abcd", // invalid phone
      email: "phuhuynh@eduweb.vn"
    };

    const res = validateAdmissionForm(data);
    expect(res.valid).toBe(false);
    expect(res.errors).toContain("Khối lớp không hợp lệ");
    expect(res.errors).toContain("Số điện thoại không hợp lệ");
  });
});
