import { describe, expect, it } from "vitest";

import { GET } from "@/app/api/quizzes/[id]/results/export/route";

const params = Promise.resolve({ id: "quiz-1" });

describe("quiz results export route validation", () => {
  it("rejects a request without classId before loading data", async () => {
    const response = await GET(new Request("http://localhost/api/quizzes/quiz-1/results/export?format=csv"), { params });

    expect(response.status).toBe(400);
    await expect(response.text()).resolves.toBe("Thiếu lớp cần xuất kết quả.");
  });

  it("rejects unsupported formats before loading data", async () => {
    const response = await GET(new Request("http://localhost/api/quizzes/quiz-1/results/export?classId=class-1&format=pdf"), { params });

    expect(response.status).toBe(400);
    await expect(response.text()).resolves.toBe("Định dạng xuất không hợp lệ.");
  });
});
