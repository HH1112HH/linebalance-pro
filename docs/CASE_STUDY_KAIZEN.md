# Case Study T08 — Kaizen & Cost Saving: Line Rebalancing

> **Loại:** Case study Kaizen/A3, không phải module phần mềm.  
> **Dữ liệu:** 100% synthetic. Không phải dữ liệu thật, lương thật hay năng suất thật của HBI.  
> **Phạm vi:** `LINE_01`, style `BASIC-TEE-001`, 40 operations, baseline 24 station / 24 worker / 61.0s.  
> **Liên kết:** `CHECKLIST.md` §0.2, `KPI_SPEC.md` §4 và §8, `docs/IE_OPERATIONS_PLAYBOOK.md` §7.  
> **File dữ liệu:** `docs/data/kaizen_cost_model.csv`.

---

## 1. Tóm tắt một trang

| Chỉ số | Baseline | Sau Kaizen | Delta | Cách đọc |
|---|---:|---:|---:|---|
| Stations | 24 | 23 | −1 | Giảm 1 station |
| Workers on line | 24 | 23 | −1 | 1 worker redeploy |
| Bottleneck | 61.0s | 58.0s | −3.0s | Giảm 4.92% |
| LBE | 72.34% | 79.39% | +7.05 pp | Cân bằng tốt hơn |
| Capacity / shift | 376.2 pcs | 395.7 pcs | +19.5 pcs | Tăng 5.18% |
| Target 420 achievement | 89.58% | 94.21% | +4.63 pp | **Vẫn chưa đạt 420** |
| Output / operator | 15.68 pcs | 17.20 pcs | +1.52 pcs | Tăng 9.75% |
| Labor minutes / pc | 28.71 | 26.16 | −2.55 | Giảm 8.88% |
| Estimated labor saving | — | 11.7 triệu VND/tháng | — | Nếu worker được redeploy |
| Implementation cost | — | 12.0 triệu VND | — | Chi phí synthetic |
| Payback | — | 1.03 tháng | — | Theo saving estimate |

**Kết luận ngắn để phỏng vấn:**

> “Tôi dùng baseline first-fit 24 station / 24 worker / 61.0s. Sau khi rebalance bằng MILP/HiGHS, line còn 23 station / 23 worker, bottleneck 58.0s, LBE từ 72.34% lên 79.39%, capacity từ 376.2 lên 395.7 pcs/shift. Tôi redeploy 1 worker sang relief/quality support, nên estimated labor saving khoảng 11.7 triệu VND/tháng, implementation cost 12 triệu, payback khoảng 1.03 tháng. Điều quan trọng: target 420 vẫn chưa đạt, achievement chỉ 94.21%; tôi không claim 420 feasible. Muốn đạt 420 phải giảm bottleneck xuống ≤54.64s hoặc tăng HC/giảm SAM.”

---

## 2. Background — bối cảnh

### 2.1. Sản phẩm và nhu cầu

| Hạng mục | Giá trị |
|---|---|
| Style | `BASIC-TEE-001` |
| Line | `LINE_01` |
| Operations | 40 |
| Tổng SAM | 1,059s |
| Shift | 480 phút |
| Break | 30 phút |
| Net available | 27,000s |
| Target | 420 pcs/shift |
| Planned efficiency | 85% |
| Demand Takt | 64.29s |
| Effective Takt / Planning Cycle Allowance | 54.64s |

### 2.2. Baseline

Baseline là **input**, không phải output optimizer:

- first-fit heuristic với station target 60s, max 24 station;
- 24 station / 24 worker;
- bottleneck 61.0s tại `ST24`;
- LBE 72.34%;
- capacity 376.2 pcs/shift;
- target 420 achievement 89.58%.

> Baseline synthetic này được dùng để so sánh, không đại diện cho chuyền thật của HBI.

### 2.3. Vấn đề

Line không đạt target 420: thiếu **43.8 pcs/shift** (420 − 376.2). Bottleneck 61.0s cao hơn Effective Takt 54.64s. Load giữa các station không đều: có station 61.0s, 60.0s, 58.0s nhưng cũng có station 20.0s, 26.0s, 28.0s.

**Problem statement:**

