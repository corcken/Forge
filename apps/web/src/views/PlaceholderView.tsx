import { Cpu } from 'lucide-react';

export interface PlaceholderViewProps {
  title: string;
  description: string;
}

/** Platzhalter-Ansicht fuer Bereiche, die in Meilenstein 6 ausgebaut werden. */
export function PlaceholderView({ title, description }: PlaceholderViewProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
      <Cpu className="h-6 w-6 text-slate-400" />
      <div className="text-[13px] font-semibold text-slate-500 dark:text-slate-300">{title}</div>
      <div className="max-w-[460px] text-[12px] text-slate-400">{description}</div>
    </div>
  );
}
