# Tpye check
F:\CODE\DevOps\edu-web>npm run test:lint



> edu-web@0.1.0 test:lint

> eslint src --max-warnings 0





F:\CODE\DevOps\edu-web>npm run test:types



> edu-web@0.1.0 test:types

> tsc --noEmit



tests/tuition.test.ts:32:86 - error TS2322: Type 'string | undefined' is not assignable to type 'string'.

  Type 'undefined' is not assignable to type 'string'.



32     const credit = await db.studentCredit.findUnique({ where: { studentId_classId: { studentId, classId: cls.id } } });






Found 1 error in tests/tuition.test.ts:32

# Unit Test


F:\CODE\DevOps\edu-web>npm run test:unit 



> edu-web@0.1.0 test:unit

> vitest run





 RUN  v4.1.10 F:/CODE/DevOps/edu-web



 ✓ tests/unit/payos-utils.test.ts (8 tests) 11ms

 ✓ src/lib/openrouter.test.ts (10 tests) 1029ms

     ✓ 400 → jump to next model without exhausting all keys  812ms

 ✓ tests/unit/tuition-credit.test.ts (12 tests) 5ms

stderr | tests/unit/payos-webhook-route.test.ts > PayOS webhook route > reconcile lỗi (DB lỗi) → 500 để PayOS retry

