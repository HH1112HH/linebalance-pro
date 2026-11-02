# Đề xuất tinh chỉnh: LineBalance Pro
## Smart Garment Line Balancing & Bottleneck Analytics

> **Kết luận ngắn:** Nên chọn Đề xuất 3. Đây là đề xuất phù hợp nhất với vị trí **HBI Shift Line Engineer** vì bám đúng công việc IE hằng ngày: Takt time, SAM, Skill Matrix, cân bằng chuyền, điểm nghẽn và what-if trước ca. Tuy nhiên, cần chỉnh 3 điểm để vừa khả thi trong 6 ngày vừa tránh nói quá:
>
> 1. **Bỏ "ML" khỏi phần core**, đổi thành **Operations Research + Analytics**. ML chỉ nên là module mở rộng sau MVP.
> 2. **"Layout" chỉ nên hiểu là thứ tự công đoạn – trạm – luồng chuyển tiếp**, không phải thiết kế mặt bằng 2D/CAD.
> 3. **Đóng băng scope MVP**: 1 chuyền, 1 sản phẩm, 3 file input, 1 optimizer, 1 dashboard, 1 file export.

---

## 1. Vì sao đề xuất này hợp lý?

| Tiêu chí | Đánh giá |
|---|---|
| Liên quan trực tiếp đến HBI Shift Line Engineer | Rất cao: cân bằng chuyền, Takt, SAM, kỹ năng công nhân, năng suất, bottleneck |
| Khả thi trong 6 ngày | Cao nếu dùng MILP + Streamlit, không làm ML/computer vision |
| Thể hiện tư duy IE | Tốt: bài toán có ràng buộc precedence, takt, skill, machine |
| Thể hiện tư duy Data/OR | Tốt: mô hình hóa, tối ưu, KPI, what-if, trực quan hóa |
| Rủi ro kỹ thuật | Thấp–trung bình: solver có thể infeasible hoặc chậm nếu dữ liệu lớn |
| Rủi ro "nói quá" | Cao nếu giữ chữ "ML" trong khi core không có ML |

**Điểm mạnh lớn nhất:** Đây không phải một app CRUD. Nó giải một bài toán ra quyết định thật: *với danh sách công đoạn, takt time và kỹ năng hiện có, nên chia việc và xếp người như thế nào để chuyền cân bằng nhất?*

**Điểm cần tránh:** Đừng gọi là "AI/ML" nếu thực chất chỉ là tối ưu tuyến tính. Nhà tuyển dụng IE sẽ hỏi ngay: "ML ở đâu?" Nếu không trả lời được, project phản tác dụng. Hãy gọi đúng bản chất: **Optimization / Decision Support System**.

---

## 2. Định vị lại project

### Tên đề xuất

**LineBalance Pro — Smart Garment Line Balancing & Bottleneck Analytics**

Phụ đề CV:

> "An IE decision-support web app that balances sewing lines under takt time, precedence, machine and multi-skill constraints, then quantifies line efficiency and bottlenecks."

### Người dùng mục tiêu

- Shift Line Engineer / IE Engineer.
- Line Supervisor cần xem nhanh phương án bố trí trước ca.
- Trainer cần biết khoảng trống kỹ năng để lên kế hoạch đào tạo.

### Giá trị mang lại

- Giảm thời gian cân bằng chuyền thủ công từ vài giờ xuống dưới 1 phút.
- So sánh nhanh nhiều phương án: tăng/giảm người, đổi takt, đổi target.
- Phát hiện trạm nghẽn và trạm dư tải trước khi chạy sản xuất.
- Lượng hóa khoảng trống kỹ năng để đào tạo đúng người, đúng công đoạn.
- Có bằng chứng số liệu khi trao đổi với supervisor/manager.

---

## 3. Scope MVP trong 6 ngày

### Làm (In-scope)

1. **Nhập dữ liệu**
   - Danh sách công đoạn: mã, tên, SAM (giây), công đoạn trước, loại máy, kỹ năng yêu cầu.
   - Danh sách công nhân: mã, tên, skill matrix 0–3, hệ số năng suất, máy có thể vận hành.
   - Cấu hình chuyền: số phút ca, target/ngày, allowance, số công nhân tối đa.
   - Nhập bằng CSV mẫu hoặc `st.data_editor`.

2. **Validate dữ liệu**
   - Phát hiện vòng lặp precedence.
   - Công đoạn không có predecessor hợp lệ.
   - Công đoạn không có công nhân nào đủ kỹ năng.
   - Tổng thời gian vượt năng lực tối đa.
   - Takt time ≤ 0 hoặc target không hợp lệ.

3. **Tối ưu phân công**
   - Ràng buộc precedence.
   - Ràng buộc takt time.
   - Ràng buộc kỹ năng và loại máy.
   - Mục tiêu: giảm số trạm/công nhân, sau đó giảm idle time và bottleneck.
   - Trả về ma trận phân công công đoạn → trạm/công nhân.

4. **KPI & cảnh báo**
   - Takt time.
   - Line Efficiency vs Takt.
   - Balance Efficiency.
   - Balance Delay.
   - Smoothness Index.
   - Bottleneck station.
   - Output capacity/shift.
   - Cảnh báo trạm quá tải, trạm dư tải, thiếu kỹ năng, không đạt target.

5. **Trực quan hóa**
   - Workload bar chart từng trạm, có đường takt và highlight bottleneck.
   - Assignment matrix/heatmap.
   - Precedence flow diagram: công đoạn → trạm.
   - Skill heatmap.
   - Scenario comparison.

6. **What-if & export**
   - So sánh 2–3 kịch bản: takt ±10%, headcount ±10%, giảm skill level.
   - Export Excel: Assignment, Station KPI, Warnings, Input.

### Không làm trong MVP (Out-of-scope)

- Kết nối MES/ERP/PLM thật.
- Thiết kế mặt bằng nhà xưởng 2D/3D/CAD.
- Deep learning, computer vision, dự báo chuỗi thời gian.
- Multi-plant, multi-line real-time.
- Authentication, phân quyền, database production.
- Mô phỏng chuyển động của công nhân/máy may.
- Tối ưu đa mục tiêu phức tạp với hàng trăm ràng buộc phi tuyến.

> **Ghi chú quan trọng:** "Layout optimizer" trong project này là **station/task sequence + flow visualization**, không phải bố trí mặt bằng vật lý. Nếu ghi "layout" mà demo chỉ có bar chart, người xem sẽ thất vọng. Hãy nói rõ: *"line layout ở mức công đoạn – trạm – luồng chuyển tiếp"*.

---

## 4. Data model

### 4.1. Operations CSV

| Cột | Kiểu | Ý nghĩa | Ví dụ |
|---|---|---|---|
| `op_id` | string | Mã công đoạn | `OP010` |
| `op_name` | string | Tên công đoạn | `May cổ` |
| `sam_sec` | float | Thời gian định mức (giây) | `52.0` |
| `predecessors` | string | Danh sách mã trước, cách nhau bởi `;` | `OP005;OP006` |
| `machine_type` | string | Loại máy | `OVERLOCK` |
| `skill_code` | string | Nhóm kỹ năng | `SEWING` |
| `skill_required` | int | Mức kỹ năng tối thiểu 0–3 | `2` |
| `is_quality_gate` | bool | Công đoạn kiểm tra | `FALSE` |

