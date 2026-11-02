# Case Study T07 — Quality RCA: Collar Attachment (OP060)

> **Loại:** Case study phân tích chất lượng, không phải module phần mềm.  
> **Dữ liệu:** 100% synthetic. Không phải dữ liệu thật của HBI.  
> **Phạm vi:** 1 line / 1 style / 1 operation / 2 giai đoạn 5 ngày.  
> **Liên kết:** `docs/IE_OPERATIONS_PLAYBOOK.md` §6 (DMAIC), `KPI_SPEC.md` §9 (Time Study), baseline 24/24/61.0s trong `CHECKLIST.md` §0.2.  
> **File dữ liệu:** `docs/data/quality_defects.csv`, `docs/data/quality_setup_audit.csv`.

---

## 1. Tóm tắt một trang

| Hạng mục | Trước Kaizen | Sau pilot | Thay đổi |
|---|---:|---:|---:|
| Sản lượng kiểm tra | 1,820 pcs / 5 ngày | 1,820 pcs / 5 ngày | Cùng kỳ, cùng style |
| Tổng defect tại OP060 | 45 | 18 | −27 (−60.0%) |
| Defect rate | 2.47% | 0.99% | −1.48 điểm % |
| First Pass Yield (FPY) | 97.53% | 99.01% | +1.48 điểm % |
| Rework time | 135 phút | 54 phút | −81 phút (−60.0%) |
| Top defect | Lệch cổ 18 (40.0%) | Cổ không đều 6 (33.3%) | Lệch cổ giảm 72.2% |
| DPMO (1 cơ hội/áo) | 24,725 | 9,890 | −14,835 |
| Z-benchmark (không 1.5σ) | 3.47 | 3.83 | +0.36 |

**Root cause đã xác minh trong bộ dữ liệu synthetic:**

> Collar guide/folder bị tháo khi changeover và không được lắp lại; checklist changeover không có bước kiểm tra guide; không có first-piece approval. Operator canh cổ bằng mắt, nên sai lệch cổ tập trung ngay sau changeover. Đây là lỗi **method + setup control**, không phải “operator bất cẩn”.

**Kết luận ngắn để phỏng vấn:**

> “Tôi chọn OP060 vì đây là operation có defect rate cao nhất trong 5 ngày. Tôi đo 45 defect trên 1,820 pcs, Pareto cho thấy lệch cổ chiếm 40%. Sau khi xác minh bằng setup audit, nguyên nhân là guide không được lắp lại sau changeover và không có first-piece check. Tôi restored guide, thêm bước kiểm tra vào checklist, cập nhật SOP và bắt buộc first-piece approval. Sau 5 ngày pilot, defect rate giảm từ 2.47% xuống 0.99%, FPY từ 97.53% lên 99.01%. Tôi giữ kết quả bằng Control Plan chứ không chỉ làm một lần.”

---

## 2. Define — xác định vấn đề

### 2.1. Problem statement

Trong 5 ngày sản xuất 2026-10-26 → 2026-10-30, line `LINE_01`, style `BASIC-TEE-001`, operation `OP060 — May cổ`:

- 1,820 pcs được kiểm tra 100% tại end-line;
- 45 pcs bị defect liên quan đến cổ, phải rework;
- defect rate = **2.47%**;
- rework = **135 phút** (45 defect × 3 phút/defect);
- top defect là **lệch cổ**: 18/45 = **40.0%**.

Vấn đề không phải “chất lượng nói chung”, mà là: **collar attachment tạo ra tỷ lệ lệch cổ lặp lại sau changeover, gây rework và làm giảm FPY.**

### 2.2. Scope và CTQ

| Hạng mục | Nội dung |
|---|---|
| Line | `LINE_01` |
| Style | `BASIC-TEE-001` |
| Operation | `OP060 — May cổ` (overlock) |
| Downstream | `OP070 — Diễu cổ`, `OP190 — Kiểm tra thân áo`, `OP260 — Kiểm tra cuối` |
| Thời gian trước | 2026-10-26 → 2026-10-30 |
| Thời gian sau | 2026-11-02 → 2026-11-06 |
| Defect definition | Lỗi liên quan đến cổ được phát hiện tại end-line và phải rework |
| CTQ 1 | Collar edge alignment trong dung sai synthetic ±2 mm |
| CTQ 2 | Không nhăn đường may tại đường cong cổ |
| CTQ 3 | Không bỏ mũi tại mối nối cổ |

