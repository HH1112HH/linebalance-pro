# Interview Preparation — Shift Line Engineer

> **Mục tiêu:** bộ khung ôn phỏng vấn cho vị trí Shift Line Engineer / Industrial Engineer trong môi trường may.
> **Project examples:** dữ liệu trong LineBalance Pro và các case study đều **synthetic**; không phải kinh nghiệm hay kết quả sản xuất tại HBI.
> **Cách dùng:** thay phần `[in brackets]` bằng kinh nghiệm thật của bạn. Nếu chưa có kinh nghiệm production tương ứng, nói rõ đây là portfolio simulation hoặc trình bày cách tiếp cận giả định — không kể như sự kiện đã xảy ra.

---

## 1. Quy tắc trả lời trung thực

| Có thể nói | Không được claim từ portfolio hiện tại |
|---|---|
| “In my synthetic portfolio case / model…” | “I achieved this on an HBI production line.” |
| MILP chứng minh nghiệm `OPTIMAL` cho **synthetic input** | Tất cả chuyền thật đều đạt kết quả đó |
| Bottleneck/capacity thay đổi theo model | Actual output tăng đúng bằng theoretical capacity |
| Estimated saving theo các giả định đã nêu | Cash saving đã được Finance/payroll xác nhận |
| OEE tính từ log máy synthetic, nếu pacer assumption đúng | OEE là utilization hoặc OEE production đã được xác nhận |
| Approach hypothetical, có decision boundary và safety gate | Tự nhận đã làm những việc chưa từng làm |

**Tóm tắt đúng về project:** LineBalance Pro là portfolio demo dùng synthetic data, có optimizer, dashboard và case study; public deployment đang chờ. Kết quả mô hình không phải production evidence.

---

## 2. Chuẩn bị trước phỏng vấn

Điền các mục bằng sự thật của bạn trước khi học thuộc câu trả lời:

- Manufacturing/garment experience: `[số năm / chưa có]`
- Line/style/operation từng làm: `[chỉ điền nếu đã làm thật]`
- Một cải tiến do bạn trực tiếp thực hiện: `[vấn đề → hành động → kết quả đã xác minh]`
- Vai trò chính xác của bạn: `[owner / contributor / observer / project simulation]`
- Kỹ năng và chứng chỉ thật: `[không thêm nếu chưa có]`
- Sẵn sàng làm ca/điều kiện làm việc: `[câu trả lời thật]`

**STAR trong 60–120 giây:**

1. **Situation:** bối cảnh, scope, baseline.
2. **Task:** trách nhiệm của bạn; chỉ nhận đúng phần mình sở hữu.
3. **Action:** 2–4 hành động, công cụ và người cần phối hợp.
4. **Result:** con số cùng đơn vị, target đạt/chưa đạt, giới hạn và bài học.

Không mở đầu dài. Nêu kết quả/decision trước, sau đó giải thích bằng evidence. Với hypothetical, đổi quá khứ thành “I would…”; với portfolio, nói rõ “In my synthetic project…”.

---

## 3. Giới thiệu bản thân — khoảng 60 giây

> **Template tiếng Anh — chỉnh câu đầu theo hồ sơ thật:**

> I’m an industrial engineering `[candidate / professional with X years of experience]` focused on garment production flow, line balancing, and safe shift execution. For my portfolio, I built LineBalance Pro using synthetic garment-line data. It combines a FastAPI backend, a React dashboard, and a two-stage MILP optimizer. In one modeled scenario, the baseline used 24 stations and 24 workers with a 61-second bottleneck; the optimizer used 23 of 24 available workers and reduced the bottleneck to 58 seconds. At 85% planned efficiency, modeled capacity increased from 376.2 to 395.7 pieces per shift, but the 420-piece target was still not met. I present that limitation explicitly. My approach is to verify the data, protect safety and quality, coordinate the right functions, and close actions with clear owners. The project is a synthetic portfolio demonstration, not a production result.

**Không đọc nguyên văn** nếu phần `[candidate / professional…]` không đúng. Thêm một ví dụ thật của bạn nếu có; nếu không, giữ câu portfolio và không bịa kinh nghiệm.

---

## 4. Năm STAR case — model answers tiếng Anh

