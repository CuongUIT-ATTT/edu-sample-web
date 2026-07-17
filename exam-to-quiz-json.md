---
name: exam-to-quiz-json
description: >
  Chuyen doi file de thi THPT/THCS dinh dang .docx (Viet Nam) thanh mang JSON
  tuong thich voi TeacherQuizManager (EduWeb). Kich hoat khi nguoi dung upload
  file de thi Word va yeu cau tao JSON de thi, import cau hoi, hoac ket xuat
  du lieu quiz. Ho tro 3 loai cau: MULTIPLE_CHOICE (Phan I), TRUE_FALSE (Phan
  II - dung/sai), SHORT_ANSWER (Phan III - tra loi ngan).
compatibility: "claude.ai, Claude Desktop, Cowork"
license: MIT
---
 
# Skill: Chuyen doi De thi DOCX → Quiz JSON
 
## Muc dich
 
Skill nay huong dan cach doc file de thi .docx dinh dang THPT Viet Nam
va xuat ra mang JSON phu hop voi schema cua TeacherQuizManager (EduWeb platform).
 
---
 
## Buoc 0 — Doc file DOCX
 
```bash
extract-text /mnt/user-data/uploads/<ten-file>.docx
```
 
Quet toan bo output. Xac dinh cac phan theo tieu de trong de thi:
- **PHẦN I. Thí sinh trả lời từ câu... Mỗi câu hỏi thí sinh chỉ chọn một phương án.**
  → Chuyen cac cau hoi thanh loai `MULTIPLE_CHOICE`
- **PHẦN II. Thí sinh trả lời từ câu... Trong mỗi ý a), b), c), d) ở mỗi câu, thí sinh chọn đúng hoặc sai.**
  → Chuyen cac cau hoi thanh loai `TRUE_FALSE`
- **PHẦN III. Thí sinh trả lời từ câu...**
  → Chuyen cac cau hoi thanh loai `SHORT_ANSWER`
- **Dap an**: Luon nam cuoi file — doc de lay correctAnswer chinh xac cua tung phan.
---
 
## Schema JSON (1 phan tu = 1 cau hoi)
 
```json
{
  "questionText": "Noi dung cau hoi day du (giu nguyen dau hoi cham)",
  "type": "MULTIPLE_CHOICE | TRUE_FALSE | SHORT_ANSWER",
  "options": ["...", "...", "...", "..."],
  "correctAnswer": "...",
  "score": 0.25,
  "explanation": "Giai thich tai sao dap an la chinh xac (do AI tao ra bang tieng Viet).",
  "imageUrl": "Duong dan anh minh hoa (neu co, mac dinh la \"\")"
}
```
 
> **`explanation`** la truong bat buoc ke tu phien ban nay. Phai co trong moi cau hoi.
> AI tu suy luan va tao giai thich — KHONG sao chep tu nguon ngoai.
> **`imageUrl`** luon phai co mat (mac dinh la `""` neu khong co anh minh hoa).
 
### Truong `correctAnswer` theo tung loai
 
| Loai cau       | Gia tri `correctAnswer`                     | Vi du       |
|----------------|---------------------------------------------|-------------|
| MULTIPLE_CHOICE| Index cua dap an dung (0-based string)      | `"2"` = C   |
| TRUE_FALSE     | Chuoi dung/sai 4 y, ngan cach dau phay      | `"T,F,T,F"` |
| SHORT_ANSWER   | Ket qua dang so hoac chuoi van ban          | `"22.6"`    |
 
---
 
## Quy tac tao truong `explanation`
 
Sau khi xac dinh dung `correctAnswer`, AI phai tu suy luan va viet giai thich bang tieng Viet,
ngan gon (1–3 cau), chinh xac ve noi dung. Khong can neu lai "Dap an la X" — tap trung vao
LY DO tai sao dap an do la dung (va neu can, tai sao cac phuong an khac sai).
 
### MULTIPLE_CHOICE
Giai thich tai sao phuong an dung la chinh xac. Co the neu ngan them ly do cac phuong an
khac sai neu co su nham lan tiem an.
 
Vi du:
```json
"explanation": "Do thi nuoc ta gan voi qua trinh cong nghiep hoa, cac do thi lon thuong hinh thanh ben canh khu cong nghiep. Cac phuong an A, B, D la cac nhan dinh sai hoac khong phan anh dac diem chu yeu."
```
 