> Trong điều kiện 24 worker, line bị chặn bởi bottleneck 61.0s, capacity chỉ 376.2 pcs/shift, không đạt target 420. Cần rebalance để giảm bottleneck, tăng LBE và capacity mà không vi phạm precedence/skill/machine.

---

## 3. Current condition — hiện trạng

### 3.1. Baseline station loads — top 10

| Station | Load (s) | Operations | Ghi chú |
|---|---:|---|---|
| ST24 | 61.0 | OP260, OP270, OP400 | Bottleneck: final inspection + warehouse + packing |
| ST03 | 60.0 | OP030, OP040 | May vai trái/phải |
| ST10 | 58.0 | OP100, OP150 | Sườn trái + gấu tay trái |
| ST11 | 58.0 | OP110, OP160 | Sườn phải + gấu tay phải |
| ST17 | 54.0 | OP290, OP370 | Túi phải + tag |
| ST07 | 52.0 | OP320, OP330 | Nẹp cổ |
| ST18 | 52.0 | OP300, OP310 | Diễu túi |
| ST15 | 50.0 | OP140, OP180 | Diễu lai + gấu tay phải |
| ST12 | 48.0 | OP120, OP170 | Diễu sườn + gấu tay trái |
| ST21 | 48.0 | OP210, OP220 | Ủi thân + ủi tay |

**Nhận xét:**

- ST24 gom 3 operation cuối (kiểm tra cuối, nhập kho, đóng thùng) → 61.0s.
- ST03 gom 2 operation may vai → 60.0s.
- Các station đầu/cuối có load thấp: ST01 20.0s, ST04 26.0s, ST02 28.0s.
- Đây là **imbalance**, không phải machine utilization. Không dùng số station có máy để gọi là “machine utilization”.

### 3.2. Baseline KPIs

```text
workers_used             = 24
bottleneck_load_sec      = 61.0
total_planning_sam_sec   = 1,059.0
LBE                      = 1,059 / (24 × 61.0) × 100 = 72.34%
capacity_per_shift       = 27,000 × 0.85 / 61.0 = 376.2 pcs
target 420 achievement   = 376.2 / 420 × 100 = 89.58%
output_per_operator      = 376.2 / 24 = 15.68 pcs
labor minutes per piece  = 24 × 450 / 376.2 = 28.71 min/pc
```

### 3.3. Root cause của imbalance

| Nguyên nhân | Bằng chứng | Mức ảnh hưởng |
|---|---|---|
| First-fit chỉ đảm bảo feasible, không tối ưu global balance | ST24 61.0s, ST01 20.0s | Cao |
| Precedence + machine + skill constraints | Nhiều operation bị khóa vào máy/loại máy | Cao |
| Final inspection/packing cluster | OP260, OP270, OP400 cùng ST24 | Cao |
| Chưa rebalance sau style change | Baseline giữ layout cũ | Trung bình |
| Thiếu cross-training | Một số operation chỉ 1–2 worker đủ skill | Trung bình |

**Không phải nguyên nhân:**

- Không phải “công nhân làm chậm” — SAM là fixed, skill chỉ là eligibility gate.
- Không phải “máy thiếu” — machine coverage được kiểm tra riêng; không suy ra OEE.
- Không phải “takt 54.64s” — 54.64s là Effective Takt, không phải Demand Takt 64.29s.

---

## 4. Goal — mục tiêu

| Mục tiêu | Baseline | Target | Điều kiện |
|---|---:|---:|---|
| Bottleneck | 61.0s | ≤58.0s | Không vi phạm precedence/skill/machine |
| LBE | 72.34% | ≥78.0% | Cùng SAM, cùng target |
| Capacity | 376.2 | ≥390 pcs/shift | Bottleneck-constrained |
| Workers on line | 24 | ≤24 | Có thể redeploy 1 |
| Target 420 | 89.58% | Ghi rõ nếu chưa đạt | Không claim feasible nếu chưa chứng minh |

**Không đặt mục tiêu “đạt 420”** vì với 24 worker available, bottleneck tối thiểu được chứng minh là 58.0s, cao hơn Effective Takt 54.64s. Target 420 cần bottleneck ≤54.64s.

