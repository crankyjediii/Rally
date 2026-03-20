'use client';

import { useState } from 'react';

interface ManageBillingCTAProps {
  className?: string;
  label?:     string;
}

export function ManageBillingCTA({
  className = '',
  label     = 'Manage billing',
}: ManageBillingCTAProps) {
  const [isLoading, setIsLoading] = useState(false);

  async function handleClick() {
    setIsLoading(true);
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' });
      if (!res.ok) {
        const { error } = await res.json();
        console.error('Billing portal error:', error);
        return;
      }
      const { url } = await res.json();
      window.location.href = url;
    } catch (err) {
      console.error('Failed to open billing portal:', err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={`btn-secondary text-xs sm:text-sm py-2 px-4 ${className}`}
    >
      {isLoading ? (
        <span className="flex items-center gap-1.5">
          <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          Opening…
        </span>
      ) : label}
    </button>
  );
}