| Case | S — Situation | T — Task | A — Action | R — Result / limit |
|---|---|---|---|---|
| Bottleneck | Synthetic 40-op line, target 420, baseline 61s | Rebalance trong precedence/skill/machine constraints | Validate routing/SAM, solve lexicographic MILP, compare baseline | 58s; capacity 395.7 at 85%; target remains unmet |
| Manpower | Hypothetical: qualified inspector absent | Giữ quality gate và cập nhật recovery plan | Check skill matrix, cross-trained cover, HR/site policy, recalc capacity | No fabricated numeric result; protect qualification and escalate realistic forecast |
| New style | Hypothetical: new garment style enters line | Readiness trước release | Approved routing/SAM, machine/skill/material, quality/EHS gates, pilot | Release only after sign-off; no claim of launch achieved |
| Quality | Synthetic OP060: 45/1,820 defects | Reduce collar defects without blame or false causality | Pareto, 4M, setup audit, guide/checklist/first-piece pilot | 18/1,820 after; synthetic evidence, not production causality |
| Line move | Hypothetical style/line transfer | Cut over safely and protect delivery | Readiness checklist, staged move, EHS/Maintenance/Quality/Planning sign-off, rollback | Go/no-go evidence; no move pilot claimed in portfolio |

### Case 1 — Bottleneck / line not meeting target

**Loại:** portfolio simulation T08; synthetic input; không phải line thật.

> In my synthetic portfolio case, a 40-operation garment line had a 420-piece target. The first-fit baseline used 24 stations and 24 workers, with a 61-second bottleneck and modeled capacity of 376.2 pieces per shift at 85% planned efficiency. My task in the project was to improve the balance without violating precedence, skill, or machine constraints. I validated the routing and SAM basis, used a two-stage MILP to minimize workers and then the bottleneck, and compared the result with the separate baseline. The solver proved a solution using 23 of 24 available workers and 23 stations, with a 58-second bottleneck. Line balance efficiency moved from 72.34% to 79.39%, and modeled capacity rose to 395.7 pieces per shift. However, that is only 94.21% of the 420 target. I would not report the target as achieved. The next decision would be an evidence-based capacity review with Production and Planning, not asking operators to work faster.

**Điểm phải nhớ:** capacity là bottleneck-constrained planning capacity, không phải actual output; target **chưa đạt**.

### Case 2 — Manpower shortage at a critical operation

**Loại:** hypothetical response; không phải case đã xảy ra.

> If a qualified operator were absent from a critical inspection operation, I would first confirm attendance and the operation’s qualification requirement. I would not move an unqualified person into the role just to protect the hourly number. I would check the skill matrix for an approved cross-trained backup, then coordinate with the Supervisor and HR on availability and labor policy. IE would help review the workload and expected capacity; Quality would confirm that the inspection gate remains effective. If no qualified backup were available, I would contain the risk, inform the Production Manager and Planning of the realistic output projection, and ask for an approved recovery or replan. I would track hourly output, WIP, and quality after any redeployment. The result I want is a safe, qualified line and an honest plan. I would not claim a target was met until actual production confirms it.

**Điểm phải nhớ:** skill matrix là eligibility; không suy năng lực chỉ từ job title và không bỏ quality gate.

### Case 3 — New style readiness

**Loại:** hypothetical response; không phải một launch đã thực hiện.

> For a new style, I would start with an approved routing and SAM basis, then confirm operation sequence, machine and attachment requirements, skill coverage, quality gates, and material readiness. I would compare total work content and station loads with the demand takt and the planned cycle allowance, keeping those two measures distinct. I would walk the proposed material flow with Production, Planning, Warehouse, Quality, Maintenance, and EHS to identify shortages, setup risks, and unsafe reaches before the trial. During the pilot, I would check first-piece approval, hourly plan versus actual, WIP at each defined buffer, defects, and downtime. Any change to method or SAM would go through the required time study and approval; the optimizer would not update SAM automatically. I would release the style only when the required owners sign off and the control plan has clear reactions. If readiness is incomplete, I would escalate the risk rather than promise a launch date without evidence.

**Điểm phải nhớ:** SAM/method approval, machine-skill fit, first-piece, material and EHS readiness phải là release gates.

### Case 4 — Quality problem / rising defects

**Loại:** T07 portfolio case; synthetic data; không phải quality result của HBI.

> In my synthetic quality case for collar attachment, the baseline was 45 defects in 1,820 inspected pieces, or 2.47%. The Pareto showed 18 collar-misalignment defects. I structured the analysis with a 4M fishbone and checked five changeovers: the guide was present in one of five, and first-piece checks were recorded in two of five. The proposed countermeasures were to restore and standardize the guide, add a changeover check, train operators, and require Quality approval of the first piece. In the synthetic five-day pilot, defects were 18 out of 1,820, or 0.99%, and collar misalignment fell from 18 to five. I would describe this as synthetic pilot evidence, not proof of causation or long-term process capability. In a real line, I would verify the defect definition and inspection system, contain suspect product, monitor the control plan, and ask Quality to confirm disposition.