---

## 5. Analyze — phân tích nguyên nhân

### 5.1. 5 Why cho bottleneck ST24

1. **Why 1:** Vì sao ST24 là bottleneck?  
   → ST24 có 61.0s, gồm OP260 kiểm tra cuối (24s), OP270 nhập kho (12s), OP400 đóng thùng (25s).
2. **Why 2:** Vì sao 3 operation này cùng một station?  
   → First-fit xếp theo precedence và station target, không tối ưu global load.
3. **Why 3:** Vì sao không tách sang station khác?  
   → Các station trước đã đầy load; tách ra có thể tăng số station/worker.
4. **Why 4:** Vì sao không rebalance toàn line?  
   → Baseline là layout hiện trạng, không phải output optimizer; chưa chạy MILP cho style này.
5. **Why 5:** Vì sao chưa chạy MILP?  
   → Chưa có quy trình rebalance định kỳ sau style change; IE chỉ xử lý khi có sự cố.

**Root cause statement:**

> Layout baseline được xây bằng first-fit, chỉ đảm bảo feasible, không tối ưu global balance. Các operation cuối bị dồn vào ST24, trong khi các station đầu có load thấp. Thiếu quy trình rebalance định kỳ bằng MILP sau style change.

### 5.2. Điều cần kiểm tra trước khi rebalance

- Precedence: OP260 phải sau OP250; OP270 sau OP260; OP400 sau OP270.
- Skill: OP260 cần INSPECTION grade 3; OP270/OP400 cần FINISHING grade 1.
- Machine: OP260/OP270/OP400 là manual, `machine_type=None`.
- Một worker chỉ ở một station; một station một worker.
- Một station chỉ một loại máy; manual operations không cần máy.

---

## 6. Improve — Kaizen và kết quả

### 6.1. Countermeasures

| # | Hành động | Loại | Owner | Due |
|---:|---|---|---|---|
| 1 | Chạy MILP/HiGHS với objective min workers, sau đó min bottleneck | Optimize | IE | Day 1 |
| 2 | Rebalance operations theo precedence/skill/machine | Optimize | IE | Day 2 |
| 3 | Tách OP260/OP270/OP400 khỏi ST24; phân bổ lại operation cuối | Layout | IE + Supervisor | Day 2 |
| 4 | Redeploy 1 worker sang relief/quality support | HC | Production + HR | Day 3 |
| 5 | Cập nhật standard work và training cho station mới | Standardize | Trainer | Day 4 |
| 6 | Daily control bottleneck/LBE/capacity | Control | Line Engineer | Daily |

### 6.2. Kết quả solver

| Hạng mục | Kết quả |
|---|---|
| Solver | HiGHS 1.15.1 / PuLP 4.2.0 |
| Status | `OPTIMAL` |
| Lexicographic proven | Có |
| Solve time | 17.8s (lần chạy sample) |
| Stations | 23 |
| Workers used | 23 |
| Bottleneck | 58.0s tại ST09 (đồng thời ST10, ST22 cũng 58.0s) |
| LBE | 79.39% |
| Capacity | 395.7 pcs/shift |
| Target 420 achievement | 94.21% |
| Meets target | Không |

### 6.3. After station loads — top 10

| Station | Load (s) | Operations | Ghi chú |
|---|---:|---|---|
| ST09 | 58.0 | OP100, OP150 | Bottleneck |
| ST10 | 58.0 | OP110, OP160 | Bottleneck |
| ST22 | 58.0 | OP240, OP250, OP260 | Bottleneck |
| ST03 | 56.0 | OP040, OP050 | Gần bottleneck |
| ST13 | 55.0 | OP340, OP180 | Gần bottleneck |
| ST06 | 52.0 | OP320, OP330 | |
| ST17 | 52.0 | OP300, OP310 | |
| ST14 | 50.0 | OP140, OP170 | |
| ST01 | 48.0 | OP010, OP020 | |
| ST20 | 48.0 | OP210, OP220 | |

**Nhận xét:**