### 4.2. Workers CSV

| Cột | Kiểu | Ý nghĩa | Ví dụ |
|---|---|---|---|
| `worker_id` | string | Mã công nhân | `W001` |
| `worker_name` | string | Tên | `Nguyen A` |
| `skill_sewing` | int | 0–3 | `3` |
| `skill_finishing` | int | 0–3 | `1` |
| `skill_inspection` | int | 0–3 | `0` |
| `efficiency_factor` | float | Hệ số thời gian, 1.0 = đúng chuẩn | `1.10` |
| `machine_types` | string | Máy có thể dùng | `OVERLOCK;SINGLE` |
| `available` | bool | Có mặt trong ca | `TRUE` |

### 4.3. Line config

| Tham số | Ý nghĩa | Ví dụ |
|---|---|---|
| `shift_minutes` | Số phút có mặt | `480` |
| `break_minutes` | Nghỉ giữa ca | `30` |
| `target_qty` | Sản lượng mục tiêu/ngày | `420` |
| `allowance_pct` | Hệ số bù | `10%` |
| `max_workers` | Số công nhân tối đa | `30` |
| `solver_time_limit_sec` | Giới hạn solver | `30` |

### 4.4. Công thức Takt

```text
Available seconds = (shift_minutes - break_minutes) × 60 × (1 - allowance_pct)
Takt time (sec/pc) = Available seconds / target_qty
```

Ví dụ: `(480 - 30) × 60 × 0.9 / 420 ≈ 57.9 sec/pc`.

> Nên cho người dùng chọn 2 cách tính:
> - **Takt từ target** (push): tính takt từ sản lượng mục tiêu.
> - **Target từ takt** (pull): nhập takt mong muốn, tính năng lực tối đa.
>
> Điều này thể hiện hiểu biết về takt time trong sản xuất thực tế.

---

## 5. Mô hình tối ưu

### 5.1. Giả định MVP

- Mỗi trạm có **1 công nhân** và **1 loại máy** tại một thời điểm.
- Công nhân được xếp theo thứ tự trạm do người dùng nhập (hoặc kéo thả).
- Một công đoạn chỉ làm ở 1 trạm.
- Thời gian hiệu dụng = `SAM × efficiency_factor` (theo kỹ năng/máy).
- Nếu công nhân không đủ kỹ năng tối thiểu → không được gán.
- Không xét song song nhiều máy trong cùng trạm.

> Hạn chế này cần ghi rõ trong README. Nó không làm project yếu đi; nó cho thấy người làm hiểu giới hạn mô hình.

### 5.2. Ký hiệu

- `I`: tập công đoạn.
- `W`: tập công nhân/trạm, đánh số `1..W` theo thứ tự chuyền.
- `P`: tập cặp precedence `(i, j)` nghĩa là `i` phải làm trước `j`.
- `t_i`: SAM của công đoạn `i` (giây).
- `T`: takt time (giây).
- `f_iw`: hệ số thời gian khi công đoạn `i` làm bởi công nhân `w`.
- `r_i`: kỹ năng tối thiểu của công đoạn `i`.
- `s_w`: kỹ năng của công nhân `w` cho nhóm kỹ năng tương ứng.
- `m_i`, `m_w`: loại máy yêu cầu và loại máy của trạm.

### 5.3. Biến quyết định

```text
x[i,w] = 1 nếu công đoạn i gán cho công nhân/trạm w, ngược lại 0
u[w]   = 1 nếu công nhân/trạm w được sử dụng, ngược lại 0
```

### 5.4. Ràng buộc

**Mỗi công đoạn đúng 1 trạm:**

```text
Σ_w x[i,w] = 1                      ∀ i ∈ I
```

**Loại bỏ gán không hợp lệ:**

```text
x[i,w] = 0   nếu s_w < r_i
x[i,w] = 0   nếu m_w không phù hợp m_i
x[i,w] = 0   nếu công nhân w không available
```

**Không vượt takt:**

```text
Σ_i t_i × f_iw × x[i,w] ≤ T × u[w]    ∀ w ∈ W
```

**Liên kết biến sử dụng:**

```text
x[i,w] ≤ u[w]                         ∀ i, w
```

**Precedence:**

```text
Σ_w w × x[i,w] ≤ Σ_w w × x[j,w]       ∀ (i,j) ∈ P
```

**Không để trạm trống ở giữa (tùy chọn):**

```text
u[w] ≥ u[w+1]                         ∀ w = 1..W-1
```

**Giới hạn số công nhân:**

```text
Σ_w u[w] ≤ max_workers
```

### 5.5. Hàm mục tiêu

**Bước 1 — Giảm số trạm/công nhân:**

```text
Minimize Σ_w u[w]
```

**Bước 2 — Với số trạm đã cố định, giảm bottleneck và idle:**

```text
Minimize C
C ≥ Σ_i t_i × f_iw × x[i,w]          ∀ w
```

Hoặc dùng weighted objective nếu muốn giải 1 lần:

```text
Minimize 1000 × Σ_w u[w] + Σ_w idle[w] + λ × C
```

Trong đó `idle[w] = T × u[w] - Σ_i t_i × f_iw × x[i,w]`.

**Khuyến nghị:** Dùng **lexicographic 2 bước** để dễ giải thích:
1. Tìm số công nhân tối thiểu.
2. Cố định số đó, tối thiểu hóa trạm nghẽn nhất.

### 5.6. Solver

| Lựa chọn | Khi nào dùng | Nhận xét |
|---|---|---|
| **PuLP + CBC** | MVP, ≤ 100 công đoạn, ≤ 40 công nhân | Dễ code, dễ giải thích, đủ nhanh |
| **OR-Tools CP-SAT** | Dữ liệu lớn hơn, cần tốc độ | Mạnh hơn nhưng model phức tạp hơn |
| **Greedy + Local Search** | Fallback khi solver timeout | Không đảm bảo tối ưu, nhưng luôn có phương án |
| **Genetic Algorithm** | Nghiên cứu, multi-objective | Không nên làm trong 6 ngày; khó thuyết phục hơn MILP |

**Chốt cho 6 ngày:** PuLP/CBC là chính. Nếu solver quá 30 giây → dừng, trả phương án tốt nhất hiện có kèm cảnh báo "near-optimal". Nếu infeasible → chạy chẩn đoán.

### 5.7. Chẩn đoán infeasible

Khi không có phương án, app phải trả lời được **vì sao**:

1. Có vòng lặp precedence không?
2. Có công đoạn không có công nhân nào đủ kỹ năng/máy không?
3. Tổng thời gian hiệu dụng có vượt `max_workers × T` không?
4. Lower bound số công nhân có vượt `max_workers` không?
5. Có công đoạn nào có SAM > T không? (một mình nó đã vượt takt)