> **Lưu ý:** dung sai ±2 mm là giả định synthetic cho case study, không phải tiêu chuẩn HBI. Khi làm thật phải lấy từ tech pack/quality standard của style.

### 2.3. SIPOC rút gọn

| S | I | P | O | C |
|---|---|---|---|---|
| Cutting, collar supplier, maintenance | Cut panels, collar interlining, thread, guide/folder, trained operator | OP060 may cổ → OP070 diễu cổ → inspection | Collar attached, defect-free garment | Downstream stations, end customer |

### 2.4. Mục tiêu

| Mục tiêu | Baseline | Target | Cách đo |
|---|---:|---:|---|
| Defect rate OP060 | 2.47% | ≤1.50% | Defect / inspected pcs |
| FPY | 97.53% | ≥98.50% | (Inspected − defect) / inspected |
| Rework time | 135 phút / 5 ngày | ≤75 phút / 5 ngày | Rework log |
| Lệch cổ | 18 pcs | ≤7 pcs / 5 ngày | Pareto by defect type |

Target được đặt để **giảm ít nhất 40%**, không phải “zero defect”. Zero defect không phải mục tiêu thực tế trong 5 ngày pilot.

---

## 3. Measure — đo hiện trạng

### 3.1. Nguồn dữ liệu

- End-line inspection: 100% sản lượng, 1,820 pcs.
- Rework log: mỗi defect ghi loại lỗi, station, thời điểm.
- Setup audit: 5 lần changeover, kiểm tra guide có mặt và first-piece check.
- Dữ liệu synthetic, không có tên công nhân; không dùng dữ liệu cá nhân.

### 3.2. Defect Pareto trước

| Defect type | Count | % | Cumulative % |
|---|---:|---:|---:|
| Lệch cổ | 18 | 40.00% | 40.00% |
| Cổ không đều | 12 | 26.67% | 66.67% |
| Nhăn đường may cổ | 9 | 20.00% | 86.67% |
| Bỏ mũi | 6 | 13.33% | 100.00% |
| **Tổng** | **45** | **100%** | |

**Đọc Pareto:** top 2 loại lỗi chiếm **66.67%**; top 3 chiếm **86.67%**. Vì vậy không cần giải quyết tất cả 4 loại cùng lúc. Ưu tiên lệch cổ và cổ không đều.

### 3.3. FPY và rework

```text
FPY = (inspected − defect) / inspected × 100
    = (1,820 − 45) / 1,820 × 100
    = 97.53%

Rework time = 45 defect × 3.0 phút/defect
            = 135 phút / 5 ngày
            = 27 phút/ngày
```

**Phân biệt:**

- `FPY = 97.53%` là tỷ lệ pass ngay lần đầu, **trước rework**.
- Nếu 45 pcs đều rework thành công, final yield = 100%; nhưng FPY vẫn là 97.53%.
- Không được báo “chất lượng 100%” chỉ vì cuối ngày không còn hàng lỗi.

### 3.4. Giới hạn của phép đo

- Attribute inspection (pass/fail), chưa có GR&R.
- 2 inspectors, chưa đo mức đồng nhất giữa người kiểm.
- Chưa stratify theo operator/shift vì dữ liệu synthetic không gắn tên người.
- 5 ngày là pilot ngắn; chưa đủ để kết luận dài hạn.
- Defect count là defect **phát hiện được**, không phải toàn bộ defect thực tế nếu inspection bỏ sót.

---

## 4. Analyze — tìm nguyên nhân gốc

### 4.1. Fishbone 4M

| Nhóm | Giả thuyết | Bằng chứng synthetic | Kết luận |
|---|---|---|---|
| **Man** | Operator mới chưa quen | 3 operator cùng có lỗi; 2/6 chưa được train guide mới | Chưa đủ mạnh để là root cause |
| **Machine** | Overlock tension/needle sai | Maintenance log bình thường; lỗi vẫn xuất hiện sau khi chỉnh máy | Không phải nguyên nhân chính |
| **Method** | Không có guide chuẩn; canh cổ bằng mắt; không có first-piece check | Guide missing 4/5 changeover; first-piece check chỉ 2/5 | **Root cause chính** |
| **Material** | Collar interlining dày mỏng không đều | 2 lô nguyên liệu, incoming check không khác biệt rõ | Chưa được xác nhận; cần theo dõi thêm |

### 4.2. 5 Why

