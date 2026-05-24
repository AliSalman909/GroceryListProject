'use client';

import { useState } from 'react';

interface CheckAnimationProps {
  checked: boolean;
  onCheck: () => void;
  disabled?: boolean;
}

export default function CheckAnimation({ checked, onCheck, disabled }: CheckAnimationProps) {
  const [animating, setAnimating] = useState(false);

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (disabled || checked) return;
    setAnimating(true);
    onCheck();
    setTimeout(() => setAnimating(false), 400);
  }

  return (
    <button
      className={`check-btn ${checked ? 'check-btn--checked' : ''} ${animating ? 'check-btn--animating' : ''}`}
      onClick={(e) => handleClick(e)}
      disabled={disabled || checked}
      aria-label={checked ? 'Item checked' : 'Check off item'}
      type="button"
    >
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="check-icon">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        {checked && (
          <path
            d="M7 12l3.5 3.5L17 8"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="check-mark"
          />
        )}
      </svg>
    </button>
  );
}
