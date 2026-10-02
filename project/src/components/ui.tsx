import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { ChevronRight } from 'lucide-react';

/** Close an overlay on Escape. */
function useEscape(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
}

/** Bottom sheet on phones, centred panel on wider screens. */
export function Sheet({
  open,
  onClose,
  title,
  subtitle,
  children,
  z = 'z-[70]',
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  z?: string;
}) {
  useEscape(open, onClose);
  if (!open) return null;
  return createPortal(
    <div className={`fixed inset-0 ${z}`} role="dialog" aria-modal="true">
      <div className="absolute inset-0 animate-fade-in bg-gray-950/40" onClick={onClose} />
      <div className="absolute inset-x-0 bottom-0 max-h-[92vh] animate-slide-up overflow-y-auto rounded-t-[28px] bg-white pb-safe dark:bg-gray-900 md:inset-x-auto md:bottom-auto md:left-1/2 md:top-1/2 md:w-[460px] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-3xl">
        <div className="mx-auto mt-3 h-1 w-9 rounded-full bg-gray-200 dark:bg-white/15 md:hidden" />
        {(title || subtitle) && (
          <div className="px-6 pt-4">
            {title && <h2 className="text-xl font-semibold tracking-tight text-gray-900 dark:text-white">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-[13px] text-gray-500 dark:text-gray-400">{subtitle}</p>}
          </div>
        )}
        <div className="pb-6">{children}</div>
      </div>
    </div>,
    document.body
  );
}

/** Small centred confirmation dialog. */
export function Dialog({
  open,
  onClose,
  icon,
  title,
  children,
  actions,
  z = 'z-[80]',
}: {
  open: boolean;
  onClose: () => void;
  icon?: ReactNode;
  title: ReactNode;
  children?: ReactNode;
  actions: ReactNode;
  z?: string;
}) {
  useEscape(open, onClose);
  if (!open) return null;
  return createPortal(
    <div className={`fixed inset-0 ${z} flex items-center justify-center p-6`} role="alertdialog" aria-modal="true">
      <div className="absolute inset-0 animate-fade-in bg-gray-950/40" onClick={onClose} />
      <div className="relative w-full max-w-sm animate-slide-up rounded-3xl bg-white p-6 shadow-2xl dark:bg-gray-900">
        {icon}
        <h2 className={`${icon ? 'mt-4' : ''} text-[21px] font-semibold tracking-tight text-gray-900 dark:text-white`}>{title}</h2>
        {children && <div className="mt-1.5 text-[14px] leading-relaxed text-gray-500 dark:text-gray-400">{children}</div>}
        <div className="mt-6">{actions}</div>
      </div>
    </div>,
    document.body
  );
}

/** Full-screen page that slides over the app (editors, detail views). */
export function FullScreen({
  open,
  onClose,
  children,
  header,
  tone = 'plain',
  z = 'z-[60]',
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  header?: ReactNode;
  /** 'grouped' uses the light gray background behind grouped lists. */
  tone?: 'plain' | 'grouped';
  z?: string;
}) {
  useEscape(open, onClose);
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);
  if (!open) return null;
  return createPortal(
    <div
      className={`fixed inset-0 ${z} animate-fade-in overflow-y-auto ${
        tone === 'grouped' ? 'bg-gray-100 dark:bg-gray-950' : 'bg-white dark:bg-gray-950'
      }`}
    >
      <div className="mx-auto max-w-2xl pb-safe">
        {header && (
          <div
            className={`sticky top-0 z-10 pt-safe ${
              tone === 'grouped' ? 'bg-gray-100/95 dark:bg-gray-950/95' : 'bg-white/95 dark:bg-gray-950/95'
            } backdrop-blur`}
          >
            {header}
          </div>
        )}
        <div className="pb-10">{children}</div>
      </div>
    </div>,
    document.body
  );
}

/** Cancel · Title · Save bar used at the top of editors. */
export function EditorBar({
  title,
  onCancel,
  cancelLabel,
  onSave,
  saveLabel,
  saveDisabled,
}: {
  title: ReactNode;
  onCancel: () => void;
  cancelLabel: string;
  onSave?: () => void;
  saveLabel?: string;
  saveDisabled?: boolean;
}) {
  return (
    <div className="flex h-14 items-center justify-between px-4">
      <button onClick={onCancel} className="min-w-[64px] text-left text-[15px] font-medium text-indigo-600 dark:text-indigo-400">
        {cancelLabel}
      </button>
      <h1 className="truncate px-2 text-[16px] font-semibold text-gray-900 dark:text-white">{title}</h1>
      {onSave ? (
        <button
          onClick={onSave}
          disabled={saveDisabled}
          className="min-w-[64px] text-right text-[15px] font-semibold text-indigo-600 disabled:text-gray-300 dark:text-indigo-400 dark:disabled:text-gray-600"
        >
          {saveLabel}
        </button>
      ) : (
        <span className="min-w-[64px]" />
      )}
    </div>
  );
}