- Load được san đều hơn: top load giảm từ 61.0s xuống 58.0s.
- Không còn station 20–28s ở đầu line; các station thấp nhất khoảng 30–38s.
- ST22 vẫn gom OP260/OP270? Không: ST22 gồm OP240, OP250, OP260; OP270/OP400 chuyển sang ST23. Cần đọc đúng assignment, không suy diễn.

### 6.4. Before/after

| Chỉ số | Baseline | After | Delta | Công thức / ghi chú |
|---|---:|---:|---:|---|
| Stations | 24 | 23 | −1 | Số station có operation |
| Workers on line | 24 | 23 | −1 | 1 worker redeploy |
| Bottleneck | 61.0s | 58.0s | −3.0s | Max station load |
| LBE | 72.34% | 79.39% | +7.05 pp | Total planning SAM / (workers × bottleneck) |
| Smoothness index | 98.02 | 68.74 | −29.28 | Càng thấp càng tốt |
| Total idle | 270.857s | 209.571s | −61.286s | So với Effective Takt |
| Total overload | 18.429s | 11.786s | −6.643s | So với Effective Takt |
| Capacity | 376.2 | 395.7 | +19.5 pcs | 27,000 × 0.85 / bottleneck |
| Target 420 achievement | 89.58% | 94.21% | +4.63 pp | Capacity / 420 |
| Output / operator | 15.68 | 17.20 | +1.52 | Capacity / workers |
| Labor minutes / pc | 28.71 | 26.16 | −2.55 | Workers × 450 / capacity |

### 6.5. Cách đọc kết quả

- **LBE tăng 7.05 pp** là cân bằng load tốt hơn, không phải “công nhân làm việc chăm hơn”.
- **Capacity tăng 5.18%** nhờ bottleneck giảm, không phải nhờ tăng tốc độ máy.
- **Target 420 vẫn chưa đạt**: 94.21% < 100%. Không được ghi “đạt target”.
- **1 worker giảm** chỉ có ý nghĩa cost saving nếu được redeploy thực sự; nếu vẫn đứng trong line thì chỉ là capacity gain.
- **Không claim OEE tăng** vì case study không có runtime/performance/quality đủ để tính OEE.

---

## 7. Cost saving — estimated vs verified

### 7.1. Giả định chi phí

> Tất cả là giả định synthetic, không phải lương thật của HBI.

| Giả định | Giá trị | Ghi chú |
|---|---:|---|
| Direct labor rate | 60,000 VND/giờ | Synthetic planning rate |
| Paid hours / shift | 7.5 giờ | 480 − 30 break |
| Working days / month | 26 ngày | Synthetic calendar |
| Implementation cost | 12,000,000 VND | IE + training + visual aids |
| Revenue / margin | Không dùng | Không có dữ liệu |
| Material/energy saving | Không dùng | Không có dữ liệu |

**Chi tiết implementation cost:**

| Item | Quantity | Unit cost | Total |
|---|---:|---:|---:|
| IE analysis + solver run | 24 giờ | 250,000 VND/h | 6,000,000 |
| Operator training | 92 person-hour | 50,000 VND/h | 4,600,000 |
| Visual aids + standard work | 1 lot | 1,400,000 | 1,400,000 |
| **Tổng** | | | **12,000,000** |

### 7.2. Estimated saving

```text
Labor saving per shift
    = 1 worker × 7.5 h × 60,000 VND/h
    = 450,000 VND/shift

Estimated saving per month
    = 450,000 × 26
    = 11,700,000 VND/month

Net month 1
    = 11,700,000 − 12,000,000
    = −300,000 VND

Payback
    = 12,000,000 / 11,700,000
    = 1.03 months
```

**Điều kiện:** 1 worker phải được redeploy sang công việc có giá trị, không nằm lại line. Nếu không redeploy, **cash saving = 0**; khi đó chỉ có capacity gain.

### 7.3. Unit cost — không được nhầm với cash saving

```text
Baseline labor minutes / pc
    = 24 × 450 / 376.2
    = 28.71 min/pc

After labor minutes / pc
    = 23 × 450 / 395.7
    = 26.16 min/pc

Unit labor cost baseline
    = 28.71 × 1,000 VND/min
    = 28,710 VND/pc

Unit labor cost after
    = 26.16 × 1,000 VND/min
    = 26,160 VND/pc

Unit cost reduction
    = 2,550 VND/pc (8.88%)
```

