import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
}

export function Card({ children, className = '', hover = false, glow = false }: CardProps) {
  const hoverClass = hover ? 'hover-lift' : '';
  const glowClass = glow ? 'shadow-[0_0_20px_rgba(99,102,241,0.3)]' : '';
  
  return (
    <div className={`bg-card border border-border rounded-xl p-6 card-shadow ${hoverClass} ${glowClass} ${className}`}>
      {children}
    </div>
  );
}