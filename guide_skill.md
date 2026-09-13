# Guide các skill trong Claude Code

Tài liệu này giải thích các skill hiện có trong phiên làm việc này, chia theo nhóm, kèm khi nào nên dùng và ví dụ cụ thể. Mục tiêu là giúp bạn chọn đúng skill nhanh hơn thay vì nhớ từng tên.

> Ghi chú:
> - `anthropic-skills:*` là skill chính thức từ Anthropic.
> - Các skill không có tiền tố thường là skill cộng đồng / bộ mở rộng / skill theo project.
> - Một số skill có thể thay đổi theo cài đặt máy hoặc phiên làm việc, nên đây là tài liệu sống.

---

## 1) Nhóm: Làm việc với Claude Code / cấu hình / quản trị môi trường

Dùng khi bạn muốn chỉnh Claude Code, tạo skill mới, đổi quyền, giảm prompt xin phép, hoặc quản lý session.

| Skill | Dùng khi nào | Ví dụ cụ thể |
|---|---|---|
| `init` | Khởi tạo cấu hình ban đầu cho Claude Code hoặc project | “Tạo bộ thiết lập ban đầu cho repo này.” |
| `update-config` | Sửa `settings.json`, quyền, hooks, env | “Cho phép npm chạy mà không hỏi lại mỗi lần.” |
| `keybindings-help` | Đổi phím tắt | “Đổi submit sang Ctrl+Enter.” |
| `fewer-permission-prompts` | Giảm số lần Claude xin quyền với các lệnh read-only | “Tối ưu allowlist để bớt prompt khi đọc file.” |
| `skill-create` | Tạo skill mới | “Tạo skill riêng cho quy trình review PR của team.” |
| `skill-health` | Kiểm tra một skill còn hoạt động đúng không | “Skill TDD có còn load đúng file SKILL.md không?” |
| `skill-stocktake` | Kiểm kê toàn bộ skill hiện có | “Liệt kê skill nào đang có trong máy.” |
| `resume-session` | Tiếp tục session cũ | “Quay lại công việc đang làm dở hôm qua.” |
| `save-session` | Lưu session thành tài liệu tham chiếu | “Lưu lại cuộc điều tra bug này.” |
| `statusline-setup` | Cấu hình status line của Claude Code | “Hiển thị branch, model, trạng thái task.” |
| `loop-start` / `loop-status` / `loop` | Tạo hoặc điều khiển vòng lặp tự động | “Cứ 10 phút kiểm tra lại CI.” |
| `checkpoint` | Tạo mốc an toàn trước khi làm thay đổi lớn | “Chốt trạng thái trước khi refactor.” |

**Khi dùng nhóm này:**
- trước khi thay đổi hành vi của Claude Code
- khi muốn tự động hóa trải nghiệm làm việc
- khi cần bảo toàn trạng thái session

---

## 2) Nhóm: Orchestration nhiều agent / chia việc / điều phối

Dùng khi bài toán lớn, nhiều bước, cần chạy song song, hoặc cần nhiều góc nhìn.

| Skill | Dùng khi nào | Ví dụ cụ thể |
|---|---|---|
| `agentic-engineering` | Thiết kế luồng làm việc theo kiểu agentic | “Phân rã feature lớn thành nhiều agent nhỏ.” |
| `agent-harness-construction` | Xây dựng môi trường chạy agent | “Thiết lập harness để agent chạy theo quy trình.” |
| `agent-sort` | Sắp xếp, phân loại agent theo vai trò | “Chọn agent phù hợp cho review, test, plan.” |
| `agents` | Tổng quan về hệ thống agent | “Xem các kiểu agent có thể dùng.” |
| `multi-plan` | Lập kế hoạch đa phần việc | “Tách bug lớn thành 3 luồng xử lý.” |
| `multi-workflow` | Điều phối nhiều workflow | “Chạy review, test và docs song song.” |
| `orchestrate` | Điều phối tổng thể nhiều bước/agent | “Tổ chức 3 agent cùng xử lý 1 feature.” |
| `continuous-agent-loop` | Chạy agent liên tục theo vòng | “Theo dõi CI / nhiệm vụ ngoài hệ thống.” |
| `autonomous-loops` | Tạo vòng lặp tự động dài hơi | “Theo dõi một trạng thái chờ nhiều giờ.” |
| `verification-loop` | Vòng lặp: làm → kiểm tra → sửa | “Sửa UI rồi tự verify bằng browser.” |
| `loop` | Chạy lặp theo nhịp hoặc tự pace | “Mỗi 30 phút rà lại các việc chưa xong.” |
| `tdd-workflow` | Điều phối quy trình TDD | “Viết test trước rồi mới triển khai.” |
| `quality-gate` | Đặt cổng kiểm tra chất lượng | “Chỉ cho phép merge khi test pass.” |
| `eval` | Đánh giá đầu ra / chất lượng / đáp ứng | “Chấm xem kết quả agent có đạt yêu cầu không.” |
| `promote` | Đẩy trạng thái/chất lượng lên mức cao hơn | “Promote bản nháp thành bản dùng được.” |