PayOS webhook reconcile error: Error: db down

    at F:/CODE/DevOps/edu-web/tests/unit/payos-webhook-route.test.ts:89:33

    at file:///F:/CODE/DevOps/edu-web/node_modules/@vitest/runner/dist/chunk-artifact.js:302:11

    at file:///F:/CODE/DevOps/edu-web/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:26

    at file:///F:/CODE/DevOps/edu-web/node_modules/@vitest/runner/dist/chunk-artifact.js:2326:20

    at new Promise (<anonymous>)

    at runWithCancel (file:///F:/CODE/DevOps/edu-web/node_modules/@vitest/runner/dist/chunk-artifact.js:2323:10)

    at file:///F:/CODE/DevOps/edu-web/node_modules/@vitest/runner/dist/chunk-artifact.js:2305:20

    at new Promise (<anonymous>)

    at runWithTimeout (file:///F:/CODE/DevOps/edu-web/node_modules/@vitest/runner/dist/chunk-artifact.js:2272:10)

    at file:///F:/CODE/DevOps/edu-web/node_modules/@vitest/runner/dist/chunk-artifact.js:2955:64



 ✓ tests/unit/payos-webhook-route.test.ts (5 tests) 21ms

stdout | tests/calendar.test.ts

◇ injected env (10) from .env.test // tip: ⌘ multiple files { path: ['.env.local', '.env'] }

◇ injected env (19) from .env // tip: ⌘ enable debugging { debug: true }



stdout | tests/quiz.test.ts

◇ injected env (10) from .env.test // tip: ⌘ suppress logs { quiet: true }

◇ injected env (19) from .env // tip: ⌘ multiple files { path: ['.env.local', '.env'] }



stdout | tests/tuition-credit.integration.test.ts

◇ injected env (10) from .env.test // tip: ◈ secrets for agents [www.dotenvx.com]

◇ injected env (19) from .env // tip: ◈ encrypted .env [www.dotenvx.com]



stdout | tests/course.test.ts

◇ injected env (10) from .env.test // tip: ⌘ override existing { override: true }

◇ injected env (19) from .env // tip: ⌘ multiple files { path: ['.env.local', '.env'] }



stdout | tests/payos-webhook.integration.test.ts

◇ injected env (10) from .env.test // tip: ⌘ suppress logs { quiet: true }

◇ injected env (19) from .env // tip: ⌘ override existing { override: true }



stdout | tests/attendance.test.ts

◇ injected env (10) from .env.test // tip: ⌘ multiple files { path: ['.env.local', '.env'] }

◇ injected env (19) from .env // tip: ◈ encrypted .env [www.dotenvx.com]



stdout | tests/grade-homework.test.ts

◇ injected env (10) from .env.test // tip: ⌘ suppress logs { quiet: true }

◇ injected env (19) from .env // tip: ⌘ override existing { override: true }



stdout | tests/schedule-series.integration.test.ts

◇ injected env (10) from .env.test // tip: ◈ encrypted .env [www.dotenvx.com]

◇ injected env (19) from .env // tip: ⌁ auth for agents [www.vestauth.com]



stdout | tests/tuition-refactor.integration.test.ts

◇ injected env (10) from .env.test // tip: ◈ secrets for agents [www.dotenvx.com]

◇ injected env (19) from .env // tip: ⌁ auth for agents [www.vestauth.com]



stdout | tests/schedule.test.ts

◇ injected env (10) from .env.test // tip: ⌘ override existing { override: true }

◇ injected env (19) from .env // tip: ⌁ auth for agents [www.vestauth.com]



stdout | tests/document.test.ts

◇ injected env (10) from .env.test // tip: ⌘ suppress logs { quiet: true }

◇ injected env (19) from .env // tip: ⌘ enable debugging { debug: true }



stdout | tests/tuition.test.ts

◇ injected env (10) from .env.test // tip: ⌘ suppress logs { quiet: true }

◇ injected env (19) from .env // tip: ◈ secrets for agents [www.dotenvx.com]



 ✓ tests/unit/countdown.test.ts (2 tests) 6ms

(node:14588) Warning: SECURITY WARNING: The SSL modes 'prefer', 'require', and 'verify-ca' are treated as aliases for 'verify-full'.

In the next major version (pg-connection-string v3.0.0 and pg v9.0.0), these modes will adopt standard libpq semantics, which have weaker security guarantees.



To prepare for this change:

- If you want the current behavior, explicitly use 'sslmode=verify-full'

- If you want libpq compatibility now, use 'uselibpqcompat=true&sslmode=require'



See https://www.postgresql.org/docs/current/libpq-ssl.html for libpq SSL mode definitions.

(Use `node --trace-warnings ...` to show where the warning was created)

 ✓ tests/quiz-submit.test.ts (15 tests) 21ms

(node:27684) Warning: SECURITY WARNING: The SSL modes 'prefer', 'require', and 'verify-ca' are treated as aliases for 'verify-full'.

In the next major version (pg-connection-string v3.0.0 and pg v9.0.0), these modes will adopt standard libpq semantics, which have weaker security guarantees.



To prepare for this change:

- If you want the current behavior, explicitly use 'sslmode=verify-full'

- If you want libpq compatibility now, use 'uselibpqcompat=true&sslmode=require'



See https://www.postgresql.org/docs/current/libpq-ssl.html for libpq SSL mode definitions.

(Use `node --trace-warnings ...` to show where the warning was created)

(node:12080) Warning: SECURITY WARNING: The SSL modes 'prefer', 'require', and 'verify-ca' are treated as aliases for 'verify-full'.

In the next major version (pg-connection-string v3.0.0 and pg v9.0.0), these modes will adopt standard libpq semantics, which have weaker security guarantees.



To prepare for this change:

- If you want the current behavior, explicitly use 'sslmode=verify-full'

- If you want libpq compatibility now, use 'uselibpqcompat=true&sslmode=require'



See https://www.postgresql.org/docs/current/libpq-ssl.html for libpq SSL mode definitions.

(Use `node --trace-warnings ...` to show where the warning was created)

(node:13516) Warning: SECURITY WARNING: The SSL modes 'prefer', 'require', and 'verify-ca' are treated as aliases for 'verify-full'.

In the next major version (pg-connection-string v3.0.0 and pg v9.0.0), these modes will adopt standard libpq semantics, which have weaker security guarantees.



To prepare for this change:

- If you want the current behavior, explicitly use 'sslmode=verify-full'

- If you want libpq compatibility now, use 'uselibpqcompat=true&sslmode=require'



See https://www.postgresql.org/docs/current/libpq-ssl.html for libpq SSL mode definitions.

(Use `node --trace-warnings ...` to show where the warning was created)

(node:9532) Warning: SECURITY WARNING: The SSL modes 'prefer', 'require', and 'verify-ca' are treated as aliases for 'verify-full'.

In the next major version (pg-connection-string v3.0.0 and pg v9.0.0), these modes will adopt standard libpq semantics, which have weaker security guarantees.



To prepare for this change:

- If you want the current behavior, explicitly use 'sslmode=verify-full'

- If you want libpq compatibility now, use 'uselibpqcompat=true&sslmode=require'



See https://www.postgresql.org/docs/current/libpq-ssl.html for libpq SSL mode definitions.

(Use `node --trace-warnings ...` to show where the warning was created)

(node:3728) Warning: SECURITY WARNING: The SSL modes 'prefer', 'require', and 'verify-ca' are treated as aliases for 'verify-full'.

In the next major version (pg-connection-string v3.0.0 and pg v9.0.0), these modes will adopt standard libpq semantics, which have weaker security guarantees.



To prepare for this change:

- If you want the current behavior, explicitly use 'sslmode=verify-full'

- If you want libpq compatibility now, use 'uselibpqcompat=true&sslmode=require'



See https://www.postgresql.org/docs/current/libpq-ssl.html for libpq SSL mode definitions.

(Use `node --trace-warnings ...` to show where the warning was created)

(node:27520) Warning: SECURITY WARNING: The SSL modes 'prefer', 'require', and 'verify-ca' are treated as aliases for 'verify-full'.

In the next major version (pg-connection-string v3.0.0 and pg v9.0.0), these modes will adopt standard libpq semantics, which have weaker security guarantees.



To prepare for this change:

- If you want the current behavior, explicitly use 'sslmode=verify-full'

- If you want libpq compatibility now, use 'uselibpqcompat=true&sslmode=require'



See https://www.postgresql.org/docs/current/libpq-ssl.html for libpq SSL mode definitions.

(Use `node --trace-warnings ...` to show where the warning was created)

(node:8864) Warning: SECURITY WARNING: The SSL modes 'prefer', 'require', and 'verify-ca' are treated as aliases for 'verify-full'.

In the next major version (pg-connection-string v3.0.0 and pg v9.0.0), these modes will adopt standard libpq semantics, which have weaker security guarantees.



To prepare for this change:

- If you want the current behavior, explicitly use 'sslmode=verify-full'

- If you want libpq compatibility now, use 'uselibpqcompat=true&sslmode=require'



See https://www.postgresql.org/docs/current/libpq-ssl.html for libpq SSL mode definitions.

(Use `node --trace-warnings ...` to show where the warning was created)

 ✓ tests/unit/leaderboard.query.test.ts (1 test) 6ms

 ✓ tests/unit/redirect.test.ts (1 test) 6ms

 ✓ tests/unit/quiz-demo.test.ts (2 tests) 7ms

 ✓ src/lib/quiz-import.test.ts (9 tests) 8ms

 ✓ tests/unit/vip-doc.api.test.ts (3 tests) 4ms

 ✓ tests/schedule.test.ts (3 tests) 3427ms

     ✓ có 2 series trùng phòng Phòng 203 cùng giờ 08:00-10:30 khác lớp  3212ms

 ✓ tests/unit/admission-form.test.ts (2 tests) 3ms

 ✓ tests/attendance.test.ts (3 tests) 3849ms

     ✓ student1 (10A1) có 3 buổi ABSENT liên tiếp  3373ms

 ✓ tests/document.test.ts (3 tests) 3915ms

     ✓ doc 'Đề cương' published và giới hạn theo lớp (classVisibility)  3771ms

 ✓ tests/course.test.ts (2 tests) 3966ms

     ✓ course published có 2 modules, module 1 có 2 lessons đúng order  3334ms

     ✓ student1 và student2 đều có enrollment  629ms

 ✓ src/lib/__tests__/quiz-shuffle.test.ts (22 tests) 14ms

 ✓ tests/grade-homework.test.ts (4 tests) 4062ms

     ✓ student2 có QUIZ và HOMEWORK cho Toán (MATH101)  3412ms

 ✓ tests/calendar.test.ts (1 test) 4508ms

     ✓ event 'Họp giao ban' có RRULE + CANCELLED exception + participants + reminders  4505ms

 ❯ tests/quiz.test.ts (6 tests | 2 failed) 4708ms

     ✓ quiz 'Trắc nghiệm thử sức - Tiếng Anh cơ bản' là public, có question  3835ms

     × có submission từ guest (studentId=null, guestName có giá trị) 90ms

     × quiz 'Kiểm tra 15 phút - Chương 1 Vật Lý' có deadline ở quá khứ 81ms

     ✓ QuizSubmission có field isLate  403ms

     ✓ tạo submission mới với isLate=true — điểm vẫn tính bình thường 154ms

     ✓ tạo submission isLate=false (đúng giờ) 142ms

 ✓ src/lib/__tests__/recurrence.test.ts (14 tests) 43ms

 ✓ tests/schedules.test.ts (8 tests) 35ms

 ✓ tests/schedule-expand.test.ts (24 tests) 39ms

(node:5220) Warning: SECURITY WARNING: The SSL modes 'prefer', 'require', and 'verify-ca' are treated as aliases for 'verify-full'.

In the next major version (pg-connection-string v3.0.0 and pg v9.0.0), these modes will adopt standard libpq semantics, which have weaker security guarantees.



To prepare for this change:

- If you want the current behavior, explicitly use 'sslmode=verify-full'

- If you want libpq compatibility now, use 'uselibpqcompat=true&sslmode=require'



See https://www.postgresql.org/docs/current/libpq-ssl.html for libpq SSL mode definitions.

(Use `node --trace-warnings ...` to show where the warning was created)

(node:19156) Warning: SECURITY WARNING: The SSL modes 'prefer', 'require', and 'verify-ca' are treated as aliases for 'verify-full'.

In the next major version (pg-connection-string v3.0.0 and pg v9.0.0), these modes will adopt standard libpq semantics, which have weaker security guarantees.



To prepare for this change:

- If you want the current behavior, explicitly use 'sslmode=verify-full'

- If you want libpq compatibility now, use 'uselibpqcompat=true&sslmode=require'



See https://www.postgresql.org/docs/current/libpq-ssl.html for libpq SSL mode definitions.

(Use `node --trace-warnings ...` to show where the warning was created)

(node:27696) Warning: SECURITY WARNING: The SSL modes 'prefer', 'require', and 'verify-ca' are treated as aliases for 'verify-full'.

In the next major version (pg-connection-string v3.0.0 and pg v9.0.0), these modes will adopt standard libpq semantics, which have weaker security guarantees.



To prepare for this change:

- If you want the current behavior, explicitly use 'sslmode=verify-full'

- If you want libpq compatibility now, use 'uselibpqcompat=true&sslmode=require'



See https://www.postgresql.org/docs/current/libpq-ssl.html for libpq SSL mode definitions.

(Use `node --trace-warnings ...` to show where the warning was created)

(node:29616) Warning: SECURITY WARNING: The SSL modes 'prefer', 'require', and 'verify-ca' are treated as aliases for 'verify-full'.

In the next major version (pg-connection-string v3.0.0 and pg v9.0.0), these modes will adopt standard libpq semantics, which have weaker security guarantees.



To prepare for this change:

- If you want the current behavior, explicitly use 'sslmode=verify-full'

- If you want libpq compatibility now, use 'uselibpqcompat=true&sslmode=require'



See https://www.postgresql.org/docs/current/libpq-ssl.html for libpq SSL mode definitions.

(Use `node --trace-warnings ...` to show where the warning was created)

(node:5220) DeprecationWarning: Calling client.query() when the client is already executing a query is deprecated and will be removed in pg@9.0. Use async/await or an external async flow control mechanism instead.

 ✓ tests/payos-webhook.integration.test.ts (5 tests) 9529ms

     ✓ orderCode không tồn tại → not_found (no-op)  559ms

     ✓ giao dịch thành công → link PAID + 1 TuitionPayment + tuition.paid/status + connect class  1605ms

     ✓ webhook trùng lặp → noop, không thêm payment lần 2  416ms

     ✓ nộp dư (amount > tuition.amount) → surplus vào studentCredit, paid chặn tại amount  1249ms

     ✓ tuition bị xóa trước webhook → fallback tạo Tuition mới (paid = amount) + connect class  1625ms

 ✓ tests/tuition.test.ts (5 tests) 4516ms

     ✓ student2: Tuition tháng 1 đóng THIẾU (paid=60000 < amount=120000, PARTIAL)  962ms

     ✓ giá mỗi tiết = 15k (tuition tháng 2 của student4: 8 tiết → 120000)  496ms

     ✓ tui-004: PRESENT/ABSENT/LATE tính tiền; EXCUSED + chưa điểm danh không tính  2604ms

 ✓ tests/tuition-credit.integration.test.ts (3 tests) 7923ms

     ✓ nộp dư → paid chặn tại amount, phần dư thành studentCredit theo cặp (student, class)  2450ms

     ✓ tính học phí tháng sau → credit tự trừ, paid không reset, lịch sử payment giữ nguyên  1986ms

     ✓ TEACHER không phụ trách lớp → recordPayment bị từ chối  898ms

stdout | tests/tuition-refactor.integration.test.ts > Query count — 30 HS × 12 tháng phải giảm mạnh (dưới ~10 query)

[seed] connected students = 30



stdout | tests/tuition-refactor.integration.test.ts > Query count — 30 HS × 12 tháng phải giảm mạnh (dưới ~10 query) > tính 12 tháng × 30 HS chỉ tốn < 12 query (trước đây ~775)

[query-count] 30 HS × 12 tháng → 5 query



 ✓ tests/tuition-refactor.integration.test.ts (6 tests) 23972ms

     ✓ tính 2 tháng 6-7: amount khớp công thức (2 tiết/buổi), mọi buổi đều tính  1697ms

     ✓ tính lại lần 2: không đổi paid/status, không tạo row thừa (update có chọn lọc)  859ms

     ✓ tổng tiết = 2 + 3 = 5 (trước đây sẽ là 2×2=4 — sai khi buổi dài ngắn khác nhau)  925ms

     ✓ nộp dư ở tháng 6 → surplus thành credit; tháng 7 credit tự trừ  3143ms

     ✓ recalc giảm amount dưới paid → trả surplus về credit (nhánh update-so-sánh)  1256ms

     ✓ tính 12 tháng × 30 HS chỉ tốn < 12 query (trước đây ~775)  1326ms

 ❯ tests/schedule-series.integration.test.ts (12 tests | 2 failed) 33877ms

     ✓ 1. createSchedule tạo 1 ScheduleSeries + expand ra đúng số buổi  2516ms

     ✓ 2. trùng phòng → block (không tạo)  2517ms

     ✓ 3. trùng học sinh → warning (không block) khi 2 lớp cùng giờ, học sinh chung  3494ms

     ✓ 4. updateSchedule ONLY_THIS tạo exception MODIFIED, các buổi khác giữ nguyên  2953ms

     ✓ 5. updateSchedule ALL_FUTURE cắt series + tạo series mới + di dời + guard bài nộp  3742ms

     ✓ 6. deleteSchedule ONLY_THIS tạo exception CANCELLED  2169ms

     ✓ 7. deleteSchedule ALL_FUTURE cắt endDate  1859ms

     ✓ 8. guard: deleteSchedule ONLY_THIS bị chặn khi có bài nộp cho buổi đó  1690ms

     ✓ 9. updateSchedule ALL đổi endDate rút ngắn có bài nộp → bị chặn  4562ms

     × 10. updateSchedule ONLY_THIS dời ngày → buổi cũ biến mất, buổi mới ở ngày dời 1718ms

     × 11. updateSchedule ONLY_THIS dời tới ngày đã có buổi trong chuỗi → bị chặn 1726ms

     ✓ 12. updateSchedule ONLY_THIS dời tới ngày QUÁ KHỨ → bị chặn (tránh buổi mất khỏi agenda)  1953ms



⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ Failed Tests 4 ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯



 FAIL  tests/quiz.test.ts > Quiz - Public & Guest > có submission từ guest (studentId=null, guestName có giá trị)

AssertionError: expected 'Nguyen Van Test' to contain 'Khách'



Expected: "Khách"

Received: "Nguyen Van Test"



 ❯ tests/quiz.test.ts:17:28

     15|     const sub = await db.quizSubmission.findFirst({ where: { studentId: null } });

     16|     expect(sub).not.toBeNull();

     17|     expect(sub!.guestName).toContain("Khách");

       |                            ^

     18|   });

     19| });



⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/4]⎯



 FAIL  tests/quiz.test.ts > Quiz - Deadline & isLate > quiz 'Kiểm tra 15 phút - Chương 1 Vật Lý' có deadline ở quá khứ

AssertionError: expected null not to be null

 ❯ tests/quiz.test.ts:24:19

     22|   it("quiz 'Kiểm tra 15 phút - Chương 1 Vật Lý' có deadline ở quá khứ", async () => {

     23|     const q = await db.quiz.findFirst({ where: { title: { contains: "Kiểm tra 15 phút" } } });

     24|     expect(q).not.toBeNull();

       |                   ^

     25|     expect(q!.deadline).not.toBeNull();

     26|     expect(q!.deadline!.getTime()).toBeLessThan(Date.now());



⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[2/4]⎯



 FAIL  tests/schedule-series.integration.test.ts > ScheduleSeries CRUD integration > 10. updateSchedule ONLY_THIS dời ngày → buổi cũ biến mất, buổi mới ở ngày dời

AssertionError: expected false to be true // Object.is equality



- Expected

+ Received



- true

+ false



 ❯ tests/schedule-series.integration.test.ts:382:25

    380|       updateMode: "ONLY_THIS",

    381|     });

    382|     expect(upd.success).toBe(true);

       |                         ^

    383|

    384|     const full = await db.scheduleSeries.findUnique({ where: { id: seriesId }, include: { exc…



⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[3/4]⎯



 FAIL  tests/schedule-series.integration.test.ts > ScheduleSeries CRUD integration > 11. updateSchedule ONLY_THIS dời tới ngày đã có buổi trong chuỗi → bị chặn

AssertionError: expected 'Không thể dời buổi học tới ngày trong…' to contain 'đã có buổi học trong chuỗi'



Expected: "đã có buổi học trong chuỗi"

Received: "Không thể dời buổi học tới ngày trong quá khứ. Chỉ dời tới hôm nay hoặc ngày tương lai."



 ❯ tests/schedule-series.integration.test.ts:413:23

    411|     });

    412|     expect(upd.success).toBe(false);

    413|     expect(upd.error).toContain("đã có buổi học trong chuỗi");

       |                       ^

    414|   });

    415|



⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[4/4]⎯





 Test Files  2 failed | 26 passed (28)

      Tests  4 failed | 187 passed (191)

   Start at  14:29:01

   Duration  42.97s (transform 4.28s, setup 1.90s, import 65.61s, tests 109.51s, environment 4ms)





F:\CODE\DevOps\edu-web>npm run test:unit:watch



> edu-web@0.1.0 test:unit:watch

> vitest





 DEV  v4.1.10 F:/CODE/DevOps/edu-web



stdout | tests/tuition-refactor.integration.test.ts

◇ injected env (10) from .env.test // tip: ⌘ override existing { override: true }

◇ injected env (19) from .env // tip: ⌘ custom filepath { path: '/custom/path/.env' }



stdout | tests/calendar.test.ts

◇ injected env (10) from .env.test // tip: ⌘ custom filepath { path: '/custom/path/.env' }

◇ injected env (19) from .env // tip: ⌘ suppress logs { quiet: true }



stdout | tests/quiz.test.ts

◇ injected env (10) from .env.test // tip: ⌘ multiple files { path: ['.env.local', '.env'] }

◇ injected env (19) from .env // tip: ◈ encrypted .env [www.dotenvx.com]



stdout | tests/grade-homework.test.ts

◇ injected env (10) from .env.test // tip: ⌘ override existing { override: true }

◇ injected env (19) from .env // tip: ⌘ suppress logs { quiet: true }



stdout | tests/payos-webhook.integration.test.ts

◇ injected env (10) from .env.test // tip: ⌘ override existing { override: true }

◇ injected env (19) from .env // tip: ⌁ auth for agents [www.vestauth.com]



stdout | tests/tuition-credit.integration.test.ts

◇ injected env (10) from .env.test // tip: ⌘ override existing { override: true }

◇ injected env (19) from .env // tip: ⌘ override existing { override: true }



stdout | tests/schedule-series.integration.test.ts

◇ injected env (10) from .env.test // tip: ◈ secrets for agents [www.dotenvx.com]

◇ injected env (19) from .env // tip: ⌘ multiple files { path: ['.env.local', '.env'] }



stdout | tests/tuition.test.ts

◇ injected env (10) from .env.test // tip: ⌘ enable debugging { debug: true }

◇ injected env (19) from .env // tip: ⌘ override existing { override: true }



(node:8200) Warning: SECURITY WARNING: The SSL modes 'prefer', 'require', and 'verify-ca' are treated as aliases for 'verify-full'.

In the next major version (pg-connection-string v3.0.0 and pg v9.0.0), these modes will adopt standard libpq semantics, which have weaker security guarantees.



To prepare for this change:

- If you want the current behavior, explicitly use 'sslmode=verify-full'