/** Large page title with a small-caps eyebrow and optional actions. */
export function PageTitle({ eyebrow, title, actions }: { eyebrow?: ReactNode; title: ReactNode; actions?: ReactNode }) {
  return (
    <div>
      <div className="flex h-8 items-center justify-between">
        {eyebrow ? <p className="cap">{eyebrow}</p> : <span />}
        {actions && <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">{actions}</div>}
      </div>
      <h1 className="mt-1 text-[34px] font-semibold leading-tight tracking-[-.02em] text-gray-900 dark:text-white">{title}</h1>
    </div>
  );
}

/** Round icon button for page-title actions. */
export function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/[0.06] dark:hover:text-white"
    >
      {children}
    </button>
  );
}

/** Underlined tab strip. */
export function Tabs<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="flex gap-6 border-b hairline" role="tablist">
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={`-mb-px border-b-2 pb-2 text-[14px] font-medium transition-colors ${
            value === o.value
              ? 'border-gray-900 text-gray-900 dark:border-white dark:text-white'
              : 'border-transparent text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-300'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Settings-style group: small caps label, rounded list, optional footnote. */
export function Group({ label, footnote, children }: { label?: ReactNode; footnote?: ReactNode; children: ReactNode }) {
  return (
    <section className="mt-6">
      {label && <p className="cap mb-2 px-2">{label}</p>}
      <div className="group-list">{children}</div>
      {footnote && <p className="mt-1.5 px-2 text-[12px] leading-snug text-gray-400 dark:text-gray-500">{footnote}</p>}
    </section>
  );
}

/** One row inside a Group. Clickable when `onClick` is set. */
export function Row({
  label,
  description,
  value,
  right,
  onClick,
  danger,
  htmlFor,
}: {
  label: ReactNode;
  description?: ReactNode;
  value?: ReactNode;
  right?: ReactNode;
  onClick?: () => void;
  danger?: boolean;
  htmlFor?: string;
}) {
  const content = (
    <>
      <span className="min-w-0 flex-1">
        <span className={`block text-[15px] ${danger ? 'font-medium text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>{label}</span>
        {description && <span className="mt-0.5 block text-[12px] text-gray-500 dark:text-gray-400">{description}</span>}
      </span>
      {(value !== undefined || right || onClick) && (
        <span className="flex min-w-0 flex-shrink-0 items-center gap-1.5 text-right text-[14px] text-gray-500 dark:text-gray-400">
          {value !== undefined && <span className="truncate">{value}</span>}
          {right}
          {onClick && !right && <ChevronRight className="h-4 w-4 flex-shrink-0 text-gray-300 dark:text-gray-600" />}
        </span>
      )}
    </>
  );
  const cls = 'flex w-full items-center justify-between gap-3 px-4 py-3 text-left';
  if (htmlFor) {
    return (
      <label htmlFor={htmlFor} className={`${cls} cursor-pointer`}>
        {content}
      </label>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`${cls} transition-colors hover:bg-gray-100 dark:hover:bg-white/[0.04]`}>
        {content}
      </button>
    );
  }
  return <div className={cls}>{content}</div>;
}

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (checked: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-[26px] w-[44px] flex-shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 ${
        checked ? 'bg-indigo-600 dark:bg-indigo-500' : 'bg-gray-300 dark:bg-white/15'
      }`}
    >
      <span
        className={`absolute h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-[21px]' : 'translate-x-[3px]'}`}
      />
    </button>
  );
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex overflow-hidden rounded-lg border hairline text-[13px] font-medium">
      {options.map((o, i) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`px-3 py-1 transition-colors ${i ? 'border-l hairline' : ''} ${
            value === o.value
              ? 'bg-indigo-600 text-white dark:bg-indigo-500'
              : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/[0.06]'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Radio-style option row used in pickers. */
export function OptionRow({
  selected,
  onSelect,
  label,
  description,
  leading,
  trailing,
}: {
  selected: boolean;
  onSelect: () => void;
  label: ReactNode;
  description?: ReactNode;
  leading?: ReactNode;
  trailing?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 px-6 py-3.5">
      <button type="button" role="radio" aria-checked={selected} onClick={onSelect} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        {leading}
        <span className="min-w-0 flex-1">
          <span className="block text-[16px] text-gray-900 dark:text-white">{label}</span>
          {description && <span className="block text-[12px] text-gray-500 dark:text-gray-400">{description}</span>}
        </span>
      </button>
      {trailing}
      <button
        type="button"
        onClick={onSelect}
        aria-hidden="true"
        tabIndex={-1}
        className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full ${
          selected ? 'bg-indigo-600 text-white dark:bg-indigo-500' : 'border-[1.5px] border-gray-300 dark:border-white/20'
        }`}
      >
        {selected && (
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        )}
      </button>
    </div>
  );
}
