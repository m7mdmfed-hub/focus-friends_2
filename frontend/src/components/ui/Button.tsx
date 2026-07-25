import { cn } from '@/lib/utils';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

export function Button({ variant = 'primary', size = 'md', className, children, ...rest }: Props) {
  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    ghost: 'btn-ghost',
    danger: 'btn bg-rose-500 text-white hover:bg-rose-600',
  } as const;
  const sizes = { sm: 'text-xs px-3 py-1.5', md: '', lg: 'text-base px-5 py-3' } as const;
  return (
    <button className={cn(variants[variant], sizes[size], className)} {...rest}>
      {children}
    </button>
  );
}