- If you want libpq compatibility now, use 'uselibpqcompat=true&sslmode=require'



See https://www.postgresql.org/docs/current/libpq-ssl.html for libpq SSL mode definitions.

(Use `node --trace-warnings ...` to show where the warning was created)

(node:13080) Warning: SECURITY WARNING: The SSL modes 'prefer', 'require', and 'verify-ca' are treated as aliases for 'verify-full'.

In the next major version (pg-connection-string v3.0.0 and pg v9.0.0), these modes will adopt standard libpq semantics, which have weaker security guarantees.



To prepare for this change:

- If you want the current behavior, explicitly use 'sslmode=verify-full'

- If you want libpq compatibility now, use 'uselibpqcompat=true&sslmode=require'



See https://www.postgresql.org/docs/current/libpq-ssl.html for libpq SSL mode definitions.

(Use `node --trace-warnings ...` to show where the warning was created)

(node:13976) Warning: SECURITY WARNING: The SSL modes 'prefer', 'require', and 'verify-ca' are treated as aliases for 'verify-full'.

In the next major version (pg-connection-string v3.0.0 and pg v9.0.0), these modes will adopt standard libpq semantics, which have weaker security guarantees.



To prepare for this change:

- If you want the current behavior, explicitly use 'sslmode=verify-full'

- If you want libpq compatibility now, use 'uselibpqcompat=true&sslmode=require'



See https://www.postgresql.org/docs/current/libpq-ssl.html for libpq SSL mode definitions.

(Use `node --trace-warnings ...` to show where the warning was created)

(node:22180) Warning: SECURITY WARNING: The SSL modes 'prefer', 'require', and 'verify-ca' are treated as aliases for 'verify-full'.

In the next major version (pg-connection-string v3.0.0 and pg v9.0.0), these modes will adopt standard libpq semantics, which have weaker security guarantees.



To prepare for this change:

- If you want the current behavior, explicitly use 'sslmode=verify-full'

- If you want libpq compatibility now, use 'uselibpqcompat=true&sslmode=require'



See https://www.postgresql.org/docs/current/libpq-ssl.html for libpq SSL mode definitions.

(Use `node --trace-warnings ...` to show where the warning was created)

 ❯ tests/quiz.test.ts (6 tests | 2 failed) 1285ms

     ✓ quiz 'Trắc nghiệm thử sức - Tiếng Anh cơ bản' là public, có question  812ms

     × có submission từ guest (studentId=null, guestName có giá trị) 75ms

     × quiz 'Kiểm tra 15 phút - Chương 1 Vật Lý' có deadline ở quá khứ 71ms

     ✓ QuizSubmission có field isLate 63ms

     ✓ tạo submission mới với isLate=true — điểm vẫn tính bình thường 136ms

     ✓ tạo submission isLate=false (đúng giờ) 124ms

 ✓ tests/calendar.test.ts (1 test) 1288ms

     ✓ event 'Họp giao ban' có RRULE + CANCELLED exception + participants + reminders  1285ms

 ✓ tests/grade-homework.test.ts (4 tests) 1518ms

     ✓ student2 có QUIZ và HOMEWORK cho Toán (MATH101)  886ms

stdout | tests/course.test.ts

◇ injected env (10) from .env.test // tip: ◈ secrets for agents [www.dotenvx.com]

◇ injected env (19) from .env // tip: ⌁ auth for agents [www.vestauth.com]



stdout | tests/document.test.ts

◇ injected env (10) from .env.test // tip: ◈ encrypted .env [www.dotenvx.com]

◇ injected env (19) from .env // tip: ⌘ custom filepath { path: '/custom/path/.env' }



(node:8732) Warning: SECURITY WARNING: The SSL modes 'prefer', 'require', and 'verify-ca' are treated as aliases for 'verify-full'.

In the next major version (pg-connection-string v3.0.0 and pg v9.0.0), these modes will adopt standard libpq semantics, which have weaker security guarantees.



To prepare for this change:

- If you want the current behavior, explicitly use 'sslmode=verify-full'

- If you want libpq compatibility now, use 'uselibpqcompat=true&sslmode=require'



See https://www.postgresql.org/docs/current/libpq-ssl.html for libpq SSL mode definitions.

(Use `node --trace-warnings ...` to show where the warning was created)

(node:14128) Warning: SECURITY WARNING: The SSL modes 'prefer', 'require', and 'verify-ca' are treated as aliases for 'verify-full'.

In the next major version (pg-connection-string v3.0.0 and pg v9.0.0), these modes will adopt standard libpq semantics, which have weaker security guarantees.



To prepare for this change:

- If you want the current behavior, explicitly use 'sslmode=verify-full'

- If you want libpq compatibility now, use 'uselibpqcompat=true&sslmode=require'



See https://www.postgresql.org/docs/current/libpq-ssl.html for libpq SSL mode definitions.

(Use `node --trace-warnings ...` to show where the warning was created)

stdout | tests/attendance.test.ts

◇ injected env (10) from .env.test // tip: ⌘ override existing { override: true }

◇ injected env (19) from .env // tip: ◈ encrypted .env [www.dotenvx.com]



(node:1904) Warning: SECURITY WARNING: The SSL modes 'prefer', 'require', and 'verify-ca' are treated as aliases for 'verify-full'.

In the next major version (pg-connection-string v3.0.0 and pg v9.0.0), these modes will adopt standard libpq semantics, which have weaker security guarantees.



To prepare for this change:

- If you want the current behavior, explicitly use 'sslmode=verify-full'

- If you want libpq compatibility now, use 'uselibpqcompat=true&sslmode=require'



See https://www.postgresql.org/docs/current/libpq-ssl.html for libpq SSL mode definitions.

(Use `node --trace-warnings ...` to show where the warning was created)

(node:19340) Warning: SECURITY WARNING: The SSL modes 'prefer', 'require', and 'verify-ca' are treated as aliases for 'verify-full'.

In the next major version (pg-connection-string v3.0.0 and pg v9.0.0), these modes will adopt standard libpq semantics, which have weaker security guarantees.



To prepare for this change:

- If you want the current behavior, explicitly use 'sslmode=verify-full'

- If you want libpq compatibility now, use 'uselibpqcompat=true&sslmode=require'



See https://www.postgresql.org/docs/current/libpq-ssl.html for libpq SSL mode definitions.

(Use `node --trace-warnings ...` to show where the warning was created)

(node:27132) Warning: SECURITY WARNING: The SSL modes 'prefer', 'require', and 'verify-ca' are treated as aliases for 'verify-full'.

In the next major version (pg-connection-string v3.0.0 and pg v9.0.0), these modes will adopt standard libpq semantics, which have weaker security guarantees.



To prepare for this change:

- If you want the current behavior, explicitly use 'sslmode=verify-full'

- If you want libpq compatibility now, use 'uselibpqcompat=true&sslmode=require'



See https://www.postgresql.org/docs/current/libpq-ssl.html for libpq SSL mode definitions.

(Use `node --trace-warnings ...` to show where the warning was created)

(node:18936) Warning: SECURITY WARNING: The SSL modes 'prefer', 'require', and 'verify-ca' are treated as aliases for 'verify-full'.

In the next major version (pg-connection-string v3.0.0 and pg v9.0.0), these modes will adopt standard libpq semantics, which have weaker security guarantees.



To prepare for this change:

- If you want the current behavior, explicitly use 'sslmode=verify-full'

- If you want libpq compatibility now, use 'uselibpqcompat=true&sslmode=require'



See https://www.postgresql.org/docs/current/libpq-ssl.html for libpq SSL mode definitions.

(Use `node --trace-warnings ...` to show where the warning was created)

(node:9188) Warning: SECURITY WARNING: The SSL modes 'prefer', 'require', and 'verify-ca' are treated as aliases for 'verify-full'.

In the next major version (pg-connection-string v3.0.0 and pg v9.0.0), these modes will adopt standard libpq semantics, which have weaker security guarantees.



To prepare for this change:

- If you want the current behavior, explicitly use 'sslmode=verify-full'

- If you want libpq compatibility now, use 'uselibpqcompat=true&sslmode=require'



See https://www.postgresql.org/docs/current/libpq-ssl.html for libpq SSL mode definitions.

(Use `node --trace-warnings ...` to show where the warning was created)

 ✓ tests/document.test.ts (3 tests) 866ms

     ✓ doc 'Đề cương' published và giới hạn theo lớp (classVisibility)  736ms

stdout | tests/schedule.test.ts

