# Benchmark Results — LineBalance Pro

> **Ngày chạy:** 2026-11-06 (local, Windows)  
> **Mục đích:** kiểm tra khả năng mở rộng của MILP ở quy mô 50 operations / 25 workers.  
> **Dữ liệu:** synthetic — không phải dữ liệu hay kết quả sản xuất thật.  
> **Kết quả thô:** [`local_2026-11-06.json`](results/local_2026-11-06.json).

---

## 1. Protocol

| Thành phần | Giá trị |
|---|---|
| Máy chạy | Windows 11, 12 logical CPU |
| Python | 3.14.3 (local; deploy target là Python 3.12) |
| Modeling layer | PuLP 4.2.0 |
| Solver | HiGHS 1.15.1, 2 threads |
| Time limit | 60 giây/case |
| Objective | `min_bottleneck` |
| Cách chạy | một lần/case trong một Python process; không phải median của nhiều lần |
| Lệnh | `python -m benchmarks.run_benchmark --output benchmarks/results/local_2026-11-06.json` |

**Đọc `stage1_objective` / `stage2_objective` đúng:**

- Với `min_bottleneck`: stage 1 = bottleneck load (giây), stage 2 = số station được dùng.
- Với `min_workers`: stage 1 = số station, stage 2 = bottleneck load (giây).

Đây là hai objective khác đơn vị, không phải hai lần đo cùng một giá trị.

> **Lưu ý lịch sử:** file `local_2026-11-06_before_metadata_fix.json` được giữ lại để audit.
> File đó được tạo trước khi sửa `_stage_objective()` nên `stage2_objective` bị lặp lại giá trị
> của stage 1. Không dùng file đó để trích dẫn metadata hai stage.

---

## 2. Cases

| Case | Thành phần | Đặc điểm |
|---|---|---|
| `balanced_50x25` | 50 operations, 25 workers, 25 máy `SINGLE` | Mỗi operation 25s, precedence nối tiếp, target 420 |
| `extended_50x25` | 40 operation mẫu + 10 operation cuối line | 25 workers, target 420, kiểm tra mở rộng routing |
| `stress_50x25` | 40 operation mẫu + 10 operation nhánh sớm | 25 workers, target 420, ít máy hơn, precedence chéo |

Tất cả case dùng `solver_time_limit_sec = 60`, `planned_efficiency = 0.85`, `max_workers = 25`.

---

## 3. Kết quả

| Case | Ops | Workers | Status | Stage 1 | Stage 2 | Bottleneck | Stations | Capacity | Target | Proven | Solve time |
|---|---:|---:|---|---:|---:|---:|---:|---:|---:|---|---:|
| `balanced_50x25` | 50 | 25/25 | `OPTIMAL` | 50.0s | 25 | 50.0s | 25 | 459.0 | 420 (109.29%) | yes | 1.339s |
| `extended_50x25` | 50 | 25/25 | `OPTIMAL` | 64.0s | 25 | 64.0s | 25 | 358.6 | 420 (85.38%) | yes | 26.313s |
| `stress_50x25` | 50 | 25/25 | `FEASIBLE_LIMIT` | 64.0s | — | 64.0s | 25 | 358.6 | 420 (85.38%) | no | 60.213s |

- `balanced_50x25` là case chia hết: 50 ops × 25s = 1,250s; 25 workers × 50s = 1,250s.
- `extended_50x25` chứng minh được bottleneck 64.0s là optimum trong 26.3s; target 420 vẫn không đạt.
- `stress_50x25` chạm time limit 60s, giữ được incumbent 64.0s nhưng **không chứng minh** lexicographic optimum.
  Vì vậy status là `FEASIBLE_LIMIT`, không phải `OPTIMAL`.

---

## 4. Cách đọc kết quả

1. **`OPTIMAL` không có nghĩa là đạt target.** `extended_50x25` là `OPTIMAL` nhưng capacity chỉ 358.6/420.
2. **`FEASIBLE_LIMIT` không phải lỗi solver.** Đây là nghiệm khả thi nhưng chưa chứng minh tối ưu.
3. **Không so sánh thời gian chạy giữa các case như benchmark phần cứng.** Đây là một lần chạy local,
   không phải median của nhiều lần; thời gian phụ thuộc máy, solver version và warm start.
4. **Không dùng capacity làm actual output.** Đây là bottleneck-constrained planning capacity.

---

## 5. Việc còn lại trước khi trích dẫn benchmark trong CV

- Chạy lặp 3–5 lần/case và báo **median + min–max**.
- Chạy trên môi trường gần production (Python 3.12, Render free tier) nếu muốn nói về deploy.
- Lưu cùng một commit hash và `input_hash` cho mọi lần chạy.
- Ghi rõ cold run hay warm run; hiện tại mỗi case là một lần chạy trong process mới.
