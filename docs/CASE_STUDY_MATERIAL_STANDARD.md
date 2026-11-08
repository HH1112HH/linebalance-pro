# Case Study T13 — Material Standardization: Thread, 3M Tape, Binding

> **Loại:** Case study định mức nguyên phụ liệu + module usage-variance giới hạn trong app. Không phải material master/BOM module đầy đủ.  
> **Dữ liệu:** 100% synthetic. Không phải định mức, giá mua hoặc kết quả sản xuất thật của HBI.  
> **Phạm vi:** `LINE_01`, style `BASIC-TEE-001`, 3 vật tư, 2 giai đoạn 5 ngày, 1,820 pcs/giai đoạn.  
> **Liên kết:** `DATA_DICTIONARY.md` §5.2, `docs/IE_OPERATIONS_PLAYBOOK.md` Module 3 (waste) và Module 7 (material flow), `KPI_SPEC.md` §9 (time study).  
> **File dữ liệu:** `docs/data/material_consumption.csv`.

---

## 1. Tóm tắt một trang

| Hạng mục | Trước | Sau pilot | Thay đổi |
|---|---:|---:|---:|
| Sản lượng so sánh | 1,820 pcs | 1,820 pcs | Cùng style, cùng line |
| Standard material cost | 22,222,200 VND | 22,222,200 VND | Không đổi định mức |
| Actual material cost | 23,205,000 VND | 22,686,300 VND | −518,700 VND |
| Excess vs standard | 982,800 VND (4.42%) | 464,100 VND (2.09%) | −518,700 VND (−52.8% excess) |
| Material cost / pc | 12,750 VND | 12,465 VND | −285 VND/pc |
| Thread consumption | 46.8 m/pc | 45.9 m/pc | −0.9 m/pc (−1.92%) |
| 3M tape consumption | 0.38 m/pc | 0.36 m/pc | −0.02 m/pc (−5.26%) |
| Binding consumption | 0.66 m/pc | 0.62 m/pc | −0.04 m/pc (−6.06%) |

**Kết luận ngắn để phỏng vấn:**

> “Tôi chọn ba vật tư có mức tiêu hao cao và dễ đo trên line: chỉ, băng keo 3M và viền. Định mức là 45.0 m chỉ, 0.35 m băng keo và 0.60 m viền mỗi áo. Trước cải tiến, tiêu hao thực tế là 46.8 / 0.38 / 0.66, làm material cost cao hơn định mức 4.42%. Tôi xác định nguyên nhân là thiếu chuẩn cấp phát, cắt băng keo bằng tay không có jig, và không kiểm soát chiều dài viền. Sau khi chuẩn hóa BOM, cấp phát theo kit, làm jig cắt và cập nhật Standard Work, tiêu hao còn 45.9 / 0.36 / 0.62; phần vượt định mức giảm 52.8%. Tôi không gọi đây là cash saving vì giá và định mức là synthetic, và mức tiêu hao vẫn còn cao hơn định mức.”

---

## 2. Bối cảnh và vấn đề

### 2.1. Vì sao chọn ba vật tư này

- **Chỉ may (thread):** tiêu hao lớn, phụ thuộc stitch length, tension, số lớp vải và đường may; dễ đo bằng số bobbin/cone xuất kho.
- **Băng keo 3M:** thường cắt thủ công, khó kiểm soát chiều rộng/chiều dài; sai lệch nhỏ nhân với sản lượng lớn thành chi phí đáng kể.
- **Viền (binding):** chiều dài cắt và độ co giãn ảnh hưởng trực tiếp đến tiêu hao; dễ phát sinh đầu thừa nếu không có guide.

Đây là **3 vật tư đại diện**, không phải toàn bộ BOM. Không dùng kết quả này để kết luận cho tất cả nguyên phụ liệu.

### 2.2. Problem statement

Trong 5 ngày trước cải tiến (2026-10-26 → 2026-10-30), line `LINE_01`, style `BASIC-TEE-001`:

