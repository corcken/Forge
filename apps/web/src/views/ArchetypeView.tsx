import { useState } from 'react';
import { ArchetypeEditor } from './archetypes/ArchetypeEditor';
import { ArchetypeList } from './archetypes/ArchetypeList';
import { SeriesEditor } from './archetypes/SeriesEditor';

/** Split-View: IEC-Archetypen (links) + Editor & Baureihen (rechts). */
export function ArchetypeView() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-[32px] min-h-[32px] items-center border-b border-slate-200 bg-slate-50 px-2 font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
        IEC-Archetypen & Baureihen-Studio
      </div>
      <div className="flex min-h-0 flex-1">
        <div className="w-[340px] min-w-[340px]">
          <ArchetypeList selectedId={selectedId} onSelect={setSelectedId} />
        </div>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-hidden">
            <ArchetypeEditor id={selectedId} />
          </div>
          <div className="min-h-0 flex-1 overflow-hidden">
            <SeriesEditor />
          </div>
        </div>
      </div>
    </div>
  );
}