### TRUE_FALSE
Giai thich lan luot tung menh de a/b/c/d. Voi menh de SAI, neu ro sai o diem nao.
 
Vi du:
```json
"explanation": "a) Sai — mua dong Dong Bac dai nhat, khong phai keo dai nhat. b) Sai — nhiet do thap o Tay Bac la do do cao dia hinh, khong phai do dia hinh hut gio. c) Dung — vi tri khuat gio va day nui vong cung che chan. d) Dung — la ket qua tuong tac cua ca hai huong gio va dia hinh."
```
 
### SHORT_ANSWER
Trinh bay buoc tinh hoac suy luan dan den ket qua.
 
Vi du:
```json
"explanation": "Nhiet do TB nam = tong 12 thang / 12 = 270.6 / 12 = 22.6°C."
```
 
---
 
**Chu y TRUE_FALSE**: Dap an trong file de thi thuong viet `D` (Dung) / `S` (Sai).
Map sang `T` / `F` cho JSON.
- `D` → `T` (True / Dung)
- `S` → `F` (False / Sai)
Vi du: dap an `DSSD` → `"T,F,F,T"`
 
---
 
## Quy tac lay dap an Phan I (MULTIPLE_CHOICE)
 
Bang dap an Phan I thuong co dang:
 
```
| 1 | 2 | 3 | ... | 18 |
| C | C | A | ... | D  |
```
 
Mapping chu cai → index:
- `A` → `"0"`
- `B` → `"1"`
- `C` → `"2"`
- `D` → `"3"`
---
 
## Quy tac tinh diem (score)
 
Phu thuoc vao cau truc de thi cu the, mac dinh tham khao theo ky thi tot nghiep THPT (Mon Toan):
 
| Phan | Loai              | Diem/cau |
|------|-------------------|----------|
| I    | MULTIPLE_CHOICE   | `0.25`   |
| II   | TRUE_FALSE        | `1.0`    |
| III  | SHORT_ANSWER      | `0.5`    |
 
> Kiem tra tong diem = 10 diem (12×0.25 + 4×1.0 + 6×0.5 = 3.0 + 4.0 + 3.0 = 10.0
> → neu khong khop, hoac voi cac mon hoc khac chi co phan trac nghiem, tu dong dieu chinh `score` theo ti le diem thuc te cua tung cau de tong diem luon bang 10.0).
 
---
 
## Xu ly questionText va options
 
### Quy tac chung ve Nhan phuong an (A, B, C, D hoac a, b, c, d)
- **LOẠI BỎ TOÀN BỘ NHÃN** ở đầu mỗi phương án hoặc ý phát biểu trước khi đưa vào mảng `options`.
- Không giữ lại các ký tự như `A. `, `B. `, `a) `, `b) `, `a. `, `b. ` ở đầu chuỗi lựa chọn, tránh việc bị lặp nhãn do giao diện người dùng (UI) đã tự động sinh nhãn.
- Ví dụ:
  - Phương án: `A. Tác động của công nghiệp hóa.` → `options` lưu `"Tác động của công nghiệp hóa."`
  - Ý phát biểu: `a) Do lãnh thổ hẹp ngang.` → `options` lưu `"Do lãnh thổ hẹp ngang."`
 
### Cau MULTIPLE_CHOICE (Phan I)
- **questionText**: Chỉ lấy phần thân câu hỏi (loại bỏ phần số thứ tự "Câu X.").
  - Ví dụ: `Câu 1. Nguyên nhân nào sau đây...` → `"Nguyên nhân nào sau đây..."`
- **options**: Chứa 4 chuỗi phương án đã được loại bỏ nhãn `A.`, `B.`, `C.`, `D.`.
 
### Cau TRUE_FALSE (Phan II)
- **questionText**: Chỉ chứa đoạn văn dẫn đề (context paragraph) hoặc câu hỏi dẫn chung. **KHÔNG** đưa 4 phát biểu `a)`, `b)`, `c)`, `d)` vào `questionText` (để tránh hiển thị lặp lại trên UI).
- **options**: Mảng gồm 4 phần tử tương ứng với nội dung 4 phát biểu a, b, c, d (đã được loại bỏ các nhãn đầu dòng `a) `, `b) `...).
 
### Cau SHORT_ANSWER (Phan III)
- **questionText**: Giữ nguyên nội dung câu hỏi và bảng số liệu đi kèm nếu có (chuyển mô tả bảng thành văn bản dạng text hoặc bảng Markdown sạch).
- **options**: Luôn là mảng rỗng `[]`.
 
