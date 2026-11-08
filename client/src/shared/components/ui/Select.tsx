import { forwardRef, type ComponentPropsWithoutRef } from "react";
import { Select as SelectPrimitive } from "@base-ui/react/select";
import { Check, ChevronDown } from "lucide-react";
import { useLanguage } from "@shared/i18n/LanguageProvider";

export const Select = SelectPrimitive.Root;
export const SelectGroup = SelectPrimitive.Group;

export const SelectValue = SelectPrimitive.Value;

export const SelectTrigger = forwardRef<HTMLButtonElement, ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>>(
  function SelectTrigger({ className = "", children, ...props }, ref) {
    return (
      <SelectPrimitive.Trigger ref={ref} className={`group inline-flex min-h-10 w-auto min-w-0 items-center justify-between gap-2 rounded-lg border border-kanbot-line-strong bg-kanbot-panel px-3 text-start text-[13px] text-kanbot-ink outline-none transition-[color,background-color,border-color,box-shadow] duration-300 ease-out hover:border-kanbot-zinc-border-500 focus-visible:border-kanbot-accent focus-visible:ring-2 focus-visible:ring-kanbot-accent/20 disabled:cursor-not-allowed disabled:opacity-50 ${className}`} {...props}>
        {children}
        <SelectPrimitive.Icon className="ms-2 inline-flex shrink-0 text-kanbot-muted transition-transform duration-300 ease-out group-data-[popup-open]:rotate-180 motion-reduce:transition-none"><ChevronDown aria-hidden="true" size={16} /></SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
    );
  },
);

export const SelectContent = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<typeof SelectPrimitive.Popup>>(
  function SelectContent({ className = "", children, ...props }, ref) {
    const { isArabic } = useLanguage();
    return (
      <SelectPrimitive.Portal>
        <SelectPrimitive.Positioner className="z-[100] outline-none" side="bottom" alignItemWithTrigger={false}>
          <SelectPrimitive.Popup ref={ref} dir={isArabic ? "rtl" : "ltr"} className={`max-h-[min(320px,var(--available-height))] min-w-[var(--anchor-width)] overflow-y-auto rounded-lg border border-kanbot-line-strong bg-kanbot-popover p-1.5 text-kanbot-ink shadow-2xl outline-none motion-safe:data-[open]:animate-kanbot-select-enter motion-reduce:animate-none ${className}`} {...props}>
            <SelectPrimitive.List className="grid gap-0.5">{children}</SelectPrimitive.List>
          </SelectPrimitive.Popup>
        </SelectPrimitive.Positioner>
      </SelectPrimitive.Portal>
    );
  },
);

export const SelectItem = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<typeof SelectPrimitive.Item>>(
  function SelectItem({ className = "", children, ...props }, ref) {
    return (
      <SelectPrimitive.Item ref={ref} className={`relative flex min-h-9 cursor-default select-none items-center rounded-md py-1.5 ps-2.5 pe-9 text-start text-[13px] text-kanbot-zinc-200 outline-none data-[highlighted]:bg-kanbot-hover data-[highlighted]:text-kanbot-highlighted data-[disabled]:pointer-events-none data-[disabled]:opacity-40 ${className}`} {...props}>
        <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
        <SelectPrimitive.ItemIndicator className="absolute end-2 inline-flex text-kanbot-accent">
          <Check aria-hidden="true" size={15} />
        </SelectPrimitive.ItemIndicator>
      </SelectPrimitive.Item>
    );
  },
);

export const SelectLabel = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<typeof SelectPrimitive.GroupLabel>>(
  function SelectLabel({ className = "", ...props }, ref) {
    return <SelectPrimitive.GroupLabel ref={ref} className={`px-2.5 py-2 text-[10px] font-semibold uppercase tracking-wider text-kanbot-muted ${className}`} {...props} />;
  },
);

export const SelectSeparator = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>>(
  function SelectSeparator({ className = "", ...props }, ref) {
    return <SelectPrimitive.Separator ref={ref} className={`my-1 h-px bg-kanbot-line ${className}`} {...props} />;
  },
);
