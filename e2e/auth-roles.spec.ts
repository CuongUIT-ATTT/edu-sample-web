import { test, expect } from "./fixtures/auth";

test("teacher dashboard shows class stats widget", async ({ teacherPage }) => {
  await teacherPage.goto("/teacher");
  await expect(teacherPage.locator("h4:has-text('Thống kê Học viên Giỏi')")).toBeVisible();
  await expect(teacherPage.locator("h4:has-text('Cảnh báo Học lực Yếu')")).toBeVisible();
});

test("parent dashboard shows child countdown", async ({ parentPage }) => {
  await parentPage.goto("/parent");
  await expect(parentPage.locator("h4:has-text('Kỳ thi Tốt nghiệp THPT 2027')")).toBeVisible();
  await expect(parentPage.locator("div:has-text('Danh hiệu của con:')").last()).toBeVisible();
});
