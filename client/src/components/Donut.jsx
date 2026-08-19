// Biểu đồ donut bằng SVG thuần (không cần thư viện)
const R = 54;
const C = 2 * Math.PI * R;

export default function Donut({ segments, total, centerTop = 'Tổng', centerValue }) {
  const sum = segments.reduce((s, x) => s + x.value, 0) || 1;
  let offset = 0;
  return (
    <div className="donut">
      <svg viewBox="0 0 120 120" width="190" height="190">
        <circle cx="60" cy="60" r={R} fill="none" stroke="#f1f0f7" strokeWidth="12" />
        {segments.map((seg, i) => {
          const len = (seg.value / sum) * C;
          const el = (
            <circle
              key={i}
              cx="60"
              cy="60"
              r={R}
              fill="none"
              stroke={seg.color}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={`${Math.max(len - 2, 0)} ${C - Math.max(len - 2, 0)}`}
              strokeDashoffset={-offset}
              transform="rotate(-90 60 60)"
            />
          );
          offset += len;
          return el;
        })}
      </svg>
      <div className="center">
        <div>
          <div className="t">{centerTop}</div>
          <div className="v">{centerValue ?? total}</div>
        </div>
      </div>
    </div>
  );
}