**Cảnh báo:** 2,550 VND/pc × 10,288 pcs/month = 26.2 triệu VND/month **không phải cash saving**, vì phần lớn đến từ việc sản xuất thêm pcs. Chỉ monetize khi số pcs tăng thêm được bán/được chấp nhận. Cash saving thực tế từ giảm 1 worker là **11.7 triệu VND/month**.

### 7.4. Synthetic verified saving — 4-week pilot

| Hạng mục | Giá trị | Cách xác minh |
|---|---:|---|
| Production days trong pilot | 22 ngày | Timekeeping extract |
| Workers on line | 23 | Attendance sheet |
| Worker redeploy | 1 sang relief/quality | HR confirmation |
| Line labor cost reduction | 22 × 450,000 = 9,900,000 VND | Payroll extract |
| Implementation cost | 12,000,000 VND | Purchase/approval records |
| Net pilot month | 9,900,000 − 12,000,000 = −2,100,000 VND | Finance review |
| Run-rate sau pilot | 11,700,000 VND/month | 26 days |
| Payback | Từ tháng thứ 2 | Cumulative saving > cost |

**Điều kiện để gọi là verified:**

1. Worker redeploy được HR xác nhận, không phải chỉ trên giấy.
2. Payroll/timekeeping cho thấy line thực sự chạy 23 người.
3. Cùng style, cùng sản lượng, không có overtime/temporary worker bù vào.
4. Không có thay đổi method/SAM khác trong cùng kỳ.
5. Finance xác nhận cost center, không chỉ IE tự tính.

> Đây là **synthetic verified** trong bộ dữ liệu demo. Không phải verified saving của HBI.

### 7.5. Điều không được claim

- Không claim “tiết kiệm 26.2 triệu VND/tháng” từ unit cost reduction.
- Không claim “target 420 đạt” vì capacity 395.7 < 420.
- Không claim “OEE tăng” vì không có A/P/Q.
- Không claim “giảm 1 worker” nếu worker vẫn ở line.
- Không claim saving nếu không có redeploy confirmation.

### 7.6. Sensitivity — saving và payback theo giả định

```text
Saving/month = workers_reduced × paid_hours × labor_rate × working_days
Payback      = implementation_cost / saving_month
```

| Labor rate (VND/h) | Days/month | Saving/month | Net month 1 | Payback |
|---:|---:|---:|---:|---:|
| 50,000 | 26 | 9,750,000 | −2,250,000 | 1.23 |
| 60,000 | 26 | 11,700,000 | −300,000 | 1.03 |
| 70,000 | 26 | 13,650,000 | +1,650,000 | 0.88 |
| 60,000 | 22 | 9,900,000 | −2,100,000 | 1.21 |

- **Break-even labor rate** tại 26 ngày: `12,000,000 / (7.5 × 26) = 61,538 VND/h`.
- **Break-even working days** tại 60,000 VND/h: `12,000,000 / (7.5 × 60,000) = 26.67 ngày`.
- **Nếu không redeploy:** cash saving = 0, không có payback; chỉ có capacity gain +19.5 pcs/shift.

**Cách đọc:** Payback 0.88–1.23 tháng là sensitivity của **estimated** saving, không phải cam kết. Mọi con số phải gắn với labor rate, số ngày và redeploy thực tế; verified saving vẫn cần payroll/timekeeping và Finance xác nhận.

---

## 8. A3 one-page

| Phần | Nội dung |
|---|---|
| **Background** | Target 420 pcs/shift; baseline 24/24/61.0s; capacity 376.2; thiếu 43.8 pcs/shift; LBE 72.34%. |
| **Current condition** | Bottleneck ST24 61.0s (OP260/270/400); ST03 60.0s; nhiều station đầu 20–28s; target achievement 89.58%. |
| **Goal** | Bottleneck ≤58.0s; LBE ≥78%; capacity ≥390; workers ≤24; không vi phạm constraints. |
| **Root cause** | First-fit chỉ feasible, không global balance; operation cuối dồn ST24; thiếu rebalance định kỳ sau style change. |
| **Countermeasures** | MILP/HiGHS rebalance; tách operation cuối; redeploy 1 worker; standard work/training; daily control. |
| **Implementation plan** | Day 1 data validation; Day 2 solve + layout; Day 3 pilot + redeploy; Day 4 standardize; Day 5 review. |
| **Results** | 23/23/58.0s; LBE 79.39%; capacity 395.7; target 420 achievement 94.21%; estimated saving 11.7M VND/month; synthetic verified 22 ngày 9.9M, net −2.1M; payback estimated 1.03 tháng. |
| **Follow-up** | Control Plan; target 420 vẫn mở; xem xét 26-worker scenario hoặc giảm SAM; audit weekly. |