1. **Why 1:** Vì sao cổ bị lệch?  
   → Operator canh mép cổ với thân bằng mắt, không có guide cố định.
2. **Why 2:** Vì sao không có guide?  
   → Guide/folder bị tháo khi changeover sang style trước và không được lắp lại.
3. **Why 3:** Vì sao không được lắp lại?  
   → Checklist changeover không có bước “kiểm tra collar guide”.
4. **Why 4:** Vì sao checklist không có?  
   → Setup standard chưa được cập nhật sau khi guide được đưa vào sử dụng.
5. **Why 5:** Vì sao chưa cập nhật?  
   → Không có owner rõ ràng cho setup standard và không có audit định kỳ; setup dựa vào trí nhớ operator.

**Root cause statement:**

> Hệ thống setup thiếu kiểm soát: collar guide không được đưa vào checklist changeover, không có first-piece approval, và không có owner/audit cho setup standard. Điều này tạo điều kiện cho lỗi lệch cổ lặp lại sau changeover.

### 4.3. Xác minh root cause

**Setup audit trước — 5 changeover:**

| Changeover | Guide present? | First-piece check? | Lệch cổ trong 2 giờ sau changeover |
|---|---|---:|---:|
| 2026-10-26 | Không | Không | 4 |
| 2026-10-27 | Có | Có | 3 |
| 2026-10-28 | Không | Không | 3 |
| 2026-10-29 | Không | Không | 2 |
| 2026-10-30 | Không | Có (visual) | 2 |
| **Tổng** | **1/5** | **2/5** | **14** |

- 14/18 lệch cổ (77.8%) xảy ra trong 2 giờ sau changeover.
- Guide chỉ có mặt 1/5 lần; first-piece check chỉ 2/5 lần.
- Đây là **association**, chưa phải bằng chứng nhân quả tuyệt đối. Bước improve (restore guide) là phép thử để xác nhận: nếu lệch cổ giảm mạnh khi guide luôn có mặt, giả thuyết được củng cố.

### 4.4. Điều không được kết luận

- Không kết luận “operator yếu” khi chưa tách ảnh hưởng của method/setup.
- Không kết luận “mua máy mới” khi máy không phải nguyên nhân.
- Không kết luận “collar interlining là nguyên nhân” khi dữ liệu incoming chưa đủ.
- Không dùng defect rate 2.47% để suy ra cost nếu chưa có cost of quality.

---

## 5. Improve — hành động và pilot

### 5.1. Countermeasures

| # | Hành động | Loại | Owner | Due | Cách xác minh |
|---:|---|---|---|---|---|
| 1 | Lắp lại và chuẩn hóa collar guide/folder; đánh dấu vị trí | Prevent | Line Engineer | Day 1 | Guide có mặt 5/5 changeover |
| 2 | Thêm “guide check + first-piece check” vào changeover checklist | Detect/Prevent | Production Supervisor | Day 1 | Audit checklist 5/5 |
| 3 | Cập nhật SOP có ảnh, nêu rõ cách canh cổ và kiểm tra guide | Prevent | Trainer | Day 2 | 6/6 operator sign-off |
| 4 | First-piece approval bởi QC sau mỗi changeover; hold đến khi pass | Detect | QC | Day 2 | 5/5 first-piece record |
| 5 | Daily Pareto tại OP060; nếu lệch cổ >2 pcs/ngày thì dừng kiểm tra guide | Control | Line Engineer | Daily | Pareto + escalation log |

**Thứ tự ưu tiên:** loại bỏ nguyên nhân (guide + checklist) trước, sau đó mới thêm kiểm tra (first-piece). Không chỉ thêm inspection vì inspection không sửa được nguyên nhân.

### 5.2. Thiết kế pilot

- Cùng line, cùng style, cùng 5 ngày, cùng 1,820 pcs.
- Cùng tiêu chuẩn inspection và cùng 2 inspectors.
- Chỉ thay đổi 5 countermeasure ở trên; không thay đổi SAM, layout, hay machine.
- Đo lại đúng 4 chỉ số: defect count, defect rate, FPY, rework minutes.

### 5.3. Kết quả trước/sau