---
 
## Template Python tao JSON (neu can xu ly tu dong)
 
```python
import json, re
 
# Map chu cai dap an Phan I
LETTER_MAP = {'A': '0', 'B': '1', 'C': '2', 'D': '3'}
 
# Map dung/sai Phan II
DS_MAP = {'D': 'T', 'S': 'F'}
 
def parse_part1_answer(letter: str) -> str:
    """'C' -> '2'"""
    return LETTER_MAP.get(letter.strip().upper(), '0')
 
def parse_part2_answer(ds_string: str) -> str:
    """'DSSD' -> 'T,F,F,T'"""
    return ','.join(DS_MAP.get(c, 'F') for c in ds_string.strip())
 
def build_multiple_choice(text, opts, ans_letter, explanation, score=0.25, image_url=""):
    return {
        "questionText": text.strip(),
        "type": "MULTIPLE_CHOICE",
        "options": [o.strip() for o in opts],
        "correctAnswer": parse_part1_answer(ans_letter),
        "score": score,
        "explanation": explanation.strip(),
        "imageUrl": image_url.strip()
    }
 
def build_true_false(text, opts, ds_string, explanation, score=1.0, image_url=""):
    return {
        "questionText": text.strip(),
        "type": "TRUE_FALSE",
        "options": [o.strip() for o in opts],
        "correctAnswer": parse_part2_answer(ds_string),
        "score": score,
        "explanation": explanation.strip(),
        "imageUrl": image_url.strip()
    }
 
def build_short_answer(text, correct, explanation, score=0.5, image_url=""):
    return {
        "questionText": text.strip(),
        "type": "SHORT_ANSWER",
        "options": [],
        "correctAnswer": str(correct),
        "score": score,
        "explanation": explanation.strip(),
        "imageUrl": image_url.strip()
    }
 
# Vi du su dung:
questions = []
questions.append(build_multiple_choice(
    "Dac diem cua do thi nuoc ta hien nay la",
    ["phan bo dong deu ca nuoc.", "deu co quy mo rat lon.",
     "gan voi cong nghiep hoa.", "Ti le dan thanh thi cao."],
    "C",
    "Do thi nuoc ta gan voi qua trinh cong nghiep hoa, thuong hinh thanh ben canh khu cong nghiep va vung kinh te trong diem."
))
print(json.dumps(questions, ensure_ascii=False, indent=2))
```
 
---
 
## Kiem tra truoc khi xuat
 
Truoc khi tra ve JSON, kiem tra:
 
1. **So luong cau**: dem tat ca phan (Phan I + II + III)
2. **correctAnswer hop le**:
   - MULTIPLE_CHOICE: phai la `"0"`, `"1"`, `"2"`, hoac `"3"`
   - TRUE_FALSE: phai la 4 gia tri ngan cach dau phay, moi gia tri la `T` hoac `F`
   - SHORT_ANSWER: la so thuc hoac chuoi text
3. **options**: MULTIPLE_CHOICE va TRUE_FALSE phai co dung 4 phan tu; SHORT_ANSWER phai la `[]`
4. **explanation**: moi cau phai co truong nay, khong duoc de trong hoac null
5. **imageUrl**: truong nay phai luon co mat trong tat ca cac cau hoi, mac dinh la chuoi rong `""` neu khong co hinh anh.
6. **Khong bo sot cau**: kiem tra so cau output = so cau trong de
 
---
 
## Xuat file
 
```bash
# Luu JSON ra output
cat > /mnt/user-data/outputs/de-thi-<ten-mon>-<nam>.json << 'EOF'
[...json array...]
EOF
```
 
Sau do goi `present_files` de nguoi dung tai ve.
 
---
 
## Luu y dac biet voi EduWeb / TeacherQuizManager
 
- `importMethod`: khi dan JSON vao UI, chon tab **"JSON"**
- JSON phai la mot mang `[...]`, khong phai object
- Math/LaTeX: giu nguyen cu phap `$...$` hoac `$$...$$` — MathRenderer se xu ly
- Schema co **7 truong**: `questionText` (hoac `text`), `type`, `options`, `correctAnswer` (hoac `answer`), `score`, `explanation` (hoac `explain`), `imageUrl` (hoac `image`)
- Khong them truong thua (`id`, `subjectId`...)
 