**Khi dùng nhóm này:**
- feature lớn, nhiều file
- cần phối hợp review / test / security / docs
- muốn giảm thời gian bằng cách làm song song

**Ví dụ cho repo `edu-web`:**
- một agent phân tích auth
- một agent viết E2E cho quiz
- một agent review security payment
- một agent kiểm tra build/type

---

## 3) Nhóm: Nghiên cứu, tìm kiếm, tri thức, học nhanh

Dùng khi chưa chắc hướng làm, cần tìm mẫu code, docs, hoặc cần tổng hợp nhiều nguồn.

| Skill | Dùng khi nào | Ví dụ cụ thể |
|---|---|---|
| `search-first` | Tìm trước khi viết mới | “Xem repo khác làm drag-and-drop lịch như thế nào.” |
| `deep-research` | Nghiên cứu sâu một chủ đề | “Tìm best practice cho anti-cheat quiz web.” |
| `exa-search` | Tìm web bằng Exa | “Tìm bài viết/guide về Next.js 16 app router.” |
| `iterative-retrieval` | Tìm theo vòng, refine dần | “Từ từ bóc tách pattern phù hợp nhất.” |
| `knowledge-ops` | Quản lý và tổ chức tri thức | “Gom các phát hiện thành tài liệu nội bộ.” |
| `research-ops` | Vận hành quy trình nghiên cứu | “Lập pipeline nghiên cứu trước khi code.” |
| `continuous-learning` | Tích lũy tri thức theo thời gian | “Ghi nhớ pattern tốt sau mỗi lần làm.” |
| `continuous-learning-v2` | Phiên bản nâng hơn của continuous learning | “Lọc, nén, và cập nhật tri thức cũ.” |
| `prompt-optimizer` | Tối ưu prompt cho agent / model | “Rút prompt dài thành prompt chính xác hơn.” |
| `prompt-optimize` | Tên rút gọn của prompt optimizer | “Sửa prompt để ít mơ hồ hơn.” |
| `token-budget-advisor` | Ước lượng và tiết kiệm token | “Chia job lớn thành phần đủ nhỏ.” |
| `context-budget` | Quản lý ngưỡng context | “Tránh nhồi quá nhiều file vào một lượt.” |
| `strategic-compact` | Tóm lược quyết định / bối cảnh | “Nén lại cuộc điều tra bug thành checklist.” |
| `consolidate-memory` / `anthropic-skills:consolidate-memory` | Gom các ghi nhớ rời rạc thành một nguồn gọn | “Hợp nhất các notes trùng ý nghĩa.” |

**Khi dùng nhóm này:**
- chưa biết nên làm theo pattern nào
- muốn tiết kiệm công sức viết lại từ đầu
- cần nghiên cứu trước khi plan hoặc implement

**Ví dụ:**
- “Trước khi sửa lịch học, tìm 3 implementation open-source tương tự.”
- “Nghiên cứu cách làm anti-cheat quiz trên web trước khi code.”

---

## 4) Nhóm: Planning / architecture / blueprint

Dùng khi bạn cần thiết kế giải pháp trước khi đụng code.