Gợi ý hành động:

- Tăng số công nhân.
- Giảm target hoặc tăng takt.
- Đào tạo/nâng kỹ năng.
- Tách công đoạn.
- Thêm máy.
- Nới ràng buộc kỹ năng (nếu cho phép).

> Đây là phần tạo khác biệt lớn nhất so với một app demo đơn giản. Người làm IE thực tế cần biết **không thể** vì lý do gì, chứ không chỉ cần một bảng phân công.

---

## 6. KPI và cảnh báo

### 6.1. KPI chính

Gọi:

- `N`: số trạm/công nhân được dùng.
- `L_w`: tải hiệu dụng của trạm `w`.
- `C = max(L_w)`: cycle time thực tế (bottleneck).
- `SAM_total`: tổng SAM.

**Line Efficiency vs Takt:**

```text
Line Efficiency (%) = SAM_total / (N × T) × 100
```

**Balance Efficiency:**

```text
Balance Efficiency (%) = SAM_total / (N × C) × 100
```

**Balance Delay:**

```text
Balance Delay (%) = 100 - Balance Efficiency
```

**Smoothness Index:**

```text
Smoothness Index = sqrt(Σ_w (C - L_w)^2)
```

**Output capacity/shift:**

```text
Capacity = Available seconds / C
Target achievement = min(100%, Capacity / Target × 100)
```

**Bottleneck:**

```text
Bottleneck = argmax_w L_w
Bottleneck load ratio = C / T × 100
```

### 6.2. Ngưỡng cảnh báo

| Điều kiện | Cảnh báo |
|---|---|
| `L_w > T` | Trạm quá tải, không đạt takt |
| `0.9T < L_w ≤ T` | Trạm gần tới hạn, rủi ro nghẽn |
| `L_w < 0.6T` | Trạm dư tải, lãng phí lao động |
| `C / T > 1` | Chuyền không đạt target |
| `skill_gap > 0` | Thiếu kỹ năng, cần đào tạo |
| `SAM_i > T` | Công đoạn đơn lẻ vượt takt, phải tách |
| `Smoothness Index` cao | Phân bổ không đều |
| `Capacity < Target` | Không đạt sản lượng mục tiêu |

### 6.3. Cách hiển thị

- KPI cards ở đầu trang.
- Workload bar chart: mỗi cột là 1 trạm, đường ngang là takt, cột bottleneck màu đỏ.
- Bảng assignment: công đoạn, SAM, trạm, công nhân, kỹ năng, load.
- Cảnh báo màu vàng/đỏ kèm gợi ý hành động.
- Nút "Explain" giải thích ngắn gọn vì sao trạm đó nghẽn.

---

## 7. UI/UX đề xuất

### 7.1. Cấu trúc app

```text
Sidebar
  ├── Product / Line name
  ├── Shift minutes, break, target, allowance
  ├── Max workers, solver time
  └── Run optimization

Tabs
  ├── 1. Input
  │     ├── Operations editor
  │     ├── Workers / Skill Matrix editor
  │     └── Validation panel
  ├── 2. Optimize
  │     ├── Objective selector
  │     ├── Constraints summary
  │     └── Run + progress
  ├── 3. Results
  │     ├── KPI cards
  │     ├── Workload chart
  │     ├── Assignment matrix
  │     ├── Precedence/layout flow
  │     ├── Skill heatmap
  │     └── Warnings
  ├── 4. What-if
  │     ├── Scenario A/B/C
  │     └── Comparison chart
  └── 5. Export
        └── Excel download
```

### 7.2. Chart bằng Plotly

1. **Workload Bar Chart**
   - X: trạm 1..N.
   - Y: load (giây).
   - Đường `takt` màu đen.
   - Cột vượt takt màu đỏ; gần takt màu cam; dư tải màu xanh nhạt.
   - Annotation: "Bottleneck: Station 7 — 68.2s (118% takt)".

2. **Assignment Matrix Heatmap**
   - X: trạm/công nhân.
   - Y: công đoạn.
   - Giá trị: SAM hoặc 1/0.
   - Phù hợp để nhìn nhanh công đoạn nào đang dồn vào trạm nào.

3. **Precedence / Layout Flow**
   - Dùng `networkx` + Plotly hoặc Graphviz.
   - Node = công đoạn, màu theo trạm.
   - Edge = precedence.
   - Có thể vẽ thành các cột station 1 → 2 → 3 để thể hiện "layout" ở mức luồng.

4. **Skill Heatmap**
   - X: nhóm kỹ năng.
   - Y: công nhân.
   - Màu: 0–3.
   - Highlight công nhân thiếu kỹ năng so với công đoạn được gán.

5. **Scenario Comparison**
   - Grouped bar: Line Efficiency, Balance Delay, số công nhân, output.
   - Bảng so sánh delta.

### 7.3. Export Excel

Một file `.xlsx` gồm các sheet:

- `Input_Operations`
- `Input_Workers`
- `Assignment`
- `Station_KPI`
- `Warnings`
- `Scenario_Summary`

> Đây là chi tiết nhỏ nhưng rất "IE": supervisor có thể mở Excel, in ra, hoặc gửi qua chat nội bộ.

---

## 8. Kế hoạch 6 ngày

| Ngày | Việc chính | Deliverable | Điều kiện hoàn thành |
|---|---|---|---|
| **Day 1** | Chốt domain model, data schema, công thức KPI, wireframe; tạo dữ liệu mẫu | `data/*.csv`, `validation.py`, wireframe | Import 3 file; bắt được cycle, thiếu kỹ năng, target sai |
| **Day 2** | Optimizer v1: precedence + takt + số trạm; KPI engine; unit test | `optimizer.py`, `kpis.py`, test cơ bản | Giải được case 30 công đoạn/10 công nhân; đúng precedence và takt |
| **Day 3** | Thêm Skill Matrix + machine; chẩn đoán infeasible; fallback heuristic | Model skill-aware, warning engine | Gán đúng kỹ năng; giải thích được 3 loại infeasible |
| **Day 4** | Streamlit UI + Plotly + export Excel | `app.py` chạy end-to-end | Nhập liệu → tối ưu → xem KPI → export trong < 2 phút |
| **Day 5** | What-if scenarios, so sánh, test suite, polish UI | Scenario manager, pytest | 3 kịch bản chạy được; test pass; không crash khi input xấu |
| **Day 6** | Deploy, README, demo video, CV bullets, rehearsal | Link app, README, video 3 phút | Demo 3 phút trơn tru; người khác chạy được từ README |

### Buffer

Nếu chậm, cắt theo thứ tự:

1. Scenario comparison nâng cao → chỉ giữ 2 kịch bản.
2. Precedence flow diagram → thay bằng bảng station sequence.
3. Skill heatmap → thay bằng bảng cảnh báo.

**Không cắt:** optimizer core, validation, KPI, workload chart, export. Đây là 5 thứ tạo nên giá trị cốt lõi.

---

## 9. Kiểm thử và kiểm chứng

### 9.1. Unit tests