---

## 9. Control Plan

| KPI / hành vi | Target | Cách đo | Tần suất | Owner | Reaction khi lệch |
|---|---:|---|---|---|---|
| Bottleneck load | ≤58.0s | Max station load | Daily, đầu ca + 14:00 | Line Engineer | >58.0s 2 ca liên tiếp → kiểm tra assignment/skill/machine; re-run optimizer |
| LBE | ≥78.0% | Total planning SAM / (workers × bottleneck) | Daily | IE | <76% 2 ngày → review station loads |
| Capacity | ≥390 pcs/shift | 27,000 × 0.85 / bottleneck | Daily | Production | <380 2 ngày → root cause downtime/attendance/WIP |
| Target 420 achievement | Ghi rõ, không che gap | Capacity / 420 | Daily | Production Manager | <90% 2 ngày → escalation; không claim đạt |
| Workers on line | 23 | Attendance sheet | Daily | Supervisor/HR | >23 → xác nhận redeploy; <23 → kiểm tra absence/skill coverage |
| Labor cost / pc | ≤26,500 VND/pc | Labor cost / output | Weekly/monthly | Finance/IE | >26,500 2 tuần → review redeploy và productivity |
| Standard work audit | 100% station | Audit checklist | Weekly | IE | Sai → retrain, cập nhật SOP |
| Safety/ergonomics | Không có sự cố | EHS checklist | Monthly | EHS | Nếu layout thay đổi → đánh giá lại ergonomics trước khi chạy |

**Reaction plan chi tiết:**

```text
Bottleneck >58.0s trong 2 ca liên tiếp
    → Line Engineer kiểm tra assignment, skill, machine, WIP
    → Nếu do layout: re-run MILP với dữ liệu mới
    → Nếu do downtime: mở downtime RCA
    → Nếu do absence: kiểm tra skill coverage và relief

Target 420 <90% trong 2 ngày
    → Không tăng tốc độ máy hoặc ép công nhân
    → Kiểm tra capacity gap, HC, SAM, changeover
    → Escalate Production Manager; xem xét 26-worker scenario
```

---

## 10. Câu hỏi phỏng vấn và model answers

### Câu 1 — Vì sao dùng MILP thay vì heuristic?

> Heuristic first-fit chỉ đảm bảo feasible, không chứng minh được optimum. Với 40 operations và nhiều ràng buộc precedence/skill/machine, tôi dùng MILP/HiGHS để tối ưu lexicographic: giảm số worker trước, sau đó giảm bottleneck. Heuristic vẫn dùng để tạo baseline và warm start, nhưng không phải câu trả lời cuối. Kết quả scenario A được chứng minh `OPTIMAL` với 23 worker và 58.0s.

### Câu 2 — Vì sao target 420 vẫn không đạt?

> Vì bottleneck 58.0s vẫn cao hơn Effective Takt 54.64s. Với 24 worker available (optimizer dùng 23), 58.0s là optimum đã chứng minh; muốn đạt 420 phải giảm bottleneck xuống ≤54.64s, tăng thêm worker, hoặc giảm SAM bằng cải tiến method. Tôi không claim 420 feasible khi chưa có bằng chứng.

### Câu 3 — Saving 11.7 triệu VND/tháng có thật không?

> Đó là estimated saving, có điều kiện: 1 worker phải được redeploy và line thực sự chạy 23 người. Nếu worker vẫn ở line, cash saving bằng 0, chỉ có capacity gain. Tôi tách estimated và verified; verified cần payroll/timekeeping, redeploy confirmation và Finance xác nhận. Trong pilot synthetic 22 ngày, line labor cost giảm 9.9 triệu, net tháng đầu −2.1 triệu, payback từ tháng 2.