- 1,820 pcs được sản xuất và kiểm tra;
- material cost thực tế 23,205,000 VND, cao hơn định mức 982,800 VND (**+4.42%**);
- chỉ vượt 1.8 m/pc, băng keo vượt 0.03 m/pc, viền vượt 0.06 m/pc;
- không có standard issue quantity, không có jig cắt băng keo, không có kiểm tra chiều dài viền tại station.

Vấn đề không phải “công nhân dùng hoang phí”, mà là **thiếu định mức cấp phát và method chuẩn** để operator làm đúng ngay từ đầu.

---

## 3. Định nghĩa và công thức

### 3.1. Standard consumption

```text
standard_qty_per_pc = định mức vật tư cho 1 áo, lấy từ BOM/tech pack
standard_cost_vnd   = standard_qty_per_pc × inspected_pcs × unit_cost_vnd
```

### 3.2. Actual consumption

```text
actual_qty_per_pc = (vật tư xuất kho − vật tư hoàn trả) / số pcs sản xuất
actual_cost_vnd   = actual_qty_per_pc × inspected_pcs × unit_cost_vnd
```

Quy ước đo:

- Vật tư xuất kho theo kit/line, trừ phần hoàn trả nguyên cuộn/nguyên hộp.
- Actual consumption **bao gồm** scrap và rework; dataset không tách scrap riêng.
- Không bao gồm hư hỏng trong kho hoặc hao hụt ngoài line.
- Cùng một đơn giá cho trước và sau để cô lập biến động lượng.

### 3.3. Variance

```text
variance_vnd = actual_cost_vnd − standard_cost_vnd
variance_pct = (actual_qty_per_pc / standard_qty_per_pc − 1) × 100
```

- Variance dương = tiêu hao nhiều hơn định mức (unfavorable).
- Variance âm = tiết kiệm so với định mức (favorable).
- Đây là **material usage variance**, không phải price variance vì unit cost giữ nguyên.

---

## 4. Dữ liệu và phương pháp

### 4.1. Phạm vi so sánh

| Hạng mục | Trước | Sau |
|---|---|---|
| Line | `LINE_01` | `LINE_01` |
| Style | `BASIC-TEE-001` | `BASIC-TEE-001` |
| Thời gian | 2026-10-26 → 2026-10-30 | 2026-11-02 → 2026-11-06 |
| Số ngày | 5 | 5 |
| Sản lượng | 364 pcs/ngày × 5 = 1,820 pcs | 364 pcs/ngày × 5 = 1,820 pcs |
| Routing/SAM | Không đổi | Không đổi |
| Máy/thiết bị | Không đổi | Không đổi |
| Đơn giá vật tư | Giữ cố định | Giữ cố định |

### 4.2. Nguồn số liệu synthetic

- `docs/data/material_consumption.csv`: 30 dòng = 2 giai đoạn × 5 ngày × 3 vật tư.
- Sản lượng mỗi ngày: 364 pcs; tổng 1,820 pcs/giai đoạn.
- Định mức: chỉ 45.0 m/pc; băng keo 0.35 m/pc; viền 0.60 m/pc.
- Đơn giá synthetic: chỉ 250 VND/m; băng keo 1,200 VND/m; viền 900 VND/m.
- Tất cả dòng có `data_policy = SYNTHETIC`.

### 4.3. Cách kiểm chứng

1. Đối chiếu sản lượng với end-line production count.
2. Đối chiếu vật tư xuất/hoàn trả với phiếu kho.
3. Tính lại standard/actual cost từ CSV, không lấy số tổng trong slide.
4. Kiểm tra cùng style, cùng routing, cùng đơn giá, cùng kỳ 5 ngày.
5. Chỉ accept khi variance giảm mà không làm giảm chất lượng hoặc tăng downtime.

---

## 5. Kết quả

### 5.1. Tiêu hao theo vật tư