- Mỗi công đoạn được gán đúng 1 lần.
- Không vi phạm precedence.
- Không vượt takt.
- Không gán công nhân thiếu kỹ năng.
- Không dùng công nhân không available.
- Tổng load = tổng SAM hiệu dụng.
- KPI tính đúng trên case nhỏ tự tính tay.

### 9.2. Golden cases

| Case | Mô tả | Kỳ vọng |
|---|---|---|
| G1 | 10 công đoạn, 3 công nhân, takt 60s | Tìm được phương án, efficiency > 80% |
| G2 | 30 công đoạn, 10 công nhân, có precedence | Đúng precedence, solve < 10s |
| G3 | 60 công đoạn, 25 công nhân, skill matrix | Solve < 30s hoặc fallback |
| G4 | Takt quá thấp | Infeasible + gợi ý tăng người/giảm target |
| G5 | Công đoạn SAM > takt | Cảnh báo phải tách công đoạn |
| G6 | Công nhân thiếu kỹ năng | Cảnh báo skill gap, không gán bừa |

### 9.3. So sánh baseline

Tạo một phương án thủ công (manual baseline) trên cùng dữ liệu:

- Baseline: chia đều theo thứ tự công đoạn, không tối ưu.
- Optimized: kết quả từ app.
- So sánh: Line Efficiency, Balance Delay, số người, bottleneck.

> Đây là số liệu để đưa vào CV. Chỉ ghi con số thực đo được, không bịa.

### 9.4. Sensitivity analysis

- Takt ±10%.
- Headcount ±10%.
- Giảm skill level của 20% công nhân.
- Tăng SAM của bottleneck operation 10%.

Mục tiêu: chứng minh app không chỉ chạy một case đẹp mà còn giúp ra quyết định.

---

## 10. Rủi ro và cách giảm thiểu

| Rủi ro | Mức độ | Cách giảm thiểu |
|---|---|---|
| Gọi "ML" nhưng không có ML | Cao | Đổi tên thành Optimization/Analytics; ML chỉ là roadmap |
| Không có dữ liệu thật | Trung bình | Dùng dữ liệu mô phỏng, ghi rõ giả định; làm sensitivity analysis |
| Solver chậm | Trung bình | Giới hạn 30s; fallback greedy; giới hạn số công đoạn |
| Solver infeasible | Cao | Chẩn đoán nguyên nhân + gợi ý; không chỉ báo "no solution" |
| Thứ tự công nhân cố định | Trung bình | Cho người dùng kéo thả; ghi rõ hạn chế; v2 local search |
| "Layout" bị hiểu là CAD | Trung bình | Ghi rõ scope: station sequence + flow, không phải mặt bằng |
| Streamlit mất state | Thấp | Dùng `st.session_state`, cache parsing |
| Deploy lỗi | Thấp | Pin version; chạy local dự phòng; README rõ |
| Scope creep | Cao | Đóng băng MVP; mọi ý tưởng mới đưa vào "Roadmap" |

---

## 11. Cách viết CV và kể câu chuyện

### 11.1. CV bullets (điền số thực sau khi làm)

```text
LineBalance Pro — Garment Line Balancing & Bottleneck Analytics
Python, PuLP/CBC, Streamlit, Plotly, Pandas

• Built an IE decision-support web app that assigns sewing operations to
  stations under takt time, precedence, machine and multi-skill constraints;
  solves 50+ operation instances in under 30 seconds.

• Formulated a skill-aware MILP to minimize stations and idle time; automated
  line-efficiency, balance-delay and bottleneck KPIs; improved demo line
  efficiency from __% to __% versus a manual baseline.

• Designed what-if analysis for takt, headcount and skill mix, plus Excel
  export; validated on 3 product styles and 20+ synthetic scenarios.

• Documented model assumptions, infeasibility diagnostics and a roadmap for
  MES integration and ML-based SAM calibration.
```

### 11.2. Demo script 3 phút

1. **0:00–0:30 — Vấn đề**
   - "Mỗi lần đổi style, line engineer mất 2–3 giờ cân bằng chuyền bằng Excel. Nếu takt hoặc nhân sự thay đổi, phải làm lại."

2. **0:30–1:00 — Input**
   - Mở tab Input, show 50 công đoạn, precedence, skill matrix.
   - "App tự validate vòng lặp precedence và công đoạn thiếu kỹ năng."

3. **1:00–1:45 — Optimize**
   - Bấm Run, show kết quả trong vài giây.
   - "Mô hình tôn trọng precedence, takt, máy và kỹ năng."

4. **1:45–2:30 — Kết quả**
   - KPI cards: efficiency, balance delay, bottleneck.
   - Workload chart: trạm 7 vượt takt.
   - Assignment matrix: 2 công đoạn được chuyển khỏi trạm 7.
   - Cảnh báo: 3 công nhân cần đào tạo kỹ năng.

5. **2:30–3:00 — What-if & giá trị**
   - So sánh baseline vs optimized.
   - "Trước: 42 người, efficiency 71%. Sau: 38 người, efficiency 84%."
   - "Đây là công cụ hỗ trợ ra quyết định, không thay thế line engineer."

> Các con số trên là **ví dụ minh họa**. Phải thay bằng kết quả thực đo trên dữ liệu demo của bạn.

### 11.3. Câu hỏi phỏng vấn cần chuẩn bị

- Vì sao chọn MILP thay vì GA?
- Skill matrix được mô hình hóa như thế nào?
- Làm sao đảm bảo precedence?
- Nếu không có solution thì app làm gì?
- Làm sao biết phương án tối ưu là đúng?
- Giới hạn của mô hình là gì?
- Nếu tích hợp với MES thì cần dữ liệu gì?
- Nếu muốn mở rộng sang nhiều chuyền thì làm thế nào?

---

## 12. Đề xuất cuối cùng

### Nên làm

**Chọn Đề xuất 3, phiên bản tinh chỉnh:**

> **LineBalance Pro — Smart Garment Line Balancing & Bottleneck Analytics**
>
> Core: Python + PuLP/CBC + Streamlit + Plotly + Pandas.
>
> MVP: nhập công đoạn + takt + skill matrix → tối ưu phân công → KPI + bottleneck + what-if + export.

### Không nên làm trong 6 ngày

- Không làm ML/DL/computer vision.
- Không làm CAD layout.
- Không làm multi-line, multi-plant, real-time MES.
- Không làm GA nếu MILP đã đủ.
- Không dùng dữ liệu nội bộ HBI nếu chưa được phép.

### Nếu vẫn muốn có ML

Làm **sau MVP**, với dữ liệu thật:

- Dự báo thời gian thực tế của công đoạn từ dữ liệu lịch sử (SAM calibration).
- Phân loại rủi ro nghẽn dựa trên feature: skill mix, absenteeism, style complexity.
- Learning curve cho công nhân mới.

Nhưng phải ghi rõ: **"ML module is a prototype/roadmap, not the core optimizer."** Đừng để project biến thành "ML gắn vào cho có".

---

## 13. Next step

Nếu đồng ý với hướng này, bước tiếp theo là scaffold repo:

