'use client';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

const SIZES = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
};

const LABEL_SIZES = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-sm',
};

export default function Spinner({ size = 'md', label }: SpinnerProps) {
  return (
    <div className="flex items-center justify-center gap-2.5">
      <svg
        className={`${SIZES[size]} animate-spin text-indigo-500`}
        viewBox="0 0 24 24"
        fill="none"
      >
        <circle
          className="opacity-20"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="3"
        />
        <path
          className="opacity-75"
          d="M12 2a10 10 0 0 1 10 10"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
      {label && (
        <span className={`${LABEL_SIZES[size]} text-muted`}>{label}</span>
      )}
    </div>
  );
}