| Vật tư | Standard (m/pc) | Before (m/pc) | After (m/pc) | Before vs standard | After vs standard |
|---|---:|---:|---:|---:|---:|
| Chỉ | 45.00 | 46.80 | 45.90 | +1.80 (+4.00%) | +0.90 (+2.00%) |
| Băng keo 3M | 0.35 | 0.38 | 0.36 | +0.03 (+8.57%) | +0.01 (+2.86%) |
| Viền | 0.60 | 0.66 | 0.62 | +0.06 (+10.00%) | +0.02 (+3.33%) |

### 5.2. Chi phí theo vật tư

| Vật tư | Standard cost | Before actual | Before variance | After actual | After variance |
|---|---:|---:|---:|---:|---:|
| Chỉ | 20,475,000 | 21,294,000 | +819,000 | 20,884,500 | +409,500 |
| Băng keo 3M | 764,400 | 829,920 | +65,520 | 786,240 | +21,840 |
| Viền | 982,800 | 1,081,080 | +98,280 | 1,015,560 | +32,760 |
| **Tổng** | **22,222,200** | **23,205,000** | **+982,800** | **22,686,300** | **+464,100** |

### 5.3. Mức giảm variance

| Vật tư | Before variance | After variance | Giảm | % giảm |
|---|---:|---:|---:|---:|
| Chỉ | 819,000 | 409,500 | 409,500 | 50.00% |
| Băng keo 3M | 65,520 | 21,840 | 43,680 | 66.67% |
| Viền | 98,280 | 32,760 | 65,520 | 66.67% |
| **Tổng** | **982,800** | **464,100** | **518,700** | **52.78%** |

**Đọc kết quả:**

- Cả ba vật tư đều giảm tiêu hao, nhưng **chưa đạt định mức**. Đây là cải tiến một phần, không phải “zero waste”.
- Băng keo và viền giảm mạnh nhất theo % vì trước đó không có jig/guide.
- Chỉ vẫn còn +2.0% so với định mức; cần tiếp tục kiểm tra tension, stitch length và bobbin remnant.
- Khoản 518,700 VND là **cost avoidance trong cửa sổ 1,820 pcs**, không phải cash saving đã được Finance xác nhận.

---

## 6. Phân tích nguyên nhân

### 6.1. 5 Why — chỉ may

1. Vì sao tiêu hao chỉ cao? Vì mỗi áo dùng nhiều chỉ hơn định mức.
2. Vì sao dùng nhiều hơn? Vì chiều dài mũi may/đường may không được chuẩn hóa theo operation.
3. Vì sao không chuẩn hóa? Vì BOM chỉ có định mức tổng, chưa có định mức theo operation và machine setting.
4. Vì sao chưa có? Vì chưa có standard issue quantity và chưa gắn trách nhiệm cập nhật BOM.
5. Vì sao chưa gắn? Vì IE, Production và Warehouse chưa có nhịp review tiêu hao hằng ngày.

### 6.2. 5 Why — băng keo 3M

1. Vì sao tiêu hao cao? Vì đoạn cắt dài và rộng hơn cần thiết.
2. Vì sao? Vì operator cắt bằng tay, không có jig/mark.
3. Vì sao? Vì chưa có standard work cho thao tác cắt.
4. Vì sao? Vì cải tiến trước chỉ tập trung vào may, chưa nhìn vật tư tiêu hao.
5. Vì sao? Vì chưa có material variance trong báo cáo ngày.

### 6.3. 5 Why — viền

1. Vì sao tiêu hao cao? Vì chiều dài viền cắt dư và đầu thừa cuối đường may.
2. Vì sao? Vì không có guide/folder chuẩn và không kiểm tra chiều dài sau cắt.
3. Vì sao? Vì Standard Work chưa ghi rõ chiều dài cắt và vị trí đặt guide.
4. Vì sao? Vì chưa có first-piece check cho phần viền.
5. Vì sao? Vì quality gate hiện chỉ kiểm ngoại quan, chưa kiểm vật tư tiêu hao.

### 6.4. Fishbone 4M