```text
linebalance-pro/
├── app.py
├── core/
│   ├── models.py
│   ├── validation.py
│   ├── optimizer.py
│   ├── kpis.py
│   └── scenarios.py
├── data/
│   ├── operations_sample.csv
│   ├── workers_sample.csv
│   └── line_config.json
├── tests/
│   ├── test_validation.py
│   ├── test_optimizer.py
│   └── test_kpis.py
├── requirements.txt
└── README.md
```

**Thứ tự implement:** validation → optimizer → KPI → UI → what-if → export.

Mục tiêu cuối cùng: một app chạy được, một bộ dữ liệu mẫu, một README rõ ràng, một video demo 3 phút, và một câu chuyện CV không phóng đại nhưng đủ mạnh.

---

# Phụ lục A — Đánh giá & tích hợp Executive IE Pivot Dashboard

## A1. Kết luận thẳng

Ý tưởng tích hợp **Executive IE Pivot Dashboard** là hướng đi đúng và có thể là điểm khác biệt lớn. Nó nâng project từ "công cụ tính toán" thành **vòng quản trị khép kín**: lập kế hoạch → chạy ca → ghi nhận thực tế → so sánh → tái cân bằng.

Nhưng nếu giữ nguyên phạm vi 3 bảng pivot + MES + báo cáo cấp tập đoàn trong **6 ngày**, project sẽ có 3 rủi ro lớn:

1. **Scope vượt thời gian**: 3 pivot + shift logs + optimizer + UI + test + deploy khó hoàn thành tử tế trong 6 ngày. Bản thân optimizer + UI đã gần kín 6 ngày.
2. **"Pivot" chưa đúng nghĩa**: 3 bảng mô tả hiện tại giống **scorecard/báo cáo nhóm** hơn là pivot đa chiều thật sự. Thiếu định nghĩa grain, dimension, measure, filter, drill-down.
3. **Sai ngữ nghĩa KPI**: một số chỉ số đang bị trộn giữa kế hoạch và thực tế, giữa cycle time trạm và cycle time công đoạn. Nhà tuyển dụng IE sẽ phát hiện rất nhanh.

**Khuyến nghị:** Giữ ý tưởng, nhưng chia thành 2 tầng:

- **6 ngày**: optimizer + **Line Balancing Pivot** + **Shift KPI scorecard** + bảng Skill Matrix. Chưa làm full 3 pivot.
- **10 ngày**: full 3 pivot + plan-vs-actual + loss Pareto + drill-down + skill coverage.

Nếu chỉ có 6 ngày mà vẫn cố làm cả 3 pivot, kết quả thường là 3 bảng `groupby` nông, thiếu chiều sâu. Ngược lại, 6 ngày với 1 pivot tốt + 1 scorecard tốt + optimizer mạnh sẽ thuyết phục hơn nhiều.

---

## A2. Sáu vấn đề cụ thể cần sửa

### Vấn đề 1 — Scope creep

Luồng hiện tại:

```text
TechPack + Skill Matrix + Shift Logs
        → Core Optimization
        → 3 Pivot Dashboards
```

Nghe rất đẹp, nhưng thực tế cần thêm:

- Data model đa chiều.
- Data validation.
- Synthetic data generator.
- Shift log ingestion.
- Loss reason taxonomy.
- Plan-vs-actual logic.
- Pivot UI + filter + drill-down.
- Export.
- Test.
- Deploy.

Đây là khối lượng của **10–12 ngày**, không phải 6 ngày.

### Vấn đề 2 — "Pivot" vs "Scorecard"

Pivot table thật cần:

- **Rows**: dimension.
- **Columns**: dimension.
- **Values**: measure.
- **Filters**: slicer.
- **Drill-down**: từ tổng hợp xuống chi tiết.

Ba bảng hiện tại:

- Bảng 1 có Rows/Columns/Values → gần với pivot.
- Bảng 2 có Rows/Columns/Values nhưng trộn 3 measure khác loại trong cùng một ô → khó đọc.
- Bảng 3 có Rows/Columns là KPI → thực chất là **scorecard**, không phải pivot.

**Cách sửa:** Gọi đúng tên. Dùng "Pivot" cho bảng 1–2, dùng "Executive Scorecard" cho bảng 3. Hoặc biến bảng 3 thành pivot thật với rows = date/shift/style/line, columns = KPI category, values = measures.

### Vấn đề 3 — Sai ngữ nghĩa KPI

Đây là lỗi nguy hiểm nhất vì nó ảnh hưởng trực tiếp đến độ tin cậy chuyên môn.

**a) Cycle time của trạm không phải Mean/Max của các công đoạn**

Trong chuyền may, một trạm thường có 1 công nhân làm nhiều công đoạn tuần tự. Vì vậy:

```text
Station cycle time = SUM(thời gian các công đoạn được gán cho trạm)
```

`Mean/Max` chỉ hợp lý khi:

- Bạn đang nói về **phân bố thời gian của cùng một công đoạn qua nhiều chu kỳ**.
- Hoặc trạm có nhiều máy/công nhân làm song song.

Nếu dùng `Mean/Max` cho trạm tuần tự, con số sẽ sai bản chất.

**b) Target Output pcs/h của trạm không phải target**

Target là chỉ tiêu của **cả chuyền**. Trạm chỉ có **capacity**:

```text
Station capacity (pcs/h) = 3600 / station cycle time
Line capacity (pcs/h)    = 3600 / bottleneck cycle time
```

Đừng ghi "Target Output" cho từng trạm. Ghi "Station Capacity" và "Line Target".

**c) Balance Efficiency khác Actual Line Efficiency**

- **Balance Efficiency** là chỉ số **kế hoạch**: mức độ chia đều công đoạn so với trạm nghẽn.
- **Actual Line Efficiency** là chỉ số **thực tế**: sản lượng thực × SAM / (số người × thời gian làm việc thực).

Không được trộn hai chỉ số này trong cùng một cột "Tỷ lệ cân bằng chuyền %".

**d) Loss time phải có reason code**

Muốn báo cáo "thời gian tổn thất do đổi mã hàng", phải có:

- Thời điểm bắt đầu/kết thúc changeover.
- Lý do loss: changeover, downtime, material, quality, absenteeism, no-load, rework, other.
- Người ghi nhận.

Nếu không, "loss time" chỉ là một con số không thể hành động.

### Vấn đề 4 — Thiếu nền dữ liệu

Dashboard đa chiều không thể chạy trên 3 file CSV rời rạc nếu không có data model. Cần tối thiểu:

- Star schema.
- Grain rõ ràng cho từng fact table.
- Dimension nhất quán.
- Metric dictionary.
- Data quality checks.

Không có những thứ này, pivot chỉ là `groupby` trang trí.

### Vấn đề 5 — Định vị "MES cấp tập đoàn" là nói quá

Với Streamlit + CSV + một optimizer, bạn đang làm:

> **Plant-level IE decision-support prototype** — một prototype cấp nhà máy.

Bạn **không** đang làm:

- MES thay thế hệ thống của nhà máy.
- Dashboard real-time cấp tập đoàn.
- Hệ thống multi-plant có phân quyền, audit, SLA.

Nếu gọi là MES cấp tập đoàn, interviewer sẽ hỏi:

- Kết nối PLC/SCADA thế nào?
- Dữ liệu real-time từ đâu?
- Phân quyền, audit log ra sao?
- Multi-factory consolidation thế nào?
- Data latency bao nhiêu?

Bạn sẽ không có câu trả lời thuyết phục trong 6 ngày.

**Cách định vị đúng:**

> "A plant-level IE control tower prototype that connects line balancing with shift-level plan-vs-actual analytics. Production roadmap includes MES integration."

### Vấn đề 6 — Tên "Gildan - HBI Huế" cần kiểm tra

Gildan và HBI (Hanesbrands) là **hai tập đoàn khác nhau**. Nếu bạn đang ứng tuyển HBI, việc ghép "Gildan - HBI Huế" trong CV/demo có thể gây khó hiểu hoặc bị coi là thiếu chính xác.

Nên dùng một trong các cách:

- "HBI-style garment factory (synthetic data)".
- "Tier-1 garment factory supplying Gildan/HBI" — nếu đúng là nhà máy gia công cho cả hai.
- Tên pháp lý cụ thể của nhà máy, nếu bạn đã xác nhận.

Tuyệt đối không dùng dữ liệu nội bộ thật nếu chưa được phép. Trong README ghi rõ: **"All data is synthetic and for demonstration only."**

---

## A3. Những điểm rất đáng giữ

Dù cần chỉnh scope, ý tưởng pivot có 5 điểm mạnh:

1. **Vòng quản trị khép kín**: Plan → Execute → Check → Act. Đây là thứ phân biệt IE với người chỉ biết code.
2. **Ba tầng báo cáo**: trạm → công nhân → ca/chuyền. Đúng cách quản lý sản xuất phân tầng.
3. **Shift logs**: biến project từ "bài toán tĩnh" thành "hệ thống có dữ liệu thực tế".
4. **Skill matrix**: thể hiện hiểu biết về đào tạo và bố trí lao động.
5. **Executive view**: trả lời câu hỏi của quản lý: "Chuyền nào đang mất năng suất, vì sao, ai cần đào tạo, hành động gì?"

Giữ 5 điểm này, nhưng đừng cố làm tất cả trong 6 ngày.

---

## A4. Kiến trúc chỉnh lại

```text
┌─────────────────────────────────────────────────────────────────────┐
│ 1. DATA LAYER                                                       │
│ TechPack / Operations / Skill Matrix / Line Config / Shift Logs     │
│ Loss Codes / Calendar                                               │
│ → Validation → Star Schema → Metric Dictionary → Data Quality       │
└──────────────────────────────┬──────────────────────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 2. PLAN LAYER                                                       │
│ Optimization Engine (PuLP/CBC)                                      │
│ → Assignment Plan → Planned Station Load → Planned KPI              │
└──────────────────────────────┬──────────────────────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 3. EXECUTE LAYER                                                    │
│ Shift Logs: actual cycle, output, defects, downtime, changeover     │
│ → Actual Station Load → Actual Line KPI                             │
└──────────────────────────────┬──────────────────────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 4. ANALYTICS LAYER                                                  │
│ Plan vs Actual vs Optimized                                         │
│ → Line Balancing Pivot                                              │
│ → Worker Skill Pivot                                                │
│ → Shift Executive Scorecard                                         │
│ → Loss Pareto / Bottleneck Trend / Skill Gap                        │
└──────────────────────────────┬──────────────────────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 5. ACTION LAYER                                                     │
│ Rebalance / Training Plan / Changeover Improvement / Shift Handover │
└─────────────────────────────────────────────────────────────────────┘
```

**Điểm quan trọng:** Shift logs không đi trực tiếp vào optimizer. Chúng đi vào lớp **Actual** để so sánh với **Plan**. Chỉ khi có variance lớn hoặc đổi style, người dùng mới bấm **Rebalance** để chạy lại optimizer.

Đây là kiến trúc "closed-loop IE", không phải "MES real-time". Cách gọi này vừa chính xác vừa đủ ấn tượng.

---

## A5. Ba pivot — sửa lại cho đúng

### Pivot 1 — Line Balancing & Workload

**Grain:** 1 dòng = 1 ngày × ca × chuyền × style × trạm × công đoạn × máy.

| Thành phần | Đề xuất |
|---|---|
| Rows | Station ID → Operation Code → Machine Type |
| Columns | Shift (A/B/C) hoặc Measure |
| Values | Planned SAM load; Actual cycle time; Workload Ratio; Idle/Overload; Station Capacity |
| Filters | Date, Line, Style, Shift, Status |
| Drill-down | Station → Operation → Worker |

**Công thức đúng:**

```text
Planned station load = Σ SAM của các công đoạn được gán cho trạm
Actual station cycle = Σ actual cycle time của các công đoạn (trạm tuần tự)
Workload Ratio (%)   = Actual station cycle / Takt time × 100
Idle time            = max(0, Takt - Actual station cycle)
Overload time        = max(0, Actual station cycle - Takt)
Station capacity     = 3600 / Actual station cycle
Line capacity        = 3600 / Bottleneck cycle
```

**Lưu ý:**

- Nếu trạm có nhiều máy/công nhân song song, dùng `max` thay vì `sum`. Phải khai báo rõ.
- `Mean/Max` nên nằm ở **operation-level distribution**, không phải station-level.
- `Target Output` chỉ dùng ở line-level. Station-level dùng `Capacity`.
- Màu: đỏ > 100%, cam 90–100%, vàng < 75%, xanh 75–90%.

### Pivot 2 — Worker-Skill-Task Allocation

Nên tách thành **2 view** thay vì nhồi 3 measure vào một pivot:

**View 2A — Skill Matrix**

| Thành phần | Đề xuất |
|---|---|
| Rows | Line Group → Worker |
| Columns | Skill Group (May cổ, Tra tay, Diễu dằn, Kiểm tra...) |
| Values | Skill Grade (0–3 hoặc A/B/C) |
| Filters | Line, Shift, Skill, Grade |
| Visual | Heatmap |

**View 2B — Allocation & Gap**

| Thành phần | Đề xuất |
|---|---|
| Rows | Worker → Station → Operation |
| Columns | Measure |
| Values | Assigned SAM; Skill Fit; Efficiency Factor; Skill Gap |
| Filters | Line, Shift, Station, Skill |
| Visual | Table + highlight |

**Bổ sung rất đáng giá:**

- **Versatility Index**: số công đoạn một người có thể làm / tổng công đoạn.
- **Skill Coverage**: số người đủ kỹ năng cho mỗi công đoạn trọng yếu.
- **Single Point of Failure**: công đoạn chỉ có đúng 1 người đủ kỹ năng.
- **Training Priority**: người/công đoạn có gap lớn nhất.

**Lưu ý:** "Điểm gán tối ưu" là cụm mơ hồ. Hãy định nghĩa thành một score cụ thể, ví dụ:

```text
Skill fit score = mức kỹ năng vượt yêu cầu - penalty nếu thiếu
```

Hoặc đơn giản hơn: optimizer dùng hard constraint, còn score chỉ để xếp hạng phương án.

### Pivot 3 — Shift Executive Scorecard

Đây nên là **scorecard có khả năng pivot**, không phải pivot thuần.

**Grain:** 1 dòng = 1 ngày × ca × chuyền × style.

| Thành phần | Đề xuất |
|---|---|
| Rows | Date → Shift → Style → Line |
| Columns | KPI (Target, Actual, Variance, Completion %, Efficiency, Balance, Changeover Loss, Downtime, FPY) |
| Values | SUM / AVERAGE / RATIO |
| Filters | Date range, Plant, Line, Style, Shift |
| Drill-down | Style → Line → Station → Operation → Worker |

**Bổ sung:**

- **Loss Pareto**: top lý do mất năng suất.
- **Trend**: efficiency theo ngày/tuần.
- **Heatmap**: line × shift efficiency.
- **Alert**: line dưới target 3 ca liên tiếp; bottleneck lặp lại; skill coverage thấp.
- **Shift handover report**: top 3 vấn đề + hành động đề xuất.

**Lưu ý phân biệt:**

```text
Balance Efficiency (Plan) = SAM_total / (N × Bottleneck cycle) × 100
Actual Line Efficiency    = Actual output × SAM_total / (Operators × Worked minutes) × 100
```

Hai chỉ số này phải nằm ở hai cột khác nhau, có tooltip giải thích.

---

## A6. Star schema tối thiểu

Nếu muốn pivot thật, cần data model thật. Đây là schema tối thiểu:

### Dimensions

| Bảng | Grain | Cột chính |
|---|---|---|
| `dim_date` | 1 dòng/ngày | date_key, date, week, month, year |
| `dim_shift` | 1 dòng/ca | shift_key, shift_name, start_time, end_time |
| `dim_line` | 1 dòng/chuyền | line_key, line_name, plant, group |
| `dim_style` | 1 dòng/style | style_key, style_code, product_type, sam_total |
| `dim_operation` | 1 dòng/công đoạn | operation_key, op_code, op_name, machine_type, skill_code, sam_sec |
| `dim_worker` | 1 dòng/công nhân | worker_key, worker_name, line_key, available |
| `dim_machine` | 1 dòng/máy | machine_key, machine_type |
| `dim_loss_reason` | 1 dòng/lý do | reason_key, category, description |

### Facts

| Bảng | Grain | Measure chính |
|---|---|---|
| `fact_skill_matrix` | worker × skill × ngày đánh giá | grade, efficiency_factor |
| `fact_plan_assignment` | ngày × style × line × operation × station × worker | planned_sam, planned_load, takt |
| `fact_shift_operation_actual` | ngày × ca × line × style × operation × worker × station | actual_cycle, output, defect, downtime, changeover, loss_reason |
| `fact_shift_line_kpi` | ngày × ca × line × style | target, actual, worked_min, operators, efficiency, balance, loss |

**Vì sao cần `fact_shift_line_kpi` nếu đã có operation actual?**

- Tăng tốc dashboard.
- Là single source of truth cho báo cáo cấp quản lý.
- Tránh mỗi chart tự aggregate một kiểu.

Nhưng phải định nghĩa rõ: bảng này được **tính từ** operation actual, không phải nhập tay tùy tiện.

### Metric dictionary

Tạo một file `METRICS.md` hoặc một bảng trong app:

| Metric | Formula | Grain | Source |
|---|---|---|---|
| Takt time | Available seconds / Target qty | Line/style/shift | Line config |
| SAM total | Σ SAM operations | Style | TechPack |
| Planned station load | Σ SAM assigned | Station | Plan |
| Actual station cycle | Σ actual operation time (sequential) | Station | Shift log |
| Workload ratio | Station cycle / Takt | Station | Derived |
| Balance efficiency | SAM total / (N × Bottleneck cycle) | Line/style | Plan |
| Actual line efficiency | Actual output × SAM / (Operators × Worked min) | Line/shift | Actual |
| Balance delay | 100 − Balance efficiency | Line/style | Plan |
| Capacity | Available seconds / Bottleneck cycle | Line/shift | Derived |
| Target achievement | Actual / Target | Line/shift | Actual |
| Loss time | Σ downtime + changeover + material + quality + absenteeism + other | Line/shift | Shift log |
| FPY | First pass qty / Total qty | Line/shift | Quality |
| Skill coverage | Count qualified workers per operation | Operation | Skill matrix |
| Versatility | Count qualified operations per worker | Worker | Skill matrix |
| Single point of failure | Operation with exactly 1 qualified worker | Operation | Skill matrix |

> Metric dictionary là thứ rất "IE" và rất dễ gây ấn tượng. Nó chứng minh bạn không chỉ biết vẽ chart mà còn biết quản trị định nghĩa dữ liệu.

---

## A7. Scope thực tế: 6 ngày vs 10 ngày

### Option 1 — 6-day MVP (khuyến nghị nếu deadline gấp)

**Deliverable:**

- Optimizer với precedence + takt + skill + machine.
- Line Balancing Pivot (Pivot 1).
- Shift KPI scorecard cơ bản (Pivot 3 rút gọn).
- Skill Matrix table/heatmap (chưa phải full Pivot 2).
- Plan vs Actual đơn giản.
- Export Excel.
- Synthetic data 1 style, 1 line, 2 shifts, 14–30 ngày.

**Không làm:**

- Full pivot builder.
- Multi-line/multi-plant.
- Loss Pareto nâng cao.
- Drill-down 4 tầng.
- Auth.
- MES integration.

**Lịch 6 ngày:**

| Ngày | Việc chính | Output |
|---|---|---|
| Day 1 | Data layer, star schema, synthetic data, validation, metric dictionary | `data/`, `validation.py`, `METRICS.md` |
| Day 2 | Optimizer + Line Balancing Pivot | `optimizer.py`, workload chart |
| Day 3 | Skill Matrix + skill gap + worker allocation view | Skill heatmap, gap warnings |
| Day 4 | Shift logs + Shift KPI scorecard + plan vs actual | Executive tab cơ bản |
| Day 5 | UI integration, filter, export, test | App end-to-end |
| Day 6 | Deploy, README, demo video, CV bullets | Link + video |

**Rủi ro:** vẫn khá tight. Nếu Day 4 sa sút, cắt scorecard xuống còn 4 KPI: target, actual, efficiency, bottleneck.

### Option 2 — 10-day full prototype

**Thêm so với 6 ngày:**

- Full Worker Skill Pivot + coverage + single-point-of-failure.
- Full Executive Pivot + loss Pareto + trend + alert.
- Drill-down 4 tầng.
- Scenario comparison: manual baseline vs optimized plan vs actual.
- Data quality panel.
- Shift handover report tự động.
- 3 style × 2 line × 30 ngày synthetic data.

**Lịch:**

