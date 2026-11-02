# LineBalance Pro — MILP Model Specification

> **Phiên bản:** 2.0 — SAM-based linear model  
> **Ngày:** 2026-11-02  
> **Trạng thái:** áp dụng cho MVP 8 ngày  
> **Liên quan:** `CHECKLIST.md`, `KPI_SPEC.md`, `backend/app/optimizer.py`

---

## 1. Mục tiêu và giới hạn

Mô hình tìm cách gán:

- mỗi **operation** vào đúng một **station**;
- mỗi **station** dùng tối đa một **worker**;
- mỗi **worker** đứng tối đa một **station**;
- thỏa **precedence**, **skill**, **machine**, **headcount**;
- tối ưu **bottleneck** hoặc **số worker** theo thứ tự từ điển.

MVP giả định:

- Một factory, một style, một line, một shift.
- Một station một worker.
- Một station tối đa một loại máy.
- Một operation không có nhiều worker/máy song song.
- Công đoạn thủ công có `machine_type = None`.
- Thời gian tiêu chuẩn dùng **SAM cố định**, không phụ thuộc worker.

---

## 2. Sets và indices

| Ký hiệu | Ý nghĩa |
|---|---|
| \(I\) | Tập operation, index \(i\) |
| \(S\) | Tập station tiềm năng, index \(s = 1..S_{max}\) |
| \(W\) | Tập worker available, index \(w\) |
| \(K\) | Tập machine type cần thiết, index \(k\) |
| \(E_i \subseteq W\) | Tập worker đủ skill và chứng nhận máy cho operation \(i\) |
| \(P \subseteq I \times I\) | Tập precedence pair \((p, i)\): p trước i |

\(S_{max}\) được tính:

```text
S_max = min(max_workers, number_of_operations, number_of_available_workers)
```

---

## 3. Parameters

| Ký hiệu | Ý nghĩa | Đơn vị |
|---|---|---|
| \(SAM_i\) | Standard Allowed time của operation i | giây/piece |
| \(a_i\) | Allowance áp dụng cho operation i | % |
| \(\widehat{SAM}_i = SAM_i (1+a_i)\) | Planning SAM dùng trong mô hình | giây/piece |
| \(T\) | Demand takt = net available seconds / target | giây/piece |
| \(T_{eff}\) | Effective takt = net available × planned efficiency / target | giây/piece |
| \(C_k\) | Machine capacity của loại k | station |
| \(M\) | max_workers | người |
| \(cert(w,k)\) | Worker w được chứng nhận máy k | boolean |
| \(skill(w,i)\) | Grade của worker w cho operation i | 0..3 |
| \(req_i\) | Grade tối thiểu của operation i | 0..3 |

**Lưu ý allowance:**

- Nếu `sam_basis = INCLUDES_ALLOWANCE`: \(a_i = 0\). Allowance đã nằm trong SAM.
- Nếu `sam_basis = EXCLUDES_ALLOWANCE`: \(a_i = allowance\_pct\). Chỉ cộng một lần.

---

## 4. Decision variables

| Biến | Loại | Ý nghĩa |
|---|---|---|
| \(x_{is}\) | binary | 1 nếu operation i vào station s |
| \(y_{sw}\) | binary | 1 nếu worker w đứng station s |
| \(z_s\) | binary | 1 nếu station s được dùng |
| \(m_{sk}\) | binary | 1 nếu station s được trang bị machine type k |
| \(Load_s\) | continuous ≥ 0 | Planning workload của station s |
| \(C_{max}\) | continuous ≥ 0 | Workload lớn nhất |

**Không có biến \(a_{isw}\) trong MVP.** Lý do: \(Load_s\) không phụ thuộc worker, nên không cần tuyến tính hóa tích \(x \times y\).

---

## 5. Constraints

### 5.1. Mỗi operation đúng một station

\[
\sum_{s \in S} x_{is} = 1 \quad \forall i \in I
\]

Tên trong code: `assign_{i}`.

### 5.2. Station–worker

\[
\sum_{w \in W} y_{sw} = z_s \quad \forall s \in S
\]

\[
\sum_{s \in S} y_{sw} \le 1 \quad \forall w \in W
\]

