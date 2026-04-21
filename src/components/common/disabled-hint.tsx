import type { ReactNode } from "react";

interface DisabledHintProps {
  disabled: boolean;
  message: string;
  children: ReactNode;
}

export function DisabledHint({ disabled, message, children }: DisabledHintProps) {
  if (!disabled) {
    return <>{children}</>;
  }

  return (
    <span className="disabled-hint-anchor">
      <span className="disabled-hint-trigger">{children}</span>
      <span aria-hidden="true" className="disabled-hint-bubble">
        {message}
      </span>
    </span>
  );
}