| Skill | Dùng khi nào | Ví dụ cụ thể |
|---|---|---|
| `plan` | Lập kế hoạch triển khai | “Feature mới này nên tách mấy bước?” |
| `planner` | Lập plan chi tiết cho feature/refactor | “Lập roadmap sửa auth flow.” |
| `blueprint` | Tạo bản thiết kế tổng quan | “Vẽ blueprint cho module lịch học.” |
| `architect` | Quyết định kiến trúc | “Chọn server action hay API route?” |
| `code-architect` | Thiết kế feature theo pattern có sẵn | “Đề xuất file nào, interface nào, data flow nào.” |
| `code-explorer` | Truy vết codebase để hiểu luồng hiện tại | “Dò xem dữ liệu quiz submit đi qua đâu.” |
| `workspace-surface-audit` | Kiểm tra bề mặt workspace / cấu trúc | “Xem workspace có chỗ nào cần làm rõ.” |
| `design-quality` (qua skill thiết kế) | Định hướng thẩm mỹ và trải nghiệm | “Chọn style dashboard hợp sản phẩm.” |

**Khi dùng nhóm này:**
- feature chạm nhiều file
- cần quyết định kiến trúc trước
- muốn tránh làm rồi phải sửa lại nhiều

**Ví dụ cho `edu-web`:**
- thiết kế lại luồng nộp bài tập
- chọn kiến trúc hiển thị lịch tuần/tháng
- phân chia boundary giữa server action, component, và DB

---

## 5) Nhóm: Frontend / UI / design / UX

Dùng khi bạn làm giao diện web, component, layout, dashboard, hoặc muốn UI có cá tính hơn mặc định.

| Skill | Dùng khi nào | Ví dụ cụ thể |
|---|---|---|
| `frontend-design` | Thiết kế UI/UX front-end | “Làm trang quiz danh sách nhìn như sản phẩm thật.” |
| `frontend-patterns` | Pattern frontend, component, state, layout | “Chọn cách tách component cho timetable.” |
| `anthropic-skills:frontend-design` | Guide thiết kế frontend của Anthropic | “Làm hero section có chiều sâu, không template.” |
| `ui-demo` | Làm demo giao diện nhanh | “Dựng thử modal chấm điểm.” |
| `dashboard-builder` | Xây dashboard / bảng điều khiển | “Làm dashboard admin theo dữ liệu lớp học.” |
| `liquid-glass-design` | Phong cách glass / liquid UI | “Dùng khi muốn giao diện có chiều sâu, hiện đại.” |
| `frontend-slides` | Trình bày thiết kế dạng slide | “Pitch design system cho team.” |
| `dataviz` | Dùng cho mọi chart / graph / dashboard | “Vẽ biểu đồ điểm theo lớp.” |
| `brand-voice` | Giữ giọng văn/brand nhất quán | “Copy button, heading, empty state.” |
| `article-writing` | Viết nội dung dài cho web | “Soạn blog hướng dẫn giáo viên.” |
| `content-engine` | Xây nội dung có cấu trúc | “Sinh content list, card, section.” |
| `crosspost` | Tái sử dụng nội dung trên nhiều kênh | “Biến 1 bài hướng dẫn thành nhiều format.” |

**Khi dùng nhóm này:**
- làm landing page, admin page, quiz player, timetable
- cần layout có chủ đích, không nhìn như template
- cần biểu đồ, bảng, stat tiles, empty states

**Ví dụ cho `edu-web`:**
- `frontend-design` để làm trang danh sách đề thi
- `dashboard-builder` cho admin thống kê
- `dataviz` cho điểm số / tỉ lệ nộp bài

---

## 6) Nhóm: Backend / API / database / migrations

Dùng khi bạn đụng endpoint, schema, query, migration, connector.

| Skill | Dùng khi nào | Ví dụ cụ thể |
|---|---|---|
| `api-design` | Thiết kế API | “Thiết kế endpoint nộp bài và chấm điểm.” |
| `api-connector-builder` | Kết nối hệ thống ngoài qua API | “Tích hợp Google Drive hoặc payment provider.” |
| `backend-patterns` | Pattern backend chung | “Tổ chức service, repository, use case.” |
| `database-migrations` | Làm migration đúng cách | “Thêm cột `recurrenceGroupId` an toàn.” |
| `postgres-patterns` | Pattern PostgreSQL | “Thiết kế query và schema tối ưu cho Postgres.” |
| `clickhouse-io` | Làm việc với ClickHouse | “Phân tích event/analytics quy mô lớn.” |
| `evm-token-decimals` | Xử lý decimal trong token EVM | “Làm dữ liệu blockchain / payment on-chain.” |

