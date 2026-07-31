"use client";

interface CircularProgressProps {
  value: number;
  max: number;
  color: string;
  size?: number;
}

export function CircularProgress({ value, max, color, size = 60 }: CircularProgressProps) {
  const percentage = Math.min(Math.round((value / max) * 100), 100);
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center flex-shrink-0" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          className="text-gray-100"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          style={{ strokeDasharray: circumference, strokeDashoffset, transition: "stroke-dashoffset 0.35s" }}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          stroke={color}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <div className="absolute text-[10px] font-bold text-gray-800">{percentage}%</div>
    </div>
  );
}
