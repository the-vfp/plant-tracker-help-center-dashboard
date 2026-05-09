import type { ReactNode } from 'react';

interface Props {
  variant?: 'default' | 'warn';
  label?: string;
  children: ReactNode;
}

export function Insight({
  variant = 'default',
  label = 'What this means for the KB',
  children,
}: Props) {
  return (
    <aside className={`insight${variant === 'warn' ? ' insight--warn' : ''}`}>
      <p className="insight__label">{label}</p>
      {children}
    </aside>
  );
}