**Khi dùng nhóm này:**
- thiết kế schema
- viết migration
- tích hợp external API
- tối ưu query và data flow

**Ví dụ cho `edu-web`:**
- thêm bảng/field cho lịch lặp
- thiết kế API chấm bài
- chỉnh migration cho dữ liệu bài nộp

---

## 7) Nhóm: Code review / simplification / refactor / quality

Dùng sau khi sửa code, trước khi merge, hoặc khi muốn dọn code.

| Skill | Dùng khi nào | Ví dụ cụ thể |
|---|---|---|
| `code-review` | Review chất lượng tổng thể | “Rà code vừa sửa login flow.” |
| `typescript-reviewer` | Review TypeScript/JavaScript | “Kiểm tra type safety của server action.” |
| `simplify` | Tìm cách đơn giản hóa | “Rút gọn component nhiều nhánh.” |
| `refactor-clean` | Dọn dead code, trùng lặp | “Xóa helper cũ sau khi thay logic mới.” |
| `quality-gate` | Đặt ngưỡng chấp nhận | “Chỉ qua nếu không còn HIGH issues.” |
| `test-coverage` | Rà coverage | “Xem có thiếu test cho case mới không.” |
| `pr-test-analyzer` | Phân tích chất lượng test của PR | “Test có bắt đúng hành vi hay chỉ check snapshot.” |
| `silent-failure-hunter` | Tìm lỗi bị nuốt âm thầm | “Sửa chỗ catch nhưng không báo lỗi.” |
| `comment-analyzer` | Kiểm tra comment đúng/sai | “Comment có còn khớp code sau refactor không.” |
| `code-tour` | Đi tour codebase, hiểu cấu trúc | “Tóm tắt chỗ nào xử lý quiz submit.” |

**Khi dùng nhóm này:**
- sau khi viết code
- trước commit/PR
- khi muốn giảm độ phức tạp
- khi cần phát hiện silent failure hoặc test yếu

**Ví dụ cho `edu-web`:**
- review logic `attendance.ts`
- simplify component quiz player
- tìm dead code sau khi đổi dữ liệu lịch

---

## 8) Nhóm: TDD / test / verification / e2e

Dùng khi viết test, chạy test, hoặc verify hành vi thật trên app.

| Skill | Dùng khi nào | Ví dụ cụ thể |
|---|---|---|
| `tdd` | Viết test trước rồi mới code | “Thêm tính năng mới theo RED-GREEN-REFACTOR.” |
| `tdd-workflow` | Điều phối quy trình TDD đầy đủ | “Tách task thành test trước, code sau.” |
| `ai-regression-testing` | Kiểm tra hồi quy bằng AI / agent | “Sau sửa flow nộp bài, đảm bảo không vỡ luồng cũ.” |
| `e2e-testing` | Tạo/duy trì test E2E | “Test đăng nhập, mở quiz, nộp bài.” |
| `e2e-runner` | Chạy E2E bằng browser/Playwright | “Kiểm tra luồng thực tế trên app.” |
| `verify` | Xác minh kết quả sau thay đổi | “Đổi xong UI thì kiểm tra thật.” |
| `verification-loop` | Lặp: sửa → chạy → kiểm tra → sửa tiếp | “Fix bug rồi xác thực lại bằng browser.” |
| `build-fix` | Sửa lỗi build/type nhanh | “tsc fail sau khi đổi type.” |
| `cpp-build`, `go-build`, `rust-build`, `kotlin-build`, `flutter-build`, `java-build-resolver` | Build resolver theo ngôn ngữ | “Dùng đúng builder khi lỗi build của stack đó.” |

**Khi dùng nhóm này:**
- khi thêm tính năng mới
- khi sửa bug ảnh hưởng hành vi
- khi cần xác nhận thật trên UI
- khi build/type/test đang lỗi

**Ví dụ cho `edu-web`:**
- viết E2E cho quiz anticheat
- verify responsive timetable
- chạy lại test sau khi sửa payment webhook

---

## 9) Nhóm: Security / compliance / review an toàn

Dùng khi code liên quan auth, input, payment, file upload, DB, dữ liệu nhạy cảm.

