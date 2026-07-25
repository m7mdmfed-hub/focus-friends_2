import { cn } from '@/lib/utils';

interface Props {
  name: string;
  src?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZES = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-16 w-16 text-lg' };

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function Avatar({ name, src, size = 'md', className }: Props) {
  if (src) {
    return <img src={src} alt={name} className={cn('rounded-full object-cover', SIZES[size], className)} />;
  }
  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-700',
        SIZES[size],
        className,
      )}
    >
      {initials(name)}
    </div>
  );
}