| Ngày | Việc chính |
|---|---|
| Day 1–6 | Như Option 1 |
| Day 7 | Full Worker Skill Pivot + coverage/SpoF |
| Day 8 | Full Executive Pivot + loss Pareto + trend |
| Day 9 | Drill-down + scenario comparison + data quality + alert |
| Day 10 | Polish, deploy, README, demo, rehearsal |

### Option 3 — Production roadmap (không làm trong CV timeline)

- 4–6 tuần.
- PostgreSQL/Supabase, auth, scheduled ETL.
- MES/barcode integration.
- Multi-line, multi-plant.
- Real-time/near-real-time.
- Audit log, data governance.

Chỉ nên mô tả trong phần "Production roadmap" của README, không claim đã làm.

---

## A8. Những thứ nên thêm để project mạnh hơn

1. **Plan vs Actual vs Optimized**
   - 3 cột so sánh trên cùng chart.
   - Trả lời: "Kế hoạch tốt đến đâu, thực tế lệch bao nhiêu, nếu tối ưu lại thì sao?"
   - Đây là tính năng "ăn tiền" nhất, hơn cả 3 pivot tĩnh.

2. **Loss Pareto**
   - Top 5 lý do mất năng suất.
   - Drill-down: loss reason → line → station → operation.
   - Rất quen thuộc với quản lý nhà máy.

3. **Skill coverage & Single Point of Failure**
   - Công đoạn nào chỉ có 1 người làm được?
   - Nếu người đó nghỉ, chuyền gãy ở đâu?
   - Đây là góc nhìn "risk management" rất IE.

4. **Data Quality Panel**
   - Missing shift logs.
   - Duplicate entries.
   - Actual cycle time outliers.
   - Plan vs actual mismatch.
   - Không có panel này, dashboard có thể đẹp nhưng sai.

5. **Rule-based Insight Generator**
   - Không cần ML.
   - Ví dụ: "Line 3 missed target by 8%. Bottleneck at OP045 (118% takt). 2 operators lack skill B. Changeover loss 35 min."
   - Có thể dùng template + threshold.
   - Rất ấn tượng với quản lý vì biến số liệu thành hành động.

6. **Shift Handover Report**
   - Tự động tổng hợp cuối ca: sản lượng, bottleneck, loss, skill issue, action đề xuất.
   - Xuất PDF/Excel.
   - Cực kỳ sát công việc Shift Line Engineer.

7. **Metric Dictionary**
   - Định nghĩa từng KPI, công thức, grain, nguồn dữ liệu.
   - Tránh tranh cãi "số của ai đúng".

8. **Drill-down**
   - Executive → Line → Station → Operation → Worker.
   - Dùng selectbox/filter, không cần OLAP cube.

9. **Role-based views**
   - Line Engineer: station/operation.
   - Supervisor: line/shift.
   - Plant Manager: style/line trend.
   - MVP chỉ cần tab selector, chưa cần auth.

10. **Alert thresholds cấu hình**
    - Workload > 100%: đỏ.
    - 90–100%: cam.
    - < 75%: vàng.
    - Target miss 3 ca liên tiếp: alert.

11. **Export Excel nhiều sheet**
    - Input, Assignment, Station KPI, Warnings, Scenario Summary, Pivot.
    - Đây là "ngôn ngữ chung" với supervisor.

12. **Scenario comparison**
    - Takt ±10%, headcount ±10%, skill downgrade.
    - So sánh efficiency, balance delay, output, số người.

---

## A9. Những thứ nên bỏ hoặc hoãn

| Nên bỏ/hoãn | Lý do |
|---|---|
| "MES cấp tập đoàn" | Nói quá so với prototype Streamlit + CSV |
| Real-time MES integration | Không khả thi trong 6 ngày |
| Multi-plant consolidation | Cần data governance, không cần cho demo |
| Auth/phân quyền | Không cần cho prototype |
| Full OLAP cube | Streamlit + pandas pivot_table đủ |
| CAD/2D layout | Ngoài scope, dễ mất thời gian |
| ML/DL | Không cần, dễ làm loãng project |
| 3 full pivot trong 6 ngày | Scope creep rõ ràng |
| GA nếu MILP đủ | Tốn thời gian, khó giải thích hơn |
| Dữ liệu thật của HBI/Gildan | Rủi ro bảo mật, không được phép |

---

## A10. Cách định vị lại trên CV

### Tên project

**LineBalance Pro — IE Control Tower (Prototype)**

Hoặc:

**LineBalance Pro — Garment Line Balancing & Shift Performance Analytics**

### Mô tả một dòng

> "A plant-level IE decision-support prototype that connects MILP line balancing with shift-level plan-vs-actual analytics, bottleneck drill-down and skill-gap reporting."

### CV bullets gợi ý

```text
• Built a plant-level IE control tower prototype connecting MILP line balancing
  with shift-level plan-vs-actual reporting; optimized 50+ operations under
  takt, precedence, machine and multi-skill constraints.

• Designed a star schema and metric dictionary for 3 reporting layers
  (station, worker, shift); automated bottleneck detection, loss-time Pareto
  and skill-gap alerts.

• Implemented plan-vs-actual vs re-optimized scenario comparison and Excel
  export; validated on a 30-day synthetic garment dataset.

• Documented production roadmap for MES integration, data governance and
  multi-line scaling; no confidential company data used.
```

### Câu hỏi phỏng vấn cần chuẩn bị

- Grain của từng fact table là gì?
- Vì sao station cycle time là tổng, không phải trung bình?
- Phân biệt Balance Efficiency và Actual Line Efficiency?
- Làm sao so sánh plan vs actual khi thiếu shift log?
- Làm sao xử lý missing data/outlier?
- Nếu mở rộng multi-line/multi-plant thì cần gì?
- Vì sao chọn Streamlit? Khi nào chuyển sang Power BI/Dash?
- Nếu có 6 ngày vs 10 ngày, bạn cắt gì?
- Làm sao tích hợp với MES thật?
- Làm sao đảm bảo không dùng dữ liệu mật?

---

## A11. Chốt lại

**Ý tưởng pivot rất tốt, nhưng không nên là "cái bẫy scope".**

Cách hợp lý nhất:

- **Nếu 6 ngày:** làm optimizer thật tốt + **Line Balancing Pivot** + **Shift KPI scorecard** + **Skill Matrix view**. Gọi là "IE Control Tower prototype". Để full 3 pivot làm roadmap.
- **Nếu 10 ngày:** làm full 3 pivot + plan-vs-actual + loss Pareto + drill-down. Vẫn gọi là prototype, không gọi MES.
- **Nếu muốn đi làm thật:** 4–6 tuần, tích hợp MES/DB/auth, lúc đó mới gọi là hệ thống.

**Một câu chốt:**

> Đừng cố làm "MES cấp tập đoàn" trong 6 ngày. Hãy làm "IE Control Tower prototype" đủ sâu để chứng minh tư duy hệ thống, rồi mô tả roadmap lên production. Nhà tuyển dụng đánh giá cao sự hiểu biết về giới hạn hơn là một demo phình to nhưng nông.