| Skill | Dùng khi nào | Ví dụ cụ thể |
|---|---|---|
| `security-review` | Review bảo mật tổng thể | “Kiểm tra endpoint có bị lộ dữ liệu không.” |
| `security-scan` | Quét lỗ hổng cơ bản | “Tìm hardcoded secrets / dangerous patterns.” |
| `security-bounty-hunter` | Tư duy kiểu bug bounty | “Rà SSRF / XSS / IDOR.” |
| `defi-amm-security` | Security cho DeFi / AMM | “Dành cho smart contract / finance on-chain.” |
| `llm-trading-agent-security` | Security cho agent giao dịch | “Kiểm tra rủi ro prompt injection / trade abuse.” |
| `healthcare-phi-compliance` | Bảo vệ dữ liệu y tế PHI | “Hệ thống có thông tin bệnh nhân.” |
| `hipaa-compliance` | Compliance HIPAA | “Ứng dụng y tế cần tuân thủ quy định.” |
| `springboot-security` | Security pattern cho Spring Boot | “Auth, CSRF, filter, session.” |
| `django-security`, `laravel-security` | Security cho framework tương ứng | “Validate input, authz, CSRF đúng cách.” |

**Khi dùng nhóm này:**
- auth / permission
- payment / finance
- file system / upload
- endpoint công khai
- dữ liệu cá nhân, y tế, học sinh

**Ví dụ cho `edu-web`:**
- review logic login/session
- kiểm tra payment webhook
- kiểm tra ai được xem điểm / lịch / submission

---

## 10) Nhóm: Docs / tài liệu / file xử lý nội dung

Dùng khi cần đọc, trích xuất, tạo, hoặc chỉnh tài liệu.

| Skill | Dùng khi nào | Ví dụ cụ thể |
|---|---|---|
| `docs` | Làm tài liệu tổng quát | “Viết guide sử dụng feature mới.” |
| `doc-updater` | Cập nhật docs theo code mới | “Sửa README và design doc.” |
| `anthropic-skills:docx` | Làm việc với file Word | “Trích nội dung từ .docx.” |
| `anthropic-skills:pdf` | Xử lý PDF | “Đọc tài liệu PDF dài.” |
| `anthropic-skills:pdf-reading` | Đọc và trích thông tin từ PDF | “Lấy bảng, đoạn, mục từ PDF.” |
| `anthropic-skills:pptx` | Làm slide PowerPoint | “Tạo deck giới thiệu dự án.” |
| `anthropic-skills:xlsx` | Làm việc với Excel | “Đọc bảng điểm / dữ liệu bảng.” |
| `article-writing` | Viết bài hướng dẫn | “Soạn bài blog kỹ thuật.” |
| `visa-doc-translate` | Dịch tài liệu visa | “Dùng cho hồ sơ giấy tờ.” |
| `nurient-document-processing` | Xử lý tài liệu nghiệp vụ đặc thù | “Khi cần pipeline document parsing.” |

**Khi dùng nhóm này:**
- viết tài liệu kỹ thuật
- đọc file văn phòng
- trích nội dung từ tài liệu dài
- chuẩn bị slide / bài viết

---

## 11) Nhóm: Media / video / visual production

Dùng khi tạo video, animation, hoặc media phức tạp.

| Skill | Dùng khi nào | Ví dụ cụ thể |
|---|---|---|
| `video-editing` | Chỉnh sửa video | “Cắt ghép video demo sản phẩm.” |
| `manim-video` | Làm video giải thích bằng Manim | “Vẽ animation thuật toán.” |
| `remotion-video-creation` | Tạo video bằng Remotion | “Làm demo sản phẩm dạng social video.” |
| `remotion-storytelling-script` | Viết kịch bản video kể chuyện | “Soạn script video 60 giây.” |
| `remotion-geography-lesson` | Mẫu video giáo dục địa lý | “Tạo lesson video theo format có sẵn.” |
| `remotion-nguoichoi-style` | Mẫu video theo style riêng | “Dùng layout/nhịp dựng theo template có sẵn.” |

**Khi dùng nhóm này:**
- làm video marketing, demo, explainer
- cần animation có cấu trúc
- muốn sản xuất media tự động

---

## 12) Nhóm: Workflow / ops / team / business automation

Dùng khi làm việc với hệ thống vận hành, đội nhóm, tài khoản, ticket, email, hoặc tài nguyên kinh doanh.