◇ injected env (10) from .env.test // tip: ⌘ custom filepath { path: '/custom/path/.env' }

◇ injected env (19) from .env // tip: ⌘ suppress logs { quiet: true }



(node:22232) Warning: SECURITY WARNING: The SSL modes 'prefer', 'require', and 'verify-ca' are treated as aliases for 'verify-full'.

In the next major version (pg-connection-string v3.0.0 and pg v9.0.0), these modes will adopt standard libpq semantics, which have weaker security guarantees.



To prepare for this change:

- If you want the current behavior, explicitly use 'sslmode=verify-full'

- If you want libpq compatibility now, use 'uselibpqcompat=true&sslmode=require'



See https://www.postgresql.org/docs/current/libpq-ssl.html for libpq SSL mode definitions.

(Use `node --trace-warnings ...` to show where the warning was created)

 ✓ tests/attendance.test.ts (3 tests) 1206ms

     ✓ student1 (10A1) có 3 buổi ABSENT liên tiếp  827ms

 ✓ tests/course.test.ts (2 tests) 1466ms

     ✓ course published có 2 modules, module 1 có 2 lessons đúng order  827ms

     ✓ student1 và student2 đều có enrollment  637ms

 ✓ tests/schedule.test.ts (3 tests) 762ms

     ✓ có 2 series trùng phòng Phòng 203 cùng giờ 08:00-10:30 khác lớp  564ms

 ✓ src/lib/openrouter.test.ts (10 tests) 1043ms

     ✓ 400 → jump to next model without exhausting all keys  815ms

 ✓ src/lib/__tests__/recurrence.test.ts (14 tests) 14ms

(node:9188) DeprecationWarning: Calling client.query() when the client is already executing a query is deprecated and will be removed in pg@9.0. Use async/await or an external async flow control mechanism instead.

stderr | tests/unit/payos-webhook-route.test.ts > PayOS webhook route > reconcile lỗi (DB lỗi) → 500 để PayOS retry

PayOS webhook reconcile error: Error: db down

    at F:/CODE/DevOps/edu-web/tests/unit/payos-webhook-route.test.ts:89:33

    at file:///F:/CODE/DevOps/edu-web/node_modules/@vitest/runner/dist/chunk-artifact.js:302:11

    at file:///F:/CODE/DevOps/edu-web/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:26

    at file:///F:/CODE/DevOps/edu-web/node_modules/@vitest/runner/dist/chunk-artifact.js:2326:20

    at new Promise (<anonymous>)

    at runWithCancel (file:///F:/CODE/DevOps/edu-web/node_modules/@vitest/runner/dist/chunk-artifact.js:2323:10)

    at file:///F:/CODE/DevOps/edu-web/node_modules/@vitest/runner/dist/chunk-artifact.js:2305:20

    at new Promise (<anonymous>)

    at runWithTimeout (file:///F:/CODE/DevOps/edu-web/node_modules/@vitest/runner/dist/chunk-artifact.js:2272:10)

    at file:///F:/CODE/DevOps/edu-web/node_modules/@vitest/runner/dist/chunk-artifact.js:2955:64



 ✓ tests/unit/payos-webhook-route.test.ts (5 tests) 15ms

 ✓ tests/schedule-expand.test.ts (24 tests) 11ms

 ✓ tests/quiz-submit.test.ts (15 tests) 15ms

 ✓ src/lib/__tests__/quiz-shuffle.test.ts (22 tests) 8ms

 ✓ tests/unit/payos-utils.test.ts (8 tests) 7ms

 ✓ src/lib/quiz-import.test.ts (9 tests) 6ms

 ✓ tests/unit/quiz-demo.test.ts (2 tests) 3ms

 ✓ tests/tuition.test.ts (5 tests) 3436ms

     ✓ student2: Tuition tháng 1 đóng THIẾU (paid=60000 < amount=120000, PARTIAL)  908ms

     ✓ tui-004: PRESENT/ABSENT/LATE tính tiền; EXCUSED + chưa điểm danh không tính  1825ms

 ✓ tests/schedules.test.ts (8 tests) 23ms

 ✓ tests/unit/leaderboard.query.test.ts (1 test) 3ms

 ✓ tests/unit/countdown.test.ts (2 tests) 4ms

 ✓ tests/unit/redirect.test.ts (1 test) 2ms

 ✓ tests/unit/tuition-credit.test.ts (12 tests) 9ms

 ✓ tests/unit/vip-doc.api.test.ts (3 tests) 3ms

 ✓ tests/unit/admission-form.test.ts (2 tests) 3ms

 ✓ tests/payos-webhook.integration.test.ts (5 tests) 6037ms

     ✓ orderCode không tồn tại → not_found (no-op)  518ms

     ✓ giao dịch thành công → link PAID + 1 TuitionPayment + tuition.paid/status + connect class  1271ms

     ✓ webhook trùng lặp → noop, không thêm payment lần 2  415ms

     ✓ nộp dư (amount > tuition.amount) → surplus vào studentCredit, paid chặn tại amount  1263ms

     ✓ tuition bị xóa trước webhook → fallback tạo Tuition mới (paid = amount) + connect class  1100ms

 ✓ tests/tuition-credit.integration.test.ts (3 tests) 7020ms

     ✓ nộp dư → paid chặn tại amount, phần dư thành studentCredit theo cặp (student, class)  1933ms

     ✓ tính học phí tháng sau → credit tự trừ, paid không reset, lịch sử payment giữ nguyên  1951ms

     ✓ TEACHER không phụ trách lớp → recordPayment bị từ chối  869ms

stdout | tests/tuition-refactor.integration.test.ts > Query count — 30 HS × 12 tháng phải giảm mạnh (dưới ~10 query)

[seed] connected students = 30



stdout | tests/tuition-refactor.integration.test.ts > Query count — 30 HS × 12 tháng phải giảm mạnh (dưới ~10 query) > tính 12 tháng × 30 HS chỉ tốn < 12 query (trước đây ~775)

[query-count] 30 HS × 12 tháng → 5 query



 ✓ tests/tuition-refactor.integration.test.ts (6 tests) 23807ms

     ✓ tính 2 tháng 6-7: amount khớp công thức (2 tiết/buổi), mọi buổi đều tính  1439ms

     ✓ tính lại lần 2: không đổi paid/status, không tạo row thừa (update có chọn lọc)  921ms

     ✓ tổng tiết = 2 + 3 = 5 (trước đây sẽ là 2×2=4 — sai khi buổi dài ngắn khác nhau)  984ms

     ✓ nộp dư ở tháng 6 → surplus thành credit; tháng 7 credit tự trừ  3386ms

     ✓ recalc giảm amount dưới paid → trả surplus về credit (nhánh update-so-sánh)  1347ms

     ✓ tính 12 tháng × 30 HS chỉ tốn < 12 query (trước đây ~775)  1399ms

 ❯ tests/schedule-series.integration.test.ts (12 tests | 2 failed) 32309ms

     ✓ 1. createSchedule tạo 1 ScheduleSeries + expand ra đúng số buổi  1802ms

     ✓ 2. trùng phòng → block (không tạo)  2484ms

     ✓ 3. trùng học sinh → warning (không block) khi 2 lớp cùng giờ, học sinh chung  3649ms

     ✓ 4. updateSchedule ONLY_THIS tạo exception MODIFIED, các buổi khác giữ nguyên  2974ms

     ✓ 5. updateSchedule ALL_FUTURE cắt series + tạo series mới + di dời + guard bài nộp  3618ms

     ✓ 6. deleteSchedule ONLY_THIS tạo exception CANCELLED  1953ms

     ✓ 7. deleteSchedule ALL_FUTURE cắt endDate  1840ms

     ✓ 8. guard: deleteSchedule ONLY_THIS bị chặn khi có bài nộp cho buổi đó  1648ms

     ✓ 9. updateSchedule ALL đổi endDate rút ngắn có bài nộp → bị chặn  4495ms

     × 10. updateSchedule ONLY_THIS dời ngày → buổi cũ biến mất, buổi mới ở ngày dời 1723ms

     × 11. updateSchedule ONLY_THIS dời tới ngày đã có buổi trong chuỗi → bị chặn 1685ms

     ✓ 12. updateSchedule ONLY_THIS dời tới ngày QUÁ KHỨ → bị chặn (tránh buổi mất khỏi agenda)  1710ms



⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ Failed Tests 4 ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯



 FAIL  tests/quiz.test.ts > Quiz - Public & Guest > có submission từ guest (studentId=null, guestName có giá trị)

AssertionError: expected 'Nguyen Van Test' to contain 'Khách'



Expected: "Khách"

Received: "Nguyen Van Test"



 ❯ tests/quiz.test.ts:17:28

     15|     const sub = await db.quizSubmission.findFirst({ where: { studentId: null } });

     16|     expect(sub).not.toBeNull();

     17|     expect(sub!.guestName).toContain("Khách");

       |                            ^

     18|   });

     19| });



⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/4]⎯



 FAIL  tests/quiz.test.ts > Quiz - Deadline & isLate > quiz 'Kiểm tra 15 phút - Chương 1 Vật Lý' có deadline ở quá khứ

AssertionError: expected null not to be null

 ❯ tests/quiz.test.ts:24:19

     22|   it("quiz 'Kiểm tra 15 phút - Chương 1 Vật Lý' có deadline ở quá khứ", async () => {

     23|     const q = await db.quiz.findFirst({ where: { title: { contains: "Kiểm tra 15 phút" } } });

     24|     expect(q).not.toBeNull();

       |                   ^

     25|     expect(q!.deadline).not.toBeNull();

     26|     expect(q!.deadline!.getTime()).toBeLessThan(Date.now());



⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[2/4]⎯



 FAIL  tests/schedule-series.integration.test.ts > ScheduleSeries CRUD integration > 10. updateSchedule ONLY_THIS dời ngày → buổi cũ biến mất, buổi mới ở ngày dời

AssertionError: expected false to be true // Object.is equality



- Expected

+ Received



- true

+ false



 ❯ tests/schedule-series.integration.test.ts:382:25

    380|       updateMode: "ONLY_THIS",

    381|     });

    382|     expect(upd.success).toBe(true);

       |                         ^

    383|

    384|     const full = await db.scheduleSeries.findUnique({ where: { id: seriesId }, include: { exc…



⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[3/4]⎯



 FAIL  tests/schedule-series.integration.test.ts > ScheduleSeries CRUD integration > 11. updateSchedule ONLY_THIS dời tới ngày đã có buổi trong chuỗi → bị chặn

AssertionError: expected 'Không thể dời buổi học tới ngày trong…' to contain 'đã có buổi học trong chuỗi'



Expected: "đã có buổi học trong chuỗi"

Received: "Không thể dời buổi học tới ngày trong quá khứ. Chỉ dời tới hôm nay hoặc ngày tương lai."



 ❯ tests/schedule-series.integration.test.ts:413:23

    411|     });

    412|     expect(upd.success).toBe(false);

    413|     expect(upd.error).toContain("đã có buổi học trong chuỗi");

       |                       ^

    414|   });

    415|



⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[4/4]⎯





 Test Files  2 failed | 26 passed (28)

      Tests  4 failed | 187 passed (191)

   Start at  14:32:10

   Duration  99.14s (transform 30.51s, setup 201.15s, import 22.96s, tests 82.17s, environment 3ms)



 FAIL  Tests failed. Watching for file changes...

       press h to show help, press q to quit

F:\CODE\DevOps\edu-web>npm run test:unit:coverage

> edu-web@0.1.0 test:unit:coverage
> vitest run --coverage


 RUN  v4.1.10 F:/CODE/DevOps/edu-web
      Coverage enabled with v8

stdout | tests/quiz.test.ts
◇ injected env (10) from .env.test // tip: ◈ encrypted .env [www.dotenvx.com]
◇ injected env (19) from .env // tip: ◈ secrets for agents [www.dotenvx.com]

stdout | tests/schedule-series.integration.test.ts
◇ injected env (10) from .env.test // tip: ⌘ suppress logs { quiet: true }
◇ injected env (19) from .env // tip: ◈ secrets for agents [www.dotenvx.com]

stdout | tests/grade-homework.test.ts
◇ injected env (10) from .env.test // tip: ◈ encrypted .env [www.dotenvx.com]
◇ injected env (19) from .env // tip: ⌘ custom filepath { path: '/custom/path/.env' }

stdout | tests/calendar.test.ts
◇ injected env (10) from .env.test // tip: ⌘ multiple files { path: ['.env.local', '.env'] }
◇ injected env (19) from .env // tip: ⌘ override existing { override: true }

stdout | tests/attendance.test.ts
◇ injected env (10) from .env.test // tip: ◈ secrets for agents [www.dotenvx.com]
◇ injected env (19) from .env // tip: ⌘ suppress logs { quiet: true }

stdout | tests/schedule.test.ts
◇ injected env (10) from .env.test // tip: ⌘ override existing { override: true }
◇ injected env (19) from .env // tip: ⌘ override existing { override: true }

stdout | tests/tuition-refactor.integration.test.ts
◇ injected env (10) from .env.test // tip: ⌘ suppress logs { quiet: true }
◇ injected env (19) from .env // tip: ⌘ custom filepath { path: '/custom/path/.env' }

stdout | tests/course.test.ts
◇ injected env (10) from .env.test // tip: ⌘ suppress logs { quiet: true }
◇ injected env (19) from .env // tip: ⌘ custom filepath { path: '/custom/path/.env' }

stdout | tests/tuition-credit.integration.test.ts
◇ injected env (10) from .env.test // tip: ◈ secrets for agents [www.dotenvx.com]
◇ injected env (19) from .env // tip: ⌁ auth for agents [www.vestauth.com]

stdout | tests/payos-webhook.integration.test.ts
◇ injected env (10) from .env.test // tip: ◈ secrets for agents [www.dotenvx.com]
◇ injected env (19) from .env // tip: ◈ secrets for agents [www.dotenvx.com]

stdout | tests/tuition.test.ts
◇ injected env (10) from .env.test // tip: ⌁ auth for agents [www.vestauth.com]
◇ injected env (19) from .env // tip: ⌘ multiple files { path: ['.env.local', '.env'] }

