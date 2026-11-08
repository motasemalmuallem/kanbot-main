import type { ReactNode } from 'react';
import { FolderOpen } from 'lucide-react';

export function EmptyState({ title, description, icon, action, className = '' }: { title: string; description?: string; icon?: ReactNode; action?: ReactNode; className?: string }) {
  return <section className={`flex min-h-64 flex-col items-center justify-center rounded-panel border border-dashed border-kanbot-line-strong bg-kanbot-panel px-6 py-10 text-center ${className}`}>
    <div className="mb-4 grid size-12 place-items-center rounded-xl bg-kanbot-raised text-kanbot-muted">{icon ?? <FolderOpen size={23}/>}</div>
    <h2 className="text-base font-semibold text-kanbot-ink">{title}</h2>
    {description && <p className="mt-1 max-w-md text-sm text-kanbot-muted">{description}</p>}
    {action && <div className="mt-5">{action}</div>}
  </section>;
}