Tên: `station_worker_{s}`, `worker_once_{w}`.

### 5.3. Station–operation linkage

\[
x_{is} \le z_s \quad \forall i,s
\]

\[
z_s \le \sum_{i \in I} x_{is} \quad \forall s
\]

\[
z_s \ge z_{s+1} \quad \forall s = 1..S_{max}-1
\]

Tên: `x_station_{i}_{s}`, `station_has_operation_{s}`, `prefix_{s}`.

**Prefix** là symmetry breaking: station được dùng theo thứ tự 1, 2, 3... không có lỗ hổng.

### 5.4. Skill eligibility

\[
x_{is} \le \sum_{w \in E_i} y_{sw} \quad \forall i,s
\]

Tên: `skill_{i}_{s}`.

**Quan trọng:** skill grade chỉ là điều kiện đủ năng lực. Không nhân skill vào SAM.

### 5.5. Machine compatibility

Với operation i cần machine type k:

\[
x_{is} \le m_{sk} \quad \forall s
\]

Mỗi station tối đa một loại máy:

\[
\sum_{k \in K} m_{sk} \le 1 \quad \forall s
\]

Liên kết station:

\[
m_{sk} \le z_s \quad \forall s,k
\]

Chỉ bật máy nếu station thực sự có operation cần máy đó:

\[
m_{sk} \le \sum_{i: machine_i = k} x_{is} \quad \forall s,k
\]

Không vượt capacity:

\[
\sum_{s \in S} m_{sk} \le C_k \quad \forall k
\]

Worker phải được chứng nhận:

\[
y_{sw} + m_{sk} \le 1 \quad \forall s,w,k: \neg cert(w,k)
\]

Tên: `machine_required_{i}_{s}`, `one_machine_{s}`, `machine_station_{s}_{k}`, `machine_needed_{s}_{k}`, `machine_capacity_{k}`, `worker_machine_{s}_{w}_{k}`.

### 5.6. Precedence

\[
\sum_{s} s \cdot x_{ps} \le \sum_{s} s \cdot x_{is} \quad \forall (p,i) \in P
\]

Tên: `precedence_{pair}`.

Ràng buộc này đảm bảo station của predecessor không sau station của successor.

### 5.7. Headcount

\[
\sum_{s} z_s \le M
\]

Tên: `max_workers`.

### 5.8. Station load — linear

\[
Load_s = \sum_{i \in I} \widehat{SAM}_i \cdot x_{is} \quad \forall s
\]

Tên: `load_definition_{s}`.

Đây là điểm sửa quan trọng: không có \(worker\_at_s\), không có big-M, không có tích biến.

### 5.9. Bottleneck

\[
Load_s \le C_{max} \quad \forall s
\]

Tên: `cmax_{s}`.

### 5.10. Hard takt cho `min_workers`

\[
Load_s \le T_{eff} \cdot z_s \quad \forall s
\]

Tên: `effective_takt_{s}`.

`min_bottleneck` không có ràng buộc cứng này; takt chỉ là KPI/cảnh báo.

---

## 6. Objective và lexicographic optimization

### 6.1. Chế độ `min_bottleneck` (mặc định)

**Stage 1:**

\[
\min C_{max}
\]

**Stage 2:**

\[
\min \sum_s z_s
\]

subject to:

\[
C_{max} \le C_{max}^* + \epsilon
\]

và tất cả ràng buộc còn lại.

### 6.2. Chế độ `min_workers`

**Stage 1:**

\[
\min \sum_s z_s
\]

với ràng buộc cứng \(Load_s \le T_{eff} z_s\).

**Stage 2:**

\[
\min C_{max}
\]

subject to:

\[
\sum_s z_s \le HC^*
\]

### 6.3. Xử lý timeout

| Stage 1 | Stage 2 | Kết quả |
|---|---|---|
| `OPTIMAL` | `OPTIMAL` | `OPTIMAL`, `lexicographic_proven=true` |
| `OPTIMAL` | `TIME_LIMIT` có nghiệm | `FEASIBLE_LIMIT`, `false` |
| `OPTIMAL` | không có nghiệm | giữ stage 1, `FEASIBLE_LIMIT`, `false` |
| `TIME_LIMIT` có nghiệm | best effort | `FEASIBLE_LIMIT`, `false` |
| `INFEASIBLE` | — | `INFEASIBLE`, `error_type=MODEL` |
| Không có nghiệm | — | `ERROR` |

