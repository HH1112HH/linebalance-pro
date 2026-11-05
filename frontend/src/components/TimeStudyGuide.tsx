export default function TimeStudyGuide() {
  return (
    <section className="panel method-panel" aria-labelledby="method-title">
      <div className="panel-head">
        <div>
          <span className="eyebrow">Method guardrail</span>
          <h2 id="method-title">How standard time is built</h2>
        </div>
        <span className="panel-chip chip-muted">Draft workflow</span>
      </div>

      <ol className="method-steps">
        <li>
          <span className="method-num">01</span>
          <div>
            <h3>Observe the element</h3>
            <p>
              Use human and walking time only. Split out machine automatic time before
              applying a performance rating.
            </p>
            <code>observed time</code>
          </div>
        </li>
        <li>
          <span className="method-num">02</span>
          <div>
            <h3>Normalize the pace</h3>
            <p>
              A rating of 1.00 means the observed pace equals the standard pace. Apply
              the rating to manual work only.
            </p>
            <code>normal = observed × rating</code>
          </div>
        </li>
        <li>
          <span className="method-num">03</span>
          <div>
            <h3>Add the allowance</h3>
            <p>
              Allowance covers personal, fatigue and delay time. Apply it once and keep
              the allowance basis consistent with the line SAM basis.
            </p>
            <code>standard = normal × (1 + allowance)</code>
          </div>
        </li>
        <li>
          <span className="method-num">04</span>
          <div>
            <h3>Approve before use</h3>
            <p>
              This screen writes a draft record only. Approved SAM is the authoritative
              number; the optimizer never updates it automatically.
            </p>
            <code>approved SAM → planning input</code>
          </div>
        </li>
      </ol>

      <div className="method-warning">
        <strong>Do not rate machine automatic time.</strong>
        <span>
          Mixed elements must be split first, otherwise the performance rating inflates
          machine time and distorts the SAM.
        </span>
      </div>
    </section>
  );
}