**Điểm phải nhớ:** containment trước, root cause bằng evidence, không đổ lỗi operator; không claim statistical or causal proof từ data synthetic.

### Case 5 — Moving a line / transferring a style

**Loại:** hypothetical response; chưa có move pilot trong portfolio.

> Before moving a line or transferring a style, I would define the scope, cutover window, customer priority, and rollback criteria with Production and Planning. I would verify the approved routing, SAM revision, machine and attachment list, qualified headcount, material lots, quality checkpoints, and required utilities at the destination. I would walk the new material and people flow with Warehouse, Maintenance, Quality, and EHS, checking guarding, aisle clearance, ergonomics, and FIFO/WIP locations before equipment is moved. Maintenance would perform machine work under the site’s safety procedure; Quality would approve the first piece and any required validation; Planning would confirm the revised schedule. I would use a readiness checklist with one owner and due time per open item, then run a controlled trial and monitor hourly output, defects, downtime, and WIP. If a critical machine, material, safety, or quality gate failed, I would pause the cutover and use the agreed rollback or replan. I would not treat a layout drawing as proof that the new line is ready.

**Điểm phải nhớ:** move là cross-functional cutover, không chỉ là di chuyển máy; dùng go/no-go criteria và rollback.

---

## 5. Cross-functional answer — hourly Red case

**Loại:** Module 2/9, dữ liệu synthetic ngày 2026-10-27.

> At 12:00 in the synthetic hourly case, cumulative actual was 172 pieces against a plan of 224, a gap of minus 52 pieces or minus 23.21%. The projected end-of-shift output was 322.5 against a 420 target, and WIP at buffer ST05-IN was 38 against a cap of 25. I would validate the counter and timestamp, then coordinate a Red escalation. Production would control feeding at the over-cap buffer; IE would verify the gap and keep a 25-minute MACHINE-category event separate from a 15-minute MATERIAL-category event because their common line-stop basis is not confirmed; Maintenance would review the earlier machine event and confirm the current condition; Planning and Warehouse would confirm material availability and priority; Quality would keep the quality gate; and HR would be notified under the Red rule and consulted on staffing if relevant. If recovery could not restore the target, the Production Manager and Planning would replan under site authority. I would assign an owner and due time to each action and report the next update. I would not promise recovery from a linear projection alone.

---

## 6. Technical follow-up questions

### “Why did the 420-piece scenario not meet target?”

> In the synthetic scenario with 24 workers available, the proven bottleneck was 58.0 seconds, while the effective takt for 420 pieces was 54.64 seconds. The modeled capacity was 395.7 pieces per shift, or 94.21% of target. The result is honest: it is OPTIMAL for the modeled objective, but the target is not met. I would evaluate approved headcount, method/time-study opportunities, and Planning options; I would not label 420 feasible without a model or production result supporting it.

### “Is the 11.7 million VND saving verified?”

> No. It is an estimate based on synthetic assumptions for labor rate, paid hours, working days, and a worker actually being redeployed. The portfolio also contains a synthetic 22-day example, not real payroll evidence. In production, Finance and HR would need to confirm payroll/timekeeping, redeployment, no replacement overtime, and implementation costs. If the worker remains on the line, I would report capacity gain, not cash saving.

### “Does an OEE of 73.04% mean the machine was utilized 73.04%?”

> No. OEE is Availability multiplied by Performance and Quality for an eligible pacer machine. It is not utilization or machine allocation. The 73.04% value is calculated from a synthetic PRESS-01 log and depends on an unverified pacer assumption. If a station is human-paced, I would report OEE as not applicable and use the relevant labor or station measures.

### “What would you do if Quality and Production disagree?”

> I would put the shared facts on the board, contain any suspect product, and clarify the decision boundary. Quality owns disposition under the site QMS; Production owns the production response and schedule request. I would not release held product or remove an inspection gate to recover output. I would document the decision, owner, due time, and escalation route, then update Planning and the next shift.

---

## 7. English IE vocabulary

