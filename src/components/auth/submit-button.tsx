"use client";

import { useFormStatus } from "react-dom";
import { Button, type ButtonProps } from "@/components/ui/button";

type SubmitButtonProps = ButtonProps & {
  pendingLabel?: string;
};

export function SubmitButton({
  children,
  pendingLabel = "Working...",
  ...props
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button {...props} type="submit" disabled={pending || props.disabled}>
      {pending ? pendingLabel : children}
    </Button>
  );
}