| Chỉ số | Trước | Sau | Delta | Cách tính |
|---|---:|---:|---:|---|
| Inspected pcs | 1,820 | 1,820 | 0 | Cùng sản lượng |
| Total defects | 45 | 18 | −27 | Đếm defect |
| Defect rate | 2.47% | 0.99% | −1.48 pp | Defect / inspected |
| FPY | 97.53% | 99.01% | +1.48 pp | (Inspected − defect) / inspected |
| Rework minutes | 135 | 54 | −81 | Defect × 3 phút |
| Lệch cổ | 18 | 5 | −13 (−72.2%) | Pareto |
| Cổ không đều | 12 | 6 | −6 (−50.0%) | Pareto |
| Nhăn đường may | 9 | 4 | −5 (−55.6%) | Pareto |
| Bỏ mũi | 6 | 3 | −3 (−50.0%) | Pareto |

### 5.4. Pareto sau

| Defect type | Count | % | Cumulative % |
|---|---:|---:|---:|
| Cổ không đều | 6 | 33.33% | 33.33% |
| Lệch cổ | 5 | 27.78% | 61.11% |
| Nhăn đường may cổ | 4 | 22.22% | 83.33% |
| Bỏ mũi | 3 | 16.67% | 100.00% |
| **Tổng** | **18** | **100%** | |

**Đọc kết quả:**

- Lệch cổ giảm 72.2%, đúng với giả thuyết guide/setup.
- Defect rate giảm 60%, vượt target ≤1.50%.
- Top defect mới là **cổ không đều** (6 pcs). Đây là bài học: sau Kaizen, Pareto thay đổi; không được dừng ở “đã giảm”.
- 18 defect còn lại có thể do biến thiên nguyên liệu, tay nghề, hoặc dung sai guide; cần vòng DMAIC tiếp theo.

### 5.5. Điều không được claim

- Không claim “giảm 60% là statistically significant” trong sản xuất chỉ từ 5 ngày. Test minh họa ở §6A cho p ≈ 0.0006 trên dữ liệu synthetic, nhưng giả định inspection độc lập và không thay thế validation production.
- Không claim “zero defect” vì còn 18 defect.
- Không quy đổi 81 phút rework thành tiền khi chưa có cost of quality.
- Không claim kết quả này áp dụng cho mọi style/line.

---

## 6. Control — duy trì kết quả

### 6.1. Control Plan

| KPI / hành vi | Target | Cách đo | Tần suất | Owner | Reaction khi lệch |
|---|---:|---|---|---|---|
| Defect rate OP060 | ≤1.50% | Defect / inspected pcs | Daily | QC | >1.50% trong 2 ngày → mở lại 5 Why |
| FPY | ≥98.50% | (Inspected − defect) / inspected | Daily | Production | <98.50% trong 2 ngày → escalation Line Manager |
| Lệch cổ | ≤2 pcs/ngày | Pareto by defect type | Daily | Line Engineer | >2 pcs/ngày → dừng, kiểm tra guide + first-piece |
| Guide presence | 100% | Changeover audit | Mỗi changeover | Supervisor | Thiếu guide → dừng setup, lắp lại, first-piece |
| First-piece approval | 100% | Sign-off sheet | Mỗi changeover | QC | Không có sign-off → không cho sản xuất |
| Rework minutes | ≤15 phút/ngày | Rework log | Daily | IE | >15 phút/ngày → điều tra theo defect type |
| SOP/training | 100% operator | Training record | Monthly | Trainer | Thiếu → retrain trước khi làm |

### 6.2. Chuẩn hóa

- Cập nhật `Standard Work` cho OP060: ảnh guide, vị trí đặt, cách canh cổ, first-piece check.
- Đưa guide check vào checklist changeover, ký bởi Supervisor.
- Đào tạo 6 operator; chỉ cho làm khi có sign-off.
- Lưu Pareto và rework log tại line; review trong daily meeting.

### 6.3. Escalation

```text
Defect rate >1.50% trong 2 ngày liên tiếp
    → Line Engineer + QC kiểm tra guide, first-piece, material lot
    → Nếu vẫn >2.50% trong 3 ngày
    → Escalate Quality Manager, mở DMAIC mới
```

### 6.4. Audit

- **Daily:** QC kiểm defect rate, first-piece record.
- **Weekly:** Line Engineer audit guide presence và SOP adherence.
- **Monthly:** IE/Quality review Pareto, training record, cost of quality (nếu có dữ liệu).

---

## 6A. Six Sigma metrics — chạy thêm trên dữ liệu synthetic

> **Phạm vi:** phân tích bổ sung cho case study; không phải KPI contract của API.
> **Giả định:** 1 cơ hội/áo (collar attachment), 100% inspection, các defect độc lập.

**Công thức:**