| Nhóm | Yếu tố | Ảnh hưởng |
|---|---|---|
| Man | Operator chưa được huấn luyện standard cut/issue | Cắt dư, dùng không theo kit |
| Machine | Tension/stitch length chưa được set chuẩn; thiếu jig cắt | Chỉ và băng keo tiêu hao cao |
| Method | BOM tổng, không có standard issue; không có first-piece cho vật tư | Không có chuẩn để so |
| Material | Độ dày/độ co giãn lô vải thay đổi | Tiêu hao biến động giữa các lô |

---

## 7. Countermeasures

| # | Hành động | Owner | Due | Kiểm chứng |
|---:|---|---|---|---|
| 1 | Cập nhật BOM standard theo pc cho 3 vật tư | IE | Day 2 | BOM version mới, sign-off |
| 2 | Cấp phát theo kit/ngày; ghi issue/return | Warehouse | Day 2 | Phiếu xuất/hoàn trả khớp sản lượng |
| 3 | Làm jig cắt băng keo 3M, mark chiều dài/rộng | IE + Maintenance | Day 3 | 10 mẫu cắt nằm trong dung sai |
| 4 | Cập nhật Standard Work cho cắt viền và may chỉ | IE + Production | Day 3 | Ảnh + chiều dài + vị trí guide |
| 5 | First-piece check cho vật tư tiêu hao | Quality | Day 4 | Checklist ký mỗi đầu ca/changeover |
| 6 | Bảng variance theo ngày tại line | IE | Day 4 | Cập nhật sau mỗi ca |
| 7 | Calibrate tension/stitch length theo operation | Maintenance | Day 5 | Log calibration |
| 8 | Review tuần với Production/Warehouse/Finance | IE | Weekly | Action log, owner, due |

**Nguyên tắc:** không đổi định mức để “khớp” với tiêu hao thực tế. Nếu định mức sai, phải time study/tech pack review và approve riêng.

---

## 8. Control Plan

| KPI / hành vi | Target | Cách đo | Tần suất | Owner | Reaction khi lệch |
|---|---|---|---|---|---|
| Thread consumption | ≤45.9 m/pc | Issue/return ÷ output | Daily | IE + Warehouse | >46.5 trong 2 ngày → kiểm tra tension/bobbin |
| 3M tape consumption | ≤0.36 m/pc | Issue/return ÷ output | Daily | IE + Warehouse | >0.38 trong 2 ngày → kiểm tra jig/cắt |
| Binding consumption | ≤0.62 m/pc | Issue/return ÷ output | Daily | IE + Warehouse | >0.65 trong 2 ngày → kiểm tra guide/chiều dài |
| Material cost variance | ≤2.5% standard | Actual vs standard cost | Weekly | IE + Finance | >3% trong 2 tuần → mở lại 5 Why |
| Issue/return accuracy | 100% kit | Phiếu kho vs sản lượng | Daily | Warehouse | Thiếu phiếu → dừng cấp phát, đối chiếu |
| First-piece material check | 100% ca/changeover | Checklist | Mỗi ca/changeover | Quality | Thiếu → không cho chạy |
| Jig/guide condition | 100% good | Visual check | Daily | Supervisor | Hỏng → sửa/thay trước khi chạy |

---

## 9. Điều kiện để gọi là verified trong production

1. Cùng style, cùng routing, cùng SAM và cùng đơn giá trong kỳ so sánh.
2. Sản lượng lấy từ end-line count, không lấy từ kế hoạch.
3. Vật tư lấy từ phiếu xuất/hoàn trả thực tế, có người ký.
4. Tách scrap/rework nếu hệ thống cho phép; nếu không, ghi rõ actual consumption bao gồm scrap/rework.
5. Không có thay đổi vật tư/nhà cung cấp hoặc spec trong kỳ pilot.
6. Finance xác nhận đơn giá và cách tính variance.
7. Kết quả được duy trì ít nhất 4 tuần trước khi mở rộng.

