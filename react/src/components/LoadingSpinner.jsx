export function LoadingSpinner({ size = 32, strokeWidth = 10 }) {
  const radius = size / 2 - strokeWidth / 2;
  return <div className="loadingSpinner" style={{ width: size, height: size }}>
    <svg viewBox="0 0 100 100">
      <defs>
        <linearGradient id="strokeGradient">
          <stop offset="0%" stopColor="var(--indigo-400)" />
          <stop offset="100%" stopColor="var(--indigo-800)" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r={radius} stroke="url(#strokeGradient)" strokeWidth={strokeWidth} fill="none" />
    </svg>
  </div>
}