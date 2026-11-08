import { useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Button } from './Button';
import { useLanguage } from '@shared/i18n/LanguageProvider';
import { useDialogAccessibility } from '../../hooks/useDialogAccessibility';

export interface DialogProps {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'md' | 'lg' | 'xl';
}
const widths = { md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

export function Dialog({ open, title, description, onClose, children, footer, size = 'md' }: DialogProps) {
  const { t } = useLanguage();
  const dialogRef = useRef<HTMLElement>(null);
  const titleId = useId();
  useDialogAccessibility(open, onClose, dialogRef);
  if (!open) return null;
  return createPortal(<div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-kanbot-overlay-70 p-4 backdrop-blur-sm" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
    <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} className={`my-auto w-full ${widths[size]} overflow-hidden rounded-xl border border-kanbot-line bg-kanbot-panel text-kanbot-ink shadow-2xl`}>
      <header className="flex items-start justify-between gap-4 border-b border-kanbot-line bg-kanbot-raised px-6 py-4"><div><h2 id={titleId} className="text-lg font-semibold text-kanbot-ink">{title}</h2>{description && <p className="mt-1 text-sm text-kanbot-muted">{description}</p>}</div><Button data-dialog-close variant="ghost" size="sm" className="!size-9 !p-0 text-kanbot-ink" aria-label={t("Close dialog")} onClick={onClose} icon={<X size={17}/>} /></header>
      <div className="max-h-[70vh] overflow-y-auto p-6">{children}</div>
      {footer && <footer className="flex justify-end gap-2 border-t border-kanbot-line bg-kanbot-raised px-6 py-4">{footer}</footer>}
    </section>
  </div>, document.body);
}
