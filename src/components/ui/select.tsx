"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type SelectProps = {
  id?: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  options: SelectOption[];
  className?: string;
  contentClassName?: string;
  onValueChange?: (value: string) => void;
  ariaLabel?: string;
};

export function Select({
  id,
  name,
  value,
  defaultValue,
  placeholder,
  options,
  className,
  contentClassName,
  onValueChange,
  ariaLabel,
}: SelectProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue ?? "");
  const currentValue = value ?? internalValue;

  function handleValueChange(nextValue: string) {
    if (value === undefined) {
      setInternalValue(nextValue);
    }

    onValueChange?.(nextValue);
  }

  return (
    <>
      {name ? <input type="hidden" name={name} value={currentValue} /> : null}

      <SelectPrimitive.Root value={currentValue || undefined} onValueChange={handleValueChange}>
        <SelectPrimitive.Trigger
          id={id}
          aria-label={ariaLabel}
          className={cn(
            "flex h-11 w-full items-center justify-between rounded-2xl border border-border bg-input px-4 text-sm text-foreground outline-none transition-colors data-[placeholder]:text-muted-foreground/80 focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
            className,
          )}
        >
          <SelectPrimitive.Value placeholder={placeholder} />
          <SelectPrimitive.Icon asChild>
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>

        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            position="popper"
            sideOffset={8}
            className={cn(
              "theme-floating-shadow z-50 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-2xl border border-border bg-popover text-popover-foreground",
              contentClassName,
            )}
          >
            <SelectPrimitive.Viewport className="p-2">
              {options.map((option) => (
                <SelectPrimitive.Item
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                  className="relative flex w-full cursor-pointer select-none items-center rounded-xl px-4 py-3 pr-10 text-sm text-foreground outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[highlighted]:bg-[var(--surface-soft)] data-[state=checked]:text-primary"
                >
                  <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                  <SelectPrimitive.ItemIndicator className="absolute right-4 inline-flex items-center justify-center text-primary">
                    <Check className="h-4 w-4" />
                  </SelectPrimitive.ItemIndicator>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
    </>
  );
}