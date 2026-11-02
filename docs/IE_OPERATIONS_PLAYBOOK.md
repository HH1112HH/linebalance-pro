# IE Operations Playbook — LineBalance Pro

> **Mục đích:** Lấp khoảng trống IE/Lean/Six Sigma và vận hành sản xuất cho vị trí Shift Line Engineer, dùng chính dự án LineBalance Pro làm ví dụ.
>
> **Data policy:** Chỉ dùng dữ liệu synthetic. Không dùng tên, lương, năng suất, skill thật của HBI.
>
> **Cập nhật:** 2026-11-02. Trạng thái chuẩn: §1. Review log: Phụ lục A. Nguồn dữ liệu: Phụ lục B.

**Đọc theo mục đích:**

| Mục đích | Đọc |
|---|---|
| Ôn nhanh 5 phút | §1 Trạng thái + §2 Learning path |
| Học đầy đủ | Module 1–10 (§3–§12) |
| Tra công thức | Module 1, 2, 3, 6 + `KPI_SPEC.md` |
| Chuẩn bị phỏng vấn | Q&A từng module + Module 10 (§12) + `docs/INTERVIEW_PREP.md` |
| Biết việc tiếp theo | §13 |

## Mục lục

- [0. Cách dùng](#cach-dung)
- [1. Trạng thái 10 module](#trang-thai)
- [2. Learning path](#learning-path)
- [3. Module 1 — Time Study & Standard Work](#module-1)
- [4. Module 2 — Hourly Production Control](#module-2)
- [5. Module 3 — Lean 8 Wastes](#module-3)
- [6. Module 4 — DMAIC & Six Sigma](#module-4)
- [7. Module 5 — Kaizen A3 & Control Plan](#module-5)
- [8. Module 6 — OEE & Downtime](#module-6)
- [9. Module 7 — Layout & Ergonomics](#module-7)
- [10. Module 8 — SMED & Changeover](#module-8)
- [11. Module 9 — Cross-functional Management](#module-9)
- [12. Module 10 — Interview Preparation](#module-10)
- [13. Việc tiếp theo](#next-steps)
- [Phụ lục A. Review log](#review-log)
- [Phụ lục B. Nguồn dữ liệu & liên kết](#nguon-du-lieu)

---

## 0. Cách dùng <a id="cach-dung"></a>

1. Học theo đúng thứ tự trong §2.
2. Mỗi module đi theo 5 bước:
   - hiểu khái niệm;
   - nắm công thức;
   - xem ví dụ synthetic;
   - áp dụng vào LineBalance Pro;
   - trả lời câu hỏi phỏng vấn.
3. Không đưa nội dung Lean vào `MODEL.md`. `MODEL.md` chỉ chứa công thức MILP.
4. Mỗi module phải có ít nhất một ví dụ số và một câu trả lời phỏng vấn mẫu.

---

## 1. Trạng thái 10 module — 2026-11-02 <a id="trang-thai"></a>

> `[x]` = nội dung đã đủ để dùng và có ví dụ/checklist; `[~]` = partial/outline; `[ ]` = chưa có.
> Checkbox trong từng module là **checklist học tập cá nhân**, không phải trạng thái repo.
> Toàn bộ ví dụ là synthetic, không phải dữ liệu HBI.

| # | Module | Nội dung đã có | Bằng chứng | Trạng thái |
|---:|---|---|---|---|
| 1 | Time Study & Standard Work | Observation sheet, tách element human/machine/walking, NT/ST/SAM, labor/operator/machine/station cycle, Yamazumi, Standard Work, Q&A | §3.1–3.14 | `[x]` knowledge; `[~]` software: UI aggregate |
| 2 | Hourly Production Control | Hourly plan theo bucket, cumulative gap, projected output, WIP theo buffer, escalation, CSV | §4.1–4.11; `docs/data/hourly_actuals.csv` | `[x]` knowledge; `[~]` software: chưa có backend model |
| 3 | Lean 8 Wastes | TIMWOODS, Muda/Mura/Muri, 4 cơ sở đo, Pareto, root cause, CSV | §5.1–5.11; `docs/data/waste_observation.csv` | `[x]` knowledge; `[~]` software: không phải feature |
| 4 | DMAIC & Six Sigma | 5 bước, T07 case study, fishbone/5 Why, Control Plan, DPMO/Z minh họa | §6.1–6.7, §6.5.1; `docs/CASE_STUDY_QUALITY_RCA.md` | `[x]` |
| 5 | Kaizen A3 & Control Plan | A3, T08 case study, estimated/verified saving, Control Plan | §7.1–7.7; `docs/CASE_STUDY_KAIZEN.md` | `[x]` |
| 6 | OEE & Downtime | A/P/Q, 6 big losses, điều kiện áp dụng và bẫy station thủ công, ví dụ PRESS-01 synthetic, Pareto downtime | §8.1–8.12; `docs/data/oee_machine_log.csv`; `KPI_SPEC.md` §12 | `[x]` knowledge + synthetic; `[~]` software: chưa có OEE API (`N/A`) |
| 7 | Layout & Ergonomics | Spaghetti, flow, POU/FIFO, lựa chọn U-cell, ergonomic screen, case study ST01 | §9.1–9.12; `docs/CASE_STUDY_LAYOUT_ERGONOMICS.md`; `docs/layout_study_before_after.svg` | `[x]` knowledge + synthetic; `[~]` EHS/pilot thật chưa xác nhận |
| 8 | SMED & Changeover | Internal/external, 4 giai đoạn SMED, changeover study synthetic 5+5 lần, waterfall, tác động OEE | §10.1–10.14; `docs/data/smed_changeover_study.csv` | `[x]` knowledge + synthetic; `[~]` software: không có changeover API |
| 9 | Cross-functional Management | Vai trò 8 nhóm, RACI, decision boundary, Red escalation, hourly case và handover | §11.1–11.10; Module 2 case | `[x]` knowledge + synthetic; `[~]` authority matrix thật phụ thuộc site |
| 10 | Interview Preparation | 5 STAR case, intro, English answers, technical follow-ups, glossary, 7-min demo | §12.1–12.6; `docs/INTERVIEW_PREP.md` | `[x]` prep template; `[~]` cá nhân hóa bằng kinh nghiệm thật |

**Đọc nhanh:**

- **Knowledge:** Module 1–10 đã có nội dung, ví dụ/checklist và Q&A; Module 10 có file prep tiếng Anh riêng.
- **Synthetic case:** Module 4, 5, 6, 7, 8 và 9; không phải production evidence.
- **Còn xác nhận ngoài portfolio:** Module 6 pacer, Module 7 EHS/handler time, Module 8 video/pilot; RACI Module 9 tùy site; Module 10 cần điền kinh nghiệm cá nhân.
- **Phần mềm:** optimizer + dashboard + 3 form đã có; Time Study là aggregate; Hourly và 8 Wastes là docs/CSV; OEE để `N/A`.
- **Case study:** T07/T08 và Layout/Ergonomics synthetic đã có; không mở rộng software chỉ để biến chúng thành feature.

---

## 2. Learning path <a id="learning-path"></a>

**Learning path — 10 module:**

1. Time Study & Standard Work
2. Hourly Production Control
3. Lean 8 Wastes
4. DMAIC & Six Sigma
5. Kaizen A3 & Control Plan
6. OEE & Downtime
7. Layout & Ergonomics
8. SMED & Changeover
9. Cross-functional Management
10. Interview Preparation

---

## 3. Module 1 — Time Study & Standard Work <a id="module-1"></a>

### 3.1. Mục tiêu

Biết cách một SAM/SMV được hình thành, không chỉ lấy số từ TechPack. Sau module này phải:

- thực hiện được stopwatch study cơ bản;
- tách thao tác người / máy / di chuyển;
- tính Normal Time và Standard Time;
- đọc được Yamazumi;
- giải thích được approved SAM khác planning SAM ở đâu.

### 3.2. Khái niệm chính

| Khái niệm | Ý nghĩa | Ghi chú |
|---|---|---|
| Stopwatch study | Bấm giờ từng element của công đoạn | Phải có nhiều cycle, không bấm một lần |
| Element | Đơn vị thao tác nhỏ nhất có điểm bắt đầu/kết thúc rõ | Ví dụ: lấy bó vải, đặt vào máy, may, cắt chỉ, di chuyển |
| Element type | Human / Machine automatic / Walking / Waiting | Quyết định cách rating và allowance |
| Observed Time (OT) | Thời gian bấm được | Đơn vị giây |
| Performance Rating (PR) | Hệ số đánh giá tốc độ/độ khéo của người được quan sát | 100% = tốc độ chuẩn; 90% = chậm hơn chuẩn. **Chỉ áp dụng cho element human/walking**, không nhân vào machine automatic time |
| Normal Time (NT) | Thời gian chuẩn hóa theo tốc độ chuẩn | `NT = Σ OT_e × PR_e`; machine automatic giữ riêng |
| Allowance | Thời gian cộng thêm cho nhu cầu cá nhân, mệt mỏi, chờ đợi, vệ sinh | Phải có `allowance_basis`; không cộng allowance người cho machine automatic |
| Standard Time (ST) | Thời gian chuẩn để hoàn thành công đoạn | `ST = Σ NT_e × (1 + allowance_e)`, mỗi allowance chỉ tính một lần |
| SAM/SMV | Standard Allowed Minute | Trong project dùng `sam_sec` (giây) |
| Yamazumi | Biểu đồ xếp chồng thời gian theo station/operation | Dùng để thấy imbalance và loại bỏ thao tác không tạo giá trị |

### 3.3. Công thức

```text
Observed Time trung bình của element e:
OT_avg,e = Σ OT_e / n_e

Normal Time:
NT_e = OT_avg,e × PR_e    (human / walking)
NT_e = OT_avg,e           (machine automatic; PR_e = 1.00)

NT_total = Σ NT_e

Standard Time:
ST = Σ [NT_e × (1 + allowance_e)]

SAM (phút) = ST (giây) / 60
```

Trong LineBalance Pro:

```text
planning_sam_sec = Standard Time (giây)
Load_station = Σ planning_sam_sec của operation tại station

Takt (demand) = net available seconds / target quantity
Effective Takt (planning) = net available seconds × planned efficiency / target quantity
```

**Quy tắc:**

- PR chỉ dùng cho thao tác người và walking. Không nhân PR của operator vào thời gian máy tự chạy.
- Nếu tốc độ máy khác chuẩn, dùng **machine speed factor** riêng, có nguồn và điều kiện đo; không trộn với PR.
- Allowance phải gắn với element hoặc operation, có `allowance_basis`; không cộng allowance hai lần.
- Nếu `sam_basis = INCLUDES_ALLOWANCE` thì `allowance_pct = 0` khi dùng SAM.
- **Takt theo nhu cầu khác Effective Takt.** Không gọi 54.64s là takt khách hàng.

### 3.4. Tách thao tác người / máy / di chuyển

Một element nên được gắn một trong các loại:

| Loại | Ví dụ | Cách cải tiến |
|---|---|---|
| Human / manual | Lấy vải, căn mép, cắt chỉ | Đào tạo, standard work, giảm thao tác thừa |
| Machine automatic | Máy may chạy tự động, máy ép mex | Tăng tốc độ máy, giảm chờ máy, bảo trì |
| Walking | Đi lấy bó vải, đi sang station khác | Layout, U-shape, giảm quãng đường |
| Waiting | Chờ máy, chờ nguyên liệu | Cân bằng chuyền, cải tiến cung ứng |

Nếu chỉ bấm tổng thời gian mà không tách element, không biết lãng phí nằm ở đâu và không cải tiến được.

**Lưu ý về machine time:** Khi máy tự chạy, thời gian đó không phản ánh tốc độ của operator. Nếu operator chậm hơn chuẩn, không được nhân 1.1 vào cả 20 giây máy. Phải tách:

```text
Human/walking time → áp dụng PR
Machine automatic time → giữ theo điều kiện máy, hoặc dùng machine speed factor riêng
```

### 3.5. Ví dụ synthetic — OP060 “May cổ”

Giả sử bấm 5 cycle cho OP060:

| Cycle | Observed time (s) |
|---:|---:|
| 1 | 39 |
| 2 | 41 |
| 3 | 40 |
| 4 | 42 |
| 5 | 38 |
| **Trung bình** | **40.0** |

Giả sử:

- Performance Rating = 100%;
- Allowance = 12.5%.

Tính:

```text
Normal Time = 40.0 × 1.00 = 40.0s
Standard Time = 40.0 × (1 + 0.125) = 45.0s
SAM = 45.0 / 60 = 0.75 phút
```

**Đây chỉ là ví dụ luyện tập, không phải xác nhận SAM chính thức.**

- 5 cycle chưa đủ để kết luận về độ biến thiên; cần đánh giá variance và chọn sample size phù hợp.
- 12.5% là **giả định synthetic**, không phải chính sách allowance của HBI.
- Không được chọn 12.5% chỉ vì muốn ra 45.0s khớp TechPack.
- Kết quả 45.0s khớp `sam_sec` của OP060 trong sample data chỉ là **kiểm tra số học**, không chứng minh SAM đúng.
- Muốn approved SAM phải có: method chuẩn, đủ cycle, rating có lý do, allowance có basis, người duyệt và revision.

### 3.6. Ví dụ tách element

| Element | Loại | OT (s) | PR | NT (s) | Allowance | ST (s) |
|---|---|---:|---:|---:|---:|---:|
| Lấy bó vải | Human | 6.0 | 1.00 | 6.0 | 12.5% | 6.75 |
| Căn cổ vào máy | Human | 8.0 | 1.00 | 8.0 | 12.5% | 9.00 |
| May cổ | Machine automatic | 20.0 | 1.00 | 20.0 | 12.5%* | 22.50 |
| Cắt chỉ | Human | 4.0 | 1.00 | 4.0 | 12.5% | 4.50 |
| Di chuyển bó kế | Walking | 2.0 | 1.00 | 2.0 | 12.5% | 2.25 |
| **Tổng** |  | **40.0** |  | **40.0** |  | **45.0** |

> *12.5% cho machine là **machine allowance giả định** để minh họa số học, không phải personal allowance. Trong thực tế phải dùng allowance riêng cho máy, có nguồn và điều kiện đo.

Sau khi tách, có thể thấy:

- 22.5s là machine time;
- 20.25s là human time;
- 2.25s là walking — ứng viên cho layout/U-shape;
- labor content = human + walking = **22.5s**.

### 3.6.1. Labor content, operator cycle, machine cycle, station cycle

Không phải lúc nào `Human + Machine + Walking` cũng bằng cycle time thực tế. Nếu máy tự chạy trong lúc operator làm việc khác, hai khoảng thời gian chồng lấp.

| Đại lượng | Định nghĩa | OP060 — giả định tuần tự |
|---|---|---|
| Labor content | Tổng thời gian lao động của người, gồm human + walking | 22.5s |
| Machine cycle time | Thời gian máy tự chạy | 22.5s |
| Operator cycle time | Chu kỳ lặp lại của người, gồm human + walking + waiting | 22.5s + waiting |
| Station cycle time | Nhịp hoàn thành tại trạm, xét cả chồng lấp | 45.0s nếu tuần tự |

Công thức đơn giản cho 1 operator / 1 máy:

```text
station_cycle = labor_content + machine_time - overlap + unavoidable_waiting
```

Ví dụ:

```text
labor_content = 22.5s
machine_time = 22.5s
overlap = 0s
station_cycle = 45.0s
```

Nếu 10s thao tác tay được làm trong lúc máy chạy:

```text
station_cycle = 22.5 + 22.5 - 10 = 35.0s
```

**Quy tắc:** Yamazumi phải dùng **station cycle** đã xét chồng lấp, không cộng human + machine + walking một cách máy móc.

### 3.7. Yamazumi

Yamazumi là biểu đồ cột xếp chồng:

- trục ngang: station hoặc operation;
- trục dọc: thời gian chuẩn (s);
- mỗi cột chia thành human / machine / walking / waiting;
- vẽ đường **Effective Takt** để so với năng lực kế hoạch.

Phân biệt hai đường:

```text
Demand Takt = 450 × 60 / 420 = 64.29s
Effective Takt = 450 × 60 × 85% / 420 = 54.64s
```

- **Demand Takt 64.29s** là nhịp theo nhu cầu khách hàng, chưa trừ hiệu suất kế hoạch.
- **Effective Takt 54.64s** là nhịp kế hoạch sau khi trừ planned efficiency; còn gọi là **Planning Cycle Allowance**.
- Không gọi 54.64s là “takt khách hàng”.

Ví dụ với Effective Takt 54.64s:

| Station | Human | Machine | Walking | Tổng | So với Effective Takt |
|---|---:|---:|---:|---:|---|
| ST01 | 18 | 12 | 4 | 34 | Dưới |
| ST02 | 20 | 25 | 5 | 50 | Dưới |
| ST03 | 22 | 28 | 6 | 56 | **Vượt 1.36s** |
| ST04 | 16 | 20 | 3 | 39 | Dưới |

Cách đọc:

- Station vượt **Effective Takt** là bottleneck theo năng lực kế hoạch;
- ST03 vượt 54.64s 1.36s nhưng vẫn dưới Demand Takt 64.29s — nghĩa là chưa vượt nhu cầu tuyệt đối, nhưng không còn buffer cho planned efficiency;
- phần walking lớn là cơ hội layout;
- phần waiting lớn là cơ hội cân bằng/cung ứng;
- phần machine lớn là cơ hội SMED/OEE.

**Quy tắc:** Trong dashboard và `KPI_SPEC.md` phải ghi rõ `takt_time_sec` (demand) và `effective_takt_time_sec` (planning), không dùng lẫn.

### 3.8. Áp dụng vào LineBalance Pro

Model hiện có:

- `TimeStudyRecord`: `observed_time_sec`, `performance_rating`, `allowance_pct`, `approved_sam_sec`.
- `TimeStudyResult`: `normal_time_sec`, `standard_time_sec`, `variance_pct`.
- Endpoint: `POST /api/time-study/calculate`.

**Giới hạn quan trọng:** endpoint hiện tại là **aggregate calculation** — một `observed_time_sec`, một `performance_rating`, một `allowance_pct`. Nó **chưa phải element-level time study** và không được dùng để nhân PR vào machine automatic time.

Element-level schema đề xuất (chưa implement trong backend):

| Field | Ý nghĩa |
|---|---|
| `element_id` | ID của element |
| `element_type` | HUMAN / MACHINE / WALKING / WAITING |
| `observed_time_sec` | OT trung bình của element |
| `performance_rating` | PR của element; machine automatic = 1.00 |
| `normal_time_sec` | NT của element |
| `allowance_basis` | PERSONAL / FATIGUE / MACHINE / PROCESS / … |
| `allowance_pct` | Allowance của element |
| `standard_time_sec` | ST của element |

Luồng đúng:

```text
Stopwatch study → Normal Time → Standard Time → Approved SAM
→ Planning SAM (dùng trong optimizer) → So sánh với SAM TechPack
```

**Không tự động cập nhật SAM** chỉ vì optimizer tìm được workload tốt hơn. Nếu Kaizen đổi method, phải time study lại, xác nhận method mới, phê duyệt ST rồi mới cập nhật planning SAM.

Optimizer dùng `planning_sam` cố định. Skill grade chỉ là **điều kiện được gán**, không nhân vào SAM.

Chưa có trong UI:

- form nhập nhiều cycle;
- element-level rating;
- lưu revision;
- so sánh approved SAM với SAM đang dùng;
- biểu đồ Yamazumi.

### 3.9. Standard Work — 3 yếu tố

Standard Work không phải là “làm giống nhau”, mà là cách làm chuẩn để đạt takt với ít lãng phí nhất. Ba yếu tố:

| Yếu tố | Câu hỏi | Trong LineBalance Pro |
|---|---|---|
| Takt time (demand) | Mỗi station phải xong một sản phẩm trong bao lâu theo nhu cầu? | `net available seconds / target qty` |
| Effective Takt (planning) | Nhịp kế hoạch sau khi trừ planned efficiency? | `net available seconds × planned efficiency / target qty` |
| Standard sequence | Thứ tự công đoạn/động tác chuẩn là gì? | `predecessors` + routing |
| Standard WIP | Cần bao nhiêu bán thành phẩm giữa các station? | Chưa modeled; cần cho Hourly/WIP |

**Standard Work Combination Sheet** là bảng kết hợp:

- thời gian người;
- thời gian máy;
- thời gian di chuyển;
- thời gian chờ;
- so với takt.

Mục đích:

- đào tạo công nhân mới;
- audit xem có làm đúng chuẩn không;
- tìm thao tác thừa để kaizen;
- làm nền cho Yamazumi.

### 3.10. Observation sheet mẫu

**Thông tin chung:**

| Field | Ví dụ |
|---|---|
| Study date | 2026-11-02 |
| Observer | IE |
| Line / shift | Line A / Ca 1 |
| Operation | OP060 — May cổ |
| Operator | W06 (synthetic) |
| Machine | OL-03 (OVERLOCK) |
| SAM hiện dùng | 45.0s |
| Ghi chú | Dữ liệu synthetic, không phải HBI |

**Bảng bấm giờ:**

| # | Element | Loại | C1 | C2 | C3 | C4 | C5 | Avg | PR | NT | Allow | ST |
|---:|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | Lấy bó vải | H | 6.2 | 5.8 | 6.0 | 6.1 | 5.9 | 6.0 | 1.00 | 6.0 | 12.5% | 6.75 |
| 2 | Căn cổ vào máy | H | 8.2 | 7.8 | 8.0 | 8.1 | 7.9 | 8.0 | 1.00 | 8.0 | 12.5% | 9.00 |
| 3 | May cổ | M | 20.4 | 19.8 | 20.0 | 20.2 | 19.6 | 20.0 | 1.00 | 20.0 | 12.5% | 22.50 |
| 4 | Cắt chỉ | H | 4.2 | 3.8 | 4.0 | 4.1 | 3.9 | 4.0 | 1.00 | 4.0 | 12.5% | 4.50 |
| 5 | Di chuyển bó kế | W | 2.1 | 1.9 | 2.0 | 2.1 | 1.9 | 2.0 | 1.00 | 2.0 | 12.5% | 2.25 |
|  | **Tổng** |  |  |  |  |  |  | **40.0** |  | **40.0** |  | **45.0** |

**Quy trình bấm giờ:**

1. Chọn operation và quan sát 1–2 cycle để làm quen, chưa bấm.
2. Chia element với điểm bắt đầu/kết thúc rõ ràng.
3. Bấm 5–10 cycle; ghi riêng cycle bất thường và lý do.
4. Ghi performance rating cho từng element hoặc cả operation.
5. Ghi allowance theo chính sách (cá nhân, mệt mỏi, chờ, vệ sinh).
6. Tính NT/ST, so sánh với SAM TechPack.
7. Nếu lệch lớn, điều tra method/rating/allowance trước khi đổi SAM.
8. Approved SAM phải có người duyệt và revision.

**Mẫu trống:**

| # | Element | Loại | C1 | C2 | C3 | C4 | C5 | Avg | PR | NT | Allow | ST |
|---:|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 |  | H/M/W |  |  |  |  |  |  |  |  |  |  |
| 2 |  |  |  |  |  |  |  |  |  |  |  |  |
| 3 |  |  |  |  |  |  |  |  |  |  |  |  |

### 3.11. Bài tập tính tay

**Bài 1 — OP020 “Ép mex cổ”**

Observed times: 24, 26, 25, 27, 23 giây. Performance Rating = 100%. Allowance = 12%.

Tính:

```text
Average OT = (24 + 26 + 25 + 27 + 23) / 5 = 25.0s
NT = 25.0 × 1.00 = 25.0s
ST = 25.0 × (1 + 0.12) = 28.0s
```

Kết quả 28.0s khớp `sam_sec` của OP020 trong sample data — chỉ là **kiểm tra số học**, không phải xác nhận SAM chính thức.

**Bài 2 — OP130 “May lai”**

Observed average = 50.0s. Performance Rating = 90%. Allowance = 10%.

Tính:

```text
NT = 50.0 × 0.90 = 45.0s
ST = 45.0 × (1 + 0.10) = 49.5s
```

Đây là **bài tập giả định**, không lấy từ sample data. OP130 trong sample data có `sam_sec = 46.0s`, nên không được dùng 49.5s để thay thế SAM hiện hành.

**Bài 3 — So sánh với TechPack**

TechPack SAM = 45.0s. Đo thực tế ra ST = 49.5s. Variance:

```text
Variance = (49.5 - 45.0) / 45.0 × 100 = +10%
```

Không tự động sửa planning SAM. Phải kiểm tra:

- method có giống TechPack không;
- performance rating có chủ quan không;
- allowance có đúng chính sách không;
- operator có đúng skill level không;
- có thao tác thừa do layout/máy không.

Sau khi xác nhận, mới đề xuất approved SAM revision.

### 3.12. Câu hỏi phỏng vấn

1. Em thực hiện stopwatch study như thế nào?
2. Normal Time khác Standard Time ở đâu?
3. Tại sao phải tách human / machine / walking?
4. Yamazumi dùng để làm gì?
5. Nếu SAM TechPack khác SAM đo thực tế, em xử lý thế nào?
6. Làm sao tránh nhân allowance hai lần?
7. Bấm bao nhiêu cycle là đủ? Xử lý outlier thế nào?
8. Làm sao đánh giá performance rating bớt chủ quan?
9. Standard Work gồm những yếu tố nào?
10. Em dùng time study để cân bằng chuyền như thế nào?
11. Labor content, operator cycle, machine cycle và station cycle khác nhau thế nào?
12. Takt theo nhu cầu và Effective Takt khác nhau thế nào?

### 3.13. Model answers

**Câu 2 — Normal Time khác Standard Time ở đâu?**

> Normal Time là thời gian đã chuẩn hóa theo tốc độ của người vận hành chuẩn. Standard Time là Normal Time cộng thêm allowance cho nhu cầu cá nhân, mệt mỏi, chờ đợi và các yếu tố không tránh khỏi. Ví dụ observed 40 giây, rating 100%, allowance 12.5% thì Normal Time là 40 giây, Standard Time là 45 giây. Tuy nhiên, nếu element là machine automatic, em không nhân PR của operator vào thời gian máy. Em tính NT theo từng element: human/walking × PR, machine automatic giữ riêng. Standard Time mới là cơ sở để tính SAM và cân bằng chuyền.

**Câu 3 — Tại sao tách human / machine / walking?**

> Nếu chỉ bấm tổng thời gian, em không biết lãng phí nằm ở đâu. Tách ra thì mới thấy phần nào là máy chạy, phần nào là thao tác tay, phần nào là di chuyển. Ví dụ OP060 có 22.5 giây machine, 20.25 giây human và 2.25 giây walking. Nếu walking cao thì cải tiến layout/U-shape; nếu machine cao thì xem OEE/SMED; nếu human cao thì standard work hoặc đào tạo. Tuy nhiên, đây là giả định các element tuần tự. Nếu máy chạy chồng lấp với thao tác tay, station cycle không còn bằng 45 giây; em phải tách labor content, machine cycle và station cycle.

**Câu 5 — SAM TechPack khác SAM đo thực tế**

> Em không tự động đổi SAM. Em kiểm tra method có giống TechPack không, performance rating có bị chủ quan không, allowance có đúng chính sách không, operator có đúng skill level không, và có thao tác thừa do layout/máy không. Nếu đo lại vẫn lệch, em làm pilot trên một số cycle, ghi nhận bằng chứng, rồi đề xuất approved SAM revision. Trong lúc chưa duyệt, planning vẫn dùng SAM hiện hành và ghi rõ variance.

**Câu 6 — Tránh nhân allowance hai lần**

> Em kiểm tra `sam_basis`. Nếu SAM đã bao gồm allowance (`INCLUDES_ALLOWANCE`) thì khi dùng SAM em đặt `allowance_pct = 0`, không cộng thêm. Tương tự, không nhân thêm planned efficiency vào SAM nếu SAM đã là standard time. Mỗi yếu tố chỉ được tính một lần, và điều này phải được ghi trong `KPI_SPEC.md`.

**Câu 7 — Bao nhiêu cycle, xử lý outlier**

> Thông thường 5–10 cycle cho công đoạn ngắn, nhiều hơn nếu variance cao. Em ghi riêng cycle bất thường và lý do, không xóa âm thầm. Nếu outlier do nguyên nhân rõ ràng như lấy sai bó vải hoặc máy kẹt, em loại khỏi tính average nhưng vẫn ghi chú. Nếu outlier lặp lại, đó có thể là vấn đề method chứ không phải lỗi người.

**Câu 10 — Dùng time study để cân bằng chuyền**

> Em dùng Standard Time của từng operation làm load, vẽ Yamazumi theo station và so với **Effective Takt** (planning) và **Demand Takt**. Station nào vượt Effective Takt là bottleneck theo năng lực kế hoạch; station nào quá thấp là dư tải. Sau đó em tìm cách chuyển operation, giảm thao tác thừa, cải tiến layout hoặc đào tạo skill. Kết quả phải được kiểm tra lại bằng time study mới, không chỉ dựa trên cảm giác.

**Câu 11 — Labor content, operator cycle, machine cycle, station cycle**

> Labor content là tổng thời gian lao động của người, gồm human và walking. Machine cycle là thời gian máy tự chạy. Operator cycle là chu kỳ lặp lại của người. Station cycle là nhịp hoàn thành tại trạm, có xét chồng lấp. Với OP060 tuần tự, labor content 22.5 giây, machine cycle 22.5 giây, station cycle 45 giây. Nếu 10 giây thao tác tay diễn ra trong lúc máy chạy, station cycle chỉ còn 35 giây. Vì vậy không được cộng human + machine + walking máy móc.

**Câu 12 — Demand Takt và Effective Takt**

> Demand Takt là nhịp theo nhu cầu khách hàng: 450 phút × 60 / 420 = 64.29 giây. Effective Takt là nhịp kế hoạch sau khi trừ planned efficiency: 450 × 60 × 85% / 420 = 54.64 giây. 54.64 giây là Planning Cycle Allowance, không phải takt khách hàng. Khi báo cáo phải ghi rõ tên, tránh gọi lẫn.

### 3.14. Checklist hoàn thành

- [ ] Có observation sheet 5–10 cycle
- [ ] Element có điểm bắt đầu/kết thúc rõ
- [ ] Tách element human / machine automatic / walking
- [ ] Có performance rating **theo từng element**, không nhân PR vào machine automatic
- [ ] Có allowance và `allowance_basis` cho từng element
- [ ] Không cộng allowance hai lần
- [ ] Tính NT/ST bằng tay, khớp endpoint
- [ ] OP060 5 cycle được ghi là ví dụ, không phải xác nhận SAM
- [ ] Phân biệt labor content, operator cycle, machine cycle, station cycle
- [ ] Vẽ được Yamazumi với đường Effective Takt, không gọi là Demand Takt
- [ ] So sánh approved SAM với planning SAM
- [ ] Không tự động cập nhật SAM từ optimizer
- [ ] Giải thích được Standard Work 3 yếu tố
- [ ] Có ít nhất 3 câu trả lời phỏng vấn mẫu
- [ ] Chỉ dùng dữ liệu synthetic.

---

## 4. Module 2 — Hourly Production Control <a id="module-2"></a>

### 4.1. Mục tiêu

Theo dõi sản lượng theo giờ để phát hiện gap sớm trong ca, thay vì chờ cuối ca mới biết không đạt. Sau module này phải:

- tính được hourly plan, cumulative plan/actual, production gap;
- đọc được WIP và phân biệt “thiếu người/máy” với “tắc dòng”;
- tính projected end-of-shift output;
- biết khi nào escalate và escalate cho ai;
- biết schema data hourly synthetic.

### 4.2. Khái niệm chính

| Khái niệm | Ý nghĩa | Ghi chú |
|---|---|---|
| Hourly output | Số lượng hoàn thành trong một bucket giờ | Bucket có thể 1h hoặc 0.5h |
| Plan vs Actual | So sánh kế hoạch và thực tế theo từng giờ | Không chỉ so cuối ca |
| Cumulative plan | Tổng kế hoạch đến thời điểm h | `Σ planned_output` |
| Cumulative actual | Tổng thực tế đến thời điểm h | `Σ actual_output` |
| Production gap | Chênh lệch cumulative actual và cumulative plan | Âm = chậm kế hoạch |
| Gap % | Gap chia cumulative plan | Dùng để so mức độ nghiêm trọng |
| WIP | Bán thành phẩm đang nằm giữa các station | WIP cao = tắc dòng |
| Bottleneck | Station giới hạn throughput | Xem workload/Yamazumi |
| Projected output | Dự báo sản lượng cuối ca nếu giữ tốc độ hiện tại | Dùng để quyết định trong ca |
| Escalation | Kích hoạt hỗ trợ khi vượt ngưỡng | Phải có ngưỡng và owner |

### 4.3. Công thức

```text
working_hours = (shift_minutes - break_minutes) / 60
hourly_plan = target_qty / working_hours
cum_plan(h) = Σ planned_output của các bucket đến h
cum_actual(h) = Σ actual_output của các bucket đến h
gap(h) = cum_actual(h) - cum_plan(h)
gap_pct(h) = gap(h) / cum_plan(h) × 100

projected_output(h) =
    cum_actual(h)
    / elapsed_scheduled_production_hours(h)
    × working_hours
```

**Định nghĩa mẫu số:**

`elapsed_scheduled_production_hours` là **thời gian sản xuất theo lịch đã trôi qua**:

- loại trừ giờ nghỉ theo kế hoạch;
- **bao gồm downtime ngoài kế hoạch** đã xảy ra;
- không phải “machine run time” hay “productive time” đã trừ downtime.

Nếu lấy machine run time làm mẫu số, dự báo sẽ bỏ qua downtime và đánh giá năng lực quá cao.

**Lưu ý:**

- Nếu các bucket không đều (có bucket 0.5h), dùng `planned_output` từng bucket, không lấy `hourly_plan × h` máy móc.
- Projected output là **dự báo tuyến tính**, không phải cam kết sản lượng cuối ca.
- Khi có nguyên nhân downtime và phương án recovery, phải có thêm **adjusted forecast**, không chỉ dùng ngoại suy trung bình.
- Không dùng projected output để che gap; nó chỉ là dự báo để hành động.

### 4.4. Ví dụ synthetic — ngày 2026-10-27

Giả sử:

- target 420 pcs;
- shift 480 phút, break 30 phút → 450 phút = 7.5 giờ;
- hourly plan = 420 / 7.5 = 56 pcs/h;
- bucket cuối 15:30–16:00 chỉ 0.5h → plan 28 pcs.

Data synthetic khớp với `DailyProductionActual` ngày 2026-10-27 trong `sample_data.py` (actual 360, downtime 60 phút, attendance 21).

| # | Giờ | Plan | Actual | Cum plan | Cum actual | Gap | Gap % | WIP tại ST05-IN | Downtime | Loss category |
|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| 1 | 08:00–09:00 | 56 | 40 | 56 | 40 | −16 | −28.57% | 15 | 25 | MACHINE |
| 2 | 09:00–10:00 | 56 | 44 | 112 | 84 | −28 | −25.00% | 22 | 0 | — |
| 3 | 10:00–11:00 | 56 | 42 | 168 | 126 | −42 | −25.00% | 30 | 15 | MATERIAL |
| 4 | 11:00–12:00 | 56 | 46 | 224 | 172 | −52 | −23.21% | 38 | 0 | — |
|  | 12:00–12:30 | 0 | 0 | 224 | 172 | −52 | −23.21% | 38 | 0 | — (break) |
| 5 | 12:30–13:30 | 56 | 48 | 280 | 220 | −60 | −21.43% | 35 | 10 | MANPOWER |
| 6 | 13:30–14:30 | 56 | 55 | 336 | 275 | −61 | −18.15% | 30 | 0 | — |
| 7 | 14:30–15:30 | 56 | 55 | 392 | 330 | −62 | −15.82% | 25 | 0 | — |
| 8 | 15:30–16:00 | 28 | 30 | 420 | 360 | −60 | −14.29% | 18 | 10 | QUALITY |

> Break 12:00–12:30 không tính là loss; dòng break chỉ để giữ timeline và cumulative.
>
> WIP trong bảng là WIP tại **buffer ST05-IN**, cap **25 pcs**, không phải tổng WIP toàn chuyền. Muốn kết luận tắc dòng phải xem WIP tại đúng buffer/station.

**Tính projected output tại giờ thứ 4:**

```text
cum_actual = 172
elapsed_scheduled_production_hours = 4.0
  (08:00–12:00, đã bao gồm 40 phút downtime, chưa có break)
projected_output = 172 / 4.0 × 7.5 = 322.5 pcs
gap_vs_target = 322.5 - 420 = -97.5 pcs
```

Kết luận tại giờ thứ 4:

- gap −52 pcs, gap −23.21%;
- projected chỉ 322.5/420 = 76.8%;
- WIP 38 pcs, vượt cap 25;
- **Red escalation ngay**, vì gap < −15% và projected < 90%;
- hành động: báo line manager + planning + HR, chốt phương án recovery, cập nhật rủi ro target.

**Tính projected output tại giờ thứ 6:**

```text
cum_actual = 275
elapsed_scheduled_production_hours = 6.0
projected_output = 275 / 6.0 × 7.5 = 343.75 pcs
```

Dù tốc độ có cải thiện, projected vẫn dưới target. Cuối ca actual 360/420 = 85.7%.

### 4.5. Cách đọc WIP

| Hiện tượng | Cách hiểu | Hành động |
|---|---|---|
| Actual thấp + WIP cao | Tắc dòng, bottleneck hoặc máy dừng | Kiểm tra station có WIP cao nhất, downtime, skill |
| Actual thấp + WIP thấp | Thiếu nguyên liệu, thiếu người, starvation | Kiểm tra cấp phát, attendance, station đầu chuyền |
| Actual cao + WIP cao | Có thể đang overproduction hoặc bù hàng | Kiểm tra quality, pull, có đang làm trước lệnh không |
| Actual cao + WIP thấp | Dòng chảy tốt | Xác nhận quality, không chủ quan |
| WIP tăng liên tục qua nhiều giờ | Bottleneck chưa được giải quyết | Escalate IE/maintenance/quality |

**Nguồn gốc WIP cap 25 pcs:**

- Đây là **giả định synthetic** cho buffer `ST05-IN`, không phải chính sách HBI.
- Cap phải được xác định từ standard WIP, FIFO limit hoặc thiết kế buffer; mỗi buffer/station có cap riêng.
- Không dùng một cap chung cho toàn chuyền nếu chưa có cơ sở.

| Buffer | WIP cap | Cơ sở |
|---|---:|---|
| ST05-IN | 25 pcs | Giả định synthetic cho bài tập; cần validate với line design |
| Các buffer khác | Chưa có | Phải đo/đặt riêng |

**Quy tắc:** Khi WIP tại một buffer > cap, không tiếp tục đẩy hàng vào trước bottleneck; kiểm tra nguyên nhân tại đúng buffer đó.

### 4.6. Escalation rules

| Cấp | Điều kiện | Owner | Hành động | Phản hồi | Tiêu chí đóng |
|---|---|---|---|---|---|
| Vàng | Gap < −5% trong 2 giờ liên tiếp | Line leader + IE | Xác định nguyên nhân, theo dõi giờ tiếp theo | 30 phút | Gap hồi về > −5% trong 2 giờ |
| Cam | Gap < −10% hoặc projected < 95% target | Line leader + IE + Maintenance/Quality | Phân tích loss, lập recovery plan, điều chỉnh trong ca | 30 phút | Có recovery plan và gap cải thiện |
| Đỏ | Gap < −15% hoặc projected < 90% target | Line manager + Planning + HR | Báo quản lý, chốt phương án phục hồi, cập nhật rủi ro target | 15 phút | Target risk được chấp nhận hoặc replan |
| WIP | WIP tại buffer > cap | Line leader + IE | Stop feeding, kiểm tra bottleneck, cân bằng lại | 15 phút | WIP ≤ cap |
| Quality | Defect/rework tăng | Quality + Production | Containment, RCA, không chase output bằng mọi giá | Ngay | Containment xong, defect trend giảm |

**Áp dụng cho ví dụ 12:00 ngày 27/10:**

```text
Gap = −23.21% < −15%
Projected = 76.8% < 90%
→ Cấp Đỏ (Red)
```

**Nguyên tắc:** Escalation phải có timestamp, owner, action, thời gian phản hồi và tiêu chí đóng. Không chỉ ghi “đã báo”.

### 4.7. Data schema synthetic

File mẫu: `docs/data/hourly_actuals.csv`

| Field | Type | Required | Ghi chú |
|---|---|---|---|
| `date` | date | Có | `YYYY-MM-DD` |
| `shift_id` | string | Có | `SHIFT_01` |
| `line_id` | string | Có | `LINE_01` |
| `style_code` | string | Có | `BASIC-TEE-001` |
| `hour_start` | time | Có | `08:00` |
| `hour_end` | time | Có | `09:00` |
| `planned_output` | int | Có | Theo bucket, không luôn bằng 56 |
| `actual_output` | int | Có | Sản lượng hoàn thành trong bucket |
| `buffer_id` | string | Có | Buffer đang đo WIP, ví dụ `ST05-IN` |
| `wip_units` | int | Có | WIP cuối bucket tại đúng buffer, không phải tổng chuyền |
| `wip_cap` | int | Có | Cap của buffer đó |
| `downtime_minutes` | int | Có | Trong bucket |
| `loss_category` | enum | Không | MACHINE/MATERIAL/MANPOWER/QUALITY/CHANGEOVER/OTHER |
| `attendance_hc` | int | Có | HC có mặt |
| `note` | string | Không | Ghi chú ngắn |

**JSON example:**

```json
{
  "date": "2026-10-27",
  "shift_id": "SHIFT_01",
  "line_id": "LINE_01",
  "style_code": "BASIC-TEE-001",
  "hour_start": "08:00",
  "hour_end": "09:00",
  "planned_output": 56,
  "actual_output": 40,
  "buffer_id": "ST05-IN",
  "wip_units": 15,
  "wip_cap": 25,
  "downtime_minutes": 25,
  "loss_category": "MACHINE",
  "attendance_hc": 21,
  "note": "Overlock thread break at ST05"
}
```

### 4.8. Áp dụng vào LineBalance Pro

Hiện có:

- `DailyProductionActual` trong `models.py`;
- `actuals.py` tính actual LE và downtime theo category;
- chưa có `HourlyProductionActual` trong backend.

Quyết định:

- **Chưa thêm module hourly vào backend.** Dùng CSV synthetic cho case study trước.
- Khi làm UI, chỉ cần bảng nhập hourly + đọc CSV; không cần optimizer mới.
- Hourly control là **lớp monitoring**, không phải MILP.
- Dữ liệu hourly phải nối được với `DowntimeEvent` và `DailyProductionActual`.

### 4.9. Câu hỏi phỏng vấn

1. Hourly control khác daily control ở đâu?
2. Em tính production gap và projected output như thế nào?
3. WIP cao nói lên điều gì?
4. Khi nào em escalate, escalate cho ai?
5. Actual thấp + WIP cao khác gì actual thấp + WIP thấp?
6. Làm sao tránh chase output bằng overproduction?
7. Em dùng hourly data để cải tiến chuyền thế nào?
8. Nếu số liệu hourly không đáng tin, em xử lý sao?

### 4.10. Model answers

**Câu 1 — Hourly khác daily ở đâu?**

> Daily control chỉ cho biết cuối ca có đạt hay không, lúc đó đã hết cơ hội sửa. Hourly control chia ca thành các bucket giờ để thấy gap sớm, kiểm tra WIP và downtime ngay trong ca. Mục tiêu là hành động trong ca, không phải báo cáo cuối ca.

**Câu 2 — Tính gap và projected output**

> Em tính cumulative plan và cumulative actual đến giờ hiện tại, gap là hiệu hai số. Projected output lấy cumulative actual chia **elapsed scheduled production hours** — thời gian sản xuất theo lịch đã trôi qua, loại trừ break nhưng **bao gồm downtime ngoài kế hoạch** — rồi nhân với tổng giờ sản xuất của ca. Ví dụ lúc 12:00 ngày 27/10, cumulative actual 172, plan 224, gap −52; 4 giờ đã trôi qua bao gồm 40 phút downtime; projected 172/4×7.5 = 322.5 pcs, thấp hơn target 420 rất xa. Vì gap −23.21% và projected 76.8% đều vượt ngưỡng đỏ, em kích hoạt **Red escalation** ngay.

**Câu 3 — WIP cao nói lên điều gì?**

> WIP cao trước một station thường là dấu hiệu tắc dòng: station đó chậm hơn station trước, hoặc máy dừng, hoặc thiếu skill. WIP cao không có nghĩa là chuyền làm tốt; nó có thể là tiền đang nằm chờ. Em kiểm tra station có WIP cao nhất, downtime và cycle time thực tế.

**Câu 5 — Actual thấp + WIP cao vs WIP thấp**

> WIP cao là tắc dòng, thường do bottleneck hoặc máy dừng. WIP thấp là thiếu đầu vào, thường do nguyên liệu, attendance hoặc station đầu chuyền. Hai nguyên nhân khác nhau nên hành động khác nhau: một cái cần giải phóng bottleneck, một cái cần bổ sung đầu vào.

**Câu 6 — Tránh chase output bằng overproduction**

> Em không cho chạy bù bằng mọi giá. Phải giữ WIP cap, kiểm tra quality và chỉ chạy đúng lệnh. Nếu projected thiếu, em chọn overtime, điều người hoặc replan với planning, không đẩy hàng vào trước bottleneck làm WIP tăng thêm.

### 4.11. Checklist hoàn thành

- [ ] Có hourly plan theo bucket, kể cả bucket 0.5h
- [ ] Tính cumulative plan/actual, gap, gap %
- [ ] Tính projected output tại ít nhất 2 mốc
- [ ] Ghi rõ `elapsed_scheduled_production_hours` bao gồm downtime, loại trừ break
- [ ] Có adjusted forecast khi có recovery plan
- [ ] Có WIP theo giờ, đúng buffer, và WIP cap có cơ sở
- [ ] Có downtime/loss category theo giờ
- [ ] Có escalation rule, owner, thời gian phản hồi và tiêu chí đóng
- [ ] 12:00 ngày 27/10 được ghi là **Red**, không chỉ “escalation”
- [ ] Có file `docs/data/hourly_actuals.csv`
- [ ] Có ít nhất 3 câu trả lời phỏng vấn mẫu
- [ ] Chỉ dùng dữ liệu synthetic.

---

## 5. Module 3 — Lean 8 Wastes <a id="module-3"></a>

### 5.1. Mục tiêu

Nhận diện 8 loại lãng phí trong chuyền may, đo được mức độ và chọn đúng công cụ loại bỏ. Sau module này phải:

- phân biệt value-added, non-value-added cần thiết và lãng phí thuần;
- nhận diện TIMWOODS trong một chuyền may;
- đo waste bằng frequency × time, WIP hoặc defect data;
- xếp hạng waste bằng Pareto;
- chọn countermeasure có owner và KPI;
- không biến mọi thứ thành “lãng phí” mà không có bằng chứng.

### 5.2. Value-added và non-value-added

| Loại | Định nghĩa | Ví dụ trong may |
|---|---|---|
| Value-added (VA) | Làm thay đổi hình dạng, công năng hoặc chất lượng mà khách hàng trả tiền | May cổ, tra tay, diễu lai |
| Non-value-added nhưng cần thiết | Không tạo giá trị trực tiếp nhưng cần cho chất lượng/pháp lý | Kiểm tra quality, đóng gói, ghi nhãn |
| Non-value-added thuần | Không tạo giá trị, có thể loại bỏ | Chờ mex, sửa hàng lỗi, đi lấy bó vải quá xa |

**Quy tắc:** Không xóa mọi NVA cần thiết. Trước hết giảm nó; chỉ xóa khi đã chứng minh không ảnh hưởng chất lượng/an toàn.

### 5.3. TIMWOODS — 8 wastes trong may

| Waste | Định nghĩa | Ví dụ may | Data signal | Countermeasure | KPI |
|---|---|---|---|---|---|
| Transport | Di chuyển nguyên liệu/bán thành phẩm | Bó vải đi 3 lần giữa kho và chuyền | Số trip, khoảng cách | Point-of-use, route, U-shape | Travel distance |
| Inventory | Tồn quá mức cần thiết | WIP 38 pcs trước bottleneck, cap 25 | WIP pcs, WIP days | Kanban, pull, WIP cap | WIP pcs |
| Motion | Thao tác thừa của người | Xoay 180° lấy bó cổ, với tay | Số lần, motion time | Standard work, fixture, bố trí bin | Motion time |
| Waiting | Chờ máy, nguyên liệu, hướng dẫn | Chờ mex 15 phút, máy dừng 25 phút | Downtime, gap, WIP | TPM, call system, cân bằng | Downtime minutes |
| Overproduction | Làm nhiều hơn/trước nhu cầu | May 15 pcs trước khi station sau sẵn sàng | Early output, WIP | Pull, takt, stop feeding | WIP, early output |
| Overprocessing | Làm quá mức cần thiết | Kiểm tra cổ 2 lần, cắt chỉ 2 lần | Cycle time vs standard | Standard work, poka-yoke | Cycle time |
| Defects | Làm lại, sửa, scrap | Rework cổ lệch 10 pcs | Defect rate, FPY, rework hours | DMAIC, poka-yoke, training | FPY |
| Skills | Không dùng hết kỹ năng | Inspector làm gấp áo | Skill matrix, SPOF | Cross-training, job rotation | Skill coverage |

### 5.3.1. Muda — Mura — Muri

Không chỉ có 8 wastes. Lean phân biệt thêm:

| Loại | Ý nghĩa | Ví dụ trong may | Cách giảm |
|---|---|---|---|
| Muda | Lãng phí thuần | 8 wastes ở trên | Loại bỏ, đơn giản hóa |
| Mura | Không đồng đều | Output theo giờ 40, 44, 42, 46 vs plan 56 | Heijunka, cân bằng chuyền, standard work |
| Muri | Quá tải người/máy | Station 56s vượt Effective Takt 54.64s; công nhân với tay quá cao | Line balancing, ergonomics, thiết kế lại trạm |

**Quy tắc:** Mura và Muri thường là **nguyên nhân gốc** của Muda. Ví dụ station quá tải (Muri) gây WIP và chờ (Muda). Vì vậy không chỉ nhìn 8 wastes mà phải kiểm tra cả tính đồng đều và tải.

### 5.4. Waste observation sheet — đo theo từng cơ sở

Không trộn operator-minutes, machine-minutes, line-minutes và pieces. Mỗi dòng phải ghi rõ `measurement_basis`.

Ví dụ synthetic cho ngày 2026-10-27:

| Waste | Station/buffer | Measurement basis | Frequency/shift | Time/occurrence | Time loss | Qty | Evidence |
|---|---|---|---:|---:|---:|---:|---|
| Transport | ST01 | OPERATOR_MINUTES | 3 | 6.0 min | 18.0 min | — | Spaghetti observation |
| Inventory | ST05-IN | PIECES | 1 | — | — | 13 pcs | WIP 38 vs cap 25 |
| Motion | ST08 | OPERATOR_MINUTES | 45 | 0.27 min | 12.15 min | — | Video observation |
| Waiting | ST05 | MACHINE_MINUTES | 1 | 25.0 min | 25.0 min | — | Downtime log |
| Overproduction | ST12-OUT | PIECES | 1 | — | — | 15 pcs | Early output trước khi station sau sẵn sàng |
| Overprocessing | ST03 | OPERATOR_MINUTES | 20 | 0.4 min | 8.0 min | — | Standard work audit |
| Defects | ST12 | OPERATOR_MINUTES | 10 | 3.0 min | 30.0 min | — | Rework log |
| Skills | ST18 | OPERATOR_MINUTES | 30 | 0.67 min | 20.1 min | — | Skill matrix |

File mẫu: `docs/data/waste_observation.csv`

**Lưu ý bắt buộc:**

- **Waiting** ở đây là **25 machine-minutes** tại ST05, không phải 25 line-minutes và không phải 25 operator-minutes.
- **Overproduction** là **15 pcs early output**, không phải 15 phút. Không được gán thời gian nếu chưa đo.
- **Inventory** là **13 pcs vượt cap**, không phải thời gian.
- Các dòng khác nhau về bản chất nên **không cộng thẳng** thành một tổng thời gian lãng phí.

### 5.5. Cách đo waste — bốn cơ sở đo

| Nhóm đo | Đơn vị | Numerator | Denominator | Ví dụ |
|---|---|---|---|---|
| Labor loss | operator-minutes | Human/walking loss | Total direct labor-minutes | 21 × 450 = 9,450 |
| Machine loss | machine-minutes | Machine downtime/loss | Planned machine-minutes | ST05: 450 min |
| Line stoppage | line-minutes | Line stop time | Planned production minutes | Chưa đo |
| Inventory loss | pcs | WIP excess / early output | Standard WIP / buffer capacity | 13 pcs; 15 pcs |

**Công thức:**

```text
Time loss = frequency × time per occurrence

Labor loss % =
    operator-minutes lost / total direct labor-minutes × 100

Machine loss % =
    machine-minutes lost / planned machine-minutes × 100

Line stoppage % =
    line-minutes lost / planned production minutes × 100

WIP excess = WIP actual - WIP cap
```

**Quy tắc:**

- Không cộng operator-minutes với machine-minutes hoặc line-minutes.
- Không suy ra line stoppage từ machine downtime. Máy dừng 25 phút không có nghĩa cả chuyền dừng 25 phút.
- Không đổi pcs sang phút nếu chưa có conversion được validate.
- Nếu hai waste xảy ra đồng thời, ghi overlap riêng hoặc chọn **primary basis**; không đếm hai lần.
- Không quy đổi waste ra tiền nếu chưa có cost data.

### 5.6. Tính toán lại và Pareto theo từng cơ sở

**1. Labor loss — operator-minutes**

```text
Transport       18.00
Motion          12.15
Overprocessing   8.00
Defects         30.00
Skills          20.10
---------------------
Tổng            88.25 operator-minutes

Total direct labor-minutes = 21 × 450 = 9,450
Labor loss % = 88.25 / 9,450 × 100 = 0.93%
```

Đây là **0.93% tổng direct labor-minutes**, không phải 28.5% thời gian chuyền. Con số nhỏ vì đây chỉ là các quan sát chọn lọc trong một ca, không phải toàn bộ loss của chuyền.

**2. Machine loss — machine-minutes**

```text
Waiting tại ST05 = 25.0 machine-minutes

Nếu ST05 có 450 planned machine-minutes:
25.0 / 450 × 100 = 5.56%
```

Nếu tính trên toàn bộ 23 máy, cần tổng planned machine-minutes; không dùng 450 phút cho tất cả máy.

**3. Line stoppage — line-minutes**

Chưa có dữ liệu line stop. **Không được claim 25 line-minutes** từ machine downtime.

**4. Inventory / overproduction — pcs**

```text
WIP excess = 38 - 25 = 13 pcs
Early output = 15 pcs
```

So với standard WIP/buffer capacity. Không quy đổi thành % thời gian khi chưa có cơ sở.

**Pareto labor loss — cùng một cơ sở operator-minutes:**

| Rank | Waste | Operator-minutes | % | Cumulative % |
|---:|---|---:|---:|---:|
| 1 | Defects | 30.00 | 34.0% | 34.0% |
| 2 | Skills | 20.10 | 22.8% | 56.8% |
| 3 | Transport | 18.00 | 20.4% | **77.2%** |
| 4 | Motion | 12.15 | 13.8% | 91.0% |
| 5 | Overprocessing | 8.00 | 9.1% | 100% |
|  | **Tổng** | **88.25** | **100%** |  |

**Đọc Pareto labor:**

- Top 3 labor loss là **Defects, Skills, Transport**, chiếm **77.2%**.
- Waiting không nằm trong Pareto labor vì đang đo bằng machine-minutes.
- Overproduction không nằm trong Pareto labor vì đang đo bằng pcs.
- Muốn Pareto machine loss phải có nhiều machine events cùng đơn vị; hiện chỉ có 1 event.
- Muốn Pareto line stoppage phải có line stop log.

**ASCII chart — labor loss:**

```text
Defects        ████████████████████████ 30.00
Skills         ████████████████ 20.10
Transport      ██████████████ 18.00
Motion         ██████████ 12.15
Overprocessing ███████ 8.00
```

### 5.7. Root cause trước countermeasure

Không nhảy từ waste sang giải pháp. Vòng xử lý đúng:

```text
Observe → Classify → Quantify → Root Cause → Countermeasure
→ Pilot → Verify → Control
```

| Waste ưu tiên | Root cause hypothesis | Cách xác minh |
|---|---|---|
| Defects | Cổ lệch do fixture/method chưa chuẩn | 5 Why, video, Pareto defect theo loại |
| Skills | Inspector bị điều sang gấp áo do thiếu cân bằng/absence | Skill matrix, attendance, standard work |
| Transport | Không có point-of-use bin | Spaghetti diagram, route observation |
| Waiting | Đứt chỉ do tension/thiếu TPM | Machine log, 5 Why, kiểm tra thread path |
| Overproduction | Không có pull signal, chạy trước lệnh | Kiểm tra kanban/WIP tại ST12-OUT |

**Countermeasure matrix — đây là giả thuyết, không phải kết luận:**

| Waste ưu tiên | Quick win (1 tuần) | Structural fix (1 tháng) | Owner | KPI |
|---|---|---|---|---|
| Defects | Containment, 5 Why cho 10 pcs lỗi | Poka-yoke/fixture, đào tạo, chuẩn hóa kiểm tra | Quality + IE | FPY, defect rate |
| Skills | Điều W23 về đúng việc inspection | Cross-training, skill matrix, job rotation | Production + HR | Skill coverage |
| Transport | Đưa bin nguyên liệu gần station | Layout U-shape, route chuẩn | IE + Logistics | Travel distance |
| Waiting | Call system khi máy dừng; kiểm tra mex trước ca | TPM, buffer nguyên liệu, cân bằng lại station | Maintenance + Production | Downtime min |
| Overproduction | Stop feeding khi WIP > cap | Pull system, takt discipline | Production | WIP pcs |
| Motion | Đặt bin trong tầm với | Standard work, fixture, ergonomics | IE | Motion time |
| Overprocessing | Bỏ bước kiểm tra trùng | Standard work, poka-yoke | Quality | Cycle time |
| Inventory | WIP cap theo giờ | Kanban, pull, giảm batch | Planning + Production | WIP pcs |

**Nguyên tắc chọn:** Pareto theo đúng cơ sở → xác minh root cause → pilot một waste → đo before/after → kiểm tra waste khác có tăng không. Không tối ưu cục bộ.

### 5.8. Áp dụng vào LineBalance Pro

- **Line balancing** giảm waiting/imbalance và Mura/Muri giữa station.
- **Skill matrix** giảm skills waste và single point of failure.
- **Layout** giảm transport/motion.
- **Downtime data** là nguồn **machine-minutes**, không tự động là line-minutes.
- **T07 quality case** là nguồn cho defects.
- **T08 Kaizen** là nơi chứng minh before/after và Control Plan.

Không thêm module phần mềm mới. Dùng:

- `docs/data/waste_observation.csv` cho case study;
- `docs/data/hourly_actuals.csv` cho waiting/WIP;
- `sample_data.py` cho downtime/actuals synthetic.

**Các số phải dùng thay cho 28.5% cũ:**

- Labor loss: **88.25 operator-minutes = 0.93%** tổng direct labor-minutes.
- Machine loss tại ST05: **25 machine-minutes = 5.56%** planned machine time của ST05 (nếu có 450 phút).
- Inventory: **13 pcs** vượt cap.
- Early output: **15 pcs**.
- Line stoppage: **chưa đo**, không claim.

**Không gọi machine allocation là machine utilization.** Waste analysis không thay thế OEE.

### 5.9. Câu hỏi phỏng vấn

1. 8 wastes là gì? TIMWOODS gồm những gì?
2. Phân biệt value-added, non-value-added cần thiết và lãng phí thuần.
3. Waste nào thường gặp nhất trong chuyền may?
4. Em đo waste mà không có hệ thống phức tạp như thế nào?
5. WIP cao là waste gì? Tại sao?
6. Làm sao chọn waste để cải tiến trước?
7. Làm sao tránh cải tiến một waste lại làm tăng waste khác?
8. Cho ví dụ overprocessing trong may.
9. Skills waste là gì? Khác gì thiếu người?
10. Liên hệ 8 wastes với line balancing như thế nào?
11. Vì sao không được cộng operator-minutes với machine-minutes và line-minutes?
12. Mura và Muri khác Muda thế nào? Cho ví dụ trong chuyền may.
13. Vì sao phải xác minh root cause trước khi chọn countermeasure?

### 5.10. Model answers

**Câu 1 — 8 wastes / TIMWOODS**

> TIMWOODS là Transport, Inventory, Motion, Waiting, Overproduction, Overprocessing, Defects và Skills. Trong may, transport là bó vải đi quá xa; inventory là WIP quá cao; motion là thao tác thừa; waiting là chờ máy/nguyên liệu; overproduction là may trước nhu cầu; overprocessing là kiểm tra/cắt chỉ thừa; defects là rework; skills là dùng người có tay nghề cao làm việc không cần kỹ năng đó.

**Câu 2 — VA / NVA**

> Value-added là thao tác làm thay đổi sản phẩm mà khách hàng trả tiền, ví dụ may cổ. Non-value-added cần thiết là kiểm tra quality hoặc đóng gói — không tạo giá trị trực tiếp nhưng cần cho chất lượng. Lãng phí thuần là chờ, sửa hàng lỗi, đi lấy bó vải quá xa. Em không xóa mù quáng NVA cần thiết; trước hết giảm nó.

**Câu 5 — WIP cao là waste gì?**

> WIP cao thường là Inventory, và kéo theo Waiting. Hàng nằm chờ trước bottleneck không tạo giá trị, còn làm tăng nguy cơ lỗi và thời gian cycle. Nếu WIP cao mà actual thấp, đó là dấu hiệu tắc dòng chứ không phải chuyền làm tốt.

**Câu 7 — Tránh cải tiến một waste làm tăng waste khác**

> Em luôn kiểm tra tác động chéo. Ví dụ giảm waiting bằng cách chạy máy nhanh hơn có thể tăng defects hoặc overproduction. Vì vậy phải pilot, đo before/after trên nhiều KPI, và kiểm tra WIP/quality chứ không chỉ nhìn output.

**Câu 9 — Skills waste khác thiếu người**

> Thiếu người là không đủ HC. Skills waste là có người nhưng không dùng đúng kỹ năng, ví dụ inspector làm gấp áo trong khi station inspection thiếu. Cách xử lý là skill matrix, cross-training và điều chuyển, không nhất thiết tuyển thêm.

**Câu 10 — 8 wastes với line balancing**

> Line balancing chủ yếu giảm waiting và imbalance giữa station. Nếu station quá tải, WIP sẽ tích tụ trước đó; nếu station dư tải, người và máy bị lãng phí. Kết hợp skill matrix và layout sẽ giảm thêm skills, transport và motion. Nhưng cân bằng chuyền không tự động xóa defects hay overproduction; phải dùng DMAIC và pull.

**Câu 11 — Không cộng operator-minutes, machine-minutes, line-minutes**

> Vì chúng đo những nguồn lực khác nhau. 30 operator-minutes là thời gian lao động bị mất; 25 machine-minutes là thời gian máy dừng; line-minutes là thời gian cả chuyền ngừng; còn WIP là số lượng sản phẩm. Máy dừng 25 phút không có nghĩa cả chuyền mất 25 phút, và cũng không có nghĩa 25 công nhân mỗi người mất 25 phút. Nếu cộng thẳng rồi chia cho 450 phút, con số phần trăm sẽ không có ý nghĩa. Em tách Pareto theo từng cơ sở đo và chỉ so sánh các waste cùng đơn vị.

**Câu 12 — Muda, Mura, Muri**

> Muda là lãng phí thuần, ví dụ chờ, rework, di chuyển thừa. Mura là sự không đồng đều, ví dụ output theo giờ 40, 44, 42, 46 trong khi plan là 56. Muri là quá tải, ví dụ một station 56 giây vượt Effective Takt 54.64 giây hoặc công nhân phải với tay quá cao. Mura và Muri thường là nguyên nhân gốc gây ra Muda, nên không chỉ nhìn 8 wastes.

**Câu 13 — Root cause trước countermeasure**

> Nếu thấy máy dừng 25 phút mà kết luận ngay là “cần mua máy mới” thì có thể sai. Phải xác minh nguyên nhân: đứt chỉ do tension, do thiếu bảo trì, do nguyên liệu hay do thao tác. Em dùng 5 Why, fishbone và dữ liệu downtime để xác minh, sau đó mới chọn countermeasure, pilot, đo before/after và chuẩn hóa bằng Control Plan. Vòng đúng là Observe → Classify → Quantify → Root Cause → Countermeasure → Pilot → Verify → Control.

### 5.11. Checklist hoàn thành

- [ ] Có bảng TIMWOODS gắn với chuyền may
- [ ] Có Muda / Mura / Muri và ví dụ
- [ ] Có waste observation sheet
- [ ] Mỗi dòng có `measurement_basis`
- [ ] Có file `docs/data/waste_observation.csv`
- [ ] Overproduction ghi bằng **pcs**, không ghi 15 phút
- [ ] Inventory ghi bằng **pcs**, có `wip_cap`
- [ ] Waiting ghi rõ machine-minutes, không suy ra line-minutes
- [ ] Không cộng operator-minutes với machine-minutes/line-minutes
- [ ] Có Pareto labor loss top 3
- [ ] Có root cause hypothesis và cách xác minh
- [ ] Có countermeasure + owner + KPI
- [ ] Có ít nhất 3 câu trả lời phỏng vấn mẫu
- [ ] Chỉ dùng dữ liệu synthetic.
- [ ] Không quy đổi ra tiền khi chưa có cost data.
- [ ] Không gọi machine allocation là machine utilization.

---

## 6. Module 4 — DMAIC & Six Sigma <a id="module-4"></a>

### 6.1. Mục tiêu

Biết dùng DMAIC để giải quyết vấn đề chất lượng/năng suất có dữ liệu, không chỉ nói “làm tốt hơn”. Sau module này phải trả lời được: vấn đề là gì, đo bằng gì, nguyên nhân gốc là gì, hành động nào đã thử, và duy trì bằng gì.

### 6.2. Năm bước và deliverable

| Bước | Câu hỏi | Công cụ | Deliverable |
|---|---|---|---|
| Define | Vấn đề là gì, đo bằng gì, ai bị ảnh hưởng? | Problem statement, SIPOC, VOC, CTQ | Scope + baseline + target |
| Measure | Hiện trạng số liệu? | Data collection, Pareto, FPY, baseline | Bảng số liệu + Pareto |
| Analyze | Nguyên nhân gốc là gì? | Fishbone 4M, 5 Why, Pareto, setup audit | Root cause statement + bằng chứng |
| Improve | Giải pháp nào, thử nghiệm ra sao? | Pilot, before/after, countermeasure | Kết quả pilot + điều kiện |
| Control | Duy trì bằng gì? | Control Plan, standard work, audit | Owner/frequency/reaction |

### 6.3. T07 case study — Quality RCA tại OP060

> Chi tiết: `docs/CASE_STUDY_QUALITY_RCA.md`. Dữ liệu: `docs/data/quality_defects.csv`, `docs/data/quality_setup_audit.csv`.

**Tóm tắt kết quả:**

| Chỉ số | Trước | Sau pilot | Delta |
|---|---:|---:|---:|
| Defect | 45 / 1,820 | 18 / 1,820 | −27 (−60.0%) |
| Defect rate | 2.47% | 0.99% | −1.48 pp |
| FPY | 97.53% | 99.01% | +1.48 pp |
| Rework | 135 phút | 54 phút | −81 phút |
| Lệch cổ | 18 (40.0%) | 5 (27.8%) | −72.2% |
| DPMO (1 cơ hội/áo) | 24,725 | 9,890 | −14,835 |
| Z-benchmark (không 1.5σ) | 3.47 | 3.83 | +0.36 |

**Root cause:** collar guide không được lắp lại sau changeover; checklist thiếu guide check; không có first-piece approval; không có owner/audit cho setup standard. Đây là lỗi method/setup control, không phải “operator bất cẩn”.

### 6.4. 5 Why và Fishbone — ví dụ OP060

**5 Why:**

1. Vì sao cổ lệch? → Operator canh cổ bằng mắt, không có guide.
2. Vì sao không có guide? → Guide bị tháo khi changeover và không lắp lại.
3. Vì sao không lắp lại? → Checklist changeover không có bước kiểm tra guide.
4. Vì sao checklist không có? → Setup standard chưa cập nhật sau khi guide được đưa vào.
5. Vì sao chưa cập nhật? → Không có owner/audit; setup dựa vào trí nhớ.

**Fishbone 4M:**

| Nhóm | Câu hỏi kiểm tra | Bằng chứng cần có |
|---|---|---|
| Man | Có phải một người làm sai? | Defect theo operator/shift, training record |
| Machine | Tension/needle/guide có đúng? | Maintenance log, machine check |
| Method | Có guide, first-piece, SOP? | Setup audit, checklist, SOP |
| Material | Interlining/thickness có biến thiên? | Incoming inspection, lot traceability |

**Quy tắc:** không chọn root cause chỉ vì “nghe hợp lý”. Phải có dữ liệu hoặc phép thử xác minh. Trong T07, setup audit cho thấy guide chỉ 1/5 changeover, first-piece check 2/5, và 14/18 lệch cổ xảy ra trong 2 giờ sau changeover.

### 6.5. Control Plan T07

| KPI / hành vi | Target | Tần suất | Owner | Reaction |
|---|---:|---|---|---|
| Defect rate OP060 | ≤1.50% | Daily | QC | >1.50% 2 ngày → mở lại 5 Why |
| FPY | ≥98.50% | Daily | Production | <98.50% 2 ngày → escalation |
| Lệch cổ | ≤2 pcs/ngày | Daily | Line Engineer | >2 pcs/ngày → dừng, kiểm tra guide |
| Guide presence | 100% | Mỗi changeover | Supervisor | Thiếu → dừng setup, first-piece lại |
| First-piece approval | 100% | Mỗi changeover | QC | Không sign-off → không sản xuất |

### 6.5.1. Six Sigma metrics — chạy thêm

> Chi tiết và caveat: `docs/CASE_STUDY_QUALITY_RCA.md` §6A.

```text
DPMO = defects / opportunities × 1,000,000
Z_benchmark = 0.8406 + sqrt(29.37 − 2.221 × ln(DPMO))
```

| Chỉ số | Trước | Sau |
|---|---:|---:|
| DPMO (1 cơ hội/áo) | 24,725 | 9,890 |
| Z-benchmark (không 1.5σ) | 3.47 | 3.83 |

**Two-proportion z-test:** z = 3.43; p ≈ 0.0006 (2 phía); 95% CI 0.64–2.33 điểm %.

**p-chart** (364 pcs/ngày): trước p̄ = 2.47%, UCL = 4.91%, LCL = 0.03%; sau p̄ = 0.99%, UCL = 2.55%, LCL = 0%. Cả 5 điểm mỗi giai đoạn trong limit; đây là level shift, không phải special-cause trong giai đoạn.

**Caveat:** synthetic, 1 cơ hội/áo, giả định inspection độc lập, chỉ 5 điểm; không claim “Six Sigma certified” hoặc production significance.

### 6.6. Câu hỏi phỏng vấn

1. DMAIC khác gì với “làm cải tiến” thông thường?
2. Làm sao xác định đúng vấn đề và CTQ?
3. Làm sao tránh đổ lỗi cho công nhân?
4. Làm sao xác minh root cause mà không cần đầu tư lớn?
5. Khi nào dừng DMAIC và chuyển sang control?

**Model answer ngắn — câu 3:**

> Em tách 4M và kiểm tra bằng chứng từng nhóm. Nếu nhiều operator cùng lỗi, máy bình thường, nhưng guide chỉ có 1/5 changeover và first-piece check 2/5, thì vấn đề nằm ở method/setup control. Em không kết luận “công nhân bất cẩn” khi chưa tách ảnh hưởng của hệ thống.

**Model answer ngắn — câu 4:**

> Em dùng setup audit và pilot. Audit cho thấy guide thiếu ở 4/5 changeover; 14/18 lệch cổ xảy ra trong 2 giờ sau changeover. Sau khi restore guide và thêm first-piece, lệch cổ giảm 72.2%. Đó là bằng chứng pilot, không phải chỉ suy luận.

### 6.7. Checklist hoàn thành

- [x] Có problem statement + scope + CTQ.
- [x] Có dữ liệu defect synthetic theo ngày/type.
- [x] Có Pareto trước/sau.
- [x] Có FPY và rework calculation.
- [x] Có fishbone 4M và 5 Why.
- [x] Có root cause verification bằng setup audit.
- [x] Có countermeasure + owner + due date.
- [x] Có before/after cùng kỳ, cùng sản lượng.
- [x] Có Control Plan với reaction.
- [x] Có DPMO và Z-benchmark minh họa, ghi rõ 1 cơ hội/áo.
- [x] Có two-proportion z-test + 95% CI và p-chart minh họa.
- [x] Không claim “Six Sigma certified” hoặc production significance từ dữ liệu synthetic.
- [x] Không claim nhân quả tuyệt đối; không quy đổi tiền khi chưa có cost data.

---

## 7. Module 5 — Kaizen A3 & Control Plan <a id="module-5"></a>

### 7.1. Mục tiêu

Viết được A3 một trang: vấn đề, hiện trạng, nguyên nhân, hành động, kết quả, duy trì. A3 không phải “báo cáo dài”; A3 là công cụ suy nghĩ và align với các bộ phận.

### 7.2. Cấu trúc A3

1. Background — vì sao phải làm.
2. Current condition — số liệu hiện tại.
3. Goal — target đo được.
4. Root cause — nguyên nhân đã xác minh.
5. Countermeasures — hành động cụ thể.
6. Implementation plan — ai, khi nào, ở đâu.
7. Before/after — kết quả cùng đơn vị.
8. Follow-up / Control — duy trì.

### 7.3. T08 A3 — Line rebalancing

> Chi tiết: `docs/CASE_STUDY_KAIZEN.md`. Chi phí: `docs/data/kaizen_cost_model.csv`.

| Phần | Nội dung |
|---|---|
| Background | Target 420; baseline 24/24/61.0s; capacity 376.2; thiếu 43.8 pcs/shift; LBE 72.34%. |
| Current condition | Bottleneck ST24 61.0s (OP260/270/400); ST03 60.0s; station đầu 20–28s; target 89.58%. |
| Goal | Bottleneck ≤58.0s; LBE ≥78%; capacity ≥390; workers ≤24; không vi phạm constraints. |
| Root cause | First-fit chỉ feasible, không global balance; operation cuối dồn ST24; thiếu rebalance định kỳ. |
| Countermeasures | MILP/HiGHS rebalance; tách operation cuối; redeploy 1 worker; standard work/training; daily control. |
| Implementation | Day 1 data validation; Day 2 solve/layout; Day 3 pilot/redeploy; Day 4 standardize; Day 5 review. |
| Results | 23/23/58.0s; LBE 79.39%; capacity 395.7; target 420 achievement 94.21%; estimated saving 11.7M VND/month; payback 1.03 months. |
| Follow-up | Control Plan; target 420 vẫn mở; xem xét 26-worker scenario hoặc giảm SAM; audit weekly. |

### 7.4. Cost saving — estimated vs verified

**Công thức:**

```text
Estimated labor saving
    = số worker giảm × paid hours/shift × labor rate × working days

Net saving
    = estimated saving − implementation cost

Payback (months)
    = implementation cost / estimated saving per month
```

**Ví dụ T08:**

```text
1 worker × 7.5 h × 60,000 VND/h × 26 days = 11,700,000 VND/month
Implementation cost = 12,000,000 VND
Net month 1 = −300,000 VND
Payback = 12,000,000 / 11,700,000 = 1.03 months
```

**Sensitivity:** payback **0.88–1.23 tháng** khi labor rate 50–70k VND/h và 22–26 ngày; break-even rate **61,538 VND/h** tại 26 ngày; break-even **26.67 ngày** tại 60k/h. Chi tiết: `docs/CASE_STUDY_KAIZEN.md` §7.6.

**Ba quy tắc bắt buộc:**

1. **Estimated saving** dựa trên giả định; **verified saving** phải dựa trên payroll/timekeeping, redeploy confirmation và Finance xác nhận.
2. Không gọi unit cost reduction là cash saving. Ví dụ T08: unit labor cost giảm 2,550 VND/pc, nhưng phần lớn là productivity gain từ sản xuất thêm pcs; cash saving thực tế chỉ 11.7M VND/month từ giảm 1 worker.
3. Nếu worker không được redeploy, cash saving = 0; chỉ có capacity gain. Không claim saving trên giấy.

**Điều kiện verified:**

- Cùng line/style/sản lượng, ít nhất 4 tuần trước/sau.
- Payroll xác nhận số người thực tế.
- Không có overtime/temporary worker bù vào.
- Không thay đổi SAM/method khác trong cùng kỳ.
- Finance xác nhận cost center.

### 7.5. Control Plan T08

| KPI / hành vi | Target | Tần suất | Owner | Reaction |
|---|---:|---|---|---|
| Bottleneck | ≤58.0s | Daily | Line Engineer | >58.0s 2 ca → kiểm tra assignment/skill/machine; re-run optimizer |
| LBE | ≥78.0% | Daily | IE | <76% 2 ngày → review station loads |
| Capacity | ≥390 pcs/shift | Daily | Production | <380 2 ngày → downtime/attendance/WIP RCA |
| Target 420 | Ghi rõ gap | Daily | Production Manager | <90% 2 ngày → escalation; không claim đạt |
| Workers on line | 23 | Daily | Supervisor/HR | >23 → xác nhận redeploy; <23 → skill coverage |
| Labor cost / pc | ≤26,500 VND/pc | Weekly/monthly | Finance/IE | >26,500 2 tuần → review redeploy/productivity |
| Standard work | 100% station | Weekly | IE | Sai → retrain, cập nhật SOP |

### 7.6. Câu hỏi phỏng vấn

1. A3 khác gì báo cáo thường?
2. Vì sao phải tách estimated và verified saving?
3. Làm sao biết Kaizen thực sự tiết kiệm?
4. Nếu target vẫn không đạt thì báo cáo thế nào?
5. Làm sao duy trì kết quả sau Kaizen?

**Model answer ngắn — câu 2:**

> Estimated saving dựa trên giả định về labor rate, số ngày, redeploy. Verified saving phải có payroll/timekeeping, xác nhận redeploy và Finance. Nếu không tách, rất dễ claim một con số đẹp nhưng không có tiền thật.

**Model answer ngắn — câu 3:**

> Em so cùng kỳ, cùng sản lượng, cùng cơ cấu sản phẩm; kiểm tra số người thực tế, overtime, temporary worker; tính net saving = baseline cost − post cost − implementation cost. Nếu worker vẫn ở line, em không ghi saving; chỉ ghi capacity gain.

### 7.7. Checklist hoàn thành

- [x] Có A3 một trang cho T08.
- [x] Có before/after cùng đơn vị, cùng kỳ.
- [x] Có estimated và synthetic verified saving.
- [x] Có sensitivity payback theo labor rate/số ngày và break-even.
- [x] Có điều kiện redeploy rõ ràng.
- [x] Có Control Plan với owner/frequency/reaction.
- [x] Không claim target 420 đạt.
- [x] Không claim OEE/machine utilization.
- [x] Không quy đổi unit cost thành cash saving.
- [x] Chỉ dùng dữ liệu synthetic.

---

## 8. Module 6 — OEE & Downtime <a id="module-6"></a>

### 8.1. Mục tiêu

OEE đo **hiệu quả của một máy khi máy đã được lên lịch chạy**. Nó không đo mức bận rộn và không đo năng lực của cả line. Sau module này phải:

- tính Availability, Performance, Quality và OEE từ log máy theo giờ và theo ca;
- quy mọi tổn thất về **phút** để đọc và so sánh được;
- biết khi nào OEE **không áp dụng** (station do người quyết định nhịp);
- chọn countermeasure cho loss lớn nhất, có owner và KPI.

### 8.2. Khái niệm chính

| Khái niệm | Ý nghĩa | Ghi chú |
|---|---|---|
| Planned production time | Thời gian máy được lên lịch sản xuất | Trừ giờ nghỉ theo kế hoạch; ca 480 − 30 break = 450 phút |
| Downtime (A loss) | Máy không chạy trong thời gian đã lên lịch | Breakdown + changeover |
| Run time | Planned − downtime | Thời gian máy thực sự ở trạng thái chạy |
| Minor stop | Dừng ngắn (kẹt, cần gạt, gỡ chỉ) nằm trong run time | Thuộc P, không trừ khỏi run time |
| Ideal cycle time | Thời gian tối thiểu của máy cho 1 pcs | Lấy từ spec máy hoặc element máy tự chạy; **không allowance, không nhân PR, không phải SAM** |
| Total count | Số pcs máy xử lý trong run time | Gồm cả pcs lỗi |
| Good count | Pcs đạt ngay lần đầu tại máy | Rework tính là lỗi (first-pass), đồng nhất với FPY Module 4 |

**6 big losses** và nhóm A/P/Q:

| Loss | Thuộc | Đo bằng | Ví dụ may |
|---|---|---|---|
| Breakdown | Availability | phút | Heater ép form trip |
| Setup / changeover | Availability | phút | Đổi size form |
| Idling & minor stop | Performance | phút (trong run) | Form kẹt, cần gạt |
| Reduced speed | Performance | pcs thiếu so với ideal | Máy chạy 45 s/pc thay vì 40 s |
| Startup / process reject | Quality | pcs | Sản phẩm đầu ca bị cháy |
| Production defect / rework | Quality | pcs | Ố, bóng, nhăn |

### 8.3. Công thức

```text
Availability = Run time / Planned production time
             = (Planned − Breakdown − Changeover) / Planned

Performance  = (Ideal cycle time × Total count) / Run time
             = (ideal_sec × total) / (run_min × 60)

Quality      = Good count / Total count

OEE          = Availability × Performance × Quality
```

**Đồng nhất thức theo thời gian** (dùng để kiểm tra số liệu):

```text
Planned time = Valuable operating time + Quality loss time
             + Performance loss time + Downtime

Valuable operating time = Good count × Ideal cycle time
Quality loss time       = Defect count × Ideal cycle time
Performance loss time   = Run time − Total count × Ideal cycle time
OEE                     = Valuable operating time / Planned time
```

**Quy tắc kiểm tra:**

- Nếu **P > 100%**, ideal cycle đang sai (quá cao hoặc sai đơn vị), không phải máy chạy vượt chuẩn. Sửa ideal trước khi đọc kết quả.
- Nếu đồng nhất thức không khớp, log đang phân loại thời gian sai; không báo OEE.

### 8.4. Khi nào áp dụng OEE — và khi nào không

**Điều kiện để tính OEE cho một máy:**

1. Máy là **pacer** của chu kỳ: thời gian máy chạy ≥ thời gian thao tác tay của người trong cùng chu kỳ. Kiểm tra bằng time study (Module 1).
2. Có ideal cycle time từ spec máy hoặc element máy tự chạy trong time study.
3. Có log downtime theo phút và count/good count trong cùng khoảng thời gian.

**Bẫy: tính OEE cho station do người quyết định nhịp.**

Lấy ví dụ OP060 ở Module 1: máy may tự chạy **20.0 s**, nhưng station cycle là **45.0 s** vì người và máy làm tuần tự. Nếu lấy:

```text
"Performance" = 20.0 / 45.0 = 44.44%
```

con số này là **pacing loss của người**, không phải performance loss của máy. Cải tiến đúng là standard work và cân bằng thao tác tay (Module 1, 7), không phải bảo trì máy. **Kết luận: OEE = N/A cho station đó**; dùng Station efficiency, LBE và Actual labor efficiency.

**Các bẫy khác:**

- OEE 73% **không** có nghĩa máy bận 73%. Ví dụ §8.5: máy có năng lực 675 pcs/ca, chỉ ra 507 pcs thì loading là 75.1%. Đây là loading, không phải OEE và không phải utilization.
- OEE cao không chứng minh line đủ hàng. Máy có thể chạy tốt nhưng đứng chờ vật tư (starvation), hoặc ra quá nhiều (overproduction, Module 3). Starvation phải đo riêng, không đổ vào máy.
- Không suy OEE từ tổng downtime hay từ số máy allocation (`KPI_SPEC.md` §12).

### 8.5. Ví dụ synthetic — PRESS-01 (máy ép form thân áo)

> **Synthetic.** Máy `PRESS-01` (nhóm IRON), `LINE_01`, `BASIC-TEE-001`, ca 1 ngày 2026-10-27. Ideal cycle **40.0 s/pc** (spec giả định, không allowance). Giả định người đặt/lấy form < 40 s để máy là pacer — **chưa xác nhận bằng time study trong bộ dữ liệu này**. Không liên kết với dữ liệu HBI. File: `docs/data/oee_machine_log.csv`.

Planned production time = 450 phút (08:00–12:00 và 12:30–16:00), cùng cấu trúc bucket với Module 2.

**Theo giờ:**

| Giờ | Plan | Breakdown | Changeover | Run | Total | Good | A | P | Q | OEE |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 08:00–09:00 | 60 | 0 | 15 | 45 | 58 | 57 | 75.00% | 85.93% | 98.28% | 63.33% |
| 09:00–10:00 | 60 | 0 | 0 | 60 | 80 | 78 | 100.00% | 88.89% | 97.50% | 86.67% |
| 10:00–11:00 | 60 | 20 | 0 | 40 | 53 | 51 | 66.67% | 88.33% | 96.23% | 56.67% |
| 11:00–12:00 | 60 | 0 | 0 | 60 | 76 | 73 | 100.00% | 84.44% | 96.05% | 81.11% |
| 12:30–13:30 | 60 | 0 | 0 | 60 | 80 | 79 | 100.00% | 88.89% | 98.75% | 87.78% |
| 13:30–14:30 | 60 | 5 | 0 | 55 | 74 | 72 | 91.67% | 89.70% | 97.30% | 80.00% |
| 14:30–15:30 | 60 | 0 | 25 | 35 | 47 | 46 | 58.33% | 89.52% | 97.87% | 51.11% |
| 15:30–16:00 | 30 | 0 | 0 | 30 | 39 | 37 | 100.00% | 86.67% | 94.87% | 82.22% |

Lưu ý: OEE theo ca **không** lấy trung bình các OEE theo giờ. Tính lại từ tổng phút và tổng count.

**Theo ca:**

```text
Planned     = 450 min
Breakdown   =  25 min   (10:00–11:00: 20; 13:30–14:30: 5)
Changeover  =  40 min   (08:00–09:00: 15; 14:30–15:30: 25)
Run         = 385 min
Total       = 507 pcs;  Good = 493;  Defect = 14

A = 385 / 450                   = 85.56%
P = 40 × 507 / (385 × 60)       = 87.79%
Q = 493 / 507                   = 97.24%
OEE = 85.56% × 87.79% × 97.24%  = 73.04%
```

**Đồng nhất thức theo thời gian:**

| Thành phần | Phút | % của 450 |
|---|---:|---:|
| Valuable operating time (493 × 40 s) | 328.67 | 73.04% |
| Quality loss (14 × 40 s) | 9.33 | 2.07% |
| Performance loss (385 − 507 × 40 s) | 47.00 | 10.44% |
| Downtime (25 breakdown + 40 changeover) | 65.00 | 14.44% |
| **Tổng** | **450.00** | **100% (làm tròn)** |

Performance loss 47.00 phút gồm **minor stop đo được 23 phút** (2+4+3+6+5+2+0+1) và **24 phút speed/hesitation chưa tách được**. Đây là khoảng trống dữ liệu; không gán nguyên nhân khi chưa đo cycle thực tế.

**Đọc kết quả:**

- Loss lớn nhất là **changeover 40 phút** (61.5% downtime), không phải hỏng máy.
- Breakdown 25 phút (38.5% downtime) tập trung lúc 10:00–11:00: giờ này A chỉ 66.67%, OEE 56.67%.
- Performance loss 47 phút là phần lớn thứ hai, nhưng 24 phút chưa có nguyên nhân.
- Quality chỉ mất 9.33 phút. 14 pcs lỗi không phải ưu tiên đầu tiên.

### 8.6. Countermeasure theo loss

| Loss | Phút | Hành động | Owner | KPI |
|---|---:|---|---|---|
| Changeover | 40 | Chuẩn bị form size kế tiếp trước khi dừng (external setup); cố định vị trí và nhiệt độ; checklist đổi size | Line Engineer + Maintenance | Changeover min; mục tiêu ≤ 8.5 phút theo §10.9 (Module 8) |
| Breakdown (heater, van hơi) | 25 | PM heater và van hơi; kiểm tra đầu ca; ghi log theo nguyên nhân | Maintenance | Breakdown min/ca; số lần trip |
| Minor stop | 23 | Quay video form jam; xác định nguyên nhân; cải tiến guide | IE | Số lần minor stop/ca |
| Speed / hesitation | 24 (chưa tách) | Đo cycle thực tế bằng video hoặc time study trên nhiều cycle | IE | Cycle thực tế so với 40 s |
| Quality | 9.33 (14 pcs) | Kiểm nhiệt độ sau startup và sau changeover; ghi defect theo loại | Quality + Operator | Defect rate, first-pass |

**Nguyên tắc:** sửa loss lớn nhất trước, đo lại, rồi mới chuyển sang loss kế tiếp. Không tối ưu P khi 65 phút downtime chưa được xử lý.

### 8.7. Dữ liệu cần có và mapping loss_category

Log OEE cần tối thiểu các trường: `date`, `machine_id`, `hour_start`, `hour_end`, `planned_minutes`, `breakdown_minutes`, `changeover_minutes`, `minor_stop_minutes`, `ideal_cycle_sec`, `total_count`, `good_count`, `data_policy`.

Mapping từ `loss_category` của Module 2 (`docs/data/hourly_actuals.csv`):

| loss_category | Xử lý trong OEE máy |
|---|---|
| MACHINE | Breakdown → Availability |
| CHANGEOVER | Changeover → Availability |
| QUALITY | Chỉ tính một lần: nếu pcs lỗi đã trừ khỏi good count thì không trừ thêm thời gian |
| MATERIAL, MANPOWER | Starvation hoặc thiếu người → **không** tính vào OEE máy; báo cáo riêng |
| OTHER | Phải phân loại trước khi dùng; không đưa vào OEE |

**Quy tắc:** không đếm hai lần cùng một tổn thất ở cả thời gian và số lượng. Cùng nguyên tắc với Module 3: không cộng operator-minutes, machine-minutes và pcs.

### 8.8. Câu hỏi phỏng vấn

1. OEE là gì và gồm những thành phần nào?
2. Vì sao em không tính OEE cho station thủ công?
3. Ideal cycle time lấy từ đâu? Vì sao không dùng SAM?
4. Performance lớn hơn 100% nghĩa là gì?
5. Minor stop nằm ở Availability hay Performance? Vì sao?
6. OEE 73% có nghĩa là máy bận 73% không?
7. Làm sao tách changeover khỏi breakdown trong log?
8. OEE cao nhưng line thiếu hàng, em kết luận gì?

### 8.9. Model answers

**Câu 2 — Vì sao không tính OEE cho station thủ công?**

> OEE đo hiệu quả của máy khi máy là pacer. Với OP060 trong ví dụ, máy tự chạy 20 giây nhưng station cycle là 45 giây, vì người và máy làm tuần tự. Nếu em chia 20 cho 45 thì ra 44%, nhưng con số đó phản ánh thao tác tay, không phải máy hỏng hay chạy chậm. Em sẽ dùng station efficiency và cân bằng thao tác, không đổ cho bảo trì.

**Câu 3 — Ideal cycle lấy ở đâu, vì sao không dùng SAM?**

> Ideal cycle là thời gian tối thiểu của máy cho một pcs. Em lấy từ spec máy hoặc element máy tự chạy trong time study, không có allowance và không nhân PR. SAM có allowance cho người và nhu cầu cá nhân, nên SAM lớn hơn thời gian máy tối thiểu. Nếu dùng SAM làm ideal, P sẽ bị thổi phồng.

**Câu 5 — Minor stop nằm ở A hay P?**

> Ở P. Minor stop nằm trong run time: máy vẫn ở trạng thái sẵn sàng nhưng ra ít pcs hơn chuẩn. Nếu trừ nó khỏi run time, em sẽ đánh giá A quá thấp và khó phân biệt với breakdown. Breakdown và changeover mới là tổn thất Availability.

**Câu 8 — OEE cao nhưng line thiếu hàng**

> OEE chỉ nói máy làm tốt khi được lên lịch chạy. Nếu line thiếu hàng, nguyên nhân có thể là starvation, thiếu người hoặc planning. Em tách MATERIAL và MANPOWER khỏi OEE, báo cáo riêng, và không kết luận máy ổn chỉ vì OEE cao.

### 8.10. Giới hạn

- Một máy, một ca, dữ liệu synthetic; không đại diện PRESS-01 thật hay HBI.
- Giả định máy là pacer chưa được xác nhận bằng time study.
- 24 phút speed/hesitation chưa tách được; cần video hoặc log cycle.
- Chưa có planned external stop (starvation) để áp dụng đầy đủ định nghĩa planned production time.
- Không quy đổi OEE hay downtime thành tiền (quy tắc Module 5).

### 8.11. Checklist hoàn thành

- [x] Có định nghĩa planned production time, A/P/Q và ideal cycle time.
- [x] Có bảng 6 big losses map sang A/P/Q.
- [x] Có công thức và đồng nhất thức theo thời gian.
- [x] Có điều kiện áp dụng OEE và ví dụ station thủ công bị sai (44.44%).
- [x] Có log synthetic theo giờ `docs/data/oee_machine_log.csv`, ghi rõ SYNTHETIC.
- [x] Tính A/P/Q/OEE theo giờ và theo ca; đồng nhất thức khớp 450.00 phút.
- [x] Có Pareto downtime và countermeasure với owner/KPI.
- [x] Có mapping loss_category và quy tắc không đếm hai lần.
- [x] Có ít nhất 3 câu trả lời phỏng vấn mẫu.
- [x] Không đưa OEE vào API; phần mềm vẫn hiển thị `N/A`.
- [x] Không gọi OEE là machine utilization hay loading.
- [ ] Time study xác nhận PRESS-01 là pacer — cần đo thật.
- [ ] Tách 24 phút speed/hesitation — cần video hoặc cycle log.

### 8.12. Trạng thái

`[x]` knowledge và ví dụ synthetic đầy đủ. `[~]` software: chưa có OEE trong backend/API; phần mềm hiển thị `N/A`. Hai mục chưa tick ở §8.11 cần dữ liệu thật; đây không phải lỗi nội dung.

---

## 9. Module 7 — Layout & Ergonomics <a id="module-7"></a>

### 9.1. Mục tiêu

Thiết kế dòng vật tư và vị trí làm việc để giảm transport/motion mà không tạo thêm WIP, starvation, rủi ro ergonomics hay chặn lối đi. Sau module này phải:

- vẽ spaghetti diagram theo tuyến đi thật, không đo đường chim bay;
- phân biệt material flow với operator motion;
- chọn POU/FIFO hoặc dạng layout phù hợp với routing và sản lượng;
- đánh giá ergonomic/safety risk bằng quan sát và EHS, không tự bịa điểm số;
- đo before/after cùng phạm vi, và không claim tiết kiệm lao động nếu chỉ chuyển việc sang Material Handler.

### 9.2. Khái niệm và layout types

| Thuật ngữ | Ý nghĩa | Lưu ý |
|---|---|---|
| Spaghetti diagram | Bản đồ tuyến đi của người/vật liệu theo đường thực tế | Có thể dùng màu khác nhau cho operator, material handler, bundle |
| Material flow | Hướng dịch chuyển nguyên liệu → WIP → thành phẩm | Giữ FIFO, hạn chế backtracking/crossing |
| POU (point of use) | Vật tư cần dùng được đặt gần nơi dùng | Có min/max, owner replenishment; không biến thành kho/WIP lớn |
| FIFO lane | Lane cấp trước lấy trước | Capacity và reorder trigger phải có căn cứ |
| U-shaped cell | Đầu vào/đầu ra gần nhau, các operation bố trí quanh cell | Có thể hỗ trợ giao tiếp/flexible staffing; không mặc định tốt hơn line thẳng |
| Reach zone | Vùng operator có thể lấy/đặt khi giữ tư thế thoải mái | Cần thử với người dùng/đánh giá EHS; không đặt kích thước chung khi thiếu tiêu chuẩn site |

| Dạng layout | Phù hợp khi | Rủi ro/trade-off |
|---|---|---|
| Straight line | Volume cao, routing ổn định, flow một chiều | Tuyến dài, crossings và điểm cấp liệu xa |
| U-shaped | Operation gần nhau, cần trao đổi hoặc linh hoạt người | Congestion, crossing ở miệng U, guarding/egress |
| L-shaped | Nhà xưởng có giới hạn hình học | Góc có thể thành bottleneck hoặc tăng quay đầu |
| Process/functional | Nhiều style/routing khác nhau | Transport, WIP và khó kiểm soát FIFO nếu không có pull |

**Nguyên tắc:** chọn layout sau khi map flow, constraints máy/guarding, material supply, quality gate, aisle/egress và ergonomics. Không đổi cả line chỉ vì U-shape nghe có vẻ Lean.

### 9.3. Spaghetti diagram — cách đo

1. Chốt scope: line/station, ca, product/style, người hoặc vật liệu, start/end.
2. Vẽ footprint có máy, rack, aisle, exit, guard và điểm WIP; ghi scale nếu drawing có scale.
3. Theo dõi ít nhất nhiều chu kỳ/tuyến đại diện, ghi path, frequency, distance, time, load/carry, waiting và aisle crossing riêng.
4. Đo theo **aisle/path được phép**, không vẽ xuyên tường/máy để lấy khoảng cách ngắn.
5. Tách từng loại resource. `operator-minutes`, `handler-minutes`, `machine-minutes`, meters và pcs không cộng chéo.
6. Xác minh với operator, material handler, supervisor, Quality, Maintenance và EHS trước khi đề xuất.

```text
Distance / shift = mean measured route distance × trips per shift
Travel time / shift = mean measured trip time × trips per shift
Change (%) = (before − after) / before × 100
```

Không đổi distance sang time nếu chưa đo walking speed/route time; không lấy trip time làm pure walking time nếu có chờ, scan hoặc tìm vật tư.

### 9.4. Material flow và POU

- Đặt vật tư thường dùng tại POU, nhưng ngoài aisle, exit, fire equipment, machine guard và vùng thao tác.
- Dùng FIFO/two-bin/min-max hoặc milk run với `owner`, trigger, frequency, container và escalation rõ.
- Bin size dựa trên usage rate × replenishment lead time + buffer đã được duyệt; không chọn tùy tiện để giảm trip.
- Theo dõi material availability, WIP cap và starvation. Không đẩy batch lớn để operator khỏi đi lấy vật tư.
- Nếu có Material Handler, đo riêng thời gian và route của handler. Giảm motion cho operator có thể chỉ chuyển motion sang handler.
- Hạn chế cross-flow giữa raw material, finished goods, rework và pedestrian/forklift traffic.

### 9.5. Case study synthetic — POU tại ST01

> Chi tiết và sơ đồ: `docs/CASE_STUDY_LAYOUT_ERGONOMICS.md`, `docs/layout_study_before_after.svg`. Log: `docs/data/layout_route_observations.csv`.

Case dùng baseline Module 3: 3 trips/shift × 6 min = 18 operator-min tại ST01. Năm trial synthetic mỗi giai đoạn cho các giá trị sau:

| Chỉ số | Before | After synthetic | Công thức |
|---|---:|---:|---|
| Round trip | 43.6 m, 6.0 min | 12.8 m, 2.0 min | Mean của 5 trials |
| Distance / shift | 130.8 m | 38.4 m | mean distance × 3 trips |
| Operator time / shift | 18.0 min | 6.0 min | mean time × 3 trips |
| Distance reduction | — | 70.64% | (130.8 − 38.4) / 130.8 |
| Operator time reduction | — | 66.67% | (18 − 6) / 18 |
| Aisle crossings / shift | 6 | 0 | 2 vs 0 crossings/trip × 3 |

**Thiết kế:** two-bin line-side POU tại ST01; Material Handler bổ sung theo milk run. Giữ nguyên số lần replenishment, routing, machine, WIP cap và station sequence.

**Giới hạn:** handler time không có trong số sau; vì vậy 12 operator-min là movement time avoided ở ST01, **không phải net labor/cash saving**. Cả data và after pilot là synthetic, chưa phải production evidence. Không có dữ liệu throughput để claim output tăng.

### 9.6. U-shaped cell — quyết định có điều kiện

U-shape có thể rút ngắn khoảng cách đầu-cuối và giúp một nhóm nhỏ trao đổi/điều phối, nhưng chỉ phù hợp khi operation sequence, skill, machine guarding, material supply và egress cho phép. Kiểm tra:

- operator có phải quay lưng, vặn người hoặc đi xuyên vùng máy không;
- miệng U có gây giao cắt vào/ra hoặc chặn material handler không;
- có đủ khoảng trống cho bundle, cart, WIP/FIFO và emergency exit không;
- skill matrix cho phép flexible staffing hay chỉ tạo thêm walking;
- WIP có được kiểm soát theo buffer cap/pull, không đẩy hàng dư vào trong cell.

Với case ST01, data chỉ chứng minh một tuyến fetch dài; POU là countermeasure nhỏ, reversible và dễ pilot. Chưa có cơ sở để đổi toàn line sang U-shape.

### 9.7. Ergonomics và safety screen

Kiểm tra tại workstation sau khi bố trí rack/bin:

| Nhóm | Câu hỏi |
|---|---|
| Reach/posture | Có phải với xa/cao/thấp, xoay thân, cúi hoặc giữ tư thế tĩnh không? |
| Lift/carry | Tải, tần suất, grip, quãng mang; có nâng từ sàn/qua vai không? |
| Push/pull | Cart có tải nặng, bánh hỏng, dốc, gờ hoặc cua hẹp không? |
| Repetition | Tần suất lấy/đặt, thao tác pinch/force, recovery time? |
| Vision | Nhãn/lot nhìn rõ; đủ ánh sáng; không glare/bóng đổ? |
| Safety | Không lấn aisle/egress, fire equipment, guard, điện; không tạo điểm va chạm/trượt? |
| Human factors | Operator có thử layout và phản hồi trước khi chốt? Có hướng dẫn và training? |

**Không tự đặt ngưỡng kích thước, tải trọng hoặc ergonomic score.** Site EHS/standard phải xác định giới hạn. Dùng RULA/REBA/NIOSH chỉ khi phù hợp, có dữ liệu quan sát/tải trọng thật và người đánh giá được đào tạo; không suy điểm từ hình minh họa.

### 9.8. Improve và verify

1. Pilot thay đổi nhỏ (POU, rack, bin trigger), tránh move machine/routing nếu chưa có study.
2. Giữ cùng product, trip frequency, ca và phương pháp đo trước/sau.
3. Đồng thời đo: route distance/time, trips, material handler time, aisle crossing, WIP, starvation, station cycle, quality và ergonomic observations.
4. Chấp nhận chỉ khi movement giảm **mà** material availability/quality/WIP/aisle/ergonomics không xấu đi.
5. Sau pilot, cập nhật visual standard, min/max, refill owner, milk-run frequency và reaction plan.

### 9.9. Control Plan — case ST01

| KPI/condition | Pilot target | Tần suất | Owner | Reaction |
|---|---:|---|---|---|
| Operator trip distance | ≤21.8 m/trip | 5 trials đầu, sau đó weekly sample | IE | Vượt → map lại route/POU |
| Operator trip time | ≤3 min/trip | 5 trials đầu, sau đó weekly sample | Line leader | Vượt → kiểm tra waiting, shortage, route |
| Operator shared-aisle crossing | 0 | Pilot/audit | EHS + Supervisor | Có crossing → sửa layout, không dùng shortcut |
| Material availability tại ST01 | Không starvation do POU | Mỗi ca | Material Handler | Thiếu → replenish, ghi downtime riêng nếu có |
| FIFO/lot/style correctness | 100% visual check | Mỗi replenishment | Quality + Warehouse | Nhầm → hold material, containment |
| Handler time/net labor | Đo riêng trước khi kết luận | Pilot | IE + Warehouse | Thiếu log → không claim net saving |
| EHS/egress approval | Phải được duyệt trước pilot | Trước pilot và mỗi lần đổi layout | EHS + Facilities | Không duyệt/hazard → dừng, sửa |

Nếu operator trip giảm nhưng handler overtime, WIP tăng, starvation hoặc aisle/ergonomics fail, pilot **không đạt**. Không tối ưu cục bộ bằng cách chuyển waste sang bộ phận khác.

### 9.10. Câu hỏi phỏng vấn

1. Spaghetti diagram dùng để làm gì và đo ra sao?
2. Vì sao không đo khoảng cách đường chim bay?
3. U-shaped layout có luôn tốt hơn straight line không?
4. Làm sao biết POU rack không chỉ chuyển waste sang Material Handler?
5. Layout cải tiến nhưng WIP tăng thì xử lý thế nào?
6. Em kiểm tra ergonomics trước khi chuyển rack ra sao?

**Model answer — POU và xác minh:**

> Em map route thật từ ST01 đến supermarket, đo theo lối đi hợp lệ và bấm giờ cả lượt đi-về. Baseline synthetic là 43.6 m và 6 phút mỗi trip; ba trips/shift. Sau khi đặt two-bin POU, route operator còn 12.8 m và 2 phút. Nhưng em chưa gọi 12 operator-min là net saving vì chưa đo thời gian Material Handler refill bin. Em giữ FIFO/WIP, kiểm tra material availability và xin EHS duyệt aisle, reach, tải trọng trước khi accept.

### 9.11. Checklist hoàn thành

- [x] Có spaghetti/layout diagram trước-sau, ghi rõ schematic và không theo tỷ lệ.
- [x] Có material flow supermarket → POU → ST01 → downstream và owner replenishment.
- [x] Có 5 synthetic trials mỗi giai đoạn; tính distance/time/crossings.
- [x] Phân biệt operator time với Material Handler time; không claim net/cash saving.
- [x] Có so sánh straight/U/L/process layout và trade-off.
- [x] Có ergonomic screen cho reach, lift, push/pull, posture, vision, aisle và machine safety.
- [x] Không tự chấm RULA/REBA/NIOSH hoặc claim safety improvement.
- [x] Có Control Plan và reaction rule chống chuyển waste.
- [ ] EHS/Facilities duyệt layout/clearance thật.
- [ ] Đo handler time, tote mass và ergonomic exposure thật.
- [ ] Pilot production có theo dõi output, WIP, quality và starvation.

### 9.12. Trạng thái

`[x]` Knowledge và case study synthetic đầy đủ. `[~]` Production verification: EHS approval, handler time và pilot thật còn thiếu. Không có phần mềm layout/CAD/API; không thay đổi MVP.

---

## 10. Module 8 — SMED & Changeover <a id="module-8"></a>

### 10.1. Mục tiêu

Changeover là thời gian máy không sản xuất khi đổi size, style hoặc form. SMED (Single-Minute Exchange of Die) giảm thời gian này bằng cách tách việc làm khi máy dừng và việc làm khi máy chạy. Sau module này phải:

- đo changeover đúng định nghĩa (pcs đạt cuối → pcs đạt đầu);
- phân loại từng element là **internal** (phải dừng máy) hay **external** (làm khi máy chạy);
- áp 4 giai đoạn SMED và đo lại bằng số liệu trước/sau;
- tính tác động lên OEE Availability và nêu rõ điều kiện để tác động đó có giá trị.

### 10.2. Khái niệm

| Khái niệm | Ý nghĩa | Ví dụ PRESS-01 |
|---|---|---|
| Changeover | Từ pcs đạt cuối của size cũ đến pcs đạt đầu tiên của size mới | Changeover 14:30–15:30 trong OEE log (25 phút) |
| Internal setup | Chỉ làm được khi máy đã dừng | Tháo form cũ, lắp form mới, điều chỉnh áp lực |
| External setup | Có thể làm khi máy đang chạy | Mang form size mới ra xe đẩy, chuẩn bị nhãn, làm nóng sẵn form |
| Changeover loss | Phút máy dừng do changeover; là Availability loss trong OEE | Module 6, §8.2 |

**Lưu ý:** external setup **không miễn phí**. Việc đó chuyển từ thời gian dừng sang thời gian chạy, nhưng vẫn cần người có sẵn trong ca (xem §10.7).

### 10.3. Bốn giai đoạn SMED

| Giai đoạn | Việc làm | Kết quả cần có | Ví dụ PRESS-01 |
|---|---|---|---|
| 0. Đo | Quay video hoặc bấm giờ từng element, chia theo mốc last good → first good | Baseline changeover | 5 lần trước: trung bình 25.00 phút |
| 1. Tách I/E | Hỏi từng element: máy có bắt buộc dừng không? | Danh sách việc làm được khi máy chạy | Mang form size mới và chuẩn bị nhãn không cần dừng máy |
| 2. Chuyển I → E | Làm trước, chuẩn bị sẵn, làm nóng sẵn | Giảm thời gian internal | Làm nóng form mới trên bệ phụ; giảm chờ nguội và chờ nhiệt |
| 3. Tối ưu I | Kẹp nhanh, pin định vị, preset theo thẻ size, checklist, làm song song | Giảm thời gian internal còn lại | Kẹp nhanh thay bulông; preset áp lực; checklist first-piece |

Giai đoạn 4 (chuẩn hóa và duy trì) đưa vào Control Plan (§10.9).

### 10.4. Ví dụ synthetic — changeover PRESS-01

> **Synthetic.** Dữ liệu: `docs/data/smed_changeover_study.csv`, máy `PRESS-01` (cùng máy §8.5). 5 lần **BEFORE** (2026-10-19 → 10-23) và 5 lần **AFTER pilot** (2026-11-02 → 11-06). Trung bình BEFORE 25.00 phút khớp changeover 14:30–15:30 trong OEE log, nhưng đây là dữ liệu quan sát riêng, không phải cùng một sự kiện. Không liên kết với dữ liệu HBI.

**Trung bình theo element (giây):**

| Element | Loại | BEFORE: trong dừng | AFTER: trong dừng | AFTER: khi máy chạy |
|---|:-:|---:|---:|---:|
| E01 Dừng máy, tắt gia nhiệt | I | 30 | 25 | — |
| E02 Chờ form cũ nguội | I | 200 | 90 | — |
| E03 Tìm và mang form size mới | E | 180 | 0 | 180 |
| E04 Tháo form cũ | I | 150 | 60 | — |
| E05 Lắp form mới | I | 170 | 70 | — |
| E06 Điều chỉnh áp lực, timer | I | 200 | 40 | — |
| E07 Chờ nhiệt ổn định | I | 180 | 60 | — |
| E08 Chuẩn bị nhãn, dụng cụ, giấy | E | 90 | 0 | 90 |
| E09 Vệ sinh bệ ép | I | 60 | 40 | — |
| E10 Kiểm tra piece đầu | I | 180 | 90 | — |
| E11 Khởi động lại, chỉnh lần cuối | I | 60 | 30 | — |
| E12 Làm nóng sẵn form mới trên bệ phụ | E | 0 (không làm) | 0 | 240 |
| **Tổng trong dừng máy** | | **1500** | **505** | |
| **Tổng khi máy chạy** | | | | **510** |

Tóm tắt:

| Chỉ số | BEFORE | AFTER pilot | Thay đổi |
|---|---:|---:|---:|
| Thời gian dừng máy / lần | 1500 s = 25.00 phút | 505 s = 8.42 phút | −995 s = −16.58 phút (−66.3%) |
| Việc external làm khi máy dừng | 270 s | 0 | −270 s |
| Việc external làm khi máy chạy | 0 | 510 s = 8.50 phút | +510 s (cần người sẵn có) |
| Tổng công lao động / lần | 1500 s | 1015 s | −485 s (−32.3%) |

### 10.5. Waterfall 4 giai đoạn

| Bước | Việc làm | Thời gian dừng sau bước | Giảm |
|---|---|---:|---:|
| BEFORE | — | 1500 s | — |
| Giai đoạn 1: tách I/E | E03, E08 chuyển ra khi máy chạy | 1230 s | −270 s |
| Giai đoạn 2: chuyển I → E | E12 làm nóng sẵn form mới; nhờ đó E02 và E07 giảm | 1000 s | −230 s |
| Giai đoạn 3: tối ưu I | E01, E04, E05, E06, E09, E10, E11 giảm | 505 s | −495 s |

**Đọc:**

- **Giai đoạn 1 không cần đầu tư:** 270 s (4.5 phút) là việc làm khi máy dừng mà không cần dừng. Chỉ cần staging trước giờ đổi.
- **Giai đoạn 2 phụ thuộc bệ làm nóng:** E02 và E07 chỉ giảm khi form mới đã nóng sẵn. Nếu bệ phụ không đạt nhiệt, phần giảm này không được tính.
- **Giai đoạn 3 chiếm 495 s:** E06 (điều chỉnh áp lực, 200 → 40 s) có tỉ lệ giảm lớn nhất, 80%. Kẹp nhanh, preset và checklist làm giảm E04, E05, E10 nhiều tiếp theo.

### 10.6. Tác động lên OEE (Module 6)

Giả định: chỉ đổi changeover size change (14:30) từ 25 phút xuống 8.42 phút. Changeover 08:00 (15 phút) giữ nguyên. **P và Q giữ nguyên** (số pcs trên mỗi phút chạy không đổi).

| Chỉ số | Trước (OEE log 27/10) | Sau SMED (giả định) | Thay đổi |
|---|---:|---:|---:|
| Changeover | 40.00 phút | 23.42 phút | −16.58 phút |
| Downtime | 65.00 phút | 48.42 phút | −16.58 phút |
| Run time | 385.00 phút | 401.58 phút | +16.58 phút |
| Availability | 85.56% | 89.24% | +3.7 pp |
| Performance | 87.79% | 87.79% | — |
| Quality | 97.24% | 97.24% | — |
| **OEE** | **73.04%** | **76.18%** | **+3.1 pp** |

Sau SMED, downtime còn lại là breakdown 25 phút (**51.6%**) và changeover 23.42 phút (48.4%). Breakdown trở thành loss lớn nhất, nên ưu tiên tiếp theo là heater và van hơi (Module 6, §8.6), không phải tiếp tục SMED.

**Cảnh báo khi đọc OEE tăng:**

- 16.58 phút chạy thêm chỉ có giá trị nếu nhu cầu cần pcs đó. Nếu không, đó là năng lực dư và có thể thành **overproduction** (Module 3). Không chạy thêm để "ăn" OEE.
- Chưa có số liệu chi phí. Không quy đổi thời gian tiết kiệm thành tiền (quy tắc Module 5).
- Đây là dự báo với giả định P và Q không đổi; cần pilot thật để xác nhận.

### 10.7. Rủi ro và điều kiện

| Rủi ro | Biện pháp |
|---|---|
| Bệ làm nóng phụ không kiểm soát nhiệt, gây cháy hoặc nhiệt độ không đều | Ghi nhận nhiệt độ; EHS đánh giá trước khi dùng |
| Việc external làm trong lúc chuyền thiếu người | Owner cụ thể (Supervisor); xác nhận người làm việc trước giờ đổi |
| Bỏ first-piece để đạt số đẹp | E10 vẫn bắt buộc; quality gate của Module 4 không giảm |
| Đo start/stop khác định nghĩa giữa các ca | Dùng đúng mốc last good → first good; ghi đủ timestamp |
| Kết luận từ 5 lần quan sát | Chỉ là pilot ban đầu; cần ít nhất 10 lần mỗi giai đoạn trên nhiều size |

### 10.8. Quy tắc đo changeover

- **Start:** pcs đạt cuối cùng của size cũ (last good piece).
- **End:** pcs đạt đầu tiên của size mới (first good piece).
- Ghi timestamp start/end; quay video ít nhất 5 lần mỗi giai đoạn để tách element.
- Chỉ đưa changeover vào OEE Availability khi đo theo mốc này; không ước lượng từ ghi chú ca.

### 10.9. Countermeasure và Control Plan

| Hạng mục | Hành động | Owner | KPI |
|---|---|---|---|
| Changeover | Setup card cho từng size; checklist đổi size; video chuẩn | IE + Line leader | Thời gian dừng/lần |
| External prep | Staging xe đẩy trước giờ đổi; kiểm tra vật tư trước khi dừng | Supervisor | % việc external làm trước khi dừng |
| Bệ làm nóng phụ | Có kiểm soát nhiệt; ghi nhiệt độ trước khi đổi | Maintenance + EHS | Nhiệt độ đạt trước khi dừng |
| First-piece | Reference card; QC ký trước khi chạy | QC | First-piece pass rate |

| KPI | Target | Tần suất | Owner | Reaction |
|---|---:|---|---|---|
| Thời gian dừng changeover/lần | ≤ 8.5 phút | Mỗi lần đổi | IE | >10 phút 2 lần liên tiếp → review element trên video |
| Việc external làm khi máy dừng | 0 | Mỗi lần đổi | Supervisor | Có việc external trong dừng → ghi nguyên nhân |
| First-piece approval | 100% | Mỗi lần đổi | QC | Không sign-off → không chạy |

Ứng viên SMED tiếp theo: changeover 08:00 (15 phút, warm-up và set-up form đầu ca).

### 10.10. Câu hỏi phỏng vấn

1. SMED là gì và khác gì với việc giảm changeover thông thường?
2. Internal và external setup khác nhau thế nào? Cho ví dụ trong may.
3. Vì sao external setup vẫn có giá trị dù không dừng máy?
4. Vì sao không nên chạy thêm để "ăn" thời gian vừa tiết kiệm?
5. Changeover bắt đầu và kết thúc đo ở đâu?
6. Làm sao biết SMED không làm tăng lỗi đầu ca?
7. Nếu external làm trong lúc máy chạy nhưng chuyền thiếu người thì sao?

### 10.11. Model answers

**Câu 1 — SMED là gì?**

> SMED là phương pháp tách việc làm khi máy dừng (internal) và việc làm khi máy chạy (external), sau đó chuyển internal thành external và làm gọn phần internal còn lại. Khác với việc chỉ làm nhanh hơn, SMED bắt đầu bằng câu hỏi từng bước có thật sự cần dừng máy không. Ví dụ PRESS-01: 270 giây mang form mới và chuẩn bị nhãn đang làm khi máy dừng, trong khi không cần dừng.

**Câu 3 — External có giá trị dù không dừng máy?**

> Vì máy không phải chờ. Nhưng em không coi nó là miễn phí: việc đó tốn 510 giây công lao động, nên em phải chắc người làm có sẵn trong ca và không lấy từ vị trí đang cần. Giá trị nằm ở việc thời gian dừng giảm từ 25 phút xuống 8.42 phút.

**Câu 4 — Không chạy thêm để ăn OEE**

> OEE tăng vì máy có thêm thời gian chạy, nhưng pcs thêm chỉ có giá trị nếu có nhu cầu. Nếu chạy thêm không có nhu cầu, đó là tồn kho dư và là lãng phí overproduction theo Module 3. Em sẽ dùng thời gian tiết kiệm để giảm tăng ca, làm buffer có kiểm soát hoặc chuẩn bị các đợt đổi sau, không để sản xuất dư.

**Câu 6 — SMED không làm tăng lỗi đầu ca?**

> Em giữ first-piece là bắt buộc, không bỏ để đạt thời gian đẹp. Sau mỗi lần đổi em đo defect trong vài pcs đầu và so với baseline. Nếu E10 bị rút ngắn quá mức mà lỗi tăng, em khôi phục bước đó. Quality là điều kiện của SMED, không phải thứ đánh đổi.

### 10.12. Giới hạn

- Dữ liệu synthetic, một máy, 5 lần mỗi giai đoạn; chưa đủ để kết luận thống kê.
- Không có video thật; số element là trung bình giả định.
- Chưa kiểm chứng bệ làm nóng phụ, EHS và thời gian làm nóng thực tế.
- Không tính chi phí và không quy đổi thành tiền.
- Tác động OEE là dự báo với P và Q giữ nguyên.

### 10.13. Checklist hoàn thành

- [x] Có định nghĩa changeover (last good → first good), internal và external.
- [x] Có 4 giai đoạn SMED với ví dụ PRESS-01.
- [x] Có log synthetic before/after 5 + 5 lần (`docs/data/smed_changeover_study.csv`), ghi rõ SYNTHETIC.
- [x] Waterfall 1500 → 1230 → 1000 → 505 s khớp tổng từng element.
- [x] Tách việc external làm trong dừng (270 s) và khi máy chạy (510 s); tổng công lao động giảm 32.3%.
- [x] Tác động OEE: Availability 85.56% → 89.24%; OEE 73.04% → 76.18%; ghi rõ giả định P/Q.
- [x] Chỉ ra downtime tiếp theo là breakdown 51.6%.
- [x] Cảnh báo overproduction; không quy đổi thành tiền.
- [x] Có ≥ 3 câu trả lời phỏng vấn mẫu.
- [ ] Đo bằng video thật ≥ 10 lần mỗi giai đoạn.
- [ ] EHS và Maintenance xác nhận bệ làm nóng phụ.
- [ ] Pilot trên sản xuất thật, xác nhận OEE thực tế.

### 10.14. Trạng thái

`[x]` knowledge và ví dụ synthetic đầy đủ. `[~]` software: không có changeover API; OEE trong phần mềm vẫn `N/A`. Các mục chưa tick ở §10.13 cần dữ liệu thật.

---

## 11. Module 9 — Cross-functional Management <a id="module-9"></a>

### 11.1. Mục tiêu và nguyên tắc

Shift Line Engineer phối hợp để **giữ an toàn, chất lượng và dòng sản xuất**, nhưng không thay quyền chuyên môn của Quality, Maintenance, Planning, HR hay EHS. Sau module này phải:

- đưa các bộ phận về cùng một bộ dữ liệu và cùng một mốc thời gian;
- biết ai thực hiện, ai quyết định, ai cần được hỏi và ai cần được thông báo;
- escalation theo ngưỡng/standard của site, giao owner + due time + next update;
- đóng action bằng bằng chứng, không chỉ bằng “đã báo”.

**Thứ tự ưu tiên:** Safety → Quality/containment → Material & machine stability → Output recovery → Cost. Không chase target bằng cách bypass guard, bỏ first-piece, đẩy WIP vượt cap hoặc ghi số liệu không đúng.

> Vai trò/RACI bên dưới là **mẫu portfolio**, không phải cơ cấu hay quyền hạn chính thức của HBI. SOP, authority matrix và emergency rules tại site luôn được ưu tiên.

### 11.2. Vai trò các bộ phận

| Bộ phận | Đóng góp/decisions thường gặp | Dữ liệu cần chia sẻ | Không nên làm thay |
|---|---|---|---|
| Production / Shift Supervisor | Điều phối người và line trong ca; containment vận hành; huddle/handover | Hourly plan/actual, attendance, WIP, action status | Không tự release hàng Quality đang hold; không bỏ qua EHS |
| IE / Line Engineer | Xác minh metric, bottleneck, SAM/routing, capacity; đề xuất countermeasure | Time study đã duyệt, balance, gap, loss evidence | Không tự thay approved SAM hoặc target |
| Quality | Defect definition, containment, disposition/release theo QMS, FPY | Defect/Pareto, first-piece, inspection limits | Không đổi tiêu chuẩn quality để chase output |
| Maintenance | Chẩn đoán, sửa chữa, PM, machine-safe release | Downtime/event, repair status, parts/ETA | Không bỏ guard/interlock hoặc bàn giao máy chưa an toàn |
| Planning | Order priority, target/replan, material plan, due date | Demand, schedule, shortage, revised plan | Không biến forecast thành actual hoặc ép sản xuất vượt lệnh |
| Warehouse / Material Handler | Lot/size/quantity accuracy, replenishment, FIFO, material movement | On-hand, issue/receipt, ETA, shortage, milk-run | Không thay đổi lot/size hoặc chất lượng vật tư không có traceability |
| HR / Training | Attendance records, cross-training/qualification, labor policy | HC available, skill authorization, training status | Không tự gán người chưa đủ qualification vào operation |
| EHS | Hazard/risk assessment, site safety requirements, stop-work response | Hazard, clearance, PPE/ergonomic requirements | Không trade safety lấy output; site policy quyết định authority |

### 11.3. RACI mẫu cho một ca

`R` = thực hiện; `A` = chịu trách nhiệm cuối cùng/ra quyết định trong phạm vi; `C` = tham vấn; `I` = được thông báo. Mỗi dòng chỉ định **một A** để tránh “mọi người cùng chịu trách nhiệm, không ai quyết định”.

| Hoạt động | A | R | C | I |
|---|---|---|---|---|
| Xác minh hourly plan/actual và gap | Shift Supervisor | Production recorder/Line Leader | IE, Planning | Production Manager, Quality |
| WIP vượt buffer cap | Shift Supervisor | Production / Line Leader | IE, Warehouse, Quality | Production Manager, Planning |
| Chẩn đoán, sửa và release máy | Maintenance Lead | Maintenance Technician | Production, EHS khi có hazard | IE, Planning |
| Containment và disposition hàng lỗi | Quality Lead | QC + Production theo hướng dẫn Quality | IE, Planning | Shift Supervisor, Production Manager |
| Thiếu vật tư / xác nhận ETA | Planning Lead | Warehouse / Material Handler | Production, IE | Shift Supervisor, Quality nếu lot ảnh hưởng |
| Redeploy người / overtime / skill coverage | Production Manager | Shift Supervisor | HR, IE, Quality | Planning |
| Hazard, guarding, ergonomics, aisle clearance | EHS Lead theo site policy | Người phát hiện + Supervisor bảo vệ khu vực | Maintenance, IE, Facilities | Production Manager |
| Recovery plan / thay đổi lịch chạy | Production Manager | Shift Supervisor + IE | Planning, Quality, Maintenance, Warehouse, HR, EHS theo loss | Các ca liên quan |
| Handover action còn mở | Shift Supervisor bàn giao | Action owner cập nhật status/evidence | IE và owner liên quan | Ca nhận việc / manager |

**Decision boundary:** Quality giữ quyền hold/release theo QMS; Maintenance quyết định trạng thái kỹ thuật an toàn của máy; EHS/site procedure quyết định phản ứng safety; Planning/Production Manager phê duyệt schedule/resource changes theo authority tại site. Shift Engineer tổng hợp dữ liệu, đề xuất, theo dõi và escalate — không tự vượt quyền này.

### 11.4. Operating rhythm và escalation

| Nhịp | Nội dung | Output |
|---|---|---|
| Start-of-shift huddle | Target/style, attendance/qualification, material, machine readiness, quality/safety alert | Risk list + owner trước khi chạy |
| Hourly review | Cumulative plan/actual, gap/projected, WIP từng buffer, downtime/loss | Action trong giờ + next check time |
| Escalation huddle | Khi đạt Yellow/Orange/Red, WIP cap, quality hold hoặc safety trigger của site | Containment, decision owner, ETA, recovery/replan |
| Shift handover | Actual cuối ca, open downtime/quality/material/WIP, action status | Người nhận xác nhận owner và due time |

Ngưỡng Yellow/Orange/Red và WIP lấy theo **Module 2 §4.6**; không tạo một bộ ngưỡng mâu thuẫn. Một escalation message tối thiểu phải có:

```text
WHEN: timestamp / shift / line / style
WHAT: target, plan-to-time, actual, gap, projection, WIP/buffer cap
LOSS: category + observed minutes/pcs; facts separated from hypotheses
CONTAINMENT: action đã làm để bảo vệ safety/quality/WIP
ASK: quyết định hoặc nguồn lực cần ai phê duyệt
OWNER + DUE: ai làm, hạn phản hồi
NEXT UPDATE: giờ cập nhật tiếp theo; tiêu chí đóng/escalate cấp cao hơn
```

### 11.5. Case study synthetic — Red escalation lúc 12:00

> Dùng hourly case của Module 2; toàn bộ dữ liệu synthetic, không phải ca sản xuất thật.

| Mốc 12:00 | Giá trị |
|---|---:|
| Target / shift | 420 pcs |
| Cumulative plan | 224 pcs |
| Cumulative actual | 172 pcs |
| Gap | −52 pcs (−23.21%) |
| Projected end-of-shift | 172 / 4.0 × 7.5 = 322.5 pcs (76.8% target) |
| WIP tại `ST05-IN` | 38 pcs; cap 25 (vượt 13 pcs) |
| Loss events đã log đến 12:00 | 25 phút category `MACHINE`; 15 phút category `MATERIAL`; chưa cộng thành line-stop vì common measurement basis chưa xác nhận |

Theo Module 2 §4.6, đây là **Red**: gap < −15% và projection <90%; đồng thời buffer WIP vượt cap.
Response window cho Red là **15 phút** theo Module 2 §4.6; trong ví dụ này next update được đặt lúc 12:15.

**Response theo nhóm:**

1. **Shift Supervisor/Production:** xác minh counter và timestamp; gọi Red huddle; kiểm soát feed tại đúng buffer `ST05-IN` theo pull/WIP cap — không dồn thêm hàng vào trước bottleneck.
2. **IE:** xác minh gap/projection, chỉ rõ observation khác hypothesis; kiểm tra bottleneck và cập nhật loss board. Giữ 25 phút `MACHINE` và 15 phút `MATERIAL` tách riêng; không cộng thành 40 line-min.
3. **Maintenance:** rà event machine 25 phút đã xảy ra ở bucket 08:00–09:00, xác nhận countermeasure/current condition; nếu tái diễn thì xử lý theo work instruction và chỉ release theo site safety procedure.
4. **Planning + Warehouse:** xác nhận material wait 15 phút ở bucket 10:00–11:00 đã được giải quyết chưa, kiểm tra collar interlining/lot/ETA và xác nhận ưu tiên order/cấp liệu.
5. **HR + Production:** HR được notify theo Red escalation của Module 2; xác minh attendance/qualification nếu cân nhắc redeploy. Không suy “thiếu người” chỉ từ output thấp và không gán người chưa trained.
6. **Quality:** duy trì inspection/quality gate; nếu có nghi ngờ lỗi thì containment/disposition theo QMS, không bỏ kiểm tra để bù sản lượng.
7. **EHS:** tham gia ngay nếu có unsafe condition; không chạy máy/di chuyển vật tư khi chưa clear hazard.
8. **Production Manager + Planning (HR consult về labor option):** nếu recovery forecast vẫn dưới target, quyết định replan/overtime/resource theo authority; báo target risk thật, không gọi 322.5 là cam kết.

**Close criteria:** WIP trở lại ≤ cap hoặc có disposition được duyệt; máy/material status rõ; quality gate được giữ; owner/ETA ghi trên handover; actual/projected được cập nhật. Target chỉ được đánh dấu achieved khi actual đạt target theo định nghĩa đã chốt.

### 11.6. Handover/action log

| Field | Ví dụ trong case |
|---|---|
| Timestamp / issue ID | 12:00 / `RED-LINE01-20261027-01` (synthetic ID) |
| Signal | Gap −23.21%; projected 322.5/420; WIP `ST05-IN` 38/25 |
| Confirmed facts | 25 min category `MACHINE`, 15 min category `MATERIAL`; line-stop basis chưa xác nhận |
| Hypotheses (chưa xác minh) | Thread path gây repeat stop; cấp mex chậm |
| Containment | Stop feeding buffer theo cap; giữ quality gate |
| Action / owner / due | Maintenance check / Warehouse ETA / Planning recovery plan — mỗi action có owner riêng |
| Decision / approver | Replan/overtime nếu cần — Production Manager/Planning theo site authority |
| Next update / close evidence | 12:15 (Red response window); log actual, WIP, machine/material status |

Không gộp nhiều phòng ban thành một action “các bộ phận xử lý”. Mỗi action cần một owner, due time và bằng chứng hoàn tất.

### 11.7. Cách xử lý bất đồng

1. Quay về định nghĩa và timestamp chung (plan, actual, buffer, downtime category, quality hold).
2. Tách **fact**, **hypothesis**, **decision**; nêu điều chưa biết.
3. Giữ decision rights: Quality quyết định disposition; Maintenance machine release; EHS safety; Planning/Production Manager schedule/resource theo authority.
4. Nếu target và safety/quality xung đột, ưu tiên control/containment; escalate thay vì tự bỏ tiêu chuẩn.
5. Ghi quyết định, owner, due time và next update để ca sau tiếp tục.

### 11.8. Câu hỏi phỏng vấn

1. Em làm gì khi Production muốn chạy nhanh nhưng Quality đang hold hàng?
2. Ai chịu trách nhiệm khi máy dừng: IE hay Maintenance?
3. Làm sao xử lý khi Warehouse nói đã cấp đủ nhưng line báo thiếu?
4. Khi nào em tự điều chuyển người, khi nào cần HR/manager?
5. Em handover open issue thế nào để không mất action giữa hai ca?

**Model answer — Red escalation:**

> Ở case synthetic lúc 12:00, plan-to-time là 224 pcs nhưng actual 172, gap −23.21%; projection chỉ 322.5/420 và WIP `ST05-IN` là 38 so với cap 25. Em xác minh timestamp/counter rồi gọi Red huddle. Production kiểm soát feed tại buffer; IE xác nhận gap và giữ 25 phút category MACHINE tách khỏi 15 phút category MATERIAL vì common line-stop basis chưa được xác nhận; Maintenance rà machine event; Planning/Warehouse xác nhận vật tư và ETA; Quality giữ quality gate; HR được notify theo Red escalation và kiểm tra attendance/qualification nếu có labor option. Nếu forecast không phục hồi, Production Manager/Planning quyết định replan theo authority. Em ghi từng owner, due time và next update. Đây là dữ liệu synthetic nên em không trình bày như thành tích sản xuất thật.

### 11.9. Checklist hoàn thành

- [x] Có vai trò Production, IE, Quality, Maintenance, Planning, Warehouse, HR, EHS.
- [x] Có RACI một Accountable cho từng loại quyết định.
- [x] Có decision boundary và ghi rõ site SOP/authority matrix được ưu tiên.
- [x] Có operating rhythm, escalation message và handover/action log.
- [x] Có Red case 12:00 nhất quán với Module 2; tách loss category/đơn vị.
- [x] Có cách xử lý bất đồng, safety/quality không bị subordinate bởi output.
- [x] Có model answer cross-functional và tối thiểu 3 câu hỏi phỏng vấn.
- [ ] Thay RACI mẫu bằng authority matrix thật chỉ khi được site cho phép; hiện không có dữ liệu tổ chức HBI.

### 11.10. Trạng thái

`[x]` Knowledge, RACI mẫu và case study synthetic đầy đủ. `[~]` RACI là template học tập; phải xác nhận lại với SOP/authority matrix của từng site. Không thêm workflow hoặc module phần mềm.

---

## 12. Module 10 — Interview Preparation <a id="module-10"></a>

### 12.1. Mục tiêu

Trả lời có cấu trúc, dùng đúng thuật ngữ IE, nói rõ vai trò và con số, đồng thời không nhận case synthetic là thành tích production. Mỗi câu trả lời nên khoảng 90–120 giây; câu hỏi ngắn dùng phiên bản 30–45 giây.

### 12.2. STAR và năm case bắt buộc

| Case | Module tham chiếu | Trạng thái evidence |
|---|---|---|
| Bottleneck / target miss | 5, `CASE_STUDY_KAIZEN.md` | Portfolio simulation; target 420 không đạt |
| Manpower shortage | 3, 4, 9 | Hypothetical response; không có outcome số giả định |
| New style readiness | 1, 5, 9 | Readiness approach; không claim launch đã thực hiện |
| Quality problem | 4, `CASE_STUDY_QUALITY_RCA.md` | T07 synthetic; không claim causality/production significance |
| Line moving / transfer | 7, 8, 9 | Hypothetical cutover plan; site approval cần thiết |

```text
S — Situation: scope, baseline, timestamp/style/line.
T — Task: trách nhiệm thực sự của mình.
A — Action: data → analysis → coordination → containment/decision.
R — Result: output/quality/safety/cost; nêu target đạt/chưa đạt và caveat.
```

### 12.3. Quy tắc cho câu trả lời portfolio

- Với result synthetic: mở đầu bằng **“In my synthetic portfolio case…”**.
- Với tình huống chưa làm: dùng **“If I faced this situation, I would…”**, không kể như đã làm.
- Tách `modeled capacity` khỏi `actual output`; `estimated saving` khỏi `verified cash saving`.
- Không gọi LBE là actual labor efficiency, machine allocation là utilization, hay effective takt là customer demand takt.
- Nêu decision boundary: Quality/maintenance/EHS/site SOP không bị override để đạt sản lượng.
- Nếu thiếu dữ liệu, nói rõ dữ liệu thiếu, người cần tham vấn và cách kiểm chứng.

### 12.4. Tài liệu ôn phỏng vấn

`docs/INTERVIEW_PREP.md` chứa:

- giới thiệu bản thân 60 giây có placeholder;
- 5 model answers STAR tiếng Anh;
- bonus cross-functional Red escalation;
- follow-up technical questions, English glossary và câu hỏi cho interviewer;
- portfolio walkthrough 7 phút và checklist trước phỏng vấn.

**Cá nhân hóa bắt buộc:** thay placeholder bằng sự thật, thêm case đã trực tiếp làm nếu có. Nếu chưa có, giữ cách trình bày portfolio/hypothetical; không thêm tên line, sản lượng, tỷ lệ, lương hay vai trò không có bằng chứng.

### 12.5. Checklist hoàn thành

- [x] Có 5 case đúng nhóm bottleneck, manpower, new style, quality, line moving.
- [x] Có STAR format, intro 60 giây, câu trả lời tiếng Anh và glossary.
- [x] Có follow-up về target 420, OEE, saving, cross-functional conflict.
- [x] Có 7-minute portfolio walkthrough và câu hỏi cho interviewer.
- [x] Ghi rõ project/dữ liệu synthetic; không claim kinh nghiệm HBI hoặc production result.
- [ ] Điền thông tin cá nhân/kinh nghiệm thật trước khi dùng; bỏ mọi placeholder không đúng.
- [ ] Luyện nói và điều chỉnh đáp án theo job description, site SOP và thời lượng interview.

### 12.6. Trạng thái

`[x]` Knowledge và `docs/INTERVIEW_PREP.md` đã có đủ template/model answers. `[~]` Ứng viên phải cá nhân hóa bằng dữ kiện thật và luyện nói; file không thay thế kinh nghiệm hoặc bằng chứng production.

---

## 13. Việc tiếp theo <a id="next-steps"></a>

1. **Deploy public + acceptance** — còn chờ Render/Netlify access; theo `DEPLOYMENT.md` và `ROADMAP.md` §9. Không nói demo live trước khi URL/health được kiểm tra.
2. **Cá nhân hóa interview prep** — thay placeholder trong `docs/INTERVIEW_PREP.md` bằng kinh nghiệm thật và job description; không dùng kết quả synthetic như production achievement.
3. **Nếu áp dụng tại một site** — làm theo site SOP/EHS trong hệ thống riêng; giữ dữ liệu nhà máy/nhân sự ngoài portfolio repo, vốn chỉ chứa synthetic data.
4. **Giữ software scope đã đóng băng** — không thêm hourly/OEE/CAD/cross-functional workflow API nếu chưa có quyết định mới trong `CHECKLIST.md`.

**Không tự động cập nhật SAM từ optimizer.** Mọi thay đổi method phải qua time study lại, xác nhận Standard Time và phê duyệt.

---

## Phụ lục A. Review log — 2026-11-02 <a id="review-log"></a>

> Nguồn: review chuyên môn 3 module IE/Lean. Trạng thái: **12/13 done, 1 partial**.
> `[x]` = đã sửa trong playbook/CSV; `[~]` = đã có khung nhưng chưa đủ case study/dữ liệu.
> Đây là snapshot của review lúc đó; trạng thái 10 module hiện tại xem §1, các quyết định cập nhật xem `CHECKLIST.md` decision log.

| # | Item | Mức | Trạng thái | Bằng chứng |
|---:|---|---|---|---|
| 1 | Time Study: rating theo từng element, không nhân PR vào machine automatic time | P0 | `[x]` | §3.2–3.6 |
| 2 | Allowance: có `allowance_basis`, không cộng hai lần | P0 | `[x]` | §3.2–3.6 |
| 3 | OP060: 5 cycle chỉ là ví dụ, không phải xác nhận SAM | P0 | `[x]` | §3.5 |
| 4 | Yamazumi: 54.64s là Effective Takt / Planning Cycle Allowance | P0 | `[x]` | §3.7 |
| 5 | Station cycle: tách labor content, operator cycle, machine cycle, overlap | P0 | `[x]` | §3.6.1 |
| 6 | Hourly forecast: `elapsed_scheduled_production_hours` gồm downtime, loại break | P0 | `[x]` | §4.3 |
| 7 | WIP cap: nêu nguồn gốc 25 pcs và buffer `ST05-IN` | P0 | `[x]` | §4.4–4.7 |
| 8 | Escalation: 12:00 ngày 27/10 phải là **Red** | P0 | `[x]` | §4.6 |
| 9 | Overproduction: 15 pcs early output, không phải 15 phút | P0 | `[x]` | §5.4–5.6 |
| 10 | Pareto: tách operator-minutes, machine-minutes, line-minutes, pieces | P0 | `[x]` | §5.4–5.6 |
| 11 | DMAIC: Control Plan và reaction plan cho T07/T08 | P1 | `[x]` | §6–7; `docs/CASE_STUDY_QUALITY_RCA.md`; `docs/CASE_STUDY_KAIZEN.md` |
| 12 | Lean: bổ sung Mura và Muri | P1 | `[x]` | §5.3.1 |
| 13 | OEE: chỉ tính khi đủ Availability, Performance, Quality | P1 | `[~]` | §8 có công thức; chưa có synthetic data đủ |

**Nguyên tắc đã chốt sau review:**

- Một con số đúng phép tính nhưng sai bản chất nghiệp vụ không được lên dashboard hoặc dùng trong phỏng vấn.
- Không tự động cập nhật SAM từ optimizer; phải time study lại, xác nhận method và phê duyệt Standard Time.
- Không gọi machine allocation là machine utilization; waste analysis không thay thế OEE.

---

## Phụ lục B. Nguồn dữ liệu & liên kết <a id="nguon-du-lieu"></a>

| Nội dung | Nguồn chuẩn |
|---|---|
| KPI formulas | `KPI_SPEC.md` |
| Solver / MILP | `MODEL.md` |
| Trạng thái & quyết định | `CHECKLIST.md` §0.1–0.2 |
| Roadmap / acceptance | `ROADMAP.md` §9 |
| T07 Quality RCA | `docs/CASE_STUDY_QUALITY_RCA.md` |
| T08 Kaizen | `docs/CASE_STUDY_KAIZEN.md` |
| Layout & Ergonomics | `docs/CASE_STUDY_LAYOUT_ERGONOMICS.md`, `docs/layout_study_before_after.svg` |
| Cross-functional case | §11.5; hourly source in `docs/data/hourly_actuals.csv` |
| Interview preparation | `docs/INTERVIEW_PREP.md` |
| Hourly data | `docs/data/hourly_actuals.csv` |
| Waste data | `docs/data/waste_observation.csv` |
| Quality data | `docs/data/quality_defects.csv`, `docs/data/quality_setup_audit.csv` |
| Kaizen cost | `docs/data/kaizen_cost_model.csv` |
| OEE log | `docs/data/oee_machine_log.csv` |
| SMED study | `docs/data/smed_changeover_study.csv` |
| Layout route study | `docs/data/layout_route_observations.csv` |

> Toàn bộ ví dụ và số liệu trong playbook là synthetic, không phải kết quả của HBI.