```text
DPMO = defects / opportunities × 1,000,000
Z_benchmark = 0.8406 + sqrt(29.37 − 2.221 × ln(DPMO))
```

Z-benchmark là **short-term Z**, chưa cộng 1.5σ shift.

| Chỉ số | Trước | Sau | Ghi chú |
|---|---:|---:|---|
| Defect rate | 2.47% | 0.99% | 45/1,820; 18/1,820 |
| DPMO | 24,725 | 9,890 | 1 cơ hội/áo |
| Z-benchmark | 3.47 | 3.83 | Không cộng 1.5σ |

### 6A.1. Two-proportion z-test

So sánh tỷ lệ defect trước/sau:

```text
p1 = 45 / 1,820 = 0.024725
p2 = 18 / 1,820 = 0.009890
p_pool = 63 / 3,640 = 0.017308
SE = sqrt(p_pool × (1 − p_pool) × (2 / 1,820)) = 0.004323
z = (p1 − p2) / SE = 3.4315
p-value (2 phía) ≈ 0.0006
95% CI (unpooled) = 0.64 – 2.33 điểm %
```

**Cách đọc:** Với giả thuyết H0 “hai tỷ lệ bằng nhau”, chênh lệch quan sát khó xảy ra (p ≈ 0.0006). Đây là **minh họa trên dữ liệu synthetic**, giả định inspection độc lập; không chứng minh nhân quả và không thay thế validation production.

### 6A.2. p-chart

Giả định 364 pcs/ngày (1,820 / 5):

| Giai đoạn | p̄ | UCL | LCL | Điểm ngoài limit |
|---|---:|---:|---:|---:|
| Trước | 2.47% | 4.91% | 0.03% | 0/5 |
| Sau | 0.99% | 2.55% | 0% | 0/5 |

Cả 5 điểm mỗi giai đoạn nằm trong limit, không có special-cause signal trong từng giai đoạn; tín hiệu chính là **level shift** giữa hai giai đoạn. Với chỉ 5 điểm, limit là provisional; muốn kết luận ổn định cần 20–25 subgroup.

### 6A.3. Giới hạn

- 1 cơ hội/áo là giả định; nếu một áo có nhiều cơ hội lỗi, DPMO thay đổi.
- 5 ngày, 2 inspectors, chưa có GR&R; inspection có thể bỏ sót defect.
- z-test giả định defect độc lập; nếu defect cluster theo ngày/operator, p-value bị lạc quan.
- Chưa có cost of quality; không quy đổi 81 phút rework thành tiền.
- Không gọi “Six Sigma certified” hoặc “statistically proven in production”.

---

## 7. A3/DMAIC summary — dùng khi phỏng vấn

| Phần | Nội dung |
|---|---|
| **Background** | OP060 may cổ có defect rate 2.47%, rework 135 phút/5 ngày, ảnh hưởng FPY và downstream. |
| **Current condition** | 45/1,820 defect; lệch cổ 40%; guide chỉ 1/5 changeover; first-piece check 2/5. |
| **Goal** | Defect rate ≤1.50%, FPY ≥98.50%, giảm rework ≥40% trong 5 ngày pilot. |
| **Root cause** | Guide không được lắp lại sau changeover; checklist thiếu guide check; không có first-piece approval; không có owner/audit. |
| **Countermeasures** | Restore guide, checklist, SOP/training, first-piece approval, daily Pareto. |
| **Results** | 45→18 defect (−60%); 2.47%→0.99%; FPY 97.53%→99.01%; rework 135→54 phút. |
| **Follow-up** | Control Plan; top defect mới là cổ không đều; mở vòng DMAIC tiếp theo nếu >1.50%. |

---

## 8. Câu hỏi phỏng vấn và model answers

### Câu 1 — Em xác định vấn đề chất lượng như thế nào?

> Em không bắt đầu bằng “chất lượng kém”. Em chọn một operation cụ thể, đo defect rate, Pareto theo defect type, và xác định tác động lên FPY/rework. Với OP060, em có 45 defect trên 1,820 pcs, tương đương 2.47%, và lệch cổ chiếm 40%. Đó là vấn đề đủ cụ thể để hành động.

### Câu 2 — Làm sao em tránh đổ lỗi cho công nhân?

> Em tách 4M: Man, Machine, Method, Material. Dữ liệu cho thấy 3 operator cùng có lỗi, máy bình thường, nhưng guide chỉ có 1/5 changeover và first-piece check chỉ 2/5. Vì vậy em tập trung vào method/setup control. Nếu chỉ nói “công nhân bất cẩn” thì không sửa được hệ thống.