stderr | tests/unit/payos-webhook-route.test.ts > PayOS webhook route > reconcile lỗi (DB lỗi) → 500 để PayOS retry
PayOS webhook reconcile error: Error: db down
    at F:/CODE/DevOps/edu-web/tests/unit/payos-webhook-route.test.ts:89:33
    at file:///F:/CODE/DevOps/edu-web/node_modules/@vitest/runner/dist/chunk-artifact.js:302:11
    at file:///F:/CODE/DevOps/edu-web/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:26
    at file:///F:/CODE/DevOps/edu-web/node_modules/@vitest/runner/dist/chunk-artifact.js:2326:20
    at new Promise (<anonymous>)
    at runWithCancel (file:///F:/CODE/DevOps/edu-web/node_modules/@vitest/runner/dist/chunk-artifact.js:2323:10)
    at file:///F:/CODE/DevOps/edu-web/node_modules/@vitest/runner/dist/chunk-artifact.js:2305:20
    at new Promise (<anonymous>)
    at runWithTimeout (file:///F:/CODE/DevOps/edu-web/node_modules/@vitest/runner/dist/chunk-artifact.js:2272:10)
    at file:///F:/CODE/DevOps/edu-web/node_modules/@vitest/runner/dist/chunk-artifact.js:2955:64

stdout | tests/document.test.ts
◇ injected env (10) from .env.test // tip: ⌘ enable debugging { debug: true }
◇ injected env (19) from .env // tip: ⌘ suppress logs { quiet: true }

 ✓ tests/unit/payos-webhook-route.test.ts (5 tests) 88ms
(node:9792) Warning: SECURITY WARNING: The SSL modes 'prefer', 'require', and 'verify-ca' are treated as aliases for 'verify-full'.
In the next major version (pg-connection-string v3.0.0 and pg v9.0.0), these modes will adopt standard libpq semantics, which have weaker security guarantees.

To prepare for this change:
- If you want the current behavior, explicitly use 'sslmode=verify-full'
- If you want libpq compatibility now, use 'uselibpqcompat=true&sslmode=require'

See https://www.postgresql.org/docs/current/libpq-ssl.html for libpq SSL mode definitions.
(Use `node --trace-warnings ...` to show where the warning was created)
(node:18180) Warning: SECURITY WARNING: The SSL modes 'prefer', 'require', and 'verify-ca' are treated as aliases for 'verify-full'.
In the next major version (pg-connection-string v3.0.0 and pg v9.0.0), these modes will adopt standard libpq semantics, which have weaker security guarantees.

To prepare for this change:
- If you want the current behavior, explicitly use 'sslmode=verify-full'
- If you want libpq compatibility now, use 'uselibpqcompat=true&sslmode=require'

See https://www.postgresql.org/docs/current/libpq-ssl.html for libpq SSL mode definitions.
(Use `node --trace-warnings ...` to show where the warning was created)
(node:21284) Warning: SECURITY WARNING: The SSL modes 'prefer', 'require', and 'verify-ca' are treated as aliases for 'verify-full'.
In the next major version (pg-connection-string v3.0.0 and pg v9.0.0), these modes will adopt standard libpq semantics, which have weaker security guarantees.

To prepare for this change:
- If you want the current behavior, explicitly use 'sslmode=verify-full'
- If you want libpq compatibility now, use 'uselibpqcompat=true&sslmode=require'

See https://www.postgresql.org/docs/current/libpq-ssl.html for libpq SSL mode definitions.
(Use `node --trace-warnings ...` to show where the warning was created)
(node:10820) Warning: SECURITY WARNING: The SSL modes 'prefer', 'require', and 'verify-ca' are treated as aliases for 'verify-full'.
In the next major version (pg-connection-string v3.0.0 and pg v9.0.0), these modes will adopt standard libpq semantics, which have weaker security guarantees.

To prepare for this change:
- If you want the current behavior, explicitly use 'sslmode=verify-full'
- If you want libpq compatibility now, use 'uselibpqcompat=true&sslmode=require'

See https://www.postgresql.org/docs/current/libpq-ssl.html for libpq SSL mode definitions.
(Use `node --trace-warnings ...` to show where the warning was created)
(node:28036) Warning: SECURITY WARNING: The SSL modes 'prefer', 'require', and 'verify-ca' are treated as aliases for 'verify-full'.
In the next major version (pg-connection-string v3.0.0 and pg v9.0.0), these modes will adopt standard libpq semantics, which have weaker security guarantees.

To prepare for this change:
- If you want the current behavior, explicitly use 'sslmode=verify-full'
- If you want libpq compatibility now, use 'uselibpqcompat=true&sslmode=require'

See https://www.postgresql.org/docs/current/libpq-ssl.html for libpq SSL mode definitions.
(Use `node --trace-warnings ...` to show where the warning was created)
(node:24124) Warning: SECURITY WARNING: The SSL modes 'prefer', 'require', and 'verify-ca' are treated as aliases for 'verify-full'.
In the next major version (pg-connection-string v3.0.0 and pg v9.0.0), these modes will adopt standard libpq semantics, which have weaker security guarantees.

To prepare for this change:
- If you want the current behavior, explicitly use 'sslmode=verify-full'
- If you want libpq compatibility now, use 'uselibpqcompat=true&sslmode=require'

See https://www.postgresql.org/docs/current/libpq-ssl.html for libpq SSL mode definitions.
(Use `node --trace-warnings ...` to show where the warning was created)
(node:19904) Warning: SECURITY WARNING: The SSL modes 'prefer', 'require', and 'verify-ca' are treated as aliases for 'verify-full'.
In the next major version (pg-connection-string v3.0.0 and pg v9.0.0), these modes will adopt standard libpq semantics, which have weaker security guarantees.

To prepare for this change:
- If you want the current behavior, explicitly use 'sslmode=verify-full'
- If you want libpq compatibility now, use 'uselibpqcompat=true&sslmode=require'

See https://www.postgresql.org/docs/current/libpq-ssl.html for libpq SSL mode definitions.
(Use `node --trace-warnings ...` to show where the warning was created)
(node:13860) Warning: SECURITY WARNING: The SSL modes 'prefer', 'require', and 'verify-ca' are treated as aliases for 'verify-full'.
In the next major version (pg-connection-string v3.0.0 and pg v9.0.0), these modes will adopt standard libpq semantics, which have weaker security guarantees.

To prepare for this change:
- If you want the current behavior, explicitly use 'sslmode=verify-full'
- If you want libpq compatibility now, use 'uselibpqcompat=true&sslmode=require'

See https://www.postgresql.org/docs/current/libpq-ssl.html for libpq SSL mode definitions.
(Use `node --trace-warnings ...` to show where the warning was created)
 ✓ src/lib/openrouter.test.ts (10 tests) 1047ms
     ✓ 400 → jump to next model without exhausting all keys  810ms
 ✓ tests/quiz-submit.test.ts (15 tests) 17ms
 ✓ tests/schedule.test.ts (3 tests) 1232ms
     ✓ có 2 series trùng phòng Phòng 203 cùng giờ 08:00-10:30 khác lớp  1001ms
 ✓ tests/unit/payos-utils.test.ts (8 tests) 23ms
 ✓ tests/document.test.ts (3 tests) 1181ms
     ✓ doc 'Đề cương' published và giới hạn theo lớp (classVisibility)  1022ms
 ✓ tests/attendance.test.ts (3 tests) 1525ms
     ✓ student1 (10A1) có 3 buổi ABSENT liên tiếp  1091ms
 ❯ tests/quiz.test.ts (6 tests | 2 failed) 1594ms
     ✓ quiz 'Trắc nghiệm thử sức - Tiếng Anh cơ bản' là public, có question  1061ms
     × có submission từ guest (studentId=null, guestName có giá trị) 84ms
     × quiz 'Kiểm tra 15 phút - Chương 1 Vật Lý' có deadline ở quá khứ 74ms
     ✓ QuizSubmission có field isLate 71ms
     ✓ tạo submission mới với isLate=true — điểm vẫn tính bình thường 170ms
     ✓ tạo submission isLate=false (đúng giờ) 130ms
 ✓ tests/calendar.test.ts (1 test) 1567ms
     ✓ event 'Họp giao ban' có RRULE + CANCELLED exception + participants + reminders  1564ms
 ✓ src/lib/__tests__/quiz-shuffle.test.ts (22 tests) 15ms
 ✓ tests/course.test.ts (2 tests) 1761ms
     ✓ course published có 2 modules, module 1 có 2 lessons đúng order  1154ms
     ✓ student1 và student2 đều có enrollment  603ms
 ✓ src/lib/quiz-import.test.ts (9 tests) 14ms
 ✓ tests/unit/tuition-credit.test.ts (12 tests) 10ms
 ✓ tests/unit/admission-form.test.ts (2 tests) 8ms
 ✓ tests/grade-homework.test.ts (4 tests) 2025ms
     ✓ student2 có QUIZ và HOMEWORK cho Toán (MATH101)  1289ms
 ✓ tests/unit/leaderboard.query.test.ts (1 test) 7ms
 ✓ tests/unit/countdown.test.ts (2 tests) 7ms
 ✓ tests/unit/vip-doc.api.test.ts (3 tests) 7ms
 ✓ tests/unit/redirect.test.ts (1 test) 5ms
 ✓ tests/unit/quiz-demo.test.ts (2 tests) 6ms
 ✓ tests/schedules.test.ts (8 tests) 24ms
(node:10004) Warning: SECURITY WARNING: The SSL modes 'prefer', 'require', and 'verify-ca' are treated as aliases for 'verify-full'.
In the next major version (pg-connection-string v3.0.0 and pg v9.0.0), these modes will adopt standard libpq semantics, which have weaker security guarantees.

To prepare for this change:
- If you want the current behavior, explicitly use 'sslmode=verify-full'
- If you want libpq compatibility now, use 'uselibpqcompat=true&sslmode=require'

See https://www.postgresql.org/docs/current/libpq-ssl.html for libpq SSL mode definitions.
(Use `node --trace-warnings ...` to show where the warning was created)
(node:25872) Warning: SECURITY WARNING: The SSL modes 'prefer', 'require', and 'verify-ca' are treated as aliases for 'verify-full'.
In the next major version (pg-connection-string v3.0.0 and pg v9.0.0), these modes will adopt standard libpq semantics, which have weaker security guarantees.

To prepare for this change:
- If you want the current behavior, explicitly use 'sslmode=verify-full'
- If you want libpq compatibility now, use 'uselibpqcompat=true&sslmode=require'

See https://www.postgresql.org/docs/current/libpq-ssl.html for libpq SSL mode definitions.
(Use `node --trace-warnings ...` to show where the warning was created)
(node:21584) Warning: SECURITY WARNING: The SSL modes 'prefer', 'require', and 'verify-ca' are treated as aliases for 'verify-full'.
In the next major version (pg-connection-string v3.0.0 and pg v9.0.0), these modes will adopt standard libpq semantics, which have weaker security guarantees.

To prepare for this change:
- If you want the current behavior, explicitly use 'sslmode=verify-full'
- If you want libpq compatibility now, use 'uselibpqcompat=true&sslmode=require'

See https://www.postgresql.org/docs/current/libpq-ssl.html for libpq SSL mode definitions.
(Use `node --trace-warnings ...` to show where the warning was created)
(node:23812) Warning: SECURITY WARNING: The SSL modes 'prefer', 'require', and 'verify-ca' are treated as aliases for 'verify-full'.
In the next major version (pg-connection-string v3.0.0 and pg v9.0.0), these modes will adopt standard libpq semantics, which have weaker security guarantees.

To prepare for this change:
- If you want the current behavior, explicitly use 'sslmode=verify-full'
- If you want libpq compatibility now, use 'uselibpqcompat=true&sslmode=require'

See https://www.postgresql.org/docs/current/libpq-ssl.html for libpq SSL mode definitions.
(Use `node --trace-warnings ...` to show where the warning was created)
 ✓ tests/schedule-expand.test.ts (24 tests) 21ms
 ✓ src/lib/__tests__/recurrence.test.ts (14 tests) 13ms
(node:10004) DeprecationWarning: Calling client.query() when the client is already executing a query is deprecated and will be removed in pg@9.0. Use async/await or an external async flow control mechanism instead.
 ✓ tests/tuition.test.ts (5 tests) 3445ms
     ✓ student2: Tuition tháng 1 đóng THIẾU (paid=60000 < amount=120000, PARTIAL)  870ms
     ✓ tui-004: PRESENT/ABSENT/LATE tính tiền; EXCUSED + chưa điểm danh không tính  1890ms
 ✓ tests/payos-webhook.integration.test.ts (5 tests) 5963ms
     ✓ orderCode không tồn tại → not_found (no-op)  537ms
     ✓ giao dịch thành công → link PAID + 1 TuitionPayment + tuition.paid/status + connect class  1208ms
     ✓ webhook trùng lặp → noop, không thêm payment lần 2  390ms
     ✓ nộp dư (amount > tuition.amount) → surplus vào studentCredit, paid chặn tại amount  1155ms
     ✓ tuition bị xóa trước webhook → fallback tạo Tuition mới (paid = amount) + connect class  1167ms
 ✓ tests/tuition-credit.integration.test.ts (3 tests) 6752ms
     ✓ nộp dư → paid chặn tại amount, phần dư thành studentCredit theo cặp (student, class)  1982ms
     ✓ tính học phí tháng sau → credit tự trừ, paid không reset, lịch sử payment giữ nguyên  1900ms
     ✓ TEACHER không phụ trách lớp → recordPayment bị từ chối  809ms
stdout | tests/tuition-refactor.integration.test.ts > Query count — 30 HS × 12 tháng phải giảm mạnh (dưới ~10 query)
[seed] connected students = 30

stdout | tests/tuition-refactor.integration.test.ts > Query count — 30 HS × 12 tháng phải giảm mạnh (dưới ~10 query) > tính 12 tháng × 30 HS chỉ tốn < 12 query (trước đây ~775)
[query-count] 30 HS × 12 tháng → 5 query

 ✓ tests/tuition-refactor.integration.test.ts (6 tests) 22322ms
     ✓ tính 2 tháng 6-7: amount khớp công thức (2 tiết/buổi), mọi buổi đều tính  1355ms
     ✓ tính lại lần 2: không đổi paid/status, không tạo row thừa (update có chọn lọc)  874ms
     ✓ tổng tiết = 2 + 3 = 5 (trước đây sẽ là 2×2=4 — sai khi buổi dài ngắn khác nhau)  929ms
     ✓ nộp dư ở tháng 6 → surplus thành credit; tháng 7 credit tự trừ  3303ms
     ✓ recalc giảm amount dưới paid → trả surplus về credit (nhánh update-so-sánh)  1249ms
     ✓ tính 12 tháng × 30 HS chỉ tốn < 12 query (trước đây ~775)  1425ms
 ❯ tests/schedule-series.integration.test.ts (12 tests | 2 failed) 33945ms
     ✓ 1. createSchedule tạo 1 ScheduleSeries + expand ra đúng số buổi  1798ms
     ✓ 2. trùng phòng → block (không tạo)  2463ms
     ✓ 3. trùng học sinh → warning (không block) khi 2 lớp cùng giờ, học sinh chung  3603ms
     ✓ 4. updateSchedule ONLY_THIS tạo exception MODIFIED, các buổi khác giữ nguyên  3031ms
     ✓ 5. updateSchedule ALL_FUTURE cắt series + tạo series mới + di dời + guard bài nộp  3996ms
     ✓ 6. deleteSchedule ONLY_THIS tạo exception CANCELLED  2113ms
     ✓ 7. deleteSchedule ALL_FUTURE cắt endDate  2006ms
     ✓ 8. guard: deleteSchedule ONLY_THIS bị chặn khi có bài nộp cho buổi đó  1783ms
     ✓ 9. updateSchedule ALL đổi endDate rút ngắn có bài nộp → bị chặn  4915ms
     × 10. updateSchedule ONLY_THIS dời ngày → buổi cũ biến mất, buổi mới ở ngày dời 1870ms
     × 11. updateSchedule ONLY_THIS dời tới ngày đã có buổi trong chuỗi → bị chặn 1882ms
     ✓ 12. updateSchedule ONLY_THIS dời tới ngày QUÁ KHỨ → bị chặn (tránh buổi mất khỏi agenda)  1901ms

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ Failed Tests 4 ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯

 FAIL  tests/quiz.test.ts > Quiz - Public & Guest > có submission từ guest (studentId=null, guestName có giá trị)
AssertionError: expected 'Nguyen Van Test' to contain 'Khách'

Expected: "Khách"
Received: "Nguyen Van Test"

 ❯ tests/quiz.test.ts:17:28
     15|     const sub = await db.quizSubmission.findFirst({ where: { studentId: null } });
     16|     expect(sub).not.toBeNull();
     17|     expect(sub!.guestName).toContain("Khách");
       |                            ^
     18|   });
     19| });

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/4]⎯

 FAIL  tests/quiz.test.ts > Quiz - Deadline & isLate > quiz 'Kiểm tra 15 phút - Chương 1 Vật Lý' có deadline ở quá khứ