> Trong portfolio này, dữ liệu là **synthetic**. Các điều kiện trên là cách sẽ xác minh trong production, không phải tuyên bố đã xác minh tại HBI.

---

## 10. Điều không được claim

- Không claim “tiết kiệm 518,700 VND/tháng” vì đây là cost avoidance cho 1,820 pcs, không phải run-rate tháng.
- Không claim “đạt định mức” vì after vẫn cao hơn standard ở cả ba vật tư.
- Không claim “giảm 52.8% chi phí vật tư”; chỉ là giảm **phần vượt định mức** 52.8%.
- Không claim quan hệ nhân quả tuyệt đối từ 5 ngày pilot; đây là association + pilot evidence.
- Không claim giá mua, định mức hoặc kết quả này là của HBI.
- Không dùng kết quả này để thay thế kiểm tra chất lượng, EHS hoặc approval của Finance.

---

## 11. Bài học và câu hỏi phỏng vấn

### 11.1. Bài học

- Định mức chỉ có giá trị khi có **cách cấp phát và đo** đi kèm.
- Material variance phải cùng grain với sản lượng; nếu thiếu mẫu số thì không thể so.
- Cải tiến vật tư không được làm giảm chất lượng hoặc tăng thao tác không giá trị.
- Phải tách **cost avoidance** khỏi **cash saving**.
- Kết quả tốt nhất là giảm variance và giữ được control plan, không chỉ là một lần thử.

### 11.2. Câu trả lời mẫu 90 giây

> “In my synthetic portfolio case, I looked at three materials on one garment line: thread, 3M tape, and binding. The standard consumption was 45 meters of thread, 0.35 meters of tape, and 0.60 meters of binding per piece. Before the pilot, actual consumption was 46.8, 0.38, and 0.66, so material cost was 4.42% above standard. I checked the issue and return records, the cutting method, and the BOM. The main causes were no standard issue quantity, manual tape cutting without a jig, and no binding length check. I updated the BOM, issued material by kit, added a cutting jig and a binding guide, and put a first-piece material check into the control plan. After five days, consumption was 45.9, 0.36, and 0.62. The excess over standard fell by 52.8%, but all three materials were still above standard. I present that as a partial improvement, not a cash saving or a claim that we reached the norm.”

---

## 12. Trạng thái triển khai trong app

Từ 2026-11-08, case T13 có thêm module **usage variance** giới hạn:

| Hạng mục | Trạng thái |
|---|---|
| `GET /api/materials/sample` | Trả standard, before/after actual và comparison từ dữ liệu synthetic T13 |
| `POST /api/materials/analyze` | Tính usage variance cho `CURRENT`/`BEFORE`/`AFTER`; từ chối `material_id` trùng |
| `POST /api/materials/import` | Đọc CSV `text/csv`, aggregate theo pcs, trả preview + analysis; UI có chọn phase/file và preview |
| UI “Materials” | Bảng case T13 + CSV import + what-if calculator; EN/VI; loading/error/empty state |
| Code | `backend/app/materials.py`, `backend/app/material_import.py`, `backend/app/sample_materials.py`, `frontend/src/components/MaterialsPanel.tsx` |
| Test | `tests/test_materials.py`, `tests/test_material_import.py`, API tests trong `tests/test_api.py` |

**Chưa có:** material master, BOM editor, Excel/general import, persistence, purchase-price variance, approval workflow. Mọi số tiền vẫn là cost avoidance trên dữ liệu synthetic, không phải cash saving đã được Finance xác nhận.

---

## 13. Liên kết

- `docs/data/material_consumption.csv` — dữ liệu gốc.
- `DATA_DICTIONARY.md` §5.2 — grain, công thức, quy ước.
- `docs/IE_OPERATIONS_PLAYBOOK.md` Module 3 — 8 wastes; Module 7 — material flow/POU.
- `docs/CASE_STUDY_KAIZEN.md` — cách tách estimated saving và verified saving.
- `docs/CASE_STUDY_QUALITY_RCA.md` — cách dùng denominator và control plan.