**Quy tắc:** Không bao giờ trả `OPTIMAL` nếu stage 1 hoặc stage 2 chưa chứng minh tối ưu.

---

## 7. Thứ tự công đoạn trong station

Sau khi giải:

1. Lấy topological order từ precedence DAG.
2. Với mỗi station, sắp xếp operation theo index trong topological order.
3. Ghi `sequence_in_station = 1, 2, 3...`.
4. Post-check:
   - mỗi operation đúng một station;
   - mỗi worker đúng một station;
   - skill grade đủ;
   - machine certification đủ;
   - precedence \(station(p) \le station(i)\);
   - nếu cùng station, thứ tự topo đúng.

Nếu post-check fail, trả `ERROR` với `solver_status=VERIFICATION_ERROR`, không trả nghiệm sai.

---

## 8. Baseline comparison

Baseline là input:

```text
operation_id, station_id, worker_id
```

Nếu baseline đầy đủ:

- Tính load từng station bằng \(\widehat{SAM}\).
- Tính số station, số worker, bottleneck, LBE, capacity, target achievement.
- So sánh before/after.
- Liệt kê violation: skill, machine, precedence, worker trùng station, operation thiếu/trùng.

Nếu baseline thiếu:

- `before = null`.
- Không tính delta.
- Ghi rõ lý do.

**Không dùng optimizer để tạo baseline giả.**

---

## 9. Verification và test

### 9.1. Test tối thiểu

| Test | Kỳ vọng |
|---|---|
| Mỗi operation đúng 1 station | `sum_s x_is = 1` |
| Worker không ở 2 station | `sum_s y_sw <= 1` |
| Precedence | station(pred) <= station(succ) |
| Skill | worker đủ grade |
| Machine | đúng loại, đúng capacity, worker certified |
| Load | `Load_s = Σ planning SAM` |
| Baseline | before/after khớp tay |
| Lexicographic | không claim OPTIMAL khi timeout |
| In-station order | topo order đúng |

### 9.2. Benchmark

- 40 ops / 24 workers / 23 machines.
- 50 ops / 25 workers / 25 machines.
- Đo solve time, status, objective, gap nếu có.
- Ghi vào `benchmarks/RESULTS.md`.

---

## 10. Giới hạn và hướng nâng cấp

### Giới hạn MVP

- Không có worker-specific performance.
- Không có multi-machine station.
- Không có parallel workers.
- Không có multi-line/multi-plant.
- Không có learning curve.
- Không có machine runtime/utilization.

### Nâng cấp khi có dữ liệu

1. **Worker-specific time:** thêm \(a_{isw}\) và ràng buộc tuyến tính hóa.
2. **Multi-machine station:** thêm biến theo operation–machine, capacity theo máy vật lý.
3. **Multi-line:** thêm line index, shared worker/machine pool.
4. **Robust optimization:** bất định SAM, absenteeism, demand.
5. **Warm start:** dùng baseline làm MIP start để giảm solve time.

---

## 11. Mapping code

| Thành phần | File |
|---|---|
| Schema | `backend/app/models.py` |
| Validation, topo order | `backend/app/validation.py` |
| Time basis | `backend/app/utils.py` |
| MILP | `backend/app/optimizer.py` |
| KPI | `backend/app/kpis.py` |
| Baseline | `backend/app/baseline.py` |
| Capacity/HC | `backend/app/planning.py` |
| Actuals | `backend/app/actuals.py` |
| Sample data | `backend/app/sample_data.py` |
| API | `backend/app/main.py` |

---

> **Kết luận:** Mô hình MVP là MILP tuyến tính thật vì \(Load_s\) chỉ phụ thuộc \(x_{is}\) và SAM cố định. Mọi phụ thuộc worker được đẩy sang giai đoạn sau khi có dữ liệu time study đáng tin cậy.
