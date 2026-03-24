// src/components/ScoreRing.tsx — SVG circular progress arc with solid color threshold

interface ScoreRingProps {
  score: number;       // integer 0–100
  target?: number;     // integer 0–100, default 95
  size?: number;       // px, default 96
  strokeWidth?: number; // default 6
}

function scoreColor(score: number): string {
  if (score < 60) return '#dc2626';
  if (score < 85) return '#d97706';
  return '#16a34a';
}

export default function ScoreRing({
  score,
  target = 95,
  size = 96,
  strokeWidth = 6,
}: ScoreRingProps) {
  const clampedScore = Math.min(100, Math.max(0, score));
  const r = size / 2 - strokeWidth / 2 - 1;
  const circumference = 2 * Math.PI * r;
  const dashoffset = circumference * (1 - clampedScore / 100);
  const cx = size / 2;
  const cy = size / 2;
  const color = scoreColor(clampedScore);

  // Tick mark at target angle (from top = -90deg)
  const targetAngle = (target / 100) * 2 * Math.PI - Math.PI / 2;
  const tickOuter = r + strokeWidth / 2;
  const tickInner = r - strokeWidth / 2;
  const tickX1 = cx + tickOuter * Math.cos(targetAngle);
  const tickY1 = cy + tickOuter * Math.sin(targetAngle);
  const tickX2 = cx + tickInner * Math.cos(targetAngle);
  const tickY2 = cy + tickInner * Math.sin(targetAngle);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-label={`Score: ${Math.round(clampedScore)}%`}
      role="img"
    >
      {/* Track */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="var(--border)"
        strokeWidth={strokeWidth}
      />

      {/* Arc */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={dashoffset}
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
      />

      {/* Target tick mark */}
      <line
        x1={tickX1}
        y1={tickY1}
        x2={tickX2}
        y2={tickY2}
        stroke="var(--text-secondary)"
        strokeWidth={2}
        strokeLinecap="round"
      />

      {/* Score text */}
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="central"
        fill="var(--text)"
        fontSize={size * 0.2}
        fontFamily="var(--font-mono), monospace"
        fontWeight={500}
      >
        {Math.round(clampedScore)}%
      </text>
    </svg>
  );
}