### Câu 3 — Em xác minh root cause bằng gì?

> Em dùng setup audit 5 changeover, đối chiếu guide presence, first-piece check và lệch cổ trong 2 giờ sau changeover. 14/18 lệch cổ xảy ra sau changeover, guide chỉ 1/5 lần. Sau đó em restore guide và chạy pilot 5 ngày; lệch cổ giảm 72.2%, củng cố giả thuyết. Em vẫn nói rõ đây là association + pilot evidence, không phải bằng chứng nhân quả tuyệt đối.

### Câu 4 — Tại sao không chỉ thêm kiểm tra cuối?

> Kiểm tra cuối chỉ phát hiện lỗi, không ngăn lỗi. Em ưu tiên loại bỏ nguyên nhân: guide + checklist + first-piece. Inspection là lớp bảo vệ cuối, không phải giải pháp chính. Nếu chỉ thêm inspector, defect vẫn tiếp tục và rework vẫn tăng.

### Câu 5 — Làm sao duy trì kết quả?

> Em dùng Control Plan: defect rate daily, guide presence mỗi changeover, first-piece sign-off, rework minutes daily, audit weekly. Có owner, tần suất và reaction rõ ràng. Nếu vượt ngưỡng 2 ngày, mở lại 5 Why; nếu vượt 3 ngày, escalate Quality Manager.

### Câu 6 — Kết quả này có chuyển thành tiền được không?

> Chưa. Em mới có 81 phút rework giảm, nhưng chưa có cost of quality, labor rate chính thức, hay scrap cost. Em không quy đổi khi chưa có dữ liệu. Nếu có, em sẽ tính cost of poor quality theo defect type và xác nhận với Finance.

---

## 9. Giới hạn và điều kiện xác minh trong sản xuất thật

| Giới hạn | Tác động | Cách xác minh thật |
|---|---|---|
| Dữ liệu synthetic | Không đại diện HBI | Chạy lại với dữ liệu thật đã ẩn danh, có approval |
| 5 ngày pilot | Chưa đủ dài hạn | Theo dõi 4 tuần, so sánh cùng style/line |
| Chưa có GR&R | Đo lường có thể sai | Làm attribute agreement study với 2–3 inspectors |
| Chưa stratify theo operator/shift | Có thể còn biến số ẩn | Phân tích theo shift/operator group, không dùng tên cá nhân |
| Hypothesis test mới là minh họa | p ≈ 0.0006 trên synthetic, giả định independence; chưa đủ cho production | Chạy lại với dữ liệu thật, kiểm tra clustering, baseline ≥4 tuần |
| Chưa có cost of quality | Chưa quy đổi tiền | Thu thập rework cost, scrap cost, inspection cost |

**Điều kiện để gọi là “verified” trong production:**

1. Cùng line, cùng style, cùng điều kiện vận hành.
2. Có baseline ít nhất 4 tuần trước.
3. Có ít nhất 4 tuần sau, không thay đổi method khác.
4. Có kiểm soát inspector và định nghĩa defect.
5. Có xác nhận của Quality/Production, không chỉ số liệu tự báo cáo.

---

## 10. Checklist hoàn thành T07

- [x] Có problem statement, scope, CTQ.
- [x] Có dữ liệu defect synthetic theo ngày và defect type.
- [x] Có Pareto trước/sau.
- [x] Có FPY và rework calculation.
- [x] Có fishbone 4M.
- [x] Có 5 Why và root cause statement.
- [x] Có xác minh root cause bằng setup audit.
- [x] Có countermeasure + owner + due date.
- [x] Có before/after cùng kỳ, cùng sản lượng.
- [x] Có Control Plan với owner/frequency/reaction.
- [x] Có DPMO và Z-benchmark minh họa, ghi rõ 1 cơ hội/áo.
- [x] Có two-proportion z-test + 95% CI, ghi rõ giả định independence.
- [x] Có p-chart minh họa và caveat 5 điểm.
- [x] Không gọi “Six Sigma certified” hoặc “statistically proven in production”.
- [x] Có giới hạn và điều kiện xác minh.
- [x] Không quy đổi tiền khi chưa có cost data.
- [x] Không claim nhân quả tuyệt đối.
- [x] Chỉ dùng dữ liệu synthetic.
