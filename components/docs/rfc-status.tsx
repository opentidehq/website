import { rfcStatusClass, rfcStatusLabel } from '@/lib/rfc';
import { cn } from '@/lib/utils';

export function RfcStatus({ status, compact = false }: { status: string; compact?: boolean }) {
  return (
    <span
      data-rfc-status={status}
      className={cn(
        'inline-flex shrink-0 items-center rounded-md font-medium whitespace-nowrap',
        compact ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-0.5 text-sm',
        rfcStatusClass(status),
      )}
    >
      {rfcStatusLabel(status)}
    </span>
  );
}
