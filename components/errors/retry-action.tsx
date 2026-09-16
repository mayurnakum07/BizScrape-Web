"use client";

import { Button } from "@/components/ui/button";

type RetryActionProps = {
  onRetry: () => void | Promise<void>;
  label?: string;
  loading?: boolean;
  disabled?: boolean;
};

export function RetryAction({
  onRetry,
  label = "Retry job",
  loading,
  disabled,
}: RetryActionProps) {
  return (
    <Button
      type="button"
      onClick={() => {
        void onRetry();
      }}
      loading={loading}
      disabled={disabled}
    >
      {label}
    </Button>
  );
}