### Câu 4 — Vì sao không claim 26.2 triệu VND/tháng từ unit cost?

> Vì unit cost reduction 2,550 VND/pc nhân với sản lượng tăng thêm không phải cash saving. Phần lớn là productivity gain từ sản xuất thêm pcs; chỉ monetize khi số pcs đó được bán hoặc được chấp nhận. Cash saving thực tế từ giảm 1 worker là 11.7 triệu/tháng. Đây là lỗi rất dễ mắc khi làm cost saving.

### Câu 5 — Làm sao duy trì kết quả?

> Control Plan: bottleneck daily, LBE daily, capacity daily, HC adherence daily, labor cost weekly/monthly, standard work audit weekly. Có owner, tần suất, reaction. Nếu bottleneck >58s 2 ca, kiểm tra assignment/skill/machine và re-run optimizer. Nếu target 420 <90% 2 ngày, escalation; không ép công nhân tăng tốc.

### Câu 6 — LBE khác actual labor efficiency thế nào?

> LBE là mức cân bằng load giữa các station: total planning SAM / (workers × bottleneck). Actual labor efficiency là output thực tế × planning SAM / actual direct labor minutes. LBE cao không có nghĩa công nhân làm hiệu quả thực tế cao; phải đo actuals riêng. Trong case này, LBE 79.39% là planning metric, không phải actual efficiency.

### Câu 7 — Nếu 24 worker không thể redeploy thì sao?

> Khi đó không có cash saving; Kaizen chỉ tạo capacity gain 19.5 pcs/shift. Tôi sẽ trình bày với Production Manager: giữ 24 người cho relief/quality, hoặc dùng capacity tăng thêm để giảm overtime/short shipment. Không ghi “tiết kiệm” nếu không có redeploy.

---

## 11. Giới hạn và điều kiện xác minh

| Giới hạn | Tác động | Cách xác minh thật |
|---|---|---|
| Cost rate synthetic | Saving không đại diện HBI | Dùng payroll rate thật đã được Finance approve |
| 5 ngày pilot | Chưa đủ dài hạn | Theo dõi 4 tuần, so cùng style/line |
| Không có revenue/margin | Không monetize capacity gain | Lấy giá bán/margin từ Finance nếu cần |
| Không có OEE | Không claim machine utilization | Thu thập runtime/performance/quality nếu muốn tính OEE |
| Solver optimum cho sample | Không đại diện mọi dataset | Benchmark thêm 40–60 ops, ghi solve time/status |
| Target 420 chưa đạt | Không claim feasible | Thử 26 worker hoặc giảm SAM; ghi rõ status |
| Layout change có thể ảnh hưởng ergonomics | Chưa đánh giá | EHS review trước khi triển khai |

**Điều kiện để gọi là “verified” trong production:**

1. Cùng line/style/sản lượng, ít nhất 4 tuần trước và sau.
2. Payroll/timekeeping xác nhận 23 worker và redeploy.
3. Không có overtime/temporary worker bù vào.
4. Không thay đổi SAM/method khác trong cùng kỳ.
5. Finance xác nhận cost center và implementation cost.

---

## 12. Checklist hoàn thành T08

- [x] Có baseline 24/24/61.0s và after 23/23/58.0s.
- [x] Có before/after cùng đơn vị, cùng kỳ, cùng sản lượng.
- [x] Có LBE, bottleneck, HC, capacity, target achievement.
- [x] Có A3 một trang.
- [x] Có Control Plan với owner/frequency/reaction.
- [x] Có estimated saving và synthetic verified saving.
- [x] Có sensitivity payback theo labor rate/số ngày, break-even rate/days.
- [x] A3 ghi cả estimated và synthetic verified, không chỉ con số đẹp.
- [x] Có điều kiện redeploy rõ ràng.
- [x] Không claim target 420 đạt.
- [x] Không claim OEE/machine utilization.
- [x] Không quy đổi unit cost thành cash saving.
- [x] Chỉ dùng dữ liệu synthetic.
