---
name: exam-to-quiz-json
description: >
  Chuyen doi file de thi THPT/THCS dinh dang .docx (Viet Nam) thanh mang JSON
  tuong thich voi TeacherQuizManager (EduWeb) — PHASE 1: chi lay noi dung chu/
  cong thuc, KHONG xu ly anh/Base64 (anh duoc xu ly rieng o skill
  exam-image-crop-json, phase 2, sau khi da import JSON nay vao tab "Dan
  JSON"). Kich hoat khi nguoi dung upload file de thi Word va yeu cau tao
  JSON de thi, import cau hoi, hoac ket xuat du lieu quiz — va CHUA nhac gi
  den anh/bieu do/crop. Ho tro 3 loai cau: MULTIPLE_CHOICE (Phan I),
  TRUE_FALSE (Phan II - dung/sai), SHORT_ANSWER (Phan III - tra loi ngan).
  JSON cuoi cung luon duoc ghi ra file roi dua cho nguoi dung qua
  present_files.
compatibility: "claude.ai, Claude Desktop, Cowork (huong dan cung ap dung duoc cho cac AI agent khac co Python sandbox, vd Gemini/AI Studio — xem Luu y da nen tang o cuoi Buoc 0a)"
license: MIT
---

# Skill: Chuyen doi De thi DOCX → Quiz JSON (Phase 1 — khong anh)

## Muc dich

Skill nay huong dan cach doc file de thi .docx dinh dang THPT Viet Nam va
xuat ra mang JSON phu hop voi schema cua TeacherQuizManager (EduWeb
platform), **chi voi noi dung chu va cong thuc LaTeX**. Truong `imageUrl`
luon de trong `""` o giai doan nay.

**Day la Buoc 1/2 trong quy trinh 2 buoc:**
1. **(Skill nay)** Tao JSON dam bao cau truc/dap an/diem/giai thich dung, khong
   co anh → dan vao textarea chinh cua tab "Dan JSON", bam Import.
2. Neu de thi co bang so lieu/bieu do/hinh ve → dung skill rieng
   **`exam-image-crop-json`** de cat anh, ma hoa Base64, va xuat file JSON
   thu 2 dang `{"question_N": "data:image/...;base64,...", ...}` de dan vao
   o "Gan anh vao cau hoi (buoc 2)" cua tab "Dan JSON".
Ly do tach lam 2 buoc: mot phien AI khong du ngu canh de vua doc/phan tich
de thi dai, vua cat-nen-ma hoa nhieu anh Base64 cung luc ma khong bi tran
ngu canh. Tach rieng giup moi buoc gon va on dinh hon.

---

## Buoc 0 — Doc file DOCX

```bash
extract-text /mnt/user-data/uploads/<ten-file>.docx
```

Quet toan bo output. Xac dinh cau truc de thi:
- **Phan I**: Trac nghiem nhieu phuong an lua chon → `MULTIPLE_CHOICE`
- **Phan II**: Trac nghiem dung/sai (4 y a/b/c/d) → `TRUE_FALSE`
- **Phan III**: Tra loi ngan (tinh toan, so lieu) → `SHORT_ANSWER`
- **Dap an**: Luon nam cuoi file — doc de lay correctAnswer chinh xac
Neu trong de bai co xuat hien cum tu "bang so lieu", "bieu do", "hinh ve",
"so do", "luoc do", "ban do", "quan sat hinh" — **khong bo qua**, van tao
cau hoi binh thuong voi `imageUrl: ""` va mo ta ngan gon trong
`questionText` (vd "Dua vao bieu do..."). Anh se duoc gan sau bang skill
`exam-image-crop-json`. Khong tu y cat/nhung anh trong skill nay.

### Buoc 0a — Chong "tran ngu canh" (context overflow) khi de thi dai

Voi de thi chi co chu (khong Base64), rui ro tran ngu canh thap hon nhieu so
voi khi co anh, nhung de thi rat dai (vd 40+ cau, nhieu ma de) van co the
khien mot phien qua tai neu xu ly toan bo cung luc voi giai thich dai dong
cho tung cau.

**Khuyen nghi:**

1. Voi de thi duoi ~25 cau: xu ly toan bo trong 1 luot la binh thuong,
   khong can checkpoint.
2. Voi de thi dai hon (25+ cau) hoac nhieu ma de cung luc: chia theo nhom
   toi da 15-20 cau/luot, bao cao tien do ngan gon sau moi nhom, roi tiep
   tuc nhom tiep theo.
3. Neu nguoi dung chi can 1-2 ma de cu the trong mot bang nhieu ma de, **chi
   xu ly dung ma de duoc yeu cau**, khong tu dong xu ly toan bo "cho day du".
4. Giu phan giai thich moi cau ngan gon (1-3 cau, theo Quy tac tao
   `explanation` ben duoi) — giai thich dai dong lam day nhanh ngu canh voi
   de thi nhieu cau.
5. Neu thay minh bat dau "phan tich lai" chinh mo ta/ten skill nay, hoac tra
   loi co xu huong tu choi chung chung khong lien quan yeu cau — day la dau
   hieu mat mach nhiem vu: dung lai, xem lai cau hoi da xu ly toi dau (dua
   vao noi dung da xuat trong tin nhan truoc), va tiep tuc dung tu do thay
   vi lam lai tu dau.

---

## Schema JSON day du

Moi phan tu trong mang JSON la mot cau hoi voi cac truong sau:

```json
{
  "questionText": "Noi dung cau hoi (bat buoc), ho tro LaTeX $...$, xuong dong bang \\n",
  "type": "MULTIPLE_CHOICE",
  "options": ["Phuong an A", "Phuong an B", "Phuong an C", "Phuong an D"],
  "correctAnswer": "0",
  "score": 0.25,
  "explanation": "Loi giai thich (tuy chon, ho tro LaTeX $...$)",
  "imageUrl": ""
}
```

### Bang tham chieu cac truong

| Truong         | Bat buoc | Kieu       | Ghi chu                                                                 |
|----------------|----------|------------|-------------------------------------------------------------------------|
| `questionText` | YES      | string     | Ho tro LaTeX `$...$`, xuong dong bang `\n`                              |
| `type`         | NO       | string     | `"MULTIPLE_CHOICE"` / `"TRUE_FALSE"` / `"SHORT_ANSWER"` — mac dinh MC  |
| `options`      | YES      | string[]   | MC/TF: toi da 4 phan tu, thieu se tu them trong. SA: `[]`              |
| `correctAnswer`| YES      | string     | MC: `"0"`(A)/`"1"`(B)/`"2"`(C)/`"3"`(D). TF: `"T,T,F,T"`. SA: dap so |
| `score`        | NO       | number     | Diem cau hoi — mac dinh `1.0`                                           |
| `explanation`  | NO       | string     | Loi giai thich, ho tro LaTeX `$...$`                                    |
| `imageUrl`     | NO       | string     | **Luon de `""` o skill nay** — anh duoc gan sau boi skill `exam-image-crop-json` |

> **Alias duoc chap nhan**: `questionText` ↔ `text` | `correctAnswer` ↔ `answer` | `explanation` ↔ `explain` | `imageUrl` ↔ `image`

### Quy tac `correctAnswer` theo tung loai

| Loai cau        | Gia tri `correctAnswer`                | Vi du       |
|-----------------|----------------------------------------|-------------|
| MULTIPLE_CHOICE | Index dap an dung (0-based string)     | `"2"` = C   |
| TRUE_FALSE      | 4 gia tri T/F ngan cach dau phay       | `"T,F,T,F"` |
| SHORT_ANSWER    | Ket qua dang so hoac chuoi van ban     | `"22.6"`    |

**Chu y TRUE_FALSE**: file de thi dung `D`/`S` → map sang `T`/`F` khi xuat JSON.
- `D` → `T` (True / Dung)
- `S` → `F` (False / Sai)

---

## Quy tac lay dap an Phan I (MULTIPLE_CHOICE)

Bang dap an Phan I thuong co dang:

```
| 1 | 2 | 3 | ... | 18 |
| C | C | A | ... | D  |
```

Mapping chu cai → index:
- `A` → `"0"` | `B` → `"1"` | `C` → `"2"` | `D` → `"3"`

---

## Quy tac tinh diem (score)

| Phan | Loai              | Diem mac dinh |
|------|-------------------|---------------|
| I    | MULTIPLE_CHOICE   | `0.25`        |
| II   | TRUE_FALSE        | `1.0`         |
| III  | SHORT_ANSWER      | `0.5`         |

Kiem tra tong diem khop voi de truoc khi xuat.

---

## Quy tac tao `explanation`

AI tu suy luan, viet bang tieng Viet, ngan gon 1-3 cau. Tap trung vao LY DO dap an dung, khong chi neu lai "Dap an la X".

- **MULTIPLE_CHOICE**: giai thich tai sao dap an dung, co the loai tru cac phuong an sai.
- **TRUE_FALSE**: giai thich lan luot tung menh de a/b/c/d; neu ro diem sai cua menh de SAI.
- **SHORT_ANSWER**: trinh bay buoc tinh toan dan den ket qua.

---

## Quy tac dinh dang `questionText` — QUAN TRONG

MathRenderer cua EduWeb tu dong nhan dang va render cac pattern sau:

| Pattern trong JSON  | Hien thi tren UI                          |
|---------------------|---------------------------------------------|
| `\n`                | Xuong dong that                           |
| `- Buoc 1: ...`     | Buoc co so thu tu, mau primary, co indent |
| `(a) ...`, `(b) ...`| Nhan dam, thut vao                        |
| `- bat ky`          | Bullet item                               |
| `Luu y: ...`        | Box mau vang noi bat                      |

**4 quy tac bat buoc:**

1. Dung `\n` de ngat dong giua cac phan cua cau hoi.
2. Cau co nhieu buoc / thi nghiem: phan noi dung chinh, sau do `\n- Buoc 1:`, `\n- Buoc 2:`, ...
3. Cau co phat bieu a/b/c/d: sau phan dan, xuat dong moi cho tung phat bieu: `\n(a) ...`, `\n(b) ...`
4. Phan ket cau hoi (vi du "So phat bieu sai la") dat tren dong rieng sau cung.
Neu de bai co bang so lieu/bieu do/hinh ve: van viet phan dan y ngan gon
trong `questionText` (vd "Cho bieu do the hien... Nhan xet nao sau day
dung?"), de `imageUrl: ""`. Khong co gang mo ta lai chi tiet toan bo noi
dung bang bang chu — anh that su se duoc gan o buoc 2 (skill khac).

---

## Vi du day du theo tung loai

### MULTIPLE_CHOICE — cau don gian

```json
{
  "questionText": "Dac diem cua do thi nuoc ta hien nay la",
  "type": "MULTIPLE_CHOICE",
  "options": [
    "phan bo dong deu ca nuoc.",
    "deu co quy mo rat lon.",
    "gan voi cong nghiep hoa.",
    "Ti le dan thanh thi cao."
  ],
  "correctAnswer": "2",
  "score": 0.25,
  "explanation": "Do thi nuoc ta hien nay gan lien voi qua trinh cong nghiep hoa, thuong hinh thanh ben canh khu cong nghiep va vung kinh te trong diem.",
  "imageUrl": ""
}
```

### MULTIPLE_CHOICE — cau nhieu buoc (Hoa hoc, Vat ly)

```json
{
  "questionText": "Trong phong thi nghiem, etyl axetat duoc dieu che theo cac buoc:\n- Buoc 1: Cho 1 ml ancol etylic, 1 ml axit axetic nguyen chat va 1 giot axit sunfuric dac vao ong nghiem.\n- Buoc 2: Lac deu, dong thoi dun cach thuy 5-6 phut trong noi nuoc nong 65–70°C.\n- Buoc 3: Lam lanh roi rot them vao ong nghiem 2 ml dung dich NaCl bao hoa.\nCho cac phat bieu sau:\n(a) Co the thay dung dich axit sunfuric dac bang dung dich axit sunfuric loang.\n(b) Co the tien hanh thi nghiem bang cach dun soi hon hop.\n(c) De kiem soat nhiet do trong qua trinh dun nong co the dung nhiet ke.\n(d) Dung dich NaCl bao hoa duoc them vao ong nghiem de phan ung dat hieu suat cao hon.\nSo phat bieu sai la",
  "type": "MULTIPLE_CHOICE",
  "options": ["1", "2", "3", "4"],
  "correctAnswer": "1",
  "score": 0.25,
  "explanation": "Phat bieu (a) sai: H2SO4 dac moi co tac dung hut nuoc lam tang hieu suat. (b) sai: dun soi lam that thoat chat dau. (d) sai: NaCl bao hoa de tach ester khoi nuoc, khong tang hieu suat phan ung. Chi (c) dung.",
  "imageUrl": ""
}
```

### MULTIPLE_CHOICE — cau co nhac den anh (van de trong nay o Phase 1)

```json
{
  "questionText": "Dua vao hinh ve, dien tich tam giac ABC la bao nhieu?",
  "type": "MULTIPLE_CHOICE",
  "options": ["12 cm²", "15 cm²", "20 cm²", "24 cm²"],
  "correctAnswer": "1",
  "score": 0.25,
  "explanation": "Dien tich = 1/2 × day × cao = 1/2 × 6 × 5 = 15 cm²",
  "imageUrl": ""
}
```

### TRUE_FALSE — co doan dan

```json
{
  "questionText": "Xac dinh phat bieu dung ve hinh hoc:\n(a) Tam giac deu co 3 canh bang nhau\n(b) Tam giac can co 3 goc bang nhau\n(c) Duong trung tuyen cat nhau tai trong tam\n(d) Duong cao vuong goc voi canh doi dien",
  "type": "TRUE_FALSE",
  "options": [
    "(a) Tam giac deu co 3 canh bang nhau",
    "(b) Tam giac can co 3 goc bang nhau",
    "(c) Duong trung tuyen cat nhau tai trong tam",
    "(d) Duong cao vuong goc voi canh doi dien"
  ],
  "correctAnswer": "T,F,T,T",
  "score": 1.0,
  "explanation": "(a) Dung. (b) Sai — tam giac can chi co 2 goc bang nhau. (c) Dung. (d) Dung.",
  "imageUrl": ""
}
```

### SHORT_ANSWER — co LaTeX

```json
{
  "questionText": "Tinh $\\int_0^1 x^2 dx$",
  "type": "SHORT_ANSWER",
  "options": [],
  "correctAnswer": "0.333",
  "score": 0.5,
  "explanation": "$\\int_0^1 x^2 dx = \\frac{x^3}{3}\\Big|_0^1 = \\frac{1}{3} \\approx 0.333$",
  "imageUrl": ""
}
```

---

## Template Python

```python
import json

LETTER_MAP = {'A': '0', 'B': '1', 'C': '2', 'D': '3'}
DS_MAP = {'D': 'T', 'S': 'F'}

def parse_mc(letter): return LETTER_MAP.get(letter.strip().upper(), '0')
def parse_tf(ds): return ','.join(DS_MAP.get(c, 'F') for c in ds.strip())

def mc(text, opts, ans, explanation, score=0.25):
    return {"questionText": text.strip(), "type": "MULTIPLE_CHOICE",
            "options": [o.strip() for o in opts], "correctAnswer": parse_mc(ans),
            "score": score, "explanation": explanation.strip(), "imageUrl": ""}

def tf(text, opts, ds, explanation, score=1.0):
    return {"questionText": text.strip(), "type": "TRUE_FALSE",
            "options": [o.strip() for o in opts], "correctAnswer": parse_tf(ds),
            "score": score, "explanation": explanation.strip(), "imageUrl": ""}

def sa(text, correct, explanation, score=0.5):
    return {"questionText": text.strip(), "type": "SHORT_ANSWER",
            "options": [], "correctAnswer": str(correct),
            "score": score, "explanation": explanation.strip(), "imageUrl": ""}

questions = []
# questions.append(mc(...))
# questions.append(tf(...))
# questions.append(sa(...))

out_path = '/mnt/user-data/outputs/de-thi.json'
with open(out_path, 'w', encoding='utf-8') as f:
    json.dump(questions, f, ensure_ascii=False, indent=2)

print(f"Da tao {len(questions)} cau hoi, luu tai {out_path}")
# Sau do dung tool present_files voi duong dan out_path de dua file cho nguoi dung
```

---

## Checklist truoc khi xuat

1. `correctAnswer`: MC la `"0"-"3"` | TF la 4 gia tri `T`/`F` ngan dau phay | SA la so/text
2. `options`: MC/TF co dung 4 phan tu | SA la `[]`
3. `explanation`: khong de trong hoac null
4. `imageUrl`: luon `""` o skill nay (khong xu ly anh)
5. `questionText`: cau nhieu buoc/phat bieu dung `\n` phan cach dung cho
6. Cong thuc Toan/Hoa phai dung LaTeX trong `questionText`, khong dien giai bang loi thuong
7. So cau output = so cau trong de (kiem tra khong bo sot cau nao, ke ca cau co nhac "bang/bieu do/hinh")
8. Neu de thi dai (25+ cau), da xu ly theo tung nhom va bao cao tien do (xem Buoc 0a)
9. Truoc khi bao "file da san sang de tai": da xac dinh dung nen tang dang chay va chi dung co che giao file THAT SU ton tai tren nen tang do (xem bang trong muc "Luu y da nen tang" ben duoi) — khong bia dat lenh/tool nhu `present_files` neu dang chay tren nen tang khac Claude

---

## Sau khi xuat xong: neu de thi co anh

Neu trong qua trinh doc de, ban ghi nhan co cau nhac den "bang so lieu",
"bieu do", "hinh ve", "so do", "ban do"... hay bao cho nguoi dung biet:

> "De thi nay co [X] cau kem hinh anh/bieu do (cau so ...). File JSON vua
> tao chua co anh — ban hay import file nay truoc (tab Dan JSON), sau do
> minh se dung skill `exam-image-crop-json` de cat anh va tao file JSON thu
> 2 dan vao o 'Gan anh vao cau hoi (buoc 2)'."

Khong tu y chuyen sang cat anh trong luot nay tru khi nguoi dung xac nhan
muon lam tiep ngay.

---

## Luu y da nen tang (Claude / Gemini / agent khac)

Skill nay duoc thiet ke ban dau cho moi truong Claude (co tool
`present_files`, thu muc `/mnt/user-data/outputs`), nhung nguyen tac cot loi
(xu ly tuan tu neu de thi dai, khong bia tool khong ton tai) ap dung cho moi
nen tang AI co Python sandbox, bao gom Gemini/AI Studio hay cac agent tuong tu.

**QUAN TRONG — tuyet doi khong bia dat tool khong ton tai:** `present_files`
la mot **tool that** chi ton tai trong moi truong Claude (claude.ai, Claude
Desktop/Cowork).

| Nen tang                                   | Co `present_files`? | Cach giao file thuc te                                                                 |
|---------------------------------------------|----------------------|------------------------------------------------------------------------------------------|
| Claude.ai / Claude Desktop / Cowork          | Co                   | `json.dump()` ra `/mnt/user-data/outputs/`, roi goi tool `present_files` voi duong dan.  |
| Google AI Studio (Python sandbox)            | Khong                | `json.dump()` ra file trong thu muc lam viec cua sandbox, sau do mo panel "Files" o thanh cong cu ben trai/duoi giao dien de tai ve. |
| Google Colab                                 | Khong (nhung co ham rieng) | Sau `json.dump()`, goi them: `from google.colab import files` roi `files.download(out_path)`. |
| Cac agent/chatbot khac co Python sandbox nhung khong ro co UI file hay khong | Khong chac | Khong bia dat ten tool. Chi `json.dump()` ra dia, in ro duong dan file tuyet doi, va huong dan nguoi dung tim khu vuc tai file cua giao dien dang dung. |

---

## Luu y EduWeb / TeacherQuizManager

- JSON phai la mang `[...]`, khong phai object
- Chon tab **"Dan JSON"** khi import vao UI, dan vao textarea chinh (buoc 1), roi bam Import
- LaTeX: giu nguyen `$...$` hoac `$$...$$` — MathRenderer xu ly
- `imageUrl`: o skill nay luon `""`. Neu de thi co anh, dung tiep skill
  `exam-image-crop-json` (buoc 2) de gan anh sau khi da import JSON nay.
- Schema co **7 truong chinh**: `questionText` `type` `options` `correctAnswer` `score` `explanation` `imageUrl`