AssertionError: expected null not to be null
 ❯ tests/quiz.test.ts:24:19
     22|   it("quiz 'Kiểm tra 15 phút - Chương 1 Vật Lý' có deadline ở quá khứ", async () => {
     23|     const q = await db.quiz.findFirst({ where: { title: { contains: "Kiểm tra 15 phút" } } });
     24|     expect(q).not.toBeNull();
       |                   ^
     25|     expect(q!.deadline).not.toBeNull();
     26|     expect(q!.deadline!.getTime()).toBeLessThan(Date.now());

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[2/4]⎯

 FAIL  tests/schedule-series.integration.test.ts > ScheduleSeries CRUD integration > 10. updateSchedule ONLY_THIS dời ngày → buổi cũ biến mất, buổi mới ở ngày dời
AssertionError: expected false to be true // Object.is equality

- Expected
+ Received

- true
+ false

 ❯ tests/schedule-series.integration.test.ts:382:25
    380|       updateMode: "ONLY_THIS",
    381|     });
    382|     expect(upd.success).toBe(true);
       |                         ^
    383|
    384|     const full = await db.scheduleSeries.findUnique({ where: { id: seriesId }, include: { exc…

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[3/4]⎯

 FAIL  tests/schedule-series.integration.test.ts > ScheduleSeries CRUD integration > 11. updateSchedule ONLY_THIS dời tới ngày đã có buổi trong chuỗi → bị chặn
AssertionError: expected 'Không thể dời buổi học tới ngày trong…' to contain 'đã có buổi học trong chuỗi'

Expected: "đã có buổi học trong chuỗi"
Received: "Không thể dời buổi học tới ngày trong quá khứ. Chỉ dời tới hôm nay hoặc ngày tương lai."

 ❯ tests/schedule-series.integration.test.ts:413:23
    411|     });
    412|     expect(upd.success).toBe(false);
    413|     expect(upd.error).toContain("đã có buổi học trong chuỗi");
       |                       ^
    414|   });
    415|

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[4/4]⎯


 Test Files  2 failed | 26 passed (28)
      Tests  4 failed | 187 passed (191)
   Start at  14:38:33
   Duration  37.74s (transform 1.88s, setup 1.07s, import 22.10s, tests 84.62s, environment 6ms)


F:\CODE\DevOps\edu-web>