| Skill | Dùng khi nào | Ví dụ cụ thể |
|---|---|---|
| `github-ops` | Tự động hóa GitHub | “Tạo PR, issue, review flow.” |
| `jira` / `jira-integration` | Làm việc với Jira | “Sync task thành ticket.” |
| `email-ops` | Vận hành email | “Soạn và phân loại email theo luồng.” |
| `messages-ops` | Quản lý message đa kênh | “Đọc/đáp tin nhắn nội bộ.” |
| `google-workspace-ops` | Drive, Docs, Sheets, Gmail | “Tự động cập nhật tài liệu nhóm.” |
| `unified-notifications-ops` | Gom thông báo từ nhiều nguồn | “Một chỗ để xem alerts.” |
| `finance-billing-ops` | Vận hành billing/tài chính | “Xử lý hóa đơn, trạng thái thanh toán.” |
| `customer-billing-ops` | Billing cho khách hàng | “Theo dõi thanh toán từng account.” |
| `inventory-demand-planning` | Dự báo nhu cầu / tồn kho | “Lập kế hoạch cung ứng.” |
| `production-scheduling` | Lập lịch sản xuất | “Tối ưu lịch công việc/ca kíp.” |
| `logistics-exception-management` | Quản lý ngoại lệ vận hành | “Xử lý đơn trễ, lỗi giao hàng.” |
| `returns-reverse-logistics` | Xử lý trả hàng / reverse logistics | “Luồng hoàn hàng.” |

**Khi dùng nhóm này:**
- tự động hóa vận hành
- xử lý ticket / issue / email
- tổng hợp thông báo và quy trình nội bộ

---

## 13) Nhóm: Stack-specific skills theo ngôn ngữ / framework

Đây là nhóm nên dùng khi bạn làm đúng stack đó. Nếu repo của bạn là TypeScript/Next.js như `edu-web`, nhóm TS/Web sẽ hữu ích nhất.

### 13.1 TypeScript / JavaScript / Web

| Skill | Dùng khi nào | Ví dụ cụ thể |
|---|---|---|
| `typescript-reviewer` | Review TypeScript/JS | “Kiểm tra type, async, security.” |
| `frontend-patterns` | Pattern frontend | “Tách component quiz player.” |
| `nestjs-patterns` | NestJS project | “Controller/service/module đúng cách.” |
| `nodejs-keccak256` | Hash/keccak cho Node | “Xử lý chuỗi hash đặc thù.” |
| `anthropic-skills:frontend-design` | Thiết kế frontend | “Làm UI có điểm nhấn.” |
| `anthropic-skills:mcp-engineer` | Xây MCP server | “Kết nối Claude với tool bên ngoài.” |

### 13.2 Python

| Skill | Dùng khi nào | Ví dụ cụ thể |
|---|---|---|
| `python-patterns` | Code Python theo pattern tốt | “Tổ chức service, dataclass, module.” |
| `python-testing` | Test Python | “Viết pytest cho helper.” |
| `python-review` | Review Python | “Kiểm tra style, typing, performance.” |

### 13.3 Go

| Skill | Dùng khi nào | Ví dụ cụ thể |
|---|---|---|
| `golang-patterns` | Code Go chuẩn | “Handler/service/repository.” |
| `golang-testing` | Test Go | “Table-driven tests.” |
| `go-build` | Sửa lỗi build Go | “Fix compile errors nhanh.” |
| `go-review` | Review Go | “Rà concurrency, error handling.” |

### 13.4 Rust

| Skill | Dùng khi nào | Ví dụ cụ thể |
|---|---|---|
| `rust-patterns` | Pattern Rust | “Ownership, error, module.” |
| `rust-testing` | Test Rust | “Viết unit/integration test.” |
| `rust-build` | Sửa build Rust | “Fix cargo build fail.” |
| `rust-review` | Review Rust | “Rà ownership và lifetimes.” |

### 13.5 Kotlin / Android

| Skill | Dùng khi nào | Ví dụ cụ thể |
|---|---|---|
| `kotlin-patterns` | Pattern Kotlin | “Sealed class, extension, DI.” |
| `kotlin-testing` | Test Kotlin | “JUnit/Kotest.” |
| `kotlin-review` | Review Kotlin | “Rà coroutine safety.” |
| `kotlin-coroutines-flows` | Làm coroutine/flow | “Xử lý stream state.” |

