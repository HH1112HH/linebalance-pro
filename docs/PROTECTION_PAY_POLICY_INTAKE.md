# Protection Pay — HR Policy Intake (No Calculator Yet)

> **Status:** blocked pending an official HR/Finance policy.  
> **Purpose:** collect the authoritative inputs needed before designing a calculator.  
> **Important:** this document contains **no protection-pay formula**, rates, eligibility rules, or sample payout. Do not infer these from synthetic portfolio data.

---

## 1. Required source and owners

| Field | HR / Finance response |
|---|---|
| Official policy title and document ID | Pending |
| Policy version and approval date | Pending |
| Effective-from / effective-to dates | Pending |
| HR policy owner and approver | Pending |
| Finance/payroll reviewer and approver | Pending |
| Applicable site, worker groups, and employment types | Pending |
| Authoritative source location (not a secret or personal-data file) | Pending |

Only an approved policy or written decision from the authorized HR/Finance owners can unblock implementation. Job descriptions, informal examples, public web content, and synthetic case studies are not policy sources.

## 2. Questions that must be answered by policy owners

### 2.1 Eligibility and scope

- Which workers, roles, lines, shifts, and employment types are in scope?
- What exact conditions make a worker eligible or ineligible?
- How are cross-trained workers, temporary transfers, relief workers, and new hires treated?
- Who makes and records the eligibility decision?

### 2.2 Calculation contract

**Formula: pending official HR/Finance definition. Do not fill with a guessed expression.**

- What is the authoritative calculation base and its unit?
- Which inputs are required, and which system owns each input?
- Are there thresholds, floors, caps, tiers, multipliers, or exceptions?
- How are partial shifts, attendance, leave, overtime, training, and line transfers handled?
- What are the effective-date and retroactive-adjustment rules?
- What currency, precision, rounding, tax, and payroll-period rules apply?

### 2.3 Governance and audit

- Which roles may enter, review, approve, correct, and export the result?
- What evidence and approval trail must be retained?
- What is the correction, appeal, and recalculation process?
- What retention and access-control requirements apply to payroll/personnel data?
- Which fields are personal or confidential and must never appear in public demo data, logs, or source control?

## 3. Acceptance evidence required before implementation

1. Approved policy version and effective dates are recorded.
2. HR and Finance sign off on the exact formula, eligibility rules, units, rounding, and exceptions.
3. HR/Finance provide **synthetic test vectors** with expected outcomes, including boundary and exception cases.
4. A data owner confirms each source field and its access/privacy classification.
5. Security, role-based access, audit, retention, and payroll approval workflow are designed before any real data is processed.
6. Tests cover every approved rule and do not use real employee or payroll information.

## 4. Current portfolio statement

- No protection-pay API, UI, formula, rate, eligibility rule, or calculated result is implemented.
- The current app is a synthetic local demo without authentication or a database; it is not suitable for payroll decisions.
- Until the evidence above is supplied and approved, the correct product state is **“Policy pending — calculation unavailable.”**