| English term | Nghĩa / cách dùng đúng |
|---|---|
| Standard Allowed Minute (SAM) / Standard Minute Value (SMV) | Thời gian chuẩn; nêu rõ basis và allowance |
| Demand takt | Nhịp theo nhu cầu khách hàng, chưa trừ planned efficiency |
| Effective takt / planning cycle allowance | Nhịp kế hoạch sau planned efficiency; không gọi lẫn là demand takt |
| Cycle time / station cycle time | Thời gian chu kỳ; station cycle phải xét overlap người-máy |
| Bottleneck | Công đoạn/station giới hạn throughput của line |
| Line balance efficiency (LBE) | Planning metric của phân bố load; không phải actual labor efficiency |
| Actual labor efficiency | KPI thực tế theo output và direct labor time; dùng đúng công thức đã định nghĩa |
| Planned labor utilization | Planning metric; không đổi tên thành actual efficiency |
| Standard headcount | Định biên chuẩn theo assumptions và approved method |
| Work in process (WIP) / buffer cap | Bán thành phẩm trong công đoạn/buffer và giới hạn đã xác định |
| First-pass yield (FPY) | Tỷ lệ đạt ngay lần đầu; không đồng nhất với final yield sau rework |
| OEE: Availability, Performance, Quality | Chỉ tính cho máy đủ dữ liệu và phù hợp pacer assumption |
| Changeover / setup time | Đo từ last good piece đến first good piece theo chuẩn thống nhất |
| Point of use (POU) / FIFO | Điểm cấp vật tư tại nơi dùng / first-in-first-out |
| Cross-functional / handover / escalation | Phối hợp liên phòng ban / bàn giao / báo cấp theo ngưỡng |
| Root cause / countermeasure / control plan | Nguyên nhân gốc / đối sách / kế hoạch duy trì và reaction |
| Safety containment / quality hold | Khoanh vùng rủi ro / giữ hàng chờ quyết định theo QMS |

---

## 8. Portfolio demo — 7 phút

| Thời gian | Nội dung | Bằng chứng |
|---|---|---|
| 0:00–0:45 | Vấn đề line balancing và data policy synthetic | README, synthetic badge |
| 0:45–1:30 | Input: routing, SAM, workers/skills, machine, shift config | UI hoặc sample request |
| 1:30–2:30 | Model: constraints và 2-stage lexicographic solver | `MODEL.md`, run metadata/status |
| 2:30–3:45 | Scenario A: 58s, 23 used/24 available, 395.7 capacity, 420 chưa đạt | Result + baseline comparison |
| 3:45–4:30 | Scenario B / KPI naming: demand takt, effective takt, capacity | Dashboard/sample result |
| 4:30–5:30 | Operational case studies: hourly Red, quality RCA, layout/SMED | Playbook + synthetic CSV/SVG |
| 5:30–6:30 | Validation, tests, CI, honest limitations | CI + `scripts/verify.ps1` |
| 6:30–7:00 | Một điều học được và next step | Cross-functional action/control plan |

Nếu app không chạy trực tiếp, dùng screenshot và sample JSON, rồi nói rõ đây là local portfolio build. **Không nói public demo đã live** cho đến khi URL được triển khai và `/api/health` được nghiệm thu.

---

## 9. Câu hỏi nên hỏi nhà tuyển dụng

1. How is success measured for a Shift Line Engineer in the first 90 days?
2. Which hourly metrics and escalation thresholds does the team use?
3. How are SAM revisions and standard work approved?
4. How do Production, Quality, Maintenance, Planning, and Warehouse coordinate during a shift disruption?
5. What authority does the Shift Engineer have for line stops, reallocation, and recovery plans?
6. How are skill matrices, cross-training, and relief coverage maintained?
7. What are the main safety and ergonomic priorities on the target lines?

---

## 10. Checklist trước phỏng vấn

- [ ] Thay mọi placeholder bằng thông tin đúng; không ghi thành tích mình không làm.
- [ ] Có một ví dụ thật của bản thân; nếu không có, trình bày case như portfolio/hypothetical.
- [ ] Mỗi STAR trả lời trong 90–120 giây, nêu scope, đơn vị, action và result/limitation.
- [ ] Phân biệt demand takt với effective takt; LBE với actual labor efficiency; capacity với actual output.
- [ ] Nói rõ Scenario A target 420 **chưa đạt**; capacity là model estimate.
- [ ] Nói rõ data, OEE, Kaizen saving và layout/SMED pilot đều synthetic.
- [ ] Không claim public URL/live deployment nếu chưa deploy.
- [ ] Tập trả lời quality/safety disagreement mà không bỏ gate hoặc bypass site SOP.
- [ ] Chuẩn bị 2–3 câu hỏi cho interviewer.

> **Quy tắc cuối:** kể chuyện có bằng chứng tốt hơn câu trả lời nghe “đẹp”. Nếu không biết, nêu dữ liệu còn thiếu, người cần tham vấn và cách xác minh.