### 13.6 C / C++

| Skill | Dùng khi nào | Ví dụ cụ thể |
|---|---|---|
| `cpp-coding-standards` | Coding style C++ | “Giữ code hiện đại, rõ ràng.” |
| `cpp-testing` | Test C++ | “GoogleTest/Catch2.” |
| `cpp-build` | Sửa build C++ | “Fix CMake/linker errors.” |
| `cpp-review` | Review C++ | “Rà ownership, performance, safety.” |

### 13.7 Dart / Flutter

| Skill | Dùng khi nào | Ví dụ cụ thể |
|---|---|---|
| `dart-flutter-patterns` | Pattern Flutter/Dart | “Tách widget, state, services.” |
| `flutter-test` | Test Flutter | “Widget test / integration test.” |
| `flutter-review` | Review Flutter | “Kiểm tra UI, state, performance.” |
| `flutter-build` | Sửa build Flutter | “Fix pub / build_runner.” |

### 13.8 Java / Spring

| Skill | Dùng khi nào | Ví dụ cụ thể |
|---|---|---|
| `java-coding-standards` | Java style | “Code Java chuẩn, dễ đọc.” |
| `springboot-patterns` | Pattern Spring Boot | “Controller/service/repository.” |
| `springboot-security` | Security Spring Boot | “Auth, filter, CSRF.” |
| `springboot-tdd` | TDD cho Spring Boot | “Viết test trước rồi code.” |
| `springboot-verification` | Verify feature Spring Boot | “Chạy kiểm tra sau thay đổi.” |

### 13.9 PHP / Laravel

| Skill | Dùng khi nào | Ví dụ cụ thể |
|---|---|---|
| `laravel-patterns` | Pattern Laravel | “Controller, service, job.” |
| `laravel-plugin-discovery` | Tìm plugin/package Laravel | “Chọn package phù hợp.” |
| `laravel-security` | Security Laravel | “Validate request, authz.” |
| `laravel-tdd` | TDD Laravel | “Test trước rồi implement.” |
| `laravel-verification` | Verify Laravel feature | “Kiểm tra sau khi sửa.” |

### 13.10 Django

| Skill | Dùng khi nào | Ví dụ cụ thể |
|---|---|---|
| `django-patterns` | Pattern Django | “Model/view/service đúng chuẩn.” |
| `django-security` | Security Django | “CSRF, auth, input validation.” |
| `django-tdd` | TDD Django | “Test trước khi viết view.” |
| `django-verification` | Verify Django feature | “Chạy test và kiểm tra hành vi.” |

---

## 14) Nhóm: Niche / domain-specific / đặc thù

Đây là các skill dành cho bài toán rất cụ thể.

| Skill | Dùng khi nào | Ví dụ cụ thể |
|---|---|---|
| `finance-billing-ops` | Billing tài chính | “Đối soát thanh toán.” |
| `customer-billing-ops` | Billing khách hàng | “Quản lý hóa đơn theo customer.” |
| `lead-intelligence` | Phân tích lead | “Xác định khách hàng tiềm năng.” |
| `social-graph-ranker` | Xếp hạng social graph | “Tối ưu feed/connection.” |
| `carrier-relationship-management` | Quan hệ nhà vận chuyển | “Vận hành logistics.” |
| `customs-trade-compliance` | Tuân thủ xuất nhập khẩu | “Hồ sơ hải quan.” |
| `energy-procurement` | Mua sắm năng lượng | “Quy trình procurement.” |
| `investor-materials` | Tài liệu cho nhà đầu tư | “Pitch deck, memo.” |
| `investor-outreach` | Tiếp cận nhà đầu tư | “Chuẩn bị mail/sequence.” |
| `quality-nonconformance` | Quản lý sai lệch chất lượng | “Xử lý lỗi quy trình.” |
| `production-scheduling` | Lập lịch sản xuất | “Ca kíp và công suất.” |
| `returns-reverse-logistics` | Reverse logistics | “Hoàn hàng, đổi hàng.” |
| `inventory-demand-planning` | Dự báo tồn kho | “Kế hoạch hàng hóa.” |

---

## 15) Các skill “hạ tầng” và kỹ thuật hỗ trợ khác

