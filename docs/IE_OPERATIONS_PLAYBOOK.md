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
| Học đầy đủ | Module 1–5 (§3–§7) |
| Tra công thức | Module 1, 2, 3, 6 + `KPI_SPEC.md` |
| Chuẩn bị phỏng vấn | Q&A từng module + Module 10 (§12) |
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
| 6 | OEE & Downtime | Công thức A × P × Q, downtime events, lưu ý không suy OEE từ allocation | §8.1–8.3; `KPI_SPEC.md` §12 | `[~]` formula only; thiếu A/P/Q data |
| 7 | Layout & Ergonomics | Spaghetti, material flow, U-shape, ergonomics checklist (outline) | §9.1–9.2 | `[~]` outline; chưa có case study |
| 8 | SMED & Changeover | Internal/external setup, changeover study, target (outline) | §10.1–10.2 | `[~]` outline; chưa có case study |
| 9 | Cross-functional Management | Vai trò Production/Quality/Maintenance/Planning/Warehouse/HR/EHS (outline) | §11.1–11.3 | `[~]` outline; chưa có case study |
| 10 | Interview Preparation | 5 case, STAR, English terms, 2-minute answers (outline) | §12.1–12.2; `CHECKLIST.md` §7 | `[~]` outline; `docs/INTERVIEW_PREP.md` chưa có |

**Đọc nhanh:**

- **P0 đã đủ nội dung:** Module 1–5.
- **P1 mới có công thức:** Module 6 (OEE).
- **P1 còn outline:** Module 7–10.
- **Phần mềm:** optimizer + dashboard + 3 form đã có; Time Study là aggregate; Hourly và 8 Wastes là docs/CSV; OEE để `N/A`.
- **Case study:** T07/T08 đã xong; không mở rộng software chỉ để biến chúng thành feature.

---

## 2. Learning path <a id="learning-path"></a>

**Ưu tiên học trước:**

1. Time Study & Standard Work
2. Hourly Production Control
3. Lean 8 Wastes
4. DMAIC & Kaizen A3
5. OEE & Downtime

**Sau đó mở rộng:**

6. Layout & Ergonomics
7. SMED & Changeover
8. Cross-functional Management
9. Interview English

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
- [x] Có điều kiện redeploy rõ ràng.
- [x] Có Control Plan với owner/frequency/reaction.
- [x] Không claim target 420 đạt.
- [x] Không claim OEE/machine utilization.
- [x] Không quy đổi unit cost thành cash saving.
- [x] Chỉ dùng dữ liệu synthetic.

---

## 8. Module 6 — OEE & Downtime <a id="module-6"></a>

### 8.1. Công thức

```text
Availability = Run Time / Planned Production Time
Performance = (Ideal Cycle Time × Total Count) / Run Time
Quality = Good Count / Total Count
OEE = Availability × Performance × Quality
```

### 8.2. Lưu ý

- Chỉ tính OEE khi có đủ runtime, performance, quality.
- Không gọi machine allocation là machine utilization.
- Downtime event hiện có trong sample chỉ là nền tảng; chưa đủ OEE.

### 8.3. Trạng thái

`[~]` Có công thức nhưng **chưa có đủ synthetic runtime/performance/quality data**. Không tính OEE; hiển thị `N/A`. Không suy OEE từ machine allocation hay tổng downtime.

---

## 9. Module 7 — Layout & Ergonomics <a id="module-7"></a>

### 9.1. Nội dung

- Spaghetti diagram: vẽ đường đi của người/vật tư.
- Material flow: dòng nguyên liệu từ kho → chuyền → kho thành phẩm.
- U-shaped layout: giảm walking, tăng phối hợp.
- Ergonomics: chiều cao bàn, ánh sáng, tư thế, tải trọng, an toàn trạm.

### 9.2. Trạng thái

`[~]` Mới có outline. Cần thêm spaghetti diagram, material-flow example và ergonomics checklist; chưa có case study số.

---

## 10. Module 8 — SMED & Changeover <a id="module-8"></a>

### 10.1. Nội dung

- Internal vs external setup.
- Quay phim/bấm giờ changeover.
- Tách external, giảm internal, chuẩn hóa.
- Target changeover time và đo lại.

### 10.2. Trạng thái

`[~]` Mới có outline; chưa có changeover time study, internal/external split và case study synthetic.

---

## 11. Module 9 — Cross-functional Management <a id="module-9"></a>

### 11.1. Nội dung

- Production: kế hoạch, sản lượng, HC.
- Quality: lỗi, rework, FPY.
- Maintenance: downtime, bảo trì.
- Planning: lệnh sản xuất, nguyên liệu.
- Warehouse: cấp phát, tồn kho.
- HR: attendance, tuyển dụng, đào tạo.
- EHS: an toàn, môi trường.

### 11.2. Cách thể hiện trong phỏng vấn

Dùng một tình huống thực tế, nói rõ:
- ai liên quan;
- dữ liệu nào dùng chung;
- ai ra quyết định;
- escalation khi nào.

### 11.3. Trạng thái

`[~]` Mới có outline vai trò các bộ phận; chưa có case study cross-functional, RACI hoặc escalation thực tế.

---

## 12. Module 10 — Interview Preparation <a id="module-10"></a>

### 12.1. Nội dung

- 5 case: bottleneck, manpower shortage, new style, quality problem, line moving.
- STAR: Situation, Task, Action, Result.
- English IE terms.
- 2-minute answers.

### 12.2. Trạng thái

`[~]` Đã có outline 5 case + thuật ngữ trong `CHECKLIST.md` §7; **`docs/INTERVIEW_PREP.md` chưa được tạo**. Cần viết câu trả lời 2 phút bằng tiếng Anh và model answer.

---

## 13. Việc tiếp theo <a id="next-steps"></a>

1. **Deploy public + acceptance** — ưu tiên cao nhất; checklist trong `ROADMAP.md` §9.
2. **Chốt scope element-level Time Study** — hiện UI là aggregate; chỉ mở nếu cần cho demo.
3. **Bổ sung dữ liệu OEE** — chỉ tính khi có đủ Availability, Performance, Quality; nếu thiếu, giữ `N/A`.
4. **Tạo `docs/INTERVIEW_PREP.md`** — 5 case, STAR, câu trả lời tiếng Anh 2 phút.
5. **Hoàn thiện tài liệu** — `DATA_DICTIONARY.md`, `SECURITY.md`, rà `MODEL.md`.

**Không tự động cập nhật SAM từ optimizer.** Mọi thay đổi method phải qua time study lại, xác nhận Standard Time và phê duyệt.

---

## Phụ lục A. Review log — 2026-11-02 <a id="review-log"></a>

> Nguồn: review chuyên môn 3 module IE/Lean. Trạng thái: **12/13 done, 1 partial**.
> `[x]` = đã sửa trong playbook/CSV; `[~]` = đã có khung nhưng chưa đủ case study/dữ liệu.

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
| Hourly data | `docs/data/hourly_actuals.csv` |
| Waste data | `docs/data/waste_observation.csv` |
| Quality data | `docs/data/quality_defects.csv`, `docs/data/quality_setup_audit.csv` |
| Kaizen cost | `docs/data/kaizen_cost_model.csv` |

> Toàn bộ ví dụ và số liệu trong playbook là synthetic, không phải kết quả của HBI.