| Skill | Dùng khi nào | Ví dụ cụ thể |
|---|---|---|
| `mcp-server-patterns` | Xây MCP server | “Tạo server tool cho Claude.” |
| `claude-api` | Làm việc với Claude API | “Gọi Messages API / tool runner.” |
| `claude-devfleet` | Quản lý đội agent / devfleet | “Điều phối nhiều agent làm việc.” |
| `configure-ecc` | Cấu hình bộ ECC / extension | “Cài đặt bộ skill/harness.” |
| `cost-aware-llm-pipeline` | Tối ưu chi phí LLM pipeline | “Giảm token / chọn model hợp lý.” |
| `workspace-surface-audit` | Audit bề mặt workspace | “Kiểm tra phạm vi làm việc.” |
| `terminal-ops` | Thao tác terminal nâng cao | “Điều khiển shell/luồng lệnh.” |
| `skill-health` | Kiểm tra độ lành của skill | “Xác nhận skill load đúng.” |

---

## 16) Gợi ý chọn skill nhanh cho dự án `edu-web`

Nếu bạn làm trên repo này, các skill nên nhớ nhất là:

- **`frontend-design`**: khi làm UI/UX Next.js
- **`frontend-patterns`**: khi tách component, state, layout
- **`typescript-reviewer`**: khi sửa TypeScript
- **`code-review`**: sau khi sửa code
- **`security-review`**: khi đụng auth, payment, input, file, DB
- **`tdd`** / **`e2e-testing`**: khi viết test cho luồng thật
- **`build-fix`**: khi `tsc` hoặc build fail
- **`database-migrations`**: khi thay schema Prisma
- **`doc-updater`**: khi cập nhật tài liệu nội bộ
- **`dataviz`**: khi làm dashboard, thống kê, chart

### Ví dụ chọn skill theo việc

- **Sửa trang login** → `frontend-patterns` + `typescript-reviewer` + `code-review`
- **Làm quiz player** → `frontend-design` + `e2e-testing` + `security-review`
- **Đổi schema lịch học** → `database-migrations` + `architect` + `build-fix`
- **Kiểm tra payment webhook** → `security-review` + `code-review` + `verify`
- **Làm dashboard admin** → `dashboard-builder` + `dataviz` + `frontend-design`
- **Viết test cho flow nộp bài** → `tdd` + `e2e-testing`

---

## 17) Quy tắc chọn skill thực dụng

1. **Có skill chuyên biệt thì ưu tiên skill chuyên biệt**
   - Ví dụ: `typescript-reviewer` tốt hơn `code-review` khi chỉ review TS.

2. **Có nhiều skill phù hợp thì chọn skill gần task nhất**
   - Ví dụ: làm chart thì dùng `dataviz`, không chọn skill frontend chung chung trước.

3. **Nếu là thay đổi lớn, đi theo chuỗi:**
   - `search-first` → `planner` / `architect` → `tdd` → `code-review` → `verify`

4. **Nếu task chạm bảo mật, luôn thêm `security-review`**

5. **Nếu task chạm UI thực tế, luôn verify bằng E2E hoặc browser**

---

## 18) Bản tóm tắt cực ngắn

- **Tìm hiểu:** `search-first`, `deep-research`, `exa-search`
- **Lên kế hoạch:** `planner`, `architect`, `code-architect`
- **Làm UI:** `frontend-design`, `frontend-patterns`, `dataviz`
- **Làm backend:** `api-design`, `database-migrations`, `postgres-patterns`
- **Viết test:** `tdd`, `e2e-testing`, `verify`
- **Review:** `code-review`, `typescript-reviewer`, `security-review`
- **Dọn code:** `simplify`, `refactor-clean`
- **Ops / workflow:** `github-ops`, `jira`, `email-ops`
- **Tài liệu:** `docs`, `doc-updater`, `pdf-reading`, `docx`

---

Nếu bạn muốn, tôi có thể làm tiếp một bản **rất thực dụng hơn cho đúng repo `edu-web`**, ví dụ:

- mỗi skill nên dùng cho **auth / quiz / schedule / payment / admin / E2E**
- kèm **mẫu prompt ngắn** để gọi từng skill
- và có thể chia thành **“nên dùng thường xuyên”, “nên dùng khi cần”, “ít dùng”**
